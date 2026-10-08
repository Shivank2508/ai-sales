import { axiosInstance } from "../../../services/api/apiClient";

export interface IProductFeature {
  name: string;
  description?: string;
}

export interface IProductPricing {
  plan: string;
  price?: number;
  currency?: string;
  billingPeriod?: string;
  description?: string;
}

export interface IProduct {
  _id: string;
  name: string;
  description: string;
  category?: string;
  features?: IProductFeature[];
  benefit?: string[];
  targetcustomer?: string[];
  painPointSolved?: string[];
  pricing?: IProductPricing[];
  salesNotes?: string[];
  status?: "DRAFT" | "ACTIVE" | "ARCHIVED" | string;
  createdAt?: string;
  updatedAt?: string;
}

export const productApi = {
  // GET all products
  async getProducts(): Promise<IProduct[]> {
    try {
      const res = await axiosInstance.get("/api/products");
      if (res.data?.data && Array.isArray(res.data.data)) {
        return res.data.data;
      }
    } catch (err) {
      console.warn("Backend getProducts error:", err);
    }
    return [];
  },

  // GET single product
  async getProduct(id: string): Promise<IProduct | null> {
    try {
      const res = await axiosInstance.get(`/api/products/${id}`);
      if (res.data?.data) {
        return res.data.data;
      }
    } catch (err) {
      console.warn("Backend getProduct error:", err);
    }
    return null;
  },

  // CREATE product
  async createProduct(product: Partial<IProduct>): Promise<IProduct> {
    const res = await axiosInstance.post("/api/products", product);
    return res.data?.data;
  },

  // UPDATE product
  async updateProduct(id: string, updates: Partial<IProduct>): Promise<IProduct> {
    const res = await axiosInstance.patch(`/api/products/${id}`, updates);
    return res.data?.data;
  },

  // DELETE product
  async deleteProduct(id: string): Promise<boolean> {
    await axiosInstance.delete(`/api/products/${id}`);
    return true;
  },
};
