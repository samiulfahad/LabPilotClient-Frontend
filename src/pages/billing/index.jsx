import { useState, useEffect, useCallback } from "react";
import {
  CreditCard,
  Clock,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  FileText,
  TrendingUp,
  Calendar,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import billingService from "../../api/billing";


const fmt = {
  currency: (amount) =>
    new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount ?? 0),

  date: (ts) =>
    ts
      ? new Date(ts).toLocaleDateString("en-BD", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "—",

  period: (ts) =>
    ts
      ? new Date(ts).toLocaleDateString("en-BD", {
          year: "numeric",
          month: "long",
        })
      : "—",

  datetime: (ts) =>
    ts
      ? new Date(ts).toLocaleString("en-BD", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—",
};

// ─── Status Badge ────────────────────────────────────────────────────────────

const StatusBadge = ({ status, isOverdue }) => {
  if (status === "paid")
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
        <CheckCircle2 className="w-3 h-3" />
        Paid
      </span>
    );
  if (isOverdue)
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
        <AlertTriangle className="w-3 h-3" />
        Overdue
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
      <Clock className="w-3 h-3" />
      Unpaid
    </span>
  );
};

// ─── Breakdown Accordion ─────────────────────────────────────────────────────

const BreakdownAccordion = ({ breakdown }) => {
  const [open, setOpen] = useState(false);
  if (!breakdown || Object.keys(breakdown).length === 0) return null;

  const rows = [
    { label: "Monthly fee", value: breakdown.monthlyFee },
    { label: "Per-invoice fees", value: breakdown.perInvoiceFees },
    { label: "Commission deductions", value: breakdown.commissionDeductions },
    { label: "Other charges", value: breakdown.otherCharges },
  ].filter((r) => r.value != null && r.value !== 0);

  return (
    <div className="mt-3 border border-gray-200/80 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <span className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-500" />
          View charge breakdown
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>

      {open && (
        <div className="border-t border-gray-200/80 divide-y divide-gray-100">
          {rows.map((r) => (
            <div key={r.label} className="flex justify-between px-4 py-2.5 text-sm">
              <span className="text-gray-500">{r.label}</span>
              <span className="font-medium text-gray-800">{fmt.currency(r.value)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Current Bill Card ────────────────────────────────────────────────────────

const CurrentBillCard = ({ status, onPaySuccess }) => {
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState(null);

  if (!status?.hasUnpaidBill) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-6 flex items-start gap-4">
        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0 border border-green-200">
          <CheckCircle2 className="w-6 h-6 text-green-600" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-green-800">No outstanding balance</h3>
          <p className="text-sm text-green-700 mt-1">Your account is up to date. All bills have been paid.</p>
        </div>
      </div>
    );
  }

  const { bill, isOverdue } = status;

  const handlePay = async () => {
    setPaying(true);
    setError(null);
    try {
      await billingService.pay(bill.id);
      onPaySuccess();
    } catch (err) {
      setError(err?.response?.data?.error || "Payment failed. Please try again.");
    } finally {
      setPaying(false);
    }
  };

  return (
    <div
      className={`rounded-2xl border p-6 ${
        isOverdue ? "bg-red-50/60 border-red-200" : "bg-amber-50/60 border-amber-200"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="flex items-start gap-3">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border ${
              isOverdue ? "bg-red-100 border-red-200" : "bg-amber-100 border-amber-200"
            }`}
          >
            {isOverdue ? (
              <AlertTriangle className="w-6 h-6 text-red-600" />
            ) : (
              <Clock className="w-6 h-6 text-amber-600" />
            )}
          </div>
          <div>
            <h3 className={`text-base font-semibold ${isOverdue ? "text-red-800" : "text-amber-800"}`}>
              {isOverdue ? "Payment Overdue" : "Payment Due"}
            </h3>
            <p className={`text-sm mt-0.5 ${isOverdue ? "text-red-600" : "text-amber-600"}`}>
              Billing period: {fmt.period(bill.billingPeriod)}
            </p>
          </div>
        </div>
        <StatusBadge status="unpaid" isOverdue={isOverdue} />
      </div>

      {/* Amount + Meta */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
        <div className="bg-white/70 rounded-xl border border-white/80 px-4 py-3">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Amount Due</p>
          <p className="text-xl font-bold text-gray-900">{fmt.currency(bill.amount)}</p>
        </div>
        <div className="bg-white/70 rounded-xl border border-white/80 px-4 py-3">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Due Date</p>
          <p className={`text-sm font-semibold ${isOverdue ? "text-red-700" : "text-gray-800"}`}>
            {fmt.date(bill.dueDate)}
          </p>
        </div>
        <div className="bg-white/70 rounded-xl border border-white/80 px-4 py-3">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Invoices</p>
          <p className="text-sm font-semibold text-gray-800">{bill.invoiceCount ?? 0} invoices</p>
        </div>
      </div>

      {/* Breakdown */}
      <BreakdownAccordion breakdown={bill.breakdown} />

      {/* Error */}
      {error && (
        <div className="mt-3 flex items-center gap-2 text-sm text-red-700 bg-red-100 border border-red-200 rounded-xl px-4 py-3">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Pay Button */}
      <button
        onClick={handlePay}
        disabled={paying}
        className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-lg shadow-blue-200"
      >
        {paying ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4" />
            Mark as Paid — {fmt.currency(bill.amount)}
          </>
        )}
      </button>
    </div>
  );
};

// ─── History Row ─────────────────────────────────────────────────────────────

const HistoryRow = ({ bill }) => {
  const [expanded, setExpanded] = useState(false);
  const isOverdue = bill.status === "unpaid" && Date.now() > bill.dueDate;

  return (
    <>
      <tr className="hover:bg-gray-50/80 transition-colors cursor-pointer" onClick={() => setExpanded((v) => !v)}>
        <td className="px-4 py-3.5 text-sm text-gray-700 whitespace-nowrap">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            {fmt.period(bill.billingPeriodStart)}
          </div>
        </td>
        <td className="px-4 py-3.5 text-sm font-semibold text-gray-900 whitespace-nowrap">
          {fmt.currency(bill.totalAmount)}
        </td>
        <td className="px-4 py-3.5 whitespace-nowrap">
          <StatusBadge status={bill.status} isOverdue={isOverdue} />
        </td>
        <td className="px-4 py-3.5 text-sm text-gray-500 whitespace-nowrap hidden sm:table-cell">
          {fmt.date(bill.dueDate)}
        </td>
        <td className="px-4 py-3.5 text-sm text-gray-500 whitespace-nowrap hidden md:table-cell">
          {bill.invoiceCount ?? 0}
        </td>
        <td className="px-4 py-3.5 text-center">
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400 mx-auto" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400 mx-auto" />
          )}
        </td>
      </tr>

      {expanded && (
        <tr className="bg-gray-50/60">
          <td colSpan={6} className="px-4 pb-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {bill.breakdown && Object.keys(bill.breakdown).length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200/80 overflow-hidden">
                  <p className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
                    Charge breakdown
                  </p>
                  {[
                    { label: "Monthly fee", value: bill.breakdown.monthlyFee },
                    { label: "Per-invoice fees", value: bill.breakdown.perInvoiceFees },
                    { label: "Commission deductions", value: bill.breakdown.commissionDeductions },
                    { label: "Other charges", value: bill.breakdown.otherCharges },
                  ]
                    .filter((r) => r.value != null && r.value !== 0)
                    .map((r) => (
                      <div
                        key={r.label}
                        className="flex justify-between px-4 py-2 border-b border-gray-50 last:border-b-0"
                      >
                        <span className="text-gray-500">{r.label}</span>
                        <span className="font-medium text-gray-800">{fmt.currency(r.value)}</span>
                      </div>
                    ))}
                </div>
              )}

              <div className="bg-white rounded-xl border border-gray-200/80 overflow-hidden">
                <p className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
                  Details
                </p>
                <div className="divide-y divide-gray-50">
                  <div className="flex justify-between px-4 py-2">
                    <span className="text-gray-500">Period</span>
                    <span className="font-medium text-gray-800">
                      {fmt.date(bill.billingPeriodStart)} – {fmt.date(bill.billingPeriodEnd)}
                    </span>
                  </div>
                  {bill.status === "paid" && (
                    <>
                      <div className="flex justify-between px-4 py-2">
                        <span className="text-gray-500">Paid at</span>
                        <span className="font-medium text-gray-800">{fmt.datetime(bill.paidAt)}</span>
                      </div>
                      {bill.paidBy?.name && (
                        <div className="flex justify-between px-4 py-2">
                          <span className="text-gray-500">Paid by</span>
                          <span className="font-medium text-gray-800">{bill.paidBy.name}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

// ─── Main Billing Page ────────────────────────────────────────────────────────

const Billing = () => {
  const [status, setStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [statusError, setStatusError] = useState(null);
  const [historyError, setHistoryError] = useState(null);

  const fetchStatus = useCallback(async () => {
    setLoadingStatus(true);
    setStatusError(null);
    try {
      const res = await billingService.getStatus();
      setStatus(res.data);
    } catch {
      setStatusError("Failed to load billing status.");
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    setHistoryError(null);
    try {
      const res = await billingService.getHistory();
      setHistory(res.data.bills ?? []);
    } catch {
      setHistoryError("Failed to load billing history.");
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    fetchHistory();
  }, [fetchStatus, fetchHistory]);

  const handlePaySuccess = () => {
    fetchStatus();
    fetchHistory();
  };

  // ── Summary stats from history ────────────────────────────────────────────
  const totalPaid = history.filter((b) => b.status === "paid").reduce((s, b) => s + (b.totalAmount ?? 0), 0);

  const totalUnpaid = history.filter((b) => b.status === "unpaid").reduce((s, b) => s + (b.totalAmount ?? 0), 0);

  const paidCount = history.filter((b) => b.status === "paid").length;

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 leading-tight">Billing</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your subscription payments and view billing history</p>
        </div>
        <button
          onClick={() => {
            fetchStatus();
            fetchHistory();
          }}
          className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl border border-gray-200/80 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* ── Summary Stats ────────────────────────────────────────────────── */}
      {!loadingHistory && history.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          <div className="bg-gray-50 border border-gray-200/80 rounded-xl px-4 py-3">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Paid</p>
            <p className="text-lg font-bold text-green-700">{fmt.currency(totalPaid)}</p>
            <p className="text-xs text-gray-400 mt-0.5">{paidCount} bills settled</p>
          </div>
          <div className="bg-gray-50 border border-gray-200/80 rounded-xl px-4 py-3">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Outstanding</p>
            <p className={`text-lg font-bold ${totalUnpaid > 0 ? "text-red-600" : "text-gray-800"}`}>
              {fmt.currency(totalUnpaid)}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{history.filter((b) => b.status === "unpaid").length} unpaid</p>
          </div>
          <div className="bg-gray-50 border border-gray-200/80 rounded-xl px-4 py-3 col-span-2 sm:col-span-1">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">History</p>
            <p className="text-lg font-bold text-gray-800">{history.length}</p>
            <p className="text-xs text-gray-400 mt-0.5">months on record</p>
          </div>
        </div>
      )}

      {/* ── Current Bill ─────────────────────────────────────────────────── */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-blue-500" />
          Current Bill
        </h2>

        {loadingStatus ? (
          <div className="flex items-center justify-center py-12 bg-gray-50 rounded-2xl border border-gray-200/80">
            <Loader2 className="w-5 h-5 animate-spin text-blue-500 mr-2" />
            <span className="text-sm text-gray-500">Loading billing status...</span>
          </div>
        ) : statusError ? (
          <div className="flex items-center gap-3 px-5 py-4 bg-red-50 border border-red-200 rounded-2xl">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800">{statusError}</p>
              <button onClick={fetchStatus} className="text-xs text-red-600 hover:underline mt-0.5">
                Try again
              </button>
            </div>
          </div>
        ) : (
          <CurrentBillCard status={status} onPaySuccess={handlePaySuccess} />
        )}
      </div>

      {/* ── Billing History ───────────────────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-500" />
          Billing History
          {!loadingHistory && (
            <span className="ml-1 text-xs font-normal text-gray-400 normal-case">(last 24 months)</span>
          )}
        </h2>

        {loadingHistory ? (
          <div className="flex items-center justify-center py-12 bg-gray-50 rounded-2xl border border-gray-200/80">
            <Loader2 className="w-5 h-5 animate-spin text-blue-500 mr-2" />
            <span className="text-sm text-gray-500">Loading history...</span>
          </div>
        ) : historyError ? (
          <div className="flex items-center gap-3 px-5 py-4 bg-red-50 border border-red-200 rounded-2xl">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800">{historyError}</p>
              <button onClick={fetchHistory} className="text-xs text-red-600 hover:underline mt-0.5">
                Try again
              </button>
            </div>
          </div>
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <FileText className="w-8 h-8 text-gray-300 mb-3" />
            <p className="text-sm font-medium text-gray-500">No billing history yet</p>
            <p className="text-xs text-gray-400 mt-1">Bills will appear here once generated</p>
          </div>
        ) : (
          <div className="border border-gray-200/80 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200/80">
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Period</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">
                      Due Date
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">
                      Invoices
                    </th>
                    <th className="px-4 py-3 w-8" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {history.map((bill) => (
                    <HistoryRow key={bill._id} bill={bill} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Billing;
