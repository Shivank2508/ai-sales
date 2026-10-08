import { ISurveyQuestion, QuestionType } from "../models/SurveyQuestion.model";
import { LLMService } from "../../../services/llm.service";

export interface ExtractedAnswerResult {
    questionId: string;
    rawAnswer: string;
    normalizedAnswer: any;
    answerType: string;
    confidence: number;
    needsClarification: boolean;
    clarificationPrompt?: string;
    skipped?: boolean;
}

export class AIAnswerExtractionService {
    /**
     * Extracts a structured normalized answer from a natural language user response.
     */
    public async extractAnswer(
        question: ISurveyQuestion,
        rawAnswer: string
    ): Promise<ExtractedAnswerResult> {
        const trimmed = (rawAnswer || "").trim();
        const questionType = (question.type || "text").toLowerCase();

        // 1. Check for explicit skip intents
        if (this.isSkipIntent(trimmed)) {
            return {
                questionId: question.questionId,
                rawAnswer: trimmed,
                normalizedAnswer: null,
                answerType: questionType,
                confidence: 1.0,
                needsClarification: false,
                skipped: true,
            };
        }

        // 2. Fast heuristic extraction for obvious / deterministic cases
        const heuristic = this.tryFastExtraction(question, trimmed);
        if (heuristic && heuristic.confidence >= 0.95) {
            return heuristic;
        }

        // 3. Fallback to LLM for conversational & complex natural language
        try {
            const llmResult = await this.extractWithLLM(question, trimmed);
            return llmResult;
        } catch (error: any) {
            console.warn(`[AIAnswerExtractionService] LLM extraction failed, using heuristic:`, error?.message || error);
            if (heuristic) {
                return heuristic;
            }
            return {
                questionId: question.questionId,
                rawAnswer: trimmed,
                normalizedAnswer: trimmed,
                answerType: questionType,
                confidence: 0.5,
                needsClarification: false,
            };
        }
    }

    /**
     * Detects if the respondent intends to skip or refuse answering
     */
    private isSkipIntent(text: string): boolean {
        const lower = text.toLowerCase().trim();
        const skipKeywords = [
            "skip",
            "pass",
            "next",
            "prefer not to say",
            "no comment",
            "skip this",
            "skip please",
            "leave blank",
            "i don't want to answer",
            "i dont want to answer",
            "decline",
        ];
        return skipKeywords.some((k) => lower === k || lower.startsWith(k));
    }

    /**
     * Fast local rule-based extractor
     */
    private tryFastExtraction(
        question: ISurveyQuestion,
        text: string
    ): ExtractedAnswerResult | null {
        const lower = text.toLowerCase();
        const qType = (question.type || "").toLowerCase();

        switch (qType) {
            case QuestionType.YES_NO:
            case "yes_no": {
                if (/^(yes|yep|yeah|sure|definitely|absolutely|affirmative|true|correct|right|of course)\b/i.test(lower)) {
                    return {
                        questionId: question.questionId,
                        rawAnswer: text,
                        normalizedAnswer: "yes",
                        answerType: "yes_no",
                        confidence: 0.98,
                        needsClarification: false,
                    };
                }
                if (/^(no|nope|nah|not really|never|negative|false|incorrect)\b/i.test(lower)) {
                    return {
                        questionId: question.questionId,
                        rawAnswer: text,
                        normalizedAnswer: "no",
                        answerType: "yes_no",
                        confidence: 0.98,
                        needsClarification: false,
                    };
                }
                break;
            }

            case QuestionType.NUMBER:
            case "number":
            case QuestionType.RATING:
            case "rating":
            case QuestionType.SCALE:
            case "scale": {
                const match = text.match(/-?\d+(\.\d+)?/);
                if (match) {
                    const num = parseFloat(match[0]);
                    return {
                        questionId: question.questionId,
                        rawAnswer: text,
                        normalizedAnswer: num,
                        answerType: qType,
                        confidence: 0.95,
                        needsClarification: false,
                    };
                }
                break;
            }

            case QuestionType.SINGLE_CHOICE:
            case "single_choice": {
                if (question.options && question.options.length > 0) {
                    const exact = question.options.find(
                        (opt) =>
                            opt.value.toLowerCase() === lower ||
                            opt.label.toLowerCase() === lower
                    );
                    if (exact) {
                        return {
                            questionId: question.questionId,
                            rawAnswer: text,
                            normalizedAnswer: exact.value,
                            answerType: "single_choice",
                            confidence: 1.0,
                            needsClarification: false,
                        };
                    }

                    // Fuzzy / substring match against option value or label
                    const partial = question.options.find(
                        (opt) => {
                            const v = opt.value.toLowerCase().replace(/_/g, " ");
                            const l = opt.label.toLowerCase().replace(/^[a-z]\.\s*/i, "");
                            return lower.includes(v) || lower.includes(l) || v.includes(lower);
                        }
                    );
                    if (partial) {
                        return {
                            questionId: question.questionId,
                            rawAnswer: text,
                            normalizedAnswer: partial.value,
                            answerType: "single_choice",
                            confidence: 0.95,
                            needsClarification: false,
                        };
                    }
                }
                break;
            }

            case QuestionType.MULTIPLE_CHOICE:
            case "multiple_choice": {
                if (question.options && question.options.length > 0) {
                    const matched: string[] = [];
                    for (const opt of question.options) {
                        const optVal = opt.value.toLowerCase();
                        const optLabel = opt.label.toLowerCase();
                        if (lower.includes(optVal) || lower.includes(optLabel)) {
                            matched.push(opt.value);
                        }
                    }
                    if (matched.length > 0) {
                        return {
                            questionId: question.questionId,
                            rawAnswer: text,
                            normalizedAnswer: matched,
                            answerType: "multiple_choice",
                            confidence: 0.95,
                            needsClarification: false,
                        };
                    }
                }
                break;
            }

            case QuestionType.TEXT:
            case "text":
            case QuestionType.LONG_TEXT:
            case "long_text": {
                return {
                    questionId: question.questionId,
                    rawAnswer: text,
                    normalizedAnswer: text,
                    answerType: qType,
                    confidence: 1.0,
                    needsClarification: false,
                };
            }
        }

        return null;
    }

    /**
     * Uses LLM to extract structured normalized answer and detect clarification needs
     */
    private async extractWithLLM(
        question: ISurveyQuestion,
        rawAnswer: string
    ): Promise<ExtractedAnswerResult> {
        const systemPrompt = `You are an expert AI Data Extraction and Natural Language Understanding engine for an enterprise AI Sales and Survey platform.
Your job is to analyze a respondent's natural language answer to a survey question and extract a clean, normalized, structured value according to the question's type and configuration.

Rules for question types:
- "text" or "long_text": Keep as string.
- "single_choice": Match respondent's intent to one exact option value from the available options. If ambiguous or unknown, request clarification.
- "multiple_choice": Match all applicable option values as an array of strings (e.g. ["opt1", "opt2"]).
- "yes_no": Normalize strictly to "yes" or "no".
- "number": Extract numeric value (e.g. "about 25 people" -> 25).
- "rating": Extract integer rating score (e.g. "give it a 4 out of 5" -> 4).
- "scale": Extract numeric score within scale range.
- "date": Normalize to ISO format (YYYY-MM-DD) or standardized date string.
- "time": Normalize to HH:MM format (24h).
- "frequency": Normalize to standardized frequency (e.g. "2-3 times a month" -> "2-3/month", "weekly", "daily", "monthly").
- "price": Normalize to numeric price or structured amount (e.g. "$500 per month" -> 500).
- "product": Extract product name or ID from available options.

If the answer is uncertain, contradictory, or cannot be mapped with confidence >= 0.6:
- set "confidence" to the estimated confidence (0.0 to 1.0)
- set "needsClarification" to true
- provide a friendly, polite "clarificationPrompt" asking the user to confirm or choose.

If user explicitly asked to skip:
- set "skipped" to true, "confidence" to 1.0, "needsClarification" to false.`;

        const userPrompt = `Survey Question Context:
- Question ID: "${question.questionId}"
- Text: "${question.text}"
- Type: "${question.type}"
- Required: ${question.required}
- Options: ${JSON.stringify(question.options || [])}

Respondent Raw Answer:
"${rawAnswer}"

Output JSON Format:
{
  "questionId": "${question.questionId}",
  "rawAnswer": "${rawAnswer.replace(/"/g, '\\"')}",
  "normalizedAnswer": <extracted value or array or null>,
  "answerType": "${question.type}",
  "confidence": <number between 0 and 1>,
  "needsClarification": <boolean>,
  "clarificationPrompt": <string or null>,
  "skipped": <boolean>
}`;

        const schema = `{
  "questionId": "string",
  "rawAnswer": "string",
  "normalizedAnswer": "any",
  "answerType": "string",
  "confidence": "number",
  "needsClarification": "boolean",
  "clarificationPrompt": "string | null",
  "skipped": "boolean"
}`;

        const parsed = await LLMService.generateJSON<ExtractedAnswerResult>(
            systemPrompt,
            userPrompt,
            schema
        );

        return {
            questionId: question.questionId,
            rawAnswer: rawAnswer,
            normalizedAnswer: parsed.normalizedAnswer !== undefined ? parsed.normalizedAnswer : rawAnswer,
            answerType: parsed.answerType || (question.type as string) || "text",
            confidence: typeof parsed.confidence === "number" ? Math.min(1, Math.max(0, parsed.confidence)) : 0.9,
            needsClarification: Boolean(parsed.needsClarification),
            clarificationPrompt: parsed.clarificationPrompt || undefined,
            skipped: Boolean(parsed.skipped),
        };
    }
}
