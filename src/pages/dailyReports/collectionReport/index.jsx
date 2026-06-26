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
import TimeFrame from "../../../components/timeFrame";
import collectionReportAPI from "../../../api/collectionReport";
import Popup from "../../../components/popup";
import { useAuthStore } from "../../../store/authStore";

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

// ─── Constants ────────────────────────────────────────────────────────────────

const TEAL = "#0F6E5C";
const RUST = "#B23A2E";
const INK = "#1C1F1E";
const SEAL_BLUE = "#1E4FA0";
const SEAL_RED = "#C0312B";

const EMPTY_DATA = {
  staff: [],
  totals: { totalInvoices: 0, totalFinal: 0, totalDue: 0, totalCollected: 0 },
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const SkeletonManifest = () => (
  <div className="bg-white border border-[#E3E0D6] rounded-lg overflow-hidden animate-pulse">
    <div className="h-[3px] bg-[#E3E0D6]" />
    <div className="px-6 sm:px-8 pt-6 pb-5 border-b border-[#E3E0D6] space-y-2">
      <div className="h-2.5 w-28 bg-[#ECE9DF] rounded-sm" />
      <div className="h-6 w-48 bg-[#ECE9DF] rounded-sm" />
      <div className="flex gap-6 pt-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-9 w-16 bg-[#ECE9DF] rounded-sm" />
        ))}
      </div>
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
    <p className="font-['IBM_Plex_Mono'] text-xs font-noto">{label}</p>
  </div>
);

const HeaderStat = ({ label, value, accent }) => (
  <div className="flex flex-col gap-0.5 px-4 first:pl-0 last:pr-0">
    <span className="font-['IBM_Plex_Mono'] text-xs uppercase text-[#A8ACA3] font-noto whitespace-nowrap">{label}</span>
    <span className="font-['IBM_Plex_Mono'] text-sm font-semibold tabular-nums" style={{ color: accent ?? INK }}>
      {value}
    </span>
  </div>
);

const InvoiceRow = ({ inv, idx }) => (
  <div className="flex items-center gap-3 py-2 border-b border-dotted border-[#E3E0D6] last:border-b-0">
    <span className="font-['IBM_Plex_Mono'] text-xs text-[#C7C4B8] tabular-nums w-5 shrink-0">
      {String(idx + 1).padStart(2, "0")}
    </span>
    <div className="min-w-0 flex-1">
      <p className="text-sm text-[#1C1F1E] font-medium truncate font-noto">{inv.patient}</p>
      <p className="font-['IBM_Plex_Mono'] text-xs text-[#A8ACA3] mt-0.5">
        {inv.invoiceId} · {fmtDt(inv.createdAt)}
      </p>
    </div>
    <div className="flex items-center gap-3 shrink-0 text-right">
      <span className="font-['IBM_Plex_Mono'] text-xs text-[#6F756F] tabular-nums">৳{fmt(inv.final)}</span>
      <span className="font-['IBM_Plex_Mono'] text-sm font-semibold tabular-nums" style={{ color: TEAL }}>
        ৳{fmt(inv.paid)}
      </span>
      {inv.due > 0 && (
        <span className="font-['IBM_Plex_Mono'] text-sm tabular-nums w-14 text-right" style={{ color: RUST }}>
          ৳{fmt(inv.due)}
        </span>
      )}
    </div>
  </div>
);

const CollectionRow = ({ col, idx }) => (
  <div className="flex items-center gap-3 py-2 border-b border-dotted border-[#E3E0D6] last:border-b-0">
    <span className="font-['IBM_Plex_Mono'] text-xs text-[#C7C4B8] tabular-nums w-5 shrink-0">
      {String(idx + 1).padStart(2, "0")}
    </span>
    <div className="min-w-0 flex-1">
      <p className="text-sm text-[#1C1F1E] font-medium truncate font-noto">{col.patient}</p>
      <p className="font-['IBM_Plex_Mono'] text-xs text-[#A8ACA3] mt-0.5 flex items-center gap-1">
        <Clock className="w-2.5 h-2.5" />
        {fmtDt(col.at)} · {fmtTime(col.at)}
      </p>
    </div>
    <div className="flex items-center gap-3 shrink-0 text-right">
      <span className="font-['IBM_Plex_Mono'] text-xs text-[#A8ACA3]">{col.invoiceId}</span>
      <span className="font-['IBM_Plex_Mono'] text-sm font-semibold tabular-nums" style={{ color: TEAL }}>
        ৳{fmt(col.amount)}
      </span>
    </div>
  </div>
);

// ─── Seal ───────────────────────────────────────────────────────────────────

const RoundSeal = ({ dateLabel }) => {
  return (
    <div className="relative shrink-0 select-none rotate-[-3deg]">
      <div
        className="bg-white px-4 py-2.5 rounded-[3px]"
        style={{ border: `2px solid ${SEAL_BLUE}`, boxShadow: `inset 0 0 0 3px ${SEAL_BLUE}05` }}
      >
        <div className="border" style={{ borderColor: `${SEAL_BLUE}55`, padding: "5px 10px" }}>
          <p
            className="text-center font-['IBM_Plex_Mono'] font-bold uppercase"
            style={{ color: SEAL_BLUE, fontSize: "10px", letterSpacing: "2px" }}
          >
            LabPilotPro.com
          </p>
          <div className="h-px w-full my-1" style={{ backgroundColor: `${SEAL_BLUE}55` }} />
          <p
            className="text-center font-['IBM_Plex_Mono'] font-extrabold uppercase whitespace-nowrap"
            style={{ color: SEAL_RED, fontSize: "11px", letterSpacing: "1px" }}
          >
            Collection Report
          </p>
          <p
            className="text-center font-['IBM_Plex_Mono'] font-semibold"
            style={{ color: SEAL_RED, fontSize: "11px", letterSpacing: "0.5px" }}
          >
            {dateLabel}
          </p>
        </div>
      </div>
    </div>
  );
};

// ─── Staff ledger entry ────────────────────────────────────────────────────────

// Shared column template so every staff row lines up exactly, with no header row needed.
const STAFF_GRID_COLS = "grid-cols-[24px_1fr_108px_150px]";

const MetricCell = ({ icon: Icon, value, unit, accent, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center justify-end gap-1.5 -my-1 -mr-1 py-1.5 pl-1.5 pr-1 rounded-sm transition-colors font-noto ${
      active ? "bg-[#1C1F1E]/[0.05]" : "hover:bg-[#1C1F1E]/[0.03]"
    }`}
  >
    <Icon className="w-3 h-3 text-[#A8ACA3] shrink-0" />
    <span className="flex items-baseline gap-1 whitespace-nowrap">
      <span className="font-['IBM_Plex_Mono'] text-sm font-semibold tabular-nums" style={{ color: accent ?? INK }}>
        {value}
      </span>
      <span className="text-xs text-[#8A8F89] font-noto">{unit}</span>
    </span>
    {active ? (
      <ChevronUp className="w-3 h-3 text-[#A8ACA3] shrink-0" />
    ) : (
      <ChevronDown className="w-3 h-3 text-[#A8ACA3] shrink-0" />
    )}
  </button>
);

const StaffEntry = ({ member: m, rank }) => {
  const [tab, setTab] = useState(null); // null | "invoices" | "collections"

  return (
    <div className="py-2 first:pt-0">
      <div className={`grid ${STAFF_GRID_COLS} items-center gap-3`}>
        <span className="font-['IBM_Plex_Mono'] text-xs text-[#A8ACA3] tabular-nums">
          {String(rank).padStart(2, "0")}
        </span>
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-sm text-[#1C1F1E] font-medium truncate font-noto">{m.name}</span>
          <UserCheck className="w-3 h-3 text-[#A8ACA3] shrink-0" />
        </div>
        <MetricCell
          icon={ReceiptText}
          value={m.totalInvoices}
          unit="টি ইনভয়েস"
          active={tab === "invoices"}
          onClick={() => setTab((p) => (p === "invoices" ? null : "invoices"))}
        />
        <MetricCell
          icon={Wallet}
          value={`৳${fmt(m.totalCollected)}`}
          unit="কালেকশন"
          accent={TEAL}
          active={tab === "collections"}
          onClick={() => setTab((p) => (p === "collections" ? null : "collections"))}
        />
      </div>

      {tab === "invoices" && (
        <div className="pl-9 pr-1 mt-2">
          {m.invoices.length === 0 ? (
            <p className="font-['IBM_Plex_Mono'] text-xs text-[#A8ACA3] py-2 font-noto">
              এই সময়সীমায় কোনো ইনভয়েস নেই
            </p>
          ) : (
            m.invoices.map((inv, i) => <InvoiceRow key={inv.invoiceId} inv={inv} idx={i} />)
          )}
        </div>
      )}
      {tab === "collections" && (
        <div className="pl-9 pr-1 mt-2">
          {m.collections.length === 0 ? (
            <p className="font-['IBM_Plex_Mono'] text-xs text-[#A8ACA3] py-2 font-noto">
              এই সময়সীমায় কোনো কালেকশন নেই
            </p>
          ) : (
            m.collections.map((col, i) => <CollectionRow key={`${col.invoiceId}-${i}`} col={col} idx={i} />)
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────

const CollectionReport = () => {
  const user = useAuthStore((state) => state.user);
  const lab = useAuthStore((state) => state.lab);
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
      const res = await collectionReportAPI.getSummary({ startDate: range.start, endDate: range.end });
      setData(res.data);
    } catch {
      setPopup({ type: "error", message: "লেনদেনের তথ্য লোড করা সম্ভব হয়নি। আবার চেষ্টা করুন।" });
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
  const sortedStaff = [...d.staff].sort((a, b) => b.totalCollected - a.totalCollected);

  return (
    <section className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 px-4 py-6 font-noto">
      {popup && <Popup type={popup.type} message={popup.message} onClose={() => setPopup(null)} />}

      <style>{`
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
            <p className="font-['IBM_Plex_Mono'] text-xs uppercase text-[#0F6E5C] mb-1 font-noto">ল্যাব অপারেশন</p>
            <h1 className="font-['IBM_Plex_Sans'] text-2xl sm:text-3xl font-semibold text-[#1C1F1E] font-noto">
              কালেকশন রিপোর্ট
            </h1>
            <p className="text-base text-[#767D78] mt-1 font-noto">
              নির্ধারিত সময়সীমায় স্টাফদের কালেকশন ও বিলিংয়ের হিসাব।
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              disabled={loading}
              className="px-3 py-2 rounded-sm border border-[#1C1F1E]/15 text-[#1C1F1E] hover:bg-[#1C1F1E] hover:text-white transition-colors flex items-center gap-1.5 font-['IBM_Plex_Mono'] text-xs uppercase disabled:opacity-40 disabled:cursor-not-allowed font-noto"
            >
              <Printer className="w-3.5 h-3.5" /> প্রিন্ট
            </button>
            <Link
              to="/lab-management"
              className="px-3 py-2 rounded-sm border border-[#1C1F1E]/15 text-[#1C1F1E] hover:bg-[#1C1F1E] hover:text-white transition-colors flex items-center gap-1.5 font-['IBM_Plex_Mono'] text-xs uppercase font-noto"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> ফিরে যান
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
            {/* Letterhead — dynamic from auth store */}
            <div className="px-6 sm:px-8 pt-5 pb-4 text-center border-b border-[#E3E0D6] bg-[#FAF9F5]">
              <h3 className="font-['IBM_Plex_Sans'] text-lg font-bold text-[#1C1F1E] tracking-wide font-noto">
                {lab?.name ?? "LabPilot Pro"}
              </h3>
              {lab?.contact?.address && (
                <p className="font-['IBM_Plex_Mono'] text-xs text-[#6F756F] mt-1 font-noto">{lab.contact.address}</p>
              )}
              {lab?.contact?.primary && (
                <p className="font-['IBM_Plex_Mono'] text-xs text-[#6F756F] mt-1 font-noto">{lab.contact.primary}</p>
              )}
            </div>

            {/* Header band */}
            <div className="px-6 sm:px-8 pt-6 pb-5 border-b border-[#E3E0D6] flex items-start justify-between gap-4">
              <div>
                <p className="font-['IBM_Plex_Mono'] text-xs uppercase text-[#0F6E5C] mb-1.5 font-noto">
                  কালেকশন রিপোর্ট
                </p>
                <h2 className="font-['IBM_Plex_Sans'] text-2xl font-semibold text-[#1C1F1E] font-noto">
                  {headingLabel}
                </h2>

                {!isStaff && (
                  <div className="flex flex-wrap divide-x divide-[#E3E0D6] mt-3">
                    <HeaderStat label="মোট বিল" value={`৳${fmt(d.totals.totalFinal)}`} />
                    <HeaderStat label="আদায়" value={`৳${fmt(d.totals.totalCollected)}`} accent={TEAL} />
                    <HeaderStat
                      label="বাকি"
                      value={`৳${fmt(d.totals.totalDue)}`}
                      accent={d.totals.totalDue > 0 ? RUST : undefined}
                    />
                    <HeaderStat label="মোট ইনভয়েস" value={fmt(d.totals.totalInvoices)} />
                  </div>
                )}
              </div>

              <RoundSeal dateLabel={recordStamp(timeRange?.start, timeRange?.end)} />
            </div>

            {/* Staff ledger */}
            <div className="px-6 sm:px-8 py-5 border-t border-[#E3E0D6]">
              {sortedStaff.length > 0 ? (
                <div className="divide-y divide-[#EFEDE5]">
                  {sortedStaff.map((member, i) => (
                    <StaffEntry key={member.staffId} member={member} rank={i + 1} />
                  ))}
                </div>
              ) : (
                <EmptyRow label="এই সময়সীমায় কোনো লেনদেন রেকর্ড হয়নি" />
              )}
            </div>
          </div>
        )}

        <p className="font-['IBM_Plex_Mono'] text-center text-xs text-[#A8ACA3] mt-4 pb-6 no-print font-noto">
          শুধুমাত্র সক্রিয় (ডিলিট না হওয়া) ইনভয়েসের হিসাব অন্তর্ভুক্ত
        </p>
      </div>
    </section>
  );
};

export default CollectionReport;
