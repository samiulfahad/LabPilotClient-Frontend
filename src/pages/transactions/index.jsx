/**
 * useCallback / useMemo are intentionally absent throughout this file.
 * babel-plugin-react-compiler handles all memoization automatically.
 */
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Users,
  ReceiptText,
  Wallet,
  TrendingUp,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  BadgeDollarSign,
  Banknote,
  ClipboardList,
  UserCheck,
  Clock,
} from "lucide-react";
import { Link } from "react-router-dom";
import TimeFrame from "../../components/timeFrame";
import transactionService from "../../api/transaction";
import Popup from "../../components/popup";
import { useAuthStore } from "../../store/authStore"; // ✅ import auth store

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n) => (typeof n === "number" ? n.toLocaleString("en-IN") : "0");
const fmtDt = (ms) => new Date(ms).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
const fmtTime = (ms) => new Date(ms).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });

const todayRange = () => {
  const now = new Date();
  return {
    start: new Date(now).setHours(0, 0, 0, 0),
    end: new Date(now).setHours(23, 59, 59, 999),
  };
};

const EMPTY_DATA = {
  staff: [],
  totals: { totalInvoices: 0, totalFinal: 0, totalPaid: 0, totalDue: 0, totalCollected: 0 },
};

// ─── Initials helper ──────────────────────────────────────────────────────────

const initials = (name = "") =>
  name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";

// ─── Avatar gradient (deterministic per name) ─────────────────────────────────

const GRADIENTS = [
  "from-blue-500 to-indigo-600",
  "from-violet-500 to-purple-600",
  "from-emerald-500 to-teal-600",
  "from-rose-500 to-pink-600",
  "from-amber-500 to-orange-500",
  "from-cyan-500 to-sky-600",
];
const avatarGradient = (name = "") => {
  const code = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return GRADIENTS[code % GRADIENTS.length];
};

// ─── Card animations ──────────────────────────────────────────────────────────

const cardAnim = (idx) => ({ style: { animation: `cardIn 0.4s cubic-bezier(.22,1,.36,1) ${idx * 70}ms both` } });

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const SkeletonCard = () => (
  <div className="bg-white border border-gray-100 rounded-2xl p-5 animate-pulse space-y-4 shadow-sm">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-gray-200" />
        <div className="space-y-2">
          <div className="h-4 w-32 bg-gray-200 rounded" />
          <div className="h-3 w-20 bg-gray-100 rounded" />
        </div>
      </div>
      <div className="h-8 w-24 bg-gray-100 rounded-xl" />
    </div>
    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-50">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-12 bg-gray-100 rounded-xl" />
      ))}
    </div>
  </div>
);

// ─── StatPill ─────────────────────────────────────────────────────────────────

const StatPill = ({ label, value, bg, labelColor, valueColor, icon: Icon }) => (
  <div className={`${bg} rounded-xl px-3 py-2.5`}>
    <div className="flex items-center gap-1 mb-0.5">
      {Icon && <Icon className={`w-3 h-3 ${labelColor}`} />}
      <p className={`text-[9.5px] ${labelColor} uppercase tracking-wide font-bold`}>{label}</p>
    </div>
    <p className={`text-sm font-black ${valueColor}`}>{value}</p>
  </div>
);

// ─── Invoice Row ──────────────────────────────────────────────────────────────

const InvoiceRow = ({ inv, idx }) => (
  <div className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0 gap-2">
    <div className="flex items-center gap-3 min-w-0">
      <span className="text-[10px] font-black text-gray-200 w-5 shrink-0 tabular-nums">
        {String(idx + 1).padStart(2, "0")}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-bold text-gray-800 truncate">{inv.patient}</p>
        <p className="text-[10px] text-gray-400 mt-0.5">{fmtDt(inv.createdAt)}</p>
      </div>
    </div>
    <div className="flex items-center gap-3 shrink-0 text-right">
      <div>
        <p className="text-[10px] text-gray-400">Invoice</p>
        <p className="text-[11px] font-bold text-gray-500">{inv.invoiceId}</p>
      </div>
      <div>
        <p className="text-[10px] text-gray-400">Final</p>
        <p className="text-[11px] font-bold text-gray-700">৳{fmt(inv.final)}</p>
      </div>
      <div>
        <p className="text-[10px] text-emerald-500">Paid</p>
        <p className="text-[11px] font-bold text-emerald-600">৳{fmt(inv.paid)}</p>
      </div>
      {inv.due > 0 && (
        <div>
          <p className="text-[10px] text-rose-400">Due</p>
          <p className="text-[11px] font-bold text-rose-500">৳{fmt(inv.due)}</p>
        </div>
      )}
    </div>
  </div>
);

// ─── Collection Row ───────────────────────────────────────────────────────────

const CollectionRow = ({ col, idx }) => (
  <div className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0 gap-2">
    <div className="flex items-center gap-3 min-w-0">
      <span className="text-[10px] font-black text-gray-200 w-5 shrink-0 tabular-nums">
        {String(idx + 1).padStart(2, "0")}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-bold text-gray-800 truncate">{col.patient}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <Clock className="w-2.5 h-2.5 text-gray-300" />
          <p className="text-[10px] text-gray-400">
            {fmtDt(col.at)} · {fmtTime(col.at)}
          </p>
        </div>
      </div>
    </div>
    <div className="flex items-center gap-3 shrink-0 text-right">
      <div>
        <p className="text-[10px] text-gray-400">Invoice</p>
        <p className="text-[11px] font-bold text-gray-500">{col.invoiceId}</p>
      </div>
      <div>
        <p className="text-[10px] text-indigo-400">Collected</p>
        <p className="text-[11px] font-black text-indigo-600">৳{fmt(col.amount)}</p>
      </div>
    </div>
  </div>
);

// ─── Toggle button ────────────────────────────────────────────────────────────

const Toggle = ({ label, count, open, onToggle, icon: Icon, activeColor }) => (
  <button
    onClick={onToggle}
    className={`flex-1 flex items-center justify-between px-4 py-2.5 transition-colors text-xs font-bold ${
      open ? `${activeColor} text-white` : "bg-gray-50 text-gray-500 hover:bg-gray-100"
    }`}
  >
    <span className="flex items-center gap-1.5">
      <Icon className="w-3.5 h-3.5" />
      {count} {label}
      {count !== 1 ? "s" : ""}
    </span>
    {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
  </button>
);

// ─── Staff Card ───────────────────────────────────────────────────────────────

const StaffCard = ({ member: m, idx }) => {
  const [tab, setTab] = useState(null); // null | "invoices" | "collections"

  const toggleInvoices = () => setTab((p) => (p === "invoices" ? null : "invoices"));
  const toggleCollections = () => setTab((p) => (p === "collections" ? null : "collections"));

  const grad = avatarGradient(m.name);
  const hasDue = m.totalDue > 0;

  return (
    <div
      className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm transition-shadow hover:shadow-md"
      {...cardAnim(idx)}
    >
      {/* ── Card Header ───────────────────────────────────────────────────── */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center shadow-md shrink-0`}
            >
              <span className="text-sm font-black text-white">{initials(m.name)}</span>
            </div>
            <div>
              <p className="text-sm font-black text-gray-900 leading-tight">{m.name}</p>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border bg-blue-50 text-blue-600 border-blue-100 mt-0.5">
                <UserCheck className="w-2.5 h-2.5" />
                Staff
              </span>
            </div>
          </div>

          {/* Big collected figure */}
          <div className="text-right shrink-0">
            <p className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest leading-none">Collected</p>
            <p className="text-xl font-black text-indigo-700 leading-tight mt-0.5">৳{fmt(m.totalCollected)}</p>
          </div>
        </div>

        {/* ── Stat grid ─────────────────────────────────────────────────── */}
        <div className={`grid gap-2 ${hasDue ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2 sm:grid-cols-3"}`}>
          <StatPill
            label="Invoices"
            value={m.totalInvoices}
            bg="bg-gray-50"
            labelColor="text-gray-400"
            valueColor="text-gray-800"
            icon={ClipboardList}
          />
          <StatPill
            label="Total Billed"
            value={`৳${fmt(m.totalFinal)}`}
            bg="bg-gray-50"
            labelColor="text-gray-400"
            valueColor="text-gray-800"
            icon={ReceiptText}
          />
          <StatPill
            label="Paid"
            value={`৳${fmt(m.totalPaid)}`}
            bg="bg-emerald-50 border border-emerald-100"
            labelColor="text-emerald-500"
            valueColor="text-emerald-700"
            icon={Banknote}
          />
          {hasDue && (
            <StatPill
              label="Due"
              value={`৳${fmt(m.totalDue)}`}
              bg="bg-rose-50 border border-rose-100"
              labelColor="text-rose-400"
              valueColor="text-rose-600"
              icon={AlertCircle}
            />
          )}
        </div>
      </div>

      {/* ── Toggle bar ────────────────────────────────────────────────────── */}
      <div className="flex border-t border-gray-100 divide-x divide-gray-100">
        <Toggle
          label="Invoice"
          count={m.invoices.length}
          open={tab === "invoices"}
          onToggle={toggleInvoices}
          icon={ReceiptText}
          activeColor="bg-blue-600"
        />
        <Toggle
          label="Collection"
          count={m.collections.length}
          open={tab === "collections"}
          onToggle={toggleCollections}
          icon={Wallet}
          activeColor="bg-indigo-600"
        />
      </div>

      {/* ── Expandable content ────────────────────────────────────────────── */}
      {tab === "invoices" && (
        <div className="px-5 pb-4 pt-3 border-t border-blue-50 bg-blue-50/30">
          {m.invoices.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">No invoices in this period</p>
          ) : (
            m.invoices.map((inv, i) => <InvoiceRow key={inv.invoiceId} inv={inv} idx={i} />)
          )}
        </div>
      )}
      {tab === "collections" && (
        <div className="px-5 pb-4 pt-3 border-t border-indigo-50 bg-indigo-50/30">
          {m.collections.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">No collections in this period</p>
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
  const user = useAuthStore((state) => state.user); // ✅ get user from store
  const isStaff = user?.role === "staff"; // ✅ derive role

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
      setPopup({ type: "error", message: "Failed to load transaction data." });
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

  return (
    <section className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 px-4 py-6">
      {popup && <Popup type={popup.type} message={popup.message} onClose={() => setPopup(null)} />}

      <style>{`
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="max-w-2xl mx-auto">
        {/* ── Page Header ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-black text-gray-900 leading-tight">Transactions</h1>
          </div>
          <Link
            to="/lab-management"
            className="px-3 py-2.5 rounded-xl border border-gray-200 bg-white/60 text-gray-700 hover:bg-gray-50 transition-all flex items-center gap-2 text-sm font-medium shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
        </div>

        {/* ── TimeFrame ───────────────────────────────────────────────────── */}
        <div className="mb-5">
          <TimeFrame onFetchData={handleFetchData} />
        </div>

        {/* ── Summary Banner ──────────────────────────────────────────────── */}
        {!loading && (
          <div
            className="grid grid-cols-2 gap-3 mb-5"
            style={{ animation: "cardIn 0.4s cubic-bezier(.22,1,.36,1) both" }}
          >
            {/* ✅ Hero card — hidden for staff role */}
            {!isStaff && (
              <div className="col-span-2 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl px-4 py-4 shadow-lg shadow-indigo-200/40 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <BadgeDollarSign className="w-3.5 h-3.5 text-indigo-200" />
                    <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest">Total Collected</p>
                  </div>
                  <p className="text-3xl font-black text-white">৳{fmt(d.totals.totalCollected)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest mb-1">Staff Active</p>
                  <p className="text-3xl font-black text-white">{d.staff.length}</p>
                </div>
              </div>
            )}

            {/* Total billed */}
            <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3.5 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <ReceiptText className="w-3.5 h-3.5 text-gray-400" />
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Invoices</p>
              </div>
              <p className="text-2xl font-black text-gray-900">{d.totals.totalInvoices}</p>
              <p className="text-[10px] font-bold text-gray-400 mt-1">৳{fmt(d.totals.totalFinal)} billed</p>
            </div>

            {/* Due */}
            <div
              className={`rounded-2xl px-4 py-3.5 shadow-sm border ${d.totals.totalDue > 0 ? "bg-rose-50 border-rose-100" : "bg-white border-gray-100"}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className={`w-3.5 h-3.5 ${d.totals.totalDue > 0 ? "text-rose-400" : "text-gray-400"}`} />
                <p
                  className={`text-[10px] font-bold uppercase tracking-widest ${d.totals.totalDue > 0 ? "text-rose-400" : "text-gray-400"}`}
                >
                  Outstanding Due
                </p>
              </div>
              <p className={`text-2xl font-black ${d.totals.totalDue > 0 ? "text-rose-600" : "text-gray-900"}`}>
                ৳{fmt(d.totals.totalDue)}
              </p>
              <p className={`text-[10px] font-bold mt-1 ${d.totals.totalDue > 0 ? "text-rose-400" : "text-gray-400"}`}>
                ৳{fmt(d.totals.totalPaid)} paid
              </p>
            </div>
          </div>
        )}

        {/* ── Staff Cards ─────────────────────────────────────────────────── */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : d.staff.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-2xl py-16 text-center shadow-sm">
            <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm font-bold text-gray-400">No transactions found for this period</p>
            <p className="text-xs text-gray-300 mt-1">Try selecting a different date range</p>
          </div>
        ) : (
          <div className="space-y-3">
            {d.staff.map((member, i) => (
              <StaffCard key={member.staffId} member={member} idx={i} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Transactions;
