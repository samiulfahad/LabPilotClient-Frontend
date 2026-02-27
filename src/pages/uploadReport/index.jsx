import { useState } from "react";
import {
  Search,
  Upload,
  User,
  Phone,
  FlaskConical,
  FileText,
  CheckCircle2,
  Clock,
  X,
  ChevronRight,
} from "lucide-react";
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

// ============================================================================
// REPORT UPLOAD MODAL
// ============================================================================
const ReportUploadModal = ({ invoice, test, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState(null);

  // reportData will hold the dynamic fields from the schema
  // For now it's a placeholder — wire this to your actual schema fields
  const [reportData, setReportData] = useState({});

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await invoiceService.uploadReport({
        invoiceId: invoice.invoiceId,
        testId: test.testId,
        reportData,
      });
      onSuccess(test);
    } catch (e) {
      setPopup({ type: "error", message: "Failed to upload report" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      {loading && <LoadingScreen message="Uploading report..." />}
      {popup && <Popup type={popup.type} message={popup.message} onClose={() => setPopup(null)} />}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">Upload Report</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {test.name} — {invoice.patientName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body — placeholder for schema-driven fields */}
        <div className="px-6 py-5">
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-xs text-amber-700 mb-4">
            Schema ID: <span className="font-mono font-semibold">{test.schemaId?.$oid || test.schemaId}</span>
          </div>
          <p className="text-sm text-gray-500 text-center py-4">
            Wire schema fields here based on <span className="font-semibold text-gray-700">schemaId</span>.
          </p>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 pb-5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Submit Report
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// INVOICE DETAIL CARD
// ============================================================================
const InvoiceDetail = ({ invoice, onUploadSuccess }) => {
  const [uploadTarget, setUploadTarget] = useState(null); // { invoice, test }
  const { date, time } = formatInvoiceDateTime(invoice.invoiceId);

  const onlineTests = invoice.tests.filter((t) => t.schemaId);
  const offlineTests = invoice.tests.filter((t) => !t.schemaId);
  const completedCount = onlineTests.filter((t) => t.isCompleted).length;

  const handleUploadSuccess = (test) => {
    setUploadTarget(null);
    onUploadSuccess(test);
  };

  return (
    <>
      {uploadTarget && (
        <ReportUploadModal
          invoice={uploadTarget.invoice}
          test={uploadTarget.test}
          onClose={() => setUploadTarget(null)}
          onSuccess={handleUploadSuccess}
        />
      )}

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
              <p className="text-white text-2xl font-bold">৳{invoice.finalPrice.toLocaleString()}</p>
              {invoice.finalPrice < invoice.totalAmount && (
                <p className="text-indigo-300 text-xs line-through">৳{invoice.totalAmount.toLocaleString()}</p>
              )}
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
              {onlineTests.map((test, i) => (
                <div
                  key={test.testId?.$oid || i}
                  className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 px-4 py-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-2.5 h-2.5 rounded-full shrink-0 ${test.isCompleted ? "bg-green-400" : "bg-amber-400"}`}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{test.name}</p>
                      <p className="text-xs text-gray-400">৳{test.price.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="shrink-0">
                    {test.isCompleted ? (
                      <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-3 py-1.5 rounded-lg">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Completed
                      </span>
                    ) : (
                      <button
                        onClick={() => setUploadTarget({ invoice, test })}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        Upload Report
                      </button>
                    )}
                  </div>
                </div>
              ))}
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
    </>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
const UploadReport = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [invoice, setInvoice] = useState(null);
  const [searching, setSearching] = useState(false);
  const [popup, setPopup] = useState(null);
  const [notFound, setNotFound] = useState(false);

  const handleSearch = async () => {
    const q = searchQuery.trim();
    if (!q) return;

    try {
      setSearching(true);
      setNotFound(false);
      setInvoice(null);
      const response = await invoiceService.getInvoiceByInvoiceId(q);
      setInvoice(response.data);
    } catch (e) {
      if (e?.response?.status === 404) {
        setNotFound(true);
      } else {
        setPopup({ type: "error", message: "Failed to search invoice" });
      }
    } finally {
      setSearching(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleClear = () => {
    setSearchQuery("");
    setInvoice(null);
    setNotFound(false);
  };

  const handleUploadSuccess = (test) => {
    // Mark test as completed in local state
    setInvoice((prev) => ({
      ...prev,
      tests: prev.tests.map((t) =>
        (t.testId?.$oid || t.testId) === (test.testId?.$oid || test.testId) ? { ...t, isCompleted: true } : t,
      ),
    }));
    setPopup({ type: "success", message: `Report uploaded for ${test.name}` });
  };

  return (
    <section className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 px-4 py-6">
      {searching && <LoadingScreen message="Searching invoice..." />}

      {popup && <Popup type={popup.type} message={popup.message} onClose={() => setPopup(null)} />}

      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Upload className="w-7 h-7 text-indigo-600" />
            Upload Report
          </h1>
          <p className="text-sm text-gray-500 mt-1">Search by invoice ID to upload a patient report</p>
        </div>

        {/* Search Box */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Enter invoice ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full pl-11 pr-10 py-2.5 text-sm border border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all placeholder-gray-400 font-mono"
              />
              {searchQuery && (
                <button
                  onClick={handleClear}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              onClick={handleSearch}
              disabled={!searchQuery.trim() || searching}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shrink-0"
            >
              <ChevronRight className="w-4 h-4" />
              Search
            </button>
          </div>
        </div>

        {/* Not Found */}
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

        {/* Invoice Detail */}
        {invoice && <InvoiceDetail invoice={invoice} onUploadSuccess={handleUploadSuccess} />}
      </div>
    </section>
  );
};

export default UploadReport;
