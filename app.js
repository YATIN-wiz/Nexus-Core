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
    "id": "291492d8-9761-4403-9b3f-765428daa591",
    "locationLabel": "Unnamed facility",
    "latitude": 22.33992,
    "longitude": 69.85526,
    "detectedAt": "2026-09-29T21:38:00+00:00",
    "frp": 1.66,
    "nearestIndustrialDistM": 580.9,
    "osmTag": "landuse=industrial",
    "source": "seed_import",
    "status": "classified",
    "createdAt": "2026-10-04T14:03:04.142653+00:00",
    "updatedAt": "2026-10-04T14:03:04.142653+00:00",
    "recurrenceCount": 3,
    "landCoverClass": "built-up",
    "classification": "industrial_fire",
    "confidence": 0.75,
    "reasoning": [
      "Land cover: built-up",
      "Distance to nearest industrial polygon: 581m",
      "Recurrence: 3 (low-moderate)"
    ]
  },
  {
    "id": "78653987-ae86-450e-b4f4-9a002a6b9273",
    "locationLabel": "Cluster 8 and Cluster 9 Coal Mines",
    "latitude": 23.73756,
    "longitude": 86.4333,
    "detectedAt": "2026-10-04T07:33:00+00:00",
    "frp": 10.27,
    "nearestIndustrialDistM": 871.7,
    "osmTag": "landuse=quarry",
    "source": "seed_import",
    "status": "classified",
    "createdAt": "2026-10-04T14:03:22.501606+00:00",
    "updatedAt": "2026-10-04T14:03:22.501606+00:00",
    "recurrenceCount": 25,
    "landCoverClass": "built-up",
    "classification": "industrial_fire",
    "confidence": 0.75,
    "reasoning": [
      "Land cover: built-up",
      "Distance to nearest industrial polygon: 872m",
      "Recurrence: 25 (low-moderate)"
    ]
  },
  {
    "id": "4e2bbbef-e57f-4c85-9ea8-2394e82f60ae",
    "locationLabel": "Unnamed facility",
    "latitude": 21.794,
    "longitude": 72.64848,
    "detectedAt": "2026-10-02T20:42:00+00:00",
    "frp": 4.07,
    "nearestIndustrialDistM": 188.6,
    "osmTag": "landuse=industrial",
    "source": "seed_import",
    "status": "classified",
    "createdAt": "2026-10-04T14:04:38.398835+00:00",
    "updatedAt": "2026-10-04T14:04:38.398835+00:00",
    "recurrenceCount": 4,
    "landCoverClass": "built-up",
    "classification": "industrial_fire",
    "confidence": 0.75,
    "reasoning": [
      "Land cover: built-up",
      "Distance to nearest industrial polygon: 189m",
      "Recurrence: 4 (low-moderate)"
    ]
  },
  {
    "id": "dd4a2f7b-8152-4e05-b1c7-e465a48de44e",
    "locationLabel": "Unnamed facility",
    "latitude": 22.35922,
    "longitude": 82.30325,
    "detectedAt": "2026-09-29T07:29:00+00:00",
    "frp": 5.29,
    "nearestIndustrialDistM": 948.3,
    "osmTag": "landuse=quarry",
    "source": "seed_import",
    "status": "classified",
    "createdAt": "2026-10-04T14:04:54.086226+00:00",
    "updatedAt": "2026-10-04T14:04:54.086226+00:00",
    "recurrenceCount": 19,
    "landCoverClass": "built-up",
    "classification": "industrial_fire",
    "confidence": 0.75,
    "reasoning": [
      "Land cover: built-up",
      "Distance to nearest industrial polygon: 948m",
      "Recurrence: 19 (low-moderate)"
    ]
  },
  {
    "id": "2c2f0ca5-81d5-475a-b12b-97f8fbde0eee",
    "locationLabel": "Unnamed facility",
    "latitude": 23.67829,
    "longitude": 86.39813,
    "detectedAt": "2026-10-04T07:33:00+00:00",
    "frp": 10.35,
    "nearestIndustrialDistM": 1065.3,
    "osmTag": "landuse=quarry",
    "source": "seed_import",
    "status": "classified",
    "createdAt": "2026-10-04T14:03:22.148577+00:00",
    "updatedAt": "2026-10-04T14:03:22.148577+00:00",
    "recurrenceCount": 44,
    "landCoverClass": "bare/mining",
    "classification": "mining",
    "confidence": 0.68,
    "reasoning": [
      "Land cover: bare/mining",
      "Distance to nearest industrial tag: 1065m"
    ]
  },
  {
    "id": "631fb1e9-606a-4447-8b27-68a382ebda72",
    "locationLabel": "Unnamed facility",
    "latitude": 22.35602,
    "longitude": 82.30412,
    "detectedAt": "2026-09-29T19:55:00+00:00",
    "frp": 1.63,
    "nearestIndustrialDistM": 1110.1,
    "osmTag": "landuse=quarry",
    "source": "seed_import",
    "status": "classified",
    "createdAt": "2026-10-04T14:04:54.086226+00:00",
    "updatedAt": "2026-10-04T14:04:54.086226+00:00",
    "recurrenceCount": 19,
    "landCoverClass": "bare/mining",
    "classification": "mining",
    "confidence": 0.68,
    "reasoning": [
      "Land cover: bare/mining",
      "Distance to nearest industrial tag: 1110m"
    ]
  },
  {
    "id": "a67140b2-0527-4da0-81e1-a7e567b98bb5",
    "locationLabel": "Unnamed facility",
    "latitude": 20.88697,
    "longitude": 84.9801,
    "detectedAt": "2026-10-04T07:33:00+00:00",
    "frp": 3.92,
    "nearestIndustrialDistM": 1062.2,
    "osmTag": "landuse=industrial",
    "source": "seed_import",
    "status": "classified",
    "createdAt": "2026-10-04T14:05:41.713856+00:00",
    "updatedAt": "2026-10-04T14:05:41.713856+00:00",
    "recurrenceCount": 16,
    "landCoverClass": "bare/mining",
    "classification": "mining",
    "confidence": 0.68,
    "reasoning": [
      "Land cover: bare/mining",
      "Distance to nearest industrial tag: 1062m"
    ]
  },
  {
    "id": "c9963fbd-9623-4e5c-94a0-5e633aee3df0",
    "locationLabel": "Unnamed facility",
    "latitude": 23.71351,
    "longitude": 86.4496,
    "detectedAt": "2026-10-04T07:33:00+00:00",
    "frp": 4.81,
    "nearestIndustrialDistM": 2248.8,
    "osmTag": "landuse=quarry",
    "source": "seed_import",
    "status": "classified",
    "createdAt": "2026-10-04T14:03:22.406491+00:00",
    "updatedAt": "2026-10-04T14:03:22.406491+00:00",
    "recurrenceCount": 22,
    "landCoverClass": "bare/mining",
    "classification": "mining",
    "confidence": 0.68,
    "reasoning": [
      "Land cover: bare/mining",
      "Distance to nearest industrial tag: 2249m"
    ]
  },
  {
    "id": "ea163802-dcef-4bb3-abc2-a0ec93cd9879",
    "locationLabel": "Unnamed facility",
    "latitude": 23.68431,
    "longitude": 86.39316,
    "detectedAt": "2026-10-04T07:33:00+00:00",
    "frp": 5.73,
    "nearestIndustrialDistM": 249.5,
    "osmTag": "landuse=quarry",
    "source": "seed_import",
    "status": "classified",
    "createdAt": "2026-10-04T14:03:22.299511+00:00",
    "updatedAt": "2026-10-04T14:03:22.299511+00:00",
    "recurrenceCount": 38,
    "landCoverClass": "built-up",
    "classification": "gas_flare",
    "confidence": 0.82,
    "reasoning": [
      "Recurrence: 38 nearby detections in dataset window",
      "Distance to nearest industrial polygon: 250m",
      "FRP: 5.7MW (moderate, consistent with flare)"
    ]
  },
  {
    "id": "eebbe6a4-fd3d-4963-ab9d-bfd93ba42af3",
    "locationLabel": "Bhubhaneshwari coal mine",
    "latitude": 20.96978,
    "longitude": 85.17412,
    "detectedAt": "2026-10-04T07:33:00+00:00",
    "frp": 9.65,
    "nearestIndustrialDistM": 423.6,
    "osmTag": "landuse=quarry",
    "source": "seed_import",
    "status": "classified",
    "createdAt": "2026-10-04T14:05:41.754841+00:00",
    "updatedAt": "2026-10-04T14:05:41.754841+00:00",
    "recurrenceCount": 94,
    "landCoverClass": "built-up",
    "classification": "gas_flare",
    "confidence": 0.82,
    "reasoning": [
      "Recurrence: 94 nearby detections in dataset window",
      "Distance to nearest industrial polygon: 424m",
      "FRP: 9.7MW (moderate, consistent with flare)"
    ]
  },
  {
    "id": "69ee01ca-6851-4bb6-adde-d235075e756f",
    "locationLabel": "Unnamed facility",
    "latitude": 23.6854,
    "longitude": 86.39377,
    "detectedAt": "2026-09-29T19:55:00+00:00",
    "frp": 2.29,
    "nearestIndustrialDistM": 163.2,
    "osmTag": "landuse=quarry",
    "source": "seed_import",
    "status": "classified",
    "createdAt": "2026-10-04T14:03:25.022770+00:00",
    "updatedAt": "2026-10-04T14:03:25.022770+00:00",
    "recurrenceCount": 35,
    "landCoverClass": "built-up",
    "classification": "gas_flare",
    "confidence": 0.82,
    "reasoning": [
      "Recurrence: 35 nearby detections in dataset window",
      "Distance to nearest industrial polygon: 163m",
      "FRP: 2.3MW (moderate, consistent with flare)"
    ]
  },
  {
    "id": "64713b4e-53ba-4170-bae4-3663bb474c60",
    "locationLabel": "Bhubhaneshwari coal mine",
    "latitude": 20.96909,
    "longitude": 85.17435,
    "detectedAt": "2026-09-29T07:29:00+00:00",
    "frp": 9.73,
    "nearestIndustrialDistM": 494.4,
    "osmTag": "landuse=quarry",
    "source": "seed_import",
    "status": "classified",
    "createdAt": "2026-10-04T14:05:41.838273+00:00",
    "updatedAt": "2026-10-04T14:05:41.838273+00:00",
    "recurrenceCount": 93,
    "landCoverClass": "built-up",
    "classification": "gas_flare",
    "confidence": 0.82,
    "reasoning": [
      "Recurrence: 93 nearby detections in dataset window",
      "Distance to nearest industrial polygon: 494m",
      "FRP: 9.7MW (moderate, consistent with flare)"
    ]
  }
];

// ============================================================================
// 1. INDEXEDDB PERSISTENCE LAYER (NexusCoreDB)
// ============================================================================
const DB_NAME = "NexusCoreDB";
const DB_VERSION = 1;
const STORE_NAME = "thermalRecords";
const REVIEW_CONFIDENCE_THRESHOLD = 0.5;

function isReviewQueueRecord(record) {
  return record.classification === "unclassified" || record.confidence < REVIEW_CONFIDENCE_THRESHOLD;
}

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
        // Seed only on the first installation. An intentionally cleared store must stay empty.
        const count = await this.count();
        const seedInstalled = localStorage.getItem("nexuscore_seed_installed") === "true";
        if (count === 0 && !seedInstalled) {
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

  async clearAll() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      store.clear();
      transaction.oncomplete = () => resolve(true);
      transaction.onerror = () => reject(transaction.error);
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
function classifyThermalAnomaly({ frp, recurrenceCount, nearestIndustrialDistM, landCoverClass, osmTag }) {
  const reasoning = [];
  const dist = nearestIndustrialDistM;
  const recurrence = recurrenceCount;
  const land_cover = landCoverClass;
  const isFarFromResidential = !osmTag || !/residential|housing|settlement/i.test(osmTag);

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
  if (dist !== null && dist < 1000 && land_cover === "built-up" && recurrence <= 20) {
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
  if (land_cover === "bare/mining" && isFarFromResidential) {
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
    this.role = "analyst";
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

  async getReviewQueueRecords() {
    const records = await this.db.getAll();
    return records
      .filter(isReviewQueueRecord)
      .sort((a, b) => a.confidence - b.confidence || a.detectedAt.localeCompare(b.detectedAt));
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
      classification: "unclassified",
      confidence: 0,
      reasoning: ["Awaiting real-time classification pipeline"],
      status: "pending",
      source: "manual_entry",
      createdAt: now,
      updatedAt: now
    };

    await this.db.put(newRecord);
    await this.reloadRecords();
    this.setActiveRecord(id);
    return newRecord;
  }

  async classifyRecord(id) {
    const existing = await this.db.get(id);
    if (!existing) return null;

    const classificationResult = classifyThermalAnomaly({
      frp: existing.frp,
      recurrenceCount: existing.recurrenceCount,
      nearestIndustrialDistM: existing.nearestIndustrialDistM,
      landCoverClass: existing.landCoverClass,
      osmTag: existing.osmTag
    });

    const updated = {
      ...existing,
      ...classificationResult,
      status: "classified",
      updatedAt: new Date().toISOString()
    };

    await this.db.put(updated);
    await this.reloadRecords();
    if (this.activeRecordId === id) this.notify("active_record_changed", updated);
    this.notify("record_classified", updated);
    return updated;
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
    if (updates.classification !== undefined) this.notify("record_reclassified", updated);
    return updated;
  }

  async updateRecordAndReclassify(id, fieldUpdates, reclassify = true) {
    const existing = await this.db.get(id);
    if (!existing) return null;

    let classificationResult = null;
    if (reclassify) {
      classificationResult = classifyThermalAnomaly({
        frp: fieldUpdates.frp !== undefined ? fieldUpdates.frp : existing.frp,
        recurrenceCount: fieldUpdates.recurrenceCount !== undefined ? fieldUpdates.recurrenceCount : existing.recurrenceCount,
        nearestIndustrialDistM: fieldUpdates.nearestIndustrialDistM !== undefined ? fieldUpdates.nearestIndustrialDistM : existing.nearestIndustrialDistM,
        landCoverClass: fieldUpdates.landCoverClass !== undefined ? fieldUpdates.landCoverClass : existing.landCoverClass,
        osmTag: fieldUpdates.osmTag !== undefined ? fieldUpdates.osmTag : existing.osmTag
      });
    }

    const updated = {
      ...existing,
      ...fieldUpdates,
      ...(classificationResult ? {
        classification: classificationResult.classification,
        confidence: classificationResult.confidence,
        reasoning: classificationResult.reasoning
      } : {}),
      updatedAt: new Date().toISOString()
    };

    await this.db.put(updated);
    await this.reloadRecords();
    if (this.activeRecordId === id) {
      this.notify("active_record_changed", updated);
    }
    if (classificationResult) this.notify("record_reclassified", updated);
    return updated;
  }

  async deleteRecord(id) {
    await this.db.delete(id);
    if (this.activeRecordId === id) {
      this.activeRecordId = null;
      this.notify("active_record_changed", null);
    }
    await this.reloadRecords();
    this.notify("record_deleted", id);
    return true;
  }

  async clearAllData() {
    await this.db.clearAll();
    this.activeRecordId = null;
    await this.reloadRecords();
    this.notify("all_data_cleared", null);
    this.notify("active_record_changed", null);
    return true;
  }

  async resetToSeed() {
    await this.db.reset();
    await this.reloadRecords();
    this.activeRecordId = null;
    this.notify("reset_to_seed", null);
    this.notify("active_record_changed", null);
  }

  async importJSONData(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      const recordsToImport = Array.isArray(parsed) ? parsed : (parsed.records || []);
      if (!recordsToImport.length) throw new Error("No valid records found in JSON structure");

      for (const rec of recordsToImport) {
        if (rec.id && typeof rec.latitude === "number" && typeof rec.longitude === "number") {
          await this.db.put(rec);
        }
      }
      await this.reloadRecords();
      return recordsToImport.length;
    } catch (err) {
      console.error("[DB Import Error]", err);
      throw err;
    }
  }

  getExportPayload() {
    return {
      exportedAt: new Date().toISOString(),
      recordCount: this.records.length,
      dataSources: ["NASA FIRMS", "OpenStreetMap Overpass API"],
      records: this.records
    };
  }

  getExportJSON() {
    return JSON.stringify(this.getExportPayload(), null, 2);
  }

  downloadExport() {
    const blob = new Blob([this.getExportJSON()], { type: "application/json;charset=utf-8" });
    const downloadAnchor = document.createElement("a");
    const objectUrl = URL.createObjectURL(blob);
    downloadAnchor.href = objectUrl;
    downloadAnchor.download = `nexuscore_thermal_export_${Date.now()}.json`;
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    URL.revokeObjectURL(objectUrl);
  }
}

// Global Single Instance
window.NexusApp = new ApplicationStore();
