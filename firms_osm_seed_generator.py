"""
FIRMS + OSM Seed Data Generator
================================
SIH 2026 — AI-Based Detection and Classification of Industrial Fires
and Persistent Thermal Sources Using NASA FIRMS, OSM & Satellite Data

WHAT THIS SCRIPT DOES
----------------------
1. Downloads real historical thermal hotspot data from NASA FIRMS for a
   chosen bounding box and date range.
2. Queries OpenStreetMap's Overpass API for real industrial infrastructure
   (refineries, power plants, mines, factories) in the same bounding box.
3. Fuses the two datasets:
   - Tags each hotspot with the nearest industrial feature and its distance.
   - Computes a recurrence count (how many times a hotspot appeared within
     ~1km of the same location across the date range).
   - Assigns an approximate land-cover class using a simple heuristic
     (distance-to-industrial + FIRMS hotspot type), since a full land-cover
     raster pipeline is out of scope for a hackathon script. Clearly marked
     as "reference land cover" — swap in ESA WorldCover for a stronger
     version if time allows.
4. Applies the SAME rule-based classifier described in the prototype's
   system prompt, so your seed data already ships with realistic
   classifications and reasoning bullets.
5. Writes a single seedData.json matching the app's thermalRecords schema.

BEFORE YOU RUN THIS
--------------------
1. Get a free FIRMS MAP_KEY (takes ~2 minutes):
   https://firms.modaps.eosdis.nasa.gov/api/map_key/
   Paste it into FIRMS_MAP_KEY below.

2. Install dependencies:
   pip install requests pandas geopy

3. Pick your region. Defaults below are set to the Jamnagar (Gujarat)
   refinery belt — India's largest refining complex, a strong SIH
   demo choice because it has real, dense, well-known industrial thermal
   activity. Alternatives are commented below (Jharia coalfield,
   Angul steel/power belt).

4. Run:
   python firms_osm_seed_generator.py

   Output: ./seedData.json — paste this file's contents directly into
   your prototype's seed data source, or serve it as a static asset.

NOTES ON REALISM
------------------
- FIRMS free archive access covers the last ~2 months of NRT data at
  request time; for older history you'd need the paid/bulk archive
  route (not needed for a hackathon).
- This script makes real network calls to nasa.gov and overpass-api.de.
  If you're running this in a sandboxed/offline environment, run it on
  your own machine instead.
- Overpass is a shared public service — keep bounding boxes small
  (this script's defaults are ~40km x 40km) and don't hammer it with
  repeated runs in a short time window.
"""

import json
import time
import uuid
from datetime import datetime, timezone

import pandas as pd
import requests
from geopy.distance import geodesic

# ─────────────────────────────────────────────────────────────────────────
# CONFIG — edit this section
# ─────────────────────────────────────────────────────────────────────────

FIRMS_MAP_KEY = "53769aa97d61d071eaf0c63eb5e7941d"

# FIRMS source options: VIIRS_SNPP_NRT, VIIRS_NOAA20_NRT, MODIS_NRT
FIRMS_SOURCE = "VIIRS_SNPP_NRT"

# Days of history to pull (FIRMS NRT area API caps each request at 5 days;
# script loops, paging backwards from today, to cover DAY_RANGE_TOTAL)
DAY_RANGE_TOTAL = 60
DAYS_PER_REQUEST = 5  # FIRMS area API hard caps this at 5

# Bounding boxes: west, south, east, north (decimal degrees)
# The script pulls FIRMS + OSM data for EACH box below and merges the
# results, so you get category diversity (industrial, mining, agri,
# forest) instead of one region that's purely industrial.
#
# Defaults cover: Jamnagar refinery belt (dense industrial), Jharia
# coalfield (mining), and a mixed agricultural/forest strip in eastern
# Gujarat (to surface agri_burn / wildfire candidates). Edit freely —
# add, remove, or resize boxes as needed. Keep each box small
# (roughly 40km x 40km or less) to stay polite to the Overpass API.
BBOXES = [
    {
        "west": 69.7, "south": 22.1, "east": 70.3, "north": 22.6,
        "region_label": "Jamnagar Refinery Belt, Gujarat",
    },
    {
        "west": 86.1, "south": 23.6, "east": 86.5, "north": 23.9,
        "region_label": "Jharia Coalfield, Jharkhand",
    },
    {
        "west": 73.4, "south": 22.6, "east": 73.9, "north": 23.0,
        "region_label": "Chhota Udepur Agricultural/Forest Belt, Gujarat",
    },
]

RECURRENCE_RADIUS_M = 1000   # hotspots within this radius = "same source"
INDUSTRIAL_SEARCH_RADIUS_M = 3000  # how far to look for nearest OSM tag

OUTPUT_FILE = "seedData.json"

# ─────────────────────────────────────────────────────────────────────────
# STEP 1 — Pull FIRMS hotspot data
# ─────────────────────────────────────────────────────────────────────────

def fetch_firms_data(bbox):
    """Pull historical FIRMS hotspots for the given bbox, paging backward
    through DAY_RANGE_TOTAL days in DAYS_PER_REQUEST-sized windows using
    the optional end-date parameter (without it, every request just
    returns the same most-recent window)."""
    from datetime import date, timedelta
    from io import StringIO

    all_rows = []
    bbox_str = f"{bbox['west']},{bbox['south']},{bbox['east']},{bbox['north']}"

    days_fetched = 0
    end_date = date.today()

    while days_fetched < DAY_RANGE_TOTAL:
        chunk = min(DAYS_PER_REQUEST, DAY_RANGE_TOTAL - days_fetched)
        end_date_str = end_date.strftime("%Y-%m-%d")
        url = (
            f"https://firms.modaps.eosdis.nasa.gov/api/area/csv/"
            f"{FIRMS_MAP_KEY}/{FIRMS_SOURCE}/{bbox_str}/{chunk}/{end_date_str}"
        )
        print(f"Fetching FIRMS window: {chunk} days ending {end_date_str} -> {url}")
        resp = requests.get(url, timeout=30)
        resp.raise_for_status()

        # FIRMS returns HTTP 200 with a plain-text error message body on
        # bad requests, not always a 4xx — check content before parsing
        stripped = resp.text.strip()
        if stripped.lower().startswith(("invalid", "error", "no data")) or len(stripped) == 0:
            print(f"  Skipping window ({end_date_str}): {stripped[:150]}")
        else:
            df = pd.read_csv(StringIO(resp.text))
            if len(df) > 0:
                all_rows.append(df)
            print(f"  -> {len(df)} rows")

        days_fetched += chunk
        end_date -= timedelta(days=chunk)
        time.sleep(1)  # be polite to the API

    if not all_rows:
        print(
            "  WARNING: no FIRMS data returned for any window in this bbox. "
            "This region will contribute 0 records — that's fine if it's "
            "meant to supply OSM/land-cover diversity only."
        )
        return pd.DataFrame()

    combined = pd.concat(all_rows, ignore_index=True).drop_duplicates()
    print(f"Fetched {len(combined)} raw FIRMS hotspot records total.")
    return combined


# ─────────────────────────────────────────────────────────────────────────
# STEP 2 — Pull OSM industrial infrastructure via Overpass
# ─────────────────────────────────────────────────────────────────────────

def fetch_osm_industrial_features(bbox):
    """Query Overpass for industrial/power/mining features in the given bbox."""
    south, west, north, east = bbox["south"], bbox["west"], bbox["north"], bbox["east"]

    query = f"""
    [out:json][timeout:60];
    (
      node["landuse"="industrial"]({south},{west},{north},{east});
      way["landuse"="industrial"]({south},{west},{north},{east});
      node["man_made"="works"]({south},{west},{north},{east});
      way["man_made"="works"]({south},{west},{north},{east});
      node["power"="plant"]({south},{west},{north},{east});
      way["power"="plant"]({south},{west},{north},{east});
      node["industrial"="oil"]({south},{west},{north},{east});
      way["industrial"="oil"]({south},{west},{north},{east});
      node["landuse"="quarry"]({south},{west},{north},{east});
      way["landuse"="quarry"]({south},{west},{north},{east});
    );
    out center tags;
    """

    print("Querying Overpass API for industrial infrastructure...")
    resp = requests.post(
        "https://overpass-api.de/api/interpreter",
        data={"data": query},
        headers={
            "User-Agent": "SIH2026-ThermalClassifier/1.0 (hackathon prototype; contact: student-project)",
            "Accept": "application/json",
        },
        timeout=90,
    )
    resp.raise_for_status()
    data = resp.json()

    features = []
    for el in data.get("elements", []):
        if el["type"] == "node":
            lat, lon = el.get("lat"), el.get("lon")
        else:  # way — use computed center
            center = el.get("center", {})
            lat, lon = center.get("lat"), center.get("lon")
        if lat is None or lon is None:
            continue

        tags = el.get("tags", {})
        tag_str = next(
            (f"{k}={v}" for k, v in tags.items()
             if k in ("landuse", "man_made", "power", "industrial")),
            "industrial=unspecified",
        )
        features.append({
            "lat": lat,
            "lon": lon,
            "tag": tag_str,
            "name": tags.get("name", "Unnamed facility"),
        })

    print(f"Found {len(features)} OSM industrial features.")
    return features


# ─────────────────────────────────────────────────────────────────────────
# STEP 3 — Fusion: nearest industrial tag, distance, recurrence, land cover
# ─────────────────────────────────────────────────────────────────────────

def nearest_industrial(lat, lon, osm_features):
    if not osm_features:
        return None, None, None
    best = None
    best_dist = float("inf")
    for feat in osm_features:
        d = geodesic((lat, lon), (feat["lat"], feat["lon"])).meters
        if d < best_dist:
            best_dist = d
            best = feat
    return best_dist, best["tag"], best["name"]


def compute_recurrence(records):
    """For each hotspot, count how many other hotspots in the dataset
    fall within RECURRENCE_RADIUS_M of it (a simple proxy for
    'persistent thermal source' vs one-off event)."""
    coords = [(r["latitude"], r["longitude"]) for r in records]
    for i, r in enumerate(records):
        count = 0
        for j, other in enumerate(coords):
            if i == j:
                continue
            if geodesic(coords[i], other).meters <= RECURRENCE_RADIUS_M:
                count += 1
        r["recurrenceCount"] = count
    return records


def approximate_land_cover(dist_to_industrial, frp):
    """Heuristic placeholder for a real land-cover raster (e.g. ESA
    WorldCover). Clearly a simplification — documented as such."""
    if dist_to_industrial is not None and dist_to_industrial < 1000:
        return "built-up"
    if dist_to_industrial is not None and dist_to_industrial < 3000 and frp < 15:
        return "bare/mining"
    if frp > 40:
        return "forest"
    return "cropland"


# ─────────────────────────────────────────────────────────────────────────
# STEP 4 — Rule-based classifier (same logic as the app's Journey B)
# ─────────────────────────────────────────────────────────────────────────

def classify(record):
    reasoning = []
    frp = record["frp"]
    recurrence = record["recurrenceCount"]
    dist = record["nearestIndustrialDistM"]
    land_cover = record["landCoverClass"]

    if recurrence > 20 and dist is not None and dist < 500 and frp < 50:
        reasoning.append(f"Recurrence: {recurrence} nearby detections in dataset window")
        reasoning.append(f"Distance to nearest industrial polygon: {dist:.0f}m")
        reasoning.append(f"FRP: {frp:.1f}MW (moderate, consistent with flare)")
        return "gas_flare", 0.82, reasoning

    if dist is not None and dist < 1000 and land_cover == "built-up":
        reasoning.append(f"Land cover: built-up")
        reasoning.append(f"Distance to nearest industrial polygon: {dist:.0f}m")
        reasoning.append(f"Recurrence: {recurrence} (low-moderate)")
        return "industrial_fire", 0.75, reasoning

    if land_cover == "bare/mining":
        reasoning.append("Land cover: bare/mining")
        reasoning.append(f"Distance to nearest industrial tag: {dist:.0f}m" if dist else "No nearby industrial tag")
        return "mining", 0.68, reasoning

    if land_cover == "cropland" and recurrence < 5:
        reasoning.append("Land cover: cropland")
        reasoning.append(f"Recurrence: {recurrence} (low, short-duration event)")
        return "agri_burn", 0.6, reasoning

    if land_cover == "forest" and (dist is None or dist > 3000):
        reasoning.append("Land cover: forest")
        reasoning.append("No nearby industrial infrastructure tag")
        return "wildfire", 0.7, reasoning

    reasoning.append("No rule matched cleanly — flagged for manual review")
    return "unclassified", 0.35, reasoning


# ─────────────────────────────────────────────────────────────────────────
# MAIN PIPELINE
# ─────────────────────────────────────────────────────────────────────────

def process_bbox(bbox):
    """Fetch + fuse FIRMS and OSM data for a single bounding box. Returns
    a list of partially-built records (no recurrence/classification yet —
    those run globally across all regions combined, since recurrence in
    particular only makes sense computed within each region, handled
    separately below)."""
    print(f"\n=== Region: {bbox['region_label']} ===")
    firms_df = fetch_firms_data(bbox)
    if firms_df.empty:
        return []

    osm_features = fetch_osm_industrial_features(bbox)

    records = []
    for _, row in firms_df.iterrows():
        lat, lon = float(row["latitude"]), float(row["longitude"])
        frp = float(row.get("frp", 0) or 0)
        acq_date = str(row.get("acq_date", ""))
        acq_time = str(row.get("acq_time", "0000")).zfill(4)
        try:
            detected_at = datetime.strptime(
                f"{acq_date} {acq_time}", "%Y-%m-%d %H%M"
            ).replace(tzinfo=timezone.utc).isoformat()
        except ValueError:
            detected_at = datetime.now(timezone.utc).isoformat()

        dist, tag, facility_name = nearest_industrial(lat, lon, osm_features)
        records.append({
            "id": str(uuid.uuid4()),
            "locationLabel": facility_name if dist and dist < INDUSTRIAL_SEARCH_RADIUS_M
                             else bbox["region_label"],
            "sourceRegion": bbox["region_label"],  # used to scope recurrence per-region
            "latitude": lat,
            "longitude": lon,
            "detectedAt": detected_at,
            "frp": round(frp, 2),
            "nearestIndustrialDistM": round(dist, 1) if dist else None,
            "osmTag": tag,
            "source": "seed_import",
            "status": "pending",
            "createdAt": datetime.now(timezone.utc).isoformat(),
            "updatedAt": datetime.now(timezone.utc).isoformat(),
        })

    return records


def main():
    if FIRMS_MAP_KEY == "PASTE_YOUR_FIRMS_MAP_KEY_HERE":
        raise SystemExit(
            "Set FIRMS_MAP_KEY at the top of this script first. "
            "Get one free at https://firms.modaps.eosdis.nasa.gov/api/map_key/"
        )

    all_records = []
    for bbox in BBOXES:
        all_records.extend(process_bbox(bbox))
        time.sleep(2)  # brief pause between regions, polite to both APIs

    if not all_records:
        raise RuntimeError(
            "No FIRMS data returned across ANY configured bounding box. "
            "Check your MAP_KEY, date range, and that at least one bbox "
            "covers an area with real thermal activity."
        )

    print(f"\nCombined total across all regions: {len(all_records)} raw records")

    # Recurrence is computed PER REGION (a hotspot in Jamnagar shouldn't
    # count as "recurring" against one in Jharia 1000+ km away)
    print("Computing recurrence counts (scoped per region)...")
    by_region = {}
    for r in all_records:
        by_region.setdefault(r["sourceRegion"], []).append(r)
    for region, recs in by_region.items():
        compute_recurrence(recs)

    print("Assigning approximate land cover and running classifier...")
    for r in all_records:
        r["landCoverClass"] = approximate_land_cover(r["nearestIndustrialDistM"], r["frp"])
        classification, confidence, reasoning = classify(r)
        r["classification"] = classification
        r["confidence"] = confidence
        r["reasoning"] = reasoning
        r["status"] = "classified"
        del r["sourceRegion"]  # internal-only field, drop before export

    # Trim to a manageable, demo-friendly seed size, keeping variety
    # across classifications if possible
    by_class = {}
    for r in all_records:
        by_class.setdefault(r["classification"], []).append(r)

    final_seed = []
    for cls, items in by_class.items():
        final_seed.extend(items[:4])  # up to 4 per class for variety
    final_seed = final_seed[:18]  # slightly higher cap since multi-region

    output = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "regions": [b["region_label"] for b in BBOXES],
        "dataSources": ["NASA FIRMS", "OpenStreetMap Overpass API"],
        "recordCount": len(final_seed),
        "records": final_seed,
    }

    with open(OUTPUT_FILE, "w") as f:
        json.dump(output, f, indent=2)

    print(f"\nDone. Wrote {len(final_seed)} fused, classified records to {OUTPUT_FILE}")
    print("Classification breakdown:")
    for cls, items in by_class.items():
        print(f"  {cls}: {len(items)} raw matches ({min(len(items), 4)} kept in seed)")


if __name__ == "__main__":
    main()