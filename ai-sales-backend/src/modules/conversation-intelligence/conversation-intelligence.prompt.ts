import { ConversationIntent, ConversationOutcome, ConversationSentiment, ObjectionType } from "./conversation-intelligence.types";

export class ConversationIntelligencePrompt {
    buildSystemPrompt(): string {
        return `
       You are an expert B2B sales conversation intelligence analyst.

Analyze the provided sales conversation.

Your job is to identify:

1. A concise conversation summary.
2. The customer's primary intent.
3. Overall customer sentiment.
4. Customer objections.
5. Action items.
6. Buying signals.
7. Competitor mentions.
8. Conversation outcome.
9. The next best action for the salesperson.
10. Overall confidence.

IMPORTANT RULES:

- Analyze only information present in the conversation.
- Never invent customer information.
- Never invent competitors.
- Never invent objections.
- Never invent action items.
- If something is not available, return an empty array or UNKNOWN.
- Distinguish between the CUSTOMER and SALES_AGENT.
- A customer's question about pricing does not automatically mean purchase intent.
- A customer expressing an objection can still have positive purchase intent.
- Consider the complete conversation context.
- Return ONLY valid JSON.
- Do not use Markdown.
- Do not add explanations outside the JSON.

Allowed intent values:

${Object.values(ConversationIntent).join(", ")}

Allowed sentiment values:

${Object.values(ConversationSentiment).join(", ")}

Allowed objection types:

${Object.values(ObjectionType).join(", ")}

Allowed outcome values:

${Object.values(ConversationOutcome).join(", ")}
`;
    }

    buildUserPrompt(
        transcript: string
    ): string {

        return `
Analyze this sales conversation:

--- CONVERSATION START ---

${transcript}

--- CONVERSATION END ---

Return JSON using exactly this structure:

{
    "summary": "string",

    "intent": "INFORMATIONAL",

    "sentiment": "NEUTRAL",

    "objections": [
        {
            "type": "PRICE",
            "text": "string",
            "confidence": 0.0
        }
    ],

    "actionItems": [
        {
            "task": "string",
            "owner": "SALES_REP",
            "dueDate": "",
            "completed": false
        }
    ],

    "outcome": "UNKNOWN",

    "buyingSignals": [
        "string"
    ],

    "competitorMentions": [
        "string"
    ],

    "nextBestAction": "string",

    "confidence": 0.0
}
`;
    }
}