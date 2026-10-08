import {
    ISurveyQuestion,
    IQuestionCondition,
    QuestionAction,
} from "../models/SurveyQuestion.model";

export interface FlowResult {
    action: QuestionAction | string;
    nextQuestionId?: string;
}

export class SurveyFlowService {
    evaluateNextQuestion(
        question: ISurveyQuestion,
        answers: Record<string, unknown>
    ): FlowResult {
        if (!question.conditions?.length) {
            return {
                action: QuestionAction.NEXT,
            };
        }

        for (const condition of question.conditions) {
            // Target field can be question.questionId or condition.field
            const targetKey = condition.field || question.questionId;
            const answer = answers[targetKey] !== undefined ? answers[targetKey] : answers[question.questionId];

            if (this.matches(condition, answer)) {
                return {
                    action: condition.action || QuestionAction.NEXT,
                    nextQuestionId: condition.nextQuestionId,
                };
            }
        }

        return {
            action: QuestionAction.NEXT,
        };
    }

    evaluateCondition(
        condition: IQuestionCondition,
        answer: unknown
    ): boolean {
        return this.matches(condition, answer);
    }

    private matches(
        condition: IQuestionCondition,
        answer: unknown
    ): boolean {
        if (condition.operator === "is_empty") {
            return answer === undefined || answer === null || answer === "" || (Array.isArray(answer) && answer.length === 0);
        }

        if (condition.operator === "is_not_empty") {
            return answer !== undefined && answer !== null && answer !== "" && (!Array.isArray(answer) || answer.length > 0);
        }

        if (answer === undefined || answer === null) {
            return false;
        }

        const normalizedAnswer = this.normalizeValue(answer);
        const normalizedExpected = this.normalizeValue(condition.value);

        switch (condition.operator) {
            case "equals":
            case "eq":
            case "==":
            case "===":
                return this.areEqual(normalizedAnswer, normalizedExpected);

            case "not_equals":
            case "neq":
            case "!=":
                return !this.areEqual(normalizedAnswer, normalizedExpected);

            case "contains":
                if (Array.isArray(answer)) {
                    return answer.some((item) => this.matches({ ...condition, operator: "equals" }, item));
                }
                return String(normalizedAnswer)
                    .toLowerCase()
                    .includes(String(normalizedExpected).toLowerCase());

            case "not_contains":
                if (Array.isArray(answer)) {
                    return !answer.some((item) => this.matches({ ...condition, operator: "equals" }, item));
                }
                return !String(normalizedAnswer)
                    .toLowerCase()
                    .includes(String(normalizedExpected).toLowerCase());

            case "in":
                if (Array.isArray(condition.value)) {
                    const expectedList = condition.value.map((v) => this.normalizeValue(v));
                    return expectedList.some((exp) => this.areEqual(normalizedAnswer, exp));
                }
                return false;

            case "not_in":
                if (Array.isArray(condition.value)) {
                    const expectedList = condition.value.map((v) => this.normalizeValue(v));
                    return !expectedList.some((exp) => this.areEqual(normalizedAnswer, exp));
                }
                return true;

            case "greater_than":
            case "gt":
            case ">":
                return Number(normalizedAnswer) > Number(normalizedExpected);

            case "less_than":
            case "lt":
            case "<":
                return Number(normalizedAnswer) < Number(normalizedExpected);

            case "greater_than_or_equal":
            case "gte":
            case ">=":
                return Number(normalizedAnswer) >= Number(normalizedExpected);

            case "less_than_or_equal":
            case "lte":
            case "<=":
                return Number(normalizedAnswer) <= Number(normalizedExpected);

            default:
                return false;
        }
    }

    private normalizeValue(val: unknown): unknown {
        if (typeof val === "boolean") return val;
        if (typeof val === "number") return val;
        if (typeof val === "string") {
            const trimmed = val.trim().toLowerCase();
            if (trimmed === "true" || trimmed === "yes" || trimmed === "y") return true;
            if (trimmed === "false" || trimmed === "no" || trimmed === "n") return false;
            const num = Number(trimmed);
            if (!isNaN(num) && trimmed !== "") return num;
            return trimmed;
        }
        return val;
    }

    private areEqual(a: unknown, b: unknown): boolean {
        if (a === b) return true;
        if (typeof a === "string" && typeof b === "string") {
            return a.trim().toLowerCase() === b.trim().toLowerCase();
        }
        return String(a).toLowerCase() === String(b).toLowerCase();
    }
}