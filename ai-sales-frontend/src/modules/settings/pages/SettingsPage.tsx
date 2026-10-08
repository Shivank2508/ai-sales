import React, { useState } from "react";
import { Settings, Shield, Key, Bell, Globe, PhoneCall, Radio, CheckCircle2, AlertCircle, Copy, Check, Send } from "lucide-react";
import { useTwilioStatus } from "../../campaigns/hooks/useCampaigns";
import { axiosInstance } from "../../../services/api/apiClient";

export const SettingsPage: React.FC = () => {
  const { data: twilioStatus, refetch: refetchTwilio } = useTwilioStatus();
  const [testPhoneNumber, setTestPhoneNumber] = useState("+918923212675");
  const [callingState, setCallingState] = useState<{ loading: boolean; message?: string; success?: boolean } | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(id);
    setTimeout(() => setCopiedUrl(null), 2500);
  };

  const handleTestCall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhoneNumber.trim()) return;

    setCallingState({ loading: true });
    try {
      const res = await axiosInstance.post("/api/voice/twilio/call", {
        to: testPhoneNumber.trim(),
      });
      setCallingState({
        loading: false,
        success: true,
        message: res.data?.message || `Call initiated successfully to ${testPhoneNumber}`,
      });
      refetchTwilio();
    } catch (err: any) {
      setCallingState({
        loading: false,
        success: false,
        message: err.message || "Failed to initiate Twilio test call",
      });
    }
  };

  const publicUrl = twilioStatus?.publicUrl || "https://ai-sales-yjn1.onrender.com";
  const voiceWebhookUrl = `${publicUrl}/api/voice/twilio/voice-webhook`;
  const statusCallbackUrl = `${publicUrl}/api/voice/twilio/status-callback`;

  return (
    <div className="d-flex flex-column gap-3" style={{ maxWidth: "900px" }}>
      {/* Page Header */}
      <div className="card shadow-sm border p-3">
        <h1 className="h5 fw-bold mb-0 text-dark">Platform & Telephony Settings</h1>
        <span className="text-muted small" style={{ fontSize: "11px" }}>
          Twilio voice gateway, Render deployment webhooks, and AI telephony configuration.
        </span>
      </div>

      {/* Twilio Integration Card */}
      <div className="card shadow-sm border p-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="d-flex align-items-center gap-2">
            <div className="p-2 rounded-circle bg-primary bg-opacity-10 text-primary">
              <PhoneCall size={20} />
            </div>
            <div>
              <h5 className="fw-bold mb-0 fs-6">Twilio Telephony & Voice Gateway</h5>
              <div className="text-muted small">Connect Render backend (<code>{publicUrl}</code>) to Twilio for real outbound phone calling</div>
            </div>
          </div>
          <span className={`badge ${twilioStatus?.configured ? "bg-success text-white" : "bg-warning-subtle text-warning border border-warning"}`}>
            <Radio size={12} className="me-1" />
            {twilioStatus?.configured ? `Connected: ${twilioStatus.phoneNumber || "Active"}` : "Pending Credentials"}
          </span>
        </div>

        {/* Live Status Summary */}
        <div className="p-3 bg-light rounded-3 mb-4 border">
          <div className="row g-2 small">
            <div className="col-12 col-md-4">
              <span className="text-muted d-block">Backend Host</span>
              <strong className="text-dark font-monospace">{publicUrl}</strong>
            </div>
            <div className="col-12 col-md-4">
              <span className="text-muted d-block">Twilio Account SID</span>
              <strong className={twilioStatus?.hasAccountSid ? "text-success" : "text-muted"}>
                {twilioStatus?.hasAccountSid ? "Configured in Render" : "Missing in Environment"}
              </strong>
            </div>
            <div className="col-12 col-md-4">
              <span className="text-muted d-block">Outbound Caller ID</span>
              <strong className={twilioStatus?.hasPhoneNumber ? "text-success" : "text-muted font-monospace"}>
                {twilioStatus?.phoneNumber || (twilioStatus?.hasPhoneNumber ? "Configured" : "Missing")}
              </strong>
            </div>
          </div>
        </div>

        {/* Twilio Webhook Endpoints */}
        <div className="mb-4">
          <h6 className="fw-bold small text-uppercase text-secondary mb-2" style={{ letterSpacing: "0.5px" }}>
            Twilio Phone Number Configuration (TwiML Webhook URLs)
          </h6>
          <p className="text-muted small mb-2">
            In your Twilio Console (under <strong>Phone Numbers &gt; Active Numbers &gt; Voice Configuration</strong>), configure the following URLs:
          </p>

          <div className="d-flex flex-column gap-2">
            <div className="d-flex align-items-center justify-content-between p-2 bg-white rounded border">
              <div>
                <span className="badge bg-secondary-subtle text-secondary me-2">Voice Webhook (POST)</span>
                <code className="text-dark small">{voiceWebhookUrl}</code>
              </div>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1 py-1"
                onClick={() => copyToClipboard(voiceWebhookUrl, "voice")}
              >
                {copiedUrl === "voice" ? <Check size={13} className="text-success" /> : <Copy size={13} />}
                <span>{copiedUrl === "voice" ? "Copied" : "Copy"}</span>
              </button>
            </div>

            <div className="d-flex align-items-center justify-content-between p-2 bg-white rounded border">
              <div>
                <span className="badge bg-secondary-subtle text-secondary me-2">Status Callback (POST)</span>
                <code className="text-dark small">{statusCallbackUrl}</code>
              </div>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1 py-1"
                onClick={() => copyToClipboard(statusCallbackUrl, "status")}
              >
                {copiedUrl === "status" ? <Check size={13} className="text-success" /> : <Copy size={13} />}
                <span>{copiedUrl === "status" ? "Copied" : "Copy"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Render Environment Variables Instructions */}
        <div className="mb-4">
          <h6 className="fw-bold small text-uppercase text-secondary mb-2" style={{ letterSpacing: "0.5px" }}>
            Render Environment Variables Setup
          </h6>
          <div className="p-3 bg-light-subtle rounded-3 border">
            <p className="small text-muted mb-2">
              Add the following environment variables to your Render dashboard (<strong>Dashboard &gt; ai-sales-backend &gt; Environment</strong>):
            </p>
            <pre className="p-2 bg-dark text-light rounded small mb-0 font-monospace" style={{ fontSize: "12px" }}>
{`TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_purchased_number (e.g. +1234567890)
PUBLIC_URL=https://ai-sales-yjn1.onrender.com`}
            </pre>
          </div>
        </div>

        {/* Live Test Call Dialing Form */}
        <div className="border-top pt-3">
          <h6 className="fw-bold small mb-2">Test Live Outbound Call</h6>
          <p className="text-muted small mb-3">
            Dial your phone number now to verify the interactive AI Voice question &amp; answer flow.
          </p>

          <form onSubmit={handleTestCall} className="row g-2 align-items-center">
            <div className="col-12 col-sm-6">
              <input
                type="text"
                className="form-control form-control-sm font-monospace"
                placeholder="+918923212675"
                value={testPhoneNumber}
                onChange={(e) => setTestPhoneNumber(e.target.value)}
                disabled={callingState?.loading}
              />
            </div>
            <div className="col-12 col-sm-6 d-flex gap-2">
              <button
                type="submit"
                className="btn btn-primary btn-sm d-inline-flex align-items-center gap-2"
                disabled={callingState?.loading || !testPhoneNumber.trim()}
              >
                {callingState?.loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status"></span>
                    <span>Dialing Call...</span>
                  </>
                ) : (
                  <>
                    <PhoneCall size={14} />
                    <span>Dial Phone Call</span>
                  </>
                )}
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() => refetchTwilio()}
              >
                Refresh Status
              </button>
            </div>
          </form>

          {callingState?.message && (
            <div
              className={`alert ${
                callingState.success ? "alert-success" : "alert-warning"
              } d-flex align-items-center gap-2 mt-3 mb-0 py-2 small`}
            >
              {callingState.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{callingState.message}</span>
            </div>
          )}
        </div>
      </div>

      {/* Organization Profile Card */}
      <div className="card shadow-sm border p-4">
        <h6 className="fw-bold fs-6 mb-3">Organization Profile</h6>
        <div className="row g-3">
          <div className="col-12 col-md-6">
            <label className="form-label small fw-bold">Company / Business Name</label>
            <input type="text" className="form-control form-control-sm" defaultValue="AI Enterprise Labs" />
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label small fw-bold">Default Timezone</label>
            <input type="text" className="form-control form-control-sm" defaultValue="Asia/Kolkata (IST)" />
          </div>
        </div>
      </div>
    </div>
  );
};
