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

        const {
            productId,
            question,
            conversationId,
        } = req.body;

        const result =
            await this.agentService.run({
                productId,
                question,
                conversationId,
            });

        res.status(200).json({
            success: true,

            data: result,
        });
    };
}