// @babel-plugin-react-compiler
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Printer,
  Trash2,
  PackageCheck,
  Clock,
  TrendingDown,
  Users,
  UserPlus,
  UserMinus,
  Wallet,
  Activity,
  CalendarDays,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  Receipt as ReceiptIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import TimeFrame from "../../../components/timeFrame";
import cashmemoService from "../../../api/dailyReports/cashmemo";
import Popup from "../../../components/popup";
import { useAuthStore } from "../../../store/authStore";

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
  return {
    start: new Date(now).setHours(0, 0, 0, 0),
    end: new Date(now).setHours(23, 59, 59, 999),
  };
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

// ── Error helpers (mirrors ManageReferrer.jsx) ─────────────────────────────────

const PERMISSION_DENIED_MESSAGE = "আপনার কর্তৃপক্ষ আপনাকে এই কাজটি করার বা এই তথ্যটি পাওয়ার অনুমতি দেয়নি।";

const getErrorMessage = (err, fallback) => {
  if (err?.response?.status === 403) return PERMISSION_DENIED_MESSAGE;
  return err?.response?.data?.error ?? fallback;
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

// ─── Shared primitives ────────────────────────────────────────────────────────

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

// Clickable variant of LedgerCell — used for drill-down sections that expand
// an inline list below when tapped.
const ClickableLedgerCell = ({ icon: Icon, label, value, accent, open, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full text-left px-5 py-4 border-l-[3px] hover:brightness-[0.98] transition-[filter] no-print"
    style={{ borderColor: accent }}
  >
    <div className="flex items-center justify-between mb-1.5">
      <div className="flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5" style={{ color: accent }} />
        <p className="font-['IBM_Plex_Mono'] text-xs uppercase text-[#6F756F] font-noto">{label}</p>
      </div>
      {open ? (
        <ChevronDown className="w-3.5 h-3.5" style={{ color: accent }} />
      ) : (
        <ChevronRight className="w-3.5 h-3.5" style={{ color: accent }} />
      )}
    </div>
    <p className="font-['IBM_Plex_Mono'] text-2xl font-semibold text-[#1C1F1E] tabular-nums">{value}</p>
  </button>
);

const NetStamp = ({ amount, label = "নিট আয়", accent = "#0F6E5C" }) => (
  <div className="flex justify-center py-3">
    <div
      className="relative rotate-[-1.5deg] rounded-md px-10 py-5 text-center"
      style={{ border: `2px solid ${accent}` }}
    >
      <div
        className="absolute inset-[3px] rounded-sm pointer-events-none"
        style={{ border: `1px solid ${accent}40` }}
      />
      <p className="font-['IBM_Plex_Mono'] text-xs uppercase mb-1 font-noto" style={{ color: accent }}>
        {label}
      </p>
      <p className="font-['IBM_Plex_Mono'] text-4xl font-bold tabular-nums" style={{ color: accent }}>
        ৳{fmt(amount)}
      </p>
    </div>
  </div>
);

const SectionDivider = ({ label }) => (
  <div className="flex items-center gap-2 my-4">
    <div className="flex-1 h-px bg-[#E3E0D6]" />
    <span className="font-['IBM_Plex_Mono'] text-xs text-[#8A8F89] bg-[#F5F4EF] border border-[#E3E0D6] rounded-sm px-3 py-1 whitespace-nowrap uppercase font-noto">
      {label}
    </span>
    <div className="flex-1 h-px bg-[#E3E0D6]" />
  </div>
);

// ─── Summary primitives ───────────────────────────────────────────────────────

const SummarySection = ({ title, icon: Icon, accent, rows, badge }) => (
  <div className="border border-[#E3E0D6] rounded-sm overflow-hidden mb-4 last:mb-0">
    <div
      className="flex items-center justify-between px-4 py-3 border-l-4"
      style={{ backgroundColor: `${accent}08`, borderColor: accent }}
    >
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4" style={{ color: accent }} />}
        <p className="text-sm font-semibold text-[#1C1F1E] font-noto">{title}</p>
      </div>
      {badge && (
        <span
          className="font-['IBM_Plex_Mono'] text-xs px-2 py-0.5 rounded-sm border font-noto"
          style={{ color: accent, borderColor: `${accent}30`, backgroundColor: `${accent}08` }}
        >
          {badge}
        </span>
      )}
    </div>
    <div className="divide-y divide-[#F0EEE6] px-4 sm:px-5 bg-white">
      {rows.map((r) => (
        <ReceiptLine key={r.label} label={r.label} value={r.value} tone={r.tone ?? accent} bold={r.bold} />
      ))}
    </div>
  </div>
);

// ─── Stamp ────────────────────────────────────────────────────────────────────

const SEAL_BLUE = "#1E4FA0";
const SEAL_RED = "#C0312B";
const SEAL_INDIGO = "#3730A3";
const SEAL_VIOLET = "#6D28D9";

const RoundSeal = ({ dateLabel, variant = "outdoor" }) => {
  const borderColor = variant === "indoor" ? SEAL_INDIGO : variant === "summary" ? SEAL_VIOLET : SEAL_BLUE;
  const titleColor = borderColor;
  const subtitleColor = SEAL_RED;
  const subtitle = variant === "indoor" ? "IPD Memo" : variant === "summary" ? "Summary" : "Cashmemo";

  return (
    <div className="relative shrink-0 select-none rotate-[-3deg]">
      <div
        className="bg-white px-4 py-2.5 rounded-[3px]"
        style={{ border: `2px solid ${borderColor}`, boxShadow: `inset 0 0 0 3px ${borderColor}05` }}
      >
        <div className="border" style={{ borderColor: `${borderColor}55`, padding: "5px 10px" }}>
          <p
            className="text-center font-['IBM_Plex_Mono'] font-bold uppercase"
            style={{ color: titleColor, fontSize: "10px", letterSpacing: "2px" }}
          >
            LabPilotPro.com
          </p>
          <div className="h-px w-full my-1" style={{ backgroundColor: `${borderColor}55` }} />
          <p
            className="text-center font-['IBM_Plex_Mono'] font-extrabold uppercase"
            style={{ color: subtitleColor, fontSize: "15px", letterSpacing: "1.5px" }}
          >
            {subtitle}
          </p>
          <p
            className="text-center font-['IBM_Plex_Mono'] font-semibold"
            style={{ color: subtitleColor, fontSize: "11px", letterSpacing: "0.5px" }}
          >
            {dateLabel}
          </p>
        </div>
      </div>
    </div>
  );
};

// ─── Color tokens ─────────────────────────────────────────────────────────────

const TEAL = "#0F6E5C";
const OCHRE = "#B5772A";
const RUST = "#B23A2E";
const INDIGO = "#3730A3";
const VIOLET = "#7C3AED";

// ─── Discount patient drill-down (inline) ─────────────────────────────────────

const DiscountPatientsInline = ({ loading, patients }) => (
  <div className="border border-t-0 border-[#E3D9C6] rounded-b-sm bg-[#FFFDF9] overflow-hidden">
    <div className="max-h-72 overflow-y-auto px-4 divide-y divide-[#F0EEE6]">
      {loading && <p className="py-6 text-center text-sm text-[#8A8F89] font-noto">লোড হচ্ছে...</p>}

      {!loading && (!patients || patients.length === 0) && (
        <p className="py-6 text-center text-sm text-[#8A8F89] font-noto">এই সময়ে কোনো ডিসকাউন্ট প্রয়োগ হয়নি।</p>
      )}

      {!loading &&
        patients?.map((p) => (
          <div key={p._id} className="py-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#1C1F1E] font-noto truncate">{p.patientName}</p>
              <p className="font-['IBM_Plex_Mono'] text-xs text-[#8A8F89] mt-0.5">
                {p.admissionId} · {p.discountCount}টি এন্ট্রি
              </p>
            </div>
            <p className="font-['IBM_Plex_Mono'] text-sm font-semibold tabular-nums shrink-0" style={{ color: OCHRE }}>
              − ৳{fmt(p.totalDiscount)}
            </p>
          </div>
        ))}
    </div>
  </div>
);

// ─── Admission / release patient drill-down (inline) ─────────────────────────

const AdmissionPatientsInline = ({ loading, patients, type }) => (
  <div className="border border-t-0 border-[#E3E0D6] rounded-b-sm bg-[#FFFDF9] overflow-hidden">
    <div className="max-h-72 overflow-y-auto px-4 divide-y divide-[#F0EEE6]">
      {loading && <p className="py-6 text-center text-sm text-[#8A8F89] font-noto">লোড হচ্ছে...</p>}

      {!loading && (!patients || patients.length === 0) && (
        <p className="py-6 text-center text-sm text-[#8A8F89] font-noto">
          {type === "admitted" ? "এই সময়ে কোনো রোগী ভর্তি হয়নি।" : "এই সময়ে কোনো রোগী ছাড়প্রাপ্ত হয়নি।"}
        </p>
      )}

      {!loading &&
        patients?.map((p) => (
          <div key={p._id} className="py-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#1C1F1E] font-noto truncate">{p.patient?.name}</p>
              <p className="font-['IBM_Plex_Mono'] text-xs text-[#8A8F89] mt-0.5 truncate">
                {p.admissionId}
                {p.space?.spaceName ? ` · ${p.space.spaceName}` : ""}
                {p.space?.bedNumber ? ` (বেড ${p.space.bedNumber})` : ""}
                {p.supervisorDoctor?.name ? ` · ${p.supervisorDoctor.name}` : ""}
              </p>
            </div>
            <p className="font-['IBM_Plex_Mono'] text-xs text-[#8A8F89] shrink-0">
              {new Date(type === "admitted" ? p.admittedAt : p.releasedAt).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
              })}
            </p>
          </div>
        ))}
    </div>
  </div>
);

// ─── Outstanding (AR) patient drill-down (inline) ────────────────────────────

const OutstandingPatientsInline = ({ loading, patients }) => (
  <div className="border border-t-0 border-[#E3D5D2] rounded-b-sm bg-[#FFFBFA] overflow-hidden">
    <div className="max-h-72 overflow-y-auto px-4 divide-y divide-[#F0EEE6]">
      {loading && <p className="py-6 text-center text-sm text-[#8A8F89] font-noto">লোড হচ্ছে...</p>}

      {!loading && (!patients || patients.length === 0) && (
        <p className="py-6 text-center text-sm text-[#8A8F89] font-noto">বর্তমানে কোনো রোগীর বকেয়া নেই।</p>
      )}

      {!loading &&
        patients?.map((p) => (
          <div key={p._id} className="py-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#1C1F1E] font-noto truncate">{p.patientName}</p>
              <p className="font-['IBM_Plex_Mono'] text-xs text-[#8A8F89] mt-0.5 truncate">
                {p.admissionId}
                {p.spaceName ? ` · ${p.spaceName}` : ""}
                {p.bedNumber ? ` (বেড ${p.bedNumber})` : ""}
              </p>
            </div>
            <p className="font-['IBM_Plex_Mono'] text-sm font-semibold tabular-nums shrink-0" style={{ color: RUST }}>
              ৳{fmt(p.due)}
            </p>
          </div>
        ))}
    </div>
  </div>
);

// ─── Deleted patient drill-down (IPD, inline) ─────────────────────────────────
// Shows soft-deleted admissions with their billed/collected figures so the
// deletion figure on the header can be audited, not just counted.

const DeletedPatientsInline = ({ loading, patients }) => (
  <div className="border border-t-0 border-[#E3D9D5] rounded-b-sm bg-[#FFFBFA] overflow-hidden">
    <div className="max-h-72 overflow-y-auto px-4 divide-y divide-[#F0EEE6]">
      {loading && <p className="py-6 text-center text-sm text-[#8A8F89] font-noto">লোড হচ্ছে...</p>}

      {!loading && (!patients || patients.length === 0) && (
        <p className="py-6 text-center text-sm text-[#8A8F89] font-noto">এই সময়ে কোনো রোগী ডিলিট করা হয়নি।</p>
      )}

      {!loading &&
        patients?.map((p) => (
          <div key={p._id} className="py-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#1C1F1E] font-noto truncate">{p.patientName}</p>
              <p className="font-['IBM_Plex_Mono'] text-xs text-[#8A8F89] mt-0.5 truncate">
                {p.admissionId}
                {p.spaceName ? ` · ${p.spaceName}` : ""}
                {p.bedNumber ? ` (বেড ${p.bedNumber})` : ""}
                {p.deletedBy ? ` · মুছেছেন: ${p.deletedBy}` : ""}
              </p>
              {p.deletedAt && (
                <p className="font-['IBM_Plex_Mono'] text-xs text-[#A8807A] mt-0.5">
                  ডিলিট:{" "}
                  {new Date(p.deletedAt).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              )}
            </div>
            <div className="text-right shrink-0">
              <p className="font-['IBM_Plex_Mono'] text-sm font-semibold tabular-nums text-[#B23A2E]">
                বিল ৳{fmt(p.billed)}
              </p>
              <p className="font-['IBM_Plex_Mono'] text-xs tabular-nums text-[#8A8F89] mt-0.5">
                আদায় ৳{fmt(p.collected)}
              </p>
            </div>
          </div>
        ))}
    </div>
  </div>
);

// ─── Deleted invoice drill-down (Outdoor, inline) ─────────────────────────────
// Mirrors DeletedPatientsInline but for soft-deleted OPD invoices, showing
// billed/collected figures so the header deletion count/amount can be audited.

const DeletedInvoicesInline = ({ loading, invoices }) => (
  <div className="border border-t-0 border-[#E3D9D5] rounded-b-sm bg-[#FFFBFA] overflow-hidden">
    <div className="max-h-72 overflow-y-auto px-4 divide-y divide-[#F0EEE6]">
      {loading && <p className="py-6 text-center text-sm text-[#8A8F89] font-noto">লোড হচ্ছে...</p>}

      {!loading && (!invoices || invoices.length === 0) && (
        <p className="py-6 text-center text-sm text-[#8A8F89] font-noto">এই সময়ে কোনো ইনভয়েস ডিলিট করা হয়নি।</p>
      )}

      {!loading &&
        invoices?.map((inv) => (
          <div key={inv._id} className="py-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#1C1F1E] font-noto truncate">{inv.patient?.name}</p>
              <p className="font-['IBM_Plex_Mono'] text-xs text-[#8A8F89] mt-0.5 truncate">
                {inv.invoiceId}
                {inv.deletion?.by?.name ? ` · মুছেছেন: ${inv.deletion.by.name}` : ""}
              </p>
              {inv.deletion?.at && (
                <p className="font-['IBM_Plex_Mono'] text-xs text-[#A8807A] mt-0.5">
                  ডিলিট:{" "}
                  {new Date(inv.deletion.at).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              )}
            </div>
            <div className="text-right shrink-0">
              <p className="font-['IBM_Plex_Mono'] text-sm font-semibold tabular-nums text-[#B23A2E]">
                বিল ৳{fmt(inv.amount?.final)}
              </p>
              <p className="font-['IBM_Plex_Mono'] text-xs tabular-nums text-[#8A8F89] mt-0.5">
                আদায় ৳{fmt(inv.amount?.paid)}
              </p>
            </div>
          </div>
        ))}
    </div>
  </div>
);

// ─── Category revenue breakdown bars ─────────────────────────────────────────

const CATEGORY_LABELS = { test: "পরীক্ষা", medicine: "মেডিসিন", product: "পণ্য", other: "অন্যান্য" };

const CategoryBreakdown = ({ breakdown }) => {
  const b = breakdown ?? { test: 0, medicine: 0, product: 0, other: 0 };
  const max = Math.max(1, b.test, b.medicine, b.product, b.other);

  return (
    <div className="border border-[#E3E0D6] rounded-sm px-4 py-4 mb-3 space-y-3">
      <p className="font-['IBM_Plex_Mono'] text-xs uppercase text-[#8A8F89] font-noto">খাত অনুযায়ী আয়</p>
      {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
        <div key={key}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-[#3A3F3E] font-noto">{label}</span>
            <span className="font-['IBM_Plex_Mono'] text-sm text-[#1C1F1E] tabular-nums">৳{fmt(b[key])}</span>
          </div>
          <div className="h-1.5 w-full bg-[#F0EEE6] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{ width: `${(b[key] / max) * 100}%`, backgroundColor: INDIGO }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── Outdoor cashmemo receipt ─────────────────────────────────────────────────

const OutdoorReceipt = ({ summary, timeRange, labName, labAddress, labPhone }) => {
  const d = summary ?? {};
  const headingLabel = buildHeadingLabel(timeRange?.start, timeRange?.end);
  const grossCounterAmount = (d.initial ?? 0) - (d.labAdjustment ?? 0) - (d.referrerDiscount ?? 0);

  // ── Deleted-invoices drill-down state (mirrors IPD's toggleDeleted) ──
  const [deletedOpen, setDeletedOpen] = useState(false);
  const [deletedInvoices, setDeletedInvoices] = useState(null);
  const [deletedLoading, setDeletedLoading] = useState(false);

  const toggleDeleted = async () => {
    if (deletedOpen) {
      setDeletedOpen(false);
      return;
    }
    setDeletedOpen(true);
    if (deletedInvoices !== null) return;
    setDeletedLoading(true);
    try {
      const res = await cashmemoService.getOutdoorDeletedInvoices({
        startDate: timeRange?.start,
        endDate: timeRange?.end,
      });
      setDeletedInvoices(res.data.invoices ?? []);
    } catch {
      setDeletedInvoices([]);
    } finally {
      setDeletedLoading(false);
    }
  };

  // Reset the drill-down whenever the reporting range changes so stale data
  // from a previous range isn't shown under a new header count.
  useEffect(() => {
    setDeletedOpen(false);
    setDeletedInvoices(null);
  }, [timeRange?.start, timeRange?.end]);

  return (
    <div
      id="cashmemo-printable"
      className="bg-white border border-[#E3E0D6] rounded-lg shadow-[0_1px_2px_rgba(28,31,30,0.04)] overflow-hidden"
    >
      {/* Letterhead */}
      <div className="px-6 sm:px-8 pt-5 pb-4 text-center border-b border-[#E3E0D6] bg-[#FAF9F5]">
        <h3 className="font-['IBM_Plex_Sans'] text-lg font-bold text-[#1C1F1E] tracking-wide font-noto">
          {labName ?? "LabPilot Pro"}
        </h3>
        {labAddress && <p className="font-['IBM_Plex_Mono'] text-xs text-[#6F756F] mt-1 font-noto">{labAddress}</p>}
        {labPhone && <p className="font-['IBM_Plex_Mono'] text-xs text-[#6F756F] mt-1 font-noto">{labPhone}</p>}
      </div>

      {/* Header band */}
      <div className="px-6 sm:px-8 pt-6 pb-5 border-b border-[#E3E0D6] flex items-start justify-between gap-4">
        <div>
          <p className="font-['IBM_Plex_Mono'] text-xs uppercase text-[#0F6E5C] mb-1.5 font-noto">
            বহির্বিভাগ ক্যাশ মেমু
          </p>
          <h2 className="font-['IBM_Plex_Sans'] text-2xl font-semibold text-[#1C1F1E] font-noto">{headingLabel}</h2>
          <p className="font-['IBM_Plex_Mono'] text-sm text-[#8A8F89] mt-1.5 font-noto">
            {d.totalInvoices ?? 0}টি ইনভয়েস রেকর্ড করা হয়েছে
          </p>
        </div>
        <RoundSeal dateLabel={recordStamp(timeRange?.start, timeRange?.end)} variant="outdoor" />
      </div>

      <div className="px-6 sm:px-8 py-5">
        {/* Line items */}
        <div className="divide-y divide-[#F0EEE6]">
          <ReceiptLine label="মোট বিক্রি" value={`৳${fmt(d.initial)}`} bold />
          <ReceiptLine label="ল্যাব ডিস্কাউন্ট" value={`− ৳${fmt(d.labAdjustment)}`} tone={OCHRE} />
          <ReceiptLine label="রেফারার ডিস্কাউন্ট" value={`− ৳${fmt(d.referrerDiscount)}`} tone={OCHRE} />
        </div>

        {/* নিট টোটাল */}
        <div className="mt-4 border border-[#E3E0D6] rounded-sm overflow-hidden">
          <div
            className="flex items-center justify-between px-4 py-3 bg-[#F5F4EF] border-l-4"
            style={{ borderColor: TEAL }}
          >
            <p className="text-sm font-semibold text-[#1C1F1E] font-noto">সকল ডিসকাউন্ট বাদে আয় (নিট টোটাল)</p>
            <p className="font-['IBM_Plex_Mono'] text-lg font-bold tabular-nums" style={{ color: TEAL }}>
              ৳{fmt(grossCounterAmount)}
            </p>
          </div>
        </div>

        {/* নগদ / বাকি */}
        <div className="grid grid-cols-2 divide-x divide-[#E3E0D6] border border-[#E3E0D6] rounded-sm my-4">
          <LedgerCell icon={PackageCheck} label="নগদ" value={`৳${fmt(d.totalPaid)}`} accent={TEAL} />
          <LedgerCell icon={Clock} label="বাকি" value={`৳${fmt(d.totalDue)}`} accent={RUST} />
        </div>

        {/* কমিশন */}
        <div className="border border-[#E3D9C6] rounded-sm overflow-hidden mb-4">
          <div
            className="flex items-center justify-between px-4 py-3 bg-[#FBF7EF] border-l-4"
            style={{ borderColor: OCHRE }}
          >
            <p className="text-sm font-semibold text-[#1C1F1E] font-noto">মোট কমিশন</p>
            <p className="font-['IBM_Plex_Mono'] text-lg font-bold tabular-nums" style={{ color: OCHRE }}>
              − ৳{fmt(d.referrerCommission)}
            </p>
          </div>
        </div>

        <SectionDivider label="নিট টোটাল থেকে মোট কমিশন বাদ দেওয়ার পর" />

        <NetStamp amount={d.totalNet} label="নিট আয়" accent={TEAL} />

        {/* Deleted invoices — clickable, expands inline list (mirrors IPD tab) */}
        <div className="mt-3 mb-0">
          <button
            type="button"
            onClick={toggleDeleted}
            className={`w-full text-left border border-[#E3D9D5] overflow-hidden hover:brightness-[0.98] transition-[filter] no-print ${
              deletedOpen ? "rounded-t-sm" : "rounded-sm"
            }`}
          >
            <div
              className="flex items-center justify-between px-4 py-2.5 bg-[#FBF2F0] border-l-4"
              style={{ borderColor: "#B23A2E" }}
            >
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
                {deletedOpen ? (
                  <ChevronDown className="w-4 h-4 text-[#B23A2E]" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-[#B23A2E]" />
                )}
              </div>
            </div>
          </button>

          {deletedOpen && <DeletedInvoicesInline loading={deletedLoading} invoices={deletedInvoices} />}
        </div>
      </div>
    </div>
  );
};

// ─── Indoor (IPD) revenue-cycle receipt ──────────────────────────────────────
//
// Layout mirrors a real hospital finance dashboard:
//   census + patient flow (admitted/released, ALOS)
//   → billed / collected / due + collection rate
//   → revenue mix by category
//   → discounts (drill-down)
//   → outstanding patients / AR (drill-down)
//   → deleted patients (drill-down, mirrors outdoor tab but with detail)

const IndoorReceipt = ({ summary, timeRange, labName, labAddress, labPhone }) => {
  const d = summary ?? {};
  const headingLabel = buildHeadingLabel(timeRange?.start, timeRange?.end);
  const collectionRate = d.collectionRate ?? 0;

  const [discountOpen, setDiscountOpen] = useState(false);
  const [discountPatients, setDiscountPatients] = useState(null);
  const [discountLoading, setDiscountLoading] = useState(false);

  const [expandedSection, setExpandedSection] = useState(null);
  const [admittedPatients, setAdmittedPatients] = useState(null);
  const [releasedPatients, setReleasedPatients] = useState(null);
  const [admittedLoading, setAdmittedLoading] = useState(false);
  const [releasedLoading, setReleasedLoading] = useState(false);

  const [outstandingOpen, setOutstandingOpen] = useState(false);
  const [outstandingPatients, setOutstandingPatients] = useState(null);
  const [outstandingLoading, setOutstandingLoading] = useState(false);

  // ── Deleted-patients drill-down state ──
  const [deletedOpen, setDeletedOpen] = useState(false);
  const [deletedPatients, setDeletedPatients] = useState(null);
  const [deletedLoading, setDeletedLoading] = useState(false);

  const toggleDiscount = async () => {
    if (discountOpen) {
      setDiscountOpen(false);
      return;
    }
    setDiscountOpen(true);
    if (discountPatients !== null) return;
    setDiscountLoading(true);
    try {
      const res = await cashmemoService.getIpdDiscountPatients({
        startDate: timeRange?.start,
        endDate: timeRange?.end,
      });
      setDiscountPatients(res.data.patients ?? []);
    } catch {
      setDiscountPatients([]);
    } finally {
      setDiscountLoading(false);
    }
  };

  const toggleSection = async (type) => {
    if (expandedSection === type) {
      setExpandedSection(null);
      return;
    }
    setExpandedSection(type);

    if (type === "admitted") {
      if (admittedPatients !== null) return;
      setAdmittedLoading(true);
      try {
        const res = await cashmemoService.getIpdAdmittedPatients({
          startDate: timeRange?.start,
          endDate: timeRange?.end,
        });
        setAdmittedPatients(res.data.patients ?? []);
      } catch {
        setAdmittedPatients([]);
      } finally {
        setAdmittedLoading(false);
      }
    } else {
      if (releasedPatients !== null) return;
      setReleasedLoading(true);
      try {
        const res = await cashmemoService.getIpdReleasedPatients({
          startDate: timeRange?.start,
          endDate: timeRange?.end,
        });
        setReleasedPatients(res.data.patients ?? []);
      } catch {
        setReleasedPatients([]);
      } finally {
        setReleasedLoading(false);
      }
    }
  };

  const toggleOutstanding = async () => {
    if (outstandingOpen) {
      setOutstandingOpen(false);
      return;
    }
    setOutstandingOpen(true);
    if (outstandingPatients !== null) return;
    setOutstandingLoading(true);
    try {
      const res = await cashmemoService.getIpdOutstandingPatients();
      setOutstandingPatients(res.data.patients ?? []);
    } catch {
      setOutstandingPatients([]);
    } finally {
      setOutstandingLoading(false);
    }
  };

  const toggleDeleted = async () => {
    if (deletedOpen) {
      setDeletedOpen(false);
      return;
    }
    setDeletedOpen(true);
    if (deletedPatients !== null) return;
    setDeletedLoading(true);
    try {
      const res = await cashmemoService.getIpdDeletedPatients({
        startDate: timeRange?.start,
        endDate: timeRange?.end,
      });
      setDeletedPatients(res.data.patients ?? []);
    } catch {
      setDeletedPatients([]);
    } finally {
      setDeletedLoading(false);
    }
  };

  // Reset date-scoped drill-downs when the reporting range changes. Outstanding
  // patients is real-time (not date-bound) so it's left alone.
  useEffect(() => {
    setDiscountOpen(false);
    setDiscountPatients(null);
    setExpandedSection(null);
    setAdmittedPatients(null);
    setReleasedPatients(null);
    setDeletedOpen(false);
    setDeletedPatients(null);
  }, [timeRange?.start, timeRange?.end]);

  return (
    <div
      id="cashmemo-ipd-printable"
      className="bg-white border border-[#E3E0D6] rounded-lg shadow-[0_1px_2px_rgba(28,31,30,0.04)] overflow-hidden"
    >
      {/* Letterhead */}
      <div className="px-6 sm:px-8 pt-5 pb-4 text-center border-b border-[#E3E0D6] bg-[#F8F8FC]">
        <h3 className="font-['IBM_Plex_Sans'] text-lg font-bold text-[#1C1F1E] tracking-wide font-noto">
          {labName ?? "LabPilot Pro"}
        </h3>
        {labAddress && <p className="font-['IBM_Plex_Mono'] text-xs text-[#6F756F] mt-1 font-noto">{labAddress}</p>}
        {labPhone && <p className="font-['IBM_Plex_Mono'] text-xs text-[#6F756F] mt-1 font-noto">{labPhone}</p>}
      </div>

      {/* Header band */}
      <div className="px-6 sm:px-8 pt-6 pb-5 border-b border-[#E3E0D6] flex items-start justify-between gap-4">
        <div>
          <p className="font-['IBM_Plex_Mono'] text-xs uppercase mb-1.5 font-noto" style={{ color: INDIGO }}>
            অন্তঃবিভাগ (আইপিডি) মেমু
          </p>
          <h2 className="font-['IBM_Plex_Sans'] text-2xl font-semibold text-[#1C1F1E] font-noto">{headingLabel}</h2>
        </div>
        <RoundSeal dateLabel={recordStamp(timeRange?.start, timeRange?.end)} variant="indoor" />
      </div>

      <div className="px-6 sm:px-8 py-5">
        {/* ── Census + ALOS (real-time, not date-bound) ── */}
        <div className="grid grid-cols-2 divide-x divide-[#E3E0D6] border border-[#E3E0D6] rounded-sm mb-3">
          <LedgerCell icon={Activity} label="বর্তমানে ভর্তি" value={`${d.currentlyAdmitted ?? 0}`} accent={INDIGO} />
          <LedgerCell
            icon={CalendarDays}
            label="গড় অবস্থানকাল"
            value={`${d.avgStayDays ?? 0}`}
            sub="দিন (ছাড়প্রাপ্তদের ভিত্তিতে)"
            accent={TEAL}
          />
        </div>

        {/* ── ভর্তি / ছাড়প্রাপ্ত রোগী (clickable, expands inline list) ── */}
        <div className="border border-[#E3E0D6] rounded-sm mb-4 overflow-hidden">
          <div className="grid grid-cols-2 divide-x divide-[#E3E0D6]">
            <ClickableLedgerCell
              icon={UserPlus}
              label="এই সময়ে নতুন ভর্তি"
              value={`${d.admittedCount ?? 0}`}
              accent={INDIGO}
              open={expandedSection === "admitted"}
              onClick={() => toggleSection("admitted")}
            />
            <ClickableLedgerCell
              icon={UserMinus}
              label="এই সময়ে ছাড়প্রাপ্ত"
              value={`${d.releasedCount ?? 0}`}
              accent={TEAL}
              open={expandedSection === "released"}
              onClick={() => toggleSection("released")}
            />
          </div>
          {expandedSection === "admitted" && (
            <AdmissionPatientsInline loading={admittedLoading} patients={admittedPatients} type="admitted" />
          )}
          {expandedSection === "released" && (
            <AdmissionPatientsInline loading={releasedLoading} patients={releasedPatients} type="released" />
          )}
        </div>

        {/* ── বিল / আদায় ── */}
        <div className="grid grid-cols-2 divide-x divide-[#E3E0D6] border border-[#E3E0D6] rounded-sm mb-3">
          <LedgerCell icon={Wallet} label="মোট বিল" value={`৳${fmt(d.totalBilled)}`} accent={INDIGO} />
          <LedgerCell icon={PackageCheck} label="মোট আদায়" value={`৳${fmt(d.totalCollected)}`} accent={TEAL} />
        </div>

        {/* ── বাকি + আদায়ের হার ── */}
        <div className="border border-[#E3D5D2] bg-[#FBF2F0] rounded-sm mb-3 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-l-4" style={{ borderColor: RUST }}>
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" style={{ color: RUST }} />
              <p className="text-sm font-semibold text-[#1C1F1E] font-noto">বাকি</p>
            </div>
            <p className="font-['IBM_Plex_Mono'] text-lg font-bold tabular-nums" style={{ color: RUST }}>
              ৳{fmt(d.totalDue)}
            </p>
          </div>
          <div className="px-4 pb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="font-['IBM_Plex_Mono'] text-xs text-[#8A8F89] font-noto">আদায়ের হার</span>
              <span className="font-['IBM_Plex_Mono'] text-xs font-semibold text-[#1C1F1E]">{collectionRate}%</span>
            </div>
            <div className="h-1.5 w-full bg-white rounded-full overflow-hidden border border-[#E3D5D2]">
              <div
                className="h-full rounded-full"
                style={{ width: `${Math.min(100, collectionRate)}%`, backgroundColor: TEAL }}
              />
            </div>
          </div>
        </div>

        {/* ── খাত অনুযায়ী আয় ── */}
        <CategoryBreakdown breakdown={d.categoryBreakdown} />

        {/* ── মোট ডিসকাউন্ট (tap to expand patient list inline) ── */}
        <div className="mb-3">
          <button
            type="button"
            onClick={toggleDiscount}
            className={`w-full text-left border border-[#E3D9C6] overflow-hidden hover:brightness-[0.98] transition-[filter] no-print ${
              discountOpen ? "rounded-t-sm" : "rounded-sm"
            }`}
          >
            <div
              className="flex items-center justify-between px-4 py-3 border-l-4"
              style={{ backgroundColor: `${OCHRE}07`, borderColor: OCHRE }}
            >
              <div className="flex items-center gap-2">
                <TrendingDown className="w-3.5 h-3.5" style={{ color: OCHRE }} />
                <p className="text-sm font-semibold text-[#1C1F1E] font-noto">মোট ডিসকাউন্ট</p>
                <span
                  className="font-['IBM_Plex_Mono'] text-xs px-2 py-0.5 rounded-sm border font-noto"
                  style={{ color: OCHRE, borderColor: `${OCHRE}30`, backgroundColor: `${OCHRE}08` }}
                >
                  {d.discountCount ?? 0}টি
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <p className="font-['IBM_Plex_Mono'] text-lg font-bold tabular-nums" style={{ color: OCHRE }}>
                  − ৳{fmt(d.totalDiscounts)}
                </p>
                {discountOpen ? (
                  <ChevronDown className="w-4 h-4" style={{ color: OCHRE }} />
                ) : (
                  <ChevronRight className="w-4 h-4" style={{ color: OCHRE }} />
                )}
              </div>
            </div>
          </button>

          {discountOpen && <DiscountPatientsInline loading={discountLoading} patients={discountPatients} />}
        </div>

        {/* ── বকেয়া রোগী তালিকা (AR — real-time, tap to expand) ── */}
        <div className="mb-3">
          <button
            type="button"
            onClick={toggleOutstanding}
            className={`w-full text-left border border-[#E3D5D2] overflow-hidden hover:brightness-[0.98] transition-[filter] no-print ${
              outstandingOpen ? "rounded-t-sm" : "rounded-sm"
            }`}
          >
            <div className="flex items-center justify-between px-4 py-3 border-l-4" style={{ borderColor: RUST }}>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5" style={{ color: RUST }} />
                <p className="text-sm font-semibold text-[#1C1F1E] font-noto">বকেয়া রোগী তালিকা</p>
                <span
                  className="font-['IBM_Plex_Mono'] text-xs px-2 py-0.5 rounded-sm border font-noto"
                  style={{ color: RUST, borderColor: `${RUST}30`, backgroundColor: `${RUST}08` }}
                >
                  বর্তমান অবস্থা
                </span>
              </div>
              {outstandingOpen ? (
                <ChevronDown className="w-4 h-4" style={{ color: RUST }} />
              ) : (
                <ChevronRight className="w-4 h-4" style={{ color: RUST }} />
              )}
            </div>
          </button>

          {outstandingOpen && <OutstandingPatientsInline loading={outstandingLoading} patients={outstandingPatients} />}
        </div>

        {/* ── ডিলিট করা রোগী (soft-deleted admissions — tap to expand) ── */}
        <div className="mb-0">
          <button
            type="button"
            onClick={toggleDeleted}
            className={`w-full text-left border border-[#E3D9D5] overflow-hidden hover:brightness-[0.98] transition-[filter] no-print ${
              deletedOpen ? "rounded-t-sm" : "rounded-sm"
            }`}
          >
            <div
              className="flex items-center justify-between px-4 py-2.5 bg-[#FBF2F0] border-l-4"
              style={{ borderColor: "#B23A2E" }}
            >
              <div className="flex items-center gap-2">
                <Trash2 className="w-3.5 h-3.5 text-[#B23A2E] shrink-0" />
                <p className="text-sm font-medium text-[#1C1F1E] font-noto">ডিলিট করা রোগী</p>
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
                  ৳{fmt(d.totalAmountDeleted ?? 0)}
                </span>
                {deletedOpen ? (
                  <ChevronDown className="w-4 h-4 text-[#B23A2E]" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-[#B23A2E]" />
                )}
              </div>
            </div>
          </button>

          {deletedOpen && <DeletedPatientsInline loading={deletedLoading} patients={deletedPatients} />}
        </div>
      </div>
    </div>
  );
};

// ─── Summary receipt (Outdoor/Earnings + Indoor + Expense) ──────────────────

const SummaryReceipt = ({
  isHospital,
  outdoorSummary,
  indoorSummary,
  expenseSummary,
  timeRange,
  labName,
  labAddress,
  labPhone,
}) => {
  const o = outdoorSummary ?? {};
  const i = indoorSummary ?? {};
  const e = expenseSummary ?? {};
  const headingLabel = buildHeadingLabel(timeRange?.start, timeRange?.end);

  // Bill − discounts only (no commission deducted) — matches the
  // "সকল ডিসকাউন্ট বাদে আয়" figure shown on the Outdoor tab itself.
  const outdoorGrossCounterAmount = (o.initial ?? 0) - (o.labAdjustment ?? 0) - (o.referrerDiscount ?? 0);

  const outdoorRows = [
    { label: "মোট বিলড", value: `৳${fmt(o.initial)}`, bold: true },
    { label: "সকল ডিসকাউন্ট বাদে নিট টোটাল", value: `৳${fmt(outdoorGrossCounterAmount)}`, bold: true },
    { label: "আদায়", value: `৳${fmt(o.totalPaid)}`, tone: TEAL },
    { label: "বাকি", value: `৳${fmt(o.totalDue)}`, tone: RUST },
  ];

  // Order: bill → collected → due → discount. Due is bill vs. collection only
  // (discount is shown separately, informational).
  const indoorRows = [
    { label: "মোট বিলড", value: `৳${fmt(i.totalBilled)}`, bold: true },
    { label: "আদায়", value: `৳${fmt(i.totalCollected)}`, tone: TEAL },
    { label: "বাকি", value: `৳${fmt(i.totalDue)}`, tone: RUST },
    { label: "মোট ডিসকাউন্ট", value: `− ৳${fmt(i.totalDiscounts)}`, tone: OCHRE },
    { label: "আদায়ের হার", value: `${i.collectionRate ?? 0}%`, tone: INDIGO },
  ];

  const expenseRows = [{ label: "মোট খরচ", value: `৳${fmt(e.totalExpense)}`, bold: true, tone: VIOLET }];

  return (
    <div
      id="cashmemo-summary-printable"
      className="bg-white border border-[#E3E0D6] rounded-lg shadow-[0_1px_2px_rgba(28,31,30,0.04)] overflow-hidden"
    >
      {/* Letterhead */}
      <div className="px-6 sm:px-8 pt-5 pb-4 text-center border-b border-[#E3E0D6] bg-[#FAF9FC]">
        <h3 className="font-['IBM_Plex_Sans'] text-lg font-bold text-[#1C1F1E] tracking-wide font-noto">
          {labName ?? "LabPilot Pro"}
        </h3>
        {labAddress && <p className="font-['IBM_Plex_Mono'] text-xs text-[#6F756F] mt-1 font-noto">{labAddress}</p>}
        {labPhone && <p className="font-['IBM_Plex_Mono'] text-xs text-[#6F756F] mt-1 font-noto">{labPhone}</p>}
      </div>

      {/* Header band */}
      <div className="px-6 sm:px-8 pt-6 pb-5 border-b border-[#E3E0D6] flex items-start justify-between gap-4">
        <div>
          <p className="font-['IBM_Plex_Mono'] text-xs uppercase mb-1.5 font-noto" style={{ color: VIOLET }}>
            সারসংক্ষেপ
          </p>
          <h2 className="font-['IBM_Plex_Sans'] text-2xl font-semibold text-[#1C1F1E] font-noto">{headingLabel}</h2>
        </div>
        <RoundSeal dateLabel={recordStamp(timeRange?.start, timeRange?.end)} variant="summary" />
      </div>

      <div className="px-6 sm:px-8 py-5">
        <SummarySection title={isHospital ? "বহির্বিভাগ" : "আয়"} icon={Wallet} accent={TEAL} rows={outdoorRows} />

        {isHospital && <SummarySection title="অন্তঃবিভাগ (আইপিডি)" icon={Users} accent={INDIGO} rows={indoorRows} />}

        <SummarySection title="খরচ" icon={ReceiptIcon} accent={VIOLET} rows={expenseRows} />
      </div>
    </div>
  );
};

// ─── Tab button ───────────────────────────────────────────────────────────────

const TabBtn = ({ active, onClick, children, accent = "#0F6E5C" }) => (
  <button
    onClick={onClick}
    className="relative px-5 py-2.5 font-['IBM_Plex_Mono'] text-xs uppercase font-semibold transition-colors font-noto"
    style={{
      color: active ? accent : "#8A8F89",
      borderBottom: active ? `2px solid ${accent}` : "2px solid transparent",
    }}
  >
    {children}
  </button>
);

// ─── Main component ───────────────────────────────────────────────────────────

const CashMemo = () => {
  const lab = useAuthStore((s) => s.lab);
  const user = useAuthStore((s) => s.user);
  const isHospital = user?.type === "hospital";

  const [activeTab, setActiveTab] = useState("outdoor");

  // Outdoor state
  const [outdoorSummary, setOutdoorSummary] = useState(null);
  const [outdoorLoading, setOutdoorLoading] = useState(true);

  // Indoor state
  const [indoorSummary, setIndoorSummary] = useState(null);
  const [indoorLoading, setIndoorLoading] = useState(!isHospital ? false : true);

  // Expense state (used by the Summary tab, for both lab types)
  const [expenseSummary, setExpenseSummary] = useState(null);
  const [expenseLoading, setExpenseLoading] = useState(true);

  const [popup, setPopup] = useState(null);
  const [timeRange, setTimeRange] = useState(null);

  useEffect(() => {
    const range = todayRange();
    setTimeRange(range);
    fetchOutdoor(range);
    fetchExpense(range);
    if (isHospital) fetchIndoor(range);
  }, []);

  const fetchOutdoor = async (range) => {
    try {
      setOutdoorLoading(true);
      const res = await cashmemoService.getSummary({ startDate: range.start, endDate: range.end });
      setOutdoorSummary(res.data);
    } catch (err) {
      setPopup({ type: "error", message: getErrorMessage(err, "বহির্বিভাগের ডেটা লোড করা সম্ভব হয়নি।") });
    } finally {
      setOutdoorLoading(false);
    }
  };

  const fetchIndoor = async (range) => {
    try {
      setIndoorLoading(true);
      const res = await cashmemoService.getIpdSummary({ startDate: range.start, endDate: range.end });
      setIndoorSummary(res.data);
    } catch (err) {
      setPopup({ type: "error", message: getErrorMessage(err, "অন্তঃবিভাগের ডেটা লোড করা সম্ভব হয়নি।") });
    } finally {
      setIndoorLoading(false);
    }
  };

  const fetchExpense = async (range) => {
    try {
      setExpenseLoading(true);
      const res = await cashmemoService.getExpenseSummary({ startDate: range.start, endDate: range.end });
      setExpenseSummary(res.data);
    } catch (err) {
      setPopup({ type: "error", message: getErrorMessage(err, "খরচের ডেটা লোড করা সম্ভব হয়নি।") });
    } finally {
      setExpenseLoading(false);
    }
  };

  const handleFetchData = (start, end) => {
    const range = { start, end };
    setTimeRange(range);
    fetchOutdoor(range);
    fetchExpense(range);
    if (isHospital) fetchIndoor(range);
  };

  const labName = lab?.name;
  const labAddress = lab?.contact?.address;
  const labPhone = lab?.contact?.primary;

  const tabs = isHospital
    ? [
        { key: "outdoor", label: "বহির্বিভাগ", accent: TEAL },
        { key: "indoor", label: "অন্তঃবিভাগ (আইপিডি)", accent: INDIGO },
        { key: "summary", label: "সারসংক্ষেপ", accent: VIOLET },
      ]
    : [
        { key: "outdoor", label: "বহির্বিভাগ", accent: TEAL },
        { key: "summary", label: "সারসংক্ষেপ", accent: VIOLET },
      ];

  const currentLoading =
    activeTab === "outdoor"
      ? outdoorLoading
      : activeTab === "indoor"
        ? indoorLoading
        : outdoorLoading || expenseLoading || (isHospital && indoorLoading);

  const printableId =
    activeTab === "outdoor"
      ? "cashmemo-printable"
      : activeTab === "indoor"
        ? "cashmemo-ipd-printable"
        : "cashmemo-summary-printable";

  return (
    <section className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 px-4 py-6 font-noto">
      {popup && <Popup type={popup.type} message={popup.message} onClose={() => setPopup(null)} />}

      <style>{`
        @media print {
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body * { visibility: hidden; }
          #${printableId}, #${printableId} * { visibility: visible; }
          #${printableId} {
            position: fixed; top: 0; left: 0; width: 100%; padding: 32px; box-shadow: none;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="max-w-2xl mx-auto">
        {/* Page header */}
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
              disabled={currentLoading}
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

        {/* TimeFrame picker */}
        <div className="mb-4 no-print">
          <TimeFrame onFetchData={handleFetchData} />
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#E3E0D6] mb-5 no-print bg-white rounded-t-lg shadow-[0_1px_2px_rgba(28,31,30,0.04)]">
          {tabs.map((t) => (
            <TabBtn key={t.key} active={activeTab === t.key} onClick={() => setActiveTab(t.key)} accent={t.accent}>
              {t.label}
            </TabBtn>
          ))}
        </div>

        {/* Receipt */}
        {activeTab === "outdoor" &&
          (outdoorLoading ? (
            <SkeletonReceipt />
          ) : (
            <OutdoorReceipt
              summary={outdoorSummary}
              timeRange={timeRange}
              labName={labName}
              labAddress={labAddress}
              labPhone={labPhone}
            />
          ))}

        {activeTab === "indoor" &&
          (indoorLoading ? (
            <SkeletonReceipt />
          ) : (
            <IndoorReceipt
              summary={indoorSummary}
              timeRange={timeRange}
              labName={labName}
              labAddress={labAddress}
              labPhone={labPhone}
            />
          ))}

        {activeTab === "summary" &&
          (currentLoading ? (
            <SkeletonReceipt />
          ) : (
            <SummaryReceipt
              isHospital={isHospital}
              outdoorSummary={outdoorSummary}
              indoorSummary={indoorSummary}
              expenseSummary={expenseSummary}
              timeRange={timeRange}
              labName={labName}
              labAddress={labAddress}
              labPhone={labPhone}
            />
          ))}

        <p className="font-['IBM_Plex_Mono'] text-center text-xs text-[#A8ACA3] mt-4 pb-6 no-print font-noto">
          {activeTab === "outdoor"
            ? "নিট আয় = মোট পরিমাণ − ল্যাব সমন্বয় − রেফারার ডিস্কাউন্ট − কমিশন"
            : activeTab === "indoor"
              ? "মোট বিল = এই সময়কালে যোগ করা আইটেম | বকেয়া তালিকা = বর্তমান মুহূর্তের হিসাব | ডিলিট = ডিলিটের সময় অনুযায়ী"
              : "সারসংক্ষেপ = সকল বিভাগের বিলিং, আদায় ও খরচের একত্রিত চিত্র"}
        </p>
      </div>
    </section>
  );
};

export default CashMemo;
