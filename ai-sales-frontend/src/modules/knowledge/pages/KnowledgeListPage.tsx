import React, { useState } from "react";
import { BookOpen, Plus, FileText, CheckCircle2, Search, Upload, Trash2, RefreshCw, Tag, Sparkles, AlertCircle, Megaphone } from "lucide-react";
import { useKnowledge, useCreateKnowledgeItem, useDeleteKnowledgeItem, useUploadDocument } from "../hooks/useKnowledge";
import { useProducts } from "../../products/hooks/useProducts";
import { useCampaigns } from "../../campaigns/hooks/useCampaigns";
import { LoadingSpinner } from "../../../components/common/LoadingSpinner";
import { ErrorState } from "../../../components/common/ErrorState";

export const KnowledgeListPage: React.FC = () => {
  const [selectedCampaignFilter, setSelectedCampaignFilter] = useState<string>("ALL");
  const { data: campaigns } = useCampaigns();
  const { data: products } = useProducts();

  const { data: items, isLoading, isError, error, refetch } = useKnowledge(
    selectedCampaignFilter !== "ALL" ? { campaignId: selectedCampaignFilter } : undefined
  );
  
  const createItemMutation = useCreateKnowledgeItem();
  const deleteItemMutation = useDeleteKnowledgeItem();
  const uploadDocMutation = useUploadDocument();

  const [activeTab, setActiveTab] = useState<"items" | "upload">("items");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Item State
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    type: "FAQ",
    campaignId: "",
    productId: "",
    tags: "campaign, faq",
  });

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadCampaignId, setUploadCampaignId] = useState("");
  const [uploadProductId, setUploadProductId] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content) return;

    const tagsList = formData.tags.split(",").map((t) => t.trim()).filter(Boolean);

    await createItemMutation.mutateAsync({
      title: formData.title,
      content: formData.content,
      type: formData.type,
      campaignId: formData.campaignId || (selectedCampaignFilter !== "ALL" ? selectedCampaignFilter : undefined),
      productId: formData.productId || undefined,
      tags: tagsList,
    });

    setIsModalOpen(false);
    setFormData({
      title: "",
      content: "",
      type: "FAQ",
      campaignId: "",
      productId: "",
      tags: "campaign, faq",
    });
    refetch();
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    try {
      await uploadDocMutation.mutateAsync({
        file: selectedFile,
        productId: uploadProductId || undefined,
        campaignId: uploadCampaignId || (selectedCampaignFilter !== "ALL" ? selectedCampaignFilter : undefined),
      });
      setUploadSuccess(`"${selectedFile.name}" successfully parsed and vector embedded!`);
      setSelectedFile(null);
      refetch();
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Delete this knowledge base entry?")) {
      await deleteItemMutation.mutateAsync(id);
      refetch();
    }
  };

  const filteredItems = (items || []).filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "ALL" || item.type === typeFilter;
    const matchesCampaign =
      selectedCampaignFilter === "ALL" ||
      item.campaignId === selectedCampaignFilter ||
      (typeof item.campaignId === "object" && (item.campaignId as any)?._id === selectedCampaignFilter);
    return matchesSearch && matchesType && matchesCampaign;
  });

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "OBJECTION":
        return "badge bg-danger-subtle text-danger border border-danger-subtle";
      case "FAQ":
        return "badge bg-info-subtle text-info-emphasis border border-info-subtle";
      case "SALES_PLAYBOOK":
        return "badge bg-success-subtle text-success border border-success-subtle";
      case "CALL_SCRIPT":
        return "badge bg-warning-subtle text-warning-emphasis border border-warning-subtle";
      case "CALL_GUIDELINE":
        return "badge bg-primary-subtle text-primary border border-primary-subtle";
      default:
        return "badge bg-secondary-subtle text-secondary border border-secondary-subtle";
    }
  };

  const getCampaignName = (cId?: any) => {
    if (!cId) return null;
    const rawId = typeof cId === "object" ? cId._id || cId.name : cId;
    const camp = campaigns?.find((c) => c._id === rawId);
    return camp ? camp.name : typeof cId === "object" && cId.name ? cId.name : "Assigned Campaign";
  };

  return (
    <div className="d-flex flex-column gap-3">
      {/* Header */}
      <div className="card shadow-sm border p-3 d-flex flex-row justify-content-between align-items-center">
        <div>
          <div className="d-flex align-items-center gap-2">
            <h1 className="h5 fw-bold mb-0 text-dark">Campaign Knowledge Base & RAG Documents</h1>
            <span className="badge bg-primary-subtle text-primary border rounded-pill">
              {filteredItems.length} Available
            </span>
          </div>
          <span className="text-muted small" style={{ fontSize: "11px" }}>
            Campaign-specific playbooks, objection handlers, Q&As, and uploaded documents used by the AI voice calling engine.
          </span>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button
            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
            onClick={() => refetch()}
            title="Refresh Knowledge"
          >
            <RefreshCw size={14} />
            <span>Sync</span>
          </button>
          <button
            className="btn btn-primary btn-sm d-flex align-items-center gap-1 shadow-sm"
            onClick={() => {
              if (selectedCampaignFilter !== "ALL") {
                setFormData((prev) => ({ ...prev, campaignId: selectedCampaignFilter }));
              }
              setIsModalOpen(true);
            }}
          >
            <Plus size={15} />
            <span>Add Entry</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="d-flex gap-2 border-bottom pb-2">
        <button
          className={`btn btn-sm ${activeTab === "items" ? "btn-primary" : "btn-light border"}`}
          onClick={() => setActiveTab("items")}
        >
          Knowledge Repository ({filteredItems.length})
        </button>
        <button
          className={`btn btn-sm ${activeTab === "upload" ? "btn-primary" : "btn-light border"}`}
          onClick={() => setActiveTab("upload")}
        >
          <Upload size={13} className="me-1" />
          Ingest Document (PDF / DOCX)
        </button>
      </div>

      {activeTab === "upload" ? (
        <div className="card shadow-sm border p-4" style={{ maxWidth: "600px", margin: "0 auto" }}>
          <h6 className="fw-bold mb-1 text-dark d-flex align-items-center gap-2">
            <Upload size={18} className="text-primary" />
            Upload Document for Campaign / Product
          </h6>
          <p className="text-muted small mb-3">
            Uploaded documents are automatically chunked, embedded into vectors, and used to answer off-survey customer questions during live calls.
          </p>

          {uploadSuccess && (
            <div className="alert alert-success alert-dismissible fade show p-2 small mb-3" role="alert">
              <CheckCircle2 size={15} className="me-1 inline" />
              {uploadSuccess}
            </div>
          )}

          <form onSubmit={handleFileUpload} className="d-flex flex-column gap-3">
            <div>
              <label className="form-label small fw-bold">Associated Campaign (Recommended)</label>
              <select
                className="form-select form-select-sm"
                value={uploadCampaignId}
                onChange={(e) => setUploadCampaignId(e.target.value)}
              >
                <option value="">Select Campaign...</option>
                {campaigns?.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.type})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label small fw-bold">Associated Product (Optional)</label>
              <select
                className="form-select form-select-sm"
                value={uploadProductId}
                onChange={(e) => setUploadProductId(e.target.value)}
              >
                <option value="">Select Product...</option>
                {products?.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label small fw-bold">Select File (.pdf, .docx, .txt)</label>
              <input
                type="file"
                className="form-control form-control-sm"
                accept=".pdf,.docx,.txt"
                required
                onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-sm d-flex align-items-center justify-content-center gap-1 shadow-sm mt-2"
              disabled={uploadDocMutation.isPending || !selectedFile}
            >
              {uploadDocMutation.isPending ? (
                <>
                  <span className="spinner-border spinner-border-sm me-1"></span>
                  Processing & Vector Embedding...
                </>
              ) : (
                <>
                  <Upload size={15} />
                  <span>Start Document Vectorization</span>
                </>
              )}
            </button>
          </form>
        </div>
      ) : (
        <>
          {/* Search & Campaign Filters */}
          <div className="card shadow-sm border p-3">
            <div className="row g-2 align-items-center">
              <div className="col-12 col-md-5">
                <div className="input-group input-group-sm">
                  <span className="input-group-text bg-white border-end-0">
                    <Search size={14} className="text-muted" />
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0"
                    placeholder="Search knowledge by title or content..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-12 col-md-7 d-flex justify-content-md-end gap-2">
                <div className="d-flex align-items-center gap-1">
                  <Megaphone size={14} className="text-muted" />
                  <select
                    className="form-select form-select-sm"
                    style={{ minWidth: "190px" }}
                    value={selectedCampaignFilter}
                    onChange={(e) => setSelectedCampaignFilter(e.target.value)}
                  >
                    <option value="ALL">All Campaigns</option>
                    {campaigns?.map((c) => (
                      <option key={c._id} value={c._id}>
                        Campaign: {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <select
                  className="form-select form-select-sm"
                  style={{ width: "160px" }}
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="ALL">All Types</option>
                  <option value="SALES_PLAYBOOK">Sales Playbook</option>
                  <option value="OBJECTION">Objection Handler</option>
                  <option value="FAQ">FAQ</option>
                  <option value="CALL_SCRIPT">Call Script</option>
                  <option value="CALL_GUIDELINE">Call Guideline</option>
                  <option value="CASE_STUDY">Case Study</option>
                </select>
              </div>
            </div>
          </div>

          {/* List */}
          {isLoading ? (
            <LoadingSpinner message="Fetching campaign knowledge items..." />
          ) : isError ? (
            <ErrorState message={(error as any)?.message || "Failed to load knowledge."} onRetry={() => refetch()} />
          ) : filteredItems.length === 0 ? (
            <div className="card shadow-sm border p-5 text-center">
              <BookOpen size={36} className="mx-auto text-muted mb-2 opacity-50" />
              <h6 className="fw-bold text-secondary">No Knowledge Base Items Found</h6>
              <p className="text-muted small mb-3">
                {selectedCampaignFilter !== "ALL"
                  ? "No knowledge items assigned to this campaign yet. Add an entry to customize AI calling responses!"
                  : "Add objection scripts, FAQs, or upload docs to empower the AI agent during campaign calls."}
              </p>
              <button
                className="btn btn-primary btn-sm mx-auto"
                onClick={() => {
                  if (selectedCampaignFilter !== "ALL") {
                    setFormData((prev) => ({ ...prev, campaignId: selectedCampaignFilter }));
                  }
                  setIsModalOpen(true);
                }}
              >
                <Plus size={14} className="me-1" /> Add Campaign Knowledge
              </button>
            </div>
          ) : (
            <div className="d-flex flex-column gap-2">
              {filteredItems.map((item) => {
                const campaignLabel = getCampaignName(item.campaignId);
                return (
                  <div key={item._id} className="card shadow-sm border p-3">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div className="d-flex flex-wrap align-items-center gap-2">
                        <span className={getTypeBadge(item.type)}>{item.type}</span>
                        {campaignLabel && (
                          <span className="badge bg-purple-subtle text-purple border" style={{ backgroundColor: "#f3e8ff", color: "#6b21a8", borderColor: "#d8b4fe" }}>
                            <Megaphone size={11} className="me-1 inline" />
                            {campaignLabel}
                          </span>
                        )}
                        <h6 className="fw-bold mb-0 text-dark">{item.title}</h6>
                      </div>
                      <button
                        className="btn btn-outline-danger btn-sm p-1"
                        title="Delete Entry"
                        onClick={() => handleDelete(item._id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <p className="text-secondary small mb-2" style={{ whiteSpace: "pre-line", fontSize: "12px" }}>
                      {item.content}
                    </p>

                    <div className="d-flex flex-wrap gap-1 align-items-center pt-2 border-top">
                      <Tag size={12} className="text-muted" />
                      {item.tags && item.tags.length > 0 ? (
                        item.tags.map((t, i) => (
                          <span key={i} className="badge bg-light text-secondary border" style={{ fontSize: "10px" }}>
                            #{t}
                          </span>
                        ))
                      ) : (
                        <span className="text-muted small" style={{ fontSize: "10px" }}>
                          No tags
                        </span>
                      )}
                      <span className="text-muted ms-auto small" style={{ fontSize: "10px" }}>
                        Vector RAG: Active
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Add Knowledge Modal */}
      {isModalOpen && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content shadow-lg border-0">
              <div className="modal-header border-bottom">
                <h5 className="modal-title h6 fw-bold">Add Campaign Knowledge / Objection Handler</h5>
                <button type="button" className="btn-close" onClick={() => setIsModalOpen(false)}></button>
              </div>
              <form onSubmit={handleCreateItem}>
                <div className="modal-body d-flex flex-column gap-3">
                  <div className="row g-2">
                    <div className="col-8">
                      <label className="form-label small fw-bold">Title / Topic *</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        required
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="e.g. Guard CP+Rurban Pricing & Warranty"
                      />
                    </div>
                    <div className="col-4">
                      <label className="form-label small fw-bold">Type</label>
                      <select
                        className="form-select form-select-sm"
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      >
                        <option value="FAQ">FAQ</option>
                        <option value="OBJECTION">Objection Handler</option>
                        <option value="SALES_PLAYBOOK">Sales Playbook</option>
                        <option value="CALL_SCRIPT">Call Script</option>
                        <option value="CALL_GUIDELINE">Call Guideline</option>
                        <option value="CASE_STUDY">Case Study</option>
                      </select>
                    </div>
                  </div>

                  <div className="row g-2">
                    <div className="col-6">
                      <label className="form-label small fw-bold">Associated Campaign</label>
                      <select
                        className="form-select form-select-sm"
                        value={formData.campaignId}
                        onChange={(e) => setFormData({ ...formData, campaignId: e.target.value })}
                      >
                        <option value="">Select Campaign...</option>
                        {campaigns?.map((c) => (
                          <option key={c._id} value={c._id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-bold">Associated Product (Optional)</label>
                      <select
                        className="form-select form-select-sm"
                        value={formData.productId}
                        onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                      >
                        <option value="">Select Product...</option>
                        {products?.map((p) => (
                          <option key={p._id} value={p._id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="form-label small fw-bold">Guidance & Knowledge Content *</label>
                    <textarea
                      className="form-control form-control-sm"
                      rows={5}
                      required
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder="Enter the factual answer, pricing, guidance or how the AI voice agent should reply if customer asks about this during the call..."
                    />
                  </div>

                  <div>
                    <label className="form-label small fw-bold">Tags (comma separated)</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      placeholder="pricing, guard, warranty, objection"
                    />
                  </div>
                </div>
                <div className="modal-footer border-top">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm d-flex align-items-center gap-1"
                    disabled={createItemMutation.isPending}
                  >
                    {createItemMutation.isPending ? "Saving..." : "Save Knowledge Item"}
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

