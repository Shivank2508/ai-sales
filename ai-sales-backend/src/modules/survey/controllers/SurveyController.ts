import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { SurveyService } from "../services/SurveyService";
import { AISurveyGeneratorService } from "../services/AISurveyGeneratorService";
import { extractTextFromFile } from "../../documents/document.parser";
import { CampaignModel, CampaignType } from "../../campaign/models/Campaign.model";

export class SurveyController {
    private readonly surveyService = new SurveyService();
    private readonly aiSurveyGenerator = new AISurveyGeneratorService();

    uploadSurvey = async (req: Request, res: Response, next: NextFunction) => {
        try {
            let rawContent = req.body.content || "";
            let fileName = req.body.fileName || "";
            let mimeType = "";

            if (req.file) {
                fileName = req.file.originalname;
                mimeType = req.file.mimetype;
                rawContent = await extractTextFromFile(req.file.path, mimeType);
            }

            if (!rawContent || !rawContent.trim()) {
                return res.status(400).json({ success: false, message: "No content or file provided for survey upload" });
            }

            const result = await this.aiSurveyGenerator.importSurveyFromContent({
                rawContent: rawContent.trim(),
                fileName,
                mimeType,
                campaignId: req.body.campaignId,
                name: req.body.name,
                createdBy: (req as any).user?._id || req.body.createdBy,
                channel: req.body.channel || "VOICE",
            });

            if (req.body.campaignId && mongoose.Types.ObjectId.isValid(req.body.campaignId)) {
                await CampaignModel.findByIdAndUpdate(req.body.campaignId, {
                    surveyId: result.survey._id,
                    action: "SURVEY",
                    type: CampaignType.SURVEY,
                });
            }

            return res.status(201).json({
                success: true,
                message: `Successfully uploaded and parsed survey with ${result.parsedCount} questions`,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };

    importQuestions = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const surveyId = String(req.params.id || "");
            let rawContent = req.body.content || "";
            let fileName = req.body.fileName || "";
            let mimeType = "";

            if (req.file) {
                fileName = req.file.originalname;
                mimeType = req.file.mimetype;
                rawContent = await extractTextFromFile(req.file.path, mimeType);
            }

            if (!rawContent || !rawContent.trim()) {
                return res.status(400).json({ success: false, message: "No content or file provided for question import" });
            }

            const append = req.body.append !== "false" && req.body.append !== false;
            const result = await this.aiSurveyGenerator.importQuestionsToExistingSurvey(
                surveyId,
                rawContent.trim(),
                { append, fileName }
            );

            return res.json({
                success: true,
                message: `Successfully imported ${result.addedCount} questions into survey`,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };

    generateAI = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { topic, productContext, productId, campaignId, targetAudience, questionCount, channel } = req.body;
            if (!topic?.trim()) {
                return res.status(400).json({ success: false, message: "Survey topic is required" });
            }

            const result = await this.aiSurveyGenerator.generateSurvey({
                topic: topic.trim(),
                productContext,
                productId,
                campaignId,
                targetAudience,
                questionCount: Number(questionCount) || 5,
                channel: channel || "VOICE",
            });

            if (campaignId && mongoose.Types.ObjectId.isValid(campaignId)) {
                await CampaignModel.findByIdAndUpdate(campaignId, {
                    surveyId: result.survey._id,
                    action: "SURVEY",
                    type: CampaignType.SURVEY,
                });
            }

            return res.status(201).json({
                success: true,
                message: "AI Survey created successfully with voice-optimized questions",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };

    editAI = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = String(req.params.id || "");
            const { instructions } = req.body;
            if (!instructions?.trim()) {
                return res.status(400).json({ success: false, message: "Instructions are required for AI edit" });
            }

            const result = await this.aiSurveyGenerator.editSurveyWithAI(id, instructions);
            return res.json({
                success: true,
                message: "Survey updated via AI successfully",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };

    createSurvey = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const survey = await this.surveyService.createSurvey({
                ...req.body,
                createdBy: (req as any).user?._id || req.body.createdBy,
            });

            return res.status(201).json({
                success: true,
                data: survey,
            });
        } catch (error) {
            next(error);
        }
    };

    getAllSurveys = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const campaignId = typeof req.query.campaignId === "string" ? req.query.campaignId : undefined;
            const surveys = await this.surveyService.getAllSurveys(campaignId);
            return res.json({
                success: true,
                data: surveys,
            });
        } catch (error) {
            next(error);
        }
    };


    getByCampaign = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const campaignId = String(req.params.campaignId || "");
            const survey = await this.surveyService.getSurveyByCampaign(campaignId);
            return res.json({
                success: true,
                data: survey,
            });
        } catch (error) {
            next(error);
        }
    };

    saveQuestions = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = String(req.params.id || "");
            const questions = req.body.questions || req.body;
            const survey = await this.surveyService.saveQuestions(id, questions);
            return res.json({
                success: true,
                data: survey,
            });
        } catch (error) {
            next(error);
        }
    };

    getSurvey = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = String(req.params.id || "");
            const survey = await this.surveyService.getSurvey(id);

            if (!survey) {
                return res.status(404).json({
                    success: false,
                    message: "Survey not found",
                });
            }

            return res.json({
                success: true,
                data: survey,
            });
        } catch (error) {
            next(error);
        }
    };

    updateSurvey = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = String(req.params.id || "");
            const survey = await this.surveyService.updateSurvey(id, req.body);
            return res.json({
                success: true,
                data: survey,
            });
        } catch (error) {
            next(error);
        }
    };

    getQuestions = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const id = String(req.params.id || "");
            const questions = await this.surveyService.getQuestions(id);

            return res.json({
                success: true,
                data: questions,
            });
        } catch (error) {
            next(error);
        }
    };

    addQuestion = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const id = String(req.params.id || "");
            const question = await this.surveyService.addQuestion(
                id,
                req.body
            );

            return res.status(201).json({
                success: true,
                data: question,
            });
        } catch (error) {
            next(error);
        }
    };

    updateQuestion = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const questionId = String(req.params.questionId || "");
            const question = await this.surveyService.updateQuestion(
                questionId,
                req.body
            );

            return res.json({
                success: true,
                data: question,
            });
        } catch (error) {
            next(error);
        }
    };

    deleteQuestion = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const questionId = String(req.params.questionId || "");
            const result = await this.surveyService.deleteQuestion(questionId);

            return res.json({
                success: true,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };

    startSurvey = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const id = String(req.params.id || "");
            const result = await this.surveyService.startSurvey({
                surveyId: id,
                campaignId: String(req.body.campaignId || ""),
                leadId: req.body.leadId ? String(req.body.leadId) : undefined,
                conversationId: req.body.conversationId ? String(req.body.conversationId) : undefined,
            });

            return res.status(201).json({
                success: true,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };

    answerQuestion = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const responseId = String(req.params.responseId || "");
            const result = await this.surveyService.answerQuestion(
                responseId,
                req.body
            );

            return res.json({
                success: true,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };
}