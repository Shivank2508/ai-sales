import React from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { MainLayout } from "../layouts/MainLayout";

import { DashboardPage } from "../pages/DashboardPage";
import { CampaignListPage } from "../../modules/campaigns/pages/CampaignListPage";
import { CreateCampaignPage } from "../../modules/campaigns/pages/CreateCampaignPage";
import { CampaignDetailsPage } from "../../modules/campaigns/pages/CampaignDetailsPage";
import { EditCampaignPage } from "../../modules/campaigns/pages/EditCampaignPage";

import { SurveyBuilderPage } from "../../modules/surveys/pages/SurveyBuilderPage";
import { SurveyFlowPage } from "../../modules/surveys/pages/SurveyFlowPage";
import { SurveyPreviewPage } from "../../modules/surveys/pages/SurveyPreviewPage";
import { SurveysListPage } from "../../modules/surveys/pages/SurveysListPage";

import { ResponsesListPage } from "../../modules/responses/pages/ResponsesListPage";
import { ResponseDetailPage } from "../../modules/responses/pages/ResponseDetailPage";

import { ConversationListPage } from "../../modules/conversations/pages/ConversationListPage";
import { ConversationDetailPage } from "../../modules/conversations/pages/ConversationDetailPage";

import { AnalyticsPage } from "../../modules/analytics/pages/AnalyticsPage";
import { AgentsListPage } from "../../modules/ai-agents/pages/AgentsListPage";
import { AgentDetailPage } from "../../modules/ai-agents/pages/AgentDetailPage";
import { AgentExecutionPage } from "../../modules/ai-agents/pages/AgentExecutionPage";

import { LeadListPage } from "../../modules/leads/pages/LeadListPage";
import { KnowledgeListPage } from "../../modules/knowledge/pages/KnowledgeListPage";
import { ProductListPage } from "../../modules/products/pages/ProductListPage";
import { FollowUpListPage } from "../../modules/follow-ups/pages/FollowUpListPage";
import { ReportsPage } from "../../modules/reports/pages/ReportsPage";
import { SettingsPage } from "../../modules/settings/pages/SettingsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: <Navigate to="/campaigns" replace /> },
      { path: "dashboard", element: <DashboardPage /> },

      // Campaign Routes
      { path: "campaigns", element: <CampaignListPage /> },
      { path: "campaigns/create", element: <CreateCampaignPage /> },
      { path: "campaigns/:campaignId", element: <CampaignDetailsPage /> },
      { path: "campaigns/:campaignId/edit", element: <EditCampaignPage /> },

      // Survey Builder Routes
      { path: "campaigns/:campaignId/survey", element: <SurveyBuilderPage /> },
      { path: "campaigns/:campaignId/survey/flow", element: <SurveyFlowPage /> },
      { path: "campaigns/:campaignId/survey/preview", element: <SurveyPreviewPage /> },

      // Response Routes
      { path: "campaigns/:campaignId/responses", element: <ResponsesListPage /> },
      { path: "campaigns/:campaignId/responses/:responseId", element: <ResponseDetailPage /> },

      // Conversation Routes
      { path: "campaigns/:campaignId/conversations", element: <ConversationListPage /> },
      { path: "conversations", element: <ConversationListPage /> },
      { path: "conversations/:conversationId", element: <ConversationDetailPage /> },

      // Analytics Routes
      { path: "campaigns/:campaignId/analytics", element: <AnalyticsPage /> },
      { path: "analytics", element: <AnalyticsPage /> },

      // Survey Overview
      { path: "surveys", element: <SurveysListPage /> },

      // AI Agents
      { path: "ai-agents", element: <AgentsListPage /> },
      { path: "ai-agents/live-execution", element: <AgentExecutionPage /> },
      { path: "ai-agents/:agentId", element: <AgentDetailPage /> },

      // Auxiliary Modules
      { path: "leads", element: <LeadListPage /> },
      { path: "knowledge", element: <KnowledgeListPage /> },
      { path: "products", element: <ProductListPage /> },
      { path: "follow-ups", element: <FollowUpListPage /> },
      { path: "reports", element: <ReportsPage /> },
      { path: "settings", element: <SettingsPage /> },

      { path: "*", element: <Navigate to="/campaigns" replace /> },
    ],
  },
]);
