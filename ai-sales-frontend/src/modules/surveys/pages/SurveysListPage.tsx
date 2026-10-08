<<<<<<< HEAD
import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCampaigns } from "../../campaigns/hooks/useCampaigns";
import { useSurveys, useUploadSurvey, useGenerateAISurvey } from "../hooks/useSurveys";
import { LoadingSpinner } from "../../../components/common/LoadingSpinner";
import {
  Workflow,
  Play,
  UploadCloud,
  Sparkles,
  FileText,
  FileCode,
  FileUp,
  X,
  CheckCircle2,
  Layers,
  Bot,
  Plus,
  ArrowRight,
} from "lucide-react";

export const SurveysListPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCampaignFilter, setSelectedCampaignFilter] = useState<string>("ALL");
  const { data: campaigns, isLoading: campaignsLoading } = useCampaigns();
  const { data: surveys, isLoading: surveysLoading } = useSurveys(
    selectedCampaignFilter !== "ALL" ? selectedCampaignFilter : undefined
  );

  const uploadSurveyMutation = useUploadSurvey();
  const generateAiSurveyMutation = useGenerateAISurvey();

  // Modals state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAiGenModal, setShowAiGenModal] = useState(false);

  // Upload modal state
  const [uploadTab, setUploadTab] = useState<"file" | "text">("file");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pastedContent, setPastedContent] = useState("");
  const [surveyName, setSurveyName] = useState("");
  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI Gen state
  const [aiTopic, setAiTopic] = useState("");
  const [aiAudience, setAiAudience] = useState("");
  const [aiQuestionCount, setAiQuestionCount] = useState(5);
  const [aiChannel, setAiChannel] = useState("VOICE");

  const isLoading = campaignsLoading || surveysLoading;

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      if (!surveyName) {
        setSurveyName(file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "));
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!surveyName) {
        setSurveyName(file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "));
      }
    }
  };

  const openUploadWithCampaign = () => {
    if (selectedCampaignFilter !== "ALL") {
      setSelectedCampaignId(selectedCampaignFilter);
    } else if (campaigns && campaigns.length > 0) {
      setSelectedCampaignId(campaigns[0]._id);
    }
    setShowUploadModal(true);
  };

  const openAiGenWithCampaign = () => {
    if (selectedCampaignFilter !== "ALL") {
      setSelectedCampaignId(selectedCampaignFilter);
    } else if (campaigns && campaigns.length > 0) {
      setSelectedCampaignId(campaigns[0]._id);
    }
    setShowAiGenModal(true);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadTab === "file" && !selectedFile) {
      alert("Please select a file to upload.");
      return;
    }
    if (uploadTab === "text" && !pastedContent.trim()) {
      alert("Please paste survey or questionnaire text.");
      return;
    }

    try {
      const result = await uploadSurveyMutation.mutateAsync({
        file: uploadTab === "file" ? selectedFile || undefined : undefined,
        content: uploadTab === "text" ? pastedContent.trim() : undefined,
        name: surveyName.trim() || undefined,
        campaignId: selectedCampaignId || undefined,
        channel: "VOICE",
      });

      setShowUploadModal(false);
      setSelectedFile(null);
      setPastedContent("");
      setSurveyName("");

      const campId = selectedCampaignId || result?.survey?.campaignId || (campaigns && campaigns[0]?._id) || "default";
      const survId = result?.survey?._id || "";
      navigate(`/ai-agents/live-execution?campaignId=${campId}${survId ? `&surveyId=${survId}` : ""}`);
    } catch (err: any) {
      alert("Failed to upload and parse survey: " + (err.response?.data?.message || err.message));
    }
  };

  const handleAiGenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiTopic.trim()) return;

    try {
      const result = await generateAiSurveyMutation.mutateAsync({
        topic: aiTopic.trim(),
        targetAudience: aiAudience.trim() || undefined,
        questionCount: aiQuestionCount,
        channel: aiChannel,
        campaignId: selectedCampaignId || undefined,
      });

      setShowAiGenModal(false);
      setAiTopic("");
      setAiAudience("");

      const campId = selectedCampaignId || result?.survey?.campaignId || (campaigns && campaigns[0]?._id) || "default";
      navigate(`/campaigns/${campId}/survey`);
    } catch (err: any) {
      alert("Failed to generate AI survey: " + (err.response?.data?.message || err.message));
    }
  };

  const getCampaignName = (cId?: any) => {
    if (!cId) return null;
    const rawId = typeof cId === "object" ? cId._id || cId.name : cId;
    const camp = campaigns?.find((c) => c._id === rawId);
    return camp ? camp.name : typeof cId === "object" && cId.name ? cId.name : null;
  };

  const filteredCampaigns = (campaigns || []).filter((c) =>
    selectedCampaignFilter === "ALL" ? true : c._id === selectedCampaignFilter
  );

  if (isLoading) return <LoadingSpinner message="Loading surveys and campaigns..." />;

  return (
    <div className="d-flex flex-column gap-4">
      {/* Header Bar */}
      <div className="card shadow-sm border p-4 bg-white">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <Workflow className="text-primary" size={24} />
              <h1 className="h4 fw-bold mb-0 text-dark">Campaign Survey Questionnaires</h1>
            </div>
            <p className="text-secondary small mb-0">
              Create, upload, or AI-generate structured questionnaires attached to sales campaigns for autonomous AI calling.
            </p>
          </div>

          <div className="d-flex flex-wrap align-items-center gap-2">
            {/* Campaign Filter Dropdown */}
            <div className="d-flex align-items-center gap-1 bg-light px-2 py-1 rounded border">
              <span className="small text-muted fw-bold">Campaign:</span>
              <select
                className="form-select form-select-sm border-0 bg-transparent fw-semibold text-dark"
                style={{ width: "auto", minWidth: "170px" }}
                value={selectedCampaignFilter}
                onChange={(e) => setSelectedCampaignFilter(e.target.value)}
              >
                <option value="ALL">All Campaigns</option>
                {campaigns?.map((camp) => (
                  <option key={camp._id} value={camp._id}>
                    {camp.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              className="btn btn-outline-primary btn-sm d-flex align-items-center gap-2"
              onClick={openUploadWithCampaign}
            >
              <UploadCloud size={15} />
              <span>Upload Survey</span>
            </button>

            <button
              className="btn btn-primary btn-sm d-flex align-items-center gap-2"
              onClick={openAiGenWithCampaign}
            >
              <Sparkles size={15} />
              <span>Generate with AI</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Upload Banner */}
      <div className="card border-0 bg-primary-subtle text-dark shadow-sm p-4 rounded-3">
        <div className="row align-items-center g-3">
          <div className="col-12 col-md-8">
            <div className="d-flex align-items-center gap-2 mb-2">
              <span className="badge bg-primary text-white">Campaign AI Parser</span>
              <span className="small text-primary-emphasis fw-bold">Supported formats: .JSON, .CSV, .PDF, .DOCX, .TXT</span>
            </div>
            <h5 className="fw-bold mb-1">Upload Survey for Campaign AI Calling</h5>
            <p className="small text-secondary mb-0">
              Upload your survey questionnaire or customer research document. Our AI will automatically parse questions, options, logic branching, and synthesize conversational speech for outbound AI calling.
            </p>
          </div>
          <div className="col-12 col-md-4 text-md-end">
            <button
              className="btn btn-primary btn-sm px-3 py-2 fw-semibold d-inline-flex align-items-center gap-2"
              onClick={openUploadWithCampaign}
            >
              <FileUp size={16} />
              <span>Upload Survey File</span>
            </button>
          </div>
        </div>
      </div>

      {/* Surveys List Section */}
      {surveys && surveys.length > 0 && (
        <div>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="fw-bold fs-6 mb-0 text-dark d-flex align-items-center gap-2">
              <FileText size={18} className="text-primary" />
              <span>
                {selectedCampaignFilter !== "ALL"
                  ? `Campaign Surveys (${surveys.length})`
                  : `All Active & Imported Surveys (${surveys.length})`}
              </span>
            </h5>
          </div>

          <div className="row g-3">
            {surveys.map((s) => {
              const campName = getCampaignName(s.campaignId);
              const targetCampId = s.campaignId || (campaigns && campaigns[0]?._id) || s._id;
              return (
                <div key={s._id} className="col-12 col-md-6 col-lg-4">
                  <div className="card shadow-sm border h-100 p-3 d-flex flex-column justify-content-between">
                    <div>
                      <div className="d-flex flex-wrap justify-content-between align-items-center gap-1 mb-2">
                        <span className="badge bg-success-subtle text-success border small">{s.status || "draft"}</span>
                        {campName ? (
                          <span
                            className="badge bg-purple-subtle text-purple border"
                            style={{ backgroundColor: "#f3e8ff", color: "#6b21a8", borderColor: "#d8b4fe" }}
                          >
                            Campaign: {campName}
                          </span>
                        ) : (
                          <span className="badge bg-light text-secondary border small">{s.language || "en-IN"}</span>
                        )}
                      </div>
                      <h5 className="fw-bold fs-6 mb-1 text-dark text-truncate" title={s.name}>
                        {s.name}
                      </h5>
                      <p className="text-secondary small mb-3 line-clamp-2" style={{ minHeight: "38px" }}>
                        {s.description || "Voice survey questionnaire for AI calls."}
                      </p>
                    </div>

                    <div className="d-flex gap-2 border-top pt-3">
                      <Link
                        to={`/campaigns/${targetCampId}/survey`}
                        className="btn btn-primary btn-sm flex-grow-1 d-flex align-items-center justify-content-center gap-1"
                      >
                        <Workflow size={14} />
                        <span>Open Builder</span>
                      </Link>
                      <Link
                        to={`/campaigns/${targetCampId}/survey/preview`}
                        className="btn btn-outline-secondary btn-sm"
                        title="Preview Voice Simulator"
                      >
                        <Play size={14} />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Campaigns Surveys Section */}
      <div>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-bold fs-6 mb-0 text-dark d-flex align-items-center gap-2">
            <Layers size={18} className="text-primary" />
            <span>
              {selectedCampaignFilter !== "ALL"
                ? `Selected Campaign Flow (${filteredCampaigns.length})`
                : `Campaign Survey Flows (${campaigns?.length || 0})`}
            </span>
          </h5>
        </div>

        <div className="row g-3">
          {filteredCampaigns.map((c) => (
            <div key={c._id} className="col-12 col-md-6 col-lg-4">
              <div className="card shadow-sm border h-100 p-3 d-flex flex-column justify-content-between">
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="badge bg-primary-subtle text-primary border small">{c.name}</span>
                    <span className="badge bg-light text-secondary border small">{c.action || "VOICE CALL"}</span>
                  </div>
                  <h5 className="fw-bold fs-6 mb-1 text-dark text-truncate" title={c.name}>
                    {c.name}
                  </h5>
                  <p className="text-secondary small mb-3 line-clamp-2" style={{ minHeight: "38px" }}>
                    {c.description || "Interactive campaign questionnaire and customer intelligence workflow."}
                  </p>
                </div>

                <div className="d-flex gap-2 border-top pt-3">
                  <Link
                    to={`/campaigns/${c._id}/survey`}
                    className="btn btn-primary btn-sm flex-grow-1 d-flex align-items-center justify-content-center gap-1"
                  >
                    <Workflow size={14} />
                    <span>Open Survey Builder</span>
                  </Link>
                  <Link
                    to={`/campaigns/${c._id}/survey/preview`}
                    className="btn btn-outline-secondary btn-sm"
                    title="Preview Voice Simulator"
                  >
                    <Play size={14} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>


      {/* UPLOAD SURVEY MODAL */}
      {showUploadModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} tabIndex={-1}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content shadow-lg border-0">
              <div className="modal-header border-bottom pb-3">
                <div className="d-flex align-items-center gap-2">
                  <UploadCloud size={22} className="text-primary" />
                  <div>
                    <h5 className="modal-title fw-bold mb-0">Upload & Import Survey</h5>
                    <div className="text-muted small">Upload a file or paste questionnaire text to auto-generate questions with AI</div>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowUploadModal(false)}
                  disabled={uploadSurveyMutation.isPending}
                ></button>
              </div>

              <form onSubmit={handleUploadSubmit}>
                <div className="modal-body p-4 d-flex flex-column gap-3">
                  {/* Name & Campaign Mapping */}
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-dark">Survey Name (Optional)</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="e.g., Q3 Customer Churn Questionnaire"
                        value={surveyName}
                        onChange={(e) => setSurveyName(e.target.value)}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-dark">Link to Campaign (Optional)</label>
                      <select
                        className="form-select form-select-sm"
                        value={selectedCampaignId}
                        onChange={(e) => setSelectedCampaignId(e.target.value)}
                      >
                        <option value="">-- Create Standalone Survey --</option>
                        {campaigns?.map((camp) => (
                          <option key={camp._id} value={camp._id}>
                            {camp.name} ({camp.type})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Mode Tabs */}
                  <ul className="nav nav-pills nav-fill bg-light p-1 rounded-3">
                    <li className="nav-item">
                      <button
                        type="button"
                        className={`nav-link py-1 small fw-bold ${uploadTab === "file" ? "active" : ""}`}
                        onClick={() => setUploadTab("file")}
                      >
                        <FileUp size={14} className="me-1" />
                        Upload File (.json, .csv, .pdf, .docx, .txt)
                      </button>
                    </li>
                    <li className="nav-item">
                      <button
                        type="button"
                        className={`nav-link py-1 small fw-bold ${uploadTab === "text" ? "active" : ""}`}
                        onClick={() => setUploadTab("text")}
                      >
                        <FileCode size={14} className="me-1" />
                        Paste Questionnaire Text
                      </button>
                    </li>
                  </ul>

                  {/* Tab 1: File Dropzone */}
                  {uploadTab === "file" && (
                    <div
                      className={`border-2 border-dashed rounded-3 p-4 text-center cursor-pointer transition-all ${
                        isDragging ? "border-primary bg-primary-subtle" : "border-secondary-subtle bg-light"
                      }`}
                      style={{ cursor: "pointer" }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleFileDrop}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="d-none"
                        accept=".json,.csv,.pdf,.docx,.txt,.tsv"
                        onChange={handleFileSelect}
                      />
                      <UploadCloud size={40} className="text-primary mb-2 opacity-75" />
                      {selectedFile ? (
                        <div>
                          <div className="fw-bold text-success mb-1 d-flex align-items-center justify-content-center gap-1">
                            <CheckCircle2 size={16} />
                            <span>{selectedFile.name}</span>
                          </div>
                          <div className="text-muted small">
                            {(selectedFile.size / 1024).toFixed(1)} KB — Click or drag another file to replace
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="fw-bold text-dark mb-1">Click to browse or drag and drop your survey file</div>
                          <div className="text-muted small">Supports JSON, CSV, PDF, Microsoft Word (.docx), and Plain Text</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab 2: Paste Text Area */}
                  {uploadTab === "text" && (
                    <div>
                      <label className="form-label small fw-bold text-dark">Questionnaire Content / Questions List</label>
                      <textarea
                        className="form-control small font-monospace"
                        rows={8}
                        placeholder={`Paste questions, options, or JSON questionnaire here:\n\nExample:\nQ1: How satisfied are you with our product? (1 to 5 rating)\nQ2: What is your primary role? (Founder, VP Sales, SDR, Operations)\nQ3: Are you interested in a live voice demo? (Yes/No)`}
                        value={pastedContent}
                        onChange={(e) => setPastedContent(e.target.value)}
                      ></textarea>
                    </div>
                  )}

                  {/* Feature callout */}
                  <div className="p-3 bg-light rounded-3 border d-flex align-items-center gap-3">
                    <Bot size={24} className="text-primary flex-shrink-0" />
                    <div className="small text-secondary">
                      <strong className="text-dark">AI Voice Optimizer:</strong> When you upload or paste questions, our AI engine will automatically structure options, logic conditions, and write conversational phone prompts for voice outreach.
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-top">
                  <button
                    type="button"
                    className="btn btn-light btn-sm"
                    onClick={() => setShowUploadModal(false)}
                    disabled={uploadSurveyMutation.isPending}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm d-flex align-items-center gap-2 px-3"
                    disabled={uploadSurveyMutation.isPending}
                  >
                    {uploadSurveyMutation.isPending ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status"></span>
                        <span>Parsing & Importing with AI...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud size={14} />
                        <span>Upload & Parse Survey</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* AI GENERATE SURVEY MODAL */}
      {showAiGenModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow-lg border-0">
              <div className="modal-header border-bottom">
                <div className="d-flex align-items-center gap-2">
                  <Sparkles size={20} className="text-primary" />
                  <h5 className="modal-title fw-bold">Generate Survey with AI</h5>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowAiGenModal(false)}
                  disabled={generateAiSurveyMutation.isPending}
                ></button>
              </div>

              <form onSubmit={handleAiGenSubmit}>
                <div className="modal-body p-4 d-flex flex-column gap-3">
                  <div>
                    <label className="form-label small fw-bold text-dark">Survey Goal / Topic</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. SaaS Customer Onboarding Satisfaction & Feature Needs"
                      value={aiTopic}
                      onChange={(e) => setAiTopic(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label small fw-bold text-dark">Target Customer Persona</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="e.g. VP of Sales, Revenue Operations, Tech Founders"
                      value={aiAudience}
                      onChange={(e) => setAiAudience(e.target.value)}
                    />
                  </div>

                  <div className="row g-3">
                    <div className="col-6">
                      <label className="form-label small fw-bold text-dark">Number of Questions</label>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        min={2}
                        max={15}
                        value={aiQuestionCount}
                        onChange={(e) => setAiQuestionCount(Number(e.target.value))}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-bold text-dark">Channel</label>
                      <select
                        className="form-select form-select-sm"
                        value={aiChannel}
                        onChange={(e) => setAiChannel(e.target.value)}
                      >
                        <option value="VOICE">AI Voice Call</option>
                        <option value="CHAT">AI Chat Agent</option>
                        <option value="WEB">Web Form</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-top">
                  <button
                    type="button"
                    className="btn btn-light btn-sm"
                    onClick={() => setShowAiGenModal(false)}
                    disabled={generateAiSurveyMutation.isPending}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm d-flex align-items-center gap-2"
                    disabled={generateAiSurveyMutation.isPending}
                  >
                    {generateAiSurveyMutation.isPending ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status"></span>
                        <span>Designing Survey Flow...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        <span>Generate Survey</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

=======
import React from "react";
import { Link } from "react-router-dom";
import { useCampaigns } from "../../campaigns/hooks/useCampaigns";
import { LoadingSpinner } from "../../../components/common/LoadingSpinner";
import { Workflow, Play } from "lucide-react";

export const SurveysListPage: React.FC = () => {
  const { data: campaigns, isLoading } = useCampaigns();

  if (isLoading) return <LoadingSpinner message="Loading surveys..." />;

  return (
    <div className="d-flex flex-column gap-3">
      <div className="card shadow-sm border p-3 d-flex justify-content-between align-items-center">
        <div>
          <h1 className="h5 fw-bold mb-0 text-dark">Survey Questionnaires</h1>
          <span className="text-muted small" style={{ fontSize: "11px" }}>
            Overview of all active and draft research surveys mapped to business campaigns.
          </span>
        </div>
      </div>

      <div className="row g-3">
        {campaigns?.map((c) => (
          <div key={c._id} className="col-12 col-md-6">
            <div className="card shadow-sm border h-100 p-3 d-flex flex-column justify-content-between">
              <div>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="badge bg-primary-subtle text-primary border small">{c.product || "Core"}</span>
                  <span className="badge bg-light text-secondary border small">{c.language || "en-IN"}</span>
                </div>
                <h5 className="fw-bold fs-6 mb-1 text-dark">{c.name} - Survey Flow</h5>
                <p className="text-secondary small mb-3">{c.description || "Interactive consumer research survey."}</p>
              </div>

              <div className="d-flex gap-2 border-top pt-3">
                <Link to={`/campaigns/${c._id}/survey`} className="btn btn-primary btn-sm flex-grow-1 d-flex align-items-center justify-content-center gap-1">
                  <Workflow size={14} />
                  <span>Open Survey Builder</span>
                </Link>
                <Link to={`/campaigns/${c._id}/survey/preview`} className="btn btn-outline-secondary btn-sm">
                  <Play size={14} />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
