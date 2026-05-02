import { useState, useEffect, useRef } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  X,
  Package,
  ChevronLeft,
  ChevronRight,
  Minus,
  Pill,
  FlaskConical,
  BarChart3,
  AlertCircle,
  Grid3X3,
} from "lucide-react";
import productService from "../../../api/products";

// ─── Constants ────────────────────────────────────────────────────────────────

const LAB_PRODUCT_LIMIT = 500;
const LIMIT = 50;
const DEBOUNCE_MS = 400;

const ITEM_TYPES = {
  medicine: {
    key: "medicine",
    label: "Medicine",
    plural: "Medicines",
    icon: Pill,
    color: "emerald",
    accent: "#10b981",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    badge: "bg-emerald-100 text-emerald-700",
    ring: "ring-emerald-400",
    btn: "bg-emerald-600 hover:bg-emerald-700",
    hasStock: true,
    hasGroup: true,
    desc: "Drugs & consumables with stock tracking",
  },
  product: {
    key: "product",
    label: "Product",
    plural: "Products",
    icon: Package,
    color: "blue",
    accent: "#3b82f6",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    badge: "bg-blue-100 text-blue-700",
    ring: "ring-blue-400",
    btn: "bg-blue-600 hover:bg-blue-700",
    hasStock: true,
    hasGroup: false,
    desc: "Lab kits, equipment & supplies",
  },
  service: {
    key: "service",
    label: "Service",
    plural: "Services",
    icon: FlaskConical,
    color: "violet",
    accent: "#8b5cf6",
    bg: "bg-violet-50",
    text: "text-violet-700",
    border: "border-violet-200",
    badge: "bg-violet-100 text-violet-700",
    ring: "ring-violet-400",
    btn: "bg-violet-600 hover:bg-violet-700",
    hasStock: false,
    hasGroup: false,
    desc: "Tests, panels & consultation fees",
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatPrice = (p) =>
  new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT", maximumFractionDigits: 2 }).format(p);

const stockBadge = (stock) => {
  if (stock === 0) return { label: "Out of Stock", cls: "bg-red-50 text-red-600 border-red-200" };
  if (stock <= 5) return { label: "Low Stock", cls: "bg-amber-50 text-amber-600 border-amber-200" };
  return { label: "In Stock", cls: "bg-green-50 text-green-600 border-green-200" };
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 flex flex-col gap-3 animate-pulse">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 flex flex-col gap-2">
          <div className="h-4 bg-gray-100 rounded w-3/4" />
          <div className="h-3 bg-gray-100 rounded w-full" />
        </div>
        <div className="w-16 h-5 bg-gray-100 rounded-full shrink-0" />
      </div>
      <div className="h-7 bg-gray-100 rounded w-28" />
      <div className="h-3 bg-gray-100 rounded w-24" />
    </div>
  );
}

// ─── Item Modal (Create / Edit) ───────────────────────────────────────────────

const MED_UNIT_TYPES = [
  { value: "stripe", label: "Stripe", qtyLabel: "Tabs / stripe", placeholder: "10" },
  { value: "bottle", label: "Bottle", qtyLabel: "ml / bottle", placeholder: "100" },
  { value: "vial", label: "Vial", qtyLabel: "ml / vial", placeholder: "5" },
  { value: "sachet", label: "Sachet", qtyLabel: "g / sachet", placeholder: "5" },
  { value: "piece", label: "Piece", qtyLabel: null, placeholder: null },
];

function ItemModal({ mode, item, activeType, onClose, onSave }) {
  const isEdit = mode === "edit";
  const typeDef = ITEM_TYPES[activeType];

  const [form, setForm] = useState({
    name: item?.name ?? "",
    price: item?.price ?? "",
    description: item?.description ?? "",
    hasStock: item?.hasStock ?? false,
    stock: item?.stock ?? 0,
    unitType: item?.unitType ?? "stripe",
    unitQty: item?.unitQty ?? "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const set = (key, val) => {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Required";
    else if (form.name.length > 100) e.name = "Max 100 chars";
    if (form.price === "" || form.price === null) e.price = "Required";
    else if (isNaN(form.price) || Number(form.price) < 0) e.price = "Must be ≥ 0";
    else if (Number(form.price) > 10000000) e.price = "Max ৳10,000,000";
    if (form.description.length > 500) e.description = "Max 500 chars";
    if (typeDef.hasStock && form.hasStock && (form.stock === "" || isNaN(form.stock) || Number(form.stock) < 0))
      e.stock = "Must be ≥ 0";
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
      const activeUnitDef = MED_UNIT_TYPES.find((u) => u.value === form.unitType);
      const payload = {
        type: activeType,
        name: form.name.trim(),
        price: Number(form.price),
        description: form.description.trim() || undefined,
        ...(typeDef.hasStock && { hasStock: form.hasStock }),
        ...(typeDef.hasStock && form.hasStock && { stock: Number(form.stock) }),
        ...(activeType === "medicine" && { unitType: form.unitType }),
        ...(activeType === "medicine" &&
          activeUnitDef?.qtyLabel &&
          form.unitQty !== "" && {
            unitQty: Number(form.unitQty),
          }),
      };
      if (isEdit) await productService.updateProduct(item._id, payload);
      else await productService.createProduct(payload);
      onSave();
    } catch (err) {
      setApiError(err?.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const accentColor = {
    medicine: "focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100",
    product: "focus:border-blue-400 focus:ring-1 focus:ring-blue-100",
    service: "focus:border-violet-400 focus:ring-1 focus:ring-violet-100",
  }[activeType];

  const TypeIcon = typeDef.icon;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-4 border-b border-gray-100`}>
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg ${typeDef.bg} flex items-center justify-center`}>
              <TypeIcon size={15} className={typeDef.text} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">
                {isEdit ? `Edit ${typeDef.label}` : `New ${typeDef.label}`}
              </h2>
              <p className="text-[11px] text-gray-400">{typeDef.desc}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        <div className="px-5 py-4 flex flex-col gap-3 max-h-[70vh] overflow-y-auto">
          {apiError && (
            <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600 flex gap-2 items-start">
              <AlertCircle size={13} className="mt-0.5 shrink-0" />
              {apiError}
            </div>
          )}

          {/* Name */}
          <div className="flex items-center gap-3">
            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider w-20 shrink-0">
              Name
            </label>
            <div className="flex-1 flex flex-col gap-1">
              <input
                type="text"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder={
                  activeType === "medicine"
                    ? "e.g. Napa Tablet 500mg"
                    : activeType === "product"
                      ? "e.g. Blood Culture Kit"
                      : "e.g. CBC Panel"
                }
                className={`w-full px-3 py-2 text-sm rounded-xl border bg-white text-gray-800 outline-none transition-all placeholder:text-gray-300
                  ${errors.name ? "border-red-300 ring-1 ring-red-100" : `border-gray-200 ${accentColor}`}`}
              />
              {errors.name && <p className="text-[11px] text-red-500">{errors.name}</p>}
            </div>
          </div>

          {/* Medicine Unit / Packaging */}
          {activeType === "medicine" && (
            <div className="flex items-start gap-3">
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider w-20 shrink-0 pt-2">
                Unit
              </label>
              <div className="flex-1 flex flex-col gap-1.5">
                <div className="flex flex-wrap gap-1.5">
                  {MED_UNIT_TYPES.map((u) => (
                    <button
                      key={u.value}
                      type="button"
                      onClick={() => set("unitType", u.value)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors
                        ${
                          form.unitType === u.value
                            ? "bg-emerald-600 text-white border-emerald-600"
                            : "bg-white text-gray-600 border-gray-200 hover:border-emerald-300 hover:text-emerald-700"
                        }`}
                    >
                      {u.label}
                    </button>
                  ))}
                </div>
                {MED_UNIT_TYPES.find((u) => u.value === form.unitType)?.qtyLabel && (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={form.unitQty}
                      min={1}
                      onChange={(e) => set("unitQty", e.target.value)}
                      placeholder={MED_UNIT_TYPES.find((u) => u.value === form.unitType)?.placeholder}
                      className={`w-24 px-3 py-2 text-sm rounded-xl border bg-white text-gray-800 outline-none transition-all placeholder:text-gray-300
                        ${errors.unitQty ? "border-red-300 ring-1 ring-red-100" : "border-gray-200 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100"}`}
                    />
                    <span className="text-xs text-gray-400">
                      {MED_UNIT_TYPES.find((u) => u.value === form.unitType)?.qtyLabel}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-3">
            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider w-20 shrink-0">
              Price (৳)
            </label>
            <div className="flex-1 flex flex-col gap-1">
              <input
                type="number"
                value={form.price}
                onChange={(e) => set("price", e.target.value)}
                placeholder="0.00"
                className={`w-full px-3 py-2 text-sm rounded-xl border bg-white text-gray-800 outline-none transition-all placeholder:text-gray-300
                  ${errors.price ? "border-red-300 ring-1 ring-red-100" : `border-gray-200 ${accentColor}`}`}
              />
              {errors.price && <p className="text-[11px] text-red-500">{errors.price}</p>}
            </div>
          </div>

          {/* Stock */}
          {typeDef.hasStock ? (
            <div className="flex items-center gap-3">
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider w-20 shrink-0">
                {isEdit ? "Stock" : "Init. Stock"}
              </label>
              <div className="flex-1 flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  {form.hasStock ? (
                    <div className="flex items-center gap-1 flex-1">
                      <button
                        type="button"
                        onClick={() => set("stock", Math.max(0, Number(form.stock) - 1))}
                        className="w-7 h-[34px] rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 transition-colors shrink-0"
                      >
                        <Minus size={12} />
                      </button>
                      <input
                        type="number"
                        value={form.stock}
                        min={0}
                        onChange={(e) => set("stock", e.target.value)}
                        className={`flex-1 min-w-0 px-2 py-2 text-sm rounded-xl border bg-white text-gray-800 outline-none text-center transition-all ${errors.stock ? "border-red-300" : `border-gray-200 ${accentColor}`}`}
                      />
                      <button
                        type="button"
                        onClick={() => set("stock", Number(form.stock) + 1)}
                        className="w-7 h-[34px] rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 transition-colors shrink-0"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center h-[34px] flex-1 px-3 rounded-xl border border-dashed border-gray-200 bg-gray-50">
                      <span className="text-xs text-gray-400">Not tracked</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => set("hasStock", !form.hasStock)}
                    className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors
                      ${form.hasStock ? (activeType === "medicine" ? "bg-emerald-500" : "bg-blue-500") : "bg-gray-200"}`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-3 w-3 rounded-full bg-white shadow transform transition-transform ${form.hasStock ? "translate-x-3" : "translate-x-0"}`}
                    />
                  </button>
                </div>
                {errors.stock && <p className="text-[11px] text-red-500">{errors.stock}</p>}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider w-20 shrink-0">
                Stock
              </label>
              <div className="flex items-center h-[34px] flex-1 px-3 rounded-xl border border-dashed border-gray-200 bg-gray-50">
                <span className="text-xs text-gray-400">No stock tracking</span>
              </div>
            </div>
          )}

          {/* Description */}
          <div className="flex items-start gap-3">
            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider w-20 shrink-0 pt-2">
              Note
            </label>
            <div className="flex-1 flex flex-col gap-1">
              <div className="flex justify-end">
                <span className="text-[11px] text-gray-300">{form.description.length}/500</span>
              </div>
              <textarea
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Brief notes… (optional)"
                rows={2}
                className={`w-full px-3 py-2 text-sm rounded-xl border bg-white text-gray-800 outline-none resize-none transition-all placeholder:text-gray-300
                  ${errors.description ? "border-red-300" : `border-gray-200 ${accentColor}`}`}
              />
              {errors.description && <p className="text-[11px] text-red-500">{errors.description}</p>}
            </div>
          </div>
        </div>

        <div className="px-5 pb-4 flex gap-2 justify-end border-t border-gray-50 pt-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`px-4 py-2 text-xs font-semibold text-white rounded-xl disabled:opacity-60 disabled:cursor-not-allowed transition-colors ${typeDef.btn}`}
          >
            {loading ? "Saving…" : isEdit ? "Save Changes" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Stock Modal ──────────────────────────────────────────────────────────────

function StockModal({ item, onClose, onSave }) {
  const [delta, setDelta] = useState(1);
  const [mode, setMode] = useState("add");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const currentStock = item.stock ?? 0;
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
      await productService.adjustStock(item._id, effectiveDelta, note.trim() || undefined);
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
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-sm font-bold text-gray-900">Adjust Stock</h2>
            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[220px]">{item.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        <div className="px-5 py-4 flex flex-col gap-4">
          {apiError && (
            <div className="px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600">{apiError}</div>
          )}
          <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
            <span className="text-xs text-gray-500">Current Stock</span>
            <span className="text-sm font-bold text-gray-800 tabular-nums">{currentStock} units</span>
          </div>
          <div className="flex rounded-xl border border-gray-200 overflow-hidden">
            <button
              onClick={() => setMode("add")}
              className={`flex-1 py-2 text-sm font-semibold transition-colors ${mode === "add" ? "bg-emerald-500 text-white" : "text-gray-500 hover:bg-gray-50"}`}
            >
              + Add
            </button>
            <button
              onClick={() => setMode("remove")}
              className={`flex-1 py-2 text-sm font-semibold transition-colors ${mode === "remove" ? "bg-red-500 text-white" : "text-gray-500 hover:bg-gray-50"}`}
            >
              − Remove
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDelta((d) => Math.max(1, Number(d) - 1))}
              className="w-8 h-8 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
            >
              <Minus size={14} />
            </button>
            <input
              type="number"
              value={delta}
              min={1}
              onChange={(e) => setDelta(e.target.value)}
              className="w-20 px-3 py-2 text-sm rounded-xl border border-gray-200 bg-white text-gray-800 outline-none text-center focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all"
            />
            <button
              type="button"
              onClick={() => setDelta((d) => Number(d) + 1)}
              className="w-8 h-8 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
            >
              <Plus size={14} />
            </button>
          </div>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note (optional)…"
            maxLength={200}
            className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 bg-white text-gray-800 outline-none focus:border-blue-400 transition-all"
          />
          <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
            <span className="text-xs text-gray-500">New Stock</span>
            <span className={`text-sm font-bold tabular-nums ${preview < 0 ? "text-red-500" : "text-gray-800"}`}>
              {preview} units
            </span>
          </div>
        </div>
        <div className="px-5 pb-4 flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || preview < 0}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            {loading ? "Saving…" : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Item Card ────────────────────────────────────────────────────────────────

function ItemCard({ item, onEdit, onDelete, onAdjustStock }) {
  const typeDef = ITEM_TYPES[item.type] ?? ITEM_TYPES.product;
  const TypeIcon = typeDef.icon;
  const stock = item.stock ?? 0;
  const badge = stockBadge(stock);

  return (
    <div className="group bg-white border border-gray-100 rounded-2xl p-5 flex flex-col gap-3.5 hover:border-gray-200 hover:shadow-md transition-all duration-200">
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-8 h-8 rounded-xl ${typeDef.bg} flex items-center justify-center shrink-0`}>
            <TypeIcon size={14} className={typeDef.text} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate leading-tight">{item.name}</p>
            {item.type === "medicine" && item.unitType && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md inline-block bg-gray-100 text-gray-500 mt-0.5">
                {item.unitType === "piece"
                  ? "per piece"
                  : item.unitQty
                    ? `${item.unitQty} / ${item.unitType}`
                    : item.unitType}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={() => onEdit(item)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            title="Edit"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={() => onDelete(item)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="Delete"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {item.description && (
        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed -mt-1">{item.description}</p>
      )}

      {/* Price */}
      <div className="flex items-center justify-between">
        <span className="text-xl font-black text-gray-900 tabular-nums tracking-tight">{formatPrice(item.price)}</span>
      </div>

      {/* Stock */}
      {item.hasStock ? (
        <div className="flex items-center justify-between pt-1 border-t border-gray-50">
          <button
            onClick={() => onAdjustStock(item)}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-600 transition-colors"
          >
            <BarChart3 size={12} className="text-gray-400" />
            <span className="tabular-nums font-semibold">{stock}</span>
            <span className="text-gray-400">in stock</span>
            <span className="text-gray-300">·</span>
            <span className="text-blue-500 hover:underline">adjust</span>
          </button>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badge.cls}`}>
            {badge.label}
          </span>
        </div>
      ) : item.type !== "service" ? (
        <div className="pt-1 border-t border-gray-50">
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-gray-50 text-gray-400 border-gray-200">
            Not tracked
          </span>
        </div>
      ) : (
        <div className="pt-1 border-t border-gray-50">
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${typeDef.badge} border-violet-200`}
          >
            Service
          </span>
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
  for (let i = Math.max(1, page - delta); i <= Math.min(totalPages, page + delta); i++) pages.push(i);

  return (
    <div className="flex items-center justify-between px-1 py-4">
      <p className="text-xs text-gray-400">
        <span className="font-semibold text-gray-600">
          {from}–{to}
        </span>{" "}
        of <span className="font-semibold text-gray-600">{total}</span>
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
            className={`min-w-[30px] h-[30px] text-xs rounded-lg transition-colors font-semibold ${p === page ? "bg-gray-900 text-white" : "hover:bg-gray-100 text-gray-600"}`}
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

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Products() {
  const [activeType, setActiveType] = useState("medicine");
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: LIMIT, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);
  const [totalsByType, setTotalsByType] = useState({ medicine: 0, product: 0, service: 0 });
  const debounceRef = useRef(null);

  const handleSearchChange = (val) => {
    setSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(val);
      setPage(1);
    }, DEBOUNCE_MS);
  };

  const fetchItems = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await productService.getProducts({ type: activeType, search: debouncedSearch, page, limit: LIMIT });
      setItems(res.data?.products ?? []);
      setPagination(res.data?.pagination ?? { total: 0, page: 1, limit: LIMIT, totalPages: 0 });
      if (res.data?.totalsByType) setTotalsByType(res.data.totalsByType);
    } catch {
      setError("Failed to load items. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [activeType, debouncedSearch, page]); // eslint-disable-line

  const handleTabChange = (type) => {
    setActiveType(type);
    setSearch("");
    setDebouncedSearch("");
    setPage(1);
  };

  const handleDelete = async () => {
    try {
      await productService.deleteProduct(modal.item._id);
      setModal(null);
      if (items.length === 1 && page > 1) setPage((p) => p - 1);
      else fetchItems();
    } catch {
      setModal(null);
    }
  };

  const handleSave = () => {
    setModal(null);
    fetchItems();
  };

  const grandTotal = Object.values(totalsByType).reduce((a, b) => a + b, 0);
  const atLimit = grandTotal >= LAB_PRODUCT_LIMIT;
  const typeDef = ITEM_TYPES[activeType];
  const TypeIcon = typeDef.icon;

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-gray-50">
      {/* ── Top Header ────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100">
        <div className="px-6 pt-5 pb-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gray-900 flex items-center justify-center">
                  <Grid3X3 size={15} className="text-white" />
                </div>
                <h1 className="text-xl font-black text-gray-900 tracking-tight">Products</h1>
              </div>
              <p className="text-sm text-gray-500 mt-1 ml-0.5">Manage medicines, products & services</p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => !atLimit && setModal({ type: "create" })}
                disabled={atLimit}
                title={atLimit ? `Limit of ${LAB_PRODUCT_LIMIT} items reached` : undefined}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold text-white rounded-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all ${typeDef.btn}`}
              >
                <Plus size={14} />
                New {typeDef.label}
              </button>
            </div>
          </div>

          {/* ── Type Tabs ─────────────────────────────────────────────────── */}
          <div className="flex items-center gap-1 mt-5 -mb-px">
            {Object.values(ITEM_TYPES).map((t) => {
              const Icon = t.icon;
              const isActive = t.key === activeType;
              return (
                <button
                  key={t.key}
                  onClick={() => handleTabChange(t.key)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-xl border-b-2 transition-all
                    ${
                      isActive
                        ? `text-gray-900 border-gray-900 bg-white`
                        : "text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50"
                    }`}
                >
                  <Icon size={14} className={isActive ? typeDef.text : ""} />
                  {t.plural}
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? `${typeDef.bg} ${typeDef.text}` : "bg-gray-100 text-gray-500"}`}
                  >
                    {totalsByType[t.key] ?? 0}
                  </span>
                </button>
              );
            })}

            {/* Capacity pill */}
            <div className="ml-auto flex items-center gap-2 pb-2">
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-gray-400 font-medium">
                    {grandTotal}/{LAB_PRODUCT_LIMIT}
                  </span>
                  <div className="w-20 h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${atLimit ? "bg-red-400" : grandTotal / LAB_PRODUCT_LIMIT > 0.8 ? "bg-amber-400" : "bg-gray-400"}`}
                      style={{ width: `${Math.min((grandTotal / LAB_PRODUCT_LIMIT) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Search ────────────────────────────────────────────────────────── */}
      <div className="px-6 py-4">
        <div className="relative max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder={`Search ${typeDef.plural.toLowerCase()}…`}
            className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-xl bg-white text-gray-800 outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-100 transition-all"
          />
          {search && (
            <button
              onClick={() => handleSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>
        {debouncedSearch && !loading && (
          <p className="text-xs text-gray-400 mt-2">
            {pagination.total} result{pagination.total !== 1 ? "s" : ""} for "{debouncedSearch}"
          </p>
        )}
      </div>

      {/* ── Grid ──────────────────────────────────────────────────────────── */}
      <div className="flex-1 px-6 pb-2 overflow-y-auto">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <AlertCircle size={32} className="text-red-300" />
            <p className="text-sm text-red-500">{error}</p>
            <button onClick={fetchItems} className="text-sm text-blue-600 hover:underline">
              Try again
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <div className={`w-14 h-14 rounded-2xl ${typeDef.bg} flex items-center justify-center`}>
              <TypeIcon size={24} className={typeDef.text} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-700">
                {debouncedSearch
                  ? `No ${typeDef.plural.toLowerCase()} match your search`
                  : `No ${typeDef.plural.toLowerCase()} yet`}
              </p>
              <p className="text-xs text-gray-400 mt-1">{typeDef.desc}</p>
            </div>
            {!debouncedSearch && !atLimit && (
              <button
                onClick={() => setModal({ type: "create" })}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white rounded-xl transition-colors ${typeDef.btn}`}
              >
                <Plus size={13} />
                Add first {typeDef.label.toLowerCase()}
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((item) => (
                <ItemCard
                  key={item._id}
                  item={item}
                  onEdit={(i) => setModal({ type: "edit", item: i })}
                  onDelete={(i) => setModal({ type: "delete", item: i })}
                  onAdjustStock={(i) => setModal({ type: "stock", item: i })}
                />
              ))}
            </div>
            <Pagination pagination={pagination} onPageChange={setPage} />
          </>
        )}
      </div>

      {/* ── Modals ────────────────────────────────────────────────────────── */}
      {(modal?.type === "create" || modal?.type === "edit") && (
        <ItemModal
          mode={modal.type === "edit" ? "edit" : "create"}
          item={modal.item}
          activeType={activeType}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
      {modal?.type === "delete" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          onClick={(e) => e.target === e.currentTarget && setModal(null)}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4">
            <div className="w-11 h-11 rounded-2xl bg-red-50 flex items-center justify-center">
              <Trash2 size={20} className="text-red-500" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Delete Item?</h2>
              <p className="text-sm text-gray-500 mt-1">
                <span className="font-semibold text-gray-700">"{modal.item.name}"</span> will be permanently removed.
                This cannot be undone.
              </p>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setModal(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {modal?.type === "stock" && <StockModal item={modal.item} onClose={() => setModal(null)} onSave={handleSave} />}
    </div>
  );
}
