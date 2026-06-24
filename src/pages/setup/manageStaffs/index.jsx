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
  Shield,
  ShieldCheck,
  ShieldOff,
  AlertCircle,
  ChevronDown,
  Phone,
  Mail,
  FilePlus,
  FileEdit,
  Trash2,
  FileText,
  Upload,
  Download,
  Check,
  AlertTriangle,
  Pencil,
  UserX,
  UserCheck,
} from "lucide-react";
import Popup from "../../../components/popup";
import staffService from "../../../api/staff";

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
};

// ── Permissions config ─────────────────────────────────────────────────────────

const PERMISSIONS_LIST = [
  { key: "createInvoice", label: "ইনভয়েস তৈরি", icon: FilePlus, color: "#3B82F6" },
  { key: "editInvoice", label: "ইনভয়েস সম্পাদনা", icon: FileEdit, color: "#F59E0B" },
  { key: "deleteInvoice", label: "ইনভয়েস মুছুন", icon: Trash2, color: "#EF4444" },
  { key: "cashmemo", label: "ক্যাশমেমো", icon: FileText, color: "#10B981" },
  { key: "uploadReport", label: "রিপোর্ট আপলোড", icon: Upload, color: "#8B5CF6" },
  { key: "downloadReport", label: "রিপোর্ট ডাউনলোড", icon: Download, color: "#0D9488" },
];

const INITIAL_PERMISSIONS = {
  createInvoice: false,
  editInvoice: false,
  deleteInvoice: false,
  cashmemo: false,
  uploadReport: false,
  downloadReport: false,
};

const EMPTY_FORM = {
  name: "",
  email: "",
  phone: "",
  permissions: INITIAL_PERMISSIONS,
  isActive: true,
};

const PERMISSION_FILTER_OPTIONS = [
  { value: "all", label: "সব অনুমতি" },
  { value: "createInvoice", label: "ইনভয়েস তৈরি" },
  { value: "editInvoice", label: "ইনভয়েস সম্পাদনা" },
  { value: "deleteInvoice", label: "ইনভয়েস মুছুন" },
  { value: "cashmemo", label: "ক্যাশমেমো" },
  { value: "uploadReport", label: "রিপোর্ট আপলোড" },
  { value: "downloadReport", label: "রিপোর্ট ডাউনলোড" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "সব স্ট্যাটাস" },
  { value: "active", label: "সক্রিয়" },
  { value: "inactive", label: "নিষ্ক্রিয়" },
];

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
      <div className="relative w-full max-w-[540px] max-h-[calc(100svh-48px)] overflow-y-auto">{children}</div>
    </div>
  );
};

// ── Form Field ─────────────────────────────────────────────────────────────────

const FormField = ({ label, required, children, hint }) => (
  <div>
    <label className="block mb-1.5 font-['IBM_Plex_Mono',monospace] text-[11px] font-semibold uppercase tracking-[0.06em] text-[#64748B]">
      {label}
      {required && <span className="text-[#EF4444] ml-[3px]">*</span>}
    </label>
    {children}
    {hint && <p className="mt-1 font-['IBM_Plex_Mono',monospace] text-[10px] text-[#94A3B8]">{hint}</p>}
  </div>
);

// ── Staff Form Modal ───────────────────────────────────────────────────────────

const StaffFormModal = ({ initial, onClose, onSaved }) => {
  const isEdit = !!initial?._id;
  const [form, setForm] = useState(() =>
    initial
      ? {
          name: initial.name ?? "",
          email: initial.email ?? "",
          phone: initial.phone ?? "",
          permissions: initial.permissions ?? INITIAL_PERMISSIONS,
          isActive: initial.isActive ?? true,
        }
      : { ...EMPTY_FORM },
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));
  const allEnabled = PERMISSIONS_LIST.every((p) => form.permissions[p.key]);

  const toggleAll = () => {
    const next = Object.fromEntries(PERMISSIONS_LIST.map((p) => [p.key, !allEnabled]));
    set("permissions", next);
  };

  const handleSubmit = async () => {
    setError("");
    if (!form.name.trim()) return setError("নাম প্রয়োজন।");
    if (!form.phone.trim()) return setError("ফোন নম্বর প্রয়োজন।");
    try {
      setSaving(true);
      const payload = { ...form };
      if (isEdit) {
        await staffService.editStaff({ ...payload, _id: initial._id, type: "editStaff" });
      } else {
        await staffService.addStaff({ ...payload, type: "addStaff" });
      }
      onSaved(isEdit);
    } catch (err) {
      setError(err?.response?.data?.error ?? "সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setSaving(false);
    }
  };

  const gradFrom = isEdit ? "#8B5CF6" : "#0D9488";
  const gradTo = isEdit ? "#7C3AED" : "#0F766E";
  const accentText = isEdit ? "text-[#8B5CF6]" : "text-[#0D9488]";
  const accentBorder = isEdit ? "border-[#8B5CF620]" : "border-[#0D948820]";

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
              className="flex items-center justify-center shrink-0 w-11 h-11 rounded-[14px]"
              style={{
                background: `linear-gradient(135deg,${gradFrom},${gradTo})`,
                boxShadow: `0 8px 20px ${gradFrom}40`,
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
                {isEdit ? "কর্মী সম্পাদনা" : "কর্মী নিবন্ধন"}
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
          {/* Name */}
          <FormField label="পূর্ণ নাম" required>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="কর্মীর নাম"
              className={`${inputBase} px-3 py-2.5 text-sm`}
              onFocus={focusInput}
              onBlur={blurInput}
            />
          </FormField>

          {/* Email + Phone */}
          <div className="grid grid-cols-2 gap-3">
            <FormField label="ইমেইল">
              <input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="email@example.com"
                className={`${inputBase} px-3 py-2.5 text-sm`}
                onFocus={focusInput}
                onBlur={blurInput}
              />
            </FormField>
            <FormField
              label="ফোন নম্বর"
              required={!isEdit}
              hint={isEdit ? "নিবন্ধনের পরে পরিবর্তন করা যাবে না।" : undefined}
            >
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="01XXXXXXXXX"
                maxLength={15}
                readOnly={isEdit}
                className={`${inputBase} px-3 py-2.5 text-sm ${isEdit ? "opacity-50 cursor-not-allowed" : ""}`}
                onFocus={isEdit ? undefined : focusInput}
                onBlur={isEdit ? undefined : blurInput}
              />
            </FormField>
          </div>

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
                const active = form.isActive === value;
                return (
                  <button
                    key={String(value)}
                    type="button"
                    onClick={() => set("isActive", value)}
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

          {/* Permissions */}
          <div className="border-[1.5px] border-[#E2E8F0] rounded-2xl overflow-hidden">
            <div className="px-4 py-3 flex items-center justify-between bg-white border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <Shield className="w-[13px] h-[13px] text-[#6366F1]" />
                <span className="font-['IBM_Plex_Mono',monospace] text-[11px] font-bold uppercase tracking-[0.08em] text-[#64748B]">
                  অনুমতিসমূহ
                </span>
              </div>
              <button
                type="button"
                onClick={toggleAll}
                className={`font-['IBM_Plex_Mono',monospace] text-[11px] font-bold transition-all
                  ${allEnabled ? "text-[#EF4444]" : "text-[#6366F1]"}`}
              >
                {allEnabled ? "সব বাদ" : "সব নির্বাচন"}
              </button>
            </div>
            <div className="p-3 space-y-2 bg-[#F8FAFC]">
              {PERMISSIONS_LIST.map(({ key, label, icon: Icon, color }) => {
                const checked = form.permissions[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => set("permissions", { ...form.permissions, [key]: !checked })}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border-[1.5px] transition-all text-left`}
                    style={{
                      background: checked ? `${color}10` : "white",
                      borderColor: checked ? `${color}50` : "#E2E8F0",
                    }}
                  >
                    <span
                      className="flex items-center justify-center shrink-0 w-4 h-4 rounded-[5px] border-[1.5px] transition-all"
                      style={{
                        background: checked ? color : undefined,
                        borderColor: checked ? color : "#CBD5E1",
                      }}
                    >
                      {checked && <Check className="w-[9px] h-[9px] text-white" />}
                    </span>
                    <Icon className="w-[13px] h-[13px] shrink-0" style={{ color: checked ? color : C.muted }} />
                    <span
                      className="font-['IBM_Plex_Mono',monospace] text-[12px] font-semibold"
                      style={{ color: checked ? color : C.sub }}
                    >
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 px-4 py-3 bg-[#EF444408] border-[1.5px] border-[#EF444430] rounded-xl">
              <AlertTriangle className="w-[14px] h-[14px] text-[#EF4444] shrink-0 mt-[1px]" />
              <span className="text-xs font-['IBM_Plex_Mono',monospace] text-[#EF4444]">{error}</span>
            </div>
          )}
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
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 py-3 flex items-center justify-center gap-2 font-semibold transition-all rounded-xl border-none text-white font-['IBM_Plex_Mono',monospace] text-xs"
            style={{
              background: saving ? C.muted : `linear-gradient(135deg,${gradFrom},${gradTo})`,
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

// ── Staff Row ──────────────────────────────────────────────────────────────────

const StaffRow = ({ member, index, onEdit, onDelete, onDeactivate, onActivate }) => {
  const [expanded, setExpanded] = useState(false);
  const activePerms = PERMISSIONS_LIST.filter((p) => member.permissions[p.key]);
  const hasFullAccess = activePerms.length === PERMISSIONS_LIST.length;

  const roleLabel = member.role === "admin" ? "অ্যাডমিন" : member.role === "staff" ? "স্টাফ" : "অন্যান্য";
  const roleColor =
    member.role === "admin"
      ? { bg: "bg-[#8B5CF615]", border: "border-[#8B5CF630]", text: "text-[#8B5CF6]" }
      : member.role === "staff"
        ? { bg: "bg-[#6366F115]", border: "border-[#6366F130]", text: "text-[#6366F1]" }
        : { bg: "bg-[#94A3B815]", border: "border-[#94A3B830]", text: "text-[#64748B]" };

  return (
    <div className={`transition-all border-b border-[#E2E8F0] ${member.isActive ? "opacity-100" : "opacity-55"}`}>
      <button onClick={() => setExpanded((v) => !v)} className="w-full text-left">
        <div className="flex items-center gap-3 py-3 px-2 rounded-xl transition-all hover:bg-[#F1F5F9]">
          <span className="flex items-center justify-center shrink-0 w-[26px] h-[26px] rounded-lg bg-[#EEF2FF] font-['IBM_Plex_Mono',monospace] text-[10px] font-bold text-[#64748B]">
            {String(index + 1).padStart(2, "0")}
          </span>
          <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
            <span className="font-['IBM_Plex_Sans',sans-serif] text-sm font-semibold text-[#0F172A]">
              {member.name}
            </span>
            <span
              className={`font-['IBM_Plex_Mono',monospace] text-[10px] font-bold px-1.5 py-px rounded-[6px] border-[1.5px] ${roleColor.bg} ${roleColor.border} ${roleColor.text}`}
            >
              {roleLabel}
            </span>
            {!member.isActive && (
              <span className="font-['IBM_Plex_Mono',monospace] text-[10px] font-bold text-[#EF4444] bg-[#EF444410] border border-[#EF444425] rounded-[6px] px-1.5 py-px">
                নিষ্ক্রিয়
              </span>
            )}
          </div>
          {hasFullAccess && (
            <span className="shrink-0 hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-lg border-[1.5px] font-['IBM_Plex_Mono',monospace] text-[10px] font-bold bg-[#6366F115] border-[#6366F130] text-[#6366F1]">
              <Shield className="w-[10px] h-[10px]" /> সম্পূর্ণ
            </span>
          )}
          {!hasFullAccess && (
            <span className="shrink-0 font-['IBM_Plex_Mono',monospace] text-[10px] text-[#94A3B8]">
              {activePerms.length}/{PERMISSIONS_LIST.length}
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
          {/* Contact */}
          <div className="font-['IBM_Plex_Mono',monospace] text-xs text-[#64748B] leading-loose mb-3">
            {member.email && (
              <p className="flex items-center gap-1.5">
                <Mail className="w-3 h-3 text-[#6366F1]" />
                {member.email}
              </p>
            )}
            {member.phone && (
              <p className="flex items-center gap-1.5">
                <Phone className="w-3 h-3 text-[#6366F1]" />
                {member.phone}
              </p>
            )}
          </div>

          {/* Permissions */}
          <div className="mb-3">
            <p className="font-['IBM_Plex_Mono',monospace] text-[9px] font-bold uppercase tracking-[0.08em] text-[#94A3B8] mb-1.5">
              অনুমতিসমূহ ({activePerms.length}/{PERMISSIONS_LIST.length})
            </p>
            {activePerms.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {activePerms.map(({ key, label, icon: Icon, color }) => (
                  <span
                    key={key}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-['IBM_Plex_Mono',monospace] text-[10px] font-semibold border"
                    style={{ color, background: `${color}12`, borderColor: `${color}30` }}
                  >
                    <Icon className="w-[9px] h-[9px]" />
                    {label}
                  </span>
                ))}
              </div>
            ) : (
              <p className="font-['IBM_Plex_Mono',monospace] text-[11px] text-[#94A3B8] italic">কোনো অনুমতি নেই</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <ActionChip onClick={onEdit} icon={Pencil} label="সম্পাদনা" color={C.indigo} />
            {member.isActive ? (
              <ActionChip onClick={onDeactivate} icon={UserX} label="নিষ্ক্রিয়" color={C.amber} />
            ) : (
              <ActionChip onClick={onActivate} icon={UserCheck} label="সক্রিয়" color={C.green} />
            )}
            <ActionChip onClick={onDelete} icon={Trash2} label="মুছুন" color={C.red} />
          </div>
        </div>
      )}
    </div>
  );
};

// ── Section Divider ────────────────────────────────────────────────────────────

const SectionDivider = ({ title, count, color }) => (
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

const FilterDropdown = ({ value, onChange, options, placeholder }) => (
  <div className="relative">
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`appearance-none outline-none cursor-pointer transition-all font-['IBM_Plex_Mono',monospace] text-xs rounded-[10px] py-[7px] pl-3 pr-[30px] border-[1.5px]
        ${value !== "all" ? "border-[#6366F160] bg-[#6366F108] text-[#0F172A] shadow-[0_2px_8px_#6366F115]" : "border-[#E2E8F0] bg-white text-[#64748B]"}`}
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
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="flex items-center gap-3 px-6 py-3.5 border-b border-[#E2E8F0]">
        <div className="w-[26px] h-[26px] bg-[#E2E8F0] rounded-lg" />
        <div className="flex-1 h-[13px] bg-[#E2E8F0] rounded-md" />
        <div className="w-[50px] h-[22px] bg-[#E2E8F0] rounded-lg" />
      </div>
    ))}
  </div>
);

// ── Delete Confirm Modal ───────────────────────────────────────────────────────

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
          <p className="font-['IBM_Plex_Sans',sans-serif] text-base font-bold text-[#0F172A]">কর্মী মুছে ফেলবেন?</p>
        </div>
      </div>
      <div className="px-6 py-5">
        <p className="font-['IBM_Plex_Mono',monospace] text-[13px] leading-[1.7] text-[#64748B]">
          <span className="font-bold text-[#0F172A]">{name}</span>-এর সমস্ত তথ্য স্থায়ীভাবে মুছে যাবে। এই কাজ
          পূর্বাবস্থায় ফেরানো যাবে না।
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

// ── Main Page ──────────────────────────────────────────────────────────────────

const ManageStaff = () => {
  const [staff, setStaff] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [popup, setPopup] = useState(null);
  const [formModal, setFormModal] = useState(null); // null | {} | member object
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toggleTarget, setToggleTarget] = useState(null); // { member, activate }
  const [search, setSearch] = useState("");
  const [permFilter, setPermFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadStaff = async () => {
    try {
      const res = await staffService.getStaffs();
      setStaff(res.data);
    } catch {
      setPopup({ type: "error", message: "কর্মী লোড করতে ব্যর্থ।" });
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const stats = useMemo(
    () => ({
      total: staff.length,
      active: staff.filter((s) => s.isActive).length,
      inactive: staff.filter((s) => !s.isActive).length,
      fullAccess: staff.filter((s) => PERMISSIONS_LIST.every((p) => s.permissions[p.key])).length,
    }),
    [staff],
  );

  const filtered = useMemo(
    () =>
      staff.filter((s) => {
        if (permFilter !== "all" && !s.permissions[permFilter]) return false;
        if (statusFilter === "active" && !s.isActive) return false;
        if (statusFilter === "inactive" && s.isActive) return false;
        if (search.trim()) {
          const q = search.toLowerCase();
          return s.name.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q) || s.phone?.includes(q);
        }
        return true;
      }),
    [staff, permFilter, statusFilter, search],
  );

  const admins = useMemo(() => filtered.filter((s) => s.role === "admin"), [filtered]);
  const staffMembers = useMemo(() => filtered.filter((s) => s.role === "staff"), [filtered]);
  const others = useMemo(() => filtered.filter((s) => s.role !== "admin" && s.role !== "staff"), [filtered]);

  const handleSaved = async (isEdit) => {
    setFormModal(null);
    await loadStaff();
    setPopup({ type: "success", message: isEdit ? "কর্মী আপডেট হয়েছে।" : "কর্মী নিবন্ধিত হয়েছে।" });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setSaving(true);
      await staffService.deleteStaff(deleteTarget._id);
      setStaff((prev) => prev.filter((m) => m._id !== deleteTarget._id));
      setPopup({ type: "success", message: "কর্মী মুছে ফেলা হয়েছে।" });
    } catch {
      setPopup({ type: "error", message: "কর্মী মুছতে ব্যর্থ।" });
    } finally {
      setSaving(false);
      setDeleteTarget(null);
    }
  };

  const handleToggle = async () => {
    if (!toggleTarget) return;
    const { member, activate } = toggleTarget;
    try {
      setSaving(true);
      activate ? await staffService.activateStaff(member._id) : await staffService.deactivateStaff(member._id);
      setStaff((prev) => prev.map((m) => (m._id === member._id ? { ...m, isActive: activate } : m)));
      setPopup({ type: "success", message: `কর্মী ${activate ? "সক্রিয়" : "নিষ্ক্রিয়"} করা হয়েছে।` });
    } catch {
      setPopup({ type: "error", message: "স্ট্যাটাস পরিবর্তন ব্যর্থ।" });
    } finally {
      setSaving(false);
      setToggleTarget(null);
    }
  };

  const hasFilters = permFilter !== "all" || statusFilter !== "all" || search !== "";

  const rowProps = (member) => ({
    member,
    onEdit: () => setFormModal(member),
    onDelete: () => setDeleteTarget(member),
    onDeactivate: () => setToggleTarget({ member, activate: false }),
    onActivate: () => setToggleTarget({ member, activate: true }),
  });

  return (
    <section
      className="min-h-screen px-4 py-6 font-[Noto_Sans_Bengali,sans-serif]"
      style={{ background: "linear-gradient(to bottom right,#f8fafc,#eff6ff,#eef2ff)" }}
    >
      {popup && <Popup type={popup.type} message={popup.message} onClose={() => setPopup(null)} />}

      {formModal !== null &&
        createPortal(
          <StaffFormModal
            initial={formModal._id ? formModal : null}
            onClose={() => setFormModal(null)}
            onSaved={handleSaved}
          />,
          document.body,
        )}

      {deleteTarget &&
        createPortal(
          <DeleteModal
            name={deleteTarget.name}
            onConfirm={handleDelete}
            onCancel={() => setDeleteTarget(null)}
            loading={saving}
          />,
          document.body,
        )}

      {toggleTarget &&
        createPortal(
          <ModalShell onClose={() => setToggleTarget(null)}>
            <div className="bg-white overflow-hidden rounded-[24px] shadow-[0_25px_60px_rgba(15,23,42,0.2)]">
              <div
                className={`px-6 py-6 flex items-center gap-4 border-b ${toggleTarget.activate ? "border-[#A7F3D0]" : "border-[#FDE68A]"}`}
                style={{
                  background: toggleTarget.activate
                    ? "linear-gradient(135deg,#ECFDF5,#D1FAE5)"
                    : "linear-gradient(135deg,#FFFBEB,#FEF3C7)",
                }}
              >
                <div
                  className="flex items-center justify-center shrink-0 w-11 h-11 rounded-[14px]"
                  style={{
                    background: toggleTarget.activate
                      ? "linear-gradient(135deg,#10B981,#059669)"
                      : "linear-gradient(135deg,#F59E0B,#D97706)",
                    boxShadow: toggleTarget.activate
                      ? "0 8px 20px rgba(16,185,129,0.35)"
                      : "0 8px 20px rgba(245,158,11,0.35)",
                  }}
                >
                  {toggleTarget.activate ? (
                    <UserCheck className="w-[18px] h-[18px] text-white" />
                  ) : (
                    <UserX className="w-[18px] h-[18px] text-white" />
                  )}
                </div>
                <div>
                  <p
                    className="font-['IBM_Plex_Mono',monospace] text-[10px] font-bold uppercase tracking-[0.1em] mb-[2px]"
                    style={{ color: toggleTarget.activate ? "#059669" : "#D97706" }}
                  >
                    স্ট্যাটাস পরিবর্তন
                  </p>
                  <p className="font-['IBM_Plex_Sans',sans-serif] text-base font-bold text-[#0F172A]">
                    {toggleTarget.activate ? "কর্মী সক্রিয় করবেন?" : "কর্মী নিষ্ক্রিয় করবেন?"}
                  </p>
                </div>
              </div>
              <div className="px-6 py-5">
                <p className="font-['IBM_Plex_Mono',monospace] text-[13px] leading-[1.7] text-[#64748B]">
                  <span className="font-bold text-[#0F172A]">{toggleTarget.member.name}</span>
                  {toggleTarget.activate
                    ? "-কে সক্রিয় করলে তিনি পুনরায় সিস্টেমে প্রবেশ করতে পারবেন।"
                    : "-কে নিষ্ক্রিয় করলে তিনি সিস্টেমে প্রবেশ করতে পারবেন না।"}
                </p>
              </div>
              <div className="px-6 pb-6 flex gap-3">
                <button
                  onClick={() => setToggleTarget(null)}
                  className="flex-1 py-3 font-semibold transition-all rounded-xl border-[1.5px] border-[#E2E8F0] text-[#64748B] font-['IBM_Plex_Mono',monospace] text-xs bg-white hover:bg-[#F1F5F9]"
                >
                  বাতিল
                </button>
                <button
                  onClick={handleToggle}
                  disabled={saving}
                  className="flex-1 py-3 flex items-center justify-center gap-2 font-semibold transition-all rounded-xl border-none text-white font-['IBM_Plex_Mono',monospace] text-xs"
                  style={{
                    background: toggleTarget.activate
                      ? "linear-gradient(135deg,#10B981,#059669)"
                      : "linear-gradient(135deg,#F59E0B,#D97706)",
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  {saving ? (
                    <span className="animate-spin inline-block w-[14px] h-[14px] rounded-full border-2 border-white/40 border-t-white" />
                  ) : toggleTarget.activate ? (
                    <UserCheck className="w-[13px] h-[13px]" />
                  ) : (
                    <UserX className="w-[13px] h-[13px]" />
                  )}
                  হ্যাঁ, {toggleTarget.activate ? "সক্রিয়" : "নিষ্ক্রিয়"} করুন
                </button>
              </div>
            </div>
          </ModalShell>,
          document.body,
        )}

      <div className="max-w-2xl mx-auto">
        {/* Page header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="font-['IBM_Plex_Sans',sans-serif] text-[26px] font-bold text-[#0F172A] leading-tight">
              ল্যাব স্টাফ
            </h1>
            <p className="text-sm text-[#64748B] mt-1">অ্যাকাউন্ট ও অনুমতি পরিচালনা।</p>
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
              label="মোট কর্মী"
              value={stats.total}
              color={C.indigo}
              grad="linear-gradient(135deg,#6366F1,#4F46E5)"
              icon={Users}
            />
            <StatCard
              label="সক্রিয়"
              value={stats.active}
              color={C.green}
              grad="linear-gradient(135deg,#10B981,#059669)"
              icon={ShieldCheck}
            />
            <StatCard
              label="নিষ্ক্রিয়"
              value={stats.inactive}
              color={C.red}
              grad="linear-gradient(135deg,#EF4444,#DC2626)"
              icon={ShieldOff}
            />
            <StatCard
              label="সম্পূর্ণ অ্যাক্সেস"
              value={stats.fullAccess}
              color={C.purple}
              grad="linear-gradient(135deg,#8B5CF6,#7C3AED)"
              icon={Shield}
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
                  কর্মী লেজার
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
                  placeholder="নাম, ইমেইল বা ফোন…"
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
                value={permFilter}
                onChange={setPermFilter}
                options={PERMISSION_FILTER_OPTIONS}
                placeholder="সব অনুমতি"
              />
              <FilterDropdown
                value={statusFilter}
                onChange={setStatusFilter}
                options={STATUS_OPTIONS}
                placeholder="সব স্ট্যাটাস"
              />
              {hasFilters && (
                <button
                  onClick={() => {
                    setPermFilter("all");
                    setStatusFilter("all");
                    setSearch("");
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
                কর্মী
              </span>
              <span className="font-['IBM_Plex_Mono',monospace] text-[9px] font-bold uppercase tracking-[0.08em] text-[#94A3B8] shrink-0">
                অনুমতি
              </span>
              <span className="w-[14px] shrink-0" />
            </div>

            {/* Rows */}
            <div className="px-4 pb-4">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2 text-[#94A3B8]">
                  <AlertCircle className="w-7 h-7 opacity-40" />
                  <p className="font-['IBM_Plex_Mono',monospace] text-xs">
                    {hasFilters ? "কোনো কর্মী পাওয়া যায়নি" : "এখনো কোনো কর্মী যোগ করা হয়নি"}
                  </p>
                </div>
              ) : (
                <>
                  {admins.length > 0 && (
                    <>
                      <SectionDivider title="অ্যাডমিন" count={admins.length} color={C.purple} />
                      {admins.map((m, i) => (
                        <StaffRow key={m._id} index={i} {...rowProps(m)} />
                      ))}
                    </>
                  )}
                  {staffMembers.length > 0 && (
                    <>
                      <SectionDivider title="স্টাফ" count={staffMembers.length} color={C.indigo} />
                      {staffMembers.map((m, i) => (
                        <StaffRow key={m._id} index={i} {...rowProps(m)} />
                      ))}
                    </>
                  )}
                  {others.length > 0 && (
                    <>
                      <SectionDivider title="অন্যান্য" count={others.length} color={C.sub} />
                      {others.map((m, i) => (
                        <StaffRow key={m._id} index={i} {...rowProps(m)} />
                      ))}
                    </>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-[#E2E8F0] bg-[#F8FAFC]">
              <p className="font-['IBM_Plex_Mono',monospace] text-[10px] text-[#94A3B8]">
                * শুধুমাত্র সক্রিয় কর্মীরা সিস্টেমে প্রবেশ করতে পারবেন
              </p>
            </div>
          </div>
        )}

        <p className="font-['IBM_Plex_Mono',monospace] text-[11px] text-[#94A3B8] text-center mt-4 pb-6">
          LabPilotPro · কর্মী ম্যানেজমেন্ট সিস্টেম
        </p>
      </div>
    </section>
  );
};

export default ManageStaff;
