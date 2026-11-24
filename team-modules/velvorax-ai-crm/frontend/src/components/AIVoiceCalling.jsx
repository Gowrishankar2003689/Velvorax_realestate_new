import { useEffect, useState } from "react";
import "./AIVoiceCalling.css";

// const API_URL = "http://localhost:8000";
const API_URL = "http://localhost:8000";
const AI_BRIDGE_URL = "http://127.0.0.1:8001";

function AIVoiceCalling() {
  const [leads, setLeads] = useState([]);
  const [selectedLead, setSelectedLead] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [callResult, setCallResult] = useState(null);

  async function loadLeads() {
    try {
      const response = await fetch(`${API_URL}/api/leads/`);
      if (!response.ok) throw new Error("Unable to load leads.");

      const data = await response.json();
      setLeads(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadLeads();
  }, []);

  async function startDemoCall() {
    if (!selectedLead) {
      setError("Please select a lead first.");
      return;
    }

    const lead = leads.find(
      (item) => String(item.id) === String(selectedLead)
    );

    if (
      !lead ||
      !lead.consent_to_call ||
      lead.do_not_call ||
      lead.opted_out
    ) {
      setError(
        "Call blocked. Verify consent and Do Not Call status."
      );
      setMessage("");
      setCallResult(null);
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");
    setCallResult(null);

    try {
      // Trigger our local AI Voice Bridge (FastAPI on port 8001)
      const response = await fetch(
        `${AI_BRIDGE_URL}/api/ai-call/start/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lead_id: Number(selectedLead),
            lead_name: lead.name,
            lead_phone: lead.phone || "",
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.detail ||
            data.message ||
            "The AI voice call could not be started."
        );
      }

      // Format response to match your CRM result card expectations
      setCallResult({
        call: {
          lead_name: lead.name,
          call_status: "Completed",
          interest_level: data.interest_level || "unknown",
          requirement: data.summary || "AI voice conversation completed.",
          transfer_status: data.handover_requested ? "Requested" : "Not required",
          next_action: data.interest_level === "interested" ? "meeting" : "none",
          summary: data.summary || "No summary available.",
          outcome: "Live voice session completed via local AI engine.",
        },
      });

      setMessage(data.message || "AI Voice call completed successfully.");
      await loadLeads();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="ai-calling-page">
      <div className="ai-calling-heading">
        <div>
          <h1>AI Voice Calling</h1>
          <p>Run live local AI voice calls integrated with your CRM dashboard.</p>
        </div>
      </div>

      <section className="ai-calling-card">
        <div className="ai-calling-card-heading">
          <div className="ai-calling-icon">☎</div>
          <div>
            <h2>Start Live AI Voice Call</h2>
            <p>
              Select a customer to launch the local Whisper, Ollama, and Kokoro AI voice session.
            </p>
          </div>
        </div>

        <label htmlFor="calling-lead">Select Lead</label>
        <select
          id="calling-lead"
          value={selectedLead}
          onChange={(event) => {
            setSelectedLead(event.target.value);
            setMessage("");
            setError("");
          }}
        >
          <option value="">Choose a lead...</option>
          {leads.map((lead) => (
            <option key={lead.id} value={lead.id}>
              {lead.name} — {lead.phone || "No phone"}
            </option>
          ))}
        </select>

        {selectedLead && (
          <div className="selected-lead-info">
            {(() => {
              const lead = leads.find(
                (item) => String(item.id) === String(selectedLead)
              );

              if (!lead) return null;

              const blocked =
                !lead.consent_to_call ||
                lead.do_not_call ||
                lead.opted_out;

              return (
                <>
                  <p>
                    <strong>Consent:</strong>{" "}
                    {lead.consent_to_call ? "Recorded" : "Not recorded"}
                  </p>
                  <p>
                    <strong>Do Not Call:</strong>{" "}
                    {lead.do_not_call || lead.opted_out ? "Yes" : "No"}
                  </p>
                  <p>
                    <strong>Eligibility:</strong>{" "}
                    {blocked ? "Blocked" : "Eligible for AI voice call"}
                  </p>
                </>
              );
            })()}
          </div>
        )}

        {error && <div className="calling-message error">{error}</div>}
        {message && (
          <div className="calling-message success">{message}</div>
        )}

        {callResult?.call && (
          <div className="call-result-card">
            <h3>AI Call Results</h3>

            <div className="call-result-row">
              <span>Customer</span>
              <strong>
                {callResult.call.lead_name || "Selected lead"}
              </strong>
            </div>

            <div className="call-result-row">
              <span>Call Status</span>
              <strong>{callResult.call.call_status}</strong>
            </div>

            <div className="call-result-row">
              <span>Interest Level</span>
              <strong>{callResult.call.interest_level}</strong>
            </div>

            <div className="call-result-row">
              <span>Requirement</span>
              <strong>{callResult.call.requirement}</strong>
            </div>

            <div className="call-result-row">
              <span>Human Handover</span>
              <strong>{callResult.call.transfer_status}</strong>
            </div>

            <div className="call-result-row">
              <span>Next Action</span>
              <strong>{callResult.call.next_action}</strong>
            </div>

            <div className="call-result-summary">
              <strong>AI Conversation Summary</strong>
              <p>{callResult.call.summary}</p>
            </div>
          </div>
        )}

        <button
          className="start-demo-button"
          onClick={startDemoCall}
          disabled={loading || !selectedLead}
        >
          {loading ? "AI Call in Progress (Speak into Mic)..." : "Start Live AI Call"}
        </button>

        <p className="calling-disclaimer">
          This system uses local open-source AI (Whisper, Ollama, and Kokoro) connected directly to your microphone and speakers.
        </p>
      </section>
    </div>
  );
}

export default AIVoiceCalling;
