import { useState, useEffect, useMemo } from "react";
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
  FlaskConical,
  LayoutList,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import TimeFrame from "../../../components/timeFrame";
import ReportSeal from "../../../components/ReportSeal";
import commissionService from "../../../api/dailyReports/commissionReport";
import Popup from "../../../components/popup";
import { useAuthStore } from "../../../store/authStore";

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

// ─── Aggregate outdoor tests for one referrer's invoices ──────────────────────
const aggregateOutdoorTests = (invoices) => {
  const map = new Map();
  for (const inv of invoices ?? []) {
    if (!Array.isArray(inv.tests)) continue;
    for (const t of inv.tests) {
      if (!t?.name) continue;
      const rate = t.commission ?? 0;
      let entry = map.get(t.name);
      if (!entry) {
        entry = { name: t.name, total: 0, commissionTotal: 0, rates: new Map() };
        map.set(t.name, entry);
      }
      entry.total += 1;
      entry.commissionTotal += rate;
      let r = entry.rates.get(rate);
      if (!r) {
        r = { rate, count: 0, subtotal: 0, firstSeenAt: inv.createdAt, lastSeenAt: inv.createdAt };
        entry.rates.set(rate, r);
      }
      r.count += 1;
      r.subtotal += rate;
      if (inv.createdAt < r.firstSeenAt) r.firstSeenAt = inv.createdAt;
      if (inv.createdAt > r.lastSeenAt) r.lastSeenAt = inv.createdAt;
    }
  }
  return map;
};

// ─── Aggregate indoor tests (already grouped by rate on the backend) ─────────
const aggregateIndoorTests = (indoorTests) => {
  const map = new Map();
  for (const t of indoorTests ?? []) {
    if (!t?.name) continue;
    let entry = map.get(t.name);
    if (!entry) {
      entry = { name: t.name, total: 0, commissionTotal: 0, rates: new Map() };
      map.set(t.name, entry);
    }
    entry.total += t.count;
    entry.commissionTotal += t.commissionTotal;
    entry.rates.set(t.rate, {
      rate: t.rate,
      count: t.count,
      subtotal: t.commissionTotal,
      firstSeenAt: t.firstSeenAt,
      lastSeenAt: t.lastSeenAt,
    });
  }
  return map;
};

const sumAggregateCounts = (map) => Array.from(map.values()).reduce((s, e) => s + e.total, 0);

// ─── Merge outdoor + indoor per-test aggregates, keep rate history ──────────
const mergeTestAggregates = (outdoorMap, indoorMap) => {
  const names = new Set([...outdoorMap.keys(), ...indoorMap.keys()]);
  const rows = [];
  for (const name of names) {
    const o = outdoorMap.get(name);
    const i = indoorMap.get(name);
    const outdoorCount = o?.total ?? 0;
    const indoorCount = i?.total ?? 0;
    const commissionTotal = (o?.commissionTotal ?? 0) + (i?.commissionTotal ?? 0);

    const rateMap = new Map();
    for (const r of o?.rates?.values() ?? []) rateMap.set(r.rate, { ...r });
    for (const r of i?.rates?.values() ?? []) {
      const existing = rateMap.get(r.rate);
      if (existing) {
        existing.count += r.count;
        existing.subtotal += r.subtotal;
        existing.firstSeenAt = Math.min(existing.firstSeenAt, r.firstSeenAt);
        existing.lastSeenAt = Math.max(existing.lastSeenAt, r.lastSeenAt);
      } else {
        rateMap.set(r.rate, { ...r });
      }
    }
    const rates = Array.from(rateMap.values()).sort((a, b) => a.firstSeenAt - b.firstSeenAt);

    rows.push({
      name,
      outdoorCount,
      indoorCount,
      total: outdoorCount + indoorCount,
      commissionTotal,
      rates,
      rateChanged: rates.length > 1,
    });
  }
  return rows.sort((a, b) => b.commissionTotal - a.commissionTotal || b.total - a.total);
};

// ─── Build doctor-first test summary rows — outdoor + indoor kept separate ───
const buildDoctorTestRows = (registered, unregistered) => {
  const rows = [];

  const pushRow = (r, isRegistered) => {
    const outdoorMap = aggregateOutdoorTests(r.invoices ?? []);
    const indoorMap = aggregateIndoorTests(r.indoorTests ?? []);
    if (outdoorMap.size === 0 && indoorMap.size === 0) return;
    rows.push({
      key: isRegistered ? (r.referrerId ?? r.name) : String(r.referredBy),
      name: (isRegistered ? r.name : r.referredBy) ?? "অজানা",
      type: isRegistered ? (r.type ?? "unknown") : "unregistered",
      isRegistered,
      invoiceCount: r.totalInvoices ?? r.invoices?.length ?? 0,
      outdoorMap,
      indoorMap,
    });
  };

  for (const r of registered) pushRow(r, true);
  for (const g of unregistered) pushRow(g, false);

  return rows.sort((a, b) => {
    const ta = sumAggregateCounts(a.outdoorMap) + sumAggregateCounts(a.indoorMap);
    const tb = sumAggregateCounts(b.outdoorMap) + sumAggregateCounts(b.indoorMap);
    return tb - ta;
  });
};

// ─── Constants ────────────────────────────────────────────────────────────────

const TEAL = "#0F6E5C";
const OCHRE = "#B5772A";
const RUST = "#B23A2E";
const SEAL_BLUE = "#1E4FA0";
const SEAL_RED = "#C0312B";
const INK = "#1C1F1E";

const TYPE_META = {
  doctor: { label: "ডাক্তার", Icon: Stethoscope },
  agent: { label: "এজেন্ট", Icon: UserCircle },
  institute: { label: "প্রতিষ্ঠান", Icon: Building2 },
  unknown: { label: "অজানা", Icon: UserX },
  unregistered: { label: "ওয়াক-ইন", Icon: UserX },
};

const EMPTY_DATA = {
  registered: [],
  unregistered: [],
  totals: { totalCommission: 0, totalDiscount: 0, totalInvoices: 0 },
};

// ── Error helpers ──────────────────────────────────────────────────────────
const PERMISSION_DENIED_MESSAGE = "আপনার কর্তৃপক্ষ আপনাকে এই কাজটি করার বা এই তথ্যটি পাওয়ার অনুমতি দেয়নি।";

const getErrorMessage = (err, fallback) => {
  if (err?.response?.status === 403) return PERMISSION_DENIED_MESSAGE;
  return err?.response?.data?.error ?? fallback;
};

// ── Network error helper (mirrors CollectionReport) ───────────────────────
const isNetworkError = (error) => error?.isAxiosError === true && !error.response;

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

// Small stat column — mirrors the HeaderStat used in Collection/Discount/Sales reports.
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

const InvoiceRow = ({ inv, idx }) => (
  <div className="flex items-center gap-3 py-2 border-b border-dotted border-[#E3E0D6] last:border-b-0">
    <span className="font-['IBM_Plex_Mono'] text-xs text-[#C7C4B8] tabular-nums w-5 shrink-0">
      {String(idx + 1).padStart(2, "0")}
    </span>
    <div className="min-w-0 flex-1">
      <p className="text-sm text-[#1C1F1E] font-medium truncate font-noto">{inv.patient?.name}</p>
      <p className="font-['IBM_Plex_Mono'] text-xs text-[#A8ACA3] mt-0.5">
        {inv.invoiceId} · {fmtDate(inv.createdAt)}
      </p>
    </div>
    <div className="flex items-center gap-3 shrink-0 text-right">
      <span className="font-['IBM_Plex_Mono'] text-xs text-[#6F756F] tabular-nums">৳{fmt(inv.final)}</span>
      {inv.discount > 0 && (
        <span className="font-['IBM_Plex_Mono'] text-xs tabular-nums" style={{ color: OCHRE }}>
          − ৳{fmt(inv.discount)}
        </span>
      )}
      <span
        className="font-['IBM_Plex_Mono'] text-sm font-semibold tabular-nums w-16 text-right"
        style={{ color: TEAL }}
      >
        ৳{fmt(inv.commission)}
      </span>
    </div>
  </div>
);

// ─── Referrer entry (ledger view) — unchanged ────────────────────────────────

const ReferrerEntry = ({
  name,
  typeLabel,
  Icon,
  totalCommission,
  totalDiscount,
  invoices,
  totalIndoorTests,
  accent,
  isHospital,
}) => {
  const [open, setOpen] = useState(false);
  const invoiceCount = invoices.length;
  const netCommission = totalCommission - totalDiscount;
  const indoorOnly = isHospital && invoiceCount === 0 && (totalIndoorTests ?? 0) > 0;
  const hasBoth = isHospital && invoiceCount > 0 && (totalIndoorTests ?? 0) > 0;

  return (
    <div className="py-3 border-b border-dashed border-[#E3E0D6] last:border-b-0">
      <button onClick={() => !indoorOnly && setOpen((p) => !p)} className="w-full text-left" disabled={indoorOnly}>
        <div className="flex items-baseline gap-3">
          <span className="flex items-center gap-1.5 text-sm font-medium text-[#1C1F1E] shrink-0 font-noto">
            <Icon className="w-3.5 h-3.5" style={{ color: accent }} />
            {name}
            <span className="font-['IBM_Plex_Mono'] text-xs uppercase text-[#A8ACA3] font-noto">{typeLabel}</span>
            {hasBoth && (
              <span
                className="font-['IBM_Plex_Mono'] text-[10px] uppercase px-1.5 py-[1px] rounded-[2px] font-noto shrink-0"
                style={{
                  color: SEAL_BLUE,
                  backgroundColor: `${SEAL_BLUE}12`,
                  border: `1px solid ${SEAL_BLUE}33`,
                }}
                title={`ইনডোরেও ${totalIndoorTests} টি টেস্ট সংযুক্ত`}
              >
                + ইনডোর
              </span>
            )}
          </span>
          <span className="flex-1 border-b border-dotted border-[#D8D5CB] translate-y-[-3px]" />
          {!indoorOnly && (
            <span
              className="font-['IBM_Plex_Mono'] text-sm font-semibold tabular-nums shrink-0"
              style={{ color: TEAL }}
            >
              ৳{fmt(netCommission)}
            </span>
          )}
          {!indoorOnly &&
            (open ? (
              <ChevronUp className="w-3.5 h-3.5 text-[#A8ACA3] shrink-0" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-[#A8ACA3] shrink-0" />
            ))}
        </div>

        {indoorOnly ? (
          <p className="mt-1.5 pl-5 font-['IBM_Plex_Mono'] text-xs text-[#8A8F89] font-noto">
            ইনডোর রোগীর টেস্টে সংযুক্ত · কোনো ইনভয়েস নেই ({totalIndoorTests} টি টেস্ট)
          </p>
        ) : (
          <div className="flex items-center flex-wrap gap-x-2.5 gap-y-1 mt-1.5 pl-5 font-['IBM_Plex_Mono'] text-xs text-[#8A8F89] font-noto">
            <span>{invoiceCount} টি ইনভয়েস</span>
            <span className="text-[#D8D5CB]">·</span>
            <span>কমিশন ৳{fmt(totalCommission)}</span>
            <span className="text-[#D8D5CB]">·</span>
            <span style={{ color: OCHRE }}>ডিস্কাউন্ট − ৳{fmt(totalDiscount)}</span>
            {hasBoth && (
              <>
                <span className="text-[#D8D5CB]">·</span>
                <span className="text-red-500">(ইনডোরের {totalIndoorTests} টি টেস্ট বাদ দিয়ে)</span>
              </>
            )}
            <span className="text-[#D8D5CB]">·</span>
            <span className="font-semibold" style={{ color: TEAL }}>
              নেট ৳{fmt(netCommission)}
            </span>
          </div>
        )}
      </button>

      {open && !indoorOnly && (
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
  <p className="font-['IBM_Plex_Mono'] text-xs text-[#A8ACA3] py-3 font-noto">{label}</p>
);

// ─── View toggle ──────────────────────────────────────────────────────────────

const ViewToggle = ({ view, onChange }) => (
  <div className="flex items-center gap-1 p-0.5 bg-[#F0EDE5] rounded-sm border border-[#E3E0D6]">
    <button
      onClick={() => onChange("testwise")}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] font-['IBM_Plex_Mono'] text-xs uppercase transition-all font-noto ${
        view === "testwise"
          ? "bg-white text-[#1C1F1E] shadow-[0_1px_2px_rgba(28,31,30,0.08)]"
          : "text-[#8A8F89] hover:text-[#1C1F1E]"
      }`}
    >
      <FlaskConical className="w-3 h-3" />
      টেস্ট ভিত্তিক কমিশন
    </button>

    <button
      onClick={() => onChange("ledger")}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] font-['IBM_Plex_Mono'] text-xs uppercase transition-all font-noto ${
        view === "ledger"
          ? "bg-white text-[#1C1F1E] shadow-[0_1px_2px_rgba(28,31,30,0.08)]"
          : "text-[#8A8F89] hover:text-[#1C1F1E]"
      }`}
    >
      <LayoutList className="w-3 h-3" />
      রেফারারদের হার ভিত্তিক কমিশন
    </button>
  </div>
);

// ─── Test-wise: shared grid template ──────────────────────────────────────────
const TEST_ROW_GRID = "grid items-baseline gap-x-3 grid-cols-[1fr_112px_84px_128px]";
const TEST_ROW_GRID_NO_HOSPITAL = "grid items-baseline gap-x-3 grid-cols-[1fr_112px_84px]";

const MergedTestRow = ({ name, total, outdoorCount, indoorCount, commissionTotal, rates, rateChanged, isHospital }) => (
  <div className="py-1">
    <div className={`${isHospital ? TEST_ROW_GRID : TEST_ROW_GRID_NO_HOSPITAL}`}>
      <span className="font-noto text-sm text-[#1C1F1E] leading-tight truncate flex items-center gap-1.5">
        {name}
        {rateChanged && (
          <span
            className="font-['IBM_Plex_Mono'] text-[9px] uppercase px-1 py-[1px] rounded-[2px] font-noto shrink-0"
            style={{ color: SEAL_RED, backgroundColor: `${SEAL_RED}12`, border: `1px solid ${SEAL_RED}33` }}
            title="এই সময়সীমায় এই টেস্টের কমিশন পরিবর্তিত হয়েছে"
          >
            রেট পরিবর্তিত
          </span>
        )}
      </span>
      <span className="font-['IBM_Plex_Mono'] text-xs text-[#A8ACA3] tabular-nums text-right">
        {rates.length === 1 ? `${total} × ৳${fmt(rates[0].rate)}` : `${total} বার (ভিন্ন হার)`}
      </span>
      <span className="font-['IBM_Plex_Mono'] text-sm font-semibold tabular-nums text-right" style={{ color: TEAL }}>
        ৳{fmt(commissionTotal)}
      </span>
      {isHospital && (
        <span className="font-['IBM_Plex_Mono'] text-xs text-[#A8ACA3] font-noto text-right whitespace-nowrap">
          আউটডোর {outdoorCount}, ইনডোর {indoorCount}
        </span>
      )}
    </div>
    {rateChanged && (
      <div className="flex items-center flex-wrap gap-x-3 gap-y-0.5 mt-1">
        {rates.map((r) => (
          <span key={r.rate} className="font-['IBM_Plex_Mono'] text-[11px] text-[#8A8F89] tabular-nums">
            {fmtDate(r.firstSeenAt)}
            {r.firstSeenAt !== r.lastSeenAt ? `–${fmtDate(r.lastSeenAt)}` : ""}: ৳{fmt(r.rate)} × {r.count} = ৳
            {fmt(r.subtotal)}
          </span>
        ))}
      </div>
    )}
  </div>
);

// ─── Test-wise: single doctor card ──────────────────────────────────────────

const DoctorTestCard = ({ rank, name, type, isRegistered, invoiceCount, outdoorMap, indoorMap, isHospital }) => {
  const accent = isRegistered ? TEAL : OCHRE;
  const meta = TYPE_META[type] ?? TYPE_META.unknown;
  const Icon = isRegistered ? meta.Icon : UserX;
  const typeLabel = isRegistered ? meta.label : "ওয়াক-ইন";
  const mergedTests = useMemo(() => mergeTestAggregates(outdoorMap, indoorMap), [outdoorMap, indoorMap]);
  const totalTests = mergedTests.reduce((s, t) => s + t.total, 0);
  const totalTestCommission = mergedTests.reduce((s, t) => s + t.commissionTotal, 0);

  return (
    <div className="py-4 border-b border-dashed border-[#E3E0D6] last:border-b-0">
      <div className="flex items-center gap-2.5 mb-3">
        <span className="font-['IBM_Plex_Mono'] text-xs text-[#C7C4B8] tabular-nums w-5 shrink-0">
          {String(rank).padStart(2, "0")}
        </span>
        <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: accent }} />
        <span className="font-['IBM_Plex_Sans'] text-sm font-semibold text-[#1C1F1E] font-noto">{name}</span>
        {typeLabel && (
          <span className="font-['IBM_Plex_Mono'] text-[10px] uppercase text-[#A8ACA3] font-noto">{typeLabel}</span>
        )}
        <span className="flex-1 border-b border-dotted border-[#D8D5CB]" />
        <span className="font-['IBM_Plex_Mono'] text-xs text-[#8A8F89] tabular-nums shrink-0 font-noto">
          {invoiceCount} ইনভয়েস · {totalTests} টেস্ট
        </span>
      </div>

      <div className="pl-8">
        {mergedTests.length > 0 ? (
          <>
            {mergedTests.map((t) => (
              <MergedTestRow
                key={t.name}
                name={t.name}
                total={t.total}
                outdoorCount={t.outdoorCount}
                indoorCount={t.indoorCount}
                commissionTotal={t.commissionTotal}
                rates={t.rates}
                rateChanged={t.rateChanged}
                isHospital={isHospital}
              />
            ))}
            <div
              className={`${isHospital ? TEST_ROW_GRID : TEST_ROW_GRID_NO_HOSPITAL} pt-1.5 mt-1 border-t border-[#E3E0D6]`}
            >
              <span className="col-span-2 font-['IBM_Plex_Mono'] text-xs uppercase text-[#8A8F89] font-noto text-right">
                কমিশন
              </span>
              <span
                className="font-['IBM_Plex_Mono'] text-sm font-bold tabular-nums text-right"
                style={{ color: TEAL }}
              >
                ৳{fmt(totalTestCommission)}
              </span>
              {isHospital && <span />}
            </div>
          </>
        ) : (
          <p className="font-['IBM_Plex_Mono'] text-xs text-[#C7C4B8] font-noto">নেই</p>
        )}
      </div>
    </div>
  );
};

// ─── Test-wise view ───────────────────────────────────────────────────────────

const TestWiseView = ({ registered, unregistered, headingLabel, timeRange, d, lab, isHospital }) => {
  const rows = useMemo(() => buildDoctorTestRows(registered, unregistered), [registered, unregistered]);
  const totalOutdoorOccurrences = rows.reduce((s, r) => s + sumAggregateCounts(r.outdoorMap), 0);
  const totalIndoorOccurrences = rows.reduce((s, r) => s + sumAggregateCounts(r.indoorMap), 0);
  const totalTestCommission = rows.reduce(
    (s, r) => s + mergeTestAggregates(r.outdoorMap, r.indoorMap).reduce((ss, t) => ss + t.commissionTotal, 0),
    0,
  );

  return (
    <div
      id="commission-printable"
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
        <div className="min-w-0 flex-1">
          <p className="font-['IBM_Plex_Mono'] text-xs uppercase text-[#0F6E5C] mb-1.5 font-noto">
            টেস্ট-ভিত্তিক কমিশন রিপোর্ট
          </p>
          <h2 className="font-['IBM_Plex_Sans'] text-2xl font-semibold text-[#1C1F1E] font-noto">{headingLabel}</h2>

          <div className="flex flex-nowrap divide-x divide-[#E3E0D6] mt-2">
            <HeaderStat label="রেফারার" value={`${fmt(rows.length)} জন`} accent={TEAL} />
            {isHospital && (
              <>
                <HeaderStat label="আউটডোর" value={fmt(totalOutdoorOccurrences)} />
                <HeaderStat label="ইনডোর" value={fmt(totalIndoorOccurrences)} accent={SEAL_BLUE} />
              </>
            )}
          </div>
        </div>
        <ReportSeal dateLabel={recordStamp(timeRange?.start, timeRange?.end)} reportName="Commission Report" />
      </div>

      <div className="px-6 sm:px-8 py-5 border-b border-[#E3E0D6]">
        <div className="grid grid-cols-3 divide-x divide-[#E3E0D6] border border-[#E3E0D6] rounded-sm">
          <LedgerCell
            icon={FlaskConical}
            label="টেস্ট"
            value={totalOutdoorOccurrences + totalIndoorOccurrences}
            accent={TEAL}
            sub={isHospital ? `আউটডোর ${totalOutdoorOccurrences} · ইনডোর ${totalIndoorOccurrences}` : undefined}
          />
          <LedgerCell
            icon={BadgeDollarSign}
            label="টেস্ট-ভিত্তিক কমিশন"
            value={`৳${fmt(totalTestCommission)}`}
            accent={SEAL_BLUE}
          />
          <LedgerCell
            icon={ReceiptText}
            label="ইনভয়েস"
            value={fmt(d.totals.totalInvoices)}
            accent={RUST}
            sub={`কমিশন ৳${fmt(d.totals.totalCommission)}`}
          />
        </div>
      </div>

      <div className="px-6 sm:px-8 py-5">
        {rows.length > 0 ? (
          rows.map((r, i) => (
            <DoctorTestCard
              key={r.key}
              rank={i + 1}
              name={r.name}
              type={r.type}
              isRegistered={r.isRegistered}
              invoiceCount={r.invoiceCount}
              outdoorMap={r.outdoorMap}
              indoorMap={r.indoorMap}
              isHospital={isHospital}
            />
          ))
        ) : (
          <EmptySection label="এই সময়সীমায় কোনো টেস্টের তথ্য নেই" />
        )}
      </div>
    </div>
  );
};

// ─── Ledger view — unchanged ─────────────────────────────────────────────────

const LedgerView = ({ d, headingLabel, timeRange, referrerCount, lab, isHospital }) => (
  <div
    id="commission-printable"
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
      <div className="min-w-0 flex-1">
        <p className="font-['IBM_Plex_Mono'] text-xs uppercase text-[#0F6E5C] mb-1.5 font-noto">
          রেফারারদের হার ভিত্তিক কমিশন
        </p>
        <h2 className="font-['IBM_Plex_Sans'] text-2xl font-semibold text-[#1C1F1E] font-noto">{headingLabel}</h2>

        <div className="flex flex-nowrap divide-x divide-[#E3E0D6] mt-2">
          <HeaderStat label="রেফারার" value={`${fmt(referrerCount)} জন`} accent={TEAL} />
          <HeaderStat label="ইনভয়েস" value={`${fmt(d.totals.totalInvoices)} টি`} />
        </div>
      </div>
      <ReportSeal dateLabel={recordStamp(timeRange?.start, timeRange?.end)} reportName="Commission Report" />
    </div>

    <div className="px-6 sm:px-8 py-5 border-b border-[#E3E0D6]">
      <div className="grid grid-cols-2 divide-x divide-[#E3E0D6] border border-[#E3E0D6] rounded-sm">
        <LedgerCell
          icon={BadgeDollarSign}
          label="কমিশন"
          value={`৳${fmt(d.totals.totalCommission)}`}
          accent={TEAL}
          sub={`${fmt(d.totals.totalInvoices)} টি ইনভয়েস থেকে`}
        />
        <LedgerCell
          icon={Tag}
          label="ডিস্কাউন্ট"
          value={`৳${fmt(d.totals.totalDiscount)}`}
          accent={RUST}
          sub={`${fmt(referrerCount)} জন রেফারারের মধ্যে`}
        />
      </div>
    </div>

    <div className="px-6 sm:px-8 py-5 border-b border-[#E3E0D6]">
      <p className="font-['IBM_Plex_Mono'] text-xs uppercase text-[#6F756F] mb-1 font-noto">নিবন্ধিত রেফারার</p>
      {d.registered.length > 0 ? (
        d.registered.map((r) => {
          const meta = TYPE_META[r.type] ?? TYPE_META.unknown;
          return (
            <ReferrerEntry
              key={r.referrerId}
              name={r.name}
              typeLabel={meta.label}
              Icon={meta.Icon}
              totalCommission={r.totalCommission}
              totalDiscount={r.totalDiscount}
              invoices={r.invoices}
              totalIndoorTests={r.totalIndoorTests}
              accent={TEAL}
              isHospital={isHospital}
            />
          );
        })
      ) : (
        <EmptySection label="এই সময়সীমায় কোনো নিবন্ধিত রেফারার নেই" />
      )}
    </div>

    <div className="px-6 sm:px-8 py-5">
      <p className="font-['IBM_Plex_Mono'] text-xs uppercase text-[#6F756F] mb-1 font-noto">অনিবন্ধিত / ওয়াক-ইন</p>
      {d.unregistered.length > 0 ? (
        d.unregistered.map((g) => (
          <ReferrerEntry
            key={String(g.referredBy)}
            name={g.referredBy}
            typeLabel="ওয়াক-ইন"
            Icon={UserX}
            totalCommission={g.totalCommission}
            totalDiscount={g.totalDiscount}
            invoices={g.invoices}
            totalIndoorTests={g.totalIndoorTests}
            accent={OCHRE}
            isHospital={isHospital}
          />
        ))
      ) : (
        <EmptySection label="এই সময়সীমায় কোনো ওয়াক-ইন কমিশন নেই" />
      )}
    </div>
  </div>
);

// ─── Main ─────────────────────────────────────────────────────────────────────

const CommissionReport = () => {
  const navigate = useNavigate();
  const lab = useAuthStore((s) => s.lab);
  const user = useAuthStore((s) => s.user);
  const isHospital = user?.type === "hospital";

  // ═══════════ ফ্রন্টএন্ড পারমিশন চেক ═══════════
  const isAdmin = user?.role === "admin";
  const hasAccess = isAdmin || user?.permissions?.commissionReport === true;
  if (!hasAccess) {
    return <Popup type="denied" message="কমিশন রিপোর্ট দেখার অনুমতি আপনার নেই।" onClose={() => navigate("/")} />;
  }
  // ════════════════════════════════════════════════

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [popup, setPopup] = useState(null);
  const [offlinePopup, setOfflinePopup] = useState(false); // ← new
  const [timeRange, setTimeRange] = useState(null);
  const [view, setView] = useState("testwise");
  const [permissionDenied, setPermissionDenied] = useState(false);

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
    } catch (err) {
      if (isNetworkError(err)) {
        setOfflinePopup(true); // ← show default offline popup
        return;
      }
      const isPermissionDenied = err?.response?.status === 403;
      if (isPermissionDenied) setPermissionDenied(true);
      setPopup({
        type: isPermissionDenied ? "denied" : "error",
        message: getErrorMessage(err, "কমিশনের তথ্য লোড করা সম্ভব হয়নি। আবার চেষ্টা করুন।"),
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
  // throwaway iframe and print that in isolation. Works for either view
  // since both LedgerView and TestWiseView render the same #commission-printable id.
  const printReport = () => {
    const printable = document.getElementById("commission-printable");
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
  const referrerCount = d.registered.length + d.unregistered.length;

  return (
    <section className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 px-4 py-6 font-noto">
      {popup && (
        <Popup
          type={popup.type}
          message={popup.message}
          onClose={() => {
            setPopup(null);
            if (permissionDenied) navigate("/lab-management");
          }}
        />
      )}
      {offlinePopup && <Popup type="offline" onClose={() => setOfflinePopup(false)} />}

      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="font-['IBM_Plex_Sans'] text-2xl sm:text-3xl font-semibold text-[#1C1F1E] font-noto">
              কমিশন রিপোর্ট
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

        <div className="mb-3">
          <TimeFrame onFetchData={handleFetchData} />
        </div>

        <div className="mb-5">
          <ViewToggle view={view} onChange={setView} />
        </div>

        {loading ? (
          <SkeletonReceipt />
        ) : view === "ledger" ? (
          <LedgerView
            d={d}
            headingLabel={headingLabel}
            timeRange={timeRange}
            referrerCount={referrerCount}
            lab={lab}
            isHospital={isHospital}
          />
        ) : (
          <TestWiseView
            registered={d.registered}
            unregistered={d.unregistered}
            headingLabel={headingLabel}
            timeRange={timeRange}
            d={d}
            lab={lab}
            isHospital={isHospital}
          />
        )}

        <p className="font-['IBM_Plex_Mono'] text-center text-xs text-[#A8ACA3] mt-4 pb-6 font-noto">
          শুধুমাত্র সক্রিয় (ডিলিট না হওয়া) ইনভয়েসের হিসাব অন্তর্ভুক্ত
        </p>
      </div>
    </section>
  );
};

export default CommissionReport;
