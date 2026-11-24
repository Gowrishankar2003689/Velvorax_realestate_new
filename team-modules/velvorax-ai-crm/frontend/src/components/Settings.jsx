import { useState } from "react";
import "./Settings.css";

function Settings() {
  const [callingMode, setCallingMode] = useState("demo");
  const [handoverEnabled, setHandoverEnabled] = useState(true);
  const [consentRequired, setConsentRequired] = useState(true);

  return (
    <div className="settings-page">
      <div className="settings-heading">
        <div>
          <h1>Settings</h1>
          <p>Manage your Velvorax CRM calling preferences.</p>
        </div>

      </div>

      <section className="settings-card">
        <div className="settings-card-heading">
          <div className="settings-icon">☎</div>
          <div>
            <h2>AI Calling Settings</h2>
            <p>Configure the calling mode for your CRM.</p>
          </div>
        </div>

        <label className="settings-label" htmlFor="callingMode">
          Calling Mode
        </label>

        <select
          id="callingMode"
          value={callingMode}
          onChange={(event) => setCallingMode(event.target.value)}
        >
          <option value="demo">Demo Mode (Simulated Calls)</option>
          <option value="real" disabled>
            Real Voice Calling (Provider Not Configured)
          </option>
        </select>

        <p className="settings-help">
          Demo mode simulates calls. No real telephone calls are placed.
        </p>

        <div className="settings-notice">
          Real voice calling requires a configured voice provider and
          telephony integration.
        </div>
      </section>

      <section className="settings-card">
        <div className="settings-card-heading">
          <div className="settings-icon">🛡</div>
          <div>
            <h2>Consent & Call Restrictions</h2>
            <p>Protect customers from unwanted calls.</p>
          </div>
        </div>

        <div className="settings-option">
          <div>
            <strong>Require customer consent</strong>
            <p>Calls should only proceed when consent is recorded.</p>
          </div>
          <input
            type="checkbox"
            checked={consentRequired}
            onChange={(event) =>
              setConsentRequired(event.target.checked)
            }
          />
        </div>

        <div className="settings-option">
          <div>
            <strong>Human handover</strong>
            <p>Enable the demo preference for handing calls to a telecaller.</p>
          </div>
          <input
            type="checkbox"
            checked={handoverEnabled}
            onChange={(event) =>
              setHandoverEnabled(event.target.checked)
            }
          />
        </div>

        <p className="settings-help">
          These switches currently change the page's local state only.
          They do not change backend calling rules.
        </p>
      </section>

      <section className="settings-card">
        <div className="settings-card-heading">
          <div className="settings-icon">⚙</div>
          <div>
            <h2>System Information</h2>
            <p>Current development environment.</p>
          </div>
        </div>

        <div className="settings-info-row">
          <span>Frontend</span>
          <strong>React</strong>
        </div>

        <div className="settings-info-row">
          <span>Backend</span>
          <strong>Django REST Framework</strong>
        </div>

        <div className="settings-info-row">
          <span>Database</span>
          <strong>SQLite (Development)</strong>
        </div>

        <div className="settings-info-row">
          <span>Voice Provider</span>
          <strong>Not Configured</strong>
        </div>
      </section>
    </div>
  );
}

export default Settings;
