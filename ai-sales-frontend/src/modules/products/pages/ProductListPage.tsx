<<<<<<< HEAD
import React, { useState } from "react";
import { Package, Plus, Trash2, Tag, DollarSign, Layers, CheckCircle2, RefreshCw, Sparkles, X } from "lucide-react";
import { useProducts, useCreateProduct, useDeleteProduct, useUpdateProduct } from "../hooks/useProducts";
import { LoadingSpinner } from "../../../components/common/LoadingSpinner";
import { ErrorState } from "../../../components/common/ErrorState";

export const ProductListPage: React.FC = () => {
  const { data: products, isLoading, isError, error, refetch } = useProducts();
  const createProductMutation = useCreateProduct();
  const deleteProductMutation = useDeleteProduct();
  const updateProductMutation = useUpdateProduct();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  // New Product Form State
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "AI SaaS",
    price: 4999,
    currency: "INR",
    billingPeriod: "MONTHLY",
    features: "AI Lead Scoring, AI Voice Agent, Conversation Intelligence",
    benefits: "Reduce manual qualification, Improve sales productivity",
    targetcustomer: "B2B SaaS companies, Sales teams",
  });

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.description) return;

    const featureList = formData.features
      .split(",")
      .map((f) => f.trim())
      .filter(Boolean)
      .map((name) => ({ name, description: `Automated ${name}` }));

    const benefitList = formData.benefits.split(",").map((b) => b.trim()).filter(Boolean);
    const targetList = formData.targetcustomer.split(",").map((t) => t.trim()).filter(Boolean);

    await createProductMutation.mutateAsync({
      name: formData.name,
      description: formData.description,
      category: formData.category,
      features: featureList,
      benefit: benefitList,
      targetcustomer: targetList,
      pricing: [
        {
          plan: "Standard",
          price: Number(formData.price),
          currency: formData.currency,
          billingPeriod: formData.billingPeriod,
        },
      ],
      status: "ACTIVE",
    });

    setIsModalOpen(false);
    setFormData({
      name: "",
      description: "",
      category: "AI SaaS",
      price: 4999,
      currency: "INR",
      billingPeriod: "MONTHLY",
      features: "AI Lead Scoring, AI Voice Agent, Conversation Intelligence",
      benefits: "Reduce manual qualification, Improve sales productivity",
      targetcustomer: "B2B SaaS companies, Sales teams",
    });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      await deleteProductMutation.mutateAsync(id);
    }
  };

  return (
    <div className="d-flex flex-column gap-3">
      {/* Header */}
      <div className="card shadow-sm border p-3 d-flex flex-row justify-content-between align-items-center">
        <div>
          <div className="d-flex align-items-center gap-2">
            <h1 className="h5 fw-bold mb-0 text-dark">Target Products & Service Catalog</h1>
            <span className="badge bg-primary-subtle text-primary border rounded-pill">
              {products?.length || 0} Products
            </span>
          </div>
          <span className="text-muted small" style={{ fontSize: "11px" }}>
            Backend product profiles ingested by the AI Sales Agent and RAG vector engine.
          </span>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button
            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
            onClick={() => refetch()}
            title="Refresh Products from Backend"
          >
            <RefreshCw size={14} />
            <span>Sync</span>
          </button>
          <button
            className="btn btn-primary btn-sm d-flex align-items-center gap-1 shadow-sm"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus size={15} />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      {isLoading ? (
        <LoadingSpinner message="Fetching products from MongoDB..." />
      ) : isError ? (
        <ErrorState message={(error as any)?.message || "Failed to load products."} onRetry={() => refetch()} />
      ) : !products || products.length === 0 ? (
        <div className="card shadow-sm border p-5 text-center">
          <Package size={36} className="mx-auto text-muted mb-2 opacity-50" />
          <h6 className="fw-bold text-secondary">No Products Ingested</h6>
          <p className="text-muted small mb-3">Add a product to equip your AI voice agents with knowledge & pricing.</p>
          <button className="btn btn-primary btn-sm mx-auto" onClick={() => setIsModalOpen(true)}>
            <Plus size={14} className="me-1" /> Add Product
          </button>
        </div>
      ) : (
        <div className="row g-3">
          {products.map((p) => {
            const pricingItem = p.pricing && p.pricing.length > 0 ? p.pricing[0] : null;
            return (
              <div className="col-12 col-md-6 col-lg-4" key={p._id}>
                <div className="card shadow-sm border h-100 d-flex flex-column justify-content-between p-3">
                  <div>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div className="d-flex align-items-center gap-2">
                        <div className="p-2 bg-primary-subtle text-primary rounded-3">
                          <Package size={20} />
                        </div>
                        <div>
                          <h6 className="fw-bold mb-0 text-dark">{p.name}</h6>
                          <span className="badge bg-light text-secondary border small" style={{ fontSize: "10px" }}>
                            {p.category || "General"}
                          </span>
                        </div>
                      </div>
                      <span className="badge bg-success-subtle text-success border">
                        {p.status || "ACTIVE"}
                      </span>
                    </div>

                    <p className="text-muted small mb-3" style={{ fontSize: "12px", minHeight: "36px" }}>
                      {p.description}
                    </p>

                    {/* Features Chips */}
                    {p.features && p.features.length > 0 && (
                      <div className="mb-3">
                        <span className="text-secondary fw-bold small d-block mb-1" style={{ fontSize: "11px" }}>
                          AI AGENT CAPABILITIES:
                        </span>
                        <div className="d-flex flex-wrap gap-1">
                          {p.features.slice(0, 3).map((f, i) => (
                            <span key={i} className="badge bg-info-subtle text-info-emphasis border small">
                              ✓ {f.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="border-top pt-2 d-flex justify-content-between align-items-center mt-2">
                    <div>
                      <span className="text-muted small d-block" style={{ fontSize: "10px" }}>
                        PRICING / PLAN
                      </span>
                      <strong className="text-success h6 mb-0">
                        {pricingItem
                          ? `${pricingItem.currency === "INR" ? "₹" : "$"}${pricingItem.price}/${pricingItem.billingPeriod?.toLowerCase() || "mo"}`
                          : "Free Tier"}
                      </strong>
                    </div>

                    <div className="d-flex gap-1">
                      <button
                        className="btn btn-outline-danger btn-sm p-1"
                        title="Delete Product"
                        onClick={() => handleDelete(p._id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Product Modal */}
      {isModalOpen && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content shadow-lg border-0">
              <div className="modal-header border-bottom">
                <h5 className="modal-title h6 fw-bold">Add New Product to Catalog</h5>
                <button type="button" className="btn-close" onClick={() => setIsModalOpen(false)}></button>
              </div>
              <form onSubmit={handleCreateProduct}>
                <div className="modal-body d-flex flex-column gap-3">
                  <div className="row g-2">
                    <div className="col-8">
                      <label className="form-label small fw-bold">Product Name *</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. SalesFlow AI Pro"
                      />
                    </div>
                    <div className="col-4">
                      <label className="form-label small fw-bold">Category</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        placeholder="e.g. Sales Technology"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label small fw-bold">Description *</label>
                    <textarea
                      className="form-control form-control-sm"
                      rows={2}
                      required
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief summary of product features and value proposition..."
                    />
                  </div>

                  <div className="row g-2">
                    <div className="col-4">
                      <label className="form-label small fw-bold">Price</label>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                      />
                    </div>
                    <div className="col-4">
                      <label className="form-label small fw-bold">Currency</label>
                      <select
                        className="form-select form-select-sm"
                        value={formData.currency}
                        onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      >
                        <option value="INR">INR (₹)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                      </select>
                    </div>
                    <div className="col-4">
                      <label className="form-label small fw-bold">Billing Cycle</label>
                      <select
                        className="form-select form-select-sm"
                        value={formData.billingPeriod}
                        onChange={(e) => setFormData({ ...formData, billingPeriod: e.target.value })}
                      >
                        <option value="MONTHLY">Monthly</option>
                        <option value="YEARLY">Yearly</option>
                        <option value="ONE_TIME">One Time</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="form-label small fw-bold">Features (comma separated)</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={formData.features}
                      onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                      placeholder="AI Lead Scoring, AI Voice Agent, Call Summarization"
                    />
                  </div>

                  <div className="row g-2">
                    <div className="col-6">
                      <label className="form-label small fw-bold">Key Benefits (comma separated)</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={formData.benefits}
                        onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                        placeholder="Save 10 hrs/week, Increase close rate"
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-bold">Target Customer</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={formData.targetcustomer}
                        onChange={(e) => setFormData({ ...formData, targetcustomer: e.target.value })}
                        placeholder="B2B Founders, SDR Teams"
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-top">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm d-flex align-items-center gap-1"
                    disabled={createProductMutation.isPending}
                  >
                    {createProductMutation.isPending ? "Adding..." : "Save Product"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
=======
import React from "react";
import { Package, Plus } from "lucide-react";

export const ProductListPage: React.FC = () => {
  const products = [
    { id: "1", name: "Gillette Guard", sku: "PG-GUARD-01", category: "Razors", price: "₹25" },
    { id: "2", name: "Gillette Mach3", sku: "PG-MACH3-01", category: "Systems", price: "₹249" },
    { id: "3", name: "Voice CRM Suite", sku: "AF-SAAS-01", category: "Software", price: "$499/mo" },
  ];

  return (
    <div className="d-flex flex-column gap-3">
      <div className="card shadow-sm border p-3 d-flex justify-content-between align-items-center">
        <div>
          <h1 className="h5 fw-bold mb-0 text-dark">Target Products & Services</h1>
          <span className="text-muted small" style={{ fontSize: "11px" }}>
            Product catalog referenced in sales scripts and consumer feedback surveys.
          </span>
        </div>
        <button className="btn btn-primary btn-sm d-flex align-items-center gap-1">
          <Plus size={15} />
          <span>Add Product</span>
        </button>
      </div>

      <div className="card shadow-sm border">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" style={{ fontSize: "13px" }}>
            <thead className="table-light text-secondary small text-uppercase">
              <tr>
                <th className="ps-3">Product Name</th>
                <th>SKU</th>
                <th>Category</th>
                <th>MSRP / Price</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td className="ps-3 fw-bold text-dark d-flex align-items-center gap-2">
                    <Package size={16} className="text-primary" />
                    <span>{p.name}</span>
                  </td>
                  <td className="font-monospace text-muted">{p.sku}</td>
                  <td><span className="badge bg-light text-dark border">{p.category}</span></td>
                  <td><strong className="text-success">{p.price}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
    </div>
  );
};
