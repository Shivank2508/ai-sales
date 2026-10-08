import type {
    Request,
    Response,
} from "express";
import { LeadService } from "./lead.service";

const leadService = new LeadService();

export async function createLead(req: Request, res: Response): Promise<void> {
    const lead = await leadService.createLead(req.body);
    res.status(201).send({
        statusCode: 201,
        message: "Lead created successfully",
        data: lead,
    });
}

export async function importLeads(req: Request, res: Response): Promise<void> {
    const { leads, campaignId } = req.body;
    if (!Array.isArray(leads) || leads.length === 0) {
        res.status(400).send({
            statusCode: 400,
            message: "leads array is required for import",
        });
        return;
    }
    const result = await leadService.importLeads(leads, campaignId);
    res.status(201).send({
        statusCode: 201,
        message: `Successfully imported ${result.importedCount} leads`,
        data: result,
    });
}

export async function getLeads(req: Request, res: Response): Promise<void> {
    const campaignId = typeof req.query.campaignId === "string" ? req.query.campaignId : undefined;
    const leads = await leadService.getLeads(campaignId);
    res.send({
        message: "Leads fetched successfully",
        data: leads,
    });
}


export async function getLead(req: Request, res: Response): Promise<void> {
    const id = String(req.params.id || "");
    const lead = await leadService.getLead(id);
    res.send({
        message: "Lead fetched successfully",
        data: lead,
    });
}

export async function updateLead(req: Request, res: Response): Promise<void> {
    const id = String(req.params.id || "");
    const lead = await leadService.updateLead(id, req.body);
    res.send({
        message: "Lead updated successfully",
        data: lead,
    });
}

export async function deleteLead(req: Request, res: Response): Promise<void> {
    const id = String(req.params.id || "");
    await leadService.deleteLead(id);
    res.send({
        message: "Lead deleted successfully",
        data: null,
    });
}