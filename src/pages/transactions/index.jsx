/**
 * useCallback / useMemo are intentionally absent throughout this file.
 * babel-plugin-react-compiler handles all memoization automatically.
 */
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Printer,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ReceiptText,
  Wallet,
  Clock,
  UserCheck,
} from "lucide-react";
import { Link } from "react-router-dom";
import TimeFrame from "../../components/timeFrame";
import transactionService from "../../api/transaction";
import Popup from "../../components/popup";
import { useAuthStore } from "../../store/authStore";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n) => (typeof n === "number" ? n.toLocaleString("en-IN") : "0");
const fmtDt = (ms) => new Date(ms).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
const fmtTime = (ms) => new Date(ms).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });

const buildHeadingLabel = (start, end) => {
  if (!start || !end) return "";
  const s = new Date(start);
  const e = new Date(end);
  const day = (d) => {
    const n = d.getDate();
    const sfx =
      n % 10 === 1 && n % 100 !== 11
        ? "st"
        : n % 10 === 2 && n % 100 !== 12
          ? "nd"
          : n % 10 === 3 && n % 100 !== 13
            ? "rd"
            : "th";
    return `${n}${sfx}`;
  };
  const monthYear = (d) => `${d.toLocaleString("en-US", { month: "long" })}, ${d.getFullYear()}`;
  const sameDay = s.toDateString() === e.toDateString();
  const sameMonth = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear();
  if (sameDay) return `${day(s)} ${monthYear(s)}`;
  if (sameMonth) return `${s.getDate()} – ${e.getDate()} ${monthYear(s)}`;
  return `${s.toLocaleString("en-US", { month: "short", day: "numeric" })} – ${e.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
};

const todayRange = () => {
  const now = new Date();
  return { start: new Date(now).setHours(0, 0, 0, 0), end: new Date(now).setHours(23, 59, 59, 999) };
};

const generatedStamp = (date) =>
  new Date(date ?? Date.now())
    .toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })
    .toUpperCase();

const isFullMonthRange = (start, end) => {
  if (!start || !end) return false;
  const s = new Date(start);
  const e = new Date(end);
  const firstDay = new Date(s.getFullYear(), s.getMonth(), 1, 0, 0, 0, 0).getTime();
  const lastDay = new Date(e.getFullYear(), e.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
  return (
    s.getTime() === firstDay &&
    e.getTime() === lastDay &&
    s.getMonth() === e.getMonth() &&
    s.getFullYear() === e.getFullYear()
  );
};

const recordStamp = (start, end) => {
  if (isFullMonthRange(start, end)) {
    return new Date(start).toLocaleDateString("en-US", { month: "long", year: "numeric" }).toUpperCase();
  }
  return generatedStamp(end);
};

const initials = (name = "") =>
  name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";

// ─── Constants ────────────────────────────────────────────────────────────────

const TEAL = "#0F6E5C";
const RUST = "#B23A2E";
const INK = "#1C1F1E";

const EMPTY_DATA = {
  staff: [],
  totals: { totalInvoices: 0, totalFinal: 0, totalPaid: 0, totalDue: 0, totalCollected: 0 },
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const SkeletonManifest = () => (
  <div className="bg-white border border-[#E3E0D6] rounded-lg overflow-hidden animate-pulse">
    <div className="h-[3px] bg-[#E3E0D6]" />
    <div className="px-6 sm:px-8 pt-6 pb-5 border-b border-[#E3E0D6] space-y-2">
      <div className="h-2.5 w-28 bg-[#ECE9DF] rounded-sm" />
      <div className="h-6 w-48 bg-[#ECE9DF] rounded-sm" />
    </div>
    <div className="px-6 sm:px-8 py-4 grid grid-cols-4 gap-3 border-b border-[#E3E0D6]">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-10 bg-[#ECE9DF] rounded-sm" />
      ))}
    </div>
    {[0, 1].map((i) => (
      <div key={i} className="px-6 sm:px-8 py-5 border-b border-[#E3E0D6] last:border-b-0 space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-[#ECE9DF]" />
          <div className="h-3 w-32 bg-[#ECE9DF] rounded-sm" />
          <div className="h-3 w-16 bg-[#ECE9DF] rounded-sm ml-auto" />
        </div>
      </div>
    ))}
  </div>
);

// ─── Small primitives ─────────────────────────────────────────────────────────

const EmptyRow = ({ label }) => (
  <div className="flex items-center gap-2 py-10 justify-center text-[#A8ACA3]">
    <AlertCircle className="w-3.5 h-3.5" />
    <p className="font-['IBM_Plex_Mono'] text-[11px] tracking-wide">{label}</p>
  </div>
);

const StatStrip = ({ label, value, accent, sub }) => (
  <div className="text-center px-2">
    <p className="font-['IBM_Plex_Mono'] text-[9.5px] uppercase tracking-[0.15em] text-[#A8ACA3]">{label}</p>
    <p className="font-['IBM_Plex_Mono'] text-lg font-semibold mt-0.5 tabular-nums" style={{ color: accent ?? INK }}>
      {value}
    </p>
    {sub && <p className="font-['IBM_Plex_Mono'] text-[9px] text-[#A8ACA3] mt-0.5">{sub}</p>}
  </div>
);

const InvoiceRow = ({ inv, idx }) => (
  <div className="flex items-center gap-3 py-2 border-b border-dotted border-[#E3E0D6] last:border-b-0">
    <span className="font-['IBM_Plex_Mono'] text-[10px] text-[#C7C4B8] tabular-nums w-4 shrink-0">
      {String(idx + 1).padStart(2, "0")}
    </span>
    <div className="min-w-0 flex-1">
      <p className="text-[12.5px] text-[#1C1F1E] font-medium truncate">{inv.patient}</p>
      <p className="font-['IBM_Plex_Mono'] text-[10px] text-[#A8ACA3] mt-0.5">
        {inv.invoiceId} · {fmtDt(inv.createdAt)}
      </p>
    </div>
    <div className="flex items-center gap-3 shrink-0 text-right">
      <span className="font-['IBM_Plex_Mono'] text-[11px] text-[#6F756F] tabular-nums">৳{fmt(inv.final)}</span>
      <span className="font-['IBM_Plex_Mono'] text-[11px] font-semibold tabular-nums" style={{ color: TEAL }}>
        ৳{fmt(inv.paid)}
      </span>
      {inv.due > 0 && (
        <span className="font-['IBM_Plex_Mono'] text-[11px] tabular-nums w-14 text-right" style={{ color: RUST }}>
          ৳{fmt(inv.due)}
        </span>
      )}
    </div>
  </div>
);

const CollectionRow = ({ col, idx }) => (
  <div className="flex items-center gap-3 py-2 border-b border-dotted border-[#E3E0D6] last:border-b-0">
    <span className="font-['IBM_Plex_Mono'] text-[10px] text-[#C7C4B8] tabular-nums w-4 shrink-0">
      {String(idx + 1).padStart(2, "0")}
    </span>
    <div className="min-w-0 flex-1">
      <p className="text-[12.5px] text-[#1C1F1E] font-medium truncate">{col.patient}</p>
      <p className="font-['IBM_Plex_Mono'] text-[10px] text-[#A8ACA3] mt-0.5 flex items-center gap-1">
        <Clock className="w-2.5 h-2.5" />
        {fmtDt(col.at)} · {fmtTime(col.at)}
      </p>
    </div>
    <div className="flex items-center gap-3 shrink-0 text-right">
      <span className="font-['IBM_Plex_Mono'] text-[10px] text-[#A8ACA3]">{col.invoiceId}</span>
      <span className="font-['IBM_Plex_Mono'] text-[11px] font-semibold tabular-nums" style={{ color: TEAL }}>
        ৳{fmt(col.amount)}
      </span>
    </div>
  </div>
);

// ─── Staff ledger entry ────────────────────────────────────────────────────────

const StaffEntry = ({ member: m, rank }) => {
  const [tab, setTab] = useState(null); // null | "invoices" | "collections"
  const hasDue = m.totalDue > 0;

  return (
    <div className="py-3 first:pt-0">
      <div className="flex items-baseline gap-3">
        <span className="font-['IBM_Plex_Mono'] text-[11px] text-[#A8ACA3] tabular-nums w-5 shrink-0">
          {String(rank).padStart(2, "0")}
        </span>
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[13.5px] text-[#1C1F1E] font-medium truncate">{m.name}</span>
          <span className="flex items-center gap-1 font-['IBM_Plex_Mono'] text-[9px] uppercase tracking-wide text-[#6F756F] shrink-0">
            <UserCheck className="w-2.5 h-2.5" />
            Staff
          </span>
        </div>
        <span className="flex-1 border-b border-dotted border-[#D8D5CB] translate-y-[-3px]" />
        <div className="flex items-center gap-3 shrink-0">
          {hasDue && (
            <span className="font-['IBM_Plex_Mono'] text-[12px] tabular-nums" style={{ color: RUST }}>
              ৳{fmt(m.totalDue)} due
            </span>
          )}
          <span className="font-['IBM_Plex_Mono'] text-[13.5px] font-semibold tabular-nums" style={{ color: TEAL }}>
            ৳{fmt(m.totalCollected)}
          </span>
        </div>
      </div>

      {/* mini stat row */}
      <div className="pl-8 mt-1.5 flex items-center gap-4 font-['IBM_Plex_Mono'] text-[10px] text-[#8A8F89]">
        <span>{m.totalInvoices} invoices</span>
        <span>৳{fmt(m.totalFinal)} billed</span>
        <span style={{ color: TEAL }}>৳{fmt(m.totalPaid)} paid</span>
      </div>

      {/* toggles */}
      <div className="pl-8 mt-2 flex items-center gap-4">
        <button
          onClick={() => setTab((p) => (p === "invoices" ? null : "invoices"))}
          className={`flex items-center gap-1.5 font-['IBM_Plex_Mono'] text-[10px] uppercase tracking-wide transition-colors ${
            tab === "invoices" ? "text-[#1C1F1E]" : "text-[#A8ACA3] hover:text-[#1C1F1E]"
          }`}
        >
          <ReceiptText className="w-3 h-3" />
          {m.invoices.length} Invoice{m.invoices.length !== 1 ? "s" : ""}
          {tab === "invoices" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
        <button
          onClick={() => setTab((p) => (p === "collections" ? null : "collections"))}
          className={`flex items-center gap-1.5 font-['IBM_Plex_Mono'] text-[10px] uppercase tracking-wide transition-colors ${
            tab === "collections" ? "text-[#1C1F1E]" : "text-[#A8ACA3] hover:text-[#1C1F1E]"
          }`}
        >
          <Wallet className="w-3 h-3" />
          {m.collections.length} Collection{m.collections.length !== 1 ? "s" : ""}
          {tab === "collections" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {tab === "invoices" && (
        <div className="pl-8 pr-1 mt-2">
          {m.invoices.length === 0 ? (
            <p className="font-['IBM_Plex_Mono'] text-[10px] text-[#A8ACA3] py-2">No invoices in this period</p>
          ) : (
            m.invoices.map((inv, i) => <InvoiceRow key={inv.invoiceId} inv={inv} idx={i} />)
          )}
        </div>
      )}
      {tab === "collections" && (
        <div className="pl-8 pr-1 mt-2">
          {m.collections.length === 0 ? (
            <p className="font-['IBM_Plex_Mono'] text-[10px] text-[#A8ACA3] py-2">No collections in this period</p>
          ) : (
            m.collections.map((col, i) => <CollectionRow key={`${col.invoiceId}-${i}`} col={col} idx={i} />)
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────

const Transactions = () => {
  const user = useAuthStore((state) => state.user);
  const isStaff = user?.role === "staff";

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [popup, setPopup] = useState(null);
  const [timeRange, setTimeRange] = useState(null);

  useEffect(() => {
    const range = todayRange();
    setTimeRange(range);
    fetchData(range);
  }, []);

  const fetchData = async (range) => {
    try {
      setLoading(true);
      const res = await transactionService.getSummary({ startDate: range.start, endDate: range.end });
      setData(res.data);
    } catch {
      setPopup({ type: "error", message: "Failed to load transaction data. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleFetchData = (start, end) => {
    const range = { start, end };
    setTimeRange(range);
    fetchData(range);
  };

  const d = data ?? EMPTY_DATA;
  const headingLabel = buildHeadingLabel(timeRange?.start, timeRange?.end);

  return (
    <section className="min-h-screen manifest-bg px-4 py-6">
      {popup && <Popup type={popup.type} message={popup.message} onClose={() => setPopup(null)} />}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');

        .manifest-bg {
          background-color: #F5F4EF;
          background-image: radial-gradient(circle, rgba(28,31,30,0.05) 1px, transparent 1px);
          background-size: 18px 18px;
        }

        @media print {
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body * { visibility: hidden; }
          #transactions-printable, #transactions-printable * { visibility: visible; }
          #transactions-printable { position: fixed; top: 0; left: 0; width: 100%; padding: 32px; box-shadow: none; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-5 no-print">
          <div>
            <p className="font-['IBM_Plex_Mono'] text-[10px] uppercase tracking-[0.2em] text-[#0F6E5C] mb-1">
              Lab Operations
            </p>
            <h1 className="font-['IBM_Plex_Sans'] text-2xl sm:text-3xl font-semibold text-[#1C1F1E] tracking-tight">
              Transactions
            </h1>
            <p className="text-sm text-[#767D78] mt-1">Staff collections and billing for the selected range.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              disabled={loading}
              className="px-3 py-2 rounded-sm border border-[#1C1F1E]/15 text-[#1C1F1E] hover:bg-[#1C1F1E] hover:text-white transition-colors flex items-center gap-1.5 font-['IBM_Plex_Mono'] text-[11px] uppercase tracking-wide disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Printer className="w-3.5 h-3.5" /> Print
            </button>
            <Link
              to="/lab-management"
              className="px-3 py-2 rounded-sm border border-[#1C1F1E]/15 text-[#1C1F1E] hover:bg-[#1C1F1E] hover:text-white transition-colors flex items-center gap-1.5 font-['IBM_Plex_Mono'] text-[11px] uppercase tracking-wide"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </Link>
          </div>
        </div>

        <div className="mb-5 no-print">
          <TimeFrame onFetchData={handleFetchData} />
        </div>

        {loading ? (
          <SkeletonManifest />
        ) : (
          <div
            id="transactions-printable"
            className="bg-white border border-[#E3E0D6] rounded-lg shadow-[0_1px_2px_rgba(28,31,30,0.04)] overflow-hidden"
          >
            {/* Header band */}
            <div className="px-6 sm:px-8 pt-6 pb-5 border-b border-[#E3E0D6] flex items-start justify-between gap-4">
              <div>
                <p className="font-['IBM_Plex_Mono'] text-[10px] uppercase tracking-[0.2em] text-[#0F6E5C] mb-1.5">
                  Collections Manifest
                </p>
                <h2 className="font-['IBM_Plex_Sans'] text-2xl font-semibold text-[#1C1F1E] tracking-tight">
                  {headingLabel}
                </h2>
              </div>

              <div className="rotate-[-4deg] border border-[#0F6E5C]/35 text-[#0F6E5C] px-2 py-1 font-['IBM_Plex_Mono'] text-[9px] uppercase tracking-[0.15em] rounded-sm select-none shrink-0 mt-1">
                Record · {recordStamp(timeRange?.start, timeRange?.end)}
              </div>
            </div>

            {/* Stat strip — admin only */}
            {!isStaff && (
              <div className="px-6 sm:px-8 py-4 border-b border-[#E3E0D6] flex items-center divide-x divide-[#E3E0D6]">
                <StatStrip label="Collected" value={`৳${fmt(d.totals.totalCollected)}`} accent={TEAL} />
                <StatStrip label="Billed" value={`৳${fmt(d.totals.totalFinal)}`} />
                <StatStrip
                  label="Due"
                  value={`৳${fmt(d.totals.totalDue)}`}
                  accent={d.totals.totalDue > 0 ? RUST : undefined}
                />
                <StatStrip label="Staff" value={fmt(d.staff.length)} />
              </div>
            )}

            {/* Staff ledger */}
            <div className="px-6 sm:px-8 py-5">
              <div className="flex items-center justify-between mb-1">
                <p className="font-['IBM_Plex_Mono'] text-[10px] uppercase tracking-[0.15em] text-[#6F756F]">
                  By Staff ({d.staff.length})
                </p>
                <p className="font-['IBM_Plex_Mono'] text-[10px] text-[#A8ACA3]">Ranked by collected</p>
              </div>
              {d.staff.length > 0 ? (
                <div className="divide-y divide-[#EFEDE5]">
                  {d.staff.map((member, i) => (
                    <StaffEntry key={member.staffId} member={member} rank={i + 1} />
                  ))}
                </div>
              ) : (
                <EmptyRow label="No transactions recorded in this range" />
              )}
            </div>
          </div>
        )}

        <p className="font-['IBM_Plex_Mono'] text-center text-[10px] text-[#A8ACA3] mt-4 pb-6 no-print tracking-wide">
          Counts reflect active (non-deleted) invoices only
        </p>
      </div>
    </section>
  );
};

export default Transactions;
