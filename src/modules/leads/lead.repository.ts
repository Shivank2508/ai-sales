import { LeadModel, type Lead } from "./lead.model";
import { CreateLeadInput } from "./lead.types";

export class LeadRepositry {
    async create(
        input: CreateLeadInput
    ): Promise<Lead> {
        const lead = await LeadModel.create(input)
        return lead.toObject()
    }

    async findAll(): Promise<Lead[]> {
        return LeadModel.find()
            .sort({ createdAt: -1 })
            .lean()
            .exec();
    }

    async findById(
        id: string
    ): Promise<Lead | null> {
        return LeadModel.findById(id)
            .lean()
            .exec();
    }
    async findByEmail(email: string): Promise<Lead | null> {
        return LeadModel.findOne({ email })
            .lean()
            .exec();
    }

    async updateById(
        id: string,
        input: Partial<CreateLeadInput>
    ): Promise<Lead | null> {
        return LeadModel
            .findByIdAndUpdate(
                id,
                input,
                {
                    returnDocument: "after",
                    runValidators: true,
                }
            )
            .lean()
            .exec();
    }
    async deleteById(
        id: string
    ): Promise<Lead | null> {
        return LeadModel
            .findByIdAndDelete(id)
            .lean()
            .exec();
    }


    async search(searchTerm: string, limit = 1) {
        const term = searchTerm.trim()

        if (!term) {
            return LeadModel
                .find()
                .sort({
                    createdAt: -1,
                })
                .limit(limit)
                .lean()
                .exec();
        }

        const regex = new RegExp(term, "i");


        return LeadModel.find({
            $or: [
                {
                    name: regex,
                },
                {
                    email: regex,
                },
                {
                    company: regex,
                },
            ],
        }).sort({ createdAt: -1, }).limit(limit).lean().exec();
    }
}