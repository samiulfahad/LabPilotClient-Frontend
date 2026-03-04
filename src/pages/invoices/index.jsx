import { useEffect, useState } from "react";
import {
  FileText,
  Search,
  X,
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
  SlidersHorizontal,
} from "lucide-react";
import { Link } from "react-router-dom";
import Popup from "../../components/popup";
import LoadingScreen from "../../components/loadingPage";
import invoiceService from "../../api/invoice";

// ============================================================================
// HELPERS
// ============================================================================
const formatInvoiceDateTime = (invoiceId) => {
  const id = String(invoiceId);
  const date = new Date(
    `20${id.slice(0, 2)}-${id.slice(2, 4)}-${id.slice(4, 6)}T${id.slice(6, 8)}:${id.slice(8, 10)}:${id.slice(10, 12)}`,
  );
  const day = date.getDate();
  const suffix =
    day % 10 === 1 && day % 100 !== 11
      ? "st"
      : day % 10 === 2 && day % 100 !== 12
        ? "nd"
        : day % 10 === 3 && day % 100 !== 13
          ? "rd"
          : "th";
  const month = date.toLocaleString("default", { month: "short" });
  const year = date.getFullYear();
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 === 0 ? 12 : hours % 12;
  return { date: `${day}${suffix} ${month} ${year}`, time: `${displayHour}:${minutes} ${ampm}` };
};

// ============================================================================
// SKELETON
// ============================================================================
const SkeletonInvoice = () => (
  <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 animate-pulse">
    <div className="flex items-center gap-3 mb-3">
      <div className="w-9 h-9 rounded-xl bg-gray-100 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 rounded-lg w-2/5" />
        <div className="h-3 bg-gray-100 rounded-lg w-1/4" />
      </div>
      <div className="flex gap-1.5">
        <div className="h-8 w-14 bg-gray-100 rounded-lg" />
        <div className="h-8 w-16 bg-gray-100 rounded-lg" />
        <div className="h-8 w-18 bg-gray-200 rounded-lg" />
      </div>
    </div>
    <div className="flex gap-2 pt-3 border-t border-gray-50">
      <div className="h-6 w-14 bg-gray-100 rounded-full" />
      <div className="h-6 w-24 bg-gray-100 rounded-full" />
      <div className="h-6 w-20 bg-gray-100 rounded-full" />
    </div>
  </div>
);

// ============================================================================
// STAT CARD
// ============================================================================
const StatCard = ({ label, value, icon: Icon, colorClass, bgClass, loading }) => (
  <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bgClass}`}>
      <Icon className={`w-5 h-5 ${colorClass}`} />
    </div>
    <div>
      <p className="text-xs text-gray-400 font-medium leading-none mb-1">{label}</p>
      {loading ? (
        <div className="h-6 w-8 bg-gray-200 rounded animate-pulse" />
      ) : (
        <p className={`text-xl font-bold leading-none ${colorClass}`}>{value}</p>
      )}
    </div>
  </div>
);

// ============================================================================
// INVOICE CARD
// ============================================================================
const InvoiceRow = ({ invoice, index, onDelivered, onCollected }) => {
  const { date, time } = formatInvoiceDateTime(invoice.invoiceId);
  const [confirming, setConfirming] = useState(false);
  const [delivering, setDelivering] = useState(false);
  const [collectingDue, setCollectingDue] = useState(false);
  const [collecting, setCollecting] = useState(false);

  const paidAmount = Number(invoice.paidAmount) || 0;
  const finalPrice = Number(invoice.finalPrice) || 0;
  const dueAmount = Math.max(0, finalPrice - paidAmount);
  const isFullyPaid = dueAmount === 0;
  const onlineTests = invoice.tests.filter((t) => t.schemaId);
  const hasReports = onlineTests.length > 0;

  const handleConfirmDelivery = async () => {
    try {
      setDelivering(true);
      await invoiceService.markDelivered(invoice.invoiceId);
      onDelivered(invoice.invoiceId);
    } catch {
    } finally {
      setDelivering(false);
    }
  };

  const handleCollectDue = async () => {
    try {
      setCollecting(true);
      await invoiceService.collectDue(invoice.invoiceId);
      onCollected(invoice.invoiceId);
    } catch {
    } finally {
      setCollecting(false);
    }
  };

  return (
    <>
      {confirming && (
        <Popup
          type="warning"
          message={`Mark the invoice for ${invoice.patientName} as delivered? This action cannot be undone.`}
          confirmText={delivering ? "Saving..." : "Mark Delivered"}
          cancelText="Cancel"
          onConfirm={handleConfirmDelivery}
          onClose={() => setConfirming(false)}
        />
      )}
      {collectingDue && (
        <Popup
          type="warning"
          message={`Collect the full due amount of ৳${dueAmount.toLocaleString()} from ${invoice.patientName}? This will mark the invoice as fully paid.`}
          confirmText={collecting ? "Processing..." : `Collect ৳${dueAmount.toLocaleString()}`}
          cancelText="Cancel"
          onConfirm={handleCollectDue}
          onClose={() => setCollectingDue(false)}
        />
      )}

      <div className="group bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-indigo-200 hover:shadow-md transition-all duration-200 overflow-hidden">
        {/* Top row: index + name + actions */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-3">
          {/* Serial */}
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 flex items-center justify-center shrink-0">
            <span className="text-[11px] font-bold text-indigo-500">{index + 1}</span>
          </div>

          {/* Name block */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm leading-tight truncate">{invoice.patientName}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {date} · {time}
            </p>
          </div>

          {/* Action buttons — icon-only on mobile, icon+label on sm+ */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Link
              to={`/invoice/edit/${invoice.invoiceId}`}
              title="Edit Invoice"
              className="h-8 px-2.5 sm:px-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-all duration-150"
            >
              <Pencil className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Edit</span>
            </Link>
            <Link
              to={`/invoice/print/${invoice.invoiceId}`}
              title="View Invoice"
              className="h-8 px-2.5 sm:px-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-all duration-150"
            >
              <FileText className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Invoice</span>
            </Link>
            {hasReports && (
              <Link
                to={`/invoice/reports/${invoice.invoiceId}`}
                title="View Reports"
                className="h-8 px-2.5 sm:px-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all duration-150 shadow-sm shadow-indigo-200"
              >
                <FlaskConical className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">Reports</span>
              </Link>
            )}
          </div>
        </div>

        {/* Bottom row: status chips */}
        <div className="flex items-center gap-2 px-4 pb-3.5 flex-wrap">
          {/* Payment status */}
          {isFullyPaid ? (
            <span className="inline-flex items-center gap-1 h-6 px-2.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-[11px] font-semibold">
              <CheckCircle2 className="w-3 h-3" />
              Paid
            </span>
          ) : (
            <>
              <span className="inline-flex items-center gap-1 h-6 px-2.5 rounded-full bg-red-50 text-red-600 border border-red-100 text-[11px] font-semibold">
                <Wallet className="w-3 h-3" />
                Due ৳{dueAmount.toLocaleString()}
              </span>
              <button
                onClick={() => setCollectingDue(true)}
                className="inline-flex items-center gap-1 h-6 px-2.5 rounded-full bg-white text-gray-500 border border-gray-200 hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50 text-[11px] font-semibold transition-all duration-150"
              >
                <Banknote className="w-3 h-3" />
                Collect
              </button>
            </>
          )}

          {/* Divider */}
          <span className="w-px h-3.5 bg-gray-200 rounded-full" />

          {/* Delivery status */}
          {invoice.isDelivered ? (
            <span className="inline-flex items-center gap-1 h-6 px-2.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 text-[11px] font-semibold">
              <PackageCheck className="w-3 h-3" />
              Delivered
            </span>
          ) : (
            <button
              onClick={() => setConfirming(true)}
              className="inline-flex items-center gap-1 h-6 px-2.5 rounded-full bg-white text-gray-500 border border-gray-200 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 text-[11px] font-semibold transition-all duration-150"
            >
              <PackageCheck className="w-3 h-3" />
              Mark Delivered
            </button>
          )}
        </div>
      </div>
    </>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
const InvoiceList = () => {
  const [invoices, setInvoices] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    (async () => {
      try {
        const response = await invoiceService.getInvoices();
        setInvoices(response.data);
      } catch {
        setPopup({ type: "error", message: "Could not load invoices" });
      } finally {
        setInitialLoading(false);
      }
    })();
  }, []);

  const due = (inv) => Math.max(0, (inv.finalPrice || 0) - (inv.paidAmount || 0));
  const total = invoices.length;
  const pendingCount = invoices.filter((inv) => due(inv) > 0).length;
  const paidCount = invoices.filter((inv) => due(inv) === 0).length;

  let filtered = [...invoices];
  if (statusFilter === "pending") filtered = filtered.filter((inv) => due(inv) > 0);
  else if (statusFilter === "paid") filtered = filtered.filter((inv) => due(inv) === 0);

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (inv) =>
        inv.patientName.toLowerCase().includes(q) || String(inv.invoiceId).includes(q) || inv.contactNumber.includes(q),
    );
  }

  const handleDelivered = (invoiceId) =>
    setInvoices((prev) => prev.map((inv) => (inv.invoiceId === invoiceId ? { ...inv, isDelivered: true } : inv)));

  const handleCollected = (invoiceId) =>
    setInvoices((prev) =>
      prev.map((inv) => (inv.invoiceId === invoiceId ? { ...inv, paidAmount: inv.finalPrice } : inv)),
    );

  const FILTERS = [
    { key: "all", label: "All", count: total },
    { key: "pending", label: "Due", count: pendingCount },
    { key: "paid", label: "Paid", count: paidCount },
  ];

  return (
    <section className="min-h-screen bg-gray-50 pb-10">
      {loading && <LoadingScreen />}
      {popup && <Popup type={popup.type} message={popup.message} onClose={() => setPopup(null)} />}

      {/* ── Page Header ── */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            to="/lab-management"
            className="w-9 h-9 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </Link>

          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-gray-900 leading-none">Invoices</h1>
            <p className="text-[11px] text-gray-400 mt-0.5 hidden sm:block">Manage billing & reports</p>
          </div>

          <Link
            to="/invoice/new"
            className="inline-flex items-center gap-1.5 h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm shadow-indigo-200 transition-all duration-150 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Invoice</span>
            <span className="sm:hidden">New</span>
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-5 space-y-4">
        {/* ── Stats ── */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            label="Total"
            value={total}
            icon={FileText}
            colorClass="text-indigo-600"
            bgClass="bg-indigo-50"
            loading={initialLoading}
          />
          <StatCard
            label="Due"
            value={pendingCount}
            icon={AlertCircle}
            colorClass="text-red-500"
            bgClass="bg-red-50"
            loading={initialLoading}
          />
          <StatCard
            label="Paid"
            value={paidCount}
            icon={CheckCircle2}
            colorClass="text-emerald-600"
            bgClass="bg-emerald-50"
            loading={initialLoading}
          />
        </div>

        {/* ── Search + Filter ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name, ID or contact..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={initialLoading}
              className="w-full pl-9 pr-9 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all placeholder-gray-400 disabled:cursor-not-allowed"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600 bg-gray-200 hover:bg-gray-300 rounded-full transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <div className="flex gap-1.5 flex-wrap">
              {FILTERS.map(({ key, label, count }) => (
                <button
                  key={key}
                  onClick={() => setStatusFilter(key)}
                  disabled={initialLoading}
                  className={`inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-xs font-semibold transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${
                    statusFilter === key
                      ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {label}
                  <span
                    className={`text-[10px] font-bold px-1 py-0.5 rounded-full ${
                      statusFilter === key ? "bg-white/20 text-white" : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Invoice List ── */}
        {initialLoading ? (
          <div className="space-y-2.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <SkeletonInvoice key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-7 h-7 text-indigo-400" />
            </div>
            <h3 className="text-sm font-semibold text-gray-800 mb-1">
              {searchQuery || statusFilter !== "all" ? "No results found" : "No invoices yet"}
            </h3>
            <p className="text-xs text-gray-400 mb-5">
              {searchQuery || statusFilter !== "all"
                ? "Try a different search or filter"
                : "Create your first invoice to get started"}
            </p>
            {!searchQuery && statusFilter === "all" && (
              <Link
                to="/invoice/new"
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-5 rounded-xl shadow-sm transition-all text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Create Invoice
              </Link>
            )}
          </div>
        ) : (
          <>
            <p className="text-[11px] text-gray-400 font-medium px-1">
              {filtered.length} invoice{filtered.length !== 1 ? "s" : ""}
              {searchQuery && ` matching "${searchQuery}"`}
            </p>
            <div className="space-y-2.5">
              {filtered.map((invoice, index) => (
                <InvoiceRow
                  key={invoice._id}
                  invoice={invoice}
                  index={index}
                  onDelivered={handleDelivered}
                  onCollected={handleCollected}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default InvoiceList;
