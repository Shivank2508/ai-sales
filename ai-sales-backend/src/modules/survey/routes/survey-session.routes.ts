import { Router } from "express";
import { SurveyExecutionController } from "../controllers/SurveyExecutionController";

const router = Router();
const controller = new SurveyExecutionController();

/*
 * Survey Session Execution Routes
 */

// POST /api/survey-sessions — Start a new survey session
router.post("/", controller.startSession);

// POST /api/survey-sessions/extract-answer — Extract structured answer from natural language
router.post("/extract-answer", controller.extractAnswer);

// GET /api/survey-sessions/:id — Get session by ID
router.get("/:id", controller.getSession);

// GET /api/survey-sessions/:id/current-question — Get current active question
router.get("/:id/current-question", controller.getCurrentQuestion);

// POST /api/survey-sessions/:id/turn — AI Conversational Survey Turn (interpret, clarify, branch, formulate next prompt)
router.post("/:id/turn", controller.processTurn);

// POST /api/survey-sessions/:id/answers — Submit an answer (with condition evaluation)
router.post("/:id/answers", controller.submitAnswer);

// POST /api/survey-sessions/:id/answer-natural — Submit a natural language answer (auto AI extract + branch)
router.post("/:id/answer-natural", controller.submitNaturalLanguageAnswer);

// POST /api/survey-sessions/:id/skip — Skip a question
router.post("/:id/skip", controller.skipQuestion);

// POST /api/survey-sessions/:id/complete — Force complete session
router.post("/:id/complete", controller.completeSession);

// POST /api/survey-sessions/:id/abandon — Mark session as abandoned
router.post("/:id/abandon", controller.abandonSession);

export default router;
