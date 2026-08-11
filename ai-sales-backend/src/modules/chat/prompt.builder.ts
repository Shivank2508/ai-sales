import { RetrievedChunk } from "./retriever.service";
import { ChatMessage } from "./chat.types";

export interface BuildPromptInput {

    question: string;

    history: ChatMessage[];

    context: RetrievedChunk[];
}

export class PromptBuilder {

    build(
        input: BuildPromptInput
    ) {

        const history =
            input.history
                .map(
                    message =>
                        `${message.role}: ${message.content}`
                )
                .join("\n");

        const context =
            input.context
                .map(
                    (chunk, index) =>
                        `[${index + 1}]
${chunk.content}`
                )
                .join("\n\n");

        return `You are an AI Sales Assistant.

Answer ONLY using the provided knowledge.

If the answer is unavailable, say:

"I couldn't find that information in the knowledge base."

Conversation History

${history}

Knowledge Base

${context}

Customer Question

${input.question}

Answer:
`;
    }

}