import mongoose from "mongoose";
import { LLMService } from "../../../services/llm.service";
import { CampaignModel, CampaignType, CampaignStatus } from "../models/Campaign.model";
import { CampaignLeadModel, CampaignLeadStatus } from "../models/CampaignLead.model";
import { LeadModel } from "../../leads/lead.model";
import { ProductModel } from "../../products/product.model";
import { SurveyModel } from "../../survey/models/Survey.model";
import { AISurveyGeneratorService } from "../../survey/services/AISurveyGeneratorService";
import { SurveyExecutionService } from "../../survey/services/SurveyExecutionService";
import { SurveyQuestionRepository } from "../../survey/repositories/SurveyQuestionRepository";
import { ChatRepository } from "../../chat/chat.repository";
import { TextToSpeechService } from "../../voice/text-to-speech.service";
import { AgentService } from "../../agent/agent.service";

export interface GenerateCampaignInput {
    goal: string;
    productContext?: string;
    productId?: string;
    targetAudience?: string;
    action?: "CALL" | "EMAIL" | "WHATSAPP" | "SMS";
    createLinkedSurvey?: boolean;
    businessName?: string;
}

export interface AICampaignGeneratedData {
    name: string;
    description: string;
    action: "CALL" | "EMAIL" | "WHATSAPP" | "SMS";
    targetAudience: string;
    outreachScript: string;
    suggestedSurveyTopic?: string;
    estimatedBudget?: number;
    recommendedTimelineDays?: number;
}

export class AICampaignService {
    private surveyGeneratorInstance?: AISurveyGeneratorService;
    private surveyExecutionInstance?: SurveyExecutionService;
    private surveyQuestionRepoInstance?: SurveyQuestionRepository;
    private chatRepoInstance?: ChatRepository;
    private ttsInstance?: TextToSpeechService;
    private agentServiceInstance?: any;

    private get surveyGenerator(): AISurveyGeneratorService {
        if (!this.surveyGeneratorInstance) {
            this.surveyGeneratorInstance = new AISurveyGeneratorService();
        }
        return this.surveyGeneratorInstance;
    }

    private get surveyExecutionService(): SurveyExecutionService {
        if (!this.surveyExecutionInstance) {
            this.surveyExecutionInstance = new SurveyExecutionService();
        }
        return this.surveyExecutionInstance;
    }

    private get surveyQuestionRepository(): SurveyQuestionRepository {
        if (!this.surveyQuestionRepoInstance) {
            this.surveyQuestionRepoInstance = new SurveyQuestionRepository();
        }
        return this.surveyQuestionRepoInstance;
    }

    private get chatRepository(): ChatRepository {
        if (!this.chatRepoInstance) {
            this.chatRepoInstance = new ChatRepository();
        }
        return this.chatRepoInstance;
    }

    private get ttsService(): TextToSpeechService {
        if (!this.ttsInstance) {
            this.ttsInstance = new TextToSpeechService();
        }
        return this.ttsInstance;
    }

    private getAgentService(): any {
        if (!this.agentServiceInstance) {
            // Lazy load AgentService to avoid circular dependency
            const { AgentService } = require("../../agent/agent.service");
            this.agentServiceInstance = new AgentService();
        }
        return this.agentServiceInstance;
    }

    // -------------------------------------------------------------
    // 1. GENERATE CAMPAIGN WITH AI
    // -------------------------------------------------------------
    async generateCampaign(input: GenerateCampaignInput): Promise<{
        campaign: any;
        linkedSurvey?: any;
        survey?: any;
        attachedLeadsCount?: number;
        outreachScript?: string;
    }> {
        const prompt = `You are a world-class AI Growth & Sales Strategist.
Create a high-performing outreach campaign based on the following requirements:
- Goal: "${input.goal}"
- Target Audience: "${input.targetAudience || "B2B Decision Makers"}"
- Product / Company Context: "${input.productContext || "SalesFlow AI Platform"}"
- Preferred Channel: "${input.action || "CALL"}"

Return JSON matching this schema:
{
  "name": "Campaign Title",
  "description": "2-sentence strategic summary",
  "action": "${input.action || "CALL"}",
  "targetAudience": "ICP Definition",
  "outreachScript": "Initial conversational voice phone call opening hook (friendly, engaging, under 40 words)",
  "suggestedSurveyTopic": "Topic for customer qualification survey",
  "estimatedBudget": 1500,
  "recommendedTimelineDays": 30
}`;

        const aiData: AICampaignGeneratedData = await LLMService.generateJSON<AICampaignGeneratedData>(
            "You are a growth marketing and sales strategist.",
            prompt
        );

        let linkedProduct: any = null;
        if (input.productId && mongoose.Types.ObjectId.isValid(input.productId)) {
            linkedProduct = await ProductModel.findById(input.productId);
        }
        if (!linkedProduct) {
            linkedProduct = await ProductModel.findOne().sort({ createdAt: -1 });
        }

        const campaign: any = await CampaignModel.create({
            name: aiData.name || "AI Sales Outreach Campaign",
            description: `${aiData.description || input.goal} (Audience: ${aiData.targetAudience})`,
            type: input.createLinkedSurvey ? CampaignType.SURVEY : CampaignType.SALES,
            action: aiData.action || input.action || "CALL",
            status: CampaignStatus.DRAFT,
            product: linkedProduct?.name || "AI Sales Suite",
            productId: linkedProduct?._id,
            schedule: {
                timezone: "UTC",
            },
        });

        let createdSurvey: any = null;
        if (input.createLinkedSurvey !== false) {
            try {
                const surveyTopic = aiData.suggestedSurveyTopic || aiData.name || input.goal;
                createdSurvey = await this.surveyGenerator.generateSurvey({
                    topic: surveyTopic,
                    campaignId: campaign._id.toString(),
                    productContext: input.productContext || linkedProduct?.description,
                    questionCount: 4,
                });

                if (createdSurvey) {
                    await CampaignModel.findByIdAndUpdate(campaign._id, {
                        surveyId: createdSurvey._id,
                    });
                }
            } catch (err: any) {
                console.warn("[generateCampaign] Could not auto-generate linked survey:", err.message);
            }
        }

        return {
            campaign: campaign.toObject ? campaign.toObject() : campaign,
            linkedSurvey: createdSurvey,
            survey: createdSurvey,
            attachedLeadsCount: 0,
            outreachScript: aiData.outreachScript || "",
        };
    }

    // -------------------------------------------------------------
    // 2. EDIT CAMPAIGN WITH AI INSTRUCTIONS
    // -------------------------------------------------------------
    async editCampaignWithAI(campaignId: string, instructions: string): Promise<any> {
        const campaign: any = await CampaignModel.findById(campaignId);
        if (!campaign) throw new Error("Campaign not found");

        const prompt = `You are an expert sales campaign optimizer.
Update the following campaign based on these user instructions:
User Instructions: "${instructions}"

Current Campaign:
- Name: "${campaign.name}"
- Description: "${campaign.description}"
- Channel: "${campaign.action}"
- Target Audience: "${campaign.targetAudience}"
- Message Pitch: "${campaign.settings?.messageTemplate}"

Return JSON matching this schema:
{
  "name": "Updated Campaign Title",
  "description": "Updated description",
  "targetAudience": "Updated target audience",
  "outreachScript": "Updated voice opening pitch",
  "reasoning": "Brief explanation of modifications made"
}`;

        const updatedData: any = await LLMService.generateJSON(
            "You are an expert sales campaign strategist.",
            prompt
        );

        const updatedCampaign = await CampaignModel.findByIdAndUpdate(
            campaignId,
            {
                $set: {
                    name: updatedData.name || campaign.name,
                    description: updatedData.description || campaign.description,
                    targetAudience: updatedData.targetAudience || campaign.targetAudience,
                    "settings.messageTemplate": updatedData.outreachScript || campaign.settings?.messageTemplate,
                },
            },
            { new: true }
        );

        return {
            campaign: updatedCampaign,
            modificationsSummary: updatedData.reasoning || "Campaign modified successfully by AI.",
        };
    }

    // -------------------------------------------------------------
    // 3. ADD LEADS TO CAMPAIGN
    // -------------------------------------------------------------
    async addLeadsToCampaign(campaignId: string, leadIds: string[]): Promise<{
        campaignId: string;
        addedCount: number;
        totalLeadsInCampaign: number;
    }> {
        const records = leadIds.map((leadId) => ({
            campaignId: new mongoose.Types.ObjectId(campaignId),
            leadId: new mongoose.Types.ObjectId(leadId),
            status: CampaignLeadStatus.PENDING,
        }));

        if (records.length > 0) {
            await CampaignLeadModel.insertMany(records, { ordered: false }).catch(() => {});
        }

        const total = await CampaignLeadModel.countDocuments({
            campaignId: new mongoose.Types.ObjectId(campaignId),
        });

        return {
            campaignId,
            addedCount: records.length,
            totalLeadsInCampaign: total,
        };
    }

    // -------------------------------------------------------------
    // 4. EXECUTE AI VOICE PHONE CALL / STEP-BY-STEP SURVEY
    // -------------------------------------------------------------
    async callLeadWithAI(
        campaignId: string,
        leadId: string,
        options: {
            customerReply?: string;
            conversationId?: string;
            surveySessionId?: string;
            surveyId?: string;
            skipTTS?: boolean;
        } = {}
    ): Promise<any> {
        const campaign: any = await CampaignModel.findById(campaignId);
        if (!campaign) throw new Error("Campaign not found");

        let lead: any = null;
        if (leadId && mongoose.Types.ObjectId.isValid(leadId)) {
            lead = await LeadModel.findById(leadId);
        }
        if (!lead) {
            lead = await LeadModel.findOne();
        }
        if (!lead) {
            lead = await LeadModel.create({
                firstName: "Alex",
                lastName: "Morgan",
                phone: "+91 98765 43210",
                status: "NEW",
            });
        }

        let conversationId = options.conversationId;
        let surveySessionId = options.surveySessionId;

        // 1. Get or create conversation record
        if (!conversationId || !mongoose.Types.ObjectId.isValid(conversationId)) {
            const conv = await this.chatRepository.createConversation({
                leadId: new mongoose.Types.ObjectId(leadId),
                campaignId: new mongoose.Types.ObjectId(campaignId),
                productId: campaign.productId,
                channel: "VOICE",
                title: `AI Voice Call with ${lead.name || lead.firstName || "Lead"} (${campaign.name})`,
                status: "ACTIVE",
            });
            conversationId = (conv as any)._id.toString();
        }

        // 2. Resolve Survey & Questions
        let effectiveSurveyId = options.surveyId || campaign.surveyId?.toString();
        let surveyDoc: any = null;

        if (effectiveSurveyId && mongoose.Types.ObjectId.isValid(effectiveSurveyId)) {
            surveyDoc = await SurveyModel.findById(effectiveSurveyId);
        }

        if (!surveyDoc) {
            surveyDoc = await SurveyModel.findOne({
                $or: [
                    { campaignId: new mongoose.Types.ObjectId(campaignId) },
                    { campaignId: campaignId },
                    { name: { $regex: campaign.name, $options: "i" } },
                ],
            }).sort({ createdAt: -1 });
        }

        if (!surveyDoc) {
            surveyDoc = await SurveyModel.findOne().sort({ createdAt: -1 });
        }

        if (surveyDoc) {
            effectiveSurveyId = surveyDoc._id.toString();
        }

        let surveyQuestionsList: any[] = [];
        let currentQuestion: any = null;
        let sessionAnswers: any[] = [];
        let isCompleted = false;

        if (effectiveSurveyId) {
            surveyQuestionsList = await this.surveyQuestionRepository.findBySurveyId(effectiveSurveyId);

            if (!surveySessionId) {
                try {
                    const startRes: any = await this.surveyExecutionService.startSurvey({
                        surveyId: effectiveSurveyId,
                        campaignId,
                        leadId,
                        conversationId,
                    });
                    surveySessionId = startRes.session?._id?.toString();
                    currentQuestion = startRes.firstQuestion || (surveyQuestionsList.length > 0 ? surveyQuestionsList[0] : null);
                    sessionAnswers = startRes.session?.answers || [];
                } catch (err: any) {
                    console.warn("[callLeadWithAI] startSurvey error:", err.message);
                }
            } else {
                try {
                    const session = await this.surveyExecutionService.getSurveySession(surveySessionId);
                    sessionAnswers = session?.answers || [];
                    isCompleted = session?.status === "completed";

                    if (!isCompleted) {
                        currentQuestion = await this.surveyExecutionService.getCurrentQuestion(surveySessionId);
                    }
                } catch (err: any) {
                    console.warn("[callLeadWithAI] getSurveySession error:", err.message);
                }
            }
        }

        if (!currentQuestion && surveyQuestionsList.length > 0 && !isCompleted) {
            currentQuestion = surveyQuestionsList[0];
        }

        // 3. Process Conversational Intents & Survey Turn
        let speechText = "";
        let sourcesGrounded: any[] = [];
        let toolsUsed: string[] = [];

        const customerText = (options.customerReply || "").trim();
        const lowerReply = customerText.toLowerCase();

        // 3A. Universal Conversational Intent Interception:
        // Detect "talk later", "call me later", "busy", "not interested", "repeat", etc.
        if (customerText) {
            const isRescheduleOrBusy =
                /\b(talk later|call (?:me )?later|call (?:me )?back later|call (?:me )?afterwards|call (?:me )?some other time|not a good time|busy right now|am busy|i'm busy|in a meeting|driving|can't talk|cant talk|cannot talk|not free|not now|ping me later|reach out later|speak later|later please|call tomorrow|call after sometime|busy at work|occupied|leave me alone|talk to you later|connect later)\b/i.test(lowerReply) ||
                /^(later|busy|busy now|call later|talk later|not now|afterwards|busy right now)$/i.test(lowerReply);

            const isRefusalOrOptOut =
                /\b(not interested|don't call|dont call|stop calling|remove (?:my )?number|wrong number|don't want to answer|dont want to participate|not interested in survey|disconnect|cut the call|hang up|do not contact)\b/i.test(lowerReply) ||
                /^(not interested|stop|no thanks|no thank you|wrong number|opt out)$/i.test(lowerReply);

            const isRepeatRequest =
                /\b(repeat|say again|pardon|come again|didn't hear|did not hear|can you repeat|could you repeat|what was that|what did you say)\b/i.test(lowerReply) ||
                /^(repeat|pardon|what|say again)$/i.test(lowerReply);

            const isIdentityInquiry =
                /\b(who are you|who is (?:this|calling)|which company|what company|where are you calling from|why are you calling)\b/i.test(lowerReply);

            if (isRescheduleOrBusy) {
                if (surveySessionId) {
                    try {
                        await this.surveyExecutionService.abandonSurvey(surveySessionId, "Customer busy / requested callback");
                    } catch {}
                }
                speechText = "No problem at all! I understand you're busy right now. I will make a note to follow up with you at a more convenient time. Thank you, and have a wonderful day!";
                currentQuestion = null;
                isCompleted = true;
            } else if (isRefusalOrOptOut) {
                if (surveySessionId) {
                    try {
                        await this.surveyExecutionService.abandonSurvey(surveySessionId, "Customer opted out / not interested");
                    } catch {}
                }
                speechText = "Understood! Thank you for letting me know. I have noted your preference and will not disturb you again. Have a good day!";
                currentQuestion = null;
                isCompleted = true;
            } else if (isRepeatRequest) {
                const promptToRepeat = currentQuestion?.aiPrompt || currentQuestion?.text || "Could you please answer the previous question?";
                speechText = `Sure! Let me repeat: ${promptToRepeat}`;
                isCompleted = false;
            } else if (isIdentityInquiry) {
                const business = campaign.businessName || campaign.name || "our team";
                const resumeQ = currentQuestion ? (currentQuestion.aiPrompt || currentQuestion.text) : "";
                speechText = `I'm an AI assistant calling on behalf of ${business} regarding a quick feedback survey. ${resumeQ ? `Coming back to our question: ${resumeQ}` : ""}`;
                isCompleted = false;
            }
        }

        if (!speechText) {
            const isMach3Survey = Boolean(
                (surveyDoc?.name && /mach\s*3/i.test(surveyDoc.name)) ||
                (campaign?.name && /mach\s*3/i.test(campaign.name)) ||
                (surveyDoc?.description && /mach\s*3/i.test(surveyDoc.description)) ||
                surveyQuestionsList.some((q) => /mach\s*3/i.test(q.text || "") || /mach\s*3/i.test(q.aiPrompt || ""))
            );

            const isGuardSurvey =
                !isMach3Survey &&
                Boolean((surveyDoc?.name && /guard/i.test(surveyDoc.name)) ||
                (campaign?.name && /guard/i.test(campaign.name)));

            const isTideSurvey =
                Boolean((surveyDoc?.name && /tide/i.test(surveyDoc.name)) ||
                (campaign?.name && /tide/i.test(campaign.name)));

            if (isMach3Survey && (!isCompleted || !options.customerReply)) {
                const mach3Turn = await this.handleMach3SurveyTurn({
                    lead,
                    campaign,
                    surveySessionId,
                    currentQuestion,
                    customerReply: options.customerReply,
                    conversationId,
                    surveyQuestionsList,
                });

                speechText = mach3Turn.speechText;
                currentQuestion = mach3Turn.currentQuestion;
                isCompleted = mach3Turn.isCompleted;

                if (surveySessionId) {
                    try {
                        const refreshed = await this.surveyExecutionService.getSurveySession(surveySessionId);
                        sessionAnswers = refreshed?.answers || [];
                    } catch {}
                }
            } else if (isGuardSurvey && (!isCompleted || !options.customerReply)) {
                const guardTurn = await this.handleGuardSurveyTurn({
                    lead,
                    campaign,
                    surveySessionId,
                    currentQuestion,
                    customerReply: options.customerReply,
                    conversationId,
                    surveyQuestionsList,
                });

                speechText = guardTurn.speechText;
                currentQuestion = guardTurn.currentQuestion;
                isCompleted = guardTurn.isCompleted;

                if (surveySessionId) {
                    try {
                        const refreshed = await this.surveyExecutionService.getSurveySession(surveySessionId);
                        sessionAnswers = refreshed?.answers || [];
                    } catch {}
                }
            } else if (isTideSurvey && (!isCompleted || !options.customerReply)) {
                const tideTurn = await this.handleTideSurveyTurn({
                    lead,
                    campaign,
                    surveySessionId,
                    currentQuestion,
                    customerReply: options.customerReply,
                    conversationId,
                    surveyQuestionsList,
                });

                speechText = tideTurn.speechText;
                currentQuestion = tideTurn.currentQuestion;
                isCompleted = tideTurn.isCompleted;

                if (surveySessionId) {
                    try {
                        const refreshed = await this.surveyExecutionService.getSurveySession(surveySessionId);
                        sessionAnswers = refreshed?.answers || [];
                    } catch {}
                }
            } else {
                const dynamicTurn = await this.handleDynamicSurveyTurn({
                    lead,
                    campaign,
                    surveySessionId,
                    currentQuestion,
                    customerReply: options.customerReply,
                    conversationId,
                    surveyQuestionsList,
                    surveyDoc,
                });

                speechText = dynamicTurn.speechText;
                currentQuestion = dynamicTurn.currentQuestion;
                isCompleted = dynamicTurn.isCompleted;

                if (surveySessionId) {
                    try {
                        const refreshed = await this.surveyExecutionService.getSurveySession(surveySessionId);
                        sessionAnswers = refreshed?.answers || [];
                    } catch {}
                }
            }
        }

        // Record messages in conversation repository
        if (conversationId) {
            if (options.customerReply?.trim()) {
                await this.chatRepository.addMessage({
                    conversationId,
                    role: "USER",
                    content: options.customerReply.trim(),
                });
            }
            if (speechText?.trim()) {
                await this.chatRepository.addMessage({
                    conversationId,
                    role: "ASSISTANT",
                    content: speechText.trim(),
                });
            }
        }

        // 4. Synthesize speech via TTS (with safe fallback for network resilience)
        let audio: any = { audioBase64: "", mimeType: "audio/wav" };
        if (!options.skipTTS) {
            try {
                audio = await this.ttsService.synthesize(speechText);
            } catch (ttsErr: any) {
                console.warn("[callLeadWithAI] TTS synthesis skipped or failed:", ttsErr?.message || ttsErr);
            }
        }

        // 5. Update lead campaign status
        const leadStatus = isCompleted ? CampaignLeadStatus.COMPLETED : CampaignLeadStatus.CONTACTED;
        await CampaignLeadModel.findOneAndUpdate(
            { campaignId: new mongoose.Types.ObjectId(campaignId), leadId: new mongoose.Types.ObjectId(leadId) },
            { status: leadStatus, lastAttemptAt: new Date() },
            { upsert: true }
        );

        return {
            campaignId,
            leadId,
            leadName: lead.name || `${lead.firstName || ""} ${lead.lastName || ""}`.trim(),
            leadPhone: lead.phone,
            conversationId,
            surveyId: effectiveSurveyId,
            surveyName: surveyDoc?.name || "Campaign Survey",
            surveySessionId,
            currentQuestionId: currentQuestion?.questionId,
            currentQuestionIndex: currentQuestion?.order || (isCompleted ? surveyQuestionsList.length : 1),
            totalQuestions: surveyQuestionsList.length,
            completed: isCompleted,
            answers: sessionAnswers,
            questions: surveyQuestionsList,
            openingSpeech: speechText,
            aiMessage: speechText,
            text: speechText,
            audioBase64: audio?.audioBase64 || "",
            mimeType: audio?.mimeType || "audio/wav",
            sources: sourcesGrounded,
            toolsUsed,
            status: isCompleted ? "CALL_COMPLETED" : options.customerReply ? "CALL_IN_PROGRESS" : "CALL_INITIATED",
        };
    }

    // =============================================================
    // CP/RURBAN – GILLETTE MACH3 SURVEY PROTOCOL HANDLER
    // =============================================================
    private async handleMach3SurveyTurn(params: {
        lead: any;
        campaign: any;
        surveySessionId?: string;
        currentQuestion: any;
        customerReply?: string;
        conversationId?: string;
        surveyQuestionsList: any[];
    }): Promise<{
        speechText: string;
        currentQuestion: any;
        isCompleted: boolean;
    }> {
        const { lead, surveySessionId, customerReply, conversationId, surveyQuestionsList } = params;
        let currentQuestion = params.currentQuestion;

        const history = conversationId ? await this.chatRepository.getRecentMessages(conversationId, 6) : [];
        const lastAssistantMsg = [...history].reverse().find(m => (m.role as string) === "ASSISTANT")?.content || "";

        // Turn 0: Initial Call greeting + Q1 (Turn 0: no customer reply yet)
        if (!customerReply || !customerReply.trim()) {
            const leadName = lead.name || lead.firstName || "there";
            const dateStamp = lead.purchaseDate || lead.orderDate || (lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : "");
            const dateAid = dateStamp ? ` (recorded around ${dateStamp})` : "";
            const q1 = surveyQuestionsList.find(q => q.order === 1) || currentQuestion;
            return {
                speechText: `Hello ${leadName}! I'm calling from Gillette regarding Gillette Mach3. Do you remember purchasing any razor or blade at a discounted rate in the last 1 month${dateAid}?`,
                currentQuestion: q1,
                isCompleted: false,
            };
        }

        const customerText = customerReply.trim();
        const lower = customerText.toLowerCase();
        const currentOrder = currentQuestion?.order || 1;

        // Turn 1: Responding to Q1 (Sample Recall)
        if (currentOrder === 1) {
            const isNo =
                /^(no|nope|nah|never|not really|negative|didn't|did not|don't remember|dont remember|not me|haven't|havent|b)\b/i.test(lower) ||
                /\b(did not buy|didn't buy|dont buy|don't buy|no i did not|no i didn't|did not purchase|haven't purchased)\b/i.test(lower);
            const isYes =
                /^(yes|yep|yeah|sure|definitely|absolutely|affirmative|true|correct|right|of course|bought|purchased|got one|a)\b/i.test(lower) ||
                /\b(bought a blade|bought a razor|yes i did|yes i bought|bought one|i remember|purchased)\b/i.test(lower);

            if (isNo) {
                // Condition B: No -> End the call
                if (surveySessionId) {
                    await this.surveyExecutionService.submitAnswer(surveySessionId, {
                        questionId: currentQuestion.questionId,
                        rawAnswer: customerText,
                        normalizedAnswer: "no",
                        answerType: "yes_no",
                        confidence: 1.0,
                    });
                    await this.surveyExecutionService.completeSurvey(surveySessionId);
                }
                return {
                    speechText: "Understood. Thank you so much for your time today. Have a wonderful day!",
                    currentQuestion: null,
                    isCompleted: true,
                };
            }

            if (isYes) {
                // Condition A: Yes – continue to other questions (Q2 Brand Recall)
                const q2 = surveyQuestionsList.find(q => q.order === 2);
                if (surveySessionId) {
                    await this.surveyExecutionService.submitAnswer(surveySessionId, {
                        questionId: currentQuestion.questionId,
                        rawAnswer: customerText,
                        normalizedAnswer: "yes",
                        answerType: "yes_no",
                        confidence: 1.0,
                    });
                    if (q2) {
                        await this.surveyExecutionService.moveToNextQuestion(surveySessionId, q2.questionId);
                    }
                }
                return {
                    speechText: "Thank you! What brand of razor did you purchase?",
                    currentQuestion: q2,
                    isCompleted: false,
                };
            }

            // Neither yes nor no - stay on Q1 and clarify
            return {
                speechText: "Could you please confirm if you remember purchasing any razor or blade in the last 1 month at a discounted rate — Yes or No?",
                currentQuestion: currentQuestion,
                isCompleted: false,
            };
        }

        // Turn 2: Responding to Q2 (Brand Recall)
        if (currentOrder === 2) {
            const wasMach3AidedPrompt = /blue.*grey handle|mach\s*3.*as well/i.test(lastAssistantMsg);

            if (wasMach3AidedPrompt) {
                const isNo = /^(no|nope|nah|never|not really|only the other|just the other|no i did not|no i didn't)\b/i.test(lower);
                if (isNo) {
                    // Condition: If answer is no even after prompt, end call
                    if (surveySessionId) {
                        await this.surveyExecutionService.submitAnswer(surveySessionId, {
                            questionId: currentQuestion.questionId,
                            rawAnswer: customerText,
                            normalizedAnswer: "any_other_brands",
                            answerType: "single_choice",
                            confidence: 1.0,
                        });
                        await this.surveyExecutionService.completeSurvey(surveySessionId);
                    }
                    return {
                        speechText: "Understood. Thank you so much for your time and feedback today. Have a wonderful day!",
                        currentQuestion: null,
                        isCompleted: true,
                    };
                }

                // If they say yes or mention Mach3 on prompt -> proceed to Q3
                const q3 = surveyQuestionsList.find(q => q.order === 3);
                if (surveySessionId) {
                    await this.surveyExecutionService.submitAnswer(surveySessionId, {
                        questionId: currentQuestion.questionId,
                        rawAnswer: customerText,
                        normalizedAnswer: "gillette_mach3",
                        answerType: "single_choice",
                        confidence: 1.0,
                    });
                    if (q3) {
                        await this.surveyExecutionService.moveToNextQuestion(surveySessionId, q3.questionId);
                    }
                }
                return {
                    speechText: "Great! Before purchasing Gillette Mach3 Razor, how did you usually shave?",
                    currentQuestion: q3,
                    isCompleted: false,
                };
            }

            // First time answering Q2
            const isMach3 = /\b(mach\s*3|mach3|gillette mach\s*3)\b/i.test(lower);
            const isGillette = /\b(gillette|blue pack|grey handle|blue packet)\b/i.test(lower);

            if (isMach3) {
                // a) Gillette Mach3 -> proceed to Q3
                const q3 = surveyQuestionsList.find(q => q.order === 3);
                if (surveySessionId) {
                    await this.surveyExecutionService.submitAnswer(surveySessionId, {
                        questionId: currentQuestion.questionId,
                        rawAnswer: customerText,
                        normalizedAnswer: "gillette_mach3",
                        answerType: "single_choice",
                        confidence: 1.0,
                    });
                    if (q3) {
                        await this.surveyExecutionService.moveToNextQuestion(surveySessionId, q3.questionId);
                    }
                }
                return {
                    speechText: "Great! Before purchasing Gillette Mach3 Razor, how did you usually shave?",
                    currentQuestion: q3,
                    isCompleted: false,
                };
            }

            if (isGillette) {
                // b) Any Gillette -> proceed to Q3
                const q3 = surveyQuestionsList.find(q => q.order === 3);
                if (surveySessionId) {
                    await this.surveyExecutionService.submitAnswer(surveySessionId, {
                        questionId: currentQuestion.questionId,
                        rawAnswer: customerText,
                        normalizedAnswer: "any_gillette",
                        answerType: "single_choice",
                        confidence: 1.0,
                    });
                    if (q3) {
                        await this.surveyExecutionService.moveToNextQuestion(surveySessionId, q3.questionId);
                    }
                }
                return {
                    speechText: "Got it, thank you! Before purchasing Gillette Mach3 Razor, how did you usually shave?",
                    currentQuestion: q3,
                    isCompleted: false,
                };
            }

            // c) Any other brands -> prompt asking if they remember buying Gillette Mach3
            return {
                speechText: "Do you remember purchasing the Gillette Mach3 razor as well? The packet is blue, with a grey handle of the razor.",
                currentQuestion: currentQuestion,
                isCompleted: false,
            };
        }

        // Turn 3: Responding to Q3 (New User Hit Rate)
        if (currentOrder === 3) {
            const matched: string[] = [];
            if (/\b(guard|gillette guard)\b/i.test(lower)) matched.push("used_gillette_guard");
            if (/\b(barber|salon)\b/i.test(lower)) matched.push("used_to_visit_a_barber");
            if (/\b(disposable|use and throw|single use|throw)\b/i.test(lower)) matched.push("disposable/use_and_throw_razor");
            if (/\b(mach 3|mach3)\b/i.test(lower)) matched.push("used_gillette_mach3");
            if (/\b(trimmer|trim|machine|electric)\b/i.test(lower)) matched.push("trimmer");
            if (/\b(fusion)\b/i.test(lower)) matched.push("gillette_fusion");
            if (/\b(laser|supermax|other|regular|normal razor|another)\b/i.test(lower)) matched.push("other_razor_brands");
            if (matched.length === 0) {
                const isOffTopic = /^(what|why|who|how|when|hello|hey|wait|pardon|sorry|ok|okay|tell me|can you)\b/i.test(lower) || lower.length < 3;
                if (isOffTopic) {
                    return {
                        speechText: "Before purchasing the Gillette Mach3 Razor, how did you usually shave — for instance, did you use a barber, a trimmer, or another razor?",
                        currentQuestion: currentQuestion,
                        isCompleted: false,
                    };
                }
                matched.push(customerText);
            }

            const q4 = surveyQuestionsList.find(q => q.order === 4);
            if (surveySessionId) {
                await this.surveyExecutionService.submitAnswer(surveySessionId, {
                    questionId: currentQuestion.questionId,
                    rawAnswer: customerText,
                    normalizedAnswer: matched,
                    answerType: "multiple_choice",
                    confidence: 1.0,
                });
                if (q4) {
                    await this.surveyExecutionService.moveToNextQuestion(surveySessionId, q4.questionId);
                }
            }
            return {
                speechText: "Thank you! Do you plan to purchase Mach3 razor or cartridges in future — Yes, No, or Maybe?",
                currentQuestion: q4,
                isCompleted: false,
            };
        }

        // Turn 4: Responding to Q4 (Repeat Intent)
        if (currentOrder === 4) {
            const isNo = /^(no|nope|nah|never|not planning|will not|wont|won't|do not plan|b)\b/i.test(lower);
            const isYes = /^(yes|yep|yeah|sure|definitely|absolutely|i will|plan to|of course|a)\b/i.test(lower);
            const isMaybe = /^(maybe|perhaps|not sure|might be|possibly|dont know|don't know|c)\b/i.test(lower);

            if (isNo) {
                // Condition: b) No -> Proceed to Q5 (reasons why will not buy)
                const q5 = surveyQuestionsList.find(q => q.order === 5);
                if (surveySessionId) {
                    await this.surveyExecutionService.submitAnswer(surveySessionId, {
                        questionId: currentQuestion.questionId,
                        rawAnswer: customerText,
                        normalizedAnswer: "no",
                        answerType: "single_choice",
                        confidence: 1.0,
                    });
                    if (q5) {
                        await this.surveyExecutionService.moveToNextQuestion(surveySessionId, q5.questionId);
                    }
                }
                return {
                    speechText: "You said you will not buy Mach 3 razor again, please mention why will you not buy it?",
                    currentQuestion: q5,
                    isCompleted: false,
                };
            }

            if (isYes) {
                // Condition: a) Yes -> SKIP Q5 and proceed directly to Q6 (reasons why will repeat)
                const q6 = surveyQuestionsList.find(q => q.order === 6);
                if (surveySessionId) {
                    await this.surveyExecutionService.submitAnswer(surveySessionId, {
                        questionId: currentQuestion.questionId,
                        rawAnswer: customerText,
                        normalizedAnswer: "yes",
                        answerType: "single_choice",
                        confidence: 1.0,
                    });
                    if (q6) {
                        await this.surveyExecutionService.moveToNextQuestion(surveySessionId, q6.questionId);
                    }
                }
                if (q6) {
                    return {
                        speechText: "You said you will repeat buying Mach 3, please select why will you repeat?",
                        currentQuestion: q6,
                        isCompleted: false,
                    };
                }
                return {
                    speechText: "That's great to hear! Thank you so much for your valuable feedback today. Have a wonderful day!",
                    currentQuestion: null,
                    isCompleted: true,
                };
            }

            if (isMaybe) {
                // Condition: c) Maybe -> Skip both Q5 and Q6, end call
                if (surveySessionId) {
                    await this.surveyExecutionService.submitAnswer(surveySessionId, {
                        questionId: currentQuestion.questionId,
                        rawAnswer: customerText,
                        normalizedAnswer: "maybe",
                        answerType: "single_choice",
                        confidence: 1.0,
                    });
                    await this.surveyExecutionService.completeSurvey(surveySessionId);
                }
                return {
                    speechText: "Understood! Thank you so much for taking the time to share your feedback with us today. Have a great day!",
                    currentQuestion: null,
                    isCompleted: true,
                };
            }

            // Ambiguous
            return {
                speechText: "Could you please confirm if you plan to purchase Mach3 razor or cartridges in future — Yes, No, or Maybe?",
                currentQuestion: currentQuestion,
                isCompleted: false,
            };
        }

        // Turn 5: Responding to Q5 (Reasons why will not buy - ONLY IF Q4 is No)
        if (currentOrder === 5) {
            let reason = "other";
            if (/\b(expensive|price|cost|pricey)\b/i.test(lower)) reason = "the_razor_is_expensive";
            else if (/\b(same benefit|benefit|current razor|current)\b/i.test(lower)) reason = "i_am_already_getting_the_same_benefits_with_my_current_razor";
            else if (/\b(clean shave|clean|rough)\b/i.test(lower)) reason = "i_think_it_will_not_give_a_clean_shave";
            else if (/\b(promotion|offer|discount)\b/i.test(lower)) reason = "it_was_not_on_promotion";
            else if (/\b(redness|irritation|rash|burn|burning)\b/i.test(lower)) reason = "it_caused_redness_and_irritation";
            else if (/\b(cut|cuts|bleed|nicks)\b/i.test(lower)) reason = "it_caused_cuts";
            else if (/\b(last|blade|blades|short|dull)\b/i.test(lower)) reason = "blades_did_not_last_as_long_as_i_expected";
            else if (/\b(stuck|clog|hair)\b/i.test(lower)) reason = "hair_got_stuck_in_razor";
            else if (/\b(recommend|friend|family)\b/i.test(lower)) reason = "none_of_my_friends/family_members_recommended_it_to_me";
            else if (/\b(available|store|shop|stock)\b/i.test(lower)) reason = "it_was_not_available_in_store";
            else reason = customerText; // e.g. "just like that"

            if (surveySessionId) {
                await this.surveyExecutionService.submitAnswer(surveySessionId, {
                    questionId: currentQuestion.questionId,
                    rawAnswer: customerText,
                    normalizedAnswer: reason,
                    answerType: "single_choice",
                    confidence: 1.0,
                });
                // CRITICAL FIX: COMPLETE THE SURVEY! DO NOT ASK Q6!
                await this.surveyExecutionService.completeSurvey(surveySessionId);
            }

            return {
                speechText: "Thank you so much for sharing your feedback with us today. That was all our questions. Have a wonderful day!",
                currentQuestion: null,
                isCompleted: true,
            };
        }

        // Turn 6: Responding to Q6 (Reasons why will repeat - ONLY IF Q4 is Yes)
        if (currentOrder === 6) {
            let reason = "other";
            if (/\b(cleaner shave|cleaner|clean)\b/i.test(lower)) reason = "it_gave_me_a_cleaner_shave";
            else if (/\b(comfortable|comfort)\b/i.test(lower)) reason = "it_gave_me_a_comfortable_shave";
            else if (/\b(no cuts|not give cuts|cut)\b/i.test(lower)) reason = "it_did_not_give_me_any_cuts";
            else if (/\b(burning|redness|irritation|no burn)\b/i.test(lower)) reason = "it_did_not_give_me_any_burning_sensation/_redness";
            else if (/\b(smooth|smoothness)\b/i.test(lower)) reason = "it_gave_me_a_smooth_shave";
            else if (/\b(one stroke|stroke)\b/i.test(lower)) reason = "it_removed_my_hair_in_one_stroke";
            else if (/\b(time|save time|faster|saves time)\b/i.test(lower)) reason = "it_saves_time_vs_the_earlier_razor_i_was_using";
            else reason = customerText;

            if (surveySessionId) {
                await this.surveyExecutionService.submitAnswer(surveySessionId, {
                    questionId: currentQuestion.questionId,
                    rawAnswer: customerText,
                    normalizedAnswer: reason,
                    answerType: "single_choice",
                    confidence: 1.0,
                });
                await this.surveyExecutionService.completeSurvey(surveySessionId);
            }

            return {
                speechText: "Thank you so much for sharing your feedback and for choosing Gillette Mach3! Have a wonderful day!",
                currentQuestion: null,
                isCompleted: true,
            };
        }

        return {
            speechText: "Thank you so much for your time and feedback today. Have a wonderful day!",
            currentQuestion: null,
            isCompleted: true,
        };
    }

    // =============================================================
    // CP/RURBAN – GILLETTE GUARD SURVEY PROTOCOL HANDLER
    // =============================================================
    private async handleGuardSurveyTurn(params: {
        lead: any;
        campaign: any;
        surveySessionId?: string;
        currentQuestion: any;
        customerReply?: string;
        conversationId?: string;
        surveyQuestionsList: any[];
    }): Promise<{
        speechText: string;
        currentQuestion: any;
        isCompleted: boolean;
    }> {
        const { lead, surveySessionId, customerReply, conversationId, surveyQuestionsList } = params;
        let currentQuestion = params.currentQuestion;

        // Retrieve conversation history for context / sub-prompts
        const history = conversationId ? await this.chatRepository.getRecentMessages(conversationId, 6) : [];
        const lastAssistantMsg = [...history].reverse().find(m => (m.role as string) === "ASSISTANT")?.content || "";

        // 1. Initial Call greeting + Q1 (Turn 0: no customer reply yet)
        if (!customerReply || !customerReply.trim()) {
            const leadName = lead.name || lead.firstName || "there";
            const dateStamp = lead.purchaseDate || lead.orderDate || (lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : "");
            const dateAid = dateStamp ? ` (recorded around ${dateStamp})` : "";
            const q1 = surveyQuestionsList.find(q => q.order === 1) || currentQuestion;
            return {
                speechText: `Hello ${leadName}! I'm calling from Gillette Guard. Do you remember purchasing any razor or blade at a discounted rate in the last 1 month${dateAid}?`,
                currentQuestion: q1,
                isCompleted: false,
            };
        }

        const customerText = customerReply.trim();
        const lower = customerText.toLowerCase();
        const currentOrder = currentQuestion?.order || 1;

        // Turn 1: Responding to Q1 (Sample Recall)
        if (currentOrder === 1) {
            const isNo =
                /^(no|nope|nah|never|not really|negative|false|didn't|did not|don't remember|dont remember|not me|haven't|havent)\b/i.test(lower) ||
                /\b(did not buy|didn't buy|dont buy|don't buy|no i did not|no i didn't|did not purchase|haven't purchased)\b/i.test(lower);
            const isYes =
                /^(yes|yep|yeah|sure|definitely|absolutely|affirmative|true|correct|right|of course|bought|purchased|got one)\b/i.test(lower) ||
                /\b(bought a blade|bought a razor|yes i did|yes i bought|bought one|i remember)\b/i.test(lower);

            if (isNo) {
                // Condition B: No -> End the call
                if (surveySessionId) {
                    await this.surveyExecutionService.submitAnswer(surveySessionId, {
                        questionId: currentQuestion.questionId,
                        rawAnswer: customerText,
                        normalizedAnswer: "no",
                        answerType: "yes_no",
                        confidence: 1.0,
                    });
                    await this.surveyExecutionService.completeSurvey(surveySessionId);
                }
                return {
                    speechText: "Understood. Thank you so much for your time today. Have a wonderful day!",
                    currentQuestion: null,
                    isCompleted: true,
                };
            }

            if (isYes) {
                // Condition A: Yes – continue to other questions (Q2 Brand Recall)
                const q2 = surveyQuestionsList.find(q => q.order === 2);
                if (surveySessionId) {
                    await this.surveyExecutionService.submitAnswer(surveySessionId, {
                        questionId: currentQuestion.questionId,
                        rawAnswer: customerText,
                        normalizedAnswer: "yes",
                        answerType: "yes_no",
                        confidence: 1.0,
                    });
                    if (q2) {
                        await this.surveyExecutionService.moveToNextQuestion(surveySessionId, q2.questionId);
                    }
                }
                return {
                    speechText: "Thank you! What brand of razor did you purchase?",
                    currentQuestion: q2,
                    isCompleted: false,
                };
            }

            // Neither yes nor no - stay on Q1 and clarify
            return {
                speechText: "Could you please confirm if you remember purchasing any razor or blade in the last 1 month at a discounted rate — Yes or No?",
                currentQuestion: currentQuestion,
                isCompleted: false,
            };
        }

        // Turn 2: Responding to Q2 (Brand Recall)
        if (currentOrder === 2) {
            // Check if respondent is answering the Gillette Guard recall prompt
            const wasGuardAidedPrompt = /yellow.*black handle|gillette guard.*as well/i.test(lastAssistantMsg);

            if (wasGuardAidedPrompt) {
                const isNo = /^(no|nope|nah|never|not really|only the other|just the other|no i did not|no i didn't)\b/i.test(lower);
                if (isNo) {
                    // Condition: If answer is no even after this prompt, end the call
                    if (surveySessionId) {
                        await this.surveyExecutionService.submitAnswer(surveySessionId, {
                            questionId: currentQuestion.questionId,
                            rawAnswer: customerText,
                            normalizedAnswer: "any_other_brands",
                            answerType: "single_choice",
                            confidence: 1.0,
                        });
                        await this.surveyExecutionService.completeSurvey(surveySessionId);
                    }
                    return {
                        speechText: "Understood. Thank you so much for your time and feedback today. Have a wonderful day!",
                        currentQuestion: null,
                        isCompleted: true,
                    };
                }

                // If they say yes to the Guard prompt, proceed to Q3
                const q3 = surveyQuestionsList.find(q => q.order === 3);
                if (surveySessionId) {
                    await this.surveyExecutionService.submitAnswer(surveySessionId, {
                        questionId: currentQuestion.questionId,
                        rawAnswer: customerText,
                        normalizedAnswer: "gillette_guard",
                        answerType: "single_choice",
                        confidence: 1.0,
                    });
                    if (q3) {
                        await this.surveyExecutionService.moveToNextQuestion(surveySessionId, q3.questionId);
                    }
                }
                return {
                    speechText: "Great! Before purchasing Gillette Guard Razor, how did you usually shave?",
                    currentQuestion: q3,
                    isCompleted: false,
                };
            }

            // First time answering Q2
            const isGuard = /\b(gillette guard|guard)\b/i.test(lower);
            const isGillette = /\b(gillette|yellow pack|black handle)\b/i.test(lower);

            if (isGuard) {
                // A. Gillette Guard -> Continue to Q3
                const q3 = surveyQuestionsList.find(q => q.order === 3);
                if (surveySessionId) {
                    await this.surveyExecutionService.submitAnswer(surveySessionId, {
                        questionId: currentQuestion.questionId,
                        rawAnswer: customerText,
                        normalizedAnswer: "gillette_guard",
                        answerType: "single_choice",
                        confidence: 1.0,
                    });
                    if (q3) {
                        await this.surveyExecutionService.moveToNextQuestion(surveySessionId, q3.questionId);
                    }
                }
                return {
                    speechText: "Great! Before purchasing Gillette Guard Razor, how did you usually shave?",
                    currentQuestion: q3,
                    isCompleted: false,
                };
            }

            if (isGillette) {
                // B. Any Gillette -> Continue to Q3 (aid recall: yellow pack, black plastic handle)
                const q3 = surveyQuestionsList.find(q => q.order === 3);
                if (surveySessionId) {
                    await this.surveyExecutionService.submitAnswer(surveySessionId, {
                        questionId: currentQuestion.questionId,
                        rawAnswer: customerText,
                        normalizedAnswer: "any_gillette",
                        answerType: "single_choice",
                        confidence: 1.0,
                    });
                    if (q3) {
                        await this.surveyExecutionService.moveToNextQuestion(surveySessionId, q3.questionId);
                    }
                }
                return {
                    speechText: "Got it, thank you! Before purchasing Gillette Guard Razor, how did you usually shave?",
                    currentQuestion: q3,
                    isCompleted: false,
                };
            }

            // C. Any other brands -> Prompt asking if they remember buying Gillette Guard
            return {
                speechText: "Do you remember purchasing the Gillette Guard razor as well? The pack is yellow, with a plastic black handle of the razor.",
                currentQuestion: currentQuestion,
                isCompleted: false,
            };
        }

        // Turn 3: Responding to Q3 (New User Hit Rate)
        if (currentOrder === 3) {
            // Emphasize before Guard razor, do not prompt with options, multiple answers acceptable
            const matched: string[] = [];
            if (/\b(barber|salon)\b/i.test(lower)) matched.push("used_to_visit_a_barber");
            if (/\b(trimmer|trim|machine|electric)\b/i.test(lower)) matched.push("trimmer");
            if (/\b(mach 3|mach3)\b/i.test(lower)) matched.push("used_gillette_mach3");
            if (/\b(fusion)\b/i.test(lower)) matched.push("gillette_fusion");
            if (/\b(gillette guard|guard)\b/i.test(lower)) matched.push("used_gillette_guard");
            if (/\b(disposable|use and throw|single use|throw)\b/i.test(lower)) matched.push("disposable/use_and_throw_razor");
            if (/\b(laser|supermax|other|regular|normal razor|another)\b/i.test(lower)) matched.push("other_razor_brands");
            if (/\b(facial hair|no shave|didn't shave|did not shave|beard|keep beard)\b/i.test(lower)) matched.push("does_not_remove_facial_hair");
            if (matched.length === 0) {
                const isOffTopic = /^(what|why|who|how|when|hello|hey|wait|pardon|sorry|ok|okay|tell me|can you)\b/i.test(lower) || lower.length < 3;
                if (isOffTopic) {
                    return {
                        speechText: "Before purchasing the Gillette Guard Razor, how did you usually shave — for instance, did you use a barber, a trimmer, or another razor?",
                        currentQuestion: currentQuestion,
                        isCompleted: false,
                    };
                }
                matched.push(customerText);
            }

            const q4 = surveyQuestionsList.find(q => q.order === 4);
            if (surveySessionId) {
                await this.surveyExecutionService.submitAnswer(surveySessionId, {
                    questionId: currentQuestion.questionId,
                    rawAnswer: customerText,
                    normalizedAnswer: matched,
                    answerType: "multiple_choice",
                    confidence: 1.0,
                });
                if (q4) {
                    await this.surveyExecutionService.moveToNextQuestion(surveySessionId, q4.questionId);
                }
            }
            return {
                speechText: "Thank you! Do you plan to purchase Guard razor or cartridges in future?",
                currentQuestion: q4,
                isCompleted: false,
            };
        }

        // Turn 4: Responding to Q4 (Repeat Intent)
        if (currentOrder === 4) {
            const isYes = /\b(yes|yep|yeah|sure|definitely|absolutely|i will|plan to|of course)\b/i.test(lower);
            const isMaybe = /\b(maybe|perhaps|not sure|might be|possibly|dont know|don't know)\b/i.test(lower);
            const isNo = /\b(no|nope|nah|never|not planning|will not|wont|won't)\b/i.test(lower);

            if (isYes || isMaybe) {
                // A. Yes / C. Maybe -> Skip Q5, end call
                const answerVal = isYes ? "yes" : "maybe";
                if (surveySessionId) {
                    await this.surveyExecutionService.submitAnswer(surveySessionId, {
                        questionId: currentQuestion.questionId,
                        rawAnswer: customerText,
                        normalizedAnswer: answerVal,
                        answerType: "single_choice",
                        confidence: 1.0,
                    });
                    await this.surveyExecutionService.completeSurvey(surveySessionId);
                }
                const closeSpeech = isYes
                    ? "That's great to hear! Thank you so much for your valuable feedback today. Have a wonderful day!"
                    : "Understood! Thank you so much for taking the time to share your feedback with us today. Have a great day!";
                return {
                    speechText: closeSpeech,
                    currentQuestion: null,
                    isCompleted: true,
                };
            }

            if (isNo) {
                // B. No -> Proceed to Q5
                const q5 = surveyQuestionsList.find(q => q.order === 5);
                if (surveySessionId) {
                    await this.surveyExecutionService.submitAnswer(surveySessionId, {
                        questionId: currentQuestion.questionId,
                        rawAnswer: customerText,
                        normalizedAnswer: "no",
                        answerType: "single_choice",
                        confidence: 1.0,
                    });
                    if (q5) {
                        await this.surveyExecutionService.moveToNextQuestion(surveySessionId, q5.questionId);
                    }
                }
                return {
                    speechText: "You said you will not buy Guard razor again, please mention why will you not buy it?",
                    currentQuestion: q5,
                    isCompleted: false,
                };
            }

            // Ambiguous
            return {
                speechText: "Could you please confirm if you plan to purchase Guard razor or cartridges in the future — Yes, No, or Maybe?",
                currentQuestion: currentQuestion,
                isCompleted: false,
            };
        }

        // Turn 5: Responding to Q5 (Reasons for Not Buying - only reached if Q4 is No)
        if (currentOrder === 5) {
            let reason = "other";
            if (/\b(barber|salon)\b/i.test(lower)) reason = "prefer_to_go_to_barber";
            else if (/\b(benefit|same benefit|current razor)\b/i.test(lower)) reason = "i_am_already_getting_the_same_benefits_with_my_current_razor";
            else if (/\b(clean shave|clean|rough|smooth)\b/i.test(lower)) reason = "i_think_it_will_not_give_a_clean_shave";
            else if (/\b(promotion|discount|offer|price|cost|expensive)\b/i.test(lower)) reason = "it_was_not_on_promotion";
            else if (/\b(redness|irritation|rash|burning|itch)\b/i.test(lower)) reason = "it_caused_redness_and_irritation";
            else if (/\b(cut|cuts|bleed|bleeding|nicks)\b/i.test(lower)) reason = "it_caused_cuts";
            else if (/\b(blade|blades|last|dull|short)\b/i.test(lower)) reason = "blades_did_not_last_as_long_as_i_expected";
            else if (/\b(stuck|clog|clogged|hair)\b/i.test(lower)) reason = "hair_got_stuck_in_razor";
            else if (/\b(recommend|family|friend)\b/i.test(lower)) reason = "none_of_my_friends/family_members_recommended_it_to_me";
            else if (/\b(available|store|shop|stock)\b/i.test(lower)) reason = "it_was_not_available_in_store";
            else reason = customerText;

            if (surveySessionId) {
                await this.surveyExecutionService.submitAnswer(surveySessionId, {
                    questionId: currentQuestion.questionId,
                    rawAnswer: customerText,
                    normalizedAnswer: reason,
                    answerType: "single_choice",
                    confidence: 1.0,
                });
                await this.surveyExecutionService.completeSurvey(surveySessionId);
            }
            return {
                speechText: "Thank you so much for sharing your feedback with us today. That was all our questions. Have a wonderful day!",
                currentQuestion: null,
                isCompleted: true,
            };
        }

        // If somehow past Q5 or already completed
        return {
            speechText: "Thank you so much for your time and feedback today. Have a wonderful day!",
            currentQuestion: null,
            isCompleted: true,
        };
    }

    // =============================================================
    // TIDE – HTH/RURBAN DETERGENT SAMPLING SURVEY PROTOCOL HANDLER
    // =============================================================
    private async handleTideSurveyTurn(params: {
        lead: any;
        campaign: any;
        surveySessionId?: string;
        currentQuestion: any;
        customerReply?: string;
        conversationId?: string;
        surveyQuestionsList: any[];
    }): Promise<{
        speechText: string;
        currentQuestion: any;
        isCompleted: boolean;
    }> {
        const { lead, surveySessionId, customerReply, conversationId, surveyQuestionsList } = params;
        let currentQuestion = params.currentQuestion;

        const history = conversationId ? await this.chatRepository.getRecentMessages(conversationId, 6) : [];
        const lastAssistantMsg = [...history].reverse().find(m => (m.role as string) === "ASSISTANT")?.content || "";

        // Turn 0: Initial call greeting + Q1 (Doorstep sample purchase)
        if (!customerReply || !customerReply.trim()) {
            const leadName = lead.name || lead.firstName || "there";
            const dateStamp = lead.purchaseDate || lead.orderDate || (lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : "");
            const dateAid = dateStamp ? ` (recorded around ${dateStamp})` : "";
            const q1 = surveyQuestionsList.find(q => q.order === 1) || currentQuestion;
            return {
                speechText: `Hello ${leadName}! I'm calling from Tide regarding detergent powder doorstep sampling. Have you purchased any detergent powder in the last 1 month at your doorstep${dateAid}?`,
                currentQuestion: q1,
                isCompleted: false,
            };
        }

        const customerText = customerReply.trim();
        const lower = customerText.toLowerCase();
        const currentOrder = currentQuestion?.order || 1;

        // Turn 1: Responding to Q1 (Sample Recall)
        if (currentOrder === 1) {
            const isNo =
                /^(no|nope|nah|never|not really|negative|didn't|did not|don't remember|dont remember|not me|haven't|havent)\b/i.test(lower) ||
                /\b(did not buy|didn't buy|dont buy|don't buy|no i did not|no i didn't|did not purchase|haven't purchased)\b/i.test(lower);
            const isYes =
                /^(yes|yep|yeah|sure|definitely|absolutely|affirmative|true|correct|right|of course|bought|purchased|got one)\b/i.test(lower) ||
                /\b(bought detergent|bought powder|yes i did|yes i bought|bought one|i remember|purchased at doorstep)\b/i.test(lower);

            if (isNo) {
                // Condition B: No – End the call!
                if (surveySessionId) {
                    await this.surveyExecutionService.submitAnswer(surveySessionId, {
                        questionId: currentQuestion.questionId,
                        rawAnswer: customerText,
                        normalizedAnswer: "no",
                        answerType: "yes_no",
                        confidence: 1.0,
                    });
                    await this.surveyExecutionService.completeSurvey(surveySessionId);
                }
                return {
                    speechText: "Understood. Thank you so much for your time today. Have a wonderful day!",
                    currentQuestion: null,
                    isCompleted: true,
                };
            }

            if (isYes) {
                // Condition A: Yes – continue to other questions (Q2 Brand Recall)
                const q2 = surveyQuestionsList.find(q => q.order === 2);
                if (surveySessionId) {
                    await this.surveyExecutionService.submitAnswer(surveySessionId, {
                        questionId: currentQuestion.questionId,
                        rawAnswer: customerText,
                        normalizedAnswer: "yes",
                        answerType: "yes_no",
                        confidence: 1.0,
                    });
                    if (q2) {
                        await this.surveyExecutionService.moveToNextQuestion(surveySessionId, q2.questionId);
                    }
                }
                return {
                    speechText: "Thank you! What brand of detergent did you purchase? Start with asking the colour of the pack.",
                    currentQuestion: q2,
                    isCompleted: false,
                };
            }

            // Neither yes nor no - stay on Q1 and clarify
            return {
                speechText: "Could you please confirm if you have purchased any detergent powder in the last 1 month at your doorstep — Yes or No?",
                currentQuestion: currentQuestion,
                isCompleted: false,
            };
        }

        // Turn 2: Responding to Q2 (Brand Recall)
        if (currentOrder === 2) {
            // Check if respondent is answering the Tide recall aid prompt
            const wasTideAidedPrompt = /remember.*buying.*tide|remember.*purchasing.*tide|bright orange pack|orange pack/i.test(lastAssistantMsg);

            if (wasTideAidedPrompt) {
                const isNo = /^(no|nope|nah|never|not really|only the other|just the other|no i did not|no i didn't|didn't buy tide)\b/i.test(lower);
                if (isNo) {
                    // Condition: If the answer is no even after this prompt, end the call.
                    if (surveySessionId) {
                        await this.surveyExecutionService.submitAnswer(surveySessionId, {
                            questionId: currentQuestion.questionId,
                            rawAnswer: customerText,
                            normalizedAnswer: "other_brands",
                            answerType: "single_choice",
                            confidence: 1.0,
                        });
                        await this.surveyExecutionService.completeSurvey(surveySessionId);
                    }
                    return {
                        speechText: "Understood. Thank you so much for your time and feedback today. Have a wonderful day!",
                        currentQuestion: null,
                        isCompleted: true,
                    };
                }

                // If they say yes to the Tide prompt, proceed to Q3
                const q3 = surveyQuestionsList.find(q => q.order === 3);
                if (surveySessionId) {
                    await this.surveyExecutionService.submitAnswer(surveySessionId, {
                        questionId: currentQuestion.questionId,
                        rawAnswer: customerText,
                        normalizedAnswer: "tide",
                        answerType: "single_choice",
                        confidence: 1.0,
                    });
                    if (q3) {
                        await this.surveyExecutionService.moveToNextQuestion(surveySessionId, q3.questionId);
                    }
                }
                return {
                    speechText: "Great! Which brand of detergent did you use the most in the last 1 year before getting the Tide sample?",
                    currentQuestion: q3,
                    isCompleted: false,
                };
            }

            // First time answering Q2
            const isTide = /\b(tide|orange pack)\b/i.test(lower);

            if (isTide) {
                // C. Tide -> Continue to Q3
                const q3 = surveyQuestionsList.find(q => q.order === 3);
                if (surveySessionId) {
                    await this.surveyExecutionService.submitAnswer(surveySessionId, {
                        questionId: currentQuestion.questionId,
                        rawAnswer: customerText,
                        normalizedAnswer: "tide",
                        answerType: "single_choice",
                        confidence: 1.0,
                    });
                    if (q3) {
                        await this.surveyExecutionService.moveToNextQuestion(surveySessionId, q3.questionId);
                    }
                }
                return {
                    speechText: "Great! Which brand of detergent did you use the most in the last 1 year before getting the Tide sample?",
                    currentQuestion: q3,
                    isCompleted: false,
                };
            }

            // If the answer is anything other than C. Tide -> Prompt with asking if they remember buying Tide
            return {
                speechText: "Understood. Do you remember buying Tide detergent powder as well, which comes in a bright orange pack?",
                currentQuestion,
                isCompleted: false,
            };
        }

        // Turn 3: Responding to Q3 (New User Hit Rate)
        if (currentOrder === 3) {
            const wasOptionsPrompt = /was it surf.*ariel.*tide/i.test(lastAssistantMsg);
            const isCannotRemember =
                !wasOptionsPrompt &&
                (/\b(cannot remember|can't remember|dont remember|don't remember|not sure|dont know|don't know|cant recall|don't recall|cannot recall)\b/i.test(lower) ||
                /^(no|not sure|can't say|forgot)\b/i.test(lower));

            if (isCannotRemember) {
                // Note: If the answer is k. Cannot remember – prompt with the options.
                return {
                    speechText: "No problem! Was it Surf, Ariel, Tide, Ghadi, Fena, Rin, Wheel, Sunlight, Safed, or another brand?",
                    currentQuestion,
                    isCompleted: false,
                };
            }

            // Map brand
            let selectedBrand = "other_brands";
            if (/\bsurf\b/i.test(lower)) selectedBrand = "surf";
            else if (/\bariel\b/i.test(lower)) selectedBrand = "ariel";
            else if (/\btide\b/i.test(lower)) selectedBrand = "tide";
            else if (/\bghadi\b/i.test(lower)) selectedBrand = "ghadi";
            else if (/\bfena\b/i.test(lower)) selectedBrand = "fena";
            else if (/\brin\b/i.test(lower)) selectedBrand = "rin";
            else if (/\bwheel\b/i.test(lower)) selectedBrand = "wheel";
            else if (/\bsunlight\b/i.test(lower)) selectedBrand = "sunlight";
            else if (/\bsafed\b/i.test(lower)) selectedBrand = "safed";
            else if (/\b(cannot remember|cant remember|dont remember)\b/i.test(lower)) selectedBrand = "cannot_remember";

            const q4 = surveyQuestionsList.find(q => q.order === 4);
            if (surveySessionId) {
                await this.surveyExecutionService.submitAnswer(surveySessionId, {
                    questionId: currentQuestion.questionId,
                    rawAnswer: customerText,
                    normalizedAnswer: selectedBrand,
                    answerType: "single_choice",
                    confidence: 1.0,
                });
                if (q4) {
                    await this.surveyExecutionService.moveToNextQuestion(surveySessionId, q4.questionId);
                }
            }
            return {
                speechText: "Got it, thank you! Do you plan to purchase Tide detergent in future?",
                currentQuestion: q4,
                isCompleted: false,
            };
        }

        // Turn 4: Responding to Q4 (Repeat Intent)
        if (currentOrder === 4) {
            const isNo = /^(no|nope|nah|never|will not|won't|not really|do not plan|dont plan)\b/i.test(lower);
            const isYes = /^(yes|yep|yeah|sure|definitely|absolutely|plan to|will buy|will purchase)\b/i.test(lower);
            const isMaybe = /^(maybe|perhaps|might|not sure|undecided|possible|possibly)\b/i.test(lower);

            let normalizedAnswer = "not_shared";
            if (isNo) normalizedAnswer = "no";
            else if (isYes) normalizedAnswer = "yes";
            else if (isMaybe) normalizedAnswer = "maybe";

            if (surveySessionId) {
                await this.surveyExecutionService.submitAnswer(surveySessionId, {
                    questionId: currentQuestion.questionId,
                    rawAnswer: customerText,
                    normalizedAnswer,
                    answerType: "single_choice",
                    confidence: 1.0,
                });
            }

            if (isNo) {
                // Condition: Only if Q4 is No -> Proceed to Q5
                const q5 = surveyQuestionsList.find(q => q.order === 5);
                if (surveySessionId && q5) {
                    await this.surveyExecutionService.moveToNextQuestion(surveySessionId, q5.questionId);
                }
                return {
                    speechText: "You said you will not buy Tide detergent again, please mention why will you not buy it?",
                    currentQuestion: q5,
                    isCompleted: false,
                };
            }

            // Yes / Maybe / Not Shared -> End the call!
            if (surveySessionId) {
                await this.surveyExecutionService.completeSurvey(surveySessionId);
            }
            return {
                speechText: "Thank you so much for sharing your feedback with us today! Have a wonderful day!",
                currentQuestion: null,
                isCompleted: true,
            };
        }

        // Turn 5: Responding to Q5 (Reasons why will not buy - Only if Q4 is No)
        if (currentOrder === 5) {
            let reason = "others";
            if (/\b(not affordable|expensive|costly|price|pricey|budget)\b/i.test(lower)) {
                reason = "not_affordable";
            } else if (/\b(tough stains|stains|stain removal|dirty|clean stains)\b/i.test(lower)) {
                reason = "does_not_remove_tough_stains";
            } else if (/\b(foam|lather|jhag|bubble)\b/i.test(lower)) {
                reason = "does_not_give_much_foam_or_lather";
            } else if (/\b(dullness|white clothes|whiteness|yellowing|fading)\b/i.test(lower)) {
                reason = "does_not_remove_dullness_from_white_clothes";
            } else if (/\b(more quantity|too much powder|high quantity|finishes fast)\b/i.test(lower)) {
                reason = "have_to_use_more_quantity";
            } else if (/\b(not available|shop|store|market|cannot find)\b/i.test(lower)) {
                reason = "not_available_in_shops";
            }

            if (surveySessionId) {
                await this.surveyExecutionService.submitAnswer(surveySessionId, {
                    questionId: currentQuestion.questionId,
                    rawAnswer: customerText,
                    normalizedAnswer: reason,
                    answerType: "single_choice",
                    confidence: 1.0,
                });
                await this.surveyExecutionService.completeSurvey(surveySessionId);
            }

            return {
                speechText: "Thank you so much for your honest feedback. We will share this with our product team. Have a wonderful day!",
                currentQuestion: null,
                isCompleted: true,
            };
        }

        return {
            speechText: "Thank you so much for your time and feedback today. Have a wonderful day!",
            currentQuestion: null,
            isCompleted: true,
        };
    }

    // =============================================================
    // DYNAMIC / UPLOADED SURVEY PROTOCOL HANDLER (FOR ANY SURVEY)
    // =============================================================
    private async handleDynamicSurveyTurn(params: {
        lead: any;
        campaign: any;
        surveySessionId?: string;
        currentQuestion: any;
        customerReply?: string;
        conversationId?: string;
        surveyQuestionsList: any[];
        surveyDoc?: any;
    }): Promise<{
        speechText: string;
        currentQuestion: any;
        isCompleted: boolean;
    }> {
        const {
            lead,
            campaign,
            surveySessionId,
            currentQuestion,
            customerReply,
            conversationId,
            surveyQuestionsList,
            surveyDoc,
        } = params;

        // Turn 0: Opening greeting and First Question
        if (!customerReply || !customerReply.trim()) {
            const greeting = `Hi ${lead.name || lead.firstName || "there"}! I'm calling on behalf of ${campaign.businessName || campaign.name || "our team"}.`;
            const q1 = currentQuestion || (surveyQuestionsList.length > 0 ? surveyQuestionsList[0] : null);
            const questionPrompt = q1?.aiPrompt || q1?.text || "Could I ask you a couple of quick questions?";
            return {
                speechText: `${greeting} ${questionPrompt}`,
                currentQuestion: q1,
                isCompleted: false,
            };
        }

        const customerText = customerReply.trim();
        const lowerText = customerText.toLowerCase();

        // Check if customer is asking an off-survey question or objection
        const isOffSurveyQuestion =
            customerText.includes("?") ||
            /^(what|why|how|who|when|where|can you|could you|would you|do you|is there|are there|tell me|explain|cost|pricing|who are you|which company)\b/i.test(lowerText);

        if (isOffSurveyQuestion) {
            try {
                const agentResponse = await this.getAgentService().run({
                    productId: campaign.productId ? campaign.productId.toString() : undefined,
                    question: customerText,
                    conversationId,
                    channel: "VOICE",
                    leadId: lead._id?.toString(),
                    campaignId: campaign._id?.toString(),
                    surveySessionId,
                });
                const kbAnswer = agentResponse.answer || "That is a great question.";
                const resumeQ = currentQuestion ? (currentQuestion.aiPrompt || currentQuestion.text) : "";
                return {
                    speechText: resumeQ ? `${kbAnswer} Coming back to our survey: ${resumeQ}` : kbAnswer,
                    currentQuestion,
                    isCompleted: false,
                };
            } catch (err: any) {
                const resumeQ = currentQuestion ? (currentQuestion.aiPrompt || currentQuestion.text) : "";
                return {
                    speechText: `Understood. Coming back to our question: ${resumeQ}`,
                    currentQuestion,
                    isCompleted: false,
                };
            }
        }

        // Active survey turn: submit answer to current question
        if (surveySessionId && currentQuestion) {
            try {
                const submitResult = await this.surveyExecutionService.submitNaturalLanguageAnswer(
                    surveySessionId,
                    currentQuestion.questionId,
                    customerText
                );

                if (submitResult.completed || !submitResult.nextQuestion) {
                    return {
                        speechText: "Thank you so much for taking the time to share your feedback! That was all the questions I had today. Have a wonderful day!",
                        currentQuestion: null,
                        isCompleted: true,
                    };
                }

                return {
                    speechText: `Understood, thank you! ${submitResult.nextQuestion.aiPrompt || submitResult.nextQuestion.text}`,
                    currentQuestion: submitResult.nextQuestion,
                    isCompleted: false,
                };
            } catch (err: any) {
                console.warn("[handleDynamicSurveyTurn] submitNaturalLanguageAnswer note:", err.message);
            }
        }

        // Resilient fallback: advance to next eligible question in sequence
        const currOrder = currentQuestion?.order || 1;
        const answersMap: Record<string, unknown> = {};
        if (surveySessionId) {
            try {
                const refreshed = await this.surveyExecutionService.getSurveySession(surveySessionId);
                for (const ans of (refreshed?.answers || [])) {
                    const val = ans.normalizedAnswer !== undefined ? ans.normalizedAnswer : ans.rawAnswer;
                    answersMap[ans.questionId] = val;
                    const qObj = surveyQuestionsList.find((q) => q.questionId === ans.questionId);
                    if (qObj) {
                        answersMap[`order_${qObj.order}`] = val;
                        answersMap[`q${qObj.order}`] = val;
                    }
                }
            } catch {}
        }
        const nextQ = (this.surveyExecutionService as any).findNextEligibleQuestion
            ? (this.surveyExecutionService as any).findNextEligibleQuestion(
                surveyQuestionsList,
                currOrder,
                answersMap
            )
            : surveyQuestionsList.find((q) => q.order > currOrder);

        if (nextQ) {
            if (surveySessionId) {
                try {
                    await (this.surveyExecutionService as any).responseRepository.updateCurrentQuestion(
                        surveySessionId,
                        nextQ.questionId
                    );
                } catch {}
            }
            return {
                speechText: `Got it, thank you. ${nextQ.aiPrompt || nextQ.text}`,
                currentQuestion: nextQ,
                isCompleted: false,
            };
        }

        // End of questions reached
        if (surveySessionId) {
            try {
                await (this.surveyExecutionService as any).responseRepository.complete(surveySessionId);
            } catch {}
        }
        return {
            speechText: "Thank you so much for sharing your feedback with us! Have a wonderful day!",
            currentQuestion: null,
            isCompleted: true,
        };
    }
}
