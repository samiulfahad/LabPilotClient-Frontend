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
  BadgePercent,
  Coins,
  TestTube2,
  Clock,
  DollarSign,
} from "lucide-react";
import { Link } from "react-router-dom";
import Popup from "../../components/popup";
import Modal from "../../components/modal";
import LoadingScreen from "../../components/loadingPage";
import invoiceService from "../../api/invoice";
import TimeFrame from "../../components/timeFrame";

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

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    minimumFractionDigits: 0,
  }).format(amount || 0);

// ============================================================================
// INVOICE DETAILS MODAL
// ============================================================================
const InvoiceDetailsModal = ({
  invoiceId,
  isOpen,
  onClose,
  invoice: invoiceRow,
  onEditPatient,
  onCollectDue,
  onMarkDelivered,
  onLoadingChange,
  onError,
  onPatientUpdated,
}) => {
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !invoiceId) return;
    setInvoice(null);
    setError(null);
    setLoading(true);
    invoiceService
      .getInvoiceByInvoiceId(invoiceId)
      .then((res) => setInvoice(res.data))
      .catch(() => setError("Failed to load invoice details."))
      .finally(() => setLoading(false));
  }, [isOpen, invoiceId]);

  // Row-level values (from passed invoiceRow, available immediately without waiting for fetch)
  const rowDueAmount = invoiceRow ? Math.max(0, (invoiceRow.finalPrice || 0) - (invoiceRow.paidAmount || 0)) : 0;
  const rowIsFullyPaid = rowDueAmount === 0;
  const rowHasReports = invoiceRow?.tests?.some((t) => t.schemaId);

  const dueAmount = invoice ? Math.max(0, (invoice.finalPrice || 0) - (invoice.paidAmount || 0)) : 0;
  const isFullyPaid = invoice ? dueAmount === 0 : false;
  const { date, time } = invoice ? formatDateTime(invoice.createdAt) : { date: "", time: "" };

  const referrer = invoice?.referrer;
  const hasReferrer = referrer && (referrer.name || referrer.id);
  const hasDiscount = referrer && referrer.discount > 0;
  const hasCommission = referrer && referrer.commission > 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
            <Receipt className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900 leading-tight">Invoice Details</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">#{invoiceId}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="px-5 py-5 space-y-4">
        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-4 animate-pulse">
            {/* Patient skeleton */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div className="h-3.5 bg-gray-200 rounded w-1/3" />
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="h-2.5 bg-gray-200 rounded w-1/2" />
                    <div className="h-3.5 bg-gray-200 rounded w-3/4" />
                  </div>
                ))}
              </div>
            </div>
            {/* Tests skeleton */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div className="h-3.5 bg-gray-200 rounded w-1/4" />
              {[1, 2].map((i) => (
                <div key={i} className="flex justify-between items-center bg-white rounded-lg p-3">
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                  <div className="h-3 bg-gray-200 rounded w-1/5" />
                </div>
              ))}
            </div>
            {/* Payment skeleton */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <div className="h-3.5 bg-gray-200 rounded w-1/3" />
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex justify-between">
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-200 rounded w-1/4" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-400" />
            </div>
            <p className="text-sm text-gray-500">{error}</p>
            <button
              onClick={() => {
                setError(null);
                setLoading(true);
                invoiceService
                  .getInvoiceByInvoiceId(invoiceId)
                  .then((res) => setInvoice(res.data))
                  .catch(() => setError("Failed to load invoice details."))
                  .finally(() => setLoading(false));
              }}
              className="text-xs font-semibold text-indigo-600 hover:underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Content */}
        {invoice && !loading && (
          <>
            {/* Patient Info */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <UserCircle className="w-3.5 h-3.5 text-indigo-500" />
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Patient</span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Name</p>
                  <p className="font-semibold text-gray-900 text-xs leading-snug">{invoice.patientName}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Gender</p>
                  <p className="font-semibold text-gray-900 text-xs capitalize">{invoice.gender}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Age</p>
                  <p className="font-semibold text-gray-900 text-xs">{invoice.age} yrs</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Contact</p>
                  <p className="font-semibold text-gray-900 text-xs">{invoice.contactNumber}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Date & Time</p>
                  <p className="font-semibold text-gray-900 text-xs">
                    {date} · {time}
                  </p>
                </div>
              </div>
            </div>

            {/* Referrer Info */}
            {hasReferrer && (
              <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="text-xs font-bold text-indigo-700 uppercase tracking-wide">Referrer</span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <div>
                    <p className="text-[10px] text-indigo-400 uppercase tracking-wide mb-0.5">Name</p>
                    <p className="font-semibold text-gray-900 text-xs">{referrer.name || "—"}</p>
                  </div>
                  {referrer.type && (
                    <div>
                      <p className="text-[10px] text-indigo-400 uppercase tracking-wide mb-0.5">Type</p>
                      <span
                        className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded capitalize ${
                          referrer.type === "doctor"
                            ? "bg-blue-100 text-blue-700"
                            : referrer.type === "agent"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-teal-100 text-teal-700"
                        }`}
                      >
                        {referrer.type}
                      </span>
                    </div>
                  )}
                  {hasDiscount && (
                    <div>
                      <p className="text-[10px] text-indigo-400 uppercase tracking-wide mb-0.5">Discount Given</p>
                      <p className="font-semibold text-red-600 text-xs">- {formatCurrency(referrer.discount)}</p>
                    </div>
                  )}
                  {hasCommission && (
                    <div>
                      <p className="text-[10px] text-indigo-400 uppercase tracking-wide mb-0.5">Commission</p>
                      <p className="font-semibold text-indigo-600 text-xs">{formatCurrency(referrer.commission)}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tests */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TestTube2 className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Tests</span>
                </div>
                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-semibold rounded-full">
                  {invoice.tests?.length || 0}
                </span>
              </div>
              <div className="space-y-1.5">
                {invoice.tests?.map((test, i) => (
                  <div
                    key={test.testId || i}
                    className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-gray-100"
                  >
                    <span className="text-xs text-gray-800 font-medium">{test.name}</span>
                    <span className="text-xs font-semibold text-indigo-600">{formatCurrency(test.price)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Summary */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-3.5 h-3.5 text-indigo-500" />
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Payment</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(invoice.totalAmount)}</span>
                </div>
                {invoice.priceAfterReferrerDiscount !== invoice.totalAmount && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Referrer Discount</span>
                      <span className="text-red-500 font-semibold">
                        - {formatCurrency(invoice.totalAmount - invoice.priceAfterReferrerDiscount)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">After Discount</span>
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(invoice.priceAfterReferrerDiscount)}
                      </span>
                    </div>
                  </>
                )}
                {invoice.labAdjustmentAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Lab Adjustment</span>
                    <span className="text-red-500 font-semibold">- {formatCurrency(invoice.labAdjustmentAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="font-bold text-gray-800">Total</span>
                  <span className="font-bold text-indigo-600 text-sm">{formatCurrency(invoice.finalPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                    Paid
                  </span>
                  <span className="font-semibold text-green-600">{formatCurrency(invoice.paidAmount)}</span>
                </div>
                {!isFullyPaid ? (
                  <div className="flex justify-between">
                    <span className="text-gray-500 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
                      Due
                    </span>
                    <span className="font-semibold text-red-500">{formatCurrency(dueAmount)}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-end gap-1.5 text-green-600">
                    <CheckCircle2 className="w-3 h-3" />
                    <span className="text-[10px] font-semibold">Fully Paid</span>
                  </div>
                )}
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center gap-2">
              <span
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold border ${
                  invoice.isDelivered
                    ? "bg-blue-50 text-blue-600 border-blue-100"
                    : "bg-gray-50 text-gray-500 border-gray-200"
                }`}
              >
                <PackageCheck className="w-3.5 h-3.5" />
                {invoice.isDelivered ? "Delivered" : "Not Delivered"}
              </span>
              <span
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold border ${
                  isFullyPaid ? "bg-green-50 text-green-600 border-green-100" : "bg-red-50 text-red-500 border-red-100"
                }`}
              >
                <Wallet className="w-3.5 h-3.5" />
                {isFullyPaid ? "Fully Paid" : `Due ৳${dueAmount.toLocaleString()}`}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Footer — always shown once invoiceId is present */}
      {invoiceRow && (
        <div className="px-5 pb-5 space-y-2">
          {/* Primary actions row */}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="py-2.5 px-4 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
            >
              Close
            </button>
            <Link
              to={`/invoice/print/${invoiceId}`}
              className="flex-1 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors text-center"
            >
              Open Invoice
            </Link>
            {rowHasReports && (
              <Link
                to="/reports"
                state={{ invoiceId }}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-colors text-center flex items-center justify-center gap-1.5"
              >
                <FlaskConical className="w-3.5 h-3.5" />
                Reports
              </Link>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
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
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
            <User className="w-4 h-4 text-indigo-600" />
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
  const [viewingDetails, setViewingDetails] = useState(false);

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

      <InvoiceDetailsModal
        invoiceId={invoice.invoiceId}
        isOpen={viewingDetails}
        onClose={() => setViewingDetails(false)}
        invoice={invoice}
        onEditPatient={() => setEditingPatient(true)}
        onCollectDue={() => setCollectingDue(true)}
        onMarkDelivered={() => setConfirming(true)}
        onLoadingChange={onLoadingChange}
        onError={onError}
        onPatientUpdated={onPatientUpdated}
      />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-indigo-100 transition-all duration-200 overflow-hidden">
        {/* ── Header strip ───────────────────────────────────────────── */}
        <div className="flex items-center gap-3 px-4 pt-3.5 pb-3">
          {/* Index badge */}
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-sm">
            <span className="text-[11px] font-bold text-white">{index + 1}</span>
          </div>

          {/* Name + meta */}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 text-sm leading-tight truncate">{invoice.patientName}</p>
            <p className="text-[11px] text-gray-400 mt-0.5 truncate">
              #{invoice.invoiceId} · {date} · {time}
            </p>
          </div>

          {/* Status pills — always visible */}
          <div className="flex items-center gap-1.5 shrink-0">
            <PaymentBadge />
            {invoice.isDelivered && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 text-[10px] font-semibold">
                <PackageCheck className="w-3 h-3" />
                <span className="hidden sm:inline">Delivered</span>
              </span>
            )}
          </div>
        </div>

        {/* ── Action buttons — always visible on all screen sizes ─────── */}
        <div className="px-3 pb-3 flex items-center gap-1.5 flex-wrap">
          {/* Details */}
          <button
            onClick={() => setViewingDetails(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-100 transition-all"
          >
            <Eye className="w-3.5 h-3.5" />
            Details
          </button>

          {/* Invoice */}
          <Link
            to={`/invoice/print/${invoice.invoiceId}`}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 transition-all"
          >
            <FileText className="w-3.5 h-3.5" />
            Invoice
          </Link>

          {/* Reports — only when available */}
          {hasReports && (
            <Link
              to="/reports"
              state={{ invoiceId: invoice.invoiceId }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-sm transition-all"
            >
              <FlaskConical className="w-3.5 h-3.5" />
              Reports
            </Link>
          )}

          {/* Spacer pushes remaining buttons right */}
          <div className="flex-1" />

          {/* Edit */}
          <button
            onClick={() => setEditingPatient(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 border border-gray-200 transition-all"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </button>

          {/* Collect due */}
          {!isFullyPaid && (
            <button
              onClick={() => setCollectingDue(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all"
            >
              <Banknote className="w-3.5 h-3.5" />
              Collect
            </button>
          )}

          {/* Mark delivered */}
          {!invoice.isDelivered && (
            <button
              onClick={() => setConfirming(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-100 transition-all"
            >
              <PackageCheck className="w-3.5 h-3.5" />
              Deliver
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
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [loadingMessage, setLoadingMessage] = useState(null);
  const [popup, setPopup] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [timeRange, setTimeRange] = useState(null);

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

  useEffect(() => {
    const now = new Date();
    const initial = {
      start: new Date(now).setHours(0, 0, 0, 0),
      end: new Date(now).setHours(23, 59, 59, 999),
    };
    setTimeRange(initial);
    loadInvoices(null, true, initial);
  }, []);

  const handleFetchData = (start, end) => {
    const range = { start, end };
    setTimeRange(range);
    setStatusFilter("all");
    loadInvoices(null, true, range);
  };

  const handleLoadMore = () => {
    if (hasMore && !loadingMore) loadInvoices(nextCursor, false);
  };

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
              {statusFilter !== "all" ? "No invoices found" : "No invoices for this period"}
            </h3>
            <p className="text-gray-500 text-sm mb-4 max-w-sm mx-auto">
              {statusFilter !== "all"
                ? "Try changing the filter"
                : "No invoices were created in the selected timeframe"}
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
