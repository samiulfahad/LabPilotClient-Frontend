/**
 * useCallback / useMemo are intentionally absent throughout this file.
 * babel-plugin-react-compiler handles all memoization automatically.
 */
import { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import {
  Users,
  ArrowLeft,
  Search,
  X,
  RotateCcw,
  UserPlus,
  UserCheck,
  UserX,
  Stethoscope,
  Briefcase,
  Building2,
  AlertCircle,
  Pencil,
  Trash2,
  ChevronDown,
  Phone,
  BadgePercent,
  Banknote,
  Check,
  AlertTriangle,
} from "lucide-react";
import Popup from "../../../components/popup";
import referrerService from "../../../api/referrer";

// ── Type config ────────────────────────────────────────────────────────────────

const TYPE_CONFIG = {
  doctor: {
    label: "ডাক্তার",
    icon: Stethoscope,
    color: "#3B82F6",
    bg: "bg-[#3B82F615]",
    border: "border-[#3B82F630]",
    text: "text-[#3B82F6]",
    grad: "from-[#3B82F6] to-[#2563EB]",
  },
  agent: {
    label: "এজেন্ট",
    icon: Briefcase,
    color: "#F59E0B",
    bg: "bg-[#F59E0B15]",
    border: "border-[#F59E0B30]",
    text: "text-[#F59E0B]",
    grad: "from-[#F59E0B] to-[#D97706]",
  },
  institute: {
    label: "প্রতিষ্ঠান",
    icon: Building2,
    color: "#0D9488",
    bg: "bg-[#0D948815]",
    border: "border-[#0D948830]",
    text: "text-[#0D9488]",
    grad: "from-[#0D9488] to-[#0F766E]",
  },
};

// ── Initial form data ──────────────────────────────────────────────────────────

const EMPTY_FORM = {
  name: "",
  contactNumber: "",
  degree: "",
  details: "",
  type: "doctor",
  commissionType: "percentage",
  commissionValue: 0,
  isActive: true,
};

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

const FormField = ({ label, required, children }) => (
  <div>
    <label className="block mb-1.5 font-['IBM_Plex_Mono',monospace] text-[11px] font-semibold uppercase tracking-[0.06em] text-[#64748B]">
      {label}
      {required && <span className="text-[#EF4444] ml-[3px]">*</span>}
    </label>
    {children}
  </div>
);

// ── Modal Shell ────────────────────────────────────────────────────────────────

const ModalShell = ({ onClose, children }) => {
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
      <div className="relative w-full max-w-[520px] max-h-[calc(100svh-48px)] overflow-y-auto">{children}</div>
    </div>
  );
};

// ── Confirm Modal ──────────────────────────────────────────────────────────────

const ConfirmModal = ({ message, onConfirm, onCancel, loading }) => (
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
          <AlertTriangle className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-['IBM_Plex_Mono',monospace] text-[10px] font-bold uppercase tracking-[0.1em] text-[#DC2626] mb-[2px]">
            নিশ্চিত করুন
          </p>
          <p className="font-['IBM_Plex_Sans',sans-serif] text-[15px] font-bold text-[#0F172A]">{message}</p>
        </div>
      </div>
      <div className="px-6 py-5 flex gap-3">
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
          className="flex-1 py-3 flex items-center justify-center gap-2 font-semibold transition-all rounded-xl border-none text-white font-['IBM_Plex_Mono',monospace] text-xs shadow-[0_4px_14px_rgba(239,68,68,0.4)]"
          style={{ background: "linear-gradient(135deg,#EF4444,#DC2626)", opacity: loading ? 0.7 : 1 }}
        >
          {loading ? (
            <span className="animate-spin inline-block w-[14px] h-[14px] rounded-full border-2 border-white/40 border-t-white" />
          ) : (
            <Check className="w-[14px] h-[14px]" />
          )}
          হ্যাঁ, নিশ্চিত
        </button>
      </div>
    </div>
  </ModalShell>
);

// ── Referrer Form Modal ────────────────────────────────────────────────────────

const ReferrerFormModal = ({ formData, onChange, onSubmit, onClose, saving }) => {
  const isEdit = formData.formType === "editReferrer";
  const gradFrom = isEdit ? "#8B5CF6" : "#0D9488";
  const gradTo = isEdit ? "#7C3AED" : "#0F766E";
  const accentText = isEdit ? "text-[#8B5CF6]" : "text-[#0D9488]";
  const accentBorder = isEdit ? "border-[#8B5CF620]" : "border-[#0D948820]";
  const accentShadow = isEdit ? "shadow-[0_8px_20px_#8B5CF640]" : "shadow-[0_8px_20px_#0D948840]";

  const handleCommissionChange = (e) => {
    let val = parseFloat(e.target.value) || 0;
    if (formData.commissionType === "percentage" && val > 100) val = 100;
    onChange("commissionValue", val);
  };

  return (
    <ModalShell onClose={onClose}>
      <div className="bg-white flex flex-col overflow-hidden rounded-[0px] shadow-[0_25px_60px_rgba(15,23,42,0.2)]">
        {/* Header */}
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
                {isEdit ? "রেফারার সম্পাদনা" : "রেফারার নিবন্ধন"}
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
        <div className="px-6 py-5 space-y-4 bg-[#F8FAFC]">
          {/* Type selector */}
          <FormField label="ধরন" required>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(TYPE_CONFIG).map(([value, { label, icon: Icon, color, bg, border, text }]) => {
                const active = formData.type === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => onChange("type", value)}
                    className={`flex items-center gap-2 px-3 py-3 transition-all font-semibold rounded-xl border-[1.5px] font-['IBM_Plex_Mono',monospace] text-xs
                      ${active ? `${bg} ${border} ${text}` : "bg-white border-[#E2E8F0] text-[#64748B]"}`}
                  >
                    <Icon className="w-[14px] h-[14px] shrink-0" />
                    {label}
                    {active && <Check className="w-[11px] h-[11px] ml-auto" />}
                  </button>
                );
              })}
            </div>
          </FormField>

          {/* Name + Contact */}
          <div className="grid grid-cols-2 gap-3">
            <FormField label="পূর্ণ নাম" required>
              <input
                type="text"
                value={formData.name || ""}
                onChange={(e) => onChange("name", e.target.value)}
                placeholder="রেফারারের নাম"
                className={`${inputBase} px-3 py-2.5 text-sm`}
                onFocus={focusInput}
                onBlur={blurInput}
              />
            </FormField>
            <FormField label="যোগাযোগ নম্বর" required>
              <input
                type="tel"
                value={formData.contactNumber || ""}
                onChange={(e) => onChange("contactNumber", e.target.value)}
                placeholder="01XXXXXXXXX"
                maxLength={11}
                className={`${inputBase} px-3 py-2.5 text-sm`}
                onFocus={focusInput}
                onBlur={blurInput}
              />
            </FormField>
          </div>

          {/* Degree */}
          {formData.type === "doctor" && (
            <FormField label="ডিগ্রি">
              <input
                type="text"
                value={formData.degree || ""}
                onChange={(e) => onChange("degree", e.target.value)}
                placeholder="MBBS, MD, FCPS…"
                className={`${inputBase} px-3 py-2.5 text-sm`}
                onFocus={focusInput}
                onBlur={blurInput}
              />
            </FormField>
          )}

          {/* Details */}
          <FormField label="বিবরণ">
            <textarea
              value={formData.details || ""}
              onChange={(e) => onChange("details", e.target.value)}
              placeholder="অতিরিক্ত তথ্য…"
              rows={2}
              className={`${inputBase} px-3 py-2 text-sm resize-none`}
              onFocus={focusInput}
              onBlur={blurInput}
            />
          </FormField>

          {/* Status */}
          <FormField label="স্ট্যাটাস">
            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  value: true,
                  label: "সক্রিয়",
                  bg: "bg-[#0D948812]",
                  border: "border-[#0D948860]",
                  text: "text-[#0D9488]",
                },
                {
                  value: false,
                  label: "নিষ্ক্রিয়",
                  bg: "bg-[#EF444412]",
                  border: "border-[#EF444460]",
                  text: "text-[#EF4444]",
                },
              ].map(({ value, label, bg, border, text }) => {
                const active = formData.isActive === value;
                return (
                  <button
                    key={String(value)}
                    type="button"
                    onClick={() => onChange("isActive", value)}
                    className={`flex items-center gap-2 px-3 py-3 transition-all font-semibold rounded-xl border-[1.5px] font-['IBM_Plex_Mono',monospace] text-xs
                      ${active ? `${bg} ${border} ${text}` : "bg-white border-[#E2E8F0] text-[#64748B]"}`}
                  >
                    {active && <Check className="w-3 h-3" />}
                    {label}
                  </button>
                );
              })}
            </div>
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
                    bg: "bg-[#F59E0B12]",
                    border: "border-[#F59E0B60]",
                    text: "text-[#F59E0B]",
                  },
                  {
                    type: "fixed",
                    label: "নির্দিষ্ট (৳)",
                    Icon: Banknote,
                    bg: "bg-[#0D948812]",
                    border: "border-[#0D948860]",
                    text: "text-[#0D9488]",
                  },
                ].map(({ type, label, Icon, bg, border, text }) => {
                  const active = formData.commissionType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        onChange("commissionType", type);
                        onChange("commissionValue", 0);
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
                  type="number"
                  min="0"
                  step={formData.commissionType === "percentage" ? "0.1" : "1"}
                  max={formData.commissionType === "percentage" ? 100 : undefined}
                  value={formData.commissionValue || ""}
                  onChange={handleCommissionChange}
                  placeholder={formData.commissionType === "percentage" ? "০ – ১০০" : "পরিমাণ লিখুন"}
                  className={`${inputBase} text-sm ${formData.commissionType === "percentage" ? "pl-3.5 pr-9" : "pl-8 pr-3.5"} py-2.5`}
                  onFocus={focusInput}
                  onBlur={blurInput}
                />
                {formData.commissionType === "percentage" ? (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 font-['IBM_Plex_Mono',monospace] text-sm font-bold text-[#F59E0B]">
                    %
                  </span>
                ) : (
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-['IBM_Plex_Mono',monospace] text-sm font-bold text-[#0D9488]">
                    ৳
                  </span>
                )}
                {formData.commissionType === "percentage" && (
                  <p className="mt-1 text-[10px] text-[#94A3B8] font-['IBM_Plex_Mono',monospace]">
                    সর্বোচ্চ ১০০% পর্যন্ত
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 px-6 py-4 flex gap-3 bg-white border-t border-[#E2E8F0]">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex-1 py-3 font-semibold transition-all rounded-xl border-[1.5px] border-[#E2E8F0] text-[#64748B] font-['IBM_Plex_Mono',monospace] text-xs hover:bg-[#F1F5F9]"
          >
            বাতিল
          </button>
          <button
            onClick={onSubmit}
            disabled={saving}
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
              <UserPlus className="w-[13px] h-[13px]" />
            )}
            {isEdit ? "পরিবর্তন সংরক্ষণ" : "নিবন্ধন করুন"}
          </button>
        </div>
      </div>
    </ModalShell>
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

// ── Referrer Row ───────────────────────────────────────────────────────────────

const ReferrerRow = ({ input, index, onEdit, onDelete, onDeactivate, onActivate }) => {
  const [expanded, setExpanded] = useState(false);
  const cfg = TYPE_CONFIG[input.type] ?? TYPE_CONFIG.doctor;
  const TypeIcon = cfg.icon;
  const isPercent = input.commissionType === "percentage";
  const commGrad = isPercent ? "linear-gradient(135deg,#F59E0B,#D97706)" : "linear-gradient(135deg,#0D9488,#0F766E)";
  const commShadow = isPercent ? "shadow-[0_3px_8px_#F59E0B30]" : "shadow-[0_3px_8px_#0D948830]";

  return (
    <div className={`transition-all border-b border-[#E2E8F0] ${input.isActive ? "opacity-100" : "opacity-55"}`}>
      <button onClick={() => setExpanded((v) => !v)} className="w-full text-left">
        <div className="flex items-center gap-3 py-3 px-2 rounded-xl transition-all hover:bg-[#F1F5F9]">
          <span className="flex items-center justify-center shrink-0 w-[26px] h-[26px] rounded-lg bg-[#EEF2FF] font-['IBM_Plex_Mono',monospace] text-[10px] font-bold text-[#64748B]">
            {String(index + 1).padStart(2, "0")}
          </span>
          <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
            <span className="font-['IBM_Plex_Sans',sans-serif] text-sm font-semibold text-[#0F172A]">{input.name}</span>
            {input.degree && (
              <span className="font-['IBM_Plex_Mono',monospace] text-[11px] text-[#94A3B8]">{input.degree}</span>
            )}
            {!input.isActive && (
              <span className="font-['IBM_Plex_Mono',monospace] text-[10px] font-bold text-[#EF4444] bg-[#EF444410] border border-[#EF444425] rounded-[6px] px-1.5 py-px">
                নিষ্ক্রিয়
              </span>
            )}
          </div>
          <span
            className={`shrink-0 hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-lg border-[1.5px] font-['IBM_Plex_Mono',monospace] text-[10px] font-bold ${cfg.bg} ${cfg.border} ${cfg.text}`}
          >
            <TypeIcon className="w-[10px] h-[10px]" />
            {cfg.label}
          </span>
          <span
            className={`shrink-0 flex items-center gap-1 px-3 py-1 rounded-[20px] text-white font-['IBM_Plex_Mono',monospace] text-xs font-bold ${commShadow}`}
            style={{ background: commGrad }}
          >
            {isPercent ? <BadgePercent className="w-[11px] h-[11px]" /> : <Banknote className="w-[11px] h-[11px]" />}
            {isPercent ? `${input.commissionValue}%` : `৳${input.commissionValue?.toLocaleString("en-IN")}`}
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
            {input.contactNumber && (
              <p className="flex items-center gap-1.5">
                <Phone className="w-3 h-3 text-[#6366F1]" />
                {input.contactNumber}
              </p>
            )}
            {input.details && <p className="mt-[2px]">{input.details}</p>}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <ActionChip onClick={onEdit} icon={Pencil} label="সম্পাদনা" color="#6366F1" />
            {input.isActive ? (
              <ActionChip onClick={onDeactivate} icon={UserX} label="নিষ্ক্রিয়" color="#F59E0B" />
            ) : (
              <ActionChip onClick={onActivate} icon={UserCheck} label="সক্রিয়" color="#10B981" />
            )}
            <ActionChip onClick={onDelete} icon={Trash2} label="মুছুন" color="#EF4444" />
          </div>
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
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="flex items-center gap-3 px-6 py-3.5 border-b border-[#E2E8F0]">
        <div className="w-[26px] h-[26px] bg-[#E2E8F0] rounded-lg" />
        <div className="flex-1 h-[13px] bg-[#E2E8F0] rounded-md" />
        <div className="w-[65px] h-[26px] bg-[#E2E8F0] rounded-[20px]" />
      </div>
    ))}
  </div>
);

// ── Filter options ─────────────────────────────────────────────────────────────

const TYPE_OPTIONS = [
  { value: "doctor", label: "ডাক্তার" },
  { value: "agent", label: "এজেন্ট" },
  { value: "institute", label: "প্রতিষ্ঠান" },
];
const STATUS_OPTIONS = [
  { value: "active", label: "সক্রিয়" },
  { value: "inactive", label: "নিষ্ক্রিয়" },
];

// ── Main Page ──────────────────────────────────────────────────────────────────

const ManageReferrer = () => {
  const [referrers, setReferrers] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [popup, setPopup] = useState(null);
  const [formModal, setFormModal] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadReferrers = async () => {
    try {
      const res = await referrerService.getAll();
      setReferrers(res.data);
    } catch {
      setPopup({ type: "error", message: "রেফারার লোড করতে ব্যর্থ।" });
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    loadReferrers();
  }, []);

  const stats = useMemo(
    () => ({
      total: referrers.length,
      active: referrers.filter((r) => r.isActive).length,
      doctors: referrers.filter((r) => r.type === "doctor").length,
      agents: referrers.filter((r) => r.type === "agent").length,
      institutes: referrers.filter((r) => r.type === "institute").length,
    }),
    [referrers],
  );

  const filtered = useMemo(
    () =>
      referrers.filter((r) => {
        if (typeFilter !== "all" && r.type !== typeFilter) return false;
        if (statusFilter === "active" && !r.isActive) return false;
        if (statusFilter === "inactive" && r.isActive) return false;
        if (search.trim()) {
          const q = search.toLowerCase();
          return r.name.toLowerCase().includes(q) || r.contactNumber.includes(q) || r.degree?.toLowerCase().includes(q);
        }
        return true;
      }),
    [referrers, typeFilter, statusFilter, search],
  );

  const handleFormChange = (field, value) => setFormModal((p) => ({ ...p, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formModal.name?.trim()) return setPopup({ type: "error", message: "নাম প্রয়োজন।" });
    if (!formModal.contactNumber?.trim()) return setPopup({ type: "error", message: "যোগাযোগ নম্বর প্রয়োজন।" });
    try {
      setSaving(true);
      const isEdit = formModal.formType === "editReferrer";
      isEdit ? await referrerService.editReferrer(formModal) : await referrerService.addReferrer(formModal);
      await loadReferrers();
      setPopup({ type: "success", message: isEdit ? "রেফারার আপডেট হয়েছে।" : "রেফারার নিবন্ধিত হয়েছে।" });
      setFormModal(null);
    } catch (err) {
      setPopup({ type: "error", message: err?.response?.data?.error ?? "সমস্যা হয়েছে। আবার চেষ্টা করুন।" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (_id) => {
    try {
      setSaving(true);
      await referrerService.deleteReferrer(_id);
      setReferrers((prev) => prev.filter((r) => r._id !== _id));
      setPopup({ type: "success", message: "রেফারার মুছে ফেলা হয়েছে।" });
    } catch (err) {
      setPopup({ type: "error", message: err?.response?.data?.error ?? "মুছতে ব্যর্থ।" });
    } finally {
      setSaving(false);
      setConfirmModal(null);
    }
  };

  const handleToggle = async (_id, activate) => {
    try {
      setSaving(true);
      activate ? await referrerService.activateReferrer(_id) : await referrerService.deactivateReferrer(_id);
      setReferrers((prev) => prev.map((r) => (r._id === _id ? { ...r, isActive: activate } : r)));
      setPopup({ type: "success", message: activate ? "রেফারার সক্রিয় হয়েছে।" : "রেফারার নিষ্ক্রিয় হয়েছে।" });
    } catch (err) {
      setPopup({ type: "error", message: err?.response?.data?.error ?? "স্ট্যাটাস পরিবর্তন ব্যর্থ।" });
    } finally {
      setSaving(false);
      setConfirmModal(null);
    }
  };

  const hasFilters = typeFilter !== "all" || statusFilter !== "all";

  return (
    <section
      className="min-h-screen px-4 py-6 font-[Noto_Sans_Bengali,sans-serif]"
      style={{ background: "linear-gradient(to bottom right,#f8fafc,#eff6ff,#eef2ff)" }}
    >
      {popup && <Popup type={popup.type} message={popup.message} onClose={() => setPopup(null)} />}

      {formModal &&
        createPortal(
          <ReferrerFormModal
            formData={formModal}
            onChange={handleFormChange}
            onSubmit={handleSubmit}
            onClose={() => setFormModal(null)}
            saving={saving}
          />,
          document.body,
        )}

      {confirmModal &&
        createPortal(
          <ConfirmModal
            message={confirmModal.message}
            onConfirm={confirmModal.onConfirm}
            onCancel={() => setConfirmModal(null)}
            loading={saving}
          />,
          document.body,
        )}

      <div className="max-w-2xl mx-auto">
        {/* Page header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="font-['IBM_Plex_Mono',monospace] text-[10px] uppercase tracking-[0.1em] text-[#6366F1] mb-1">
              ল্যাব অপারেশন
            </p>
            <h1 className="font-['IBM_Plex_Sans',sans-serif] text-[26px] font-bold text-[#0F172A] leading-tight">
              রেফারার তালিকা
            </h1>
            <p className="text-sm text-[#64748B] mt-1">রেফারেল ও কমিশন পরিচালনা।</p>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Link
              to="/lab-management"
              className="flex items-center gap-1.5 transition-all font-semibold px-[14px] py-2 border-[1.5px] border-[#E2E8F0] rounded-xl text-[#64748B] font-['IBM_Plex_Mono',monospace] text-xs bg-white hover:bg-[#F1F5F9] hover:text-[#0F172A]"
            >
              <ArrowLeft className="w-[13px] h-[13px]" /> ফিরে
            </Link>
            <button
              onClick={() => setFormModal({ ...EMPTY_FORM, formType: "addReferrer" })}
              className="flex items-center gap-1.5 transition-all font-semibold px-4 py-2 rounded-xl text-white font-['IBM_Plex_Mono',monospace] text-xs border-none shadow-[0_4px_14px_rgba(99,102,241,0.4)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.5)]"
              style={{ background: "linear-gradient(135deg,#6366F1,#4F46E5)" }}
            >
              <UserPlus className="w-[13px] h-[13px]" /> নতুন
            </button>
          </div>
        </div>

        {/* Stats */}
        {!initialLoading && (
          <div className="grid grid-cols-4 gap-3 mb-5">
            <StatCard
              label="মোট"
              value={stats.total}
              color="#6366F1"
              grad="linear-gradient(135deg,#6366F1,#4F46E5)"
              icon={Users}
            />
            <StatCard
              label="ডাক্তার"
              value={stats.doctors}
              color="#3B82F6"
              grad="linear-gradient(135deg,#3B82F6,#2563EB)"
              icon={Stethoscope}
            />
            <StatCard
              label="এজেন্ট"
              value={stats.agents}
              color="#F59E0B"
              grad="linear-gradient(135deg,#F59E0B,#D97706)"
              icon={Briefcase}
            />
            <StatCard
              label="প্রতিষ্ঠান"
              value={stats.institutes}
              color="#0D9488"
              grad="linear-gradient(135deg,#0D9488,#0F766E)"
              icon={Building2}
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
                  রেফারার লেজার
                </p>
                <div className="flex items-center gap-3">
                  <span className="font-['IBM_Plex_Mono',monospace] text-[13px] font-semibold text-[#64748B]">
                    মোট {stats.total}জন
                  </span>
                  {stats.active > 0 && (
                    <span className="px-2 py-0.5 font-['IBM_Plex_Mono',monospace] text-[11px] font-bold text-[#10B981] bg-[#10B98110] rounded-[6px] border border-[#10B98125]">
                      সক্রিয় {stats.active}জন
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
                  placeholder="নাম, নম্বর বা ডিগ্রি…"
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
              <FilterDropdown value={typeFilter} onChange={setTypeFilter} options={TYPE_OPTIONS} placeholder="সব ধরন" />
              <FilterDropdown
                value={statusFilter}
                onChange={setStatusFilter}
                options={STATUS_OPTIONS}
                placeholder="সব স্ট্যাটাস"
              />
              {hasFilters && (
                <button
                  onClick={() => {
                    setTypeFilter("all");
                    setStatusFilter("all");
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
                রেফারার
              </span>
              <span className="font-['IBM_Plex_Mono',monospace] text-[9px] font-bold uppercase tracking-[0.08em] text-[#94A3B8] shrink-0">
                কমিশন
              </span>
              <span className="w-[14px] shrink-0" />
            </div>

            {/* Rows */}
            <div className="px-4 pb-4">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2 text-[#94A3B8]">
                  <AlertCircle className="w-7 h-7 opacity-40" />
                  <p className="font-['IBM_Plex_Mono',monospace] text-xs">
                    {hasFilters || search ? "কোনো রেফারার পাওয়া যায়নি" : "এখনো কোনো রেফারার যোগ করা হয়নি"}
                  </p>
                </div>
              ) : (
                filtered.map((item, index) => (
                  <ReferrerRow
                    key={item._id}
                    input={item}
                    index={index}
                    onEdit={() => setFormModal({ ...item, formType: "editReferrer" })}
                    onDelete={() =>
                      setConfirmModal({
                        message: `"${item.name}" মুছে ফেলবেন?`,
                        onConfirm: () => handleDelete(item._id),
                      })
                    }
                    onDeactivate={() =>
                      setConfirmModal({
                        message: `"${item.name}" নিষ্ক্রিয় করবেন?`,
                        onConfirm: () => handleToggle(item._id, false),
                      })
                    }
                    onActivate={() =>
                      setConfirmModal({
                        message: `"${item.name}" সক্রিয় করবেন?`,
                        onConfirm: () => handleToggle(item._id, true),
                      })
                    }
                  />
                ))
              )}
            </div>

            {/* Footer note */}
            <div className="px-6 py-3 border-t border-[#E2E8F0] bg-[#F8FAFC]">
              <p className="font-['IBM_Plex_Mono',monospace] text-[10px] text-[#94A3B8]">
                * শুধুমাত্র সক্রিয় রেফারারের কমিশন প্রযোজ্য
              </p>
            </div>
          </div>
        )}

        <p className="font-['IBM_Plex_Mono',monospace] text-[11px] text-[#94A3B8] text-center mt-4 pb-6">
          LabPilotPro · রেফারার ম্যানেজমেন্ট সিস্টেম
        </p>
      </div>
    </section>
  );
};

export default ManageReferrer;
