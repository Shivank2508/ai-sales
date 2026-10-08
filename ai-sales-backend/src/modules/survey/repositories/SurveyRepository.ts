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

<<<<<<< HEAD
    async findAll(): Promise<ISurveyDocument[]> {
        return SurveyModel.find().sort({ createdAt: -1 }).exec();
    }

    async findAllByCampaignId(campaignId: string): Promise<ISurveyDocument[]> {
        if (!mongoose.Types.ObjectId.isValid(campaignId)) {
            return [];
        }
        return SurveyModel.find({
            $or: [
                { campaignId: new Types.ObjectId(campaignId) },
                { campaignId: campaignId }
            ]
        }).sort({ createdAt: -1 }).exec();
    }

=======
>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
    async findByCampaignId(campaignId: string): Promise<ISurveyDocument | null> {
        if (!mongoose.Types.ObjectId.isValid(campaignId)) {
            return null;
        }

        return SurveyModel.findOne({
<<<<<<< HEAD
            $or: [
                { campaignId: new Types.ObjectId(campaignId) },
                { campaignId: campaignId }
            ]
        }).sort({ createdAt: -1 }).exec();
    }


=======
            campaignId: new Types.ObjectId(campaignId),
        }).exec();
    }

>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
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