(() => {
  const API_ROOT = "/api/realestate/mysql";
  let currentView = "dashboard";
  let options = {};

  const resourceByView = {
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
    followups: "activities"
  };

  const forms = {
    projects: [
      ["name", "Project Name", "text", true], ["developer_name", "Developer", "text", false],
      ["city", "City", "text", false], ["locality", "Locality", "text", false],
      ["address", "Address", "text", false], ["rera_number", "RERA Number", "text", false],
      ["project_type", "Project Type", "select", true, ["residential", "commercial", "villa", "plot", "mixed"]],
      ["total_units", "Total Units", "number", false], ["available_units", "Available Units", "number", false],
      ["sold_units", "Sold Units", "number", false], ["possession_date", "Possession Date", "date", false],
      ["status", "Status", "select", true, ["active", "launching", "completed", "paused"]]
    ],
    properties: [
      ["project_id", "Project", "select", true, "projects"], ["unit_number", "Unit Number", "text", true],
      ["block_name", "Tower / Block", "text", false], ["floor_number", "Floor", "number", false],
      ["property_type", "Property Type", "select", true, ["apartment", "villa", "plot", "office", "retail"]],
      ["bhk", "BHK", "number", false], ["area_sqft", "Area (sq.ft.)", "number", false],
      ["facing", "Facing", "text", false], ["base_price_minor", "Base Price (paise)", "number", false],
      ["current_price_minor", "Current Price (paise)", "number", false],
      ["currency", "Currency", "text", false], ["parking", "Parking", "number", false],
      ["status", "Status", "select", true, ["available", "hold", "booked", "sold", "blocked"]]
    ],
    leads: [
      ["name", "Name", "text", true], ["contact_id", "Contact", "select", false, "contacts"],
      ["phone", "Phone", "tel", false], ["email", "Email", "email", false],
      ["source", "Source", "text", false], ["campaign", "Campaign", "text", false],
      ["budget_min_minor", "Minimum Budget (paise)", "number", false],
      ["budget_max_minor", "Maximum Budget (paise)", "number", false],
      ["buying_timeline", "Buying Timeline", "select", false, ["0_3_months", "3_6_months", "6_12_months", "flexible"]],
      ["pipeline_stage", "Pipeline Stage", "select", true, ["new", "qualified", "property_shortlisted", "site_visit", "negotiation", "booking", "closed", "lost"]],
      ["score_value", "Score", "number", false], ["temperature", "Temperature", "select", true, ["hot", "warm", "cold"]],
      ["booking_probability", "Booking Probability", "number", false],
      ["next_follow_up_at", "Next Follow-up", "datetime-local", false], ["notes", "Notes", "textarea", false]
    ],
    contacts: [
      ["name", "Name", "text", true], ["contact_type", "Contact Type", "select", true, ["buyer", "developer", "channel_partner", "other"]],
      ["phone", "Phone", "tel", false], ["email", "Email", "email", false],
      ["status", "Status", "select", true, ["active", "inactive"]]
    ],
    visits: [
      ["lead_id", "Lead", "select", false, "leads"], ["contact_id", "Contact", "select", false, "contacts"],
      ["project_id", "Project", "select", false, "projects"], ["property_id", "Property", "select", false, "properties"],
      ["scheduled_at", "Scheduled At", "datetime-local", true],
      ["status", "Status", "select", true, ["scheduled", "completed", "cancelled", "rescheduled"]],
      ["feedback", "Feedback", "textarea", false], ["next_follow_up_at", "Next Follow-up", "datetime-local", false]
    ],
    opportunities: [
      ["lead_id", "Lead", "select", true, "leads"], ["project_id", "Project", "select", false, "projects"],
      ["property_id", "Property", "select", false, "properties"],
      ["stage", "Stage", "select", true, ["interested", "site_visit", "negotiation", "booking", "closed", "lost"]],
      ["estimated_value_minor", "Estimated Value (paise)", "number", false],
      ["probability", "Probability", "number", false], ["stage_changed_at", "Stage Changed At", "datetime-local", true]
    ],
    bookings: [
      ["booking_number", "Booking Number", "text", true], ["lead_id", "Lead", "select", false, "leads"],
      ["contact_id", "Contact", "select", false, "contacts"], ["project_id", "Project", "select", true, "projects"],
      ["property_id", "Property", "select", true, "properties"], ["booking_amount_minor", "Booking Amount (paise)", "number", true],
      ["booking_date", "Booking Date", "date", true],
      ["partner_id", "Channel Partner", "select", false, "partners"],
      ["agreement_status", "Agreement Status", "select", true, ["draft", "in_review", "signed", "cancelled"]],
      ["status", "Status", "select", true, ["booked", "registered", "cancelled", "closed"]]
    ],
    "payment-schedules": [
      ["booking_id", "Booking", "select", true, "bookings"], ["installment_name", "Installment Name", "text", true],
      ["due_at", "Due Date", "datetime-local", true], ["amount_minor", "Amount Due (paise)", "number", true],
      ["paid_amount_minor", "Paid Amount (paise)", "number", false],
      ["status", "Status", "select", true, ["upcoming", "due", "paid", "part_paid", "overdue", "cancelled"]]
    ],
    partners: [
      ["name", "Partner Name", "text", true], ["contact_name", "Contact Name", "text", false],
      ["phone", "Phone", "tel", false], ["email", "Email", "email", false],
      ["commission_policy", "Commission Policy", "text", false],
      ["status", "Status", "select", true, ["active", "inactive", "review"]]
    ],
    "payment-transactions": [
      ["booking_id", "Booking", "select", true, "bookings"],
      ["schedule_id", "Payment Schedule ID", "number", false],
      ["amount_minor", "Amount (paise)", "number", true],
      ["paid_at", "Paid At", "datetime-local", true],
      ["method", "Method", "select", true, ["cash", "bank_transfer", "cheque", "upi", "card", "gateway", "other"]],
      ["external_reference", "Reference", "text", false],
      ["status", "Status", "select", true, ["pending", "completed", "failed", "refunded"]]
    ],
    commissions: [
      ["partner_id", "Partner", "select", true, "partners"], ["booking_id", "Booking", "select", true, "bookings"],
      ["amount_minor", "Commission Amount (paise)", "number", true],
      ["status", "Status", "select", true, ["earned", "approved", "paid", "cancelled"]],
      ["earned_at", "Earned At", "datetime-local", true], ["paid_at", "Paid At", "datetime-local", false]
    ],
    activities: [
      ["subject_type", "Subject Type", "select", true, ["lead", "contact", "project", "property", "visit", "opportunity", "booking", "partner"]],
      ["subject_id", "Subject ID", "number", true],
      ["activity_type", "Activity Type", "select", true, ["call", "email", "whatsapp", "response", "follow_up", "stage_change", "note", "payment", "visit", "booking"]],
      ["title", "Title", "text", true], ["description", "Description", "textarea", false],
      ["occurred_at", "Occurred At", "datetime-local", true]
    ]
  };

  function authHeaders() {
    const token = localStorage.getItem("token");
    return token ? { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
  }

  async function api(path, method = "GET", body) {
    const response = await fetch(`${API_ROOT}${path}`, {
      method,
      headers: authHeaders(),
      body: body ? JSON.stringify(body) : undefined
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || data.error || "Request failed");
    return data;
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[character]);
  }

  function currentLocalDateTime() {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  }

  function toast(message, type = "success") {
    document.querySelector(".re-toast")?.remove();
    const element = document.createElement("div");
    element.className = `re-toast ${type}`;
    element.textContent = message;
    document.body.appendChild(element);
    setTimeout(() => element.remove(), 3500);
  }

  function formatValue(field, value, row) {
    if (field === "status" || field === "temperature" || field === "agreement_status" || field === "stage") {
      const label = String(value ?? "").replaceAll("_", " ");
      return `<span class="status ${String(value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-")}">${escapeHtml(label)}</span>`;
    }
    if (field.endsWith("_minor")) return value == null ? "" : `₹${(Number(value) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (field === "booking_date" || field === "possession_date") return value ? String(value).slice(0, 10) : "";
    if (field.includes("_at") && value) return String(value).replace("T", " ").slice(0, 16);
    return escapeHtml(value);
  }

  function renderRecords(resource, rows) {
    const root = document.getElementById("tableRoot");
    if (!root) return;
    const fields = forms[resource] ? forms[resource].map((field) => field[0]) : Object.keys(rows[0]).filter((key) => key !== "id" && key !== "company_id").slice(0, 8);
    const labels = fields.map((field) => field.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()));
    const header = [...labels, "Actions"].map((label) => `<th>${label}</th>`).join("");
    const body = rows.length ? rows.map((row) => `
      <tr>
        ${fields.map((field) => `<td>${formatValue(field, row[field], row)}</td>`).join("")}
        <td><div class="re-row-actions">
          <button type="button" class="re-action-button" data-action="view" data-id="${row.id}">View</button>
          <button type="button" class="re-action-button" data-action="edit" data-id="${row.id}">Edit</button>
          <button type="button" class="re-action-button danger" data-action="delete" data-id="${row.id}">Delete</button>
        </div></td>
      </tr>
    `).join("") : `<tr><td class="empty-state" colspan="${fields.length + 1}">No records found.</td></tr>`;
    root.innerHTML = `<div class="table-wrap"><table class="data-table"><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table></div>`;
    const count = document.querySelector(".table-count");
    if (count) count.textContent = `${rows.length} database records`;
  }

  async function loadResource(resource, search = "", notify = true) {
    try {
      const responseRows = await api(`/${resource}${search ? `?search=${encodeURIComponent(search)}` : ""}`);
      if (!Array.isArray(responseRows)) throw new Error("The server returned an invalid records response.");
      const rows = currentView === "hotleads" && resource === "leads"
        ? responseRows.filter((row) => row.temperature === "hot")
        : responseRows;
      renderRecords(resource, rows);
      return true;
    } catch (error) {
      const root = document.getElementById("tableRoot");
      if (root) root.innerHTML = `<p class="notice">${escapeHtml(error.message)}</p>`;
      if (notify) toast(error.message, "error");
      return false;
    }
  }

  async function loadOptions() {
    const loadedOptions = await api("/options");
    if (!loadedOptions || typeof loadedOptions !== "object" || Array.isArray(loadedOptions)) {
      throw new Error("The server returned invalid form options.");
    }
    options = loadedOptions;
  }

  function optionHtml(field) {
    if (!Array.isArray(field[4]) && typeof field[4] === "string") {
      return (options[field[4]] || []).map((option) => `<option value="${escapeHtml(option.id)}">${escapeHtml(option.name || option.unit_number || option.booking_number)}</option>`).join("");
    }
    if (Array.isArray(field[4])) {
      return field[4].map((option) => `<option value="${escapeHtml(option)}">${escapeHtml(String(option).replaceAll("_", " "))}</option>`).join("");
    }
    return "";
  }

  function fieldHtml(field, record) {
    const [name, label, type, required, choices] = field;
    const rawValue = record ? record[name] : "";
    let value = rawValue ?? "";
    if (type === "datetime-local" && value) value = String(value).replace(" ", "T").slice(0, 16);
    if (type === "date" && value) value = String(value).slice(0, 10);
    if (!record && type === "datetime-local" && ["stage_changed_at", "occurred_at", "earned_at", "paid_at"].includes(name)) {
      value = currentLocalDateTime();
    }
    const escaped = escapeHtml(value);
    const numericMinimum = name === "floor_number" ? "" : ["subject_id", "schedule_id"].includes(name) ? ' min="1"' : ' min="0"';
    const numericConstraints = type === "number"
      ? `${numericMinimum} step="${name === "area_sqft" ? "0.01" : "1"}"${["score_value", "booking_probability", "probability"].includes(name) ? ' max="100"' : ""}`
      : "";
    let control;
    if (type === "textarea") {
      control = `<textarea name="${name}" ${required ? "required" : ""}>${escaped}</textarea>`;
    } else if (type === "select") {
      control = `<select name="${name}" ${required ? "required" : ""}>
        <option value="">Select ${label}</option>${optionHtml(field).replaceAll(`value="${escaped}"`, `value="${escaped}" selected`)}</select>`;
    } else {
      control = `<input name="${name}" type="${type}" value="${escaped}" ${numericConstraints} ${required ? "required" : ""}>`;
    }
    return `<div class="re-form-field ${type === "textarea" ? "full" : ""}"><label>${label}${required ? " *" : ""}</label>${control}</div>`;
  }

  async function openModal(resource, record = null) {
    const fields = forms[resource];
    if (!fields) {
      toast("This page does not yet have a database form.", "error");
      return;
    }
    if (fields.some((field) => typeof field[4] === "string")) {
      try {
        await loadOptions();
        const missingOptionLists = fields
          .filter((field) => typeof field[4] === "string" && !Array.isArray(options[field[4]]))
          .map((field) => field[4]);
        if (missingOptionLists.length) {
          throw new Error(`Missing option lists: ${[...new Set(missingOptionLists)].join(", ")}.`);
        }
      } catch (error) {
        toast(`Unable to load form options: ${error.message}`, "error");
        return;
      }
    }
    const backdrop = document.createElement("div");
    backdrop.className = "re-modal-backdrop";
    backdrop.innerHTML = `
      <div class="re-modal" role="dialog" aria-modal="true">
        <div class="re-modal-heading"><h3>${record ? "View / Edit" : "New"} ${escapeHtml(document.getElementById("pageTitle").textContent)}</h3><button type="button" class="re-modal-close" aria-label="Close">×</button></div>
        <form id="reCrudForm">
          <div class="re-form-grid">${fields.map((field) => fieldHtml(field, record)).join("")}</div>
          <div class="re-form-actions"><button type="button" class="re-action-button re-modal-cancel">Cancel</button>${record ? `<button type="submit" class="re-new-button">Save Changes</button>` : `<button type="submit" class="re-new-button">Save</button>`}</div>
        </form>
      </div>`;
    document.body.appendChild(backdrop);
    if (record) {
      backdrop.querySelectorAll("select").forEach((select) => {
        const name = select.name;
        if (record[name] != null) select.value = String(record[name]);
      });
    }
    const close = () => backdrop.remove();
    backdrop.querySelector(".re-modal-close").addEventListener("click", close);
    backdrop.querySelector(".re-modal-cancel").addEventListener("click", close);
    backdrop.addEventListener("click", (event) => { if (event.target === backdrop) close(); });
    const modalForm = backdrop.querySelector("form");
    const submitButton = modalForm.querySelector('button[type="submit"]');
    let isSubmitting = false;
    modalForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (isSubmitting || !modalForm.reportValidity()) return;
      const form = new FormData(event.currentTarget);
      const body = {};
      fields.forEach(([name]) => {
        const value = form.get(name);
        if (record && value === "") body[name] = null;
        else if (value !== null && value !== "") body[name] = value;
      });
      isSubmitting = true;
      submitButton.disabled = true;
      try {
        let saved;
        if (record) saved = await api(`/${resource}/${record.id}`, "PATCH", body);
        else saved = await api(`/${resource}`, "POST", body);
        if (!saved || saved.id === undefined || saved.id === null) {
          throw new Error("The server did not confirm the saved record.");
        }
        close();
        toast("Record saved successfully.", "success");
        if (!await loadResource(resource, "", false)) {
          toast("Record saved, but the list could not be refreshed. Reopen this page to retry.", "error");
        }
      } catch (error) {
        toast(error.message, "error");
        isSubmitting = false;
        if (submitButton.isConnected) submitButton.disabled = false;
      }
    });
  }

  async function handleTableAction(resource, event) {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const id = button.dataset.id;
    const action = button.dataset.action;
    try {
      const rows = await api(`/${resource}`);
      const record = rows.find((row) => String(row.id) === String(id));
      if (!record) throw new Error("Record not found");
      if (action === "view") {
        await openModal(resource, record);
        const form = document.getElementById("reCrudForm");
        if (form) {
          form.querySelectorAll("input, select, textarea").forEach((input) => input.disabled = true);
          form.querySelector(".re-form-actions").innerHTML = `<button type="button" class="re-action-button re-modal-cancel">Close</button>`;
          form.querySelector(".re-modal-cancel").addEventListener("click", () => form.closest(".re-modal-backdrop").remove());
        }
      } else if (action === "edit") {
        await openModal(resource, record);
      } else if (action === "delete") {
        if (!window.confirm("Delete this record permanently?")) return;
        await api(`/${resource}/${id}`, "DELETE");
        if (await loadResource(resource, "", false)) toast("Record deleted successfully.", "success");
        else toast("Record deleted, but the list could not be refreshed. Reopen this page to retry.", "error");
      }
    } catch (error) {
      toast(error.message, "error");
    }
  }

  async function activateCrudView(view) {
    currentView = view;
    const resource = resourceByView[view];
    const newButton = document.getElementById("reNewButton");
    if (newButton) newButton.hidden = !resource || !forms[resource];
    if (!resource || !forms[resource]) return;

    await loadResource(resource);
    const search = document.getElementById("tableSearch");
    if (search) search.oninput = (event) => {
      loadResource(resource, event.target.value);
    };
    const tableRoot = document.getElementById("tableRoot");
    if (tableRoot) tableRoot.onclick = (event) => {
      handleTableAction(resource, event);
    };
  }

  const newButton = document.getElementById("reNewButton");
  newButton?.addEventListener("click", () => {
    const resource = resourceByView[currentView];
    if (resource && forms[resource]) openModal(resource);
  });

  if (window.realEstateCrudViewChangeHandler) {
    window.removeEventListener("realestate:viewchange", window.realEstateCrudViewChangeHandler);
  }
  window.realEstateCrudViewChangeHandler = (event) => {
    activateCrudView(event.detail.view);
  };
  window.addEventListener("realestate:viewchange", window.realEstateCrudViewChangeHandler);
})();
