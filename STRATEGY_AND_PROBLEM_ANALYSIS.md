# AI-Based Detection & Classification of Industrial Fires and Persistent Thermal Sources
> **Problem Statement & Strategic Architecture Documentation**
> **Project Directory:** `Sih_2026`  
> **Source Challenge:** AI-Based Detection and Classification of Industrial Fires and Persistent Thermal Sources Using NASA FIRMS, OSM & Satellite Data.

---

## 1. Executive Summary & 10-Second Pitch

> *"NASA FIRMS tells you where heat is, but can’t tell a routine refinery flare from an exploding chemical depot or an encroaching forest fire. We are building an AI geospatial engine that fuses NASA thermal telemetry with OpenStreetMap infrastructure footprints, ESA land-cover data, and Sentinel-2 satellite imagery to instantly filter out routine operational heat, classify fire types, and alert disaster commanders to industrial emergencies before ground alarms even sound."*

---

## 2. Core Problem Decomposition

### A. Who Is Bleeding From This Problem?
1. **Regional Emergency & Disaster Response Commanders (NDRF, State Fire Services, Petrochemical Corridor Authorities):**
   * *The Pain:* Thermal alerts in FIRMS provide coordinates and heat values with zero semantic context. Responders cannot tell whether a 380 K hotspot is a routine flare or an atmospheric storage tank rupture heading toward a Boiling Liquid Expanding Vapor Explosion (BLEVE). Dispatching municipal water trucks into a chemical fire is fatal; delaying HazMat mobilization causes catastrophic industrial loss.
2. **Environmental Enforcement & Compliance Regulators (Pollution Control Boards, EPA, ESG Auditors):**
   * *The Pain:* Non-compliant facilities exploit the FIRMS blindspot by conducting illegal nighttime flaring, toxic waste burning, and slag dumping, knowing satellite detections will blend into agricultural or background noise.
3. **Critical Infrastructure Risk Managers (Refineries, LNG Terminals, Chemical Parks):**
   * *The Pain:* Lack of automated warning when external wildfires or agricultural residue burns encroach on plant boundaries and high-pressure fuel tanks.

### B. Root Cause
* **Sensor-Context Decoupling:** Thermal sensors (VIIRS/MODIS) measure Mid-Wave & Long-Wave Infrared radiance (MWIR/LWIR) to calculate Fire Radiative Power (FRP) and Brightness Temperature. A 50 MW thermal reading looks identical whether it is a burning wheat field, a controlled flare stack, or an exploding chemical reactor.
* **Lack of Historical Baselines (Zero-Memory Monitoring):** Standard fire feeds treat every satellite pass as an isolated event, lacking awareness of historical operational heat signatures for specific sites.
* **Geospatial Data Siloing:** Thermal telemetry (FIRMS), land cover (ESA WorldCover), asset boundaries (OSM), and optical/SWIR confirmation (Sentinel-2) exist in separate systems without real-time automated fusion.

### C. Timing & Urgency
* **Sensor Revisit Cadence:** VIIRS passes across Suomi-NPP, NOAA-20, and NOAA-21 provide 4+ thermal observations every 24 hours. Combined with Sentinel-2/Landsat passes, data is abundant, but analytical pipelines remain manual.
* **Industrial Densification:** Petrochemical corridors, battery gigafactories, and LNG facilities sit closer than ever to populated areas.
* **Global Mandates:** World Bank Zero Routine Flaring by 2030 and stringent environmental regulations demand remote, third-party satellite verification.

### D. Standalone Product Defensibility
* **Not Just a Wrapper:** Transforms raw, uncontextualized satellite heat alerts into actionable, decision-grade intelligence.
* **Markets:**
  1. *Public Safety & Emergency Response:* Real-time dual-use surveillance for critical infrastructure.
  2. *Reinsurance & Underwriting (Swiss Re, Munich Re):* Real-time risk modeling and instant post-disaster claim validation.
  3. *Environmental Compliance:* Remote detection of unauthorized industrial emissions and flaring.

---

## 3. Solution Space Analysis (15 Approaches Evaluated)

| # | Approach | Impact | Effort | Decision |
|---|---|:---:|:---:|---|
| 1 | Static Buffer / Geofence Intersect (OSM + FIRMS) | Medium | Low | Kept as basic check |
| 2 | Rule-Based Filtering of Agricultural Fires | Low | Low | **CUT** (Too brittle in mixed regions) |
| 3 | Spatiotemporal Heat Signature Baseline (DBSCAN Clustering) | **High** | Medium | **KEPT (Core Lever 1)** |
| 4 | Multi-Modal Feature Fusion Classifier (LightGBM/XGBoost) | **High** | Low | **KEPT (Core Lever 2)** |
| 5 | Automated Sentinel-2 SWIR/RGB Snippet Verification | **High** | Medium | **KEPT (Core Lever 3)** |
| 6 | Crowd-Sourced Citizen / Worker Incident Reporting Mobile App | Low | High | **CUT** (Unusable during major disasters) |
| 7 | Atmospheric Plume & Gas Dispersion Simulation | High | Medium | Secondary Enhancement |
| 8 | SAR Coherence Tracking (Sentinel-1 InSAR) | Medium | High | Deferred (High latency) |
| 9 | Full CV Segmentation on Multi-Spectral Tiles (U-Net) | Medium | High | Deferred (Cloud cover & latency) |
| 10 | Automated HazMat Incident Action Card Generator | **High** | Low | **KEPT (Core Lever 4)** |
| 11 | Drone / Autonomous UAV Dispatch Simulator | Low | Medium | **CUT** (Hardware distraction) |
| 12 | Social Media / News Sentiment NLP Scraper | Low | Medium | **CUT** (High noise, late arrival) |
| 13 | Interactive 3D Digital Twin GIS Map (Deck.gl / MapLibre) | **High** | Medium | **KEPT (Core Lever 4)** |
| 14 | Blockchain Audit Log of Flaring Violations | Low | High | **CUT** (Unnecessary bloat) |
| 15 | Thermal Anomaly Delta Detector ($\Delta \text{FRP}$) | **High** | Low | **KEPT (Core Lever 1)** |

---

## 4. The 4 Core Levers (The Winning Hackathon Architecture)

```
                     [ NASA FIRMS Stream (VIIRS 375m / MODIS 1km) ]
                                            │
                                            ▼
                     ┌─────────────────────────────────────────────┐
                     │     Lever 1: Spatial & Baseline Profiler    │
                     │  - DBSCAN historical clustering (3-5 years) │
                     │  - Persistent source signature registry     │
                     │  - Anomaly Delta (Current FRP vs Baseline)  │
                     └──────────────────────┬──────────────────────┘
                                            │
                                            ▼
                     ┌─────────────────────────────────────────────┐
                     │     Lever 2: Multi-Modal AI Classifier      │
                     │  - LightGBM / XGBoost Feature Fusion        │
                     │  - Telemetry + ESA WorldCover (10m) + OSM   │
                     │  - Classes: Industrial Accidental, Flare,   │
                     │    Agricultural, Wildfire, Mining           │
                     └──────────────────────┬──────────────────────┘
                                            │
                                            ▼
                     ┌─────────────────────────────────────────────┐
                     │   Lever 3: Sentinel-2 Optical/SWIR Engine   │
                     │  - Band 12 & 11 SWIR thermal confirmation   │
                     │  - Normalized Burn Ratio (NBR)              │
                     │  - Wind-driven smoke plume vectors          │
                     └──────────────────────┬──────────────────────┘
                                            │
                                            ▼
                     ┌─────────────────────────────────────────────┐
                     │   Lever 4: Decision-Grade GIS Command Map   │
                     │  - Interactive MapLibre GL / Deck.gl UI     │
                     │  - Real-time layers & time-series slider    │
                     │  - Automated HazMat Incident Action Cards   │
                     └─────────────────────────────────────────────┘
```

1. **Spatial Memory & Anomaly Delta Engine:**
   * Distinguishes routine operations from emergencies by evaluating deviations from historical baselines ($\Delta \text{FRP} = \text{Current FRP} - \text{Baseline FRP}$) and thermal centroid shifts.
2. **Multi-Modal Tabular/Geospatial Classifier:**
   * Rapid sub-second classification across five core classes: *Industrial Fire (Accidental), Industrial Flare/Smelter (Persistent/Routine), Wildfire, Agricultural Burn, Mining Activity*.
3. **High-Resolution Sentinel-2 SWIR/RGB Verification:**
   * Automatically verifies high-risk anomalies against optical/SWIR data, eliminating optical false positives and computing smoke plume vectors.
4. **Operational GIS Command Map & HazMat Action Cards:**
   * Delivers an incident-commander dashboard with asset boundaries, plume dispersion directions, and actionable containment guidance (e.g., foam vs. dry chemical recommendations).

---

## 5. Core Guiding Principle

> *"Clarity doesn't come from how many data layers you can stack on a map; it comes from having the discipline to remove every feature that doesn't help an incident commander make a go/no-go decision in under 30 seconds."*
