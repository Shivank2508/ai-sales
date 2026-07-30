import type {
    Request,
    Response,
} from "express";
import { KnowledgeService } from "./knowledge.service.js";

const knowledgeService =
    new KnowledgeService();

export async function createKnowledge(
    req: Request,
    res: Response
): Promise<void> {
    const item =
        await knowledgeService.createKnowledge(
            req.body
        );

    res.send({
        statusCode: 201,
        message: "Knowledge item created successfully",
        data: item,
    });
}

export async function getKnowledgeItems(
    req: Request,
    res: Response
): Promise<void> {
    const productId =
        typeof req.query.productId === "string"
            ? req.query.productId
            : undefined;

    const items =
        await knowledgeService.getKnowledgeItems(
            productId
        );

    res.send({
        message: "Knowledge items fetched successfully",
        data: items,
    });
}

export async function getKnowledge(
    req: Request<{ id: string }>,
    res: Response
): Promise<void> {
    const item =
        await knowledgeService.getKnowledge(
            req.params.id
        );

    res.send({
        message: "Knowledge item fetched successfully",
        data: item,
    });
}

export async function updateKnowledge(
    req: Request<{ id: string }>,
    res: Response
): Promise<void> {
    const item =
        await knowledgeService.updateKnowledge(
            req.params.id,
            req.body
        );

    res.send({
        message: "Knowledge item updated successfully",
        data: item,
    });
}

export async function deleteKnowledge(
    req: Request<{ id: string }>,
    res: Response
): Promise<void> {
    await knowledgeService.deleteKnowledge(
        req.params.id
    );

    res.send({
        message: "Knowledge item deleted successfully",
        data: null,
    });
}