import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCreateCampaign, useGenerateAICampaign } from "../hooks/useCampaigns";
import { useUploadSurvey } from "../../surveys/hooks/useSurveys";
import { CampaignType } from "../../../types";
import {
  ArrowLeft,
  Sparkles,
  Building,
  Package,
  Calendar,
  Layers,
  Globe,
  Users,
  CheckCircle2,
  AlertCircle,
  PhoneCall,
  Loader2,
  Wand2,
  UploadCloud,
  FileText,
  Play,
} from "lucide-react";

export const CreateCampaignPage: React.FC = () => {
  const navigate = useNavigate();
  const createMutation = useCreateCampaign();
  const aiGenerateMutation = useGenerateAICampaign();
  const uploadSurveyMutation = useUploadSurvey();

  // Survey Upload State
  const [surveyOption, setSurveyOption] = useState<"none" | "file" | "text">("none");
  const [surveyFile, setSurveyFile] = useState<File | null>(null);
  const [surveyText, setSurveyText] = useState("");
  const [createdResult, setCreatedResult] = useState<{ campaignId: string; surveyId?: string; name: string } | null>(null);

  // AI Modal State
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiGoal, setAiGoal] = useState("");
  const [aiAudience, setAiAudience] = useState("");
  const [aiAction, setAiAction] = useState("CALL");
  const [aiCreateSurvey, setAiCreateSurvey] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    businessName: "AI Sales Enterprise Suite",
    product: "SalesFlow AI Platform",
    type: CampaignType.SALES,
    action: "CALL",
    description: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    targetAudience: "",
    language: "en-IN",
  });

  // Errors & Touched
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = "Campaign name is required.";
    } else if (formData.name.trim().length < 3) {
      newErrors.name = "Campaign name must be at least 3 characters long.";
    }

    if (!formData.product.trim()) {
      newErrors.product = "Target product or service is required.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  // Quick Preset Helper
  const applyPreset = (preset: {
    name: string;
    product: string;
    type: CampaignType;
    action?: string;
    description: string;
    targetAudience: string;
    language: string;
  }) => {
    setFormData({
      ...formData,
      ...preset,
      action: preset.action || "CALL",
    });
    setErrors({});
  };

  const handleAiGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiGoal.trim()) return;

    try {
      const result = await aiGenerateMutation.mutateAsync({
        goal: aiGoal.trim(),
        targetAudience: aiAudience.trim() || undefined,
        action: aiAction,
        createLinkedSurvey: aiCreateSurvey,
      });

      if (result?.campaign?._id) {
        navigate(`/campaigns/${result.campaign._id}`);
      }
    } catch (err: any) {
      setApiError(err.message || "Failed to generate campaign with AI.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setApiError(null);
    try {
      const created = await createMutation.mutateAsync({
        name: formData.name.trim(),
        businessName: formData.businessName,
        product: formData.product.trim(),
        type: formData.type,
        action: formData.action as any,
        description: formData.description.trim(),
        startDate: formData.startDate,
        endDate: formData.endDate || undefined,
        targetAudience: formData.targetAudience.trim(),
        language: formData.language,
      });

      let linkedSurveyId: string | undefined = created.surveyId?.toString();

      if ((surveyOption === "file" && surveyFile) || (surveyOption === "text" && surveyText.trim())) {
        try {
          const uploadRes = await uploadSurveyMutation.mutateAsync({
            file: surveyOption === "file" ? surveyFile || undefined : undefined,
            content: surveyOption === "text" ? surveyText.trim() : undefined,
            name: `${formData.name.trim()} Survey`,
            campaignId: created._id,
            channel: "VOICE",
          });
          if (uploadRes?.survey?._id) {
            linkedSurveyId = uploadRes.survey._id;
          }
        } catch (uploadErr: any) {
          console.warn("Survey upload note:", uploadErr.message);
        }
      }

      setCreatedResult({
        campaignId: created._id,
        surveyId: linkedSurveyId,
        name: created.name,
      });
    } catch (err: any) {
      setApiError(err.message || "Failed to create campaign.");
    }
  };

  return (
    <div className="container-fluid px-0" style={{ maxWidth: "880px" }}>
      {/* Back link & Header */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div className="d-flex align-items-center gap-2">
          <Link to="/campaigns" className="btn btn-outline-secondary btn-sm p-1">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="h4 fw-bold mb-0">Create Campaign</h1>
            <p className="text-secondary small mb-0">
              Launch targeted AI voice calling or multichannel outreach campaigns with linked discovery surveys.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowAiModal(true)}
          className="btn btn-primary d-flex align-items-center gap-2 shadow-sm"
        >
          <Sparkles size={16} />
          <span>Generate with AI</span>
        </button>
      </div>

      {/* AI Campaign Generator Promo Banner */}
      <div className="card shadow-sm border-0 mb-4 text-white" style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)" }}>
        <div className="card-body p-4 d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <Wand2 size={20} className="text-warning" />
              <h5 className="fw-bold mb-0">AI Autonomous Campaign Builder</h5>
            </div>
            <p className="mb-0 text-white-50 small" style={{ maxWidth: "560px" }}>
              Provide your sales objective. The AI will formulate your audience criteria, create the phone pitch script, and build a 4-question voice discovery survey automatically.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-light fw-bold text-primary px-4 py-2 shadow-sm"
            onClick={() => setShowAiModal(true)}
          >
            Create with AI
          </button>
        </div>
      </div>

      {/* Quick Start Presets */}
      <div className="card shadow-sm border mb-4">
        <div className="card-body p-3">
          <div className="d-flex align-items-center gap-2 mb-2 text-primary fw-bold small text-uppercase">
            <Sparkles size={15} />
            <span>Recommended Campaign Templates</span>
          </div>

          <div className="row g-2">
            <div className="col-12 col-md-4">
              <div
                className="p-3 border rounded-3 bg-light-subtle hover-shadow h-100"
                style={{ cursor: "pointer" }}
                onClick={() =>
                  applyPreset({
                    name: "Enterprise Voice Sales Discovery",
                    product: "SalesFlow AI Suite",
                    type: CampaignType.SALES,
                    action: "CALL",
                    description: "AI Voice phone call outreach assessing sales qualification bottlenecks and booking live demos.",
                    targetAudience: "VPs of Sales, CROs, Tech Founders in B2B SaaS",
                    language: "en-IN",
                  })
                }
              >
                <span className="badge bg-primary-subtle text-primary border mb-1">📞 AI Voice Calling</span>
                <div className="fw-bold small text-dark">Enterprise Sales Discovery</div>
                <div className="text-muted small" style={{ fontSize: "11px" }}>Voice Qualification • Demo Scheduling</div>
              </div>
            </div>

            <div className="col-12 col-md-4">
              <div
                className="p-3 border rounded-3 bg-light-subtle hover-shadow h-100"
                style={{ cursor: "pointer" }}
                onClick={() =>
                  applyPreset({
                    name: "Customer Retention & CSAT Health Check",
                    product: "SalesFlow AI Platform",
                    type: CampaignType.CUSTOMER_RETENTION,
                    action: "CALL",
                    description: "AI Voice survey gauging onboarding satisfaction, feature requests, and renewal likelihood.",
                    targetAudience: "Active accounts onboarded in past 90 days",
                    language: "en-IN",
                  })
                }
              >
                <span className="badge bg-success-subtle text-success border mb-1">⭐ CSAT Voice Survey</span>
                <div className="fw-bold small text-dark">Onboarding Health Poll</div>
                <div className="text-muted small" style={{ fontSize: "11px" }}>Satisfaction Rating • Churn Prevention</div>
              </div>
            </div>

            <div className="col-12 col-md-4">
              <div
                className="p-3 border rounded-3 bg-light-subtle hover-shadow h-100"
                style={{ cursor: "pointer" }}
                onClick={() =>
                  applyPreset({
                    name: "Product Pricing & Competitor Battle",
                    product: "SalesFlow AI Intelligence",
                    type: CampaignType.PRODUCT_RESEARCH,
                    action: "CALL",
                    description: "Voice outreach exploring competitor switching intent (Gong, Chorus, Outreach) and budget appetite.",
                    targetAudience: "Sales Directors evaluating conversation AI tools",
                    language: "en-IN",
                  })
                }
              >
                <span className="badge bg-purple-subtle text-purple border mb-1">🔍 Market Research</span>
                <div className="fw-bold small text-dark">Competitor Benchmark</div>
                <div className="text-muted small" style={{ fontSize: "11px" }}>Pricing evaluation • Feature gaps</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Form Card */}
      <div className="card shadow-sm border">
        <div className="card-body p-4">
          {apiError && (
            <div className="alert alert-danger d-flex align-items-center gap-2 small mb-4">
              <AlertCircle size={16} />
              <span>{apiError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Campaign Name */}
            <div className="mb-3">
              <label className="form-label fw-semibold small">
                Campaign Name <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className={`form-control ${errors.name ? "is-invalid" : ""}`}
                placeholder="e.g., Q4 Enterprise Voice Sales Outreach"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
              />
              {errors.name && <div className="invalid-feedback">{errors.name}</div>}
            </div>

            {/* Outreach Action & Type */}
            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold small d-flex align-items-center gap-1">
                  <PhoneCall size={14} className="text-primary" />
                  <span>Outreach Channel</span>
                </label>
                <select
                  className="form-select"
                  value={formData.action}
                  onChange={(e) => handleChange("action", e.target.value)}
                >
                  <option value="CALL">📞 AI Voice Phone Call (Conversational Agent)</option>
                  <option value="EMAIL">✉️ Email Outreach Blast</option>
                  <option value="WHATSAPP">💬 WhatsApp Direct Outreach</option>
                  <option value="SMS">📱 SMS Quick Broadcast</option>
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold small d-flex align-items-center gap-1">
                  <Layers size={14} className="text-primary" />
                  <span>Campaign Type</span>
                </label>
                <select
                  className="form-select"
                  value={formData.type}
                  onChange={(e) => handleChange("type", e.target.value)}
                >
                  <option value={CampaignType.SALES}>Sales Outreach & Qualification</option>
                  <option value={CampaignType.PRODUCT_RESEARCH}>Product & Consumer Research</option>
                  <option value={CampaignType.FEEDBACK}>Feedback & Evaluation</option>
                  <option value={CampaignType.CUSTOMER_RETENTION}>Customer Retention & CSAT</option>
                </select>
              </div>
            </div>

            {/* Target Product & Audience */}
            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold small d-flex align-items-center gap-1">
                  <Package size={14} className="text-primary" />
                  <span>Target Product / Solution <span className="text-danger">*</span></span>
                </label>
                <input
                  type="text"
                  className={`form-control ${errors.product ? "is-invalid" : ""}`}
                  placeholder="e.g., SalesFlow AI"
                  value={formData.product}
                  onChange={(e) => handleChange("product", e.target.value)}
                />
                {errors.product && <div className="invalid-feedback">{errors.product}</div>}
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold small d-flex align-items-center gap-1">
                  <Users size={14} className="text-primary" />
                  <span>Target Audience Criteria</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g., B2B SaaS Founders, 50-200 employees, India/US"
                  value={formData.targetAudience}
                  onChange={(e) => handleChange("targetAudience", e.target.value)}
                />
              </div>
            </div>

            {/* Description */}
            <div className="mb-3">
              <label className="form-label fw-semibold small">Strategy & Description</label>
              <textarea
                className="form-control"
                rows={3}
                placeholder="Explain the strategy, objective, or special handling rules for this campaign..."
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
              />
            </div>

            {/* Dates & Language */}
            <div className="row g-3 mb-4">
              <div className="col-md-4">
                <label className="form-label fw-semibold small d-flex align-items-center gap-1">
                  <Calendar size={14} className="text-primary" />
                  <span>Start Date</span>
                </label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.startDate}
                  onChange={(e) => handleChange("startDate", e.target.value)}
                />
              </div>

              <div className="col-md-4">
                <label className="form-label fw-semibold small d-flex align-items-center gap-1">
                  <Calendar size={14} className="text-muted" />
                  <span>End Date (Optional)</span>
                </label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.endDate}
                  onChange={(e) => handleChange("endDate", e.target.value)}
                />
              </div>

              <div className="col-md-4">
                <label className="form-label fw-semibold small d-flex align-items-center gap-1">
                  <Globe size={14} className="text-primary" />
                  <span>Voice Language</span>
                </label>
                <select
                  className="form-select"
                  value={formData.language}
                  onChange={(e) => handleChange("language", e.target.value)}
                >
                  <option value="en-IN">English (India - en-IN)</option>
                  <option value="hi-IN">Hindi (India - hi-IN)</option>
                  <option value="en-US">English (US - en-US)</option>
                  <option value="en-GB">English (UK - en-GB)</option>
                </select>
              </div>
            </div>

            {/* Survey Questionnaire Upload Section */}
            <div className="card border p-3 mb-4 bg-light-subtle rounded-3">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <div className="d-flex align-items-center gap-2">
                  <UploadCloud size={18} className="text-primary" />
                  <span className="fw-bold text-dark small text-uppercase">Attach Survey Questionnaire (Optional)</span>
                </div>
                <span className="badge bg-primary-subtle text-primary small">Instant AI Parsing</span>
              </div>
              <p className="text-secondary small mb-3">
                Upload a questionnaire file or paste survey questions directly. The AI will parse questions, answer options, and voice prompts so you can run calling immediately!
              </p>

              {/* Toggle Choice */}
              <div className="btn-group btn-group-sm mb-3" role="group">
                <button
                  type="button"
                  className={`btn ${surveyOption === "none" ? "btn-primary" : "btn-outline-secondary"}`}
                  onClick={() => setSurveyOption("none")}
                >
                  Skip for now
                </button>
                <button
                  type="button"
                  className={`btn ${surveyOption === "file" ? "btn-primary" : "btn-outline-secondary"}`}
                  onClick={() => setSurveyOption("file")}
                >
                  Upload File (.docx, .pdf, .txt, .csv, .json)
                </button>
                <button
                  type="button"
                  className={`btn ${surveyOption === "text" ? "btn-primary" : "btn-outline-secondary"}`}
                  onClick={() => setSurveyOption("text")}
                >
                  Paste Questions Text
                </button>
              </div>

              {surveyOption === "file" && (
                <div>
                  <input
                    type="file"
                    className="form-control form-control-sm"
                    accept=".txt,.csv,.json,.pdf,.doc,.docx"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSurveyFile(e.target.files[0]);
                      }
                    }}
                  />
                  {surveyFile && (
                    <div className="mt-2 text-success small d-flex align-items-center gap-1">
                      <CheckCircle2 size={14} />
                      <span>Selected file: <strong>{surveyFile.name}</strong></span>
                    </div>
                  )}
                </div>
              )}

              {surveyOption === "text" && (
                <div>
                  <textarea
                    className="form-control font-monospace small"
                    rows={6}
                    placeholder={`Paste survey questions or protocol, for example:
1: Sample Recall – Have you purchased detergent powder in the last 1 month?
A. Yes – continue to other questions
B. No – End the call

2: Brand Recall – What brand of detergent did you purchase?
A. Surf, B. Ariel, C. Tide, D. Others`}
                    value={surveyText}
                    onChange={(e) => setSurveyText(e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="d-flex justify-content-end gap-2 pt-3 border-top">
              <Link to="/campaigns" className="btn btn-outline-secondary">
                Cancel
              </Link>
              <button
                type="submit"
                className="btn btn-primary d-flex align-items-center gap-2"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 size={16} className="spinner-border spinner-border-sm" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Create Campaign</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* AI Generate Campaign Modal */}
      {showAiModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.6)" }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header border-0 pb-0 pt-4 px-4">
                <div className="d-flex align-items-center gap-2 text-primary">
                  <Sparkles size={24} />
                  <h5 className="modal-title fw-bold">Generate Campaign with AI</h5>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowAiModal(false)}
                />
              </div>

              <form onSubmit={handleAiGenerate}>
                <div className="modal-body p-4">
                  <p className="text-secondary small mb-3">
                    Describe your objective in natural language. The AI will generate the entire campaign strategy, opening pitch hook, audience filters, and a linked qualification survey.
                  </p>

                  <div className="mb-3">
                    <label className="form-label fw-bold small">Campaign Objective / Prompt <span className="text-danger">*</span></label>
                    <textarea
                      className="form-control"
                      rows={3}
                      placeholder="e.g., Voice calling outreach to B2B SaaS Founders to qualify lead automation needs and pitch SalesFlow AI"
                      value={aiGoal}
                      onChange={(e) => setAiGoal(e.target.value)}
                      required
                    />
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label fw-bold small">Target Audience (Optional)</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g., Founders, VPs of Sales, CROs"
                        value={aiAudience}
                        onChange={(e) => setAiAudience(e.target.value)}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold small">Outreach Action</label>
                      <select
                        className="form-select"
                        value={aiAction}
                        onChange={(e) => setAiAction(e.target.value)}
                      >
                        <option value="CALL">📞 AI Voice Calling (Recommended)</option>
                        <option value="EMAIL">✉️ Email Sequence</option>
                        <option value="WHATSAPP">💬 WhatsApp Outreach</option>
                        <option value="SMS">📱 SMS Blast</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-check form-switch mb-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="createSurveyCheck"
                      checked={aiCreateSurvey}
                      onChange={(e) => setAiCreateSurvey(e.target.checked)}
                    />
                    <label className="form-check-label fw-semibold small" htmlFor="createSurveyCheck">
                      Auto-generate a linked 4-question voice discovery survey for lead qualification
                    </label>
                  </div>

                  {aiGenerateMutation.isError && (
                    <div className="alert alert-danger small mb-0">
                      {(aiGenerateMutation.error as any)?.message || "Failed to generate campaign"}
                    </div>
                  )}
                </div>

                <div className="modal-footer border-0 pt-0 px-4 pb-4">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowAiModal(false)}
                    disabled={aiGenerateMutation.isPending}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary d-flex align-items-center gap-2 px-4"
                    disabled={aiGenerateMutation.isPending || !aiGoal.trim()}
                  >
                    {aiGenerateMutation.isPending ? (
                      <>
                        <Loader2 size={16} className="spinner-border spinner-border-sm" />
                        <span>AI Architecting Campaign...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        <span>Generate Full Campaign</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Campaign & Survey Ready Modal */}
      {createdResult && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.6)" }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4 p-4 text-center">
              <div className="rounded-circle bg-success bg-opacity-10 p-3 d-inline-flex mx-auto text-success mb-3">
                <CheckCircle2 size={40} />
              </div>
              <h4 className="fw-bold mb-1">Campaign & Survey Ready!</h4>
              <p className="text-secondary small mb-4">
                "{createdResult.name}" is created and loaded. You can launch hands-free AI voice calls right now.
              </p>
              <div className="d-flex flex-column gap-2">
                <button
                  className="btn btn-success btn-lg d-flex align-items-center justify-content-center gap-2 shadow fw-bold py-3"
                  onClick={() => {
                    navigate(
                      `/ai-agents/live-execution?campaignId=${createdResult.campaignId}${
                        createdResult.surveyId ? `&surveyId=${createdResult.surveyId}` : ""
                      }`
                    );
                  }}
                >
                  <PhoneCall size={20} />
                  <span>▶ Start Live AI Voice Call Now</span>
                </button>
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => navigate(`/campaigns/${createdResult.campaignId}`)}
                >
                  Go to Campaign Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateCampaignPage;
