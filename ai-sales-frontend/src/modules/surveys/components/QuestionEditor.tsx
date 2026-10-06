import React from "react";
import { IQuestionOption, ISurveyQuestion, QuestionType } from "../../../types";
import {
  Plus,
  Trash2,
  GripVertical,
  Star,
  CircleDot,
  CheckSquare,
  ToggleLeft,
  MessageSquare,
  Hash,
  Calendar,
  Sparkles,
  Bot,
  HelpCircle,
} from "lucide-react";

interface QuestionEditorProps {
  question: ISurveyQuestion;
  onChange: (updates: Partial<ISurveyQuestion>) => void;
}

export const QuestionEditor: React.FC<QuestionEditorProps> = ({
  question,
  onChange,
}) => {
  const options = question.options || [];

  const handleAddOption = () => {
    const nextIdx = options.length + 1;
    const newOpt: IQuestionOption = {
      value: `opt_${Date.now().toString().slice(-4)}`,
      label: `Option ${nextIdx}`,
    };
    onChange({ options: [...options, newOpt] });
  };

  const handleUpdateOption = (index: number, field: "label" | "value", val: string) => {
    const updated = [...options];
    updated[index] = { ...updated[index], [field]: val };
    if (field === "label" && (!updated[index].value || updated[index].value.startsWith("opt_"))) {
      updated[index].value = val.toLowerCase().replace(/[^a-z0-9]/g, "_");
    }
    onChange({ options: updated });
  };

  const handleRemoveOption = (index: number) => {
    onChange({ options: options.filter((_, idx) => idx !== index) });
  };

  return (
    <div className="p-4 d-flex flex-column gap-4 bg-white h-100 overflow-y-auto">
      {/* Question Prompt Text Input */}
      <div>
        <label className="form-label small fw-bold text-dark d-flex justify-content-between">
          <span>Question Prompt (Spoken / Displayed Text)</span>
          <span className="text-muted fw-normal" style={{ fontSize: "11px" }}>Required</span>
        </label>
        <textarea
          className="form-control"
          rows={3}
          placeholder="e.g. Do you remember purchasing a Gillette Guard razor?"
          value={question.text}
          onChange={(e) => onChange({ text: e.target.value })}
          style={{ fontSize: "15px", fontWeight: 600 }}
        />
      </div>

      {/* Description / Subtext */}
      <div>
        <label className="form-label small fw-semibold text-secondary">
          Subtext / Interviewer Context Note (Optional)
        </label>
        <input
          type="text"
          className="form-control form-control-sm"
          placeholder="e.g. Filter question to verify respondent eligibility"
          value={question.description || ""}
          onChange={(e) => onChange({ description: e.target.value })}
        />
      </div>

      {/* Dynamic Type Specific Content */}
      <div className="card border bg-light-subtle p-3">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <span className="fw-bold small text-dark d-flex align-items-center gap-1">
            <span>Response Configuration:</span>
            <span className="badge bg-primary-subtle text-primary border">{question.type.replace("_", " ")}</span>
          </span>
        </div>

        {/* 1. SINGLE & MULTIPLE CHOICE */}
        {(question.type === QuestionType.SINGLE_CHOICE ||
          question.type === QuestionType.MULTIPLE_CHOICE) && (
          <div className="d-flex flex-column gap-2">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="text-secondary small fw-semibold">Choices / Options ({options.length})</span>
              <button
                type="button"
                className="btn btn-outline-primary btn-sm py-1 px-2 d-flex align-items-center gap-1"
                onClick={handleAddOption}
                style={{ fontSize: "12px" }}
              >
                <Plus size={13} />
                <span>Add Option</span>
              </button>
            </div>

            {options.map((opt, idx) => (
              <div key={idx} className="d-flex align-items-center gap-2">
                <span className="text-muted small fw-bold" style={{ width: "20px" }}>
                  {idx + 1}.
                </span>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Option Label (e.g. Gillette Guard)"
                  value={opt.label}
                  onChange={(e) => handleUpdateOption(idx, "label", e.target.value)}
                />
                <input
                  type="text"
                  className="form-control form-control-sm font-monospace text-muted"
                  placeholder="Key value"
                  style={{ maxWidth: "160px", fontSize: "11px" }}
                  value={opt.value}
                  onChange={(e) => handleUpdateOption(idx, "value", e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn-outline-danger btn-sm p-1"
                  disabled={options.length <= 2}
                  onClick={() => handleRemoveOption(idx)}
                  title="Delete Option"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 2. YES / NO */}
        {question.type === QuestionType.YES_NO && (
          <div className="d-flex flex-column gap-2">
            <span className="text-secondary small">Binary Choice Response:</span>
            <div className="d-flex gap-3">
              <div className="p-3 border rounded-3 bg-white flex-grow-1 text-center fw-bold text-success">
                ✓ Yes (Affirmative)
              </div>
              <div className="p-3 border rounded-3 bg-white flex-grow-1 text-center fw-bold text-danger">
                ✕ No (Negative / End Option)
              </div>
            </div>
          </div>
        )}

        {/* 3. RATING SCALE */}
        {question.type === QuestionType.RATING && (
          <div className="d-flex flex-column gap-2">
            <span className="text-secondary small">Rating Scale Preview:</span>
            <div className="d-flex justify-content-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((score) => (
                <div
                  key={score}
                  className="rounded-circle border bg-white p-3 d-flex align-items-center justify-content-center fw-bold text-primary shadow-xs"
                  style={{ width: "42px", height: "42px" }}
                >
                  {score}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. TEXT / OPEN-ENDED */}
        {question.type === QuestionType.TEXT && (
          <div className="d-flex flex-column gap-2">
            <span className="text-secondary small">Open-ended Voice / Text Feedback:</span>
            <textarea
              className="form-control form-control-sm"
              rows={2}
              placeholder="User answers verbally in natural language. Speech model will transcribe and normalize intent..."
              disabled
            />
          </div>
        )}

        {/* 5. NUMBER */}
        {question.type === QuestionType.NUMBER && (
          <div className="d-flex flex-column gap-2">
            <span className="text-secondary small">Numerical Input:</span>
            <input type="number" className="form-control form-control-sm" placeholder="e.g. 25" disabled />
          </div>
        )}

        {/* 6. AI CLASSIFICATION / INTENT */}
        {(question.type === QuestionType.AI_CLASSIFICATION || question.type === QuestionType.AI_INTENT) && (
          <div className="d-flex flex-column gap-2">
            <div className="d-flex align-items-center gap-1 text-purple fw-bold small">
              <Bot size={16} />
              <span>Zero-Shot AI Intent Classification</span>
            </div>
            <p className="text-secondary small mb-0">
              The AI conversational model will categorize speech into positive, negative, or custom defined intent tags.
            </p>
          </div>
        )}
      </div>

      {/* AI Extraction Guidance Note */}
      <div className="card border-info-subtle bg-info-subtle p-3">
        <div className="d-flex align-items-center gap-2 mb-1 text-info fw-bold small">
          <Sparkles size={15} />
          <span>Conversational AI Voice Extraction Instructions</span>
        </div>
        <textarea
          className="form-control form-control-sm bg-white"
          rows={2}
          placeholder="e.g. If the user mentions hesitation about price, probe politely on expected price point."
          value={question.aiExtractionInstructions || ""}
          onChange={(e) => onChange({ aiExtractionInstructions: e.target.value })}
        />
      </div>
    </div>
  );
};
