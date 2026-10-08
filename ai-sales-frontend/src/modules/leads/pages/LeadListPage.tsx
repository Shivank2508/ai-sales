<<<<<<< HEAD
import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Search,
  Plus,
  Filter,
  Phone,
  Mail,
  Building,
  Trash2,
  Edit3,
  X,
  Check,
  RefreshCw,
  UploadCloud,
  FileUp,
  FileText,
  CheckCircle2,
  Megaphone,
  PhoneCall,
  Sparkles,
} from "lucide-react";
import { useLeads, useCreateLead, useDeleteLead, useUpdateLead, useImportLeads } from "../hooks/useLeads";
import { useCampaigns } from "../../campaigns/hooks/useCampaigns";
import { LoadingSpinner } from "../../../components/common/LoadingSpinner";
import { ErrorState } from "../../../components/common/ErrorState";

export const LeadListPage: React.FC = () => {
  const [selectedCampaignFilter, setSelectedCampaignFilter] = useState<string>("ALL");
  const { data: campaigns } = useCampaigns();
  const { data: leads, isLoading, isError, error, refetch } = useLeads(
    selectedCampaignFilter !== "ALL" ? selectedCampaignFilter : undefined
  );

  const createLeadMutation = useCreateLead();
  const importLeadsMutation = useImportLeads();
  const deleteLeadMutation = useDeleteLead();
  const updateLeadMutation = useUpdateLead();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // New Lead Form State
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    companyName: "",
    jobTitle: "",
    industry: "",
    location: "",
    campaignId: "",
    status: "NEW",
  });

  // Upload Leads State
  const [uploadTab, setUploadTab] = useState<"file" | "text">("file");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState("");
  const [uploadCampaignId, setUploadCampaignId] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName) return;
    await createLeadMutation.mutateAsync({
      ...formData,
      campaignId: formData.campaignId || (selectedCampaignFilter !== "ALL" ? selectedCampaignFilter : undefined),
    });
    setIsModalOpen(false);
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      companyName: "",
      jobTitle: "",
      industry: "",
      location: "",
      campaignId: "",
      status: "NEW",
    });
    refetch();
  };

  const parseCsvText = (text: string): any[] => {
    const lines = text.trim().split("\n").filter((l) => l.trim().length > 0);
    if (lines.length === 0) return [];

    const headerLine = lines[0].toLowerCase();
    const hasHeader = headerLine.includes("name") || headerLine.includes("phone") || headerLine.includes("email") || headerLine.includes("company");

    const dataLines = hasHeader ? lines.slice(1) : lines;
    return dataLines.map((line) => {
      const cols = line.split(",").map((c) => c.trim().replace(/^["']|["']$/g, ""));
      // Simple heuristic mapping: [Name, Phone, Email, Company, JobTitle]
      let name = cols[0] || "Contact";
      let nameParts = name.split(" ");
      let firstName = nameParts[0] || "Prospect";
      let lastName = nameParts.slice(1).join(" ") || "";
      let phone = cols.find((c) => /^\+?[\d\s-]{7,15}$/.test(c)) || (cols[1] && !cols[1].includes("@") ? cols[1] : "");
      let email = cols.find((c) => c.includes("@")) || (cols[2] && cols[2].includes("@") ? cols[2] : "");
      let companyName = cols[3] || "";
      let jobTitle = cols[4] || "";

      return {
        firstName,
        lastName,
        phone,
        email,
        companyName,
        jobTitle,
        status: "NEW",
      };
    });
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let leadsToImport: any[] = [];

    if (uploadTab === "file") {
      if (!selectedFile) {
        alert("Please select a CSV or TXT file");
        return;
      }
      const text = await selectedFile.text();
      leadsToImport = parseCsvText(text);
    } else {
      if (!pastedText.trim()) {
        alert("Please paste contact information");
        return;
      }
      leadsToImport = parseCsvText(pastedText);
    }

    if (leadsToImport.length === 0) {
      alert("Could not parse any valid contacts from the provided data.");
      return;
    }

    try {
      const targetCampId = uploadCampaignId || (selectedCampaignFilter !== "ALL" ? selectedCampaignFilter : undefined);
      const res = await importLeadsMutation.mutateAsync({
        leads: leadsToImport,
        campaignId: targetCampId,
      });

      setUploadSuccess(`Successfully imported ${res.importedCount} leads${targetCampId ? " and enrolled them into the campaign!" : "!"}`);
      setSelectedFile(null);
      setPastedText("");
      refetch();
      setTimeout(() => {
        setIsUploadModalOpen(false);
        setUploadSuccess(null);
      }, 1500);
    } catch (err: any) {
      alert("Failed to import leads: " + (err.response?.data?.message || err.message));
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    await updateLeadMutation.mutateAsync({ id, updates: { status: newStatus } });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this lead?")) {
      await deleteLeadMutation.mutateAsync(id);
      refetch();
    }
  };

  const getCampaignName = (cId?: any) => {
    if (!cId) return null;
    const rawId = typeof cId === "object" ? cId._id || cId.name : cId;
    const camp = campaigns?.find((c) => c._id === rawId);
    return camp ? camp.name : typeof cId === "object" && cId.name ? cId.name : null;
  };

  const filteredLeads = (leads || []).filter((l) => {
    const fullName = `${l.firstName} ${l.lastName || ""}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchQuery.toLowerCase()) ||
      (l.email && l.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (l.companyName && l.companyName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (l.phone && l.phone.includes(searchQuery));
    const matchesStatus = statusFilter === "ALL" || l.status.toUpperCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const s = status.toUpperCase();
    switch (s) {
      case "QUALIFIED":
        return "badge bg-success-subtle text-success border border-success-subtle";
      case "CONTACTED":
        return "badge bg-primary-subtle text-primary border border-primary-subtle";
      case "NEW":
        return "badge bg-info-subtle text-info-emphasis border border-info-subtle";
      case "CONVERTED":
        return "badge bg-warning-subtle text-warning-emphasis border border-warning-subtle";
      case "LOST":
        return "badge bg-danger-subtle text-danger border border-danger-subtle";
      default:
        return "badge bg-light text-dark border";
    }
  };

  return (
    <div className="d-flex flex-column gap-3">
      {/* Header */}
      <div className="card shadow-sm border p-3 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
        <div>
          <div className="d-flex align-items-center gap-2">
            <h1 className="h5 fw-bold mb-0 text-dark">Campaign Leads & Target Audience</h1>
            <span className="badge bg-primary-subtle text-primary border rounded-pill">
              {filteredLeads.length} Contacts
            </span>
          </div>
          <span className="text-muted small" style={{ fontSize: "11px" }}>
            Prospect call lists linked to campaigns for automated AI voice calling and survey collection.
          </span>
        </div>
        <div className="d-flex flex-wrap align-items-center gap-2">
          {/* Campaign Filter Dropdown */}
          <div className="d-flex align-items-center gap-1 bg-light px-2 py-1 rounded border">
            <Megaphone size={14} className="text-primary" />
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
            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
            onClick={() => refetch()}
            title="Refresh Leads from Backend"
          >
            <RefreshCw size={14} />
            <span>Sync</span>
          </button>
          
          <button
            className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1 shadow-sm"
            onClick={() => {
              if (selectedCampaignFilter !== "ALL") {
                setUploadCampaignId(selectedCampaignFilter);
              }
              setIsUploadModalOpen(true);
            }}
          >
            <UploadCloud size={15} />
            <span>Upload Leads (CSV)</span>
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
            <span>Add Lead</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card shadow-sm border p-3">
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-6">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-white border-end-0">
                <Search size={14} className="text-muted" />
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search by name, phone, email, company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="col-12 col-md-6 d-flex justify-content-md-end gap-2">
            <div className="d-flex align-items-center gap-1">
              <Filter size={14} className="text-muted" />
              <select
                className="form-select form-select-sm"
                style={{ width: "160px" }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">All Statuses</option>
                <option value="NEW">New</option>
                <option value="CONTACTED">Contacted</option>
                <option value="QUALIFIED">Qualified</option>
                <option value="CONVERTED">Converted</option>
                <option value="LOST">Lost</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table */}
      {isLoading ? (
        <LoadingSpinner message="Fetching live contacts from database..." />
      ) : isError ? (
        <ErrorState message={(error as any)?.message || "Failed to load leads."} onRetry={() => refetch()} />
      ) : filteredLeads.length === 0 ? (
        <div className="card shadow-sm border p-5 text-center">
          <Users size={36} className="mx-auto text-muted mb-2 opacity-50" />
          <h6 className="fw-bold text-secondary">No Leads Found</h6>
          <p className="text-muted small mb-3">
            {selectedCampaignFilter !== "ALL"
              ? "No leads uploaded or assigned to this campaign yet. Upload a CSV or add leads to start calling!"
              : "Add or upload a lead list to start AI calling and survey workflows."}
          </p>
          <div className="d-flex justify-content-center gap-2">
            <button
              className="btn btn-outline-primary btn-sm"
              onClick={() => {
                if (selectedCampaignFilter !== "ALL") setUploadCampaignId(selectedCampaignFilter);
                setIsUploadModalOpen(true);
              }}
            >
              <UploadCloud size={14} className="me-1" /> Upload Leads (CSV)
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                if (selectedCampaignFilter !== "ALL") setFormData((prev) => ({ ...prev, campaignId: selectedCampaignFilter }));
                setIsModalOpen(true);
              }}
            >
              <Plus size={14} className="me-1" /> Add Single Lead
            </button>
          </div>
        </div>
      ) : (
        <div className="card shadow-sm border">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ fontSize: "13px" }}>
              <thead className="table-light text-secondary small text-uppercase">
                <tr>
                  <th className="ps-3">Lead Contact</th>
                  <th>Campaign Enrollment</th>
                  <th>Company & Title</th>
                  <th>Phone & Email</th>
                  <th>Status</th>
                  <th className="text-end pe-3">AI Outreach</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((l) => {
                  const campName = getCampaignName(l.campaignId) || (selectedCampaignFilter !== "ALL" ? getCampaignName(selectedCampaignFilter) : null);
                  return (
                    <tr key={l._id}>
                      <td className="ps-3">
                        <div className="fw-bold text-dark">
                          {l.firstName} {l.lastName || ""}
                        </div>
                        <span className="text-muted small" style={{ fontSize: "11px" }}>
                          ID: {l._id.slice(-6)}
                        </span>
                      </td>
                      <td>
                        {campName ? (
                          <span
                            className="badge bg-purple-subtle text-purple border"
                            style={{ backgroundColor: "#f3e8ff", color: "#6b21a8", borderColor: "#d8b4fe" }}
                          >
                            <Megaphone size={11} className="me-1 inline" />
                            {campName}
                          </span>
                        ) : (
                          <span className="badge bg-light text-muted border">General Audience</span>
                        )}
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-1 text-dark">
                          <Building size={13} className="text-secondary" />
                          <span>{l.companyName || "N/A"}</span>
                        </div>
                        <span className="text-muted small" style={{ fontSize: "11px" }}>
                          {l.jobTitle || "Prospect"}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-1 text-dark">
                          <Phone size={13} className="text-success" />
                          <span className="font-monospace fw-semibold">{l.phone || "—"}</span>
                        </div>
                        <div className="d-flex align-items-center gap-1 text-muted small" style={{ fontSize: "11px" }}>
                          <Mail size={12} />
                          <span>{l.email || "—"}</span>
                        </div>
                      </td>
                      <td>
                        <select
                          className={`form-select form-select-sm border-0 ${getStatusBadge(l.status)}`}
                          style={{ width: "130px", fontWeight: 600, cursor: "pointer" }}
                          value={l.status.toUpperCase()}
                          onChange={(e) => handleStatusChange(l._id, e.target.value)}
                        >
                          <option value="NEW">NEW</option>
                          <option value="CONTACTED">CONTACTED</option>
                          <option value="QUALIFIED">QUALIFIED</option>
                          <option value="CONVERTED">CONVERTED</option>
                          <option value="LOST">LOST</option>
                        </select>
                      </td>
                      <td className="text-end pe-3">
                        <div className="d-flex align-items-center justify-content-end gap-1">
                          <Link
                            to={`/agents/execution?leadId=${l._id}${l.campaignId ? `&campaignId=${l.campaignId}` : ""}`}
                            className="btn btn-success btn-sm d-flex align-items-center gap-1 py-1 px-2 shadow-sm"
                            title="Start AI Call with this Lead"
                          >
                            <PhoneCall size={12} />
                            <span style={{ fontSize: "11px" }}>Call</span>
                          </Link>
                          <button
                            className="btn btn-outline-danger btn-sm p-1"
                            title="Delete Lead"
                            onClick={() => handleDelete(l._id)}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* UPLOAD LEADS (CSV / EXCEL) MODAL */}
      {isUploadModalOpen && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content shadow-lg border-0">
              <div className="modal-header border-bottom">
                <div className="d-flex align-items-center gap-2">
                  <UploadCloud size={20} className="text-primary" />
                  <h5 className="modal-title h6 fw-bold mb-0">Upload Leads for Campaign Outreach</h5>
                </div>
                <button type="button" className="btn-close" onClick={() => setIsUploadModalOpen(false)}></button>
              </div>

              {uploadSuccess && (
                <div className="alert alert-success m-3 mb-0 p-2 small d-flex align-items-center gap-2">
                  <CheckCircle2 size={16} />
                  <span>{uploadSuccess}</span>
                </div>
              )}

              <form onSubmit={handleUploadSubmit}>
                <div className="modal-body d-flex flex-column gap-3 p-4">
                  {/* Select Campaign to Enroll into */}
                  <div>
                    <label className="form-label small fw-bold text-dark">
                      Target Campaign to Enroll Leads into (Recommended)
                    </label>
                    <select
                      className="form-select form-select-sm"
                      value={uploadCampaignId}
                      onChange={(e) => setUploadCampaignId(e.target.value)}
                    >
                      <option value="">-- General Audience (No specific campaign) --</option>
                      {campaigns?.map((camp) => (
                        <option key={camp._id} value={camp._id}>
                          {camp.name} ({camp.action || "CALL"})
                        </option>
                      ))}
                    </select>
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
                        Upload File (.csv, .xlsx, .txt)
                      </button>
                    </li>
                    <li className="nav-item">
                      <button
                        type="button"
                        className={`nav-link py-1 small fw-bold ${uploadTab === "text" ? "active" : ""}`}
                        onClick={() => setUploadTab("text")}
                      >
                        <FileText size={14} className="me-1" />
                        Paste Contact Rows
                      </button>
                    </li>
                  </ul>

                  {uploadTab === "file" ? (
                    <div
                      className={`border-2 border-dashed rounded-3 p-4 text-center ${
                        isDragging ? "border-primary bg-primary-subtle" : "border-secondary-subtle bg-light"
                      }`}
                      style={{ cursor: "pointer" }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                        if (e.dataTransfer.files?.[0]) setSelectedFile(e.dataTransfer.files[0]);
                      }}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="d-none"
                        accept=".csv,.txt,.tsv"
                        onChange={(e) => {
                          if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
                        }}
                      />
                      <UploadCloud size={36} className="text-primary mb-2 opacity-75" />
                      {selectedFile ? (
                        <div>
                          <div className="fw-bold text-success mb-1 d-flex align-items-center justify-content-center gap-1">
                            <CheckCircle2 size={16} />
                            <span>{selectedFile.name}</span>
                          </div>
                          <div className="text-muted small">{(selectedFile.size / 1024).toFixed(1)} KB — Click to replace</div>
                        </div>
                      ) : (
                        <div>
                          <div className="fw-bold text-dark mb-1">Click to browse or drag & drop CSV file</div>
                          <div className="text-muted small">Columns supported: Name, Phone, Email, Company, Job Title</div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <label className="form-label small fw-bold text-dark">Paste Contacts (CSV Format)</label>
                      <textarea
                        className="form-control font-monospace small"
                        rows={6}
                        placeholder={`Name, Phone, Email, Company, Job Title\n\nRahul Sharma, +919876543210, rahul@techcorp.com, TechCorp, VP Sales\nAnanya Verma, +919811122233, ananya@startup.io, StartupIO, Founder`}
                        value={pastedText}
                        onChange={(e) => setPastedText(e.target.value)}
                      />
                    </div>
                  )}
                </div>

                <div className="modal-footer border-top">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsUploadModalOpen(false)}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm d-flex align-items-center gap-1 shadow-sm"
                    disabled={importLeadsMutation.isPending || (uploadTab === "file" && !selectedFile) || (uploadTab === "text" && !pastedText.trim())}
                  >
                    {importLeadsMutation.isPending ? "Importing Leads..." : "Import & Enroll in Campaign"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Single Lead Modal */}
      {isModalOpen && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow-lg border-0">
              <div className="modal-header border-bottom">
                <h5 className="modal-title h6 fw-bold">Create New Lead Contact</h5>
                <button type="button" className="btn-close" onClick={() => setIsModalOpen(false)}></button>
              </div>
              <form onSubmit={handleCreateLead}>
                <div className="modal-body d-flex flex-column gap-3">
                  <div className="row g-2">
                    <div className="col-6">
                      <label className="form-label small fw-bold">First Name *</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        required
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        placeholder="e.g. Rahul"
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-bold">Last Name</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        placeholder="e.g. Sharma"
                      />
                    </div>
                  </div>

                  <div className="row g-2">
                    <div className="col-6">
                      <label className="form-label small fw-bold">Phone Number *</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+91 98765 43210"
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-bold">Email</label>
                      <input
                        type="email"
                        className="form-control form-control-sm"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="rahul@example.com"
                      />
                    </div>
                  </div>

                  <div className="row g-2">
                    <div className="col-6">
                      <label className="form-label small fw-bold">Assign to Campaign</label>
                      <select
                        className="form-select form-select-sm"
                        value={formData.campaignId}
                        onChange={(e) => setFormData({ ...formData, campaignId: e.target.value })}
                      >
                        <option value="">Select Campaign...</option>
                        {campaigns?.map((camp) => (
                          <option key={camp._id} value={camp._id}>
                            {camp.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-bold">Company Name</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        placeholder="e.g. TechCorp"
                      />
                    </div>
                  </div>

                  <div className="row g-2">
                    <div className="col-6">
                      <label className="form-label small fw-bold">Job Title</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={formData.jobTitle}
                        onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                        placeholder="e.g. VP Sales"
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-bold">Industry</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={formData.industry}
                        onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                        placeholder="e.g. SaaS"
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-top">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm d-flex align-items-center gap-1 shadow-sm"
                    disabled={createLeadMutation.isPending}
                  >
                    {createLeadMutation.isPending ? "Creating..." : "Save Lead & Enroll"}
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
import { Users, Search, Plus, Filter, Phone, Mail, Building } from "lucide-react";

export const LeadListPage: React.FC = () => {
  const leads = [
    { id: "1", name: "Rahul Sharma", phone: "+91 98765 43210", email: "rahul@example.com", status: "qualified", segment: "Tier-2 Metro" },
    { id: "2", name: "Amit Verma", phone: "+91 98111 22334", email: "amit@example.com", status: "contacted", segment: "Tier-1 Metro" },
    { id: "3", name: "Vikram Patel", phone: "+91 97234 56789", email: "vikram@example.com", status: "new", segment: "Tier-3 Town" },
    { id: "4", name: "Suresh Menon", phone: "+91 98450 11223", email: "suresh@example.com", status: "converted", segment: "Tier-2 Metro" },
  ];

  return (
    <div className="d-flex flex-column gap-3">
      <div className="card shadow-sm border p-3 d-flex justify-content-between align-items-center">
        <div>
          <h1 className="h5 fw-bold mb-0 text-dark">Leads & Audience Segments</h1>
          <span className="text-muted small" style={{ fontSize: "11px" }}>
            Target contacts for AI voice automated research calls and outbound campaigns.
          </span>
        </div>
        <button className="btn btn-primary btn-sm d-flex align-items-center gap-1">
          <Plus size={15} />
          <span>Import Leads</span>
        </button>
      </div>

      <div className="card shadow-sm border">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" style={{ fontSize: "13px" }}>
            <thead className="table-light text-secondary small text-uppercase">
              <tr>
                <th className="ps-3">Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Segment</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.id}>
                  <td className="ps-3 fw-bold">{l.name}</td>
                  <td>{l.phone}</td>
                  <td className="text-muted">{l.email}</td>
                  <td><span className="badge bg-light text-dark border">{l.segment}</span></td>
                  <td><span className="badge bg-success-subtle text-success border text-capitalize">{l.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
