/**
 * useCallback / useMemo are intentionally absent throughout this file.
 * babel-plugin-react-compiler handles all memoization automatically.
 */
import { useEffect, useState } from "react";
import { Trash2, ChevronDown, PackageSearch, User, History, ArrowLeft, SlidersHorizontal } from "lucide-react";
import { Link } from "react-router-dom";
import Popup from "../../components/popup";
import LoadingScreen from "../../components/loadingPage";
import expenseService from "../../api/expense";
import TimeFrame from "../../components/timeFrame";
import { fmt, formatDateTime, EXPENSE_TYPES, typeConfig } from "./expenseHelpers";

// ─── Delete Expense Panel (filter-driven, no ID search) ────────────────────────

const DeleteExpensePanel = ({ onDeleted, onLoadingChange, onError }) => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [timeRange, setTimeRange] = useState(null);
  const [typeFilter, setTypeFilter] = useState("all");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);

  const loadExpenses = async (
    cursor = null,
    replace = true,
    range = timeRange,
    type = typeFilter,
    min = minAmount,
    max = maxAmount,
  ) => {
    try {
      replace ? setLoading(true) : setLoadingMore(true);
      const { data } = await expenseService.getExpenses({
        cursor,
        limit: 20,
        ...(range && { startDate: range.start, endDate: range.end }),
        ...(type !== "all" && { type }),
        ...(min.trim() && { minAmount: min.trim() }),
        ...(max.trim() && { maxAmount: max.trim() }),
      });
      setExpenses((prev) => (replace ? data.expenses : [...prev, ...data.expenses]));
      setNextCursor(data.nextCursor);
      setHasMore(data.hasMore);
    } catch {
      onError("Could not load expenses.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    const now = new Date();
    const initial = { start: new Date(now).setHours(0, 0, 0, 0), end: new Date(now).setHours(23, 59, 59, 999) };
    setTimeRange(initial);
    loadExpenses(null, true, initial, "all", "", "");
  }, []);

  const handleFetchData = (start, end) => {
    const range = { start, end };
    setTimeRange(range);
    loadExpenses(null, true, range, typeFilter, minAmount, maxAmount);
  };

  const handleTypeFilter = (key) => {
    setTypeFilter(key);
    loadExpenses(null, true, timeRange, key, minAmount, maxAmount);
  };

  const handleAmountFilter = () => {
    loadExpenses(null, true, timeRange, typeFilter, minAmount, maxAmount);
  };

  const filtered = expenses;

  const handleConfirmDelete = async () => {
    const expense = pendingDelete;
    setPendingDelete(null);
    try {
      onLoadingChange("Deleting expense...");
      await expenseService.deleteExpense(expense._id);
      setExpenses((prev) => prev.filter((e) => e._id !== expense._id));
      onDeleted(expense);
    } catch {
      onError("Failed to delete expense. Please try again.");
    } finally {
      onLoadingChange(null);
    }
  };

  return (
    <div className="space-y-4">
      {pendingDelete && (
        <Popup
          type="warning"
          message={`Delete this ${typeConfig(pendingDelete.type).label} entry of ${fmt(pendingDelete.amount)}? It will be hidden from all active lists.`}
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={handleConfirmDelete}
          onClose={() => setPendingDelete(null)}
        />
      )}

      <TimeFrame onFetchData={handleFetchData} />

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
          <SlidersHorizontal className="w-3.5 h-3.5" /> Filter by category & amount
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => handleTypeFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
              typeFilter === "all"
                ? "bg-indigo-600 border-indigo-600 text-white"
                : "border-gray-200 text-gray-500 hover:bg-gray-50"
            }`}
          >
            All
          </button>
          {EXPENSE_TYPES.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => handleTypeFilter(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
                typeFilter === key
                  ? "bg-indigo-600 border-indigo-600 text-white"
                  : "border-gray-200 text-gray-500 hover:bg-gray-50"
              }`}
            >
              <Icon className="w-3 h-3" />
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="block text-[10px] font-medium text-gray-400 uppercase mb-1">Min ৳</label>
            <input
              type="number"
              min="0"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAmountFilter()}
              placeholder="0"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
            />
          </div>
          <div className="flex-1">
            <label className="block text-[10px] font-medium text-gray-400 uppercase mb-1">Max ৳</label>
            <input
              type="number"
              min="0"
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAmountFilter()}
              placeholder="No limit"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
            />
          </div>
          <button
            onClick={handleAmountFilter}
            className="self-end px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors shrink-0"
          >
            Apply
          </button>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10 text-center">
          <div className="bg-gray-50 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3">
            <PackageSearch className="w-7 h-7 text-gray-300" />
          </div>
          <p className="text-sm font-semibold text-gray-800">No matching expenses</p>
          <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
            Try widening the date range, category, or amount filter.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((expense, index) => (
            <ExpenseToDeleteRow
              key={expense._id}
              expense={expense}
              index={index}
              onDelete={() => setPendingDelete(expense)}
            />
          ))}
          {hasMore && (
            <div className="flex items-center gap-3 pt-2 pb-1">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent to-indigo-100" />
              <button
                onClick={() => loadExpenses(nextCursor, false)}
                disabled={loadingMore}
                className="group flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50 shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronDown className="w-3.5 h-3.5 text-indigo-400 group-hover:translate-y-0.5 transition-transform duration-200" />
                <span className="text-xs font-semibold text-indigo-500">Load more</span>
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
  );
};

// ─── Row: expense eligible for deletion ────────────────────────────────────────

const ExpenseToDeleteRow = ({ expense, index, onDelete }) => {
  const { date, time } = formatDateTime(expense.createdAt);
  const cfg = typeConfig(expense.type);
  const Icon = cfg.icon;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="flex items-center gap-3 px-4 pt-3.5 pb-2.5">
        <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
          <Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm leading-tight truncate">{cfg.label}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {date} · {time}
            {expense.createdBy?.name && ` · ${expense.createdBy.name}`}
          </p>
        </div>
        <span className="text-sm font-bold shrink-0" style={{ color: cfg.color }}>
          {fmt(expense.amount)}
        </span>
      </div>

      {expense.description && <p className="px-4 pb-2 text-xs text-gray-500 truncate">{expense.description}</p>}

      <div className="px-4 pb-3.5 border-t border-gray-50 pt-2.5">
        <button
          onClick={onDelete}
          className="w-full py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
        >
          <Trash2 className="w-3.5 h-3.5" /> Delete Entry
        </button>
      </div>
    </div>
  );
};

// ─── Deleted Expense Row (history tab) ──────────────────────────────────────────

const DeletedExpenseRow = ({ expense }) => {
  const deletedDt = formatDateTime(expense.deletion?.at);
  const cfg = typeConfig(expense.type);
  const Icon = cfg.icon;
  const deletedBy = expense.deletion?.by?.name ?? null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-red-50">
      <div className="flex items-center gap-3 px-4 pt-3.5 pb-2.5">
        <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
          <Icon className="w-3.5 h-3.5 text-red-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm leading-tight truncate">{cfg.label}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">{expense.description || "No description"}</p>
        </div>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-red-400 bg-red-50 border border-red-100 rounded-lg shrink-0">
          <Trash2 className="w-3 h-3" /> Deleted
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 pb-3 border-t border-gray-50 pt-2">
        <span className="inline-flex items-center gap-1 text-[11px] text-red-400 font-medium">
          <History className="w-3 h-3" />
          {deletedDt.date} · {deletedDt.time}
        </span>
        {deletedBy && (
          <>
            <span className="w-px h-3 bg-gray-200 hidden sm:block" />
            <span className="inline-flex items-center gap-1 text-[11px] text-gray-400">
              <User className="w-3 h-3" />
              {deletedBy}
            </span>
          </>
        )}
        <span className="w-px h-3 bg-gray-200 hidden sm:block" />
        <span className="text-[11px] font-semibold" style={{ color: cfg.color }}>
          {fmt(expense.amount)}
        </span>
      </div>
    </div>
  );
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

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

// ─── Deleted Expenses List (history tab) ────────────────────────────────────────

const DeletedExpensesList = ({ refreshTrigger, onLoadingChange, onError }) => {
  const [expenses, setExpenses] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [timeRange, setTimeRange] = useState(null);

  const loadExpenses = async (cursor = null, replace = true, range = timeRange) => {
    try {
      replace ? setInitialLoading(true) : (setLoadingMore(true), onLoadingChange("Loading more..."));
      const { data } = await expenseService.getDeletedExpenses({
        cursor,
        limit: 20,
        ...(range && { startDate: range.start, endDate: range.end }),
      });
      setExpenses((prev) => (replace ? data.expenses : [...prev, ...data.expenses]));
      setNextCursor(data.nextCursor);
      setHasMore(data.hasMore);
    } catch {
      onError("Could not load deleted expenses.");
    } finally {
      setInitialLoading(false);
      setLoadingMore(false);
      onLoadingChange(null);
    }
  };

  useEffect(() => {
    const now = new Date();
    const initial = { start: new Date(now).setHours(0, 0, 0, 0), end: new Date(now).setHours(23, 59, 59, 999) };
    setTimeRange(initial);
    loadExpenses(null, true, initial);
  }, []);

  useEffect(() => {
    if (refreshTrigger === 0) return;
    loadExpenses(null, true, timeRange);
  }, [refreshTrigger]); // eslint-disable-line

  const handleFetchData = (start, end) => {
    const range = { start, end };
    setTimeRange(range);
    loadExpenses(null, true, range);
  };

  return (
    <div className="space-y-4">
      <TimeFrame onFetchData={handleFetchData} />

      {!initialLoading && (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 shadow-sm">
            <PackageSearch className="w-3.5 h-3.5 text-red-400" />
            {expenses.length} deleted expense{expenses.length !== 1 ? "s" : ""} loaded
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
      ) : expenses.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10 text-center">
          <div className="bg-red-50 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3">
            <Trash2 className="w-7 h-7 text-red-300" />
          </div>
          <p className="text-sm font-semibold text-gray-800">No deleted expenses</p>
          <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
            No expenses were deleted in the selected time period.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {expenses.map((expense) => (
            <DeletedExpenseRow key={expense._id} expense={expense} />
          ))}
          {hasMore && (
            <div className="flex items-center gap-3 pt-2 pb-1">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent to-red-100" />
              <button
                onClick={() => loadExpenses(nextCursor, false)}
                disabled={loadingMore}
                className="group flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border border-red-200 hover:border-red-400 hover:bg-red-50 shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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

// ─── Main ─────────────────────────────────────────────────────────────────────

const TABS = [
  { key: "delete", label: "Delete Expense", Icon: Trash2 },
  { key: "history", label: "Deleted History", Icon: History },
];

const DeleteExpense = () => {
  const [activeTab, setActiveTab] = useState("delete");
  const [loadingMessage, setLoadingMessage] = useState(null);
  const [popup, setPopup] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleDeleted = (expense) => {
    setPopup({
      type: "success",
      message: `${typeConfig(expense.type).label} entry of ${fmt(expense.amount)} has been deleted.`,
    });
    setRefreshTrigger((n) => n + 1);
    setActiveTab("history");
  };

  return (
    <section className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 px-4 py-6">
      {loadingMessage && <LoadingScreen message={loadingMessage} />}
      {popup && <Popup type={popup.type} message={popup.message} onClose={() => setPopup(null)} />}

      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Trash2 className="w-7 h-7 text-red-500" /> Delete Expenses
            </h1>
            <p className="text-sm text-gray-500 mt-1">Soft delete — data is preserved in history</p>
          </div>
          <Link
            to="/expense"
            className="px-3 py-2.5 rounded-xl border border-gray-200 bg-white/60 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center gap-2 text-sm font-medium shadow-sm shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </Link>
        </div>

        {/* Tabs */}
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

        {activeTab === "delete" && (
          <DeleteExpensePanel
            onDeleted={handleDeleted}
            onLoadingChange={setLoadingMessage}
            onError={(msg) => setPopup({ type: "error", message: msg })}
          />
        )}
        {activeTab === "history" && (
          <DeletedExpensesList
            refreshTrigger={refreshTrigger}
            onLoadingChange={setLoadingMessage}
            onError={(msg) => setPopup({ type: "error", message: msg })}
          />
        )}
      </div>
    </section>
  );
};

export default DeleteExpense;
