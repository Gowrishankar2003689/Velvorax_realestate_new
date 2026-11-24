const realEstateData = {
  projects: [
    { name: "Aurelia Heights", developer: "Northstar Developers", location: "Gachibowli, Hyderabad", type: "Residential", rera: "P02400007182", units: "240", available: "64", sold: "148", status: "Active" },
    { name: "The Meridian", developer: "Crestline Group", location: "Kokapet, Hyderabad", type: "Residential", rera: "P02400006315", units: "180", available: "39", sold: "112", status: "Active" },
    { name: "Vertex Workspaces", developer: "Vertex Realty", location: "Financial District", type: "Commercial", rera: "P02400005827", units: "92", available: "21", sold: "58", status: "Launching" },
    { name: "Palm Grove Villas", developer: "Greenway Estates", location: "Tellapur, Hyderabad", type: "Villa", rera: "P02400004976", units: "48", available: "11", sold: "33", status: "Active" }
  ],
  properties: [
    { unit: "AH-T2-1104", project: "Aurelia Heights", location: "Hyderabad", block: "Tower 2", floor: "11", type: "3 BHK", area: "1,685 sq.ft.", price: "₹1.24 Cr", priceInRupees: 12400000, facing: "East", status: "Available" },
    { unit: "AH-T1-0806", project: "Aurelia Heights", location: "Hyderabad", block: "Tower 1", floor: "8", type: "2 BHK", area: "1,245 sq.ft.", price: "₹86 L", priceInRupees: 8600000, facing: "North", status: "Hold" },
    { unit: "TM-A-0603", project: "The Meridian", location: "Hyderabad", block: "Block A", floor: "6", type: "2 BHK", area: "1,190 sq.ft.", price: "₹88 L", priceInRupees: 8800000, facing: "East", status: "Available" },
    { unit: "TM-B-1502", project: "The Meridian", location: "Hyderabad", block: "Block B", floor: "15", type: "3 BHK", area: "1,790 sq.ft.", price: "₹1.48 Cr", priceInRupees: 14800000, facing: "West", status: "Booked" },
    { unit: "VG-V-014", project: "Palm Grove Villas", location: "Hyderabad", block: "Villa 14", floor: "2", type: "4 BHK Villa", area: "2,850 sq.ft.", price: "₹2.65 Cr", priceInRupees: 26500000, facing: "North-East", status: "Available" }
  ],
  leads: [
    { name: "Aarav Mehta", source: "Google Ads", interest: "2 BHK · Gachibowli", budget: "₹75–90 L", executive: "Mira Reddy", stage: "Site Visit", temperature: "Hot", followup: "Today, 3:30 PM", signals: { budget: true, property: true, calls: 2, responses: 2, visit: true, followup: true, negotiation: false, booking: false } },
    { name: "Isha Kapoor", source: "Referral", interest: "3 BHK · Kokapet", budget: "₹1.2–1.5 Cr", executive: "Dev Shah", stage: "Negotiation", temperature: "Hot", followup: "Today, 5:00 PM", signals: { budget: true, property: true, calls: 3, responses: 2, visit: true, followup: true, negotiation: true, booking: false } },
    { name: "Kabir Rao", source: "Instagram", interest: "2 BHK · Hyderabad West", budget: "₹70–85 L", executive: "Mira Reddy", stage: "Qualified", temperature: "Warm", followup: "Tomorrow, 11:00 AM", signals: { budget: true, property: true, calls: 1, responses: 1, visit: false, followup: true, negotiation: false, booking: false } },
    { name: "Ananya Iyer", source: "Channel Partner", interest: "Villa · Tellapur", budget: "₹2.4–2.8 Cr", executive: "Rohan Das", stage: "Property Shortlisted", temperature: "Warm", followup: "Nov 12, 10:30 AM", signals: { budget: true, property: true, calls: 1, responses: 1, visit: false, followup: false, negotiation: false, booking: false } },
    { name: "Neil Thomas", source: "Website", interest: "3 BHK · Financial District", budget: "₹1.3–1.6 Cr", executive: "Dev Shah", stage: "New", temperature: "Cold", followup: "Nov 13, 2:00 PM", signals: { budget: false, property: false, calls: 0, responses: 0, visit: false, followup: false, negotiation: false, booking: false } }
  ],
  contacts: [
    { name: "Aarav Mehta", type: "Buyer", phone: "+91 98••• 2841", email: "aarav.mehta@example.test", owner: "Mira Reddy", status: "Active" },
    { name: "Isha Kapoor", type: "Buyer", phone: "+91 97••• 6150", email: "isha.kapoor@example.test", owner: "Dev Shah", status: "Active" },
    { name: "Northstar Developers", type: "Developer", phone: "+91 40 •••• 6100", email: "sales@northstar.example.test", owner: "Rohan Das", status: "Partner" },
    { name: "Crestline Group", type: "Developer", phone: "+91 40 •••• 9210", email: "connect@crestline.example.test", owner: "Mira Reddy", status: "Partner" }
  ],
  visits: [
    { customer: "Aarav Mehta", project: "Aurelia Heights", property: "AH-T2-1104", executive: "Mira Reddy", datetime: "Nov 10 · 3:30 PM", status: "Scheduled" },
    { customer: "Isha Kapoor", project: "The Meridian", property: "TM-B-1502", executive: "Dev Shah", datetime: "Nov 10 · 5:00 PM", status: "Scheduled" },
    { customer: "Kabir Rao", project: "Aurelia Heights", property: "AH-T1-0806", executive: "Mira Reddy", datetime: "Nov 11 · 11:00 AM", status: "Scheduled" },
    { customer: "Ananya Iyer", project: "Palm Grove Villas", property: "VG-V-014", executive: "Rohan Das", datetime: "Nov 12 · 10:30 AM", status: "Completed" }
  ],
  negotiations: [
    { customer: "Isha Kapoor", project: "The Meridian", property: "TM-B-1502", executive: "Dev Shah", value: "₹1.48 Cr", probability: "72%", status: "Negotiation" },
    { customer: "Aarav Mehta", project: "Aurelia Heights", property: "AH-T2-1104", executive: "Mira Reddy", value: "₹1.24 Cr", probability: "54%", status: "Interested" },
    { customer: "Ananya Iyer", project: "Palm Grove Villas", property: "VG-V-014", executive: "Rohan Das", value: "₹2.65 Cr", probability: "38%", status: "Site Visit" }
  ],
  bookings: [
    { customer: "Riya Malhotra", project: "Aurelia Heights", property: "AH-T1-0902", amount: "₹5 L", date: "Nov 08, 2026", executive: "Mira Reddy", agreement: "In Review", status: "Booked" },
    { customer: "Samir Nair", project: "The Meridian", property: "TM-A-1204", amount: "₹7.5 L", date: "Nov 06, 2026", executive: "Dev Shah", agreement: "Signed", status: "Booked" }
  ],
  payments: [
    { customer: "Riya Malhotra", booking: "BK-2026-0148", installment: "Booking Amount", due: "Nov 08, 2026", amount: "₹5 L", paid: "₹5 L", status: "Paid" },
    { customer: "Samir Nair", booking: "BK-2026-0142", installment: "Foundation Milestone", due: "Nov 15, 2026", amount: "₹12 L", paid: "₹4 L", status: "Due" },
    { customer: "Meera Joshi", booking: "BK-2026-0131", installment: "Agreement Milestone", due: "Nov 07, 2026", amount: "₹8 L", paid: "₹0", status: "Overdue" }
  ],
  partners: [
    { name: "BlueKey Realty", leads: "28", visits: "11", bookings: "4", revenue: "₹5.8 Cr", commission: "₹11.6 L", pending: "₹4.2 L", status: "Active" },
    { name: "UrbanNest Advisors", leads: "19", visits: "8", bookings: "3", revenue: "₹4.1 Cr", commission: "₹8.2 L", pending: "₹2.8 L", status: "Active" },
    { name: "PrimePath Properties", leads: "14", visits: "5", bookings: "1", revenue: "₹1.5 Cr", commission: "₹3 L", pending: "₹3 L", status: "Review" }
  ],
  followups: [
    { customer: "Aarav Mehta", task: "Confirm site visit and send floor plan", owner: "Mira Reddy", due: "Today · 3:00 PM", priority: "High" },
    { customer: "Isha Kapoor", task: "Discuss revised payment schedule", owner: "Dev Shah", due: "Today · 4:30 PM", priority: "High" },
    { customer: "Kabir Rao", task: "Share matching 2 BHK options", owner: "Mira Reddy", due: "Tomorrow · 11:00 AM", priority: "Normal" },
    { customer: "Neil Thomas", task: "First enquiry response", owner: "Dev Shah", due: "Nov 13 · 2:00 PM", priority: "Normal" }
  ],
  reports: [
    { source: "Google Ads", leads: "186", visits: "42", bookings: "11", conversion: "5.9%", revenue: "₹14.2 Cr" },
    { source: "Referral", leads: "94", visits: "38", bookings: "14", conversion: "14.9%", revenue: "₹18.7 Cr" },
    { source: "Channel Partner", leads: "132", visits: "51", bookings: "12", conversion: "9.1%", revenue: "₹16.4 Cr" },
    { source: "Website", leads: "108", visits: "19", bookings: "4", conversion: "3.7%", revenue: "₹5.1 Cr" }
  ]
};

const viewConfig = {
  projects: { title: "Projects & Inventory", description: "Project-level inventory overview. Project details are sample data and are not saved.", data: realEstateData.projects, columns: [["name", "Project"], ["developer", "Developer"], ["location", "Location"], ["type", "Type"], ["rera", "RERA"], ["units", "Total Units"], ["available", "Available"], ["sold", "Sold"], ["status", "Status"]] },
  properties: { title: "Properties / Units", description: "Unit availability, pricing, configuration, and project mapping.", data: realEstateData.properties, columns: [["unit", "Unit"], ["project", "Project"], ["block", "Tower / Block"], ["floor", "Floor"], ["type", "Type"], ["area", "Area"], ["price", "Current Price"], ["facing", "Facing"], ["status", "Availability"]] },
  leads: { title: "Leads & Enquiries", description: "Lead source, customer requirements, ownership, follow-up, and transparent rule-based intent score.", data: realEstateData.leads, columns: [["name", "Customer"], ["source", "Source"], ["interest", "Property Interest"], ["budget", "Budget"], ["executive", "Owner"], ["stage", "Pipeline Stage"], ["score", "Rule Score"], ["temperature", "Temperature"], ["followup", "Next Follow-up"]] },
  contacts: { title: "Contacts", description: "Sample buyer and developer contact directory. Phone numbers are masked demo values.", data: realEstateData.contacts, columns: [["name", "Contact"], ["type", "Type"], ["phone", "Phone"], ["email", "Email"], ["owner", "Owner"], ["status", "Status"]] },
  visits: { title: "Site Visits", description: "Scheduled and completed sample visits. Calendar, reminders, and updates are not connected in this static demo.", data: realEstateData.visits, columns: [["customer", "Customer"], ["project", "Project"], ["property", "Property"], ["executive", "Executive"], ["datetime", "Date & Time"], ["status", "Visit Status"]] },
  negotiations: { title: "Negotiations & Pipeline", description: "Example sales pipeline records with indicative booking probability.", data: realEstateData.negotiations, columns: [["customer", "Customer"], ["project", "Project"], ["property", "Property"], ["executive", "Owner"], ["value", "Deal Value"], ["probability", "Probability"], ["status", "Stage"]] },
  bookings: { title: "Bookings", description: "Sample booking register with agreement and booking status.", data: realEstateData.bookings, columns: [["customer", "Customer"], ["project", "Project"], ["property", "Unit"], ["amount", "Booking Amount"], ["date", "Booking Date"], ["executive", "Executive"], ["agreement", "Agreement"], ["status", "Booking"]] },
  payments: { title: "Payments & Collections", description: "Sample installments. A production version must reconcile receipts, paid amounts, due dates, and outstanding balances.", data: realEstateData.payments, columns: [["customer", "Customer"], ["booking", "Booking"], ["installment", "Milestone"], ["due", "Due Date"], ["amount", "Amount Due"], ["paid", "Paid"], ["status", "Payment Status"]] },
  partners: { title: "Channel Partners", description: "Partner pipeline and indicative commission performance.", data: realEstateData.partners, columns: [["name", "Partner"], ["leads", "Leads"], ["visits", "Visits"], ["bookings", "Bookings"], ["revenue", "Revenue"], ["commission", "Commission"], ["pending", "Commission Pending"], ["status", "Status"]] },
  followups: { title: "Follow-ups", description: "Sample follow-up queue. Alerts and reminders are display-only in this static module.", data: realEstateData.followups, columns: [["customer", "Customer"], ["task", "Follow-up"], ["owner", "Owner"], ["due", "Due"], ["priority", "Priority"]] },
  hotleads: { title: "Hot Leads", description: "Hot leads are derived from the configured demo scoring rules (score >= 70), not an AI model.", data: realEstateData.leads.filter((lead) => scoreLead(lead.signals) >= 70), columns: [["name", "Customer"], ["source", "Source"], ["interest", "Property Interest"], ["executive", "Owner"], ["stage", "Stage"], ["score", "Rule Score"], ["followup", "Next Follow-up"]] },
  reports: { title: "Marketing & Sales Reports", description: "Illustrative source attribution and conversion data. Reports are not calculated from a live database.", data: realEstateData.reports, columns: [["source", "Lead Source"], ["leads", "Leads"], ["visits", "Site Visits"], ["bookings", "Bookings"], ["conversion", "Conversion"], ["revenue", "Revenue"]] }
};

function scoreLead(signals) {
  const weights = { budget: 15, property: 15, calls: 10, responses: 15, visit: 15, followup: 10, negotiation: 10, booking: 10 };
  return Object.entries(weights).reduce((score, [signal, weight]) => {
    const active = signal === "calls" ? signals.calls >= 2 : signal === "responses" ? signals.responses >= 1 : signals[signal];
    return score + (active ? weight : 0);
  }, 0);
}

function getLeadTemperature(score) {
  return score >= 70 ? "Hot" : score >= 40 ? "Warm" : "Cold";
}

function getPropertyMatches(requirement) {
  return realEstateData.properties
    .filter((property) => property.status === "Available" && property.type.toLowerCase().includes(requirement.type.toLowerCase()))
    .map((property) => {
      const locationMatch = property.location.toLowerCase().includes(requirement.location.toLowerCase());
      const budgetMatch = property.priceInRupees >= requirement.minBudget && property.priceInRupees <= requirement.maxBudget;
      const score = 40 + (locationMatch ? 30 : 0) + (budgetMatch ? 30 : 0);
      return { ...property, match: Math.min(score, 100) };
    })
    .sort((a, b) => b.match - a.match);
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

function formatCell(value, key, row) {
  if (key === "score") value = `${scoreLead(row.signals)}%`;
  if (key === "temperature" && row.signals) value = getLeadTemperature(scoreLead(row.signals));
  const safeValue = escapeHtml(value);
  if (["status", "temperature", "priority", "agreement"].includes(key)) {
    const className = String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-");
    return `<span class="status ${className}">${safeValue}</span>`;
  }
  return safeValue;
}

function renderDashboard() {
  const leads = realEstateData.leads;
  const matches = getPropertyMatches({ type: "2 BHK", location: "Hyderabad", minBudget: 7500000, maxBudget: 9000000 });
  const funnel = [
    ["Leads", 1284, 100],
    ["Qualified", 486, 72],
    ["Site Visits", 214, 55],
    ["Negotiation", 86, 38],
    ["Bookings", 42, 24],
    ["Closed Sales", 31, 18]
  ];
  const sources = [["Referral", 76], ["Channel Partner", 64], ["Google Ads", 51], ["Website", 32]];
  return `
    <div class="welcome-row">
      <div><h2>Real Estate Command Center</h2><p>Pipeline, inventory, and team activity at a glance.</p></div>
      <span class="date-chip">DEMO SNAPSHOT · NOV 10, 2026</span>
    </div>
    <div class="kpi-grid">
      ${[
        ["Total Leads", "1,284", "486 qualified", "users"],
        ["Hot Leads", "18", "Rule-based demo score", "zap"],
        ["Site Visits", "42", "12 scheduled this week", "calendar"],
        ["Negotiations", "16", "Indicative active pipeline", "git-merge"],
        ["Bookings", "8", "This month", "bookmark"],
        ["Sales Value", "₹18.4 Cr", "Illustrative demo total", "trending-up"],
        ["Available Units", "314", "Across 4 sample projects", "home"],
        ["Overdue Follow-ups", "6", "Action required", "alert-circle"]
      ].map(([label, value, note, icon]) => `<article class="kpi-card"><div class="kpi-label">${label}<i data-feather="${icon}"></i></div><div class="kpi-value">${value}</div><div class="kpi-note">${note}</div></article>`).join("")}
    </div>
    <div class="dashboard-grid">
      <article class="panel">
        <div class="panel-heading"><div><h3>Sales Funnel</h3><p>Illustrative counts by stage</p></div><span class="tag">Lead → Sale</span></div>
        <div class="funnel">${funnel.map(([label, value, width]) => `<div class="funnel-row"><span>${label}</span><div class="funnel-track"><div class="funnel-fill" style="width:${width}%"></div></div><span class="funnel-value">${value}</span></div>`).join("")}</div>
      </article>
      <article class="panel">
        <div class="panel-heading"><div><h3>Action Required</h3><p>Sample reminders and priorities</p></div></div>
        <div class="action-list">
          <div class="action-item"><span class="action-dot"></span><p>Overdue follow-ups<small>6 leads need attention</small></p><span class="action-time">Today</span></div>
          <div class="action-item"><span class="action-dot"></span><p>Upcoming site visits<small>2 visits scheduled today</small></p><span class="action-time">3:30 PM</span></div>
          <div class="action-item"><span class="action-dot"></span><p>Payment milestone due<small>Foundation installment · Samir Nair</small></p><span class="action-time">Nov 15</span></div>
          <div class="action-item"><span class="action-dot"></span><p>High-intent lead<small>Isha Kapoor · rule score ${scoreLead(leads[1].signals)}%</small></p><span class="action-time">Now</span></div>
        </div>
      </article>
    </div>
    <div class="bottom-grid">
      <article class="panel">
        <div class="panel-heading"><div><h3>Marketing Source Snapshot</h3><p>Illustrative lead volume by source</p></div><span class="tag">Demo analytics</span></div>
        <div class="source-list">${sources.map(([name, value]) => `<div class="source-row"><span>${name}</span><div class="source-track"><div class="source-fill" style="width:${value}%"></div></div><span class="funnel-value">${value}%</span></div>`).join("")}</div>
      </article>
      <article class="panel">
        <div class="panel-heading"><div><h3>Property Matching</h3><p>2 BHK · Hyderabad · ₹75–90 L</p></div><span class="tag">Rule based</span></div>
        ${matches.slice(0, 2).map((property) => `<div class="match-card"><div class="match-top">${escapeHtml(property.unit)} <span>${property.match}% match</span></div><p>${escapeHtml(property.project)} · ${escapeHtml(property.location)}<br>${escapeHtml(property.type)} · ${escapeHtml(property.price)} · ${escapeHtml(property.status)}</p></div>`).join("") || `<p class="section-description">No matching available demo properties.</p>`}
      </article>
    </div>
    <article class="panel" style="margin-top:13px">
      <div class="panel-heading"><div><h3>High-Intent Leads</h3><p>Deterministic score from the displayed sample activity signals. No AI-generated results.</p></div><span class="tag">Configurable rules</span></div>
      ${renderTable(realEstateData.leads.filter((lead) => scoreLead(lead.signals) >= 70), viewConfig.leads.columns.filter(([key]) => ["name", "source", "executive", "stage", "score", "temperature"].includes(key)))}
    </article>
  `;
}

function renderTable(rows, columns) {
  const header = columns.map(([, label]) => `<th scope="col">${escapeHtml(label)}</th>`).join("");
  const body = rows.map((row) => `<tr>${columns.map(([key]) => `<td>${formatCell(row[key], key, row)}</td>`).join("")}</tr>`).join("");
  return `<div class="table-wrap"><table class="data-table"><thead><tr>${header}</tr></thead><tbody>${body || `<tr><td class="empty-state" colspan="${columns.length}">No sample records in this view.</td></tr>`}</tbody></table></div>`;
}

function renderView(viewName) {
  const root = document.getElementById("viewRoot");
  const pageTitle = document.getElementById("pageTitle");
  const config = viewConfig[viewName];
  if (!config) {
    pageTitle.textContent = "Real Estate Dashboard";
    root.innerHTML = renderDashboard();
    return;
  }

  pageTitle.textContent = config.title;
  root.innerHTML = `
    <h2 class="section-heading">${escapeHtml(config.title)}</h2>
    <p class="section-description">${escapeHtml(config.description)}</p>
    <div class="panel">
      <div class="table-toolbar">
        <input id="tableSearch" type="search" placeholder="Search this demo view..." aria-label="Search ${escapeHtml(config.title)}">
        <span class="table-count">${config.data.length} sample records</span>
      </div>
      <div id="tableRoot">${renderTable(config.data, config.columns)}</div>
      ${viewName === "leads" || viewName === "hotleads" ? `<div class="notice"><strong>Transparent score rules:</strong> Budget provided 15, property selected 15, at least two calls 10, response 15, site visit 15, follow-up activity 10, negotiation 10, booking interest 10. Hot ≥ 70, Warm ≥ 40, otherwise Cold. This uses only the sample activity shown in this page.</div>` : ""}
    </div>
  `;
  if (window.feather) feather.replace();
  document.getElementById("tableSearch").addEventListener("input", (event) => {
    const query = event.target.value.trim().toLowerCase();
    const rows = config.data.filter((row) => Object.values(row).some((value) => String(value).toLowerCase().includes(query)));
    document.getElementById("tableRoot").innerHTML = renderTable(rows, config.columns);
    document.querySelector(".table-count").textContent = `${rows.length} sample records`;
  });
}

document.querySelectorAll(".realestate-sidebar [data-view]").forEach((link) => {
  link.addEventListener("click", () => {
    document.querySelector(".module-link.active")?.classList.remove("active");
    link.classList.add("active");
    const viewName = link.dataset.view;
    renderView(viewName);
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
});

renderView("dashboard");
if (window.feather) feather.replace();
