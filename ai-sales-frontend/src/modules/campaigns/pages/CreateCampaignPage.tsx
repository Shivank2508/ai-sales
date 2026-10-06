import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCreateCampaign } from "../hooks/useCampaigns";
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
} from "lucide-react";

export const CreateCampaignPage: React.FC = () => {
  const navigate = useNavigate();
  const createMutation = useCreateCampaign();

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    businessName: "Procter & Gamble Consumer Insights",
    product: "",
    type: CampaignType.PRODUCT_RESEARCH,
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
    description: string;
    targetAudience: string;
    language: string;
  }) => {
    setFormData({
      ...formData,
      ...preset,
    });
    setErrors({});
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
        description: formData.description.trim(),
        startDate: formData.startDate,
        endDate: formData.endDate || undefined,
        targetAudience: formData.targetAudience.trim(),
        language: formData.language,
      });

      navigate(`/campaigns/${created._id}`);
    } catch (err: any) {
      setApiError(err.message || "Failed to create campaign.");
    }
  };

  return (
    <div className="container-fluid px-0" style={{ maxWidth: "880px" }}>
      {/* Back link & Header */}
      <div className="d-flex align-items-center gap-2 mb-3">
        <Link to="/campaigns" className="btn btn-outline-secondary btn-sm p-1">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="h4 fw-bold mb-0">Create New Campaign</h1>
          <p className="text-secondary small mb-0">
            Define campaign targeting, language, and audience parameters before configuring the survey.
          </p>
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
                className="p-3 border rounded-3 bg-light-subtle hover-shadow"
                style={{ cursor: "pointer" }}
                onClick={() =>
                  applyPreset({
                    name: "Guard Razor Consumer Study",
                    product: "Gillette Guard",
                    type: CampaignType.PRODUCT_RESEARCH,
                    description: "Voice AI consumer research on Gillette Guard purchasing behavior, repeat intent, and shaving habits.",
                    targetAudience: "Male consumers age 18-45 in tier 2/3 cities",
                    language: "en-IN",
                  })
                }
              >
                <span className="badge bg-primary-subtle text-primary border mb-1">Gillette Guard Study</span>
                <div className="fw-bold small text-dark">Consumer Habit Poll</div>
                <div className="text-muted small" style={{ fontSize: "11px" }}>5 Questions • Repeat Purchase</div>
              </div>
            </div>

            <div className="col-12 col-md-4">
              <div
                className="p-3 border rounded-3 bg-light-subtle hover-shadow"
                style={{ cursor: "pointer" }}
                onClick={() =>
                  applyPreset({
                    name: "B2B SaaS Sales Discovery & Qualifier",
                    product: "Voice CRM Suite",
                    type: CampaignType.SALES,
                    description: "Automated discovery survey asking team size, CRM software, and budget timeline.",
                    targetAudience: "VPs of Sales and Revenue Operations",
                    language: "en-US",
                  })
                }
              >
                <span className="badge bg-success-subtle text-success border mb-1">B2B Inbound Qualifier</span>
                <div className="fw-bold small text-dark">Enterprise Sales Discovery</div>
                <div className="text-muted small" style={{ fontSize: "11px" }}>Lead qualification & Budget</div>
              </div>
            </div>

            <div className="col-12 col-md-4">
              <div
                className="p-3 border rounded-3 bg-light-subtle hover-shadow"
                style={{ cursor: "pointer" }}
                onClick={() =>
                  applyPreset({
                    name: "Customer Onboarding & CSAT Health Check",
                    product: "Platform Core",
                    type: CampaignType.CUSTOMER_RETENTION,
                    description: "14-day proactive outreach gauging user onboarding satisfaction and friction points.",
                    targetAudience: "Newly onboarded workspace accounts",
                    language: "en-US",
                  })
                }
              >
                <span className="badge bg-purple-subtle text-purple border mb-1">CSAT & Retention</span>
                <div className="fw-bold small text-dark">Onboarding Health Poll</div>
                <div className="text-muted small" style={{ fontSize: "11px" }}>Satisfaction Rating & Feedback</div>
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

          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              {/* Campaign Name */}
              <div className="col-12">
                <label className="form-label small fw-bold">
                  Campaign Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className={`form-control ${errors.name ? "is-invalid" : ""}`}
                  placeholder="e.g. Guard Razor Consumer Study"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                />
                {errors.name && <div className="invalid-feedback small">{errors.name}</div>}
              </div>

              {/* Business Name & Product */}
              <div className="col-12 col-md-6">
                <label className="form-label small fw-bold">Business Unit</label>
                <div className="input-group input-group-sm">
                  <span className="input-group-text bg-light">
                    <Building size={14} />
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.businessName}
                    onChange={(e) => handleChange("businessName", e.target.value)}
                  />
                </div>
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label small fw-bold">
                  Target Product / Service <span className="text-danger">*</span>
                </label>
                <div className="input-group input-group-sm">
                  <span className="input-group-text bg-light">
                    <Package size={14} />
                  </span>
                  <input
                    type="text"
                    className={`form-control ${errors.product ? "is-invalid" : ""}`}
                    placeholder="e.g. Gillette Guard"
                    value={formData.product}
                    onChange={(e) => handleChange("product", e.target.value)}
                  />
                </div>
                {errors.product && <div className="text-danger small mt-1">{errors.product}</div>}
              </div>

              {/* Campaign Type & Language */}
              <div className="col-12 col-md-6">
                <label className="form-label small fw-bold">Campaign Type</label>
                <select
                  className="form-select form-select-sm"
                  value={formData.type}
                  onChange={(e) => handleChange("type", e.target.value)}
                >
                  <option value={CampaignType.PRODUCT_RESEARCH}>Product & Consumer Research</option>
                  <option value={CampaignType.SALES}>Sales Qualification</option>
                  <option value={CampaignType.CUSTOMER_RETENTION}>Customer Retention & CSAT</option>
                  <option value={CampaignType.FEEDBACK}>General Feedback</option>
                  <option value={CampaignType.SURVEY}>General Survey</option>
                </select>
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label small fw-bold">Primary Speech / Text Language</label>
                <select
                  className="form-select form-select-sm"
                  value={formData.language}
                  onChange={(e) => handleChange("language", e.target.value)}
                >
                  <option value="en-IN">English (India) [en-IN]</option>
                  <option value="en-US">English (US) [en-US]</option>
                  <option value="en-GB">English (UK) [en-GB]</option>
                  <option value="hi-IN">Hindi (India) [hi-IN]</option>
                  <option value="es-ES">Spanish [es-ES]</option>
                  <option value="fr-FR">French [fr-FR]</option>
                </select>
              </div>

              {/* Description */}
              <div className="col-12">
                <label className="form-label small fw-bold">Campaign Description & Purpose</label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Describe the research goals or sales targets for this campaign..."
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                />
              </div>

              {/* Target Audience */}
              <div className="col-12">
                <label className="form-label small fw-bold">Target Audience Criteria</label>
                <div className="input-group input-group-sm">
                  <span className="input-group-text bg-light">
                    <Users size={14} />
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Male consumers age 18-45 in tier 2/3 cities"
                    value={formData.targetAudience}
                    onChange={(e) => handleChange("targetAudience", e.target.value)}
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="col-12 col-md-6">
                <label className="form-label small fw-bold">Start Date</label>
                <input
                  type="date"
                  className="form-control form-control-sm"
                  value={formData.startDate}
                  onChange={(e) => handleChange("startDate", e.target.value)}
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label small fw-bold">End Date (Optional)</label>
                <input
                  type="date"
                  className="form-control form-control-sm"
                  value={formData.endDate}
                  onChange={(e) => handleChange("endDate", e.target.value)}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
              <Link to="/campaigns" className="btn btn-outline-secondary btn-sm px-3">
                Cancel
              </Link>
              <button
                type="submit"
                className="btn btn-primary btn-sm px-4 d-flex align-items-center gap-2"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <>
                    <span className="spinner-border spinner-border-sm"></span>
                    <span>Creating Campaign...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Create & Open Campaign</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
