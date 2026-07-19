/**
 * Account.jsx
 * Styled to match the ManageSpaces ledger/paper aesthetic:
 * IBM Plex Mono/Sans, ModalShell + ConfirmModal (TONE) pattern,
 * ActionChip rows, StatCard-style ribbons, ledger rows.
 *
 * React Compiler handles memoisation — no useCallback/useMemo
 */

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  User,
  Phone,
  Lock,
  Shield,
  CheckCircle2,
  Eye,
  EyeOff,
  Crown,
  Headset,
  UserCog,
  FilePlus,
  Trash2,
  FileText,
  Upload,
  Download,
  KeyRound,
  Pencil,
  AlertTriangle,
  AlertCircle,
  Loader2,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  Clock,
  Wifi,
  WifiOff,
  LogOut,
  ShieldAlert,
  Mail,
  X,
  Check,
  Receipt,
  BarChart3,
  ClipboardList,
  Percent,
  Wallet,
  Package,
  Users,
  Stethoscope,
  FlaskConical,
  CreditCard,
  UserPlus,
  UserMinus,
  DoorOpen,
} from "lucide-react";
import { Link } from "react-router-dom";
import accountService from "../../api/account";
import staticDataAPI from "../../api/staticData";
import { useAuthStore } from "../../store/authStore";
import Popup from "../../components/popup";
import LoadingScreen from "../../components/loadingPage";

// ─── Error helpers (mirrors ManageReferrer.jsx / CashMemo.jsx / DeleteInvoices.jsx / ReportDownload.jsx) ──

const PERMISSION_DENIED_MESSAGE = "আপনার কর্তৃপক্ষ আপনাকে এই কাজটি করার বা এই তথ্যটি পাওয়ার অনুমতি দেয়নি।";

const getErrorMessage = (err, fallback) => {
  if (err?.response?.status === 403) return PERMISSION_DENIED_MESSAGE;
  return err?.response?.data?.error ?? fallback;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLE_META = {
  admin: {
    label: "ল্যাব অ্যাডমিন",
    icon: Crown,
    grad: "linear-gradient(135deg,#F59E0B,#D97706)",
  },
  supportAdmin: {
    label: "সাপোর্ট অ্যাডমিন",
    icon: Headset,
    grad: "linear-gradient(135deg,#8B5CF6,#7C3AED)",
  },
  staff: {
    label: "স্টাফ",
    icon: UserCog,
    grad: "linear-gradient(135deg,#3B82F6,#2563EB)",
  },
};

// Icon treatment for each known permission key.
// Falls back to a generic Shield icon for any key the server adds
// that isn't in this map yet, so new permissions don't break rendering.
const PERMISSION_ICON_MAP = {
  createInvoice: { icon: FilePlus },
  deleteInvoice: { icon: Trash2 },
  addExpense: { icon: Receipt },
  deleteExpense: { icon: Trash2 },
  cashmemo: { icon: FileText },
  salesReport: { icon: BarChart3 },
  expenseReport: { icon: ClipboardList },
  commissionReport: { icon: Percent },
  collectionReport: { icon: Wallet },
  testReportDownload: { icon: Download },
  testReportUpload: { icon: Upload },
  manageProducts: { icon: Package },
  manageReferrers: { icon: Users },
  manageDoctors: { icon: Stethoscope },
  manageTest: { icon: FlaskConical },
  manageBilling: { icon: CreditCard },
  admitPatient: { icon: UserPlus },
  addExpenseToPatient: { icon: Receipt },
  deletePatient: { icon: UserMinus },
  releasePatient: { icon: DoorOpen },
};

const DEFAULT_PERMISSION_ICON = { icon: Shield };

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const fmtDateTime = (d) =>
  d
    ? new Date(d).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : "—";

const initials = (name = "") =>
  name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";

const timeAgo = (d) => {
  if (!d) return "কখনো না";
  const diffMs = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "এখনই";
  if (mins < 60) return `${mins} মিনিট আগে`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ঘণ্টা আগে`;
  const days = Math.floor(hrs / 24);
  return `${days} দিন আগে`;
};

const DeviceIcon = ({ type, className }) => {
  if (type === "mobile") return <Smartphone className={className} />;
  if (type === "tablet") return <Tablet className={className} />;
  return <Monitor className={className} />;
};

// ─── Shared input helpers ──────────────────────────────────────────────────────

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

// ─── Modal Shell ────────────────────────────────────────────────────────────────

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
        className={`relative w-full ${wide ? "max-w-[560px]" : "max-w-[480px]"} max-h-[calc(100svh-48px)] overflow-y-auto`}
      >
        {children}
      </div>
    </div>
  );
};

// ─── Confirm Modal (tone pattern) ──────────────────────────────────────────────

const TONE = {
  danger: {
    border: "border-[#FECACA]",
    bgGrad: "linear-gradient(135deg,#FEF2F2,#FFE4E6)",
    iconGrad: "linear-gradient(135deg,#EF4444,#DC2626)",
    shadow: "shadow-[0_8px_20px_rgba(239,68,68,0.35)]",
    label: "text-[#DC2626]",
    btnGrad: "linear-gradient(135deg,#EF4444,#DC2626)",
    btnShadow: "shadow-[0_4px_14px_rgba(239,68,68,0.4)]",
  },
  warning: {
    border: "border-[#FDE68A]",
    bgGrad: "linear-gradient(135deg,#FFFBEB,#FEF3C7)",
    iconGrad: "linear-gradient(135deg,#F59E0B,#D97706)",
    shadow: "shadow-[0_8px_20px_rgba(245,158,11,0.35)]",
    label: "text-[#D97706]",
    btnGrad: "linear-gradient(135deg,#F59E0B,#D97706)",
    btnShadow: "shadow-[0_4px_14px_rgba(245,158,11,0.4)]",
  },
};

const ConfirmModal = ({
  message,
  description,
  tone = "danger",
  confirmLabel = "নিশ্চিত",
  onConfirm,
  onCancel,
  loading,
}) => {
  const t = TONE[tone];
  return (
    <ModalShell onClose={onCancel}>
      <div className="bg-white overflow-hidden rounded-[24px] shadow-[0_25px_60px_rgba(15,23,42,0.2)]">
        <div className={`px-6 py-6 flex items-center gap-4 border-b ${t.border}`} style={{ background: t.bgGrad }}>
          <div
            className={`flex items-center justify-center shrink-0 w-11 h-11 rounded-[14px] ${t.shadow}`}
            style={{ background: t.iconGrad }}
          >
            <AlertTriangle className="w-5 h-5 text-white" />
          </div>
          <div>
            <p
              className={`font-['IBM_Plex_Mono',monospace] text-[10px] font-bold uppercase tracking-[0.1em] mb-[2px] ${t.label}`}
            >
              নিশ্চিত করুন
            </p>
            <p className="font-['IBM_Plex_Sans',sans-serif] text-[15px] font-bold text-[#0F172A]">{message}</p>
            {description && (
              <p className="font-['IBM_Plex_Sans',sans-serif] text-xs text-[#64748B] mt-1 leading-relaxed">
                {description}
              </p>
            )}
          </div>
        </div>
        <div className="px-6 py-5 flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-3 font-semibold transition-all rounded-xl border-[1.5px] border-[#E2E8F0] text-[#64748B] font-['IBM_Plex_Mono',monospace] text-xs bg-white hover:bg-[#F1F5F9]"
          >
            বাতিল
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-3 flex items-center justify-center gap-2 font-semibold transition-all rounded-xl border-none text-white font-['IBM_Plex_Mono',monospace] text-xs ${t.btnShadow}`}
            style={{ background: t.btnGrad, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? (
              <span className="animate-spin inline-block w-[14px] h-[14px] rounded-full border-2 border-white/40 border-t-white" />
            ) : (
              <Check className="w-[14px] h-[14px]" />
            )}
            {confirmLabel}
          </button>
        </div>
      </div>
    </ModalShell>
  );
};

// ─── Error box ──────────────────────────────────────────────────────────────────

const ErrorBox = ({ msg }) =>
  msg ? (
    <div className="flex items-center gap-2 px-3.5 py-2.5 bg-[#EF444408] border-[1.5px] border-[#EF444430] rounded-xl">
      <AlertCircle className="w-[14px] h-[14px] text-[#EF4444] shrink-0" />
      <p className="font-['IBM_Plex_Mono',monospace] text-[11px] font-medium text-[#EF4444]">{msg}</p>
    </div>
  ) : null;

// ─── Password input ─────────────────────────────────────────────────────────────

const PasswordField = ({ label, value, onChange, placeholder }) => {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="block mb-1.5 font-['IBM_Plex_Mono',monospace] text-[11px] font-semibold uppercase tracking-[0.06em] text-[#64748B]">
        {label}
      </label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`${inputBase} pl-10 pr-10 py-2.5 text-sm`}
          onFocus={focusInput}
          onBlur={blurInput}
        />
        <button
          type="button"
          onClick={() => setShow((p) => !p)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#0F172A] transition-colors"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};

// ─── Modal header (shared style) ───────────────────────────────────────────────

const ModalHeader = ({ icon: Icon, eyebrow, title, subtitle, gradFrom, gradTo, onClose }) => (
  <div
    className="shrink-0 px-6 py-5 flex items-center justify-between border-b"
    style={{ background: `linear-gradient(135deg,${gradFrom}15 0%,${gradTo}08 100%)`, borderColor: `${gradFrom}25` }}
  >
    <div className="flex items-center gap-3.5">
      <div
        className="flex items-center justify-center shrink-0 w-11 h-11 rounded-[14px]"
        style={{ background: `linear-gradient(135deg,${gradFrom},${gradTo})`, boxShadow: `0 8px 20px ${gradFrom}40` }}
      >
        <Icon className="w-[18px] h-[18px] text-white" />
      </div>
      <div>
        <p
          className="font-['IBM_Plex_Mono',monospace] text-[10px] font-bold uppercase tracking-[0.1em] mb-[2px]"
          style={{ color: gradFrom }}
        >
          {eyebrow}
        </p>
        <p className="font-['IBM_Plex_Sans',sans-serif] text-base font-bold text-[#0F172A]">{title}</p>
        {subtitle && <p className="font-['IBM_Plex_Mono',monospace] text-[11px] text-[#94A3B8]">{subtitle}</p>}
      </div>
    </div>
    <button
      onClick={onClose}
      className="flex items-center justify-center w-8 h-8 rounded-[10px] text-[#94A3B8] border-[1.5px] border-[#E2E8F0] bg-white transition-all hover:bg-[#F1F5F9] hover:text-[#0F172A]"
    >
      <X className="w-[15px] h-[15px]" />
    </button>
  </div>
);

// ─── Phone Modal ────────────────────────────────────────────────────────────────

const PhoneModal = ({ onClose, onSuccess }) => {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");
    if (phone.trim().length < 10) return setError("সঠিক ফোন নম্বর লিখুন (ন্যূনতম ১০ সংখ্যা)");
    if (!password) return setError("বর্তমান পাসওয়ার্ড আবশ্যক");
    try {
      setLoading(true);
      await accountService.changePhone({ phone: phone.trim(), currentPassword: password });
      onSuccess("ফোন নম্বর সফলভাবে পরিবর্তন হয়েছে!");
    } catch (err) {
      setError(getErrorMessage(err, "ফোন নম্বর পরিবর্তন করতে ব্যর্থ"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell onClose={onClose}>
      <div className="bg-white flex flex-col overflow-hidden rounded-[24px] shadow-[0_25px_60px_rgba(15,23,42,0.2)] max-h-[calc(100svh-48px)]">
        <ModalHeader
          icon={Phone}
          eyebrow="যোগাযোগ"
          title="ফোন নম্বর পরিবর্তন করুন"
          subtitle="বর্তমান পাসওয়ার্ড দিয়ে নিশ্চিত করুন"
          gradFrom="#3B82F6"
          gradTo="#2563EB"
          onClose={onClose}
        />
        <div className="px-6 py-5 bg-[#F8FAFC] space-y-3 overflow-y-auto">
          <div className="bg-white rounded-xl p-4 border border-[#E2E8F0] shadow-[0_2px_8px_rgba(15,23,42,0.04)] space-y-3">
            <div>
              <label className="block mb-1.5 font-['IBM_Plex_Mono',monospace] text-[11px] font-semibold uppercase tracking-[0.06em] text-[#64748B]">
                নতুন ফোন নম্বর
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  maxLength={15}
                  className={`${inputBase} pl-10 pr-4 py-2.5 text-sm`}
                  onFocus={focusInput}
                  onBlur={blurInput}
                />
              </div>
            </div>
            <PasswordField
              label="বর্তমান পাসওয়ার্ড"
              value={password}
              onChange={setPassword}
              placeholder="বর্তমান পাসওয়ার্ড লিখুন"
            />
            <ErrorBox msg={error} />
          </div>
        </div>
        <div className="shrink-0 px-6 py-4 flex gap-3 bg-white border-t border-[#E2E8F0]">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-3 font-semibold transition-all rounded-xl border-[1.5px] border-[#E2E8F0] text-[#64748B] font-['IBM_Plex_Mono',monospace] text-xs hover:bg-[#F1F5F9]"
          >
            বাতিল
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-3 flex items-center justify-center gap-2 font-semibold transition-all rounded-xl border-none text-white font-['IBM_Plex_Mono',monospace] text-xs shadow-[0_4px_14px_rgba(59,130,246,0.4)]"
            style={{ background: loading ? "#94A3B8" : "linear-gradient(135deg,#3B82F6,#2563EB)" }}
          >
            {loading && <Loader2 className="w-[14px] h-[14px] animate-spin" />}
            {loading ? "পরিবর্তন হচ্ছে…" : "ফোন নম্বর পরিবর্তন করুন"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
};

// ─── Email Modal ────────────────────────────────────────────────────────────────

const EmailModal = ({ onClose, onSuccess, currentEmail }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return setError("সঠিক ইমেইল ঠিকানা লিখুন");
    if (!password) return setError("বর্তমান পাসওয়ার্ড আবশ্যক");
    try {
      setLoading(true);
      await accountService.changeEmail({ email: trimmed, currentPassword: password });
      onSuccess(currentEmail ? "ইমেইল সফলভাবে পরিবর্তন হয়েছে!" : "ইমেইল সফলভাবে যুক্ত হয়েছে!");
    } catch (err) {
      setError(getErrorMessage(err, "ইমেইল পরিবর্তন করতে ব্যর্থ"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell onClose={onClose}>
      <div className="bg-white flex flex-col overflow-hidden rounded-[24px] shadow-[0_25px_60px_rgba(15,23,42,0.2)] max-h-[calc(100svh-48px)]">
        <ModalHeader
          icon={Mail}
          eyebrow="যোগাযোগ"
          title={currentEmail ? "ইমেইল পরিবর্তন করুন" : "ইমেইল যুক্ত করুন"}
          subtitle="বর্তমান পাসওয়ার্ড দিয়ে নিশ্চিত করুন"
          gradFrom="#10B981"
          gradTo="#0D9488"
          onClose={onClose}
        />
        <div className="px-6 py-5 bg-[#F8FAFC] space-y-3 overflow-y-auto">
          <div className="bg-white rounded-xl p-4 border border-[#E2E8F0] shadow-[0_2px_8px_rgba(15,23,42,0.04)] space-y-3">
            <div>
              <label className="block mb-1.5 font-['IBM_Plex_Mono',monospace] text-[11px] font-semibold uppercase tracking-[0.06em] text-[#64748B]">
                {currentEmail ? "নতুন ইমেইল ঠিকানা" : "ইমেইল ঠিকানা"}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={`${inputBase} pl-10 pr-4 py-2.5 text-sm`}
                  onFocus={focusInput}
                  onBlur={blurInput}
                />
              </div>
            </div>
            <PasswordField
              label="বর্তমান পাসওয়ার্ড"
              value={password}
              onChange={setPassword}
              placeholder="বর্তমান পাসওয়ার্ড লিখুন"
            />
            <ErrorBox msg={error} />
          </div>
        </div>
        <div className="shrink-0 px-6 py-4 flex gap-3 bg-white border-t border-[#E2E8F0]">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-3 font-semibold transition-all rounded-xl border-[1.5px] border-[#E2E8F0] text-[#64748B] font-['IBM_Plex_Mono',monospace] text-xs hover:bg-[#F1F5F9]"
          >
            বাতিল
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-3 flex items-center justify-center gap-2 font-semibold transition-all rounded-xl border-none text-white font-['IBM_Plex_Mono',monospace] text-xs shadow-[0_4px_14px_rgba(16,185,129,0.4)]"
            style={{ background: loading ? "#94A3B8" : "linear-gradient(135deg,#10B981,#0D9488)" }}
          >
            {loading && <Loader2 className="w-[14px] h-[14px] animate-spin" />}
            {loading ? "সংরক্ষণ হচ্ছে…" : currentEmail ? "ইমেইল পরিবর্তন করুন" : "ইমেইল যুক্ত করুন"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
};

// ─── Password Modal ─────────────────────────────────────────────────────────────

const PasswordModal = ({ onClose, onSuccess }) => {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");
    if (!current) return setError("বর্তমান পাসওয়ার্ড আবশ্যক");
    if (next.length < 6) return setError("নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে");
    if (next !== confirm) return setError("নতুন পাসওয়ার্ড মিলছে না");
    try {
      setLoading(true);
      await accountService.changePassword({ currentPassword: current, newPassword: next });
      onSuccess("পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে!");
    } catch (err) {
      setError(getErrorMessage(err, "পাসওয়ার্ড পরিবর্তন করতে ব্যর্থ"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell onClose={onClose}>
      <div className="bg-white flex flex-col overflow-hidden rounded-[24px] shadow-[0_25px_60px_rgba(15,23,42,0.2)] max-h-[calc(100svh-48px)]">
        <ModalHeader
          icon={KeyRound}
          eyebrow="সুরক্ষা"
          title="পাসওয়ার্ড পরিবর্তন করুন"
          subtitle="ন্যূনতম ৬ অক্ষর আবশ্যক"
          gradFrom="#6366F1"
          gradTo="#4F46E5"
          onClose={onClose}
        />
        <div className="px-6 py-5 bg-[#F8FAFC] space-y-3 overflow-y-auto">
          <div className="bg-white rounded-xl p-4 border border-[#E2E8F0] shadow-[0_2px_8px_rgba(15,23,42,0.04)] space-y-3">
            <PasswordField
              label="বর্তমান পাসওয়ার্ড"
              value={current}
              onChange={setCurrent}
              placeholder="বর্তমান পাসওয়ার্ড লিখুন"
            />
            <PasswordField label="নতুন পাসওয়ার্ড" value={next} onChange={setNext} placeholder="ন্যূনতম ৬ অক্ষর" />
            <PasswordField
              label="নতুন পাসওয়ার্ড নিশ্চিত করুন"
              value={confirm}
              onChange={setConfirm}
              placeholder="নতুন পাসওয়ার্ড পুনরায় লিখুন"
            />
            {next && confirm && next !== confirm && (
              <div className="flex items-center gap-2 px-3.5 py-2.5 bg-[#F59E0B0C] border-[1.5px] border-[#F59E0B30] rounded-xl">
                <AlertCircle className="w-[14px] h-[14px] text-[#D97706] shrink-0" />
                <p className="font-['IBM_Plex_Mono',monospace] text-[11px] font-medium text-[#D97706]">
                  পাসওয়ার্ড মিলছে না
                </p>
              </div>
            )}
            <ErrorBox msg={error} />
          </div>
        </div>
        <div className="shrink-0 px-6 py-4 flex gap-3 bg-white border-t border-[#E2E8F0]">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-3 font-semibold transition-all rounded-xl border-[1.5px] border-[#E2E8F0] text-[#64748B] font-['IBM_Plex_Mono',monospace] text-xs hover:bg-[#F1F5F9]"
          >
            বাতিল
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-3 flex items-center justify-center gap-2 font-semibold transition-all rounded-xl border-none text-white font-['IBM_Plex_Mono',monospace] text-xs shadow-[0_4px_14px_rgba(99,102,241,0.4)]"
            style={{ background: loading ? "#94A3B8" : "linear-gradient(135deg,#6366F1,#4F46E5)" }}
          >
            {loading && <Loader2 className="w-[14px] h-[14px] animate-spin" />}
            {loading ? "সংরক্ষণ হচ্ছে…" : "পাসওয়ার্ড পরিবর্তন করুন"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
};

// ─── Action Chip ────────────────────────────────────────────────────────────────

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

// ─── Settings Row ───────────────────────────────────────────────────────────────

const SettingsRow = ({ icon: Icon, title, subtitle, color, onClick }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl border-[1.5px] border-[#E2E8F0] hover:border-[color:var(--c)] transition-all group text-left"
    style={{ "--c": `${color}50` }}
    onMouseEnter={(e) => (e.currentTarget.style.background = `${color}06`)}
    onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
  >
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border-[1.5px]"
      style={{ background: `${color}10`, borderColor: `${color}25` }}
    >
      <Icon className="w-[18px] h-[18px]" style={{ color }} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-['IBM_Plex_Sans',sans-serif] text-sm font-bold text-[#0F172A]">{title}</p>
      <p className="font-['IBM_Plex_Mono',monospace] text-[11px] text-[#94A3B8] mt-0.5 truncate">{subtitle}</p>
    </div>
    <Pencil className="w-[14px] h-[14px] text-[#CBD5E1] shrink-0" />
  </button>
);

// ─── Session Row ────────────────────────────────────────────────────────────────

const SessionRow = ({ session, onRevoke }) => {
  const { device = {}, isCurrent, lastUsedAt, createdAt, deviceId } = session;
  return (
    <div
      className={`relative rounded-xl border-[1.5px] p-4 transition-all ${
        isCurrent ? "border-[#10B98130] bg-[#10B98106]" : "border-[#E2E8F0] bg-white"
      }`}
    >
      {isCurrent && (
        <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-['IBM_Plex_Mono',monospace] text-[10px] font-bold bg-[#10B98112] text-[#0D9488] border border-[#10B98130]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse inline-block" />
          এই ডিভাইস
        </span>
      )}
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: isCurrent ? "#10B98112" : "#F1F5F9" }}
        >
          <DeviceIcon
            type={device.deviceType}
            className="w-5 h-5"
            style={{ color: isCurrent ? "#0D9488" : "#64748B" }}
          />
        </div>
        <div className="flex-1 min-w-0 pr-20">
          <p className="font-['IBM_Plex_Sans',sans-serif] text-sm font-bold text-[#0F172A] capitalize">
            {device.deviceType || "অজানা"}
          </p>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5 font-['IBM_Plex_Mono',monospace] text-[11px] text-[#94A3B8]">
            {device.timezone && (
              <span className="flex items-center gap-1">
                <Globe className="w-3 h-3" /> {device.timezone}
              </span>
            )}
            {device.ip && device.ip !== "unknown" && (
              <span className="flex items-center gap-1">
                <Wifi className="w-3 h-3" /> {device.ip}
              </span>
            )}
            {lastUsedAt && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" /> {timeAgo(lastUsedAt)}
              </span>
            )}
          </div>
          <p className="font-['IBM_Plex_Mono',monospace] text-[10px] text-[#CBD5E1] mt-1">
            লগইন করেছেন {fmtDateTime(createdAt)}
          </p>
        </div>
      </div>
      {!isCurrent && (
        <div className="mt-3">
          <ActionChip onClick={() => onRevoke(deviceId)} icon={LogOut} label="লগআউট" color="#EF4444" />
        </div>
      )}
    </div>
  );
};

// ─── Skeleton ────────────────────────────────────────────────────────────────────

const Skeleton = () => (
  <div className="animate-pulse space-y-4">
    <div className="bg-white rounded-[20px] p-6 border border-[#E2E8F0] shadow-sm space-y-4">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-[#E2E8F0]" />
        <div className="space-y-2 flex-1">
          <div className="h-6 w-40 bg-[#E2E8F0] rounded" />
          <div className="h-4 w-24 bg-[#F1F5F9] rounded" />
        </div>
      </div>
    </div>
    <div className="bg-white rounded-[20px] p-5 border border-[#E2E8F0] shadow-sm">
      <div className="h-4 w-28 bg-[#E2E8F0] rounded mb-3" />
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <div key={i} className="h-16 bg-[#F1F5F9] rounded-xl" />
        ))}
      </div>
    </div>
  </div>
);

// Pill-shaped skeleton placeholders — matches the granted-permissions pill layout
const PermissionsSkeleton = () => (
  <div className="p-4 flex flex-wrap gap-2 animate-pulse">
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className="h-7 rounded-full bg-[#F1F5F9]" style={{ width: 60 + (i % 3) * 30 }} />
    ))}
  </div>
);

// ─── Main Account Page ───────────────────────────────────────────────────────────

const Account = () => {
  const logoutAll = useAuthStore((s) => s.logoutAll);
  const labType = useAuthStore((s) => s.lab?.type);

  const [account, setAccount] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [permissionsList, setPermissionsList] = useState([]);
  const [loadingAcct, setLoadingAcct] = useState(true);
  const [loadingSess, setLoadingSess] = useState(true);
  const [loadingPerms, setLoadingPerms] = useState(true);
  const [acctError, setAcctError] = useState("");
  const [sessError, setSessError] = useState("");
  const [permError, setPermError] = useState("");
  const [logoutAllBusy, setLogoutAllBusy] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [popup, setPopup] = useState(null);
  const [modal, setModal] = useState(null); // "phone" | "email" | "password" | null
  const [confirmModal, setConfirmModal] = useState(null);

  useEffect(() => {
    fetchAccount();
    fetchSessions();
    fetchPermissionsList();
  }, []);

  const fetchAccount = async () => {
    try {
      setLoadingAcct(true);
      setAcctError("");
      const res = await accountService.getMe();
      setAccount(res.data);
    } catch (err) {
      setAcctError(getErrorMessage(err, "অ্যাকাউন্ট লোড করতে ব্যর্থ।"));
      setPopup({ type: "error", message: getErrorMessage(err, "অ্যাকাউন্ট লোড করতে ব্যর্থ।") });
    } finally {
      setLoadingAcct(false);
    }
  };

  const fetchSessions = async () => {
    try {
      setLoadingSess(true);
      setSessError("");
      const res = await accountService.getSessions();
      setSessions(res.data.sessions ?? []);
    } catch (err) {
      setSessError(getErrorMessage(err, "সেশন তালিকা লোড করতে ব্যর্থ হয়েছে"));
    } finally {
      setLoadingSess(false);
    }
  };

  const fetchPermissionsList = async () => {
    try {
      setLoadingPerms(true);
      setPermError("");
      const res = await staticDataAPI.getStaffPermissions();
      setPermissionsList(res.data.permissions ?? []);
    } catch (err) {
      setPermError(getErrorMessage(err, "অনুমতির তালিকা লোড করতে ব্যর্থ হয়েছে"));
    } finally {
      setLoadingPerms(false);
    }
  };

  const handleRevokeConfirm = async (deviceId) => {
    try {
      setLoggingOut(true);
      await accountService.revokeSession(deviceId);
      setSessions((prev) => prev.filter((s) => s.deviceId !== deviceId));
      setPopup({ type: "success", message: "সেশন সফলভাবে লগআউট হয়েছে।" });
    } catch (err) {
      setPopup({ type: "error", message: getErrorMessage(err, "সেশন লগআউট করতে ব্যর্থ।") });
    } finally {
      setLoggingOut(false);
      setConfirmModal(null);
    }
  };

  const handleLogoutAllConfirm = async () => {
    try {
      setLogoutAllBusy(true);
      setLoggingOut(true);
      await logoutAll();
    } finally {
      setLogoutAllBusy(false);
      setLoggingOut(false);
      setConfirmModal(null);
    }
  };

  const handleSuccess = (message) => {
    setModal(null);
    setPopup({ type: "success", message });
    fetchAccount();
  };

  const role = account?.role ?? "staff";
  const roleMeta = ROLE_META[role] ?? ROLE_META.staff;
  const RoleIcon = roleMeta.icon;
  const perms = account?.permissions ?? {};
  const isAdmin = role === "admin" || role === "supportAdmin";

  // Only show permissions that are (a) applicable to this lab type
  // (hospitalOnly permissions hidden for non-hospital labs) and
  // (b) actually granted to this staff member.
  const visiblePermissions = permissionsList.filter(
    (p) => (p.for !== "hospitalOnly" || labType === "hospital") && perms[p.key],
  );

  const currentSession = sessions.find((s) => s.isCurrent);
  const otherSessions = sessions.filter((s) => !s.isCurrent);

  return (
    <section
      className="min-h-screen px-4 py-6 font-['IBM_Plex_Sans',sans-serif]"
      style={{ background: "linear-gradient(to bottom right,#f8fafc,#eff6ff,#eef2ff)" }}
    >
      {popup && <Popup type={popup.type} message={popup.message} onClose={() => setPopup(null)} />}

      {modal === "phone" &&
        createPortal(<PhoneModal onClose={() => setModal(null)} onSuccess={handleSuccess} />, document.body)}
      {modal === "email" &&
        createPortal(
          <EmailModal onClose={() => setModal(null)} onSuccess={handleSuccess} currentEmail={account?.email} />,
          document.body,
        )}
      {modal === "password" &&
        createPortal(<PasswordModal onClose={() => setModal(null)} onSuccess={handleSuccess} />, document.body)}

      {confirmModal &&
        createPortal(
          <ConfirmModal
            message={confirmModal.message}
            description={confirmModal.description}
            tone={confirmModal.tone}
            confirmLabel={confirmModal.confirmLabel}
            onConfirm={confirmModal.onConfirm}
            onCancel={() => setConfirmModal(null)}
            loading={loggingOut}
          />,
          document.body,
        )}

      <div className="max-w-2xl mx-auto">
        {/* Page header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="font-['IBM_Plex_Mono',monospace] text-[10px] uppercase tracking-[0.1em] text-[#6366F1] mb-1">
              আমার প্রোফাইল
            </p>
            <h1 className="font-['IBM_Plex_Sans',sans-serif] text-[26px] font-bold text-[#0F172A] leading-tight">
              অ্যাকাউন্ট
            </h1>
          </div>
          <Link
            to="/"
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border-[1.5px] border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#F1F5F9] transition-all font-['IBM_Plex_Mono',monospace] text-xs font-semibold"
          >
            <ArrowLeft className="w-[13px] h-[13px]" /> ফিরে যান
          </Link>
        </div>

        {loadingAcct ? (
          <Skeleton />
        ) : !account ? (
          <div className="bg-white border border-[#E2E8F0] rounded-[20px] py-16 px-6 text-center shadow-sm">
            <User className="w-10 h-10 text-[#E2E8F0] mx-auto mb-3" />
            <p className="font-['IBM_Plex_Mono',monospace] text-sm font-bold text-[#94A3B8] mb-3">
              অ্যাকাউন্ট লোড করা যায়নি
            </p>
            {acctError && (
              <div className="max-w-sm mx-auto">
                <ErrorBox msg={acctError} />
              </div>
            )}
          </div>
        ) : (
          <>
            {/* ── Identity card ─────────────────────────────────────────── */}
            <div className="bg-white overflow-hidden border border-[#E2E8F0] rounded-[20px] shadow-[0_4px_20px_rgba(15,23,42,0.07)] mb-4">
              <div
                className="px-6 py-4 flex items-center justify-between border-b border-[#E2E8F0]"
                style={{ background: "linear-gradient(135deg,#F8FAFC,#EEF2FF)" }}
              >
                <p className="font-['IBM_Plex_Mono',monospace] text-[10px] font-bold uppercase tracking-[0.1em] text-[#6366F1]">
                  অ্যাকাউন্ট লেজার
                </p>
                {account.isActive ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-['IBM_Plex_Mono',monospace] text-[10px] font-bold bg-[#10B98112] text-[#0D9488] border border-[#10B98130]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] inline-block" /> সক্রিয়
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-['IBM_Plex_Mono',monospace] text-[10px] font-bold bg-[#F1F5F9] text-[#94A3B8] border border-[#E2E8F0]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#94A3B8] inline-block" /> নিষ্ক্রিয়
                  </span>
                )}
              </div>

              <div className="p-5">
                <div className="flex items-start gap-4">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-[0_8px_20px_rgba(99,102,241,0.3)]"
                    style={{ background: "linear-gradient(135deg,#6366F1,#4F46E5)" }}
                  >
                    <span className="font-['IBM_Plex_Mono',monospace] text-xl font-black text-white">
                      {initials(account.name)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-['IBM_Plex_Sans',sans-serif] text-lg font-black text-[#0F172A] leading-tight">
                      {account.name}
                    </h2>
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-['IBM_Plex_Mono',monospace] text-[11px] font-bold text-white mt-1.5"
                      style={{ background: roleMeta.grad }}
                    >
                      <RoleIcon className="w-3 h-3" /> {roleMeta.label}
                    </span>
                    <div className="mt-3 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
                        <span className="font-['IBM_Plex_Mono',monospace] text-sm font-semibold text-[#0F172A]">
                          {account.phone}
                        </span>
                      </div>
                      {account.email ? (
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
                          <span className="font-['IBM_Plex_Mono',monospace] text-sm text-[#64748B]">
                            {account.email}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-[#CBD5E1] shrink-0" />
                          <span className="font-['IBM_Plex_Mono',monospace] text-sm text-[#CBD5E1] italic">
                            কোনো ইমেইল সেট করা নেই
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {account.created?.at && (
                  <p className="font-['IBM_Plex_Mono',monospace] text-[10px] text-[#94A3B8] mt-4 pt-3 border-t border-[#F1F5F9]">
                    সদস্য হয়েছেন <span className="font-semibold text-[#64748B]">{fmtDate(account.created.at)}</span>
                    {account.created?.by?.name && (
                      <>
                        {" "}
                        · যুক্ত করেছেন <span className="font-semibold text-[#64748B]">{account.created.by.name}</span>
                      </>
                    )}
                  </p>
                )}
              </div>
            </div>

            {/* ── Permissions (granted only, pill layout) ────────────────── */}
            {!isAdmin ? (
              <div className="bg-white overflow-hidden border border-[#E2E8F0] rounded-[20px] shadow-[0_4px_20px_rgba(15,23,42,0.07)] mb-4">
                <div
                  className="px-6 py-4 flex items-center justify-between border-b border-[#E2E8F0]"
                  style={{ background: "linear-gradient(135deg,#F8FAFC,#EEF2FF)" }}
                >
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[#6366F1]" />
                    <p className="font-['IBM_Plex_Mono',monospace] text-[10px] font-bold uppercase tracking-[0.1em] text-[#6366F1]">
                      অনুমতিসমূহ
                    </p>
                  </div>
                  {!loadingPerms && !permError && (
                    <span className="px-2 py-0.5 font-['IBM_Plex_Mono',monospace] text-[11px] font-bold text-[#10B981] bg-[#10B98112] rounded-[6px] border border-[#10B98125]">
                      {visiblePermissions.length} টি সক্রিয়
                    </span>
                  )}
                </div>
                {loadingPerms ? (
                  <PermissionsSkeleton />
                ) : permError ? (
                  <div className="p-4">
                    <ErrorBox msg={permError} />
                  </div>
                ) : visiblePermissions.length === 0 ? (
                  <div className="py-8 text-center">
                    <Shield className="w-8 h-8 text-[#E2E8F0] mx-auto mb-2" />
                    <p className="font-['IBM_Plex_Mono',monospace] text-xs font-bold text-[#94A3B8]">
                      কোনো অনুমতি প্রদান করা হয়নি
                    </p>
                  </div>
                ) : (
                  <div className="p-4 flex flex-wrap gap-2">
                    {visiblePermissions.map(({ key, label }) => {
                      const { icon: Icon } = PERMISSION_ICON_MAP[key] ?? DEFAULT_PERMISSION_ICON;
                      return (
                        <span
                          key={key}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border-[1.5px] border-[#10B98130] bg-[#10B98108]"
                        >
                          <Icon className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                          <span className="font-['IBM_Plex_Mono',monospace] text-[11px] font-bold text-[#0D9488] whitespace-nowrap">
                            {label}
                          </span>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div
                className="flex items-center gap-3 p-4 rounded-[20px] border-[1.5px] border-[#F59E0B30] mb-4 shadow-[0_4px_20px_rgba(15,23,42,0.07)]"
                style={{ background: "linear-gradient(135deg,#FFFBEB,#FEF3C7)" }}
              >
                <div className="w-10 h-10 rounded-xl bg-[#F59E0B18] flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5 text-[#D97706]" />
                </div>
                <div className="flex-1">
                  <p className="font-['IBM_Plex_Sans',sans-serif] text-sm font-black text-[#92400E]">
                    সম্পূর্ণ সিস্টেম অ্যাক্সেস
                  </p>
                  <p className="font-['IBM_Plex_Mono',monospace] text-xs text-[#D97706] mt-0.5">
                    আপনার রোলের জন্য সব অনুমতি প্রদান করা হয়েছে
                  </p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-[#D97706] shrink-0" />
              </div>
            )}

            {/* ── Account settings ───────────────────────────────────────── */}
            <div className="bg-white overflow-hidden border border-[#E2E8F0] rounded-[20px] shadow-[0_4px_20px_rgba(15,23,42,0.07)] mb-4">
              <div
                className="px-6 py-4 border-b border-[#E2E8F0]"
                style={{ background: "linear-gradient(135deg,#F8FAFC,#EEF2FF)" }}
              >
                <p className="font-['IBM_Plex_Mono',monospace] text-[10px] font-bold uppercase tracking-[0.1em] text-[#6366F1]">
                  অ্যাকাউন্ট সেটিংস
                </p>
                <p className="font-['IBM_Plex_Sans',sans-serif] text-xs text-[#94A3B8] mt-0.5">
                  যোগাযোগের তথ্য বা পাসওয়ার্ড পরিবর্তন করুন
                </p>
              </div>
              <div className="p-4 space-y-2">
                <SettingsRow
                  icon={Phone}
                  title="ফোন নম্বর পরিবর্তন করুন"
                  subtitle={`বর্তমান: ${account.phone}`}
                  color="#3B82F6"
                  onClick={() => setModal("phone")}
                />
                <SettingsRow
                  icon={Mail}
                  title={account.email ? "ইমেইল পরিবর্তন করুন" : "ইমেইল যুক্ত করুন"}
                  subtitle={account.email ? `বর্তমান: ${account.email}` : "কোনো ইমেইল সেট করা নেই"}
                  color="#10B981"
                  onClick={() => setModal("email")}
                />
                <SettingsRow
                  icon={KeyRound}
                  title="পাসওয়ার্ড পরিবর্তন করুন"
                  subtitle="আপনার অ্যাকাউন্ট সুরক্ষিত রাখুন"
                  color="#6366F1"
                  onClick={() => setModal("password")}
                />
              </div>
            </div>

            {/* ── Active sessions ────────────────────────────────────────── */}
            <div className="bg-white overflow-hidden border border-[#E2E8F0] rounded-[20px] shadow-[0_4px_20px_rgba(15,23,42,0.07)]">
              <div
                className="px-6 py-4 flex items-center justify-between border-b border-[#E2E8F0]"
                style={{ background: "linear-gradient(135deg,#F8FAFC,#EEF2FF)" }}
              >
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-[#6366F1]" />
                  <div>
                    <p className="font-['IBM_Plex_Mono',monospace] text-[10px] font-bold uppercase tracking-[0.1em] text-[#6366F1]">
                      সক্রিয় সেশনসমূহ
                    </p>
                    <p className="font-['IBM_Plex_Sans',sans-serif] text-xs text-[#94A3B8] mt-0.5">
                      {loadingSess ? "লোড হচ্ছে…" : `${sessions.length} টি ডিভাইস লগইন আছে`}
                    </p>
                  </div>
                </div>
                {sessions.length > 1 && (
                  <ActionChip
                    onClick={() =>
                      setConfirmModal({
                        message: "সব ডিভাইস লগআউট করুন",
                        description: "এটি এই ডিভাইসসহ আপনাকে সব ডিভাইস থেকে সাইন আউট করবে। আপনাকে আবার লগইন করতে হবে।",
                        tone: "danger",
                        confirmLabel: "সব লগআউট",
                        onConfirm: handleLogoutAllConfirm,
                      })
                    }
                    icon={LogOut}
                    label="সব লগআউট"
                    color="#EF4444"
                    disabled={logoutAllBusy}
                  />
                )}
              </div>

              <div className="p-4 space-y-2">
                {loadingSess ? (
                  <div className="space-y-2">
                    {[1, 2].map((i) => (
                      <div key={i} className="h-20 bg-[#F1F5F9] rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : sessError ? (
                  <ErrorBox msg={sessError} />
                ) : sessions.length === 0 ? (
                  <div className="py-8 text-center">
                    <WifiOff className="w-8 h-8 text-[#E2E8F0] mx-auto mb-2" />
                    <p className="font-['IBM_Plex_Mono',monospace] text-xs font-bold text-[#94A3B8]">
                      কোনো সক্রিয় সেশন পাওয়া যায়নি
                    </p>
                  </div>
                ) : (
                  <>
                    {currentSession && (
                      <SessionRow
                        session={currentSession}
                        onRevoke={(deviceId) =>
                          setConfirmModal({
                            deviceId,
                            message: "ডিভাইস লগআউট করুন",
                            description: "এটি নির্বাচিত ডিভাইসটি সাইন আউট করবে। তাদের আবার লগইন করতে হবে।",
                            tone: "danger",
                            confirmLabel: "লগআউট",
                            onConfirm: () => handleRevokeConfirm(deviceId),
                          })
                        }
                      />
                    )}
                    {otherSessions.map((s) => (
                      <SessionRow
                        key={s.deviceId}
                        session={s}
                        onRevoke={(deviceId) =>
                          setConfirmModal({
                            deviceId,
                            message: "ডিভাইস লগআউট করুন",
                            description: `এটি ${s.device?.deviceType || "ডিভাইস"} (${s.device?.ip || "অজানা আইপি"}) সাইন আউট করবে। তাদের আবার লগইন করতে হবে।`,
                            tone: "danger",
                            confirmLabel: "লগআউট",
                            onConfirm: () => handleRevokeConfirm(deviceId),
                          })
                        }
                      />
                    ))}
                  </>
                )}
              </div>
            </div>
          </>
        )}

        <p className="font-['IBM_Plex_Mono',monospace] text-[11px] text-[#94A3B8] text-center mt-4 pb-2">
          LabPilotPro · অ্যাকাউন্ট ব্যবস্থাপনা
        </p>
      </div>

      {loggingOut && <LoadingScreen message="সাইন আউট করা হচ্ছে" />}
    </section>
  );
};

export default Account;
