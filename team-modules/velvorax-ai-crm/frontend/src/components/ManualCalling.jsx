import { useEffect, useState } from "react";

const BASE_URL = "http://localhost:8000";

export default function ManualCalling() {
  const [leads, setLeads] = useState([]);
  const [leadId, setLeadId] = useState("");
  const [callStatus, setCallStatus] = useState("completed");
  const [outcome, setOutcome] = useState("");
  const [summary, setSummary] = useState("");
  const [duration, setDuration] = useState(0);
  const [recording, setRecording] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`${BASE_URL}/api/leads/`)
      .then((res) => res.json())
      .then((data) => {
        setLeads(Array.isArray(data) ? data : data.results || []);
      })
      .catch(() => setMessage("Unable to load leads."));
  }, []);

  const callCustomer = () => {
  const selectedLead = leads.find(
    (lead) => String(lead.id) === String(leadId)
  );

  if (!selectedLead || !selectedLead.phone) {
    setMessage("Please select a lead with a valid phone number.");
    return;
  }

  const phone = String(selectedLead.phone).trim();

  // Open the device's phone dialer.
  window.location.href = `tel:${phone.replace(/[^\d+]/g, "")}`;
};

  const saveCall = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const formData = new FormData();
    formData.append("lead", leadId);
    formData.append("call_status", callStatus);
    formData.append("outcome", outcome);
    formData.append("summary", summary);
    formData.append("duration_seconds", duration);

    if (recording) {
      formData.append("recording", recording);
    }

    try {
      const res = await fetch(`${BASE_URL}/api/calling/manual/`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(JSON.stringify(data));
      }

      setMessage("Manual call saved successfully!");
      setOutcome("");
      setSummary("");
      setDuration(0);
      setRecording(null);
      e.target.reset();
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 700 }}>
      <h2>Manual Calling</h2>
      <p>Record a human telecaller's call details.</p>

      <form onSubmit={saveCall}>
        <label>Select Lead</label>
        <select
          required
          value={leadId}
          onChange={(e) => setLeadId(e.target.value)}
        >
          <option value="">Choose a lead</option>
          {leads.map((lead) => (
            <option key={lead.id} value={lead.id}>
              {lead.name} - {lead.phone}
            </option>
          ))}
        </select>

        <label>Call Status</label>
        <select
          value={callStatus}
          onChange={(e) => setCallStatus(e.target.value)}
        >
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="pending">Pending</option>
        </select>

        <label>Call Outcome</label>
        <input
          value={outcome}
          onChange={(e) => setOutcome(e.target.value)}
          placeholder="Customer interested"
        />

        <label>Call Notes</label>
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="Enter call summary"
        />

        <label>Duration (seconds)</label>
        <input
          type="number"
          min="0"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
        />

        <label>Audio Recording (optional)</label>
        <input
          type="file"
          accept="audio/*"
          onChange={(e) => setRecording(e.target.files[0] || null)}
        />

        <button type="submit" disabled={loading || !leadId}>
          {loading ? "Saving..." : "Save Manual Call"}
        </button>
      </form>

      <button
  type="button"
  onClick={callCustomer}
  disabled={!leadId}
>
  Call Customer
</button>

      {message && <p>{message}</p>}
    </div>
  );
}
