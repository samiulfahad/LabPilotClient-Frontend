/**
 * useCallback / useMemo are intentionally absent.
 * babel-plugin-react-compiler handles memoization automatically.
 */
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  User,
  Phone,
  Lock,
  Shield,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Crown,
  Headset,
  UserCog,
  FilePlus,
  FileEdit,
  Trash2,
  FileText,
  Upload,
  Download,
  KeyRound,
  Edit3,
  AlertCircle,
  Loader2,
  BadgeCheck,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  Clock,
  Wifi,
  WifiOff,
  LogOut,
  ShieldAlert,
} from "lucide-react";
import { Link } from "react-router-dom";
import accountService from "../../api/account";
import { useAuthStore } from "../../store/authStore";
import Popup from "../../components/popup";
import Modal from "../../components/modal";

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLE_META = {
  admin: {
    label: "Lab Admin",
    icon: Crown,
    gradient: "from-amber-500 to-orange-500",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
  },
  supportAdmin: {
    label: "Support Admin",
    icon: Headset,
    gradient: "from-violet-500 to-purple-600",
    badge: "bg-violet-50 text-violet-700 border-violet-200",
  },
  staff: {
    label: "Staff",
    icon: UserCog,
    gradient: "from-blue-500 to-indigo-600",
    badge: "bg-blue-50 text-blue-700 border-blue-200",
  },
};

const PERMISSIONS_META = [
  { key: "createInvoice", label: "Create Invoice", icon: FilePlus, color: "blue" },
  { key: "editInvoice", label: "Edit Invoice", icon: FileEdit, color: "amber" },
  { key: "deleteInvoice", label: "Delete Invoice", icon: Trash2, color: "red" },
  { key: "cashmemo", label: "Cashmemo", icon: FileText, color: "green" },
  { key: "uploadReport", label: "Upload Report", icon: Upload, color: "purple" },
  { key: "downloadReport", label: "Download Report", icon: Download, color: "teal" },
];

const COLOR_MAP = {
  blue: { active: "bg-blue-50 border-blue-200 text-blue-700", iconBg: "bg-blue-100", iconText: "text-blue-600" },
  amber: { active: "bg-amber-50 border-amber-200 text-amber-700", iconBg: "bg-amber-100", iconText: "text-amber-600" },
  red: { active: "bg-red-50 border-red-200 text-red-700", iconBg: "bg-red-100", iconText: "text-red-600" },
  green: { active: "bg-green-50 border-green-200 text-green-700", iconBg: "bg-green-100", iconText: "text-green-600" },
  purple: {
    active: "bg-purple-50 border-purple-200 text-purple-700",
    iconBg: "bg-purple-100",
    iconText: "text-purple-600",
  },
  teal: { active: "bg-teal-50 border-teal-200 text-teal-700", iconBg: "bg-teal-100", iconText: "text-teal-600" },
};

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const fmtDateTime = (d) =>
  d
    ? new Date(d).toLocaleString("en-US", {
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

const avatarGrad = (name = "") => {
  const GRADS = [
    "from-blue-500 to-indigo-600",
    "from-violet-500 to-purple-600",
    "from-emerald-500 to-teal-600",
    "from-rose-500 to-pink-600",
    "from-amber-500 to-orange-500",
    "from-cyan-500 to-sky-600",
  ];
  const code = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return GRADS[code % GRADS.length];
};

// ─── Device icon helper ───────────────────────────────────────────────────────

const DeviceIcon = ({ type, className }) => {
  if (type === "mobile") return <Smartphone className={className} />;
  if (type === "tablet") return <Tablet className={className} />;
  return <Monitor className={className} />;
};

// ─── Time ago helper ──────────────────────────────────────────────────────────

const timeAgo = (d) => {
  if (!d) return "Never";
  const diffMs = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const Skeleton = () => (
  <div className="animate-pulse space-y-4">
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gray-200" />
        <div className="space-y-2 flex-1">
          <div className="h-6 w-40 bg-gray-200 rounded" />
          <div className="h-4 w-24 bg-gray-100 rounded" />
        </div>
      </div>
    </div>
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
      <div className="h-4 w-28 bg-gray-200 rounded mb-3" />
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <div key={i} className="h-16 bg-gray-100 rounded-xl" />
        ))}
      </div>
    </div>
  </div>
);

// ─── Password input ───────────────────────────────────────────────────────────

const PasswordInput = ({ label, value, onChange, placeholder }) => {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all bg-gray-50 focus:bg-white"
        />
        <button
          type="button"
          onClick={() => setShow((p) => !p)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};

// ─── Error box ────────────────────────────────────────────────────────────────

const ErrorBox = ({ msg }) =>
  msg ? (
    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
      <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
      <p className="text-xs font-medium text-red-600">{msg}</p>
    </div>
  ) : null;

// ─── Phone Modal ──────────────────────────────────────────────────────────────

const PhoneModal = ({ isOpen, onClose, onSuccess }) => {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setPhone("");
    setPassword("");
    setError("");
  };
  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    setError("");
    if (phone.trim().length < 10) return setError("Enter a valid phone number (min 10 digits)");
    if (!password) return setError("Current password is required");
    try {
      setLoading(true);
      await accountService.changePhone({ phone: phone.trim(), currentPassword: password });
      reset();
      onSuccess("Phone number updated successfully!");
    } catch (err) {
      setError(err?.response?.data?.error ?? "Failed to update phone number");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="sm">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
            <Phone className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-base font-black text-gray-900">Change Phone Number</h3>
            <p className="text-xs text-gray-500">Confirm with your current password</p>
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">New Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01XXXXXXXXX"
                maxLength={15}
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all bg-gray-50 focus:bg-white"
              />
            </div>
          </div>
          <PasswordInput
            label="Current Password"
            value={password}
            onChange={setPassword}
            placeholder="Enter current password"
          />
          <ErrorBox msg={error} />
        </div>
        <div className="flex gap-3 mt-5">
          <button
            onClick={handleClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 transition-all flex items-center justify-center gap-2 shadow-sm shadow-blue-200"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Updating…" : "Update Phone"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

// ─── Password Modal ───────────────────────────────────────────────────────────

const PasswordModal = ({ isOpen, onClose, onSuccess }) => {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setCurrent("");
    setNext("");
    setConfirm("");
    setError("");
  };
  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    setError("");
    if (!current) return setError("Current password is required");
    if (next.length < 6) return setError("New password must be at least 6 characters");
    if (next !== confirm) return setError("New passwords do not match");
    try {
      setLoading(true);
      await accountService.changePassword({ currentPassword: current, newPassword: next });
      reset();
      onSuccess("Password changed successfully!");
    } catch (err) {
      setError(err?.response?.data?.error ?? "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="sm">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
            <KeyRound className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-base font-black text-gray-900">Change Password</h3>
            <p className="text-xs text-gray-500">Minimum 6 characters required</p>
          </div>
        </div>
        <div className="space-y-3">
          <PasswordInput
            label="Current Password"
            value={current}
            onChange={setCurrent}
            placeholder="Enter current password"
          />
          <PasswordInput label="New Password" value={next} onChange={setNext} placeholder="Minimum 6 characters" />
          <PasswordInput
            label="Confirm New Password"
            value={confirm}
            onChange={setConfirm}
            placeholder="Re-enter new password"
          />
          {next && confirm && next !== confirm && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
              <p className="text-xs font-medium text-amber-600">Passwords do not match</p>
            </div>
          )}
          <ErrorBox msg={error} />
        </div>
        <div className="flex gap-3 mt-5">
          <button
            onClick={handleClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 transition-all flex items-center justify-center gap-2 shadow-sm shadow-indigo-200"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Saving…" : "Change Password"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

// ─── Session Card ─────────────────────────────────────────────────────────────

const SessionCard = ({ session, onRevoke, revoking }) => {
  const { device = {}, isCurrent, lastUsedAt, createdAt, expiresAt, deviceId } = session;
  const isExpired = expiresAt && new Date(expiresAt) < new Date();

  return (
    <div
      className={`relative rounded-2xl border p-4 transition-all ${
        isCurrent
          ? "border-emerald-200 bg-emerald-50/60"
          : isExpired
            ? "border-gray-100 bg-gray-50/50 opacity-60"
            : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm"
      }`}
    >
      {isCurrent && (
        <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
          This device
        </span>
      )}

      <div className="flex items-start gap-3">
        {/* Device icon */}
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            isCurrent ? "bg-emerald-100" : "bg-gray-100"
          }`}
        >
          <DeviceIcon
            type={device.deviceType}
            className={`w-5 h-5 ${isCurrent ? "text-emerald-600" : "text-gray-500"}`}
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 pr-16">
          {/* ── Device name — primary identifier ── */}
          <p className="text-sm font-bold text-gray-800 truncate">{device.deviceName || "Unknown Device"}</p>

          {/* Browser + OS — secondary line */}
          <p className="text-xs text-gray-500 mt-0.5 truncate">
            {device.browser || "Unknown browser"}
            {device.browserVersion ? ` ${device.browserVersion}` : ""}
            {" · "}
            {device.os || "Unknown OS"}
            {device.osVersion ? ` ${device.osVersion}` : ""}
            {device.deviceType ? ` · ${device.deviceType}` : ""}
          </p>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
            {device.timezone && (
              <span className="flex items-center gap-1 text-[10px] text-gray-400">
                <Globe className="w-3 h-3" /> {device.timezone}
              </span>
            )}
            {device.ip && device.ip !== "unknown" && (
              <span className="flex items-center gap-1 text-[10px] text-gray-400">
                <Wifi className="w-3 h-3" /> {device.ip}
              </span>
            )}
            {lastUsedAt && (
              <span className="flex items-center gap-1 text-[10px] text-gray-400">
                <Clock className="w-3 h-3" /> {timeAgo(lastUsedAt)}
              </span>
            )}
          </div>
          <p className="text-[10px] text-gray-300 mt-1">Logged in {fmtDateTime(createdAt)}</p>
        </div>
      </div>

      {/* Revoke button — not shown for current session */}
      {!isCurrent && (
        <button
          onClick={() => onRevoke(deviceId)}
          disabled={revoking === deviceId}
          className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-100 hover:border-rose-200 transition-all disabled:opacity-50"
        >
          {revoking === deviceId ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <LogOut className="w-3.5 h-3.5" />
          )}
          {revoking === deviceId ? "Revoking…" : "Revoke Session"}
        </button>
      )}
    </div>
  );
};

// ─── Main Account Page ────────────────────────────────────────────────────────

const Account = () => {
  const logout = useAuthStore((s) => s.logout);

  const [account, setAccount] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loadingAcct, setLoadingAcct] = useState(true);
  const [loadingSess, setLoadingSess] = useState(true);
  const [revoking, setRevoking] = useState(null); // deviceId being revoked
  const [logoutAll, setLogoutAll] = useState(false);
  const [popup, setPopup] = useState(null);
  const [showPhone, setShowPhone] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetchAccount();
    fetchSessions();
  }, []);

  const fetchAccount = async () => {
    try {
      setLoadingAcct(true);
      const res = await accountService.getMe();
      setAccount(res.data);
    } catch {
      setPopup({ type: "error", message: "Failed to load account." });
    } finally {
      setLoadingAcct(false);
    }
  };

  const fetchSessions = async () => {
    try {
      setLoadingSess(true);
      const res = await accountService.getSessions();
      setSessions(res.data.sessions ?? []);
    } catch {
      // sessions section just shows empty
    } finally {
      setLoadingSess(false);
    }
  };

  const handleRevoke = async (deviceId) => {
    try {
      setRevoking(deviceId);
      await accountService.revokeSession(deviceId);
      setSessions((prev) => prev.filter((s) => s.deviceId !== deviceId));
      setPopup({ type: "success", message: "Session revoked successfully." });
    } catch (err) {
      setPopup({ type: "error", message: err?.response?.data?.error ?? "Failed to revoke session." });
    } finally {
      setRevoking(null);
    }
  };

  const handleLogoutAll = async () => {
    try {
      setLogoutAll(true);
      await logout();
    } finally {
      setLogoutAll(false);
    }
  };

  const handleSuccess = (message) => {
    setPopup({ type: "success", message });
    fetchAccount();
  };

  const role = account?.role ?? "staff";
  const roleMeta = ROLE_META[role] ?? ROLE_META.staff;
  const RoleIcon = roleMeta.icon;
  const perms = account?.permissions ?? {};
  const isAdmin = role === "admin" || role === "supportAdmin";
  const activePermCount = PERMISSIONS_META.filter((p) => perms[p.key]).length;

  // Split sessions: current first, then others
  const currentSession = sessions.find((s) => s.isCurrent);
  const otherSessions = sessions.filter((s) => !s.isCurrent);

  return (
    <section className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 px-4 py-6">
      {popup && <Popup type={popup.type} message={popup.message} onClose={() => setPopup(null)} />}

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fu  { animation: fadeUp 0.45s cubic-bezier(.22,1,.36,1) both; }
        .fu1 { animation-delay: 60ms; }
        .fu2 { animation-delay: 120ms; }
        .fu3 { animation-delay: 180ms; }
        .fu4 { animation-delay: 240ms; }
      `}</style>

      <div className="max-w-lg mx-auto">
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-5 fu">
          <div>
            <p className="text-[11px] font-bold text-indigo-500 uppercase tracking-widest mb-0.5">LabPilot</p>
            <h1 className="text-2xl font-black text-gray-900 leading-tight">Account</h1>
          </div>
          <Link
            to="/"
            className="px-3 py-2.5 rounded-xl border border-gray-200 bg-white/60 text-gray-700 hover:bg-gray-50 transition-all flex items-center gap-2 text-sm font-medium shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
        </div>

        {loadingAcct ? (
          <Skeleton />
        ) : !account ? (
          <div className="bg-white border border-gray-100 rounded-2xl py-16 text-center shadow-sm">
            <User className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm font-bold text-gray-400">Could not load account</p>
          </div>
        ) : (
          <>
            {/* ── Identity Card ──────────────────────────────────────────── */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden mb-4 fu fu1">
              <div className={`h-1.5 w-full bg-gradient-to-r ${roleMeta.gradient}`} />
              <div className="p-5">
                <div className="flex items-start gap-4">
                  <div
                    className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${avatarGrad(account.name)} flex items-center justify-center shadow-lg shrink-0`}
                  >
                    <span className="text-xl font-black text-white">{initials(account.name)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg font-black text-gray-900 leading-tight">{account.name}</h2>
                      {account.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-500 border border-gray-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-400 inline-block" /> Inactive
                        </span>
                      )}
                    </div>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border mt-1.5 ${roleMeta.badge}`}
                    >
                      <RoleIcon className="w-3 h-3" /> {roleMeta.label}
                    </span>
                    <div className="mt-3 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="text-sm font-semibold text-gray-700">{account.phone}</span>
                      </div>
                      {account.email && (
                        <div className="flex items-center gap-2">
                          <BadgeCheck className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span className="text-sm text-gray-600">{account.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {account.created?.at && (
                  <p className="text-[10px] text-gray-400 mt-4 pt-3 border-t border-gray-50">
                    Member since <span className="font-semibold">{fmtDate(account.created.at)}</span>
                    {account.created?.by?.name && (
                      <>
                        {" "}
                        · Added by <span className="font-semibold">{account.created.by.name}</span>
                      </>
                    )}
                  </p>
                )}
              </div>
            </div>

            {/* ── Permissions ────────────────────────────────────────────── */}
            {!isAdmin ? (
              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 mb-4 fu fu2">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-gray-500" />
                    <h3 className="text-sm font-black text-gray-800">Permissions</h3>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
                    {activePermCount} / {PERMISSIONS_META.length} active
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {PERMISSIONS_META.map(({ key, label, icon: Icon, color }) => {
                    const granted = !!perms[key];
                    const c = COLOR_MAP[color];
                    return (
                      <div
                        key={key}
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all ${granted ? c.active : "bg-gray-50 border-gray-100 text-gray-400"}`}
                      >
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${granted ? c.iconBg : "bg-gray-100"}`}
                        >
                          <Icon className={`w-3.5 h-3.5 ${granted ? c.iconText : "text-gray-300"}`} />
                        </div>
                        <p className="text-[11px] font-bold leading-tight flex-1 truncate">{label}</p>
                        {granted ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-gray-300 shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 mb-4 flex items-center gap-3 fu fu2">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-black text-amber-800">Full System Access</p>
                  <p className="text-xs text-amber-600 mt-0.5">All permissions are granted for your role</p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-amber-500 shrink-0" />
              </div>
            )}

            {/* ── Active Sessions ─────────────────────────────────────────── */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden mb-4 fu fu3">
              <div className="px-5 pt-5 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-gray-800 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-gray-500" />
                    Active Sessions
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {loadingSess
                      ? "Loading…"
                      : `${sessions.length} device${sessions.length !== 1 ? "s" : ""} logged in`}
                  </p>
                </div>
                {sessions.length > 1 && (
                  <button
                    onClick={handleLogoutAll}
                    disabled={logoutAll}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-100 hover:border-rose-200 transition-all disabled:opacity-50"
                  >
                    {logoutAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
                    Logout All
                  </button>
                )}
              </div>

              <div className="px-4 pb-4 space-y-2">
                {loadingSess ? (
                  <div className="space-y-2">
                    {[1, 2].map((i) => (
                      <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
                    ))}
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="py-8 text-center">
                    <WifiOff className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                    <p className="text-xs font-bold text-gray-400">No active sessions found</p>
                  </div>
                ) : (
                  <>
                    {currentSession && (
                      <SessionCard session={currentSession} onRevoke={handleRevoke} revoking={revoking} />
                    )}
                    {otherSessions.map((s) => (
                      <SessionCard key={s.deviceId} session={s} onRevoke={handleRevoke} revoking={revoking} />
                    ))}
                  </>
                )}
              </div>
            </div>

            {/* ── Account Settings ────────────────────────────────────────── */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden fu fu4">
              <div className="px-5 pt-5 pb-3">
                <h3 className="text-sm font-black text-gray-800 flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-gray-500" /> Account Settings
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">Change your phone number or password</p>
              </div>
              <div className="px-4 pb-4 space-y-2">
                <button
                  onClick={() => setShowPhone(true)}
                  className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all group text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
                    <Phone className="w-[18px] h-[18px] text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800 group-hover:text-blue-700 transition-colors">
                      Change Phone Number
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">Current: {account.phone}</p>
                  </div>
                  <Edit3 className="w-4 h-4 text-gray-300 group-hover:text-blue-400 transition-colors shrink-0" />
                </button>

                <button
                  onClick={() => setShowPassword(true)}
                  className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all group text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 group-hover:bg-indigo-100 transition-colors">
                    <KeyRound className="w-[18px] h-[18px] text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800 group-hover:text-indigo-700 transition-colors">
                      Change Password
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">Keep your account secure</p>
                  </div>
                  <Edit3 className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 transition-colors shrink-0" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <PhoneModal
        isOpen={showPhone}
        onClose={() => setShowPhone(false)}
        onSuccess={(m) => {
          setShowPhone(false);
          handleSuccess(m);
        }}
      />
      <PasswordModal
        isOpen={showPassword}
        onClose={() => setShowPassword(false)}
        onSuccess={(m) => {
          setShowPassword(false);
          handleSuccess(m);
        }}
      />
    </section>
  );
};

export default Account;
