import { Router } from "express";
import {
    createKnowledge,
    deleteKnowledge,
    getKnowledge,
    getKnowledgeItems,
    updateKnowledge,
} from "./knowledge.controller.js";

// import {
//     createKnowledgeSchema,
//     updateKnowledgeSchema,
// } from "./knowledge.schema.js";

export const knowledgeRouter = Router();

knowledgeRouter.post(
    "/",

    createKnowledge
);

knowledgeRouter.get(
    "/",
    getKnowledgeItems
);

knowledgeRouter.get(
    "/:id",
    getKnowledge
);

knowledgeRouter.patch(
    "/:id",
    updateKnowledge
);

knowledgeRouter.delete(
    "/:id",
    deleteKnowledge
);