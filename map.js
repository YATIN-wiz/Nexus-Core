/**
 * NEXUS CORE — GIS Command & Control Map Engine
 * SIH 2026: AI-Based Detection & Classification of Industrial Fires & Persistent Thermal Sources
 * 
 * Module: map.js
 * Architecture: Leaflet.js with CartoDB Dark Matter / ESRI Satellite, FRP-scaled markers,
 *               animated pulse rings, and industrial buffer zones.
 */

class GISMapEngine {
  constructor(elementId) {
    this.elementId = elementId;
    this.map = null;
    this.markersGroup = null;
    this.pulseRingsGroup = null;
    this.bufferZonesGroup = null;
    this.baseLayers = {};
    this.activeBaseLayer = "dark";
    this.showBuffers = true;
    this.showPulses = true;
    this.markerMap = new Map(); // id -> L.circleMarker
  }

  init() {
    // Initial center on India overview with default view over Jamnagar / Jharia span
    this.map = L.map(this.elementId, {
      center: [22.8, 77.0],
      zoom: 5,
      minZoom: 3,
      maxZoom: 18,
      zoomControl: true,
      attributionControl: false
    });

    // Dark Matter tile layer
    this.baseLayers.dark = L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      {
        subdomains: "abcd",
        maxZoom: 19
      }
    );

    // High-resolution ESRI World Imagery (Satellite)
    this.baseLayers.satellite = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        maxZoom: 18
      }
    );

    // Add default Dark layer
    this.baseLayers.dark.addTo(this.map);

    // Layer groups
    this.bufferZonesGroup = L.layerGroup().addTo(this.map);
    this.pulseRingsGroup = L.layerGroup().addTo(this.map);
    this.markersGroup = L.layerGroup().addTo(this.map);

    // Invalidate size on resize
    window.addEventListener("resize", () => {
      this.map.invalidateSize();
    });

    // Subscribe to store updates
    window.NexusApp.subscribe((event, payload) => {
      if (event === "records_updated" || event === "reset_to_seed") {
        this.renderHotspots(window.NexusApp.getFilteredRecords());
      } else if (event === "active_record_changed") {
        this.highlightActiveMarker(payload ? payload.id : null);
      }
    });

    console.log("[GIS] Map initialized successfully.");
  }

  setBaseLayer(mode) {
    if (mode === this.activeBaseLayer) return;
    if (mode === "satellite") {
      this.map.removeLayer(this.baseLayers.dark);
      this.baseLayers.satellite.addTo(this.map);
      this.activeBaseLayer = "satellite";
    } else {
      this.map.removeLayer(this.baseLayers.satellite);
      this.baseLayers.dark.addTo(this.map);
      this.activeBaseLayer = "dark";
    }
  }

  toggleBufferZones(enable) {
    this.showBuffers = enable;
    if (enable) {
      if (!this.map.hasLayer(this.bufferZonesGroup)) {
        this.map.addLayer(this.bufferZonesGroup);
      }
    } else {
      if (this.map.hasLayer(this.bufferZonesGroup)) {
        this.map.removeLayer(this.bufferZonesGroup);
      }
    }
  }

  togglePulseRings(enable) {
    this.showPulses = enable;
    if (enable) {
      if (!this.map.hasLayer(this.pulseRingsGroup)) {
        this.map.addLayer(this.pulseRingsGroup);
      }
    } else {
      if (this.map.hasLayer(this.pulseRingsGroup)) {
        this.map.removeLayer(this.pulseRingsGroup);
      }
    }
  }

  flyToRegion(regionKey) {
    switch (regionKey) {
      case "jamnagar":
        this.map.flyTo([22.38, 69.95], 11, { duration: 1.2 });
        break;
      case "jharia":
        this.map.flyTo([23.75, 86.32], 11, { duration: 1.2 });
        break;
      case "all":
      default:
        this.fitBoundsAll();
        break;
    }
  }

  fitBoundsAll() {
    const records = window.NexusApp.getFilteredRecords();
    if (!records || records.length === 0) {
      this.map.flyTo([22.8, 77.0], 5);
      return;
    }

    const latLngs = records.map(r => [r.latitude, r.longitude]);
    const bounds = L.latLngBounds(latLngs);
    this.map.fitBounds(bounds, { padding: [60, 60], maxZoom: 12 });
  }

  getColorForClass(classification) {
    switch (classification) {
      case "industrial_fire": return "#ef4444"; // Red
      case "gas_flare": return "#f59e0b";       // Amber / Orange
      case "mining": return "#a855f7";          // Violet
      case "agri_burn": return "#10b981";       // Emerald green
      case "wildfire": return "#f97316";        // Deep orange
      default: return "#64748b";                // Slate
    }
  }

  renderHotspots(records) {
    this.markersGroup.clearLayers();
    this.pulseRingsGroup.clearLayers();
    this.bufferZonesGroup.clearLayers();
    this.markerMap.clear();

    if (!records || records.length === 0) return;

    records.forEach(record => {
      const color = this.getColorForClass(record.classification);
      // Scale radius by FRP
      const radius = Math.max(7, Math.min(22, 6 + Math.sqrt(record.frp) * 4));

      // 1. Hotspot Circle Marker
      const marker = L.circleMarker([record.latitude, record.longitude], {
        radius: radius,
        fillColor: color,
        color: "#ffffff",
        weight: 1.8,
        opacity: 0.95,
        fillOpacity: 0.75,
        className: `hotspot-marker marker-${record.classification}`
      });

      // Bind interactive tooltip
      marker.bindTooltip(`
        <div class="popup-inner">
          <div class="popup-title">${record.locationLabel}</div>
          <div class="popup-row"><span>Classification:</span> <strong style="color: ${color}; text-transform: uppercase;">${record.classification.replace('_', ' ')}</strong></div>
          <div class="popup-row"><span>FRP:</span> <strong>${record.frp.toFixed(2)} MW</strong></div>
          <div class="popup-row"><span>Recurrence:</span> <strong>${record.recurrenceCount} passes</strong></div>
          <div class="popup-row"><span>Confidence:</span> <strong>${Math.round(record.confidence * 100)}%</strong></div>
        </div>
      `, {
        className: "custom-leaflet-popup",
        direction: "top",
        offset: [0, -radius]
      });

      // Click event -> Select record
      marker.on("click", () => {
        window.NexusApp.setActiveRecord(record.id);
        this.map.panTo([record.latitude, record.longitude], { animate: true, duration: 0.5 });
      });

      marker.addTo(this.markersGroup);
      this.markerMap.set(record.id, marker);

      // 2. Animated Pulse Ring for Critical Alerts (Accidental industrial fire or high FRP)
      if (record.classification === "industrial_fire" || record.frp >= 5.0) {
        const pulseIcon = L.divIcon({
          className: "custom-div-pulse",
          html: `<div class="pulse-marker-ring" style="border-color: ${color};"></div>`,
          iconSize: [40, 40],
          iconAnchor: [20, 20]
        });

        const pulseMarker = L.marker([record.latitude, record.longitude], {
          icon: pulseIcon,
          interactive: false
        });
        pulseMarker.addTo(this.pulseRingsGroup);
      }

      // 3. Industrial Proximity Buffer Zone (Geofence radius)
      if (record.nearestIndustrialDistM && record.nearestIndustrialDistM <= 1200) {
        const buffer = L.circle([record.latitude, record.longitude], {
          radius: record.nearestIndustrialDistM,
          color: color,
          weight: 1,
          dashArray: "4, 6",
          fillColor: color,
          fillOpacity: 0.04,
          interactive: false
        });
        buffer.addTo(this.bufferZonesGroup);
      }
    });

    // If there's an active record, highlight it
    const activeRecord = window.NexusApp.getActiveRecord();
    if (activeRecord) {
      this.highlightActiveMarker(activeRecord.id);
    }
  }

  highlightActiveMarker(id) {
    // Reset all markers
    this.markerMap.forEach((marker) => {
      marker.setStyle({
        weight: 1.8,
        color: "#ffffff"
      });
    });

    if (id && this.markerMap.has(id)) {
      const activeMarker = this.markerMap.get(id);
      activeMarker.setStyle({
        weight: 3.5,
        color: "#00f2fe"
      });
      activeMarker.bringToFront();
    }
  }

  panToRecord(record) {
    if (!record) return;
    this.map.flyTo([record.latitude, record.longitude], Math.max(this.map.getZoom(), 12), {
      duration: 0.8
    });
    this.highlightActiveMarker(record.id);
  }
}

// Global Single Map Instance
window.NexusGIS = new GISMapEngine("gis-map");
