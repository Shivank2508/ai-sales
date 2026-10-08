import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useCampaign, usePublishCampaign } from "../../campaigns/hooks/useCampaigns";
<<<<<<< HEAD
import {
  useSurveyByCampaign,
  useSaveQuestions,
  useUpdateSurvey,
  useCreateSurvey,
  useGenerateAISurvey,
  useEditAISurvey,
  useImportQuestions,
  useSynthesizeVoice,
  useUploadSurvey,
} from "../hooks/useSurveys";
=======
import { useSurveyByCampaign, useSaveQuestions, useUpdateSurvey, useCreateSurvey } from "../hooks/useSurveys";
>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
import { surveyApi } from "../api/surveyApi";
import { QuestionListPanel } from "../components/QuestionListPanel";
import { QuestionEditor } from "../components/QuestionEditor";
import { QuestionSettingsPanel } from "../components/QuestionSettingsPanel";
import { ConditionBuilder } from "../components/ConditionBuilder";
import { LoadingSpinner } from "../../../components/common/LoadingSpinner";
import { ErrorState } from "../../../components/common/ErrorState";
import { ConfirmModal } from "../../../components/common/ConfirmModal";
import {
  ISurveyQuestion,
  ISurveyValidationResult,
  QuestionAction,
  QuestionType,
  SurveyStatus,
} from "../../../types";
import {
  ArrowLeft,
  Workflow,
  Play,
  ShieldCheck,
  Send,
  Save,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  GitBranch,
  Network,
  Sparkles,
  Sliders,
  PanelLeftClose,
  PanelRightClose,
<<<<<<< HEAD
  Wand2,
  PhoneCall,
  Volume2,
  VolumeX,
  Loader2,
  Radio,
  PhoneOff,
  UploadCloud,
  FileUp,
  FileCode,
=======
>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
} from "lucide-react";

export const SurveyBuilderPage: React.FC = () => {
  const { campaignId = "" } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();

  // Queries
  const { data: campaign, isLoading: campaignLoading } = useCampaign(campaignId);
  const { data: survey, isLoading: surveyLoading, refetch } = useSurveyByCampaign(campaignId);

  // Mutations
  const createSurveyMutation = useCreateSurvey();
  const updateSurveyMutation = useUpdateSurvey();
  const saveQuestionsMutation = useSaveQuestions();
  const publishCampaignMutation = usePublishCampaign();
<<<<<<< HEAD
  const aiGenerateSurveyMutation = useGenerateAISurvey();
  const aiEditSurveyMutation = useEditAISurvey();
  const importQuestionsMutation = useImportQuestions();
  const ttsMutation = useSynthesizeVoice();
  const uploadSurveyMutation = useUploadSurvey();
=======
>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a

  // Local Questions State
  const [questions, setQuestions] = useState<ISurveyQuestion[]>([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");

  // Condition Builder Modal State
  const [conditionModalQuestion, setConditionModalQuestion] = useState<ISurveyQuestion | null>(null);

  // Pre-flight Validation State
  const [validationResult, setValidationResult] = useState<ISurveyValidationResult | null>(null);
  const [isValidationOpen, setIsValidationOpen] = useState(false);
  const [publishModalOpen, setPublishModalOpen] = useState(false);

<<<<<<< HEAD
  // AI Modal States
  const [showAiGenModal, setShowAiGenModal] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiQuestionCount, setAiQuestionCount] = useState(4);
  const [aiChannel, setAiChannel] = useState("VOICE");

  const [showAiEditModal, setShowAiEditModal] = useState(false);
  const [aiEditInstructions, setAiEditInstructions] = useState("");

  // Import / Upload Modal State
  const [showImportModal, setShowImportModal] = useState(false);
  const [importTab, setImportTab] = useState<"file" | "text">("file");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importText, setImportText] = useState("");
  const [importAppend, setImportAppend] = useState(true);

  // Voice Test Simulator State
  const [showVoiceTestModal, setShowVoiceTestModal] = useState(false);
  const [activeVoiceQIndex, setActiveVoiceQIndex] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
=======
  // Mobile / Responsive panel visibility
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a

  // Synchronize local questions with survey query
  useEffect(() => {
    if (survey?.questions) {
      setQuestions(survey.questions);
      if (survey.questions.length > 0 && !selectedQuestionId) {
        setSelectedQuestionId(survey.questions[0].questionId);
      }
    }
  }, [survey]);

  const activeQuestion = questions.find((q) => q.questionId === selectedQuestionId) || questions[0];

  // Save changes handler
  const handleSave = async (updatedQuestions?: ISurveyQuestion[]) => {
    const toSave = updatedQuestions || questions;
    if (!survey) {
      // Auto-create survey if not exists
      const created = await createSurveyMutation.mutateAsync({
        campaignId,
        payload: {
          name: `${campaign?.name || "Campaign"} Survey`,
          questions: toSave,
        },
      });
      setHasUnsavedChanges(false);
      setSaveStatus("saved");
      return;
    }

    setSaveStatus("saving");
    try {
      await saveQuestionsMutation.mutateAsync({
        surveyId: survey._id,
        questions: toSave,
      });
      setHasUnsavedChanges(false);
      setSaveStatus("saved");
    } catch {
      setSaveStatus("unsaved");
    }
  };

<<<<<<< HEAD
  const handleAddQuestion = (type: QuestionType) => {
    const newId = `q_${Date.now()}`;
    const newQ: ISurveyQuestion = {
      questionId: newId,
      order: questions.length + 1,
      type,
      text: `New ${type.replace("_", " ")} question`,
      required: true,
      options:
        type === QuestionType.SINGLE_CHOICE || type === QuestionType.MULTIPLE_CHOICE
          ? [
              { value: "opt_1", label: "Option 1" },
              { value: "opt_2", label: "Option 2" },
            ]
          : type === QuestionType.YES_NO
          ? [
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]
          : undefined,
    };
    const nextList = [...questions, newQ];
    setQuestions(nextList);
    setSelectedQuestionId(newId);
    setHasUnsavedChanges(true);
    setSaveStatus("unsaved");
    handleSave(nextList);
  };

  const handleDuplicateQuestion = (id: string) => {
    const idx = questions.findIndex((q) => q.questionId === id);
    if (idx === -1) return;
    const orig = questions[idx];
    const newId = `q_${Date.now()}`;
    const duplicated: ISurveyQuestion = {
      ...orig,
      questionId: newId,
      order: orig.order + 1,
      text: `${orig.text} (Copy)`,
    };
    const nextList = [...questions.slice(0, idx + 1), duplicated, ...questions.slice(idx + 1)].map(
      (q, i) => ({ ...q, order: i + 1 })
    );
    setQuestions(nextList);
    setSelectedQuestionId(newId);
    setHasUnsavedChanges(true);
    setSaveStatus("unsaved");
    handleSave(nextList);
  };

  const handleDeleteQuestion = (id: string) => {
    const nextList = questions.filter((q) => q.questionId !== id).map((q, i) => ({ ...q, order: i + 1 }));
    setQuestions(nextList);
    if (selectedQuestionId === id) {
      setSelectedQuestionId(nextList[0]?.questionId || null);
    }
    setHasUnsavedChanges(true);
    setSaveStatus("unsaved");
    handleSave(nextList);
  };

  const handleMoveQuestion = (id: string, direction: "up" | "down") => {
    const idx = questions.findIndex((q) => q.questionId === id);
    if (idx === -1) return;
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === questions.length - 1) return;
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    const nextList = [...questions];
    const [moved] = nextList.splice(idx, 1);
    nextList.splice(targetIdx, 0, moved);
    const reordered = nextList.map((q, i) => ({ ...q, order: i + 1 }));
    setQuestions(reordered);
    setHasUnsavedChanges(true);
    setSaveStatus("unsaved");
    handleSave(reordered);
  };

  const handleMoveQuestionByIndex = (fromIdx: number, toIdx: number) => {
    if (fromIdx < 0 || fromIdx >= questions.length || toIdx < 0 || toIdx >= questions.length) return;
    const nextList = [...questions];
    const [moved] = nextList.splice(fromIdx, 1);
    nextList.splice(toIdx, 0, moved);
    const reordered = nextList.map((q, i) => ({ ...q, order: i + 1 }));
    setQuestions(reordered);
    setHasUnsavedChanges(true);
    setSaveStatus("unsaved");
    handleSave(reordered);
  };

  const handleUpdateActiveQuestion = (updates: Partial<ISurveyQuestion>) => {
    if (!selectedQuestionId) return;
    const nextList = questions.map((q) => (q.questionId === selectedQuestionId ? { ...q, ...updates } : q));
    setQuestions(nextList);
=======
  // Add Question
  const handleAddQuestion = () => {
    const nextIdx = questions.length + 1;
    const newQ: ISurveyQuestion = {
      surveyId: survey?._id,
      questionId: `q${nextIdx}_${Date.now().toString().slice(-4)}`,
      order: nextIdx,
      type: QuestionType.SINGLE_CHOICE,
      text: "What is your feedback on this product?",
      required: true,
      options: [
        { value: "opt_1", label: "Option 1" },
        { value: "opt_2", label: "Option 2" },
      ],
      conditionGroups: [],
    };

    const updated = [...questions, newQ];
    setQuestions(updated);
    setSelectedQuestionId(newQ.questionId);
    setHasUnsavedChanges(true);
    setSaveStatus("unsaved");
  };

  // Duplicate Question
  const handleDuplicateQuestion = (q: ISurveyQuestion) => {
    const nextIdx = questions.length + 1;
    const duplicated: ISurveyQuestion = {
      ...JSON.parse(JSON.stringify(q)),
      questionId: `q${nextIdx}_${Date.now().toString().slice(-4)}`,
      order: nextIdx,
      text: `${q.text} (Copy)`,
    };
    const updated = [...questions, duplicated];
    setQuestions(updated);
    setSelectedQuestionId(duplicated.questionId);
    setHasUnsavedChanges(true);
  };

  // Delete Question
  const handleDeleteQuestion = (questionId: string) => {
    const updated = questions
      .filter((q) => q.questionId !== questionId)
      .map((q, idx) => ({ ...q, order: idx + 1 }));
    setQuestions(updated);
    if (selectedQuestionId === questionId) {
      setSelectedQuestionId(updated.length > 0 ? updated[0].questionId : null);
    }
    setHasUnsavedChanges(true);
  };

  // Move Question Up/Down
  const handleMoveQuestion = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= questions.length) return;
    const copy = [...questions];
    const [moved] = copy.splice(fromIdx, 1);
    copy.splice(toIdx, 0, moved);
    const reindexed = copy.map((q, idx) => ({ ...q, order: idx + 1 }));
    setQuestions(reindexed);
    setHasUnsavedChanges(true);
  };

  // Update current question
  const handleUpdateActiveQuestion = (updates: Partial<ISurveyQuestion>) => {
    if (!selectedQuestionId) return;
    const updated = questions.map((q) =>
      q.questionId === selectedQuestionId ? { ...q, ...updates } : q
    );
    setQuestions(updated);
>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
    setHasUnsavedChanges(true);
    setSaveStatus("unsaved");
  };

<<<<<<< HEAD
  // AI Survey Generation Handler
  const handleAiGenerateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiTopic.trim()) return;

    try {
      const res = await aiGenerateSurveyMutation.mutateAsync({
        topic: aiTopic.trim(),
        campaignId,
        questionCount: aiQuestionCount,
        channel: aiChannel,
      });

      if (res?.questions) {
        setQuestions(res.questions as any);
        if (res.questions.length > 0) {
          setSelectedQuestionId((res.questions[0] as any).questionId);
        }
      }
      setShowAiGenModal(false);
      setAiTopic("");
      refetch();
    } catch (err: any) {
      alert("Failed to generate survey with AI: " + err.message);
    }
  };

  // AI Survey Edit Handler
  const handleAiEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiEditInstructions.trim() || !survey?._id) return;

    try {
      const res = await aiEditSurveyMutation.mutateAsync({
        surveyId: survey._id,
        instructions: aiEditInstructions.trim(),
      });

      if (res?.questions) {
        setQuestions(res.questions as any);
      }
      setShowAiEditModal(false);
      setAiEditInstructions("");
      refetch();
    } catch (err: any) {
      alert("Failed to edit survey with AI: " + err.message);
    }
  };

  // Import Questions Handler
  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (importTab === "file" && !importFile) {
      alert("Please select a file to import.");
      return;
    }
    if (importTab === "text" && !importText.trim()) {
      alert("Please paste question text or JSON.");
      return;
    }

    if (!survey?._id) {
      try {
        const res = await uploadSurveyMutation.mutateAsync({
          file: importTab === "file" ? importFile || undefined : undefined,
          content: importTab === "text" ? importText.trim() : undefined,
          campaignId,
          name: `${campaign?.name || "Campaign"} Survey`,
          channel: "VOICE",
        });
        if (res?.questions) {
          setQuestions(res.questions as any);
        }
        setShowImportModal(false);
        setImportFile(null);
        setImportText("");
        refetch();
        return;
      } catch (err: any) {
        alert("Failed to upload and create survey: " + (err.response?.data?.message || err.message));
        return;
      }
    }

    try {
      const res = await importQuestionsMutation.mutateAsync({
        surveyId: survey._id,
        payload: {
          file: importTab === "file" ? importFile || undefined : undefined,
          content: importTab === "text" ? importText.trim() : undefined,
          append: importAppend,
        },
      });

      if (res?.questions) {
        setQuestions(res.questions as any);
      }
      setShowImportModal(false);
      setImportFile(null);
      setImportText("");
      refetch();
    } catch (err: any) {
      alert("Failed to import questions: " + (err.response?.data?.message || err.message));
    }
  };

  // Voice Test TTS Handler
  const handlePlayQuestionSpeech = async (text: string) => {
    if (!text?.trim()) return;
    try {
      const res = await ttsMutation.mutateAsync(text);
      if (res?.audioBase64) {
        if (audioRef.current) audioRef.current.pause();
        const audio = new Audio(`data:audio/wav;base64,${res.audioBase64}`);
        audioRef.current = audio;
        setIsPlayingAudio(true);
        audio.onended = () => setIsPlayingAudio(false);
        audio.onerror = () => setIsPlayingAudio(false);
        audio.play().catch(() => setIsPlayingAudio(false));
      }
    } catch {
      setIsPlayingAudio(false);
    }
  };

  const handleRunValidation = () => {
    const res = surveyApi.validateSurvey(survey ? { ...survey, questions } : null);
=======
  // Run Pre-flight Validation
  const handleRunValidation = () => {
    const res = surveyApi.validateSurvey(
      survey ? { ...survey, questions } : null
    );
>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
    setValidationResult(res);
    setIsValidationOpen(true);
  };

<<<<<<< HEAD
=======
  // Publish
  const handlePublish = async () => {
    if (!survey) return;
    const res = surveyApi.validateSurvey({ ...survey, questions });
    if (!res.isValid) {
      setValidationResult(res);
      setIsValidationOpen(true);
      return;
    }
    await handleSave();
    await publishCampaignMutation.mutateAsync(campaignId);
    setPublishModalOpen(false);
    navigate(`/campaigns/${campaignId}?tab=overview`);
  };

>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
  if (campaignLoading || surveyLoading) {
    return <LoadingSpinner message="Loading Survey Builder..." />;
  }

  return (
    <div className="d-flex flex-column" style={{ height: "calc(100vh - 120px)" }}>
      {/* Top Builder Header */}
      <div className="card shadow-sm border mb-2">
        <div className="card-body p-2 px-3 d-flex flex-wrap justify-content-between align-items-center gap-2">
          {/* Left Title & Status */}
          <div className="d-flex align-items-center gap-2">
            <Link to={`/campaigns/${campaignId}`} className="btn btn-outline-secondary btn-sm p-1" title="Back">
              <ArrowLeft size={16} />
            </Link>
            <div>
              <div className="d-flex align-items-center gap-2">
                <span className="fw-bold small text-dark">{survey?.name || "New Survey Flow"}</span>
                <span className="badge bg-secondary-subtle text-secondary small">
                  {campaign?.status === "active" ? "Published" : "Draft"}
                </span>
                <span className="badge bg-light text-secondary border small">{campaign?.language || "en-IN"}</span>
              </div>
              <span className="text-muted" style={{ fontSize: "11px" }}>
                {saveStatus === "saving" ? (
                  <span className="text-warning">● Saving...</span>
                ) : saveStatus === "unsaved" ? (
                  <span className="text-danger">● Unsaved changes</span>
                ) : (
<<<<<<< HEAD
                  <span className="text-success">● Saved ({questions.length} Questions)</span>
=======
                  <span className="text-success">● Saved</span>
>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
                )}
              </span>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="d-flex align-items-center gap-2 flex-wrap">
<<<<<<< HEAD
            {/* AI Generate Button */}
            <button
              className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1 shadow-sm"
              onClick={() => setShowAiGenModal(true)}
            >
              <Sparkles size={14} />
              <span>AI Generate</span>
            </button>

            {/* AI Edit / Refine Button */}
            <button
              className="btn btn-outline-purple btn-sm d-flex align-items-center gap-1"
              onClick={() => setShowAiEditModal(true)}
            >
              <Wand2 size={14} />
              <span>AI Edit</span>
            </button>

            {/* Import Questions Button */}
            <button
              className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
              onClick={() => setShowImportModal(true)}
              title="Upload file (.json, .csv, .pdf, .docx, .txt) to import questions"
            >
              <UploadCloud size={14} />
              <span>Import Questions</span>
            </button>

            {/* Test Voice Call Button */}
            <button
              className="btn btn-outline-success btn-sm d-flex align-items-center gap-1"
              onClick={() => {
                setActiveVoiceQIndex(0);
                setShowVoiceTestModal(true);
                if (questions[0]) {
                  handlePlayQuestionSpeech(questions[0].aiPrompt || questions[0].text);
                }
              }}
              disabled={questions.length === 0}
            >
              <PhoneCall size={14} />
              <span>Voice Test</span>
            </button>

            {/* Run Live Voice Call */}
            <Link
              to={`/ai-agents/live-execution?campaignId=${campaignId}${survey?._id ? `&surveyId=${survey._id}` : ""}`}
              className="btn btn-success btn-sm d-flex align-items-center gap-1 shadow-sm px-3 fw-bold"
            >
              <PhoneCall size={14} />
              <span>Run Live Call</span>
            </Link>

            {/* Logic Branching trigger for active question */}
            {activeQuestion && (
              <button
                className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
=======
            {/* Logic Branching trigger for active question */}
            {activeQuestion && (
              <button
                className="btn btn-outline-purple btn-sm d-flex align-items-center gap-1 border-purple text-purple bg-purple-subtle"
>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
                onClick={() => setConditionModalQuestion(activeQuestion)}
                style={{ fontSize: "12px" }}
              >
                <GitBranch size={14} />
                <span>Logic Rules ({activeQuestion.conditionGroups?.length || 0})</span>
              </button>
            )}

            <Link to={`/campaigns/${campaignId}/survey/flow`} className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1">
              <Network size={14} />
              <span className="d-none d-sm-inline">Flow</span>
            </Link>

<<<<<<< HEAD
=======
            <Link to={`/campaigns/${campaignId}/survey/preview`} className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1">
              <Play size={14} />
              <span>Preview</span>
            </Link>

>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
            <button className="btn btn-outline-info btn-sm d-flex align-items-center gap-1" onClick={handleRunValidation}>
              <ShieldCheck size={14} />
              <span>Validate</span>
            </button>

            <button
              className="btn btn-secondary btn-sm d-flex align-items-center gap-1"
              onClick={() => handleSave()}
              disabled={saveQuestionsMutation.isPending}
            >
              <Save size={14} />
              <span>Save</span>
            </button>

            <button
              className="btn btn-success btn-sm d-flex align-items-center gap-1 shadow-sm"
              onClick={() => {
                const res = surveyApi.validateSurvey(survey ? { ...survey, questions } : null);
                setValidationResult(res);
                if (res.isValid) {
                  setPublishModalOpen(true);
                } else {
                  setIsValidationOpen(true);
                }
              }}
            >
              <Send size={14} />
              <span>Publish</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3-Column Layout: Left (Questions) | Center (Editor) | Right (Settings) */}
      <div className="card shadow-sm border flex-grow-1 overflow-hidden">
        <div className="row g-0 h-100">
          {/* Left Column: Question List */}
          <div className="col-12 col-md-3 col-lg-3 h-100 overflow-hidden">
            <QuestionListPanel
              questions={questions}
              selectedQuestionId={selectedQuestionId}
              onSelectQuestion={(id) => setSelectedQuestionId(id)}
<<<<<<< HEAD
              onAddQuestion={() => handleAddQuestion(QuestionType.SINGLE_CHOICE)}
              onDuplicateQuestion={(q) => handleDuplicateQuestion(q.questionId)}
              onDeleteQuestion={handleDeleteQuestion}
              onMoveQuestion={handleMoveQuestionByIndex}
=======
              onAddQuestion={handleAddQuestion}
              onDuplicateQuestion={handleDuplicateQuestion}
              onDeleteQuestion={handleDeleteQuestion}
              onMoveQuestion={handleMoveQuestion}
>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
            />
          </div>

          {/* Center Column: Question Editor */}
          <div className="col-12 col-md-6 col-lg-6 h-100 overflow-hidden border-end">
            {activeQuestion ? (
<<<<<<< HEAD
              <div className="d-flex flex-column h-100">
                <div className="p-2 border-bottom bg-light d-flex justify-content-between align-items-center">
                  <span className="small fw-bold text-dark">Editing Question #{activeQuestion.order}</span>
                  <button
                    className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1 py-1 px-2"
                    onClick={() => setConditionModalQuestion(activeQuestion)}
                  >
                    <Workflow size={14} />
                    <span>Logic Branching ({activeQuestion.conditionGroups?.length || 0})</span>
                  </button>
                </div>
                <div className="flex-grow-1 overflow-y-auto">
                  <QuestionEditor
                    question={activeQuestion}
                    onChange={handleUpdateActiveQuestion}
                  />
                </div>
              </div>
            ) : (
              <div className="d-flex flex-column align-items-center justify-content-center h-100 text-center p-4">
                <Workflow size={48} className="text-secondary mb-3 opacity-50" />
                <h6 className="fw-bold text-dark">No Question Selected</h6>
                <p className="text-secondary small mb-3">
                  Click on an existing question or add a new one from the list on the left.
                </p>
                <div className="d-flex gap-2">
                  <button className="btn btn-primary btn-sm" onClick={() => handleAddQuestion(QuestionType.SINGLE_CHOICE)}>
                    Add Single Choice
                  </button>
                  <button className="btn btn-outline-primary btn-sm" onClick={() => setShowAiGenModal(true)}>
                    Generate with AI
                  </button>
                </div>
=======
              <QuestionEditor
                question={activeQuestion}
                onChange={handleUpdateActiveQuestion}
              />
            ) : (
              <div className="d-flex flex-column align-items-center justify-content-center h-100 text-center p-5 text-muted">
                <Workflow size={48} className="mb-2 text-primary" />
                <h6>No Question Selected</h6>
                <p className="small mb-3">Select a question from the left panel or click Add Question to begin.</p>
                <button className="btn btn-primary btn-sm" onClick={handleAddQuestion}>
                  + Add First Question
                </button>
>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
              </div>
            )}
          </div>

<<<<<<< HEAD
          {/* Right Column: Settings & Logic summary */}
          <div className="col-12 col-md-3 col-lg-3 h-100 overflow-hidden">
=======
          {/* Right Column: Question Settings */}
          <div className="col-12 col-md-3 col-lg-3 h-100 overflow-hidden bg-light-subtle">
>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
            {activeQuestion ? (
              <QuestionSettingsPanel
                question={activeQuestion}
                onChange={handleUpdateActiveQuestion}
              />
            ) : (
<<<<<<< HEAD
              <div className="p-3 text-secondary small text-center">Select a question to inspect properties.</div>
=======
              <div className="p-4 text-muted small text-center">
                Select a question to inspect properties.
              </div>
>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
            )}
          </div>
        </div>
      </div>

<<<<<<< HEAD
      {/* AI GENERATE SURVEY MODAL */}
      {showAiGenModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.6)" }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header border-0 pb-0 pt-4 px-4">
                <div className="d-flex align-items-center gap-2 text-primary">
                  <Sparkles size={24} />
                  <h5 className="modal-title fw-bold">Generate Survey with AI</h5>
                </div>
                <button type="button" className="btn-close" onClick={() => setShowAiGenModal(false)} />
              </div>

              <form onSubmit={handleAiGenerateSubmit}>
                <div className="modal-body p-4">
                  <p className="text-secondary small mb-3">
                    Describe your survey objective. The AI will generate structured questions across multiple question types (ratings, choices, scale, budget, text) with conversational voice prompts optimized for phone calls.
                  </p>

                  <div className="mb-3">
                    <label className="form-label fw-bold small">Survey Objective / Topic <span className="text-danger">*</span></label>
                    <textarea
                      className="form-control"
                      rows={3}
                      placeholder="e.g., Customer pricing evaluation, sales qualification bottlenecks, and competitor switching intent for SalesFlow AI"
                      value={aiTopic}
                      onChange={(e) => setAiTopic(e.target.value)}
                      required
                    />
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label fw-bold small">Question Count</label>
                      <select
                        className="form-select"
                        value={aiQuestionCount}
                        onChange={(e) => setAiQuestionCount(Number(e.target.value))}
                      >
                        <option value={3}>3 Questions (Quick Poll)</option>
                        <option value={4}>4 Questions (Standard Discovery)</option>
                        <option value={5}>5 Questions (Comprehensive)</option>
                        <option value={7}>7 Questions (In-depth Evaluation)</option>
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold small">Primary Channel</label>
                      <select
                        className="form-select"
                        value={aiChannel}
                        onChange={(e) => setAiChannel(e.target.value)}
                      >
                        <option value="VOICE">📞 AI Voice Calling (Natural speech prompts)</option>
                        <option value="CHAT">💬 Chatbot & WhatsApp</option>
                        <option value="WEB">🌐 Web Form</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-0 pt-0 px-4 pb-4">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowAiGenModal(false)}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary d-flex align-items-center gap-2 px-4"
                    disabled={aiGenerateSurveyMutation.isPending || !aiTopic.trim()}
                  >
                    {aiGenerateSurveyMutation.isPending ? (
                      <>
                        <Loader2 size={16} className="spinner-border spinner-border-sm" />
                        <span>AI Generating Survey...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        <span>Generate & Replace Survey</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* AI EDIT SURVEY MODAL */}
      {showAiEditModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.6)" }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header border-0 pb-0 pt-4 px-4">
                <div className="d-flex align-items-center gap-2 text-primary">
                  <Wand2 size={22} />
                  <h5 className="modal-title fw-bold">Edit Survey with AI</h5>
                </div>
                <button type="button" className="btn-close" onClick={() => setShowAiEditModal(false)} />
              </div>

              <form onSubmit={handleAiEditSubmit}>
                <div className="modal-body p-4">
                  <p className="text-secondary small mb-3">
                    Enter instructions to add questions, reword prompts, or reorder the existing survey.
                  </p>

                  <div className="mb-3">
                    <label className="form-label fw-bold small">Edit Instructions <span className="text-danger">*</span></label>
                    <textarea
                      className="form-control"
                      rows={4}
                      placeholder="e.g., Add a question at the end asking if they want a demo call next week, and simplify question 2 for faster voice answering"
                      value={aiEditInstructions}
                      onChange={(e) => setAiEditInstructions(e.target.value)}
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
                    disabled={aiEditSurveyMutation.isPending || !aiEditInstructions.trim()}
                  >
                    {aiEditSurveyMutation.isPending ? (
                      <>
                        <Loader2 size={16} className="spinner-border spinner-border-sm" />
                        <span>Updating Survey...</span>
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

      {/* IMPORT / UPLOAD QUESTIONS MODAL */}
      {showImportModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.6)" }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header border-0 pb-0 pt-4 px-4">
                <div className="d-flex align-items-center gap-2 text-primary">
                  <UploadCloud size={24} />
                  <div>
                    <h5 className="modal-title fw-bold mb-0">Import Questions into Survey</h5>
                    <div className="text-secondary small">Upload a file or paste question text to parse and import with AI</div>
                  </div>
                </div>
                <button type="button" className="btn-close" onClick={() => setShowImportModal(false)} />
              </div>

              <form onSubmit={handleImportSubmit}>
                <div className="modal-body p-4 d-flex flex-column gap-3">
                  {/* Mode Tabs */}
                  <ul className="nav nav-pills nav-fill bg-light p-1 rounded-3">
                    <li className="nav-item">
                      <button
                        type="button"
                        className={`nav-link py-1 small fw-bold ${importTab === "file" ? "active" : ""}`}
                        onClick={() => setImportTab("file")}
                      >
                        <FileUp size={14} className="me-1" />
                        Upload File (.json, .csv, .pdf, .docx, .txt)
                      </button>
                    </li>
                    <li className="nav-item">
                      <button
                        type="button"
                        className={`nav-link py-1 small fw-bold ${importTab === "text" ? "active" : ""}`}
                        onClick={() => setImportTab("text")}
                      >
                        <FileCode size={14} className="me-1" />
                        Paste Questionnaire Text
                      </button>
                    </li>
                  </ul>

                  {/* Tab 1: File Upload */}
                  {importTab === "file" && (
                    <div className="border border-dashed rounded-3 p-4 text-center bg-light">
                      <input
                        type="file"
                        className="form-control form-control-sm mb-2"
                        accept=".json,.csv,.pdf,.docx,.txt,.tsv"
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            setImportFile(e.target.files[0]);
                          }
                        }}
                      />
                      <div className="text-muted small">
                        {importFile ? (
                          <span className="text-success fw-bold">Selected: {importFile.name}</span>
                        ) : (
                          "Select JSON, CSV, PDF, Word DOCX or Text Questionnaire file"
                        )}
                      </div>
                    </div>
                  )}

                  {/* Tab 2: Paste Text */}
                  {importTab === "text" && (
                    <div>
                      <label className="form-label small fw-bold text-dark">Questionnaire Content / Questions List</label>
                      <textarea
                        className="form-control small font-monospace"
                        rows={7}
                        placeholder={`Paste questions, options, or JSON questionnaire here:\n\nExample:\nQ1: How satisfied are you with our product? (1 to 5 rating)\nQ2: What is your primary role? (Founder, VP Sales, SDR, Operations)\nQ3: Are you interested in a live voice demo? (Yes/No)`}
                        value={importText}
                        onChange={(e) => setImportText(e.target.value)}
                      ></textarea>
                    </div>
                  )}

                  {/* Append / Replace Radio */}
                  <div className="p-3 bg-light rounded-3 border">
                    <div className="form-check form-check-inline">
                      <input
                        className="form-check-input"
                        type="radio"
                        id="appendRadio"
                        checked={importAppend}
                        onChange={() => setImportAppend(true)}
                      />
                      <label className="form-check-label small fw-bold" htmlFor="appendRadio">
                        Append to existing questions ({questions.length} existing)
                      </label>
                    </div>
                    <div className="form-check form-check-inline">
                      <input
                        className="form-check-input"
                        type="radio"
                        id="replaceRadio"
                        checked={!importAppend}
                        onChange={() => setImportAppend(false)}
                      />
                      <label className="form-check-label small fw-bold text-danger" htmlFor="replaceRadio">
                        Replace all existing questions
                      </label>
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-0 pt-0 px-4 pb-4">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowImportModal(false)}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary d-flex align-items-center gap-2"
                    disabled={importQuestionsMutation.isPending}
                  >
                    {importQuestionsMutation.isPending ? (
                      <>
                        <Loader2 size={16} className="spinner-border spinner-border-sm" />
                        <span>Parsing & Importing with AI...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud size={16} />
                        <span>Import Questions</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* VOICE TEST SURVEY SIMULATOR MODAL */}
      {showVoiceTestModal && questions.length > 0 && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.7)" }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4 text-white" style={{ background: "linear-gradient(145deg, #1e1b4b 0%, #0f172a 100%)" }}>
              <div className="modal-header border-0 pb-0 pt-4 px-4">
                <div className="d-flex align-items-center gap-2 text-warning">
                  <Radio size={20} className="spinner-grow spinner-grow-sm" />
                  <h6 className="modal-title fw-bold text-uppercase" style={{ letterSpacing: "1px" }}>AI Voice Survey Simulator</h6>
                </div>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => {
                    if (audioRef.current) audioRef.current.pause();
                    setShowVoiceTestModal(false);
                  }}
                />
              </div>

              <div className="modal-body p-4 text-center">
                <div className="mb-2">
                  <span className="badge bg-primary-subtle text-primary border px-3 py-1">
                    Question {activeVoiceQIndex + 1} of {questions.length}
                  </span>
                </div>

                <h5 className="fw-bold mb-3 mt-2">{questions[activeVoiceQIndex]?.text}</h5>

                {/* Voice Prompt box */}
                <div className="p-3 bg-dark bg-opacity-50 border border-secondary border-opacity-25 rounded-3 text-start small mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-1 text-info fw-bold" style={{ fontSize: "11px" }}>
                    <span>AI SPOKEN PHONE PROMPT</span>
                    {isPlayingAudio && <span className="badge bg-success">Speaking Audio...</span>}
                  </div>
                  <p className="text-light mb-0 fst-italic">
                    "{questions[activeVoiceQIndex]?.aiPrompt || questions[activeVoiceQIndex]?.text}"
                  </p>
                </div>

                {/* Question Options */}
                {questions[activeVoiceQIndex]?.options && (
                  <div className="d-flex flex-wrap justify-content-center gap-2 mb-3">
                    {questions[activeVoiceQIndex].options?.map((opt, oIdx) => (
                      <span key={oIdx} className="badge bg-secondary bg-opacity-25 text-light border border-secondary border-opacity-25 p-2">
                        {opt.label}
                      </span>
                    ))}
                  </div>
                )}

                {/* TTS Audio Controls */}
                <div className="d-flex justify-content-center gap-2 mb-2">
                  <button
                    className="btn btn-info btn-sm d-flex align-items-center gap-1"
                    onClick={() => handlePlayQuestionSpeech(questions[activeVoiceQIndex]?.aiPrompt || questions[activeVoiceQIndex]?.text)}
                    disabled={ttsMutation.isPending}
                  >
                    <Volume2 size={15} />
                    <span>{ttsMutation.isPending ? "Synthesizing Voice..." : "Hear AI Voice Prompt"}</span>
                  </button>
                </div>
              </div>

              <div className="modal-footer border-0 pt-0 px-4 pb-4 justify-content-between">
                <button
                  type="button"
                  className="btn btn-outline-light btn-sm"
                  onClick={() => {
                    if (activeVoiceQIndex > 0) {
                      const nextIdx = activeVoiceQIndex - 1;
                      setActiveVoiceQIndex(nextIdx);
                      handlePlayQuestionSpeech(questions[nextIdx]?.aiPrompt || questions[nextIdx]?.text);
                    }
                  }}
                  disabled={activeVoiceQIndex === 0}
                >
                  Previous Question
                </button>

                <button
                  type="button"
                  className="btn btn-primary btn-sm px-3"
                  onClick={() => {
                    if (activeVoiceQIndex < questions.length - 1) {
                      const nextIdx = activeVoiceQIndex + 1;
                      setActiveVoiceQIndex(nextIdx);
                      handlePlayQuestionSpeech(questions[nextIdx]?.aiPrompt || questions[nextIdx]?.text);
                    } else {
                      if (audioRef.current) audioRef.current.pause();
                      setShowVoiceTestModal(false);
                    }
                  }}
                >
                  {activeVoiceQIndex < questions.length - 1 ? "Next Question →" : "Finish Test"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Logic Branching Modal */}
=======
      {/* Condition Builder Modal */}
>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
      {conditionModalQuestion && (
        <ConditionBuilder
          question={conditionModalQuestion}
          allQuestions={questions}
          isOpen={Boolean(conditionModalQuestion)}
          onClose={() => setConditionModalQuestion(null)}
<<<<<<< HEAD
          onSave={(updatedGroups) => {
            const nextList = questions.map((q) =>
              q.questionId === conditionModalQuestion.questionId
                ? { ...q, conditionGroups: updatedGroups }
                : q
            );
            setQuestions(nextList);
            setHasUnsavedChanges(true);
            setSaveStatus("unsaved");
            handleSave(nextList);
=======
          onSave={(groups) => {
            handleUpdateActiveQuestion({ conditionGroups: groups });
>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
            setConditionModalQuestion(null);
          }}
        />
      )}

<<<<<<< HEAD
      {/* Pre-flight Validation Results Modal */}
      {isValidationOpen && validationResult && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow-lg border-0">
              <div className="modal-header border-0 pb-0">
                <div className="d-flex align-items-center gap-2">
                  <ShieldCheck size={20} className={validationResult.isValid ? "text-success" : "text-danger"} />
                  <h6 className="modal-title fw-bold">Survey Pre-flight Validation</h6>
                </div>
                <button type="button" className="btn-close" onClick={() => setIsValidationOpen(false)} />
              </div>
              <div className="modal-body p-3">
                <div className="d-flex justify-content-between align-items-center mb-3 p-2 bg-light rounded-2">
                  <span className="small fw-semibold">Quality Health Score</span>
                  <span className={`badge ${validationResult.score >= 80 ? "bg-success" : "bg-warning"} fs-6`}>
                    {validationResult.score}/100
                  </span>
                </div>
                {validationResult.issues.length > 0 && (
                  <div className="d-flex flex-column gap-2 mb-3">
                    {validationResult.issues.map((iss) => (
                      <div key={iss.id} className="p-2 border rounded-2 bg-light-subtle small">
                        <div className="fw-bold text-dark">{iss.title}</div>
                        <div className="text-secondary" style={{ fontSize: "12px" }}>{iss.message}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="modal-footer border-0 pt-0">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsValidationOpen(false)}>
                  Close
                </button>
=======
      {/* Pre-flight Validation Drawer/Modal */}
      {isValidationOpen && validationResult && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(15, 23, 42, 0.7)", zIndex: 1065 }}
          onClick={() => setIsValidationOpen(false)}
        >
          <div
            className="modal-dialog modal-dialog-centered"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "560px" }}
          >
            <div className="modal-content shadow-lg border-0">
              <div className="modal-header border-bottom py-3">
                <div className="d-flex align-items-center gap-2">
                  <ShieldCheck size={20} className={validationResult.isValid ? "text-success" : "text-warning"} />
                  <h5 className="modal-title fs-6 fw-bold mb-0">Pre-Flight Survey Validation</h5>
                </div>
                <button type="button" className="btn-close" onClick={() => setIsValidationOpen(false)}></button>
              </div>

              <div className="modal-body p-4">
                {/* Score */}
                <div className="p-3 border rounded-3 bg-light-subtle d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <span className="text-secondary small fw-bold text-uppercase d-block">Readiness Score</span>
                    <h4 className="fw-bold mb-0">{validationResult.score}%</h4>
                  </div>
                  <span
                    className={`badge ${
                      validationResult.isValid
                        ? "bg-success-subtle text-success border border-success"
                        : "bg-danger-subtle text-danger border border-danger"
                    }`}
                  >
                    {validationResult.isValid ? "✓ Ready to Publish" : "✕ Blockers Detected"}
                  </span>
                </div>

                {/* Issues List */}
                <div className="d-flex flex-column gap-2 mb-3">
                  {validationResult.issues.map((issue) => (
                    <div
                      key={issue.id}
                      className={`p-2 border rounded-2 small ${
                        issue.level === "error"
                          ? "bg-danger-subtle border-danger-subtle text-danger"
                          : "bg-warning-subtle border-warning-subtle text-warning-emphasis"
                      }`}
                    >
                      <div className="fw-bold">{issue.title}</div>
                      <div style={{ fontSize: "11.5px" }}>{issue.message}</div>
                    </div>
                  ))}
                </div>

                {/* Passed Checks */}
                <div className="border-top pt-2">
                  <span className="small fw-bold text-secondary text-uppercase mb-2 d-block" style={{ fontSize: "11px" }}>
                    Passed Checks ({validationResult.passedChecks.length})
                  </span>
                  <div className="d-flex flex-column gap-1">
                    {validationResult.passedChecks.map((check, idx) => (
                      <div key={idx} className="d-flex align-items-center gap-2 small text-success">
                        <CheckCircle2 size={13} />
                        <span>{check}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="modal-footer border-top bg-light py-2">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary px-3"
                  onClick={() => setIsValidationOpen(false)}
                >
                  Close
                </button>
                {validationResult.isValid && (
                  <button
                    type="button"
                    className="btn btn-sm btn-success px-4"
                    onClick={() => {
                      setIsValidationOpen(false);
                      setPublishModalOpen(true);
                    }}
                  >
                    Proceed to Publish
                  </button>
                )}
>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
              </div>
            </div>
          </div>
        </div>
      )}

<<<<<<< HEAD
      {/* Confirm Publish Modal */}
      {publishModalOpen && (
        <ConfirmModal
          isOpen={publishModalOpen}
          title="Publish Survey Campaign"
          message={`Are you ready to publish "${campaign?.name}"? The AI voice agent will begin outbound interactions.`}
          onConfirm={async () => {
            await handleSave();
            await publishCampaignMutation.mutateAsync(campaignId);
            setPublishModalOpen(false);
            navigate(`/campaigns/${campaignId}?tab=overview`);
          }}
          onCancel={() => setPublishModalOpen(false)}
          confirmText="Publish Live"
=======
      {/* Publish Confirmation Modal */}
      {publishModalOpen && (
        <ConfirmModal
          isOpen={publishModalOpen}
          title="Publish Survey & Activate Campaign?"
          message="Once published, the conversational AI agent will immediately begin executing this survey with live customers."
          variant="success"
          confirmText="Confirm & Publish"
          onConfirm={handlePublish}
          onCancel={() => setPublishModalOpen(false)}
          isLoading={publishCampaignMutation.isPending}
>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
        />
      )}
    </div>
  );
};
<<<<<<< HEAD

export default SurveyBuilderPage;
=======
>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
