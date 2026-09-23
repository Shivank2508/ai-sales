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

/*
 * Questions
 */

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

export default router;