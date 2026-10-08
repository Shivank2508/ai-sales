import mongoose from "mongoose";
import { ISurveyQuestion, SurveyQuestionModel } from "../models/SurveyQuestion.model";

export class SurveyQuestionRepository {
    async create(data: Partial<ISurveyQuestion>): Promise<ISurveyQuestion> {
        return SurveyQuestionModel.create(data);
    }
    async createMany(data: Partial<ISurveyQuestion>[]): Promise<ISurveyQuestion[]> {
        return (await SurveyQuestionModel.insertMany(data)) as unknown as ISurveyQuestion[];
    }


    async findbyId(questionId: string): Promise<ISurveyQuestion | null> {
        if (!mongoose.Types.ObjectId.isValid(questionId)) {
            return null;
        }

        return SurveyQuestionModel.findById(
            questionId
        ).exec();
    }

    private resolveSurveyQuery(surveyId: string | mongoose.Types.ObjectId) {
        if (mongoose.Types.ObjectId.isValid(surveyId.toString())) {
            const objId = new mongoose.Types.ObjectId(surveyId.toString());
            return { $or: [{ surveyId: objId }, { surveyId: surveyId.toString() }] };
        }
        return { surveyId };
    }

    async findByQuestionId(surveyId: string, questionId: string): Promise<ISurveyQuestion | null> {
        return SurveyQuestionModel.findOne({
            ...this.resolveSurveyQuery(surveyId),
            questionId,
        }).exec();
    }

    async findBySurveyId(surveyId: string): Promise<ISurveyQuestion[]> {
        return SurveyQuestionModel
            .find(this.resolveSurveyQuery(surveyId))
            .sort({
                order: 1,
            })
            .exec();
    }
    async findFirstQuestion(surveyId: string): Promise<ISurveyQuestion | null> {
        return SurveyQuestionModel.findOne(
            this.resolveSurveyQuery(surveyId)
        ).sort({ order: 1 }).exec()
    }
    async findNextByOrder(surveyId: string, currentOrder: number): Promise<ISurveyQuestion | null> {
        return SurveyQuestionModel
            .findOne({
                ...this.resolveSurveyQuery(surveyId),
                order: {
                    $gt: currentOrder,
                },
            })
            .sort({
                order: 1,
            })
            .exec();
    }

    async update(questionId: string, data: Partial<ISurveyQuestion>): Promise<ISurveyQuestion | null> {
        if (!mongoose.Types.ObjectId.isValid(questionId)) {
            return null;
        }
        return SurveyQuestionModel.findByIdAndUpdate(
            questionId,
            {
                $set: data,
            },
            {
                new: true,
                runValidators: true,
            }
        ).exec();

    }


    async delete(
        questionId: string
    ): Promise<boolean> {
        if (!mongoose.Types.ObjectId.isValid(questionId)) {
            return false;
        }

        const result = await SurveyQuestionModel
            .deleteOne({
                _id: questionId,
            })
            .exec();

        return result.deletedCount === 1;
    }

    async deleteBySurveyId(
        surveyId: string
    ): Promise<number> {
        const result = await SurveyQuestionModel
            .deleteMany({
                surveyId,
            })
            .exec();

        return result.deletedCount;
    }
}