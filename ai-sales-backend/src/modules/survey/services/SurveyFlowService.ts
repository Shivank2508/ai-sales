import {
    ISurveyQuestion,
    IQuestionCondition,
    QuestionAction,
} from "../models/SurveyQuestion.model";

export interface FlowResult {
    action: QuestionAction;
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

            const answer =
                answers[condition.field];

            if (
                this.matches(
                    condition,
                    answer
                )
            ) {
                return {
                    action: condition.action,
                    nextQuestionId:
                        condition.nextQuestionId,
                };
            }
        }

        return {
            action: QuestionAction.NEXT,
        };
    }

    private matches(
        condition: IQuestionCondition,
        answer: unknown
    ): boolean {

        switch (condition.operator) {

            case "equals":
                return (
                    String(answer) ===
                    String(condition.value)
                );

            case "not_equals":
                return (
                    String(answer) !==
                    String(condition.value)
                );

            case "contains":
                return String(answer)
                    .toLowerCase()
                    .includes(
                        String(condition.value)
                            .toLowerCase()
                    );

            case "not_contains":
                return !String(answer)
                    .toLowerCase()
                    .includes(
                        String(condition.value)
                            .toLowerCase()
                    );

            case "in":
                return (
                    Array.isArray(condition.value) &&
                    condition.value.includes(
                        String(answer)
                    )
                );

            case "not_in":
                return (
                    Array.isArray(condition.value) &&
                    !condition.value.includes(
                        String(answer)
                    )
                );

            default:
                return false;
        }
    }
}