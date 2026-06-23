/**
 * useCallback / useMemo are intentionally absent throughout this file.
 * babel-plugin-react-compiler handles all memoization automatically.
 */
import { useEffect, useState } from "react";
import {
  FileText,
  Activity,
  CheckCircle2,
  ArrowLeft,
  Plus,
  Wallet,
  AlertCircle,
  PackageCheck,
  FlaskConical,
  Banknote,
  Pencil,
  User,
  Phone,
  Calendar,
  ChevronDown,
  X,
  Eye,
  UserCircle,
  Receipt,
  TestTube2,
  DollarSign,
  UserCheck,
  Clock,
  Printer,
} from "lucide-react";
import { Link } from "react-router-dom";
import Popup from "../../../components/popup";
import Modal from "../../../components/modal";
import LoadingScreen from "../../../components/loadingPage";
import invoiceService from "../../../api/invoice";
import TimeFrame from "../../../components/timeFrame";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n) =>
  new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT", minimumFractionDigits: 0 }).format(n || 0);

const fmtNum = (n) => (typeof n === "number" ? n.toLocaleString("en-IN") : "0");

const formatDateTime = (ts) => {
  const d = new Date(ts);
  const day = d.getDate();
  const suffix =
    day % 10 === 1 && day % 100 !== 11
      ? "st"
      : day % 10 === 2 && day % 100 !== 12
        ? "nd"
        : day % 10 === 3 && day % 100 !== 13
          ? "rd"
          : "th";
  const h = d.getHours();
  return {
    date: `${day}${suffix} ${d.toLocaleString("default", { month: "short" })}, ${d.getFullYear()}`,
    time: `${h % 12 === 0 ? 12 : h % 12}:${String(d.getMinutes()).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`,
  };
};

const getDue = (inv) => Math.max(0, (inv.amount?.final ?? 0) - (inv.amount?.paid ?? 0));
const isFullyPaid = (inv) => getDue(inv) === 0;
const isDelivered = (inv) => inv.delivery?.status === true;
const getTests = (inv) => inv.tests ?? [];
const hasReportSchemas = (inv) => getTests(inv).some((t) => t.schemaId);

const SEAL_BLUE = "#1E4FA0";
const SEAL_RED = "#C0312B";

// ─── Round Seal ───────────────────────────────────────────────────────────────

const RoundSeal = ({ dateLabel }) => (
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
          style={{ color: SEAL_RED, fontSize: "13px", letterSpacing: "1.5px" }}
        >
          ইনভয়েস
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

// ─── Invoice Row (Ledger style) ───────────────────────────────────────────────

const InvoiceRow = ({ invoice, index, onDelivered, onCollected, onPatientUpdated, onLoadingChange, onError }) => {
  const { date, time } = formatDateTime(invoice.createdAt);
  const [confirming, setConfirming] = useState(false);
  const [collectingDue, setCollectingDue] = useState(false);
  const [editingPatient, setEditingPatient] = useState(false);
  const [viewingDetails, setViewingDetails] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const due = getDue(invoice);
  const fullyPaid = isFullyPaid(invoice);
  const delivered = isDelivered(invoice);
  const hasReports = hasReportSchemas(invoice);
  const patient = invoice.patient;

  const handleConfirmDelivery = async () => {
    setConfirming(false);
    try {
      onLoadingChange("Marking as delivered...");
      await invoiceService.markDelivered(invoice.invoiceId);
      onDelivered(invoice.invoiceId);
    } catch {
      onError("Failed to mark as delivered. Please try again.");
    } finally {
      onLoadingChange(null);
    }
  };

  const handleCollectDue = async () => {
    setCollectingDue(false);
    try {
      onLoadingChange("Collecting due amount...");
      await invoiceService.collectDue(invoice.invoiceId);
      onCollected(invoice.invoiceId);
    } catch {
      onError("Failed to collect due amount. Please try again.");
    } finally {
      onLoadingChange(null);
    }
  };

  return (
    <>
      {confirming && (
        <Popup
          type="warning"
          message={`Mark invoice #${invoice.invoiceId} for ${patient.name} as delivered? This action cannot be undone.`}
          confirmText="Mark Delivered"
          cancelText="Cancel"
          onConfirm={handleConfirmDelivery}
          onClose={() => setConfirming(false)}
        />
      )}
      {collectingDue && (
        <Popup
          type="warning"
          message={`Collect the full due amount of ৳${due.toLocaleString()} from ${patient.name} (Invoice #${invoice.invoiceId})? This will mark the invoice as fully paid.`}
          confirmText={`Collect ৳${due.toLocaleString()}`}
          cancelText="Cancel"
          onConfirm={handleCollectDue}
          onClose={() => setCollectingDue(false)}
        />
      )}

      <EditPatientModal
        invoice={invoice}
        isOpen={editingPatient}
        onClose={() => setEditingPatient(false)}
        onSaved={onPatientUpdated}
        onLoadingChange={onLoadingChange}
        onError={onError}
      />
      <InvoiceDetailsModal
        invoiceId={invoice.invoiceId}
        isOpen={viewingDetails}
        onClose={() => setViewingDetails(false)}
        invoice={invoice}
        onPatientUpdated={onPatientUpdated}
        onLoadingChange={onLoadingChange}
        onError={onError}
      />

      {/* Ledger row */}
      <div>
        {/* Main row */}
        <button onClick={() => setExpanded((v) => !v)} className="w-full text-left">
          <div className="flex items-baseline gap-3 py-2 group hover:bg-[#F0EFE9] px-1 rounded-sm transition-colors">
            <span className="font-['IBM_Plex_Mono'] text-xs text-[#A8ACA3] tabular-nums w-5 shrink-0">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div className="flex-1 min-w-0 flex items-baseline gap-2">
              <span className="text-sm text-[#1C1F1E] font-medium truncate">{patient.name}</span>
              <span className="font-['IBM_Plex_Mono'] text-[10px] text-[#A8ACA3] shrink-0 hidden sm:inline">
                #{invoice.invoiceId}
              </span>
            </div>
            <span className="flex-1 border-b border-dotted border-[#D8D5CB] translate-y-[-3px] hidden sm:block" />
            <div className="flex items-center gap-2 shrink-0">
              {/* Payment status */}
              {fullyPaid ? (
                <span className="font-['IBM_Plex_Mono'] text-xs text-[#0F6E5C] font-semibold">পরিশোধিত</span>
              ) : (
                <span className="font-['IBM_Plex_Mono'] text-xs text-[#C0312B] font-semibold tabular-nums">
                  বাকি ৳{due.toLocaleString()}
                </span>
              )}
              {/* Delivery dot */}
              {delivered && (
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: "#1E4FA0" }}
                  title="Delivered"
                />
              )}
              {/* Amount */}
              <span className="font-['IBM_Plex_Mono'] text-sm text-[#1C1F1E] tabular-nums shrink-0">
                {fmt(invoice.amount?.final ?? 0)}
              </span>
              {/* Expand chevron */}
              <ChevronDown
                className={`w-3.5 h-3.5 text-[#A8ACA3] transition-transform shrink-0 ${expanded ? "rotate-180" : ""}`}
              />
            </div>
          </div>
        </button>

        {/* Sub-row: date + actions, visible on expand */}
        {expanded && (
          <div className="pl-8 pr-1 py-2 border-t border-[#EDEBE3] bg-[#FAF9F5] rounded-b-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="font-['IBM_Plex_Mono'] text-[10px] text-[#A8ACA3] space-y-0.5">
                <p>
                  {date} · {time}
                  {invoice.createdBy?.name && ` · ${invoice.createdBy.name}`}
                </p>
                <p className="sm:hidden text-[10px]">#{invoice.invoiceId}</p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <ManifestChip onClick={() => setViewingDetails(true)} icon={Eye} label="বিস্তারিত" />
                <ManifestLinkChip to={`/outdoor/invoice/print/${invoice.invoiceId}`} icon={FileText} label="ইনভয়েস" />
                {hasReports && (
                  <ManifestLinkChip
                    to="/report"
                    state={{ invoiceId: invoice.invoiceId }}
                    icon={FlaskConical}
                    label="রিপোর্ট"
                    accent
                  />
                )}
                <ManifestChip onClick={() => setEditingPatient(true)} icon={Pencil} label="সম্পাদনা" />
                {!fullyPaid && (
                  <ManifestChip onClick={() => setCollectingDue(true)} icon={Banknote} label="আদায়" green />
                )}
                {!delivered && (
                  <ManifestChip onClick={() => setConfirming(true)} icon={PackageCheck} label="ডেলিভারি" blue />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

// ─── Manifest Chips ───────────────────────────────────────────────────────────

const ManifestChip = ({ onClick, icon: Icon, label, green, blue, accent }) => {
  const base =
    "inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-['IBM_Plex_Mono'] uppercase tracking-wide border transition-colors rounded-[2px]";
  const color = green
    ? "border-[#0F6E5C]/30 text-[#0F6E5C] hover:bg-[#0F6E5C]/5"
    : blue
      ? "border-[#1E4FA0]/30 text-[#1E4FA0] hover:bg-[#1E4FA0]/5"
      : accent
        ? "border-[#C0312B]/30 text-[#C0312B] hover:bg-[#C0312B]/5"
        : "border-[#D8D5CB] text-[#6F756F] hover:bg-[#EDEBE3]";
  return (
    <button onClick={onClick} className={`${base} ${color}`}>
      <Icon className="w-3 h-3" />
      {label}
    </button>
  );
};

const ManifestLinkChip = ({ to, state, icon: Icon, label, accent }) => {
  const base =
    "inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-['IBM_Plex_Mono'] uppercase tracking-wide border transition-colors rounded-[2px]";
  const color = accent
    ? "border-[#C0312B]/30 text-[#C0312B] hover:bg-[#C0312B]/5"
    : "border-[#D8D5CB] text-[#6F756F] hover:bg-[#EDEBE3]";
  return (
    <Link to={to} state={state} className={`${base} ${color}`}>
      <Icon className="w-3 h-3" />
      {label}
    </Link>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const InvoiceList = () => {
  const [invoices, setInvoices] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [loadingMessage, setLoadingMessage] = useState(null);
  const [popup, setPopup] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [timeRange, setTimeRange] = useState(null);

  const loadInvoices = async (cursor = null, replace = true, range = timeRange) => {
    try {
      replace ? setInitialLoading(true) : (setLoadingMore(true), setLoadingMessage("Loading more invoices..."));
      const { data } = await invoiceService.getInvoices({
        cursor,
        limit: 20,
        ...(range && { startDate: range.start, endDate: range.end }),
      });
      setInvoices((prev) => (replace ? data.invoices : [...prev, ...data.invoices]));
      setNextCursor(data.nextCursor);
      setHasMore(data.hasMore);
    } catch {
      setPopup({ type: "error", message: "Could not load invoices" });
    } finally {
      setInitialLoading(false);
      setLoadingMore(false);
      setLoadingMessage(null);
    }
  };

  useEffect(() => {
    const now = new Date();
    const initial = { start: new Date(now).setHours(0, 0, 0, 0), end: new Date(now).setHours(23, 59, 59, 999) };
    setTimeRange(initial);
    loadInvoices(null, true, initial);
  }, []);

  const handleFetchData = (start, end) => {
    const range = { start, end };
    setTimeRange(range);
    setStatusFilter("all");
    loadInvoices(null, true, range);
  };

  const total = invoices.length;
  const totalPaid = invoices.reduce((s, inv) => s + (inv.amount?.paid ?? 0), 0);
  const totalDue = invoices.reduce((s, inv) => s + getDue(inv), 0);
  const totalBilled = invoices.reduce((s, inv) => s + (inv.amount?.final ?? 0), 0);
  const pendingCount = invoices.filter((inv) => !isFullyPaid(inv)).length;

  const filteredInvoices =
    statusFilter === "pending"
      ? invoices.filter((inv) => !isFullyPaid(inv))
      : statusFilter === "paid"
        ? invoices.filter((inv) => isFullyPaid(inv))
        : invoices;

  // date label for seal
  const sealLabel = timeRange
    ? new Date(timeRange.end)
        .toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })
        .toUpperCase()
    : "";

  // heading label
  const headingLabel = (() => {
    if (!timeRange) return "";
    const s = new Date(timeRange.start);
    const e = new Date(timeRange.end);
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
    if (s.toDateString() === e.toDateString()) return `${day(s)} ${monthYear(s)}`;
    const sameMonth = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear();
    if (sameMonth) return `${s.getDate()} – ${e.getDate()} ${monthYear(s)}`;
    return `${s.toLocaleString("en-US", { month: "short", day: "numeric" })} – ${e.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
  })();

  // Optimistic updates
  const handleDelivered = (id) =>
    setInvoices((prev) =>
      prev.map((inv) => (inv.invoiceId === id ? { ...inv, delivery: { ...inv.delivery, status: true } } : inv)),
    );

  const handleCollected = (id) =>
    setInvoices((prev) =>
      prev.map((inv) => (inv.invoiceId === id ? { ...inv, amount: { ...inv.amount, paid: inv.amount.final } } : inv)),
    );

  const handlePatientUpdated = (id, fields) =>
    setInvoices((prev) => prev.map((inv) => (inv.invoiceId === id ? { ...inv, ...fields } : inv)));

  return (
    <section className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 px-4 py-6 font-noto">
      <style>{`
        @media print {
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body * { visibility: hidden; }
          #invoicelist-printable, #invoicelist-printable * { visibility: visible; }
          #invoicelist-printable { position: fixed; top: 0; left: 0; width: 100%; padding: 32px; box-shadow: none; }
          .no-print { display: none !important; }
        }
      `}</style>

      {loadingMessage && <LoadingScreen message={loadingMessage} />}
      {popup && <Popup type={popup.type} message={popup.message} onClose={() => setPopup(null)} />}

      <div className="max-w-2xl mx-auto">
        {/* Page header */}
        <div className="flex items-center justify-between mb-5 no-print">
          <div>
            <p className="font-['IBM_Plex_Mono'] text-xs uppercase text-[#0F6E5C] mb-1">ল্যাব অপারেশন</p>
            <h1 className="font-['IBM_Plex_Sans'] text-2xl sm:text-3xl font-semibold text-[#1C1F1E]">ইনভয়েস তালিকা</h1>
            <p className="text-base text-[#767D78] mt-1">নির্ধারিত সময়সীমায় তৈরি সকল ইনভয়েস।</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              disabled={initialLoading}
              className="px-3 py-2 rounded-sm border border-[#1C1F1E]/15 text-[#1C1F1E] hover:bg-[#1C1F1E] hover:text-white transition-colors flex items-center gap-1.5 font-['IBM_Plex_Mono'] text-xs uppercase disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Printer className="w-3.5 h-3.5" /> প্রিন্ট
            </button>
            <Link
              to="/lab-management"
              className="px-3 py-2 rounded-sm border border-[#1C1F1E]/15 text-[#1C1F1E] hover:bg-[#1C1F1E] hover:text-white transition-colors flex items-center gap-1.5 font-['IBM_Plex_Mono'] text-xs uppercase"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> ফিরে যান
            </Link>
            <Link
              to="/outdoor/invoice/new"
              className="px-3 py-2 rounded-sm border border-[#0F6E5C] text-[#0F6E5C] hover:bg-[#0F6E5C] hover:text-white transition-colors flex items-center gap-1.5 font-['IBM_Plex_Mono'] text-xs uppercase font-semibold"
            >
              <Plus className="w-3.5 h-3.5" /> নতুন
            </Link>
          </div>
        </div>

        {/* TimeFrame */}
        <div className="mb-5 no-print">
          <TimeFrame onFetchData={handleFetchData} />
        </div>

        {/* Manifest card */}
        {initialLoading ? (
          <SkeletonManifest />
        ) : (
          <div
            id="invoicelist-printable"
            className="bg-white border border-[#E3E0D6] rounded-lg shadow-[0_1px_2px_rgba(28,31,30,0.04)] overflow-hidden"
          >
            {/* Letterhead */}
            <div className="px-6 sm:px-8 pt-5 pb-4 text-center border-b border-[#E3E0D6] bg-[#FAF9F5]">
              <h3 className="font-['IBM_Plex_Sans'] text-lg font-bold text-[#1C1F1E] tracking-wide">
                Azizul Haque Diagnostic Center
              </h3>
              <p className="font-['IBM_Plex_Mono'] text-xs text-[#6F756F] mt-1">Hospital Road, Bhaluka, Mymensingh</p>
            </div>

            {/* Header band */}
            <div className="px-6 sm:px-8 pt-6 pb-5 border-b border-[#E3E0D6] flex items-start justify-between gap-4">
              <div>
                <p className="font-['IBM_Plex_Mono'] text-xs uppercase text-[#0F6E5C] mb-1.5">ইনভয়েস লেজার</p>
                <h2 className="font-['IBM_Plex_Sans'] text-2xl font-semibold text-[#1C1F1E]">{headingLabel}</h2>
                <div className="font-['IBM_Plex_Mono'] text-sm text-[#8A8F89] mt-2 space-y-0.5">
                  <p>মোট ইনভয়েস — {fmtNum(total)}টি</p>
                  <p>মোট বিলকৃত — {fmt(totalBilled)}</p>
                  <p>
                    <span className="text-[#0F6E5C]">আদায় — {fmt(totalPaid)}</span>
                    {totalDue > 0 && <span className="text-[#C0312B] ml-3">বাকি — {fmt(totalDue)}</span>}
                  </p>
                </div>
              </div>
              <RoundSeal dateLabel={sealLabel} />
            </div>

            {/* Filter bar */}
            <div className="px-6 sm:px-8 py-3 border-b border-[#E3E0D6] bg-[#FAF9F5] flex items-center gap-3 no-print flex-wrap">
              <p className="font-['IBM_Plex_Mono'] text-[10px] uppercase text-[#A8ACA3] shrink-0">ফিল্টার</p>
              <div className="flex items-center gap-1">
                {[
                  { key: "all", label: "সব" },
                  { key: "pending", label: "বাকি" },
                  { key: "paid", label: "পরিশোধিত" },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setStatusFilter(key)}
                    className={`px-3 py-1 font-['IBM_Plex_Mono'] text-xs uppercase transition-colors rounded-[2px] border ${
                      statusFilter === key
                        ? "border-[#1C1F1E]/30 bg-[#1C1F1E] text-white"
                        : "border-transparent text-[#6F756F] hover:border-[#D8D5CB] hover:bg-[#EDEBE3]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {statusFilter !== "all" && hasMore && (
                <p className="font-['IBM_Plex_Mono'] text-[10px] text-[#A8ACA3] ml-auto">
                  * শুধু লোড করা ইনভয়েসে ফিল্টার প্রযোজ্য
                </p>
              )}
            </div>

            {/* Column header */}
            <div className="px-6 sm:px-8 pt-4 pb-1 flex items-center gap-3">
              <span className="font-['IBM_Plex_Mono'] text-[10px] uppercase text-[#A8ACA3] w-5 shrink-0">#</span>
              <span className="font-['IBM_Plex_Mono'] text-[10px] uppercase text-[#A8ACA3] flex-1">রোগীর নাম</span>
              <span className="font-['IBM_Plex_Mono'] text-[10px] uppercase text-[#A8ACA3] shrink-0">পরিমাণ</span>
            </div>

            {/* Invoice rows */}
            <div className="px-6 sm:px-8 pb-4">
              {filteredInvoices.length === 0 ? (
                <div className="flex items-center gap-2 py-8 text-[#A8ACA3]">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <p className="font-['IBM_Plex_Mono'] text-xs">
                    {statusFilter !== "all"
                      ? "এই ফিল্টারে কোনো ইনভয়েস নেই"
                      : "নির্ধারিত সময়সীমায় কোনো ইনভয়েস তৈরি হয়নি"}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-[#EDEBE3]">
                  {filteredInvoices.map((invoice, index) => (
                    <InvoiceRow
                      key={invoice._id}
                      invoice={invoice}
                      index={index}
                      onDelivered={handleDelivered}
                      onCollected={handleCollected}
                      onPatientUpdated={handlePatientUpdated}
                      onLoadingChange={(msg) => setLoadingMessage(msg)}
                      onError={(msg) => setPopup({ type: "error", message: msg })}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Load more */}
            {hasMore && statusFilter === "all" && (
              <div className="px-6 sm:px-8 pb-5 border-t border-[#E3E0D6] pt-4 no-print">
                <button
                  onClick={() => loadInvoices(nextCursor, false)}
                  disabled={loadingMore}
                  className="w-full flex items-center justify-center gap-2 py-2.5 font-['IBM_Plex_Mono'] text-xs uppercase text-[#6F756F] hover:text-[#1C1F1E] border border-dashed border-[#D8D5CB] hover:border-[#1C1F1E]/30 rounded-[2px] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                  আরো লোড করুন (+20)
                </button>
              </div>
            )}

            {/* Footer note */}
            <div className="px-6 sm:px-8 py-3 border-t border-[#E3E0D6] bg-[#FAF9F5]">
              <p className="font-['IBM_Plex_Mono'] text-[10px] text-[#A8ACA3]">
                * শুধুমাত্র সক্রিয় (ডিলিট না হওয়া) ইনভয়েসের হিসাব অন্তর্ভুক্ত
              </p>
            </div>
          </div>
        )}

        <p className="font-['IBM_Plex_Mono'] text-center text-xs text-[#A8ACA3] mt-4 pb-6 no-print">
          LabPilotPro · ইনভয়েস ম্যানেজমেন্ট সিস্টেম
        </p>
      </div>
    </section>
  );
};

// ─── Invoice Details Modal ────────────────────────────────────────────────────

export const InvoiceDetailsModal = ({
  invoiceId,
  isOpen,
  onClose,
  invoice: invoiceRow,
  onPatientUpdated,
  onLoadingChange,
  onError,
}) => {
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchInvoice = () => {
    setError(null);
    setLoading(true);
    invoiceService
      .getInvoiceByInvoiceId(invoiceId)
      .then((res) => setInvoice(res.data))
      .catch(() => setError("Failed to load invoice details."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!isOpen || !invoiceId) return;
    setInvoice(null);
    fetchInvoice();
  }, [isOpen, invoiceId]);

  const rowHasReports = hasReportSchemas(invoiceRow ?? {});
  const due = invoice ? getDue(invoice) : 0;
  const fullyPaid = invoice ? due === 0 : false;
  const delivered = invoice ? isDelivered(invoice) : false;
  const { date, time } = invoice ? formatDateTime(invoice.createdAt) : { date: "", time: "" };

  const patient = invoice?.patient ?? null;
  const referrer = invoice?.referrer ?? null;
  const amount = invoice?.amount ?? null;
  const createdBy = invoice?.createdBy ?? null;
  const deliveredBy = invoice?.delivery?.by ?? null;

  const hasReferrer = referrer && (referrer.name || referrer.id);
  const hasDiscount = (amount?.referrerDiscount ?? 0) > 0;
  const hasCommission = (amount?.referrerCommission ?? 0) > 0;
  const showSubtotal = hasDiscount || (amount?.labAdjustment ?? 0) > 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[#E3E0D6] bg-[#FAF9F5]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[3px] border border-[#D8D5CB] flex items-center justify-center shrink-0 bg-white">
            <Receipt className="w-4 h-4 text-[#1E4FA0]" />
          </div>
          <div>
            <h2 className="font-['IBM_Plex_Sans'] text-sm font-bold text-[#1C1F1E] leading-tight">Invoice Details</h2>
            <p className="font-['IBM_Plex_Mono'] text-[10px] text-[#A8ACA3] mt-0.5">#{invoiceId}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-sm text-[#A8ACA3] hover:text-[#1C1F1E] hover:bg-[#EDEBE3] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="px-5 py-5 space-y-4">
        {loading && <DetailsSkeleton />}

        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
            <AlertCircle className="w-5 h-5 text-[#C0312B]" />
            <p className="font-['IBM_Plex_Mono'] text-xs text-[#6F756F]">{error}</p>
            <button
              onClick={fetchInvoice}
              className="font-['IBM_Plex_Mono'] text-xs text-[#1E4FA0] hover:underline uppercase"
            >
              আবার চেষ্টা করুন
            </button>
          </div>
        )}

        {invoice && !loading && (
          <>
            {/* Patient */}
            <ManifestBlock icon={UserCircle} label="রোগীর তথ্য">
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <ManifestField label="Name" value={patient.name} />
                <ManifestField label="Gender" value={<span className="capitalize">{patient.gender}</span>} />
                <ManifestField label="Age" value={`${patient.age} yrs`} />
                <ManifestField label="Contact" value={patient.contactNumber} />
                <div className="col-span-2">
                  <ManifestField label="Date & Time" value={`${date} · ${time}`} />
                </div>
              </div>
            </ManifestBlock>

            {/* Created By */}
            {createdBy?.name && (
              <ManifestBlock icon={UserCheck} label="তৈরিকারী">
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <ManifestField label="Staff" value={createdBy.name} />
                  <ManifestField label="Created At" value={`${date} · ${time}`} />
                  {delivered && deliveredBy?.name && (
                    <div className="col-span-2">
                      <ManifestField label="Delivered By" value={deliveredBy.name} valueClass="text-[#1E4FA0]" />
                    </div>
                  )}
                </div>
              </ManifestBlock>
            )}

            {/* Referrer */}
            {hasReferrer && (
              <ManifestBlock icon={User} label="রেফারার">
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <ManifestField label="Name" value={referrer.name || "—"} />
                  {referrer.type && (
                    <div>
                      <p className="font-['IBM_Plex_Mono'] text-[10px] uppercase text-[#A8ACA3] mb-0.5">Type</p>
                      <span
                        className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded-[2px] capitalize font-['IBM_Plex_Mono'] ${
                          referrer.type === "doctor"
                            ? "bg-blue-50 text-blue-700"
                            : referrer.type === "agent"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-teal-50 text-teal-700"
                        }`}
                      >
                        {referrer.type}
                      </span>
                    </div>
                  )}
                  {hasDiscount && (
                    <ManifestField
                      label="Discount"
                      value={`- ${fmt(amount.referrerDiscount)}`}
                      valueClass="text-[#C0312B]"
                    />
                  )}
                  {hasCommission && (
                    <ManifestField
                      label="Commission"
                      value={fmt(amount.referrerCommission)}
                      valueClass="text-[#1E4FA0]"
                    />
                  )}
                </div>
              </ManifestBlock>
            )}

            {/* Tests */}
            <ManifestBlock icon={TestTube2} label="টেস্ট সমূহ" badge={invoice.tests?.length ?? 0}>
              <div className="space-y-1">
                {(invoice.tests ?? []).map((t, i) => (
                  <div key={t.testId || i} className="flex items-baseline gap-2">
                    <span className="font-['IBM_Plex_Mono'] text-[10px] text-[#A8ACA3] w-4 shrink-0">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-xs text-[#1C1F1E] flex-1 truncate">{t.name}</span>
                    <span className="flex-1 border-b border-dotted border-[#D8D5CB] translate-y-[-3px]" />
                    <span className="font-['IBM_Plex_Mono'] text-xs text-[#1E4FA0] tabular-nums shrink-0">
                      {fmt(t.price)}
                    </span>
                  </div>
                ))}
              </div>
            </ManifestBlock>

            {/* Collection History */}
            {invoice.collections?.length > 0 && (
              <ManifestBlock icon={Clock} label="আদায় ইতিহাস" badge={invoice.collections.length}>
                <div className="space-y-1.5">
                  {invoice.collections.map((c, i) => {
                    const { date: cDate, time: cTime } = formatDateTime(c.at);
                    return (
                      <div key={i} className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-[#1C1F1E] font-medium">{c.by?.name ?? "—"}</p>
                          <p className="font-['IBM_Plex_Mono'] text-[10px] text-[#A8ACA3]">{`${cDate} · ${cTime}`}</p>
                        </div>
                        <span className="font-['IBM_Plex_Mono'] text-sm text-[#0F6E5C] tabular-nums font-semibold">
                          {fmt(c.amount)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </ManifestBlock>
            )}

            {/* Payment */}
            <ManifestBlock icon={DollarSign} label="পেমেন্ট বিবরণ">
              <div className="space-y-1.5 font-['IBM_Plex_Mono'] text-xs">
                {showSubtotal && <LedgerPayRow label="Subtotal" value={fmt(amount.initial)} />}
                {hasDiscount && (
                  <LedgerPayRow
                    label="Referrer Discount"
                    value={`- ${fmt(amount.referrerDiscount)}`}
                    valueClass="text-[#C0312B]"
                  />
                )}
                {(amount?.labAdjustment ?? 0) > 0 && (
                  <LedgerPayRow
                    label="Lab Adjustment"
                    value={`- ${fmt(amount.labAdjustment)}`}
                    valueClass="text-[#C0312B]"
                  />
                )}
                <div className="flex justify-between pt-2 border-t border-[#E3E0D6] font-semibold text-[#1C1F1E]">
                  <span>মোট</span>
                  <span className="text-[#1E4FA0]">{fmt(amount.final)}</span>
                </div>
                <LedgerPayRow label="আদায়" value={fmt(amount.paid)} valueClass="text-[#0F6E5C] font-semibold" />
                {!fullyPaid ? (
                  <LedgerPayRow label="বাকি" value={fmt(due)} valueClass="text-[#C0312B] font-semibold" />
                ) : (
                  <div className="flex items-center justify-end gap-1.5 text-[#0F6E5C]">
                    <CheckCircle2 className="w-3 h-3" />
                    <span className="text-[10px] font-semibold uppercase">Fully Paid</span>
                  </div>
                )}
              </div>
            </ManifestBlock>

            {/* Status row */}
            <div className="flex items-center gap-2">
              <ManifestStatusBadge
                active={delivered}
                activeClass="text-[#1E4FA0] border-[#1E4FA0]/30 bg-[#1E4FA0]/5"
                inactiveClass="text-[#A8ACA3] border-[#D8D5CB]"
                icon={PackageCheck}
                activeLabel="Delivered"
                inactiveLabel="Not Delivered"
              />
              <ManifestStatusBadge
                active={fullyPaid}
                activeClass="text-[#0F6E5C] border-[#0F6E5C]/30 bg-[#0F6E5C]/5"
                inactiveClass="text-[#C0312B] border-[#C0312B]/30 bg-[#C0312B]/5"
                icon={Wallet}
                activeLabel="Fully Paid"
                inactiveLabel={`Due ৳${due.toLocaleString()}`}
              />
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      {invoiceRow && (
        <div className="px-5 pb-5 border-t border-[#E3E0D6] pt-4 space-y-2">
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="py-2 px-4 font-['IBM_Plex_Mono'] text-xs uppercase border border-[#D8D5CB] text-[#6F756F] hover:bg-[#EDEBE3] rounded-[2px] transition-colors"
            >
              বন্ধ করুন
            </button>
            <Link
              to={`/outdoor/invoice/print/${invoiceId}`}
              className="flex-1 py-2 font-['IBM_Plex_Mono'] text-xs uppercase border border-[#1E4FA0] text-[#1E4FA0] hover:bg-[#1E4FA0] hover:text-white rounded-[2px] transition-colors text-center"
            >
              ইনভয়েস খুলুন
            </Link>
            {rowHasReports && (
              <Link
                to="/report"
                state={{ invoiceId }}
                className="flex-1 py-2 font-['IBM_Plex_Mono'] text-xs uppercase border border-[#C0312B] text-[#C0312B] hover:bg-[#C0312B] hover:text-white rounded-[2px] transition-colors text-center flex items-center justify-center gap-1.5"
              >
                <FlaskConical className="w-3 h-3" /> রিপোর্ট
              </Link>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};

// ─── Edit Patient Modal ───────────────────────────────────────────────────────

export const EditPatientModal = ({ invoice, isOpen, onClose, onSaved, onLoadingChange, onError }) => {
  const [form, setForm] = useState({ name: "", gender: "", age: "", contactNumber: "" });

  useEffect(() => {
    if (!invoice?.patient) return;
    const { name, gender, age, contactNumber } = invoice.patient;
    setForm({ name: name || "", gender: gender || "", age: age || "", contactNumber: contactNumber || "" });
  }, [invoice]);

  const isValid = form.name.trim() && form.gender && form.age && form.contactNumber.trim();

  const handleSubmit = async () => {
    if (!isValid) return;
    onClose();
    try {
      onLoadingChange("Updating patient info...");
      await invoiceService.updatePatientInfo(invoice.invoiceId, { patient: form });
      onSaved(invoice.invoiceId, { patient: { ...form, age: Number(form.age) } });
    } catch {
      onError("Failed to update patient info. Please try again.");
    } finally {
      onLoadingChange(null);
    }
  };

  const inputCls =
    "w-full pl-9 pr-3 py-2.5 text-sm border border-[#D8D5CB] rounded-[2px] focus:outline-none focus:ring-1 focus:ring-[#1E4FA0]/30 focus:border-[#1E4FA0] transition-all placeholder-[#A8ACA3] bg-[#FAF9F5] focus:bg-white font-['IBM_Plex_Mono']";
  const set = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[#E3E0D6] bg-[#FAF9F5]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[3px] border border-[#D8D5CB] flex items-center justify-center shrink-0 bg-white">
            <User className="w-4 h-4 text-[#1E4FA0]" />
          </div>
          <div>
            <h2 className="font-['IBM_Plex_Sans'] text-sm font-bold text-[#1C1F1E] leading-tight">
              রোগীর তথ্য সম্পাদনা
            </h2>
            <p className="font-['IBM_Plex_Mono'] text-[10px] text-[#A8ACA3] mt-0.5">Invoice #{invoice?.invoiceId}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-sm text-[#A8ACA3] hover:text-[#1C1F1E] hover:bg-[#EDEBE3] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="px-5 py-5 space-y-4">
        <EditField label="Patient Name" required>
          <IconWrap icon={User}>
            <input type="text" value={form.name} onChange={set("name")} className={inputCls} placeholder="Full name" />
          </IconWrap>
        </EditField>

        <EditField label="Gender" required>
          <div className="flex gap-2">
            {["male", "female", "other"].map((g) => (
              <label
                key={g}
                className={`flex-1 flex items-center justify-center py-2 rounded-[2px] border cursor-pointer font-['IBM_Plex_Mono'] text-xs uppercase tracking-wide transition-all select-none ${
                  form.gender === g
                    ? "border-[#1E4FA0] bg-[#1E4FA0]/5 text-[#1E4FA0]"
                    : "border-[#D8D5CB] bg-[#FAF9F5] text-[#6F756F] hover:border-[#A8ACA3] hover:bg-white"
                }`}
              >
                <input
                  type="radio"
                  name="edit-gender"
                  value={g}
                  checked={form.gender === g}
                  onChange={() => setForm((p) => ({ ...p, gender: g }))}
                  className="sr-only"
                />
                {g}
              </label>
            ))}
          </div>
        </EditField>

        <div className="grid grid-cols-2 gap-3">
          <EditField label="Age" required>
            <IconWrap icon={Calendar}>
              <input
                type="number"
                value={form.age}
                onChange={set("age")}
                className={inputCls}
                placeholder="e.g. 32"
                min="0"
                max="150"
              />
            </IconWrap>
          </EditField>
          <EditField label="Contact" required>
            <IconWrap icon={Phone}>
              <input
                type="tel"
                value={form.contactNumber}
                onChange={set("contactNumber")}
                className={inputCls}
                placeholder="01XXXXXXXXX"
              />
            </IconWrap>
          </EditField>
        </div>
      </div>

      <div className="flex gap-2 px-5 pb-5 border-t border-[#E3E0D6] pt-4">
        <button
          onClick={onClose}
          className="flex-1 py-2 font-['IBM_Plex_Mono'] text-xs uppercase border border-[#D8D5CB] text-[#6F756F] hover:bg-[#EDEBE3] rounded-[2px] transition-colors"
        >
          বাতিল
        </button>
        <button
          onClick={handleSubmit}
          disabled={!isValid}
          className="flex-1 py-2 font-['IBM_Plex_Mono'] text-xs uppercase border border-[#0F6E5C] text-[#0F6E5C] hover:bg-[#0F6E5C] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed rounded-[2px] transition-colors"
        >
          সংরক্ষণ করুন
        </button>
      </div>
    </Modal>
  );
};

// ─── Shared Modal Primitives ──────────────────────────────────────────────────

const ManifestBlock = ({ icon: Icon, label, badge, children }) => (
  <div className="bg-[#FAF9F5] border border-[#E3E0D6] rounded-[3px] p-4">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <Icon className="w-3.5 h-3.5 text-[#0F6E5C]" />
        <span className="font-['IBM_Plex_Mono'] text-[10px] uppercase tracking-wide text-[#6F756F]">{label}</span>
      </div>
      {badge !== undefined && <span className="font-['IBM_Plex_Mono'] text-[10px] text-[#A8ACA3]">{badge}টি</span>}
    </div>
    {children}
  </div>
);

const ManifestField = ({ label, value, valueClass = "text-[#1C1F1E]" }) => (
  <div>
    <p className="font-['IBM_Plex_Mono'] text-[10px] uppercase text-[#A8ACA3] mb-0.5">{label}</p>
    <p className={`font-['IBM_Plex_Sans'] font-semibold text-xs leading-snug ${valueClass}`}>{value}</p>
  </div>
);

const LedgerPayRow = ({ label, value, valueClass = "text-[#1C1F1E]" }) => (
  <div className="flex items-baseline gap-2">
    <span className="text-[#6F756F] flex-1">{label}</span>
    <span className="flex-1 border-b border-dotted border-[#D8D5CB] translate-y-[-3px]" />
    <span className={`shrink-0 ${valueClass}`}>{value}</span>
  </div>
);

const ManifestStatusBadge = ({ active, activeClass, inactiveClass, icon: Icon, activeLabel, inactiveLabel }) => (
  <span
    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[2px] font-['IBM_Plex_Mono'] text-[10px] uppercase tracking-wide border ${active ? activeClass : inactiveClass}`}
  >
    <Icon className="w-3.5 h-3.5" />
    {active ? activeLabel : inactiveLabel}
  </span>
);

const EditField = ({ label, required, children }) => (
  <div>
    <label className="block font-['IBM_Plex_Mono'] text-[10px] uppercase text-[#6F756F] mb-1.5">
      {label}
      {required && <span className="text-[#C0312B] ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

const IconWrap = ({ icon: Icon, children }) => (
  <div className="relative">
    <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#A8ACA3] pointer-events-none" />
    {children}
  </div>
);

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const SkeletonManifest = () => (
  <div className="bg-white border border-[#E3E0D6] rounded-lg overflow-hidden animate-pulse">
    <div className="h-[3px] bg-[#E3E0D6]" />
    <div className="px-6 sm:px-8 pt-5 pb-4 border-b border-[#E3E0D6] space-y-2">
      <div className="h-2.5 w-32 bg-[#ECE9DF] rounded-sm mx-auto" />
      <div className="h-4 w-48 bg-[#ECE9DF] rounded-sm mx-auto" />
    </div>
    <div className="px-6 sm:px-8 pt-6 pb-5 border-b border-[#E3E0D6] space-y-2">
      <div className="h-2.5 w-24 bg-[#ECE9DF] rounded-sm" />
      <div className="h-6 w-48 bg-[#ECE9DF] rounded-sm" />
      <div className="h-3 w-36 bg-[#ECE9DF] rounded-sm" />
    </div>
    {[0, 1, 2, 3].map((i) => (
      <div key={i} className="px-6 sm:px-8 py-3 border-b border-[#EDEBE3] flex items-center gap-3">
        <div className="h-3 w-5 bg-[#ECE9DF] rounded-sm" />
        <div className="h-3 flex-1 bg-[#ECE9DF] rounded-sm" />
        <div className="h-3 w-20 bg-[#ECE9DF] rounded-sm" />
      </div>
    ))}
  </div>
);

const DetailsSkeleton = () => (
  <div className="space-y-4 animate-pulse">
    <div className="bg-[#FAF9F5] border border-[#E3E0D6] rounded-[3px] p-4 space-y-3">
      <div className="h-3 bg-[#ECE9DF] rounded w-1/3" />
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-1.5">
            <div className="h-2 bg-[#ECE9DF] rounded w-1/2" />
            <div className="h-3 bg-[#ECE9DF] rounded w-3/4" />
          </div>
        ))}
      </div>
    </div>
    <div className="bg-[#FAF9F5] border border-[#E3E0D6] rounded-[3px] p-4 space-y-2">
      <div className="h-3 bg-[#ECE9DF] rounded w-1/4" />
      {[1, 2].map((i) => (
        <div key={i} className="flex justify-between items-center">
          <div className="h-3 bg-[#ECE9DF] rounded w-1/2" />
          <div className="h-3 bg-[#ECE9DF] rounded w-1/5" />
        </div>
      ))}
    </div>
  </div>
);

export default InvoiceList;
