import { Request, Response } from "express";
import { FollowUpService } from "./follow-up.service";

export class FollowUpController {
<<<<<<< HEAD
    private readonly service = new FollowUpService();

    createFromConversation = async (req: Request, res: Response) => {
        const conversationId = String(req.body.conversationId || "");
=======
    private readonly service = new FollowUpService()

    createFromConversation = async (req: Request, res: Response) => {
        const { conversationId } = req.body
>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
        if (!conversationId) {
            return res.status(400).json({
                success: false,
                message: "conversationId is required",
            });
        }
<<<<<<< HEAD
        const followUp = await this.service.createFromConversation(conversationId);
=======
        const followUp = await this.service.createFromConversation(conversationId)
>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
        return res.status(201).json({
            success: true,
            data: followUp,
        });
<<<<<<< HEAD
    };

    complete = async (req: Request, res: Response) => {
        const followUpId = String(req.params.followUpId || req.params.id || "");
        if (!followUpId) {
            return res.status(400).json({ success: false, message: "followUpId is required" });
        }
=======
    }

    complete = async (req: Request, res: Response) => {
        const { followUpId, } = req.params;
>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a

        const followUp = await this.service.complete(followUpId);
        return res.status(200).json({
            success: true,
            data: followUp,
        });
<<<<<<< HEAD
    };

    cancel = async (req: Request, res: Response) => {
        const followUpId = String(req.params.followUpId || req.params.id || "");
        if (!followUpId) {
            return res.status(400).json({ success: false, message: "followUpId is required" });
        }
=======
    }

    cancel = async (req: Request, res: Response) => {
        const { followUpId, } = req.params;
>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a

        const followUp = await this.service.cancel(followUpId);
        return res.status(200).json({
            success: true,
            data: followUp,
        });
<<<<<<< HEAD
    };

    getPendingByProduct = async (req: Request, res: Response) => {
        const productId = String(req.params.productId || req.params.id || "");
        if (!productId) {
            return res.status(400).json({ success: false, message: "productId is required" });
        }

        const followUps = await this.service.getPendingByProduct(productId);
=======
    }

    getPendingByProduct = async (req: Request, res: Response) => {
        const { productId, } = req.params;

        const followUps = await this.service.getPendingByProduct(productId)
>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a

        res.status(200).json({
            success: true,
            data: followUps,
<<<<<<< HEAD
        });
    };
=======
        })

    }
>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
}