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
  return {
    date: `${day}${suffix} ${month}, ${year}`,
    time: `${displayHour}:${minutes} ${ampm}`,
  };
};

// ============================================================================
// SKELETON
// ============================================================================
const SkeletonInvoice = () => (
  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 animate-pulse">
    <div className="flex items-center justify-between gap-3">
      <div className="w-8 h-8 rounded-lg bg-gray-200 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-1/3" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
      </div>
      <div className="flex gap-2">
        <div className="h-7 w-16 bg-gray-200 rounded-lg" />
        <div className="h-7 w-16 bg-gray-200 rounded-lg" />
      </div>
    </div>
  </div>
);

// ============================================================================
// INVOICE ROW
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

  const handleConfirm = async () => {
    try {
      setDelivering(true);
      await invoiceService.markDelivered(invoice.invoiceId);
      onDelivered(invoice.invoiceId);
    } catch {
      // parent can handle error display if needed
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
      // parent can handle error display if needed
    } finally {
      setCollecting(false);
    }
  };

  const DeliveryBadge = () =>
    invoice.isDelivered ? (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 text-blue-600 border border-blue-100 text-xs font-medium">
        <PackageCheck className="w-3 h-3" />
        Delivered
      </span>
    ) : (
      <button
        onClick={() => setConfirming(true)}
        className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white text-gray-500 border border-gray-200 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 text-xs font-medium transition-all"
      >
        <PackageCheck className="w-3 h-3" />
        Mark Delivered
      </button>
    );

  const PaymentBadge = () =>
    isFullyPaid ? (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-green-50 text-green-700 border border-green-100 text-xs font-medium">
        <CheckCircle2 className="w-3 h-3" />
        Paid
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-red-50 text-red-600 border border-red-100 text-xs font-medium">
        <Wallet className="w-3 h-3" />৳{dueAmount.toLocaleString()}
      </span>
    );

  return (
    <>
      {confirming && (
        <Popup
          type="warning"
          message={`Mark invoice #${invoice.invoiceId} for ${invoice.patientName} as delivered? This action cannot be undone.`}
          confirmText={delivering ? "Saving..." : "Mark Delivered"}
          cancelText="Cancel"
          onConfirm={handleConfirm}
          onClose={() => setConfirming(false)}
        />
      )}
      {collectingDue && (
        <Popup
          type="warning"
          message={`Collect the full due amount of ৳${dueAmount.toLocaleString()} from ${invoice.patientName} (Invoice #${invoice.invoiceId})? This will mark the invoice as fully paid.`}
          confirmText={collecting ? "Saving..." : "Collect ৳" + dueAmount.toLocaleString()}
          cancelText="Cancel"
          onConfirm={handleCollectDue}
          onClose={() => setCollectingDue(false)}
        />
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:border-indigo-100 hover:shadow-md transition-all duration-200">
        <div className="flex items-center gap-3 px-4 pt-3.5 pb-2.5">
          {/* Index */}
          <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
            <span className="text-[11px] font-bold text-indigo-600">{index + 1}</span>
          </div>

          {/* Name + date */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm leading-tight truncate">{invoice.patientName}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {date} · {time}
            </p>
          </div>

          {/* Action buttons — fixed, right-aligned */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Link
              to={`/invoice/edit/${invoice.invoiceId}`}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
            >
              <Pencil className="w-3 h-3" />
              Edit
            </Link>
            <Link
              to={`/invoice/print/${invoice.invoiceId}`}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-lg transition-colors"
            >
              <FileText className="w-3 h-3" />
              Invoice
            </Link>
            {hasReports && (
              <Link
                to={`/invoice/reports/${invoice.invoiceId}`}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
              >
                <FlaskConical className="w-3 h-3" />
                Reports
              </Link>
            )}
          </div>
        </div>

        {/* Bottom row — status badges, consistent height */}
        <div className="flex items-center gap-2 px-4 pb-3 pt-0 border-t border-gray-50">
          <PaymentBadge />
          {!isFullyPaid && (
            <button
              onClick={() => setCollectingDue(true)}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white text-gray-500 border border-gray-200 hover:border-green-300 hover:text-green-600 hover:bg-green-50 text-xs font-medium transition-all"
            >
              <Banknote className="w-3 h-3" />
              Collect
            </button>
          )}
          <div className="w-px h-3.5 bg-gray-200 mx-0.5" />
          <DeliveryBadge />
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
  const [loadingMessage, setLoadingMessage] = useState("Processing request");
  const [popup, setPopup] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadInvoices = async () => {
    try {
      const response = await invoiceService.getInvoices();
      setInvoices(response.data);
    } catch (e) {
      setPopup({ type: "error", message: "Could not load invoices" });
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const total = invoices.length;
  const pending = invoices.filter((inv) => Math.max(0, (inv.finalPrice || 0) - (inv.paidAmount || 0)) > 0).length;
  const completed = invoices.filter((inv) => Math.max(0, (inv.finalPrice || 0) - (inv.paidAmount || 0)) === 0).length;

  let filteredInvoices = [...invoices];
  if (statusFilter === "pending") {
    filteredInvoices = filteredInvoices.filter((inv) => Math.max(0, (inv.finalPrice || 0) - (inv.paidAmount || 0)) > 0);
  } else if (statusFilter === "paid") {
    filteredInvoices = filteredInvoices.filter(
      (inv) => Math.max(0, (inv.finalPrice || 0) - (inv.paidAmount || 0)) === 0,
    );
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filteredInvoices = filteredInvoices.filter(
      (inv) =>
        inv.patientName.toLowerCase().includes(q) || String(inv.invoiceId).includes(q) || inv.contactNumber.includes(q),
    );
  }

  const handleDelivered = (invoiceId) => {
    setInvoices((prev) => prev.map((inv) => (inv.invoiceId === invoiceId ? { ...inv, isDelivered: true } : inv)));
  };

  const handleCollected = (invoiceId) => {
    setInvoices((prev) =>
      prev.map((inv) => (inv.invoiceId === invoiceId ? { ...inv, paidAmount: inv.finalPrice } : inv)),
    );
  };

  return (
    <section className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 px-4 py-6">
      {loading && <LoadingScreen message={loadingMessage} />}
      {popup && <Popup type={popup.type} message={popup.message} onClose={() => setPopup(null)} />}

      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-2 sm:mb-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-7 h-7 sm:w-8 sm:h-8 text-indigo-600" />
              Invoices
            </h1>
            <p className="text-sm text-gray-600 mt-1 hidden sm:flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-indigo-500" />
              Manage invoices & upload reports
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/lab-management"
              className="px-2 md:px-4 py-2.5 rounded-xl border border-gray-200 bg-white/50 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 flex items-center gap-2 text-sm font-medium shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </Link>
            <Link
              to="/invoice/new"
              className="hidden sm:flex bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-2.5 px-5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              New Invoice
            </Link>
          </div>
        </div>

        {/* Mobile: subtitle + new invoice btn */}
        <div className="flex flex-col gap-3 sm:hidden mb-6">
          <p className="text-sm text-gray-600 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-indigo-500" />
            Manage invoices & upload reports
          </p>
          <Link
            to="/invoice/new"
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-2.5 px-5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            New Invoice
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Total", value: total, icon: FileText, color: "indigo" },
            { label: "Due", value: pending, icon: AlertCircle, color: "red" },
            { label: "Paid", value: completed, icon: CheckCircle2, color: "green" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div
              key={label}
              className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-2">
                <div className={`p-2 bg-${color}-50 rounded-lg`}>
                  <Icon
                    className={`w-5 h-5 text-${color}-${color === "indigo" ? "600" : color === "red" ? "400" : "500"}`}
                  />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">{label}</p>
                  {initialLoading ? (
                    <div className="h-7 w-10 bg-gray-200 rounded animate-pulse" />
                  ) : (
                    <p
                      className={`text-2xl font-bold text-${color}-${color === "indigo" ? "900" : color === "red" ? "500" : "600"}`}
                    >
                      {value}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm font-semibold text-gray-700">Filter:</span>
            <div className="flex rounded-lg bg-gray-100 p-1">
              {[
                { key: "all", label: "All" },
                { key: "pending", label: "Due" },
                { key: "paid", label: "Paid" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setStatusFilter(key)}
                  disabled={initialLoading}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    statusFilter === key ? "bg-white text-indigo-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
                  } ${initialLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, invoice ID, or contact..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={initialLoading}
              className="w-full pl-11 pr-11 py-2.5 text-sm border border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all placeholder-gray-400 disabled:bg-gray-50 disabled:cursor-not-allowed"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                disabled={initialLoading}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-1 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Invoice List */}
        {initialLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonInvoice key={i} />
            ))}
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="bg-indigo-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-indigo-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {searchQuery || statusFilter !== "all" ? "No invoices found" : "No invoices yet"}
            </h3>
            <p className="text-gray-500 text-sm mb-4 max-w-sm mx-auto">
              {searchQuery || statusFilter !== "all"
                ? "Try adjusting your search or filters"
                : "Create your first invoice to get started"}
            </p>
            {!searchQuery && statusFilter === "all" && (
              <Link
                to="/invoice/new"
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-5 rounded-lg shadow-sm hover:shadow transition-all text-sm"
              >
                <Plus className="w-4 h-4" />
                Create Invoice
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredInvoices.map((invoice, index) => (
              <InvoiceRow
                key={invoice._id}
                invoice={invoice}
                index={index}
                onDelivered={handleDelivered}
                onCollected={handleCollected}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default InvoiceList;
