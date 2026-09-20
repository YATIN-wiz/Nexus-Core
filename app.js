/**
 * NEXUS CORE — Autonomous Geospatial Intelligence Engine
 * SIH 2026: AI-Based Detection & Classification of Industrial Fires & Persistent Thermal Sources
 * 
 * Module: app.js
 * Architecture: IndexedDB Local Persistence Engine, Real Seed Data, and Client-Side Multi-Modal Classifier
 */

// ============================================================================
// 0. EXACT REAL SEED DATASET (NASA FIRMS + OSM OVERPASS FUSED)
// ============================================================================
const EXACT_SEED_DATA = [
  {
    "id": "11dfae27-e6d7-4bbb-b6dc-32b2a0fac9fb",
    "locationLabel": "Essar Power",
    "latitude": 22.31089,
    "longitude": 69.71923,
    "detectedAt": "2026-09-18T21:44:00+00:00",
    "frp": 1.74,
    "nearestIndustrialDistM": 806.1,
    "osmTag": "landuse=industrial",
    "source": "seed_import",
    "status": "classified",
    "createdAt": "2026-09-20T13:38:15.679845+00:00",
    "updatedAt": "2026-09-20T13:38:15.679845+00:00",
    "recurrenceCount": 0,
    "landCoverClass": "built-up",
    "classification": "industrial_fire",
    "confidence": 0.75,
    "reasoning": [
      "Land cover: built-up",
      "Distance to nearest industrial polygon: 806m",
      "Recurrence: 0 (low-moderate)"
    ]
  },
  {
    "id": "dcd1d9be-bde9-4386-98fd-8833d3417b9d",
    "locationLabel": "Reliance Refinery",
    "latitude": 22.33592,
    "longitude": 69.86636,
    "detectedAt": "2026-09-19T21:25:00+00:00",
    "frp": 3.12,
    "nearestIndustrialDistM": 98.6,
    "osmTag": "industrial=refinery",
    "source": "seed_import",
    "status": "classified",
    "createdAt": "2026-09-20T13:38:15.711916+00:00",
    "updatedAt": "2026-09-20T13:38:15.711916+00:00",
    "recurrenceCount": 5,
    "landCoverClass": "built-up",
    "classification": "industrial_fire",
    "confidence": 0.75,
    "reasoning": [
      "Land cover: built-up",
      "Distance to nearest industrial polygon: 99m",
      "Recurrence: 5 (low-moderate)"
    ]
  },
  {
    "id": "b8acc584-9d0d-4589-b883-ed4aa95a706a",
    "locationLabel": "Unnamed facility",
    "latitude": 22.57542,
    "longitude": 70.22902,
    "detectedAt": "2026-09-19T21:25:00+00:00",
    "frp": 0.75,
    "nearestIndustrialDistM": 600.1,
    "osmTag": "landuse=industrial",
    "source": "seed_import",
    "status": "classified",
    "createdAt": "2026-09-20T13:38:15.742142+00:00",
    "updatedAt": "2026-09-20T13:38:15.742142+00:00",
    "recurrenceCount": 0,
    "landCoverClass": "built-up",
    "classification": "industrial_fire",
    "confidence": 0.75,
    "reasoning": [
      "Land cover: built-up",
      "Distance to nearest industrial polygon: 600m",
      "Recurrence: 0 (low-moderate)"
    ]
  },
  {
    "id": "150b6090-2217-4e89-ad4e-1c893bd73f4b",
    "locationLabel": "Reliance Refinery",
    "latitude": 22.33524,
    "longitude": 69.86731,
    "detectedAt": "2026-09-10T20:55:00+00:00",
    "frp": 3.02,
    "nearestIndustrialDistM": 186.9,
    "osmTag": "industrial=refinery",
    "source": "seed_import",
    "status": "classified",
    "createdAt": "2026-09-20T13:38:15.770362+00:00",
    "updatedAt": "2026-09-20T13:38:15.770362+00:00",
    "recurrenceCount": 5,
    "landCoverClass": "built-up",
    "classification": "industrial_fire",
    "confidence": 0.75,
    "reasoning": [
      "Land cover: built-up",
      "Distance to nearest industrial polygon: 187m",
      "Recurrence: 5 (low-moderate)"
    ]
  },
  {
    "id": "52203f58-e545-4789-8492-bdd8f916a4ff",
    "locationLabel": "Reliance Refinery",
    "latitude": 22.34504,
    "longitude": 69.87063,
    "detectedAt": "2026-08-24T21:12:00+00:00",
    "frp": 1.78,
    "nearestIndustrialDistM": 1004.6,
    "osmTag": "industrial=refinery",
    "source": "seed_import",
    "status": "classified",
    "createdAt": "2026-09-20T13:38:15.997858+00:00",
    "updatedAt": "2026-09-20T13:38:15.997858+00:00",
    "recurrenceCount": 3,
    "landCoverClass": "bare/mining",
    "classification": "mining",
    "confidence": 0.68,
    "reasoning": [
      "Land cover: bare/mining",
      "Distance to nearest industrial tag: 1005m"
    ]
  },
  {
    "id": "232c59c3-72c7-4d85-8c7a-e231b541f7f5",
    "locationLabel": "Unnamed facility",
    "latitude": 23.77644,
    "longitude": 86.20872,
    "detectedAt": "2026-09-15T08:33:00+00:00",
    "frp": 1.67,
    "nearestIndustrialDistM": 1247.7,
    "osmTag": "landuse=quarry",
    "source": "seed_import",
    "status": "classified",
    "createdAt": "2026-09-20T13:39:04.548045+00:00",
    "updatedAt": "2026-09-20T13:39:04.548045+00:00",
    "recurrenceCount": 57,
    "landCoverClass": "bare/mining",
    "classification": "mining",
    "confidence": 0.68,
    "reasoning": [
      "Land cover: bare/mining",
      "Distance to nearest industrial tag: 1248m"
    ]
  },
  {
    "id": "b682b357-78b0-46bd-ba53-0cd15a854585",
    "locationLabel": "Unnamed facility",
    "latitude": 23.78321,
    "longitude": 86.20798,
    "detectedAt": "2026-09-15T08:33:00+00:00",
    "frp": 6.32,
    "nearestIndustrialDistM": 1220.6,
    "osmTag": "landuse=quarry",
    "source": "seed_import",
    "status": "classified",
    "createdAt": "2026-09-20T13:39:04.618725+00:00",
    "updatedAt": "2026-09-20T13:39:04.618725+00:00",
    "recurrenceCount": 56,
    "landCoverClass": "bare/mining",
    "classification": "mining",
    "confidence": 0.68,
    "reasoning": [
      "Land cover: bare/mining",
      "Distance to nearest industrial tag: 1221m"
    ]
  },
  {
    "id": "9bad346d-56cb-4f71-9043-32ff78998ff8",
    "locationLabel": "Unnamed facility",
    "latitude": 23.67751,
    "longitude": 86.39614,
    "detectedAt": "2026-09-15T19:17:00+00:00",
    "frp": 1.58,
    "nearestIndustrialDistM": 1057.4,
    "osmTag": "landuse=quarry",
    "source": "seed_import",
    "status": "classified",
    "createdAt": "2026-09-20T13:39:04.682498+00:00",
    "updatedAt": "2026-09-20T13:39:04.682498+00:00",
    "recurrenceCount": 107,
    "landCoverClass": "bare/mining",
    "classification": "mining",
    "confidence": 0.68,
    "reasoning": [
      "Land cover: bare/mining",
      "Distance to nearest industrial tag: 1057m"
    ]
  },
  {
    "id": "d7f8e866-b9c6-456e-ae29-8d49ad23c75d",
    "locationLabel": "Unnamed facility",
    "latitude": 23.77469,
    "longitude": 86.36554,
    "detectedAt": "2026-09-15T06:50:00+00:00",
    "frp": 9.27,
    "nearestIndustrialDistM": 124.6,
    "osmTag": "landuse=quarry",
    "source": "seed_import",
    "status": "classified",
    "createdAt": "2026-09-20T13:39:04.406468+00:00",
    "updatedAt": "2026-09-20T13:39:04.406468+00:00",
    "recurrenceCount": 44,
    "landCoverClass": "built-up",
    "classification": "gas_flare",
    "confidence": 0.82,
    "reasoning": [
      "Recurrence: 44 nearby detections in dataset window",
      "Distance to nearest industrial polygon: 125m",
      "FRP: 9.3MW (moderate, consistent with flare)"
    ]
  },
  {
    "id": "120d812c-eb74-4001-af43-3376bd3d88de",
    "locationLabel": "Unnamed facility",
    "latitude": 23.77511,
    "longitude": 86.36607,
    "detectedAt": "2026-09-15T06:50:00+00:00",
    "frp": 7.08,
    "nearestIndustrialDistM": 169.2,
    "osmTag": "landuse=quarry",
    "source": "seed_import",
    "status": "classified",
    "createdAt": "2026-09-20T13:39:04.473069+00:00",
    "updatedAt": "2026-09-20T13:39:04.473069+00:00",
    "recurrenceCount": 46,
    "landCoverClass": "built-up",
    "classification": "gas_flare",
    "confidence": 0.82,
    "reasoning": [
      "Recurrence: 46 nearby detections in dataset window",
      "Distance to nearest industrial polygon: 169m",
      "FRP: 7.1MW (moderate, consistent with flare)"
    ]
  },
  {
    "id": "6992957b-bb7a-4dba-8183-3c922dee094f",
    "locationLabel": "Unnamed facility",
    "latitude": 23.68415,
    "longitude": 86.39152,
    "detectedAt": "2026-09-15T19:17:00+00:00",
    "frp": 1.58,
    "nearestIndustrialDistM": 291.6,
    "osmTag": "landuse=quarry",
    "source": "seed_import",
    "status": "classified",
    "createdAt": "2026-09-20T13:39:04.756267+00:00",
    "updatedAt": "2026-09-20T13:39:04.756267+00:00",
    "recurrenceCount": 86,
    "landCoverClass": "built-up",
    "classification": "gas_flare",
    "confidence": 0.82,
    "reasoning": [
      "Recurrence: 86 nearby detections in dataset window",
      "Distance to nearest industrial polygon: 292m",
      "FRP: 1.6MW (moderate, consistent with flare)"
    ]
  },
  {
    "id": "3affa16d-1596-4d43-a9f0-171cd9fe8245",
    "locationLabel": "Cluster 11 and Cluster 7 (BCCL) Coal Mines",
    "latitude": 23.76515,
    "longitude": 86.40034,
    "detectedAt": "2026-09-15T19:17:00+00:00",
    "frp": 2.23,
    "nearestIndustrialDistM": 405.8,
    "osmTag": "landuse=quarry",
    "source": "seed_import",
    "status": "classified",
    "createdAt": "2026-09-20T13:39:05.805394+00:00",
    "updatedAt": "2026-09-20T13:39:05.805394+00:00",
    "recurrenceCount": 128,
    "landCoverClass": "built-up",
    "classification": "gas_flare",
    "confidence": 0.82,
    "reasoning": [
      "Recurrence: 128 nearby detections in dataset window",
      "Distance to nearest industrial polygon: 406m",
      "FRP: 2.2MW (moderate, consistent with flare)"
    ]
  }
];

// ============================================================================
// 1. INDEXEDDB PERSISTENCE LAYER (NexusCoreDB)
// ============================================================================
const DB_NAME = "NexusCoreDB";
const DB_VERSION = 1;
const STORE_NAME = "thermalRecords";

class ThermalDatabase {
  constructor() {
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
          store.createIndex("classification", "classification", { unique: false });
          store.createIndex("status", "status", { unique: false });
          store.createIndex("detectedAt", "detectedAt", { unique: false });
          store.createIndex("frp", "frp", { unique: false });
        }
      };

      request.onsuccess = async (event) => {
        this.db = event.target.result;
        // Check if database needs initial seeding
        const count = await this.count();
        if (count === 0) {
          console.log("[DB] Store empty. Injecting 12 real seed records...");
          await this.seedInitialData();
        }
        resolve(this.db);
      };

      request.onerror = (event) => {
        console.error("[DB] Open failed:", event.target.error);
        reject(event.target.error);
      };
    });
  }

  async count() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const req = store.count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async seedInitialData() {
    const transaction = this.db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    for (const record of EXACT_SEED_DATA) {
      store.put(record);
    }
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => {
        localStorage.setItem("nexuscore_seed_installed", "true");
        resolve();
      };
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getAll() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async get(id) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async put(record) {
    record.updatedAt = new Date().toISOString();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const req = store.put(record);
      req.onsuccess = () => resolve(record);
      req.onerror = () => reject(req.error);
    });
  }

  async delete(id) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  }

  async reset() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      store.clear();
      transaction.oncomplete = async () => {
        await this.seedInitialData();
        resolve(true);
      };
      transaction.onerror = () => reject(transaction.error);
    });
  }
}

// ============================================================================
// 2. CLIENT-SIDE MULTI-MODAL RULE CLASSIFIER (Mirrors firms_osm_seed_generator.py)
// ============================================================================
function classifyThermalAnomaly({ frp, recurrenceCount, nearestIndustrialDistM, landCoverClass }) {
  const reasoning = [];
  const dist = nearestIndustrialDistM;
  const recurrence = recurrenceCount;
  const land_cover = landCoverClass;

  // Rule 1: Gas Flare / Flare Stack
  // Recurrence > 20, close to industrial polygon (<500m), moderate FRP (<50MW)
  if (recurrence > 20 && dist !== null && dist < 500 && frp < 50) {
    reasoning.push(`Recurrence: ${recurrence} nearby detections in dataset window`);
    reasoning.push(`Distance to nearest industrial polygon: ${Math.round(dist)}m`);
    reasoning.push(`FRP: ${frp.toFixed(1)}MW (moderate, consistent with flare)`);
    return {
      classification: "gas_flare",
      confidence: 0.82,
      reasoning
    };
  }

  // Rule 2: Accidental Industrial Fire
  // Built-up land cover, close to industrial (<1000m), low-moderate recurrence (new uncharacteristic flare)
  if (dist !== null && dist < 1000 && land_cover === "built-up") {
    reasoning.push("Land cover: built-up");
    reasoning.push(`Distance to nearest industrial polygon: ${Math.round(dist)}m`);
    reasoning.push(`Recurrence: ${recurrence} (low-moderate)`);
    return {
      classification: "industrial_fire",
      confidence: 0.75,
      reasoning
    };
  }

  // Rule 3: Mining / Subsurface Coal Fire / Quarry Blasting
  if (land_cover === "bare/mining") {
    reasoning.push("Land cover: bare/mining");
    reasoning.push(dist !== null ? `Distance to nearest industrial tag: ${Math.round(dist)}m` : "No nearby industrial tag");
    return {
      classification: "mining",
      confidence: 0.68,
      reasoning
    };
  }

  // Rule 4: Agricultural Residue Burn
  if (land_cover === "cropland" && recurrence < 5) {
    reasoning.push("Land cover: cropland");
    reasoning.push(`Recurrence: ${recurrence} (low, short-duration event)`);
    return {
      classification: "agri_burn",
      confidence: 0.60,
      reasoning
    };
  }

  // Rule 5: Wildfire
  if (land_cover === "forest" && (dist === null || dist > 3000)) {
    reasoning.push("Land cover: forest");
    reasoning.push("No nearby industrial infrastructure tag");
    return {
      classification: "wildfire",
      confidence: 0.70,
      reasoning
    };
  }

  // Fallback: Unclassified
  reasoning.push("No rule matched cleanly — flagged for manual review");
  return {
    classification: "unclassified",
    confidence: 0.35,
    reasoning
  };
}

// Approximate land cover heuristic if user doesn't know it
function approximateLandCover(distToIndustrial, frp) {
  if (distToIndustrial !== null && distToIndustrial < 1000) return "built-up";
  if (distToIndustrial !== null && distToIndustrial < 3000 && frp < 15) return "bare/mining";
  if (frp > 40) return "forest";
  return "cropland";
}

// ============================================================================
// 3. HAZMAT INCIDENT ACTION CARD GENERATOR (Core Lever 4)
// ============================================================================
function generateHazMatActionCard(record) {
  const cls = record.classification;
  const frp = record.frp;

  switch (cls) {
    case "industrial_fire":
      return {
        protocol: "HAZMAT BLEVE & TOXIC PLUME SUPPRESSION PROTOCOL",
        urgency: "CRITICAL",
        urgencyClass: "urgency-critical",
        themeMode: "fire-mode",
        leadAgency: "NDRF (National Disaster Response Force) & State Petrochemical Fire Wing",
        guidance: "Immediate structural containment required. Possible hydrocarbon/chemical storage risk.",
        sops: [
          "Deploy Aqueous Film-Forming Foam (AFFF) perimeter; prohibit plain water jets on polar hydrocarbons.",
          "Establish 1.2km mandatory evacuation corridor along downwind trajectory.",
          "Monitor high-pressure relief valves to prevent catastrophic BLEVE rupture.",
          "Activate atmospheric toxic gas sensors (SO2, Benzene, VOC) on perimeter fence."
        ]
      };
    case "gas_flare":
      return {
        protocol: "PERSISTENT INDUSTRIAL THERMAL SOURCE (ROUTINE FLARE AUDIT)",
        urgency: "LOW",
        urgencyClass: "urgency-low",
        themeMode: "flare-mode",
        leadAgency: "State Pollution Control Board (SPCB) & ESG Telemetry Unit",
        guidance: "Persistent thermal signature matches authorized industrial flare stack operation.",
        sops: [
          "Cross-reference flare volumetric limits with Central Pollution Control Board (CPCB) consent permit.",
          "Verify optical flare combustion efficiency via Sentinel-2 SWIR band ratio.",
          "Log continuous thermal radiance in cumulative emissions registry.",
          "No emergency dispatch required unless FRP delta exceeds 400% baseline."
        ]
      };
    case "mining":
      return {
        protocol: "OPEN-CAST COAL SEAM & QUARRY THERMAL SURVEILLANCE",
        urgency: "MEDIUM",
        urgencyClass: "urgency-medium",
        themeMode: "mining-mode",
        leadAgency: "Directorate General of Mines Safety (DGMS) & Coalfield Fire Squad",
        guidance: "Subsurface coal seam spontaneous combustion or quarry highwall thermal anomaly.",
        sops: [
          "Deploy thermal drone with forward-looking infrared (FLIR) to map fissure depth.",
          "Implement nitrogen foam flushing or inert overburden capping on burning seam.",
          "Restructure haul road routing 300m away from active thermal subsidence zone.",
          "Check carbon monoxide (CO) ambient monitors at coal washery boundary."
        ]
      };
    case "agri_burn":
      return {
        protocol: "AGRICULTURAL STUBBLE / RESIDUE CONTAINMENT",
        urgency: "MEDIUM",
        urgencyClass: "urgency-medium",
        themeMode: "agri-mode",
        leadAgency: "District Agriculture Department & Rural Fire Station",
        guidance: "Post-harvest residue burning in agricultural parcel. Low structural asset risk.",
        sops: [
          "Dispatch tractor-plow fire break team to isolate adjacent unharvested fields.",
          "Issue remote advisory notice to regional farm cooperative via SMS gateway.",
          "Log spatial coordinate into National Clean Air Programme (NCAP) compliance dashboard."
        ]
      };
    case "wildfire":
      return {
        protocol: "FOREST BIOMASS & CANOPY WILDFIRE INTERCEPTION",
        urgency: "HIGH",
        urgencyClass: "urgency-critical",
        themeMode: "wildfire-mode",
        leadAgency: "State Forest Department Fire Brigade & NDRF Mountain Unit",
        guidance: "Rapidly spreading canopy/surface fire. No direct industrial tag within 3km.",
        sops: [
          "Deploy satellite MODIS/VIIRS fire perimeter propagation tracker.",
          "Cut 50m counter-fire control lines along ridge elevation.",
          "Alert nearby tribal hamlets and forest reserve checkposts."
        ]
      };
    default:
      return {
        protocol: "UNVERIFIED THERMAL ANOMALY REVIEW",
        urgency: "UNKNOWN",
        urgencyClass: "urgency-medium",
        themeMode: "default-mode",
        leadAgency: "District Emergency Operations Center (DEOC)",
        guidance: "Ambiguous sensor reading. Requires immediate multispectral cross-validation.",
        sops: [
          "Trigger on-demand Sentinel-2 SWIR band snapshot.",
          "Dispatch regional patrol for physical ground verification.",
          "Check satellite sensor sun-glint and cloud-edge optical reflection flags."
        ]
      };
  }
}

// ============================================================================
// 4. GLOBAL APPLICATION STATE STORE
// ============================================================================
class ApplicationStore {
  constructor() {
    this.db = new ThermalDatabase();
    this.records = [];
    this.activeRecordId = null;
    this.activeFilter = "all";
    this.searchQuery = "";
    this.sortBy = "detectedAt";
    this.sortDesc = true;
    this.listeners = new Set();
  }

  async init() {
    await this.db.init();
    await this.reloadRecords();
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify(event, payload) {
    for (const callback of this.listeners) {
      callback(event, payload, this);
    }
  }

  async reloadRecords() {
    this.records = await this.db.getAll();
    this.notify("records_updated", this.records);
  }

  getFilteredRecords() {
    let filtered = [...this.records];

    // Filter by classification pill
    if (this.activeFilter !== "all") {
      filtered = filtered.filter(r => r.classification === this.activeFilter);
    }

    // Search query filter
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      filtered = filtered.filter(r => 
        r.locationLabel.toLowerCase().includes(q) ||
        (r.osmTag && r.osmTag.toLowerCase().includes(q)) ||
        r.classification.toLowerCase().includes(q) ||
        r.landCoverClass.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q)
      );
    }

    // Sorting
    filtered.sort((a, b) => {
      let valA = a[this.sortBy];
      let valB = b[this.sortBy];

      if (typeof valA === "string") {
        return this.sortDesc ? valB.localeCompare(valA) : valA.localeCompare(valB);
      }
      return this.sortDesc ? valB - valA : valA - valB;
    });

    return filtered;
  }

  getActiveRecord() {
    return this.records.find(r => r.id === this.activeRecordId) || null;
  }

  setActiveRecord(id) {
    this.activeRecordId = id;
    this.notify("active_record_changed", this.getActiveRecord());
  }

  async addRecord(recordData) {
    const id = recordData.id || crypto.randomUUID();
    const now = new Date().toISOString();
    
    // Run rule classifier
    const classificationResult = classifyThermalAnomaly({
      frp: recordData.frp,
      recurrenceCount: recordData.recurrenceCount,
      nearestIndustrialDistM: recordData.nearestIndustrialDistM,
      landCoverClass: recordData.landCoverClass
    });

    const newRecord = {
      id,
      locationLabel: recordData.locationLabel || "Manual Hotspot",
      latitude: parseFloat(recordData.latitude),
      longitude: parseFloat(recordData.longitude),
      detectedAt: recordData.detectedAt || now,
      frp: parseFloat(recordData.frp),
      landCoverClass: recordData.landCoverClass || approximateLandCover(recordData.nearestIndustrialDistM, recordData.frp),
      recurrenceCount: parseInt(recordData.recurrenceCount, 10) || 0,
      nearestIndustrialDistM: recordData.nearestIndustrialDistM !== null && recordData.nearestIndustrialDistM !== "" ? parseFloat(recordData.nearestIndustrialDistM) : null,
      osmTag: recordData.osmTag || null,
      classification: classificationResult.classification,
      confidence: classificationResult.confidence,
      reasoning: classificationResult.reasoning,
      status: "classified",
      source: "manual_entry",
      createdAt: now,
      updatedAt: now
    };

    await this.db.put(newRecord);
    await this.reloadRecords();
    this.setActiveRecord(id);
    return newRecord;
  }

  async updateRecord(id, updates) {
    const existing = await this.db.get(id);
    if (!existing) return null;

    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await this.db.put(updated);
    await this.reloadRecords();
    if (this.activeRecordId === id) {
      this.notify("active_record_changed", updated);
    }
    return updated;
  }

  async resetToSeed() {
    await this.db.reset();
    await this.reloadRecords();
    this.activeRecordId = null;
    this.notify("reset_to_seed", null);
  }

  exportDataAsJSON() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      exportedAt: new Date().toISOString(),
      recordCount: this.records.length,
      records: this.records
    }, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `nexuscore_thermal_export_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }
}

// Global Single Instance
window.NexusApp = new ApplicationStore();
