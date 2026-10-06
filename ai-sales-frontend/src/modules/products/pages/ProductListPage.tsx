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
    </div>
  );
};
