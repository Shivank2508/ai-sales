import { LeadService } from "../leads/lead.service";
import { LeadStatusService } from "./lead-status.service";

export class LeadAutomationService {
    private readonly statusService = new LeadStatusService()
    private readonly leadService = new LeadService()

    async processConversation(leadId: string, conversationId: string) {
        const decision = await this.statusService.determineStatus(conversationId)

        const lead = await this.leadService.updateStatusFromConversation(leadId, decision.status)

        return {
            lead,
            decision,
        }
    }
}