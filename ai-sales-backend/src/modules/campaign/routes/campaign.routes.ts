import { Router } from "express";
import { CampaignController } from "../controllers/CampaignController";

const router = Router();
const controller = new CampaignController();

router.post("/generate", controller.generateAI);
router.post("/", controller.create);
router.get("/", controller.getAll);
router.get("/business/:businessId", controller.getByBusiness);
router.get("/:id", controller.getById);
router.put("/:id/ai-edit", controller.editAI);
router.put("/:id", controller.update);
router.delete("/:id", controller.delete);

/*
 * Campaign Leads and Calling Outreach
 */
router.get("/:id/leads", controller.getLeads);
router.post("/:id/leads", controller.addLeads);
router.post("/:id/call-lead", controller.callLead);
router.post("/:id/twilio-call", controller.callLeadTwilio);

/*
 * Campaign Lifecycle and Execution
 */
router.post("/:id/launch", controller.launch);
router.post("/:id/publish", controller.publish);
router.post("/:id/pause", controller.pause);
router.post("/:id/resume", controller.resume);
router.post("/:id/cancel", controller.cancel);
router.post("/:id/archive", controller.archive);
router.post("/:id/survey", controller.attachSurvey);

export default router;