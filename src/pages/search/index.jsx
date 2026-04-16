/**
 * useCallback / useMemo are intentionally absent throughout this file.
 * babel-plugin-react-compiler handles all memoization automatically.
 */
import { useState, useRef } from "react";
import {
  Search,
  X,
  Phone,
  Hash,
  User,
  FileText,
  CheckCircle2,
  Wallet,
  PackageCheck,
  FlaskConical,
  Banknote,
  Pencil,
  Eye,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Link } from "react-router-dom";
import invoiceService from "../../api/invoice";
import Modal from "../../components/modal";
import Popup from "../../components/popup";
import LoadingScreen from "../../components/loadingPage";
import { InvoiceDetailsModal } from "../invoices/index"; // ← extract from InvoiceList if needed
import { EditPatientModal } from "../invoices/index"; // ← extract from InvoiceList if needed

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n) =>
  new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT", minimumFractionDigits: 0 }).format(n || 0);

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
const hasReportSchemas = (inv) => (inv.tests ?? []).some((t) => t.schemaId);

// ── Detect what the user is typing ────────────────────────────────────────────
const detectQueryType = (q) => {
  if (!q) return null;
  if (/^\d+$/.test(q)) return "phone";
  if (/^[A-NP-Za-np-z]{1,3}[1-9]{0,4}$/.test(q) && q.length <= 7) return "invoiceId";
  return "name";
};

const QUERY_HINTS = {
  phone: { icon: Phone, color: "text-blue-500", label: "Searching by phone" },
  invoiceId: { icon: Hash, color: "text-violet-500", label: "Searching by Invoice ID" },
  name: { icon: User, color: "text-emerald-500", label: "Searching by name" },
};

// ─── Action chip ──────────────────────────────────────────────────────────────

const ActionChip = ({ onClick, icon: Icon, label, className }) => (
  <button
    onClick={onClick}
    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${className}`}
  >
    <Icon className="w-3.5 h-3.5" /> {label}
  </button>
);

const LinkChip = ({ to, state, icon: Icon, label, className }) => (
  <Link
    to={to}
    state={state}
    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${className}`}
  >
    <Icon className="w-3.5 h-3.5" /> {label}
  </Link>
);

// ─── Single result card ───────────────────────────────────────────────────────

const ResultCard = ({ invoice, index, onDelivered, onCollected, onPatientUpdated, onLoadingChange, onError }) => {
  const { date, time } = formatDateTime(invoice.createdAt);
  const [viewingDetails, setViewingDetails] = useState(false);
  const [editingPatient, setEditingPatient] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [collectingDue, setCollectingDue] = useState(false);

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
          message={`Mark invoice #${invoice.invoiceId} for ${patient.name} as delivered? This cannot be undone.`}
          confirmText="Mark Delivered"
          cancelText="Cancel"
          onConfirm={handleConfirmDelivery}
          onClose={() => setConfirming(false)}
        />
      )}
      {collectingDue && (
        <Popup
          type="warning"
          message={`Collect ৳${due.toLocaleString()} from ${patient.name} (Invoice #${invoice.invoiceId})? This will mark it as fully paid.`}
          confirmText={`Collect ৳${due.toLocaleString()}`}
          cancelText="Cancel"
          onConfirm={handleCollectDue}
          onClose={() => setCollectingDue(false)}
        />
      )}

      <InvoiceDetailsModal
        invoiceId={invoice.invoiceId}
        isOpen={viewingDetails}
        onClose={() => setViewingDetails(false)}
        invoice={invoice}
        onPatientUpdated={onPatientUpdated}
        onLoadingChange={onLoadingChange}
        onError={onError}
      />
      <EditPatientModal
        invoice={invoice}
        isOpen={editingPatient}
        onClose={() => setEditingPatient(false)}
        onSaved={onPatientUpdated}
        onLoadingChange={onLoadingChange}
        onError={onError}
      />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-indigo-100 transition-all duration-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 pt-3.5 pb-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-sm">
            <span className="text-[11px] font-bold text-white">{index + 1}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 text-sm leading-tight truncate">{patient.name}</p>
            <p className="text-[11px] text-gray-400 mt-0.5 truncate">
              #{invoice.invoiceId} · {date} · {time}
              {invoice.createdBy?.name && (
                <span className="text-gray-300 hidden sm:inline"> · by {invoice.createdBy.name}</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {fullyPaid ? (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-green-50 text-green-700 border border-green-100 text-xs font-medium">
                <CheckCircle2 className="w-3 h-3" /> Paid
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-red-50 text-red-600 border border-red-100 text-xs font-medium whitespace-nowrap">
                <Wallet className="w-3 h-3" />৳{due.toLocaleString()}
              </span>
            )}
            {delivered && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 text-[10px] font-semibold">
                <PackageCheck className="w-3 h-3" />
                <span className="hidden sm:inline">Delivered</span>
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="px-3 pb-3">
          <div className="flex items-center gap-1.5 flex-wrap justify-start">
            <ActionChip
              onClick={() => setViewingDetails(true)}
              icon={Eye}
              label="Details"
              className="text-violet-700 bg-violet-50 hover:bg-violet-100 border-violet-100"
            />
            <LinkChip
              to={`/invoice/print/${invoice.invoiceId}`}
              icon={FileText}
              label="Invoice"
              className="text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border-indigo-100"
            />
            {hasReports && (
              <LinkChip
                to="/report"
                state={{ invoiceId: invoice.invoiceId }}
                icon={FlaskConical}
                label="Reports"
                className="text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 border-transparent shadow-sm"
              />
            )}
            <ActionChip
              onClick={() => setEditingPatient(true)}
              icon={Pencil}
              label="Edit"
              className="text-gray-600 bg-gray-100 hover:bg-gray-200 border-gray-200"
            />
            {!fullyPaid && (
              <ActionChip
                onClick={() => setCollectingDue(true)}
                icon={Banknote}
                label="Collect"
                className="text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200"
              />
            )}
            {!delivered && (
              <ActionChip
                onClick={() => setConfirming(true)}
                icon={PackageCheck}
                label="Deliver"
                className="text-blue-700 bg-blue-50 hover:bg-blue-100 border-blue-100"
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
};

// ─── Main Search Component ────────────────────────────────────────────────────

const SearchInvoice = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(null);
  const [popup, setPopup] = useState(null);
  const debounceRef = useRef(null);

  const queryType = detectQueryType(query.trim());
  const hint = queryType ? QUERY_HINTS[queryType] : null;

  const runSearch = async (q) => {
    if (!q || q.trim().length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }
    try {
      setLoading(true);
      const { data } = await invoiceService.searchInvoices(q.trim());
      setResults(data.results);
      setSearched(true);
    } catch {
      setPopup({ type: "error", message: "Search failed. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(val), 400);
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setSearched(false);
  };

  // Optimistic updates
  const handleDelivered = (id) =>
    setResults((prev) =>
      prev.map((inv) => (inv.invoiceId === id ? { ...inv, delivery: { ...inv.delivery, status: true } } : inv)),
    );

  const handleCollected = (id) =>
    setResults((prev) =>
      prev.map((inv) => (inv.invoiceId === id ? { ...inv, amount: { ...inv.amount, paid: inv.amount.final } } : inv)),
    );

  const handlePatientUpdated = (id, fields) =>
    setResults((prev) => prev.map((inv) => (inv.invoiceId === id ? { ...inv, ...fields } : inv)));

  return (
    <section className="min-h-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 px-4 py-6">
      {loadingMessage && <LoadingScreen message={loadingMessage} />}
      {popup && <Popup type={popup.type} message={popup.message} onClose={() => setPopup(null)} />}

      <div className="max-w-2xl mx-auto">
        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="mb-6">
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Search className="w-6 h-6 text-indigo-600 shrink-0" /> Search Invoices
          </h1>
          <p className="text-sm text-gray-500 mt-1">Search by phone number, invoice ID, or patient name</p>
        </div>

        {/* ── Search box ────────────────────────────────────────────────── */}
        <div className="relative mb-2">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
            {loading ? (
              <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
            ) : hint ? (
              <hint.icon className={`w-4 h-4 ${hint.color}`} />
            ) : (
              <Search className="w-4 h-4 text-gray-400" />
            )}
          </div>
          <input
            type="text"
            value={query}
            onChange={handleChange}
            placeholder="01XXXXXXXXX  ·  ABT9546  ·  Patient name"
            className="w-full pl-11 pr-10 py-3.5 text-sm bg-white border border-gray-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all placeholder-gray-300"
          />
          {query && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* ── Query type hint ────────────────────────────────────────────── */}
        {hint && query.trim().length >= 2 && (
          <div className={`flex items-center gap-1.5 text-[11px] font-semibold mb-4 ${hint.color}`}>
            <hint.icon className="w-3 h-3" />
            {hint.label}
          </div>
        )}

        {/* ── Type guide pills ──────────────────────────────────────────── */}
        {!query && (
          <div className="flex flex-wrap gap-2 mb-6 mt-3">
            {[
              {
                icon: Phone,
                label: "Phone number",
                eg: "01XXXXXXXXX",
                color: "bg-blue-50 text-blue-600 border-blue-100",
              },
              {
                icon: Hash,
                label: "Invoice ID",
                eg: "ABT9546",
                color: "bg-violet-50 text-violet-600 border-violet-100",
              },
              {
                icon: User,
                label: "Patient name",
                eg: "John Doe",
                color: "bg-emerald-50 text-emerald-600 border-emerald-100",
              },
            ].map(({ icon: Icon, label, eg, color }) => (
              <div
                key={label}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold ${color}`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
                <span className="opacity-50 font-normal">e.g. {eg}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── Results ───────────────────────────────────────────────────── */}
        {searched && !loading && (
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500">
              {results.length === 0
                ? "No results found"
                : `${results.length} result${results.length !== 1 ? "s" : ""} found`}
            </p>
            {results.length > 0 && (
              <button onClick={handleClear} className="text-xs text-indigo-500 font-semibold hover:underline">
                Clear
              </button>
            )}
          </div>
        )}

        {searched && !loading && results.length === 0 && (
          <div className="bg-white border border-gray-100 rounded-2xl py-14 text-center shadow-sm">
            <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-5 h-5 text-gray-300" />
            </div>
            <p className="text-sm font-bold text-gray-400">No invoices found</p>
            <p className="text-xs text-gray-300 mt-1">Try a different phone, ID, or name</p>
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-3">
            {results.map((invoice, i) => (
              <ResultCard
                key={invoice._id}
                invoice={invoice}
                index={i}
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
    </section>
  );
};

export default SearchInvoice;
