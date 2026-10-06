import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useCampaign, useUpdateCampaign } from "../hooks/useCampaigns";
import { LoadingSpinner } from "../../../components/common/LoadingSpinner";
import { CampaignType } from "../../../types";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

export const EditCampaignPage: React.FC = () => {
  const { campaignId = "" } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();

  const { data: campaign, isLoading } = useCampaign(campaignId);
  const updateMutation = useUpdateCampaign();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [product, setProduct] = useState("");
  const [type, setType] = useState<CampaignType>(CampaignType.PRODUCT_RESEARCH);

  useEffect(() => {
    if (campaign) {
      setName(campaign.name);
      setDescription(campaign.description || "");
      setProduct(campaign.product || "");
      setType(campaign.type);
    }
  }, [campaign]);

  if (isLoading) return <LoadingSpinner message="Loading campaign..." />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateMutation.mutateAsync({
      id: campaignId,
      updates: { name, description, product, type },
    });
    navigate(`/campaigns/${campaignId}`);
  };

  return (
    <div className="container-fluid px-0" style={{ maxWidth: "760px" }}>
      <div className="d-flex align-items-center gap-2 mb-3">
        <Link to={`/campaigns/${campaignId}`} className="btn btn-outline-secondary btn-sm p-1">
          <ArrowLeft size={16} />
        </Link>
        <h1 className="h5 fw-bold mb-0 text-dark">Edit Campaign Settings</h1>
      </div>

      <div className="card shadow-sm border p-4">
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label small fw-bold">Campaign Name</label>
            <input
              type="text"
              className="form-control form-control-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label small fw-bold">Target Product</label>
            <input
              type="text"
              className="form-control form-control-sm"
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label small fw-bold">Campaign Type</label>
            <select
              className="form-select form-select-sm"
              value={type}
              onChange={(e) => setType(e.target.value as CampaignType)}
            >
              <option value={CampaignType.PRODUCT_RESEARCH}>Product & Consumer Research</option>
              <option value={CampaignType.SALES}>Sales Qualification</option>
              <option value={CampaignType.CUSTOMER_RETENTION}>Customer Retention</option>
              <option value={CampaignType.FEEDBACK}>Feedback</option>
              <option value={CampaignType.SURVEY}>General Survey</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="form-label small fw-bold">Description</label>
            <textarea
              className="form-control form-control-sm"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="d-flex justify-content-end gap-2 border-top pt-3">
            <Link to={`/campaigns/${campaignId}`} className="btn btn-outline-secondary btn-sm px-3">
              Cancel
            </Link>
            <button
              type="submit"
              className="btn btn-primary btn-sm px-4"
              disabled={updateMutation.isPending}
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
