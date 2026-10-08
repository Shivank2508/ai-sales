import { axiosInstance } from "../../../services/api/apiClient";

export interface IFollowUpTask {
  _id: string;
  leadId?: any;
  productId?: string;
  conversationId?: string;
  actionType: "CALL" | "EMAIL" | "DEMO" | "PROPOSAL" | "CHECK_IN" | string;
  scheduledAt?: string;
  status: "PENDING" | "COMPLETED" | "CANCELLED" | string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | string;
  notes?: string;
  reason?: string;
  triggerEvent?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const followUpApi = {
  // GET pending follow-ups for a product
  async getPendingByProduct(productId: string): Promise<IFollowUpTask[]> {
    try {
      const res = await axiosInstance.get(`/api/follow-ups/product/${productId}`);
      if (res.data?.data && Array.isArray(res.data.data)) {
        return res.data.data;
      }
    } catch (err) {
      console.warn("Backend getPendingByProduct error:", err);
    }
    return [];
  },

  // COMPLETE a follow up
  async completeFollowUp(followUpId: string, notes?: string): Promise<any> {
    const res = await axiosInstance.patch(`/api/follow-ups/${followUpId}/complete`, { notes });
    return res.data?.data;
  },

  // CANCEL a follow up
  async cancelFollowUp(followUpId: string, reason?: string): Promise<any> {
    const res = await axiosInstance.patch(`/api/follow-ups/${followUpId}/cancel`, { reason });
    return res.data?.data;
  },
};
