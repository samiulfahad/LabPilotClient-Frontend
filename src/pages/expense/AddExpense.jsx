// React Compiler active — no useCallback/useMemo
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Wallet, ArrowLeft, ChevronRight, Receipt, CheckCircle2, ListOrdered, PlusCircle } from "lucide-react";
import expenseService from "../../api/expense";
import { fmt, EXPENSE_TYPES, typeConfig } from "./expenseHelpers";

// ─── Constants ───────────────────────────────────────────────────────────────

const DEFAULTS = { type: "", description: "", amount: "" };

// ── Error helpers (mirrors ManageReferrer.jsx / CashMemo.jsx / etc.) ──────────

const PERMISSION_DENIED_MESSAGE = "আপনার কর্তৃপক্ষ আপনাকে এই কাজটি করার বা এই তথ্যটি পাওয়ার অনুমতি দেয়নি।";

const getErrorMessage = (err, fallback) => {
  if (err?.response?.status === 403) return PERMISSION_DENIED_MESSAGE;
  return err?.response?.data?.error ?? fallback;
};

// ─── UI primitives (LabPilot design language, matching AdmitPatient) ──────────

const Field = ({ label, required, optional, children }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-1.5">
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
      {optional && <span className="text-slate-400 text-xs ml-1">(ঐচ্ছিক)</span>}
    </label>
    {children}
  </div>
);

const IconInput = ({ icon: Icon, className = "", ...props }) => (
  <div className="relative">
    <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
    <input
      className={`w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm font-noto
        focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${className}`}
      {...props}
    />
  </div>
);

const Textarea = ({ rows = 3, className = "", ...props }) => (
  <textarea
    rows={rows}
    className={`w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm font-noto resize-none
      focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${className}`}
    {...props}
  />
);

const SectionCard = ({ icon: Icon, title, children }) => (
  <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
    <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
      <div className="p-1.5 bg-blue-50 rounded-lg">
        <Icon className="w-3.5 h-3.5 text-blue-600" />
      </div>
      <h3 className="text-sm font-medium text-slate-900">{title}</h3>
    </div>
    <div className="p-4">{children}</div>
  </div>
);

const ErrorMsg = ({ msg }) =>
  msg ? (
    <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600 font-medium">{msg}</div>
  ) : null;

const Btn = ({ variant = "primary", size = "md", loading, className = "", children, ...props }) => {
  const base = "rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed";
  const sizes = { md: "px-4 py-2.5 text-sm", lg: "px-6 py-3 text-sm" };
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm",
    secondary: "bg-white text-slate-600 border border-slate-300 hover:bg-slate-50",
  };
  return (
    <button disabled={loading} className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
      {loading ? "..." : children}
    </button>
  );
};

const Sk = ({ cls }) => <div className={`bg-slate-200 animate-pulse ${cls}`} />;

const FormSkeleton = () => (
  <div className="space-y-5">
    {[1, 2].map((i) => (
      <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-100 px-6 py-4 animate-pulse">
          <div className="h-5 bg-slate-200 rounded w-1/3" />
        </div>
        <div className="p-6 space-y-4">
          <Sk cls="h-10 rounded-lg" />
          <Sk cls="h-10 rounded-lg" />
        </div>
      </div>
    ))}
  </div>
);

// ─── Modal shell (matching palette, no external dependency) ───────────────────

const ModalShell = ({ onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
    <div className="relative w-full max-w-sm bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden">
      {children}
    </div>
  </div>
);

const ConfirmModal = ({ cfg, amount, description, onConfirm, onClose, loading }) => (
  <ModalShell onClose={onClose}>
    <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
      <div className="p-2 bg-blue-50 rounded-lg">
        <Wallet className="w-4 h-4 text-blue-600" />
      </div>
      <div>
        <h3 className="font-medium text-slate-900">খরচ নিশ্চিত করুন</h3>
        <p className="text-xs text-slate-400">পরিমাণ ও ধরন পরে পরিবর্তনযোগ্য নয়</p>
      </div>
    </div>
    <div className="p-6 space-y-3">
      <div className="flex items-center justify-between px-4 py-3 bg-blue-50 rounded-lg border border-blue-100">
        <span className="text-sm font-medium text-slate-700">{cfg.label}</span>
        <span className="text-base font-semibold text-blue-700">{fmt(Number(amount))}</span>
      </div>
      {description && <p className="text-sm text-slate-500">বিবরণ: {description}</p>}
    </div>
    <div className="flex gap-3 px-6 pb-6">
      <Btn variant="secondary" className="flex-1" onClick={onClose} disabled={loading}>
        বাতিল
      </Btn>
      <Btn variant="primary" className="flex-1" onClick={onConfirm} loading={loading}>
        নিশ্চিত করুন
      </Btn>
    </div>
  </ModalShell>
);

const SuccessModal = ({ justAdded, onAddAnother, onViewAll }) => {
  const cfg = typeConfig(justAdded.type);
  return (
    <ModalShell onClose={onAddAnother}>
      <div className="flex flex-col items-center text-center px-6 pt-8 pb-6">
        <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-3">
          <CheckCircle2 className="w-6 h-6 text-emerald-600" />
        </div>
        <h3 className="font-semibold text-slate-900">খরচ যোগ হয়েছে</h3>
        <p className="text-sm text-slate-500 mt-1">
          {cfg.label} খাতে {fmt(justAdded.amount)} সফলভাবে যোগ করা হয়েছে
        </p>
      </div>
      <div className="flex gap-3 px-6 pb-6">
        <Btn variant="secondary" className="flex-1 flex items-center justify-center gap-1.5" onClick={onAddAnother}>
          <PlusCircle className="w-4 h-4" /> নতুন খরচ
        </Btn>
        <Btn variant="primary" className="flex-1 flex items-center justify-center gap-1.5" onClick={onViewAll}>
          <ListOrdered className="w-4 h-4" /> সব দেখুন
        </Btn>
      </div>
    </ModalShell>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────

const AddExpense = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(DEFAULTS);
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [justAdded, setJustAdded] = useState(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const isValid = form.type && Number(form.amount) > 0;
  const cfg = form.type ? typeConfig(form.type) : null;

  const handleSubmit = async () => {
    if (!isValid) return;
    setError("");
    try {
      setLoading(true);
      await expenseService.createExpense({
        type: form.type,
        description: form.description.trim(),
        amount: Number(form.amount),
      });
      setConfirming(false);
      setJustAdded({ type: form.type, amount: Number(form.amount) });
      setForm(DEFAULTS);
    } catch (err) {
      setConfirming(false);
      setError(getErrorMessage(err, "খরচ যোগ করতে ব্যর্থ হয়েছে"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-5 px-4 sm:px-6 lg:px-8 font-noto">
      {confirming && cfg && (
        <ConfirmModal
          cfg={cfg}
          amount={form.amount}
          description={form.description}
          onConfirm={handleSubmit}
          onClose={() => setConfirming(false)}
          loading={loading}
        />
      )}

      {justAdded && (
        <SuccessModal
          justAdded={justAdded}
          onAddAnother={() => setJustAdded(null)}
          onViewAll={() => navigate("/expense/all")}
        />
      )}

      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-4 flex items-center gap-3">
          <button
            onClick={() => navigate("/expense")}
            className="p-2.5 bg-white border border-slate-200 rounded-xl shadow-sm hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </button>
          <div className="p-2.5 bg-blue-600 rounded-xl shadow-sm">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">নতুন খরচ</h1>
            <p className="text-sm text-slate-500">খরচের বিস্তারিত পূরণ করুন</p>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (isValid) setConfirming(true);
          }}
          className="space-y-4"
        >
          <ErrorMsg msg={error} />

          {/* ── Type ─────────────────────────────────────────────────── */}
          <SectionCard icon={Receipt} title="খরচের ধরন">
            <div className="grid grid-cols-3 sm:flex gap-2">
              {EXPENSE_TYPES.map(({ key, label, icon: Icon }) => (
                <label
                  key={key}
                  className={`sm:flex-1 sm:basis-0 flex flex-col items-center gap-1 py-2 px-1.5 border rounded-lg cursor-pointer transition-all text-center select-none ${
                    form.type === key
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-slate-300 text-slate-600 hover:border-slate-400 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="expense-type"
                    value={key}
                    checked={form.type === key}
                    onChange={() => set("type", key)}
                    className="sr-only"
                  />
                  <Icon className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-medium leading-tight">{label}</span>
                </label>
              ))}
            </div>
          </SectionCard>

          {/* ── Amount & Description ────────────────────────────────── */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <div className="space-y-3.5">
              <Field label="পরিমাণ (৳)" required>
                <IconInput
                  icon={Wallet}
                  type="number"
                  min="0"
                  value={form.amount}
                  onChange={(e) => set("amount", e.target.value)}
                  placeholder="যেমন: ৫০০০"
                />
              </Field>

              <Field label="বিবরণ" optional>
                <Textarea
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  maxLength={1000}
                  placeholder="ঐচ্ছিক নোট..."
                />
                <p className="text-xs text-slate-400 mt-1 text-right">{form.description.length}/1000</p>
              </Field>

              {isValid && (
                <div className="flex items-center justify-between px-3 py-2 bg-blue-50 rounded-lg border border-blue-100">
                  <span className="text-xs font-medium text-slate-700">{cfg.label}</span>
                  <span className="text-sm font-semibold text-blue-700">{fmt(Number(form.amount))}</span>
                </div>
              )}
            </div>
          </div>

          {/* ── Actions ──────────────────────────────────────────────── */}
          <div className="flex gap-3 justify-end">
            <Btn variant="secondary" onClick={() => navigate("/expense")}>
              বাতিল
            </Btn>
            <Btn variant="primary" type="submit" disabled={!isValid} className="flex items-center gap-2">
              <span>খরচ যোগ করুন</span>
              <ChevronRight className="w-4 h-4" />
            </Btn>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddExpense;
