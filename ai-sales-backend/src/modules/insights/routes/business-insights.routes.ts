import { Router } from "express";
import { BusinessInsightsController } from "../controllers/BusinessInsightsController";

const router = Router();
const controller = new BusinessInsightsController();

router.get("/", controller.getInsights);
router.post("/generate", controller.generate);

export default router;
