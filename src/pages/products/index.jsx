import { useState, useEffect } from "react";
import productService from "../../api/products";

// ─── Icons ────────────────────────────────────────────────────────────────────

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M9.5 1.5l3 3-8 8H1.5v-3l8-8z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
  </svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path
      d="M2 4h10M5 4V2.5h4V4M5.5 6.5v4M8.5 6.5v4M3 4l.75 7.5h6.5L11 4"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="6.5" cy="6.5" r="4" stroke="currentColor" strokeWidth="1.3" />
    <path d="M11 11l2.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const PackageIcon = () => (
  <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
    <rect x="6" y="10" width="24" height="20" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M12 10V7a2 2 0 012-2h8a2 2 0 012 2v3" stroke="currentColor" strokeWidth="1.5" />
    <path d="M18 16v8M14 20h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatPrice = (price) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(price);

const timeAgo = (ts) => {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

// ─── Modal ────────────────────────────────────────────────────────────────────

function ProductModal({ mode, product, onClose, onSave }) {
  const isEdit = mode === "edit";
  const [form, setForm] = useState({
    name: product?.name ?? "",
    price: product?.price ?? "",
    description: product?.description ?? "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    else if (form.name.length > 100) e.name = "Max 100 characters";
    if (form.price === "" || form.price === null) e.price = "Price is required";
    else if (isNaN(form.price) || Number(form.price) < 0) e.price = "Must be ≥ 0";
    else if (Number(form.price) > 10000000) e.price = "Max $10,000,000";
    if (form.description.length > 500) e.description = "Max 500 characters";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    setLoading(true);
    setApiError("");
    try {
      const payload = {
        name: form.name.trim(),
        price: Number(form.price),
        description: form.description.trim() || undefined,
      };
      if (isEdit) {
        await productService.updateProduct(product._id, payload);
      } else {
        await productService.createProduct(payload);
      }
      onSave();
    } catch (err) {
      const msg = err?.response?.data?.error || "Something went wrong";
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  };

  const field = (key, label, type = "text", placeholder = "") => (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={(e) => {
          setForm((f) => ({ ...f, [key]: e.target.value }));
          setErrors((er) => ({ ...er, [key]: "" }));
        }}
        placeholder={placeholder}
        className={`w-full px-3 py-2 text-sm rounded-lg border bg-white text-gray-800 outline-none transition-all
          ${errors[key] ? "border-red-400 ring-1 ring-red-200" : "border-gray-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-100"}`}
      />
      {errors[key] && <p className="text-xs text-red-500">{errors[key]}</p>}
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.4)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">{isEdit ? "Edit Product" : "New Product"}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-4">
          {apiError && (
            <div className="px-3 py-2.5 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
              {apiError}
            </div>
          )}
          {field("name", "Product Name", "text", "e.g. Blood Culture Panel")}
          {field("price", "Price (USD)", "number", "0.00")}

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Description <span className="normal-case text-gray-400">(optional)</span>
            </label>
            <textarea
              value={form.description}
              onChange={(e) => {
                setForm((f) => ({ ...f, description: e.target.value }));
                setErrors((er) => ({ ...er, description: "" }));
              }}
              placeholder="Brief description of this product..."
              rows={3}
              className={`w-full px-3 py-2 text-sm rounded-lg border bg-white text-gray-800 outline-none resize-none transition-all
                ${errors.description ? "border-red-400 ring-1 ring-red-200" : "border-gray-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-100"}`}
            />
            <div className="flex justify-between">
              {errors.description ? <p className="text-xs text-red-500">{errors.description}</p> : <span />}
              <span className="text-xs text-gray-400">{form.description.length}/500</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Saving…" : isEdit ? "Save Changes" : "Create Product"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

function DeleteModal({ product, onClose, onConfirm }) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    await onConfirm();
    setLoading(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.4)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold text-gray-800">Delete Product?</h2>
          <p className="text-sm text-gray-500">
            <span className="font-medium text-gray-700">"{product.name}"</span> will be permanently removed from your
            lab. This cannot be undone.
          </p>
        </div>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-60 transition-colors"
          >
            {loading ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Product Card ─────────────────────────────────────────────────────────────

function ProductCard({ product, onEdit, onDelete }) {
  return (
    <div className="group bg-white border border-gray-100 rounded-xl p-4 flex flex-col gap-3 hover:border-gray-200 hover:shadow-sm transition-all">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 truncate">{product.name}</p>
          {product.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{product.description}</p>}
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={() => onEdit(product)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            title="Edit"
          >
            <EditIcon />
          </button>
          <button
            onClick={() => onDelete(product)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="Delete"
          >
            <TrashIcon />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-lg font-bold text-gray-900 tabular-nums">{formatPrice(product.price)}</span>
        <span className="text-xs text-gray-400">{timeAgo(product.createdAt)}</span>
      </div>

      {product.createdBy?.name && (
        <div className="flex items-center gap-1.5 pt-2 border-t border-gray-50">
          <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-[10px] font-semibold shrink-0">
            {product.createdBy.name.charAt(0).toUpperCase()}
          </div>
          <span className="text-xs text-gray-400 truncate">{product.createdBy.name}</span>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null); // null | { type: "create" | "edit" | "delete", product? }

  const fetchProducts = async () => {
    try {
      setError("");
      const res = await productService.getProducts();
      setProducts(res.data?.products ?? []);
    } catch {
      setError("Failed to load products. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleDelete = async () => {
    try {
      await productService.deleteProduct(modal.product._id);
      setModal(null);
      fetchProducts();
    } catch {
      // error handled inside modal
    }
  };

  const handleSave = () => {
    setModal(null);
    fetchProducts();
  };

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  const totalValue = products.reduce((sum, p) => sum + p.price, 0);

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-gray-50">
      {/* ── Page Header ── */}
      <div className="bg-white border-b border-gray-100 px-6 py-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Products</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage your lab's test catalogue</p>
          </div>
          <button
            onClick={() => setModal({ type: "create" })}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 active:scale-95 transition-all"
          >
            <PlusIcon />
            New Product
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-5">
          {[
            { label: "Total Products", value: products.length },
            { label: "Avg. Price", value: products.length ? formatPrice(totalValue / products.length) : "—" },
            { label: "Catalogue Value", value: products.length ? formatPrice(totalValue) : "—" },
          ].map((stat) => (
            <div key={stat.label} className="bg-gray-50 rounded-lg px-4 py-3">
              <p className="text-xs text-gray-500">{stat.label}</p>
              <p className="text-lg font-bold text-gray-800 tabular-nums mt-0.5">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Search Bar ── */}
      <div className="px-6 py-4">
        <div className="relative max-w-sm">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <SearchIcon />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products…"
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-800 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <CloseIcon />
            </button>
          )}
        </div>
        {search && (
          <p className="text-xs text-gray-400 mt-2">
            {filtered.length} result{filtered.length !== 1 ? "s" : ""} for "{search}"
          </p>
        )}
      </div>

      {/* ── Content ── */}
      <div className="flex-1 px-6 pb-6 overflow-y-auto">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col gap-3 animate-pulse">
                <div className="h-4 bg-gray-100 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-full" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
                <div className="h-6 bg-gray-100 rounded w-1/3 mt-1" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <p className="text-sm text-red-500">{error}</p>
            <button onClick={fetchProducts} className="text-sm text-blue-600 hover:underline">
              Try again
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <span className="text-gray-300">
              <PackageIcon />
            </span>
            <p className="text-sm font-medium text-gray-500">
              {search ? "No products match your search" : "No products yet"}
            </p>
            {!search && (
              <button onClick={() => setModal({ type: "create" })} className="text-sm text-blue-600 hover:underline">
                Create your first product
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((p) => (
              <ProductCard
                key={p._id}
                product={p}
                onEdit={(prod) => setModal({ type: "edit", product: prod })}
                onDelete={(prod) => setModal({ type: "delete", product: prod })}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {(modal?.type === "create" || modal?.type === "edit") && (
        <ProductModal
          mode={modal.type === "edit" ? "edit" : "create"}
          product={modal.product}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
      {modal?.type === "delete" && (
        <DeleteModal product={modal.product} onClose={() => setModal(null)} onConfirm={handleDelete} />
      )}
    </div>
  );
}
