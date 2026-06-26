// BillingSummary.jsx
// Unified billing overview for an indoor patient.
//
// Shows per-category bills (Test, Medicine, Other, Bed Charge) with a
// bed-charge details modal, then a totals strip (Total / Collected / Due).
// Includes discount management: add discounts per category or referrer/hospital/doctor,
// and displays applied discounts inline.
//
// Props:
//   patient       – full indoor patient object
//   onCollect     – called when the user clicks "Collect Payment" (no args)
//   onExtra       – called when the user clicks "Collect Extra" (package fully paid)
//   onRefresh     – called after a discount is successfully applied
//   patientId     – string ID of the patient (for API calls)

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

  // Sum discounts per category
  const discountByCategory = (cat) => discounts.filter((d) => d.category === cat).reduce((s, d) => s + d.amount, 0);

  const testDiscount = discountByCategory("test");
  const medicineDiscount = discountByCategory("medicine");
  const otherDiscount = discountByCategory("other") + discountByCategory("product");
  const bedDiscount = discountByCategory("bed-charge");

  return {
    testBill,
    medicineBill,
    otherBill,
    bedBill,
    testDiscount,
    medicineDiscount,
    otherDiscount,
    bedDiscount,
    totalDiscount: testDiscount + medicineDiscount + otherDiscount + bedDiscount,
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

// ─── Discount category config ─────────────────────────────────────────────────

const DISCOUNT_CATEGORIES = [
  { value: "test", label: "Test Bill", icon: "🧪" },
  { value: "medicine", label: "Medicine Bill", icon: "💊" },
  { value: "other", label: "Other Bill", icon: "🧾" },
  { value: "bed-charge", label: "Bed Charge", icon: "🛏️", regularOnly: true },
];

const DISCOUNT_PROVIDERS = [
  { value: "hospital", label: "Hospital" },
  { value: "lab", label: "Lab" },
  { value: "referrer", label: "Referrer" },
];

const providerColor = {
  hospital: { bg: "bg-blue-50", border: "border-blue-100", text: "text-blue-700", badge: "blue" },
  lab: { bg: "bg-violet-50", border: "border-violet-100", text: "text-violet-700", badge: "purple" },
  referrer: { bg: "bg-emerald-50", border: "border-emerald-100", text: "text-emerald-700", badge: "green" },
};

// ─── Add Discount Modal ───────────────────────────────────────────────────────

function AddDiscountModal({ open, onClose, onSuccess, patient, patientId }) {
  const isRegular = patient.dealType === "regular";

  const [category, setCategory] = useState("");
  const [providedBy, setProvidedBy] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const resetForm = () => {
    setCategory("");
    setProvidedBy("");
    setAmount("");
    setNote("");
    setError("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Compute the maximum discount allowed for the selected category
  const getMaxForCategory = () => {
    const breakdown = calcBillBreakdown(patient);
    const existing = (patient.discounts ?? []).filter((d) => d.category === category).reduce((s, d) => s + d.amount, 0);

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
    if (amt > max) return setError(`Max discount for this category is ${fmt.currency(max)}`);

    setLoading(true);
    try {
      await indoorPatientService.addDiscount(patientId, { category, amount: amt, providedBy, note: note.trim() });
      resetForm();
      onSuccess();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.error ?? "Failed to apply discount");
    } finally {
      setLoading(false);
    }
  };

  const availableCategories = DISCOUNT_CATEGORIES.filter((c) => !c.regularOnly || isRegular);
  const maxForCategory = category ? getMaxForCategory() : null;

  return (
    <Modal open={open} onClose={handleClose} title="Add Discount" width="max-w-lg">
      <div className="space-y-4">
        <ErrorMsg msg={error} />

        {/* Category */}
        <div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Apply Discount To</div>
          <div className="grid grid-cols-2 gap-2">
            {availableCategories.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => {
                  setCategory(c.value);
                  setAmount("");
                  setError("");
                }}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all text-left ${
                  category === c.value
                    ? "bg-slate-800 border-slate-800 text-white shadow-sm"
                    : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <span className="text-base shrink-0">{c.icon}</span>
                <span className="leading-tight">{c.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Provider */}
        <div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Provided By</div>
          <div className="flex gap-2">
            {DISCOUNT_PROVIDERS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setProvidedBy(p.value)}
                className={`flex-1 py-2 px-3 rounded-xl border text-sm font-semibold transition-all ${
                  providedBy === p.value
                    ? "bg-slate-800 border-slate-800 text-white shadow-sm"
                    : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Amount + note */}
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
            <Input placeholder="Reason for discount…" value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
        </div>

        {/* Max hint */}
        {category && maxForCategory != null && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-700">
            <span>ℹ️</span>
            <span>
              Remaining discountable amount for this category:{" "}
              <span className="font-bold">{fmt.currency(maxForCategory)}</span>
            </span>
          </div>
        )}

        {maxForCategory === 0 && category && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
            <span>⛔</span>
            <span>This category has already been fully discounted.</span>
          </div>
        )}

        <div className="flex gap-3 pt-1">
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

  const categoryLabel = (cat) => DISCOUNT_CATEGORIES.find((c) => c.value === cat)?.label ?? cat;
  const categoryIcon = (cat) => DISCOUNT_CATEGORIES.find((c) => c.value === cat)?.icon ?? "🏷️";

  return (
    <Modal open={open} onClose={onClose} title="Applied Discounts" width="max-w-lg">
      <div className="space-y-4">
        {!discounts.length ? (
          <p className="text-sm text-slate-400 text-center py-6">No discounts applied yet.</p>
        ) : (
          <div className="space-y-2">
            {discounts.map((d, i) => {
              const colors = providerColor[d.providedBy] ?? providerColor.hospital;
              return (
                <div
                  key={i}
                  className={`flex items-start justify-between gap-3 px-3.5 py-3 rounded-xl border ${colors.bg} ${colors.border}`}
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span className="text-base mt-0.5 shrink-0">{categoryIcon(d.category)}</span>
                    <div className="min-w-0">
                      <div className={`text-sm font-semibold ${colors.text} leading-tight`}>
                        {categoryLabel(d.category)}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        By <span className="font-medium capitalize">{d.providedBy}</span>
                        {d.appliedBy?.name && <> · {d.appliedBy.name}</>}
                        {d.appliedAt && <> · {fmt.date(d.appliedAt)}</>}
                      </div>
                      {d.note && <div className="text-xs text-slate-400 mt-0.5 italic">"{d.note}"</div>}
                    </div>
                  </div>
                  <div className={`text-sm font-black ${colors.text} shrink-0 pt-0.5`}>− {fmt.currency(d.amount)}</div>
                </div>
              );
            })}

            <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-sm font-bold">
              <span className="text-slate-600">Total Discounts Applied</span>
              <span className="text-red-600">− {fmt.currency(discounts.reduce((s, d) => s + d.amount, 0))}</span>
            </div>
          </div>
        )}

        <Btn variant="secondary" size="lg" className="w-full" onClick={onClose}>
          Close
        </Btn>
      </div>
    </Modal>
  );
}

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
      <div className="space-y-5">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm">
          <span className="text-base">📅</span>
          <div className="flex-1 min-w-0">
            <span className="text-slate-500">Period: </span>
            <span className="font-semibold text-slate-700">{start}</span>
            <span className="text-slate-400 mx-2">→</span>
            <span className="font-semibold text-slate-700">{end}</span>
            {!isReleased && (
              <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-blue-500 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-md">
                ongoing
              </span>
            )}
          </div>
          <div className="text-xs text-slate-400 shrink-0">
            {days} day{days !== 1 ? "s" : ""}
          </div>
        </div>

        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Daily Accrual by Ward</p>
          <div className="space-y-1.5">
            {segments.map((seg, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-white border border-slate-100 text-sm"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-base shrink-0">🛏️</span>
                  <div className="min-w-0">
                    <div className="font-medium text-slate-800 truncate">
                      {seg.spaceName}
                      {seg.bedNumber != null && (
                        <span className="ml-1.5 text-xs text-slate-400 font-normal">Bed #{seg.bedNumber}</span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400">
                      {seg.fromDate === seg.toDate ? seg.fromDate : `${seg.fromDate} → ${seg.toDate}`} · {seg.days} day
                      {seg.days !== 1 ? "s" : ""} × {fmt.currency(seg.amount)}/day
                    </div>
                  </div>
                </div>
                <div className="font-bold text-slate-700 shrink-0 ml-3">{fmt.currency(seg.total)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between px-4 py-3.5 rounded-xl bg-indigo-50 border border-indigo-200">
          <div>
            <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-0.5">Total Bed Charge</div>
            <div className="text-[11px] text-indigo-400">
              {days} day{days !== 1 ? "s" : ""} accrued
            </div>
          </div>
          <div className="text-2xl font-black text-indigo-700">{fmt.currency(gross)}</div>
        </div>

        <Btn variant="secondary" size="lg" className="w-full" onClick={onClose}>
          Close
        </Btn>
      </div>
    </Modal>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BillingSummary({ patient, onCollect, onExtra, onRefresh, patientId }) {
  const [bedDetailsOpen, setBedDetailsOpen] = useState(false);
  const [discountModalOpen, setDiscountModalOpen] = useState(false);
  const [discountHistoryOpen, setDiscountHistoryOpen] = useState(false);

  const isAdmitted = patient.status === "admitted";
  const isRegular = patient.dealType === "regular";
  const isPackage = patient.dealType === "package";

  const {
    testBill,
    medicineBill,
    otherBill,
    bedBill,
    testDiscount,
    medicineDiscount,
    otherDiscount,
    bedDiscount,
    totalDiscount,
  } = calcBillBreakdown(patient);

  const { total, paid, due, grossTotal } = getBillingSummary(patient);
  const isFullyPaid = due <= 0;
  const extraPaid = isPackage ? Math.max(0, paid - total) : 0;
  const appliedDiscounts = patient.discounts ?? [];

  // ── Category cards ──────────────────────────────────────────────────────────

  const categories = isRegular
    ? [
        {
          label: "Test Bill",
          value: testBill,
          discount: testDiscount,
          icon: "🧪",
          valueColor: "text-violet-700",
          bg: "bg-violet-50",
          border: "border-violet-100",
        },
        {
          label: "Medicine Bill",
          value: medicineBill,
          discount: medicineDiscount,
          icon: "💊",
          valueColor: "text-blue-700",
          bg: "bg-blue-50",
          border: "border-blue-100",
        },
        {
          label: "Other Bill",
          value: otherBill,
          discount: otherDiscount,
          icon: "🧾",
          valueColor: "text-slate-700",
          bg: "bg-slate-50",
          border: "border-slate-100",
        },
        {
          label: "Bed Charge",
          value: bedBill,
          discount: bedDiscount,
          icon: "🛏️",
          valueColor: "text-indigo-700",
          bg: "bg-indigo-50",
          border: "border-indigo-100",
          action: (
            <button
              type="button"
              onClick={() => setBedDetailsOpen(true)}
              className="text-[10px] font-bold text-indigo-500 hover:text-indigo-700 uppercase tracking-wider underline underline-offset-2 transition-colors"
            >
              Details
            </button>
          ),
        },
      ]
    : [
        {
          label: "Package",
          value: patient.packageDeal?.totalAmount ?? 0,
          discount: 0,
          icon: "📦",
          valueColor: "text-purple-700",
          bg: "bg-purple-50",
          border: "border-purple-100",
          subLabel: patient.packageDeal?.description,
        },
        {
          label: "Test Bill",
          value: testBill,
          discount: testDiscount,
          icon: "🧪",
          valueColor: "text-violet-600",
          bg: "bg-violet-50",
          border: "border-violet-100",
          subLabel: "for reference",
        },
        {
          label: "Medicine Bill",
          value: medicineBill,
          discount: medicineDiscount,
          icon: "💊",
          valueColor: "text-blue-600",
          bg: "bg-blue-50",
          border: "border-blue-100",
          subLabel: "for reference",
        },
        {
          label: "Other Bill",
          value: otherBill,
          discount: otherDiscount,
          icon: "🧾",
          valueColor: "text-slate-600",
          bg: "bg-slate-50",
          border: "border-slate-100",
          subLabel: "for reference",
        },
      ];

  // ── Totals strip ────────────────────────────────────────────────────────────

  // For the totals strip, show Gross / Discount / Net / Collected / Due
  const hasDiscounts = totalDiscount > 0;

  const totalsBase = [
    {
      label: hasDiscounts ? "Gross Bill" : "Total Bill",
      value: fmt.currency(grossTotal),
      color: "text-slate-800",
      bg: "bg-white",
      border: "border-slate-200",
    },
    ...(hasDiscounts
      ? [
          {
            label: "Discount",
            value: `− ${fmt.currency(totalDiscount)}`,
            color: "text-rose-600",
            bg: "bg-rose-50",
            border: "border-rose-100",
          },
          {
            label: "Net Bill",
            value: fmt.currency(total),
            color: "text-slate-800",
            bg: "bg-slate-50",
            border: "border-slate-200",
          },
        ]
      : []),
    {
      label: "Collected",
      value: fmt.currency(paid),
      color: "text-emerald-700",
      bg: "bg-emerald-50",
      border: "border-emerald-100",
    },
    {
      label: isFullyPaid ? "Status" : "Due",
      value: isFullyPaid ? "Fully Paid ✅" : fmt.currency(Math.max(0, due)),
      color: isFullyPaid ? "text-emerald-600" : due > 0 ? "text-red-600" : "text-emerald-600",
      bg: isFullyPaid ? "bg-emerald-50" : due > 0 ? "bg-red-50" : "bg-emerald-50",
      border: isFullyPaid ? "border-emerald-100" : due > 0 ? "border-red-100" : "border-emerald-100",
    },
  ];

  return (
    <>
      <SectionCard
        title="Billing Summary"
        icon="💰"
        action={
          isAdmitted && (
            <Btn variant="ghost" size="sm" onClick={() => setDiscountModalOpen(true)}>
              🏷️ Add Discount
            </Btn>
          )
        }
      >
        <div className="space-y-4">
          {/* Category cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {categories.map(({ label, value, discount, icon, valueColor, bg, border, action, subLabel }) => (
              <div key={label} className={`${bg} ${border} border rounded-xl px-4 py-3 flex flex-col gap-1`}>
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{icon}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">
                      {label}
                    </span>
                  </div>
                  {action && <div className="shrink-0">{action}</div>}
                </div>
                <p className={`text-lg font-black ${valueColor} leading-none`}>{fmt.currency(value)}</p>
                {discount > 0 && (
                  <p className="text-[10px] font-semibold text-rose-500 leading-none">− {fmt.currency(discount)} off</p>
                )}
                {subLabel && !discount && <p className="text-[10px] text-slate-400 truncate">{subLabel}</p>}
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="border-t border-slate-100" />

          {/* Applied discounts inline summary */}
          {appliedDiscounts.length > 0 && (
            <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-rose-50 border border-rose-100">
              <div className="flex items-center gap-2 text-sm">
                <span>🏷️</span>
                <span className="font-semibold text-rose-700">
                  {appliedDiscounts.length} discount{appliedDiscounts.length !== 1 ? "s" : ""} applied
                </span>
                <span className="text-rose-500 text-xs">· saving {fmt.currency(totalDiscount)}</span>
              </div>
              <button
                type="button"
                onClick={() => setDiscountHistoryOpen(true)}
                className="text-[10px] font-bold text-rose-500 hover:text-rose-700 uppercase tracking-wider underline underline-offset-2 transition-colors"
              >
                View All
              </button>
            </div>
          )}

          {/* Package extra-paid note */}
          {isPackage && extraPaid > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-700">
              <span>ℹ️</span>
              <span>{fmt.currency(extraPaid)} collected above package total.</span>
            </div>
          )}

          {/* Totals strip */}
          <div
            className={`grid gap-3 ${totalsBase.length === 3 ? "grid-cols-3" : totalsBase.length === 4 ? "grid-cols-4" : totalsBase.length === 5 ? "grid-cols-5" : "grid-cols-2"}`}
          >
            {totalsBase.map(({ label, value, color, bg, border }) => (
              <div key={label} className={`${bg} ${border} border rounded-xl px-4 py-3`}>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</div>
                <div className={`text-base font-black ${color} leading-tight`}>{value}</div>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          {isAdmitted && (
            <div className="flex gap-2 pt-1">
              {due > 0 && (
                <Btn variant="success" size="sm" className="flex-1" onClick={onCollect}>
                  💳 Collect {fmt.currency(due)}
                </Btn>
              )}
              {isFullyPaid && isPackage && (
                <Btn variant="secondary" size="sm" className="flex-1" onClick={onExtra}>
                  ➕ Collect Extra
                </Btn>
              )}
            </div>
          )}
        </div>
      </SectionCard>

      <BedChargeDetailsModal open={bedDetailsOpen} onClose={() => setBedDetailsOpen(false)} patient={patient} />

      <AddDiscountModal
        open={discountModalOpen}
        onClose={() => setDiscountModalOpen(false)}
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
