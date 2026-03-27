/**
 * useCallback / useMemo are intentionally absent throughout this file.
 * babel-plugin-react-compiler handles all memoization automatically.
 */
import { useState, useEffect } from "react";
import {
  Search,
  Printer,
  Upload,
  User,
  Phone,
  FlaskConical,
  FileText,
  CheckCircle2,
  Wallet,
  X,
  ChevronRight,
  Pencil,
  Calendar,
  ClipboardList,
  Check,
  Loader2,
} from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import Popup from "../../components/popup";
import invoiceService from "../../api/invoice";
import reportService from "../../api/report";

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const Skeleton = ({ className = "", style = {} }) => (
  <div
    className={`rounded-lg ${className}`}
    style={{
      background: "linear-gradient(90deg, #e4e7ed 25%, #f2f4f7 50%, #e4e7ed 75%)",
      backgroundSize: "200% 100%",
      animation: "rp-shimmer 1.5s infinite",
      ...style,
    }}
  />
);

const InvoiceSkeleton = () => (
  <>
    <style>{`@keyframes rp-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-100 to-purple-100 px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <Skeleton style={{ height: 8, width: 60 }} />
            <Skeleton style={{ height: 22, width: 120 }} />
            <Skeleton style={{ height: 8, width: 160 }} />
          </div>
          <div className="space-y-2 text-right flex flex-col items-end">
            <Skeleton style={{ height: 8, width: 70 }} />
            <Skeleton style={{ height: 28, width: 100 }} />
            <Skeleton style={{ height: 24, width: 80, borderRadius: 6 }} />
          </div>
        </div>
      </div>
      <div className="px-6 py-4 border-b border-gray-100">
        <Skeleton style={{ height: 8, width: 60, marginBottom: 14 }} />
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              {i < 2 && <Skeleton style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0 }} />}
              <div className="space-y-1.5 flex-1">
                <Skeleton style={{ height: 7, width: "45%" }} />
                <Skeleton style={{ height: 13, width: "75%" }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="px-6 py-4 border-b border-gray-100">
        <Skeleton style={{ height: 8, width: 160, marginBottom: 14 }} />
        <div className="space-y-2">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-100 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Skeleton style={{ width: 10, height: 10, borderRadius: "50%", flexShrink: 0 }} />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton style={{ height: 12, width: "55%" }} />
                    <Skeleton style={{ height: 9, width: "25%" }} />
                  </div>
                </div>
                <Skeleton style={{ height: 30, width: 70, borderRadius: 8, flexShrink: 0 }} />
              </div>
              <div className="mt-2 pt-2 border-t border-gray-100 flex gap-3">
                <div className="space-y-1">
                  <Skeleton style={{ height: 8, width: 70 }} />
                  <Skeleton style={{ height: 28, width: 130, borderRadius: 8 }} />
                </div>
                <div className="space-y-1">
                  <Skeleton style={{ height: 8, width: 70 }} />
                  <Skeleton style={{ height: 28, width: 130, borderRadius: 8 }} />
                </div>
                <Skeleton style={{ height: 28, width: 60, borderRadius: 8, alignSelf: "flex-end" }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="px-6 py-4">
        <Skeleton style={{ height: 8, width: 100, marginBottom: 14 }} />
        <div className="space-y-2">
          <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 rounded-xl">
            <Skeleton style={{ height: 12, width: "40%" }} />
            <Skeleton style={{ height: 12, width: "15%" }} />
          </div>
        </div>
      </div>
    </div>
  </>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
    date: `${day}${suffix} ${d.toLocaleString("default", { month: "long" })}, ${d.getFullYear()}`,
    time: `${h % 12 === 0 ? 12 : h % 12}:${String(d.getMinutes()).padStart(2, "0")}${h >= 12 ? "PM" : "AM"}`,
  };
};

const toInputDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return isNaN(d) ? "" : d.toISOString().slice(0, 10);
};

// ─── Date Editor ──────────────────────────────────────────────────────────────

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
    } catch {
      setError("Failed to save dates");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-2 pt-2 border-t border-gray-100">
      <div className="flex flex-wrap items-end gap-3">
        <DateField
          icon={Calendar}
          iconColor="text-indigo-400"
          label="Sample Date"
          value={sampleDate}
          onChange={setSampleDate}
          focusColor="indigo"
        />
        <DateField
          icon={ClipboardList}
          iconColor="text-emerald-500"
          label="Report Date"
          value={reportDate}
          onChange={setReportDate}
          focusColor="emerald"
        />
        <button
          onClick={handleSave}
          disabled={saving || !isDirty || (!sampleDate && !reportDate)}
          className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-indigo-600 hover:bg-indigo-700 text-white self-end"
        >
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
    </div>
  );
};

const DateField = ({ icon: Icon, iconColor, label, value, onChange, focusColor }) => (
  <div className="flex flex-col gap-0.5">
    <label className="flex items-center gap-1 text-[10px] font-medium text-gray-400 uppercase tracking-wide">
      <Icon className={`w-3 h-3 ${iconColor}`} />
      {label}
    </label>
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-${focusColor}-100 focus:border-${focusColor}-400 bg-white text-gray-700 cursor-pointer`}
    />
  </div>
);

// ─── Test Action Buttons ──────────────────────────────────────────────────────

const TestActions = ({ invoice, test }) => {
  const testId = test.testId?.$oid || test.testId;

  if (!test.isCompleted) {
    return (
      <Link
        to="/report-upload"
        state={{ invoiceId: invoice.invoiceId, testId, testName: test.name, invoice }}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors"
      >
        <Upload className="w-3.5 h-3.5" /> Upload
      </Link>
    );
  }

  const padUrl = `/report-download?invoiceId=${invoice.invoiceId}&testId=${testId}&testName=${encodeURIComponent(test.name)}&printType=PAD`;
  const plainUrl = `/report-download?invoiceId=${invoice.invoiceId}&testId=${testId}&testName=${encodeURIComponent(test.name)}&printType=PLAIN`;

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <Link
        to={padUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 hover:bg-violet-100 text-violet-700 text-xs font-semibold rounded-lg border border-violet-200 transition-colors"
      >
        <Printer className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Print (Pad)</span>
      </Link>
      <Link
        to={plainUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-200 transition-colors"
      >
        <Printer className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Print (Plain A4)</span>
      </Link>
      <Link
        to="/report-upload"
        state={{ invoiceId: invoice.invoiceId, testId, testName: test.name, invoice, isEdit: true }}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg border border-blue-200 transition-colors"
      >
        <Pencil className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Edit</span>
      </Link>
    </div>
  );
};

// ─── Invoice Detail Card ──────────────────────────────────────────────────────

const InvoiceDetail = ({ invoice, onDatesSaved }) => {
  const { date, time } = formatDateTime(invoice.createdAt);
  const amount = invoice.amount ?? {};
  const final = Number(amount.final) || 0;
  const paid = Number(amount.paid) || 0;
  const initial = Number(amount.initial) || 0;
  const due = Math.max(0, final - paid);

  const onlineTests = invoice.tests.filter((t) => t.schemaId);
  const offlineTests = invoice.tests.filter((t) => !t.schemaId);
  const completedCount = onlineTests.filter((t) => t.isCompleted).length;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
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
            <p className="text-white text-2xl font-bold">৳{final.toLocaleString()}</p>
            {final < initial && <p className="text-indigo-300 text-xs line-through">৳{initial.toLocaleString()}</p>}
            <div className="mt-2">
              {due === 0 ? (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-green-400/20 text-green-200 border border-green-400/30 text-xs font-semibold">
                  <CheckCircle2 className="w-3 h-3" /> Fully Paid
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-red-400/20 text-red-200 border border-red-400/30 text-xs font-semibold">
                  <Wallet className="w-3 h-3" /> Due ৳{due.toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Patient */}
      <div className="px-6 py-4 border-b border-gray-100">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Patient</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-50 rounded-lg">
              <User className="w-3.5 h-3.5 text-indigo-500" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400">Name</p>
              <p className="text-sm font-semibold text-gray-900">{invoice.patient?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-50 rounded-lg">
              <Phone className="w-3.5 h-3.5 text-indigo-500" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400">Contact</p>
              <p className="text-sm font-semibold text-gray-900">{invoice.patient?.contactNumber}</p>
            </div>
          </div>
          <div>
            <p className="text-[10px] text-gray-400">Gender</p>
            <p className="text-sm font-medium text-gray-700 capitalize">{invoice.patient?.gender}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400">Age</p>
            <p className="text-sm font-medium text-gray-700">{invoice.patient?.age} years</p>
          </div>
        </div>
      </div>

      {/* Online Tests */}
      {onlineTests.length > 0 && (
        <div className="px-6 py-4 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1.5 mb-3">
            <FlaskConical className="w-3.5 h-3.5 text-indigo-400" />
            Online Tests ({completedCount}/{onlineTests.length} done)
          </p>
          <div className="space-y-2">
            {onlineTests.map((test, i) => {
              const testId = test.testId?.$oid || test.testId;
              return (
                <div
                  key={testId || i}
                  className={`rounded-xl border px-4 py-3 transition-colors ${test.isCompleted ? "border-emerald-100 bg-emerald-50/40" : "border-gray-100"}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-2.5 h-2.5 rounded-full shrink-0 ${test.isCompleted ? "bg-emerald-400" : "bg-amber-400"}`}
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
            <FileText className="w-3.5 h-3.5 text-gray-400" /> Offline Tests
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

// ─── Main ─────────────────────────────────────────────────────────────────────

const Report = () => {
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
      const res = await invoiceService.getReportSummary(String(id));
      setInvoice(res.data);
    } catch (err) {
      if (err?.response?.status === 404) setNotFound(true);
      else setPopup({ type: "error", message: "Invoice NOT Found" });
    } finally {
      setSearching(false);
    }
  };

  // Fetch invoice on mount if an invoiceId was passed via location state
  useEffect(() => {
    const id = location.state?.invoiceId;
    if (id) {
      const idStr = String(id);
      setSearchQuery(idStr);
      fetchInvoice(idStr);
    }
  }, []);

  const handleSearch = () => {
    const q = searchQuery.trim();
    if (q) fetchInvoice(q);
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
        return id !== testId ? t : { ...t, report: { ...(t.report ?? {}), ...dates } };
      }),
    }));
    setPopup({ type: "success", message: "Dates saved" });
  };

  return (
    <section className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 px-4 py-6">
      {popup && <Popup type={popup.type} message={popup.message} onClose={() => setPopup(null)} />}

      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Upload className="w-7 h-7 text-indigo-600" /> Upload and Download Reports
          </h1>
        </div>

        {/* Search */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Enter invoice ID... e.g. APX8743"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
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
              <ChevronRight className="w-4 h-4" /> Search
            </button>
          </div>
        </div>

        {searching && <InvoiceSkeleton />}

        {!searching && notFound && (
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

        {!searching && invoice && <InvoiceDetail invoice={invoice} onDatesSaved={handleDatesSaved} />}
      </div>
    </section>
  );
};

export default Report;
