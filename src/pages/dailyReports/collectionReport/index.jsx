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
  Wallet,
  Clock,
  UserCheck,
  BedDouble,
  Banknote,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import TimeFrame from "../../../components/timeFrame";
import ReportSeal from "../../../components/ReportSeal";
import collectionService from "../../../api/dailyReports/collectionReport";
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

// Seal date stamp: single day → one date, full month → "MONTH YEAR",
// any other multi-day range → "DD MON – DD MON, YYYY" so the seal never
// silently drops the start date on a date-range selection.
const recordStamp = (start, end) => {
  if (!start || !end) return generatedStamp();

  if (isFullMonthRange(start, end)) {
    return new Date(start).toLocaleDateString("en-US", { month: "long", year: "numeric" }).toUpperCase();
  }

  const s = new Date(start);
  const e = new Date(end);

  if (s.toDateString() === e.toDateString()) {
    return generatedStamp(end);
  }

  const fmtShort = (d) => d.toLocaleDateString("en-US", { day: "2-digit", month: "short" }).toUpperCase();
  const sameYear = s.getFullYear() === e.getFullYear();

  return sameYear
    ? `${fmtShort(s)} – ${fmtShort(e)}, ${e.getFullYear()}`
    : `${fmtShort(s)} ${s.getFullYear()} – ${fmtShort(e)} ${e.getFullYear()}`;
};

// ── Error helpers (mirrors ManageReferrer.jsx / CashMemo.jsx) ─────────────────

const PERMISSION_DENIED_MESSAGE = "আপনার কর্তৃপক্ষ আপনাকে এই কাজটি করার বা এই তথ্যটি পাওয়ার অনুমতি দেয়নি।";

const getErrorMessage = (err, fallback) => {
  if (err?.response?.status === 403) return PERMISSION_DENIED_MESSAGE;
  return err?.response?.data?.error ?? fallback;
};

// Axios‑native network error detection
const isNetworkError = (error) => error?.isAxiosError === true && !error.response;

// ─── Constants ────────────────────────────────────────────────────────────────

const TEAL = "#0F6E5C";
const INK = "#1C1F1E";
const SEAL_BLUE = "#1E4FA0";
const SEAL_RED = "#C0312B";

// Mirrors PAYMENT_MODES in invoiceRoutes.js / indoorPatients.routes.js
const MODE_LABELS = {
  cash: "ক্যাশ",
  bkash: "বিকাশ",
  nagad: "নগদ",
  card: "কার্ড",
  bank_transfer: "ব্যাংক ট্রান্সফার",
  others: "অন্যান্য",
};

const EMPTY_DATA = {
  staff: [],
  totals: { totalCollected: 0, opdCollected: 0, ipdCollected: 0, byMode: {} },
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const SkeletonManifest = () => (
  <div className="bg-white border border-[#E3E0D6] rounded-lg overflow-hidden animate-pulse">
    <div className="h-[3px] bg-[#E3E0D6]" />
    <div className="px-6 sm:px-8 pt-6 pb-5 border-b border-[#E3E0D6] space-y-2">
      <div className="h-2.5 w-28 bg-[#ECE9DF] rounded-sm" />
      <div className="h-6 w-48 bg-[#ECE9DF] rounded-sm" />
      <div className="flex gap-6 pt-2">
        {[0, 1, 2].map((i) => (
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
  <div className="flex flex-col gap-0.5 px-2.5 first:pl-0 last:pr-0">
    <span className="font-['IBM_Plex_Mono'] text-[10px] uppercase text-[#A8ACA3] font-noto whitespace-nowrap">
      {label}
    </span>
    <span
      className="font-['IBM_Plex_Mono'] text-sm font-semibold tabular-nums whitespace-nowrap"
      style={{ color: accent ?? INK }}
    >
      {value}
    </span>
  </div>
);

const SourcePill = ({ label, value, isIpd }) => (
  <span
    className="inline-flex items-center gap-1 px-2 py-1 rounded-sm font-['IBM_Plex_Mono'] text-xs font-noto"
    style={{
      backgroundColor: isIpd ? `${SEAL_BLUE}0D` : `${TEAL}0D`,
      color: isIpd ? SEAL_BLUE : TEAL,
    }}
  >
    {isIpd && <BedDouble className="w-2.5 h-2.5" />}
    {label} ৳{fmt(value)}
  </span>
);

const ModePill = ({ label, value }) => (
  <span
    className="inline-flex items-center gap-1 px-2 py-1 rounded-sm font-['IBM_Plex_Mono'] text-xs font-noto"
    style={{ backgroundColor: `${INK}0D`, color: INK }}
  >
    <Wallet className="w-2.5 h-2.5" />
    {label} ৳{fmt(value)}
  </span>
);

const CashBadge = ({ value }) => (
  <span
    className="inline-flex items-center gap-1 px-2 py-1 rounded-sm font-['IBM_Plex_Mono'] text-xs font-semibold whitespace-nowrap"
    style={{ backgroundColor: `${TEAL}0D`, color: TEAL }}
  >
    <Banknote className="w-3 h-3" />৳{fmt(value)}
  </span>
);

const CollectionRow = ({ col, idx }) => {
  const isIpd = col.source === "ipd";
  return (
    <div className="flex items-center gap-3 py-2 border-b border-dotted border-[#E3E0D6] last:border-b-0">
      <span className="font-['IBM_Plex_Mono'] text-xs text-[#C7C4B8] tabular-nums w-5 shrink-0">
        {String(idx + 1).padStart(2, "0")}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-[#1C1F1E] font-medium truncate font-noto flex items-center gap-1.5">
          {col.patient}
          {isIpd && (
            <span
              className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded-sm shrink-0"
              style={{ backgroundColor: "#1E4FA00D", color: SEAL_BLUE }}
            >
              <BedDouble className="w-2.5 h-2.5" />
              <span className="font-['IBM_Plex_Mono'] text-[9px] uppercase tracking-wide">IPD</span>
            </span>
          )}
        </p>
        <p className="font-['IBM_Plex_Mono'] text-xs text-[#A8ACA3] mt-0.5 flex items-center gap-1">
          <Clock className="w-2.5 h-2.5" />
          {fmtDt(col.at)} · {fmtTime(col.at)} · {col.invoiceId}
          {col.mode && <> · {MODE_LABELS[col.mode] ?? col.mode}</>}
        </p>
      </div>
      <div className="flex items-center gap-3 shrink-0 text-right">
        <span className="font-['IBM_Plex_Mono'] text-sm font-semibold tabular-nums" style={{ color: TEAL }}>
          ৳{fmt(col.amount)}
        </span>
      </div>
    </div>
  );
};

// ─── Staff ledger entry ────────────────────────────────────────────────────────

const STAFF_GRID_COLS = "grid-cols-[24px_1fr_auto_140px]";

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

const StaffEntry = ({ member: m, rank, isHospital }) => {
  const [open, setOpen] = useState(false);
  const hasCashSplit = m.cashCollected > 0 || m.digitalCollected > 0;

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
        {hasCashSplit && <CashBadge value={m.cashCollected} />}
        <MetricCell
          icon={Wallet}
          value={`৳${fmt(m.totalCollected)}`}
          unit="কালেকশন"
          accent={TEAL}
          active={open}
          onClick={() => setOpen((p) => !p)}
        />
      </div>

      {open && (
        <div className="pl-9 pr-1 mt-2">
          {isHospital && (
            <div className="flex items-center gap-2 mb-2">
              <SourcePill label="OPD" value={m.opdCollected} />
              <SourcePill label="IPD" value={m.ipdCollected} isIpd />
            </div>
          )}
          {m.collections.length === 0 ? (
            <p className="font-['IBM_Plex_Mono'] text-xs text-[#A8ACA3] py-2 font-noto">
              এই সময়সীমায় কোনো কালেকশন নেই
            </p>
          ) : (
            <>
              {m.hasMore && (
                <div className="flex items-center gap-1.5 px-2 py-1.5 mb-2 rounded-sm bg-[#C0312B]/[0.06]">
                  <AlertCircle className="w-3 h-3 shrink-0" style={{ color: SEAL_RED }} />
                  <p className="font-['IBM_Plex_Mono'] text-[10px] font-noto" style={{ color: SEAL_RED }}>
                    {m.transactionCount} টি লেনদেনের মধ্যে ২০০টি দেখানো হচ্ছে — সম্পূর্ণ তালিকার জন্য সময়সীমা ছোট করুন
                  </p>
                </div>
              )}
              {m.collections.map((c, i) => (
                <CollectionRow key={`${c.source}-${c.invoiceId}-${i}`} col={c} idx={i} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────

const CollectionReport = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const lab = useAuthStore((state) => state.lab);
  const isStaff = user?.role === "staff";
  const isHospital = user?.type === "hospital";

  // ─── PERMISSION CHECK (before any hooks) ──────────────────────────────────
  const isAdmin = user?.role === "admin";
  const hasAccess = isAdmin || !!user?.permissions?.collectionReport === true;

  if (!hasAccess) {
    return <Popup type="denied" message="কালেকশন রিপোর্ট দেখার অনুমতি আপনার নেই।" onClose={() => navigate("/")} />;
  }

  // ─── Only now declare state and side effects ──────────────────────────────

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [popup, setPopup] = useState(null);
  const [offlinePopup, setOfflinePopup] = useState(false); // ← separate offline state
  const [timeRange, setTimeRange] = useState(null);

  useEffect(() => {
    const range = todayRange();
    setTimeRange(range);
    fetchData(range);
  }, []);

  const fetchData = async (range) => {
    try {
      setLoading(true);
      const res = await collectionService.getSummary({ startDate: range.start, endDate: range.end });
      setData(res.data);
    } catch (err) {
      if (isNetworkError(err)) {
        setOfflinePopup(true); // ← show default offline popup
        return;
      }
      setPopup({
        type: "error",
        message: getErrorMessage(err, "লেনদেনের তথ্য লোড করা সম্ভব হয়নি। আবার চেষ্টা করুন।"),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFetchData = (start, end) => {
    const range = { start, end };
    setTimeRange(range);
    fetchData(range);
  };

  // ─── Print via isolated iframe ────────────────────────────────────────────
  // Printing straight from the page (window.print() + visibility:hidden) still
  // leaves the rest of the app in the layout tree, which is what causes the
  // stray blank page on mobile. Instead we clone just the report into a
  // throwaway iframe and print that in isolation.
  const printReport = () => {
    const printable = document.getElementById("transactions-printable");
    if (!printable) return;

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow.document;

    // Carry over every stylesheet/style tag from the host page so Tailwind
    // utilities and the IBM Plex / Noto fonts render identically.
    const styleTags = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map((node) => node.outerHTML)
      .join("\n");

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          ${styleTags}
          <style>
            @page { margin: 12mm; }
            html, body { margin: 0; padding: 0; background: #fff; height: auto; }
          </style>
        </head>
        <body>${printable.outerHTML}</body>
      </html>
    `);
    doc.close();

    const triggerPrint = () => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      // Give the print dialog a moment to actually open before we tear
      // the iframe down (mobile Safari especially needs this).
      setTimeout(() => document.body.removeChild(iframe), 1000);
    };

    // Printing before fonts/stylesheets finish applying is the other common
    // cause of a phantom extra page — wait for the iframe to fully load first.
    if (doc.readyState === "complete") {
      setTimeout(triggerPrint, 250);
    } else {
      iframe.onload = () => setTimeout(triggerPrint, 250);
    }
  };

  const d = data ?? EMPTY_DATA;
  const headingLabel = buildHeadingLabel(timeRange?.start, timeRange?.end);
  const modeEntries = Object.entries(d.totals.byMode ?? {}).filter(([, value]) => value > 0);

  return (
    <section className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 px-4 py-6 font-noto">
      {popup && <Popup type={popup.type} message={popup.message} onClose={() => setPopup(null)} />}
      {offlinePopup && <Popup type="offline" onClose={() => setOfflinePopup(false)} />}

      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="font-['IBM_Plex_Sans'] text-2xl sm:text-3xl font-semibold text-[#1C1F1E] font-noto">
              কালেকশন রিপোর্ট
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={printReport}
              disabled={loading}
              className="px-3 py-2 rounded-sm border border-[#1C1F1E]/15 text-[#1C1F1E] hover:bg-[#1C1F1E] hover:text-white transition-colors flex items-center gap-1.5 font-['IBM_Plex_Mono'] text-xs uppercase disabled:opacity-40 disabled:cursor-not-allowed font-noto"
            >
              <Printer className="w-3.5 h-3.5" /> Print
            </button>
            <Link
              to="/daily-reports"
              className="px-3 py-2 rounded-sm border border-[#1C1F1E]/15 text-[#1C1F1E] hover:bg-[#1C1F1E] hover:text-white transition-colors flex items-center gap-1.5 font-['IBM_Plex_Mono'] text-xs uppercase font-noto"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </Link>
          </div>
        </div>

        <div className="mb-5">
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
            <div className="px-6 sm:px-8 pt-5 pb-4 border-b border-[#E3E0D6] flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-['IBM_Plex_Mono'] text-xs uppercase text-[#0F6E5C] mb-1 font-noto">
                  কালেকশন রিপোর্ট
                </p>
                <h2 className="font-['IBM_Plex_Sans'] text-2xl font-semibold text-[#1C1F1E] font-noto">
                  {headingLabel}
                </h2>

                {!isStaff && (
                  <div className="flex flex-nowrap divide-x divide-[#E3E0D6] mt-2">
                    <HeaderStat
                      label="মোট কালেকশন"
                      value={`৳${fmt(d.totals.totalCollected)}`}
                      accent={isHospital ? TEAL : undefined}
                    />
                    {isHospital && (
                      <>
                        <HeaderStat label="OPD" value={`৳${fmt(d.totals.opdCollected)}`} />
                        <HeaderStat label="IPD" value={`৳${fmt(d.totals.ipdCollected)}`} accent={SEAL_BLUE} />
                      </>
                    )}
                  </div>
                )}

                {!isStaff && modeEntries.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {modeEntries.map(([mode, value]) => (
                      <ModePill key={mode} label={MODE_LABELS[mode] ?? mode} value={value} />
                    ))}
                  </div>
                )}
              </div>

              <ReportSeal dateLabel={recordStamp(timeRange?.start, timeRange?.end)} reportName="Collection Report" />
            </div>

            {/* Staff ledger */}
            <div className="px-6 sm:px-8 py-5 border-t border-[#E3E0D6]">
              {d.staff.length > 0 ? (
                <div className="divide-y divide-[#EFEDE5]">
                  {d.staff.map((member, i) => (
                    <StaffEntry key={member.staffId} member={member} rank={i + 1} isHospital={isHospital} />
                  ))}
                </div>
              ) : (
                <EmptyRow label="এই সময়সীমায় কোনো কালেকশন রেকর্ড হয়নি" />
              )}
            </div>
          </div>
        )}

        <p className="font-['IBM_Plex_Mono'] text-center text-xs text-[#A8ACA3] mt-4 pb-6 font-noto">
          শুধুমাত্র সক্রিয় (ডিলিট না হওয়া) এডমিশনের কালেকশন অন্তর্ভুক্ত
        </p>
      </div>
    </section>
  );
};

export default CollectionReport;
