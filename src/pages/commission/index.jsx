import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Printer,
  ChevronDown,
  ChevronUp,
  UserX,
  Stethoscope,
  UserCircle,
  Building2,
  BadgeDollarSign,
  Tag,
  ReceiptText,
} from "lucide-react";
import { Link } from "react-router-dom";
import TimeFrame from "../../components/timeFrame";
import commissionService from "../../api/commission";
import Popup from "../../components/popup";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n) => (typeof n === "number" ? n.toLocaleString("en-IN") : "0");

const fmtDate = (ms) => new Date(ms).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });

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
const OCHRE = "#B5772A";
const RUST = "#B23A2E";

const TYPE_META = {
  doctor: { label: "Doctor", icon: Stethoscope },
  agent: { label: "Agent", icon: UserCircle },
  institute: { label: "Institute", icon: Building2 },
  unknown: { label: "Unknown", icon: UserX },
};

const EMPTY_DATA = {
  registered: [],
  unregistered: [],
  totals: { totalCommission: 0, totalDiscount: 0, totalInvoices: 0 },
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const SkeletonReceipt = () => (
  <div className="bg-white border border-[#E3E0D6] rounded-lg overflow-hidden animate-pulse">
    <div className="h-[3px] bg-[#E3E0D6]" />
    <div className="px-6 sm:px-8 pt-6 pb-5 border-b border-[#E3E0D6] space-y-2">
      <div className="h-2.5 w-24 bg-[#ECE9DF] rounded-sm" />
      <div className="h-6 w-48 bg-[#ECE9DF] rounded-sm" />
    </div>
    <div className="px-6 sm:px-8 py-5 space-y-3">
      <div className="h-20 w-full bg-[#ECE9DF] rounded-sm" />
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="h-3 w-28 bg-[#ECE9DF] rounded-sm" />
          <div className="h-3 flex-1 bg-[#ECE9DF] rounded-sm" />
          <div className="h-3 w-14 bg-[#ECE9DF] rounded-sm" />
        </div>
      ))}
    </div>
  </div>
);

// ─── Receipt primitives ───────────────────────────────────────────────────────

const ReceiptLine = ({ label, value, tone = "#1C1F1E", icon: Icon, bold = false }) => (
  <div className="flex items-baseline gap-3 py-2.5">
    <span
      className={`flex items-center gap-1.5 text-[13.5px] shrink-0 ${bold ? "font-semibold" : "font-medium"}`}
      style={{ color: bold ? tone : "#1C1F1E" }}
    >
      {Icon && <Icon className="w-3.5 h-3.5" style={{ color: tone }} />}
      {label}
    </span>
    <span className="flex-1 border-b border-dotted border-[#D8D5CB] translate-y-[-3px]" />
    <span
      className={`font-['IBM_Plex_Mono'] text-[13.5px] tabular-nums shrink-0 ${bold ? "font-semibold" : ""}`}
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
      <p className="font-['IBM_Plex_Mono'] text-[10px] uppercase tracking-[0.15em] text-[#6F756F]">{label}</p>
    </div>
    <p className="font-['IBM_Plex_Mono'] text-2xl font-semibold text-[#1C1F1E] tabular-nums">{value}</p>
    {sub && <p className="font-['IBM_Plex_Mono'] text-[11px] text-[#8A8F89] mt-1">{sub}</p>}
  </div>
);

const InvoiceRow = ({ inv, idx }) => (
  <div className="flex items-center gap-3 py-2 border-b border-dotted border-[#E3E0D6] last:border-b-0">
    <span className="font-['IBM_Plex_Mono'] text-[10px] text-[#C7C4B8] tabular-nums w-4 shrink-0">
      {String(idx + 1).padStart(2, "0")}
    </span>
    <div className="min-w-0 flex-1">
      <p className="text-[12.5px] text-[#1C1F1E] font-medium truncate">{inv.patient?.name}</p>
      <p className="font-['IBM_Plex_Mono'] text-[10px] text-[#A8ACA3] mt-0.5">
        {inv.invoiceId} · {fmtDate(inv.createdAt)}
      </p>
    </div>
    <div className="flex items-center gap-3 shrink-0 text-right">
      <span className="font-['IBM_Plex_Mono'] text-[11px] text-[#6F756F] tabular-nums">৳{fmt(inv.final)}</span>
      {inv.discount > 0 && (
        <span className="font-['IBM_Plex_Mono'] text-[11px] tabular-nums" style={{ color: OCHRE }}>
          − ৳{fmt(inv.discount)}
        </span>
      )}
      <span
        className="font-['IBM_Plex_Mono'] text-[11px] font-semibold tabular-nums w-16 text-right"
        style={{ color: TEAL }}
      >
        ৳{fmt(inv.commission)}
      </span>
    </div>
  </div>
);

// ─── Referrer entry (receipt line + expandable invoice strip) ────────────────

const ReferrerEntry = ({ name, typeLabel, Icon, totalCommission, totalDiscount, invoices, accent }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="py-3 border-b border-dashed border-[#E3E0D6] last:border-b-0">
      <button onClick={() => setOpen((p) => !p)} className="w-full flex items-baseline gap-3 text-left">
        <span className="flex items-center gap-1.5 text-[13.5px] font-medium text-[#1C1F1E] shrink-0">
          <Icon className="w-3.5 h-3.5" style={{ color: accent }} />
          {name}
          <span className="font-['IBM_Plex_Mono'] text-[9px] uppercase tracking-wide text-[#A8ACA3]">{typeLabel}</span>
        </span>
        <span className="flex-1 border-b border-dotted border-[#D8D5CB] translate-y-[-3px]" />
        {totalDiscount > 0 && (
          <span className="font-['IBM_Plex_Mono'] text-[12px] tabular-nums shrink-0" style={{ color: OCHRE }}>
            − ৳{fmt(totalDiscount)}
          </span>
        )}
        <span
          className="font-['IBM_Plex_Mono'] text-[13.5px] font-semibold tabular-nums shrink-0"
          style={{ color: TEAL }}
        >
          ৳{fmt(totalCommission)}
        </span>
        {open ? (
          <ChevronUp className="w-3.5 h-3.5 text-[#A8ACA3] shrink-0" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-[#A8ACA3] shrink-0" />
        )}
      </button>

      {open && (
        <div className="mt-2 pl-5 pr-1">
          {invoices.map((inv, i) => (
            <InvoiceRow key={inv.invoiceId} inv={inv} idx={i} />
          ))}
        </div>
      )}
    </div>
  );
};

const EmptySection = ({ label }) => (
  <p className="font-['IBM_Plex_Mono'] text-[11px] text-[#A8ACA3] tracking-wide py-3">{label}</p>
);

// ─── Main ─────────────────────────────────────────────────────────────────────

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
      setPopup({ type: "error", message: "Failed to load commission data. Please try again." });
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
  const referrerCount = d.registered.length + d.unregistered.length;

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
          #commission-printable, #commission-printable * { visibility: visible; }
          #commission-printable { position: fixed; top: 0; left: 0; width: 100%; padding: 32px; box-shadow: none; }
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
              Commission
            </h1>
            <p className="text-sm text-[#767D78] mt-1">Referrer commission and discounts for the selected range.</p>
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
          <SkeletonReceipt />
        ) : (
          <div
            id="commission-printable"
            className="bg-white border border-[#E3E0D6] rounded-lg shadow-[0_1px_2px_rgba(28,31,30,0.04)] overflow-hidden"
          >
            {/* Header band */}
            <div className="px-6 sm:px-8 pt-6 pb-5 border-b border-[#E3E0D6] flex items-start justify-between gap-4">
              <div>
                <p className="font-['IBM_Plex_Mono'] text-[10px] uppercase tracking-[0.2em] text-[#0F6E5C] mb-1.5">
                  Commission Memo
                </p>
                <h2 className="font-['IBM_Plex_Sans'] text-2xl font-semibold text-[#1C1F1E] tracking-tight">
                  {headingLabel}
                </h2>
                <p className="font-['IBM_Plex_Mono'] text-[11px] text-[#8A8F89] mt-1.5 flex items-center gap-1.5">
                  <ReceiptText className="w-3 h-3" />
                  {referrerCount} referrer{referrerCount !== 1 ? "s" : ""} · {d.totals.totalInvoices} invoices
                </p>
              </div>

              <div className="rotate-[-4deg] border border-[#0F6E5C]/35 bg-white text-[#0F6E5C] px-2 py-1 font-['IBM_Plex_Mono'] text-[9px] uppercase tracking-[0.15em] rounded-sm select-none shrink-0 mt-1">
                Record · {recordStamp(timeRange?.start, timeRange?.end)}
              </div>
            </div>

            {/* Single summary split — the only place totals appear */}
            <div className="px-6 sm:px-8 py-5 border-b border-[#E3E0D6]">
              <div className="grid grid-cols-2 divide-x divide-[#E3E0D6] border border-[#E3E0D6] rounded-sm">
                <LedgerCell
                  icon={BadgeDollarSign}
                  label="Commission Payable"
                  value={`৳${fmt(d.totals.totalCommission)}`}
                  accent={TEAL}
                  sub={`from ${d.totals.totalInvoices} invoice${d.totals.totalInvoices !== 1 ? "s" : ""}`}
                />
                <LedgerCell
                  icon={Tag}
                  label="Discount Given"
                  value={`৳${fmt(d.totals.totalDiscount)}`}
                  accent={RUST}
                  sub={`across ${referrerCount} referrer${referrerCount !== 1 ? "s" : ""}`}
                />
              </div>
            </div>

            {/* Registered referrers */}
            <div className="px-6 sm:px-8 py-5 border-b border-[#E3E0D6]">
              <p className="font-['IBM_Plex_Mono'] text-[10px] uppercase tracking-[0.15em] text-[#6F756F] mb-1">
                Registered Referrers
              </p>
              {d.registered.length > 0 ? (
                <div>
                  {d.registered.map((r) => {
                    const meta = TYPE_META[r.type] ?? TYPE_META.unknown;
                    return (
                      <ReferrerEntry
                        key={r.referrerId}
                        name={r.name}
                        typeLabel={meta.label}
                        Icon={meta.icon}
                        totalCommission={r.totalCommission}
                        totalDiscount={r.totalDiscount}
                        invoices={r.invoices}
                        accent={TEAL}
                      />
                    );
                  })}
                </div>
              ) : (
                <EmptySection label="No registered referrers in this range" />
              )}
            </div>

            {/* Unregistered / walk-in */}
            <div className="px-6 sm:px-8 py-5">
              <p className="font-['IBM_Plex_Mono'] text-[10px] uppercase tracking-[0.15em] text-[#6F756F] mb-1">
                Unregistered / Walk-in
              </p>
              {d.unregistered.length > 0 ? (
                <div>
                  {d.unregistered.map((g) => (
                    <ReferrerEntry
                      key={String(g.referredBy)}
                      name={g.referredBy}
                      typeLabel="Walk-in"
                      Icon={UserX}
                      totalCommission={g.totalCommission}
                      totalDiscount={g.totalDiscount}
                      invoices={g.invoices}
                      accent={OCHRE}
                    />
                  ))}
                </div>
              ) : (
                <EmptySection label="No walk-in commissions in this range" />
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

export default Commission;
