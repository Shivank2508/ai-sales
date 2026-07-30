import type {
    Request,
    Response,
} from "express";
import { LeadService } from "./lead.service";

const leadService = new LeadService()

export async function createLead(req: Request,
    res: Response): Promise<void> {
    const lead = await leadService.createLead(req.body)
    res.send({
        statusCode: 201,
        message: "Lead created successfully",
        data: lead,
    })
}


export async function getLeads(
    _req: Request,
    res: Response
): Promise<void> {
    const leads =
        await leadService.getLeads();

    res.send({
        message: "Leads fetched successfully",
        data: leads,
    });
}

export async function getLead(
    req: Request,
    res: Response
): Promise<void> {
    const lead =
        await leadService.getLead(req.params.id);
    res.send({
        message: "Lead fetched successfully",
        data: lead,
    });
}


export async function updateLead(
    req: Request,
    res: Response
): Promise<void> {
    const lead =
        await leadService.updateLead(
            req.params.id,
        );

    res.send({
        message: "Lead updated successfully",
        data: lead,
    })
}

export async function deleteLead(
    req: Request,
    res: Response
): Promise<void> {
    await leadService.deleteLead(req.params.id);
    res.send({
        message: "Lead deleted successfully",
        data: null,
    });
}