
import { useEffect, useState } from "react";

const API_URL = "http://localhost:8000/api/calling/follow-ups/";

export default function FollowUps() {
  const [followUps, setFollowUps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [assigningId, setAssigningId] = useState(null);
  const [completingId, setCompletingId] = useState(null);
  const [telecallerNames, setTelecallerNames] = useState({});
  const [assignmentFilter, setAssignmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  async function loadFollowUps() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error(`Unable to load follow-ups (${response.status}).`);
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("Unexpected response from the follow-ups API.");
      }

      setFollowUps(data);
    } catch (err) {
      setError(err.message || "Could not connect to Django.");
    } finally {
      setLoading(false);
    }
  }

  async function assignTelecaller(item) {
    const name = (telecallerNames[item.id] ?? item.assigned_to ?? "").trim();

    if (item.status !== "pending") {
      setError("Only pending follow-ups can be assigned.");
      return;
    }

    if (!name) {
      setError("Please enter a telecaller name.");
      return;
    }

    setAssigningId(item.id);
    setError("");

    try {
      const response = await fetch(`${API_URL}${item.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigned_to: name }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || data.message || "Unable to assign telecaller."
        );
      }

      setTelecallerNames((previous) => ({
        ...previous,
        [item.id]: name,
      }));

      await loadFollowUps();
    } catch (err) {
      setError(err.message || "Assignment failed.");
    } finally {
      setAssigningId(null);
    }
  }

  async function completeFollowUp(item) {
    if (item.status !== "pending") {
      setError("Only pending follow-ups can be completed.");
      return;
    }

    if (!item.assigned_to?.trim()) {
      setError("Assign a telecaller before completing this follow-up.");
      return;
    }

    const confirmed = window.confirm(
      `Mark the follow-up for ${item.lead_name || `Lead ${item.lead}`} as completed?`
    );

    if (!confirmed) return;

    setCompletingId(item.id);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}${item.id}/complete/`,
        { method: "POST" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || data.message || "Unable to complete follow-up."
        );
      }

      await loadFollowUps();
    } catch (err) {
      setError(err.message || "Could not complete follow-up.");
    } finally {
      setCompletingId(null);
    }
  }

  useEffect(() => {
    loadFollowUps();
  }, []);

  const filteredFollowUps = followUps.filter((item) => {
    const matchesAssignment =
      assignmentFilter === "all" ||
      (assignmentFilter === "assigned" && Boolean(item.assigned_to?.trim())) ||
      (assignmentFilter === "unassigned" && !item.assigned_to?.trim());

    const matchesStatus =
      statusFilter === "all" || item.status === statusFilter;

    return matchesAssignment && matchesStatus;
  });

  return (
    <section className="leads-page">
      <div className="leads-page-header">
        <div>
          <p className="eyebrow">CUSTOMER FOLLOW-UP</p>
          <h1>Follow-ups</h1>
          <p className="page-description">
            Review callbacks and tasks that need human attention.
          </p>
        </div>

        <button
          className="secondary-button"
          onClick={loadFollowUps}
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

      <div className="leads-table-card">
        <div className="panel-heading leads-heading">
          <div>
            <h3>Callback Queue</h3>
            <p>
              {filteredFollowUps.length} displayed / {followUps.length} total
            </p>
          </div>

          <div className="follow-up-filters">
            <select
              value={assignmentFilter}
              onChange={(event) => setAssignmentFilter(event.target.value)}
              aria-label="Filter by assignment"
            >
              <option value="all">All Assignments</option>
              <option value="assigned">Assigned</option>
              <option value="unassigned">Unassigned</option>
            </select>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter by status"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="table-wrap">
          <table className="leads-table">
            <thead>
              <tr>
                <th>LEAD</th>
                <th>REASON</th>
                <th>SCHEDULED AT</th>
                <th>STATUS</th>
                <th>ASSIGNED TELECALLER</th>
                <th>CREATED</th>
                <th>ACTION</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="no-results">
                    Loading follow-ups...
                  </td>
                </tr>
              ) : filteredFollowUps.length === 0 ? (
                <tr>
                  <td colSpan="7" className="no-results">
                    No follow-ups found.
                  </td>
                </tr>
              ) : (
                filteredFollowUps.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.lead_name || `Lead ${item.lead}`}</strong>
                    </td>

                    <td>{item.reason}</td>

                    <td>
                      {item.scheduled_at
                        ? new Date(item.scheduled_at).toLocaleString()
                        : "Not scheduled"}
                    </td>

                    <td>
                      <span className={`status-badge status-${item.status}`}>
                        {item.status}
                      </span>
                    </td>

                    <td>
                      <input
                        type="text"
                        value={
                          telecallerNames[item.id] ?? item.assigned_to ?? ""
                        }
                        onChange={(event) =>
                          setTelecallerNames((previous) => ({
                            ...previous,
                            [item.id]: event.target.value,
                          }))
                        }
                        placeholder="Enter telecaller name"
                        disabled={item.status !== "pending"}
                      />
                    </td>

                    <td>
                      {item.created_at
                        ? new Date(item.created_at).toLocaleString()
                        : "—"}
                    </td>

                    <td>
                      <div className="follow-up-actions">
                        <button
                          type="button"
                          className="secondary-button"
                          disabled={
                            assigningId === item.id ||
                            item.status !== "pending"
                          }
                          onClick={() => assignTelecaller(item)}
                        >
                          {assigningId === item.id ? "Assigning..." : "Assign"}
                        </button>

                        {item.status === "pending" && (
                          <button
                            type="button"
                            className="primary-button"
                            disabled={
                              completingId === item.id ||
                              assigningId === item.id ||
                              !item.assigned_to?.trim()
                            }
                            onClick={() => completeFollowUp(item)}
                          >
                            {completingId === item.id
                              ? "Completing..."
                              : "Complete"}
                          </button>
                        )}
                      </div>
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
