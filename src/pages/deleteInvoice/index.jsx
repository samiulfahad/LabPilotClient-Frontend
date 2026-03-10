import { useEffect, useState } from "react";
import {
  Trash2,
  Search,
  AlertTriangle,
  ChevronDown,
  X,
  PackageSearch,
  User,
  Phone,
  FileText,
  FlaskConical,
  CheckCircle2,
  Wallet,
  History,
  ArrowLeft,
} from "lucide-react";
import { Link } from "react-router-dom";
import Popup from "../../components/popup";
import LoadingScreen from "../../components/loadingPage";
import invoiceService from "../../api/invoice";
import TimeFrame from "../../components/timeFrame";

// ============================================================================
// HELPERS
// ============================================================================
const formatDateTime = (ts) => {
  if (!ts) return { date: "—", time: "" };
  const date = new Date(ts);
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
// DELETE INVOICE PANEL — search + preview + confirm (delete tab)
// ============================================================================
const DeleteInvoicePanel = ({ onDeleted, onLoadingChange, onError }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [invoice, setInvoice] = useState(null);
  const [searching, setSearching] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [confirmPopup, setConfirmPopup] = useState(false);

  const fetchInvoice = async (id) => {
    try {
      setSearching(true);
      setNotFound(false);
      setInvoice(null);
      const response = await invoiceService.getInvoiceByInvoiceId(String(id).trim());
      const data = response.data;
      if (data.isDeleted) {
        setNotFound(true);
      } else {
        setInvoice(data);
      }
    } catch (e) {
      if (e?.response?.status === 404) setNotFound(true);
      else onError("Failed to load invoice.");
    } finally {
      setSearching(false);
    }
  };

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

  const handleConfirmDelete = async () => {
    setConfirmPopup(false);
    try {
      onLoadingChange("Deleting invoice...");
      await invoiceService.deleteInvoice(invoice.invoiceId);
      onDeleted(invoice.invoiceId);
      setInvoice(null);
      setSearchQuery("");
    } catch (e) {
      const msg =
        e?.response?.status === 400 ? "Invoice is already deleted." : "Failed to delete invoice. Please try again.";
      onError(msg);
    } finally {
      onLoadingChange(null);
    }
  };

  const paidAmount = Number(invoice?.paidAmount) || 0;
  const finalPrice = Number(invoice?.finalPrice) || 0;
  const dueAmount = Math.max(0, finalPrice - paidAmount);
  const onlineTests = invoice?.tests?.filter((t) => t.schemaId) ?? [];
  const offlineTests = invoice?.tests?.filter((t) => !t.schemaId) ?? [];

  return (
    <div className="space-y-4">
      {/* Confirm delete popup */}
      {confirmPopup && invoice && (
        <Popup
          type="warning"
          message={`Delete invoice #${invoice.invoiceId} for ${invoice.patientName}? It will be hidden from all active lists.`}
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={handleConfirmDelete}
          onClose={() => setConfirmPopup(false)}
        />
      )}

      {/* Search */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Search invoice to delete</p>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Enter invoice ID… e.g. APX8743"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full pl-10 pr-9 py-2.5 text-sm border border-gray-200 rounded-xl
                         focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100
                         outline-none transition-all placeholder-gray-400 font-mono"
            />
            {searchQuery && (
              <button
                onClick={handleClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 rounded transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={handleSearch}
            disabled={!searchQuery.trim() || searching}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold
                       rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            {searching ? (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin inline-block" />
            ) : (
              "Search"
            )}
          </button>
        </div>
      </div>

      {/* Not found */}
      {notFound && (
        <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-6 text-center">
          <div className="bg-red-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
            <Search className="w-5 h-5 text-red-400" />
          </div>
          <p className="text-sm font-semibold text-gray-800">Invoice not found</p>
          <p className="text-xs text-gray-400 mt-1">
            No active invoice found with ID{" "}
            <span className="font-mono font-semibold text-gray-600">#{searchQuery}</span>
          </p>
        </div>
      )}

      {/* Invoice preview */}
      {invoice && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Dark header */}
          <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-slate-400 text-[10px] uppercase tracking-wide font-medium mb-0.5">Invoice</p>
                <p className="text-white text-lg font-bold font-mono">#{invoice.invoiceId}</p>
                <p className="text-slate-400 text-xs mt-0.5">
                  {formatDateTime(invoice.createdAt).date} · {formatDateTime(invoice.createdAt).time}
                </p>
              </div>
              <div className="text-right">
                <p className="text-slate-400 text-[10px] mb-0.5">Amount</p>
                <p className="text-white text-xl font-bold">৳{finalPrice.toLocaleString()}</p>
                {dueAmount === 0 ? (
                  <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md bg-green-500/20 text-green-300 border border-green-500/30 text-[10px] font-semibold">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    Fully Paid
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md bg-red-500/20 text-red-300 border border-red-500/30 text-[10px] font-semibold">
                    <Wallet className="w-2.5 h-2.5" />
                    Due ৳{dueAmount.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Patient info */}
          <div className="px-5 py-3 border-b border-gray-100">
            <div className="flex flex-wrap gap-x-5 gap-y-1">
              <div className="flex items-center gap-1.5">
                <User className="w-3 h-3 text-gray-400" />
                <span className="text-sm font-semibold text-gray-900">{invoice.patientName}</span>
                <span className="text-xs text-gray-400 capitalize">
                  · {invoice.gender} · {invoice.age}y
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-600">{invoice.contactNumber}</span>
              </div>
            </div>
          </div>

          {/* Tests summary */}
          <div className="px-5 py-3 flex flex-wrap gap-2">
            {onlineTests.length > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-100 text-xs font-medium text-indigo-700">
                <FlaskConical className="w-3 h-3" />
                {onlineTests.length} online test{onlineTests.length !== 1 ? "s" : ""}
              </span>
            )}
            {offlineTests.length > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-200 text-xs font-medium text-gray-600">
                <FileText className="w-3 h-3" />
                {offlineTests.length} offline test{offlineTests.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* Warning + delete action */}
          <div className="px-5 pb-4">
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 mb-3">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">
                This invoice will be <span className="font-semibold">removed from all active lists</span>. You can view
                it in the Deleted History tab.
              </p>
            </div>
            <button
              onClick={() => setConfirmPopup(true)}
              className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete Invoice #{invoice.invoiceId}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// DELETED INVOICES LIST — child section (history tab)
// ============================================================================
const SkeletonRow = () => (
  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 animate-pulse">
    <div className="flex items-center gap-3">
      <div className="w-7 h-7 rounded-lg bg-gray-200 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-1/3" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
      </div>
    </div>
  </div>
);

const DeletedInvoiceRow = ({ invoice, index }) => {
  const createdDt = formatDateTime(invoice.createdAt);
  const deletedDt = formatDateTime(invoice.deletedAt);

  const finalPrice = Number(invoice.finalPrice) || 0;
  const paidAmount = Number(invoice.paidAmount) || 0;
  const dueAmount = Math.max(0, finalPrice - paidAmount);
  const onlineTests = invoice.tests?.filter((t) => t.schemaId) ?? [];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-red-50">
      {/* Top row */}
      <div className="flex items-center gap-3 px-4 pt-3.5 pb-2.5">
        <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
          <span className="text-[11px] font-bold text-red-400">{index + 1}</span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm leading-tight truncate">{invoice.patientName}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            #{invoice.invoiceId} · Created {createdDt.date}
          </p>
        </div>

        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-red-400 bg-red-50 border border-red-100 rounded-lg shrink-0">
          <Trash2 className="w-3 h-3" />
          Deleted
        </span>
      </div>

      {/* Bottom strip */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 pb-3 border-t border-gray-50">
        <span className="inline-flex items-center gap-1 text-[11px] text-red-400 font-medium">
          <History className="w-3 h-3" />
          {deletedDt.date} · {deletedDt.time}
        </span>

        <span className="w-px h-3 bg-gray-200 hidden sm:block" />

        <span className="inline-flex items-center gap-1 text-[11px] text-gray-400">
          <User className="w-3 h-3" />
          {invoice.gender} · {invoice.age}y
        </span>

        <span className="inline-flex items-center gap-1 text-[11px] text-gray-400">
          <Phone className="w-3 h-3" />
          {invoice.contactNumber}
        </span>

        <span className="w-px h-3 bg-gray-200 hidden sm:block" />

        <span className="text-[11px] font-semibold text-gray-600">
          ৳{finalPrice.toLocaleString()}
          {dueAmount > 0 && <span className="text-red-400 font-normal"> · Due ৳{dueAmount.toLocaleString()}</span>}
        </span>

        {onlineTests.length > 0 && (
          <>
            <span className="w-px h-3 bg-gray-200 hidden sm:block" />
            <span className="inline-flex items-center gap-1 text-[11px] text-gray-400">
              <FlaskConical className="w-3 h-3" />
              {onlineTests.length} online test{onlineTests.length !== 1 ? "s" : ""}
            </span>
          </>
        )}
      </div>
    </div>
  );
};

const DeletedInvoicesList = ({ refreshTrigger, onLoadingChange, onError }) => {
  const [invoices, setInvoices] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [timeRange, setTimeRange] = useState(null);

  const loadInvoices = async (cursor = null, replace = true, range = timeRange) => {
    try {
      if (replace) setInitialLoading(true);
      else {
        setLoadingMore(true);
        onLoadingChange("Loading more...");
      }

      const response = await invoiceService.getDeletedInvoices({
        cursor,
        limit: 20,
        ...(range && { startDate: range.start, endDate: range.end }),
      });
      const { invoices: newInvoices, nextCursor: nc, hasMore: hm } = response.data;

      setInvoices((prev) => (replace ? newInvoices : [...prev, ...newInvoices]));
      setNextCursor(nc);
      setHasMore(hm);
    } catch {
      onError("Could not load deleted invoices.");
    } finally {
      setInitialLoading(false);
      setLoadingMore(false);
      onLoadingChange(null);
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

  // Re-fetch when parent signals a new deletion
  useEffect(() => {
    if (refreshTrigger === 0) return;
    loadInvoices(null, true, timeRange);
  }, [refreshTrigger]);

  const handleFetchData = (start, end) => {
    const range = { start, end };
    setTimeRange(range);
    loadInvoices(null, true, range);
  };

  const handleLoadMore = () => {
    if (hasMore && !loadingMore) loadInvoices(nextCursor, false);
  };

  return (
    <div className="space-y-4">
      <TimeFrame onFetchData={handleFetchData} />

      {!initialLoading && (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 shadow-sm">
            <PackageSearch className="w-3.5 h-3.5 text-red-400" />
            {invoices.length} deleted invoice{invoices.length !== 1 ? "s" : ""} loaded
            {hasMore && <span className="text-gray-400 font-normal ml-1">· more available</span>}
          </span>
        </div>
      )}

      {initialLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      ) : invoices.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10 text-center">
          <div className="bg-red-50 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3">
            <Trash2 className="w-7 h-7 text-red-300" />
          </div>
          <p className="text-sm font-semibold text-gray-800">No deleted invoices</p>
          <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
            No invoices were deleted in the selected time period.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map((invoice, index) => (
            <DeletedInvoiceRow key={invoice._id} invoice={invoice} index={index} />
          ))}

          {hasMore && (
            <div className="flex items-center gap-3 pt-2 pb-1">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent to-red-100" />
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="group flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border border-red-200
                           hover:border-red-400 hover:bg-red-50 shadow-sm hover:shadow-md transition-all
                           duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronDown className="w-3.5 h-3.5 text-red-400 group-hover:translate-y-0.5 transition-transform duration-200" />
                <span className="text-xs font-semibold text-red-500">Load more</span>
                <span className="text-[10px] font-medium text-red-400 bg-red-50 group-hover:bg-white border border-red-100 px-1.5 py-0.5 rounded-full transition-colors">
                  +20
                </span>
              </button>
              <div className="flex-1 h-px bg-gradient-to-l from-transparent to-red-100" />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// MAIN PAGE — DeleteInvoices
// ============================================================================
const TABS = [
  { key: "delete", label: "Delete Invoice", Icon: Trash2 },
  { key: "history", label: "Deleted History", Icon: History },
];

const DeleteInvoices = () => {
  const [activeTab, setActiveTab] = useState("delete");
  const [loadingMessage, setLoadingMessage] = useState(null);
  const [popup, setPopup] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleDeleted = (invoiceId) => {
    setPopup({ type: "success", message: `Invoice #${invoiceId} has been deleted.` });
    setRefreshTrigger((n) => n + 1);
    setActiveTab("history");
  };

  return (
    <section className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 px-4 py-6">
      {loadingMessage && <LoadingScreen message={loadingMessage} />}
      {popup && <Popup type={popup.type} message={popup.message} onClose={() => setPopup(null)} />}

      <div className="max-w-2xl mx-auto">
        {/* Page header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Trash2 className="w-7 h-7 text-red-500" />
              Delete Invoices
            </h1>
            <p className="text-sm text-gray-500 mt-1">Soft delete — data is preserved in history</p>
          </div>
          <Link
            to="/invoice/list"
            className="px-3 py-2.5 rounded-xl border border-gray-200 bg-white/60 text-gray-700
                       hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center gap-2
                       text-sm font-medium shadow-sm shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </Link>
        </div>

        {/* Tab switcher */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-1.5 mb-5 flex gap-1">
          {TABS.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${
                activeTab === key
                  ? key === "delete"
                    ? "bg-red-600 text-white shadow-sm"
                    : "bg-slate-700 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Tab panels */}
        {activeTab === "delete" && (
          <DeleteInvoicePanel
            onDeleted={handleDeleted}
            onLoadingChange={setLoadingMessage}
            onError={(msg) => setPopup({ type: "error", message: msg })}
          />
        )}

        {activeTab === "history" && (
          <DeletedInvoicesList
            refreshTrigger={refreshTrigger}
            onLoadingChange={setLoadingMessage}
            onError={(msg) => setPopup({ type: "error", message: msg })}
          />
        )}
      </div>
    </section>
  );
};

export default DeleteInvoices;
