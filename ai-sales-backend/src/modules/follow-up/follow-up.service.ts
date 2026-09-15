import { Types } from "mongoose";
import { ConversationIntelligenceRepository } from "../conversation-intelligence/conversation-intelligence.repository";
import { FollowUpRepository } from "./follow-up.repository";
import { CreateFollowUpInput, FollowUpPriority, FollowUpScheduleSource, FollowUpStatus, FollowUpType } from "./follow-up.types";

export class FollowUpService {
    private readonly repository = new FollowUpRepository()
    private readonly intelligenceRepository = new ConversationIntelligenceRepository()

    async createFromConversation(conversationId: string) {
        try {
            if (!Types.ObjectId.isValid(conversationId)) {
                throw new Error(
                    "Invalid conversationId"
                );
            }
            const existingFollowUp = await this.repository.findActiveByConversation(conversationId);

            if (existingFollowUp) {
                return existingFollowUp;
            }
            const intelligence = await this.intelligenceRepository.findByConversationId(conversationId)
            if (!intelligence) {
                throw new Error("Conversation intelligence not found. Analyze the conversation first.");
            }

            if (intelligence.outcome === "NOT_INTERESTED" || intelligence.outcome === "LOST") {
                return null;
            }
            const dueDate = this.determineDueDate(intelligence);
            const schedule = this.determineSchedule(intelligence);
            const input: CreateFollowUpInput = {
                conversationId,
                productId: intelligence.productId.toString(),
                task: intelligence.nextBestAction,
                type: this.determineType(intelligence.nextBestAction),
                priority: this.determinePriority(intelligence),
                dueDate: schedule.dueDate,
                scheduleSource: schedule.source,
            }
            return this.repository.create(input);
        } catch (error: any) {

            /*
             * MongoDB duplicate key.
             */

            if (error?.code === 11000) {

                const existing =
                    await this.repository
                        .findActiveByConversation(
                            conversationId
                        );

                if (existing) {
                    return existing;
                }
            }

            throw error;
        }
    }

    async complete(followUpId: string) {
        if (!Types.ObjectId.isValid(followUpId)) {
            throw new Error("Invalid followUpId");
        }
        const followUp = await this.repository.findById(followUpId)

        if (!followUp) {
            throw new Error("Follow-up not found");
        }
        if (followUp.status !== FollowUpStatus.PENDING
        ) {
            throw new Error(
                `Follow-up cannot be completed because it is already ${followUp.status}`
            );
        }
        return this.repository.complete(followUpId)
    }
    async cancel(followUpId: string) {
        if (!Types.ObjectId.isValid(followUpId)) {
            throw new Error(
                "Invalid followUpId"
            );
        }

        const followUp = await this.repository.findById(followUpId)

        if (!followUp) {
            throw new Error("Follow-up not found")
        }
        if (followUp.status !== FollowUpStatus.PENDING) {
            throw new Error(`Follow-up cannot be cancelled because it is already ${followUp.status}`);
        }
        return this.repository.cancel(followUpId)
    }
    async getPendingByProduct(productId: string) {
        if (!Types.ObjectId.isValid(productId)) {
            throw new Error("Invalid productId")
        }

        return this.repository.findPendingByProduct(productId)
    }
    async determineType(action: string): FollowUpType {
        const text = action.toLowerCase()

        if (text.includes("demo")) {
            return FollowUpType.DEMO
        }

        if (text.includes("pricing") || text.includes("price")) {
            return FollowUpType.PRICING
        }
        if (text.includes("proposal")) {
            return FollowUpType.PROPOSAL;
        }
        if (text.includes("email")) {
            return FollowUpType.EMAIL;
        }
        if (text.includes("call")) {
            return FollowUpType.CALL;
        }

        return FollowUpType.GENERAL;
    }

    async determinePriority(intelligence: any): FollowUpPriority {
        if (intelligence.outcome === "DEMO_REQUESTED") {
            return FollowUpPriority.HIGH;
        }
        if (intelligence.outcome === "PURCHASE") {
            return FollowUpPriority.URGENT;
        }

        if (intelligence.outcome === "FOLLOW_UP_REQUIRED") {
            return FollowUpPriority.HIGH;
        }
        if (intelligence.outcome === "INTERESTED") {
            return FollowUpPriority.MEDIUM;
        }
        return FollowUpPriority.LOW;
    }


    async determineDueDate(intelligence: any): Date | undefined {
        const actionItems = intelligence.actionItems ?? []
        const actionWithDueDate = actionItems.find((item: any) => item.dueDate)

        if (actionWithDueDate?.dueDate) {
            const date = new Date(actionWithDueDate?.dueDate)
            if (!Number.isNaN(date.getTime())) {
                return date;
            }
        }

        /*
     * No explicit date.
     *
     * Use outcome-based scheduling.
     */

        const now = new Date()

        switch (intelligence.outcome) {
            case "PURCHASE":
                return now;

            case "DEMO_REQUESTED":
                return this.addDays(now, 1)

            case "FOLLOW_UP_REQUIRED":
                return this.addDays(now, 2)

            case "INTERESTED":
                return this.addDays(now, 3)

            case "PRICING":
                return this.addDays(now, 2)

            default:

                return this.addDays(now, 7);

        }
    }

    private determineSchedule(
        intelligence: any
    ): {
        dueDate: Date;
        source: FollowUpScheduleSource;
    } {

        const actionItems =
            intelligence.actionItems ?? [];


        const actionWithDueDate =
            actionItems.find(
                (
                    item: any
                ) => item.dueDate
            );


        if (
            actionWithDueDate?.dueDate
        ) {

            const date =
                new Date(
                    actionWithDueDate.dueDate
                );


            if (
                !Number.isNaN(
                    date.getTime()
                )
            ) {

                return {
                    dueDate: date,

                    source:
                        FollowUpScheduleSource
                            .CUSTOMER_REQUEST,
                };
            }
        }


        const now =
            new Date();


        switch (
        intelligence.outcome
        ) {

            case "PURCHASE":

                return {
                    dueDate: now,

                    source:
                        FollowUpScheduleSource
                            .OUTCOME_RULE,
                };


            case "DEMO_REQUESTED":

                return {
                    dueDate:
                        this.addDays(
                            now,
                            1
                        ),

                    source:
                        FollowUpScheduleSource
                            .OUTCOME_RULE,
                };


            case "FOLLOW_UP_REQUIRED":

                return {
                    dueDate:
                        this.addDays(
                            now,
                            2
                        ),

                    source:
                        FollowUpScheduleSource
                            .OUTCOME_RULE,
                };


            case "INTERESTED":

                return {
                    dueDate:
                        this.addDays(
                            now,
                            3
                        ),

                    source:
                        FollowUpScheduleSource
                            .OUTCOME_RULE,
                };


            case "PRICING":

                return {
                    dueDate:
                        this.addDays(
                            now,
                            2
                        ),

                    source:
                        FollowUpScheduleSource
                            .OUTCOME_RULE,
                };


            default:

                return {
                    dueDate:
                        this.addDays(
                            now,
                            7
                        ),

                    source:
                        FollowUpScheduleSource
                            .DEFAULT,
                };
        }
    }
    private addDays(date: Date, days: number): Date {
        const result = new Date(date)

        result.setDate(result.getDate() + days)

        return result;
    }
}