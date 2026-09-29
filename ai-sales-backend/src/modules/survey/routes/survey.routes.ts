import { Router } from "express";
import { SurveyController } from "../controllers/SurveyController";

const router = Router();

const controller =
    new SurveyController();

/*
 * Survey
 */

router.post(
    "/",
    controller.createSurvey
);

router.get(
    "/:id",
    controller.getSurvey
);

router.put(
    "/:id",
    controller.updateSurvey
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