import { Router } from "express";
import { AnalyticsController } from "../controllers/AnalyticsController";

const router = Router();
const controller = new AnalyticsController();

router.get("/dashboard", controller.getDashboard);
router.get("/campaigns", controller.getCampaigns);
router.get("/campaigns/:campaignId", controller.getCampaigns);
router.get("/surveys/:surveyId", controller.getSurvey);
router.get("/agent", controller.getAgent);
router.get("/leads/:leadId/360", controller.getLead360);

export default router;
