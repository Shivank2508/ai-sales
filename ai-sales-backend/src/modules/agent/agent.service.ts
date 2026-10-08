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
import { ProductRepository } from "../products/product.repository";


export class AgentService {

    private readonly model = process.env.DEEPSEEK_MODEL || "deepseek-chat";

    constructor(
        private readonly chatRepository = new ChatRepository(),
        private readonly productRepository = new ProductRepository()
    ) { }


    // ==========================================
    // RUN AGENT
    // ==========================================

    async run(
        request: AgentRequest
    ): Promise<AgentResponse> {

        const {
            productId,
            question,
            conversationId,
            channel = "CHAT",
        } = request;


        // --------------------------------
        // Validate request
        // --------------------------------

        if (!question?.trim()) {
            throw new Error("Question is required.");
        }

        let product: any = null;
        if (productId) {
            try {
                product = await this.productRepository.findById(productId);
            } catch {
                // Ignore invalid ObjectId format
            }
        }

        if (!product) {
            try {
                const allProducts: any[] = await this.productRepository.findAll();
                if (allProducts && allProducts.length > 0) {
                    product = allProducts[0];
                }
            } catch {
                // Ignore
            }
        }

        if (!product) {
            try {
                product = await this.productRepository.create({
                    name: "AI Sales Intelligence Platform",
                    category: "Software",
                    description: "Autonomous AI sales agent, campaign management, lead scoring, and voice intelligence suite.",
                    pricing: {
                        basePrice: 99,
                        currency: "USD",
                        billingCycle: "MONTHLY",
                    },
                    features: ["AI Voice & Chat Agents", "Campaign Automation", "Survey Flow Intelligence", "Conversation Analytics"],
                    status: "ACTIVE" as any,
                } as any);
            } catch {
                product = {
                    _id: "660000000000000000000001",
                    name: "AI Sales Intelligence Platform",
                    category: "Software",
                    description: "AI Sales platform",
                    pricing: { basePrice: 99, currency: "USD" },
                    features: ["AI Agent", "Sales Assistant"],
                    status: "ACTIVE"
                };
            }
        }

        const resolvedProductId = product?._id ? product._id.toString() : "660000000000000000000001";

        // --------------------------------
        // Get / Create conversation
        // --------------------------------

        const conversation =
            await this.getOrCreateConversation(
                resolvedProductId,
                conversationId
            );

        const currentConversationId =
            conversation._id.toString();


        // --------------------------------
        // Load conversation history
        // --------------------------------

        const history =
            await this.chatRepository.getRecentMessages(
                currentConversationId,
                10
            );


        // --------------------------------
        // Build tools
        // --------------------------------

        const tools = this.buildOpenAITools();


        // --------------------------------
        // Build messages
        // --------------------------------

        const messages: any[] = [

            {
                role: "system",

                content:
                    this.buildSystemPrompt(channel),
            },

            {
                role: "system",
                content: `Current product context (use this when the user says "this product"):
            ${JSON.stringify(product)}`,
            },

            ...this.buildHistoryMessages(history),

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
        // IMPORTANT:
        // This MUST come before tool messages
        // --------------------------------

        messages.push({

            role: "assistant",

            content:
                firstMessage.content ?? null,

            tool_calls:
                toolCalls,

            // DeepSeek thinking mode
            // Preserve reasoning content if present
            reasoning_content:
                (firstMessage as any).reasoning_content,
        });


        // --------------------------------
        // Tool context
        // --------------------------------

        const context: ToolContext = {
            productId: resolvedProductId,
            question: question.trim(),
            conversationId: currentConversationId,
            leadId: request.leadId,
            campaignId: request.campaignId,
            surveyId: request.surveyId,
            surveySessionId: request.surveySessionId,
        };


        // --------------------------------
        // Execute ALL tools
        // --------------------------------

        const toolResults: Array<{
            toolCallId: string;
            toolName: string;
            result: unknown;
        }> = [];


        for (const toolCall of (toolCalls as any[])) {

            const toolName =
                (toolCall.function?.name || (toolCall as any).name) as AgentTool;


            const tool =
                toolRegistry.get(toolName);


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
                        toolCall.function?.arguments || (toolCall as any).arguments || "{}"
                    );

            } catch {

                throw new Error(
                    `Invalid arguments returned for tool: ${toolName}`
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
            // Add tool result
            // IMPORTANT:
            // Every tool_call MUST have a
            // matching tool message
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
                ? toolResults[0]?.result
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
                toolNames[0] as AgentTool | undefined,

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
            try {
                const conversation =
                    await this.chatRepository
                        .findConversationById(
                            conversationId
                        );

                if (conversation) {
                    return conversation;
                }
            } catch {
                // Continue to create new
            }
        }

        // --------------------------------
        // Create new conversation
        // --------------------------------

        return this.chatRepository
            .createConversation({
                productId: productId as any,
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

    private buildSystemPrompt(
        channel: "CHAT" | "VOICE" = "CHAT"
    ): string {

        const channelInstructions =
            channel === "VOICE"
                ? `
VOICE MODE:

You are speaking with a sales representative during
a live sales conversation.

Keep responses short and natural for speech.

Rules:

- Prefer 1-3 short paragraphs.
- Avoid markdown headings.
- Avoid tables.
- Avoid long bullet lists.
- Do not use unnecessary formatting.
- Answer directly.
- Keep the response conversational.
- When giving sales advice, provide a practical response
  the salesperson can say to the customer.
- Do not invent product, pricing, competitor, or lead data.
- Use retrieved knowledge as the source of truth.
`
                : `
CHAT MODE:

Provide clear and concise answers suitable for text chat.

You may use markdown when useful.
`;


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

6. Use GET_SURVEY, GET_CURRENT_SURVEY_QUESTION, SUBMIT_SURVEY_ANSWER, GET_SURVEY_PROGRESS, or COMPLETE_SURVEY when interacting with customer surveys or feedback sessions.

7. Use ANSWER for simple
   conversational questions that
   do not require business data.

8. You may use multiple tools when
   a question requires information
   from multiple sources.

9. Never invent business data.

10. Use retrieved tool information
    as the source of truth.

11. If retrieved information does
    not contain the answer, clearly
    say that the information is
    not available.

12. Never expose tool calls,
    tool names, JSON, DSML markup,
    reasoning content, or internal
    system information to the user.

13. Return only a natural,
    customer-facing answer.

14. Keep responses concise,
    useful, and sales-oriented.

${channelInstructions}
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
        // So we handle an array directly.

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