import { useEffect, useState } from "react";
import {
  FileText,
  Search,
  X,
  Upload,
  Eye,
  Edit,
  Download,
  ChevronDown,
  ChevronUp,
  Activity,
  CheckCircle2,
  Clock,
  FlaskConical,
  ArrowLeft,
  Plus,
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
    time: `${displayHour}:${minutes}${ampm}`,
  };
};

// ============================================================================
// SKELETON
// ============================================================================
const SkeletonInvoice = () => (
  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4 flex-1">
        <div className="w-8 h-8 rounded-lg bg-gray-200" />
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
        </div>
      </div>
      <div className="h-8 w-20 bg-gray-200 rounded-lg" />
    </div>
  </div>
);

// ============================================================================
// INVOICE ROW
// ============================================================================
const InvoiceRow = ({ invoice, index, onAction }) => {
  const [expanded, setExpanded] = useState(false);

  const onlineTests = invoice.tests.filter((t) => t.schemaId);
  const offlineTests = invoice.tests.filter((t) => !t.schemaId);
  const completedCount = onlineTests.filter((t) => t.isCompleted).length;
  const { date, time } = formatInvoiceDateTime(invoice.invoiceId);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
      {/* Main Row */}
      <div className="flex items-center gap-3 p-4">
        {/* Index */}
        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
          <span className="text-xs font-bold text-indigo-600">{index + 1}</span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="font-semibold text-gray-900 text-sm">{invoice.patientName}</span>
            <span className="text-[10px] font-mono bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md">
              #{invoice.invoiceId}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
            <span>
              {date} · {time}
            </span>
            {onlineTests.length > 0 && (
              <span className="flex items-center gap-1">
                <FlaskConical className="w-3 h-3 text-indigo-400" />
                <span className="text-indigo-600 font-medium">{onlineTests.length} online</span>
              </span>
            )}
            {offlineTests.length > 0 && (
              <span className="flex items-center gap-1">
                <FileText className="w-3 h-3 text-gray-400" />
                <span className="text-gray-500">{offlineTests.length} offline</span>
              </span>
            )}
            {onlineTests.length > 0 && (
              <span className="flex items-center gap-1">
                {completedCount === onlineTests.length ? (
                  <CheckCircle2 className="w-3 h-3 text-green-500" />
                ) : (
                  <Clock className="w-3 h-3 text-amber-400" />
                )}
                <span
                  className={completedCount === onlineTests.length ? "text-green-600 font-medium" : "text-amber-600"}
                >
                  {completedCount}/{onlineTests.length} done
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Amount */}
        <div className="text-right shrink-0 hidden sm:block">
          <p className="text-sm font-bold text-gray-900">৳{invoice.finalPrice.toLocaleString()}</p>
          {invoice.finalPrice < invoice.totalAmount && (
            <p className="text-xs text-gray-400 line-through">৳{invoice.totalAmount.toLocaleString()}</p>
          )}
        </div>

        {/* Expand toggle */}
        {onlineTests.length > 0 && (
          <button
            onClick={() => setExpanded((p) => !p)}
            className="ml-1 p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-indigo-600 transition-colors shrink-0"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Expanded: Online Tests */}
      {expanded && onlineTests.length > 0 && (
        <div className="border-t border-gray-100 px-4 pb-4 pt-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Online Tests</p>
          <div className="space-y-2">
            {onlineTests.map((test, i) => (
              <div
                key={test.testId?.$oid || i}
                className="flex items-center justify-between gap-3 bg-gray-50 rounded-lg px-3 py-2.5"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={`w-2 h-2 rounded-full shrink-0 ${test.isCompleted ? "bg-green-400" : "bg-amber-400"}`}
                  />
                  <span className="text-sm text-gray-800 font-medium truncate">{test.name}</span>
                  <span className="text-xs text-gray-400 shrink-0">৳{test.price.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {!test.isCompleted ? (
                    <button
                      onClick={() => onAction("upload", invoice, test)}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors"
                    >
                      <Upload className="w-3 h-3" />
                      Upload
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => onAction("view", invoice, test)}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition-colors"
                      >
                        <Eye className="w-3 h-3" />
                        View
                      </button>
                      <button
                        onClick={() => onAction("edit", invoice, test)}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg transition-colors"
                      >
                        <Edit className="w-3 h-3" />
                        Edit
                      </button>
                      <button
                        onClick={() => onAction("download", invoice, test)}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-600 hover:bg-gray-700 text-white text-xs font-semibold rounded-lg transition-colors"
                      >
                        <Download className="w-3 h-3" />
                        PDF
                      </button>
                    </>
                  )}
                </div>
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

  // Stats
  const total = invoices.length;
  const pending = invoices.filter((inv) => inv.tests.some((t) => t.schemaId && !t.isCompleted)).length;
  const completed = invoices.filter((inv) => inv.tests.filter((t) => t.schemaId).every((t) => t.isCompleted)).length;
  const stats = { total, pending, completed };

  // Filtered list
  let filteredInvoices = [...invoices];

  if (statusFilter === "pending") {
    filteredInvoices = filteredInvoices.filter((inv) => inv.tests.some((t) => t.schemaId && !t.isCompleted));
  } else if (statusFilter === "completed") {
    filteredInvoices = filteredInvoices.filter((inv) =>
      inv.tests.filter((t) => t.schemaId).every((t) => t.isCompleted),
    );
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filteredInvoices = filteredInvoices.filter(
      (inv) =>
        inv.patientName.toLowerCase().includes(q) || String(inv.invoiceId).includes(q) || inv.contactNumber.includes(q),
    );
  }

  const handleAction = (action, invoice, test) => {
    // Wire up: "upload" | "view" | "edit" | "download"
    console.log(action, invoice.invoiceId, test.name);
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
          <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-50 rounded-lg">
                <FileText className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Total</p>
                {initialLoading ? (
                  <div className="h-7 w-10 bg-gray-200 rounded animate-pulse" />
                ) : (
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                )}
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-50 rounded-lg">
                <Clock className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Pending</p>
                {initialLoading ? (
                  <div className="h-7 w-10 bg-gray-200 rounded animate-pulse" />
                ) : (
                  <p className="text-2xl font-bold text-amber-500">{stats.pending}</p>
                )}
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-50 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Completed</p>
                {initialLoading ? (
                  <div className="h-7 w-10 bg-gray-200 rounded animate-pulse" />
                ) : (
                  <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm font-semibold text-gray-700">Status:</span>
            <div className="flex rounded-lg bg-gray-100 p-1">
              {["all", "pending", "completed"].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  disabled={initialLoading}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all capitalize ${
                    statusFilter === s ? "bg-white text-indigo-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
                  } ${initialLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {s}
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
              placeholder="Search by name, invoice ID, or contact number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={initialLoading}
              className="w-full pl-11 pr-11 py-2.5 text-sm border border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all placeholder-gray-400 disabled:bg-gray-50 disabled:cursor-not-allowed"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                disabled={initialLoading}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
              <InvoiceRow key={invoice._id} invoice={invoice} index={index} onAction={handleAction} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default InvoiceList;
