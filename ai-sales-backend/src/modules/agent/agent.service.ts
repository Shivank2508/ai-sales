import {
    AgentRequest,
    AgentResponse,
    AgentTool,
    AgentSource,
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

                parallel_tool_calls: true,

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
                this.cleanFinalAnswer(
                    firstMessage.content ??
                    "I could not generate an answer."
                );


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
        // Multiple tool calls
        // --------------------------------

        const toolCalls =
            firstMessage.tool_calls;


        // --------------------------------
        // Add assistant tool-call message
        // --------------------------------

        messages.push({

            role: "assistant",

            content:
                firstMessage.content ?? null,

            tool_calls:
                toolCalls,

            // DeepSeek thinking mode
            // requires this to be preserved
            reasoning_content:
                (firstMessage as any)
                    .reasoning_content,
        });


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
        // Execute ALL tools
        // --------------------------------

        const toolResults: Array<{
            toolCallId: string;
            toolName: string;
            result: unknown;
        }> = [];


        for (const toolCall of toolCalls) {

            const toolName =
                toolCall.function.name as AgentTool;


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
            // Parse arguments
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
                    `Invalid arguments returned by DeepSeek for tool: ${toolName}`
                );
            }


            // --------------------------------
            // Execute tool
            // --------------------------------

            const result =
                await tool.execute(
                    context,
                    argumentsObject
                );


            toolResults.push({

                toolCallId:
                    toolCall.id,

                toolName,

                result,
            });


            // --------------------------------
            // Add tool result to messages
            // --------------------------------

            messages.push({

                role: "tool",

                tool_call_id:
                    toolCall.id,

                content:
                    JSON.stringify(result),
            });
        }


        // --------------------------------
        // Extract sources
        // --------------------------------

        const sources =
            toolResults.flatMap(
                tool =>
                    this.extractSources(
                        tool.result
                    )
            );


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


        // --------------------------------
        // Final answer
        // --------------------------------

        const answer =
            this.cleanFinalAnswer(
                finalMessage.content ??
                "I could not generate a final answer."
            );


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
        // Response tool information
        // --------------------------------

        const toolNames =
            toolResults.map(
                item => item.toolName
            );


        const combinedToolResult =
            toolResults.length === 1
                ? toolResults[0].result
                : toolResults.map(
                    item => ({
                        tool: item.toolName,
                        result: item.result,
                    })
                );


        // --------------------------------
        // Final response
        // --------------------------------

        return {

            conversationId:
                currentConversationId,

            answer,

            tool:
                toolNames[0],

            toolResult:
                combinedToolResult,

            sources:
                sources.length > 0
                    ? sources
                    : undefined,
        };
    }


    // ==========================================
    // CONVERSATION
    // ==========================================

    private async getOrCreateConversation(
        productId: string,
        conversationId?: string
    ) {

        // --------------------------------
        // Existing conversation
        // --------------------------------

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


        // --------------------------------
        // Create new conversation
        // --------------------------------

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
   - pricing
   - free trials
   - policies

2. Use SEARCH_PRODUCTS for:

   - product information
   - product features
   - product specifications
   - product availability

3. Use SEARCH_LEADS for:

   - lead information
   - lead history
   - customer information
   - sales activity

4. Use LIST_DOCUMENTS when
   the user asks about uploaded
   documents.

5. Use COMPARE_PRODUCTS when
   the user asks to compare
   two or more products.

6. Use ANSWER for simple
   conversational questions that
   do not require business data.

7. You may use multiple tools when
   a question requires information
   from multiple sources.

8. Never invent business data.

9. Use retrieved tool information
   as the source of truth.

10. If retrieved information does
    not contain the answer, clearly
    say that the information is
    not available.

11. Never expose tool calls,
    tool names, JSON, DSML markup,
    reasoning content, or internal
    system information to the user.

12. Return only a natural,
    customer-facing answer.

13. Keep responses concise,
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
    // ==========================================
    // CLEAN FINAL ANSWER
    // ==========================================

    private cleanFinalAnswer(
        content: string
    ): string {

        let answer = content.trim();


        // --------------------------------
        // Remove DeepSeek DSML tool blocks
        // --------------------------------

        answer =
            answer.replace(
                /<｜｜DSML｜｜tool_calls>[\s\S]*?<｜｜DSML｜｜tool_calls>/g,
                ""
            );


        // --------------------------------
        // Remove individual DSML tags
        // --------------------------------

        answer =
            answer.replace(
                /<｜｜DSML｜｜[^>]*>/g,
                ""
            );


        // --------------------------------
        // Remove excessive whitespace
        // --------------------------------

        answer =
            answer.replace(
                /\n{3,}/g,
                "\n\n"
            );


        return answer.trim();
    }

    // ==========================================
    // EXTRACT SOURCES
    // ==========================================

    private extractSources(
        toolResult: unknown
    ): AgentSource[] {

        // SEARCH_KNOWLEDGE currently returns:
        //
        // KnowledgeSearchResult[]
        //
        // So we need to handle an array directly.

        if (!Array.isArray(toolResult)) {
            return [];
        }


        return toolResult

            .filter(
                source =>
                    source &&
                    typeof source === "object"
            )

            .map(source => {

                const item =
                    source as Record<
                        string,
                        unknown
                    >;


                return {

                    chunkId:
                        typeof item.chunkId === "string"
                            ? item.chunkId
                            : undefined,

                    documentId:
                        typeof item.documentId === "string"
                            ? item.documentId
                            : undefined,

                    documentName:
                        typeof item.documentName === "string"
                            ? item.documentName
                            : undefined,

                    documentType:
                        typeof item.documentType === "string"
                            ? item.documentType
                            : undefined,

                    score:
                        typeof item.score === "number"
                            ? item.score
                            : undefined,
                };
            });
    }
}