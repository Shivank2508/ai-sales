import { Types } from "mongoose";
import { FollowUpModel } from "./follow-up.model";
import { CreateFollowUpInput, FollowUpStatus } from "./follow-up.types";

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

    async findPendingByProduct(productId: string) {
        return FollowUpModel
            .find({
                productId: new Types.ObjectId(productId),
                status: FollowUpStatus.PENDING,
            })
            .sort({
                dueDate: 1,
                priority: -1,
            })
            .lean();
    }
    async complete(id: string) {
        return FollowUpModel
            .findByIdAndUpdate(
                id,
                {
                    $set: {
                        status:
                            FollowUpStatus.COMPLETED,

                        completedAt:
                            new Date(),
                    },
                },
                {
                    new: true,
                }
            )
            .lean();
    }
    async cancel(id: string) {
        return FollowUpModel.findByIdAndUpdate(
            id,
            {
                $set: {
                    status:
                        FollowUpStatus.CANCELLED,
                },
            },
            {
                new: true,
            }
        )
            .lean();
    }


}