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

<<<<<<< HEAD
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
=======
    async findByQuestionId(surveyId: string, questionId: string): Promise<ISurveyQuestion | null> {
        return SurveyQuestionModel.findOne({
            surveyId,
>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
            questionId,
        }).exec();
    }

    async findBySurveyId(surveyId: string): Promise<ISurveyQuestion[]> {
        return SurveyQuestionModel
<<<<<<< HEAD
            .find(this.resolveSurveyQuery(surveyId))
=======
            .find({
                surveyId,
            })
>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
            .sort({
                order: 1,
            })
            .exec();
    }
    async findFirstQuestion(surveyId: string): Promise<ISurveyQuestion | null> {
<<<<<<< HEAD
        return SurveyQuestionModel.findOne(
            this.resolveSurveyQuery(surveyId)
        ).sort({ order: 1 }).exec()
=======
        return SurveyQuestionModel.findOne({
            surveyId
        }).sort({ order: 1 }).exec()
>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
    }
    async findNextByOrder(surveyId: string, currentOrder: number): Promise<ISurveyQuestion | null> {
        return SurveyQuestionModel
            .findOne({
<<<<<<< HEAD
                ...this.resolveSurveyQuery(surveyId),
=======
                surveyId,
>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
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