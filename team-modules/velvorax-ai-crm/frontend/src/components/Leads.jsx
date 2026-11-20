
import { useEffect, useState } from "react";
import "./Leads.css";
import {
  Search,
  Plus,
  Users,
  Phone,
  Building2,
  Filter,
  X,
} from "lucide-react";

const API_URL = "http://localhost:8000/api/leads/";

const STATUS_LABELS = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  converted: "Converted",
  lost: "Lost",
};


function formatLead(lead) {
  return {
    ...lead,
    status: STATUS_LABELS[lead.status] || lead.status,
    interest:
  lead.interest_level && lead.interest_level !== "unknown"
    ? lead.interest_level.replaceAll("_", " ")
    : "Not assessed",
    consent: lead.opted_out
  ? "Opted out"
  : lead.do_not_call
    ? "Do not call"
    : lead.consent_to_call
      ? "Granted"
      : "Not verified",
  };
}


export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [callingLeadId, setCallingLeadId] = useState(null);
const [callMessage, setCallMessage] = useState("");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    company: "",
    email: "",
    source: "Manual",
    status: "new",
    notes: "",
    consent: "Not verified",
    do_not_call: false,
    opted_out: false,
  });

  async function loadLeads() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error(`Could not load leads (${response.status}).`);
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("Unexpected API response. Expected a list of leads.");
      }

      setLeads(data.map(formatLead));
    } catch (err) {
      setError(
        err.message ||
          "Unable to connect to Django. Check that the backend is running."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLeads();
  }, []);

  const filteredLeads = leads.filter((lead) => {
    const query = search.toLowerCase();

    const matchesSearch = [
      lead.name,
      lead.phone,
      lead.company,
    ].some((value) =>
      (value || "").toLowerCase().includes(query)
    );

    const matchesStatus =
      statusFilter === "All" || lead.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  async function addLead(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const phone = form.phone.trim();

    if (leads.some((lead) => lead.phone === phone)) {
      setError("A lead with this phone number already exists.");
      setSaving(false);
      return;
    }

    const payload = {
      name: form.name.trim(),
      phone,
      company: form.company.trim(),
      email: form.email.trim(),
      source: form.source,
      status: form.status,
      notes: form.notes.trim(),
      consent_to_call: form.consent === "Granted",
      do_not_call: form.do_not_call,
      opted_out: form.opted_out,
    };

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        const message =
          data.phone?.[0] ||
          data.name?.[0] ||
          data.email?.[0] ||
          data.detail ||
          "Could not save the lead. Please check the form.";
        throw new Error(message);
      }

      setLeads((current) => [formatLead(data), ...current]);

      setForm({
        name: "",
        phone: "",
        company: "",
        email: "",
        source: "Manual",
        status: "new",
        notes: "",
        consent: "Not verified",
        do_not_call: false,
        opted_out: false,
      });

      setShowForm(false);
    } catch (err) {
      setError(
        err.message ||
          "Unable to save the lead. Check the Django server and try again."
      );
    } finally {
      setSaving(false);
    }
  }


async function startDemoCall(lead) {
  setCallMessage("");

  // Give immediate feedback before sending the request.
  if (
  !lead.consent_to_call ||
  lead.do_not_call ||
  lead.opted_out
) {
    setCallMessage(
      `Call blocked for ${lead.name}: verify consent and do-not-call status.`
    );
    return;
  }

  setCallingLeadId(lead.id);

  try {
    const response = await fetch(
      `http://localhost:8000/api/calling/start/${lead.id}/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || data.detail || "Call request failed.");
    }

    setCallMessage(
      `${data.message} Lead: ${lead.name}.`
    );
    await loadLeads();
  } catch (err) {
    setCallMessage(
      err.message || "Unable to connect to the calling API."
    );
  } finally {
    setCallingLeadId(null);
  }
}


  return (
    <section className="leads-page">
      <div className="leads-page-header">
        <div>
          <p className="eyebrow">CUSTOMER RELATIONSHIPS</p>
          <h1>Lead Management</h1>
          <p className="page-description">
            Manage prospects, contact information, and consent status.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={() => {
            setError("");
            setShowForm(true);
          }}
        >
          <Plus size={17} />
          Add New Lead
        </button>
      </div>

      {error && (
        <div className="info-message" role="alert">
          {error}
        </div>
      )}
      {callMessage && (
  <div className="info-message" role="status">
    {callMessage}
  </div>
)}

      <div className="lead-summary">
        <div>
          <Users size={21} />
          <span>Total Leads</span>
          <strong>{leads.length}</strong>
        </div>

        <div>
          <Phone size={21} />
          <span>New Leads</span>
          <strong>
            {leads.filter((lead) => lead.status === "New").length}
          </strong>
        </div>

        <div>
          <Building2 size={21} />
          <span>Companies</span>
          <strong>
            {
              new Set(
                leads.map((lead) => lead.company).filter(Boolean)
              ).size
            }
          </strong>
        </div>
      </div>

      <div className="leads-toolbar">
        <label className="leads-search">
          <Search size={18} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, phone, or company..."
          />
        </label>

        <label className="leads-filter">
          <Filter size={16} />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="All">All statuses</option>
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="Qualified">Qualified</option>
            <option value="Converted">Converted</option>
            <option value="Lost">Lost</option>
          </select>
        </label>

        <button
          className="secondary-button"
          type="button"
          onClick={loadLeads}
          disabled={loading}
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      <div className="leads-table-card">
        <div className="panel-heading leads-heading">
          <div>
            <h3>All Leads</h3>
            <p>{filteredLeads.length} matching records</p>
          </div>
        </div>

        <div className="table-wrap">
          <table className="leads-table">
            <thead>
              <tr>
                <th>CONTACT</th>
                <th>COMPANY</th>
                <th>SOURCE</th>
                <th>STATUS</th>
                <th>INTEREST</th>
                <th>CALL STATUS</th>
                <th>ACTION</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="no-results">
                    Loading leads from the database...
                  </td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan="6" className="no-results">
                    No leads found. Try another search or add a lead.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead.id}>
                    <td>
                      <div className="contact-cell">
                        <div className="contact-avatar avatar-blue">
                          {lead.name.slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <strong>{lead.name}</strong>
                          <p className="lead-phone">{lead.phone}</p>
                        </div>
                      </div>
                    </td>

                    <td>{lead.company || "—"}</td>
                    <td>{lead.source || "—"}</td>

                    <td>
                      <span className="status-tag blue">
                        <span />
                        {lead.status}
                      </span>
                    </td>

                    <td>{lead.interest}</td>

                    <td>
                      <span
                        className={`status-tag ${
                          lead.do_not_call
                            ? "gray"
                            : lead.consent_to_call
                              ? "green"
                              : "gray"
                        }`}
                      >
                        <span />
                        {lead.consent}
                      </span>

<td>
  <button
    type="button"
    className="secondary-button"
    disabled={callingLeadId === lead.id}
    onClick={() => startDemoCall(lead)}
  >
    {callingLeadId === lead.id ? "Starting..." : "Start Demo Call"}
  </button>
</td>

                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="lead-modal-backdrop">
          <form className="lead-modal" onSubmit={addLead}>
            <div className="lead-modal-header">
              <div>
                <h2>Add New Lead</h2>
                <p>Enter the customer's contact details.</p>
              </div>

              <button
                type="button"
                className="icon-button"
                onClick={() => setShowForm(false)}
                aria-label="Close form"
              >
                <X size={20} />
              </button>
            </div>

            <label>
              Full name
              <input
                required
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
                placeholder="Enter full name"
              />
            </label>

            <label>
              Phone number
              <input
                required
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                pattern="[0-9+() -]{7,20}"
                value={form.phone}
                onChange={(event) =>
                  setForm({ ...form, phone: event.target.value })
                }
                placeholder="Enter phone number"
              />
            </label>

            <label>
              Email
              <input
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm({ ...form, email: event.target.value })
                }
                placeholder="Enter email address"
              />
            </label>

            <label>
              Company
              <input
                value={form.company}
                onChange={(event) =>
                  setForm({ ...form, company: event.target.value })
                }
                placeholder="Enter company name"
              />
            </label>

            <label>
              Lead source
              <select
                value={form.source}
                onChange={(event) =>
                  setForm({ ...form, source: event.target.value })
                }
              >
                <option>Manual</option>
                <option>Website</option>
                <option>Google Ads</option>
                <option>Referral</option>
                <option>CSV Import</option>
              </select>
            </label>

            <label>
              Status
              <select
                value={form.status}
                onChange={(event) =>
                  setForm({ ...form, status: event.target.value })
                }
              >
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="converted">Converted</option>
                <option value="lost">Lost</option>
              </select>
            </label>

            <label>
              Consent status
              <select
                value={form.consent}
                onChange={(event) =>
                  setForm({ ...form, consent: event.target.value })
                }
              >
                <option>Not verified</option>
                <option>Granted</option>
                <option>Denied</option>
              </select>
            </label>

            <label>
              Do not call
              <select
                value={form.do_not_call ? "yes" : "no"}
                onChange={(event) =>
                  setForm({
                    ...form,
                    do_not_call: event.target.value === "yes",
                  })
                }
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </label>
            <label>
  Customer opted out
  <select
    value={form.opted_out ? "yes" : "no"}
    onChange={(event) =>
      setForm({
        ...form,
        opted_out: event.target.value === "yes",
      })
    }
  >
    <option value="no">No</option>
    <option value="yes">Yes</option>
  </select>
</label>

            <label>
              Notes
              <textarea
                value={form.notes}
                onChange={(event) =>
                  setForm({ ...form, notes: event.target.value })
                }
                placeholder="Add notes about this lead"
                rows={3}
              />
            </label>

            <p className="consent-notice">
              Only record consent when it has been verified. A lead marked
              Do not call must never be called, even if consent is granted.
            </p>

            <div className="lead-modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setShowForm(false)}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="primary-button"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Lead"}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
