import { Router } from "express";
import { SurveyController } from "../controllers/SurveyController";
<<<<<<< HEAD
import { surveyUpload } from "../../../config/upload";
=======
>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a

const router = Router();

const controller =
    new SurveyController();

/*
 * Survey
 */

router.post(
<<<<<<< HEAD
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
=======
>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
    "/",
    controller.createSurvey
);

router.get(
<<<<<<< HEAD
    "/",
    controller.getAllSurveys
);

router.get(
    "/campaign/:campaignId",
    controller.getByCampaign
);

router.get(
=======
>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
    "/:id",
    controller.getSurvey
);

router.put(
<<<<<<< HEAD
    "/:id/ai-edit",
    controller.editAI
);

router.put(
=======
>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
    "/:id",
    controller.updateSurvey
);

<<<<<<< HEAD
router.post(
    "/:id/questions/bulk",
    controller.saveQuestions
);

=======
>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a

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