import { useState, useEffect } from "react";
import {
  CreditCard,
  Clock,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  FileText,
  Calendar,
  ChevronDown,
  ChevronUp,
  Loader2,
  Banknote,
  Receipt,
  BadgePercent,
  Wallet,
  ArrowUpRight,
  Sparkles,
  TrendingUp,
  Shield,
  Activity,
} from "lucide-react";
import billingService from "../../api/billing";

// ─── Format helpers ───────────────────────────────────────────────────────────

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

// ─── Skeleton primitives ──────────────────────────────────────────────────────

const Shimmer = ({ className = "" }) => (
  <div className={`animate-pulse bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 rounded-lg ${className}`} />
);

const StatusBillSkeleton = () => (
  <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-5">
    <div className="flex items-start justify-between">
      <div className="flex items-start gap-4">
        <Shimmer className="w-14 h-14 rounded-2xl" />
        <div className="space-y-2 pt-1">
          <Shimmer className="w-40 h-4" />
          <Shimmer className="w-28 h-3" />
        </div>
      </div>
      <Shimmer className="w-24 h-7 rounded-full" />
    </div>
    <div className="grid grid-cols-3 gap-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="border border-slate-100 rounded-xl p-4 space-y-2">
          <Shimmer className="w-16 h-2.5" />
          <Shimmer className="w-24 h-5" />
        </div>
      ))}
    </div>
    <Shimmer className="w-full h-12 rounded-xl" />
  </div>
);

const HistoryRowSkeleton = () => (
  <tr>
    <td className="px-6 py-4">
      <div className="flex items-center gap-2">
        <Shimmer className="w-4 h-4 rounded" />
        <Shimmer className="w-28 h-3.5" />
      </div>
    </td>
    <td className="px-6 py-4">
      <Shimmer className="w-24 h-3.5" />
    </td>
    <td className="px-6 py-4">
      <Shimmer className="w-20 h-6 rounded-full" />
    </td>
    <td className="px-6 py-4 hidden sm:table-cell">
      <Shimmer className="w-24 h-3.5" />
    </td>
    <td className="px-6 py-4 hidden md:table-cell">
      <Shimmer className="w-10 h-3.5" />
    </td>
    <td className="px-6 py-4">
      <Shimmer className="w-4 h-4 mx-auto rounded" />
    </td>
  </tr>
);

const SummarySkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
    {[1, 2, 3].map((i) => (
      <div key={i} className="bg-white border border-slate-100 rounded-2xl px-5 py-5 space-y-3 shadow-sm">
        <Shimmer className="w-20 h-3" />
        <Shimmer className="w-32 h-7" />
        <Shimmer className="w-24 h-3" />
      </div>
    ))}
  </div>
);

// ─── Status Badge ─────────────────────────────────────────────────────────────

const StatusBadge = ({ status, isOverdue }) => {
  if (status === "paid")
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
        Paid
      </span>
    );
  if (isOverdue)
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block animate-pulse" />
        Overdue
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
      Unpaid
    </span>
  );
};

// ─── Breakdown Accordion ──────────────────────────────────────────────────────

const BreakdownAccordion = ({ breakdown }) => {
  const [open, setOpen] = useState(false);
  if (!breakdown) return null;

  return (
    <div className="mt-4 border border-slate-100 rounded-xl overflow-hidden bg-slate-50/50">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-widest hover:bg-white/70 transition-colors"
      >
        <span>Charge Breakdown</span>
        {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {open && (
        <div className="border-t border-slate-100 bg-white divide-y divide-slate-50 px-4 py-1">
          {breakdown.monthlyFee != null && (
            <BreakdownRow
              icon={Banknote}
              label="Monthly Platform Fee"
              desc="Fixed SaaS subscription"
              value={fmt.currency(breakdown.monthlyFee)}
              color="text-blue-500"
            />
          )}
          {(breakdown.perInvoiceNet != null || breakdown.perInvoiceFees != null) && (
            <BreakdownRow
              icon={Receipt}
              label="Per-Invoice Net Fee"
              desc={`৳${breakdown.perInvoiceNet ?? breakdown.perInvoiceFees} per invoice`}
              value={
                breakdown.perInvoiceNet != null
                  ? fmt.currency(breakdown.perInvoiceNet * (breakdown.invoiceCount ?? 0))
                  : fmt.currency(breakdown.perInvoiceFees)
              }
              color="text-violet-500"
            />
          )}
          {breakdown.perInvoiceFee != null && (
            <BreakdownRow
              icon={Wallet}
              label="Per-Invoice Charge (Patient)"
              desc="Fee collected from patient"
              value={`৳${breakdown.perInvoiceFee}/inv`}
              color="text-slate-400"
            />
          )}
          {breakdown.commission != null && (
            <BreakdownRow
              icon={BadgePercent}
              label="Your Commission (Lab Earns)"
              desc={`৳${breakdown.commission} per invoice`}
              value={`+৳${breakdown.commission}/inv`}
              color="text-emerald-500"
              positive
            />
          )}
          {breakdown.otherCharges != null && breakdown.otherCharges !== 0 && (
            <BreakdownRow
              icon={ArrowUpRight}
              label="Other Charges"
              desc=""
              value={fmt.currency(breakdown.otherCharges)}
              color="text-rose-500"
            />
          )}
        </div>
      )}
    </div>
  );
};

const BreakdownRow = ({ icon: Icon, label, desc, value, color, positive }) => (
  <div className="flex items-center justify-between py-3 gap-3">
    <div className="flex items-start gap-3">
      <div className={`mt-0.5 ${color}`}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-700">{label}</p>
        {desc && <p className="text-[10px] text-slate-400 mt-0.5">{desc}</p>}
      </div>
    </div>
    <span className={`text-xs font-bold tabular-nums ${positive ? "text-emerald-600" : "text-slate-800"}`}>
      {value}
    </span>
  </div>
);

// ─── Current Bill Card ────────────────────────────────────────────────────────

const CurrentBillCard = ({ status, onPaySuccess }) => {
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState(null);

  if (!status?.hasUnpaidBill) {
    return (
      <div className="relative overflow-hidden bg-white border border-emerald-100 rounded-2xl p-6 shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/60 via-white to-teal-50/40 pointer-events-none" />
        <div className="relative flex items-center gap-4">
          <div className="w-14 h-14 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm">
            <CheckCircle2 className="w-7 h-7 text-emerald-500" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-bold text-slate-800">All Settled</h3>
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Your account has no outstanding balance. All bills have been paid.
            </p>
          </div>
          <div className="hidden sm:flex flex-col items-end gap-1">
            <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Status</span>
            <StatusBadge status="paid" />
          </div>
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

  const isOD = isOverdue;

  return (
    <div
      className={`relative overflow-hidden bg-white border rounded-2xl shadow-sm ${isOD ? "border-red-200" : "border-amber-200"}`}
    >
      {/* Subtle gradient accent strip at top */}
      <div
        className={`h-1 w-full ${isOD ? "bg-gradient-to-r from-red-400 to-rose-500" : "bg-gradient-to-r from-amber-400 to-orange-400"}`}
      />

      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-start gap-4">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 border shadow-sm ${isOD ? "bg-red-50 border-red-100" : "bg-amber-50 border-amber-100"}`}
            >
              {isOD ? <AlertTriangle className="w-6 h-6 text-red-500" /> : <Clock className="w-6 h-6 text-amber-500" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 mb-0.5">{isOD ? "Payment Overdue" : "Payment Due"}</h3>
              <p className="text-xs text-slate-400 font-medium">Billing period: {fmt.period(bill.billingPeriod)}</p>
            </div>
          </div>
          <StatusBadge status="unpaid" isOverdue={isOD} />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <MetaCell label="Amount Due" value={fmt.currency(bill.amount)} highlight />
          <MetaCell label="Due Date" value={fmt.date(bill.dueDate)} warn={isOD} />
          <MetaCell label="Invoices" value={`${bill.invoiceCount ?? 0}`} />
        </div>

        <BreakdownAccordion breakdown={{ ...bill.breakdown, invoiceCount: bill.invoiceCount }} />

        {error && (
          <div className="mt-4 flex items-center gap-2.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
            {error}
          </div>
        )}

        <button
          onClick={handlePay}
          disabled={paying}
          className="mt-5 w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-sm font-bold text-white bg-slate-900 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.99] shadow-lg shadow-slate-900/15"
        >
          {paying ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Processing...
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4" /> Mark as Paid — {fmt.currency(bill.amount)}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

const MetaCell = ({ label, value, highlight, warn }) => (
  <div className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-3.5">
    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{label}</p>
    <p
      className={`text-sm font-bold truncate ${highlight ? "text-slate-900" : warn ? "text-red-600" : "text-slate-700"}`}
    >
      {value}
    </p>
  </div>
);

// ─── History Row ──────────────────────────────────────────────────────────────

const HistoryRow = ({ bill }) => {
  const [expanded, setExpanded] = useState(false);
  const isOverdue = bill.status === "unpaid" && Date.now() > bill.dueDate;

  return (
    <>
      <tr className="hover:bg-blue-50/30 transition-colors cursor-pointer group" onClick={() => setExpanded((v) => !v)}>
        <td className="px-6 py-4 text-sm text-slate-700 whitespace-nowrap">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-3.5 h-3.5 text-slate-300 flex-shrink-0 group-hover:text-blue-400 transition-colors" />
            <span className="font-semibold text-slate-700">{fmt.period(bill.billingPeriodStart)}</span>
          </div>
        </td>
        <td className="px-6 py-4 text-sm font-bold text-slate-900 whitespace-nowrap tabular-nums">
          {fmt.currency(bill.totalAmount)}
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <StatusBadge status={bill.status} isOverdue={isOverdue} />
        </td>
        <td className="px-6 py-4 text-xs text-slate-400 whitespace-nowrap hidden sm:table-cell font-medium">
          {fmt.date(bill.dueDate)}
        </td>
        <td className="px-6 py-4 text-xs text-slate-400 whitespace-nowrap hidden md:table-cell font-medium tabular-nums">
          {bill.invoiceCount ?? 0}
        </td>
        <td className="px-6 py-4 text-center">
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-slate-300 mx-auto group-hover:text-blue-400 transition-colors" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-300 mx-auto group-hover:text-blue-400 transition-colors" />
          )}
        </td>
      </tr>

      {expanded && (
        <tr className="bg-slate-50/60">
          <td colSpan={6} className="px-6 pb-5 pt-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {bill.breakdown && (
                <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                  <p className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                    Charge Breakdown
                  </p>
                  <div className="px-4 divide-y divide-slate-50">
                    {bill.breakdown.monthlyFee != null && (
                      <SimpleRow label="Monthly Fee" value={fmt.currency(bill.breakdown.monthlyFee)} />
                    )}
                    {bill.breakdown.perInvoiceNet != null && (
                      <SimpleRow
                        label={`Net Invoice Fee (৳${bill.breakdown.perInvoiceNet} × ${bill.invoiceCount})`}
                        value={fmt.currency(bill.breakdown.perInvoiceNet * (bill.invoiceCount ?? 0))}
                      />
                    )}
                    {bill.breakdown.perInvoiceFee != null && (
                      <SimpleRow label="Patient Charge/Invoice" value={`৳${bill.breakdown.perInvoiceFee}`} />
                    )}
                    {bill.breakdown.commission != null && (
                      <SimpleRow label="Commission/Invoice" value={`৳${bill.breakdown.commission}`} positive />
                    )}
                    {bill.breakdown.otherCharges != null && bill.breakdown.otherCharges !== 0 && (
                      <SimpleRow label="Other Charges" value={fmt.currency(bill.breakdown.otherCharges)} />
                    )}
                  </div>
                </div>
              )}

              <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                <p className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                  Details
                </p>
                <div className="px-4 divide-y divide-slate-50">
                  <SimpleRow
                    label="Period"
                    value={`${fmt.date(bill.billingPeriodStart)} – ${fmt.date(bill.billingPeriodEnd)}`}
                  />
                  {bill.status === "paid" && (
                    <>
                      <SimpleRow label="Paid at" value={fmt.datetime(bill.paidAt)} />
                      {bill.paidBy?.name && <SimpleRow label="Paid by" value={bill.paidBy.name} />}
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

const SimpleRow = ({ label, value, positive }) => (
  <div className="flex justify-between py-3 gap-4">
    <span className="text-xs text-slate-400 shrink-0 font-medium">{label}</span>
    <span className={`text-xs font-semibold text-right ${positive ? "text-emerald-600" : "text-slate-700"}`}>
      {value}
    </span>
  </div>
);

// ─── Main Billing Page ────────────────────────────────────────────────────────

const Billing = () => {
  const [status, setStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [statusError, setStatusError] = useState(null);
  const [historyError, setHistoryError] = useState(null);

  const fetchStatus = async () => {
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
  };

  const fetchHistory = async () => {
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
  };

  useEffect(() => {
    fetchStatus();
    fetchHistory();
  }, []);

  const handlePaySuccess = () => {
    fetchStatus();
    fetchHistory();
  };

  const handleRefresh = () => {
    fetchStatus();
    fetchHistory();
  };

  const totalPaid = history.filter((b) => b.status === "paid").reduce((s, b) => s + (b.totalAmount ?? 0), 0);
  const totalUnpaid = history.filter((b) => b.status === "unpaid").reduce((s, b) => s + (b.totalAmount ?? 0), 0);
  const paidCount = history.filter((b) => b.status === "paid").length;
  const unpaidCount = history.filter((b) => b.status === "unpaid").length;

  return (
    <div className="min-h-full bg-slate-50/50">
      {/* ── Page Header ── */}
      <div className="bg-white border-b border-slate-100 px-6 py-5 sticky top-0 z-10 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm shadow-blue-500/30 flex-shrink-0">
              <CreditCard className="w-4.5 h-4.5 text-white w-[18px] h-[18px]" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-none mb-0.5">Billing</h1>
              <p className="text-xs text-slate-400 font-medium">Subscription & payment management</p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loadingStatus || loadingHistory}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl border border-slate-200 transition-all disabled:opacity-40 group"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 group-hover:text-blue-500 transition-colors ${loadingStatus || loadingHistory ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* ── Summary Stats ── */}
        {loadingHistory ? (
          <SummarySkeleton />
        ) : (
          history.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <SummaryCard
                icon={TrendingUp}
                label="Total Paid"
                value={fmt.currency(totalPaid)}
                sub={`${paidCount} bill${paidCount !== 1 ? "s" : ""} settled`}
                accent="emerald"
              />
              <SummaryCard
                icon={Activity}
                label="Outstanding"
                value={fmt.currency(totalUnpaid)}
                sub={`${unpaidCount} unpaid`}
                accent={totalUnpaid > 0 ? "red" : "slate"}
              />
              <SummaryCard
                icon={Shield}
                label="Billing History"
                value={String(history.length)}
                sub="months on record"
                accent="blue"
              />
            </div>
          )
        )}

        {/* ── Current Bill ── */}
        <Section icon={CreditCard} label="Current Bill">
          {loadingStatus ? (
            <StatusBillSkeleton />
          ) : statusError ? (
            <ErrorCard message={statusError} onRetry={fetchStatus} />
          ) : (
            <CurrentBillCard status={status} onPaySuccess={handlePaySuccess} />
          )}
        </Section>

        {/* ── Billing History ── */}
        <Section icon={FileText} label="Billing History" badge={!loadingHistory ? `${history.length} records` : null}>
          {loadingHistory ? (
            <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100">
                      {["Period", "Amount", "Status", "Due Date", "Invoices", ""].map((h, i) => (
                        <th
                          key={i}
                          className={`px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest ${i >= 3 && i < 5 ? "hidden sm:table-cell" : ""}`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {[1, 2, 3, 4].map((i) => (
                      <HistoryRowSkeleton key={i} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : historyError ? (
            <ErrorCard message={historyError} onRetry={fetchHistory} />
          ) : history.length === 0 ? (
            <EmptyState icon={FileText} title="No billing history yet" desc="Bills will appear here once generated" />
          ) : (
            <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100">
                      <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        Period
                      </th>
                      <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        Amount
                      </th>
                      <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        Status
                      </th>
                      <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest hidden sm:table-cell">
                        Due Date
                      </th>
                      <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest hidden md:table-cell">
                        Invoices
                      </th>
                      <th className="px-6 py-4 w-12" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/70">
                    {history.map((bill) => (
                      <HistoryRow key={bill._id} bill={bill} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Section>
      </div>
    </div>
  );
};

// ─── Shared layout primitives ─────────────────────────────────────────────────

const Section = ({ icon: Icon, label, badge, children }) => (
  <div className="mb-8">
    <div className="flex items-center gap-2 mb-3">
      <Icon className="w-3.5 h-3.5 text-slate-400" />
      <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</h2>
      {badge && (
        <span className="ml-1 text-[9px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </div>
    {children}
  </div>
);

const accentMap = {
  emerald: { text: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100", icon: "text-emerald-500" },
  red: { text: "text-red-600", bg: "bg-red-50", border: "border-red-100", icon: "text-red-500" },
  blue: { text: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100", icon: "text-blue-500" },
  slate: { text: "text-slate-800", bg: "bg-slate-50", border: "border-slate-100", icon: "text-slate-400" },
};

const SummaryCard = ({ icon: Icon, label, value, sub, accent = "slate" }) => {
  const a = accentMap[accent];
  return (
    <div className="bg-white border border-slate-100 rounded-2xl px-5 py-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        <div className={`w-7 h-7 ${a.bg} ${a.border} border rounded-lg flex items-center justify-center`}>
          <Icon className={`w-3.5 h-3.5 ${a.icon}`} />
        </div>
      </div>
      <p className={`text-xl font-black ${a.text} leading-none mb-1.5 tabular-nums`}>{value}</p>
      <p className="text-[10px] text-slate-400 font-medium">{sub}</p>
    </div>
  );
};

const ErrorCard = ({ message, onRetry }) => (
  <div className="flex items-center gap-3.5 px-5 py-4 bg-red-50 border border-red-100 rounded-2xl">
    <div className="w-9 h-9 bg-red-100 border border-red-200 rounded-xl flex items-center justify-center flex-shrink-0">
      <AlertTriangle className="w-4 h-4 text-red-500" />
    </div>
    <div>
      <p className="text-sm font-semibold text-red-700">{message}</p>
      <button onClick={onRetry} className="text-xs text-red-500 hover:text-red-600 hover:underline mt-0.5 font-medium">
        Try again
      </button>
    </div>
  </div>
);

const EmptyState = ({ icon: Icon, title, desc }) => (
  <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
    <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mb-4">
      <Icon className="w-6 h-6 text-slate-300" />
    </div>
    <p className="text-sm font-bold text-slate-400">{title}</p>
    <p className="text-xs text-slate-300 mt-1">{desc}</p>
  </div>
);

export default Billing;
