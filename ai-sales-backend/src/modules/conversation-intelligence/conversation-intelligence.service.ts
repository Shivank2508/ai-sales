import mongoose, { Types } from "mongoose";
import { ChatRepository } from "../chat/chat.repository";
import { TranscriptService } from "./transcript.service";
import { ConversationAnalysis, ConversationTranscript } from "./conversation-intelligence.types";
import { ConversationIntelligenceRepository } from "./conversation-intelligence.repository";
import { SurveyResponseRepository } from "../survey/repositories/SurveyResponseRepository";
import { LeadRepositry } from "../leads/lead.repository";
import { LeadModel } from "../leads/lead.model";
import { LLMService } from "../../services/llm.service";

export class ConversationIntelligenceService {
    private readonly chatRepository = new ChatRepository();
    private readonly transcriptService = new TranscriptService();
    private readonly intelligenceRepository = new ConversationIntelligenceRepository();
    private readonly surveyResponseRepository = new SurveyResponseRepository();
    private readonly leadRepository = new LeadRepositry();

    async getTranscript(conversationId: string): Promise<ConversationTranscript> {
        if (!Types.ObjectId.isValid(conversationId)) {
            throw new Error("Invalid conversationId");
        }

        const conversation = await this.chatRepository.findConversationById(conversationId);

        if (!conversation) {
            throw new Error("Conversation not found");
        }

        return this.transcriptService.buildTranscript(conversation);
    }

    async debugTranscript(conversationId: string): Promise<string> {
        const transcript = await this.getTranscript(conversationId);
        console.log("\n===== CONVERSATION TRANSCRIPT =====\n");
        console.log(transcript.text);
        console.log("\n===== END TRANSCRIPT =====\n");
        return transcript.text;
    }

    async analyzeConversation(conversationId: string): Promise<ConversationAnalysis> {
        if (!Types.ObjectId.isValid(conversationId)) {
            throw new Error("Invalid conversationId");
        }

        const conversation = await this.chatRepository.findConversationById(conversationId);
        if (!conversation) {
            throw new Error("Conversation not found");
        }

        const transcript = this.transcriptService.buildTranscript(conversation);
        if (!transcript.text.trim()) {
            throw new Error("Conversation does not contain messages to analyze");
        }

        // Fetch linked survey answers if any
        let surveyAnswersText = "";
        if (conversation.surveySessionId) {
            const surveySession = await this.surveyResponseRepository.findById(
                conversation.surveySessionId.toString()
            );
            if (surveySession && surveySession.answers?.length > 0) {
                surveyAnswersText = `\nLinked Survey Answers:\n` +
                    surveySession.answers
                        .map((a: any) => `- Question ${a.questionId}: Raw: "${a.rawAnswer}" | Normalized: ${JSON.stringify(a.normalizedAnswer)}`)
                        .join("\n");
            }
        }

        // Fetch linked lead if any
        let leadContextText = "";
        if (conversation.leadId) {
            const lead = await this.leadRepository.findById(conversation.leadId.toString());
            if (lead) {
                leadContextText = `\nLead Profile:\n- Name: ${(lead as any).firstName} ${(lead as any).lastName || ""}\n- Company: ${(lead as any).companyName || "N/A"}\n- Industry: ${(lead as any).industry || "N/A"}\n- Current Status: ${(lead as any).status || "NEW"}`;
            }
        }

        const systemPrompt = `You are an elite Sales Intelligence and Conversation Analysis Engine.
Analyze the provided sales conversation transcript, survey responses, and customer profile.

Extract deep, high-precision sales intelligence adhering to this structure:
- summary: A concise executive summary of the conversation (2-3 sentences).
- intent: Main customer intent (e.g. "PRODUCT_INTEREST", "PURCHASE_INTENT", "PRICING", "SUPPORT", "OBJECTION", "COMPETITOR", "INFORMATIONAL").
- sentiment: "POSITIVE", "NEUTRAL", or "NEGATIVE".
- sentimentScore: Number from 0.0 (very negative) to 1.0 (very positive).
- topics: Array of main discussed topics (e.g. ["CRM Integration", "Pricing", "Enterprise Security"]).
- painPoints: Array of customer pain points discovered.
- objections: Array of objection objects { type: "PRICE"|"PRODUCT"|"COMPETITOR"|"CRM"|"IMPLEMENTATION"|"SECURITY"|"TIMING"|"TRUST"|"OTHER", text: string, confidence: number }.
- actionItems: Array of actionable follow-up items { task: string, owner: "SALES_REP"|"CUSTOMER"|"AI", dueDate?: string, completed?: boolean }.
- outcome: "INTERESTED" | "FOLLOW_UP_REQUIRED" | "DEMO_REQUESTED" | "PURCHASE" | "NOT_INTERESTED" | "LOST" | "UNKNOWN".
- buyingSignals: Array of positive buying signals identified.
- competitorMentions: Array of competitor names or tools mentioned.
- customerNeeds: Array of explicit customer requirements.
- productInterest: Array of product features or tiers the customer is interested in.
- nextBestAction: Immediate best next action for sales rep or agent.
- recommendedAction: Strategic recommendation for closing or advancing the deal.
- leadScore: An integer lead quality score from 0 to 100 based on interest, budget, decision power, and buying signals.
- confidence: Confidence score between 0.0 and 1.0.`;

        const userPrompt = `Conversation Transcript:
${transcript.text}
${surveyAnswersText}
${leadContextText}`;

        const schema = `{
  "summary": "string",
  "intent": "string",
  "sentiment": "string",
  "sentimentScore": 0.85,
  "topics": ["string"],
  "painPoints": ["string"],
  "objections": [{ "type": "string", "text": "string", "confidence": 0.9 }],
  "actionItems": [{ "task": "string", "owner": "SALES_REP", "dueDate": "string" }],
  "outcome": "string",
  "buyingSignals": ["string"],
  "competitorMentions": ["string"],
  "customerNeeds": ["string"],
  "productInterest": ["string"],
  "nextBestAction": "string",
  "recommendedAction": "string",
  "leadScore": 85,
  "confidence": 0.95
}`;

        const analysis = await LLMService.generateJSON<ConversationAnalysis>(
            systemPrompt,
            userPrompt,
            schema
        );

        const productIdObj = conversation.productId
            ? new mongoose.Types.ObjectId(conversation.productId.toString())
            : new mongoose.Types.ObjectId();

        const savedAnalysis = await this.intelligenceRepository.updateByConversationId(
            conversationId,
            {
                productId: productIdObj,
                summary: analysis.summary || "Conversation completed.",
                intent: analysis.intent || "INFORMATIONAL",
                sentiment: analysis.sentiment || "NEUTRAL",
                sentimentScore: typeof analysis.sentimentScore === "number" ? analysis.sentimentScore : 0.5,
                topics: Array.isArray(analysis.topics) ? analysis.topics : [],
                painPoints: Array.isArray(analysis.painPoints) ? analysis.painPoints : [],
                objections: Array.isArray(analysis.objections) ? analysis.objections : [],
                actionItems: Array.isArray(analysis.actionItems) ? analysis.actionItems : [],
                outcome: analysis.outcome || "INTERESTED",
                buyingSignals: Array.isArray(analysis.buyingSignals) ? analysis.buyingSignals : [],
                competitorMentions: Array.isArray(analysis.competitorMentions) ? analysis.competitorMentions : [],
                customerNeeds: Array.isArray(analysis.customerNeeds) ? analysis.customerNeeds : [],
                productInterest: Array.isArray(analysis.productInterest) ? analysis.productInterest : [],
                nextBestAction: analysis.nextBestAction || analysis.recommendedAction || "Follow up with customer",
                recommendedAction: analysis.recommendedAction || analysis.nextBestAction || "Schedule a demo call",
                leadScore: typeof analysis.leadScore === "number" ? analysis.leadScore : 50,
                confidence: typeof analysis.confidence === "number" ? analysis.confidence : 0.9,
            } as any
        );

        // Update lead score and status if conversation is linked to a lead
        if (conversation.leadId && mongoose.Types.ObjectId.isValid(conversation.leadId.toString())) {
            try {
                const leadIdStr = conversation.leadId.toString();
                const updateLeadData: Record<string, any> = {};
                if (typeof analysis.leadScore === "number") {
                    updateLeadData.score = Math.min(100, Math.max(0, Math.round(analysis.leadScore)));
                }
                if (analysis.outcome === "DEMO_REQUESTED" || analysis.outcome === "INTERESTED") {
                    updateLeadData.status = "CONTACTED";
                }
                if (Object.keys(updateLeadData).length > 0) {
                    await LeadModel.findByIdAndUpdate(leadIdStr, { $set: updateLeadData }).exec();
                }
            } catch (err) {
                console.warn("[ConversationIntelligence] Lead update warning:", err);
            }
        }

        return (savedAnalysis as unknown as ConversationAnalysis) || analysis;
    }

    async getAnalysis(conversationId: string) {
        return this.intelligenceRepository.findByConversationId(conversationId);
    }
}