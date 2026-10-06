import React, { useState } from "react";
import {
  ConditionOperator,
  IQuestionConditionGroup,
  IQuestionConditionRule,
  ISurveyQuestion,
  QuestionAction,
} from "../../../types";
import {
  GitBranch,
  Plus,
  Trash2,
  X,
  CornerDownRight,
  ShieldAlert,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

interface ConditionBuilderProps {
  question: ISurveyQuestion;
  allQuestions: ISurveyQuestion[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (conditionGroups: IQuestionConditionGroup[]) => void;
}

export const ConditionBuilder: React.FC<ConditionBuilderProps> = ({
  question,
  allQuestions,
  isOpen,
  onClose,
  onSave,
}) => {
  const otherQuestions = allQuestions.filter((q) => q.questionId !== question.questionId);

  const [groups, setGroups] = useState<IQuestionConditionGroup[]>(
    question.conditionGroups ? JSON.parse(JSON.stringify(question.conditionGroups)) : []
  );

  if (!isOpen) return null;

  // Add new group
  const handleAddGroup = () => {
    const newGroup: IQuestionConditionGroup = {
      id: `group_${Date.now()}`,
      logic: "AND",
      rules: [
        {
          id: `rule_${Date.now()}`,
          questionId: question.questionId,
          operator: "equals",
          value: question.options && question.options.length > 0 ? question.options[0].value : "yes",
        },
      ],
      action: QuestionAction.NEXT,
      nextQuestionId: otherQuestions.length > 0 ? otherQuestions[0].questionId : "",
    };
    setGroups([...groups, newGroup]);
  };

  const handleRemoveGroup = (groupIdx: number) => {
    setGroups(groups.filter((_, idx) => idx !== groupIdx));
  };

  const handleAddRuleToGroup = (groupIdx: number) => {
    const updated = [...groups];
    const newRule: IQuestionConditionRule = {
      id: `rule_${Date.now()}`,
      questionId: question.questionId,
      operator: "equals",
      value: "",
    };
    updated[groupIdx].rules.push(newRule);
    setGroups(updated);
  };

  const handleRemoveRule = (groupIdx: number, ruleIdx: number) => {
    const updated = [...groups];
    updated[groupIdx].rules = updated[groupIdx].rules.filter((_, idx) => idx !== ruleIdx);
    setGroups(updated);
  };

  const handleUpdateRule = (
    groupIdx: number,
    ruleIdx: number,
    field: keyof IQuestionConditionRule,
    val: any
  ) => {
    const updated = [...groups];
    updated[groupIdx].rules[ruleIdx] = {
      ...updated[groupIdx].rules[ruleIdx],
      [field]: val,
    };
    setGroups(updated);
  };

  const handleUpdateGroupAction = (groupIdx: number, action: QuestionAction, nextQuestionId?: string) => {
    const updated = [...groups];
    updated[groupIdx].action = action;
    if (action === QuestionAction.NEXT) {
      updated[groupIdx].nextQuestionId = nextQuestionId || (otherQuestions[0]?.questionId || "");
    } else {
      updated[groupIdx].nextQuestionId = undefined;
    }
    setGroups(updated);
  };

  const handleSave = () => {
    onSave(groups);
    onClose();
  };

  return (
    <div
      className="modal fade show d-block"
      tabIndex={-1}
      style={{ backgroundColor: "rgba(15, 23, 42, 0.75)", zIndex: 1060 }}
      onClick={onClose}
    >
      <div
        className="modal-dialog modal-dialog-centered modal-lg"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "860px" }}
      >
        <div className="modal-content shadow-lg border-0">
          {/* Header */}
          <div className="modal-header border-bottom py-3">
            <div className="d-flex align-items-center gap-2">
              <div className="p-2 rounded bg-primary-subtle text-primary">
                <GitBranch size={18} />
              </div>
              <div>
                <h5 className="modal-title fs-6 fw-bold mb-0">
                  Conditional Logic Builder & Branching
                </h5>
                <span className="text-muted small" style={{ fontSize: "11px" }}>
                  Source: Q ({question.questionId}) — "{question.text}"
                </span>
              </div>
            </div>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>

          {/* Body */}
          <div className="modal-body p-4 overflow-y-auto" style={{ maxHeight: "70vh" }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <span className="text-secondary small fw-bold text-uppercase">
                Active Logic Groups ({groups.length})
              </span>
              <button
                className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
                onClick={handleAddGroup}
              >
                <Plus size={14} />
                <span>Add Logic Group</span>
              </button>
            </div>

            {groups.length === 0 ? (
              <div className="card border-dashed p-4 text-center my-3 bg-light-subtle">
                <GitBranch size={28} className="text-muted mx-auto mb-2" />
                <h6 className="fw-bold small mb-1">No custom branching rules</h6>
                <p className="text-secondary small mb-3">
                  By default, respondents will move sequentially to the next question.
                </p>
                <div>
                  <button className="btn btn-primary btn-sm px-3" onClick={handleAddGroup}>
                    Create Branch Rule
                  </button>
                </div>
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {groups.map((group, gIdx) => (
                  <div key={group.id || gIdx} className="card border p-3 shadow-xs bg-light-subtle">
                    {/* Group Header */}
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div className="d-flex align-items-center gap-2">
                        <span className="badge bg-purple text-white">GROUP #{gIdx + 1}</span>
                        <div className="btn-group btn-group-sm">
                          <button
                            type="button"
                            className={`btn btn-sm py-0 px-2 ${group.logic === "AND" ? "btn-primary" : "btn-outline-secondary"}`}
                            onClick={() => {
                              const updated = [...groups];
                              updated[gIdx].logic = "AND";
                              setGroups(updated);
                            }}
                          >
                            AND (All match)
                          </button>
                          <button
                            type="button"
                            className={`btn btn-sm py-0 px-2 ${group.logic === "OR" ? "btn-primary" : "btn-outline-secondary"}`}
                            onClick={() => {
                              const updated = [...groups];
                              updated[gIdx].logic = "OR";
                              setGroups(updated);
                            }}
                          >
                            OR (Any match)
                          </button>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm p-1"
                        onClick={() => handleRemoveGroup(gIdx)}
                        title="Delete Group"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    {/* Rules inside Group */}
                    <div className="d-flex flex-column gap-2 mb-3">
                      {group.rules.map((rule, rIdx) => {
                        const targetQ = allQuestions.find((q) => q.questionId === rule.questionId) || question;

                        return (
                          <div
                            key={rule.id || rIdx}
                            className="p-2 border rounded-2 bg-white d-flex align-items-center gap-2"
                          >
                            <span className="text-muted small fw-bold" style={{ width: "24px" }}>
                              IF
                            </span>

                            {/* Question Selector */}
                            <select
                              className="form-select form-select-sm"
                              value={rule.questionId}
                              onChange={(e) => handleUpdateRule(gIdx, rIdx, "questionId", e.target.value)}
                              style={{ maxWidth: "200px" }}
                            >
                              {allQuestions.map((q) => (
                                <option key={q.questionId} value={q.questionId}>
                                  Q ({q.questionId}): {q.text.substring(0, 24)}...
                                </option>
                              ))}
                            </select>

                            {/* Operator Selector */}
                            <select
                              className="form-select form-select-sm"
                              value={rule.operator}
                              onChange={(e) => handleUpdateRule(gIdx, rIdx, "operator", e.target.value as ConditionOperator)}
                              style={{ maxWidth: "150px" }}
                            >
                              <option value="equals">Equals (=)</option>
                              <option value="not_equals">Not Equals (!=)</option>
                              <option value="contains">Contains</option>
                              <option value="not_contains">Not Contains</option>
                              <option value="greater_than">Greater Than (&gt;)</option>
                              <option value="less_than">Less Than (&lt;)</option>
                              <option value="greater_than_or_equal">&gt;= (Greater/Equal)</option>
                              <option value="less_than_or_equal">&lt;= (Less/Equal)</option>
                              <option value="in">In List</option>
                              <option value="not_in">Not In List</option>
                            </select>

                            {/* Value Selector / Input */}
                            {targetQ.options && targetQ.options.length > 0 ? (
                              <select
                                className="form-select form-select-sm"
                                value={String(rule.value)}
                                onChange={(e) => handleUpdateRule(gIdx, rIdx, "value", e.target.value)}
                              >
                                {targetQ.options.map((opt, oIdx) => (
                                  <option key={oIdx} value={opt.value}>
                                    {opt.label} ({opt.value})
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                placeholder="Value to match"
                                value={String(rule.value)}
                                onChange={(e) => handleUpdateRule(gIdx, rIdx, "value", e.target.value)}
                              />
                            )}

                            {group.rules.length > 1 && (
                              <button
                                type="button"
                                className="btn btn-outline-danger btn-sm p-1"
                                onClick={() => handleRemoveRule(gIdx, rIdx)}
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        );
                      })}

                      <button
                        type="button"
                        className="btn btn-link text-primary p-0 small text-start d-flex align-items-center gap-1"
                        onClick={() => handleAddRuleToGroup(gIdx)}
                        style={{ fontSize: "12px" }}
                      >
                        <Plus size={13} />
                        <span>Add Another Condition to this group</span>
                      </button>
                    </div>

                    {/* THEN Action Row */}
                    <div className="p-3 border rounded-3 bg-white border-primary-subtle">
                      <div className="row g-2 align-items-center">
                        <div className="col-auto">
                          <span className="fw-bold small text-primary d-flex align-items-center gap-1">
                            <CornerDownRight size={14} /> THEN:
                          </span>
                        </div>
                        <div className="col-auto">
                          <select
                            className="form-select form-select-sm"
                            value={group.action}
                            onChange={(e) =>
                              handleUpdateGroupAction(
                                gIdx,
                                e.target.value as QuestionAction,
                                group.nextQuestionId
                              )
                            }
                          >
                            <option value={QuestionAction.NEXT}>Jump To Question →</option>
                            <option value={QuestionAction.END_SURVEY}>⛔ END SURVEY IMMEDIATELY</option>
                          </select>
                        </div>

                        {group.action === QuestionAction.NEXT ? (
                          <div className="col">
                            <select
                              className="form-select form-select-sm"
                              value={group.nextQuestionId || ""}
                              onChange={(e) =>
                                handleUpdateGroupAction(gIdx, QuestionAction.NEXT, e.target.value)
                              }
                            >
                              <option value="" disabled>Select Target Question</option>
                              {otherQuestions.map((oq) => (
                                <option key={oq.questionId} value={oq.questionId}>
                                  Q ({oq.questionId}): {oq.text.substring(0, 45)}...
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <div className="col">
                            <span className="badge bg-danger text-white px-2 py-1">
                              Terminates interview & logs answers
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="modal-footer border-top bg-light py-2">
            <button type="button" className="btn btn-sm btn-outline-secondary px-3" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="btn btn-sm btn-primary px-4" onClick={handleSave}>
              Save Branching Logic
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
