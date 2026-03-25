import { useState, useEffect } from "react";
import { useAuthStore } from "../../store/authStore";
import { useNavigate } from "react-router-dom";
import {
  Hash,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Send,
  Activity,
} from "lucide-react";

/* ─── helpers ──────────────────────────────────────────────────────────────── */
const useClock = () => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return time.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

/* ─── Field wrapper ──────────────────────────────────────────────────────── */
const Field = ({ label, error, children }) => (
  <div className="flex flex-col gap-1.5">
    <label
      className="text-[10.5px] font-bold tracking-[0.12em] text-slate-400 uppercase select-none"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {label}
    </label>
    <div className="relative">{children}</div>
    {error && (
      <p
        className="flex items-center gap-1 text-[11.5px] text-red-400 font-medium mt-0.5"
        style={{ animation: "lpFadeUp 0.25s cubic-bezier(.22,1,.36,1) both" }}
      >
        <AlertCircle size={11} />
        {error}
      </p>
    )}
  </div>
);

/* ─── Lab ID dot progress ────────────────────────────────────────────────── */
const LabDots = ({ count }) => (
  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-[5px]">
    {[0, 1, 2, 3, 4].map((i) => (
      <span
        key={i}
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          background: i < count ? "#3b82f6" : "#e2e8f0",
          transition: "all .18s",
          transform: i < count ? "scale(1.3)" : "scale(1)",
        }}
      />
    ))}
  </div>
);

/* ─── Component ─────────────────────────────────────────────────────────── */
export default function Login() {
  const [view, setView] = useState("login");
  const [mounted, setMounted] = useState(false);

  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const [loginError, setLoginError] = useState("");
  const [labId, setLabId] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [resetPhone, setResetPhone] = useState("");

  const clock = useClock();

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  const validateLogin = () => {
    const e = {};
    if (!/^\d{5}$/.test(labId)) e.labId = "Must be exactly 5 digits";
    if (!/^\+?[\d\s\-()+]{7,}$/.test(phone)) e.phone = "Enter a valid phone number";
    if (password.length < 6) e.password = "Password is too short";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const validateReset = () => {
    const e = {};
    if (!/^\+?[\d\s\-()+]{7,}$/.test(resetPhone)) e.resetPhone = "Enter a valid phone number";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleLogin = async () => {
    if (!validateLogin()) return;
    setLoginError("");
    setLoading(true);
    const result = await login(labId, phone, password);
    setLoading(false);
    if (result.success) navigate("/");
    else setLoginError(result.message);
  };

  const handleReset = async () => {
    if (!validateReset()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
    setView("sent");
  };

  const goReset = () => {
    setErrors({});
    setView("reset");
  };
  const goLogin = () => {
    setErrors({});
    setView("login");
    setResetPhone("");
  };

  const inputBase =
    "w-full bg-gray-50/70 border border-gray-200/80 rounded-xl px-3.5 py-2.5 pl-10 text-sm text-slate-800 outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100/60 focus:bg-white";
  const inputErr = "border-red-300 ring-4 ring-red-100/60 focus:border-red-400 focus:ring-red-100/60";

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{
        background: "linear-gradient(145deg, #f0f4ff 0%, #f0f1f7 40%, #e8f5ff 100%)",
        fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif",
      }}
    >
      {/* ── Background blobs ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-48 -left-48 w-[560px] h-[560px] rounded-full opacity-[0.18] blur-3xl"
          style={{ background: "radial-gradient(circle, #818cf8, transparent 70%)" }}
        />
        <div
          className="absolute top-1/2 -right-48 w-[420px] h-[420px] rounded-full opacity-[0.12] blur-3xl"
          style={{ background: "radial-gradient(circle, #34d399, transparent 70%)" }}
        />
        <div
          className="absolute bottom-0 left-1/3 w-[300px] h-[300px] rounded-full opacity-[0.10] blur-3xl"
          style={{ background: "radial-gradient(circle, #60a5fa, transparent 70%)" }}
        />
      </div>

      {/* ── Fine grid ── */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(rgba(99,102,241,0.035) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(99,102,241,0.035) 1px, transparent 1px)`,
          backgroundSize: "36px 36px",
        }}
      />

      {/* ── Card ── */}
      <div
        className="relative z-10 w-full px-4"
        style={{
          maxWidth: "420px",
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 0.5s cubic-bezier(.22,1,.36,1), transform 0.5s cubic-bezier(.22,1,.36,1)",
        }}
      >
        {/* ── Brand header: LP icon + name + online badge + clock all in one row ── */}
        <div
          className="flex items-center gap-3 px-4 py-3.5 rounded-t-3xl border-b border-slate-200"
          style={{
            background: "linear-gradient(135deg, #dbeafe 0%, #e2e8f0 100%)",
            animation: "lpFadeUp 0.5s cubic-bezier(.22,1,.36,1) 0.05s both",
          }}
        >
          {/* LP icon box */}
          <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/20 flex-shrink-0">
            <span className="text-white font-bold text-xs">LP</span>
          </div>

          {/* Brand name + tagline */}
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-slate-900 font-bold text-[14px] leading-none" style={{ letterSpacing: "-0.02em" }}>
              LabPilot<span className="font-light">Pro</span>
            </span>
            <span className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5 hidden sm:block">
              Modern Health Management
            </span>
          </div>

          {/* Right side: online badge stacked over clock */}
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 border border-emerald-100 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[9.5px] font-bold text-emerald-600">Online</span>
            </div>
            <div className="flex items-center gap-1">
              <Activity className="w-2.5 h-2.5 text-slate-400" />
              <span className="text-[10px] font-mono font-semibold text-slate-500 tabular-nums">{clock}</span>
            </div>
          </div>
        </div>

        {/* ── Card body ── */}
        <div
          className="bg-white/85 backdrop-blur-md border border-gray-200/80 border-t-0 shadow-lg"
          style={{ borderRadius: "0 0 24px 24px" }}
        >
          <div className="px-5 pt-5 pb-5">
            {/* View heading */}
            {view === "login" && (
              <div className="mb-4" style={{ animation: "lpFadeUp 0.5s cubic-bezier(.22,1,.36,1) 0.1s both" }}>
                <h1
                  className="text-[20px] font-black text-gray-900 leading-tight mb-0.5"
                  style={{ letterSpacing: "-0.03em" }}
                >
                  Welcome back<span className="text-blue-600">.</span>
                </h1>
                <p className="text-[12.5px] text-gray-400 font-light">Sign in to access your lab workspace</p>
              </div>
            )}
            {view === "reset" && (
              <div className="mb-4" style={{ animation: "lpFadeUp 0.5s cubic-bezier(.22,1,.36,1) 0.1s both" }}>
                <h1
                  className="text-[20px] font-black text-gray-900 leading-tight mb-0.5"
                  style={{ letterSpacing: "-0.03em" }}
                >
                  Reset password
                </h1>
                <p className="text-[12.5px] text-gray-400 font-light">We'll send a secure link to your phone</p>
              </div>
            )}
            {view === "sent" && (
              <div className="mb-4" style={{ animation: "lpFadeUp 0.5s cubic-bezier(.22,1,.36,1) 0.1s both" }}>
                <h1
                  className="text-[20px] font-black text-gray-900 leading-tight mb-0.5"
                  style={{ letterSpacing: "-0.03em" }}
                >
                  Check your phone
                </h1>
                <p className="text-[12.5px] text-gray-400 font-light">Instructions sent successfully</p>
              </div>
            )}

            {/* ════ LOGIN ════ */}
            {view === "login" && (
              <div className="flex flex-col gap-3.5">
                <div style={{ animation: "lpFadeUp 0.5s cubic-bezier(.22,1,.36,1) 0.15s both" }}>
                  <Field label="Lab ID" error={errors.labId}>
                    <Hash
                      size={14}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10"
                    />
                    <input
                      className={`${inputBase} font-mono tracking-[0.2em] font-bold pr-20 ${errors.labId ? inputErr : ""}`}
                      type="text"
                      inputMode="numeric"
                      placeholder="00000"
                      value={labId}
                      onChange={(e) => setLabId(e.target.value.replace(/\D/g, "").slice(0, 5))}
                      maxLength={5}
                    />
                    <LabDots count={labId.length} />
                  </Field>
                </div>

                <div style={{ animation: "lpFadeUp 0.5s cubic-bezier(.22,1,.36,1) 0.20s both" }}>
                  <Field label="Phone Number" error={errors.phone}>
                    <Phone
                      size={14}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10"
                    />
                    <input
                      className={`${inputBase} ${errors.phone ? inputErr : ""}`}
                      type="tel"
                      placeholder="+880 1XXX-XXXXXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </Field>
                </div>

                <div style={{ animation: "lpFadeUp 0.5s cubic-bezier(.22,1,.36,1) 0.25s both" }}>
                  <Field label="Password" error={errors.password}>
                    <Lock
                      size={14}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10"
                    />
                    <input
                      className={`${inputBase} pr-11 ${errors.password ? inputErr : ""}`}
                      type={showPw ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                    />
                    <button
                      type="button"
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      onClick={() => setShowPw((p) => !p)}
                      tabIndex={-1}
                    >
                      {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </Field>
                </div>

                <div
                  className="flex justify-end -mt-1"
                  style={{ animation: "lpFadeUp 0.5s cubic-bezier(.22,1,.36,1) 0.28s both" }}
                >
                  <button
                    type="button"
                    className="text-[12px] font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                    onClick={goReset}
                  >
                    Forgot password?
                  </button>
                </div>

                {loginError && (
                  <div
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[12px] text-red-600 font-medium bg-red-50 border border-red-200"
                    style={{ animation: "lpFadeUp 0.25s cubic-bezier(.22,1,.36,1) both" }}
                  >
                    <AlertCircle size={13} />
                    {loginError}
                  </div>
                )}

                <div style={{ animation: "lpFadeUp 0.5s cubic-bezier(.22,1,.36,1) 0.32s both" }}>
                  <button
                    type="button"
                    onClick={handleLogin}
                    disabled={loading}
                    className="group w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm text-white transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
                    style={{
                      background: "linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)",
                      boxShadow: "0 4px 16px rgba(37,99,235,0.28)",
                    }}
                  >
                    {loading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <>
                        <span>Sign In</span>
                        <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* ════ RESET ════ */}
            {view === "reset" && (
              <div
                className="flex flex-col gap-4"
                style={{ animation: "lpFadeUp 0.5s cubic-bezier(.22,1,.36,1) 0.1s both" }}
              >
                <Field label="Registered Phone Number" error={errors.resetPhone}>
                  <Phone
                    size={14}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10"
                  />
                  <input
                    className={`${inputBase} ${errors.resetPhone ? inputErr : ""}`}
                    type="tel"
                    placeholder="+880 1XXX-XXXXXX"
                    value={resetPhone}
                    onChange={(e) => setResetPhone(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleReset()}
                    autoFocus
                  />
                </Field>

                <button
                  type="button"
                  onClick={handleReset}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm text-white transition-all duration-200 disabled:opacity-60 active:scale-[0.98]"
                  style={{
                    background: "linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)",
                    boxShadow: "0 4px 16px rgba(37,99,235,0.28)",
                  }}
                >
                  {loading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>
                      <Send size={13} />
                      <span>Send Reset Link</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className="flex items-center justify-center gap-1 text-[13px] text-gray-400 hover:text-gray-600 transition-colors font-medium"
                  onClick={goLogin}
                >
                  <ChevronLeft size={14} />
                  Back to Sign In
                </button>
              </div>
            )}

            {/* ════ SENT ════ */}
            {view === "sent" && (
              <div
                className="flex flex-col items-center gap-4 py-2"
                style={{ animation: "lpFadeUp 0.5s cubic-bezier(.22,1,.36,1) 0.1s both" }}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
                    border: "1.5px solid #bbf7d0",
                    animation: "lpPulse 2.2s ease infinite",
                  }}
                >
                  <CheckCircle2 size={26} color="#16a34a" strokeWidth={1.8} />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-[13px] text-slate-500">Reset link sent to</p>
                  <p className="text-[14px] font-bold text-slate-800">{resetPhone}</p>
                  <p className="text-[11.5px] text-gray-400 font-light mt-1">
                    Check your SMS inbox · Link expires in 15 min
                  </p>
                </div>
                <button
                  type="button"
                  className="flex items-center gap-1 text-[13px] text-gray-400 hover:text-gray-600 transition-colors font-medium"
                  onClick={goLogin}
                >
                  <ChevronLeft size={14} />
                  Back to Sign In
                </button>
              </div>
            )}
          </div>

          {/* ── Card footer ── */}
          <div className="flex items-center justify-between px-5 py-3 rounded-b-3xl border-t border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={12} className="text-blue-400" />
              <span className="text-[10.5px] text-gray-400 font-medium">256-bit encrypted</span>
            </div>
            <span className="text-[10.5px] text-gray-400">Authorized access only</span>
          </div>
        </div>

        {/* ── Bottom label ── */}
        <p
          className="text-center text-[11px] text-gray-300 font-medium mt-3 pb-4"
          style={{ animation: "lpFadeUp 0.5s cubic-bezier(.22,1,.36,1) 0.5s both" }}
        >
          LabPilot · Diagnostic Lab Management System
        </p>
      </div>

      <style>{`
        @keyframes lpFadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes lpPulse {
          0%, 100% { box-shadow: 0 0 0 6px rgba(34,197,94,0.08); }
          50%       { box-shadow: 0 0 0 12px rgba(34,197,94,0); }
        }
      `}</style>
    </div>
  );
}
