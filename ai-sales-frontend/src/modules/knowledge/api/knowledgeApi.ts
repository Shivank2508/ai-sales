import { axiosInstance } from "../../../services/api/apiClient";

export interface IKnowledgeItem {
  _id: string;
  productId?: string;
  campaignId?: string;
  type: "SALES_PLAYBOOK" | "FAQ" | "OBJECTION" | "CASE_STUDY" | "FEATURE_DOC" | "CALL_SCRIPT" | "CALL_GUIDELINE" | string;
  title: string;
  content: string;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export const knowledgeApi = {
  // GET knowledge items with optional campaignId or productId filters
  async getKnowledgeItems(campaignId?: string, productId?: string): Promise<IKnowledgeItem[]> {
    try {
      const params: Record<string, string> = {};
      if (campaignId) params.campaignId = campaignId;
      if (productId) params.productId = productId;
      
      const res = await axiosInstance.get("/api/knowledge", { params });
      if (res.data?.data && Array.isArray(res.data.data)) {
        return res.data.data;
      }
    } catch (err) {
      console.warn("Backend getKnowledgeItems error:", err);
    }
    return [];
  },

  // GET single knowledge item
  async getKnowledgeItem(id: string): Promise<IKnowledgeItem | null> {
    try {
      const res = await axiosInstance.get(`/api/knowledge/${id}`);
      if (res.data?.data) {
        return res.data.data;
      }
    } catch (err) {
      console.warn("Backend getKnowledgeItem error:", err);
    }
    return null;
  },

  // CREATE knowledge item
  async createKnowledgeItem(item: Partial<IKnowledgeItem>): Promise<IKnowledgeItem> {
    const res = await axiosInstance.post("/api/knowledge", item);
    return res.data?.data;
  },

  // UPDATE knowledge item
  async updateKnowledgeItem(id: string, updates: Partial<IKnowledgeItem>): Promise<IKnowledgeItem> {
    const res = await axiosInstance.patch(`/api/knowledge/${id}`, updates);
    return res.data?.data;
  },

  // DELETE knowledge item
  async deleteKnowledgeItem(id: string): Promise<boolean> {
    await axiosInstance.delete(`/api/knowledge/${id}`);
    return true;
  },

  // UPLOAD document for vectorization (PDF, DOCX, TXT)
  async uploadDocument(file: File, productId?: string, campaignId?: string): Promise<any> {
    const formData = new FormData();
    formData.append("file", file);
    if (productId) {
      formData.append("productId", productId);
    }
    if (campaignId) {
      formData.append("campaignId", campaignId);
    }
    const res = await axiosInstance.post("/api/documents", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  },
};

