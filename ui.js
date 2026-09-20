/**
 * NEXUS CORE — User Interface & Command Control Center
 * SIH 2026: AI-Based Detection & Classification of Industrial Fires & Persistent Thermal Sources
 * 
 * Module: ui.js
 * Architecture: Real-time telemetry cards, interactive canvas charts, bottom drawer table,
 *               HazMat action cards, manual entry modal, and Sentinel-2 SWIR simulator.
 */

class UIEngine {
  constructor() {
    this.bottomDrawerExpanded = false;
    this.swirAnimationId = null;
  }

  init() {
    this.initClock();
    this.bindEvents();
    this.renderInitialUI();

    // Subscribe to state updates
    window.NexusApp.subscribe((event, payload) => {
      this.updateTelemetryView();
      if (event === "active_record_changed") {
        this.renderIncidentPanel(payload);
      }
    });

    console.log("[UI] Interface engine initialized.");
  }

  // 1. Live Clock (Indian Standard Time UTC+5:30)
  initClock() {
    const clockEl = document.getElementById("header-clock");
    const updateTime = () => {
      const now = new Date();
      const options = {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
      };
      const timeString = new Intl.DateTimeFormat("en-IN", options).format(now);
      const dateString = now.toLocaleDateString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "short",
        year: "numeric"
      });
      if (clockEl) {
        clockEl.textContent = `${dateString} | ${timeString} IST`;
      }
    };
    updateTime();
    setInterval(updateTime, 1000);
  }

  // 2. Bind DOM Event Handlers
  bindEvents() {
    // Filter Pills
    document.querySelectorAll(".filter-pill").forEach(pill => {
      pill.addEventListener("click", (e) => {
        document.querySelectorAll(".filter-pill").forEach(p => p.classList.remove("active"));
        pill.classList.add("active");
        const filter = pill.getAttribute("data-filter");
        window.NexusApp.activeFilter = filter;
        window.NexusApp.notify("records_updated", window.NexusApp.records);
      });
    });

    // Search Input
    const searchInput = document.getElementById("search-hotspots");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        window.NexusApp.searchQuery = e.target.value;
        window.NexusApp.notify("records_updated", window.NexusApp.records);
      });
    }

    // Region Switch Buttons
    document.querySelectorAll(".region-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".region-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const region = btn.getAttribute("data-region");
        window.NexusGIS.flyToRegion(region);
      });
    });

    // Map Layer Controls
    const toggleSatellite = document.getElementById("btn-toggle-satellite");
    if (toggleSatellite) {
      toggleSatellite.addEventListener("click", () => {
        const isSat = toggleSatellite.classList.toggle("active");
        window.NexusGIS.setBaseLayer(isSat ? "satellite" : "dark");
      });
    }

    const toggleBuffers = document.getElementById("btn-toggle-buffers");
    if (toggleBuffers) {
      toggleBuffers.addEventListener("click", () => {
        const active = toggleBuffers.classList.toggle("active");
        window.NexusGIS.toggleBufferZones(active);
      });
    }

    // Bottom Drawer Expand / Collapse
    const drawerToggle = document.getElementById("drawer-toggle");
    const bottomDrawer = document.getElementById("bottom-drawer");
    if (drawerToggle && bottomDrawer) {
      drawerToggle.addEventListener("click", () => {
        this.bottomDrawerExpanded = !this.bottomDrawerExpanded;
        bottomDrawer.classList.toggle("expanded", this.bottomDrawerExpanded);
      });
    }

    // Close Incident Panel Button
    const closePanelBtn = document.getElementById("close-incident-panel");
    if (closePanelBtn) {
      closePanelBtn.addEventListener("click", () => {
        window.NexusApp.setActiveRecord(null);
      });
    }

    // Header Action Buttons
    const btnAddHotspot = document.getElementById("btn-add-hotspot");
    if (btnAddHotspot) {
      btnAddHotspot.addEventListener("click", () => this.openManualModal());
    }

    const btnExport = document.getElementById("btn-export-data");
    if (btnExport) {
      btnExport.addEventListener("click", () => {
        window.NexusApp.exportDataAsJSON();
        this.showToast("Telemetry records exported as JSON file.");
      });
    }

    const btnResetSeed = document.getElementById("btn-reset-seed");
    if (btnResetSeed) {
      btnResetSeed.addEventListener("click", async () => {
        if (confirm("Reset local database to original 12 NASA FIRMS + OSM seed records?")) {
          await window.NexusApp.resetToSeed();
          this.showToast("Database restored to 12 seed records.");
        }
      });
    }

    // Manual Modal Inputs Live Classifier Preview
    ["manual-frp", "manual-recurrence", "manual-dist", "manual-landcover"].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener("input", () => this.updateManualLivePreview());
      }
    });

    // Save Manual Record Button
    const btnSaveManual = document.getElementById("btn-save-manual");
    if (btnSaveManual) {
      btnSaveManual.addEventListener("click", () => this.handleSaveManual());
    }

    // Modal Close Buttons
    document.querySelectorAll(".close-modal-trigger").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const modal = e.target.closest(".modal-overlay");
        if (modal) modal.classList.remove("active");
        if (this.swirAnimationId) cancelAnimationFrame(this.swirAnimationId);
      });
    });

    // Save Override Button
    const btnSaveOverride = document.getElementById("btn-save-override");
    if (btnSaveOverride) {
      btnSaveOverride.addEventListener("click", () => this.handleSaveOverride());
    }
  }

  renderInitialUI() {
    this.updateTelemetryView();
  }

  // 3. Update Sidebar Telemetry, Charts & Table
  updateTelemetryView() {
    const all = window.NexusApp.records;
    const filtered = window.NexusApp.getFilteredRecords();

    // KPIs
    const fireCount = all.filter(r => r.classification === "industrial_fire").length;
    const flareCount = all.filter(r => r.classification === "gas_flare").length;
    const miningCount = all.filter(r => r.classification === "mining").length;
    const avgFrp = all.length ? (all.reduce((acc, r) => acc + r.frp, 0) / all.length).toFixed(1) : 0;
    const avgConf = all.length ? Math.round((all.reduce((acc, r) => acc + r.confidence, 0) / all.length) * 100) : 0;

    const elTotal = document.getElementById("kpi-total-hotspots");
    const elFire = document.getElementById("kpi-industrial-fire");
    const elFlare = document.getElementById("kpi-gas-flare");
    const elMining = document.getElementById("kpi-mining");
    const elAvgFrp = document.getElementById("kpi-avg-frp");
    const elAvgConf = document.getElementById("kpi-avg-conf");
    const elDrawerCount = document.getElementById("drawer-count");

    if (elTotal) elTotal.textContent = all.length;
    if (elFire) elFire.textContent = fireCount;
    if (elFlare) elFlare.textContent = flareCount;
    if (elMining) elMining.textContent = miningCount;
    if (elAvgFrp) elAvgFrp.textContent = `${avgFrp} MW`;
    if (elAvgConf) elAvgConf.textContent = `${avgConf}%`;
    if (elDrawerCount) elDrawerCount.textContent = `${filtered.length} records`;

    // Render Canvas Charts
    this.renderClassificationChart(all);
    this.renderFrpDistributionChart(all);

    // Render Table in Bottom Drawer
    this.renderTable(filtered);
  }

  // 4. Render Canvas Class Distribution Bar Chart
  renderClassificationChart(records) {
    const canvas = document.getElementById("chart-distribution");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const width = canvas.width = canvas.parentElement.clientWidth || 320;
    const height = canvas.height = 90;

    ctx.clearRect(0, 0, width, height);

    const counts = {
      industrial_fire: records.filter(r => r.classification === "industrial_fire").length,
      gas_flare: records.filter(r => r.classification === "gas_flare").length,
      mining: records.filter(r => r.classification === "mining").length,
      agri_burn: records.filter(r => r.classification === "agri_burn").length,
      wildfire: records.filter(r => r.classification === "wildfire").length
    };

    const colors = {
      industrial_fire: "#ef4444",
      gas_flare: "#f59e0b",
      mining: "#a855f7",
      agri_burn: "#10b981",
      wildfire: "#f97316"
    };

    const labels = ["Fire", "Flare", "Mine", "Agri", "Wild"];
    const keys = Object.keys(counts);
    const max = Math.max(...Object.values(counts), 1);

    const barWidth = (width - 40) / keys.length;
    const bottomY = height - 20;

    keys.forEach((key, i) => {
      const val = counts[key];
      const barHeight = (val / max) * (height - 35);
      const x = 20 + i * barWidth;
      const y = bottomY - barHeight;

      // Bar fill with slight gradient
      const grad = ctx.createLinearGradient(0, y, 0, bottomY);
      grad.addColorStop(0, colors[key]);
      grad.addColorStop(1, "rgba(20, 30, 50, 0.4)");

      ctx.fillStyle = grad;
      ctx.fillRect(x + 4, y, barWidth - 8, barHeight);

      // Value on top
      ctx.fillStyle = "#cbd5e1";
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.fillText(val, x + barWidth / 2, y - 4);

      // Label below
      ctx.fillStyle = "#64748b";
      ctx.font = "9.5px sans-serif";
      ctx.fillText(labels[i], x + barWidth / 2, height - 6);
    });
  }

  // 5. Render Canvas FRP Sparkline / Distribution Chart
  renderFrpDistributionChart(records) {
    const canvas = document.getElementById("chart-frp");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const width = canvas.width = canvas.parentElement.clientWidth || 320;
    const height = canvas.height = 70;

    ctx.clearRect(0, 0, width, height);

    if (!records.length) return;

    // Sort by FRP ascending for sparkline curve
    const sorted = [...records].map(r => r.frp).sort((a, b) => a - b);
    const maxFrp = Math.max(...sorted, 10);

    ctx.beginPath();
    sorted.forEach((frp, i) => {
      const x = (i / (sorted.length - 1 || 1)) * (width - 24) + 12;
      const y = height - 15 - (frp / maxFrp) * (height - 25);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    ctx.strokeStyle = "#00f2fe";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Fill underneath
    ctx.lineTo(width - 12, height - 15);
    ctx.lineTo(12, height - 15);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, "rgba(0, 242, 254, 0.25)");
    grad.addColorStop(1, "rgba(0, 242, 254, 0.0)");
    ctx.fillStyle = grad;
    ctx.fill();

    // Baseline axis
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.beginPath();
    ctx.moveTo(12, height - 15);
    ctx.lineTo(width - 12, height - 15);
    ctx.stroke();
  }

  // 6. Render Table Rows in Bottom Drawer
  renderTable(records) {
    const tbody = document.getElementById("telemetry-table-body");
    if (!tbody) return;

    const activeId = window.NexusApp.activeRecordId;

    if (!records.length) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 24px; color: #64748b;">No thermal anomalies match current filter.</td></tr>`;
      return;
    }

    tbody.innerHTML = records.map(r => {
      const isSelected = r.id === activeId ? "active-row" : "";
      const classLabel = r.classification.replace("_", " ");
      const distStr = r.nearestIndustrialDistM !== null ? `${Math.round(r.nearestIndustrialDistM)}m` : "None";
      const dateStr = new Date(r.detectedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      return `
        <tr class="${isSelected}" data-id="${r.id}">
          <td><strong>${r.locationLabel}</strong></td>
          <td><span class="classification-badge ${r.classification}" style="font-size: 9.5px; padding: 2px 7px;">${classLabel}</span></td>
          <td><strong style="color: #fff;">${r.frp.toFixed(2)}</strong> MW</td>
          <td>${r.recurrenceCount}</td>
          <td>${distStr}</td>
          <td><span style="color: #94a3b8;">${r.landCoverClass}</span></td>
          <td><strong style="color: #38bdf8;">${Math.round(r.confidence * 100)}%</strong></td>
          <td><span style="font-family: monospace; font-size: 11px;">${dateStr}</span></td>
        </tr>
      `;
    }).join("");

    // Row Click Listener
    tbody.querySelectorAll("tr").forEach(tr => {
      tr.addEventListener("click", () => {
        const id = tr.getAttribute("data-id");
        if (id) {
          window.NexusApp.setActiveRecord(id);
          const record = window.NexusApp.getActiveRecord();
          if (record) {
            window.NexusGIS.panToRecord(record);
          }
        }
      });
    });
  }

  // 7. Render Incident Detail & HazMat Action Panel (Right)
  renderIncidentPanel(record) {
    const panel = document.getElementById("incident-panel");
    if (!panel) return;

    if (!record) {
      panel.classList.remove("open");
      return;
    }

    panel.classList.add("open");

    // Populate Facility details
    document.getElementById("detail-facility-name").textContent = record.locationLabel;
    
    const badge = document.getElementById("detail-classification-badge");
    badge.className = `classification-badge ${record.classification}`;
    badge.textContent = record.classification.replace("_", " ");

    document.getElementById("detail-coords").textContent = `${record.latitude.toFixed(4)}°N, ${record.longitude.toFixed(4)}°E`;
    document.getElementById("detail-frp").textContent = `${record.frp.toFixed(2)} MW`;

    // FRP Meter Bar (Scale out of 20MW max)
    const frpPercent = Math.min(100, Math.max(5, (record.frp / 15) * 100));
    document.getElementById("detail-frp-bar").style.width = `${frpPercent}%`;

    // Attributes
    document.getElementById("detail-landcover").textContent = record.landCoverClass;
    document.getElementById("detail-recurrence").textContent = `${record.recurrenceCount} events`;
    document.getElementById("detail-osm-dist").textContent = record.nearestIndustrialDistM !== null ? `${Math.round(record.nearestIndustrialDistM)} meters` : "N/A";
    document.getElementById("detail-osm-tag").textContent = record.osmTag || "unassigned";

    // AI Reasoning List
    const reasoningList = document.getElementById("detail-reasoning-list");
    reasoningList.innerHTML = record.reasoning.map(r => `<li>${r}</li>`).join("");

    // Confidence
    const confPercent = Math.round(record.confidence * 100);
    document.getElementById("detail-confidence").textContent = `${confPercent}%`;

    // HazMat Action Card
    const hazmat = generateHazMatActionCard(record);
    const hazmatCard = document.getElementById("hazmat-action-card");
    hazmatCard.className = `hazmat-card ${hazmat.themeMode}`;

    document.getElementById("hazmat-protocol").textContent = hazmat.protocol;
    const urgencyEl = document.getElementById("hazmat-urgency");
    urgencyEl.textContent = hazmat.urgency;
    urgencyEl.className = `hazmat-urgency-pill ${hazmat.urgencyClass}`;

    document.getElementById("hazmat-agency").textContent = `Lead Agency: ${hazmat.leadAgency}`;

    const sopList = document.getElementById("hazmat-sop-list");
    sopList.innerHTML = hazmat.sops.map((sop, idx) => `
      <li class="hazmat-sop-item">
        <input type="checkbox" class="sop-checkbox" id="sop-${idx}">
        <label for="sop-${idx}">${sop}</label>
      </li>
    `).join("");

    // Action button listeners
    const btnSwir = document.getElementById("btn-trigger-swir");
    if (btnSwir) {
      btnSwir.onclick = () => this.openSwirModal(record);
    }

    const btnOverride = document.getElementById("btn-trigger-override");
    if (btnOverride) {
      btnOverride.onclick = () => this.openOverrideModal(record);
    }
  }

  // 8. Manual Hotspot Ingestion Modal
  openManualModal() {
    const modal = document.getElementById("modal-manual-entry");
    if (!modal) return;
    modal.classList.add("active");
    this.updateManualLivePreview();
  }

  updateManualLivePreview() {
    const frp = parseFloat(document.getElementById("manual-frp").value) || 2.5;
    const recurrence = parseInt(document.getElementById("manual-recurrence").value, 10) || 0;
    const distRaw = document.getElementById("manual-dist").value;
    const dist = distRaw !== "" ? parseFloat(distRaw) : null;
    const landCover = document.getElementById("manual-landcover").value;

    const result = classifyThermalAnomaly({
      frp,
      recurrenceCount: recurrence,
      nearestIndustrialDistM: dist,
      landCoverClass: landCover
    });

    const previewCls = document.getElementById("preview-class");
    const previewConf = document.getElementById("preview-conf");
    const previewReasoning = document.getElementById("preview-reasoning");

    if (previewCls) {
      previewCls.textContent = result.classification.replace("_", " ").toUpperCase();
      previewCls.style.color = window.NexusGIS.getColorForClass(result.classification);
    }
    if (previewConf) {
      previewConf.textContent = `${Math.round(result.confidence * 100)}%`;
    }
    if (previewReasoning) {
      previewReasoning.innerHTML = result.reasoning.map(r => `<li>${r}</li>`).join("");
    }
  }

  async handleSaveManual() {
    const label = document.getElementById("manual-label").value.trim() || "Manual Hotspot";
    const lat = parseFloat(document.getElementById("manual-lat").value);
    const lon = parseFloat(document.getElementById("manual-lon").value);
    const frp = parseFloat(document.getElementById("manual-frp").value);
    const recurrence = parseInt(document.getElementById("manual-recurrence").value, 10) || 0;
    const distRaw = document.getElementById("manual-dist").value;
    const dist = distRaw !== "" ? parseFloat(distRaw) : null;
    const osmTag = document.getElementById("manual-tag").value.trim() || null;
    const landCover = document.getElementById("manual-landcover").value;

    if (isNaN(lat) || isNaN(lon) || isNaN(frp)) {
      alert("Please enter valid Latitude, Longitude, and FRP values.");
      return;
    }

    const record = await window.NexusApp.addRecord({
      locationLabel: label,
      latitude: lat,
      longitude: lon,
      frp: frp,
      recurrenceCount: recurrence,
      nearestIndustrialDistM: dist,
      osmTag: osmTag,
      landCoverClass: landCover
    });

    document.getElementById("modal-manual-entry").classList.remove("active");
    window.NexusGIS.panToRecord(record);
    this.showToast(`Thermal hotspot "${label}" ingested and classified.`);
  }

  // 9. Override / Re-classification Modal
  openOverrideModal(record) {
    const modal = document.getElementById("modal-override");
    if (!modal) return;
    modal.classList.add("active");

    document.getElementById("override-target-name").textContent = record.locationLabel;
    document.getElementById("override-class-select").value = record.classification;
    document.getElementById("override-notes").value = "";
    document.getElementById("override-record-id").value = record.id;
  }

  async handleSaveOverride() {
    const id = document.getElementById("override-record-id").value;
    const newClass = document.getElementById("override-class-select").value;
    const notes = document.getElementById("override-notes").value.trim() || "Manual commander override";

    const record = window.NexusApp.getActiveRecord();
    if (!record || record.id !== id) return;

    const newReasoning = [
      `Commander review override: ${newClass.replace('_', ' ')}`,
      `Audit note: "${notes}"`,
      `Original classification: ${record.classification}`
    ];

    await window.NexusApp.updateRecord(id, {
      classification: newClass,
      confidence: 0.95,
      reasoning: newReasoning,
      status: "reviewed"
    });

    document.getElementById("modal-override").classList.remove("active");
    this.showToast(`Classification overridden to ${newClass.replace('_', ' ').toUpperCase()} (Status: Reviewed).`);
  }

  // 10. Sentinel-2 SWIR Optical Verification Simulator Modal
  openSwirModal(record) {
    const modal = document.getElementById("modal-swir");
    if (!modal) return;
    modal.classList.add("active");

    document.getElementById("swir-facility-name").textContent = record.locationLabel;
    document.getElementById("swir-coords").textContent = `${record.latitude.toFixed(4)}°N, ${record.longitude.toFixed(4)}°E`;
    document.getElementById("swir-frp").textContent = `${record.frp.toFixed(2)} MW`;

    // Compute synthetic NBR and Plume vector
    const nbr = (0.35 + (record.frp * 0.04)).toFixed(2);
    document.getElementById("swir-nbr").textContent = nbr;
    const windAngle = Math.floor(Math.random() * 360);
    const windSpeed = (8 + Math.random() * 12).toFixed(1);
    document.getElementById("swir-wind").textContent = `${windSpeed} km/h @ ${windAngle}°`;

    // Start SWIR Canvas Infrared Glow Animation
    this.startSwirSimulation(record, windAngle);
  }

  startSwirSimulation(record, windAngle) {
    const canvas = document.getElementById("swir-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const width = canvas.width = 240;
    const height = canvas.height = 240;

    if (this.swirAnimationId) cancelAnimationFrame(this.swirAnimationId);

    let frame = 0;
    const centerX = width / 2;
    const centerY = height / 2;

    const render = () => {
      frame++;
      ctx.fillStyle = "#050912";
      ctx.fillRect(0, 0, width, height);

      // Draw background satellite landscape features (simulated multi-spectral bands)
      ctx.strokeStyle = "rgba(70, 95, 145, 0.15)";
      ctx.lineWidth = 1;
      for (let i = 20; i < width; i += 30) {
        ctx.beginPath();
        ctx.moveTo(i, 0); ctx.lineTo(i, height);
        ctx.moveTo(0, i); ctx.lineTo(width, i);
        ctx.stroke();
      }

      // Wind plume vector simulation (smoke dispersion)
      const rad = (windAngle * Math.PI) / 180;
      const plumeLength = 70 + Math.sin(frame * 0.05) * 8;
      const endX = centerX + Math.cos(rad) * plumeLength;
      const endY = centerY + Math.sin(rad) * plumeLength;

      const plumeGrad = ctx.createLinearGradient(centerX, centerY, endX, endY);
      plumeGrad.addColorStop(0, "rgba(239, 68, 68, 0.5)");
      plumeGrad.addColorStop(0.4, "rgba(245, 158, 11, 0.25)");
      plumeGrad.addColorStop(1, "rgba(100, 116, 139, 0)");

      ctx.fillStyle = plumeGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 12, 0, Math.PI * 2);
      ctx.lineTo(endX + 15, endY + 15);
      ctx.lineTo(endX - 15, endY - 15);
      ctx.closePath();
      ctx.fill();

      // Core SWIR Band 12 (Short-Wave Infrared 2.2μm) Thermal Hotspot
      const pulseSize = 14 + Math.sin(frame * 0.08) * 3;
      const glow = ctx.createRadialGradient(centerX, centerY, 2, centerX, centerY, pulseSize * 2.5);
      glow.addColorStop(0, "#ffffff");
      glow.addColorStop(0.2, "#00f2fe");
      glow.addColorStop(0.6, "rgba(239, 68, 68, 0.6)");
      glow.addColorStop(1, "rgba(0, 0, 0, 0)");

      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(centerX, centerY, pulseSize * 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Band label
      ctx.fillStyle = "#38bdf8";
      ctx.font = "9px monospace";
      ctx.fillText("BAND 12 (2.19μm SWIR-2)", 8, 16);
      ctx.fillStyle = "#ef4444";
      ctx.fillText("THERMAL ANOMALY CONFIRMED", 8, height - 10);

      this.swirAnimationId = requestAnimationFrame(render);
    };

    render();
  }

  // 11. Toast Notification Helper
  showToast(message) {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = `
      <div class="pulse-beacon" style="width: 6px; height: 6px;"></div>
      <span>${message}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(10px)";
      toast.style.transition = "all 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }
}

// Global Single UI Instance
window.NexusUI = new UIEngine();
