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
  <div
    className={`animate-pulse bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 bg-[length:400%_100%] rounded-lg ${className}`}
    style={{ animation: "shimmer 1.6s ease-in-out infinite", backgroundSize: "400% 100%" }}
  />
);

const StatusBillSkeleton = () => (
  <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-4">
    <div className="flex items-start justify-between">
      <div className="flex items-start gap-3">
        <Shimmer className="w-12 h-12 rounded-xl" />
        <div className="space-y-2">
          <Shimmer className="w-36 h-4" />
          <Shimmer className="w-24 h-3" />
        </div>
      </div>
      <Shimmer className="w-20 h-7 rounded-full" />
    </div>
    <div className="grid grid-cols-3 gap-3 pt-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="border border-slate-100 rounded-xl p-3 space-y-2">
          <Shimmer className="w-16 h-2.5" />
          <Shimmer className="w-24 h-5" />
        </div>
      ))}
    </div>
    <Shimmer className="w-full h-11 rounded-xl" />
  </div>
);

const HistoryRowSkeleton = () => (
  <tr>
    <td className="px-5 py-4">
      <div className="flex items-center gap-2">
        <Shimmer className="w-3.5 h-3.5 rounded" />
        <Shimmer className="w-24 h-3.5" />
      </div>
    </td>
    <td className="px-5 py-4">
      <Shimmer className="w-20 h-3.5" />
    </td>
    <td className="px-5 py-4">
      <Shimmer className="w-16 h-6 rounded-full" />
    </td>
    <td className="px-5 py-4 hidden sm:table-cell">
      <Shimmer className="w-20 h-3.5" />
    </td>
    <td className="px-5 py-4 hidden md:table-cell">
      <Shimmer className="w-8 h-3.5" />
    </td>
    <td className="px-5 py-4">
      <Shimmer className="w-4 h-4 mx-auto rounded" />
    </td>
  </tr>
);

const SummarySkeleton = () => (
  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-7">
    {[1, 2, 3].map((i) => (
      <div key={i} className="bg-white border border-slate-100 rounded-2xl px-4 py-4 space-y-2 shadow-sm">
        <Shimmer className="w-16 h-2.5" />
        <Shimmer className="w-28 h-6" />
        <Shimmer className="w-20 h-2.5" />
      </div>
    ))}
  </div>
);

// ─── Status Badge ─────────────────────────────────────────────────────────────

const StatusBadge = ({ status, isOverdue }) => {
  if (status === "paid")
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 ring-1 ring-emerald-100">
        <CheckCircle2 className="w-3 h-3" /> Paid
      </span>
    );
  if (isOverdue)
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200 ring-1 ring-red-100">
        <AlertTriangle className="w-3 h-3" /> Overdue
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 ring-1 ring-amber-100">
      <Clock className="w-3 h-3" /> Unpaid
    </span>
  );
};

// ─── Breakdown Accordion (updated schema) ────────────────────────────────────

const BreakdownAccordion = ({ breakdown }) => {
  const [open, setOpen] = useState(false);
  if (!breakdown) return null;

  const rows = [
    {
      label: "Monthly Platform Fee",
      desc: "Fixed SaaS subscription",
      value: breakdown.monthlyFee,
      icon: Banknote,
      color: "text-blue-600",
    },
    {
      label: "Per-Invoice Fee (Net)",
      desc: `${breakdown.perInvoiceNet ?? breakdown.perInvoiceFees ?? 0} ৳ × invoices charged to software`,
      value:
        breakdown.perInvoiceNet != null
          ? breakdown.perInvoiceNet * (breakdown.invoiceCount ?? 0)
          : breakdown.perInvoiceFees,
      icon: Receipt,
      color: "text-violet-600",
    },
    {
      label: "Commission Earned",
      desc: "Your revenue from per-invoice fees",
      value: breakdown.commission != null ? undefined : breakdown.commissionDeductions,
      rawLabel: breakdown.commission != null ? `৳${breakdown.commission ?? 0}/invoice` : null,
      icon: BadgePercent,
      color: "text-emerald-600",
      isPositive: true,
    },
  ].filter((r) => r.value != null || r.rawLabel);

  return (
    <div className="mt-4 border border-slate-100 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
      >
        <span className="flex items-center gap-2 text-xs uppercase tracking-widest text-slate-400 font-bold">
          View charge breakdown
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>

      {open && (
        <div className="border-t border-slate-100 divide-y divide-slate-50 px-4 py-1">
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
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-6 flex items-start gap-4 shadow-sm">
        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0 border border-emerald-100 shadow-sm">
          <CheckCircle2 className="w-6 h-6 text-emerald-500" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-emerald-800">No outstanding balance</h3>
          <p className="text-xs text-emerald-600 mt-1 leading-relaxed">
            Your account is fully settled. All bills have been paid.
          </p>
        </div>
        <Sparkles className="w-4 h-4 text-emerald-300 ml-auto mt-1 shrink-0" />
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

  const accent = isOverdue
    ? {
        bg: "from-red-50 to-rose-50",
        border: "border-red-100",
        icon: "bg-red-100 border-red-100",
        iconColor: "text-red-500",
        text: "text-red-800",
        sub: "text-red-500",
      }
    : {
        bg: "from-amber-50 to-orange-50",
        border: "border-amber-100",
        icon: "bg-amber-100 border-amber-100",
        iconColor: "text-amber-600",
        text: "text-amber-800",
        sub: "text-amber-600",
      };

  return (
    <div className={`bg-gradient-to-br ${accent.bg} border ${accent.border} rounded-2xl p-6 shadow-sm`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="flex items-start gap-3">
          <div className={`w-12 h-12 rounded-xl ${accent.icon} flex items-center justify-center flex-shrink-0 border`}>
            {isOverdue ? (
              <AlertTriangle className={`w-6 h-6 ${accent.iconColor}`} />
            ) : (
              <Clock className={`w-6 h-6 ${accent.iconColor}`} />
            )}
          </div>
          <div>
            <h3 className={`text-sm font-bold ${accent.text}`}>{isOverdue ? "Payment Overdue" : "Payment Due"}</h3>
            <p className={`text-xs mt-0.5 ${accent.sub}`}>Billing period: {fmt.period(bill.billingPeriod)}</p>
          </div>
        </div>
        <StatusBadge status="unpaid" isOverdue={isOverdue} />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <MetaCell label="Amount Due" value={fmt.currency(bill.amount)} highlight />
        <MetaCell label="Due Date" value={fmt.date(bill.dueDate)} warn={isOverdue} />
        <MetaCell label="Invoices" value={`${bill.invoiceCount ?? 0}`} />
      </div>

      <BreakdownAccordion breakdown={{ ...bill.breakdown, invoiceCount: bill.invoiceCount }} />

      {error && (
        <div className="mt-3 flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
          {error}
        </div>
      )}

      <button
        onClick={handlePay}
        disabled={paying}
        className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-white bg-slate-900 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.99] shadow-lg shadow-slate-900/20"
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
  );
};

const MetaCell = ({ label, value, highlight, warn }) => (
  <div className="bg-white/70 rounded-xl border border-white px-3 py-3 backdrop-blur-sm">
    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
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
      <tr
        className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
        onClick={() => setExpanded((v) => !v)}
      >
        <td className="px-5 py-4 text-sm text-slate-700 whitespace-nowrap">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-slate-300 flex-shrink-0 group-hover:text-slate-400 transition-colors" />
            <span className="font-medium">{fmt.period(bill.billingPeriodStart)}</span>
          </div>
        </td>
        <td className="px-5 py-4 text-sm font-bold text-slate-900 whitespace-nowrap tabular-nums">
          {fmt.currency(bill.totalAmount)}
        </td>
        <td className="px-5 py-4 whitespace-nowrap">
          <StatusBadge status={bill.status} isOverdue={isOverdue} />
        </td>
        <td className="px-5 py-4 text-xs text-slate-500 whitespace-nowrap hidden sm:table-cell">
          {fmt.date(bill.dueDate)}
        </td>
        <td className="px-5 py-4 text-xs text-slate-500 whitespace-nowrap hidden md:table-cell tabular-nums">
          {bill.invoiceCount ?? 0}
        </td>
        <td className="px-5 py-4 text-center">
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-slate-300 mx-auto group-hover:text-slate-500 transition-colors" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-300 mx-auto group-hover:text-slate-500 transition-colors" />
          )}
        </td>
      </tr>

      {expanded && (
        <tr className="bg-slate-50/60">
          <td colSpan={6} className="px-5 pb-5 pt-2">
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
  <div className="flex justify-between py-2.5 gap-4">
    <span className="text-xs text-slate-400 shrink-0">{label}</span>
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
    <>
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
      `}</style>

      <div className="p-4 sm:p-6 max-w-4xl mx-auto">
        {/* ── Page Header ── */}
        <div className="flex items-center justify-between mb-7">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Billing</h1>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">
              Manage subscription payments and billing history
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loadingStatus || loadingHistory}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl border border-slate-200 transition-all disabled:opacity-40"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingStatus || loadingHistory ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* ── Summary Stats ── */}
        {loadingHistory ? (
          <SummarySkeleton />
        ) : (
          history.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-7">
              <SummaryCard
                label="Total Paid"
                value={fmt.currency(totalPaid)}
                sub={`${paidCount} bills settled`}
                valueColor="text-emerald-600"
              />
              <SummaryCard
                label="Outstanding"
                value={fmt.currency(totalUnpaid)}
                sub={`${unpaidCount} unpaid`}
                valueColor={totalUnpaid > 0 ? "text-red-500" : "text-slate-800"}
              />
              <SummaryCard
                label="Billing History"
                value={String(history.length)}
                sub="months on record"
                className="col-span-2 sm:col-span-1"
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
        <Section icon={FileText} label="Billing History" badge={!loadingHistory ? "Last 24 months" : null}>
          {loadingHistory ? (
            <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100">
                      {["Period", "Amount", "Status", "Due Date", "Invoices", ""].map((h, i) => (
                        <th
                          key={i}
                          className={`px-5 py-3.5 text-[9px] font-black text-slate-400 uppercase tracking-widest ${i >= 3 && i < 5 ? "hidden sm:table-cell" : ""}`}
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
                      <th className="px-5 py-3.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        Period
                      </th>
                      <th className="px-5 py-3.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        Amount
                      </th>
                      <th className="px-5 py-3.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        Status
                      </th>
                      <th className="px-5 py-3.5 text-[9px] font-black text-slate-400 uppercase tracking-widest hidden sm:table-cell">
                        Due Date
                      </th>
                      <th className="px-5 py-3.5 text-[9px] font-black text-slate-400 uppercase tracking-widest hidden md:table-cell">
                        Invoices
                      </th>
                      <th className="px-5 py-3.5 w-10" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
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
    </>
  );
};

// ─── Shared layout primitives ─────────────────────────────────────────────────

const Section = ({ icon: Icon, label, badge, children }) => (
  <div className="mb-7">
    <div className="flex items-center gap-2 mb-3">
      <Icon className="w-3.5 h-3.5 text-slate-400" />
      <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</h2>
      {badge && (
        <span className="ml-1 text-[9px] font-semibold text-slate-300 normal-case bg-slate-100 px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </div>
    {children}
  </div>
);

const SummaryCard = ({ label, value, sub, valueColor = "text-slate-900", className = "" }) => (
  <div className={`bg-white border border-slate-100 rounded-2xl px-4 py-4 shadow-sm ${className}`}>
    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">{label}</p>
    <p className={`text-lg font-black ${valueColor} leading-none`}>{value}</p>
    <p className="text-[10px] text-slate-400 mt-1.5 font-medium">{sub}</p>
  </div>
);

const ErrorCard = ({ message, onRetry }) => (
  <div className="flex items-center gap-3 px-5 py-4 bg-red-50 border border-red-100 rounded-2xl">
    <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
    <div>
      <p className="text-sm font-semibold text-red-700">{message}</p>
      <button onClick={onRetry} className="text-xs text-red-500 hover:underline mt-0.5 font-medium">
        Try again
      </button>
    </div>
  </div>
);

const EmptyState = ({ icon: Icon, title, desc }) => (
  <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
    <Icon className="w-8 h-8 text-slate-200 mb-3" />
    <p className="text-sm font-bold text-slate-400">{title}</p>
    <p className="text-xs text-slate-300 mt-1">{desc}</p>
  </div>
);

export default Billing;
