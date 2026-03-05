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
} from "lucide-react";
import { Link } from "react-router-dom";
import Popup from "../../components/popup";
import Modal from "../../components/modal";
import LoadingScreen from "../../components/loadingPage";
import invoiceService from "../../api/invoice";
import TimeFrame from "../../components/timeFrame"; // adjust path as needed

// ============================================================================
// HELPERS
// ============================================================================
const formatDateTime = (createdAt) => {
  const date = new Date(createdAt);
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
// EDIT PATIENT MODAL
// ============================================================================
const EditPatientModal = ({ invoice, isOpen, onClose, onSaved, onLoadingChange, onError }) => {
  const [form, setForm] = useState({ patientName: "", gender: "", age: "", contactNumber: "" });

  useEffect(() => {
    if (invoice) {
      setForm({
        patientName: invoice.patientName || "",
        gender: invoice.gender || "",
        age: invoice.age || "",
        contactNumber: invoice.contactNumber || "",
      });
    }
  }, [invoice]);

  const isValid = form.patientName.trim() && form.gender && form.age && form.contactNumber.trim();

  const handleSubmit = async () => {
    if (!isValid) return;
    onClose();
    try {
      onLoadingChange("Updating patient info...");
      await invoiceService.updatePatientInfo(invoice.invoiceId, form);
      onSaved(invoice.invoiceId, { ...form, age: Number(form.age) });
    } catch {
      onError("Failed to update patient info. Please try again.");
    } finally {
      onLoadingChange(null);
    }
  };

  const inputBase =
    "w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all placeholder-gray-400 bg-gray-50 focus:bg-white";

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
            <User className="w-4.5 h-4.5 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900 leading-tight">Edit Patient Info</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">Invoice #{invoice?.invoiceId}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Form */}
      <div className="px-5 py-5 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            Patient Name <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={form.patientName}
              onChange={(e) => setForm((p) => ({ ...p, patientName: e.target.value }))}
              className={inputBase}
              placeholder="Full name"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            Gender <span className="text-red-400">*</span>
          </label>
          <div className="flex gap-2">
            {["male", "female", "other"].map((g) => (
              <label
                key={g}
                className={`flex-1 flex items-center justify-center py-2.5 rounded-xl border cursor-pointer text-xs font-semibold transition-all select-none ${
                  form.gender === g
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                    : "border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300 hover:bg-white"
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
                <span className="capitalize">{g}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Age <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              <input
                type="number"
                value={form.age}
                onChange={(e) => setForm((p) => ({ ...p, age: e.target.value }))}
                className={inputBase}
                placeholder="e.g. 32"
                min="0"
                max="150"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Contact <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              <input
                type="tel"
                value={form.contactNumber}
                onChange={(e) => setForm((p) => ({ ...p, contactNumber: e.target.value }))}
                className={inputBase}
                placeholder="01XXXXXXXXX"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex gap-2 px-5 pb-5">
        <button
          onClick={onClose}
          className="flex-1 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!isValid}
          className="flex-1 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-colors"
        >
          Save Changes
        </button>
      </div>
    </Modal>
  );
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
const InvoiceRow = ({ invoice, index, onDelivered, onCollected, onPatientUpdated, onLoadingChange, onError }) => {
  const { date, time } = formatDateTime(invoice.createdAt);
  const [confirming, setConfirming] = useState(false);
  const [collectingDue, setCollectingDue] = useState(false);
  const [editingPatient, setEditingPatient] = useState(false);

  const paidAmount = Number(invoice.paidAmount) || 0;
  const finalPrice = Number(invoice.finalPrice) || 0;
  const dueAmount = Math.max(0, finalPrice - paidAmount);
  const isFullyPaid = dueAmount === 0;

  const onlineTests = invoice.tests.filter((t) => t.schemaId);
  const hasReports = onlineTests.length > 0;

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
          confirmText="Mark Delivered"
          cancelText="Cancel"
          onConfirm={handleConfirmDelivery}
          onClose={() => setConfirming(false)}
        />
      )}
      {collectingDue && (
        <Popup
          type="warning"
          message={`Collect the full due amount of ৳${dueAmount.toLocaleString()} from ${invoice.patientName} (Invoice #${invoice.invoiceId})? This will mark the invoice as fully paid.`}
          confirmText={`Collect ৳${dueAmount.toLocaleString()}`}
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

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:border-indigo-100 hover:shadow-md transition-all duration-200">
        <div className="flex items-center gap-3 px-4 pt-3.5 pb-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
            <span className="text-[11px] font-bold text-indigo-600">{index + 1}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm leading-tight truncate">{invoice.patientName}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              #{invoice.invoiceId} · {date} · {time}
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setEditingPatient(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
            >
              <Pencil className="w-3 h-3" />
              Edit
            </button>
            <Link
              to={`/invoice/print/${invoice.invoiceId}`}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-lg transition-colors"
            >
              <FileText className="w-3 h-3" />
              Invoice
            </Link>
            {hasReports && (
              <Link
                to="/reports"
                state={{ invoiceId: invoice.invoiceId }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
              >
                <FlaskConical className="w-3 h-3" />
                Reports
              </Link>
            )}
          </div>
        </div>
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
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [loadingMessage, setLoadingMessage] = useState(null);
  const [popup, setPopup] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [timeRange, setTimeRange] = useState(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const loadInvoices = async (cursor = null, replace = true, range = timeRange) => {
    try {
      if (replace) setInitialLoading(true);
      else {
        setLoadingMore(true);
        setLoadingMessage("Loading more invoices...");
      }

      const response = await invoiceService.getInvoices({
        cursor,
        limit: 20,
        ...(range && { startDate: range.start, endDate: range.end }),
      });
      const { invoices: newInvoices, nextCursor: nc, hasMore: hm } = response.data;

      setInvoices((prev) => (replace ? newInvoices : [...prev, ...newInvoices]));
      setNextCursor(nc);
      setHasMore(hm);
    } catch {
      setPopup({ type: "error", message: "Could not load invoices" });
    } finally {
      setInitialLoading(false);
      setLoadingMore(false);
      setLoadingMessage(null);
    }
  };

  // Initial load — today
  useEffect(() => {
    const now = new Date();
    const initial = {
      start: new Date(now).setHours(0, 0, 0, 0),
      end: new Date(now).setHours(23, 59, 59, 999),
    };
    setTimeRange(initial);
    loadInvoices(null, true, initial);
  }, []);

  // ── TimeFrame callback ─────────────────────────────────────────────────────
  const handleFetchData = (start, end) => {
    const range = { start, end };
    console.log(start);
    console.log(end);
    setTimeRange(range);
    setStatusFilter("all");
    loadInvoices(null, true, range);
  };

  const handleLoadMore = () => {
    if (hasMore && !loadingMore) loadInvoices(nextCursor, false);
  };

  // ── Derived counts ─────────────────────────────────────────────────────────
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

  // ── Optimistic updates ─────────────────────────────────────────────────────
  const handleDelivered = (invoiceId) =>
    setInvoices((prev) => prev.map((inv) => (inv.invoiceId === invoiceId ? { ...inv, isDelivered: true } : inv)));

  const handleCollected = (invoiceId) =>
    setInvoices((prev) =>
      prev.map((inv) => (inv.invoiceId === invoiceId ? { ...inv, paidAmount: inv.finalPrice } : inv)),
    );

  const handlePatientUpdated = (invoiceId, updatedFields) =>
    setInvoices((prev) => prev.map((inv) => (inv.invoiceId === invoiceId ? { ...inv, ...updatedFields } : inv)));

  const showLoadMore = hasMore && statusFilter === "all";

  return (
    <section className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 px-4 py-6">
      {loadingMessage && <LoadingScreen message={loadingMessage} />}
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

        {/* Mobile subtitle + new invoice btn */}
        <div className="flex flex-col gap-3 sm:hidden mb-4">
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

        {/* TimeFrame */}
        <div className="mb-4">
          <TimeFrame onFetchData={handleFetchData} />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          {[
            { label: "Loaded", value: total, icon: FileText, color: "indigo" },
            { label: "Due", value: pending, icon: AlertCircle, color: "red" },
            { label: "Paid", value: completed, icon: CheckCircle2, color: "green" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div
              key={label}
              className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-2">
                <div className={`p-2 bg-${color}-50 rounded-lg`}>
                  <Icon className={`w-5 h-5 text-${color}-${color === "indigo" ? "600" : color === "red" ? "400" : "500"}`} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">{label}</p>
                  {initialLoading ? (
                    <div className="h-7 w-10 bg-gray-200 rounded animate-pulse" />
                  ) : (
                    <p className={`text-2xl font-bold text-${color}-${color === "indigo" ? "900" : color === "red" ? "500" : "600"}`}>
                      {value}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Status filter */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
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
            {statusFilter !== "all" && (
              <p className="text-xs text-gray-400 ml-auto">
                Filtering loaded invoices only.{" "}
                {hasMore && <span className="text-indigo-400">Load more to filter further.</span>}
              </p>
            )}
          </div>
        </div>

        {/* Invoice list */}
        {initialLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => <SkeletonInvoice key={i} />)}
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="bg-indigo-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-indigo-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {statusFilter !== "all" ? "No invoices found" : "No invoices for this period"}
            </h3>
            <p className="text-gray-500 text-sm mb-4 max-w-sm mx-auto">
              {statusFilter !== "all" ? "Try changing the filter" : "No invoices were created in the selected timeframe"}
            </p>
            {statusFilter === "all" && (
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
                onPatientUpdated={handlePatientUpdated}
                onLoadingChange={(msg) => setLoadingMessage(msg)}
                onError={(msg) => setPopup({ type: "error", message: msg })}
              />
            ))}

            {showLoadMore && (
              <div className="flex items-center gap-3 pt-3 pb-1">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent to-indigo-100" />
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="group flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50 shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronDown className="w-3.5 h-3.5 text-indigo-500 group-hover:translate-y-0.5 transition-transform duration-200" />
                  <span className="text-xs font-semibold text-indigo-600">Load more</span>
                  <span className="text-[10px] font-medium text-indigo-400 bg-indigo-50 group-hover:bg-white border border-indigo-100 px-1.5 py-0.5 rounded-full transition-colors">
                    +20
                  </span>
                </button>
                <div className="flex-1 h-px bg-gradient-to-l from-transparent to-indigo-100" />
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default InvoiceList;