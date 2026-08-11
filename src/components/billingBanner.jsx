import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Wallet } from "lucide-react";
import { useAuthStore } from "../store/authStore";

const formatBDT = (amount) => (amount == null ? "" : `৳${Number(amount).toLocaleString("en-BD")}`);

const formatDate = (ms) =>
  ms == null ? "" : new Date(ms).toLocaleDateString("bn-BD", { day: "numeric", month: "short", year: "numeric" });

const BillingBanner = () => {
  const navigate = useNavigate();
  const billingStatus = useAuthStore((s) => s.billingStatus);
  const fetchBillingStatus = useAuthStore((s) => s.fetchBillingStatus);
  const user = useAuthStore((s) => s.user);

  // Seed on mount only — no polling interval. Live updates after this come
  // from the response-header interceptor on the user's normal API traffic.
  useEffect(() => {
    fetchBillingStatus();
  }, []);

  if (!billingStatus?.hasUnpaidBill) return null;

  const isOverdue = billingStatus.isOverdue;

  // "Pay now" only makes sense for people who can actually reach /billing —
  // that route is module-gated to "billing" (or admin) on the frontend, and
  // POST /billing/pay is gated to "manageBilling" on the backend. Everyone
  // else still sees the warning, just without an action they can't use.
  const canPay = user?.role === "admin" || user?.modules?.includes("billing");

  const palette = isOverdue
    ? {
        bg: "bg-red-50",
        border: "border-red-200",
        text: "text-red-700",
        icon: "text-red-500",
        btn: "bg-red-600 hover:bg-red-700",
      }
    : {
        bg: "bg-amber-50",
        border: "border-amber-200",
        text: "text-amber-700",
        icon: "text-amber-500",
        btn: "bg-amber-600 hover:bg-amber-700",
      };

  return (
    <div className={`font-noto ${palette.bg} border-b ${palette.border} px-4 py-2.5 print:hidden`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <AlertTriangle className={`w-4 h-4 shrink-0 ${palette.icon}`} />
          <p className={`text-sm font-medium ${palette.text} truncate`}>
            {isOverdue
              ? `পেমেন্টের সময়সীমা শেষ হয়ে গেছে — শেষ তারিখ ছিল ${formatDate(billingStatus.dueDate)}`
              : `আপনার একটি বিল বকেয়া আছে — পরিশোধের শেষ তারিখ ${formatDate(billingStatus.dueDate)}`}
            {billingStatus.amount != null && (
              <span className="ml-1 font-mono">({formatBDT(billingStatus.amount)})</span>
            )}
          </p>
        </div>

        {canPay && (
          <button
            onClick={() => navigate("/billing")}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white ${palette.btn} transition-colors`}
          >
            <Wallet className="w-3.5 h-3.5" />
            বিল পরিশোধ করুন
          </button>
        )}
      </div>
    </div>
  );
};

export default BillingBanner;
