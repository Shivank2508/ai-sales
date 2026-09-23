import { NextFunction, Request, Response } from "express";
import { SurveyService } from "../services/SurveyService";
import { success } from "zod";

export class SurveyController {
    private readonly surveyService = new SurveyService()

    createSurvey = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const survey = await this.surveyService.createSurvey({
                ...req.body,
                createdBy: req.user?._id || req.body.createdBy,
            })

            return res.status(201).json({
                success: true,
                data: survey,
            });
        } catch (error) {
            next(error)
        }
    }

    getSurvey = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const survey = await this.surveyService.getSurvey(req.params.id)

            if (!survey) {
                return res.status(404).json({
                    success: false,
                    message: "Survey not found",
                });
            }

            return res.json({
                success: true,
                data: survey
            })
        } catch (error) {
            next(error)
        }
    }

    updateSurvey = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const survey = await this.surveyService.updateSurvey(req.params.id, req.body)
            return res.json({
                success: true,
                data: survey,
            })

        } catch (error) {
            next(error)
        }
    }

    getQuestions = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const questions =
                await this.surveyService.getQuestions(
                    req.params.id
                );

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
            const question =
                await this.surveyService.addQuestion(
                    req.params.id,
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
            const question =
                await this.surveyService.updateQuestion(
                    req.params.questionId,
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
            const result =
                await this.surveyService.deleteQuestion(
                    req.params.questionId
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