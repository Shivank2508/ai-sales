import React, { useState, useRef } from "react";
import { Link, useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  useCampaign,
  usePublishCampaign,
  usePauseCampaign,
  useArchiveCampaign,
  useDeleteCampaign,
  useEditAICampaign,
  useAddLeadsToCampaign,
  useCallLeadWithAI,
} from "../hooks/useCampaigns";
import { useLeads, useImportLeads } from "../../leads/hooks/useLeads";
import { useSurveyByCampaign } from "../../surveys/hooks/useSurveys";
import { useSurveyResponses } from "../../responses/hooks/useResponses";
import { useConversations } from "../../conversations/hooks/useConversations";
import { useCampaignAnalytics } from "../../analytics/hooks/useAnalytics";
import { useAIAgents, useAssignCampaign } from "../../ai-agents/hooks/useAgents";
import { CampaignStatus, CampaignType, ResponseStatus } from "../../../types";
import { StatusBadge, CampaignTypeBadge } from "../../../components/common/StatusBadge";
import { StatCard } from "../../../components/common/StatCard";
import { LoadingSpinner } from "../../../components/common/LoadingSpinner";
import { ErrorState } from "../../../components/common/ErrorState";
import { ConfirmModal } from "../../../components/common/ConfirmModal";
import {
  ArrowLeft,
  Workflow,
  Play,
  Pause,
  Archive,
  Trash2,
  Edit,
  Eye,
  CheckCircle2,
  Calendar,
  Building,
  Package,
  Users,
  Clock,
  Sparkles,
  Bot,
  MessagesSquare,
  BarChart3,
  Settings,
  Layers,
  FileQuestion,
  TrendingUp,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  ShieldCheck,
  Globe,
  PhoneCall,
  Volume2,
  VolumeX,
  UserPlus,
  Loader2,
  Wand2,
  Send,
  Check,
  PhoneForwarded,
  PhoneOff,
  Radio,
  UploadCloud,
  FileText,
  Download,
  Plus,
} from "lucide-react";

export const CampaignDetailsPage: React.FC = () => {
  const { campaignId = "" } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Tab: overview | survey | leads | flow | responses | conversations | analytics | settings
  const activeTab = searchParams.get("tab") || "overview";
  const setTab = (tab: string) => setSearchParams({ tab });

  // Queries
  const { data: campaign, isLoading, isError, error, refetch } = useCampaign(campaignId);
  const { data: survey, isLoading: surveyLoading } = useSurveyByCampaign(campaignId);
  const { data: responses } = useSurveyResponses(campaignId);
  const { data: conversations } = useConversations(campaignId);
  const { data: analytics } = useCampaignAnalytics(campaignId);
  const { data: agents } = useAIAgents();
  const { data: allLeads = [] } = useLeads();
  const { data: campaignEnrolledLeads = [], refetch: refetchCampaignLeads } = useLeads(campaignId);

  // Mutations
  const publishMutation = usePublishCampaign();
  const pauseMutation = usePauseCampaign();
  const archiveMutation = useArchiveCampaign();
  const deleteMutation = useDeleteCampaign();
  const assignAgentMutation = useAssignCampaign();
  const editAiMutation = useEditAICampaign();
  const addLeadsMutation = useAddLeadsToCampaign();
  const callLeadMutation = useCallLeadWithAI();
  const importLeadsMutation = useImportLeads();

  // Confirm Modal state
  const [confirmAction, setConfirmAction] = useState<"publish" | "pause" | "archive" | "delete" | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState("");

  // AI Edit Modal State
  const [showAiEditModal, setShowAiEditModal] = useState(false);
  const [aiEditPrompt, setAiEditPrompt] = useState("");

  // Add Existing Leads Modal State
  const [showAddLeadsModal, setShowAddLeadsModal] = useState(false);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);

  // Upload Leads (CSV / File) Modal State
  const [showUploadLeadsModal, setShowUploadLeadsModal] = useState(false);
  const [uploadTab, setUploadTab] = useState<"file" | "text">("file");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI Voice Call Live State
  const [activeCallLead, setActiveCallLead] = useState<any | null>(null);
  const [callSession, setCallSession] = useState<{
    openingSpeech?: string;
    audioBase64?: string;
    conversationId?: string;
    surveySessionId?: string;
    status?: string;
  } | null>(null);
  const [callMessages, setCallMessages] = useState<
    Array<{ sender: "ai" | "lead"; text: string; sources?: any[]; timestamp: string }>
  >([]);
  const [leadReplyInput, setLeadReplyInput] = useState("");
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  if (isLoading) return <LoadingSpinner message="Loading campaign details..." />;
  if (isError || !campaign) {
    return (
      <ErrorState
        title="Campaign Not Found"
        message={error?.message || `Unable to load campaign ${campaignId}.`}
        onRetry={() => refetch()}
      />
    );
  }

  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    if (confirmAction === "publish") {
      await publishMutation.mutateAsync(campaign._id);
    } else if (confirmAction === "pause") {
      await pauseMutation.mutateAsync(campaign._id);
    } else if (confirmAction === "archive") {
      await archiveMutation.mutateAsync(campaign._id);
    } else if (confirmAction === "delete") {
      await deleteMutation.mutateAsync(campaign._id);
      navigate("/campaigns");
    }
    setConfirmAction(null);
  };

  const handleAiEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiEditPrompt.trim()) return;

    try {
      await editAiMutation.mutateAsync({
        campaignId: campaign._id,
        instructions: aiEditPrompt.trim(),
      });
      setShowAiEditModal(false);
      setAiEditPrompt("");
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddLeadsSubmit = async () => {
    if (selectedLeadIds.length === 0) return;

    try {
      await addLeadsMutation.mutateAsync({
        campaignId: campaign._id,
        leadIds: selectedLeadIds,
      });
      setShowAddLeadsModal(false);
      setSelectedLeadIds([]);
      refetch();
      refetchCampaignLeads();
    } catch (err) {
      console.error(err);
    }
  };

  const parseCsvText = (text: string): any[] => {
    const lines = text.trim().split("\n").filter((l) => l.trim().length > 0);
    if (lines.length === 0) return [];

    const headerLine = lines[0].toLowerCase();
    const hasHeader =
      headerLine.includes("name") ||
      headerLine.includes("phone") ||
      headerLine.includes("email") ||
      headerLine.includes("company");

    const dataLines = hasHeader ? lines.slice(1) : lines;
    return dataLines.map((line) => {
      const cols = line.split(",").map((c) => c.trim().replace(/^["']|["']$/g, ""));
      let name = cols[0] || "Prospect";
      let nameParts = name.split(" ");
      let firstName = nameParts[0] || "Prospect";
      let lastName = nameParts.slice(1).join(" ") || "";
      let phone =
        cols.find((c) => /^\+?[\d\s-]{7,15}$/.test(c)) ||
        (cols[1] && !cols[1].includes("@") ? cols[1] : "");
      let email =
        cols.find((c) => c.includes("@")) ||
        (cols[2] && cols[2].includes("@") ? cols[2] : "");
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

  const handleUploadLeadsSubmit = async (e: React.FormEvent) => {
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
      const res = await importLeadsMutation.mutateAsync({
        leads: leadsToImport,
        campaignId: campaign._id,
      });

      setUploadSuccess(`Successfully imported ${res.importedCount} leads and enrolled them into "${campaign.name}"!`);
      setSelectedFile(null);
      setPastedText("");
      refetch();
      refetchCampaignLeads();
      setTimeout(() => {
        setShowUploadLeadsModal(false);
        setUploadSuccess(null);
      }, 1500);
    } catch (err: any) {
      alert("Failed to import leads: " + err.message);
    }
  };

  const handleDownloadSampleCsv = () => {
    const csvContent =
      "Full Name,Phone,Email,Company,Job Title\n" +
      "Vikram Malhotra,+91 98111 22334,vikram@techcorp.in,TechCorp Solutions,Chief Technology Officer\n" +
      "Neha Sharma,+91 98222 33445,neha.s@cloudscale.io,CloudScale Systems,VP of Engineering\n" +
      "Amit Patel,+91 98333 44556,amit@globalenterprises.com,Global Enterprises,Head of Operations\n" +
      "Pooja Verma,+91 98444 55667,pooja.v@innovatetech.com,Innovate Tech,Product Lead";

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `sample_leads_${campaign?.name?.toLowerCase().replace(/\s+/g, "_") || "campaign"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleInitiateVoiceCall = async (lead: any) => {
    setActiveCallLead(lead);
    setCallMessages([]);
    setLeadReplyInput("");
    try {
      const callRes = await callLeadMutation.mutateAsync({
        campaignId: campaign._id,
        leadId: lead._id,
      });
      setCallSession(callRes);

      if (callRes?.openingSpeech) {
        setCallMessages([
          {
            sender: "ai",
            text: callRes.openingSpeech,
            sources: callRes.sources || [],
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
          },
        ]);
      }

      if (callRes?.audioBase64) {
        playAudio(callRes.audioBase64);
      }
    } catch (err: any) {
      alert("Failed to initiate voice call: " + err.message);
    }
  };

  const handleSendLeadReply = async (replyText?: string) => {
    const textToSend = replyText || leadReplyInput;
    if (!textToSend.trim() || !activeCallLead || !callSession) return;

    const userMsg = {
      sender: "lead" as const,
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    };
    setCallMessages((prev) => [...prev, userMsg]);
    setLeadReplyInput("");

    try {
      const callRes = await callLeadMutation.mutateAsync({
        campaignId: campaign._id,
        leadId: activeCallLead._id,
        customerReply: textToSend.trim(),
        conversationId: callSession.conversationId,
        surveySessionId: callSession.surveySessionId,
      });

      if (callRes?.openingSpeech) {
        const aiMsg = {
          sender: "ai" as const,
          text: callRes.openingSpeech,
          sources: callRes.sources || [],
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        };
        setCallMessages((prev) => [...prev, aiMsg]);
      }

      if (callRes?.audioBase64) {
        playAudio(callRes.audioBase64);
      }
    } catch (err: any) {
      alert("Failed to process conversation response: " + err.message);
    }
  };

  const playAudio = (base64: string) => {
    try {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(`data:audio/wav;base64,${base64}`);
      audioRef.current = audio;
      setIsPlayingAudio(true);
      audio.onended = () => setIsPlayingAudio(false);
      audio.onerror = () => setIsPlayingAudio(false);
      audio.play().catch(() => setIsPlayingAudio(false));
    } catch {
      setIsPlayingAudio(false);
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    }
  };

  const questionCount = survey?.questions?.length || 0;
  const totalConditions =
    survey?.questions?.reduce((acc, q) => acc + (q.conditionGroups?.length || 0), 0) || 0;

  const campaignLeads =
    campaignEnrolledLeads.length > 0
      ? campaignEnrolledLeads
      : ((analytics as any)?.leads || []);

  // 1. OVERVIEW TAB
  const renderOverviewTab = () => {
    return (
      <div className="d-flex flex-column gap-3">
        {/* Quick KPI Stat Cards */}
        <div className="row g-3">
          <div className="col-12 col-sm-6 col-lg-3">
            <StatCard
              title="Total Leads"
              value={(analytics as any)?.totalLeads || campaign.stats?.totalLeads || campaignLeads.length || 0}
              subtitle="Enrolled in this campaign"
              icon={Users}
              variant="primary"
            />
          </div>
          <div className="col-12 col-sm-6 col-lg-3">
            <StatCard
              title="Contacted via Voice"
              value={(analytics as any)?.contacted || campaign.stats?.contactedLeads || 0}
              subtitle={`${(analytics as any)?.responseRate || campaign.stats?.responseRate || 0}% Response Rate`}
              icon={PhoneCall}
              variant="success"
            />
          </div>
          <div className="col-12 col-sm-6 col-lg-3">
            <StatCard
              title="Survey Completed"
              value={(analytics as any)?.completed || campaign.stats?.completedLeads || 0}
              subtitle={`${(analytics as any)?.completionRate || campaign.stats?.completionRate || 0}% Completion`}
              icon={CheckCircle2}
              variant="purple"
            />
          </div>
          <div className="col-12 col-sm-6 col-lg-3">
            <StatCard
              title="Average Sentiment"
              value="Positive"
              subtitle="AI Voice Analysis"
              icon={TrendingUp}
              variant="info"
            />
          </div>
        </div>

        {/* Campaign Pitch Script & Target Criteria Banner */}
        <div className="card shadow-sm border">
          <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
            <div className="fw-bold fs-6 text-dark d-flex align-items-center gap-2">
              <Sparkles size={18} className="text-primary" />
              <span>AI Voice Pitch & Qualification Strategy</span>
            </div>
            <button
              className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
              onClick={() => setShowAiEditModal(true)}
            >
              <Edit size={14} />
              <span>Edit with AI</span>
            </button>
          </div>
          <div className="card-body p-4">
            <div className="row g-3">
              <div className="col-md-6">
                <h6 className="fw-bold small text-muted text-uppercase mb-2">Target Customer Persona</h6>
                <div className="p-3 bg-light rounded-3 text-dark small">
                  {campaign.targetAudience || "B2B SaaS Founders, CROs, VPs of Sales looking for AI qualification"}
                </div>
              </div>
              <div className="col-md-6">
                <h6 className="fw-bold small text-muted text-uppercase mb-2">AI Voice Agent Hook</h6>
                <div className="p-3 bg-light-subtle border rounded-3 text-dark small fst-italic">
                  "{(campaign as any).settings?.messageTemplate || campaign.action || "Hi, I'm calling from SalesFlow AI to see if your team is currently looking to automate manual lead qualification and phone sales outreach."}"
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Leads & Calling Outreach Table Preview */}
        <div className="card shadow-sm border">
          <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div className="fw-bold fs-6 text-dark d-flex align-items-center gap-2">
              <PhoneCall size={18} className="text-success" />
              <span>Enrolled Campaign Leads ({campaignLeads.length})</span>
            </div>
            <div className="d-flex align-items-center gap-2">
              <button
                className="btn btn-sm btn-primary d-flex align-items-center gap-1 shadow-sm"
                onClick={() => setShowUploadLeadsModal(true)}
              >
                <UploadCloud size={14} />
                <span>Upload Leads (CSV)</span>
              </button>
              <button
                className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                onClick={() => setShowAddLeadsModal(true)}
              >
                <UserPlus size={14} />
                <span>Select Existing</span>
              </button>
            </div>
          </div>
          <div className="card-body p-0">
            {campaignLeads.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light small text-uppercase">
                    <tr>
                      <th>Lead Name</th>
                      <th>Company & Title</th>
                      <th>Phone</th>
                      <th>Status</th>
                      <th className="text-end">AI Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaignLeads.slice(0, 5).map((l: any) => {
                      const leadObj = l.leadId || l;
                      const name = leadObj.firstName ? `${leadObj.firstName} ${leadObj.lastName || ""}` : leadObj.name || "Sales Lead";
                      return (
                        <tr key={leadObj._id}>
                          <td className="fw-bold text-dark">{name}</td>
                          <td>
                            <div className="small">{leadObj.companyName || leadObj.company || "Enterprise"}</div>
                            <div className="text-muted" style={{ fontSize: "11px" }}>{leadObj.jobTitle || leadObj.title || "Decision Maker"}</div>
                          </td>
                          <td>
                            <span className="badge bg-light text-dark border">{leadObj.phone || "+91 98765 43210"}</span>
                          </td>
                          <td>
                            <span className={`badge ${l.status === "COMPLETED" ? "bg-success" : l.status === "CONTACTED" ? "bg-info" : "bg-warning text-dark"}`}>
                              {l.status || "PENDING"}
                            </span>
                          </td>
                          <td className="text-end">
                            <button
                              className="btn btn-sm btn-success d-inline-flex align-items-center gap-1 shadow-sm px-3"
                              onClick={() => handleInitiateVoiceCall(leadObj)}
                              disabled={callLeadMutation.isPending}
                            >
                              <PhoneCall size={13} />
                              <span>AI Voice Call</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4 text-center">
                <p className="text-muted small mb-2">No leads uploaded for this campaign yet.</p>
                <button
                  className="btn btn-primary btn-sm d-inline-flex align-items-center gap-1"
                  onClick={() => setShowUploadLeadsModal(true)}
                >
                  <UploadCloud size={14} />
                  <span>Upload CSV Leads Now</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // 2. LEADS TAB
  const renderLeadsTab = () => {
    return (
      <div className="card shadow-sm border">
        <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div>
            <h5 className="fw-bold mb-0 fs-6">Campaign Leads & AI Voice Calling Outreach</h5>
            <p className="text-secondary small mb-0">Manage prospect list, upload contact CSVs, and trigger real-time AI Voice calls with survey questions.</p>
          </div>
          <div className="d-flex align-items-center gap-2">
            <button
              className="btn btn-primary btn-sm d-flex align-items-center gap-1 shadow-sm"
              onClick={() => setShowUploadLeadsModal(true)}
            >
              <UploadCloud size={14} />
              <span>Upload Leads (CSV / File)</span>
            </button>
            <button
              className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1 shadow-sm"
              onClick={() => setShowAddLeadsModal(true)}
            >
              <UserPlus size={14} />
              <span>Select Existing Leads</span>
            </button>
          </div>
        </div>
        <div className="card-body p-0">
          {campaignLeads.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light small text-uppercase">
                  <tr>
                    <th>Lead Contact</th>
                    <th>Organization</th>
                    <th>Phone Number</th>
                    <th>Outreach Status</th>
                    <th>Last Attempt</th>
                    <th className="text-end">Voice Outreach</th>
                  </tr>
                </thead>
                <tbody>
                  {campaignLeads.map((l: any) => {
                    const leadObj = l.leadId || l;
                    const name = leadObj.firstName ? `${leadObj.firstName} ${leadObj.lastName || ""}` : leadObj.name || "Prospect";
                    return (
                      <tr key={leadObj._id}>
                        <td>
                          <div className="fw-bold text-dark">{name}</div>
                          <div className="text-muted small">{leadObj.email || "prospect@company.com"}</div>
                        </td>
                        <td>
                          <div className="small fw-semibold">{leadObj.companyName || leadObj.company || "SaaS Co."}</div>
                          <div className="text-muted" style={{ fontSize: "11px" }}>{leadObj.jobTitle || leadObj.title || "Executive"}</div>
                        </td>
                        <td>
                          <span className="badge bg-light text-dark border font-monospace">{leadObj.phone || "+91 98765 43210"}</span>
                        </td>
                        <td>
                          <span className={`badge ${l.status === "COMPLETED" ? "bg-success" : l.status === "CONTACTED" ? "bg-info" : "bg-warning text-dark"}`}>
                            {l.status || "PENDING"}
                          </span>
                        </td>
                        <td className="small text-muted">
                          {l.lastAttemptAt ? new Date(l.lastAttemptAt).toLocaleTimeString() : "Not attempted"}
                        </td>
                        <td className="text-end">
                          <button
                            className="btn btn-sm btn-success d-inline-flex align-items-center gap-1 shadow-sm px-3"
                            onClick={() => handleInitiateVoiceCall(leadObj)}
                            disabled={callLeadMutation.isPending}
                          >
                            <PhoneCall size={13} />
                            <span>Call Now</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-5 px-3">
              <div className="rounded-circle bg-primary bg-opacity-10 p-3 d-inline-flex align-items-center justify-content-center text-primary mb-3">
                <Users size={32} />
              </div>
              <h6 className="fw-bold text-dark mb-1">No Leads Enrolled in "{campaign.name}" Yet</h6>
              <p className="text-muted small mb-3 mx-auto" style={{ maxWidth: "480px" }}>
                Upload a CSV spreadsheet with your prospect names, phone numbers, and company info, or select existing contacts from your database to begin AI voice outreach.
              </p>
              <div className="d-flex justify-content-center gap-2">
                <button
                  className="btn btn-primary btn-sm d-flex align-items-center gap-1 shadow-sm"
                  onClick={() => setShowUploadLeadsModal(true)}
                >
                  <UploadCloud size={14} />
                  <span>Upload Leads (CSV / Excel)</span>
                </button>
                <button
                  className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
                  onClick={() => setShowAddLeadsModal(true)}
                >
                  <UserPlus size={14} />
                  <span>Select from Database</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // 3. SURVEY TAB
  const renderSurveyTab = () => {
    return (
      <div className="card shadow-sm border p-4">
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
          <div>
            <h5 className="fw-bold mb-1 fs-6">Survey Questions & Voice Prompts</h5>
            <p className="text-secondary small mb-0">Overview of configured questions asked by AI agent over the phone or chat.</p>
          </div>
          <div className="d-flex align-items-center gap-2">
            <Link
              to={`/ai-agents/live-execution?campaignId=${campaign?._id}${survey?._id ? `&surveyId=${survey._id}` : ""}`}
              className="btn btn-success btn-sm d-flex align-items-center gap-1 shadow-sm px-3 fw-bold"
            >
              <PhoneCall size={15} />
              <span>Run AI Voice Call Now</span>
            </Link>
            <Link to={`/campaigns/${campaign?._id}/survey`} className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1">
              <Workflow size={15} />
              <span>Visual Builder</span>
            </Link>
          </div>
        </div>

        {survey?.questions && survey.questions.length > 0 ? (
          <div className="d-flex flex-column gap-2">
            {survey.questions.map((q, idx) => (
              <div key={q.questionId} className="card border p-3 bg-light-subtle">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-primary text-white">Q{idx + 1}</span>
                    <span className="badge bg-secondary-subtle text-secondary">{q.type.replace("_", " ")}</span>
                    {q.required && <span className="badge bg-danger-subtle text-danger">Required</span>}
                  </div>
                </div>
                <div className="fw-semibold text-dark mb-1">{q.text}</div>
                {q.aiPrompt && (
                  <div className="text-muted small fst-italic">📞 Voice Prompt: "{q.aiPrompt}"</div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-5">
            <div className="rounded-circle bg-primary bg-opacity-10 p-3 d-inline-flex mx-auto text-primary mb-3">
              <FileText size={32} />
            </div>
            <h6 className="fw-bold mb-1">No Survey Questions Attached Yet</h6>
            <p className="text-secondary small mb-3">
              Upload a questionnaire document or build questions to start AI voice calling.
            </p>
            <div className="d-flex justify-content-center gap-2">
              <Link to={`/campaigns/${campaign?._id}/survey`} className="btn btn-primary btn-sm d-flex align-items-center gap-1">
                <UploadCloud size={14} />
                <span>Upload / Build Survey</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    );
  };

  // 4. FLOW TAB
  const renderFlowTab = () => {
    return (
      <div className="card shadow-sm border p-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-bold mb-0 fs-6">Survey Flow Preview</h5>
          <Link to={`/campaigns/${campaign?._id}/survey/flow`} className="btn btn-outline-primary btn-sm">
            Open Interactive Canvas
          </Link>
        </div>
        <p className="text-secondary small mb-0">Visual flow representation of branches and skip logic.</p>
      </div>
    );
  };

  // 5. RESPONSES TAB
  const renderResponsesTab = () => {
    return (
      <div className="card shadow-sm border p-4">
        <h5 className="fw-bold mb-3 fs-6">Recorded Survey Responses</h5>
        <p className="text-secondary small">Responses captured via AI Voice agent and chat channels.</p>
      </div>
    );
  };

  // 6. CONVERSATIONS TAB
  const renderConversationsTab = () => {
    return (
      <div className="card shadow-sm border p-4">
        <h5 className="fw-bold mb-3 fs-6">AI Call & Chat Transcripts</h5>
        <p className="text-secondary small">Full multi-turn audio transcripts with sentiment and objections.</p>
      </div>
    );
  };

  // 7. ANALYTICS TAB
  const renderAnalyticsTab = () => {
    return (
      <div className="card shadow-sm border p-4">
        <h5 className="fw-bold mb-3 fs-6">Outreach & Conversion Analytics</h5>
        <div className="row g-3">
          <div className="col-md-4">
            <div className="p-3 border rounded-3 bg-light">
              <div className="small text-muted">Conversion Rate</div>
              <div className="h3 fw-bold text-success mb-0">{(analytics as any)?.conversionRate || campaign.stats?.conversionRate || 0}%</div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="p-3 border rounded-3 bg-light">
              <div className="small text-muted">Response Rate</div>
              <div className="h3 fw-bold text-primary mb-0">{(analytics as any)?.responseRate || campaign.stats?.responseRate || 0}%</div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="p-3 border rounded-3 bg-light">
              <div className="small text-muted">Completion Rate</div>
              <div className="h3 fw-bold text-purple mb-0">{analytics?.completionRate || campaign.stats?.completionRate || 0}%</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 8. SETTINGS TAB
  const renderSettingsTab = () => {
    return (
      <div className="card shadow-sm border p-4">
        <h5 className="fw-bold mb-3 fs-6">Campaign Configuration</h5>
        <p className="text-secondary small">Manage language, voice model, and retry schedules.</p>
      </div>
    );
  };

  return (
    <div className="d-flex flex-column gap-3">
      {/* Top Header Card */}
      <div className="card shadow-sm border">
        <div className="card-body p-4">
          <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
            <div>
              <div className="d-flex align-items-center gap-2 mb-2">
                <Link to="/campaigns" className="btn btn-outline-secondary btn-sm p-1" title="Back to Campaigns">
                  <ArrowLeft size={16} />
                </Link>
                <StatusBadge status={campaign.status} />
                <CampaignTypeBadge type={campaign.type} />
                <span className="badge bg-primary-subtle text-primary border small d-flex align-items-center gap-1">
                  <PhoneCall size={12} />
                  {campaign.action || "CALL"}
                </span>
                <span className="badge bg-light text-secondary border small">
                  {campaign.language || "en-IN"}
                </span>
              </div>

              <h1 className="h4 fw-bold mb-1 text-dark">{campaign.name}</h1>
              <p className="text-secondary small mb-3" style={{ maxWidth: "720px" }}>
                {campaign.description || "No description provided."}
              </p>

              {/* Sub-meta chips */}
              <div className="d-flex flex-wrap gap-3 small text-muted">
                <div className="d-flex align-items-center gap-1">
                  <Building size={14} className="text-secondary" />
                  <span>Business: <strong>{campaign.businessName || "AI Sales Enterprise"}</strong></span>
                </div>
                <div className="d-flex align-items-center gap-1">
                  <Package size={14} className="text-secondary" />
                  <span>Product: <strong>{campaign.product || "SalesFlow AI Platform"}</strong></span>
                </div>
                <div className="d-flex align-items-center gap-1">
                  <Calendar size={14} className="text-secondary" />
                  <span>
                    Timeline: {campaign.startDate ? new Date(campaign.startDate).toLocaleDateString() : "Immediate"}
                    {campaign.endDate ? ` → ${new Date(campaign.endDate).toLocaleDateString()}` : " (Ongoing)"}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="d-flex align-items-center gap-2 flex-wrap">
              {/* AI Edit Button */}
              <button
                className="btn btn-outline-purple btn-sm d-flex align-items-center gap-1"
                onClick={() => setShowAiEditModal(true)}
              >
                <Sparkles size={14} />
                <span>AI Edit</span>
              </button>

              {/* Add Leads Button */}
              <button
                className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
                onClick={() => setShowAddLeadsModal(true)}
              >
                <UserPlus size={14} />
                <span>Add Leads</span>
              </button>

              <Link
                to={`/ai-agents/live-execution?campaignId=${campaign._id}${campaign.surveyId ? `&surveyId=${campaign.surveyId}` : ""}`}
                className="btn btn-success btn-sm d-flex align-items-center gap-1 shadow-sm px-3 fw-bold"
              >
                <PhoneCall size={15} />
                <span>Run AI Voice Call</span>
              </Link>

              <Link to={`/campaigns/${campaign._id}/survey`} className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1 shadow-sm">
                <Workflow size={15} />
                <span>Survey Builder</span>
              </Link>

              {campaign.status === CampaignStatus.ACTIVE ? (
                <button
                  className="btn btn-outline-warning btn-sm d-flex align-items-center gap-1"
                  onClick={() => setConfirmAction("pause")}
                >
                  <Pause size={14} />
                  <span>Pause</span>
                </button>
              ) : (
                <button
                  className="btn btn-success btn-sm d-flex align-items-center gap-1"
                  onClick={() => setConfirmAction("publish")}
                >
                  <Play size={14} />
                  <span>Launch Outreach</span>
                </button>
              )}

              <button
                className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
                onClick={() => setConfirmAction("archive")}
              >
                <Archive size={14} />
                <span>Archive</span>
              </button>

              <button
                className="btn btn-outline-danger btn-sm p-1"
                title="Delete Campaign"
                onClick={() => setConfirmAction("delete")}
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* 3-Step Workflow Pipeline */}
        <div className="card-body bg-light border-top p-3">
          <div className="row g-2 align-items-center">
            <div className="col-12 col-md-4">
              <div
                className={`p-2 rounded-3 border d-flex align-items-center gap-2 cursor-pointer ${
                  activeTab === "overview" ? "bg-primary text-white border-primary" : "bg-white text-dark"
                }`}
                style={{ cursor: "pointer" }}
                onClick={() => setTab("overview")}
              >
                <span className={`badge ${activeTab === "overview" ? "bg-white text-primary" : "bg-primary text-white"} rounded-pill`}>
                  Step 1
                </span>
                <div className="overflow-hidden">
                  <div className="fw-bold small text-truncate">Campaign Strategy</div>
                  <div className={`small text-truncate ${activeTab === "overview" ? "text-white-50" : "text-secondary"}`} style={{ fontSize: "11px" }}>
                    Persona & Opening Hook
                  </div>
                </div>
              </div>
            </div>

            <div className="col-12 col-md-4">
              <div
                className={`p-2 rounded-3 border d-flex align-items-center gap-2 cursor-pointer ${
                  activeTab === "survey" ? "bg-primary text-white border-primary" : "bg-white text-dark"
                }`}
                style={{ cursor: "pointer" }}
                onClick={() => setTab("survey")}
              >
                <span className={`badge ${activeTab === "survey" ? "bg-white text-primary" : "bg-primary text-white"} rounded-pill`}>
                  Step 2
                </span>
                <div className="overflow-hidden">
                  <div className="fw-bold small text-truncate">Survey & Questionnaire</div>
                  <div className={`small text-truncate ${activeTab === "survey" ? "text-white-50" : "text-secondary"}`} style={{ fontSize: "11px" }}>
                    {questionCount} Questions (Form / Upload / AI)
                  </div>
                </div>
              </div>
            </div>

            <div className="col-12 col-md-4">
              <div
                className={`p-2 rounded-3 border d-flex align-items-center gap-2 cursor-pointer ${
                  activeTab === "leads" ? "bg-success text-white border-success" : "bg-white text-dark"
                }`}
                style={{ cursor: "pointer" }}
                onClick={() => setTab("leads")}
              >
                <span className={`badge ${activeTab === "leads" ? "bg-white text-success" : "bg-success text-white"} rounded-pill`}>
                  Step 3
                </span>
                <div className="overflow-hidden">
                  <div className="fw-bold small text-truncate">AI Voice Calling</div>
                  <div className={`small text-truncate ${activeTab === "leads" ? "text-white-50" : "text-secondary"}`} style={{ fontSize: "11px" }}>
                    Knowledge Base Grounded Q&A
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="card-footer bg-white border-top px-3 py-0">
          <ul className="nav nav-tabs border-0 gap-1" style={{ fontSize: "13.5px" }}>
            {[
              { id: "overview", label: "1. Strategy & Hook", icon: Layers },
              { id: "survey", label: "2. Survey Questionnaire", icon: FileQuestion, badge: questionCount ? `${questionCount} Qs` : undefined },
              { id: "leads", label: "3. Leads & AI Calling", icon: PhoneCall, badge: `${campaignLeads.length} Leads` },
              { id: "analytics", label: "4. Call Logs & Analytics", icon: BarChart3 },
            ].map((t) => {
              const Icon = t.icon;
              const isActive = activeTab === t.id;
              return (
                <li key={t.id} className="nav-item">
                  <button
                    className={`nav-link border-0 py-3 px-3 d-flex align-items-center gap-2 ${
                      isActive ? "active border-bottom border-primary border-3 fw-bold text-primary" : "text-secondary"
                    }`}
                    onClick={() => setTab(t.id)}
                  >
                    <Icon size={16} />
                    <span>{t.label}</span>
                    {t.badge && (
                      <span className="badge bg-secondary-subtle text-secondary rounded-pill small ms-1" style={{ fontSize: "11px" }}>
                        {t.badge}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* TAB CONTENT */}
      {activeTab === "overview" && renderOverviewTab()}
      {activeTab === "survey" && renderSurveyTab()}
      {activeTab === "leads" && renderLeadsTab()}
      {activeTab === "analytics" && renderAnalyticsTab()}

      {/* AI EDIT CAMPAIGN MODAL */}
      {showAiEditModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.6)" }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header border-0 pb-0 pt-4 px-4">
                <div className="d-flex align-items-center gap-2 text-primary">
                  <Wand2 size={22} />
                  <h5 className="modal-title fw-bold">Edit Campaign with AI</h5>
                </div>
                <button type="button" className="btn-close" onClick={() => setShowAiEditModal(false)} />
              </div>

              <form onSubmit={handleAiEditSubmit}>
                <div className="modal-body p-4">
                  <p className="text-secondary small mb-3">
                    Tell the AI how you want to modify this campaign (e.g. rewrite phone pitch, refine target audience, adjust tone).
                  </p>

                  <div className="mb-3">
                    <label className="form-label fw-bold small">Modification Instructions <span className="text-danger">*</span></label>
                    <textarea
                      className="form-control"
                      rows={4}
                      placeholder="e.g. Focus opening pitch on accelerating revenue cycle for Fintech founders and make tone more consultative"
                      value={aiEditPrompt}
                      onChange={(e) => setAiEditPrompt(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="modal-footer border-0 pt-0 px-4 pb-4">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowAiEditModal(false)}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary d-flex align-items-center gap-2"
                    disabled={editAiMutation.isPending || !aiEditPrompt.trim()}
                  >
                    {editAiMutation.isPending ? (
                      <>
                        <Loader2 size={16} className="spinner-border spinner-border-sm" />
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        <span>Apply AI Edits</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ADD LEADS MODAL */}
      {showAddLeadsModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.6)" }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header border-0 pb-0 pt-4 px-4">
                <div className="d-flex align-items-center gap-2 text-primary">
                  <UserPlus size={22} />
                  <h5 className="modal-title fw-bold">Add Leads to Campaign</h5>
                </div>
                <button type="button" className="btn-close" onClick={() => setShowAddLeadsModal(false)} />
              </div>

              <div className="modal-body p-4">
                <p className="text-secondary small mb-3">
                  Select leads from your database to include in this AI calling and qualification campaign.
                </p>

                <div className="table-responsive" style={{ maxHeight: "320px" }}>
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light small">
                      <tr>
                        <th style={{ width: "40px" }}>
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={selectedLeadIds.length === allLeads.length && allLeads.length > 0}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedLeadIds(allLeads.map((l) => l._id));
                              } else {
                                setSelectedLeadIds([]);
                              }
                            }}
                          />
                        </th>
                        <th>Name</th>
                        <th>Company</th>
                        <th>Phone</th>
                        <th>Industry</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allLeads.map((lead) => {
                        const isChecked = selectedLeadIds.includes(lead._id);
                        return (
                          <tr
                            key={lead._id}
                            style={{ cursor: "pointer" }}
                            onClick={() => {
                              if (isChecked) {
                                setSelectedLeadIds(selectedLeadIds.filter((id) => id !== lead._id));
                              } else {
                                setSelectedLeadIds([...selectedLeadIds, lead._id]);
                              }
                            }}
                          >
                            <td>
                              <input
                                type="checkbox"
                                className="form-check-input"
                                checked={isChecked}
                                onChange={() => {}}
                              />
                            </td>
                            <td className="fw-semibold text-dark">{lead.firstName} {lead.lastName || ""}</td>
                            <td>{lead.companyName || "N/A"}</td>
                            <td><span className="badge bg-light text-dark border">{lead.phone || "+91 98765 43210"}</span></td>
                            <td><span className="badge bg-secondary-subtle text-secondary">{lead.industry || "B2B"}</span></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="modal-footer border-0 pt-0 px-4 pb-4">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setShowAddLeadsModal(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary d-flex align-items-center gap-2"
                  onClick={handleAddLeadsSubmit}
                  disabled={selectedLeadIds.length === 0 || addLeadsMutation.isPending}
                >
                  {addLeadsMutation.isPending ? (
                    <span>Adding...</span>
                  ) : (
                    <span>Add {selectedLeadIds.length} Selected Leads</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* UPLOAD LEADS (CSV / FILE) MODAL */}
      {showUploadLeadsModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.65)" }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header bg-light border-bottom px-4 py-3">
                <div className="d-flex align-items-center gap-2 text-primary">
                  <div className="p-2 rounded-circle bg-primary bg-opacity-10">
                    <UploadCloud size={20} />
                  </div>
                  <div>
                    <h5 className="modal-title fw-bold mb-0">Upload Leads for Campaign</h5>
                    <div className="text-muted small">Target Campaign: <strong className="text-dark">{campaign.name}</strong></div>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowUploadLeadsModal(false);
                    setUploadSuccess(null);
                  }}
                />
              </div>

              <form onSubmit={handleUploadLeadsSubmit}>
                <div className="modal-body p-4">
                  {uploadSuccess && (
                    <div className="alert alert-success d-flex align-items-center gap-2 mb-3 shadow-sm py-2">
                      <CheckCircle2 size={18} className="text-success" />
                      <span>{uploadSuccess}</span>
                    </div>
                  )}

                  {/* Mode Tabs */}
                  <div className="d-flex gap-2 p-1 bg-light rounded-3 mb-3 border">
                    <button
                      type="button"
                      className={`btn btn-sm flex-grow-1 ${uploadTab === "file" ? "btn-primary shadow-sm fw-semibold" : "btn-light text-secondary border-0"}`}
                      onClick={() => setUploadTab("file")}
                    >
                      <UploadCloud size={14} className="me-1" />
                      Upload CSV / Excel File
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm flex-grow-1 ${uploadTab === "text" ? "btn-primary shadow-sm fw-semibold" : "btn-light text-secondary border-0"}`}
                      onClick={() => setUploadTab("text")}
                    >
                      <FileText size={14} className="me-1" />
                      Paste Contacts Text
                    </button>
                  </div>

                  {uploadTab === "file" ? (
                    <div>
                      {/* Drag and Drop Zone */}
                      <div
                        className={`p-4 border-2 rounded-4 text-center cursor-pointer transition-all ${
                          isDragging ? "border-primary bg-primary bg-opacity-10" : "border-secondary-subtle bg-light"
                        }`}
                        style={{ borderStyle: "dashed", cursor: "pointer" }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDragging(true);
                        }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDragging(false);
                          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                            setSelectedFile(e.dataTransfer.files[0]);
                          }
                        }}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".csv,.txt,.xlsx,.xls"
                          className="d-none"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setSelectedFile(e.target.files[0]);
                            }
                          }}
                        />
                        <div className="rounded-circle bg-white p-3 d-inline-flex align-items-center justify-content-center shadow-sm mb-2 text-primary">
                          <UploadCloud size={28} />
                        </div>
                        <h6 className="fw-bold text-dark mb-1">
                          {selectedFile ? selectedFile.name : "Drag & drop your leads CSV file here"}
                        </h6>
                        <p className="text-secondary small mb-2">
                          {selectedFile
                            ? `${(selectedFile.size / 1024).toFixed(1)} KB • Click or drop again to replace`
                            : "Supports .CSV, .TXT, or .XLS with name, phone, and company headers"}
                        </p>
                        <button
                          type="button"
                          className="btn btn-outline-primary btn-sm px-3 shadow-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            fileInputRef.current?.click();
                          }}
                        >
                          Browse Computer
                        </button>
                      </div>

                      <div className="d-flex justify-content-between align-items-center mt-3 p-2 bg-light rounded-3 border">
                        <span className="small text-muted">Need the standard spreadsheet format?</span>
                        <button
                          type="button"
                          className="btn btn-sm btn-link text-primary text-decoration-none d-flex align-items-center gap-1 p-0 fw-semibold"
                          onClick={handleDownloadSampleCsv}
                        >
                          <Download size={13} />
                          <span>Download Sample CSV Template</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="form-label small fw-semibold text-secondary mb-1">
                        Paste Contacts (One row per lead, comma-separated):
                      </label>
                      <textarea
                        className="form-control font-monospace small"
                        rows={6}
                        placeholder="Vikram Malhotra, +91 98111 22334, vikram@techcorp.in, TechCorp, CTO&#10;Neha Sharma, +91 98222 33445, neha@cloudscale.io, CloudScale, VP Eng&#10;Amit Patel, +91 98333 44556, amit@global.com, Global Corp, COO"
                        value={pastedText}
                        onChange={(e) => setPastedText(e.target.value)}
                      />
                      <div className="small text-muted mt-1">
                        Format: <code>Full Name, Phone Number, Email, Company Name, Job Title</code>
                      </div>
                    </div>
                  )}

                  <div className="mt-3 p-3 bg-light-subtle rounded-3 border">
                    <div className="fw-bold small text-dark mb-1">🎯 Automated Campaign Enrollment</div>
                    <p className="text-secondary small mb-0">
                      Uploaded leads are immediately linked to <strong>{campaign.name}</strong>, making them ready for instant AI Voice calling with your customized pitch and survey questions.
                    </p>
                  </div>
                </div>

                <div className="modal-footer bg-light border-top px-4 py-3 justify-content-between">
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm px-3"
                    onClick={() => {
                      setShowUploadLeadsModal(false);
                      setUploadSuccess(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm px-4 d-flex align-items-center gap-1 shadow-sm"
                    disabled={importLeadsMutation.isPending || (uploadTab === "file" && !selectedFile) || (uploadTab === "text" && !pastedText.trim())}
                  >
                    {importLeadsMutation.isPending ? (
                      <>
                        <Loader2 size={14} className="spinner-border spinner-border-sm" />
                        <span>Uploading & Enrolling...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud size={14} />
                        <span>Upload & Enroll Leads</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* LIVE AI VOICE CALL MODAL */}
      {activeCallLead && callSession && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.75)" }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-4 text-white" style={{ background: "linear-gradient(145deg, #1e1b4b 0%, #0f172a 100%)" }}>
              <div className="modal-header border-bottom border-secondary border-opacity-25 pb-3 pt-3 px-4">
                <div className="d-flex align-items-center gap-2 text-warning">
                  <Radio size={20} className="spinner-grow spinner-grow-sm" />
                  <div>
                    <h6 className="modal-title fw-bold text-uppercase mb-0" style={{ letterSpacing: "1px" }}>AI Voice Call in Progress</h6>
                    <div className="text-white-50" style={{ fontSize: "11px" }}>
                      Calling {activeCallLead.firstName ? `${activeCallLead.firstName} ${activeCallLead.lastName || ""}` : activeCallLead.name || "Prospect"} • Grounded in Knowledge Base
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => {
                    stopAudio();
                    setActiveCallLead(null);
                    setCallSession(null);
                  }}
                />
              </div>

              <div className="modal-body p-4 d-flex flex-column gap-3" style={{ maxHeight: "65vh", overflowY: "auto" }}>
                {/* Lead Header Chip */}
                <div className="p-2 bg-dark bg-opacity-50 border border-secondary border-opacity-25 rounded-3 d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center gap-2">
                    <div className="rounded-circle bg-primary bg-opacity-25 p-2 text-info">
                      <PhoneCall size={16} />
                    </div>
                    <div>
                      <div className="fw-bold small text-light">{activeCallLead.firstName ? `${activeCallLead.firstName} ${activeCallLead.lastName || ""}` : activeCallLead.name || "Lead"}</div>
                      <div className="text-white-50" style={{ fontSize: "11px" }}>{activeCallLead.companyName || "Enterprise"} • {activeCallLead.phone || "+91 98765 43210"}</div>
                    </div>
                  </div>

                  {/* Audio Controls */}
                  <div className="d-flex align-items-center gap-2">
                    {isPlayingAudio ? (
                      <button className="btn btn-warning btn-sm d-flex align-items-center gap-1 py-1" onClick={stopAudio}>
                        <VolumeX size={14} />
                        <span style={{ fontSize: "12px" }}>Mute Audio</span>
                      </button>
                    ) : (
                      callSession.audioBase64 && (
                        <button
                          className="btn btn-info btn-sm d-flex align-items-center gap-1 py-1"
                          onClick={() => playAudio(callSession.audioBase64!)}
                        >
                          <Volume2 size={14} />
                          <span style={{ fontSize: "12px" }}>Replay Voice</span>
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Conversation History */}
                <div className="d-flex flex-column gap-3 p-3 bg-dark bg-opacity-75 rounded-3 border border-secondary border-opacity-25" style={{ minHeight: "220px" }}>
                  {callMessages.length === 0 && (
                    <div className="text-center text-white-50 small my-auto">Connecting voice channel...</div>
                  )}

                  {callMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`d-flex flex-column ${
                        msg.sender === "ai" ? "align-items-start" : "align-items-end"
                      }`}
                    >
                      <div className="d-flex align-items-center gap-1 mb-1" style={{ fontSize: "11px" }}>
                        <span className={msg.sender === "ai" ? "text-info fw-bold" : "text-success fw-bold"}>
                          {msg.sender === "ai" ? "🤖 AI Voice Agent" : "👤 Lead (Prospect)"}
                        </span>
                        <span className="text-white-50">• {msg.timestamp}</span>
                      </div>

                      <div
                        className={`p-3 rounded-3 small ${
                          msg.sender === "ai"
                            ? "bg-secondary bg-opacity-25 text-light border border-info border-opacity-25"
                            : "bg-primary text-white"
                        }`}
                        style={{ maxWidth: "88%", lineHeight: "1.5" }}
                      >
                        "{msg.text}"
                      </div>

                      {/* Knowledge Base Sources Citation badge */}
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-1 small badge bg-purple-subtle text-purple border border-purple-subtle d-inline-flex align-items-center gap-1">
                          <span>📚 Knowledge Base:</span>
                          <span>{msg.sources[0]?.documentName || "Company & Product Docs"}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Quick Simulation Chips */}
                <div>
                  <div className="text-white-50 small mb-1" style={{ fontSize: "11px" }}>
                    Quick Responses (Test off-survey Knowledge Base Q&A or survey answers):
                  </div>
                  <div className="d-flex flex-wrap gap-1">
                    {[
                      "What is your pricing and subscription tier?",
                      "Do you integrate with Salesforce and HubSpot?",
                      "We have 15 SDRs and spend $3,000/month",
                      "How do you prevent voice AI hallucinations?",
                      "Yes, schedule a 15-minute demo with our VP of Sales",
                    ].map((chipText, i) => (
                      <button
                        key={i}
                        type="button"
                        className="btn btn-sm btn-outline-light text-start py-0 px-2"
                        style={{ fontSize: "11px", borderRadius: "12px", opacity: 0.85 }}
                        onClick={() => handleSendLeadReply(chipText)}
                        disabled={callLeadMutation.isPending}
                      >
                        💬 {chipText}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Lead Reply Input Area */}
                <div className="d-flex gap-2">
                  <input
                    type="text"
                    className="form-control form-control-sm bg-dark text-white border-secondary border-opacity-50"
                    placeholder="Type what the lead says or ask any product question..."
                    value={leadReplyInput}
                    onChange={(e) => setLeadReplyInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSendLeadReply();
                      }
                    }}
                    disabled={callLeadMutation.isPending}
                  />
                  <button
                    type="button"
                    className="btn btn-primary btn-sm px-3 d-flex align-items-center gap-1"
                    onClick={() => handleSendLeadReply()}
                    disabled={!leadReplyInput.trim() || callLeadMutation.isPending}
                  >
                    {callLeadMutation.isPending ? (
                      <span className="spinner-border spinner-border-sm" role="status"></span>
                    ) : (
                      <>
                        <Send size={14} />
                        <span>Speak</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="modal-footer border-top border-secondary border-opacity-25 pt-2 px-4 pb-3 justify-content-between">
                <div className="text-white-50 small" style={{ fontSize: "11px" }}>
                  💡 Off-survey questions are answered dynamically using the <strong>Knowledge Base</strong> before proceeding with the survey.
                </div>
                <button
                  type="button"
                  className="btn btn-danger btn-sm d-flex align-items-center gap-1 px-3 shadow"
                  onClick={() => {
                    stopAudio();
                    setActiveCallLead(null);
                    setCallSession(null);
                  }}
                >
                  <PhoneOff size={14} />
                  <span>End Call</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Action Modal */}
      {confirmAction && (
        <ConfirmModal
          isOpen={Boolean(confirmAction)}
          title={`Confirm ${confirmAction.toUpperCase()}`}
          message={`Are you sure you want to ${confirmAction} campaign "${campaign.name}"?`}
          onConfirm={handleConfirmAction}
          onCancel={() => setConfirmAction(null)}
          confirmText="Confirm"
        />
      )}
    </div>
  );
};

export default CampaignDetailsPage;
