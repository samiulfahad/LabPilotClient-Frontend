/**
 * useCallback / useMemo are intentionally absent throughout this file.
 * babel-plugin-react-compiler handles all memoization automatically.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Wallet, ArrowLeft, AlertCircle, Pencil, ChevronDown, X, Printer, PlusCircle } from "lucide-react";
import Popup from "../../components/popup";
import Modal from "../../components/modal";
import LoadingScreen from "../../components/loadingPage";
import expenseService from "../../api/expense";
import TimeFrame from "../../components/timeFrame";
import { fmt, fmtNum, formatDateTime, headingLabel, EXPENSE_TYPES, typeConfig } from "./expenseHelpers";

const ExpenseList = () => {
  const [expenses, setExpenses] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [loadingMessage, setLoadingMessage] = useState(null);
  const [popup, setPopup] = useState(null);
  const [typeFilter, setTypeFilter] = useState("all");
  const [timeRange, setTimeRange] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);

  const loadExpenses = async (cursor = null, replace = true, range = timeRange, type = typeFilter) => {
    try {
      replace ? setInitialLoading(true) : (setLoadingMore(true), setLoadingMessage("Loading more expenses..."));
      const { data } = await expenseService.getExpenses({
        cursor,
        limit: 20,
        ...(range && { startDate: range.start, endDate: range.end }),
        ...(type !== "all" && { type }),
      });
      setExpenses((prev) => (replace ? data.expenses : [...prev, ...data.expenses]));
      setNextCursor(data.nextCursor);
      setHasMore(data.hasMore);
    } catch {
      setPopup({ type: "error", message: "খরচের তালিকা লোড করা যায়নি" });
    } finally {
      setInitialLoading(false);
      setLoadingMore(false);
      setLoadingMessage(null);
    }
  };

  useEffect(() => {
    const now = new Date();
    const initial = { start: new Date(now).setHours(0, 0, 0, 0), end: new Date(now).setHours(23, 59, 59, 999) };
    setTimeRange(initial);
    loadExpenses(null, true, initial, "all");
  }, []);

  const handleFetchData = (start, end) => {
    const range = { start, end };
    setTimeRange(range);
    loadExpenses(null, true, range, typeFilter);
  };

  const handleTypeFilter = (key) => {
    setTypeFilter(key);
    loadExpenses(null, true, timeRange, key);
  };

  const handleEdited = (expenseId, description) => {
    setExpenses((prev) => prev.map((e) => (e._id === expenseId ? { ...e, description } : e)));
  };

  const total = expenses.length;
  const totalAmount = expenses.reduce((s, e) => s + (e.amount ?? 0), 0);
  const heading = headingLabel(timeRange);

  return (
    <section className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 px-4 py-4 font-noto">
      <style>{`
        @media print {
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body * { visibility: hidden; }
          #expenselist-printable, #expenselist-printable * { visibility: visible; }
          #expenselist-printable { position: fixed; top: 0; left: 0; width: 100%; padding: 32px; box-shadow: none; }
          .no-print { display: none !important; }
        }
      `}</style>

      {loadingMessage && <LoadingScreen message={loadingMessage} />}
      {popup && <Popup type={popup.type} message={popup.message} onClose={() => setPopup(null)} />}

      <EditExpenseModal
        expense={editingExpense}
        isOpen={!!editingExpense}
        onClose={() => setEditingExpense(null)}
        onSaved={handleEdited}
        onLoadingChange={setLoadingMessage}
        onError={(msg) => setPopup({ type: "error", message: msg })}
      />

      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-3 no-print">
          <div>
            <p className="font-['IBM_Plex_Mono'] text-xs uppercase text-[#0F6E5C] mb-0.5">ল্যাব অপারেশন</p>
            <h1 className="font-['IBM_Plex_Sans'] text-xl sm:text-2xl font-semibold text-[#1C1F1E]">খরচের তালিকা</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/expense/new"
              className="px-3 py-2 rounded-sm border border-[#0F6E5C]/30 text-[#0F6E5C] hover:bg-[#0F6E5C] hover:text-white transition-colors flex items-center gap-1.5 font-['IBM_Plex_Mono'] text-xs uppercase"
            >
              <PlusCircle className="w-3.5 h-3.5" /> নতুন খরচ
            </Link>
            <button
              onClick={() => window.print()}
              disabled={initialLoading}
              className="px-3 py-2 rounded-sm border border-[#1C1F1E]/15 text-[#1C1F1E] hover:bg-[#1C1F1E] hover:text-white transition-colors flex items-center gap-1.5 font-['IBM_Plex_Mono'] text-xs uppercase disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>
            <Link
              to="/expense"
              className="px-3 py-2 rounded-sm border border-[#1C1F1E]/15 text-[#1C1F1E] hover:bg-[#1C1F1E] hover:text-white transition-colors flex items-center gap-1.5 font-['IBM_Plex_Mono'] text-xs uppercase"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="mb-3 no-print">
          <TimeFrame onFetchData={handleFetchData} />
        </div>

        {initialLoading ? (
          <SkeletonManifest />
        ) : (
          <div
            id="expenselist-printable"
            className="bg-white border border-[#E3E0D6] rounded-lg shadow-[0_1px_2px_rgba(28,31,30,0.04)] overflow-hidden"
          >
            {/* Letterhead — visible on print */}
            <div className="px-6 sm:px-8 pt-3.5 pb-3 text-center border-b border-[#E3E0D6] bg-[#FAF9F5]">
              <h3 className="font-['IBM_Plex_Sans'] text-base font-bold text-[#1C1F1E] tracking-wide">
                Azizul Haque Diagnostic Center
              </h3>
              <p className="font-['IBM_Plex_Mono'] text-[11px] text-[#6F756F] mt-0.5">
                Hospital Road, Bhaluka, Mymensingh
              </p>
            </div>

            <div className="px-6 sm:px-8 pt-4 pb-3.5 border-b border-[#E3E0D6] flex items-start justify-between gap-4">
              <div>
                <p className="font-['IBM_Plex_Mono'] text-xs uppercase text-[#0F6E5C] mb-1">খরচের লেজার</p>
                <h2 className="font-['IBM_Plex_Sans'] text-xl font-semibold text-[#1C1F1E]">{heading}</h2>
                <div className="font-['IBM_Plex_Mono'] text-sm text-[#8A8F89] mt-1.5 space-y-0.5">
                  <p>মোট এন্ট্রি — {fmtNum(total)}টি</p>
                  <p className="text-[#C0312B] font-semibold">মোট খরচ — {fmt(totalAmount)}</p>
                </div>
              </div>
              <div
                className="w-9 h-9 rounded-[3px] border flex items-center justify-center shrink-0"
                style={{ borderColor: "#C0312B55", backgroundColor: "#C0312B0A" }}
              >
                <Wallet className="w-4 h-4" style={{ color: "#C0312B" }} />
              </div>
            </div>

            <div className="px-6 sm:px-8 py-2.5 border-b border-[#E3E0D6] bg-[#FAF9F5] flex items-center gap-2 flex-wrap no-print">
              <p className="font-['IBM_Plex_Mono'] text-[10px] uppercase text-[#A8ACA3] shrink-0 w-full sm:w-auto mb-1 sm:mb-0">
                ফিল্টার
              </p>
              <div className="flex items-center gap-1 flex-wrap">
                <button
                  onClick={() => handleTypeFilter("all")}
                  className={`px-3 py-1 font-['IBM_Plex_Mono'] text-xs uppercase transition-colors rounded-[2px] border ${
                    typeFilter === "all"
                      ? "border-[#1C1F1E]/30 bg-[#1C1F1E] text-white"
                      : "border-transparent text-[#6F756F] hover:border-[#D8D5CB] hover:bg-[#EDEBE3]"
                  }`}
                >
                  সব
                </button>
                {EXPENSE_TYPES.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => handleTypeFilter(key)}
                    className={`px-3 py-1 font-['IBM_Plex_Mono'] text-xs uppercase transition-colors rounded-[2px] border ${
                      typeFilter === key
                        ? "border-[#1C1F1E]/30 bg-[#1C1F1E] text-white"
                        : "border-transparent text-[#6F756F] hover:border-[#D8D5CB] hover:bg-[#EDEBE3]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="px-6 sm:px-8 pt-3 pb-1 flex items-center gap-3">
              <span className="font-['IBM_Plex_Mono'] text-[10px] uppercase text-[#A8ACA3] w-5 shrink-0">#</span>
              <span className="font-['IBM_Plex_Mono'] text-[10px] uppercase text-[#A8ACA3] flex-1">বিবরণ</span>
              <span className="font-['IBM_Plex_Mono'] text-[10px] uppercase text-[#A8ACA3] shrink-0">পরিমাণ</span>
            </div>

            <div className="px-6 sm:px-8 pb-3">
              {expenses.length === 0 ? (
                <div className="flex items-center gap-2 py-6 text-[#A8ACA3]">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <p className="font-['IBM_Plex_Mono'] text-xs">নির্ধারিত সময়সীমায় কোনো খরচ যোগ হয়নি</p>
                </div>
              ) : (
                <div className="divide-y divide-[#EDEBE3]">
                  {expenses.map((expense, index) => (
                    <ExpenseRow
                      key={expense._id}
                      expense={expense}
                      index={index}
                      onEdit={() => setEditingExpense(expense)}
                    />
                  ))}
                </div>
              )}
            </div>

            {hasMore && (
              <div className="px-6 sm:px-8 pb-3.5 border-t border-[#E3E0D6] pt-3 no-print">
                <button
                  onClick={() => loadExpenses(nextCursor, false)}
                  disabled={loadingMore}
                  className="w-full flex items-center justify-center gap-2 py-2 font-['IBM_Plex_Mono'] text-xs uppercase text-[#6F756F] hover:text-[#1C1F1E] border border-dashed border-[#D8D5CB] hover:border-[#1C1F1E]/30 rounded-[2px] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                  আরো লোড করুন (+20)
                </button>
              </div>
            )}

            <div className="px-6 sm:px-8 py-2 border-t border-[#E3E0D6] bg-[#FAF9F5]">
              <p className="font-['IBM_Plex_Mono'] text-[10px] text-[#A8ACA3]">
                * শুধুমাত্র সক্রিয় (ডিলিট না হওয়া) খরচের হিসাব অন্তর্ভুক্ত
              </p>
            </div>
          </div>
        )}

        <p className="font-['IBM_Plex_Mono'] text-center text-xs text-[#A8ACA3] mt-3 pb-4 no-print">
          LabPilotPro · খরচ ব্যবস্থাপনা সিস্টেম
        </p>
      </div>
    </section>
  );
};

const ExpenseRow = ({ expense, index, onEdit }) => {
  const { date, time } = formatDateTime(expense.createdAt);
  const [expanded, setExpanded] = useState(false);
  const cfg = typeConfig(expense.type);
  const Icon = cfg.icon;

  const hasDescription = !!expense.description;
  const isShortDescription = hasDescription && expense.description.length <= 20;

  return (
    <div>
      <button onClick={() => setExpanded((v) => !v)} className="w-full text-left">
        <div className="flex items-baseline gap-3 py-1.5 group hover:bg-[#F0EFE9] px-1 rounded-sm transition-colors">
          <span className="font-['IBM_Plex_Mono'] text-xs text-[#A8ACA3] tabular-nums w-5 shrink-0">
            {String(index + 1).padStart(2, "0")}
          </span>
          <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: cfg.color }} />
          <div className="flex-1 min-w-0 flex items-baseline gap-2">
            <span className="text-sm text-[#1C1F1E] font-medium truncate">{cfg.label}</span>
            {isShortDescription && (
              <span className="font-['IBM_Plex_Mono'] text-[10px] text-[#A8ACA3] truncate">{expense.description}</span>
            )}
            {hasDescription && !isShortDescription && (
              <span className="w-1 h-1 rounded-full bg-[#C0312B]/50 shrink-0" title="বিবরণ আছে" />
            )}
          </div>
          <span className="flex-1 border-b border-dotted border-[#D8D5CB] translate-y-[-3px] hidden sm:block" />
          <div className="flex items-center gap-2 shrink-0">
            <span className="font-['IBM_Plex_Mono'] text-sm tabular-nums shrink-0" style={{ color: cfg.color }}>
              {fmt(expense.amount)}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-[#A8ACA3] transition-transform shrink-0 no-print ${expanded ? "rotate-180" : ""}`}
            />
          </div>
        </div>
      </button>

      {expanded && (
        <div className="pl-8 pr-1 py-1.5 border-t border-[#EDEBE3] bg-[#FAF9F5] rounded-b-sm space-y-1.5">
          {hasDescription && !isShortDescription && (
            <p className="font-['IBM_Plex_Mono'] text-xs text-[#1C1F1E] break-words whitespace-pre-wrap leading-relaxed">
              {expense.description}
            </p>
          )}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-['IBM_Plex_Mono'] text-[10px] text-[#A8ACA3]">
              {date} · {time}
              {expense.createdBy?.name && ` · ${expense.createdBy.name}`}
            </p>
            <div className="flex flex-wrap items-center gap-1.5 no-print">
              <button
                onClick={onEdit}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-['IBM_Plex_Mono'] uppercase tracking-wide border border-[#D8D5CB] text-[#6F756F] hover:bg-[#EDEBE3] rounded-[2px] transition-colors"
              >
                <Pencil className="w-3 h-3" />
                সম্পাদনা
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const EditExpenseModal = ({ expense, isOpen, onClose, onSaved, onLoadingChange, onError }) => {
  const [description, setDescription] = useState("");

  useEffect(() => {
    setDescription(expense?.description ?? "");
  }, [expense]);

  const cfg = expense ? typeConfig(expense.type) : null;

  const handleSubmit = async () => {
    if (!expense) return;
    onClose();
    try {
      onLoadingChange("Updating description...");
      await expenseService.editExpense(expense._id, { description: description.trim() });
      onSaved(expense._id, description.trim());
    } catch {
      onError("বিবরণ আপডেট করা যায়নি। আবার চেষ্টা করুন।");
    } finally {
      onLoadingChange(null);
    }
  };

  const inputCls =
    "w-full px-3 py-2.5 text-sm border border-[#D8D5CB] rounded-[2px] focus:outline-none focus:ring-1 focus:ring-[#1E4FA0]/30 focus:border-[#1E4FA0] transition-all placeholder-[#A8ACA3] bg-[#FAF9F5] focus:bg-white font-['IBM_Plex_Mono'] resize-none";

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[#E3E0D6] bg-[#FAF9F5]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[3px] border border-[#D8D5CB] flex items-center justify-center shrink-0 bg-white">
            <Pencil className="w-4 h-4 text-[#1E4FA0]" />
          </div>
          <div>
            <h2 className="font-['IBM_Plex_Sans'] text-sm font-bold text-[#1C1F1E] leading-tight">বিবরণ সম্পাদনা</h2>
            {cfg && <p className="font-['IBM_Plex_Mono'] text-[10px] text-[#A8ACA3] mt-0.5">{cfg.label}</p>}
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-sm text-[#A8ACA3] hover:text-[#1C1F1E] hover:bg-[#EDEBE3] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="px-5 py-5 space-y-3">
        <p className="font-['IBM_Plex_Mono'] text-[10px] text-[#A8ACA3]">
          পরিমাণ ও ধরন পরিবর্তনযোগ্য নয় — শুধুমাত্র বিবরণ সম্পাদনা করা যাবে।
        </p>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={inputCls}
          rows={4}
          maxLength={1000}
        />
        <p className="font-['IBM_Plex_Mono'] text-[10px] text-[#A8ACA3] text-right">{description.length}/1000</p>
      </div>

      <div className="flex gap-2 px-5 pb-5 border-t border-[#E3E0D6] pt-4">
        <button
          onClick={onClose}
          className="flex-1 py-2 font-['IBM_Plex_Mono'] text-xs uppercase border border-[#D8D5CB] text-[#6F756F] hover:bg-[#EDEBE3] rounded-[2px] transition-colors"
        >
          বাতিল
        </button>
        <button
          onClick={handleSubmit}
          className="flex-1 py-2 font-['IBM_Plex_Mono'] text-xs uppercase border border-[#0F6E5C] text-[#0F6E5C] hover:bg-[#0F6E5C] hover:text-white rounded-[2px] transition-colors"
        >
          সংরক্ষণ করুন
        </button>
      </div>
    </Modal>
  );
};

const SkeletonManifest = () => (
  <div className="bg-white border border-[#E3E0D6] rounded-lg overflow-hidden animate-pulse">
    <div className="px-6 sm:px-8 pt-4 pb-3.5 border-b border-[#E3E0D6] space-y-2">
      <div className="h-2.5 w-24 bg-[#ECE9DF] rounded-sm" />
      <div className="h-5 w-48 bg-[#ECE9DF] rounded-sm" />
      <div className="h-3 w-36 bg-[#ECE9DF] rounded-sm" />
    </div>
    {[0, 1, 2, 3].map((i) => (
      <div key={i} className="px-6 sm:px-8 py-2.5 border-b border-[#EDEBE3] flex items-center gap-3">
        <div className="h-3 w-5 bg-[#ECE9DF] rounded-sm" />
        <div className="h-3 flex-1 bg-[#ECE9DF] rounded-sm" />
        <div className="h-3 w-20 bg-[#ECE9DF] rounded-sm" />
      </div>
    ))}
  </div>
);

export default ExpenseList;
