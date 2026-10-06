import React, { useState, useEffect, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { useCampaign } from "../../campaigns/hooks/useCampaigns";
import { useSurveyByCampaign } from "../hooks/useSurveys";
import { LoadingSpinner } from "../../../components/common/LoadingSpinner";
import {
  ISurveyQuestion,
  QuestionAction,
  QuestionType,
} from "../../../types";
import {
  ArrowLeft,
  Workflow,
  RotateCcw,
  Volume2,
  VolumeX,
  Bot,
  User,
  CheckCircle2,
  CornerDownRight,
  ShieldCheck,
  Send,
  Smartphone,
  Monitor,
} from "lucide-react";

export const SurveyPreviewPage: React.FC = () => {
  const { campaignId = "" } = useParams<{ campaignId: string }>();
  const { data: campaign } = useCampaign(campaignId);
  const { data: survey, isLoading } = useSurveyByCampaign(campaignId);

  const questions = survey?.questions || [];

  // Runtime State
  const [stage, setStage] = useState<"welcome" | "question" | "completed">("welcome");
  const [currentQId, setCurrentQId] = useState<string>("");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [currentInput, setCurrentInput] = useState<any>("");
  const [branchLogs, setBranchLogs] = useState<Array<{ qId: string; answer: any; log: string }>>([]);

  // Audio / Device State
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [deviceMode, setDeviceMode] = useState<"mobile" | "desktop">("mobile");

  useEffect(() => {
    if (questions.length > 0 && !currentQId) {
      setCurrentQId(questions[0].questionId);
      setCurrentIdx(0);
    }
  }, [questions]);

  const activeQ: ISurveyQuestion | undefined = useMemo(() => {
    return questions.find((q) => q.questionId === currentQId) || questions[currentIdx];
  }, [questions, currentQId, currentIdx]);

  // Voice speech synthesis
  const speakText = (text: string) => {
    if (!voiceEnabled) return;
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = survey?.language || "en-IN";
      utterance.rate = 1.05;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setIsSpeaking(true);
      setTimeout(() => setIsSpeaking(false), 2000);
    }
  };

  useEffect(() => {
    if (stage === "welcome" && survey?.welcomeMessage) {
      speakText(survey.welcomeMessage);
    } else if (stage === "question" && activeQ) {
      speakText(activeQ.text);
    } else if (stage === "completed" && survey?.endMessage) {
      speakText(survey.endMessage);
    }
  }, [stage, currentQId]);

  const handleStartSurvey = () => {
    if (questions.length === 0) return;
    setStage("question");
    setCurrentQId(questions[0].questionId);
    setCurrentIdx(0);
    setCurrentInput("");
  };

  // Evaluate dynamic branch logic
  const handleAnswerQuestion = (val: any) => {
    if (!activeQ) return;

    const newAnswers = { ...answers, [activeQ.questionId]: val };
    setAnswers(newAnswers);

    let nextTargetId: string | null = null;
    let action: QuestionAction = QuestionAction.NEXT;
    let logMsg = "Sequential progression to next question.";

    // Check all condition groups for this question
    if (activeQ.conditionGroups && activeQ.conditionGroups.length > 0) {
      for (const group of activeQ.conditionGroups) {
        let groupMatches = group.logic === "AND";

        for (const rule of group.rules) {
          const ruleAnswer = rule.questionId === activeQ.questionId ? val : newAnswers[rule.questionId];
          let ruleMatch = false;

          if (rule.operator === "equals") {
            ruleMatch = String(ruleAnswer).toLowerCase() === String(rule.value).toLowerCase();
          } else if (rule.operator === "not_equals") {
            ruleMatch = String(ruleAnswer).toLowerCase() !== String(rule.value).toLowerCase();
          } else if (rule.operator === "greater_than") {
            ruleMatch = Number(ruleAnswer) > Number(rule.value);
          } else if (rule.operator === "less_than") {
            ruleMatch = Number(ruleAnswer) < Number(rule.value);
          } else if (rule.operator === "greater_than_or_equal") {
            ruleMatch = Number(ruleAnswer) >= Number(rule.value);
          } else if (rule.operator === "less_than_or_equal") {
            ruleMatch = Number(ruleAnswer) <= Number(rule.value);
          } else if (rule.operator === "contains") {
            ruleMatch = String(ruleAnswer).toLowerCase().includes(String(rule.value).toLowerCase());
          } else if (rule.operator === "not_contains") {
            ruleMatch = !String(ruleAnswer).toLowerCase().includes(String(rule.value).toLowerCase());
          }

          if (group.logic === "AND") {
            groupMatches = groupMatches && ruleMatch;
          } else {
            // OR logic
            if (ruleMatch) {
              groupMatches = true;
              break;
            }
          }
        }

        if (group.rules.length === 0) {
          groupMatches = true; // unconditional
        }

        if (groupMatches) {
          action = group.action;
          nextTargetId = group.nextQuestionId || null;
          logMsg =
            action === QuestionAction.END_SURVEY
              ? `Condition matched (${group.rules.map((r) => `${r.operator} "${r.value}"`).join(" & ")}) ➔ Triggered END SURVEY.`
              : `Condition matched ➔ Jump to Question "${nextTargetId}".`;
          break;
        }
      }
    }

    setBranchLogs((prev) => [
      ...prev,
      { qId: activeQ.questionId, answer: val, log: logMsg },
    ]);

    if (action === QuestionAction.END_SURVEY) {
      setStage("completed");
      return;
    }

    if (nextTargetId) {
      const targetQ = questions.find((q) => q.questionId === nextTargetId);
      if (targetQ) {
        setCurrentQId(nextTargetId);
        const tIdx = questions.findIndex((q) => q.questionId === nextTargetId);
        setCurrentIdx(tIdx !== -1 ? tIdx : currentIdx + 1);
        setCurrentInput("");
        return;
      }
    }

    // Default sequential progression
    const nextIdx = currentIdx + 1;
    if (nextIdx < questions.length) {
      setCurrentIdx(nextIdx);
      setCurrentQId(questions[nextIdx].questionId);
      setCurrentInput("");
    } else {
      setStage("completed");
    }
  };

  const handleRestart = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setStage("welcome");
    setAnswers({});
    setBranchLogs([]);
    setCurrentInput("");
    if (questions.length > 0) {
      setCurrentQId(questions[0].questionId);
      setCurrentIdx(0);
    }
  };

  if (isLoading) return <LoadingSpinner message="Starting simulator..." />;

  return (
    <div className="d-flex flex-column gap-3">
      {/* Top Toolbar */}
      <div className="card shadow-sm border">
        <div className="card-body p-3 d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div className="d-flex align-items-center gap-2">
            <Link to={`/campaigns/${campaignId}/survey`} className="btn btn-outline-secondary btn-sm p-1">
              <ArrowLeft size={16} />
            </Link>
            <div>
              <h1 className="h5 fw-bold mb-0 text-dark">Survey Execution Simulator</h1>
              <span className="text-muted small" style={{ fontSize: "11px" }}>
                Testing campaign: {campaign?.name}
              </span>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            <div className="btn-group btn-group-sm">
              <button
                className={`btn ${deviceMode === "mobile" ? "btn-secondary" : "btn-outline-secondary"}`}
                onClick={() => setDeviceMode("mobile")}
              >
                <Smartphone size={14} className="me-1" />
                <span>Mobile</span>
              </button>
              <button
                className={`btn ${deviceMode === "desktop" ? "btn-secondary" : "btn-outline-secondary"}`}
                onClick={() => setDeviceMode("desktop")}
              >
                <Monitor size={14} className="me-1" />
                <span>Desktop</span>
              </button>
            </div>

            <button
              className={`btn btn-sm ${voiceEnabled ? "btn-outline-primary" : "btn-outline-secondary"}`}
              onClick={() => {
                if (voiceEnabled && "speechSynthesis" in window) {
                  window.speechSynthesis.cancel();
                }
                setVoiceEnabled(!voiceEnabled);
              }}
            >
              {voiceEnabled ? <Volume2 size={14} className="me-1 text-primary" /> : <VolumeX size={14} className="me-1" />}
              <span>Voice: {voiceEnabled ? "ON" : "OFF"}</span>
            </button>

            <button className="btn btn-outline-secondary btn-sm" onClick={handleRestart}>
              <RotateCcw size={14} className="me-1" />
              <span>Restart</span>
            </button>

            <Link to={`/campaigns/${campaignId}/survey`} className="btn btn-primary btn-sm">
              <Workflow size={14} className="me-1" />
              <span>Back to Builder</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Simulator Layout */}
      <div className="row g-4 align-items-start">
        {/* Left: Device Simulator Screen */}
        <div className={`col-12 ${deviceMode === "mobile" ? "col-lg-5" : "col-lg-7"}`}>
          <div className="d-flex justify-content-center">
            {deviceMode === "mobile" ? (
              /* Mobile Phone Mockup */
              <div
                className="bg-dark rounded-5 p-3 shadow-lg border border-secondary"
                style={{ width: "360px", minHeight: "640px" }}
              >
                <div
                  className="bg-white rounded-4 p-3 d-flex flex-column justify-content-between overflow-hidden position-relative"
                  style={{ minHeight: "610px" }}
                >
                  {/* Top Phone Header */}
                  <div className="d-flex justify-content-between align-items-center mb-3 text-muted small border-bottom pb-2" style={{ fontSize: "11px" }}>
                    <span>9:41 AM</span>
                    <div className="d-flex align-items-center gap-1">
                      <Bot size={12} className="text-primary" />
                      <span className="fw-bold text-dark">Sarah AI</span>
                    </div>
                    <span>5G • 100%</span>
                  </div>

                  {/* Simulator Screen Content */}
                  <div className="flex-grow-1 d-flex flex-column justify-content-between">
                    {renderScreenContent()}
                  </div>
                </div>
              </div>
            ) : (
              /* Desktop Web View */
              <div className="card shadow-sm border p-4 w-100" style={{ minHeight: "500px" }}>
                {renderScreenContent()}
              </div>
            )}
          </div>
        </div>

        {/* Right: Runtime State & Branching Inspector */}
        <div className={`col-12 ${deviceMode === "mobile" ? "col-lg-7" : "col-lg-5"}`}>
          <div className="d-flex flex-column gap-3">
            {/* AI Agent Status Card */}
            <div className="card shadow-sm border p-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="small fw-bold text-dark d-flex align-items-center gap-1">
                  <Bot size={16} className="text-primary" />
                  <span>AI Conversational Voice Stream</span>
                </span>
                <span className={`badge ${isSpeaking ? "bg-success text-white" : "bg-light text-secondary border"}`}>
                  {isSpeaking ? "Speaking..." : "Listening"}
                </span>
              </div>
              <div className="p-3 bg-light rounded-2 text-center small text-secondary">
                {isSpeaking ? (
                  <div className="d-flex justify-content-center align-items-center gap-1">
                    <span className="spinner-grow spinner-grow-sm text-primary" style={{ width: "8px", height: "8px" }}></span>
                    <span className="fw-semibold text-primary">Synthesizing Voice Audio...</span>
                  </div>
                ) : (
                  <span>Awaiting user response</span>
                )}
              </div>
            </div>

            {/* Dynamic Branching Decision Logs */}
            <div className="card shadow-sm border p-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="small fw-bold text-dark text-uppercase" style={{ fontSize: "11px", letterSpacing: "0.04em" }}>
                  Condition Branching Execution Trace
                </span>
                <span className="badge bg-purple-subtle text-purple border" style={{ fontSize: "10px" }}>
                  {branchLogs.length} Decisions
                </span>
              </div>

              {branchLogs.length === 0 ? (
                <p className="text-muted small mb-0 fst-italic">
                  Answer questions on the left to observe branch conditions executing in real-time.
                </p>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {branchLogs.map((log, idx) => (
                    <div key={idx} className="p-2 border rounded-2 bg-light-subtle small" style={{ fontSize: "12px" }}>
                      <div className="d-flex justify-content-between text-dark fw-bold mb-1">
                        <span>[{log.qId}]</span>
                        <span className="text-muted">Answer: "{String(log.answer)}"</span>
                      </div>
                      <div className="text-primary d-flex align-items-center gap-1">
                        <CornerDownRight size={13} />
                        <span>{log.log}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Live Answers Payload JSON */}
            <div className="card shadow-sm border p-3">
              <span className="small fw-bold text-dark text-uppercase mb-2 d-block" style={{ fontSize: "11px" }}>
                Live Response Answers JSON
              </span>
              <pre className="p-2 bg-light rounded-2 font-monospace small mb-0 border" style={{ fontSize: "11px", maxHeight: "160px", overflowY: "auto" }}>
                {JSON.stringify(answers, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  function renderScreenContent() {
    if (stage === "welcome") {
      return (
        <div className="d-flex flex-column align-items-center justify-content-center text-center p-3 my-auto gap-3">
          <div
            className="rounded-circle bg-primary-subtle text-primary p-3 d-flex align-items-center justify-content-center shadow-xs"
            style={{ width: "64px", height: "64px" }}
          >
            <Bot size={32} />
          </div>
          <div>
            <h5 className="fw-bold mb-1 fs-6">{survey?.name}</h5>
            <p className="text-secondary small mb-0">
              {survey?.welcomeMessage || "Welcome to our survey! Do you have a moment?"}
            </p>
          </div>
          <button className="btn btn-primary btn-sm px-4 shadow-sm" onClick={handleStartSurvey}>
            Start Survey →
          </button>
        </div>
      );
    }

    if (stage === "completed") {
      return (
        <div className="d-flex flex-column align-items-center justify-content-center text-center p-3 my-auto gap-3">
          <div
            className="rounded-circle bg-success-subtle text-success p-3 d-flex align-items-center justify-content-center shadow-xs"
            style={{ width: "64px", height: "64px" }}
          >
            <CheckCircle2 size={32} />
          </div>
          <div>
            <h5 className="fw-bold mb-1 fs-6">Survey Complete!</h5>
            <p className="text-secondary small mb-0">
              {survey?.endMessage || "Thank you for completing our feedback survey!"}
            </p>
          </div>
          <button className="btn btn-outline-secondary btn-sm px-3" onClick={handleRestart}>
            <RotateCcw size={14} className="me-1" />
            <span>Test Again</span>
          </button>
        </div>
      );
    }

    if (!activeQ) return null;

    return (
      <div className="d-flex flex-column justify-content-between h-100">
        <div>
          {/* Progress bar */}
          <div className="d-flex justify-content-between text-muted small mb-1" style={{ fontSize: "11px" }}>
            <span>Question {currentIdx + 1} of {questions.length}</span>
            <span>{Math.round(((currentIdx + 1) / questions.length) * 100)}%</span>
          </div>
          <div className="progress mb-3" style={{ height: "4px" }}>
            <div
              className="progress-bar bg-primary"
              style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
            ></div>
          </div>

          {/* AI Message Bubble */}
          <div className="d-flex gap-2 align-items-start mb-3">
            <div
              className="rounded-circle bg-primary text-white p-1 d-flex align-items-center justify-content-center flex-shrink-0"
              style={{ width: "26px", height: "26px" }}
            >
              <Bot size={14} />
            </div>
            <div className="p-3 bg-light border rounded-3 text-dark fw-semibold small" style={{ fontSize: "13.5px" }}>
              {activeQ.text}
            </div>
          </div>
        </div>

        {/* Inputs */}
        <div className="d-flex flex-column gap-2 mt-3">
          {/* YES/NO */}
          {activeQ.type === QuestionType.YES_NO && (
            <div className="d-flex gap-2">
              <button
                className="btn btn-outline-success btn-sm flex-grow-1 py-2 fw-bold"
                onClick={() => handleAnswerQuestion("yes")}
              >
                ✓ Yes
              </button>
              <button
                className="btn btn-outline-danger btn-sm flex-grow-1 py-2 fw-bold"
                onClick={() => handleAnswerQuestion("no")}
              >
                ✕ No
              </button>
            </div>
          )}

          {/* SINGLE CHOICE */}
          {activeQ.type === QuestionType.SINGLE_CHOICE && activeQ.options && (
            <div className="d-flex flex-column gap-2">
              {activeQ.options.map((opt, idx) => (
                <button
                  key={idx}
                  className="btn btn-outline-primary btn-sm text-start py-2 px-3 small d-flex align-items-center gap-2"
                  onClick={() => handleAnswerQuestion(opt.value)}
                >
                  <span className="rounded-circle border border-primary p-1" style={{ width: "10px", height: "10px" }}></span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* MULTIPLE CHOICE */}
          {activeQ.type === QuestionType.MULTIPLE_CHOICE && activeQ.options && (
            <div className="d-flex flex-column gap-2">
              {activeQ.options.map((opt, idx) => {
                const selected = Array.isArray(currentInput) ? currentInput : [];
                const isSelected = selected.includes(opt.value);
                return (
                  <div
                    key={idx}
                    className={`p-2 border rounded-2 small d-flex justify-content-between align-items-center ${
                      isSelected ? "bg-primary-subtle border-primary" : "bg-white"
                    }`}
                    style={{ cursor: "pointer" }}
                    onClick={() => {
                      const next = isSelected
                        ? selected.filter((v: string) => v !== opt.value)
                        : [...selected, opt.value];
                      setCurrentInput(next);
                    }}
                  >
                    <span>{opt.label}</span>
                    <input type="checkbox" checked={isSelected} readOnly />
                  </div>
                );
              })}
              <button
                className="btn btn-primary btn-sm mt-2"
                onClick={() => handleAnswerQuestion(currentInput || [])}
              >
                Continue →
              </button>
            </div>
          )}

          {/* RATING */}
          {activeQ.type === QuestionType.RATING && (
            <div className="d-flex justify-content-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((score) => (
                <button
                  key={score}
                  className="btn btn-outline-warning btn-sm rounded-circle fw-bold p-2"
                  style={{ width: "40px", height: "40px" }}
                  onClick={() => handleAnswerQuestion(score)}
                >
                  {score}
                </button>
              ))}
            </div>
          )}

          {/* OPEN TEXT / NUMBER */}
          {(activeQ.type === QuestionType.TEXT || activeQ.type === QuestionType.NUMBER) && (
            <div className="d-flex flex-column gap-2">
              <input
                type={activeQ.type === QuestionType.NUMBER ? "number" : "text"}
                className="form-control form-control-sm"
                placeholder="Type or speak answer..."
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && String(currentInput).trim()) {
                    handleAnswerQuestion(currentInput);
                  }
                }}
              />
              <button
                className="btn btn-primary btn-sm"
                disabled={!String(currentInput).trim()}
                onClick={() => handleAnswerQuestion(currentInput)}
              >
                Submit Answer →
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }
};
