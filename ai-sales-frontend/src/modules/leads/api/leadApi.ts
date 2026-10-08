import { axiosInstance } from "../../../services/api/apiClient";

export interface ILead {
  _id: string;
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  jobTitle?: string;
  companyName?: string;
  companyWebsite?: string;
  industry?: string;
  companySize?: string;
  location?: string;
  source?: string;
  notes?: string;
  campaignId?: string;
  campaignStatus?: string;
  status: "NEW" | "CONTACTED" | "QUALIFIED" | "UNQUALIFIED" | "CONVERTED" | "LOST" | string;
  score?: number;
  createdAt?: string;
  updatedAt?: string;
}

export const leadApi = {
  // GET all leads (optionally filtered by campaignId)
  async getLeads(campaignId?: string): Promise<ILead[]> {
    try {
      const params = campaignId ? { campaignId } : undefined;
      const res = await axiosInstance.get("/api/leads", { params });
      if (res.data?.data && Array.isArray(res.data.data)) {
        return res.data.data;
      }
    } catch (err) {
      console.warn("Backend getLeads error:", err);
    }
    return [];
  },

  // GET single lead
  async getLead(id: string): Promise<ILead | null> {
    try {
      const res = await axiosInstance.get(`/api/leads/${id}`);
      if (res.data?.data) {
        return res.data.data;
      }
    } catch (err) {
      console.warn("Backend getLead error:", err);
    }
    return null;
  },

  // CREATE lead (with optional campaign assignment)
  async createLead(lead: Partial<ILead> & { campaignId?: string }): Promise<ILead> {
    const res = await axiosInstance.post("/api/leads", lead);
    return res.data?.data;
  },

  // IMPORT multiple leads for a Campaign
  async importLeads(
    leads: Array<Partial<ILead>>,
    campaignId?: string
  ): Promise<{ importedCount: number; leads: ILead[] }> {
    const res = await axiosInstance.post("/api/leads/import", {
      leads,
      campaignId,
    });
    return res.data?.data;
  },

  // UPDATE lead
  async updateLead(id: string, updates: Partial<ILead>): Promise<ILead> {
    const res = await axiosInstance.patch(`/api/leads/${id}`, updates);
    return res.data?.data;
  },

  // DELETE lead
  async deleteLead(id: string): Promise<boolean> {
    await axiosInstance.delete(`/api/leads/${id}`);
    return true;
  },
};

