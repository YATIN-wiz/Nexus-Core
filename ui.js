/**
 * NEXUS CORE — User Interface & Command Control Center
 * SIH 2026: AI-Based Detection & Classification of Industrial Fires & Persistent Thermal Sources
 * 
 * Module: ui.js
 * Architecture: Real-time telemetry cards, interactive canvas charts, bottom drawer table with full CRUD,
 *               HazMat action cards, manual ingestion modal, edit modal with re-classification,
 *               and settings modal with Reload Seed / Clear All controls.
 */

class UIEngine {
  constructor() {
    this.bottomDrawerExpanded = false;
    this.swirAnimationId = null;
    this.editingRecordId = null;
    this.pipelineRecordId = null;
    this.pipelineTimer = null;
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
      } else if (event === "all_data_cleared") {
        this.renderIncidentPanel(null);
      }
    });

    console.log("[UI] Interface engine initialized with Full CRUD.");
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
    const roleMode = document.getElementById("role-mode");
    if (roleMode) {
      roleMode.value = window.NexusApp.role;
      roleMode.addEventListener("change", (event) => {
        window.NexusApp.role = event.target.value;
        window.NexusApp.notify("records_updated", window.NexusApp.records);
        this.renderIncidentPanel(window.NexusApp.getActiveRecord());
      });
    }

    const sortRecords = document.getElementById("sort-records");
    if (sortRecords) {
      sortRecords.addEventListener("change", (event) => {
        const [sortBy, direction] = event.target.value.split(":");
        window.NexusApp.sortBy = sortBy;
        window.NexusApp.sortDesc = direction === "desc";
        window.NexusApp.notify("records_updated", window.NexusApp.records);
      });
    }

    // Filter Pills
    document.querySelectorAll(".filter-pill").forEach(pill => {
      pill.addEventListener("click", () => {
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

    const btnOpenSettings = document.getElementById("btn-open-settings");
    if (btnOpenSettings) {
      btnOpenSettings.addEventListener("click", () => this.openSettingsModal());
    }

    const btnExport = document.getElementById("btn-export-data");
    if (btnExport) {
      btnExport.addEventListener("click", () => this.openExportViewer());
    }

    // Manual Modal Inputs Live Classifier Preview
    ["manual-lat", "manual-lon", "manual-frp", "manual-recurrence", "manual-dist", "manual-landcover", "manual-tag", "manual-detected-at"].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener("input", () => {
          this.validateManualField(id);
          this.updateManualLivePreview();
        });
      }
    });

    ["manual-recurring", "manual-near-industrial"].forEach(id => {
      const toggle = document.getElementById(id);
      if (toggle) toggle.addEventListener("change", () => this.updateManualConditionalFields());
    });

    const pipelineLatency = document.getElementById("pipeline-latency");
    if (pipelineLatency) pipelineLatency.addEventListener("input", () => this.updatePipelineLatencyLabel());
    const pipelineBack = document.getElementById("btn-pipeline-back");
    if (pipelineBack) pipelineBack.addEventListener("click", () => this.closePipeline());
    const pipelineMap = document.getElementById("btn-pipeline-map");
    if (pipelineMap) pipelineMap.addEventListener("click", () => {
      const record = window.NexusApp.getActiveRecord();
      this.closePipeline();
      if (record) window.NexusGIS.panToRecord(record);
    });

    // Save Manual Record Button (Create - Journey A)
    const btnSaveManual = document.getElementById("btn-save-manual");
    if (btnSaveManual) {
      btnSaveManual.addEventListener("click", () => this.handleSaveManual());
    }

    // Edit Modal Inputs Live Classifier Preview
    ["edit-frp", "edit-recurrence", "edit-dist", "edit-landcover"].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener("input", () => this.updateEditLivePreview());
      }
    });

    // Save Edited Record Button (Update)
    const btnSaveEdit = document.getElementById("btn-save-edit");
    if (btnSaveEdit) {
      btnSaveEdit.addEventListener("click", () => this.handleSaveEdit());
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

    // Settings Modal Action Controls
    const btnSettingsReloadSeed = document.getElementById("btn-settings-reload-seed");
    if (btnSettingsReloadSeed) {
      btnSettingsReloadSeed.addEventListener("click", async () => {
        if (confirm("Reload seed data? This will re-import the original 12 NASA FIRMS + OSM seed records, overwriting any manual edits.")) {
          await window.NexusApp.resetToSeed();
          this.showToast("Original seed data restored (12 records active).");
          this.closeAllModals();
        }
      });
    }

    const btnSettingsClearAll = document.getElementById("btn-settings-clear-all");
    if (btnSettingsClearAll) {
      btnSettingsClearAll.addEventListener("click", async () => {
        if (confirm("WARNING: Clear ALL thermal records? This will delete everything from IndexedDB and leave the system empty until new records are added or seed is reloaded.")) {
          await window.NexusApp.clearAllData();
          this.showToast("All records cleared from IndexedDB.");
          this.closeAllModals();
        }
      });
    }

    const btnSettingsExport = document.getElementById("btn-settings-export");
    if (btnSettingsExport) {
      btnSettingsExport.addEventListener("click", () => this.openExportViewer());
    }

    const btnDownloadExport = document.getElementById("btn-download-export");
    if (btnDownloadExport) {
      btnDownloadExport.addEventListener("click", () => {
        window.NexusApp.downloadExport();
        this.showToast("Full IndexedDB dataset downloaded as JSON.");
      });
    }

    const btnCopyExport = document.getElementById("btn-copy-export");
    if (btnCopyExport) btnCopyExport.addEventListener("click", () => this.copyExportToClipboard());

    const btnOpenAbout = document.getElementById("btn-open-about");
    if (btnOpenAbout) btnOpenAbout.addEventListener("click", () => {
      document.getElementById("modal-about").classList.add("active");
    });

    const inputSettingsImport = document.getElementById("settings-import-file");
    if (inputSettingsImport) {
      inputSettingsImport.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const count = await window.NexusApp.importJSONData(event.target.result);
            this.showToast(`Imported ${count} records into IndexedDB.`);
            this.closeAllModals();
          } catch (err) {
            alert("Failed to import JSON file. Please ensure valid schema structure.");
          }
        };
        reader.readAsText(file);
      });
    }
  }

  closeAllModals() {
    document.querySelectorAll(".modal-overlay").forEach(m => m.classList.remove("active"));
    if (this.swirAnimationId) cancelAnimationFrame(this.swirAnimationId);
  }

  renderInitialUI() {
    this.updateTelemetryView();
  }

  // 3. Update Sidebar Telemetry, Charts & Table (Read - Live from IndexedDB)
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
    this.renderDetectionsOverTimeChart(all);

    // Render Table in Bottom Drawer
    this.renderTable(filtered);
  }

  // 4. Render live classification distribution donut chart
  renderClassificationChart(records) {
    const canvas = document.getElementById("chart-distribution");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const width = canvas.width = canvas.parentElement.clientWidth || 320;
    const height = canvas.height = 110;

    ctx.clearRect(0, 0, width, height);

    const counts = {
      industrial_fire: records.filter(r => r.classification === "industrial_fire").length,
      gas_flare: records.filter(r => r.classification === "gas_flare").length,
      mining: records.filter(r => r.classification === "mining").length,
      agri_burn: records.filter(r => r.classification === "agri_burn").length,
      wildfire: records.filter(r => r.classification === "wildfire").length
    };

    const colors = {
      industrial_fire: "#e4572e",
      gas_flare: "#f2a93c",
      mining: "#4a7a96",
      agri_burn: "#b08d57",
      wildfire: "#4c8c6b"
    };

    const keys = Object.keys(counts);
    const total = Object.values(counts).reduce((sum, value) => sum + value, 0);
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(42, height / 2 - 8);
    let startAngle = -Math.PI / 2;

    keys.forEach(key => {
      const slice = total ? (counts[key] / total) * Math.PI * 2 : 0;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + slice);
      ctx.closePath();
      ctx.fillStyle = colors[key];
      ctx.fill();
      startAngle += slice;
    });

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.56, 0, Math.PI * 2);
    ctx.fillStyle = "#202a2d";
    ctx.fill();
    ctx.fillStyle = "#f8fafc";
    ctx.font = "700 18px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(total, centerX, centerY - 5);
    ctx.fillStyle = "#9eb9c2";
    ctx.font = "9px sans-serif";
    ctx.fillText("records", centerX, centerY + 12);
  }

  // 5. Render live detections-over-time line chart
  renderDetectionsOverTimeChart(records) {
    const canvas = document.getElementById("chart-timeline");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const width = canvas.width = canvas.parentElement.clientWidth || 320;
    const height = canvas.height = 70;

    ctx.clearRect(0, 0, width, height);

    if (!records.length) return;

    const byDay = new Map();
    records.forEach(record => {
      const day = new Date(record.detectedAt).toISOString().slice(0, 10);
      byDay.set(day, (byDay.get(day) || 0) + 1);
    });
    const points = [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, count]) => count);
    const maxCount = Math.max(...points, 1);

    ctx.beginPath();
    points.forEach((count, i) => {
      const x = (i / (points.length - 1 || 1)) * (width - 24) + 12;
      const y = height - 15 - (count / maxCount) * (height - 25);
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

  // 6. Render Table Rows in Bottom Drawer (with Full CRUD Actions)
  renderTable(records) {
    const tbody = document.getElementById("telemetry-table-body");
    if (!tbody) return;

    const activeId = window.NexusApp.activeRecordId;

    const isPublic = window.NexusApp.role === "public";
    const actionsHeader = document.querySelector(".telemetry-table th:last-child");
    if (actionsHeader) actionsHeader.hidden = isPublic;

    if (!records.length) {
      tbody.innerHTML = `<tr><td colspan="12" style="text-align: center; padding: 24px; color: #64748b;">No thermal anomalies in database. Click "+ Ingest Hotspot" or "Settings > Reload Seed Data".</td></tr>`;
      return;
    }

    tbody.innerHTML = records.map(r => {
      const isSelected = r.id === activeId ? "active-row" : "";
      const classLabel = r.classification.replace("_", " ");
      const distStr = r.nearestIndustrialDistM !== null ? `${Math.round(r.nearestIndustrialDistM)}m` : "None";
      const dateStr = new Date(r.detectedAt).toLocaleString([], { dateStyle: "short", timeStyle: "short" });
      const coordinates = isPublic ? `${r.latitude.toFixed(2)}, ${r.longitude.toFixed(2)}` : `${r.latitude.toFixed(4)}, ${r.longitude.toFixed(4)}`;
      const actions = isPublic ? "" : `
            <div class="action-cell">
              <button class="btn-table-action btn-table-view" data-action="view" data-id="${r.id}" title="Inspect & Locate">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="3"></circle></svg>
              </button>
              <button class="btn-table-action btn-table-edit" data-action="edit" data-id="${r.id}" title="Edit Anomaly">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1-1 4 9.5-9.5z"></path></svg>
              </button>
              <button class="btn-table-action btn-table-delete" data-action="delete" data-id="${r.id}" title="Delete Record">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              </button>
            </div>`;

      return `
        <tr class="${isSelected}" data-id="${r.id}">
          <td><strong>${r.locationLabel}</strong></td>
          <td><span class="coordinates-cell">${coordinates}</span></td>
          <td><span class="classification-badge ${r.classification}" style="font-size: 9.5px; padding: 2px 7px;">${classLabel}</span></td>
          <td><strong style="color: #fff;">${r.frp.toFixed(2)}</strong> MW</td>
          <td>${r.recurrenceCount}</td>
          <td>${distStr}</td>
          <td><span style="color: #94a3b8;">${r.landCoverClass}</span></td>
          <td><strong style="color: #38bdf8;">${Math.round(r.confidence * 100)}%</strong></td>
          <td><span class="status-badge status-${r.status}">${r.status}</span></td>
          <td><span class="source-cell">${r.source}</span></td>
          <td class="actions-column">${actions}</td>
        </tr>
      `;
    }).join("");
    tbody.querySelectorAll(".actions-column").forEach(cell => { cell.hidden = isPublic; });

    // Row Click Listener & Action Listeners
    tbody.querySelectorAll("tr").forEach(tr => {
      tr.addEventListener("click", (e) => {
        const btn = e.target.closest("button");
        const id = tr.getAttribute("data-id");
        if (!id) return;

        if (btn) {
          const action = btn.getAttribute("data-action");
          if (action === "edit") {
            const record = window.NexusApp.records.find(item => item.id === id);
            if (record) this.openEditModal(record);
            return;
          }
          if (action === "delete") {
            const record = window.NexusApp.records.find(item => item.id === id);
            if (record && confirm(`Delete thermal anomaly "${record.locationLabel}" from IndexedDB? This action is permanent.`)) {
              window.NexusApp.deleteRecord(id);
              this.showToast(`Deleted record "${record.locationLabel}".`);
            }
            return;
          }
        }

        // Default click -> Inspect
        window.NexusApp.setActiveRecord(id);
        const record = window.NexusApp.getActiveRecord();
        if (record) {
          window.NexusGIS.panToRecord(record);
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

    const canEdit = window.NexusApp.role === "analyst";
    ["btn-trigger-edit", "btn-trigger-override", "btn-trigger-delete"].forEach(id => {
      const button = document.getElementById(id);
      if (button) button.hidden = !canEdit;
    });

    // Populate Facility details
    document.getElementById("detail-facility-name").textContent = record.locationLabel;
    
    const badge = document.getElementById("detail-classification-badge");
    badge.className = `classification-badge ${record.classification}`;
    badge.textContent = record.classification.replace("_", " ");

    document.getElementById("detail-coords").textContent = `${record.latitude.toFixed(4)}°N, ${record.longitude.toFixed(4)}°E`;
    document.getElementById("detail-detected-at").textContent = new Date(record.detectedAt).toLocaleString();
    document.getElementById("detail-satellite").textContent = record.source === "seed_import" ? "NASA FIRMS VIIRS 375m (seed)" : "Manual / operator input";
    document.getElementById("detail-frp").textContent = `${record.frp.toFixed(2)} MW`;

    // FRP Meter Bar (Scale out of 20MW max)
    const frpPercent = Math.min(100, Math.max(5, (record.frp / 15) * 100));
    document.getElementById("detail-frp-bar").style.width = `${frpPercent}%`;

    // Attributes
    document.getElementById("detail-landcover").textContent = record.landCoverClass;
    document.getElementById("detail-recurrence").textContent = `${record.recurrenceCount} events`;
    document.getElementById("detail-osm-dist").textContent = record.nearestIndustrialDistM !== null ? `${Math.round(record.nearestIndustrialDistM)} meters` : "N/A";
    document.getElementById("detail-osm-tag").textContent = record.osmTag || "unassigned";

    const risk = record.classification === "industrial_fire" || record.frp >= 5 ? "HIGH" : record.classification === "unclassified" ? "REVIEW" : "MONITOR";
    const riskEl = document.getElementById("detail-risk-category");
    if (riskEl) {
      riskEl.textContent = risk;
      riskEl.className = `risk-category-${risk.toLowerCase()}`;
    }
    const contextEl = document.getElementById("detail-infrastructure-context");
    if (contextEl) contextEl.textContent = record.nearestIndustrialDistM !== null ? "1 nearest OSM context" : "No OSM context found";

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

    const btnEdit = document.getElementById("btn-trigger-edit");
    if (btnEdit) {
      btnEdit.onclick = () => this.openEditModal(record);
    }

    const btnDelete = document.getElementById("btn-trigger-delete");
    if (btnDelete) {
      btnDelete.onclick = () => {
        if (confirm(`Are you sure you want to delete "${record.locationLabel}" from IndexedDB?`)) {
          window.NexusApp.deleteRecord(record.id);
          this.showToast(`Deleted record "${record.locationLabel}".`);
        }
      };
    }
  }

  // 8. Manual Hotspot Ingestion Modal (Create - Journey A)
  openManualModal() {
    const modal = document.getElementById("modal-manual-entry");
    if (!modal) return;
    modal.classList.add("active");
    const timestamp = document.getElementById("manual-detected-at");
    if (timestamp && !timestamp.value) {
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      timestamp.value = now.toISOString().slice(0, 16);
    }
    this.updateManualConditionalFields();
    ["manual-lat", "manual-lon", "manual-frp"].forEach(id => this.validateManualField(id));
    this.updateManualLivePreview();
  }

  validateManualField(id) {
    const field = document.getElementById(id);
    const error = document.getElementById(`${id}-error`);
    if (!field) return true;

    const value = field.value.trim();
    let message = "";
    if (!value || !/^-?(?:\d+|\d*\.\d+)$/.test(value)) {
      message = "Enter a numeric value.";
    } else if (id === "manual-lat" && (Number(value) < -90 || Number(value) > 90)) {
      message = "Latitude must be between -90 and 90.";
    } else if (id === "manual-lon" && (Number(value) < -180 || Number(value) > 180)) {
      message = "Longitude must be between -180 and 180.";
    } else if (id === "manual-frp" && Number(value) <= 0) {
      message = "FRP must be greater than 0 MW.";
    }

    field.setCustomValidity(message);
    if (error) error.textContent = message;
    field.classList.toggle("invalid", Boolean(message));
    return !message;
  }

  updateManualConditionalFields() {
    const recurring = document.getElementById("manual-recurring");
    const nearIndustrial = document.getElementById("manual-near-industrial");
    const recurrenceField = document.getElementById("recurrence-field");
    const distanceField = document.getElementById("industrial-distance-field");
    const recurrence = document.getElementById("manual-recurrence");
    const distance = document.getElementById("manual-dist");

    if (recurrence && recurring) recurrence.disabled = !recurring.checked;
    if (distance && nearIndustrial) distance.disabled = !nearIndustrial.checked;
    if (recurrenceField && recurring) recurrenceField.hidden = !recurring.checked;
    if (distanceField && nearIndustrial) distanceField.hidden = !nearIndustrial.checked;
    this.updateManualLivePreview();
  }

  updateManualLivePreview() {
    const frp = parseFloat(document.getElementById("manual-frp").value) || 2.5;
    const recurrence = parseInt(document.getElementById("manual-recurrence").value, 10) || 0;
    const distRaw = document.getElementById("manual-dist").value;
    const dist = distRaw !== "" ? parseFloat(distRaw) : null;
    const landCover = document.getElementById("manual-landcover").value;
    const osmTag = document.getElementById("manual-tag").value.trim() || null;

    const result = classifyThermalAnomaly({
      frp,
      recurrenceCount: recurrence,
      nearestIndustrialDistM: dist,
      landCoverClass: landCover,
      osmTag
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

    const waveform = document.querySelector(".waveform-preview");
    if (waveform) waveform.style.setProperty("--wave-amplitude", `${Math.min(1.8, Math.max(0.35, frp / 8))}`);
  }

  async handleSaveManual() {
    const label = document.getElementById("manual-label").value.trim() || "Manual Hotspot";
    const lat = parseFloat(document.getElementById("manual-lat").value);
    const lon = parseFloat(document.getElementById("manual-lon").value);
    const frp = parseFloat(document.getElementById("manual-frp").value);
    const recurrenceEnabled = document.getElementById("manual-recurring").checked;
    const recurrence = recurrenceEnabled ? parseInt(document.getElementById("manual-recurrence").value, 10) || 0 : 0;
    const distRaw = document.getElementById("manual-dist").value;
    const nearIndustrial = document.getElementById("manual-near-industrial").checked;
    const dist = nearIndustrial && distRaw !== "" ? parseFloat(distRaw) : null;
    const osmTag = document.getElementById("manual-tag").value.trim() || null;
    const landCover = document.getElementById("manual-landcover").value;
    const detectedAtInput = document.getElementById("manual-detected-at").value;
    const valid = ["manual-lat", "manual-lon", "manual-frp"].map(id => this.validateManualField(id)).every(Boolean);

    if (!valid || isNaN(lat) || isNaN(lon) || isNaN(frp)) {
      alert("Please correct the highlighted coordinate and FRP fields.");
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
      landCoverClass: landCover,
      detectedAt: detectedAtInput ? new Date(detectedAtInput).toISOString() : new Date().toISOString()
    });

    document.getElementById("modal-manual-entry").classList.remove("active");
    this.openClassificationPipeline(record);
    this.showToast(`Thermal hotspot "${label}" created as pending telemetry.`);
  }

  updatePipelineLatencyLabel() {
    const slider = document.getElementById("pipeline-latency");
    const value = document.getElementById("pipeline-latency-value");
    const label = document.getElementById("pipeline-latency-label");
    const names = ["Fast", "Normal", "Slow"];
    const name = names[Number(slider?.value || 1)];
    if (value) value.textContent = name;
    if (label) label.textContent = `${name} latency`;
  }

  async openClassificationPipeline(record) {
    const modal = document.getElementById("modal-classification-pipeline");
    if (!modal) return;
    this.pipelineRecordId = record.id;
    this.pipelineRunToken = (this.pipelineRunToken || 0) + 1;
    const runToken = this.pipelineRunToken;
    modal.classList.add("active");
    document.getElementById("pipeline-result").hidden = true;
    document.getElementById("btn-pipeline-map").disabled = true;
    document.querySelectorAll(".pipeline-step").forEach(step => step.classList.remove("active", "complete"));
    this.updatePipelineLatencyLabel();

    const stages = [
      ["Scanning telemetry", 0],
      ["Extracting FRP, recurrence, and coordinates", 1],
      ["Fusing OSM and land-cover context", 2],
      ["Applying rule-based classification", 3]
    ];
    const delays = [250, 600, 1000];
    const getDelay = () => delays[Number(document.getElementById("pipeline-latency")?.value || 1)];

    for (const [message, index] of stages) {
      if (runToken !== this.pipelineRunToken) return;
      this.setPipelineStep(index, message);
      await new Promise(resolve => setTimeout(resolve, getDelay()));
    }

    if (runToken !== this.pipelineRunToken) return;
    const classified = await window.NexusApp.classifyRecord(record.id);
    if (!classified) return;
    this.setPipelineStep(4, "Classification complete");
    const badge = document.getElementById("pipeline-result-badge");
    badge.className = `classification-badge ${classified.classification}`;
    badge.textContent = classified.classification.replace("_", " ");
    document.getElementById("pipeline-result-confidence").textContent = `${Math.round(classified.confidence * 100)}% confidence`;
    document.getElementById("pipeline-result-reasoning").innerHTML = classified.reasoning.map(reason => `<li>${reason}</li>`).join("");
    document.getElementById("pipeline-status").textContent = "Record persisted and available across the dashboard.";
    document.getElementById("pipeline-result").hidden = false;
    document.getElementById("btn-pipeline-map").disabled = false;
  }

  setPipelineStep(index, message) {
    document.querySelectorAll(".pipeline-step").forEach(step => {
      const stepIndex = Number(step.dataset.step);
      step.classList.toggle("active", stepIndex === index);
      step.classList.toggle("complete", stepIndex < index);
    });
    const status = document.getElementById("pipeline-status");
    if (status) status.textContent = message;
  }

  closePipeline() {
    this.pipelineRunToken = (this.pipelineRunToken || 0) + 1;
    const modal = document.getElementById("modal-classification-pipeline");
    if (modal) modal.classList.remove("active");
  }

  // 9. Edit Record Modal (Update with live re-classification)
  openEditModal(record) {
    const modal = document.getElementById("modal-edit-record");
    if (!modal) return;
    this.editingRecordId = record.id;
    modal.classList.add("active");

    document.getElementById("edit-record-id").value = record.id;
    document.getElementById("edit-label").value = record.locationLabel;
    document.getElementById("edit-lat").value = record.latitude;
    document.getElementById("edit-lon").value = record.longitude;
    document.getElementById("edit-frp").value = record.frp;
    document.getElementById("edit-recurrence").value = record.recurrenceCount;
    document.getElementById("edit-dist").value = record.nearestIndustrialDistM !== null ? record.nearestIndustrialDistM : "";
    document.getElementById("edit-tag").value = record.osmTag || "";
    document.getElementById("edit-landcover").value = record.landCoverClass;
    document.getElementById("edit-reclassify").checked = true;

    this.updateEditLivePreview();
  }

  updateEditLivePreview() {
    const frp = parseFloat(document.getElementById("edit-frp").value) || 1.0;
    const recurrence = parseInt(document.getElementById("edit-recurrence").value, 10) || 0;
    const distRaw = document.getElementById("edit-dist").value;
    const dist = distRaw !== "" ? parseFloat(distRaw) : null;
    const landCover = document.getElementById("edit-landcover").value;

    const result = classifyThermalAnomaly({
      frp,
      recurrenceCount: recurrence,
      nearestIndustrialDistM: dist,
      landCoverClass: landCover
    });

    const previewCls = document.getElementById("edit-preview-class");
    const previewConf = document.getElementById("edit-preview-conf");
    const previewReasoning = document.getElementById("edit-preview-reasoning");

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

  async handleSaveEdit() {
    const id = document.getElementById("edit-record-id").value || this.editingRecordId;
    if (!id) return;

    const label = document.getElementById("edit-label").value.trim() || "Unnamed Facility";
    const lat = parseFloat(document.getElementById("edit-lat").value);
    const lon = parseFloat(document.getElementById("edit-lon").value);
    const frp = parseFloat(document.getElementById("edit-frp").value);
    const recurrence = parseInt(document.getElementById("edit-recurrence").value, 10) || 0;
    const distRaw = document.getElementById("edit-dist").value;
    const dist = distRaw !== "" ? parseFloat(distRaw) : null;
    const osmTag = document.getElementById("edit-tag").value.trim() || null;
    const landCover = document.getElementById("edit-landcover").value;
    const reclassify = document.getElementById("edit-reclassify").checked;

    if (isNaN(lat) || isNaN(lon) || isNaN(frp)) {
      alert("Please enter valid Latitude, Longitude, and FRP values.");
      return;
    }

    const updated = await window.NexusApp.updateRecordAndReclassify(id, {
      locationLabel: label,
      latitude: lat,
      longitude: lon,
      frp: frp,
      recurrenceCount: recurrence,
      nearestIndustrialDistM: dist,
      osmTag: osmTag,
      landCoverClass: landCover
    }, reclassify);

    document.getElementById("modal-edit-record").classList.remove("active");
    window.NexusGIS.panToRecord(updated);
    this.showToast(`Updated record "${label}" (persisted to IndexedDB).`);
  }

  // 10. Settings & Data Management Modal (Reload Seed / Clear All)
  openExportViewer() {
    const modal = document.getElementById("modal-export");
    const viewer = document.getElementById("export-json-viewer");
    if (!modal || !viewer) return;
    const json = window.NexusApp.getExportJSON();
    viewer.innerHTML = this.highlightJSON(json);
    modal.classList.add("active");
  }

  highlightJSON(json) {
    const escaped = json.replace(/[&<>]/g, character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;"
    }[character]));
    return escaped.replace(/("(?:\\.|[^"\\])*"\s*:)|("(?:\\.|[^"\\])*")|(-?\d+(?:\.\d+)?)|\b(true|false|null)\b/g, (token, key, string, number, literal) => {
      if (key) return `<span class="json-key">${key.slice(0, -1)}</span>:`;
      if (string) return `<span class="json-string">${string}</span>`;
      if (number) return `<span class="json-number">${number}</span>`;
      return `<span class="json-literal">${literal}</span>`;
    });
  }

  async copyExportToClipboard() {
    try {
      await navigator.clipboard.writeText(window.NexusApp.getExportJSON());
      this.showToast("Export JSON copied to clipboard.");
    } catch (error) {
      this.showToast("Clipboard access was blocked by the browser.");
    }
  }

  openSettingsModal() {
    const modal = document.getElementById("modal-settings");
    if (!modal) return;
    modal.classList.add("active");
    this.updateSettingsStats();
  }

  updateSettingsStats() {
    const all = window.NexusApp.records;
    const statDb = document.getElementById("settings-stat-db");
    const statCount = document.getElementById("settings-stat-count");
    const statStore = document.getElementById("settings-stat-store");
    const statSync = document.getElementById("settings-stat-sync");

    if (statDb) statDb.textContent = "NexusCoreDB (v1)";
    if (statStore) statStore.textContent = "thermalRecords";
    if (statCount) statCount.textContent = `${all.length} records`;
    if (statSync) statSync.textContent = new Date().toLocaleTimeString();
  }

  // 11. Override / Re-classification Modal
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

  // 12. Sentinel-2 SWIR Optical Verification Simulator Modal
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
      ctx.fillStyle = "#e4572e";
      ctx.fillText("THERMAL ANOMALY CONFIRMED", 8, height - 10);

      this.swirAnimationId = requestAnimationFrame(render);
    };

    render();
  }

  // 13. Toast Notification Helper
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
