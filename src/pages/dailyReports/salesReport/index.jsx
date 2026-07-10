import { useState, useEffect } from "react";
import { ArrowLeft, Printer, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import TimeFrame from "../../../components/timeFrame";
import salesReportAPI from "../../../api/dailyReports/salesReport";
import expenseReportAPI from "../../../api/dailyReports/expenseReport";
import Popup from "../../../components/popup";
import { useAuthStore } from "../../../store/authStore";

const fmt = (n) => (typeof n === "number" ? n.toLocaleString("en-IN") : "0");
const money = (n) => `৳${fmt(n)}`;

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

// ── Error helpers (mirrors ManageReferrer.jsx / CashMemo.jsx / CollectionReport.jsx / CommissionReport.jsx) ──

const PERMISSION_DENIED_MESSAGE = "আপনার কর্তৃপক্ষ আপনাকে এই কাজটি করার বা এই তথ্যটি পাওয়ার অনুমতি দেয়নি।";

const getErrorMessage = (err, fallback) => {
  if (err?.response?.status === 403) return PERMISSION_DENIED_MESSAGE;
  return err?.response?.data?.error ?? fallback;
};

// ─── Merge outdoor + indoor counts by id (falls back to name) ─────────────────
const mergeCounts = (outdoor = [], indoor = [], idKey) => {
  const map = new Map();

  outdoor.forEach((o) => {
    const key = o[idKey] ?? o.name;
    map.set(key, { key, name: o.name, outdoorCount: o.count ?? 0, indoorCount: 0 });
  });

  indoor.forEach((i) => {
    const key = i[idKey] ?? i.name;
    const existing = map.get(key);
    if (existing) {
      existing.indoorCount = i.count ?? 0;
    } else {
      map.set(key, { key, name: i.name, outdoorCount: 0, indoorCount: i.count ?? 0 });
    }
  });

  return Array.from(map.values())
    .map((v) => ({ ...v, total: v.outdoorCount + v.indoorCount }))
    .sort((a, b) => b.total - a.total);
};

// ─── Expense type → Bengali label ──────────────────────────────────────────────
const EXPENSE_TYPE_LABELS = {
  staffSalary: "স্টাফ বেতন",
  medicine: "মেডিসিন",
  testKit: "টেস্ট কিট",
  products: "পণ্য",
  others: "অন্যান্য",
};

const buildExpenseRows = (byType = {}) =>
  Object.entries(byType)
    .map(([key, v]) => ({ key, name: EXPENSE_TYPE_LABELS[key] ?? key, total: v.total ?? 0, count: v.count ?? 0 }))
    .filter((r) => r.count > 0)
    .sort((a, b) => b.total - a.total);

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

// ── Single-channel row (diagnostic center: outdoor only / expense rows) ───────
const LedgerRow = ({ rank, name, count, sub }) => (
  <div>
    <div className="flex items-baseline gap-3">
      <span className="font-['IBM_Plex_Mono'] text-xs text-[#A8ACA3] tabular-nums w-5 shrink-0">
        {String(rank).padStart(2, "0")}
      </span>
      <span className="text-sm text-[#1C1F1E] font-medium truncate">{name}</span>
      <span className="flex-1 border-b border-dotted border-[#D8D5CB] translate-y-[-3px]" />
      <span className="font-['IBM_Plex_Mono'] text-sm text-[#1C1F1E] tabular-nums shrink-0">
        {count}
        {sub && <span className="text-[#A8ACA3] ml-1">{sub}</span>}
      </span>
    </div>
  </div>
);

// ── Dual-channel row (hospital: Indoor + Outdoor breakdown) ───────────────────
const LedgerRowSplit = ({ rank, name, total, indoorCount, outdoorCount }) => (
  <div>
    <div className="flex items-baseline gap-3">
      <span className="font-['IBM_Plex_Mono'] text-xs text-[#A8ACA3] tabular-nums w-5 shrink-0">
        {String(rank).padStart(2, "0")}
      </span>
      <span className="text-sm text-[#1C1F1E] font-medium truncate">{name}</span>
      <span className="flex-1 border-b border-dotted border-[#D8D5CB] translate-y-[-3px]" />
      <span className="font-['IBM_Plex_Mono'] text-sm text-[#1C1F1E] tabular-nums shrink-0">
        {fmt(total)}
        <span className="text-[#A8ACA3] ml-1">
          (Indoor-{fmt(indoorCount)}, Outdoor-{fmt(outdoorCount)})
        </span>
      </span>
    </div>
  </div>
);

const EmptyRow = ({ label }) => (
  <div className="flex items-center gap-2 py-5 text-[#A8ACA3]">
    <AlertCircle className="w-3.5 h-3.5" />
    <p className="font-['IBM_Plex_Mono'] text-xs">{label}</p>
  </div>
);

const SEAL_BLUE = "#1E4FA0";
const SEAL_RED = "#C0312B";

const RoundSeal = ({ dateLabel, label }) => (
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
          {label}
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

// ── One report section (heading + rows), reused for all categories ───────────
const LedgerSection = ({ title, items, isHospital, idKey, emptyLabel, bordered = true, renderRow }) => (
  <div className={`px-6 sm:px-8 py-5 ${bordered ? "border-b border-[#E3E0D6]" : ""}`}>
    <div className="mb-1 flex justify-between">
      <p className="font-['IBM_Plex_Mono'] text-xs uppercase text-[#6F756F] font-noto">{title}</p>
      <p className="font-['IBM_Plex_Mono'] text-xs uppercase text-[#6F756F] font-noto">পরিমাণ</p>
    </div>
    {items.length > 0 ? (
      items.map((it, i) =>
        renderRow ? (
          renderRow(it, i)
        ) : isHospital ? (
          <LedgerRowSplit
            key={it.key ?? i}
            rank={i + 1}
            name={it.name}
            total={it.total}
            indoorCount={it.indoorCount}
            outdoorCount={it.outdoorCount}
          />
        ) : (
          <LedgerRow key={it[idKey] ?? i} rank={i + 1} name={it.name} count={fmt(it.total)} />
        ),
      )
    ) : (
      <EmptyRow label={emptyLabel} />
    )}
  </div>
);

// ── Tab switcher — segmented pill, sits inline with the title ──────────────
const TAB_LABELS = { sales: "সেলস রিপোর্ট", expense: "খরচের রিপোর্ট" };

const TabSwitcher = ({ active, onChange }) => (
  <div className="inline-flex p-0.5 bg-[#EFEDE4] rounded-lg no-print">
    {Object.entries(TAB_LABELS).map(([key, label]) => (
      <button
        key={key}
        onClick={() => onChange(key)}
        className={`px-4 py-2 rounded-md font-['IBM_Plex_Mono'] text-xs uppercase tracking-wide transition-all font-noto ${
          active === key ? "bg-white text-[#0F6E5C] shadow-sm" : "text-[#8A8F89] hover:text-[#1C1F1E]"
        }`}
      >
        {label}
      </button>
    ))}
  </div>
);

const SalesReport = () => {
  const lab = useAuthStore((s) => s.lab);
  const isHospital = lab?.type === "hospital";

  const [activeTab, setActiveTab] = useState("sales");
  const [salesData, setSalesData] = useState(null);
  const [expenseData, setExpenseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [popup, setPopup] = useState(null);
  const [timeRange, setTimeRange] = useState(null);
  // Tracks which {start, end} each tab's data was last fetched for, so a tab
  // switch can tell "I have data" apart from "I have data for THIS range".
  const [fetchedRange, setFetchedRange] = useState({ sales: null, expense: null });

  useEffect(() => {
    const range = todayRange();
    setTimeRange(range);
    fetchData(range, activeTab);
  }, []);

  const fetchData = async (range, tab) => {
    try {
      setLoading(true);
      if (tab === "sales") {
        const res = await salesReportAPI.getSummary({ startDate: range.start, endDate: range.end });
        setSalesData(res.data);
      } else {
        const res = await expenseReportAPI.getSummary({ startDate: range.start, endDate: range.end });
        setExpenseData(res.data);
      }
      setFetchedRange((prev) => ({ ...prev, [tab]: range }));
    } catch (err) {
      setPopup({ type: "error", message: getErrorMessage(err, "রিপোর্ট লোড করা সম্ভব হয়নি। আবার চেষ্টা করুন।") });
    } finally {
      setLoading(false);
    }
  };

  const handleFetchData = (start, end) => {
    const range = { start, end };
    setTimeRange(range);
    fetchData(range, activeTab);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (!timeRange) return;
    const last = fetchedRange[tab];
    const isStale = !last || last.start !== timeRange.start || last.end !== timeRange.end;
    if (isStale) fetchData(timeRange, tab);
  };

  // ── Sales derived data ──────────────────────────────────────────────────
  const testCounts = isHospital
    ? mergeCounts(salesData?.testCounts, salesData?.indoorTestCounts, "testId")
    : (salesData?.testCounts ?? []).map((t) => ({ ...t, total: t.count }));

  const productCounts = isHospital
    ? mergeCounts(salesData?.productCounts, salesData?.indoorProductCounts, "productId")
    : (salesData?.productCounts ?? []).map((p) => ({ ...p, total: p.count }));

  const medicineCounts = isHospital
    ? mergeCounts(salesData?.medicineCounts, salesData?.indoorMedicineCounts, "productId")
    : (salesData?.medicineCounts ?? []).map((m) => ({ ...m, total: m.count }));

  const serviceCounts = isHospital
    ? mergeCounts(salesData?.serviceCounts, salesData?.indoorServiceCounts, "productId")
    : (salesData?.serviceCounts ?? []).map((s) => ({ ...s, total: s.count }));

  const totalTestOrders = testCounts.reduce((sum, t) => sum + (t.total ?? 0), 0);
  const totalProductUnits = productCounts.reduce((sum, p) => sum + (p.total ?? 0), 0);
  const totalMedicineUnits = medicineCounts.reduce((sum, m) => sum + (m.total ?? 0), 0);
  const totalServiceUnits = serviceCounts.reduce((sum, s) => sum + (s.total ?? 0), 0);

  // ── Expense derived data ────────────────────────────────────────────────
  const expenseRows = buildExpenseRows(expenseData?.byType);
  const grandTotal = expenseData?.grandTotal ?? 0;
  const totalEntries = expenseData?.totalEntries ?? 0;

  const headingLabel = buildHeadingLabel(timeRange?.start, timeRange?.end);

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
        <div className="mb-5 no-print">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <p className="font-['IBM_Plex_Mono'] text-xs uppercase text-[#0F6E5C] mb-1 font-noto">ল্যাব অপারেশন</p>
              <h1 className="font-['IBM_Plex_Sans'] text-2xl sm:text-3xl font-semibold text-[#1C1F1E] font-noto">
                {activeTab === "sales" ? "সেলস রিপোর্ট" : "খরচের রিপোর্ট"}
              </h1>
            </div>
            <div className="flex items-center gap-2 shrink-0">
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

          <TabSwitcher active={activeTab} onChange={handleTabChange} />
        </div>

        <div className="mb-5 no-print">
          <TimeFrame onFetchData={handleFetchData} />
        </div>

        {loading ? (
          <SkeletonManifest />
        ) : activeTab === "sales" ? (
          <div
            id="salesreport-printable"
            className="bg-white border border-[#E3E0D6] rounded-lg shadow-[0_1px_2px_rgba(28,31,30,0.04)] overflow-hidden"
          >
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
                  <br />
                  মোট মেডিসিন- {fmt(totalMedicineUnits)}টি
                  <br />
                  মোট সার্ভিস- {fmt(totalServiceUnits)}টি
                </p>
              </div>

              <RoundSeal dateLabel={recordStamp(timeRange?.start, timeRange?.end)} label="Sales Report" />
            </div>

            <LedgerSection
              title="টেস্টের নাম"
              items={testCounts}
              isHospital={isHospital}
              idKey="testId"
              emptyLabel="এই সময়সীমায় কোনো টেস্ট অর্ডার হয়নি"
            />
            <LedgerSection
              title="পণ্যের নাম"
              items={productCounts}
              isHospital={isHospital}
              idKey="productId"
              emptyLabel="এই সময়সীমায় কোনো পণ্য বিক্রি হয়নি"
            />
            <LedgerSection
              title="মেডিসিনের নাম"
              items={medicineCounts}
              isHospital={isHospital}
              idKey="productId"
              emptyLabel="এই সময়সীমায় কোনো মেডিসিন বিক্রি হয়নি"
            />
            <LedgerSection
              title="সার্ভিসের নাম"
              items={serviceCounts}
              isHospital={isHospital}
              idKey="productId"
              emptyLabel="এই সময়সীমায় কোনো সার্ভিস প্রদান করা হয়নি"
              bordered={false}
            />
          </div>
        ) : (
          <div
            id="salesreport-printable"
            className="bg-white border border-[#E3E0D6] rounded-lg shadow-[0_1px_2px_rgba(28,31,30,0.04)] overflow-hidden"
          >
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

            <div className="px-6 sm:px-8 pt-6 pb-5 border-b border-[#E3E0D6] flex items-start justify-between gap-4">
              <div>
                <p className="font-['IBM_Plex_Mono'] text-xs uppercase text-[#0F6E5C] mb-1.5 font-noto">
                  খরচের রিপোর্ট
                </p>
                <h2 className="font-['IBM_Plex_Sans'] text-2xl font-semibold text-[#1C1F1E] font-noto">
                  {headingLabel}
                </h2>
                <p className="font-['IBM_Plex_Mono'] text-sm text-[#8A8F89] mt-1.5 font-noto">
                  মোট খরচ- {money(grandTotal)}
                  <br />
                  মোট এন্ট্রি- {fmt(totalEntries)}টি
                </p>
              </div>

              <RoundSeal dateLabel={recordStamp(timeRange?.start, timeRange?.end)} label="Expense Report" />
            </div>

            <LedgerSection
              title="খাতের নাম"
              items={expenseRows}
              emptyLabel="এই সময়সীমায় কোনো খরচ যুক্ত হয়নি"
              bordered={false}
              renderRow={(row, i) => (
                <LedgerRow
                  key={row.key}
                  rank={i + 1}
                  name={row.name}
                  count={money(row.total)}
                  sub={`(${fmt(row.count)}টি)`}
                />
              )}
            />
          </div>
        )}

        <p className="font-['IBM_Plex_Mono'] text-center text-xs text-[#A8ACA3] mt-4 pb-6 no-print font-noto">
          {activeTab === "sales"
            ? "শুধুমাত্র সক্রিয় (ডিলিট না হওয়া) ইনভয়েসের হিসাব অন্তর্ভুক্ত"
            : "শুধুমাত্র সক্রিয় (ডিলিট না হওয়া) খরচের হিসাব অন্তর্ভুক্ত"}
        </p>
      </div>
    </section>
  );
};

export default SalesReport;
