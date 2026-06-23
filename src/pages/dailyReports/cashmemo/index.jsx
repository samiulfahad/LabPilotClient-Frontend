import { useState, useEffect } from "react";
import { ArrowLeft, Printer, Trash2, PackageCheck, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import TimeFrame from "../../../components/timeFrame";
import cashmemoService from "../../../api/cashmemo";
import Popup from "../../../components/popup";

const fmt = (n) => (typeof n === "number" ? n.toLocaleString("en-IN") : "0");

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

const SkeletonReceipt = () => (
  <div className="bg-white border border-[#E3E0D6] rounded-lg overflow-hidden animate-pulse">
    <div className="h-[3px] bg-[#E3E0D6]" />
    <div className="px-6 sm:px-8 pt-6 pb-5 border-b border-[#E3E0D6] space-y-2">
      <div className="h-2.5 w-24 bg-[#ECE9DF] rounded-sm" />
      <div className="h-6 w-48 bg-[#ECE9DF] rounded-sm" />
    </div>
    <div className="px-6 sm:px-8 py-5 space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="h-3 w-28 bg-[#ECE9DF] rounded-sm" />
          <div className="h-3 flex-1 bg-[#ECE9DF] rounded-sm" />
          <div className="h-3 w-14 bg-[#ECE9DF] rounded-sm" />
        </div>
      ))}
      <div className="h-20 w-full bg-[#ECE9DF] rounded-sm my-4" />
      <div className="h-28 w-full bg-[#ECE9DF] rounded-sm mx-auto max-w-xs" />
    </div>
  </div>
);

const ReceiptLine = ({ label, value, tone = "#1C1F1E", icon: Icon, bold = false }) => (
  <div className="flex items-baseline gap-3 py-2.5">
    <span
      className={`flex items-center gap-1.5 text-base shrink-0 font-noto ${bold ? "font-semibold" : "font-medium"}`}
      style={{ color: bold ? tone : "#1C1F1E" }}
    >
      {Icon && <Icon className="w-3.5 h-3.5" style={{ color: tone }} />}
      {label}
    </span>
    <span className="flex-1 border-b border-dotted border-[#D8D5CB] translate-y-[-3px]" />
    <span
      className={`font-['IBM_Plex_Mono'] text-sm tabular-nums shrink-0 ${bold ? "font-semibold" : ""}`}
      style={{ color: tone }}
    >
      {value}
    </span>
  </div>
);

const LedgerCell = ({ icon: Icon, label, value, accent, sub }) => (
  <div className="px-5 py-4 border-l-[3px]" style={{ borderColor: accent }}>
    <div className="flex items-center gap-1.5 mb-1.5">
      <Icon className="w-3.5 h-3.5" style={{ color: accent }} />
      <p className="font-['IBM_Plex_Mono'] text-xs uppercase text-[#6F756F] font-noto">{label}</p>
    </div>
    <p className="font-['IBM_Plex_Mono'] text-2xl font-semibold text-[#1C1F1E] tabular-nums">{value}</p>
    {sub && <p className="font-['IBM_Plex_Mono'] text-xs text-[#8A8F89] mt-1 font-noto">{sub}</p>}
  </div>
);

const SEAL_BLUE = "#1E4FA0";
const SEAL_RED = "#C0312B";

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
            className="text-center font-['IBM_Plex_Mono'] font-extrabold uppercase"
            style={{ color: SEAL_RED, fontSize: "15px", letterSpacing: "1.5px" }}
          >
            Cashmemo
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

const TEAL = "#0F6E5C";
const OCHRE = "#B5772A";
const RUST = "#B23A2E";

const CashMemo = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [popup, setPopup] = useState(null);
  const [timeRange, setTimeRange] = useState(null);

  useEffect(() => {
    const range = todayRange();
    setTimeRange(range);
    fetchSummary(range);
  }, []);

  const fetchSummary = async (range) => {
    try {
      setLoading(true);
      const res = await cashmemoService.getSummary({ startDate: range.start, endDate: range.end });
      setSummary(res.data);
    } catch {
      setPopup({ type: "error", message: "ডেটা লোড করা সম্ভব হয়নি। আবার চেষ্টা করুন।" });
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
  const grossCounterAmount = (d.initial ?? 0) - (d.labAdjustment ?? 0) - (d.referrerDiscount ?? 0);

  return (
    <section className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 px-4 py-6 font-noto">
      {popup && <Popup type={popup.type} message={popup.message} onClose={() => setPopup(null)} />}

      <style>{`
        @media print {
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body * { visibility: hidden; }
          #cashmemo-printable, #cashmemo-printable * { visibility: visible; }
          #cashmemo-printable { position: fixed; top: 0; left: 0; width: 100%; padding: 32px; box-shadow: none; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-5 no-print">
          <div>
            <p className="font-['IBM_Plex_Mono'] text-xs uppercase text-[#0F6E5C] mb-1 font-noto">ল্যাব অপারেশন</p>
            <h1 className="font-['IBM_Plex_Sans'] text-2xl sm:text-3xl font-semibold text-[#1C1F1E] font-noto">
              ক্যাশমেমু
            </h1>
            <p className="text-base text-[#767D78] mt-1 font-noto">নির্ধারিত সময়ের বিক্রি ও আয়ের হিসাব</p>
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
          <SkeletonReceipt />
        ) : (
          <div
            id="cashmemo-printable"
            className="bg-white border border-[#E3E0D6] rounded-lg shadow-[0_1px_2px_rgba(28,31,30,0.04)] overflow-hidden"
          >
            {/* Letterhead */}
            <div className="px-6 sm:px-8 pt-5 pb-4 text-center border-b border-[#E3E0D6] bg-[#FAF9F5]">
              <h3 className="font-['IBM_Plex_Sans'] text-lg font-bold text-[#1C1F1E] tracking-wide font-noto">
                Azizul Haque Diagonostic Center
              </h3>
              <p className="font-['IBM_Plex_Mono'] text-xs text-[#6F756F] mt-1 font-noto">
                Hospital Road, Bhaluka, Mymensingh
              </p>
            </div>

            {/* Header band */}
            <div className="px-6 sm:px-8 pt-6 pb-5 border-b border-[#E3E0D6] flex items-start justify-between gap-4">
              <div>
                <p className="font-['IBM_Plex_Mono'] text-xs uppercase text-[#0F6E5C] mb-1.5 font-noto">ক্যাশ মেমু</p>
                <h2 className="font-['IBM_Plex_Sans'] text-2xl font-semibold text-[#1C1F1E] font-noto">
                  {headingLabel}
                </h2>
                <p className="font-['IBM_Plex_Mono'] text-sm text-[#8A8F89] mt-1.5 font-noto">
                  {d.totalInvoices ?? 0}টি ইনভয়েস রেকর্ড করা হয়েছে
                </p>
              </div>

              <RoundSeal dateLabel={recordStamp(timeRange?.start, timeRange?.end)} />
            </div>

            <div className="px-6 sm:px-8 py-5">
              {/* Line items */}
              <div className="divide-y divide-[#F0EEE6]">
                <ReceiptLine label="মোট বিক্রি" value={`৳${fmt(d.initial)}`} bold />
                <ReceiptLine label="ল্যাব ডিস্কাউন্ট" value={`− ৳${fmt(d.labAdjustment)}`} tone={OCHRE} />
                <ReceiptLine label="রেফারার ডিস্কাউন্ট" value={`− ৳${fmt(d.referrerDiscount)}`} tone={OCHRE} />
              </div>

              {/* Gross counter subtotal */}
              <div className="mt-3 pt-3 border-t-2 border-[#1C1F1E]/10">
                <ReceiptLine label="সকল ডিসকাউন্ট বাদে আয় (নিট টোটাল)" value={`৳${fmt(grossCounterAmount)}`} bold />
              </div>

              {/* Collected / Due split */}
              <div className="grid grid-cols-2 divide-x divide-[#E3E0D6] border border-[#E3E0D6] rounded-sm my-4">
                <LedgerCell icon={PackageCheck} label="নগদ" value={`৳${fmt(d.totalPaid)}`} accent={TEAL} />
                <LedgerCell icon={Clock} label="বাকি" value={`৳${fmt(d.totalDue)}`} accent={RUST} />
              </div>

              {/* Commission */}
              <div className="pt-1">
                <ReceiptLine label="মোট কমিশন" value={`− ৳${fmt(d.referrerCommission)}`} tone={OCHRE} bold />
              </div>

              {/* Formula */}
              <div className="flex items-center gap-2 my-4">
                <div className="flex-1 h-px bg-[#E3E0D6]" />
                <span className="font-['IBM_Plex_Mono'] text-xs text-[#8A8F89] bg-[#F5F4EF] border border-[#E3E0D6] rounded-sm px-3 py-1 whitespace-nowrap uppercase font-noto">
                  নিট টোটাল থেকে মোট কমিশন বাদ দেওয়ার পর
                </span>
                <div className="flex-1 h-px bg-[#E3E0D6]" />
              </div>

              {/* Net Earning stamp */}
              <div className="flex justify-center py-3">
                <div className="relative rotate-[-1.5deg] border-2 border-[#0F6E5C] rounded-md px-10 py-5 text-center">
                  <div className="absolute inset-[3px] border border-[#0F6E5C]/40 rounded-sm pointer-events-none" />
                  <p className="font-['IBM_Plex_Mono'] text-xs uppercase text-[#0F6E5C] mb-1 font-noto">নিট আয়</p>
                  <p className="font-['IBM_Plex_Mono'] text-4xl font-bold text-[#0F6E5C] tabular-nums">
                    ৳{fmt(d.totalNet)}
                  </p>
                </div>
              </div>

              {/* Deleted invoices */}
              <div className="flex items-center justify-between px-4 py-2.5 border border-[#E3D9D5] bg-[#FBF2F0] rounded-sm mt-3">
                <div className="flex items-center gap-2">
                  <Trash2 className="w-3.5 h-3.5 text-[#B23A2E] shrink-0" />
                  <p className="text-sm font-medium text-[#1C1F1E] font-noto">ডিলিট করা ইনভয়েস</p>
                  <span className="font-['IBM_Plex_Mono'] text-xs text-[#A8807A] font-noto">
                    (সকল হিসাব থেকে বাদ দেওয়া হয়েছে)
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-['IBM_Plex_Mono'] text-sm font-semibold text-[#B23A2E] tabular-nums">
                    {d.deletedCount ?? 0}টি
                  </span>
                  <span className="text-[#B23A2E]/40">·</span>
                  <span className="font-['IBM_Plex_Mono'] text-sm text-[#B23A2E]/70 tabular-nums">
                    এবং টাকার পরিমাণ ৳{fmt(d.totalAmountDeleted ?? 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <p className="font-['IBM_Plex_Mono'] text-center text-xs text-[#A8ACA3] mt-4 pb-6 no-print font-noto">
          নিট আয় = মোট পরিমাণ − ল্যাব সমন্বয় − রেফারার ডিস্কাউন্ট − কমিশন
        </p>
      </div>
    </section>
  );
};

export default CashMemo;
