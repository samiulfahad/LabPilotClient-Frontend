import { useState, useEffect } from "react";
import { ArrowLeft, Printer, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import TimeFrame from "../../../components/timeFrame";
import salesReportAPI from "../../../api/salesReport";
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

const SkeletonManifest = () => (
  <div className="bg-white border border-[#E3E0D6] rounded-lg overflow-hidden animate-pulse">
    <div className="h-[3px] bg-[#E3E0D6]" />
    <div className="px-6 sm:px-8 pt-6 pb-5 border-b border-[#E3E0D6] space-y-2">
      <div className="h-2.5 w-28 bg-[#ECE9DF] rounded-sm" />
      <div className="h-6 w-48 bg-[#ECE9DF] rounded-sm" />
    </div>
    {[0, 1].map((i) => (
      <div key={i} className="px-6 sm:px-8 py-5 border-b border-[#E3E0D6] last:border-b-0 space-y-3">
        <div className="h-2.5 w-24 bg-[#ECE9DF] rounded-sm" />
        {[0, 1, 2].map((j) => (
          <div key={j} className="flex items-center gap-3">
            <div className="h-3 w-5 bg-[#ECE9DF] rounded-sm" />
            <div className="h-3 flex-1 bg-[#ECE9DF] rounded-sm" />
            <div className="h-3 w-8 bg-[#ECE9DF] rounded-sm" />
          </div>
        ))}
      </div>
    ))}
  </div>
);

const LedgerRow = ({ rank, name, count }) => {
  return (
    <div>
      <div className="flex items-baseline gap-3">
        <span className="font-['IBM_Plex_Mono'] text-xs text-[#A8ACA3] tabular-nums w-5 shrink-0">
          {String(rank).padStart(2, "0")}
        </span>
        <span className="text-sm text-[#1C1F1E] font-medium truncate">{name}</span>
        <span className="flex-1 border-b border-dotted border-[#D8D5CB] translate-y-[-3px]" />
        <span className="font-['IBM_Plex_Mono'] text-sm text-[#1C1F1E] tabular-nums shrink-0">{fmt(count)}</span>
      </div>
    </div>
  );
};

const EmptyRow = ({ label }) => (
  <div className="flex items-center gap-2 py-5 text-[#A8ACA3]">
    <AlertCircle className="w-3.5 h-3.5" />
    <p className="font-['IBM_Plex_Mono'] text-xs">{label}</p>
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
            Sales Report
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

const SalesReport = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [popup, setPopup] = useState(null);
  const [timeRange, setTimeRange] = useState(null);

  useEffect(() => {
    const range = todayRange();
    setTimeRange(range);
    fetchStats(range);
  }, []);

  const fetchStats = async (range) => {
    try {
      setLoading(true);
      const res = await salesReportAPI.getSummary({ startDate: range.start, endDate: range.end });
      setData(res.data);
    } catch {
      setPopup({ type: "error", message: "টেস্ট স্ট্যাটস লোড করা সম্ভব হয়নি। আবার চেষ্টা করুন।" });
    } finally {
      setLoading(false);
    }
  };

  const handleFetchData = (start, end) => {
    const range = { start, end };
    setTimeRange(range);
    fetchStats(range);
  };

  const testCounts = data?.testCounts ?? [];
  const productCounts = data?.productCounts ?? [];
  const headingLabel = buildHeadingLabel(timeRange?.start, timeRange?.end);

  const totalTestOrders = testCounts.reduce((sum, t) => sum + (t.count ?? 0), 0);
  const totalProductUnits = productCounts.reduce((sum, p) => sum + (p.count ?? 0), 0);

  return (
    <section className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 px-4 py-6 font-noto">
      {popup && <Popup type={popup.type} message={popup.message} onClose={() => setPopup(null)} />}

      <style>{`
        @media print {
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body * { visibility: hidden; }
          #salesreport-printable, #salesreport-printable * { visibility: visible; }
          #salesreport-printable { position: fixed; top: 0; left: 0; width: 100%; padding: 32px; box-shadow: none; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-5 no-print">
          <div>
            <p className="font-['IBM_Plex_Mono'] text-xs uppercase text-[#0F6E5C] mb-1 font-noto">ল্যাব অপারেশন</p>
            <h1 className="font-['IBM_Plex_Sans'] text-2xl sm:text-3xl font-semibold text-[#1C1F1E] font-noto">
              সেলস রিপোর্ট
            </h1>
            <p className="text-base text-[#767D78] mt-1 font-noto">
              নির্ধারিত সময়সীমায় মধ্যে প্রাপ্ত টেস্ট ও পণ্যের সংখ্যা।
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
            id="salesreport-printable"
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
                <p className="font-['IBM_Plex_Mono'] text-xs uppercase text-[#0F6E5C] mb-1.5 font-noto">সেলস রিপোর্ট</p>
                <h2 className="font-['IBM_Plex_Sans'] text-2xl font-semibold text-[#1C1F1E] font-noto">
                  {headingLabel}
                </h2>
                <p className="font-['IBM_Plex_Mono'] text-sm text-[#8A8F89] mt-1.5 font-noto">
                  মোট টেস্ট- {fmt(totalTestOrders)}টি
                  <br />
                  মোট পণ্য- {fmt(totalProductUnits)}টি
                </p>
              </div>

              <RoundSeal dateLabel={recordStamp(timeRange?.start, timeRange?.end)} />
            </div>

            {/* Tests */}
            <div className="px-6 sm:px-8 py-5 border-b border-[#E3E0D6]">
              <div className="mb-1 flex justify-between">
                <p className="font-['IBM_Plex_Mono'] text-xs uppercase text-[#6F756F] font-noto">টেস্টের নাম</p>
                <p className="font-['IBM_Plex_Mono'] text-xs uppercase text-[#6F756F] font-noto">পরিমাণ</p>
              </div>
              {testCounts.length > 0 ? (
                testCounts.map((t, i) => <LedgerRow key={t.testId ?? i} rank={i + 1} name={t.name} count={t.count} />)
              ) : (
                <EmptyRow label="এই সময়সীমায় কোনো টেস্ট অর্ডার হয়নি" />
              )}
            </div>

            {/* Products */}
            <div className="px-6 sm:px-8 py-5">
              <div className="mb-1 flex justify-between">
                <p className="font-['IBM_Plex_Mono'] text-xs uppercase text-[#6F756F] font-noto">পণ্যের নাম</p>
                <p className="font-['IBM_Plex_Mono'] text-xs uppercase text-[#6F756F] font-noto">পরিমাণ</p>
              </div>
              {productCounts.length > 0 ? (
                productCounts.map((p, i) => (
                  <LedgerRow key={p.productId ?? i} rank={i + 1} name={p.name} count={p.count} />
                ))
              ) : (
                <EmptyRow label="এই সময়সীমায় কোনো পণ্য বিক্রি হয়নি" />
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

export default SalesReport;
