(() => {
  const API_ROOT = "/api/realestate/mysql";
  let activeView = "dashboard";

  const viewResource = {
    projects: "projects",
    properties: "properties",
    leads: "leads",
    hotleads: "leads",
    contacts: "contacts",
    visits: "visits",
    negotiations: "opportunities",
    bookings: "bookings",
    payments: "payment-schedules",
    partners: "partners",
    followups: "activities",
    reports: "marketing"
  };

  const labels = {
    projects: [["name","Project"],["developer_name","Developer"],["city","City"],["locality","Locality"],["project_type","Type"],["rera_number","RERA"],["total_units","Total Units"],["available_units","Available"],["sold_units","Sold"],["status","Status"]],
    properties: [["unit_number","Unit"],["block_name","Tower / Block"],["floor_number","Floor"],["property_type","Type"],["bhk","BHK"],["area_sqft","Area"],["current_price_minor","Current Price"],["facing","Facing"],["status","Status"]],
    leads: [["name","Customer"],["source","Source"],["phone","Phone"],["email","Email"],["pipeline_stage","Pipeline Stage"],["score_value","Rule Score"],["temperature","Temperature"],["next_follow_up_at","Next Follow-up"]],
    hotleads: [["name","Customer"],["source","Source"],["phone","Phone"],["pipeline_stage","Pipeline Stage"],["score_value","Rule Score"],["temperature","Temperature"],["next_follow_up_at","Next Follow-up"]],
    contacts: [["name","Contact"],["contact_type","Type"],["phone","Phone"],["email","Email"],["status","Status"]],
    visits: [["lead_id","Lead"],["project_id","Project"],["property_id","Property"],["scheduled_at","Date & Time"],["status","Visit Status"]],
    negotiations: [["lead_id","Lead"],["project_id","Project"],["property_id","Property"],["estimated_value_minor","Deal Value"],["probability","Probability"],["stage","Stage"]],
    bookings: [["booking_number","Booking"],["lead_id","Lead"],["project_id","Project"],["property_id","Property"],["booking_amount_minor","Booking Amount"],["booking_date","Booking Date"],["agreement_status","Agreement"],["status","Status"]],
    "payment-schedules": [["booking_id","Booking"],["installment_name","Milestone"],["due_at","Due Date"],["amount_minor","Amount Due"],["paid_amount_minor","Paid"],["status","Status"]],
    partners: [["name","Partner"],["contact_name","Contact"],["phone","Phone"],["email","Email"],["commission_policy","Commission"],["status","Status"]],
    activities: [["subject_type","Subject"],["activity_type","Activity"],["title","Title"],["description","Description"],["occurred_at","Due / Time"]],
    marketing: [["source","Lead Source"],["leads","Leads"],["visits","Visits"],["bookings","Bookings"]]
  };

  function headers() {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
  }

  async function get(path) {
    const response = await fetch(API_ROOT + path, { headers: headers() });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || data.error || "Request failed");
    return data;
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[character]);
  }

  function display(field, value) {
    if (value == null) return "";
    if (field.endsWith("_minor")) return `₹${(Number(value) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (field === "area_sqft") return `${Number(value).toLocaleString("en-IN")} sq.ft.`;
    if (field === "status" || field === "temperature" || field === "agreement_status" || field === "stage") {
      const className = String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-");
      return `<span class="status ${className}">${escapeHtml(String(value).replaceAll("_", " "))}</span>`;
    }
    if (field.includes("_at") || field.includes("_date")) return String(value).replace("T", " ").slice(0, 16);
    return escapeHtml(String(value).replaceAll("_", " "));
  }

  function tableHtml(columns, rows) {
    const head = columns.map(([, label]) => `<th>${escapeHtml(label)}</th>`).join("");
    const body = rows.map((row) => `
      <tr>${columns.map(([field]) => `<td>${display(field, row[field])}</td>`).join("")}</tr>
    `).join("");
    return `<div class="table-wrap"><table class="data-table"><thead><tr>${head}</tr></thead><tbody>${body || `<tr><td class="empty-state" colspan="${columns.length}">No database records found.</td></tr>`}</tbody></table></div>`;
  }

  async function renderDashboard() {
    const root = document.getElementById("viewRoot");
    if (!root) return;
    document.getElementById("pageTitle").textContent = "Real Estate Dashboard";
    root.innerHTML = `<article class="panel"><div class="notice">Loading dashboard...</div></article>`;
    try {
      const data = await get("/dashboard/summary");
      const leads = await get("/leads");
      const properties = await get("/properties");
      const visits = await get("/visits");
      const salesMinor = Number(data.salesValueMinor || 0);
      root.innerHTML = `
        <div class="welcome-row">
          <div><h2>Real Estate Command Center</h2><p>Live pipeline, inventory, and team activity from MySQL.</p></div>
          <span class="date-chip">LIVE MYSQL SNAPSHOT · ${new Date().toLocaleDateString()}</span>
        </div>
        <div class="kpi-grid">
          ${[
            ["Total Leads", data.leads, "Database leads", "users"],
            ["Hot Leads", data.hotLeads, "Temperature: hot", "zap"],
            ["Site Visits", data.scheduledVisits, "Scheduled visits", "calendar"],
            ["Negotiations", data.negotiations, "Active pipeline", "git-merge"],
            ["Bookings", data.bookings, "Booked records", "bookmark"],
            ["Sales Value", `₹${(salesMinor / 1000000000).toFixed(2)} Cr`, "Booking value", "trending-up"],
            ["Available Units", data.availableUnits, "Available inventory", "home"],
            ["Overdue Payments", data.overduePayments, "Action required", "alert-circle"]
          ].map(([label, value, note, icon]) => `<article class="kpi-card"><div class="kpi-label">${label}<i data-feather="${icon}"></i></div><div class="kpi-value">${value}</div><div class="kpi-note">${note}</div></article>`).join("")}
        </div>
        <div class="dashboard-grid">
          <article class="panel"><div class="panel-heading"><div><h3>Sales Funnel</h3><p>Live lead and booking counts</p></div><span class="tag">Lead → Sale</span></div>
            <div class="funnel">
              ${[
                ["Leads", data.leads, 100],
                ["Scheduled Visits", data.scheduledVisits, data.leads ? Math.round(data.scheduledVisits * 100 / data.leads) : 0],
                ["Negotiations", data.negotiations, data.leads ? Math.round(data.negotiations * 100 / data.leads) : 0],
                ["Bookings", data.bookings, data.leads ? Math.round(data.bookings * 100 / data.leads) : 0]
              ].map(([label, value, width]) => `<div class="funnel-row"><span>${label}</span><div class="funnel-track"><div class="funnel-fill" style="width:${Math.min(width,100)}%"></div></div><span class="funnel-value">${value}</span></div>`).join("")}
            </div>
          </article>
          <article class="panel"><div class="panel-heading"><div><h3>Action Required</h3><p>Live follow-up information</p></div></div>
            <div class="action-list">
              <div class="action-item"><span class="action-dot"></span><p>${data.overduePayments} overdue payments<small>Payment schedules require attention</small></p><span class="action-time">Now</span></div>
              <div class="action-item"><span class="action-dot"></span><p>${visits.length} scheduled visits<small>From the site visit register</small></p><span class="action-time">Live</span></div>
              <div class="action-item"><span class="action-dot"></span><p>${properties.length} unit records<small>Across project inventory</small></p><span class="action-time">Live</span></div>
              <div class="action-item"><span class="action-dot"></span><p>${data.hotLeads} hot leads<small>Database temperature records</small></p><span class="action-time">Live</span></div>
            </div>
          </article>
        </div>
        <article class="panel" style="margin-top:13px"><div class="panel-heading"><div><h3>High-Intent Leads</h3><p>Database hot-lead records</p></div><span class="tag">MySQL</span></div>
          ${tableHtml(labels.hotleads, leads.filter((lead) => lead.temperature === "hot"))}
        </article>`;
      if (window.feather) feather.replace();
    } catch (error) {
      root.innerHTML = `<article class="panel"><div class="notice">Unable to load live dashboard: ${escapeHtml(error.message)}</div></article>`;
    }
  }

  async function renderResource(view) {
    const root = document.getElementById("viewRoot");
    if (!root) return;
    const resource = viewResource[view];
    if (!resource) return;
    const titles = {
      projects:"Projects & Inventory",properties:"Properties / Units",leads:"Leads & Enquiries",contacts:"Contacts",
      visits:"Site Visits",negotiations:"Negotiations & Pipeline",bookings:"Bookings",
      payments:"Payments & Collections",partners:"Channel Partners",followups:"Follow-ups",hotleads:"Hot Leads",
      reports:"Marketing & Sales Reports"
    };
    document.getElementById("pageTitle").textContent = titles[view] || "Real Estate";
    root.innerHTML = `<article class="panel"><div class="notice">Loading ${escapeHtml(titles[view] || "module")}...</div></article>`;
    try {
      if (resource === "marketing") {
        const rows = await get("/reports/marketing");
        root.innerHTML = `<h2 class="section-heading">Marketing & Sales Reports</h2><p class="section-description">Live marketing source totals calculated from MySQL lead records.</p><div class="panel"><div class="table-toolbar"><input id="tableSearch" type="search" placeholder="Search this view..." aria-label="Search Marketing Reports"><span class="table-count">${rows.length} database records</span></div><div id="tableRoot">${tableHtml(labels.marking || labels.marketing, rows)}</div></div>`;
        return;
      }
      const rows = await get(`/${resource}`);
      let visibleRows = rows;
      if (view === "hotleads") visibleRows = rows.filter((row) => row.temperature === "hot");
      const descriptions = {
        projects:"Live project inventory stored in MySQL.",properties:"Live property and unit records stored in MySQL.",
        leads:"Live lead records stored in MySQL.",contacts:"Live contact directory stored in MySQL.",
        visits:"Live site visit schedule stored in MySQL.",negotiations:"Live opportunity pipeline stored in MySQL.",
        bookings:"Live booking register stored in MySQL.",payments:"Live payment schedule and collection records.",
        partners:"Live channel partner records.",followups:"Live follow-up and activity records.",hotleads:"Live leads with hot temperature."
      };
      root.innerHTML = `<h2 class="section-heading">${titles[view] || ""}</h2><p class="section-description">${descriptions[view] || ""}</p><div class="panel"><div class="table-toolbar"><input id="tableSearch" type="search" placeholder="Search this view..." aria-label="Search ${titles[view] || ""}"><span class="table-count">${visibleRows.length} database records</span></div><div id="tableRoot">${tableHtml(labels[view] || [], visibleRows)}</div></div>`;
      const search = document.getElementById("tableSearch");
      search?.addEventListener("input", () => {
        const query = search.value.trim().toLowerCase();
        const filtered = visibleRows.filter((row) => Object.values(row).some((value) => String(value).toLowerCase().includes(query)));
        document.getElementById("tableRoot").innerHTML = tableHtml(labels[view] || [], filtered);
        document.querySelector(".table-count").textContent = `${filtered.length} database records`;
      });
    } catch (error) {
      root.innerHTML = `<article class="panel"><div class="notice">Unable to load MySQL records: ${escapeHtml(error.message)}</div></article>`;
    }
  }

  async function activate(view) {
    activeView = view;
    document.querySelectorAll(".realestate-sidebar [data-view]").forEach((link) => {
      link.classList.toggle("active", link.dataset.view === view);
    });
    if (view === "dashboard") await renderDashboard();
    else await renderResource(view);
    window.dispatchEvent(new CustomEvent("realestate:viewchange", { detail: { view } }));
  }

  window.activateRealEstateView = activate;
  const standaloneLinks = document.querySelectorAll(".realestate-sidebar [data-view]");
  standaloneLinks.forEach((link) => {
    link.addEventListener("click", () => activate(link.dataset.view));
  });
  const initialView = new URLSearchParams(window.location.hash.slice(1)).get("view");
  if (standaloneLinks.length) {
    if (initialView) {
      standaloneLinks.forEach((link) => {
        link.classList.toggle("active", link.dataset.view === initialView);
      });
    }
    setTimeout(() => activate(initialView || "dashboard"), 500);
  }
})();
