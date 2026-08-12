// pages/setPassword.jsx
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import api from "../../api/baseAPI"; // adjust path to match this file's actual depth
import { Lock, Eye, EyeOff, ArrowRight, CheckCircle2, AlertCircle, Loader2, ShieldCheck, XCircle } from "lucide-react";
import Popup from "../../components/popup";

const isNetworkError = (err) => err?.isAxiosError === true && !err.response;

const STATE = { LOADING: "loading", INVALID: "invalid", READY: "ready", DONE: "done" };

/* ─── Icon input — same as login ─────────────────────────────────────────── */
const IconInput = ({ icon: Icon, error, rightSlot, className = "", ...props }) => (
  <div className="flex flex-col gap-1.5">
    <div className="relative">
      <Icon
        size={15}
        className="absolute left-4 sm:left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10"
      />
      <input
        className={`w-full bg-gray-50/70 border rounded-2xl py-3.5 text-base text-slate-800 outline-none transition-all duration-200 placeholder:text-gray-400 placeholder:font-normal focus:bg-white sm:py-2.5 sm:text-sm ${
          error
            ? "border-red-300 ring-4 ring-red-100/60 focus:border-red-400 focus:ring-red-100/60"
            : "border-gray-200/80 focus:border-blue-400 focus:ring-4 focus:ring-blue-100/60"
        } ${className}`}
        style={{ paddingLeft: "45px", paddingRight: rightSlot ? "55px" : "16px" }}
        {...props}
      />
      {rightSlot}
    </div>
    {error && (
      <p
        className="flex items-center gap-1 text-[11.5px] text-red-400 font-medium pl-1"
        style={{ animation: "lpFadeUp 0.25s cubic-bezier(.22,1,.36,1) both" }}
      >
        <AlertCircle size={11} />
        {error}
      </p>
    )}
  </div>
);

/* ─── Shell — brand header + card + footer, shared by every state ───────── */
function Shell({ mounted, children }) {
  return (
    <div
      className="fixed inset-0 h-[100dvh] w-full flex items-center justify-center px-2 py-4 sm:p-6 overflow-hidden"
      style={{
        background: "linear-gradient(145deg, #f0f4ff 0%, #f0f1f7 40%, #e8f5ff 100%)",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-48 -left-48 w-[560px] h-[560px] rounded-full opacity-[0.18] blur-3xl"
          style={{ background: "radial-gradient(circle, #818cf8, transparent 70%)" }}
        />
        <div
          className="absolute top-1/2 -right-48 w-[420px] h-[420px] rounded-full opacity-[0.12] blur-3xl"
          style={{ background: "radial-gradient(circle, #34d399, transparent 70%)" }}
        />
      </div>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(99,102,241,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.035) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
        }}
      />

      <div
        className="relative z-10 w-full max-w-[420px]"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 0.5s, transform 0.5s",
        }}
      >
        <div
          className="flex items-center gap-3 px-4 sm:px-6 py-4 rounded-t-3xl border-b border-slate-200"
          style={{ background: "linear-gradient(135deg, #dbeafe 0%, #e2e8f0 100%)" }}
        >
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-md shadow-blue-500/20">
            <span className="text-white font-bold text-sm">LP</span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-slate-900 font-bold text-base leading-none">
              LabPilot<span className="font-light">Pro</span>
            </span>
            <span className="text-[10px] text-slate-500 font-medium leading-tight mt-1 tracking-wider">
              by Engr. Samiul Fahad
            </span>
          </div>
          <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-100 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-bold text-emerald-600">Online</span>
          </div>
        </div>

        <div
          className="bg-white/85 backdrop-blur-md border border-gray-200/80 border-t-0 shadow-lg"
          style={{ borderRadius: "0 0 24px 24px" }}
        >
          <div className="px-4 sm:px-7 pt-6 pb-6">{children}</div>

          <div className="flex items-center justify-between px-4 sm:px-7 py-3.5 rounded-b-3xl border-t border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={12} className="text-blue-400" />
              <span className="text-[11px] text-gray-400 font-medium">256-bit encrypted</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-[11px] text-gray-400">Authorized access</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes lpFadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

/* ─── Main component ──────────────────────────────────────────────────────── */
export default function SetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token");

  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState(STATE.LOADING);
  const [staffInfo, setStaffInfo] = useState(null);
  const [invalidMsg, setInvalidMsg] = useState("");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [offlinePopup, setOfflinePopup] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!token) {
      setStatus(STATE.INVALID);
      setInvalidMsg("This link is missing its token.");
      return;
    }
    api
      .post("/set-password/verify", { token })
      .then(({ data }) => {
        setStaffInfo(data);
        setStatus(STATE.READY);
      })
      .catch((err) => {
        if (isNetworkError(err)) {
          setOfflinePopup(true);
          return;
        }
        setStatus(STATE.INVALID);
        setInvalidMsg(err?.response?.data?.message ?? "This link is invalid or has expired.");
      });
  }, [token]);

  const validate = () => {
    const e = {};
    if (password.length < 6) e.password = "At least 6 characters";
    if (confirm !== password) e.confirm = "Passwords don't match";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitError("");
    setSubmitting(true);
    try {
      await api.post("/set-password", { token, password });
      setStatus(STATE.DONE);
    } catch (err) {
      if (isNetworkError(err)) {
        setOfflinePopup(true);
      } else {
        setSubmitError(err?.response?.data?.message ?? "Failed to set password. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Shell mounted={mounted}>
      {offlinePopup && <Popup type="offline" onClose={() => setOfflinePopup(false)} />}

      {/* ── LOADING ── */}
      {status === STATE.LOADING && (
        <div className="flex flex-col items-center gap-4 py-10">
          <Loader2 size={26} className="animate-spin text-blue-500" />
          <p className="text-sm text-gray-400">Verifying your link…</p>
        </div>
      )}

      {/* ── INVALID ── */}
      {status === STATE.INVALID && (
        <div className="flex flex-col items-center gap-5 py-4">
          <div className="w-16 h-16 rounded-3xl flex items-center justify-center bg-red-50 border border-red-100">
            <XCircle size={28} color="#dc2626" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-black text-gray-900">Link invalid</h2>
            <p className="text-sm text-slate-500 mt-1">{invalidMsg}</p>
          </div>
          <Link
            to="/login"
            className="w-full text-center py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all"
          >
            Go to Sign In
          </Link>
        </div>
      )}

      {/* ── READY — set password form ── */}
      {status === STATE.READY && (
        <div className="flex flex-col gap-4">
          <div className="mb-1 text-center">
            <h1 className="text-[26px] sm:text-[22px] font-black text-gray-900 tracking-tight leading-tight mb-0.5">
              Set your password<span className="text-blue-600">.</span>
            </h1>
            {staffInfo && (
              <p className="text-sm sm:text-[13px] text-gray-400 font-light">
                {staffInfo.name} — Lab {staffInfo.labKey}
              </p>
            )}
          </div>

          <IconInput
            icon={Lock}
            error={errors.password}
            type={showPw ? "text" : "password"}
            placeholder="New password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            autoFocus
            rightSlot={
              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-all active:scale-90"
                onClick={() => setShowPw((p) => !p)}
              >
                {showPw ? <EyeOff size={18} strokeWidth={2.2} /> : <Eye size={18} strokeWidth={2.2} />}
              </button>
            }
          />

          <IconInput
            icon={Lock}
            error={errors.confirm}
            type={showConfirmPw ? "text" : "password"}
            placeholder="Confirm password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            rightSlot={
              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-all active:scale-90"
                onClick={() => setShowConfirmPw((p) => !p)}
              >
                {showConfirmPw ? <EyeOff size={18} strokeWidth={2.2} /> : <Eye size={18} strokeWidth={2.2} />}
              </button>
            }
          />

          {submitError && (
            <div className="flex items-center gap-2 justify-center px-3 py-2.5 rounded-2xl text-[12.5px] text-red-600 bg-red-50 border border-red-200">
              <AlertCircle size={13} />
              {submitError}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="group w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-semibold text-white transition-all hover:-translate-y-0.5 disabled:opacity-60"
            style={{
              background: "linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)",
              boxShadow: "0 4px 16px rgba(37,99,235,0.28)",
            }}
          >
            {submitting ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <>
                <span>Set Password</span>
                <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>
        </div>
      )}

      {/* ── DONE ── */}
      {status === STATE.DONE && (
        <div className="flex flex-col items-center gap-6 py-4">
          <div className="w-16 h-16 rounded-3xl flex items-center justify-center bg-emerald-50 border border-emerald-100">
            <CheckCircle2 size={28} color="#16a34a" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-black text-gray-900">Password Set!</h2>
            <p className="text-sm text-slate-500 mt-1">You can now sign in with your new password.</p>
          </div>
          <button
            onClick={() => navigate("/login")}
            className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all"
          >
            Go to Sign In
          </button>
        </div>
      )}
    </Shell>
  );
}
