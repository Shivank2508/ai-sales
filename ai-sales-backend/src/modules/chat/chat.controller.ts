import { Request, Response } from "express";

import { ChatService } from "./chat.service";

export class ChatController {

    constructor(
        private readonly chatService =
            new ChatService()
    ) { }

    chat = async (
        req: Request,
        res: Response
    ) => {

        const result =
            await this.chatService.chat({

                productId:
                    req.body.productId,

                conversationId:
                    req.body.conversationId,

                message:
                    req.body.message,

            });

        return res.status(200).json({

            success: true,

            message:
                "Chat completed successfully.",

            data: result,

        });

    };

    getConversation = async (
        req: Request,
        res: Response
    ) => {

        const conversation =
            await this.chatService.getConversation(
                req.params.id
            );

        return res.json({

            success: true,

            data: conversation,

        });

    };

    getProductConversations = async (
        req: Request,
        res: Response
    ) => {

        const conversations =
            await this.chatService
                .getProductConversations(
                    req.params.productId
                );

        return res.json({

            success: true,

            data: conversations,

        });

    };

    deleteConversation = async (
        req: Request,
        res: Response
    ) => {

        await this.chatService.deleteConversation(
            req.params.id
        );

        return res.json({

            success: true,

            message:
                "Conversation deleted successfully.",

        });

    };

}