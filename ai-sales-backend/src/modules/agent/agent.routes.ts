import { Router } from "express";

import { AgentController } from "./agent.controller";
import { AgentService } from "./agent.service";

export const agentRouter =
    Router();

const agentController =
    new AgentController(
        new AgentService()
    );

agentRouter.post(
    "/chat",
    agentController.chat
);