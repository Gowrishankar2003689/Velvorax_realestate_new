import { useEffect, useState } from "react";

const API_URL = "http://localhost:8000/api/meetings/";
const LEADS_API_URL = "http://localhost:8000/api/leads/";
const FASTAPI_CALL_URL = "http://127.0.0.1:8001/api/ai-call/start/";

export default function Meetings() {
  const [meetings, setMeetings] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [form, setForm] = useState({
    lead: "",
    title: "",
    description: "",
    scheduled_at: "",
    duration_minutes: 15,
    assigned_to: "",
  });

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [meetingsResponse, leadsResponse] = await Promise.all([
        fetch(API_URL),
        fetch(LEADS_API_URL),
      ]);

      const meetingsData = await meetingsResponse.json();
      const leadsData = await leadsResponse.json();

      setMeetings(meetingsData);
      setLeads(leadsData);
    } catch (err) {
      setError(err.message || "Could not connect to Django.");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

async function createMeeting(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!form.lead) {
      setError("Please select a lead.");
      return;
    }

    const scheduledDate = new Date(form.scheduled_at);
    if (!form.scheduled_at || Number.isNaN(scheduledDate.getTime())) {
      setError("Please choose a valid date and time.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead: Number(form.lead),
          title: form.title,
          description: form.description,
          scheduled_at: scheduledDate.toISOString(),
          duration_minutes: Number(form.duration_minutes),
          assigned_to: form.assigned_to,
        }),
      });

      // Safely check if response is JSON before parsing
      const contentType = response.headers.get("content-type");
      let data = {};
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        throw new Error(`Django Server Error (${response.status}). Check your Python terminal for the traceback.`);
      }

      if (!response.ok) {
        const detail =
          data.detail ||
          data.scheduled_at?.[0] ||
          data.lead?.[0] ||
          JSON.stringify(data) ||
          "Unable to schedule AI call.";
        throw new Error(detail);
      }

      setMessage("AI Call scheduled successfully.");
      setForm({
        lead: "",
        title: "",
        description: "",
        scheduled_at: "",
        duration_minutes: 15,
        assigned_to: "",
      });

      await loadData();
    } catch (err) {
      setError(err.message || "Scheduling failed.");
    } finally {
      setSaving(false);
    }
  }

  async function startAICallForMeeting(meeting) {
    if (!window.confirm(`Start live AI voice call now for "${meeting.title}"?`)) return;

    setError("");
    setMessage("");

    try {
      const response = await fetch(FASTAPI_CALL_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead_id: meeting.lead }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to trigger AI voice call.");
      }

      // Automatically mark meeting as completed after successful call
      await fetch(`${API_URL}${meeting.id}/complete/`, { method: "POST" });

      setMessage(`AI call completed for "${meeting.title}". Audio & transcript saved!`);
      await loadData();
    } catch (err) {
      setError(err.message || "Could not connect to FastAPI bridge server (port 8001).");
    }
  }

  async function cancelMeeting(meeting) {
    if (!window.confirm(`Cancel scheduled call "${meeting.title}"?`)) return;
    try {
      await fetch(`${API_URL}${meeting.id}/cancel/`, { method: "POST" });
      setMessage("Scheduled call cancelled.");
      await loadData();
    } catch (err) {
      setError("Cancellation failed.");
    }
  }

  async function completeMeeting(meeting) {
    try {
      await fetch(`${API_URL}${meeting.id}/complete/`, { method: "POST" });
      setMessage("Call marked as completed.");
      await loadData();
    } catch (err) {
      setError("Action failed.");
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredMeetings = meetings.filter(
    (meeting) => statusFilter === "all" || meeting.status === statusFilter
  );

  return (
    <section className="leads-page">
      <div className="leads-page-header">
        <div>
          <p className="eyebrow">AI OUTREACH & AUTOMATION</p>
          <h1>Scheduled AI Calls</h1>
          <p className="page-description">
            Schedule future automated AI calls and trigger them instantly when ready.
          </p>
        </div>
        <button type="button" className="secondary-button" onClick={loadData} disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {error && <div className="info-message" role="alert">{error}</div>}
      {message && <div className="info-message" role="status">{message}</div>}

      <div className="leads-table-card meeting-form-card">
        <div className="panel-heading">
          <h3>Schedule an AI Call</h3>
        </div>

        <form className="meeting-form" onSubmit={createMeeting}>
          <label>
            Lead *
            <select name="lead" value={form.lead} onChange={handleChange} required>
              <option value="">Select a lead</option>
              {leads.map((lead) => (
                <option key={lead.id} value={lead.id}>
                  {lead.name} ({lead.phone})
                </option>
              ))}
            </select>
          </label>

          <label>
            Call Title / Purpose *
            <input name="title" value={form.title} onChange={handleChange} placeholder="e.g., Automated Follow-up Call" required />
          </label>

          <label>
            Description / Notes
            <textarea name="description" value={form.description} onChange={handleChange} placeholder="What should the AI discuss?" rows="3" />
          </label>

          <label>
            Call Date and Time *
            <input type="datetime-local" name="scheduled_at" value={form.scheduled_at} onChange={handleChange} required />
          </label>

          <label>
            Estimated Duration (minutes) *
            <input type="number" name="duration_minutes" value={form.duration_minutes} onChange={handleChange} min="1" max="120" required />
          </label>

          <label>
            Assigned Owner
            <input name="assigned_to" value={form.assigned_to} onChange={handleChange} placeholder="Sales Rep Name" />
          </label>

          <button type="submit" className="primary-button" disabled={saving || loading || leads.length === 0}>
            {saving ? "Scheduling..." : "Schedule AI Call"}
          </button>
        </form>
      </div>

      <div className="leads-table-card">
        <div className="panel-heading leads-heading">
          <div>
            <h3>Scheduled AI Call Queue</h3>
            <p>{filteredMeetings.length} calls displayed</p>
          </div>

          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="table-wrap">
          <table className="leads-table">
            <thead>
              <tr>
                <th>LEAD</th>
                <th>PURPOSE</th>
                <th>SCHEDULED TIME</th>
                <th>DURATION</th>
                <th>ASSIGNED TO</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="no-results">Loading scheduled calls...</td></tr>
              ) : filteredMeetings.length === 0 ? (
                <tr><td colSpan="7" className="no-results">No scheduled AI calls found.</td></tr>
              ) : (
                filteredMeetings.map((meeting) => (
                  <tr key={meeting.id}>
                    <td><strong>{meeting.lead_name || `Lead ${meeting.lead}`}</strong></td>
                    <td>{meeting.title}</td>
                    <td>{new Date(meeting.scheduled_at).toLocaleString()}</td>
                    <td>{meeting.duration_minutes} min</td>
                    <td>{meeting.assigned_to || "Unassigned"}</td>
                    <td><span className={`status-badge ${meeting.status}`}>{meeting.status}</span></td>
                    <td>
                      {meeting.status === "pending" && (
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                          <button
                            type="button"
                            className="primary-button"
                            onClick={() => startAICallForMeeting(meeting)}
                            style={{ background: "#4f46e5", color: "#fff", padding: "4px 10px", fontSize: "12px" }}
                          >
                            Start AI Call
                          </button>
                          <button
                            type="button"
                            className="secondary-button"
                            onClick={() => cancelMeeting(meeting)}
                            style={{ padding: "4px 8px", fontSize: "12px" }}
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                      {meeting.status === "completed" && "Completed"}
                      {meeting.status === "cancelled" && "Cancelled"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}