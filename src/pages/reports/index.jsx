import { useState, useEffect } from "react";
import {
  Search,
  Upload,
  User,
  Phone,
  FlaskConical,
  FileText,
  CheckCircle2,
  Wallet,
  X,
  ChevronRight,
  Eye,
  Pencil,
  Calendar,
  ClipboardList,
  Check,
  Loader2,
} from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import Popup from "../../components/popup";
import LoadingScreen from "../../components/loadingPage";
import invoiceService from "../../api/invoice";
import reportService from "../../api/report";

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
  const month = date.toLocaleString("default", { month: "long" });
  const year = date.getFullYear();
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 === 0 ? 12 : hours % 12;
  return {
    date: `${day}${suffix} ${month}, ${year}`,
    time: `${displayHour}:${minutes}${ampm}`,
  };
};

const toInputDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d)) return "";
  return d.toISOString().slice(0, 10);
};

// ============================================================================
// DATE EDITOR
// ============================================================================
const DateEditor = ({ invoiceId, testId, initialSampleDate, initialReportDate, onSaved }) => {
  const [sampleDate, setSampleDate] = useState(toInputDate(initialSampleDate));
  const [reportDate, setReportDate] = useState(toInputDate(initialReportDate));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const isDirty = toInputDate(initialSampleDate) !== sampleDate || toInputDate(initialReportDate) !== reportDate;

  const handleSave = async () => {
    if (!sampleDate && !reportDate) return;
    try {
      setSaving(true);
      setError(null);
      await reportService.updateDates({
        invoiceId,
        testId,
        sampleCollectionDate: sampleDate || null,
        reportDate: reportDate || null,
      });
      onSaved({ sampleCollectionDate: sampleDate || null, reportDate: reportDate || null });
    } catch (e) {
      setError("Failed to save dates");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-2 pt-2 border-t border-gray-100">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-0.5">
          <label className="flex items-center gap-1 text-[10px] font-medium text-gray-400 uppercase tracking-wide">
            <Calendar className="w-3 h-3 text-indigo-400" />
            Sample Date
          </label>
          <input
            type="date"
            value={sampleDate}
            onChange={(e) => setSampleDate(e.target.value)}
            className="px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none
                       focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 bg-white
                       text-gray-700 cursor-pointer"
          />
        </div>

        <div className="flex flex-col gap-0.5">
          <label className="flex items-center gap-1 text-[10px] font-medium text-gray-400 uppercase tracking-wide">
            <ClipboardList className="w-3 h-3 text-emerald-500" />
            Report Date
          </label>
          <input
            type="date"
            value={reportDate}
            onChange={(e) => setReportDate(e.target.value)}
            className="px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none
                       focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 bg-white
                       text-gray-700 cursor-pointer"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving || !isDirty || (!sampleDate && !reportDate)}
          className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg
                     transition-colors disabled:opacity-40 disabled:cursor-not-allowed
                     bg-indigo-600 hover:bg-indigo-700 text-white self-end"
        >
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
    </div>
  );
};

// ============================================================================
// TEST ACTION BUTTONS
// ============================================================================
const TestActions = ({ invoice, test }) => {
  const uploadState = { invoice, test };
  const editState = { invoice, test, report: test.report ?? {} };

  if (!test.isCompleted) {
    return (
      <Link
        to="/report-upload"
        state={uploadState}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700
                   text-white text-xs font-semibold rounded-lg transition-colors"
      >
        <Upload className="w-3.5 h-3.5" />
        Upload
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <Link
        to="/view-report"
        state={{ report: test.report, invoice }}
        title="View Report"
        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100
                   text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-200
                   transition-colors"
      >
        <Eye className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">View</span>
      </Link>

      <Link
        to="/report-upload"
        state={editState}
        title="Edit Report"
        className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 hover:bg-violet-100
                   text-violet-700 text-xs font-semibold rounded-lg border border-violet-200
                   transition-colors"
      >
        <Pencil className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Edit</span>
      </Link>
    </div>
  );
};

// ============================================================================
// INVOICE DETAIL CARD
// ============================================================================
const InvoiceDetail = ({ invoice, onDatesSaved }) => {
  const { date, time } = formatDateTime(invoice.createdAt);
  const paidAmount = Number(invoice.paidAmount) || 0;
  const finalPrice = Number(invoice.finalPrice) || 0;
  const dueAmount = Math.max(0, finalPrice - paidAmount);

  const onlineTests = invoice.tests.filter((t) => t.schemaId);
  const offlineTests = invoice.tests.filter((t) => !t.schemaId);
  const completedCount = onlineTests.filter((t) => t.isCompleted).length;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Invoice Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-indigo-200 text-xs uppercase tracking-wide font-medium mb-1">Invoice</p>
            <p className="text-white text-xl font-bold font-mono">#{invoice.invoiceId}</p>
            <p className="text-indigo-200 text-xs mt-1">
              {date} · {time}
            </p>
          </div>
          <div className="text-right">
            <p className="text-indigo-200 text-xs mb-1">Final Amount</p>
            <p className="text-white text-2xl font-bold">৳{finalPrice.toLocaleString()}</p>
            {finalPrice < invoice.totalAmount && (
              <p className="text-indigo-300 text-xs line-through">৳{invoice.totalAmount.toLocaleString()}</p>
            )}
            <div className="mt-2">
              {dueAmount === 0 ? (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-green-400/20 text-green-200 border border-green-400/30 text-xs font-semibold">
                  <CheckCircle2 className="w-3 h-3" />
                  Fully Paid
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-red-400/20 text-red-200 border border-red-400/30 text-xs font-semibold">
                  <Wallet className="w-3 h-3" />
                  Due ৳{dueAmount.toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Patient Info */}
      <div className="px-6 py-4 border-b border-gray-100">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Patient</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-50 rounded-lg">
              <User className="w-3.5 h-3.5 text-indigo-500" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400">Name</p>
              <p className="text-sm font-semibold text-gray-900">{invoice.patientName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-50 rounded-lg">
              <Phone className="w-3.5 h-3.5 text-indigo-500" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400">Contact</p>
              <p className="text-sm font-semibold text-gray-900">{invoice.contactNumber}</p>
            </div>
          </div>
          <div>
            <p className="text-[10px] text-gray-400">Gender</p>
            <p className="text-sm font-medium text-gray-700 capitalize">{invoice.gender}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400">Age</p>
            <p className="text-sm font-medium text-gray-700">{invoice.age} years</p>
          </div>
        </div>
      </div>

      {/* Online Tests */}
      {onlineTests.length > 0 && (
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
              <FlaskConical className="w-3.5 h-3.5 text-indigo-400" />
              Online Tests ({completedCount}/{onlineTests.length} done)
            </p>
          </div>
          <div className="space-y-2">
            {onlineTests.map((test, i) => {
              const testId = test.testId?.$oid || test.testId;

              return (
                <div
                  key={testId || i}
                  className={`rounded-xl border px-4 py-3 transition-colors ${
                    test.isCompleted ? "border-emerald-100 bg-emerald-50/40" : "border-gray-100"
                  }`}
                >
                  {/* Top row */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                          test.isCompleted ? "bg-emerald-400" : "bg-amber-400"
                        }`}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{test.name}</p>
                        <p className="text-xs text-gray-400">৳{test.price.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="shrink-0">
                      <TestActions invoice={invoice} test={test} />
                    </div>
                  </div>

                  {/* Date editor — always visible for all online tests */}
                  <DateEditor
                    invoiceId={invoice.invoiceId}
                    testId={testId}
                    initialSampleDate={test.report?.sampleCollectionDate}
                    initialReportDate={test.report?.reportDate}
                    onSaved={(dates) => onDatesSaved(testId, dates)}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Offline Tests */}
      {offlineTests.length > 0 && (
        <div className="px-6 py-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1.5 mb-3">
            <FileText className="w-3.5 h-3.5 text-gray-400" />
            Offline Tests
          </p>
          <div className="space-y-2">
            {offlineTests.map((test, i) => (
              <div
                key={test.testId?.$oid || i}
                className="flex items-center justify-between px-4 py-2.5 bg-gray-50 rounded-xl"
              >
                <span className="text-sm text-gray-700 font-medium">{test.name}</span>
                <span className="text-xs text-gray-400">৳{test.price.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
const Reports = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [invoice, setInvoice] = useState(null);
  const [searching, setSearching] = useState(false);
  const [popup, setPopup] = useState(null);
  const [notFound, setNotFound] = useState(false);

  const location = useLocation();

  const fetchInvoice = async (id) => {
    try {
      setSearching(true);
      setNotFound(false);
      setInvoice(null);
      const response = await invoiceService.getInvoiceByInvoiceId(String(id));
      setInvoice(response.data);
    } catch (e) {
      if (e?.response?.status === 404) setNotFound(true);
      else setPopup({ type: "error", message: "Failed to load invoice" });
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    const id = location.state?.invoiceId;
    if (id) {
      setSearchQuery(String(id));
      fetchInvoice(id);
    }
  }, []);

  const handleSearch = () => {
    const q = searchQuery.trim();
    if (!q) return;
    fetchInvoice(q);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleClear = () => {
    setSearchQuery("");
    setInvoice(null);
    setNotFound(false);
  };

  const handleDatesSaved = (testId, dates) => {
    setInvoice((prev) => ({
      ...prev,
      tests: prev.tests.map((t) => {
        const id = t.testId?.$oid || t.testId;
        if (id !== testId) return t;
        return { ...t, report: { ...(t.report ?? {}), ...dates } };
      }),
    }));
    setPopup({ type: "success", message: "Dates saved" });
  };

  return (
    <section className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 px-4 py-6">
      {searching && <LoadingScreen message="Searching invoice..." />}
      {popup && <Popup type={popup.type} message={popup.message} onClose={() => setPopup(null)} />}

      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Upload className="w-7 h-7 text-indigo-600" />
            Upload and Download Reports
          </h1>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Enter invoice ID... e.g. APX8743"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full pl-11 pr-10 py-2.5 text-sm border border-gray-200 rounded-xl
                           focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100
                           outline-none transition-all placeholder-gray-400 font-mono"
              />
              {searchQuery && (
                <button
                  onClick={handleClear}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600
                             p-1 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              onClick={handleSearch}
              disabled={!searchQuery.trim() || searching}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold
                         rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center gap-2 shrink-0"
            >
              <ChevronRight className="w-4 h-4" />
              Search
            </button>
          </div>
        </div>

        {notFound && (
          <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-8 text-center">
            <div className="bg-red-50 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3">
              <Search className="w-6 h-6 text-red-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-800 mb-1">Invoice not found</h3>
            <p className="text-sm text-gray-500">
              No invoice found with ID <span className="font-mono font-semibold text-gray-700">#{searchQuery}</span>
            </p>
          </div>
        )}

        {invoice && <InvoiceDetail invoice={invoice} onDatesSaved={handleDatesSaved} />}
      </div>
    </section>
  );
};

export default Reports;
