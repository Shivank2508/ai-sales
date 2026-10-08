import { Router } from "express";
import { SurveyController } from "../controllers/SurveyController";
import { surveyUpload } from "../../../config/upload";

const router = Router();

const controller =
    new SurveyController();

/*
 * Survey
 */

router.post(
    "/generate",
    controller.generateAI
);

router.post(
    "/upload",
    surveyUpload.single("file"),
    controller.uploadSurvey
);

router.post(
    "/:id/upload-questions",
    surveyUpload.single("file"),
    controller.importQuestions
);

router.post(
    "/",
    controller.createSurvey
);

router.get(
    "/",
    controller.getAllSurveys
);

router.get(
    "/campaign/:campaignId",
    controller.getByCampaign
);

router.get(
    "/:id",
    controller.getSurvey
);

router.put(
    "/:id/ai-edit",
    controller.editAI
);

router.put(
    "/:id",
    controller.updateSurvey
);

router.post(
    "/:id/questions/bulk",
    controller.saveQuestions
);


router.get(
    "/:id/questions",
    controller.getQuestions
);

router.post(
    "/:id/questions",
    controller.addQuestion
);

router.put(
    "/:id/questions/:questionId",
    controller.updateQuestion
);

router.delete(
    "/:id/questions/:questionId",
    controller.deleteQuestion
);
router.post(
    "/:id/start",
    controller.startSurvey
);

router.post(
    "/responses/:responseId/answer",
    controller.answerQuestion
);
export default router;