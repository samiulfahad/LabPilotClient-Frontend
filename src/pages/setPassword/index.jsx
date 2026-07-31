// pages/SetPassword.jsx
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import api from "../../api/baseAPI";
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, XCircle } from "lucide-react";

export default function SetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const navigate = useNavigate();

  const [status, setStatus] = useState("checking"); // checking | valid | invalid | done
  const [staffName, setStaffName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }
    api
      .get(`/set-password/verify/${token}`)
      .then((res) => {
        setStaffName(res.data.name);
        setStatus("valid");
      })
      .catch(() => setStatus("invalid"));
  }, [token]);

  const handleSubmit = async () => {
    if (password.length < 6) return setError("Password must be at least 6 characters");
    if (password !== confirmPassword) return setError("Passwords do not match");
    setError("");
    setLoading(true);
    try {
      await api.post("/set-password", { token, newPassword: password });
      setStatus("done");
    } catch (err) {
      setError(err?.response?.data?.error || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 h-[100dvh] w-full flex items-center justify-center px-2 py-4 sm:p-6"
      style={{ background: "linear-gradient(145deg, #f0f4ff 0%, #f0f1f7 40%, #e8f5ff 100%)" }}
    >
      <div className="relative z-10 w-full max-w-[420px] bg-white/85 backdrop-blur-md border border-gray-200/80 rounded-3xl shadow-lg px-4 sm:px-7 py-8">
        {status === "checking" && (
          <div className="flex flex-col items-center gap-3 py-10">
            <Loader2 size={22} className="animate-spin text-blue-500" />
            <p className="text-sm text-gray-400">Verifying your link…</p>
          </div>
        )}

        {status === "invalid" && (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <div className="w-14 h-14 rounded-3xl flex items-center justify-center bg-red-50 border border-red-100">
              <XCircle size={26} color="#dc2626" />
            </div>
            <h2 className="text-lg font-black text-gray-900">Link expired or invalid</h2>
            <p className="text-sm text-slate-500">Ask your lab admin to resend your password setup link.</p>
            <Link to="/login" className="text-sm font-semibold text-blue-600">
              Back to Sign In
            </Link>
          </div>
        )}

        {status === "valid" && (
          <div className="flex flex-col gap-4">
            <div className="text-center mb-1">
              <h1 className="text-[22px] font-black text-gray-900">Set your password</h1>
              <p className="text-sm text-gray-400 mt-1">
                Welcome{staffName ? `, ${staffName}` : ""} — choose a password to activate your account
              </p>
            </div>

            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showPw ? "text" : "password"}
                placeholder="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-50/70 border border-gray-200/80 rounded-2xl py-3 pl-11 pr-11 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100/60"
              />
              <button
                type="button"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                onClick={() => setShowPw((p) => !p)}
              >
                {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>

            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showPw ? "text" : "password"}
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                className="w-full bg-gray-50/70 border border-gray-200/80 rounded-2xl py-3 pl-11 pr-4 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100/60"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 justify-center px-3 py-2.5 rounded-2xl text-[12.5px] text-red-600 bg-red-50 border border-red-200">
                <AlertCircle size={13} />
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all disabled:opacity-60"
            >
              {loading ? <Loader2 size={17} className="animate-spin mx-auto" /> : "Set Password & Continue"}
            </button>
          </div>
        )}

        {status === "done" && (
          <div className="flex flex-col items-center gap-6 py-4 text-center">
            <div className="w-16 h-16 rounded-3xl flex items-center justify-center bg-emerald-50 border border-emerald-100">
              <CheckCircle2 size={28} color="#16a34a" />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900">Password set!</h2>
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
      </div>
    </div>
  );
}
