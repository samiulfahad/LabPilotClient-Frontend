import { useState, useEffect, useRef } from "react";
import { Plus, Pencil, Trash2, Search, X, Package, ChevronLeft, ChevronRight, Minus } from "lucide-react";
import productService from "../../api/products";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatPrice = (price) =>
  new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 2,
  }).format(price);

const timeAgo = (ts) => {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const stockBadge = (stock) => {
  if (stock === 0) return { label: "Out of Stock", cls: "bg-red-50 text-red-600 border-red-200" };
  if (stock <= 5) return { label: "Low Stock", cls: "bg-amber-50 text-amber-600 border-amber-200" };
  return { label: "In Stock", cls: "bg-green-50 text-green-600 border-green-200" };
};

// ─── Skeleton Card ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col gap-3 animate-pulse">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 flex flex-col gap-2">
          <div className="h-4 bg-gray-100 rounded-md w-3/4" />
          <div className="h-3 bg-gray-100 rounded-md w-full" />
          <div className="h-3 bg-gray-100 rounded-md w-2/3" />
        </div>
        <div className="w-14 h-6 bg-gray-100 rounded-md shrink-0" />
      </div>
      <div className="flex items-center justify-between mt-1">
        <div className="h-6 bg-gray-100 rounded-md w-28" />
        <div className="h-3 bg-gray-100 rounded-md w-14" />
      </div>
      <div className="flex items-center gap-2 pt-2 border-t border-gray-50">
        <div className="w-5 h-5 rounded-full bg-gray-100 shrink-0" />
        <div className="h-3 bg-gray-100 rounded-md w-28" />
      </div>
    </div>
  );
}

// ─── Product Modal ────────────────────────────────────────────────────────────

function ProductModal({ mode, product, onClose, onSave }) {
  const isEdit = mode === "edit";
  const [form, setForm] = useState({
    name: product?.name ?? "",
    price: product?.price ?? "",
    description: product?.description ?? "",
    stock: product?.stock ?? 0,
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
    else if (Number(form.price) > 10000000) e.price = "Max ৳10,000,000";
    if (form.description.length > 500) e.description = "Max 500 characters";
    if (form.stock === "" || isNaN(form.stock) || Number(form.stock) < 0) e.stock = "Must be ≥ 0";
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
        stock: Number(form.stock),
      };
      if (isEdit) await productService.updateProduct(product._id, payload);
      else await productService.createProduct(payload);
      onSave();
    } catch (err) {
      setApiError(err?.response?.data?.error || "Something went wrong");
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
          setErrors((r) => ({ ...r, [key]: "" }));
        }}
        placeholder={placeholder}
        className={`w-full px-3 py-2 text-sm rounded-lg border bg-white text-gray-800 outline-none transition-all
          ${
            errors[key]
              ? "border-red-400 ring-1 ring-red-200"
              : "border-gray-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
          }`}
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
            <X size={16} />
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
          {field("price", "Price (BDT ৳)", "number", "0.00")}

          {/* Stock */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Initial Stock</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const v = Math.max(0, Number(form.stock) - 1);
                  setForm((f) => ({ ...f, stock: v }));
                  setErrors((r) => ({ ...r, stock: "" }));
                }}
                className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
              >
                <Minus size={14} />
              </button>
              <input
                type="number"
                value={form.stock}
                min={0}
                onChange={(e) => {
                  setForm((f) => ({ ...f, stock: e.target.value }));
                  setErrors((r) => ({ ...r, stock: "" }));
                }}
                className={`w-20 px-3 py-2 text-sm rounded-lg border bg-white text-gray-800 outline-none text-center transition-all
                  ${
                    errors.stock
                      ? "border-red-400 ring-1 ring-red-200"
                      : "border-gray-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                  }`}
              />
              <button
                type="button"
                onClick={() => {
                  setForm((f) => ({ ...f, stock: Number(f.stock) + 1 }));
                  setErrors((r) => ({ ...r, stock: "" }));
                }}
                className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>
            {errors.stock && <p className="text-xs text-red-500">{errors.stock}</p>}
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Description <span className="normal-case text-gray-400">(optional)</span>
            </label>
            <textarea
              value={form.description}
              onChange={(e) => {
                setForm((f) => ({ ...f, description: e.target.value }));
                setErrors((r) => ({ ...r, description: "" }));
              }}
              placeholder="Brief description of this product..."
              rows={3}
              className={`w-full px-3 py-2 text-sm rounded-lg border bg-white text-gray-800 outline-none resize-none transition-all
                ${
                  errors.description
                    ? "border-red-400 ring-1 ring-red-200"
                    : "border-gray-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                }`}
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

// ─── Stock Adjust Modal ───────────────────────────────────────────────────────

function StockModal({ product, onClose, onSave }) {
  const [delta, setDelta] = useState(1);
  const [mode, setMode] = useState("add"); // "add" | "remove"
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const currentStock = product.stock ?? 0;
  const effectiveDelta = mode === "add" ? Math.abs(delta) : -Math.abs(delta);
  const preview = currentStock + effectiveDelta;

  const handleSubmit = async () => {
    if (!delta || Number(delta) === 0) return;
    if (preview < 0) {
      setApiError("Stock cannot go below zero");
      return;
    }
    setLoading(true);
    setApiError("");
    try {
      await productService.adjustStock(product._id, effectiveDelta, note.trim() || undefined);
      onSave();
    } catch (err) {
      setApiError(err?.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.4)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-800">Adjust Stock</h2>
            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[220px]">{product.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">
          {apiError && (
            <div className="px-3 py-2.5 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
              {apiError}
            </div>
          )}

          {/* Current stock */}
          <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
            <span className="text-xs text-gray-500">Current Stock</span>
            <span className="text-sm font-bold text-gray-800 tabular-nums">{currentStock} units</span>
          </div>

          {/* Add / Remove toggle */}
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            <button
              onClick={() => setMode("add")}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                mode === "add" ? "bg-green-500 text-white" : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              + Add
            </button>
            <button
              onClick={() => setMode("remove")}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                mode === "remove" ? "bg-red-500 text-white" : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              − Remove
            </button>
          </div>

          {/* Quantity */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Quantity</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDelta((d) => Math.max(1, Number(d) - 1))}
                className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
              >
                <Minus size={14} />
              </button>
              <input
                type="number"
                value={delta}
                min={1}
                onChange={(e) => setDelta(e.target.value)}
                className="w-20 px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white text-gray-800 outline-none text-center focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all"
              />
              <button
                type="button"
                onClick={() => setDelta((d) => Number(d) + 1)}
                className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          {/* Note */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Note <span className="normal-case text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Received new batch"
              maxLength={200}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white text-gray-800 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all"
            />
          </div>

          {/* Preview */}
          <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
            <span className="text-xs text-gray-500">New Stock</span>
            <span className={`text-sm font-bold tabular-nums ${preview < 0 ? "text-red-500" : "text-gray-800"}`}>
              {preview} units
            </span>
          </div>
        </div>

        <div className="px-6 pb-5 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || preview < 0}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Saving…" : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Modal ─────────────────────────────────────────────────────────────

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

function ProductCard({ product, onEdit, onDelete, onAdjustStock }) {
  const stock = product.stock ?? 0;
  const badge = stockBadge(stock);

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
            <Pencil size={14} />
          </button>
          <button
            onClick={() => onDelete(product)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-lg font-bold text-gray-900 tabular-nums">{formatPrice(product.price)}</span>
        <span className="text-xs text-gray-400">{timeAgo(product.createdAt)}</span>
      </div>

      {/* Stock row */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onAdjustStock(product)}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-600 transition-colors"
          title="Adjust stock"
        >
          <span className="tabular-nums font-medium">{stock}</span>
          <span className="text-gray-400">in stock</span>
          <span className="text-gray-300">·</span>
          <span className="text-blue-500 hover:underline">adjust</span>
        </button>
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${badge.cls}`}>{badge.label}</span>
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

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({ pagination, onPageChange }) {
  const { page, totalPages, total, limit } = pagination;
  if (totalPages <= 1) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const delta = 2;
  const pages = [];
  for (let i = Math.max(1, page - delta); i <= Math.min(totalPages, page + delta); i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-between px-1 py-4">
      <p className="text-xs text-gray-400">
        Showing{" "}
        <span className="font-medium text-gray-600">
          {from}–{to}
        </span>{" "}
        of <span className="font-medium text-gray-600">{total}</span> products
      </p>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={16} />
        </button>

        {pages[0] > 1 && (
          <>
            <button
              onClick={() => onPageChange(1)}
              className="min-w-[30px] h-[30px] text-xs rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
            >
              1
            </button>
            {pages[0] > 2 && <span className="text-xs text-gray-400 px-1">…</span>}
          </>
        )}

        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`min-w-[30px] h-[30px] text-xs rounded-lg transition-colors font-medium
              ${p === page ? "bg-blue-600 text-white" : "hover:bg-gray-100 text-gray-600"}`}
          >
            {p}
          </button>
        ))}

        {pages[pages.length - 1] < totalPages && (
          <>
            {pages[pages.length - 1] < totalPages - 1 && <span className="text-xs text-gray-400 px-1">…</span>}
            <button
              onClick={() => onPageChange(totalPages)}
              className="min-w-[30px] h-[30px] text-xs rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const LIMIT = 50;
const DEBOUNCE_MS = 400;

export default function Products() {
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: LIMIT, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null); // null | { type, product? }
  const debounceRef = useRef(null);

  // ── Debounce handler ──────────────────────────────────────────────────────
  const handleSearchChange = (value) => {
    setSearch(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, DEBOUNCE_MS);
  };

  // ── Fetch — plain async function, NOT useCallback ─────────────────────────
  const fetchProducts = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await productService.getProducts({ search: debouncedSearch, page, limit: LIMIT });
      setProducts(res.data?.products ?? []);
      setPagination(res.data?.pagination ?? { total: 0, page: 1, limit: LIMIT, totalPages: 0 });
    } catch {
      setError("Failed to load products. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Only re-run when the actual query params change — no function in deps
  useEffect(() => {
    fetchProducts();
  }, [debouncedSearch, page]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    try {
      await productService.deleteProduct(modal.product._id);
      setModal(null);
      if (products.length === 1 && page > 1) setPage((p) => p - 1);
      else fetchProducts();
    } catch {
      // error handled inside DeleteModal
    }
  };

  const handleSave = () => {
    setModal(null);
    fetchProducts();
  };

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-gray-50">
      {/* ── Page Header ─────────────────────────────────────────────────────── */}
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
            <Plus size={16} />
            New Product
          </button>
        </div>

        {/* Stat */}
        <div className="mt-5">
          <div className="inline-block bg-gray-50 rounded-lg px-4 py-3 min-w-[130px]">
            <p className="text-xs text-gray-500">Total Products</p>
            <p className="text-lg font-bold text-gray-800 tabular-nums mt-0.5">
              {loading ? (
                <span className="inline-block h-6 w-10 bg-gray-200 rounded animate-pulse align-middle" />
              ) : (
                pagination.total
              )}
            </p>
          </div>
        </div>
      </div>

      {/* ── Search Bar ──────────────────────────────────────────────────────── */}
      <div className="px-6 py-4">
        <div className="relative max-w-sm">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <Search size={16} />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search products…"
            className="w-full pl-9 pr-9 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-800 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all"
          />
          {search && (
            <button
              onClick={() => handleSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={15} />
            </button>
          )}
        </div>
        {debouncedSearch && !loading && (
          <p className="text-xs text-gray-400 mt-2">
            {pagination.total} result{pagination.total !== 1 ? "s" : ""} for &ldquo;{debouncedSearch}&rdquo;
          </p>
        )}
      </div>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 px-6 pb-2 overflow-y-auto">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <p className="text-sm text-red-500">{error}</p>
            <button onClick={fetchProducts} className="text-sm text-blue-600 hover:underline">
              Try again
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <span className="text-gray-300">
              <Package size={36} />
            </span>
            <p className="text-sm font-medium text-gray-500">
              {debouncedSearch ? "No products match your search" : "No products yet"}
            </p>
            {!debouncedSearch && (
              <button onClick={() => setModal({ type: "create" })} className="text-sm text-blue-600 hover:underline">
                Create your first product
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((p) => (
                <ProductCard
                  key={p._id}
                  product={p}
                  onEdit={(prod) => setModal({ type: "edit", product: prod })}
                  onDelete={(prod) => setModal({ type: "delete", product: prod })}
                  onAdjustStock={(prod) => setModal({ type: "stock", product: prod })}
                />
              ))}
            </div>
            <Pagination pagination={pagination} onPageChange={setPage} />
          </>
        )}
      </div>

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
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
      {modal?.type === "stock" && (
        <StockModal product={modal.product} onClose={() => setModal(null)} onSave={handleSave} />
      )}
    </div>
  );
}
