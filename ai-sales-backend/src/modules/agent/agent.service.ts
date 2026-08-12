import {
    AgentRequest,
    AgentResponse,
    AgentTool,
} from "./agent.types";

import {
    ToolContext,
} from "./tools/tool.interface";

import {
    toolRegistry,
} from "./tool.setup";

import {
    ChatRepository,
} from "../chat/chat.repository";

import { deepseek } from "../../services/ai.openai";

export class AgentService {

    private readonly model =
        "deepseek-v4-flash";

    constructor(
        private readonly chatRepository =
            new ChatRepository()
    ) { }

    async run(
        request: AgentRequest
    ): Promise<AgentResponse> {

        const {
            productId,
            question,
            conversationId,
        } = request;

        // --------------------------------
        // Validate request
        // --------------------------------

        if (!productId) {
            throw new Error(
                "Product ID is required."
            );
        }

        if (!question?.trim()) {
            throw new Error(
                "Question is required."
            );
        }

        // --------------------------------
        // Get / Create conversation
        // --------------------------------

        const conversation =
            await this.getOrCreateConversation(
                productId,
                conversationId
            );

        const currentConversationId =
            conversation._id.toString();

        // --------------------------------
        // Load conversation history
        // --------------------------------

        const history =
            await this.chatRepository
                .getRecentMessages(
                    currentConversationId,
                    10
                );

        // --------------------------------
        // Build tools
        // --------------------------------

        const tools =
            this.buildOpenAITools();

        // --------------------------------
        // Build messages
        // --------------------------------

        const messages: any[] = [

            {
                role: "system",

                content:
                    this.buildSystemPrompt(),
            },

            ...this.buildHistoryMessages(
                history
            ),

            {
                role: "user",

                content:
                    question.trim(),
            },
        ];

        // --------------------------------
        // Save user message
        // --------------------------------

        await this.chatRepository.addMessage({

            conversationId:
                currentConversationId,

            role: "USER",

            content:
                question.trim(),
        });

        // --------------------------------
        // FIRST LLM CALL
        // --------------------------------

        const firstResponse =
            await deepseek.chat.completions.create({

                model: this.model,

                messages,

                tools,

                tool_choice: "auto",

                temperature: 0.2,
            });

        const firstMessage =
            firstResponse
                .choices[0]
                ?.message;

        if (!firstMessage) {
            throw new Error(
                "No response received from DeepSeek."
            );
        }

        // --------------------------------
        // No tool required
        // --------------------------------

        if (
            !firstMessage.tool_calls ||
            firstMessage.tool_calls.length === 0
        ) {

            const answer =
                firstMessage.content ??
                "I could not generate an answer.";

            await this.chatRepository.addMessage({

                conversationId:
                    currentConversationId,

                role: "ASSISTANT",

                content:
                    answer,
            });

            return {

                conversationId:
                    currentConversationId,

                answer,
            };
        }

        // --------------------------------
        // Tool call
        // --------------------------------

        const toolCall =
            firstMessage.tool_calls[0];

        const toolName =
            toolCall.function.name
                as AgentTool;

        const tool =
            toolRegistry.get(
                toolName
            );

        if (!tool) {
            throw new Error(
                `Tool not found: ${toolName}`
            );
        }

        // --------------------------------
        // Parse tool arguments
        // --------------------------------

        let argumentsObject:
            Record<string, unknown> = {};

        try {

            argumentsObject =
                JSON.parse(
                    toolCall.function.arguments ||
                    "{}"
                );

        } catch {

            throw new Error(
                "Invalid tool arguments returned by DeepSeek."
            );
        }

        // --------------------------------
        // Tool context
        // --------------------------------

        const context:
            ToolContext = {

            productId,

            question,

            conversationId:
                currentConversationId,
        };

        // --------------------------------
        // Execute tool
        // --------------------------------

        const toolResult =
            await tool.execute(
                context,
                argumentsObject
            );

        // --------------------------------
        // Add assistant tool call
        // --------------------------------

        messages.push({

            role: "assistant",

            content:
                firstMessage.content ?? null,

            tool_calls:
                firstMessage.tool_calls,
        });

        // --------------------------------
        // Add tool result
        // --------------------------------

        messages.push({

            role: "tool",

            tool_call_id:
                toolCall.id,

            content:
                JSON.stringify(
                    toolResult
                ),
        });

        // --------------------------------
        // SECOND LLM CALL
        // --------------------------------

        const finalResponse =
            await deepseek.chat.completions.create({

                model: this.model,

                messages,

                temperature: 0.2,
            });

        const finalMessage =
            finalResponse
                .choices[0]
                ?.message;

        if (!finalMessage) {
            throw new Error(
                "No final response received from DeepSeek."
            );
        }

        const answer =
            finalMessage.content ??
            "I could not generate a final answer.";

        // --------------------------------
        // Save assistant answer
        // --------------------------------

        await this.chatRepository.addMessage({

            conversationId:
                currentConversationId,

            role: "ASSISTANT",

            content:
                answer,
        });

        // --------------------------------
        // Final response
        // --------------------------------

        return {

            conversationId:
                currentConversationId,

            answer,

            tool:
                toolName,

            toolResult,
        };
    }

    // ==========================================
    // CONVERSATION
    // ==========================================

    private async getOrCreateConversation(
        productId: string,
        conversationId?: string
    ) {

        // Existing conversation

        if (conversationId) {

            const conversation =
                await this.chatRepository
                    .findConversationById(
                        conversationId
                    );

            if (!conversation) {
                throw new Error(
                    "Conversation not found."
                );
            }

            // Make sure conversation
            // belongs to this product

            if (
                conversation.productId
                    .toString()
                !== productId
            ) {
                throw new Error(
                    "Conversation does not belong to this product."
                );
            }

            return conversation;
        }

        // Create new conversation

        return this.chatRepository
            .createConversation({

                productId,
            });
    }

    // ==========================================
    // CONVERSATION HISTORY
    // ==========================================

    private buildHistoryMessages(
        history: Array<{
            role: string;
            content: string;
        }>
    ) {

        return history

            .filter(
                message =>
                    message.role === "USER" ||
                    message.role === "ASSISTANT"
            )

            .map(message => ({

                role:
                    message.role === "USER"
                        ? "user"
                        : "assistant",

                content:
                    message.content,
            }));
    }

    // ==========================================
    // SYSTEM PROMPT
    // ==========================================

    private buildSystemPrompt(): string {

        return `
You are an AI Sales Intelligence Agent.

You help sales teams with:

- Product information
- Sales knowledge
- Customer objections
- Competitor information
- Sales leads
- Uploaded documents
- Product comparisons

Use the available tools whenever
business data is required.

Rules:

1. Use SEARCH_KNOWLEDGE for:

   - FAQs
   - objections
   - competitors
   - case studies
   - sales playbooks
   - product knowledge

2. Use SEARCH_PRODUCTS for
   product information.

3. Use SEARCH_LEADS for
   lead information.

4. Use LIST_DOCUMENTS when
   the user asks about uploaded
   documents.

5. Use COMPARE_PRODUCTS when
   the user asks to compare
   two products.

6. Use ANSWER for simple
   conversational questions.

7. Never invent business data.

8. Use retrieved tool information
   as the source of truth.

9. If the retrieved information
   does not contain the answer,
   clearly say that the information
   is not available.

10. Keep responses concise,
    useful, and sales-oriented.
        `.trim();
    }

    // ==========================================
    // OPENAI / DEEPSEEK TOOLS
    // ==========================================

    private buildOpenAITools() {

        const tools =
            toolRegistry.getAll();

        return tools.map(
            tool => ({

                type: "function" as const,

                function: {

                    name:
                        tool.name,

                    description:
                        tool.description,

                    parameters:
                        tool.parameters,
                },
            })
        );
    }
}