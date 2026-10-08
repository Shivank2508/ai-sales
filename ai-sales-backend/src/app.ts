import express from "express";
import cors from "cors";
import "dotenv/config";
import { leadRouter } from "./modules/leads/lead.routes";
import { productRouter } from "./modules/products/product.routes";
import { knowledgeRouter } from "./modules/knowledge/knowledge.routes";
import { documentRouter } from "./modules/documents/document.routes";
import chatRoutes from "./modules/chat/chat.routes";
import { agentRouter } from "./modules/agent/agent.routes";
import voiceRoutes from "./modules/voice/voice.routes";
import conversationIntelligenceRoutes from "./modules/conversation-intelligence/conversation-intelligence.routes";
import followUpRoutes from "./modules/follow-up/follow-up.routes";
import surveyRoutes from "./modules/survey/routes/survey.routes";
import surveySessionRoutes from "./modules/survey/routes/survey-session.routes";
import campaignRoutes from "./modules/campaign/routes/campaign.routes";
import analyticsRoutes from "./modules/analytics/routes/analytics.routes";
import businessInsightsRoutes from "./modules/insights/routes/business-insights.routes";

import twilioRoutes from "./modules/voice/twilio.routes";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Health check
app.get("/health", (req, res) => {
    res.json({ message: "ok" });
});

// Module routes
app.use("/leads", leadRouter);
app.use("/api/leads", leadRouter);

app.use("/products", productRouter);
app.use("/api/products", productRouter);

app.use("/knowledge", knowledgeRouter);
app.use("/api/knowledge", knowledgeRouter);

app.use("/documents", documentRouter);
app.use("/api/documents", documentRouter);

app.use("/voice", voiceRoutes);
app.use("/api/voice", voiceRoutes);

app.use("/voice/twilio", twilioRoutes);
app.use("/api/voice/twilio", twilioRoutes);

app.use("/chat", chatRoutes);
app.use("/api/chat", chatRoutes);

app.use("/agent", agentRouter);
app.use("/api/agent", agentRouter);

app.use("/conversation-intelligence", conversationIntelligenceRoutes);
app.use("/api/conversation-intelligence", conversationIntelligenceRoutes);

app.use("/follow-ups", followUpRoutes);
app.use("/api/follow-ups", followUpRoutes);

app.use("/surveys", surveyRoutes);
app.use("/api/surveys", surveyRoutes);

app.use("/survey-sessions", surveySessionRoutes);
app.use("/api/survey-sessions", surveySessionRoutes);

app.use("/campaigns", campaignRoutes);
app.use("/api/campaigns", campaignRoutes);

app.use("/analytics", analyticsRoutes);
app.use("/api/analytics", analyticsRoutes);

app.use("/insights", businessInsightsRoutes);
app.use("/api/insights", businessInsightsRoutes);

export default app;
