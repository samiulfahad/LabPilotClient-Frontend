// BedChargeSection.jsx
// Shows the auto-accrued bed charge (days admitted × charge/day, honoring ward
// transfers) plus any manual adjustments, with a button to record an increase
// or decrease. Replaces the old per-day calendar/collection drawer.
//
// Props:
//   patient    – full indoor patient object
//   onSuccess  – callback to re-fetch patient after a mutation

import { useState } from "react";
import indoorPatientService from "../../api/indoorPatient";
import { Badge, Btn, ErrorMsg, Field, Input, Modal, SectionCard, fmt } from "./indoorPatientHelpers";

const tsBst = (ts) => new Date(ts + 6 * 3600 * 1000).toISOString().slice(0, 10);
const todayBst = () => tsBst(Date.now());

// ─── Auto-accrual: sum chargePerDay for every admitted day, honoring ward transfers ──
export function calcBedAccrual(patient) {
  const start = tsBst(patient.admittedAt);
  const end = patient.releasedAt ? tsBst(patient.releasedAt) : todayBst();

  const startD = new Date(start + "T00:00:00Z");
  const endD = new Date(end + "T00:00:00Z");

  // Build day-by-day rows for the details view
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

  const adjustments = patient.bedChargeAdjustments ?? [];
  const adjustmentTotal = adjustments.reduce((s, a) => s + a.amount, 0);
  const days = Math.round((endD - startD) / 86400000) + 1;

  return { days, gross, adjustmentTotal, total: gross + adjustmentTotal, adjustments, rows, start, end };
}

// ─── Details Modal ────────────────────────────────────────────────────────────
function BedChargeDetailsModal({ open, onClose, patient }) {
  const { days, gross, adjustmentTotal, total, adjustments, rows, start, end } = calcBedAccrual(patient);
  const isReleased = !!patient.releasedAt;

  // Group consecutive rows with same space+amount into segments for a cleaner view
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
        {/* Admission period banner */}
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

        {/* Per-ward segments */}
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

        {/* Accrual subtotal */}
        <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold">
          <span className="text-slate-600">Accrued subtotal ({days} days)</span>
          <span className="text-slate-800">{fmt.currency(gross)}</span>
        </div>

        {/* Adjustments */}
        {adjustments.length > 0 && (
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Adjustments</p>
            <div className="space-y-1.5">
              {[...adjustments]
                .sort((a, b) => b.appliedAt - a.appliedAt)
                .map((a, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-white border border-slate-100 text-sm"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Badge color={a.direction === "decrease" ? "amber" : "green"}>
                        {a.direction === "decrease" ? "▼" : "▲"}
                      </Badge>
                      <div className="min-w-0">
                        <div className="text-slate-600 truncate">{a.note || "No note"}</div>
                        <div className="text-xs text-slate-400">
                          {fmt.date(a.appliedAt)}
                          {a.appliedBy?.name && (
                            <>
                              {" "}
                              · <span className="text-slate-500 font-medium">{a.appliedBy.name}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className={`font-bold shrink-0 ml-3 ${a.amount < 0 ? "text-amber-600" : "text-emerald-600"}`}>
                      {a.amount > 0 ? "+" : ""}
                      {fmt.currency(a.amount)}
                    </span>
                  </div>
                ))}
            </div>

            {/* Adjustment subtotal */}
            <div className="flex items-center justify-between px-4 py-2.5 mt-1.5 rounded-xl bg-slate-50 border border-slate-100 text-sm font-semibold">
              <span className="text-slate-500">Adjustments total</span>
              <span className={adjustmentTotal >= 0 ? "text-emerald-600" : "text-amber-600"}>
                {adjustmentTotal > 0 ? "+" : ""}
                {fmt.currency(adjustmentTotal)}
              </span>
            </div>
          </div>
        )}

        {/* Grand total */}
        <div className="flex items-center justify-between px-4 py-3.5 rounded-xl bg-indigo-50 border border-indigo-200">
          <div>
            <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-0.5">Total Bed Charge</div>
            <div className="text-[11px] text-indigo-400">
              {fmt.currency(gross)}
              {adjustmentTotal !== 0 && (
                <>
                  {" "}
                  {adjustmentTotal > 0 ? "+" : "−"} {fmt.currency(Math.abs(adjustmentTotal))} adj.
                </>
              )}
            </div>
          </div>
          <div className="text-2xl font-black text-indigo-700">{fmt.currency(total)}</div>
        </div>

        <Btn variant="secondary" size="lg" className="w-full" onClick={onClose}>
          Close
        </Btn>
      </div>
    </Modal>
  );
}

// ─── Adjust modal ─────────────────────────────────────────────────────────────
function AdjustBedChargeModal({ open, patient, onClose, onSuccess }) {
  const [direction, setDirection] = useState("increase");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setDirection("increase");
    setAmount("");
    setNote("");
    setError("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    setError("");
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return setError("Enter a valid amount");

    setLoading(true);
    try {
      await indoorPatientService.addBedChargeAdjustment(patient._id ?? patient.id, {
        direction,
        amount: amt,
        note: note.trim(),
      });
      onSuccess();
      handleClose();
    } catch (err) {
      setError(err?.response?.data?.error ?? "Failed to save adjustment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="Adjust Bed Charge" width="max-w-md">
      <div className="space-y-4">
        <ErrorMsg msg={error} />

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setDirection("increase")}
            className={`py-2.5 rounded-xl text-sm font-bold border transition-all ${
              direction === "increase"
                ? "bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-100"
                : "bg-white border-slate-200 text-slate-500 hover:border-emerald-300"
            }`}
          >
            ▲ Increase
          </button>
          <button
            type="button"
            onClick={() => setDirection("decrease")}
            className={`py-2.5 rounded-xl text-sm font-bold border transition-all ${
              direction === "decrease"
                ? "bg-amber-600 border-amber-600 text-white shadow-md shadow-amber-100"
                : "bg-white border-slate-200 text-slate-500 hover:border-amber-300"
            }`}
          >
            ▼ Decrease
          </button>
        </div>

        <Field label="Amount (BDT)">
          <Input
            type="number"
            min="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </Field>

        <Field label="Note (optional)">
          <Input
            placeholder="e.g. Management discount, billing correction…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </Field>

        <div className="flex gap-3 pt-1">
          <Btn variant="secondary" size="lg" className="flex-1" onClick={handleClose}>
            Cancel
          </Btn>
          <Btn
            variant={direction === "decrease" ? "secondary" : "success"}
            size="lg"
            className="flex-1"
            loading={loading}
            onClick={handleSubmit}
          >
            {direction === "decrease" ? "Decrease" : "Increase"} Total
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

// ─── Main exported component ──────────────────────────────────────────────────
export default function BedChargeSection({ patient, onSuccess }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const { days, gross, adjustmentTotal, total, adjustments } = calcBedAccrual(patient);

  const sortedAdjustments = [...adjustments].sort((a, b) => b.appliedAt - a.appliedAt);

  return (
    <>
      <SectionCard
        title="Bed Charges"
        icon="🛏️"
        action={
          <div className="flex items-center gap-2">
            <Btn variant="ghost" size="sm" onClick={() => setDetailsOpen(true)}>
              📊 Details
            </Btn>
            <Btn variant="primary" size="sm" onClick={() => setModalOpen(true)}>
              ⚖️ Adjust
            </Btn>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Totals */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                Accrued ({days} day{days !== 1 ? "s" : ""})
              </div>
              <div className="text-base font-black text-slate-800">{fmt.currency(gross)}</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Adjustments</div>
              <div
                className={`text-base font-black ${
                  adjustmentTotal > 0 ? "text-emerald-600" : adjustmentTotal < 0 ? "text-amber-600" : "text-slate-400"
                }`}
              >
                {adjustmentTotal === 0 ? "—" : `${adjustmentTotal > 0 ? "+" : ""}${fmt.currency(adjustmentTotal)}`}
              </div>
            </div>
            <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-100">
              <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Total</div>
              <div className="text-base font-black text-indigo-700">{fmt.currency(total)}</div>
            </div>
          </div>

          {/* Adjustment history */}
          {sortedAdjustments.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Adjustment History</p>
              <div className="space-y-1.5">
                {sortedAdjustments.map((a, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-sm px-3 py-2 rounded-lg bg-slate-50 border border-slate-100"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Badge color={a.direction === "decrease" ? "amber" : "green"}>
                        {a.direction === "decrease" ? "▼" : "▲"}
                      </Badge>
                      <span className="text-slate-500 text-xs truncate">{a.note || "No note"}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className="text-slate-400 text-xs">{fmt.date(a.appliedAt)}</div>
                        {a.appliedBy?.name && <div className="text-slate-400 text-xs">{a.appliedBy.name}</div>}
                      </div>
                      <span className={`font-bold ${a.amount < 0 ? "text-amber-600" : "text-emerald-600"}`}>
                        {a.amount > 0 ? "+" : ""}
                        {fmt.currency(a.amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </SectionCard>

      <BedChargeDetailsModal open={detailsOpen} onClose={() => setDetailsOpen(false)} patient={patient} />

      <AdjustBedChargeModal
        open={modalOpen}
        patient={patient}
        onClose={() => setModalOpen(false)}
        onSuccess={onSuccess}
      />
    </>
  );
}
