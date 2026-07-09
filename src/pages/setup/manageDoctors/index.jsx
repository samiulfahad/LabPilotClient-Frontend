/**
 * useCallback / useMemo are intentionally absent throughout this file.
 * babel-plugin-react-compiler handles all memoization automatically.
 */
import { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  UserPlus,
  Search,
  ArrowLeft,
  X,
  Pencil,
  Trash2,
  ChevronDown,
  BadgePercent,
  Banknote,
  Phone,
  Layers,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Check,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import { Link } from "react-router-dom";
import doctorService from "../../../api/doctor";
import staticDataAPI from "../../../api/staticData";
import Popup from "../../../components/popup";

// ── Palette ────────────────────────────────────────────────────────────────────

const C = {
  ink: "#0F172A",
  muted: "#94A3B8",
  sub: "#64748B",
  border: "#E2E8F0",
  dashed: "#CBD5E1",
  paper: "#F8FAFC",
  hover: "#F1F5F9",
  divider: "#EEF2FF",
  teal: "#0D9488",
  blue: "#3B82F6",
  indigo: "#6366F1",
  red: "#EF4444",
  amber: "#F59E0B",
  purple: "#8B5CF6",
  green: "#10B981",
};

// ── Helpers ────────────────────────────────────────────────────────────────────

const fmt = (n, type) =>
  type === "percentage" ? `${n}%` : `৳${typeof n === "number" ? n.toLocaleString("en-IN") : n}`;

const EMPTY_FORM = {
  name: "",
  degree: "",
  contactNumber: "",
  designation: "",
  departments: [],
  commissionType: "percentage",
  commissionValue: "",
};

// ── Shared input style ─────────────────────────────────────────────────────────

const inputBase =
  "w-full outline-none transition-all rounded-xl border-[1.5px] border-[#E2E8F0] bg-white text-[#0F172A] font-['IBM_Plex_Mono',monospace]";

const focusInput = (e) => {
  e.target.style.borderColor = "#6366F1";
  e.target.style.boxShadow = "0 0 0 3px #6366F120";
};
const blurInput = (e) => {
  e.target.style.borderColor = "#E2E8F0";
  e.target.style.boxShadow = "";
};

// ── Modal Shell ────────────────────────────────────────────────────────────────

const Modal = ({ onClose, children }) => {
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
      <div className="relative w-full max-w-[520px] max-h-[calc(100svh-48px)] flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
};

// ── Form Field ─────────────────────────────────────────────────────────────────

const FormField = ({ label, required, children }) => (
  <div>
    <label className="block mb-1.5 font-['IBM_Plex_Mono',monospace] text-[11px] font-semibold uppercase tracking-[0.06em] text-[#64748B]">
      {label}
      {required && <span className="text-[#EF4444] ml-[3px]">*</span>}
    </label>
    {children}
  </div>
);

// ── Multi-Department Select ────────────────────────────────────────────────────

const DepartmentMultiSelect = ({ departments, selected, onChange }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const toggle = (v) => onChange(selected.includes(v) ? selected.filter((s) => s !== v) : [...selected, v]);
  const filtered = departments.filter((d) => d.label.toLowerCase().includes(search.toLowerCase()));
  const selectedDepts = departments.filter((d) => selected.includes(d.value));

  return (
    <div ref={ref} className="relative">
      <div
        onClick={() => setOpen((o) => !o)}
        className={`min-h-[42px] w-full px-3 py-2 cursor-pointer flex flex-wrap items-center gap-1.5 transition-all rounded-xl border-[1.5px] bg-white font-['IBM_Plex_Mono',monospace] ${open ? "border-[#6366F1] shadow-[0_0_0_3px_#6366F120]" : "border-[#E2E8F0]"}`}
      >
        {selected.length === 0 ? (
          <span className="text-[13px] text-[#94A3B8]">বিভাগ নির্বাচন করুন</span>
        ) : (
          selectedDepts.map((d) => (
            <span
              key={d.value}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#6366F115] border-[1.5px] border-[#6366F130] rounded-lg text-[#6366F1] text-[11px] font-['IBM_Plex_Mono',monospace] font-semibold"
            >
              {d.label}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(selected.filter((v) => v !== d.value));
                }}
              >
                <X className="w-[9px] h-[9px]" />
              </button>
            </span>
          ))
        )}
        <ChevronDown
          className={`w-[14px] h-[14px] text-[#94A3B8] ml-auto shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </div>
      {open && (
        <div className="absolute z-50 mt-2 w-full bg-white overflow-hidden rounded-2xl border-[1.5px] border-[#E2E8F0] shadow-[0_20px_40px_rgba(15,23,42,0.12)]">
          <div className="p-2.5 border-b border-[#E2E8F0]">
            <div className="relative">
              <Search className="w-3 h-3 text-[#94A3B8] absolute left-[10px] top-1/2 -translate-y-1/2" />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="অনুসন্ধান…"
                className={`${inputBase} pl-7 pr-2.5 py-[7px] text-xs`}
              />
            </div>
          </div>
          <div className="max-h-[200px] overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-center p-4 text-xs text-[#94A3B8] font-['IBM_Plex_Mono',monospace]">কোনো ফলাফল নেই</p>
            ) : (
              filtered.map((d) => {
                const checked = selected.includes(d.value);
                return (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => toggle(d.value)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors text-[13px] font-['IBM_Plex_Mono',monospace] ${checked ? "bg-[#6366F108] text-[#6366F1]" : "text-[#0F172A] hover:bg-[#F1F5F9]"}`}
                  >
                    <span
                      className={`flex items-center justify-center shrink-0 w-4 h-4 rounded-[5px] border-[1.5px] ${checked ? "border-[#6366F1] bg-[#6366F1]" : "border-[#CBD5E1]"}`}
                    >
                      {checked && <Check className="w-[9px] h-[9px] text-white" />}
                    </span>
                    {d.label}
                  </button>
                );
              })
            )}
          </div>
          {selected.length > 0 && (
            <div className="flex justify-between items-center px-3 py-2 border-t border-[#E2E8F0]">
              <span className="text-[11px] text-[#94A3B8] font-['IBM_Plex_Mono',monospace]">
                {selected.length}টি নির্বাচিত
              </span>
              <button
                onClick={() => onChange([])}
                className="text-[11px] text-[#EF4444] font-['IBM_Plex_Mono',monospace] font-bold"
              >
                সব বাদ
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Doctor Form Modal ──────────────────────────────────────────────────────────
// On a failed save, this modal stays OPEN and shows the error inline via
// `error` (see the banner near the bottom of the body) — never a separate
// <Popup>. This mirrors ItemModal/StockModal in Products.jsx and
// ReferrerFormModal in ManageReferrer.jsx: a network hiccup shouldn't
// silently discard what the user typed.

const DoctorFormModal = ({ initial, onClose, onSaved, departments, designations }) => {
  const isEdit = !!initial?._id;
  const [form, setForm] = useState(() =>
    initial
      ? {
          name: initial.name ?? "",
          degree: initial.degree ?? "",
          contactNumber: initial.contactNumber ?? "",
          designation: initial.designation ?? "",
          departments: initial.departments ?? (initial.department ? [initial.department] : []),
          commissionType: initial.commissionType ?? "percentage",
          commissionValue: initial.commissionValue ?? "",
        }
      : EMPTY_FORM,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (name, value) => setForm((f) => ({ ...f, [name]: value }));
  const handle = (e) => set(e.target.name, e.target.value);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.departments.length) return setError("অন্তত একটি বিভাগ নির্বাচন করুন।");
    const val = Number(form.commissionValue);
    if (isNaN(val) || val < 0) return setError("কমিশন মান অবশ্যই ধনাত্মক সংখ্যা হতে হবে।");
    if (form.commissionType === "percentage" && val > 100) return setError("শতাংশ ০–১০০ এর মধ্যে হতে হবে।");
    try {
      setSaving(true);
      const payload = { ...form, commissionValue: val };
      isEdit ? await doctorService.update(initial._id, payload) : await doctorService.create(payload);
      onSaved(isEdit);
    } catch (err) {
      setError(err?.response?.data?.error ?? "সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setSaving(false);
    }
  };

  const accent = isEdit ? C.purple : C.teal;
  const gradFrom = isEdit ? "#7C3AED" : "#0D9488";
  const gradTo = isEdit ? "#6D28D9" : "#0F766E";
  const accentText = isEdit ? "text-[#8B5CF6]" : "text-[#0D9488]";
  const accentBorder = isEdit ? "border-[#8B5CF620]" : "border-[#0D948820]";

  return (
    <Modal onClose={onClose}>
      <div className="bg-white flex flex-col overflow-hidden rounded-[0px] shadow-[0_25px_60px_rgba(15,23,42,0.2)]">
        {/* Gradient header */}
        <div
          className={`shrink-0 px-6 py-5 flex items-center justify-between border-b ${accentBorder}`}
          style={{ background: `linear-gradient(135deg,${gradFrom}15 0%,${gradTo}08 100%)` }}
        >
          <div className="flex items-center gap-3.5">
            <div
              className="flex items-center justify-center shrink-0 w-11 h-11 rounded-[14px]"
              style={{
                background: `linear-gradient(135deg,${gradFrom},${gradTo})`,
                boxShadow: `0 8px 20px ${accent}40`,
              }}
            >
              {isEdit ? (
                <Pencil className="w-[18px] h-[18px] text-white" />
              ) : (
                <UserPlus className="w-[18px] h-[18px] text-white" />
              )}
            </div>
            <div>
              <p
                className={`font-['IBM_Plex_Mono',monospace] text-[10px] font-bold uppercase tracking-[0.1em] mb-[2px] ${accentText}`}
              >
                {isEdit ? "তথ্য সম্পাদনা" : "নতুন নিবন্ধন"}
              </p>
              <p className="font-['IBM_Plex_Sans',sans-serif] text-base font-bold text-[#0F172A]">
                {isEdit ? "ডাক্তার সম্পাদনা" : "ডাক্তার নিবন্ধন"}
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
        <div className="px-6 py-5 space-y-4 bg-[#F8FAFC] flex-1 min-h-0 overflow-y-auto">
          <FormField label="পূর্ণ নাম" required>
            <input
              name="name"
              value={form.name}
              onChange={handle}
              required
              placeholder="ডা. আমিনুর রহমান"
              className={`${inputBase} px-3 py-2.5 text-sm`}
              onFocus={focusInput}
              onBlur={blurInput}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="ডিগ্রি">
              <input
                name="degree"
                value={form.degree}
                onChange={handle}
                placeholder="MBBS, MD…"
                className={`${inputBase} px-3 py-2.5 text-sm`}
                onFocus={focusInput}
                onBlur={blurInput}
              />
            </FormField>
            <FormField label="যোগাযোগ নম্বর" required>
              <input
                name="contactNumber"
                value={form.contactNumber}
                onChange={handle}
                required
                placeholder="01XXXXXXXXX"
                className={`${inputBase} px-3 py-2.5 text-sm`}
                onFocus={focusInput}
                onBlur={blurInput}
              />
            </FormField>
          </div>
          <FormField label="পদবি">
            <div className="relative">
              <select
                name="designation"
                value={form.designation}
                onChange={handle}
                className={`w-full appearance-none outline-none transition-all rounded-xl border-[1.5px] border-[#E2E8F0] bg-white font-['IBM_Plex_Mono',monospace] text-[13px] py-[10px] pl-3 pr-9 ${form.designation ? "text-[#0F172A]" : "text-[#94A3B8]"}`}
                onFocus={focusInput}
                onBlur={blurInput}
              >
                <option value="">পদবি নির্বাচন করুন</option>
                {designations.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-[14px] h-[14px] text-[#94A3B8] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </FormField>
          <FormField label="বিভাগ" required>
            {departments.length === 0 ? (
              <div className="flex items-center gap-2 px-3 py-3 border-[1.5px] border-[#FCD34D60] rounded-xl bg-[#FFFBEB]">
                <AlertTriangle className="w-[14px] h-[14px] text-[#F59E0B] shrink-0" />
                <span className="text-xs font-['IBM_Plex_Mono',monospace] text-[#F59E0B]">
                  কোনো বিভাগ পাওয়া যায়নি।
                </span>
              </div>
            ) : (
              <DepartmentMultiSelect
                departments={departments}
                selected={form.departments}
                onChange={(v) => set("departments", v)}
              />
            )}
          </FormField>
          {/* Commission */}
          <div className="border-[1.5px] border-[#E2E8F0] rounded-2xl overflow-hidden">
            <div className="px-4 py-3 flex items-center gap-2 bg-white border-b border-[#E2E8F0]">
              <BadgePercent className="w-[13px] h-[13px] text-[#6366F1]" />
              <span className="font-['IBM_Plex_Mono',monospace] text-[11px] font-bold uppercase tracking-[0.08em] text-[#64748B]">
                কমিশন
              </span>
            </div>
            <div className="p-4 space-y-3 bg-[#F8FAFC]">
              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    type: "percentage",
                    label: "শতাংশ (%)",
                    Icon: BadgePercent,
                    color: C.amber,
                    bg: "bg-[#F59E0B12]",
                    border: "border-[#F59E0B60]",
                    text: "text-[#F59E0B]",
                  },
                  {
                    type: "fixed",
                    label: "নির্দিষ্ট (৳)",
                    Icon: Banknote,
                    color: C.teal,
                    bg: "bg-[#0D948812]",
                    border: "border-[#0D948860]",
                    text: "text-[#0D9488]",
                  },
                ].map(({ type, label, Icon, color, bg, border, text }) => {
                  const active = form.commissionType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        set("commissionType", type);
                        set("commissionValue", "");
                      }}
                      className={`flex items-center gap-2 px-3 py-3 transition-all font-semibold rounded-xl border-[1.5px] font-['IBM_Plex_Mono',monospace] text-xs
                        ${active ? `${bg} ${border} ${text}` : "bg-white border-[#E2E8F0] text-[#64748B]"}`}
                    >
                      <Icon className="w-[14px] h-[14px] shrink-0" />
                      {label}
                    </button>
                  );
                })}
              </div>
              <div className="relative">
                <input
                  name="commissionValue"
                  type="number"
                  min="0"
                  step="0.01"
                  max={form.commissionType === "percentage" ? 100 : undefined}
                  value={form.commissionValue}
                  onChange={handle}
                  required
                  placeholder={form.commissionType === "percentage" ? "০ – ১০০" : "পরিমাণ লিখুন"}
                  className={`${inputBase} text-sm ${form.commissionType === "percentage" ? "pl-3.5 pr-9" : "pl-8 pr-3.5"} py-2.5`}
                  onFocus={focusInput}
                  onBlur={blurInput}
                />
                {form.commissionType === "percentage" ? (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 font-['IBM_Plex_Mono',monospace] text-sm font-bold text-[#F59E0B]">
                    %
                  </span>
                ) : (
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-['IBM_Plex_Mono',monospace] text-sm font-bold text-[#0D9488]">
                    ৳
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer. error banner sits directly above the action buttons so
            it's the last thing seen before retrying, right where the eye
            lands after Save fails — not buried at the top of a long form. */}
        <div className="shrink-0 bg-white border-t border-[#E2E8F0]">
          {error && (
            <div className="mx-6 mt-4 flex items-start gap-2.5 px-4 py-3 bg-[#EF444408] border-[1.5px] border-[#EF444430] rounded-xl">
              <AlertTriangle className="w-[14px] h-[14px] text-[#EF4444] shrink-0 mt-[1px]" />
              <span className="text-xs font-['IBM_Plex_Mono',monospace] text-[#EF4444]">{error}</span>
            </div>
          )}
          <div className="px-6 py-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 py-3 font-semibold transition-all rounded-xl border-[1.5px] border-[#E2E8F0] text-[#64748B] font-['IBM_Plex_Mono',monospace] text-xs hover:bg-[#F1F5F9]"
            >
              বাতিল
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving || !departments.length}
              className="flex-1 py-3 flex items-center justify-center gap-2 font-semibold transition-all rounded-xl border-none text-white font-['IBM_Plex_Mono',monospace] text-xs"
              style={{
                background:
                  saving || !departments.length
                    ? C.muted
                    : `linear-gradient(135deg,${accent === C.purple ? "#8B5CF6,#7C3AED" : "#0D9488,#0F766E"})`,
                boxShadow: saving || !departments.length ? "none" : `0 4px 14px ${accent}40`,
                cursor: saving || !departments.length ? "not-allowed" : "pointer",
              }}
            >
              {saving ? (
                <span className="animate-spin inline-block w-[14px] h-[14px] rounded-full border-2 border-white/40 border-t-white" />
              ) : isEdit ? (
                <Pencil className="w-[13px] h-[13px]" />
              ) : (
                <UserPlus className="w-[13px] h-[13px]" />
              )}
              {isEdit ? "পরিবর্তন সংরক্ষণ" : "নিবন্ধন করুন"}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

// ── Action Chip ────────────────────────────────────────────────────────────────

const ActionChip = ({ onClick, icon: Icon, label, color }) => (
  <button
    onClick={onClick}
    className="inline-flex items-center gap-1.5 transition-all font-semibold px-3 py-[5px] rounded-lg font-['IBM_Plex_Mono',monospace] text-[11px]"
    style={{
      border: `1.5px solid ${color}25`,
      color,
      background: `${color}08`,
    }}
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

// ── Doctor Row ─────────────────────────────────────────────────────────────────

const DoctorRow = ({ doctor, index, deptLabelMap, desigLabelMap, onEdit, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const isPercent = doctor.commissionType === "percentage";
  const commGrad = isPercent ? "linear-gradient(135deg,#F59E0B,#D97706)" : "linear-gradient(135deg,#0D9488,#0F766E)";
  const commShadow = isPercent ? "shadow-[0_3px_8px_#F59E0B30]" : "shadow-[0_3px_8px_#0D948830]";

  return (
    <div className="transition-all border-b border-[#E2E8F0]">
      <button onClick={() => setExpanded((v) => !v)} className="w-full text-left">
        <div className="flex items-center gap-3 py-3 px-2 rounded-xl transition-all hover:bg-[#F1F5F9]">
          <span className="flex items-center justify-center shrink-0 w-[26px] h-[26px] rounded-lg bg-[#EEF2FF] font-['IBM_Plex_Mono',monospace] text-[10px] font-bold text-[#64748B]">
            {String(index + 1).padStart(2, "0")}
          </span>
          <div className="flex-1 min-w-0">
            <span className="font-['IBM_Plex_Sans',sans-serif] text-sm font-semibold text-[#0F172A]">
              {doctor.name}
            </span>
            {doctor.degree && (
              <span className="ml-2 font-['IBM_Plex_Mono',monospace] text-[11px] text-[#94A3B8]">{doctor.degree}</span>
            )}
          </div>
          <span
            className={`shrink-0 flex items-center gap-1 px-3 py-1 rounded-[20px] text-white font-['IBM_Plex_Mono',monospace] text-xs font-bold ${commShadow}`}
            style={{ background: commGrad }}
          >
            {isPercent ? <BadgePercent className="w-[11px] h-[11px]" /> : <Banknote className="w-[11px] h-[11px]" />}
            {fmt(doctor.commissionValue, doctor.commissionType)}
          </span>
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
          <div className="font-['IBM_Plex_Mono',monospace] text-xs text-[#64748B] leading-loose mb-3">
            {doctor.designation && (
              <p className="text-[#0F172A] font-semibold">{desigLabelMap[doctor.designation] ?? doctor.designation}</p>
            )}
            {doctor.contactNumber && (
              <p className="flex items-center gap-1.5">
                <Phone className="w-3 h-3 text-[#6366F1]" />
                {doctor.contactNumber}
              </p>
            )}
            {doctor.departments?.length > 0 && (
              <p className="flex items-center gap-1.5 flex-wrap">
                <Layers className="w-3 h-3 text-[#6366F1] shrink-0" />
                {doctor.departments.map((d) => deptLabelMap[d] ?? d).join(" · ")}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <ActionChip onClick={onEdit} icon={Pencil} label="সম্পাদনা" color={C.indigo} />
            <ActionChip onClick={onDelete} icon={Trash2} label="মুছুন" color={C.red} />
          </div>
        </div>
      )}
    </div>
  );
};

// ── Pagination ─────────────────────────────────────────────────────────────────

const Pagination = ({ page, totalPages, onPage }) => {
  if (totalPages <= 1) return null;
  const delta = 1;
  const start = Math.max(1, page - delta);
  const end = Math.min(totalPages, page + delta);
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  const Btn = ({ onClick, disabled, active, children }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center justify-center transition-all w-8 h-8 rounded-[10px] font-['IBM_Plex_Mono',monospace] text-xs font-bold"
      style={{
        background: active ? "linear-gradient(135deg,#6366F1,#4F46E5)" : "white",
        border: `1.5px solid ${active ? "transparent" : C.border}`,
        color: active ? "white" : disabled ? C.muted : C.sub,
        opacity: disabled ? 0.35 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        boxShadow: active ? "0 4px 10px rgba(99,102,241,0.35)" : undefined,
      }}
    >
      {children}
    </button>
  );

  return (
    <div className="flex items-center justify-center gap-1.5">
      <Btn onClick={() => onPage(page - 1)} disabled={page === 1}>
        <ChevronLeft className="w-[14px] h-[14px]" />
      </Btn>
      {start > 1 && (
        <>
          <Btn onClick={() => onPage(1)}>1</Btn>
          {start > 2 && <span className="text-[#94A3B8] text-xs">…</span>}
        </>
      )}
      {pages.map((p) => (
        <Btn key={p} onClick={() => onPage(p)} active={p === page}>
          {p}
        </Btn>
      ))}
      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="text-[#94A3B8] text-xs">…</span>}
          <Btn onClick={() => onPage(totalPages)}>{totalPages}</Btn>
        </>
      )}
      <Btn onClick={() => onPage(page + 1)} disabled={page === totalPages}>
        <ChevronRight className="w-[14px] h-[14px]" />
      </Btn>
    </div>
  );
};

// ── Filter Dropdown ────────────────────────────────────────────────────────────

const FilterDropdown = ({ value, onChange, options, placeholder }) => (
  <div className="relative">
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`appearance-none outline-none cursor-pointer transition-all font-['IBM_Plex_Mono',monospace] text-xs rounded-[10px] py-[7px] pl-3 pr-[30px] border-[1.5px]
        ${value !== "all" ? "border-[#6366F160] bg-[#6366F108] text-[#0F172A] shadow-[0_2px_8px_#6366F115]" : "border-[#E2E8F0] bg-white text-[#64748B]"}`}
    >
      <option value="all">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
    <ChevronDown className="w-3 h-3 text-[#94A3B8] absolute right-[9px] top-1/2 -translate-y-1/2 pointer-events-none" />
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
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className="flex items-center gap-3 px-6 py-3.5 border-b border-[#E2E8F0]">
        <div className="w-[26px] h-[26px] bg-[#E2E8F0] rounded-lg" />
        <div className="flex-1 h-[13px] bg-[#E2E8F0] rounded-md" />
        <div className="w-[65px] h-[26px] bg-[#E2E8F0] rounded-[20px]" />
      </div>
    ))}
  </div>
);

// ── Stats Card ─────────────────────────────────────────────────────────────────

const StatCard = ({ label, value, color, grad, icon: Icon }) => (
  <div className="bg-white relative overflow-hidden border border-[#E2E8F0] rounded-2xl p-[14px_16px] shadow-[0_2px_8px_rgba(15,23,42,0.05)]">
    <div className="absolute top-0 right-0 w-16 h-16 opacity-5 rounded-[0_16px_0_100%]" style={{ background: grad }} />
    <div className="flex items-center gap-2 mb-2">
      <div
        className="flex items-center justify-center w-[26px] h-[26px] rounded-lg"
        style={{ background: grad, boxShadow: `0 3px 8px ${color}30` }}
      >
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

// ── Main Page ──────────────────────────────────────────────────────────────────

const COMM_OPTIONS = [
  { value: "percentage", label: "শতাংশ (%)" },
  { value: "fixed", label: "নির্দিষ্ট (৳)" },
];

const ManageDoctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [initialLoading, setInitialLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [commFilter, setCommFilter] = useState("all");
  const [popup, setPopup] = useState(null);
  const [formModal, setFormModal] = useState(null);
  // Delete confirmation now goes through the shared <Popup type="warning">
  // component (see render section below) instead of the bespoke
  // DeleteModal — same one-consistent-confirm-flow pattern used in
  // ManageReferrer.jsx / Products.jsx. `deleteTarget` holds the doctor
  // pending deletion.
  const [deleteTarget, setDeleteTarget] = useState(null);
  const debounceRef = useRef(null);

  const deptLabelMap = Object.fromEntries(departments.map((d) => [d.value, d.label]));
  const desigLabelMap = Object.fromEntries(designations.map((d) => [d.value, d.label]));

  useEffect(() => {
    Promise.all([staticDataAPI.getDepartments(), staticDataAPI.getDesignations()])
      .then(([dR, dsR]) => {
        setDepartments(dR.data.departments ?? []);
        setDesignations(dsR.data.designations ?? []);
      })
      .catch(() => setPopup({ type: "error", message: "বিভাগ লোড করতে ব্যর্থ।" }));
  }, []);

  const fetchDoctors = async ({ search: s = "", department: d = "", page = 1 } = {}) => {
    try {
      const res = await doctorService.getAll({ search: s, department: d, page });
      const { doctors: data, total, totalPages, page: cur } = res.data;
      setDoctors(data);
      setPagination({ page: cur, totalPages, total });
    } catch {
      setPopup({ type: "error", message: "ডাক্তার লোড করতে ব্যর্থ।" });
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(
      () => fetchDoctors({ search, department: deptFilter !== "all" ? deptFilter : "", page: 1 }),
      400,
    );
    return () => clearTimeout(debounceRef.current);
  }, [search, deptFilter]);

  const handlePage = (page) => fetchDoctors({ search, department: deptFilter !== "all" ? deptFilter : "", page });

  const handleSaved = (isEdit) => {
    setFormModal(null);
    fetchDoctors({ search, department: deptFilter !== "all" ? deptFilter : "", page: pagination.page });
    setPopup({ type: "success", message: isEdit ? "ডাক্তারের তথ্য আপডেট হয়েছে।" : "ডাক্তার নিবন্ধিত হয়েছে।" });
  };

  // No in-flight spinner here — the warning Popup closes itself as soon as
  // onConfirm fires, so a failure just surfaces as a follow-up error toast.
  // Mirrors handleDelete in Products.jsx / ManageReferrer.jsx.
  const handleDelete = async (doctor) => {
    try {
      await doctorService.delete(doctor._id);
      const page = doctors.length === 1 && pagination.page > 1 ? pagination.page - 1 : pagination.page;
      fetchDoctors({ search, department: deptFilter !== "all" ? deptFilter : "", page });
      setPopup({ type: "success", message: "ডাক্তার মুছে ফেলা হয়েছে।" });
    } catch {
      setPopup({ type: "error", message: "ডাক্তার মুছতে ব্যর্থ।" });
    }
  };

  const visibleDoctors = useMemo(
    () => (commFilter !== "all" ? doctors.filter((d) => d.commissionType === commFilter) : doctors),
    [doctors, commFilter],
  );

  const stats = useMemo(
    () => ({
      total: pagination.total,
      percentage: doctors.filter((d) => d.commissionType === "percentage").length,
      fixed: doctors.filter((d) => d.commissionType === "fixed").length,
      multiDept: doctors.filter((d) => (d.departments?.length ?? 0) > 1).length,
    }),
    [doctors, pagination.total],
  );

  const hasFilters = deptFilter !== "all" || commFilter !== "all";
  const deptOptions = departments.map((d) => ({ value: d.value, label: d.label }));

  return (
    <section
      className="min-h-screen px-4 py-6 font-[Noto_Sans_Bengali,sans-serif]"
      style={{ background: "linear-gradient(to bottom right,#f8fafc,#eff6ff,#eef2ff)" }}
    >
      {popup && <Popup type={popup.type} message={popup.message} onClose={() => setPopup(null)} />}

      {formModal !== null &&
        createPortal(
          <DoctorFormModal
            initial={formModal._id ? formModal : null}
            onClose={() => setFormModal(null)}
            onSaved={handleSaved}
            departments={departments}
            designations={designations}
          />,
          document.body,
        )}

      {deleteTarget && (
        <Popup
          type="warning"
          message={`"${deleteTarget.name}"-এর সমস্ত তথ্য স্থায়ীভাবে মুছে যাবে। এই কাজ পূর্বাবস্থায় ফেরানো যাবে না।`}
          confirmText="হ্যাঁ, মুছুন"
          cancelText="রাখুন"
          onConfirm={() => handleDelete(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
        />
      )}

      <div className="max-w-2xl mx-auto">
        {/* Page header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="font-['IBM_Plex_Mono',monospace] text-[10px] uppercase tracking-[0.1em] text-[#0D9488] mb-1">
              ল্যাব অপারেশন
            </p>
            <h1 className="font-['IBM_Plex_Sans',sans-serif] text-[26px] font-bold text-[#0F172A] leading-tight">
              ডাক্তার তালিকা
            </h1>
            <p className="text-sm text-[#64748B] mt-1">কমিশন ও রেফারেল ডাক্তার পরিচালনা।</p>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Link
              to="/lab-management"
              className="flex items-center gap-1.5 transition-all font-semibold px-[14px] py-2 border-[1.5px] border-[#E2E8F0] rounded-xl text-[#64748B] font-['IBM_Plex_Mono',monospace] text-xs bg-white hover:bg-[#F1F5F9] hover:text-[#0F172A]"
            >
              <ArrowLeft className="w-[13px] h-[13px]" /> ফিরে
            </Link>
            <button
              onClick={() => setFormModal({})}
              className="flex items-center gap-1.5 transition-all font-semibold px-4 py-2 rounded-xl text-white font-['IBM_Plex_Mono',monospace] text-xs border-none shadow-[0_4px_14px_rgba(13,148,136,0.4)] hover:shadow-[0_6px_20px_rgba(13,148,136,0.5)]"
              style={{ background: "linear-gradient(135deg,#0D9488,#0F766E)" }}
            >
              <UserPlus className="w-[13px] h-[13px]" /> নতুন
            </button>
          </div>
        </div>

        {/* Stats strip */}
        {!initialLoading && (
          <div className="grid grid-cols-4 gap-3 mb-5">
            <StatCard
              label="মোট ডাক্তার"
              value={stats.total}
              color={C.indigo}
              grad="linear-gradient(135deg,#6366F1,#4F46E5)"
              icon={UserPlus}
            />
            <StatCard
              label="শতাংশ কমিশন"
              value={stats.percentage}
              color={C.amber}
              grad="linear-gradient(135deg,#F59E0B,#D97706)"
              icon={BadgePercent}
            />
            <StatCard
              label="নির্দিষ্ট কমিশন"
              value={stats.fixed}
              color={C.teal}
              grad="linear-gradient(135deg,#0D9488,#0F766E)"
              icon={Banknote}
            />
            <StatCard
              label="বহু-বিভাগ"
              value={stats.multiDept}
              color={C.purple}
              grad="linear-gradient(135deg,#8B5CF6,#7C3AED)"
              icon={Layers}
            />
          </div>
        )}

        {/* Ledger card */}
        {initialLoading ? (
          <Skeleton />
        ) : (
          <div className="bg-white overflow-hidden border border-[#E2E8F0] rounded-[20px] shadow-[0_4px_20px_rgba(15,23,42,0.07)]">
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]"
              style={{ background: "linear-gradient(135deg,#F8FAFC,#EEF2FF)" }}
            >
              <div>
                <p className="font-['IBM_Plex_Mono',monospace] text-[10px] font-bold uppercase tracking-[0.1em] text-[#6366F1] mb-1">
                  ডাক্তার লেজার
                </p>
                <div className="flex items-center gap-3">
                  <span className="font-['IBM_Plex_Mono',monospace] text-[13px] font-semibold text-[#64748B]">
                    মোট {pagination.total}জন
                  </span>
                  {stats.percentage > 0 && (
                    <span className="px-2 py-0.5 font-['IBM_Plex_Mono',monospace] text-[11px] font-bold text-[#F59E0B] bg-[#F59E0B10] rounded-[6px] border border-[#F59E0B25]">
                      % {stats.percentage}জন
                    </span>
                  )}
                  {stats.fixed > 0 && (
                    <span className="px-2 py-0.5 font-['IBM_Plex_Mono',monospace] text-[11px] font-bold text-[#0D9488] bg-[#0D948810] rounded-[6px] border border-[#0D948825]">
                      ৳ {stats.fixed}জন
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Toolbar */}
            <div className="px-4 py-3 flex flex-wrap items-center gap-2 border-b border-[#E2E8F0] bg-[#F8FAFC]">
              <div className="relative flex-[1_1_160px]">
                <Search className="w-[13px] h-[13px] text-[#94A3B8] absolute left-[11px] top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="নাম, ডিগ্রি বা নম্বর…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={`${inputBase} pl-8 ${search ? "pr-8" : "pr-3"} py-2 text-xs`}
                  onFocus={focusInput}
                  onBlur={blurInput}
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-[10px] top-1/2 -translate-y-1/2 text-[#94A3B8]"
                  >
                    <X className="w-[13px] h-[13px]" />
                  </button>
                )}
              </div>
              <FilterDropdown
                value={deptFilter}
                onChange={setDeptFilter}
                options={deptOptions}
                placeholder="সব বিভাগ"
              />
              <FilterDropdown
                value={commFilter}
                onChange={setCommFilter}
                options={COMM_OPTIONS}
                placeholder="সব কমিশন"
              />
              {hasFilters && (
                <button
                  onClick={() => {
                    setDeptFilter("all");
                    setCommFilter("all");
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
                ডাক্তার
              </span>
              <span className="font-['IBM_Plex_Mono',monospace] text-[9px] font-bold uppercase tracking-[0.08em] text-[#94A3B8] shrink-0">
                কমিশন
              </span>
              <span className="w-[14px] shrink-0" />
            </div>

            {/* Doctor rows */}
            <div className="px-4 pb-4">
              {visibleDoctors.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2 text-[#94A3B8]">
                  <AlertCircle className="w-7 h-7 opacity-40" />
                  <p className="font-['IBM_Plex_Mono',monospace] text-xs">
                    {hasFilters || search ? "কোনো ডাক্তার পাওয়া যায়নি" : "এখনো কোনো ডাক্তার নিবন্ধিত হয়নি"}
                  </p>
                </div>
              ) : (
                visibleDoctors.map((doctor, index) => (
                  <DoctorRow
                    key={doctor._id}
                    doctor={doctor}
                    index={index}
                    deptLabelMap={deptLabelMap}
                    desigLabelMap={desigLabelMap}
                    onEdit={() => setFormModal(doctor)}
                    onDelete={() => setDeleteTarget(doctor)}
                  />
                ))
              )}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-[#E2E8F0]">
                <Pagination page={pagination.page} totalPages={pagination.totalPages} onPage={handlePage} />
              </div>
            )}

            {/* Footer note */}
            <div className="px-6 py-3 border-t border-[#E2E8F0] bg-[#F8FAFC]">
              <p className="font-['IBM_Plex_Mono',monospace] text-[10px] text-[#94A3B8]">
                * শুধুমাত্র সক্রিয় ডাক্তারের তথ্য অন্তর্ভুক্ত
              </p>
            </div>
          </div>
        )}

        <p className="font-['IBM_Plex_Mono',monospace] text-[11px] text-[#94A3B8] text-center mt-4 pb-6">
          LabPilotPro · ডাক্তার ম্যানেজমেন্ট সিস্টেম
        </p>
      </div>
    </section>
  );
};

export default ManageDoctors;
