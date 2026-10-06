import React from "react";
import { ISurveyQuestion, QuestionType } from "../../../types";
import {
  Plus,
  ArrowUp,
  ArrowDown,
  Trash2,
  Copy,
  GitBranch,
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
} from "lucide-react";

interface QuestionListPanelProps {
  questions: ISurveyQuestion[];
  selectedQuestionId: string | null;
  onSelectQuestion: (questionId: string) => void;
  onAddQuestion: () => void;
  onDuplicateQuestion: (q: ISurveyQuestion) => void;
  onDeleteQuestion: (questionId: string) => void;
  onMoveQuestion: (fromIdx: number, toIdx: number) => void;
}

export const QuestionListPanel: React.FC<QuestionListPanelProps> = ({
  questions,
  selectedQuestionId,
  onSelectQuestion,
  onAddQuestion,
  onDuplicateQuestion,
  onDeleteQuestion,
  onMoveQuestion,
}) => {
  const getTypeIcon = (type: QuestionType) => {
    switch (type) {
      case QuestionType.RATING:
        return <Star size={13} className="text-warning" />;
      case QuestionType.SINGLE_CHOICE:
        return <CircleDot size={13} className="text-primary" />;
      case QuestionType.MULTIPLE_CHOICE:
        return <CheckSquare size={13} className="text-purple" />;
      case QuestionType.YES_NO:
        return <ToggleLeft size={13} className="text-info" />;
      case QuestionType.TEXT:
        return <MessageSquare size={13} className="text-success" />;
      case QuestionType.NUMBER:
        return <Hash size={13} className="text-warning" />;
      case QuestionType.DATE:
        return <Calendar size={13} className="text-primary" />;
      case QuestionType.AI_CLASSIFICATION:
      case QuestionType.AI_INTENT:
        return <Bot size={13} className="text-purple" />;
      default:
        return <CircleDot size={13} />;
    }
  };

  return (
    <div className="d-flex flex-column h-100 bg-white border-end">
      {/* Header */}
      <div className="p-3 border-bottom d-flex justify-content-between align-items-center bg-light-subtle">
        <div>
          <span className="fw-bold small text-dark d-block">Questions Flow</span>
          <span className="text-muted" style={{ fontSize: "11px" }}>
            {questions.length} Question{questions.length !== 1 ? "s" : ""}
          </span>
        </div>
        <button
          className="btn btn-primary btn-sm d-flex align-items-center gap-1 shadow-xs"
          onClick={onAddQuestion}
          style={{ fontSize: "12px", padding: "4px 10px" }}
        >
          <Plus size={14} />
          <span>Add Question</span>
        </button>
      </div>

      {/* Questions Scrollable List */}
      <div className="flex-grow-1 overflow-y-auto p-2 d-flex flex-column gap-2">
        {questions.length === 0 ? (
          <div className="text-center py-4 text-muted small">
            No questions yet. Click "+ Add Question" to start.
          </div>
        ) : (
          questions.map((q, idx) => {
            const isSelected = q.questionId === selectedQuestionId;
            const hasConditions = q.conditionGroups && q.conditionGroups.length > 0;

            return (
              <div
                key={q.questionId}
                className={`card p-2 border transition-all ${
                  isSelected
                    ? "border-primary bg-primary-subtle shadow-xs"
                    : "border bg-light-subtle hover-bg-light"
                }`}
                style={{ cursor: "pointer", fontSize: "12.5px" }}
                onClick={() => onSelectQuestion(q.questionId)}
              >
                {/* Top Row: Q Number, Type Badge, Handles */}
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <div className="d-flex align-items-center gap-1">
                    <span className={`badge ${isSelected ? "bg-primary text-white" : "bg-dark text-white"} small px-1`}>
                      Q{idx + 1}
                    </span>
                    <span className="d-flex align-items-center gap-1 text-muted" style={{ fontSize: "11px" }}>
                      {getTypeIcon(q.type)}
                      <span>{q.type.replace("_", " ")}</span>
                    </span>
                    {q.required && <span className="text-danger small fw-bold">*</span>}
                  </div>

                  {/* Reorder Buttons */}
                  <div className="d-flex align-items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      className="btn btn-link text-muted p-0"
                      disabled={idx === 0}
                      onClick={() => onMoveQuestion(idx, idx - 1)}
                      title="Move Up"
                    >
                      <ArrowUp size={13} />
                    </button>
                    <button
                      className="btn btn-link text-muted p-0"
                      disabled={idx === questions.length - 1}
                      onClick={() => onMoveQuestion(idx, idx + 1)}
                      title="Move Down"
                    >
                      <ArrowDown size={13} />
                    </button>
                    <button
                      className="btn btn-link text-muted p-0"
                      onClick={() => onDuplicateQuestion(q)}
                      title="Duplicate Question"
                    >
                      <Copy size={13} />
                    </button>
                    <button
                      className="btn btn-link text-danger p-0"
                      onClick={() => onDeleteQuestion(q.questionId)}
                      title="Delete Question"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Question Prompt Text */}
                <div
                  className={`text-truncate-2 fw-semibold ${
                    isSelected ? "text-primary-emphasis" : "text-dark"
                  }`}
                  style={{ fontSize: "12px", lineHeight: 1.3 }}
                >
                  {q.text || "Untitled Question"}
                </div>

                {/* Badges footer */}
                {hasConditions && (
                  <div className="mt-1 d-flex align-items-center gap-1">
                    <span className="badge bg-purple-subtle text-purple border border-purple-subtle" style={{ fontSize: "10px" }}>
                      <GitBranch size={10} className="me-1" />
                      {q.conditionGroups!.length} branch rule(s)
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
