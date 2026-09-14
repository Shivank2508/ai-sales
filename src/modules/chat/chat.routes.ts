import { Router } from "express";

import { ChatController } from "./chat.controller";

const router = Router();

const controller =
    new ChatController();

router.post(
    "/",
    controller.chat
);

router.get(
    "/conversation/:id",
    controller.getConversation
);

router.get(
    "/product/:productId",
    controller.getProductConversations
);

router.delete(
    "/conversation/:id",
    controller.deleteConversation
);

export default router;