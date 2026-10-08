import { Request, Response } from "express";

import { AgentService } from "./agent.service";

export class AgentController {
    constructor(
        private readonly agentService =
            new AgentService()
    ) { }

    chat = async (
        req: Request,
        res: Response
    ) => {
        try {
            const productId =
                req.body.productId ||
                req.body.productID ||
                req.body.product_id ||
                req.body.product;

            const question =
                req.body.question ||
                req.body.message ||
                req.body.text ||
                req.body.prompt ||
                req.body.content;

            const conversationId =
                req.body.conversationId ||
                req.body.conversation_id;

            const leadId =
                req.body.leadId ||
                req.body.lead_id;

            const result =
                await this.agentService.run({
                    productId,
                    question,
                    conversationId,
                    leadId,
                });

            res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error: any) {
            res.status(error.statusCode || 400).json({
                success: false,
                message: error.message || "Failed to process agent chat",
            });
        }
    };
}