import { useState, useEffect } from "react";
import {
  ReceiptText,
  Activity,
  ArrowLeft,
  Minus,
  TrendingUp,
  Wallet,
  PackageCheck,
  Clock,
  AlertCircle,
  Trash2,
  Printer,
  FlaskConical,
} from "lucide-react";
import { Link } from "react-router-dom";
import TimeFrame from "../../components/timeFrame";
import cashmemoService from "../../api/cashmemo";
import Popup from "../../components/popup";

// ─── helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => (typeof n === "number" ? n.toLocaleString("en-IN") : "0");

const buildHeadingLabel = (start, end) => {
  if (!start || !end) return "";
  const s = new Date(start);
  const e = new Date(end);

  const sameDay = s.getDate() === e.getDate() && s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear();

  const sameMonth = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear();

  const dayFmt = (d) => {
    const day = d.getDate();
    const suffix =
      day % 10 === 1 && day % 100 !== 11
        ? "st"
        : day % 10 === 2 && day % 100 !== 12
          ? "nd"
          : day % 10 === 3 && day % 100 !== 13
            ? "rd"
            : "th";
    return `${day}${suffix} ${d.toLocaleString("en-US", { month: "long" })}, ${d.getFullYear()}`;
  };

  if (sameDay) return dayFmt(s);
  if (sameMonth)
    return `${s.getDate()} – ${e.getDate()} ${s.toLocaleString("en-US", { month: "long" })}, ${s.getFullYear()}`;
  return `${s.toLocaleString("en-US", { month: "short", day: "numeric" })} – ${e.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const SkeletonMemo = () => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-pulse">
    {/* heading band */}
    <div className="px-6 pt-5 pb-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between gap-4">
      <div className="space-y-2">
        <div className="h-3 w-20 bg-gray-200 rounded-full" />
        <div className="h-5 w-44 bg-gray-300 rounded-lg" />
      </div>
      <div className="text-right space-y-2">
        <div className="h-3 w-24 bg-gray-200 rounded-full ml-auto" />
        <div className="h-9 w-12 bg-gray-300 rounded-lg ml-auto" />
      </div>
    </div>

    {/* P&L rows */}
    <div className="px-6 py-2 space-y-0">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center justify-between py-3.5 border-b border-gray-50">
          <div className="space-y-1.5">
            <div className="h-3.5 w-32 bg-gray-200 rounded" />
            <div className="h-2.5 w-24 bg-gray-100 rounded" />
          </div>
          <div className="h-5 w-20 bg-gray-200 rounded-lg" />
        </div>
      ))}

      {/* formula pill */}
      <div className="flex items-center gap-2 my-3">
        <div className="flex-1 h-px bg-gray-100" />
        <div className="h-6 w-64 bg-gray-100 rounded-full" />
        <div className="flex-1 h-px bg-gray-100" />
      </div>

      {/* net profit banner */}
      <div className="h-16 w-full bg-gray-200 rounded-xl mb-4" />

      {/* deleted warning */}
      <div className="h-12 w-full bg-red-50 border border-red-100 rounded-xl mb-5" />
    </div>

    {/* collection */}
    <div className="px-6 pb-5 border-t border-gray-100 pt-4">
      <div className="h-3 w-20 bg-gray-200 rounded-full mb-3" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-16 bg-gray-100 rounded-xl" />
        <div className="h-16 bg-gray-100 rounded-xl" />
      </div>
    </div>

    {/* delivery */}
    <div className="px-6 pb-5 border-t border-gray-100 pt-4">
      <div className="h-3 w-16 bg-gray-200 rounded-full mb-3" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-16 bg-gray-100 rounded-xl" />
        <div className="h-16 bg-gray-100 rounded-xl" />
      </div>
    </div>

    {/* test counts */}
    <div className="px-6 pb-6 border-t border-gray-100 pt-4">
      <div className="h-3 w-24 bg-gray-200 rounded-full mb-3" />
      <div className="flex flex-wrap gap-2">
        {[80, 64, 96, 72, 56, 88].map((w) => (
          <div key={w} className={`h-7 bg-gray-100 rounded-full`} style={{ width: w }} />
        ))}
      </div>
    </div>
  </div>
);

// ─── MAIN ─────────────────────────────────────────────────────────────────────
const CashMemo = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [popup, setPopup] = useState(null);
  const [timeRange, setTimeRange] = useState(null);

  useEffect(() => {
    const now = new Date();
    const range = {
      start: new Date(now).setHours(0, 0, 0, 0),
      end: new Date(now).setHours(23, 59, 59, 999),
    };
    setTimeRange(range);
    fetchSummary(range);
  }, []);

  const fetchSummary = async (range) => {
    try {
      setLoading(true);
      const res = await cashmemoService.getSummary({
        startDate: range.start,
        endDate: range.end,
      });
      setSummary(res.data);
    } catch {
      setPopup({ type: "error", message: "Failed to load cash memo. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleFetchData = (start, end) => {
    const range = { start, end };
    setTimeRange(range);
    fetchSummary(range);
  };

  const d = summary ?? {};
  const headingLabel = buildHeadingLabel(timeRange?.start, timeRange?.end);
  const pendingCount = (d.totalInvoices ?? 0) - (d.deliveredCount ?? 0);

  return (
    <section className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 px-4 py-6">
      {popup && <Popup type={popup.type} message={popup.message} onClose={() => setPopup(null)} />}

      {/* ── Print styles: hide everything except the memo card ── */}
      <style>{`
        @media print {
          /* Force background colors and images to print */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          body * { visibility: hidden; }
          #cashmemo-printable, #cashmemo-printable * { visibility: visible; }
          #cashmemo-printable {
            position: fixed;
            top: 0; left: 0;
            width: 100%;
            padding: 32px;
            box-shadow: none;
            border-radius: 0;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="max-w-2xl mx-auto">
        {/* ── Page header ── */}
        <div className="flex items-center justify-between mb-5 no-print">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <ReceiptText className="w-7 h-7 text-indigo-600" />
              Cash Memo
            </h1>
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-indigo-400" />
              Financial summary by time frame
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              disabled={loading}
              className="px-3 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-all flex items-center gap-2 text-sm font-medium shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <Link
              to="/lab-management"
              className="px-3 py-2.5 rounded-xl border border-gray-200 bg-white/60 text-gray-700 hover:bg-gray-50 transition-all flex items-center gap-2 text-sm font-medium shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
          </div>
        </div>

        {/* ── TimeFrame ── */}
        <div className="mb-5 no-print">
          <TimeFrame onFetchData={handleFetchData} />
        </div>

        {/* ══════════════════════════════════════════════════════════════
            MEMO CARD
        ══════════════════════════════════════════════════════════════ */}
        {loading ? (
          <SkeletonMemo />
        ) : (
          <div
            id="cashmemo-printable"
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
          >
            {/* ── Heading band ── */}
            <div className="px-6 pt-5 pb-4 bg-gradient-to-r from-indigo-50/70 to-purple-50/40 border-b border-gray-100">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold text-indigo-500 uppercase tracking-widest mb-0.5">
                    Cash Memo
                  </p>
                  <h2 className="text-lg font-extrabold text-gray-900 leading-tight">{headingLabel}</h2>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Total Invoices</p>
                  <p className="text-3xl font-black text-gray-900">{d.totalInvoices ?? 0}</p>
                </div>
              </div>
            </div>

            {/* ── P&L rows ── */}
            <div className="px-6 py-2">
              {/* Total Amount */}
              <div className="flex items-center justify-between py-3.5 border-b border-gray-50">
                <div>
                  <p className="text-sm font-semibold text-gray-800">Total Amount</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">Sum of all test prices</p>
                </div>
                <p className="text-lg font-bold text-gray-900">৳{fmt(d.totalAmount)}</p>
              </div>

              {/* Lab Adjustment */}
              <div className="flex items-center justify-between py-3.5 border-b border-gray-50">
                <div className="flex items-center gap-1.5">
                  <Minus className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Lab Adjustment</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Lab concession</p>
                  </div>
                </div>
                <p className="text-base font-semibold text-yellow-600">− ৳{fmt(d.labAdjustment)}</p>
              </div>

              {/* Referrer's Discount */}
              <div className="flex items-center justify-between py-3.5 border-b border-gray-50">
                <div className="flex items-center gap-1.5">
                  <Minus className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Referrer's Discount</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Discount passed to patients</p>
                  </div>
                </div>
                <p className="text-base font-semibold text-orange-500">− ৳{fmt(d.referrerDiscount)}</p>
              </div>

              {/* Commission */}
              <div className="flex items-center justify-between py-3.5 border-b border-dashed border-indigo-100">
                <div className="flex items-center gap-1.5">
                  <Minus className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <div>
                    <p className="text-sm font-black text-purple-700">Commission</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Owed to referrers</p>
                  </div>
                </div>
                <p className="text-base font-black text-purple-700">− ৳{fmt(d.referrerCommission)}</p>
              </div>

              {/* Formula tag */}
              <div className="flex items-center gap-2 my-3">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-[10.5px] text-gray-400 font-mono bg-gray-50 border border-gray-100 rounded-full px-3 py-1 whitespace-nowrap">
                  Total − Lab Adj. − Discount − Commission
                </span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              {/* NET PROFIT */}
              <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-indigo-200 uppercase tracking-widest">Net Profit</p>
                    <p className="text-[10px] text-indigo-300 mt-0.5">After all deductions</p>
                  </div>
                </div>
                <p className="text-3xl font-black text-white tracking-tight">৳{fmt(d.netProfit)}</p>
              </div>

              {/* ── Test counts ── */}
              {d.testCounts?.length > 0 && (
                <div className="my-4 bg-gray-50 border border-gray-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <FlaskConical className="w-3.5 h-3.5 text-indigo-400" />
                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Tests Ordered</p>
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-[10px] font-semibold text-gray-400">
                      {d.testCounts.reduce((s, t) => s + t.count, 0)} total
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {d.testCounts.map(({ name, count }, i) => (
                      <div
                        key={name}
                        className="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-3 py-2.5 gap-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[10px] font-black text-gray-300 w-4 shrink-0">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <span className="text-sm font-bold text-gray-800 truncate">{name}</span>
                        </div>
                        <span className="text-sm font-black text-indigo-600 shrink-0">{count}×</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Deleted invoices warning */}
              <div className="flex items-center justify-between px-4 py-3 bg-red-50 border border-red-200 rounded-xl mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-red-600">Deleted Invoices</p>
                    <p className="text-[11px] text-red-400 mt-0.5">Excluded from all calculations</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                  <p className="text-lg font-black text-red-600">{d.deletedCount ?? 0}</p>
                </div>
              </div>
            </div>

            {/* ── Collection status ── */}
            <div className="px-6 pb-5 border-t border-gray-100 pt-4">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Collection</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
                  <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                    <Wallet className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-green-700 uppercase tracking-wide">Collected</p>
                    <p className="text-lg font-bold text-green-800">৳{fmt(d.totalPaidAmount)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                  <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-red-600 uppercase tracking-wide">Due</p>
                    <p className="text-lg font-bold text-red-700">৳{fmt(d.totalDue)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Delivery status ── */}
            <div className="px-6 pb-5 border-t border-gray-100 pt-4">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Delivery</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                    <PackageCheck className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-blue-600 uppercase tracking-wide">Delivered</p>
                    <p className="text-lg font-bold text-blue-800">{d.deliveredCount ?? 0}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-amber-700 uppercase tracking-wide">Pending</p>
                    <p className="text-lg font-bold text-amber-800">{pendingCount}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <p className="text-center text-[11px] text-gray-400 mt-4 pb-6 no-print">
          Net Profit = Total Amount − Lab Adjustment − Referrer Discount − Commission
        </p>
      </div>
    </section>
  );
};

export default CashMemo;
