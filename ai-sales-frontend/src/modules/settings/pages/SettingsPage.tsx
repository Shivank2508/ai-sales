import React from "react";
import { Settings, Shield, Key, Bell, Globe } from "lucide-react";

export const SettingsPage: React.FC = () => {
  return (
    <div className="d-flex flex-column gap-3" style={{ maxWidth: "800px" }}>
      <div className="card shadow-sm border p-3">
        <h1 className="h5 fw-bold mb-0 text-dark">Platform Settings</h1>
        <span className="text-muted small" style={{ fontSize: "11px" }}>
          Workspace credentials, voice synthesis providers, and API tokens.
        </span>
      </div>

      <div className="card shadow-sm border p-4">
        <h6 className="fw-bold fs-6 mb-3">Organization Profile</h6>
        <div className="row g-3 mb-4">
          <div className="col-12 col-md-6">
            <label className="form-label small fw-bold">Company / Business Name</label>
            <input type="text" className="form-control form-control-sm" defaultValue="Procter & Gamble Consumer Insights" />
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label small fw-bold">Default Timezone</label>
            <input type="text" className="form-control form-control-sm" defaultValue="Asia/Kolkata (IST)" />
          </div>
        </div>

        <h6 className="fw-bold fs-6 mb-3">AI Speech & Telephony Configuration</h6>
        <div className="row g-3 mb-4">
          <div className="col-12 col-md-6">
            <label className="form-label small fw-bold">TTS Provider</label>
            <select className="form-select form-select-sm" defaultValue="google">
              <option value="google">Google Cloud Neural2 / Wavenet</option>
              <option value="elevenlabs">ElevenLabs Conversational AI</option>
            </select>
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label small fw-bold">Outbound SIP Gateway</label>
            <input type="text" className="form-control form-control-sm" defaultValue="Twilio Voice / WebRTC Gateway" />
          </div>
        </div>

        <button className="btn btn-primary btn-sm px-4" onClick={() => alert("Settings saved.")}>
          Save Changes
        </button>
      </div>
    </div>
  );
};
