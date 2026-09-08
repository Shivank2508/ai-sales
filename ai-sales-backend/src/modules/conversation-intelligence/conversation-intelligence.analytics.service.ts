import { ConversationAnalytics } from "./conversation-intelligence.analytics.types";
import { ConversationIntelligenceRepository } from "./conversation-intelligence.repository";
import { ConversationIntent, ConversationOutcome, ConversationSentiment, ObjectionType } from "./conversation-intelligence.types";

export class ConversationIntelligenceAnalyticsService {
    private readonly repository = new ConversationIntelligenceRepository()

    async getProductAnalytics(productId: string): Promise<ConversationAnalytics> {
        if (!Types.ObjectId.isValid(productId)) {
            throw new Error("Invalid productId")
        }

        const data = await this.repository.getAnalyticsByProduct(productId)

        const intent = this.initializeEnumCounts(Object.values(ConversationIntent))

        const sentiment = this.initializeEnumCounts(Object.values(ConversationSentiment))

        const outcomes = this.initializeEnumCounts(Object.values(ConversationOutcome))

        const objections = this.initializeEnumCounts(Object.values(ObjectionType))

        for (const item of data.intent) {
            if (item._id in intent) {
                intent[item._id as ConversationIntent] = item.count;
            }
        }

        for (const item of data.sentiment) {
            if (item._id in sentiment) {
                sentiment[item._id as ConversationSentiment] = item.count;
            }
        }

        for (const item of data.outcomes) {
            if (item._id in outcomes) {
                outcomes[item._id as ConversationOutcome] = item.count;
            }
        }
        for (const item of data.objections) {
            if (item._id in objections) {
                objections[item._id as ObjectionType] = item.count;
            }
        }

        const total = data.total;

        const purchaseRate = total > 0
            ? (
                (outcomes[ConversationOutcome.PURCHASE] / total) * 100
            ) : 0;

        const demoRequestRate = total > 0
            ? (
                (outcomes[ConversationOutcome.DEMO_REQUESTED] / total) * 100
            )
            : 0;

        const followUpRate = total > 0
            ? (
                (outcomes[ConversationOutcome.FOLLOW_UP_REQUIRED] / total) * 100
            )
            : 0;


        return {

            totalConversations:
                total,

            intent,

            sentiment,

            outcomes,

            objections,

            buyingSignals:
                data.buyingSignals.map(
                    (item) => ({
                        signal: item._id,
                        count: item.count,
                    })
                ),

            competitorMentions:
                data.competitorMentions.map(
                    (item) => ({
                        competitor: item._id,
                        count: item.count,
                    })
                ),

            purchaseRate:
                Number(
                    purchaseRate.toFixed(2)
                ),

            demoRequestRate:
                Number(
                    demoRequestRate.toFixed(2)
                ),

            followUpRate:
                Number(
                    followUpRate.toFixed(2)
                ),
        };
    }

    private initializeEnumCounts<T extends string>(values: T[]): Record<T, number> {
        return values.reduce(
            (result, value) => {
                result[value] = 0
                return result
            },
            {} as Record<T, number>
        );
    }
}