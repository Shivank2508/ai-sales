import { Router } from "express";
import { ChatController } from "./chat.controller";

const router = Router();
const controller = new ChatController();

router.post("/", controller.chat);
router.get("/conversations", controller.listConversations);
router.get("/conversation/:id", controller.getConversation);
router.get("/:id", controller.getConversation);
router.get("/product/:productId", controller.getProductConversations);
router.delete("/conversation/:id", controller.deleteConversation);
router.delete("/:id", controller.deleteConversation);

export default router;