import { ConversationTranscript } from "./conversation-intelligence.types";


export class TranscriptService {
    buildTranscript(conversation: { _id: unknown; productId: unknown; messages?: Array<{ role: string; content: string; createdAt?: Date }> }): ConversationTranscript {
        const messages = (conversation.messages ?? [])
            .filter(message => {
                const role = message.role?.toLowerCase();
                return (role === "user" || role === "assistant") && Boolean(message.content?.trim());
            })
            .map(message => ({
                role: message.role.toLowerCase() as "user" | "assistant",
                content: message.content.trim(),
                createdAt: message.createdAt,
            }));

        const text = messages.map(message => {
            const speaker = message.role === "user" ? "CUSTOMER" : "SALES_AGENT";
            return `${speaker}: ${message.content}`;
        }).join("\n");

        return {
            conversationId: String(conversation._id),
            productId: String(conversation.productId),
            messages,
            text
        };
    }
}