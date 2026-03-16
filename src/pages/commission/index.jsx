import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Users,
  Stethoscope,
  Building2,
  UserCircle,
  UserX,
  ChevronDown,
  ChevronUp,
  BadgeDollarSign,
  ReceiptText,
  TrendingUp,
  Tag,
} from "lucide-react";
import { Link } from "react-router-dom";
import TimeFrame from "../../components/timeFrame";
import commissionService from "../../api/commission";
import Popup from "../../components/popup";

// ============================================================================
// HELPERS
// ============================================================================

const fmt = (n) => (typeof n === "number" ? n.toLocaleString("en-IN") : "0");

const fmtDate = (ms) => new Date(ms).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });

const todayRange = () => {
  const now = new Date();
  return {
    start: new Date(now).setHours(0, 0, 0, 0),
    end: new Date(now).setHours(23, 59, 59, 999),
  };
};

const TYPE_META = {
  doctor: { label: "Doctor", icon: Stethoscope, color: "bg-blue-50 text-blue-600 border-blue-100" },
  agent: { label: "Agent", icon: UserCircle, color: "bg-violet-50 text-violet-600 border-violet-100" },
  institute: { label: "Institute", icon: Building2, color: "bg-amber-50 text-amber-600 border-amber-100" },
  unknown: { label: "Unknown", icon: Users, color: "bg-gray-50 text-gray-500 border-gray-100" },
};

const CARD_ANIMATION = (idx) => ({
  style: { animation: `cardIn 0.4s cubic-bezier(.22,1,.36,1) ${idx * 60}ms both` },
});

const SectionDivider = ({ label, count, countColor }) => (
  <div className="flex items-center gap-3 mb-3">
    <p className="text-[10.5px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">{label}</p>
    <div className="flex-1 h-px bg-gray-200" />
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${countColor}`}>{count}</span>
  </div>
);

// ============================================================================
// SKELETON
// ============================================================================

const SkeletonCard = () => (
  <div className="bg-white border border-gray-100 rounded-2xl p-5 animate-pulse space-y-3">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gray-200" />
        <div className="space-y-1.5">
          <div className="h-4 w-36 bg-gray-200 rounded" />
          <div className="h-3 w-24 bg-gray-100 rounded" />
        </div>
      </div>
      <div className="h-7 w-24 bg-gray-200 rounded-xl" />
    </div>
    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-50">
      {[1, 2].map((i) => (
        <div key={i} className="h-10 bg-gray-100 rounded-xl" />
      ))}
    </div>
  </div>
);

// ============================================================================
// INVOICE ROW
// ============================================================================

const InvoiceRow = ({ inv, idx }) => (
  <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 gap-2">
    <div className="flex items-center gap-3 min-w-0">
      <span className="text-[10px] font-black text-gray-200 w-5 shrink-0 tabular-nums">
        {String(idx + 1).padStart(2, "0")}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-bold text-gray-800 truncate">{inv.patient?.name}</p>
        <p className="text-[10px] text-gray-400 mt-0.5">{fmtDate(inv.createdAt)}</p>
      </div>
    </div>
    <div className="flex items-center gap-3 shrink-0 text-right">
      <div>
        <p className="text-[10px] text-gray-400">Invoice</p>
        <p className="text-[11px] font-bold text-gray-600">{inv.invoiceId}</p>
      </div>
      <div>
        <p className="text-[10px] text-gray-400">Final</p>
        <p className="text-[11px] font-bold text-gray-700">৳{fmt(inv.finalPrice)}</p>
      </div>
      {inv.discount > 0 && (
        <div>
          <p className="text-[10px] text-orange-400">Discount</p>
          <p className="text-[11px] font-bold text-orange-500">−৳{fmt(inv.discount)}</p>
        </div>
      )}
      <div>
        <p className="text-[10px] text-gray-400">Comm.</p>
        <p className="text-[11px] font-black text-indigo-600">৳{fmt(inv.commission)}</p>
      </div>
    </div>
  </div>
);

// ============================================================================
// INVOICE TOGGLE BUTTON
// ============================================================================

const InvoiceToggle = ({ count, open, onToggle }) => (
  <button
    onClick={onToggle}
    className="w-full flex items-center justify-between px-5 py-2.5 bg-gray-50 border-t border-gray-100 hover:bg-gray-100 transition-colors text-xs font-bold text-gray-500"
  >
    <span className="flex items-center gap-1.5">
      <ReceiptText className="w-3.5 h-3.5" />
      {count} Invoice{count !== 1 ? "s" : ""}
    </span>
    {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
  </button>
);

// ============================================================================
// STAT CELL
// ============================================================================

const StatCell = ({ label, value, bg = "bg-gray-50", labelColor = "text-gray-400", valueColor = "text-gray-800" }) => (
  <div className={`${bg} rounded-xl px-3 py-2 text-center`}>
    <p className={`text-[9.5px] ${labelColor} uppercase tracking-wide font-semibold`}>{label}</p>
    <p className={`text-sm font-black ${valueColor} mt-0.5`}>{value}</p>
  </div>
);

// ============================================================================
// REFERRER CARD (registered)
// ============================================================================

const ReferrerCard = ({ referrer: r, idx }) => {
  const [open, setOpen] = useState(false);
  const meta = TYPE_META[r.type] ?? TYPE_META.unknown;
  const Icon = meta.icon;
  const initials = r.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm transition-shadow hover:shadow-md"
      {...CARD_ANIMATION(idx)}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-100 shrink-0">
              <span className="text-sm font-black text-white">{initials}</span>
            </div>
            <div>
              <p className="text-sm font-black text-gray-900 leading-tight">{r.name}</p>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border mt-0.5 ${meta.color}`}
              >
                <Icon className="w-2.5 h-2.5" />
                {meta.label}
              </span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[9px] text-orange-400 font-bold uppercase tracking-widest leading-none">
              Discount Given
            </p>
            <p className="text-xl font-black text-orange-500 leading-tight mt-0.5">−৳{fmt(r.totalDiscount)}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-gray-50">
          <StatCell label="Invoices" value={r.totalInvoices} />
          <StatCell
            label="Commission"
            value={`৳${fmt(r.totalCommission)}`}
            bg="bg-indigo-50 border border-indigo-100"
            labelColor="text-indigo-400"
            valueColor="text-indigo-700"
          />
        </div>
      </div>

      <InvoiceToggle count={r.invoices.length} open={open} onToggle={() => setOpen((p) => !p)} />

      {open && (
        <div className="px-5 pb-4 pt-3">
          {r.invoices.map((inv, i) => (
            <InvoiceRow key={inv.invoiceId} inv={inv} idx={i} />
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// UNREGISTERED CARD
// ============================================================================

const UnregisteredCard = ({ group, idx }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm" {...CARD_ANIMATION(idx)}>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0">
              <UserX className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className="text-sm font-black text-gray-900">{group.referredBy}</p>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-orange-50 text-orange-500 border-orange-100">
                Unregistered
              </span>
            </div>
          </div>
          {group.totalCommission > 0 && (
            <div className="text-right shrink-0">
              <p className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest leading-none">Commission</p>
              <p className="text-xl font-black text-indigo-700 mt-0.5">৳{fmt(group.totalCommission)}</p>
            </div>
          )}
        </div>

        <div
          className={`grid gap-2 mt-4 pt-4 border-t border-gray-50 ${group.totalDiscount > 0 ? "grid-cols-2" : "grid-cols-1"}`}
        >
          <StatCell label="Invoices" value={group.totalInvoices} />
          {group.totalDiscount > 0 && (
            <StatCell
              label="Discount Given"
              value={`−৳${fmt(group.totalDiscount)}`}
              bg="bg-orange-50 border border-orange-100"
              labelColor="text-orange-400"
              valueColor="text-orange-600"
            />
          )}
        </div>
      </div>

      <InvoiceToggle count={group.invoices.length} open={open} onToggle={() => setOpen((p) => !p)} />

      {open && (
        <div className="px-5 pb-4 pt-3">
          {group.invoices.map((inv, i) => (
            <InvoiceRow key={inv.invoiceId} inv={inv} idx={i} />
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// MAIN
// ============================================================================

const EMPTY_DATA = {
  registered: [],
  unregistered: [],
  totals: { totalCommission: 0, totalDiscount: 0, totalInvoices: 0 },
};

const Commission = () => {
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
      const res = await commissionService.getSummary({ startDate: range.start, endDate: range.end });
      setData(res.data);
    } catch {
      setPopup({ type: "error", message: "Failed to load commission data." });
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
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-[11px] font-bold text-indigo-500 uppercase tracking-widest mb-0.5">LabPilot</p>
            <h1 className="text-2xl font-black text-gray-900 leading-tight">Commission</h1>
          </div>
          <Link
            to="/lab-management"
            className="px-3 py-2.5 rounded-xl border border-gray-200 bg-white/60 text-gray-700 hover:bg-gray-50 transition-all flex items-center gap-2 text-sm font-medium shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </div>

        {/* TimeFrame */}
        <div className="mb-5">
          <TimeFrame onFetchData={handleFetchData} />
        </div>

        {/* Summary banner */}
        {!loading && (
          <div
            className="grid grid-cols-2 gap-3 mb-5"
            style={{ animation: "cardIn 0.4s cubic-bezier(.22,1,.36,1) both" }}
          >
            <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl px-4 py-3.5 col-span-2 shadow-lg shadow-indigo-200/40">
              <div className="flex items-center gap-2 mb-1">
                <BadgeDollarSign className="w-3.5 h-3.5 text-indigo-200" />
                <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest">
                  Total Commission Payable
                </p>
              </div>
              <p className="text-3xl font-black text-white">৳{fmt(d.totals.totalCommission)}</p>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3.5 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <ReceiptText className="w-3.5 h-3.5 text-gray-400" />
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Invoices</p>
              </div>
              <p className="text-2xl font-black text-gray-900">{d.totals.totalInvoices}</p>
              {d.totals.totalDiscount > 0 && (
                <p className="text-[10px] font-bold text-orange-400 mt-1 flex items-center gap-1">
                  <Tag className="w-2.5 h-2.5" />
                  −৳{fmt(d.totals.totalDiscount)} discount
                </p>
              )}
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3.5 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-3.5 h-3.5 text-gray-400" />
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Referrers</p>
              </div>
              <p className="text-2xl font-black text-gray-900">{d.registered.length}</p>
            </div>
          </div>
        )}

        {/* Cards */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : (
          <>
            {d.registered.length > 0 && (
              <div className="mb-6">
                <SectionDivider
                  label="Registered Referrers"
                  count={d.registered.length}
                  countColor="text-indigo-500 bg-indigo-50 border-indigo-100"
                />
                <div className="space-y-3">
                  {d.registered.map((r, i) => (
                    <ReferrerCard key={r.referrerId} referrer={r} idx={i} />
                  ))}
                </div>
              </div>
            )}

            {d.unregistered.length > 0 && (
              <div className="mb-6">
                <SectionDivider
                  label="Unregistered / Walk-in"
                  count={d.unregistered.length}
                  countColor="text-orange-500 bg-orange-50 border-orange-100"
                />
                <div className="space-y-3">
                  {d.unregistered.map((g, i) => (
                    <UnregisteredCard key={String(g.referredBy)} group={g} idx={i} />
                  ))}
                </div>
              </div>
            )}

            {d.registered.length === 0 && d.unregistered.length === 0 && (
              <div className="bg-white border border-gray-100 rounded-2xl py-16 text-center shadow-sm">
                <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-sm font-bold text-gray-400">No invoices found for this period</p>
                <p className="text-xs text-gray-300 mt-1">Try selecting a different date range</p>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default Commission;
