/**
 * useCallback / useMemo are intentionally absent throughout this file.
 * babel-plugin-react-compiler handles all memoization automatically.
 */
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
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
  AlertTriangle,
  Loader2,
  CheckCircle2,
  RotateCcw,
  ChevronDown,
} from "lucide-react";
import productService from "../../../api/products";

// ── Palette ────────────────────────────────────────────────────────────────────

const C = {
  ink: "#0F172A",
  muted: "#94A3B8",
  sub: "#64748B",
  border: "#E2E8F0",
  paper: "#F8FAFC",
  hover: "#F1F5F9",
  divider: "#EEF2FF",
  teal: "#0D9488",
  indigo: "#6366F1",
  red: "#EF4444",
  amber: "#F59E0B",
  purple: "#8B5CF6",
  green: "#10B981",
  blue: "#3B82F6",
  emerald: "#10B981",
};

// ── Constants ──────────────────────────────────────────────────────────────────

const LAB_PRODUCT_LIMIT = 500;
const LIMIT = 50;
const DEBOUNCE_MS = 400;

const ITEM_TYPES = {
  medicine: {
    key: "medicine",
    label: "Medicine",
    bangla: "ওষুধ",
    plural: "Medicines",
    icon: Pill,
    accent: C.emerald,
    grad: "linear-gradient(135deg,#10B981,#059669)",
    softBg: "#10B98110",
    softBorder: "#10B98125",
    desc: "ওষুধ ও সরবরাহ",
    hasStock: true,
  },
  product: {
    key: "product",
    label: "Product",
    bangla: "পণ্য",
    plural: "Products",
    icon: Package,
    accent: C.blue,
    grad: "linear-gradient(135deg,#3B82F6,#2563EB)",
    softBg: "#3B82F610",
    softBorder: "#3B82F625",
    desc: "ল্যাব কিট ও সরঞ্জাম",
    hasStock: true,
  },
  service: {
    key: "service",
    label: "Service",
    bangla: "সেবা",
    plural: "Services",
    icon: FlaskConical,
    accent: C.purple,
    grad: "linear-gradient(135deg,#8B5CF6,#7C3AED)",
    softBg: "#8B5CF610",
    softBorder: "#8B5CF625",
    desc: "পরীক্ষা ও পরামর্শ ফি",
    hasStock: false,
  },
};

const MED_UNIT_TYPES = [
  { value: "stripe", label: "Stripe", qtyLabel: "Tabs / stripe", placeholder: "10" },
  { value: "bottle", label: "Bottle", qtyLabel: "ml / bottle", placeholder: "100" },
  { value: "vial", label: "Vial", qtyLabel: "ml / vial", placeholder: "5" },
  { value: "sachet", label: "Sachet", qtyLabel: "g / sachet", placeholder: "5" },
  { value: "piece", label: "Piece", qtyLabel: null, placeholder: null },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

const formatPrice = (p) =>
  new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT", maximumFractionDigits: 2 }).format(p);

const stockBadge = (stock) => {
  if (stock === 0) return { label: "স্টক নেই", color: C.red, bg: "#EF444410", border: "#EF444430" };
  if (stock <= 5) return { label: "কম স্টক", color: C.amber, bg: "#F59E0B10", border: "#F59E0B30" };
  return { label: "স্টক আছে", color: C.green, bg: "#10B98110", border: "#10B98130" };
};

// ── Shared input helpers ───────────────────────────────────────────────────────

const inputBase =
  "w-full outline-none transition-all rounded-xl border-[1.5px] border-[#E2E8F0] bg-white text-[#0F172A] font-['IBM_Plex_Mono',monospace]";

const focusInput = (e) => {
  e.target.style.borderColor = "#0D9488";
  e.target.style.boxShadow = "0 0 0 3px #0D948820";
};
const blurInput = (e) => {
  e.target.style.borderColor = "#E2E8F0";
  e.target.style.boxShadow = "";
};

// ── Modal Shell ────────────────────────────────────────────────────────────────

const ModalShell = ({ onClose, children, wide }) => {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div className="fixed inset-0 flex items-center justify-center px-4 z-[9999]">
      <div
        className="absolute inset-0 backdrop-blur-[6px]"
        style={{ background: "rgba(15,23,42,0.6)" }}
        onClick={onClose}
      />
      <div
        className={`relative w-full max-h-[calc(100svh-48px)] overflow-y-auto ${wide ? "max-w-[640px]" : "max-w-[520px]"}`}
      >
        {children}
      </div>
    </div>
  );
};

// ── Delete Modal ───────────────────────────────────────────────────────────────

const DeleteModal = ({ name, onConfirm, onCancel, loading }) => (
  <ModalShell onClose={onCancel}>
    <div className="bg-white overflow-hidden rounded-[24px] shadow-[0_25px_60px_rgba(15,23,42,0.2)]">
      <div
        className="px-6 py-6 flex items-center gap-4 border-b border-[#FECACA]"
        style={{ background: "linear-gradient(135deg,#FEF2F2,#FFE4E6)" }}
      >
        <div
          className="flex items-center justify-center shrink-0 w-11 h-11 rounded-[14px] shadow-[0_8px_20px_rgba(239,68,68,0.35)]"
          style={{ background: "linear-gradient(135deg,#EF4444,#DC2626)" }}
        >
          <Trash2 className="w-[18px] h-[18px] text-white" />
        </div>
        <div>
          <p className="font-['IBM_Plex_Mono',monospace] text-[10px] font-bold uppercase tracking-[0.1em] text-[#DC2626] mb-[2px]">
            বিপজ্জনক অপারেশন
          </p>
          <p className="font-['IBM_Plex_Sans',sans-serif] text-base font-bold text-[#0F172A]">আইটেম মুছে ফেলবেন?</p>
        </div>
      </div>
      <div className="px-6 py-5">
        <p className="font-['IBM_Plex_Mono',monospace] text-[13px] leading-[1.7] text-[#64748B]">
          <span className="font-bold text-[#0F172A]">{name}</span> স্থায়ীভাবে মুছে যাবে। এই কাজ পূর্বাবস্থায় ফেরানো
          যাবে না।
        </p>
      </div>
      <div className="px-6 pb-6 flex gap-3">
        <button
          onClick={onCancel}
          disabled={loading}
          className="flex-1 py-3 font-semibold transition-all rounded-xl border-[1.5px] border-[#E2E8F0] text-[#64748B] font-['IBM_Plex_Mono',monospace] text-xs bg-white hover:bg-[#F1F5F9]"
        >
          রাখুন
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 py-3 flex items-center justify-center gap-2 font-semibold transition-all rounded-xl border-none text-white font-['IBM_Plex_Mono',monospace] text-xs"
          style={{
            background: "linear-gradient(135deg,#EF4444,#DC2626)",
            boxShadow: loading ? "none" : "0 4px 14px rgba(239,68,68,0.4)",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? (
            <span className="animate-spin inline-block w-[14px] h-[14px] rounded-full border-2 border-white/40 border-t-white" />
          ) : (
            <Trash2 className="w-[13px] h-[13px]" />
          )}
          হ্যাঁ, মুছুন
        </button>
      </div>
    </div>
  </ModalShell>
);

// ── Stock Modal ────────────────────────────────────────────────────────────────

const StockModal = ({ item, onClose, onSave }) => {
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
      setApiError("স্টক শূন্যের নিচে যেতে পারবে না।");
      return;
    }
    setLoading(true);
    setApiError("");
    try {
      await productService.adjustStock(item._id, effectiveDelta, note.trim() || undefined);
      onSave();
    } catch (err) {
      setApiError(err?.response?.data?.error || "কিছু একটা সমস্যা হয়েছে।");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell onClose={onClose}>
      <div className="bg-white overflow-hidden rounded-[24px] shadow-[0_25px_60px_rgba(15,23,42,0.2)]">
        <div
          className="px-6 py-5 flex items-center justify-between border-b border-[#0D948820]"
          style={{ background: "linear-gradient(135deg,#0D948815 0%,#0F766E08 100%)" }}
        >
          <div className="flex items-center gap-3.5">
            <div
              className="flex items-center justify-center shrink-0 w-11 h-11 rounded-[14px] shadow-[0_8px_20px_#0D948840]"
              style={{ background: "linear-gradient(135deg,#0D9488,#0F766E)" }}
            >
              <BarChart3 className="w-[18px] h-[18px] text-white" />
            </div>
            <div>
              <p className="font-['IBM_Plex_Mono',monospace] text-[10px] font-bold uppercase tracking-[0.1em] mb-[2px] text-[#0D9488]">
                স্টক সামঞ্জস্য
              </p>
              <p className="font-['IBM_Plex_Sans',sans-serif] text-base font-bold text-[#0F172A] truncate max-w-[280px]">
                {item.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-[10px] text-[#94A3B8] border-[1.5px] border-[#E2E8F0] transition-all hover:bg-[#F1F5F9] hover:text-[#0F172A]"
          >
            <X className="w-[15px] h-[15px]" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {apiError && (
            <div className="flex items-start gap-2.5 px-4 py-3 bg-[#EF444408] border-[1.5px] border-[#EF444430] rounded-xl">
              <AlertTriangle className="w-[14px] h-[14px] text-[#EF4444] shrink-0 mt-[1px]" />
              <span className="text-xs font-['IBM_Plex_Mono',monospace] text-[#EF4444]">{apiError}</span>
            </div>
          )}

          {/* Current stock */}
          <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
            <span className="font-['IBM_Plex_Mono',monospace] text-xs text-[#64748B]">বর্তমান স্টক</span>
            <span className="font-['IBM_Plex_Mono',monospace] text-sm font-bold text-[#0F172A] tabular-nums">
              {currentStock} ইউনিট
            </span>
          </div>

          {/* Add / Remove toggle */}
          <div className="flex rounded-xl border-[1.5px] border-[#E2E8F0] overflow-hidden">
            <button
              onClick={() => setMode("add")}
              className="flex-1 py-2.5 font-['IBM_Plex_Mono',monospace] text-xs font-bold transition-all"
              style={
                mode === "add"
                  ? { background: "linear-gradient(135deg,#10B981,#059669)", color: "white" }
                  : { background: "white", color: C.sub }
              }
            >
              + যোগ
            </button>
            <button
              onClick={() => setMode("remove")}
              className="flex-1 py-2.5 font-['IBM_Plex_Mono',monospace] text-xs font-bold transition-all"
              style={
                mode === "remove"
                  ? { background: "linear-gradient(135deg,#EF4444,#DC2626)", color: "white" }
                  : { background: "white", color: C.sub }
              }
            >
              − কমান
            </button>
          </div>

          {/* Delta input */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDelta((d) => Math.max(1, Number(d) - 1))}
              className="w-9 h-9 flex items-center justify-center shrink-0 rounded-xl border-[1.5px] border-[#E2E8F0] text-[#64748B] hover:bg-[#F1F5F9] transition-all"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <input
              type="number"
              value={delta}
              min={1}
              onChange={(e) => setDelta(e.target.value)}
              className={`${inputBase} py-2 text-center text-sm font-bold`}
              onFocus={focusInput}
              onBlur={blurInput}
            />
            <button
              type="button"
              onClick={() => setDelta((d) => Number(d) + 1)}
              className="w-9 h-9 flex items-center justify-center shrink-0 rounded-xl border-[1.5px] border-[#E2E8F0] text-[#64748B] hover:bg-[#F1F5F9] transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Note */}
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="নোট (ঐচ্ছিক)…"
            maxLength={200}
            className={`${inputBase} px-3 py-2 text-xs`}
            onFocus={focusInput}
            onBlur={blurInput}
          />

          {/* Preview */}
          <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
            <span className="font-['IBM_Plex_Mono',monospace] text-xs text-[#64748B]">নতুন স্টক</span>
            <span
              className="font-['IBM_Plex_Mono',monospace] text-sm font-bold tabular-nums"
              style={{ color: preview < 0 ? C.red : C.ink }}
            >
              {preview} ইউনিট
            </span>
          </div>
        </div>

        <div className="px-6 pb-6 flex gap-3 border-t border-[#E2E8F0]">
          <button
            onClick={onClose}
            className="flex-1 py-3 font-semibold transition-all rounded-xl border-[1.5px] border-[#E2E8F0] text-[#64748B] font-['IBM_Plex_Mono',monospace] text-xs bg-white hover:bg-[#F1F5F9] mt-4"
          >
            বাতিল
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || preview < 0}
            className="flex-1 py-3 mt-4 flex items-center justify-center gap-2 font-semibold transition-all rounded-xl border-none text-white font-['IBM_Plex_Mono',monospace] text-xs"
            style={{
              background: loading || preview < 0 ? C.muted : "linear-gradient(135deg,#0D9488,#0F766E)",
              boxShadow: loading || preview < 0 ? "none" : "0 4px 14px rgba(13,148,136,0.4)",
            }}
          >
            {loading ? (
              <span className="animate-spin inline-block w-[14px] h-[14px] rounded-full border-2 border-white/40 border-t-white" />
            ) : (
              <CheckCircle2 className="w-[13px] h-[13px]" />
            )}
            নিশ্চিত করুন
          </button>
        </div>
      </div>
    </ModalShell>
  );
};

// ── Item Modal (Create / Edit) ─────────────────────────────────────────────────

const ItemModal = ({ mode, item, activeType, onClose, onSave }) => {
  const isEdit = mode === "edit";
  const typeDef = ITEM_TYPES[activeType];
  const TypeIcon = typeDef.icon;

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
    if (!form.name.trim()) e.name = "প্রয়োজনীয়";
    else if (form.name.length > 100) e.name = "সর্বোচ্চ ১০০ অক্ষর";
    if (form.price === "" || form.price === null) e.price = "প্রয়োজনীয়";
    else if (isNaN(form.price) || Number(form.price) < 0) e.price = "০ বা তার বেশি হতে হবে";
    if (form.description.length > 500) e.description = "সর্বোচ্চ ৫০০ অক্ষর";
    if (typeDef.hasStock && form.hasStock && (form.stock === "" || isNaN(form.stock) || Number(form.stock) < 0))
      e.stock = "০ বা তার বেশি হতে হবে";
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
          form.unitQty !== "" && { unitQty: Number(form.unitQty) }),
      };
      if (isEdit) await productService.updateProduct(item._id, payload);
      else await productService.createProduct(payload);
      onSave();
    } catch (err) {
      setApiError(err?.response?.data?.error || "কিছু একটা সমস্যা হয়েছে।");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell onClose={onClose} wide>
      <div className="bg-white overflow-hidden rounded-[24px] shadow-[0_25px_60px_rgba(15,23,42,0.2)]">
        {/* Header */}
        <div
          className="px-6 py-5 flex items-center justify-between border-b"
          style={{
            background: `linear-gradient(135deg,${typeDef.softBg} 0%,transparent 100%)`,
            borderColor: typeDef.softBorder,
          }}
        >
          <div className="flex items-center gap-3.5">
            <div
              className="flex items-center justify-center shrink-0 w-11 h-11 rounded-[14px]"
              style={{ background: typeDef.grad, boxShadow: `0 8px 20px ${typeDef.accent}40` }}
            >
              <TypeIcon className="w-[18px] h-[18px] text-white" />
            </div>
            <div>
              <p
                className="font-['IBM_Plex_Mono',monospace] text-[10px] font-bold uppercase tracking-[0.1em] mb-[2px]"
                style={{ color: typeDef.accent }}
              >
                {isEdit ? "সম্পাদনা" : "নতুন আইটেম"}
              </p>
              <p className="font-['IBM_Plex_Sans',sans-serif] text-base font-bold text-[#0F172A]">
                {isEdit ? item.name : `নতুন ${typeDef.bangla}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-[10px] text-[#94A3B8] border-[1.5px] border-[#E2E8F0] transition-all hover:bg-[#F1F5F9] hover:text-[#0F172A]"
          >
            <X className="w-[15px] h-[15px]" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 bg-[#F8FAFC] space-y-4 max-h-[60vh] overflow-y-auto">
          {apiError && (
            <div className="flex items-start gap-2.5 px-4 py-3 bg-[#EF444408] border-[1.5px] border-[#EF444430] rounded-xl">
              <AlertTriangle className="w-[14px] h-[14px] text-[#EF4444] shrink-0 mt-[1px]" />
              <span className="text-xs font-['IBM_Plex_Mono',monospace] text-[#EF4444]">{apiError}</span>
            </div>
          )}

          {/* Name */}
          <div className="bg-white rounded-xl p-4 border border-[#E2E8F0] shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
            <p className="font-['IBM_Plex_Mono',monospace] text-[9px] font-bold uppercase tracking-[0.1em] text-[#94A3B8] mb-2">
              নাম
            </p>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder={
                activeType === "medicine"
                  ? "যেমন: Napa Tablet 500mg"
                  : activeType === "product"
                    ? "যেমন: Blood Culture Kit"
                    : "যেমন: CBC Panel"
              }
              className={`${inputBase} px-3 py-2 text-sm ${errors.name ? "border-[#EF444460]" : ""}`}
              onFocus={focusInput}
              onBlur={blurInput}
            />
            {errors.name && (
              <p className="font-['IBM_Plex_Mono',monospace] text-[11px] text-[#EF4444] mt-1.5">{errors.name}</p>
            )}
          </div>

          {/* Medicine unit */}
          {activeType === "medicine" && (
            <div className="bg-white rounded-xl p-4 border border-[#E2E8F0] shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
              <p className="font-['IBM_Plex_Mono',monospace] text-[9px] font-bold uppercase tracking-[0.1em] text-[#94A3B8] mb-3">
                ইউনিট ধরন
              </p>
              <div className="flex flex-wrap gap-2">
                {MED_UNIT_TYPES.map((u) => (
                  <button
                    key={u.value}
                    type="button"
                    onClick={() => set("unitType", u.value)}
                    className="px-3 py-1.5 font-['IBM_Plex_Mono',monospace] text-xs font-bold rounded-lg border-[1.5px] transition-all"
                    style={
                      form.unitType === u.value
                        ? {
                            background: typeDef.grad,
                            color: "white",
                            borderColor: "transparent",
                            boxShadow: `0 4px 10px ${typeDef.accent}30`,
                          }
                        : { background: "white", color: C.sub, borderColor: C.border }
                    }
                  >
                    {u.label}
                  </button>
                ))}
              </div>
              {MED_UNIT_TYPES.find((u) => u.value === form.unitType)?.qtyLabel && (
                <div className="flex items-center gap-2 mt-3">
                  <input
                    type="number"
                    value={form.unitQty}
                    min={1}
                    onChange={(e) => set("unitQty", e.target.value)}
                    placeholder={MED_UNIT_TYPES.find((u) => u.value === form.unitType)?.placeholder}
                    className={`${inputBase} w-24 px-3 py-2 text-xs`}
                    onFocus={focusInput}
                    onBlur={blurInput}
                  />
                  <span className="font-['IBM_Plex_Mono',monospace] text-xs text-[#64748B]">
                    {MED_UNIT_TYPES.find((u) => u.value === form.unitType)?.qtyLabel}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Price */}
          <div className="bg-white rounded-xl p-4 border border-[#E2E8F0] shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
            <p className="font-['IBM_Plex_Mono',monospace] text-[9px] font-bold uppercase tracking-[0.1em] text-[#94A3B8] mb-2">
              মূল্য
            </p>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-['IBM_Plex_Mono',monospace] text-xs font-bold text-[#0D9488]">
                ৳
              </span>
              <input
                type="number"
                value={form.price}
                onChange={(e) => set("price", e.target.value)}
                placeholder="০.০০"
                min="0"
                className={`${inputBase} pl-7 pr-3 py-2 text-sm ${errors.price ? "border-[#EF444460]" : ""}`}
                onFocus={focusInput}
                onBlur={blurInput}
              />
            </div>
            {errors.price && (
              <p className="font-['IBM_Plex_Mono',monospace] text-[11px] text-[#EF4444] mt-1.5">{errors.price}</p>
            )}
          </div>

          {/* Stock */}
          {typeDef.hasStock ? (
            <div className="bg-white rounded-xl p-4 border border-[#E2E8F0] shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
              <div className="flex items-center justify-between mb-3">
                <p className="font-['IBM_Plex_Mono',monospace] text-[9px] font-bold uppercase tracking-[0.1em] text-[#94A3B8]">
                  {isEdit ? "স্টক" : "প্রারম্ভিক স্টক"}
                </p>
                <button
                  type="button"
                  onClick={() => set("hasStock", !form.hasStock)}
                  className="relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors"
                  style={{ background: form.hasStock ? C.teal : C.muted }}
                >
                  <span
                    className="pointer-events-none inline-block h-3 w-3 rounded-full bg-white shadow transform transition-transform"
                    style={{ transform: form.hasStock ? "translateX(12px)" : "translateX(0)" }}
                  />
                </button>
              </div>
              {form.hasStock ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => set("stock", Math.max(0, Number(form.stock) - 1))}
                    className="w-9 h-9 flex items-center justify-center shrink-0 rounded-xl border-[1.5px] border-[#E2E8F0] text-[#64748B] hover:bg-[#F1F5F9] transition-all"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="number"
                    value={form.stock}
                    min={0}
                    onChange={(e) => set("stock", e.target.value)}
                    className={`${inputBase} py-2 text-center text-sm font-bold ${errors.stock ? "border-[#EF444460]" : ""}`}
                    onFocus={focusInput}
                    onBlur={blurInput}
                  />
                  <button
                    type="button"
                    onClick={() => set("stock", Number(form.stock) + 1)}
                    className="w-9 h-9 flex items-center justify-center shrink-0 rounded-xl border-[1.5px] border-[#E2E8F0] text-[#64748B] hover:bg-[#F1F5F9] transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center h-9 px-3 rounded-xl border-[1.5px] border-dashed border-[#E2E8F0] bg-[#F8FAFC]">
                  <span className="font-['IBM_Plex_Mono',monospace] text-xs text-[#94A3B8]">ট্র্যাক করা হচ্ছে না</span>
                </div>
              )}
              {errors.stock && (
                <p className="font-['IBM_Plex_Mono',monospace] text-[11px] text-[#EF4444] mt-1.5">{errors.stock}</p>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl p-4 border border-[#E2E8F0]">
              <p className="font-['IBM_Plex_Mono',monospace] text-[9px] font-bold uppercase tracking-[0.1em] text-[#94A3B8] mb-2">
                স্টক
              </p>
              <div className="flex items-center h-9 px-3 rounded-xl border-[1.5px] border-dashed border-[#E2E8F0] bg-[#F8FAFC]">
                <span className="font-['IBM_Plex_Mono',monospace] text-xs text-[#94A3B8]">
                  সেবার জন্য স্টক প্রযোজ্য নয়
                </span>
              </div>
            </div>
          )}

          {/* Note */}
          <div className="bg-white rounded-xl p-4 border border-[#E2E8F0] shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
            <div className="flex items-center justify-between mb-2">
              <p className="font-['IBM_Plex_Mono',monospace] text-[9px] font-bold uppercase tracking-[0.1em] text-[#94A3B8]">
                নোট
              </p>
              <span className="font-['IBM_Plex_Mono',monospace] text-[10px] text-[#94A3B8]">
                {form.description.length}/500
              </span>
            </div>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="সংক্ষিপ্ত বিবরণ… (ঐচ্ছিক)"
              rows={2}
              className={`${inputBase} px-3 py-2 text-xs resize-none`}
              onFocus={focusInput}
              onBlur={blurInput}
            />
            {errors.description && (
              <p className="font-['IBM_Plex_Mono',monospace] text-[11px] text-[#EF4444] mt-1.5">{errors.description}</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[#E2E8F0] px-6 py-4 bg-white flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 font-semibold transition-all rounded-xl border-[1.5px] border-[#E2E8F0] text-[#64748B] font-['IBM_Plex_Mono',monospace] text-xs bg-white hover:bg-[#F1F5F9]"
          >
            বাতিল
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-2.5 flex items-center justify-center gap-2 font-semibold transition-all rounded-xl border-none text-white font-['IBM_Plex_Mono',monospace] text-xs"
            style={{
              background: loading ? C.muted : typeDef.grad,
              boxShadow: loading ? "none" : `0 4px 14px ${typeDef.accent}40`,
            }}
          >
            {loading ? (
              <span className="animate-spin inline-block w-[14px] h-[14px] rounded-full border-2 border-white/40 border-t-white" />
            ) : (
              <CheckCircle2 className="w-[13px] h-[13px]" />
            )}
            {isEdit ? "পরিবর্তন সংরক্ষণ" : "তৈরি করুন"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
};

// ── Stat Card ──────────────────────────────────────────────────────────────────

const StatCard = ({ label, value, color, grad, icon: Icon }) => (
  <div className="bg-white relative overflow-hidden border border-[#E2E8F0] rounded-2xl p-[14px_16px] shadow-[0_2px_8px_rgba(15,23,42,0.05)]">
    <div className="absolute top-0 right-0 w-16 h-16 opacity-5 rounded-[0_16px_0_100%]" style={{ background: grad }} />
    <div className="flex items-center gap-2 mb-2">
      <div className="flex items-center justify-center w-[26px] h-[26px] rounded-lg" style={{ background: grad }}>
        <Icon className="w-[13px] h-[13px] text-white" />
      </div>
      <p className="font-['IBM_Plex_Mono',monospace] text-[9px] font-bold uppercase tracking-[0.06em] text-[#94A3B8]">
        {label}
      </p>
    </div>
    <p className="font-['IBM_Plex_Mono',monospace] text-[26px] font-extrabold leading-none" style={{ color }}>
      {value}
    </p>
  </div>
);

// ── Skeleton ───────────────────────────────────────────────────────────────────

const Skeleton = () => (
  <div className="bg-white animate-pulse overflow-hidden border border-[#E2E8F0] rounded-[20px]">
    <div className="px-6 py-4 flex gap-4 border-b border-[#E2E8F0]">
      {[120, 70, 90].map((w, i) => (
        <div key={i} className="h-3 bg-[#E2E8F0] rounded-md" style={{ width: w }} />
      ))}
    </div>
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <div key={i} className="flex items-center gap-3 px-6 py-3.5 border-b border-[#E2E8F0]">
        <div className="w-[26px] h-[26px] bg-[#E2E8F0] rounded-lg" />
        <div className="flex-1 h-[13px] bg-[#E2E8F0] rounded-md" />
        <div className="w-[60px] h-[22px] bg-[#E2E8F0] rounded-lg" />
      </div>
    ))}
  </div>
);

// ── Item Row ───────────────────────────────────────────────────────────────────

const ItemRow = ({ item, index, onEdit, onDelete, onAdjustStock }) => {
  const [expanded, setExpanded] = useState(false);
  const typeDef = ITEM_TYPES[item.type] ?? ITEM_TYPES.product;
  const TypeIcon = typeDef.icon;
  const stock = item.stock ?? 0;
  const badge = stockBadge(stock);

  return (
    <div className="transition-all border-b border-[#E2E8F0]">
      <button onClick={() => setExpanded((v) => !v)} className="w-full text-left">
        <div className="flex items-center gap-3 py-3 px-2 rounded-xl transition-all hover:bg-[#F1F5F9]">
          <span className="flex items-center justify-center shrink-0 w-[26px] h-[26px] rounded-lg bg-[#EEF2FF] font-['IBM_Plex_Mono',monospace] text-[10px] font-bold text-[#64748B]">
            {String(index + 1).padStart(2, "0")}
          </span>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div
              className="flex items-center justify-center w-6 h-6 rounded-lg shrink-0"
              style={{ background: typeDef.softBg }}
            >
              <TypeIcon className="w-3 h-3" style={{ color: typeDef.accent }} />
            </div>
            <span className="font-['IBM_Plex_Sans',sans-serif] text-sm font-semibold text-[#0F172A] truncate">
              {item.name}
            </span>
          </div>
          {/* Price */}
          <span className="shrink-0 font-['IBM_Plex_Mono',monospace] text-xs font-bold text-[#0D9488]">
            ৳{(item.price ?? 0).toLocaleString("en-IN")}
          </span>
          {/* Stock badge (sm+) */}
          {item.hasStock && (
            <span
              className="shrink-0 hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-lg border-[1.5px] font-['IBM_Plex_Mono',monospace] text-[10px] font-bold"
              style={{ color: badge.color, background: badge.bg, borderColor: badge.border }}
            >
              {stock} ইউনিট
            </span>
          )}
          <ChevronDown
            className={`w-[14px] h-[14px] text-[#94A3B8] transition-transform duration-200 shrink-0 ${expanded ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {expanded && (
        <div
          className="mx-2 mb-3 px-4 py-3 rounded-xl border border-[#E2E8F0]"
          style={{ background: "linear-gradient(135deg,#F8FAFC,#EEF2FF)" }}
        >
          <div className="font-['IBM_Plex_Mono',monospace] text-xs text-[#64748B] leading-loose mb-3 flex flex-wrap gap-x-4 gap-y-1">
            <span>
              মূল্য: <span className="font-bold text-[#0D9488]">৳{(item.price ?? 0).toLocaleString("en-IN")}</span>
            </span>
            {item.type === "medicine" && item.unitType && (
              <span>
                ইউনিট:{" "}
                <span className="font-bold text-[#0F172A]">
                  {item.unitType}
                  {item.unitQty ? ` (${item.unitQty})` : ""}
                </span>
              </span>
            )}
            {item.hasStock && (
              <span>
                স্টক:{" "}
                <span className="font-bold" style={{ color: badge.color }}>
                  {stock} ইউনিট · {badge.label}
                </span>
              </span>
            )}
            {item.description && <span className="w-full text-[#94A3B8] truncate">{item.description}</span>}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <ActionChip onClick={() => onEdit(item)} icon={Pencil} label="সম্পাদনা" color={C.blue} />
            {item.hasStock && (
              <ActionChip onClick={() => onAdjustStock(item)} icon={BarChart3} label="স্টক" color={C.teal} />
            )}
            <ActionChip onClick={() => onDelete(item)} icon={Trash2} label="মুছুন" color={C.red} />
          </div>
        </div>
      )}
    </div>
  );
};

// ── Action Chip ────────────────────────────────────────────────────────────────

const ActionChip = ({ onClick, icon: Icon, label, color }) => (
  <button
    onClick={onClick}
    className="inline-flex items-center gap-1.5 transition-all font-semibold px-3 py-[5px] rounded-lg font-['IBM_Plex_Mono',monospace] text-[11px]"
    style={{ border: `1.5px solid ${color}25`, color, background: `${color}08` }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = `${color}18`;
      e.currentTarget.style.borderColor = `${color}50`;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = `${color}08`;
      e.currentTarget.style.borderColor = `${color}25`;
    }}
  >
    <Icon className="w-[11px] h-[11px]" />
    {label}
  </button>
);

// ── Section Divider ────────────────────────────────────────────────────────────

const SectionDivider = ({ title, count, color, grad }) => (
  <div className="flex items-center gap-2 pt-3 pb-1 first:pt-0">
    <span
      className="font-['IBM_Plex_Mono',monospace] text-[9px] font-bold uppercase tracking-[0.1em]"
      style={{ color }}
    >
      {title}
    </span>
    <span
      className="font-['IBM_Plex_Mono',monospace] text-[10px] font-bold px-1.5 py-px rounded-[5px]"
      style={{ color, background: `${color}12`, border: `1px solid ${color}25` }}
    >
      {count}
    </span>
    <div className="flex-1 h-px" style={{ background: `${color}20` }} />
  </div>
);

// ── Filter Dropdown ────────────────────────────────────────────────────────────

const FilterDropdown = ({ value, onChange, options }) => (
  <div className="relative">
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`appearance-none outline-none cursor-pointer transition-all font-['IBM_Plex_Mono',monospace] text-xs rounded-[10px] py-[7px] pl-3 pr-[30px] border-[1.5px]
        ${value !== "all" ? "border-[#0D948860] bg-[#0D948808] text-[#0F172A] shadow-[0_2px_8px_#0D948815]" : "border-[#E2E8F0] bg-white text-[#64748B]"}`}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
    <ChevronDown className="w-3 h-3 text-[#94A3B8] absolute right-[9px] top-1/2 -translate-y-1/2 pointer-events-none" />
  </div>
);

// ── Pagination ─────────────────────────────────────────────────────────────────

const Pagination = ({ pagination, onPageChange }) => {
  const { page, totalPages, total, limit } = pagination;
  if (totalPages <= 1) return null;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  const delta = 2;
  const pages = [];
  for (let i = Math.max(1, page - delta); i <= Math.min(totalPages, page + delta); i++) pages.push(i);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-[#E2E8F0] bg-[#F8FAFC]">
      <p className="font-['IBM_Plex_Mono',monospace] text-[10px] text-[#94A3B8]">
        {from}–{to} / মোট {total}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F1F5F9] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {pages[0] > 1 && (
          <>
            <button
              onClick={() => onPageChange(1)}
              className="min-w-[28px] h-7 font-['IBM_Plex_Mono',monospace] text-[11px] rounded-lg hover:bg-[#F1F5F9] text-[#64748B] transition-all"
            >
              1
            </button>
            {pages[0] > 2 && (
              <span className="font-['IBM_Plex_Mono',monospace] text-[11px] text-[#94A3B8] px-1">…</span>
            )}
          </>
        )}
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className="min-w-[28px] h-7 font-['IBM_Plex_Mono',monospace] text-[11px] rounded-lg transition-all font-bold"
            style={p === page ? { background: C.ink, color: "white" } : { color: C.sub }}
          >
            {p}
          </button>
        ))}
        {pages[pages.length - 1] < totalPages && (
          <>
            {pages[pages.length - 1] < totalPages - 1 && (
              <span className="font-['IBM_Plex_Mono',monospace] text-[11px] text-[#94A3B8] px-1">…</span>
            )}
            <button
              onClick={() => onPageChange(totalPages)}
              className="min-w-[28px] h-7 font-['IBM_Plex_Mono',monospace] text-[11px] rounded-lg hover:bg-[#F1F5F9] text-[#64748B] transition-all"
            >
              {totalPages}
            </button>
          </>
        )}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F1F5F9] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// ── Main Page ──────────────────────────────────────────────────────────────────

const STOCK_OPTIONS = [
  { value: "all", label: "সব" },
  { value: "instock", label: "স্টক আছে" },
  { value: "low", label: "কম স্টক" },
  { value: "out", label: "স্টক নেই" },
];

export default function Products() {
  const [activeType, setActiveType] = useState("medicine");
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: LIMIT, totalPages: 0 });
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
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

  const fetchItems = async (firstLoad = false) => {
    if (firstLoad) setInitialLoading(true);
    setError("");
    try {
      const res = await productService.getProducts({ type: activeType, search: debouncedSearch, page, limit: LIMIT });
      setItems(res.data?.products ?? []);
      setPagination(res.data?.pagination ?? { total: 0, page: 1, limit: LIMIT, totalPages: 0 });
      if (res.data?.totalsByType) setTotalsByType(res.data.totalsByType);
    } catch {
      setError("আইটেম লোড করতে ব্যর্থ।");
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchItems(true);
  }, []); // eslint-disable-line
  useEffect(() => {
    if (!initialLoading) fetchItems();
  }, [activeType, debouncedSearch, page]); // eslint-disable-line

  const handleTabChange = (type) => {
    setActiveType(type);
    setSearch("");
    setDebouncedSearch("");
    setStockFilter("all");
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

  // Client-side stock filter
  const filteredItems = items.filter((item) => {
    if (stockFilter === "all" || !typeDef.hasStock) return true;
    const s = item.stock ?? 0;
    if (stockFilter === "out") return s === 0;
    if (stockFilter === "low") return s > 0 && s <= 5;
    if (stockFilter === "instock") return s > 6;
    return true;
  });

  const hasFilters = search !== "" || stockFilter !== "all";

  // Stats
  const stats = {
    total: pagination.total,
    medicine: totalsByType.medicine,
    product: totalsByType.product,
    service: totalsByType.service,
  };

  return (
    <section
      className="min-h-screen px-4 py-6 font-[Noto_Sans_Bengali,sans-serif]"
      style={{ background: "linear-gradient(to bottom right,#f8fafc,#f0fdf4,#ecfdf5)" }}
    >
      {/* Modals */}
      {(modal?.type === "create" || modal?.type === "edit") &&
        createPortal(
          <ItemModal
            mode={modal.type === "edit" ? "edit" : "create"}
            item={modal.item}
            activeType={activeType}
            onClose={() => setModal(null)}
            onSave={handleSave}
          />,
          document.body,
        )}
      {modal?.type === "delete" &&
        createPortal(
          <DeleteModal
            name={modal.item.name}
            onConfirm={handleDelete}
            onCancel={() => setModal(null)}
            loading={false}
          />,
          document.body,
        )}
      {modal?.type === "stock" &&
        createPortal(
          <StockModal item={modal.item} onClose={() => setModal(null)} onSave={handleSave} />,
          document.body,
        )}

      <div className="max-w-2xl mx-auto">
        {/* Page header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="font-['IBM_Plex_Mono',monospace] text-[10px] uppercase tracking-[0.1em] text-[#0D9488] mb-1">
              ইনভেন্টরি
            </p>
            <h1 className="font-['IBM_Plex_Sans',sans-serif] text-[26px] font-bold text-[#0F172A] leading-tight">
              পণ্য ব্যবস্থাপনা
            </h1>
            <p className="text-sm text-[#64748B] mt-1">ওষুধ, পণ্য ও সেবা পরিচালনা করুন।</p>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => !atLimit && setModal({ type: "create" })}
              disabled={atLimit}
              className="flex items-center gap-1.5 transition-all font-semibold px-4 py-2 rounded-xl text-white font-['IBM_Plex_Mono',monospace] text-xs border-none"
              style={{
                background: atLimit ? C.muted : typeDef.grad,
                boxShadow: atLimit ? "none" : `0 4px 14px ${typeDef.accent}40`,
                cursor: atLimit ? "not-allowed" : "pointer",
              }}
              title={atLimit ? `সর্বোচ্চ ${LAB_PRODUCT_LIMIT}টি আইটেম` : undefined}
            >
              <Plus className="w-[13px] h-[13px]" />
              নতুন {typeDef.bangla}
            </button>
          </div>
        </div>

        {/* Stat cards */}
        {!initialLoading && (
          <div className="grid grid-cols-4 gap-3 mb-5">
            <StatCard
              label="মোট"
              value={grandTotal}
              color={C.ink}
              grad="linear-gradient(135deg,#0F172A,#1E293B)"
              icon={Grid3X3}
            />
            <StatCard
              label="ওষুধ"
              value={stats.medicine}
              color={C.emerald}
              grad="linear-gradient(135deg,#10B981,#059669)"
              icon={Pill}
            />
            <StatCard
              label="পণ্য"
              value={stats.product}
              color={C.blue}
              grad="linear-gradient(135deg,#3B82F6,#2563EB)"
              icon={Package}
            />
            <StatCard
              label="সেবা"
              value={stats.service}
              color={C.purple}
              grad="linear-gradient(135deg,#8B5CF6,#7C3AED)"
              icon={FlaskConical}
            />
          </div>
        )}

        {/* Main card */}
        {initialLoading ? (
          <Skeleton />
        ) : (
          <div className="bg-white overflow-hidden border border-[#E2E8F0] rounded-[20px] shadow-[0_4px_20px_rgba(15,23,42,0.07)]">
            {/* Card header with type tabs */}
            <div
              className="border-b border-[#E2E8F0]"
              style={{ background: "linear-gradient(135deg,#F8FAFC,#F0FDF4)" }}
            >
              {/* Tab bar */}
              <div className="flex items-center gap-1 px-4 pt-4 pb-0">
                {Object.values(ITEM_TYPES).map((t) => {
                  const Icon = t.icon;
                  const isActive = t.key === activeType;
                  return (
                    <button
                      key={t.key}
                      onClick={() => handleTabChange(t.key)}
                      className="flex items-center gap-1.5 px-3 py-2 font-['IBM_Plex_Mono',monospace] text-[11px] font-bold rounded-t-xl border-b-2 transition-all"
                      style={
                        isActive
                          ? { color: t.accent, borderColor: t.accent, background: `${t.accent}08` }
                          : { color: C.muted, borderColor: "transparent" }
                      }
                    >
                      <Icon className="w-3 h-3" />
                      {t.bangla}
                      <span
                        className="font-['IBM_Plex_Mono',monospace] text-[9px] font-bold px-1.5 py-px rounded-[5px]"
                        style={
                          isActive
                            ? { color: t.accent, background: `${t.accent}12`, border: `1px solid ${t.accent}25` }
                            : { color: C.muted, background: "#F1F5F9" }
                        }
                      >
                        {totalsByType[t.key] ?? 0}
                      </span>
                    </button>
                  );
                })}

                {/* Capacity pill */}
                <div className="ml-auto flex items-center gap-2 pb-2">
                  <span className="font-['IBM_Plex_Mono',monospace] text-[10px] text-[#94A3B8]">
                    {grandTotal}/{LAB_PRODUCT_LIMIT}
                  </span>
                  <div className="w-16 h-1 bg-[#E2E8F0] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min((grandTotal / LAB_PRODUCT_LIMIT) * 100, 100)}%`,
                        background: atLimit ? C.red : grandTotal / LAB_PRODUCT_LIMIT > 0.8 ? C.amber : C.teal,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Sub-header */}
              <div className="px-6 py-3 flex items-center justify-between">
                <div>
                  <p
                    className="font-['IBM_Plex_Mono',monospace] text-[10px] font-bold uppercase tracking-[0.1em] mb-0.5"
                    style={{ color: typeDef.accent }}
                  >
                    {typeDef.bangla} লেজার
                  </p>
                  <span className="font-['IBM_Plex_Mono',monospace] text-[13px] font-semibold text-[#64748B]">
                    মোট {pagination.total}টি
                  </span>
                </div>
              </div>
            </div>

            {/* Toolbar */}
            <div className="px-4 py-3 flex flex-wrap items-center gap-2 border-b border-[#E2E8F0] bg-[#F8FAFC]">
              <div className="relative flex-[1_1_160px]">
                <Search className="w-[13px] h-[13px] text-[#94A3B8] absolute left-[11px] top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder={`${typeDef.bangla} খুঁজুন…`}
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className={`${inputBase} pl-8 ${search ? "pr-8" : "pr-3"} py-2 text-xs`}
                  onFocus={focusInput}
                  onBlur={blurInput}
                />
                {search && (
                  <button
                    onClick={() => handleSearchChange("")}
                    className="absolute right-[10px] top-1/2 -translate-y-1/2 text-[#94A3B8]"
                  >
                    <X className="w-[13px] h-[13px]" />
                  </button>
                )}
              </div>
              {typeDef.hasStock && (
                <FilterDropdown value={stockFilter} onChange={setStockFilter} options={STOCK_OPTIONS} />
              )}
              {hasFilters && (
                <button
                  onClick={() => {
                    setSearch("");
                    setDebouncedSearch("");
                    setStockFilter("all");
                  }}
                  className="flex items-center gap-1.5 transition-all font-semibold py-[7px] px-3 border-[1.5px] border-[#EF444430] rounded-[10px] text-[#EF4444] font-['IBM_Plex_Mono',monospace] text-[11px] bg-[#EF444406] hover:bg-[#EF444412]"
                >
                  <RotateCcw className="w-3 h-3" /> রিসেট
                </button>
              )}
            </div>

            {/* Column labels */}
            <div className="flex items-center gap-3 px-4 pt-3 pb-1">
              <span className="font-['IBM_Plex_Mono',monospace] text-[9px] font-bold uppercase tracking-[0.08em] text-[#94A3B8] w-[26px] shrink-0">
                #
              </span>
              <span className="font-['IBM_Plex_Mono',monospace] text-[9px] font-bold uppercase tracking-[0.08em] text-[#94A3B8] flex-1">
                নাম
              </span>
              <span className="font-['IBM_Plex_Mono',monospace] text-[9px] font-bold uppercase tracking-[0.08em] text-[#94A3B8] shrink-0">
                মূল্য
              </span>
              <span className="font-['IBM_Plex_Mono',monospace] text-[9px] font-bold uppercase tracking-[0.08em] text-[#94A3B8] shrink-0 hidden sm:block">
                স্টক
              </span>
              <span className="w-[14px] shrink-0" />
            </div>

            {/* Rows */}
            <div className="px-4 pb-4">
              {error ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2 text-[#94A3B8]">
                  <AlertCircle className="w-7 h-7 opacity-40" />
                  <p className="font-['IBM_Plex_Mono',monospace] text-xs text-[#EF4444]">{error}</p>
                  <button
                    onClick={() => fetchItems()}
                    className="font-['IBM_Plex_Mono',monospace] text-xs text-[#0D9488] underline"
                  >
                    আবার চেষ্টা করুন
                  </button>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2 text-[#94A3B8]">
                  <TypeIcon className="w-7 h-7 opacity-40" />
                  <p className="font-['IBM_Plex_Mono',monospace] text-xs">
                    {hasFilters ? "কোনো আইটেম পাওয়া যায়নি" : `এখনো কোনো ${typeDef.bangla} যোগ করা হয়নি`}
                  </p>
                  {!hasFilters && !atLimit && (
                    <button
                      onClick={() => setModal({ type: "create" })}
                      className="mt-1 font-['IBM_Plex_Mono',monospace] text-xs font-bold px-3 py-1.5 rounded-lg text-white"
                      style={{ background: typeDef.grad }}
                    >
                      + প্রথম {typeDef.bangla} যোগ করুন
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <SectionDivider
                    title={typeDef.bangla}
                    count={filteredItems.length}
                    color={typeDef.accent}
                    grad={typeDef.grad}
                  />
                  {filteredItems.map((item, index) => (
                    <ItemRow
                      key={item._id}
                      item={item}
                      index={index}
                      onEdit={(i) => setModal({ type: "edit", item: i })}
                      onDelete={(i) => setModal({ type: "delete", item: i })}
                      onAdjustStock={(i) => setModal({ type: "stock", item: i })}
                    />
                  ))}
                </>
              )}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && <Pagination pagination={pagination} onPageChange={setPage} />}

            {/* Footer */}
            <div className="px-6 py-3 border-t border-[#E2E8F0] bg-[#F8FAFC]">
              <p className="font-['IBM_Plex_Mono',monospace] text-[10px] text-[#94A3B8]">
                * সর্বোচ্চ {LAB_PRODUCT_LIMIT}টি আইটেম · বর্তমানে {grandTotal}টি
              </p>
            </div>
          </div>
        )}

        <p className="font-['IBM_Plex_Mono',monospace] text-[11px] text-[#94A3B8] text-center mt-4 pb-6">
          LabPilotPro · পণ্য ব্যবস্থাপনা সিস্টেম
        </p>
      </div>
    </section>
  );
}
