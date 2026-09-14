import { Router } from "express";

import {
    createLead,
    getLeads,
    getLead,
    updateLead,
    deleteLead,
} from "./lead.controller.js";

export const leadRouter = Router();

leadRouter.post("/", createLead);

leadRouter.get("/", getLeads);

leadRouter.get("/:id", getLead);

leadRouter.patch("/:id", updateLead);

leadRouter.delete("/:id", deleteLead);