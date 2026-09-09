import { Types } from "mongoose";
import { FollowUpModel } from "./follow-up.model";
import { CreateFollowUpInput } from "./follow-up.types";

export class FollowUpRepository {
    async create(data: CreateFollowUpInput) {
        return FollowUpModel.create({
            conversationId: new Types.ObjectId(data.conversationId),
            productId: new Types.ObjectId(data.productId),
            task: data.task,
            type: data.type,
            priority: data.priority,
            dueDate: data.dueDate,
        })
    }

    async findById(id: string) {
        return FollowUpModel.findById(id).lean();
    }

    async findPendingByProduct(productId)
}