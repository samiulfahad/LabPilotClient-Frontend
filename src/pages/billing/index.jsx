import { useState, useEffect, useCallback } from "react";
import {
  CreditCard,
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Receipt,
  Calendar,
  FileText,
  TrendingUp,
  Loader2,
} from "lucide-react";
import billingService from "../../api/billing";

// ─── Helpers ────────────────────────────────────────────────────────────────

const fmt = (n) =>
  new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    minimumFractionDigits: 2,
  }).format(n ?? 0);

const fmtDate = (ts) => {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("en-BD", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const fmtMonth = (ts) => {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("en-BD", {
    year: "numeric",
    month: "long",
  });
};

// ─── Status Badge ─────────────────────────────────────────────────────────────

const StatusBadge = ({ status, isOverdue }) => {
  if (status === "paid")
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="w-3 h-3" /> Paid
      </span>
    );
  if (isOverdue)
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
        <AlertTriangle className="w-3 h-3" /> Overdue
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
      <Clock className="w-3 h-3" /> Unpaid
    </span>
  );
};

// ─── Breakdown Table ──────────────────────────────────────────────────────────

const BreakdownTable = ({ breakdown, invoiceCount, totalAmount }) => {
  if (!breakdown || !Object.keys(breakdown).length) return null;

  const { monthlyFee = 0, perInvoiceFee = 0, commission = 0, perInvoiceNet = 0 } = breakdown;
  const count = invoiceCount ?? 0;

  const invoiceGross = perInvoiceFee * count;
  const commissionTotal = commission * count;
  const invoiceNet = perInvoiceNet * count;

  return (
    <div className="mt-3 rounded-xl border border-gray-200 overflow-hidden text-sm">
      {/* ── Section header ── */}
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5 flex items-center justify-between">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Charge Breakdown</span>
        <span className="text-xs text-gray-400">
          {count} invoice{count !== 1 ? "s" : ""} this month
        </span>
      </div>

      {/* ── Per-invoice calculation ── */}
      <div className="bg-white px-4 py-3 border-b border-gray-100">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2.5">Per Invoice Charges</p>

        {/* Invoice fee row */}
        <div className="flex items-center justify-between py-1.5">
          <div className="flex items-center gap-2 text-gray-700">
            <span className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
            Invoice fee
            <span className="text-xs text-gray-400 bg-gray-100 rounded-md px-1.5 py-0.5 font-mono">
              ৳{perInvoiceFee} × {count}
            </span>
          </div>
          <span className="font-semibold text-gray-900">৳{invoiceGross.toLocaleString()}</span>
        </div>

        {/* Commission deduction row */}
        <div className="flex items-center justify-between py-1.5">
          <div className="flex items-center gap-2 text-red-600">
            <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
            Commission deducted
            <span className="text-xs text-red-400 bg-red-50 rounded-md px-1.5 py-0.5 font-mono">
              ৳{commission} × {count}
            </span>
          </div>
          <span className="font-semibold text-red-600">− ৳{commissionTotal.toLocaleString()}</span>
        </div>

        {/* Net invoice charge */}
        <div className="mt-2 pt-2 border-t border-dashed border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-600">
            <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
            Net invoice charge
            <span className="text-xs text-gray-400 bg-gray-100 rounded-md px-1.5 py-0.5 font-mono">
              ৳{perInvoiceNet} × {count}
            </span>
          </div>
          <span className="font-semibold text-emerald-700">৳{invoiceNet.toLocaleString()}</span>
        </div>
      </div>

      {/* ── Monthly fee ── */}
      <div className="bg-white px-4 py-3 border-b border-gray-100">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2.5">Monthly Fixed Fee</p>
        <div className="flex items-center justify-between py-1.5">
          <div className="flex items-center gap-2 text-gray-700">
            <span className="w-2 h-2 rounded-full bg-indigo-400 flex-shrink-0" />
            Subscription fee
          </div>
          <span className="font-semibold text-gray-900">৳{monthlyFee.toLocaleString()}</span>
        </div>
      </div>

      {/* ── Total ── */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</p>
          <p className="text-[10px] text-gray-400 mt-0.5">
            Monthly fee ৳{monthlyFee.toLocaleString()} + Net invoices ৳{invoiceNet.toLocaleString()}
          </p>
        </div>
        <span className="text-lg font-bold text-blue-700">
          ৳{(totalAmount ?? monthlyFee + invoiceNet).toLocaleString()}
        </span>
      </div>
    </div>
  );
};

// ─── Current Bill Card ────────────────────────────────────────────────────────

const CurrentBillCard = ({ status, onPaySuccess }) => {
  const [paying, setPaying] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [payError, setPayError] = useState(null);

  if (!status) return null;

  if (!status.hasUnpaidBill) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-6 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
          <CheckCircle2 className="w-6 h-6 text-emerald-600" />
        </div>
        <div>
          <p className="font-semibold text-emerald-900">All Clear!</p>
          <p className="text-sm text-emerald-700 mt-0.5">No outstanding bills. You're fully up to date.</p>
        </div>
      </div>
    );
  }

  const { bill, isOverdue } = status;

  const handlePay = async () => {
    if (!window.confirm("Mark this bill as paid?")) return;
    setPaying(true);
    setPayError(null);
    try {
      await billingService.pay(bill.id);
      onPaySuccess();
    } catch (e) {
      setPayError(e?.error || "Payment failed. Please try again.");
    } finally {
      setPaying(false);
    }
  };

  return (
    <div
      className={`rounded-2xl border p-6 ${
        isOverdue
          ? "border-red-200 bg-gradient-to-br from-red-50 to-rose-50"
          : "border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
              isOverdue ? "bg-red-100" : "bg-amber-100"
            }`}
          >
            {isOverdue ? (
              <AlertTriangle className="w-6 h-6 text-red-600" />
            ) : (
              <AlertCircle className="w-6 h-6 text-amber-600" />
            )}
          </div>
          <div>
            <p className={`font-bold text-lg ${isOverdue ? "text-red-900" : "text-amber-900"}`}>
              {isOverdue ? "Overdue Bill" : "Pending Bill"}
            </p>
            <p className={`text-sm mt-0.5 ${isOverdue ? "text-red-700" : "text-amber-700"}`}>
              {fmtMonth(bill.billingPeriod)}
            </p>
          </div>
        </div>
        <StatusBadge status="unpaid" isOverdue={isOverdue} />
      </div>

      {/* Amounts */}
      <div className="mt-5 flex flex-wrap gap-6">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Due</p>
          <p className={`text-3xl font-bold mt-1 ${isOverdue ? "text-red-700" : "text-amber-700"}`}>
            {fmt(bill.amount)}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Due Date</p>
          <p className="text-base font-semibold text-gray-800 mt-1">{fmtDate(bill.dueDate)}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Invoices</p>
          <p className="text-base font-semibold text-gray-800 mt-1">{bill.invoiceCount ?? "—"}</p>
        </div>
      </div>

      {/* Breakdown toggle */}
      {bill.breakdown && Object.keys(bill.breakdown).length > 0 && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          {expanded ? "Hide" : "Show"} Breakdown
        </button>
      )}
      {expanded && (
        <BreakdownTable breakdown={bill.breakdown} invoiceCount={bill.invoiceCount} totalAmount={bill.amount} />
      )}

      {/* Pay error */}
      {payError && (
        <div className="mt-3 flex items-center gap-2 text-sm text-red-700 bg-red-100 border border-red-200 rounded-xl px-4 py-2.5">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {payError}
        </div>
      )}

      {/* Pay button */}
      <div className="mt-5">
        <button
          onClick={handlePay}
          disabled={paying}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-200 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {paying ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Processing…
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4" /> Mark as Paid
            </>
          )}
        </button>
        <p className="text-xs text-gray-400 mt-2">Payment gateway integration coming soon.</p>
      </div>
    </div>
  );
};

// ─── Desktop History Row ──────────────────────────────────────────────────────

const HistoryRow = ({ bill }) => {
  const [expanded, setExpanded] = useState(false);
  const isOverdue = bill.status === "unpaid" && Date.now() > bill.dueDate;

  return (
    <>
      <tr className="border-b border-gray-100 hover:bg-gray-50/60 transition-colors">
        <td className="px-5 py-4">
          <div className="font-medium text-gray-900 text-sm">{fmtMonth(bill.billingPeriodStart)}</div>
          <div className="text-xs text-gray-400 mt-0.5">
            {fmtDate(bill.billingPeriodStart)} — {fmtDate(bill.billingPeriodEnd)}
          </div>
        </td>
        <td className="px-5 py-4 text-sm font-semibold text-gray-900">{fmt(bill.totalAmount)}</td>
        <td className="px-5 py-4">
          <StatusBadge status={bill.status} isOverdue={isOverdue} />
        </td>
        <td className="px-5 py-4 text-sm text-gray-600">{fmtDate(bill.dueDate)}</td>
        <td className="px-5 py-4 text-sm text-gray-600">
          {bill.status === "paid" ? (
            <div>
              <div>{fmtDate(bill.paidAt)}</div>
              {bill.paidBy?.name && <div className="text-xs text-gray-400 mt-0.5">by {bill.paidBy.name}</div>}
            </div>
          ) : (
            "—"
          )}
        </td>
        <td className="px-5 py-4 text-center text-sm text-gray-500">{bill.invoiceCount ?? "—"}</td>
        <td className="px-5 py-4">
          {bill.breakdown && Object.keys(bill.breakdown).length > 0 && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              Details
            </button>
          )}
        </td>
      </tr>
      {expanded && (
        <tr className="bg-gray-50/80 border-b border-gray-100">
          <td colSpan={7} className="px-5 py-3">
            <BreakdownTable
              breakdown={bill.breakdown}
              invoiceCount={bill.invoiceCount}
              totalAmount={bill.totalAmount}
            />
          </td>
        </tr>
      )}
    </>
  );
};

// ─── Mobile History Card ──────────────────────────────────────────────────────

const HistoryCard = ({ bill }) => {
  const [expanded, setExpanded] = useState(false);
  const isOverdue = bill.status === "unpaid" && Date.now() > bill.dueDate;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-gray-900 text-sm">{fmtMonth(bill.billingPeriodStart)}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {fmtDate(bill.billingPeriodStart)} — {fmtDate(bill.billingPeriodEnd)}
          </p>
        </div>
        <StatusBadge status={bill.status} isOverdue={isOverdue} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Amount</p>
          <p className="text-sm font-bold text-gray-900 mt-0.5">{fmt(bill.totalAmount)}</p>
        </div>
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Due Date</p>
          <p className="text-sm text-gray-700 mt-0.5">{fmtDate(bill.dueDate)}</p>
        </div>
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Invoices</p>
          <p className="text-sm text-gray-700 mt-0.5">{bill.invoiceCount ?? "—"}</p>
        </div>
        {bill.status === "paid" && (
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Paid On</p>
            <p className="text-sm text-gray-700 mt-0.5">{fmtDate(bill.paidAt)}</p>
          </div>
        )}
      </div>

      {bill.breakdown && Object.keys(bill.breakdown).length > 0 && (
        <>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="mt-3 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {expanded ? "Hide" : "Show"} Breakdown
          </button>
          {expanded && (
            <BreakdownTable
              breakdown={bill.breakdown}
              invoiceCount={bill.invoiceCount}
              totalAmount={bill.totalAmount}
            />
          )}
        </>
      )}
    </div>
  );
};

// ─── Stats Strip ──────────────────────────────────────────────────────────────

const StatsStrip = ({ bills }) => {
  const paid = bills.filter((b) => b.status === "paid");
  const totalPaid = paid.reduce((s, b) => s + (b.totalAmount ?? 0), 0);
  const unpaidCount = bills.filter((b) => b.status === "unpaid").length;

  const stats = [
    { label: "Total Bills", value: bills.length, icon: FileText, color: "blue" },
    { label: "Paid", value: paid.length, icon: CheckCircle2, color: "emerald" },
    { label: "Unpaid", value: unpaidCount, icon: Clock, color: "amber" },
    { label: "Total Paid", value: fmt(totalPaid), icon: TrendingUp, color: "indigo" },
  ];

  const colorMap = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    indigo: "bg-indigo-50 text-indigo-600",
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map(({ label, value, icon: Icon, color }) => (
        <div key={label} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colorMap[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-xs text-gray-500 font-medium mt-1">{label}</p>
        </div>
      ))}
    </div>
  );
};

// ─── Main Billing Page ────────────────────────────────────────────────────────

const Billing = () => {
  const [status, setStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [histLoading, setHistLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadStatus = useCallback(async () => {
    setError(null);
    try {
      const data = await billingService.getStatus();
      setStatus(data);
    } catch {
      setError("Failed to load billing status.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    setHistLoading(true);
    try {
      const data = await billingService.getHistory();
      setHistory(data.bills ?? []);
    } catch {
      // history failing is non-fatal
    } finally {
      setHistLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
    loadHistory();
  }, [loadStatus, loadHistory]);

  const handlePaySuccess = () => {
    setLoading(true);
    loadStatus();
    loadHistory();
  };

  const handleRefresh = () => {
    setLoading(true);
    loadStatus();
    loadHistory();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ── Page Header ─────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/20">
                <Receipt className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
            </div>
            <p className="text-sm text-gray-500 ml-[52px]">Manage your lab's monthly bills and payment history</p>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 shadow-sm transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading || histLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* ── Error ───────────────────────────────────────────────── */}
        {error && (
          <div className="mb-6 flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl px-5 py-4 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* ── Current Bill ─────────────────────────────────────────── */}
        <section className="mb-8">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
            <CreditCard className="w-4 h-4" /> Current Bill
          </h2>
          {loading ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-8 flex items-center justify-center gap-3 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading billing status…</span>
            </div>
          ) : (
            <CurrentBillCard status={status} onPaySuccess={handlePaySuccess} />
          )}
        </section>

        {/* ── Overview Stats ────────────────────────────────────────── */}
        {!histLoading && history.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Overview — Last {history.length} months
            </h2>
            <StatsStrip bills={history} />
          </section>
        )}

        {/* ── Billing History ──────────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Billing History
          </h2>

          {histLoading ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-8 flex items-center justify-center gap-3 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading history…</span>
            </div>
          ) : history.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
              <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-400">No billing history yet</p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      {["Billing Period", "Amount", "Status", "Due Date", "Paid On", "Invoices", ""].map((h) => (
                        <th
                          key={h}
                          className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((bill) => (
                      <HistoryRow key={bill._id} bill={bill} />
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden space-y-3">
                {history.map((bill) => (
                  <HistoryCard key={bill._id} bill={bill} />
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default Billing;
