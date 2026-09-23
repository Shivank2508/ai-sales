import mongoose, { Types } from "mongoose";
import { ISurvey, ISurveyDocument, SurveyModel, SurveyStatus } from "../models/Survey.model";

export class SurveyRepository {
    async create(data: Partial<ISurvey>): Promise<ISurveyDocument> {
        return SurveyModel.create(data);
    }

    async findById(surveyId: string): Promise<ISurveyDocument | null> {
        if (!mongoose.Types.ObjectId.isValid(surveyId)) {
            return null;
        }
        return SurveyModel.findById(surveyId).exec();
    }

    async findByCampaignId(campaignId: string): Promise<ISurveyDocument | null> {
        if (!mongoose.Types.ObjectId.isValid(campaignId)) {
            return null;
        }

        return SurveyModel.findOne({
            campaignId: new Types.ObjectId(campaignId),
        }).exec();
    }

    async findActiveByCampaignId(campaignId: string): Promise<ISurveyDocument | null> {
        if (!mongoose.Types.ObjectId.isValid(campaignId)) {
            return null;
        }

        return SurveyModel.findOne({
            campaignId: new Types.ObjectId(campaignId),
            status: SurveyStatus.ACTIVE,
        }).exec();
    }

    async update(surveyId: string, data: Partial<ISurvey>): Promise<ISurveyDocument | null> {
        if (!mongoose.Types.ObjectId.isValid(surveyId)) {
            return null;
        }


        return SurveyModel.findByIdAndUpdate(surveyId, { $set: data }, { new: true, runValidators: true }).exec()
    }

    async updateStatus(surveyId: string, status: SurveyStatus): Promise<ISurveyDocument | null> {
        return this.update(surveyId, {
            status,
        });
    }

    async delete(surveyId: string): Promise<boolean> {
        if (!mongoose.Types.ObjectId.isValid(surveyId)) {
            return false;
        }
        const result = await SurveyModel.deleteOne({ _id: surveyId, }).exec();

        return result.deletedCount === 1;
    }
}