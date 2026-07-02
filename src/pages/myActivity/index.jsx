/**
 * useCallback / useMemo are intentionally absent throughout this file.
 * babel-plugin-react-compiler handles all memoization automatically.
 */
import { useState, useEffect } from "react";
import { ArrowLeft, Wallet, Receipt, Stethoscope, BedDouble, FileText, History, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import TimeFrame from "../../components/timeFrame";
import myActivityAPI from "../../api/myActivity";
import Popup from "../../components/popup";
import { useAuthStore } from "../../store/authStore";

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

const fmtDateTime = (ts) => {
  if (!ts) return "—";
  const d = new Date(ts);
  return d.toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
};

// ─── Constants ────────────────────────────────────────────────────────────────

const TEAL = "#0F6E5C";
const INK = "#1C1F1E";
const SEAL_BLUE = "#1E4FA0";

const EMPTY_DATA = { totalCollected: 0, opdCollected: 0, ipdCollected: 0, invoiceCount: 0, isHospital: false };

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const SkeletonCard = () => (
  <div className="bg-white border border-[#E3E0D6] rounded-lg p-5 animate-pulse space-y-3">
    <div className="h-3 w-20 bg-[#ECE9DF] rounded-sm" />
    <div className="h-7 w-28 bg-[#ECE9DF] rounded-sm" />
  </div>
);

const SkeletonRow = () => (
  <div className="flex items-center justify-between px-4 py-3 border-b border-dotted border-[#E3E0D6] animate-pulse">
    <div className="h-3 w-32 bg-[#ECE9DF] rounded-sm" />
    <div className="h-3 w-16 bg-[#ECE9DF] rounded-sm" />
  </div>
);

// ─── Stat card ────────────────────────────────────────────────────────────────

const StatCard = ({ icon: Icon, label, value, accent }) => (
  <div className="bg-white border border-[#E3E0D6] rounded-lg p-5 flex flex-col gap-2">
    <div className="flex items-center gap-2">
      <div
        className="w-7 h-7 rounded-sm flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${accent ?? TEAL}0D` }}
      >
        <Icon className="w-3.5 h-3.5" style={{ color: accent ?? TEAL }} />
      </div>
      <span className="font-['IBM_Plex_Mono'] text-xs uppercase text-[#A8ACA3] font-noto">{label}</span>
    </div>
    <span className="font-['IBM_Plex_Mono'] text-2xl font-semibold tabular-nums" style={{ color: accent ?? INK }}>
      {value}
    </span>
  </div>
);

// ─── Toggle button ────────────────────────────────────────────────────────────

const ToggleButton = ({ icon: Icon, label, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border font-['IBM_Plex_Mono'] text-xs uppercase transition-colors font-noto ${
      active
        ? "bg-[#0F6E5C] border-[#0F6E5C] text-white"
        : "bg-white border-[#E3E0D6] text-[#1C1F1E] hover:border-[#0F6E5C]/40"
    }`}
  >
    <Icon className="w-3.5 h-3.5" />
    {label}
    <ChevronDown className={`w-3.5 h-3.5 ml-auto transition-transform ${active ? "rotate-180" : ""}`} />
  </button>
);

// ─── Invoices panel ───────────────────────────────────────────────────────────

const InvoicesPanel = ({ loading, invoices }) => {
  if (loading) {
    return (
      <div className="bg-white border border-[#E3E0D6] border-t-0 rounded-b-lg overflow-hidden">
        {[0, 1, 2].map((i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    );
  }

  if (!invoices?.length) {
    return (
      <div className="bg-white border border-[#E3E0D6] border-t-0 rounded-b-lg px-4 py-8 text-center">
        <p className="text-sm text-[#A8ACA3] font-noto">এই সময়সীমায় কোনো ইনভয়েস পাওয়া যায়নি</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#E3E0D6] border-t-0 rounded-b-lg overflow-hidden">
      <div className="max-h-96 overflow-y-auto">
        {invoices.map((inv) => (
          <div
            key={inv.invoiceId ?? `${inv.patient?.name}-${inv.createdAt}`}
            className="flex items-center justify-between gap-3 px-4 py-3 border-b border-dotted border-[#E3E0D6] last:border-b-0"
          >
            <div className="min-w-0 flex-1">
              <p className="font-['IBM_Plex_Mono'] text-sm text-[#1C1F1E] truncate">
                #{inv.invoiceId} — {inv.patient?.name || "—"}
              </p>
              <p className="text-xs text-[#A8ACA3] font-noto">{fmtDateTime(inv.createdAt)}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-['IBM_Plex_Mono'] text-sm font-semibold tabular-nums" style={{ color: TEAL }}>
                ৳{fmt(inv.amount?.final)}
              </p>
              <p className="text-xs text-[#A8ACA3] font-['IBM_Plex_Mono'] tabular-nums">
                প্রদত্ত ৳{fmt(inv.amount?.paid)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Collections panel ────────────────────────────────────────────────────────

const CollectionsPanel = ({ loading, collections }) => {
  if (loading) {
    return (
      <div className="bg-white border border-[#E3E0D6] border-t-0 rounded-b-lg overflow-hidden">
        {[0, 1, 2].map((i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    );
  }

  if (!collections?.length) {
    return (
      <div className="bg-white border border-[#E3E0D6] border-t-0 rounded-b-lg px-4 py-8 text-center">
        <p className="text-sm text-[#A8ACA3] font-noto">এই সময়সীমায় কোনো কালেকশন পাওয়া যায়নি</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#E3E0D6] border-t-0 rounded-b-lg overflow-hidden">
      <div className="max-h-96 overflow-y-auto">
        {collections.map((c, idx) => (
          <div
            key={`${c.source}-${c.refId}-${c.at}-${idx}`}
            className="flex items-center justify-between gap-3 px-4 py-3 border-b border-dotted border-[#E3E0D6] last:border-b-0"
          >
            <div className="min-w-0 flex-1 flex items-center gap-2">
              <span
                className="shrink-0 px-1.5 py-0.5 rounded-sm text-[10px] font-['IBM_Plex_Mono'] uppercase font-semibold"
                style={{
                  backgroundColor: c.source === "ipd" ? `${SEAL_BLUE}0D` : `${TEAL}0D`,
                  color: c.source === "ipd" ? SEAL_BLUE : TEAL,
                }}
              >
                {c.source === "ipd" ? "IPD" : "OPD"}
              </span>
              <div className="min-w-0">
                <p className="font-['IBM_Plex_Mono'] text-sm text-[#1C1F1E] truncate">
                  #{c.refId} — {c.patientName || "—"}
                </p>
                <p className="text-xs text-[#A8ACA3] font-noto">{fmtDateTime(c.at)}</p>
              </div>
            </div>
            <p className="font-['IBM_Plex_Mono'] text-sm font-semibold tabular-nums shrink-0" style={{ color: TEAL }}>
              ৳{fmt(c.amount)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────

const MyActivity = () => {
  const user = useAuthStore((state) => state.user);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [popup, setPopup] = useState(null);
  const [timeRange, setTimeRange] = useState(null);

  // On-demand panels
  const [activePanel, setActivePanel] = useState(null); // "invoices" | "collections" | null
  const [invoices, setInvoices] = useState(null);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [collections, setCollections] = useState(null);
  const [collectionsLoading, setCollectionsLoading] = useState(false);

  useEffect(() => {
    const range = todayRange();
    setTimeRange(range);
    fetchData(range);
  }, []);

  const fetchData = async (range) => {
    try {
      setLoading(true);
      const res = await myActivityAPI.getSummary({ startDate: range.start, endDate: range.end });
      setData(res.data);
    } catch {
      setPopup({ type: "error", message: "কার্যক্রমের তথ্য লোড করা সম্ভব হয়নি। আবার চেষ্টা করুন।" });
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoices = async (range) => {
    try {
      setInvoicesLoading(true);
      const res = await myActivityAPI.getInvoices({ startDate: range.start, endDate: range.end });
      setInvoices(res.data.invoices ?? []);
    } catch {
      setPopup({ type: "error", message: "ইনভয়েস লোড করা সম্ভব হয়নি। আবার চেষ্টা করুন।" });
      setInvoices([]);
    } finally {
      setInvoicesLoading(false);
    }
  };

  const fetchCollections = async (range) => {
    try {
      setCollectionsLoading(true);
      const res = await myActivityAPI.getCollections({ startDate: range.start, endDate: range.end });
      setCollections(res.data.collections ?? []);
    } catch {
      setPopup({ type: "error", message: "কালেকশন হিস্টোরি লোড করা সম্ভব হয়নি। আবার চেষ্টা করুন।" });
      setCollections([]);
    } finally {
      setCollectionsLoading(false);
    }
  };

  const handleFetchData = (start, end) => {
    const range = { start, end };
    setTimeRange(range);
    fetchData(range);
    // Refresh whichever panel is open for the new range
    if (activePanel === "invoices") fetchInvoices(range);
    if (activePanel === "collections") fetchCollections(range);
  };

  const toggleInvoices = () => {
    if (activePanel === "invoices") {
      setActivePanel(null);
      return;
    }
    setActivePanel("invoices");
    if (timeRange) fetchInvoices(timeRange);
  };

  const toggleCollections = () => {
    if (activePanel === "collections") {
      setActivePanel(null);
      return;
    }
    setActivePanel("collections");
    if (timeRange) fetchCollections(timeRange);
  };

  const d = data ?? EMPTY_DATA;
  const headingLabel = buildHeadingLabel(timeRange?.start, timeRange?.end);

  return (
    <section className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 px-4 py-6 font-noto">
      {popup && <Popup type={popup.type} message={popup.message} onClose={() => setPopup(null)} />}

      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="font-['IBM_Plex_Mono'] text-xs uppercase text-[#0F6E5C] mb-1 font-noto">ব্যক্তিগত</p>
            <h1 className="font-['IBM_Plex_Sans'] text-2xl sm:text-3xl font-semibold text-[#1C1F1E] font-noto">
              আমার কার্যক্রম
            </h1>
            <p className="text-base text-[#767D78] mt-1 font-noto">
              {user?.name ? `${user.name} — ` : ""}
              নির্ধারিত সময়সীমায় আপনার কালেকশন ও ইনভয়েসের হিসাব
            </p>
          </div>
          <Link
            to="/lab-management"
            className="px-3 py-2 rounded-sm border border-[#1C1F1E]/15 text-[#1C1F1E] hover:bg-[#1C1F1E] hover:text-white transition-colors flex items-center gap-1.5 font-['IBM_Plex_Mono'] text-xs uppercase font-noto shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> ফিরে যান
          </Link>
        </div>

        <div className="mb-5">
          <TimeFrame onFetchData={handleFetchData} />
        </div>

        {headingLabel && !loading && (
          <p className="font-['IBM_Plex_Mono'] text-xs uppercase text-[#A8ACA3] mb-3 font-noto">{headingLabel}</p>
        )}

        {loading ? (
          <div className="grid grid-cols-2 gap-4 mb-5">
            {[0, 1, 2, 3].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 mb-5">
            <StatCard icon={Wallet} label="মোট কালেকশন" value={`৳${fmt(d.totalCollected)}`} accent={TEAL} />
            <StatCard icon={Receipt} label="মোট ইনভয়েস" value={fmt(d.invoiceCount)} />
            {d.isHospital && (
              <>
                <StatCard icon={Stethoscope} label="OPD কালেকশন" value={`৳${fmt(d.opdCollected)}`} />
                <StatCard icon={BedDouble} label="IPD কালেকশন" value={`৳${fmt(d.ipdCollected)}`} accent={SEAL_BLUE} />
              </>
            )}
          </div>
        )}

        {/* On-demand detail panels */}
        <div className="flex gap-3 mb-0">
          <ToggleButton
            icon={FileText}
            label="ইনভয়েস দেখুন"
            active={activePanel === "invoices"}
            onClick={toggleInvoices}
          />
          <ToggleButton
            icon={History}
            label="কালেকশন হিস্টোরি"
            active={activePanel === "collections"}
            onClick={toggleCollections}
          />
        </div>

        {activePanel === "invoices" && <InvoicesPanel loading={invoicesLoading} invoices={invoices} />}
        {activePanel === "collections" && <CollectionsPanel loading={collectionsLoading} collections={collections} />}
      </div>
    </section>
  );
};

export default MyActivity;
