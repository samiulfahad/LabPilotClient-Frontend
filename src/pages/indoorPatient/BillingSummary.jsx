// React Compiler active — no useCallback/useMemo
// BillingSummary.jsx

import { useState } from "react";
import { Badge, Btn, ErrorMsg, Field, Input, Modal, SectionCard, Select, fmt } from "./indoorPatientHelpers";
import indoorPatientService from "../../api/indoorPatient";

// ─── BST helpers ──────────────────────────────────────────────────────────────

const tsBst = (ts) => new Date(ts + 6 * 3600 * 1000).toISOString().slice(0, 10);
const todayBst = () => tsBst(Date.now());

// ─── Bed-charge accrual ───────────────────────────────────────────────────────

export function calcBedAccrual(patient) {
  const start = tsBst(patient.admittedAt);
  const end = patient.releasedAt ? tsBst(patient.releasedAt) : todayBst();

  const startD = new Date(start + "T00:00:00Z");
  const endD = new Date(end + "T00:00:00Z");

  const rows = [];
  let gross = 0;
  const cur = new Date(startD);

  while (cur <= endD) {
    const d = cur.toISOString().slice(0, 10);
    let amount = patient.space.chargePerDay;
    let spaceName = patient.space.spaceName;
    let bedNumber = patient.space.bedNumber ?? null;

    for (const h of patient.wardHistory ?? []) {
      if (!h.fromDate || !h.toDate) continue;
      const from = tsBst(h.fromDate);
      const to = tsBst(h.toDate);
      if (d >= from && d < to) {
        amount = h.chargePerDay ?? patient.space.chargePerDay;
        spaceName = h.fromSpaceName;
        bedNumber = h.fromBedNumber ?? null;
        break;
      }
    }

    rows.push({ date: d, spaceName, bedNumber, amount });
    gross += amount;
    cur.setUTCDate(cur.getUTCDate() + 1);
  }

  const days = Math.round((endD - startD) / 86400000) + 1;
  return { days, gross, total: gross, rows, start, end };
}

// ─── Bill breakdown ───────────────────────────────────────────────────────────

export function calcBillBreakdown(patient) {
  const expenses = patient.expenses ?? [];
  const discounts = patient.discounts ?? [];

  const testBill = expenses.filter((e) => e.type === "test").reduce((s, e) => s + (e.total ?? e.price * e.quantity), 0);
  const medicineBill = expenses
    .filter((e) => e.type === "medicine")
    .reduce((s, e) => s + (e.total ?? e.price * e.quantity), 0);
  const otherBill = expenses
    .filter((e) => ["product", "service", "other"].includes(e.type))
    .reduce((s, e) => s + (e.total ?? e.price * e.quantity), 0);
  const bedBill = patient.dealType === "regular" ? calcBedAccrual(patient).total : 0;

  const discountByCategory = (cat) => discounts.filter((d) => d.category === cat).reduce((s, d) => s + d.amount, 0);

  const testDiscount = discountByCategory("test");
  const medicineDiscount = discountByCategory("medicine");
  const otherDiscount = discountByCategory("other") + discountByCategory("product");
  const bedDiscount = discountByCategory("bed-charge");
  const grandTotalDiscount = discountByCategory("grand-total");
  const totalDiscount = testDiscount + medicineDiscount + otherDiscount + bedDiscount + grandTotalDiscount;

  return {
    testBill,
    medicineBill,
    otherBill,
    bedBill,
    testDiscount,
    medicineDiscount,
    otherDiscount,
    bedDiscount,
    grandTotalDiscount,
    totalDiscount,
    total: testBill + medicineBill + otherBill + bedBill,
  };
}

export function getBillingSummary(patient) {
  const breakdown = calcBillBreakdown(patient);
  const paid = (patient.payments ?? []).reduce((s, p) => s + p.amount, 0);
  const grossTotal = patient.dealType === "package" ? (patient.packageDeal?.totalAmount ?? 0) : breakdown.total;
  const total = Math.max(0, grossTotal - breakdown.totalDiscount);
  return { total, paid, due: total - paid, grossTotal, totalDiscount: breakdown.totalDiscount };
}

// ─── Config ───────────────────────────────────────────────────────────────────

const DISCOUNT_CATEGORIES_REGULAR = [
  { value: "test", label: "Test", icon: "🧪" },
  { value: "medicine", label: "Medicine", icon: "💊" },
  { value: "other", label: "Other", icon: "🧾" },
  { value: "bed-charge", label: "Bed Charge", icon: "🛏️" },
  { value: "grand-total", label: "Grand Total", icon: "🏷️" },
];

const DISCOUNT_CATEGORIES_PACKAGE = [
  { value: "test", label: "Test", icon: "🧪" },
  { value: "medicine", label: "Medicine", icon: "💊" },
  { value: "other", label: "Other", icon: "🧾" },
  { value: "grand-total", label: "Grand Total", icon: "🏷️" },
];

const DISCOUNT_PROVIDERS = [
  { value: "hospital", label: "Hospital" },
  { value: "doctor", label: "Doctor" },
  { value: "referrer", label: "Referrer" },
];

const PROVIDER_STYLE = {
  hospital: {
    row: "bg-blue-50 border-blue-100",
    text: "text-blue-800",
    sub: "text-blue-500",
    pill: "bg-blue-100 text-blue-700",
  },
  doctor: {
    row: "bg-violet-50 border-violet-100",
    text: "text-violet-800",
    sub: "text-violet-500",
    pill: "bg-violet-100 text-violet-700",
  },
  referrer: {
    row: "bg-teal-50 border-teal-100",
    text: "text-teal-800",
    sub: "text-teal-500",
    pill: "bg-teal-100 text-teal-700",
  },
};

const CAT_ICON = { test: "🧪", medicine: "💊", other: "🧾", "bed-charge": "🛏️", "grand-total": "🏷️" };
const CAT_LABEL = {
  test: "Test",
  medicine: "Medicine",
  other: "Other",
  "bed-charge": "Bed Charge",
  "grand-total": "Grand Total",
};

// ─── Bed Charge Details Modal ─────────────────────────────────────────────────

function BedChargeDetailsModal({ open, onClose, patient }) {
  const { days, gross, rows, start, end } = calcBedAccrual(patient);
  const isReleased = !!patient.releasedAt;

  const segments = [];
  for (const row of rows) {
    const last = segments[segments.length - 1];
    if (last && last.spaceName === row.spaceName && last.amount === row.amount) {
      last.toDate = row.date;
      last.days += 1;
      last.total += row.amount;
    } else {
      segments.push({
        spaceName: row.spaceName,
        bedNumber: row.bedNumber,
        amount: row.amount,
        fromDate: row.date,
        toDate: row.date,
        days: 1,
        total: row.amount,
      });
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Bed Charge Breakdown" width="max-w-lg">
      <div className="space-y-4">
        <div className="flex items-center gap-3 px-4 py-3 rounded-[3px] bg-slate-50 border border-slate-200 text-sm">
          <span>📅</span>
          <div className="flex-1 min-w-0">
            <span className="font-mono text-xs text-slate-500">{start}</span>
            <span className="text-slate-300 mx-2">→</span>
            <span className="font-mono text-xs text-slate-500">{end}</span>
            {!isReleased && (
              <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-[#0F6E5C] bg-[#0F6E5C]/10 px-1.5 py-0.5 rounded-[2px]">
                ongoing
              </span>
            )}
          </div>
          <div className="font-mono text-xs text-slate-400 shrink-0">{days}d</div>
        </div>

        <div className="space-y-1">
          {segments.map((seg, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-3.5 py-2.5 rounded-[2px] bg-white border border-slate-100 text-sm"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="shrink-0">🛏️</span>
                <div className="min-w-0">
                  <div className="font-semibold text-slate-700 text-[13px] truncate">
                    {seg.spaceName}
                    {seg.bedNumber != null && (
                      <span className="ml-1.5 font-normal text-slate-400">Bed #{seg.bedNumber}</span>
                    )}
                  </div>
                  <div className="font-mono text-[11px] text-slate-400 mt-0.5">
                    {seg.fromDate === seg.toDate ? seg.fromDate : `${seg.fromDate} → ${seg.toDate}`}
                    {" · "}
                    {seg.days}d × {fmt.currency(seg.amount)}/day
                  </div>
                </div>
              </div>
              <div className="font-bold text-slate-700 text-[13px] shrink-0 ml-3">{fmt.currency(seg.total)}</div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between px-4 py-3.5 rounded-[3px] bg-[#0F6E5C]/5 border border-[#0F6E5C]/20">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-[#0F6E5C] mb-0.5">
              Total Bed Charge
            </div>
            <div className="text-[11px] text-slate-400">
              {days} day{days !== 1 ? "s" : ""} accrued
            </div>
          </div>
          <div className="text-2xl font-black text-[#0F6E5C]">{fmt.currency(gross)}</div>
        </div>

        <Btn variant="secondary" size="lg" className="w-full" onClick={onClose}>
          Close
        </Btn>
      </div>
    </Modal>
  );
}

// ─── Add Discount Modal ───────────────────────────────────────────────────────

function AddDiscountModal({ open, onClose, onSuccess, patient, patientId }) {
  const isRegular = patient.dealType === "regular";
  const categories = isRegular ? DISCOUNT_CATEGORIES_REGULAR : DISCOUNT_CATEGORIES_PACKAGE;

  const [category, setCategory] = useState("");
  const [providedBy, setProvidedBy] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setCategory("");
    setProvidedBy("");
    setAmount("");
    setNote("");
    setError("");
  };
  const handleClose = () => {
    reset();
    onClose();
  };

  const getMaxForCategory = () => {
    if (!category) return null;
    const breakdown = calcBillBreakdown(patient);
    const existing = (patient.discounts ?? []).filter((d) => d.category === category).reduce((s, d) => s + d.amount, 0);
    if (category === "grand-total") {
      const grossTotal = isRegular ? breakdown.total : (patient.packageDeal?.totalAmount ?? 0);
      return Math.max(0, grossTotal - existing);
    }
    const catMap = {
      test: breakdown.testBill,
      medicine: breakdown.medicineBill,
      other: breakdown.otherBill,
      "bed-charge": breakdown.bedBill,
    };
    return Math.max(0, (catMap[category] ?? 0) - existing);
  };

  const handleSubmit = async () => {
    setError("");
    if (!category) return setError("Select a category");
    if (!providedBy) return setError("Select who is providing the discount");
    const amt = parseFloat(amount);
    if (!amount || isNaN(amt) || amt <= 0) return setError("Enter a valid amount");
    const max = getMaxForCategory();
    if (max !== null && amt > max) return setError(`Max discount is ${fmt.currency(max)}`);

    // Guard: patientId must be a real ID string
    if (!patientId || patientId === "undefined") {
      return setError("Patient ID is missing — please refresh the page.");
    }

    setLoading(true);
    try {
      await indoorPatientService.addDiscount(patientId, { category, amount: amt, providedBy, note: note.trim() });
      reset();
      onSuccess();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.error ?? "Failed to apply discount");
    } finally {
      setLoading(false);
    }
  };

  const maxForCategory = getMaxForCategory();

  return (
    <Modal open={open} onClose={handleClose} title="Add Discount" width="max-w-lg">
      <div className="space-y-5">
        <ErrorMsg msg={error} />

        {/* Category */}
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-slate-400 mb-2">Apply Discount To</p>
          <div className="grid grid-cols-3 gap-1.5">
            {categories.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => {
                  setCategory(c.value);
                  setAmount("");
                  setError("");
                }}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-[3px] border text-[13px] font-semibold transition-all text-left ${
                  category === c.value
                    ? "bg-[#0F6E5C] border-[#0F6E5C] text-white"
                    : "bg-white border-slate-200 text-slate-600 hover:border-[#0F6E5C]/40 hover:bg-[#0F6E5C]/5"
                }`}
              >
                <span className="shrink-0">{c.icon}</span>
                <span className="leading-tight">{c.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Provider */}
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-slate-400 mb-2">Provided By</p>
          <div className="grid grid-cols-3 gap-1.5">
            {DISCOUNT_PROVIDERS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setProvidedBy(p.value)}
                className={`py-2 px-3 rounded-[3px] border text-[13px] font-semibold transition-all ${
                  providedBy === p.value
                    ? "bg-[#0F6E5C] border-[#0F6E5C] text-white"
                    : "bg-white border-slate-200 text-slate-600 hover:border-[#0F6E5C]/40 hover:bg-[#0F6E5C]/5"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Amount + Note */}
        <div className="grid grid-cols-2 gap-3">
          <Field label={maxForCategory != null ? `Amount (max ${fmt.currency(maxForCategory)})` : "Amount (BDT)"}>
            <Input
              type="number"
              min="0.01"
              step="0.01"
              max={maxForCategory ?? undefined}
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </Field>
          <Field label="Note (optional)">
            <Input placeholder="Reason…" value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
        </div>

        {category && maxForCategory === 0 && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-[3px] bg-red-50 border border-red-200 text-xs text-red-700">
            <span>⛔</span>
            <span>This category has already been fully discounted.</span>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Btn variant="secondary" size="lg" className="flex-1" onClick={handleClose}>
            Cancel
          </Btn>
          <Btn
            variant="primary"
            size="lg"
            className="flex-1"
            loading={loading}
            onClick={handleSubmit}
            disabled={maxForCategory === 0}
          >
            Apply Discount
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

// ─── Discount History Modal ───────────────────────────────────────────────────

function DiscountHistoryModal({ open, onClose, patient }) {
  const discounts = patient.discounts ?? [];
  const total = discounts.reduce((s, d) => s + d.amount, 0);

  return (
    <Modal open={open} onClose={onClose} title="Applied Discounts" width="max-w-lg">
      <div className="space-y-3">
        {!discounts.length ? (
          <p className="text-sm text-slate-400 text-center py-8">No discounts applied yet.</p>
        ) : (
          <>
            <div className="space-y-1.5">
              {discounts.map((d, i) => {
                const st = PROVIDER_STYLE[d.providedBy] ?? PROVIDER_STYLE.hospital;
                return (
                  <div
                    key={i}
                    className={`flex items-start justify-between gap-3 px-3.5 py-3 rounded-[3px] border ${st.row}`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span className="mt-0.5 shrink-0">{CAT_ICON[d.category] ?? "🏷️"}</span>
                      <div className="min-w-0">
                        <div className={`text-[13px] font-semibold ${st.text} leading-tight`}>
                          {CAT_LABEL[d.category] ?? d.category}
                        </div>
                        <div className={`text-[11px] mt-0.5 ${st.sub}`}>
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded-[2px] text-[9px] font-bold uppercase tracking-wider mr-1 ${st.pill}`}
                          >
                            {d.providedBy}
                          </span>
                          {d.appliedBy?.name && <>{d.appliedBy.name} · </>}
                          {d.appliedAt && <span className="font-mono">{fmt.date(d.appliedAt)}</span>}
                        </div>
                        {d.note && <div className="text-[11px] text-slate-400 mt-0.5 italic">"{d.note}"</div>}
                      </div>
                    </div>
                    <div className={`text-[13px] font-black ${st.text} shrink-0 pt-0.5`}>
                      − {fmt.currency(d.amount)}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between px-3.5 py-2.5 rounded-[3px] bg-rose-50 border border-rose-100 text-sm font-bold">
              <span className="text-slate-600">Total Discounts</span>
              <span className="text-rose-600">− {fmt.currency(total)}</span>
            </div>
          </>
        )}
        <Btn variant="secondary" size="lg" className="w-full" onClick={onClose}>
          Close
        </Btn>
      </div>
    </Modal>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BillingSummary({ patient, onCollect, onExtra, onAddExpenses, onRefresh, patientId }) {
  const [bedDetailsOpen, setBedDetailsOpen] = useState(false);
  const [addDiscountOpen, setAddDiscountOpen] = useState(false);
  const [discountHistoryOpen, setDiscountHistoryOpen] = useState(false);

  const isAdmitted = patient.status === "admitted";
  const isPackage = patient.dealType === "package";

  const breakdown = calcBillBreakdown(patient);
  const {
    testBill,
    medicineBill,
    otherBill,
    bedBill,
    testDiscount,
    medicineDiscount,
    otherDiscount,
    bedDiscount,
    grandTotalDiscount,
    totalDiscount,
  } = breakdown;
  const { total, paid, due, grossTotal } = getBillingSummary(patient);

  const isFullyPaid = due <= 0;
  const extraPaid = isPackage ? Math.max(0, paid - total) : 0;
  const appliedDiscounts = patient.discounts ?? [];
  const hasDiscounts = totalDiscount > 0;

  // ── Category ledger rows ──────────────────────────────────────────────────

  const categoryRows =
    patient.dealType === "regular"
      ? [
          { label: "Test", value: testBill, discount: testDiscount, accent: "text-violet-700", dot: "bg-violet-400" },
          {
            label: "Medicine",
            value: medicineBill,
            discount: medicineDiscount,
            accent: "text-blue-700",
            dot: "bg-blue-400",
          },
          { label: "Other", value: otherBill, discount: otherDiscount, accent: "text-slate-600", dot: "bg-slate-300" },
          {
            label: "Bed Charge",
            value: bedBill,
            discount: bedDiscount,
            accent: "text-[#0F6E5C]",
            dot: "bg-[#0F6E5C]",
            // "details" link is LEFT of the leader line — rendered via detailBtn
            detailBtn: (
              <button
                type="button"
                onClick={() => setBedDetailsOpen(true)}
                className="font-mono text-[10px] text-[#0F6E5C] hover:text-[#0a5a4a] underline underline-offset-2 shrink-0 transition-colors"
              >
                details ↗
              </button>
            ),
          },
        ]
      : [
          {
            label: "Package",
            value: patient.packageDeal?.totalAmount ?? 0,
            discount: 0,
            accent: "text-purple-700",
            dot: "bg-purple-400",
            subLabel: patient.packageDeal?.description,
          },
          {
            label: "Test",
            value: testBill,
            discount: testDiscount,
            accent: "text-violet-500",
            dot: "bg-violet-300",
            subLabel: "ref",
          },
          {
            label: "Medicine",
            value: medicineBill,
            discount: medicineDiscount,
            accent: "text-blue-500",
            dot: "bg-blue-300",
            subLabel: "ref",
          },
          {
            label: "Other",
            value: otherBill,
            discount: otherDiscount,
            accent: "text-slate-400",
            dot: "bg-slate-300",
            subLabel: "ref",
          },
        ];

  return (
    <>
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        {/* ── Header ────────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 px-5 py-3.5 bg-[#FAF9F5] border-b border-slate-200">
          {/* Left: title + discount badge */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-base shrink-0">💰</span>
            <span className="text-[13px] font-bold text-slate-700 tracking-wide">Billing Summary</span>
            {appliedDiscounts.length > 0 && (
              <button
                type="button"
                onClick={() => setDiscountHistoryOpen(true)}
                className="flex items-center gap-1 ml-0.5 px-2 py-0.5 rounded-full bg-rose-100 border border-rose-200 text-[10px] font-bold text-rose-600 hover:bg-rose-200 transition-colors shrink-0"
              >
                🏷️ {appliedDiscounts.length}
              </button>
            )}
          </div>

          {/* Right: Add Expenses + Collect + Add Discount buttons together */}
          {isAdmitted && (
            <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
              {onAddExpenses && (
                <button
                  type="button"
                  onClick={onAddExpenses}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] border border-slate-300 bg-white hover:bg-slate-50 active:scale-95 text-slate-600 text-[12px] font-semibold transition-all"
                >
                  ➕ Add Expenses
                </button>
              )}
              {due > 0 && (
                <button
                  type="button"
                  onClick={onCollect}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-[12px] font-bold tracking-wide transition-all shadow-sm"
                >
                  💳 Collect {fmt.currency(due)}
                </button>
              )}
              {isFullyPaid && isPackage && (
                <button
                  type="button"
                  onClick={onExtra}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] border border-slate-300 bg-white hover:bg-slate-50 active:scale-95 text-slate-600 text-[12px] font-semibold transition-all"
                >
                  ➕ Extra
                </button>
              )}
              <button
                type="button"
                onClick={() => setAddDiscountOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] bg-[#0F6E5C] hover:bg-[#0a5a4a] active:scale-95 text-white text-[12px] font-bold tracking-wide transition-all shadow-sm"
              >
                <svg
                  className="w-3.5 h-3.5 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Discount
              </button>
            </div>
          )}
        </div>

        <div className="px-5 py-4">
          {/* ── Ledger rows ──────────────────────────────────────────────────── */}
          <div className="divide-y divide-dotted divide-slate-200">
            {categoryRows.map(({ label, value, discount, accent, dot, detailBtn, subLabel }) => (
              <div key={label} className="flex items-center gap-2 py-2.5">
                {/* dot */}
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
                {/* label + optional subLabel + optional detailBtn (LEFT side) */}
                <div className="flex items-baseline gap-1.5 shrink-0">
                  <span className="text-[13px] font-medium text-slate-600 whitespace-nowrap">{label}</span>
                  {subLabel && (
                    <span className="font-mono text-[9px] text-slate-400 uppercase tracking-wider">{subLabel}</span>
                  )}
                  {detailBtn}
                </div>
                {/* dotted leader */}
                <div className="flex-1 border-b border-dotted border-slate-200 mx-1 min-w-[12px]" />
                {/* discount inline */}
                {discount > 0 && (
                  <span className="font-mono text-[11px] text-rose-500 shrink-0">− {fmt.currency(discount)}</span>
                )}
                {/* value */}
                <span className={`font-mono text-[13px] font-bold ${accent} shrink-0 tabular-nums`}>
                  {fmt.currency(value)}
                </span>
              </div>
            ))}
          </div>

          {/* Grand-total discount row */}
          {grandTotalDiscount > 0 && (
            <div className="flex items-center gap-2 py-2.5 border-t border-dotted border-slate-200">
              <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-rose-300" />
              <span className="text-[13px] font-medium text-rose-600 shrink-0">Grand Total Discount</span>
              <div className="flex-1 border-b border-dotted border-rose-200 mx-1 min-w-[12px]" />
              <span className="font-mono text-[13px] font-bold text-rose-600 shrink-0 tabular-nums">
                − {fmt.currency(grandTotalDiscount)}
              </span>
            </div>
          )}

          {/* ── Applied discounts inline list ─────────────────────────────── */}
          {appliedDiscounts.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-100 space-y-1">
              {appliedDiscounts.map((d, i) => {
                const st = PROVIDER_STYLE[d.providedBy] ?? PROVIDER_STYLE.hospital;
                return (
                  <div
                    key={i}
                    className={`flex items-center justify-between gap-2 px-3 py-1.5 rounded-[2px] border ${st.row}`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[12px] shrink-0">{CAT_ICON[d.category] ?? "🏷️"}</span>
                      <span className={`text-[12px] font-semibold ${st.text} truncate`}>
                        {CAT_LABEL[d.category] ?? d.category}
                      </span>
                      <span
                        className={`shrink-0 px-1.5 py-0.5 rounded-[2px] text-[9px] font-bold uppercase tracking-wider ${st.pill}`}
                      >
                        {d.providedBy}
                      </span>
                      {d.note && <span className="text-[11px] text-slate-400 italic truncate">"{d.note}"</span>}
                    </div>
                    <span className={`font-mono text-[12px] font-bold ${st.text} shrink-0`}>
                      − {fmt.currency(d.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Totals ────────────────────────────────────────────────────── */}
          <div className="mt-4 pt-4 border-t border-slate-200 space-y-1.5">
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-slate-400">{hasDiscounts ? "Gross Bill" : "Total Bill"}</span>
              <span className="font-mono text-slate-600 tabular-nums">{fmt.currency(grossTotal)}</span>
            </div>
            {hasDiscounts && (
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-rose-500">Discount</span>
                <span className="font-mono text-rose-500 tabular-nums">− {fmt.currency(totalDiscount)}</span>
              </div>
            )}
            {hasDiscounts && (
              <div className="flex items-center justify-between text-[13px]">
                <span className="font-semibold text-slate-700">Net Bill</span>
                <span className="font-mono font-bold text-slate-800 tabular-nums">{fmt.currency(total)}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-slate-400">Collected</span>
              <span className="font-mono font-semibold text-[#0F6E5C] tabular-nums">{fmt.currency(paid)}</span>
            </div>

            {/* Due / Paid strip */}
            <div
              className={`flex items-center justify-between mt-2 px-4 py-3 rounded-[3px] ${
                isFullyPaid ? "bg-[#0F6E5C]/8 border border-[#0F6E5C]/20" : "bg-red-50 border border-red-100"
              }`}
            >
              <span
                className={`font-mono text-[11px] font-bold uppercase tracking-widest ${isFullyPaid ? "text-[#0F6E5C]" : "text-red-600"}`}
              >
                {isFullyPaid ? "✓ Fully Paid" : "Due"}
              </span>
              {!isFullyPaid && (
                <span className="font-mono text-lg font-black text-red-600 tabular-nums">
                  {fmt.currency(Math.max(0, due))}
                </span>
              )}
            </div>
          </div>

          {/* Package extra-paid note */}
          {isPackage && extraPaid > 0 && (
            <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-[3px] bg-amber-50 border border-amber-200 text-xs text-amber-700">
              <span>ℹ️</span>
              <span>{fmt.currency(extraPaid)} collected above package total.</span>
            </div>
          )}
        </div>
      </div>

      <BedChargeDetailsModal open={bedDetailsOpen} onClose={() => setBedDetailsOpen(false)} patient={patient} />
      <AddDiscountModal
        open={addDiscountOpen}
        onClose={() => setAddDiscountOpen(false)}
        onSuccess={() => onRefresh?.()}
        patient={patient}
        patientId={patientId}
      />
      <DiscountHistoryModal
        open={discountHistoryOpen}
        onClose={() => setDiscountHistoryOpen(false)}
        patient={patient}
      />
    </>
  );
}
