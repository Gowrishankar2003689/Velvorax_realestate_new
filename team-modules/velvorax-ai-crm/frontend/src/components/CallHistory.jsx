
import { useEffect, useState } from "react";

const API_URL = "http://localhost:8000/api/calling/history/";

export default function CallHistory() {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const filteredCalls = calls.filter((call) => {
  const matchesStatus =
    statusFilter === "all" || call.call_status === statusFilter;

  const search = searchTerm.trim().toLowerCase();

  const matchesSearch =
    (call.lead_name || "").toLowerCase().includes(search) ||
    (call.lead_phone || "").toLowerCase().includes(search);

  return matchesStatus && matchesSearch;
});
const totalCalls = calls.length;

const blockedCalls = calls.filter(
  (call) => call.call_status === "blocked"
).length;

const completedCalls = calls.filter(
  (call) => call.call_status === "completed"
).length;

const failedCalls = calls.filter(
  (call) => call.call_status === "failed"
).length;
async function loadCalls() {
  setLoading(true);
  setError("");

  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error(`Unable to load call history (${response.status}).`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("Unexpected response from the calling API.");
    }

    setCalls(data);
  } catch (err) {
    setError(err.message || "Could not connect to Django.");
  } finally {
    setLoading(false);
  }
}

useEffect(() => {
  loadCalls();
}, []);

  return (
    <section className="leads-page">
      <div className="leads-page-header">
        <div>
          <p className="eyebrow">CALLING ACTIVITY</p>
          <h1>Call History</h1>
          <p className="page-description">
            Review simulated calls, transfer results and call summaries.
          </p>
        </div>

        <button
          className="secondary-button"
          onClick={loadCalls}
          disabled={loading}
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="info-message" role="alert">
          {error}
        </div>
      )}
      <div className="dashboard-stats">
  <div className="stat-card">
    <p>Total Calls</p>
    <h2>{totalCalls}</h2>
  </div>

  <div className="stat-card">
    <p>Blocked Calls</p>
    <h2>{blockedCalls}</h2>
  </div>

  <div className="stat-card">
    <p>Completed Calls</p>
    <h2>{completedCalls}</h2>
  </div>

  <div className="stat-card">
    <p>Failed Calls</p>
    <h2>{failedCalls}</h2>
  </div>
</div>

      <div className="leads-table-card">
        <div className="panel-heading leads-heading">
  <div>
    <h3>Recorded Calls</h3>
    <p>{filteredCalls.length} call records</p>
    <input
  type="text"
  placeholder="Search by lead name or phone..."
  value={searchTerm}
  onChange={(event) => setSearchTerm(event.target.value)}
  aria-label="Search calls"
/>
<button
  type="button"
  className="secondary-button"
  onClick={() => setSearchTerm("")}
>
  Clear Search
</button>
  </div>

  <select
    value={statusFilter}
    onChange={(event) => setStatusFilter(event.target.value)}
    aria-label="Filter calls by status"
  >
    <option value="all">All Statuses</option>
    <option value="blocked">Blocked</option>
    <option value="completed">Completed</option>
    <option value="in_progress">In Progress</option>
    <option value="failed">Failed</option>
  </select>
</div>

        <div className="table-wrap">
          <table className="leads-table">
           <thead>
  <tr>
    <th>LEAD</th>
    <th>CALL STATUS</th>
    <th>AUDIO RECORDING</th>
    <th>TRANSCRIPT & SUMMARY</th>
    <th>INTEREST LEVEL</th>
    <th>CREATED</th>
  </tr>
</thead>
<tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="no-results">
                    Loading call history...
                  </td>
                </tr>
              ) : filteredCalls.length === 0 ? (
                <tr>
                  <td colSpan="6" className="no-results">
                    No calls recorded yet. Start a demo call from Lead Management.
                  </td>
                </tr>
              ) : (
                filteredCalls.map((call) => (
                  <tr key={call.id}>
                    <td>
                      <strong>{call.lead_name || `Lead ${call.lead}`}</strong>
                      <p className="lead-phone">{call.lead_phone || ""}</p>
                    </td>
                    <td>
                      {call.call_status === "in_progress"
                        ? "In Progress"
                        : call.call_status.charAt(0).toUpperCase() +
                          call.call_status.slice(1)}
                    </td>
                    <td>
                      {call.recording ? (
                        <audio
                          controls
                          src={call.recording.startsWith("http") ? call.recording : `http://localhost:8000${call.recording}`}
                          style={{ width: "160px", height: "32px" }}
                        />
                      ) : (
                        <span style={{ color: "#888", fontSize: "12px" }}>No audio file</span>
                      )}
                    </td>
                    <td>
                      <p style={{ marginBottom: "4px" }}><strong>Summary:</strong> {call.summary || "—"}</p>
                      <details style={{ cursor: "pointer" }}>
                        <summary style={{ color: "#4f46e5", fontWeight: "600", fontSize: "12px" }}>View Full Transcript</summary>
                        <pre style={{ whiteSpace: "pre-wrap", fontSize: "11px", background: "#f8fafc", padding: "6px", borderRadius: "4px", marginTop: "4px", maxHeight: "100px", overflowY: "auto" }}>
                          {call.transcript || "No transcript recorded."}
                        </pre>
                      </details>
                    </td>
                    <td>{call.interest_level || "—"}</td>
                    <td>
                      {call.created_at
                        ? new Date(call.created_at).toLocaleString()
                        : "—"}
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
