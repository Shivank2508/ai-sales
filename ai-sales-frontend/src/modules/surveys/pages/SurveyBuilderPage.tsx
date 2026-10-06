import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useCampaign, usePublishCampaign } from "../../campaigns/hooks/useCampaigns";
import { useSurveyByCampaign, useSaveQuestions, useUpdateSurvey, useCreateSurvey } from "../hooks/useSurveys";
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

  // Mobile / Responsive panel visibility
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);

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
    setHasUnsavedChanges(true);
    setSaveStatus("unsaved");
  };

  // Run Pre-flight Validation
  const handleRunValidation = () => {
    const res = surveyApi.validateSurvey(
      survey ? { ...survey, questions } : null
    );
    setValidationResult(res);
    setIsValidationOpen(true);
  };

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
                  <span className="text-success">● Saved</span>
                )}
              </span>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="d-flex align-items-center gap-2 flex-wrap">
            {/* Logic Branching trigger for active question */}
            {activeQuestion && (
              <button
                className="btn btn-outline-purple btn-sm d-flex align-items-center gap-1 border-purple text-purple bg-purple-subtle"
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

            <Link to={`/campaigns/${campaignId}/survey/preview`} className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1">
              <Play size={14} />
              <span>Preview</span>
            </Link>

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
              onAddQuestion={handleAddQuestion}
              onDuplicateQuestion={handleDuplicateQuestion}
              onDeleteQuestion={handleDeleteQuestion}
              onMoveQuestion={handleMoveQuestion}
            />
          </div>

          {/* Center Column: Question Editor */}
          <div className="col-12 col-md-6 col-lg-6 h-100 overflow-hidden border-end">
            {activeQuestion ? (
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
              </div>
            )}
          </div>

          {/* Right Column: Question Settings */}
          <div className="col-12 col-md-3 col-lg-3 h-100 overflow-hidden bg-light-subtle">
            {activeQuestion ? (
              <QuestionSettingsPanel
                question={activeQuestion}
                onChange={handleUpdateActiveQuestion}
              />
            ) : (
              <div className="p-4 text-muted small text-center">
                Select a question to inspect properties.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Condition Builder Modal */}
      {conditionModalQuestion && (
        <ConditionBuilder
          question={conditionModalQuestion}
          allQuestions={questions}
          isOpen={Boolean(conditionModalQuestion)}
          onClose={() => setConditionModalQuestion(null)}
          onSave={(groups) => {
            handleUpdateActiveQuestion({ conditionGroups: groups });
            setConditionModalQuestion(null);
          }}
        />
      )}

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
              </div>
            </div>
          </div>
        </div>
      )}

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
        />
      )}
    </div>
  );
};
