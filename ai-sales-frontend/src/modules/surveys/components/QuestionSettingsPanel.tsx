import React from "react";
import { ISurveyQuestion, QuestionType } from "../../../types";
import { Sliders, HelpCircle, Shield, Bot } from "lucide-react";

interface QuestionSettingsPanelProps {
  question: ISurveyQuestion;
  onChange: (updates: Partial<ISurveyQuestion>) => void;
}

export const QuestionSettingsPanel: React.FC<QuestionSettingsPanelProps> = ({
  question,
  onChange,
}) => {
  return (
    <div className="p-3 d-flex flex-column gap-3 bg-white border-start h-100 overflow-y-auto">
      {/* Header */}
      <div className="d-flex align-items-center gap-2 pb-2 border-bottom">
        <Sliders size={16} className="text-primary" />
        <span className="fw-bold small text-dark">Question Settings</span>
      </div>

      {/* 1. Question Type Selector */}
      <div>
        <label className="form-label small fw-bold text-dark">Question Type</label>
        <select
          className="form-select form-select-sm"
          value={question.type}
          onChange={(e) => {
            const newType = e.target.value as QuestionType;
            let options = question.options;
            if (newType === QuestionType.YES_NO) {
              options = [
                { value: "yes", label: "Yes" },
                { value: "no", label: "No" },
              ];
            } else if (
              (newType === QuestionType.SINGLE_CHOICE || newType === QuestionType.MULTIPLE_CHOICE) &&
              (!options || options.length === 0)
            ) {
              options = [
                { value: "opt_1", label: "Option 1" },
                { value: "opt_2", label: "Option 2" },
              ];
            }
            onChange({ type: newType, options });
          }}
        >
          <option value={QuestionType.YES_NO}>Yes / No (Binary)</option>
          <option value={QuestionType.SINGLE_CHOICE}>Single Choice (Radio)</option>
          <option value={QuestionType.MULTIPLE_CHOICE}>Multiple Choice (Checkboxes)</option>
          <option value={QuestionType.RATING}>Rating Scale (1-5 / 1-10)</option>
          <option value={QuestionType.TEXT}>Open Text / Spoken Voice</option>
          <option value={QuestionType.NUMBER}>Number / Numeric</option>
          <option value={QuestionType.DATE}>Date</option>
          <option value={QuestionType.AI_CLASSIFICATION}>AI Classification</option>
          <option value={QuestionType.AI_INTENT}>AI Intent Extraction</option>
        </select>
      </div>

      {/* 2. Required Toggle */}
      <div className="form-check form-switch d-flex justify-content-between align-items-center ps-0 border-bottom pb-2">
        <label className="form-check-label small fw-semibold" htmlFor="requiredSwitch">
          Required Question
        </label>
        <input
          className="form-check-input ms-0"
          type="checkbox"
          id="requiredSwitch"
          checked={question.required}
          onChange={(e) => onChange({ required: e.target.checked })}
        />
      </div>

      {/* 3. Multiple Choice Constraints */}
      {question.type === QuestionType.MULTIPLE_CHOICE && (
        <div className="d-flex flex-column gap-2 border-bottom pb-2">
          <span className="small fw-bold text-dark">Selection Constraints</span>
          <div className="row g-2">
            <div className="col-6">
              <label className="form-label text-muted small" style={{ fontSize: "11px" }}>Min Selections</label>
              <input
                type="number"
                className="form-control form-control-sm"
                min={0}
                value={question.minSelections || 0}
                onChange={(e) => onChange({ minSelections: Number(e.target.value) })}
              />
            </div>
            <div className="col-6">
              <label className="form-label text-muted small" style={{ fontSize: "11px" }}>Max Selections</label>
              <input
                type="number"
                className="form-control form-control-sm"
                min={1}
                value={question.maxSelections || 10}
                onChange={(e) => onChange({ maxSelections: Number(e.target.value) })}
              />
            </div>
          </div>
        </div>
      )}

      {/* 4. Min/Max for Numbers */}
      {question.type === QuestionType.NUMBER && (
        <div className="d-flex flex-column gap-2 border-bottom pb-2">
          <span className="small fw-bold text-dark">Number Range</span>
          <div className="row g-2">
            <div className="col-6">
              <label className="form-label text-muted small" style={{ fontSize: "11px" }}>Min Value</label>
              <input
                type="number"
                className="form-control form-control-sm"
                value={question.minValue ?? 0}
                onChange={(e) => onChange({ minValue: Number(e.target.value) })}
              />
            </div>
            <div className="col-6">
              <label className="form-label text-muted small" style={{ fontSize: "11px" }}>Max Value</label>
              <input
                type="number"
                className="form-control form-control-sm"
                value={question.maxValue ?? 100}
                onChange={(e) => onChange({ maxValue: Number(e.target.value) })}
              />
            </div>
          </div>
        </div>
      )}

      {/* 5. Special Options: "Don't know" and "Prefer not to answer" */}
      <div className="d-flex flex-column gap-2 border-bottom pb-2">
        <span className="small fw-bold text-dark">Skip / Fallback Options</span>
        <div className="form-check">
          <input
            className="form-check-input"
            type="checkbox"
            id="allowDontKnow"
            checked={question.allowDontKnow || false}
            onChange={(e) => onChange({ allowDontKnow: e.target.checked })}
          />
          <label className="form-check-label small" htmlFor="allowDontKnow">
            Allow "Don't know"
          </label>
        </div>
        <div className="form-check">
          <input
            className="form-check-input"
            type="checkbox"
            id="allowPreferNot"
            checked={question.allowPreferNotToAnswer || false}
            onChange={(e) => onChange({ allowPreferNotToAnswer: e.target.checked })}
          />
          <label className="form-check-label small" htmlFor="allowPreferNot">
            Allow "Prefer not to answer"
          </label>
        </div>
      </div>

      {/* 6. Expected Answer Format */}
      <div>
        <label className="form-label small fw-bold text-dark">Expected Output Format</label>
        <input
          type="text"
          className="form-control form-control-sm"
          placeholder="e.g. String, Array, or Enum"
          value={question.expectedAnswerFormat || ""}
          onChange={(e) => onChange({ expectedAnswerFormat: e.target.value })}
        />
      </div>

      {/* 7. Unique Question ID */}
      <div>
        <label className="form-label small fw-bold text-dark">Question Identifier (ID)</label>
        <input
          type="text"
          className="form-control form-control-sm font-monospace text-muted"
          value={question.questionId}
          disabled
        />
        <span className="text-muted" style={{ fontSize: "10.5px" }}>Referenced by condition branching</span>
      </div>
    </div>
  );
};
