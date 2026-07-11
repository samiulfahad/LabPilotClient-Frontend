/**
 * ManageSpaces.jsx
 * Indoor Patient Spaces / Wards CRUD for LabPilot Pro
 * Reservation only — booking is handled via invoice flow.
 * Bed states (display only): booked | reserved | available
 * departments is now an array (multi-select), fetched from backend.
 *
 * Styled to match the Referrer ledger/paper aesthetic:
 * IBM Plex Mono/Sans, shared Modal + Popup pattern, ActionChip rows,
 * StatCard grid, numbered expandable ledger rows.
 */

// React Compiler handles memoisation — no useCallback/useMemo

import { useState, useEffect, useRef } from "react";
import {
  BedDouble,
  Plus,
  Pencil,
  Trash2,
  X,
  AlertTriangle,
  Loader2,
  ChevronDown,
  Hash,
  Building2,
  Banknote,
  Layers,
  BookMarked,
  BookX,
  Check,
  Search,
  RotateCcw,
  AlertCircle,
} from "lucide-react";

import Modal from "../../../components/modal";
import Popup from "../../../components/popup";
import spaceService from "../../../api/admissionSpace";

const fmt = (n) =>
  new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT", minimumFractionDigits: 0 }).format(n || 0);

const deptLabel = (val, departments) => departments.find((d) => d.value === val)?.label ?? val;

// ── Error helpers ──────────────────────────────────────────────────────────────

const PERMISSION_DENIED_MESSAGE = "আপনার কর্তৃপক্ষ আপনাকে এই কাজটি করার বা এই তথ্যটি পাওয়ার অনুমতি দেয়নি।";

const getErrorMessage = (err, fallback) => {
  if (err?.response?.status === 403) return PERMISSION_DENIED_MESSAGE;
  return err?.response?.data?.error ?? fallback;
};

const getErrorStatus = (error) => error?.response?.status ?? error?.status ?? null;

// ── Shared input helpers ───────────────────────────────────────────────────────

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

// ── FormField ──────────────────────────────────────────────────────────────────

const FormField = ({ label, required, children, hint }) => (
  <div>
    <label className="block mb-1.5 font-['IBM_Plex_Mono',monospace] text-[11px] font-semibold uppercase tracking-[0.06em] text-[#64748B]">
      {label}
      {required && <span className="text-[#EF4444] ml-[3px]">*</span>}
      {hint && <span className="ml-1.5 text-[#94A3B8] font-normal normal-case tracking-normal">{hint}</span>}
    </label>
    {children}
  </div>
);

// ── Reserve Note Modal ─────────────────────────────────────────────────────────
// On a failed reserve, the modal stays OPEN (no onClose()) — a permission
// error or network hiccup shouldn't discard the note the user typed. The
// error surfaces inline via `apiError` in the sticky footer so they can
// just retry. Mirrors ItemModal/StockModal in Products.jsx.

const ReserveNoteModal = ({ title, bedNumber, onClose, onConfirm }) => {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [apiError, setApiError] = useState("");

  const handleConfirm = async () => {
    setBusy(true);
    setApiError("");
    try {
      await onConfirm(note);
      onClose();
    } catch (err) {
      setApiError(getErrorMessage(err, "সমস্যা হয়েছে। আবার চেষ্টা করুন।"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal isOpen size="sm" onClose={onClose}>
      <div className="flex flex-col max-h-[calc(100svh-96px)] overflow-hidden">
        {/* Header — fixed, never scrolls */}
        <div
          className="shrink-0 px-6 py-5 flex items-center justify-between border-b border-[#FDE68A]"
          style={{ background: "linear-gradient(135deg,#FFFBEB,#FEF3C7)" }}
        >
          <div className="flex items-center gap-3.5">
            <div
              className="flex items-center justify-center shrink-0 w-11 h-11 rounded-[14px] shadow-[0_8px_20px_rgba(245,158,11,0.35)]"
              style={{ background: "linear-gradient(135deg,#F59E0B,#D97706)" }}
            >
              <BookMarked className="w-[18px] h-[18px] text-white" />
            </div>
            <div>
              <p className="font-['IBM_Plex_Mono',monospace] text-[10px] font-bold uppercase tracking-[0.1em] mb-[2px] text-[#D97706]">
                সংরক্ষণ
              </p>
              <p className="font-['IBM_Plex_Sans',sans-serif] text-base font-bold text-[#0F172A]">{title}</p>
              {bedNumber !== undefined && (
                <p className="font-['IBM_Plex_Mono',monospace] text-[11px] text-[#94A3B8]">শয্যা #{bedNumber}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-[10px] text-[#94A3B8] border-[1.5px] border-[#E2E8F0] bg-white transition-all hover:bg-[#F1F5F9] hover:text-[#0F172A]"
          >
            <X className="w-[15px] h-[15px]" />
          </button>
        </div>

        {/* Body — the ONLY scrollable region, fills remaining space */}
        <div className="px-6 py-5 bg-[#F8FAFC] flex-1 min-h-0 overflow-y-auto">
          <div className="bg-white rounded-xl p-4 border border-[#E2E8F0] shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
            <div className="flex items-center justify-between mb-2">
              <p className="font-['IBM_Plex_Mono',monospace] text-[9px] font-bold uppercase tracking-[0.1em] text-[#94A3B8]">
                নোট <span className="text-[#94A3B8] font-normal normal-case">(ঐচ্ছিক)</span>
              </p>
              <span className="font-['IBM_Plex_Mono',monospace] text-[10px] text-[#94A3B8]">{note.length}/300</span>
            </div>
            <textarea
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                if (apiError) setApiError("");
              }}
              rows={3}
              maxLength={300}
              placeholder="যেমন: আগামীকাল রোগী ভর্তির জন্য সংরক্ষিত"
              className={`${inputBase} px-3 py-2.5 text-sm resize-none`}
              onFocus={focusInput}
              onBlur={blurInput}
            />
          </div>
        </div>

        {/* Footer — fixed, never scrolls. apiError banner sits directly
            above the action buttons so it's the last thing seen before
            retrying. */}
        <div className="shrink-0 bg-white border-t border-[#E2E8F0]">
          {apiError && (
            <div className="mx-6 mt-4 flex items-start gap-2.5 px-4 py-3 bg-[#EF444408] border-[1.5px] border-[#EF444430] rounded-xl">
              <AlertTriangle className="w-[14px] h-[14px] text-[#EF4444] shrink-0 mt-[1px]" />
              <span className="text-xs font-['IBM_Plex_Mono',monospace] text-[#EF4444]">{apiError}</span>
            </div>
          )}
          <div className="px-6 py-4 flex gap-3">
            <button
              onClick={onClose}
              disabled={busy}
              className="flex-1 py-3 font-semibold transition-all rounded-xl border-[1.5px] border-[#E2E8F0] text-[#64748B] font-['IBM_Plex_Mono',monospace] text-xs hover:bg-[#F1F5F9]"
            >
              বাতিল
            </button>
            <button
              onClick={handleConfirm}
              disabled={busy}
              className="flex-1 py-3 flex items-center justify-center gap-2 font-semibold transition-all rounded-xl border-none text-white font-['IBM_Plex_Mono',monospace] text-xs shadow-[0_4px_14px_rgba(245,158,11,0.4)]"
              style={{ background: busy ? "#94A3B8" : "linear-gradient(135deg,#F59E0B,#D97706)" }}
            >
              {busy ? (
                <span className="animate-spin inline-block w-[14px] h-[14px] rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <BookMarked className="w-[13px] h-[13px]" />
              )}
              সংরক্ষণ করুন
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

// ── Department Multi-Select Dropdown ───────────────────────────────────────────

const DeptMultiSelect = ({ value, onChange, error, departments }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50);
    else setSearch("");
  }, [open]);

  const toggle = (val) => {
    if (value.includes(val)) onChange(value.filter((v) => v !== val));
    else onChange([...value, val]);
  };

  if (!departments.length) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 font-['IBM_Plex_Mono',monospace] text-xs rounded-xl border-[1.5px] border-[#F59E0B30] bg-[#F59E0B0C] text-[#D97706]">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
        কোনো বিভাগ পাওয়া যায়নি। আবার চেষ্টা করুন।
      </div>
    );
  }

  const filtered = departments.filter((d) => d.label.toLowerCase().includes(search.toLowerCase()));

  return (
    <div ref={ref} className="relative">
      <label className="block mb-1.5 font-['IBM_Plex_Mono',monospace] text-[11px] font-semibold uppercase tracking-[0.06em] text-[#64748B]">
        বিভাগ(সমূহ) <span className="text-[#EF4444]">*</span>
        <span className="ml-1.5 text-[#94A3B8] font-normal normal-case tracking-normal">প্রযোজ্য সব নির্বাচন করুন</span>
      </label>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`${inputBase} flex items-center justify-between px-3.5 py-2.5 text-sm cursor-pointer`}
        style={
          error
            ? { borderColor: "#EF4444", background: "#EF444408" }
            : open
              ? { borderColor: "#6366F1", boxShadow: "0 0 0 3px #6366F120" }
              : undefined
        }
      >
        <span className={`truncate text-left ${value.length === 0 ? "text-[#94A3B8]" : "text-[#0F172A]"}`}>
          {value.length === 0
            ? "বিভাগ নির্বাচন করুন…"
            : value.length === 1
              ? deptLabel(value[0], departments)
              : `${value.length}টি বিভাগ নির্বাচিত`}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-[#94A3B8] shrink-0 ml-2 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {value.map((v) => (
            <span
              key={v}
              className="inline-flex items-center gap-1 px-2 py-[3px] rounded-lg font-['IBM_Plex_Mono',monospace] text-[11px] font-semibold bg-[#6366F112] text-[#6366F1] border-[1.5px] border-[#6366F130]"
            >
              {deptLabel(v, departments)}
              <button type="button" onClick={() => toggle(v)} className="text-[#6366F1] opacity-60 hover:opacity-100">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {open && (
        <div className="absolute z-30 mt-1.5 w-full bg-white border-[1.5px] border-[#E2E8F0] rounded-xl shadow-[0_12px_28px_rgba(15,23,42,0.12)] overflow-hidden">
          <div className="px-2.5 pt-2.5 pb-1.5 border-b border-[#E2E8F0]">
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#F8FAFC] border-[1.5px] border-[#E2E8F0]">
              <Search className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="বিভাগ অনুসন্ধান করুন…"
                className="flex-1 font-['IBM_Plex_Mono',monospace] text-xs bg-transparent outline-none text-[#0F172A] placeholder-[#94A3B8]"
              />
              {search && (
                <button type="button" onClick={() => setSearch("")} className="text-[#94A3B8] hover:text-[#0F172A]">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="px-4 py-3 font-['IBM_Plex_Mono',monospace] text-xs text-[#94A3B8] text-center">
                কোনো বিভাগ মেলেনি
              </p>
            ) : (
              filtered.map((d) => {
                const selected = value.includes(d.value);
                return (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => toggle(d.value)}
                    className={`w-full flex items-center justify-between px-3.5 py-2 font-['IBM_Plex_Sans',sans-serif] text-sm transition-colors text-left
                      ${selected ? "bg-[#6366F110] text-[#6366F1] font-semibold" : "text-[#0F172A] hover:bg-[#F1F5F9]"}`}
                  >
                    <span>{d.label}</span>
                    {selected && <Check className="w-3.5 h-3.5 text-[#6366F1] shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {error && <p className="text-[11px] text-[#EF4444] font-['IBM_Plex_Mono',monospace] mt-1">{error}</p>}
    </div>
  );
};

// ── Space Form Modal ────────────────────────────────────────────────────────────
// On a failed save the modal stays OPEN (no close) and the error surfaces
// inline via `apiError` in the sticky footer, directly above the action
// buttons — same pattern as ItemModal/StockModal in Products.jsx,
// ReferrerFormModal in ManageReferrer.jsx, StaffFormModal in
// ManageStaff.jsx, and DoctorFormModal in ManageDoctors.jsx. `onSubmit` is
// expected to perform the API call and throw on failure; this modal owns
// its own `saving`/`apiError` state rather than relying on the parent.

const EMPTY_FORM = {
  name: "",
  chargePerDay: "",
  departments: [],
  multiBed: false,
  totalNumberOfBed: "",
  bedStartingNumber: 1,
};

const SpaceFormModal = ({ editSpace, departments, onSubmit, onClose }) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState("");
  const isEdit = !!editSpace;
  const gradFrom = isEdit ? "#8B5CF6" : "#3B82F6";
  const gradTo = isEdit ? "#7C3AED" : "#2563EB";
  const accentText = isEdit ? "text-[#8B5CF6]" : "text-[#3B82F6]";
  const accentBorder = isEdit ? "border-[#8B5CF620]" : "border-[#3B82F620]";
  const accentShadow = isEdit ? "shadow-[0_8px_20px_#8B5CF640]" : "shadow-[0_8px_20px_#3B82F640]";

  useEffect(() => {
    if (editSpace) {
      const depts = editSpace.departments ? editSpace.departments : editSpace.department ? [editSpace.department] : [];
      setForm({
        name: editSpace.name,
        chargePerDay: editSpace.chargePerDay,
        departments: depts,
        multiBed: editSpace.multiBed,
        totalNumberOfBed: editSpace.multiBedConf?.totalNumberOfBed ?? "",
        bedStartingNumber: editSpace.multiBedConf?.bedStartingNumber ?? 1,
      });
    } else {
      setForm({ ...EMPTY_FORM });
    }
    setErrors({});
    setApiError("");
  }, [editSpace]);

  const set = (key, val) => {
    setForm((p) => ({ ...p, [key]: val }));
    setErrors((p) => ({ ...p, [key]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "নাম আবশ্যক";
    if (!form.chargePerDay || isNaN(form.chargePerDay) || Number(form.chargePerDay) < 0)
      e.chargePerDay = "সঠিক চার্জ লিখুন";
    if (!form.departments.length) e.departments = "অন্তত একটি বিভাগ নির্বাচন করুন";
    if (form.multiBed) {
      if (!form.totalNumberOfBed || isNaN(form.totalNumberOfBed) || Number(form.totalNumberOfBed) < 1)
        e.totalNumberOfBed = "মোট শয্যা লিখুন (≥ ১)";
      if (form.bedStartingNumber === "" || isNaN(form.bedStartingNumber) || Number(form.bedStartingNumber) < 0)
        e.bedStartingNumber = "সঠিক শুরুর নম্বর লিখুন";
    }
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    try {
      setSaving(true);
      setApiError("");
      await onSubmit(form);
    } catch (err) {
      setApiError(getErrorMessage(err, "সংরক্ষণ ব্যর্থ হয়েছে। আবার চেষ্টা করুন।"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen size="md" onClose={onClose}>
      <div className="flex flex-col max-h-[calc(100svh-96px)] overflow-hidden">
        {/* Header — fixed, never scrolls */}
        <div
          className={`shrink-0 px-6 py-5 flex items-center justify-between border-b ${accentBorder}`}
          style={{ background: `linear-gradient(135deg,${gradFrom}15 0%,${gradTo}08 100%)` }}
        >
          <div className="flex items-center gap-3.5">
            <div
              className={`flex items-center justify-center shrink-0 w-11 h-11 rounded-[14px] ${accentShadow}`}
              style={{ background: `linear-gradient(135deg,${gradFrom},${gradTo})` }}
            >
              {isEdit ? (
                <Pencil className="w-[18px] h-[18px] text-white" />
              ) : (
                <BedDouble className="w-[18px] h-[18px] text-white" />
              )}
            </div>
            <div>
              <p
                className={`font-['IBM_Plex_Mono',monospace] text-[10px] font-bold uppercase tracking-[0.1em] mb-[2px] ${accentText}`}
              >
                {isEdit ? "সম্পাদনা" : "নতুন আইটেম"}
              </p>
              <p className="font-['IBM_Plex_Sans',sans-serif] text-base font-bold text-[#0F172A]">
                {isEdit ? editSpace.name : "নতুন কক্ষ"}
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

        {/* Body — the ONLY scrollable region, fills remaining space */}
        <div className="px-6 py-5 bg-[#F8FAFC] space-y-4 flex-1 min-h-0 overflow-y-auto">
          {/* Name */}
          <div className="bg-white rounded-xl p-4 border border-[#E2E8F0] shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
            <p className="font-['IBM_Plex_Mono',monospace] text-[9px] font-bold uppercase tracking-[0.1em] text-[#94A3B8] mb-2">
              কক্ষের নাম
            </p>
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="যেমন: Ward-1, Cabin-A, ICU"
              className={`${inputBase} px-3 py-2 text-sm ${errors.name ? "border-[#EF444460]" : ""}`}
              onFocus={focusInput}
              onBlur={blurInput}
            />
            {errors.name && (
              <p className="font-['IBM_Plex_Mono',monospace] text-[11px] text-[#EF4444] mt-1.5">{errors.name}</p>
            )}
          </div>

          {/* Charge */}
          <div className="bg-white rounded-xl p-4 border border-[#E2E8F0] shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
            <p className="font-['IBM_Plex_Mono',monospace] text-[9px] font-bold uppercase tracking-[0.1em] text-[#94A3B8] mb-2">
              চার্জ / দিন
            </p>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-['IBM_Plex_Mono',monospace] text-xs font-bold text-[#0D9488]">
                ৳
              </span>
              <input
                type="number"
                min={0}
                value={form.chargePerDay}
                onChange={(e) => set("chargePerDay", e.target.value)}
                placeholder="০.০০"
                className={`${inputBase} pl-7 pr-3 py-2 text-sm ${errors.chargePerDay ? "border-[#EF444460]" : ""}`}
                onFocus={focusInput}
                onBlur={blurInput}
              />
            </div>
            {errors.chargePerDay && (
              <p className="font-['IBM_Plex_Mono',monospace] text-[11px] text-[#EF4444] mt-1.5">
                {errors.chargePerDay}
              </p>
            )}
          </div>

          {/* Departments */}
          <div className="bg-white rounded-xl p-4 border border-[#E2E8F0] shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
            <DeptMultiSelect
              value={form.departments}
              onChange={(val) => set("departments", val)}
              error={errors.departments}
              departments={departments}
            />
          </div>

          {/* Bed configuration */}
          <div className="bg-white rounded-xl p-4 border border-[#E2E8F0] shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
            <p className="font-['IBM_Plex_Mono',monospace] text-[9px] font-bold uppercase tracking-[0.1em] text-[#94A3B8] mb-3">
              শয্যা কনফিগারেশন
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: false, label: "একক শয্যা", Icon: Hash },
                { value: true, label: "মাল্টি-শয্যা", Icon: Layers },
              ].map(({ value, label, Icon }) => {
                const active = form.multiBed === value;
                return (
                  <button
                    key={String(value)}
                    type="button"
                    onClick={() => set("multiBed", value)}
                    className="flex items-center gap-2 px-3 py-3 transition-all font-semibold rounded-xl border-[1.5px] font-['IBM_Plex_Mono',monospace] text-xs"
                    style={
                      active
                        ? {
                            background: `linear-gradient(135deg,${gradFrom},${gradTo})`,
                            color: "white",
                            borderColor: "transparent",
                            boxShadow: `0 4px 10px ${gradFrom}30`,
                          }
                        : { background: "white", color: "#64748B", borderColor: "#E2E8F0" }
                    }
                  >
                    <Icon className="w-[14px] h-[14px] shrink-0" />
                    {label}
                    {active && <Check className="w-[11px] h-[11px] ml-auto" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bed layout */}
          {form.multiBed && (
            <div className="bg-white rounded-xl p-4 border border-[#E2E8F0] shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
              <p className="font-['IBM_Plex_Mono',monospace] text-[9px] font-bold uppercase tracking-[0.1em] text-[#94A3B8] mb-3">
                শয্যা লেআউট
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="font-['IBM_Plex_Mono',monospace] text-[10px] font-semibold text-[#64748B] mb-1.5">
                    মোট শয্যা <span className="text-[#EF4444]">*</span>
                  </p>
                  <input
                    type="number"
                    min={1}
                    value={form.totalNumberOfBed}
                    onChange={(e) => set("totalNumberOfBed", e.target.value)}
                    placeholder="২০"
                    className={`${inputBase} px-3 py-2.5 text-sm ${errors.totalNumberOfBed ? "border-[#EF444460]" : ""}`}
                    onFocus={focusInput}
                    onBlur={blurInput}
                  />
                  {errors.totalNumberOfBed && (
                    <p className="font-['IBM_Plex_Mono',monospace] text-[11px] text-[#EF4444] mt-1.5">
                      {errors.totalNumberOfBed}
                    </p>
                  )}
                </div>
                <div>
                  <p className="font-['IBM_Plex_Mono',monospace] text-[10px] font-semibold text-[#64748B] mb-1.5">
                    শয্যা শুরুর নম্বর
                  </p>
                  <input
                    type="number"
                    min={0}
                    value={form.bedStartingNumber}
                    onChange={(e) => set("bedStartingNumber", e.target.value)}
                    className={`${inputBase} px-3 py-2.5 text-sm`}
                    onFocus={focusInput}
                    onBlur={blurInput}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer — fixed, never scrolls. apiError banner sits directly
            above the action buttons so it's the last thing seen before
            retrying. */}
        <div className="shrink-0 bg-white border-t border-[#E2E8F0]">
          {apiError && (
            <div className="mx-6 mt-4 flex items-start gap-2.5 px-4 py-3 bg-[#EF444408] border-[1.5px] border-[#EF444430] rounded-xl">
              <AlertTriangle className="w-[14px] h-[14px] text-[#EF4444] shrink-0 mt-[1px]" />
              <span className="text-xs font-['IBM_Plex_Mono',monospace] text-[#EF4444]">{apiError}</span>
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
                background: saving ? "#94A3B8" : `linear-gradient(135deg,${gradFrom},${gradTo})`,
                cursor: saving ? "not-allowed" : "pointer",
              }}
            >
              {saving ? (
                <span className="animate-spin inline-block w-[14px] h-[14px] rounded-full border-2 border-white/40 border-t-white" />
              ) : isEdit ? (
                <Pencil className="w-[13px] h-[13px]" />
              ) : (
                <Plus className="w-[13px] h-[13px]" />
              )}
              {isEdit ? "পরিবর্তন সংরক্ষণ" : "তৈরি করুন"}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

// ── Action Chip ────────────────────────────────────────────────────────────────

const ActionChip = ({ onClick, icon: Icon, label, color, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="inline-flex items-center gap-1.5 transition-all font-semibold px-3 py-[5px] rounded-lg font-['IBM_Plex_Mono',monospace] text-[11px] disabled:opacity-50"
    style={{ border: `1.5px solid ${color}25`, color, background: `${color}08` }}
    onMouseEnter={(e) => {
      if (disabled) return;
      e.currentTarget.style.background = `${color}18`;
      e.currentTarget.style.borderColor = `${color}50`;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = `${color}08`;
      e.currentTarget.style.borderColor = `${color}25`;
    }}
  >
    {disabled ? <Loader2 className="w-[11px] h-[11px] animate-spin" /> : <Icon className="w-[11px] h-[11px]" />}
    {label}
  </button>
);

// ── Dept Badges ────────────────────────────────────────────────────────────────

const DeptBadges = ({ departments: deptValues = [], allDepartments = [], maxVisible = 2 }) => {
  const visible = deptValues.slice(0, maxVisible);
  const overflow = deptValues.length - maxVisible;
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {visible.map((d) => (
        <span
          key={d}
          className="px-1.5 py-[1px] rounded-md font-['IBM_Plex_Mono',monospace] text-[10px] font-semibold bg-[#6366F112] text-[#6366F1] border border-[#6366F125]"
        >
          {deptLabel(d, allDepartments)}
        </span>
      ))}
      {overflow > 0 && (
        <span
          className="px-1.5 py-[1px] rounded-md font-['IBM_Plex_Mono',monospace] text-[10px] font-semibold bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0]"
          title={deptValues
            .slice(maxVisible)
            .map((d) => deptLabel(d, allDepartments))
            .join(", ")}
        >
          +{overflow}
        </span>
      )}
    </div>
  );
};

// ── Bed Grid ───────────────────────────────────────────────────────────────────

const BedGrid = ({ conf, spaceId, onUpdate, onReserveClick }) => {
  const [busy, setBusy] = useState(null);
  const { totalNumberOfBed, bedStartingNumber, booked = [], reserved = [] } = conf;
  const beds = Array.from({ length: totalNumberOfBed }, (_, i) => bedStartingNumber + i);

  const statusOf = (b) => {
    if (booked.includes(b)) return "booked";
    if (reserved.some((r) => r.bedNumber === b)) return "reserved";
    return "available";
  };
  const reservedNoteOf = (b) => reserved.find((r) => r.bedNumber === b)?.note ?? "";

  const doReleaseReservation = async (b) => {
    setBusy(b);
    try {
      await spaceService.releaseBedReservation(spaceId, b);
      onUpdate((prev) => ({
        ...prev,
        multiBedConf: {
          ...prev.multiBedConf,
          reserved: (prev.multiBedConf.reserved ?? []).filter((r) => r.bedNumber !== b),
        },
      }));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {beds.map((b) => {
          const s = statusOf(b);
          const isBusy = busy === b;
          const note = s === "reserved" ? reservedNoteOf(b) : "";
          const colorClass =
            s === "booked"
              ? "bg-[#EF444408] text-[#EF444480] border-[#EF444430] cursor-default"
              : s === "reserved"
                ? "bg-[#F59E0B0C] text-[#D97706] border-[#F59E0B40] hover:bg-[#F59E0B18] cursor-pointer"
                : "bg-[#10B9810C] text-[#0D9488] border-[#10B98140] hover:bg-[#10B98118] cursor-pointer";
          const handleClick = () => {
            if (s === "booked" || isBusy) return;
            if (s === "available") onReserveClick(b);
            if (s === "reserved") doReleaseReservation(b);
          };
          return (
            <button
              key={b}
              onClick={handleClick}
              disabled={s === "booked" || isBusy}
              title={
                s === "booked"
                  ? `শয্যা ${b} — বুক করা (ইনভয়েস অনুযায়ী পরিচালিত)`
                  : s === "reserved"
                    ? `শয্যা ${b} — সংরক্ষিত${note ? `: ${note}` : ""} · মুক্ত করতে ক্লিক করুন`
                    : `শয্যা ${b} — খালি · সংরক্ষণ করতে ক্লিক করুন`
              }
              className={`w-8 h-8 rounded-lg font-['IBM_Plex_Mono',monospace] text-xs font-bold flex items-center justify-center border-[1.5px] transition-colors relative ${colorClass} ${isBusy ? "opacity-50" : ""}`}
            >
              {isBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : b}
              {s === "reserved" && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#F59E0B] border border-white" />
              )}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-4 mt-3 font-['IBM_Plex_Mono',monospace] text-[10px] font-medium">
        <span className="flex items-center gap-1 text-[#0D9488]">
          <span className="w-2.5 h-2.5 rounded bg-[#0D948830] inline-block" /> খালি
        </span>
        <span className="flex items-center gap-1 text-[#D97706]">
          <span className="w-2.5 h-2.5 rounded bg-[#F59E0B30] inline-block" /> সংরক্ষিত
        </span>
        <span className="flex items-center gap-1 text-[#EF444480]">
          <span className="w-2.5 h-2.5 rounded bg-[#EF444430] inline-block" /> বুক করা
        </span>
      </div>
      <p className="font-['IBM_Plex_Mono',monospace] text-[10px] text-[#94A3B8] mt-1.5">
        খালি শয্যায় ক্লিক করে সংরক্ষণ করুন · সংরক্ষিত শয্যায় ক্লিক করে মুক্ত করুন · বুক করা শয্যা ইনভয়েস অনুযায়ী
        পরিচালিত হয়
      </p>
    </div>
  );
};

// ── Space Row ──────────────────────────────────────────────────────────────────

const SpaceRow = ({
  space,
  index,
  allDepartments,
  onEdit,
  onDelete,
  onReserveSingle,
  onReleaseSingle,
  onUpdate,
  onReserveBed,
  busy,
}) => {
  const [expanded, setExpanded] = useState(false);
  const depts = space.departments ?? (space.department ? [space.department] : []);
  const totalBeds = space.multiBedConf?.totalNumberOfBed ?? 0;
  const bookedCount = space.multiBedConf?.booked?.length ?? 0;
  const reservedCount = space.multiBedConf?.reserved?.length ?? 0;
  const availableCount = totalBeds - bookedCount - reservedCount;

  return (
    <div className="border-b border-[#E2E8F0]">
      <button onClick={() => setExpanded((v) => !v)} className="w-full text-left">
        <div className="flex items-center gap-3 py-3 px-2 rounded-xl transition-all hover:bg-[#F1F5F9]">
          <span className="flex items-center justify-center shrink-0 w-[26px] h-[26px] rounded-lg bg-[#EEF2FF] font-['IBM_Plex_Mono',monospace] text-[10px] font-bold text-[#64748B]">
            {String(index + 1).padStart(2, "0")}
          </span>
          <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
            <span className="font-['IBM_Plex_Sans',sans-serif] text-sm font-semibold text-[#0F172A]">{space.name}</span>
            <DeptBadges departments={depts} allDepartments={allDepartments} maxVisible={2} />
          </div>

          {space.multiBed ? (
            <span className="shrink-0 hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-lg border-[1.5px] border-[#6366F130] bg-[#6366F112] text-[#6366F1] font-['IBM_Plex_Mono',monospace] text-[10px] font-bold">
              <Layers className="w-[10px] h-[10px]" /> {availableCount}/{totalBeds}
            </span>
          ) : (
            <span
              className={`shrink-0 hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-lg border-[1.5px] font-['IBM_Plex_Mono',monospace] text-[10px] font-bold
                ${space.reserved ? "bg-[#F59E0B12] border-[#F59E0B30] text-[#D97706]" : "bg-[#0D948812] border-[#0D948830] text-[#0D9488]"}`}
            >
              {space.reserved ? <BookMarked className="w-[10px] h-[10px]" /> : <Hash className="w-[10px] h-[10px]" />}
              {space.reserved ? "সংরক্ষিত" : "খালি"}
            </span>
          )}

          <span
            className="shrink-0 flex items-center gap-1 px-3 py-1 rounded-[20px] text-white font-['IBM_Plex_Mono',monospace] text-xs font-bold shadow-[0_3px_8px_#3B82F630]"
            style={{ background: "linear-gradient(135deg,#3B82F6,#2563EB)" }}
          >
            <Banknote className="w-[11px] h-[11px]" />
            {fmt(space.chargePerDay)}
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
          <div className="font-['IBM_Plex_Mono',monospace] text-xs text-[#64748B] leading-loose mb-3 space-y-1">
            <p className="flex items-center gap-1.5">
              <Building2 className="w-3 h-3 text-[#6366F1]" />
              {depts.map((d) => deptLabel(d, allDepartments)).join(", ")}
            </p>
            {!space.multiBed && space.reserved && space.reservedNote && (
              <p className="flex items-start gap-1.5 text-[#D97706]">
                <BookMarked className="w-3 h-3 mt-[2px] shrink-0" />
                {space.reservedNote}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap mb-1">
            <ActionChip onClick={() => onEdit(space)} icon={Pencil} label="সম্পাদনা" color="#6366F1" />
            {!space.multiBed &&
              (space.reserved ? (
                <ActionChip
                  onClick={() => onReleaseSingle(space)}
                  icon={BookX}
                  label="মুক্ত করুন"
                  color="#F59E0B"
                  disabled={busy === space._id}
                />
              ) : (
                <ActionChip
                  onClick={() => onReserveSingle(space)}
                  icon={BookMarked}
                  label="সংরক্ষণ"
                  color="#F59E0B"
                  disabled={busy === space._id}
                />
              ))}
            <ActionChip onClick={() => onDelete(space)} icon={Trash2} label="মুছুন" color="#EF4444" />
          </div>

          {space.multiBed && space.multiBedConf && (
            <div className="mt-3 pt-3 border-t border-[#E2E8F0]">
              <p className="font-['IBM_Plex_Mono',monospace] text-[10px] font-bold uppercase tracking-[0.08em] text-[#94A3B8] mb-2">
                শয্যা লেআউট
              </p>
              <BedGrid
                conf={space.multiBedConf}
                spaceId={space._id}
                onUpdate={onUpdate}
                onReserveClick={(bedNumber) => onReserveBed(space, bedNumber)}
              />
            </div>
          )}
        </div>
      )}
    </div>
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

// ── Filter Dropdown ─────────────────────────────────────────────────────────────

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
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="flex items-center gap-3 px-6 py-3.5 border-b border-[#E2E8F0]">
        <div className="w-[26px] h-[26px] bg-[#E2E8F0] rounded-lg" />
        <div className="flex-1 h-[13px] bg-[#E2E8F0] rounded-md" />
        <div className="w-[65px] h-[26px] bg-[#E2E8F0] rounded-[20px]" />
      </div>
    ))}
  </div>
);

// ── Main Page ────────────────────────────────────────────────────────────────────

const ManageSpaces = () => {
  const [spaces, setSpaces] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [popup, setPopup] = useState(null);
  const [formModal, setFormModal] = useState(null); // null | { editSpace } — editSpace is null for "add"
  // Delete / release confirmations go through the shared <Popup
  // type="warning"> directly (see render section below), not a bespoke
  // modal — same pattern as Products.jsx / ManageReferrer.jsx /
  // ManageTests.jsx / ManageStaff.jsx / ManageDoctors.jsx.
  const [confirmTarget, setConfirmTarget] = useState(null); // { type: "delete" | "release", space }
  const [reserveModal, setReserveModal] = useState(null); // { space, bedNumber? }
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [busyId, setBusyId] = useState(null);

  const loadAll = async () => {
    try {
      const [deptRes, spacesRes] = await Promise.all([spaceService.getDepartments(), spaceService.getAll()]);
      setDepartments(deptRes.data.departments ?? []);
      setSpaces(spacesRes.data);
    } catch (err) {
      setPopup({ type: "error", message: getErrorMessage(err, "কক্ষ লোড করতে ব্যর্থ।") });
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const stats = {
    total: spaces.length,
    totalBeds: spaces.reduce((a, s) => a + (s.multiBedConf?.totalNumberOfBed ?? 1), 0),
    available: spaces.reduce((a, s) => {
      if (!s.multiBed || !s.multiBedConf) return a + (s.reserved ? 0 : 1);
      return (
        a +
        s.multiBedConf.totalNumberOfBed -
        (s.multiBedConf.booked?.length ?? 0) -
        (s.multiBedConf.reserved?.length ?? 0)
      );
    }, 0),
    reserved: spaces.reduce((a, s) => {
      if (!s.multiBed || !s.multiBedConf) return a + (s.reserved ? 1 : 0);
      return a + (s.multiBedConf.reserved?.length ?? 0);
    }, 0),
  };

  const filtered = spaces.filter((s) => {
    const depts = s.departments ?? (s.department ? [s.department] : []);
    if (deptFilter !== "all" && !depts.includes(deptFilter)) return false;
    if (search.trim()) return s.name.toLowerCase().includes(search.trim().toLowerCase());
    return true;
  });

  const hasFilters = deptFilter !== "all";

  // ── Create / Edit ──
  const openAdd = () => setFormModal({ editSpace: null });
  const openEdit = (space) => setFormModal({ editSpace: space });
  const closeForm = () => setFormModal(null);

  // The form modal itself owns saving/apiError state and stays open on
  // failure — this just performs the API call, updates local state, and
  // closes on success. Any thrown error propagates back to the modal.
  const handleFormSubmit = async (form) => {
    const payload = {
      name: form.name.trim(),
      chargePerDay: Number(form.chargePerDay),
      departments: form.departments,
      multiBed: form.multiBed,
      multiBedConf: form.multiBed
        ? {
            totalNumberOfBed: Number(form.totalNumberOfBed),
            bedStartingNumber: Number(form.bedStartingNumber),
            booked: formModal.editSpace?.multiBedConf?.booked ?? [],
          }
        : null,
    };
    if (formModal.editSpace) {
      await spaceService.update(formModal.editSpace._id, payload);
      setSpaces((p) => p.map((s) => (s._id === formModal.editSpace._id ? { ...s, ...payload } : s)));
      setPopup({ type: "success", message: `"${payload.name}" আপডেট করা হয়েছে।` });
    } else {
      const res = await spaceService.create(payload);
      setSpaces((p) => [{ ...res.data, ...payload }, ...p]);
      setPopup({ type: "success", message: `"${payload.name}" সফলভাবে যোগ করা হয়েছে।` });
    }
    closeForm();
  };

  // No in-flight spinner on the confirm popup itself — it closes as soon as
  // onConfirm fires, so a failure just surfaces as a follow-up error toast.
  // Mirrors handleDelete in Products.jsx / ManageReferrer.jsx / ManageTests.jsx.
  const handleDelete = async (space) => {
    try {
      await spaceService.delete(space._id);
      setSpaces((p) => p.filter((s) => s._id !== space._id));
      setPopup({ type: "success", message: `"${space.name}" মুছে ফেলা হয়েছে।` });
    } catch (err) {
      if (getErrorStatus(err) === 404) {
        setSpaces((p) => p.filter((s) => s._id !== space._id));
      }
      setPopup({ type: "error", message: getErrorMessage(err, "কক্ষ মুছতে ব্যর্থ হয়েছে।") });
    } finally {
      setConfirmTarget(null);
    }
  };

  // ── Single-space reserve / release ──
  const handleReserveSingle = async (space, note) => {
    await spaceService.reserve(space._id, note);
    setSpaces((p) => p.map((s) => (s._id === space._id ? { ...s, reserved: true, reservedNote: note } : s)));
    setPopup({ type: "success", message: `"${space.name}" সংরক্ষিত হয়েছে।` });
  };

  const handleReleaseSingle = async (space) => {
    try {
      await spaceService.releaseReservation(space._id);
      setSpaces((p) => p.map((s) => (s._id === space._id ? { ...s, reserved: false, reservedNote: "" } : s)));
      setPopup({ type: "success", message: `"${space.name}"-এর সংরক্ষণ মুক্ত করা হয়েছে।` });
    } catch (err) {
      setPopup({ type: "error", message: getErrorMessage(err, "মুক্ত করতে ব্যর্থ হয়েছে।") });
    } finally {
      setConfirmTarget(null);
    }
  };

  // ── Bed-level reserve ──
  const handleReserveBed = async (space, note) => {
    const bedNumber = reserveModal.bedNumber;
    await spaceService.reserveBed(space._id, bedNumber, note);
    setSpaces((p) =>
      p.map((s) =>
        s._id === space._id
          ? {
              ...s,
              multiBedConf: { ...s.multiBedConf, reserved: [...(s.multiBedConf.reserved ?? []), { bedNumber, note }] },
            }
          : s,
      ),
    );
    setPopup({ type: "success", message: `শয্যা ${bedNumber} সংরক্ষিত হয়েছে।` });
  };

  const handleSpaceUpdate = (space, updater) => {
    setSpaces((prev) =>
      prev.map((s) => {
        if (s._id !== space._id) return s;
        return typeof updater === "function" ? updater(s) : updater;
      }),
    );
  };

  return (
    <section
      className="min-h-screen px-4 py-6 font-['IBM_Plex_Sans',sans-serif]"
      style={{ background: "linear-gradient(to bottom right,#f8fafc,#eff6ff,#eef2ff)" }}
    >
      {popup && <Popup type={popup.type} message={popup.message} onClose={() => setPopup(null)} />}

      {formModal && (
        <SpaceFormModal
          editSpace={formModal.editSpace}
          departments={departments}
          onSubmit={handleFormSubmit}
          onClose={closeForm}
        />
      )}

      {confirmTarget?.type === "delete" && (
        <Popup
          type="warning"
          message={`"${confirmTarget.space.name}" স্থায়ীভাবে মুছে যাবে। এই কাজ পূর্বাবস্থায় ফেরানো যাবে না।`}
          confirmText="হ্যাঁ, মুছুন"
          cancelText="বাতিল"
          onConfirm={() => handleDelete(confirmTarget.space)}
          onClose={() => setConfirmTarget(null)}
        />
      )}

      {confirmTarget?.type === "release" && (
        <Popup
          type="warning"
          message={`"${confirmTarget.space.name}"-এর সংরক্ষণ মুক্ত করবেন?`}
          confirmText="হ্যাঁ, মুক্ত করুন"
          cancelText="বাতিল"
          onConfirm={() => handleReleaseSingle(confirmTarget.space)}
          onClose={() => setConfirmTarget(null)}
        />
      )}

      {reserveModal && (
        <ReserveNoteModal
          title={reserveModal.bedNumber !== undefined ? "শয্যা সংরক্ষণ" : `"${reserveModal.space.name}" সংরক্ষণ`}
          bedNumber={reserveModal.bedNumber}
          onClose={() => setReserveModal(null)}
          onConfirm={(note) =>
            reserveModal.bedNumber !== undefined
              ? handleReserveBed(reserveModal.space, note)
              : handleReserveSingle(reserveModal.space, note)
          }
        />
      )}

      <div className="max-w-2xl mx-auto">
        {/* Page header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="font-['IBM_Plex_Mono',monospace] text-[10px] uppercase tracking-[0.1em] text-[#6366F1] mb-1">
              LAB OPERATIONS
            </p>
            <h1 className="font-['IBM_Plex_Sans',sans-serif] text-[26px] font-bold text-[#0F172A] leading-tight">
              Manage Spaces
            </h1>
            <p className="text-sm text-[#64748B] mt-1">Wards, cabins, and indoor patient spaces.</p>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={openAdd}
              className="flex items-center gap-1.5 transition-all font-semibold px-4 py-2 rounded-xl text-white font-['IBM_Plex_Mono',monospace] text-xs border-none shadow-[0_4px_14px_rgba(99,102,241,0.4)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.5)]"
              style={{ background: "linear-gradient(135deg,#6366F1,#4F46E5)" }}
            >
              <Plus className="w-[13px] h-[13px]" /> New
            </button>
          </div>
        </div>

        {/* Stats */}
        {!initialLoading && (
          <div className="grid grid-cols-4 gap-3 mb-5">
            <StatCard
              label="Total"
              value={stats.total}
              color="#6366F1"
              grad="linear-gradient(135deg,#6366F1,#4F46E5)"
              icon={Building2}
            />
            <StatCard
              label="Beds"
              value={stats.totalBeds}
              color="#3B82F6"
              grad="linear-gradient(135deg,#3B82F6,#2563EB)"
              icon={BedDouble}
            />
            <StatCard
              label="Available"
              value={stats.available}
              color="#0D9488"
              grad="linear-gradient(135deg,#0D9488,#0F766E)"
              icon={Hash}
            />
            <StatCard
              label="Reserved"
              value={stats.reserved}
              color="#F59E0B"
              grad="linear-gradient(135deg,#F59E0B,#D97706)"
              icon={BookMarked}
            />
          </div>
        )}

        {/* Main card */}
        {initialLoading ? (
          <Skeleton />
        ) : (
          <div className="bg-white overflow-hidden border border-[#E2E8F0] rounded-[20px] shadow-[0_4px_20px_rgba(15,23,42,0.07)]">
            {/* Card header */}
            <div
              className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]"
              style={{ background: "linear-gradient(135deg,#F8FAFC,#EEF2FF)" }}
            >
              <div>
                <p className="font-['IBM_Plex_Mono',monospace] text-[10px] font-bold uppercase tracking-[0.1em] text-[#6366F1] mb-1">
                  SPACE LEDGER
                </p>
                <div className="flex items-center gap-3">
                  <span className="font-['IBM_Plex_Mono',monospace] text-[13px] font-semibold text-[#64748B]">
                    {stats.total} spaces
                  </span>
                  {stats.available > 0 && (
                    <span className="px-2 py-0.5 font-['IBM_Plex_Mono',monospace] text-[11px] font-bold text-[#10B981] bg-[#10B98110] rounded-[6px] border border-[#10B98125]">
                      {stats.available} beds free
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
                  placeholder="Search space name…"
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
                options={departments}
                placeholder="All Departments"
              />
              {hasFilters && (
                <button
                  onClick={() => setDeptFilter("all")}
                  className="flex items-center gap-1.5 transition-all font-semibold py-[7px] px-3 border-[1.5px] border-[#EF444430] rounded-[10px] text-[#EF4444] font-['IBM_Plex_Mono',monospace] text-[11px] bg-[#EF444406] hover:bg-[#EF444412]"
                >
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
              )}
            </div>

            {/* Column labels */}
            <div className="flex items-center gap-3 px-4 pt-3 pb-1">
              <span className="font-['IBM_Plex_Mono',monospace] text-[9px] font-bold uppercase tracking-[0.08em] text-[#94A3B8] w-[26px] shrink-0">
                #
              </span>
              <span className="font-['IBM_Plex_Mono',monospace] text-[9px] font-bold uppercase tracking-[0.08em] text-[#94A3B8] flex-1">
                SPACE
              </span>
              <span className="font-['IBM_Plex_Mono',monospace] text-[9px] font-bold uppercase tracking-[0.08em] text-[#94A3B8] shrink-0">
                CHARGE
              </span>
              <span className="w-[14px] shrink-0" />
            </div>

            {/* Rows */}
            <div className="px-4 pb-4">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2 text-[#94A3B8]">
                  <AlertCircle className="w-7 h-7 opacity-40" />
                  <p className="font-['IBM_Plex_Mono',monospace] text-xs">
                    {hasFilters || search ? "No spaces found" : "No spaces added yet"}
                  </p>
                </div>
              ) : (
                filtered.map((space, index) => (
                  <SpaceRow
                    key={space._id}
                    space={space}
                    index={index}
                    allDepartments={departments}
                    busy={busyId}
                    onEdit={openEdit}
                    onDelete={(s) => setConfirmTarget({ type: "delete", space: s })}
                    onReserveSingle={(s) => setReserveModal({ space: s })}
                    onReleaseSingle={(s) => setConfirmTarget({ type: "release", space: s })}
                    onReserveBed={(s, bedNumber) => setReserveModal({ space: s, bedNumber })}
                    onUpdate={(updater) => handleSpaceUpdate(space, updater)}
                  />
                ))
              )}
            </div>

            {/* Footer note */}
            <div className="px-6 py-3 border-t border-[#E2E8F0] bg-[#F8FAFC]">
              <p className="font-['IBM_Plex_Mono',monospace] text-[10px] text-[#94A3B8]">
                * Booked beds are managed automatically via the invoice flow
              </p>
            </div>
          </div>
        )}

        <p className="font-['IBM_Plex_Mono',monospace] text-[11px] text-[#94A3B8] text-center mt-4 pb-6">
          LabPilotPro · Indoor Patient Space Management
        </p>
      </div>
    </section>
  );
};

export default ManageSpaces;
