import { useEffect, useState } from "react";

const API_URL = "http://localhost:8000/api/calling/history/";

export default function HumanHandover({ onHandoverResolved }) {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadHandoverCalls() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error("Unable to load handover records.");
      }

      const data = await response.json();

      setCalls(
  data.filter(
    (call) =>
      !call.handover_resolved &&
      (
        call.transfer_status === "pending" ||
        call.transfer_status === "failed" ||
        call.transfer_status === "success"
      )
  )
);
    } catch (err) {
      setError(err.message || "Could not connect to Django.");
    } finally {
      setLoading(false);
    }
  }
  async function resolveHandover(callId) {
  try {
    const response = await fetch(
      `http://localhost:8000/api/calling/resolve/${callId}/`,
      {
        method: "POST",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to resolve handover.");
    }

    await loadHandoverCalls();
if (onHandoverResolved) onHandoverResolved();
  } catch (err) {
    setError(err.message || "Could not resolve handover.");
  }
}

  useEffect(() => {
    loadHandoverCalls();
  }, []);

  return (
    <section className="leads-page">
      <div className="leads-page-header">
        <div>
          <p className="eyebrow">HUMAN SUPPORT</p>
          <h1>Human Handover</h1>
          <p className="page-description">
            Review calls requiring human assistance or callback.
          </p>
        </div>

        <button
          className="secondary-button"
          onClick={loadHandoverCalls}
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
            <h3>Handover Queue</h3>
            <p>{calls.length} handover records</p>
          </div>
        </div>

        <div className="table-wrap">
          <table className="leads-table">
            <thead>
              <tr>
                <th>LEAD</th>
                <th>CALL STATUS</th>
                <th>TRANSFER STATUS</th>
                <th>OUTCOME</th>
                <th>SUMMARY</th>
                <th>ACTION</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="no-results">
                    Loading handover records...
                  </td>
                </tr>
              ) : calls.length === 0 ? (
                <tr>
                  <td colSpan="6" className="no-results">
                    No handover records found.
                  </td>
                </tr>
              ) : (
                calls.map((call) => (
                  <tr key={call.id}>
                    <td>
                      <strong>
                        {call.lead_name || `Lead ${call.lead}`}
                      </strong>
                      <p className="lead-phone">{call.lead_phone || ""}</p>
                    </td>
                    <td>{call.call_status}</td>
                    <td>{call.transfer_status}</td>
                    <td>{call.outcome || "—"}</td>
                    <td>{call.summary || "—"}</td>
                    <td>
  {!call.handover_resolved ? (
    <button
      className="secondary-button"
      onClick={() => resolveHandover(call.id)}
    >
      Mark Resolved
    </button>
  ) : (
    <span>Resolved</span>
  )}
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
