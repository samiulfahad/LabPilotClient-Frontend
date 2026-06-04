// BedChargeSection.jsx
// Drop-in replacement for the BedChargeCalendar + its SectionCard wrapper in the Billing tab.
// Props:
//   patient    – full indoor patient object
//   onSuccess  – callback to re-fetch patient after any mutation

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import indoorPatientService from "../../api/indoorPatient";

// ─── Tiny helpers (duplicated locally so this file is self-contained) ─────────
const fmt = {
  currency: (n = 0) =>
    new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT", maximumFractionDigits: 0 }).format(n),
  date: (s) => new Date(s).toLocaleDateString("en-BD", { day: "2-digit", month: "short", year: "numeric" }),
};

const tsBst = (ts) => new Date(ts + 6 * 3600 * 1000).toISOString().slice(0, 10);
const todayBst = () => tsBst(Date.now());

// ─── Build date range for the patient ────────────────────────────────────────
function buildDateRange(patient) {
  const start = tsBst(patient.admittedAt);
  const end = patient.releasedAt ? tsBst(patient.releasedAt) : todayBst();
  const dates = [];
  const cur = new Date(start + "T00:00:00Z");
  const endD = new Date(end + "T00:00:00Z");
  while (cur <= endD) {
    dates.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return dates;
}

// ─── Weekday label ────────────────────────────────────────────────────────────
const WDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
function weekday(dateStr) {
  return WDAYS[new Date(dateStr + "T00:00:00Z").getUTCDay()];
}

// ─── Month label ─────────────────────────────────────────────────────────────
function monthLabel(ym) {
  const [y, m] = ym.split("-");
  return new Date(+y, +m - 1, 1).toLocaleString("default", { month: "long", year: "numeric" });
}

// ─── Group dates by "YYYY-MM" ─────────────────────────────────────────────────
function groupByMonth(dates) {
  const map = {};
  for (const d of dates) {
    const k = d.slice(0, 7);
    if (!map[k]) map[k] = [];
    map[k].push(d);
  }
  return map;
}

// ─── Resolve charge amount for a date (mirrors backend logic) ────────────────
function resolveAmount(patient, date) {
  for (const h of patient.wardHistory ?? []) {
    if (!h.fromDate || !h.toDate) continue;
    const from = tsBst(h.fromDate);
    const to = tsBst(h.toDate);
    if (date >= from && date < to) return h.chargePerDay ?? patient.space.chargePerDay;
  }
  return patient.space.chargePerDay;
}

// ─── Drawer overlay (portal-based) ───────────────────────────────────────────
function Drawer({ open, onClose, children, title }) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[9998] transition-all duration-300 ${
          open ? "bg-black/40 backdrop-blur-[2px] pointer-events-auto" : "bg-transparent pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed right-0 top-0 h-screen z-[9999] flex flex-col bg-white shadow-2xl transition-transform duration-300 ease-out
          w-full sm:w-[540px] ${open ? "translate-x-0" : "translate-x-full"}`}
        style={{ borderLeft: "1px solid #e2e8f0" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h2 className="text-base font-bold text-slate-800 tracking-tight">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain">{children}</div>
      </div>
    </>,
    document.body,
  );
}

// ─── Bulk Collect Confirmation Panel ─────────────────────────────────────────
function BulkCollectPanel({ patient, selected, paidSet, onSuccess, onClose }) {
  const [waiver, setWaiver] = useState("");
  const [waiverNote, setWaiverNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedArr = [...selected].sort();
  const totalAmount = selectedArr.reduce((s, d) => s + resolveAmount(patient, d), 0);
  const waiverNum = parseFloat(waiver) || 0;
  const netAmount = Math.max(0, totalAmount - waiverNum);

  const handle = async () => {
    setError("");
    if (selectedArr.length === 0) return;

    const body = { dates: selectedArr };
    if (waiverNum > 0) {
      body.waiver = { amount: waiverNum / selectedArr.length, note: waiverNote.trim() };
    }

    setLoading(true);
    try {
      await indoorPatientService.addBedChargesBulk(patient._id ?? patient.id, body);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.error ?? "Failed to add charges");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-5">
      {/* Selected dates summary */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
          {selectedArr.length} date{selectedArr.length !== 1 ? "s" : ""} selected
        </p>
        <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
          {selectedArr.map((d) => (
            <span
              key={d}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-xs font-medium text-indigo-700"
            >
              {d}
            </span>
          ))}
        </div>
      </div>

      {/* Waiver input */}
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
            Waiver Amount (total, optional)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">৳</span>
            <input
              type="number"
              min="0"
              placeholder="0"
              value={waiver}
              onChange={(e) => setWaiver(e.target.value)}
              className="w-full pl-7 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition"
            />
          </div>
        </div>

        {waiverNum > 0 && (
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              Waiver Reason
            </label>
            <input
              type="text"
              placeholder="e.g. Management discount, Poor condition..."
              value={waiverNote}
              onChange={(e) => setWaiverNote(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition"
            />
          </div>
        )}
      </div>

      {/* Amount breakdown */}
      <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 space-y-2">
        <div className="flex justify-between text-sm text-slate-500">
          <span>Gross charge</span>
          <span className="font-semibold text-slate-700">{fmt.currency(totalAmount)}</span>
        </div>
        {waiverNum > 0 && (
          <>
            <div className="flex justify-between text-sm text-slate-500">
              <span>Waiver</span>
              <span className="font-semibold text-amber-600">− {fmt.currency(waiverNum)}</span>
            </div>
            <div className="border-t border-slate-200 pt-2 flex justify-between text-sm">
              <span className="font-bold text-slate-700">Net charge</span>
              <span className="font-bold text-emerald-700">{fmt.currency(netAmount)}</span>
            </div>
          </>
        )}
        {waiverNum === 0 && (
          <div className="border-t border-slate-200 pt-2 flex justify-between text-sm">
            <span className="font-bold text-slate-700">Total</span>
            <span className="font-bold text-slate-800">{fmt.currency(totalAmount)}</span>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-red-50 border border-red-200">
          <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <button
        disabled={loading || selectedArr.length === 0}
        onClick={handle}
        className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[.98] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold tracking-wide transition-all shadow-lg shadow-indigo-200"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Processing…
          </span>
        ) : (
          `Confirm ${selectedArr.length} charge${selectedArr.length !== 1 ? "s" : ""}`
        )}
      </button>
    </div>
  );
}

// ─── Main Drawer content ──────────────────────────────────────────────────────
function BedChargeDrawerContent({ patient, onSuccess, onClose }) {
  const allDates = buildDateRange(patient);
  const paidSet = new Set((patient.bedCharges ?? []).map((c) => c.date));
  const today = todayBst();

  const unpaidDates = allDates.filter((d) => !paidSet.has(d) && d <= today);

  const [selected, setSelected] = useState(new Set());
  const [view, setView] = useState("calendar"); // "calendar" | "collect"

  const toggle = (d) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(d)) next.delete(d);
      else next.add(d);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(unpaidDates));
  const clearAll = () => setSelected(new Set());

  const byMonth = groupByMonth(allDates);

  const selectedGross = [...selected].reduce((s, d) => s + resolveAmount(patient, d), 0);

  if (view === "collect") {
    return (
      <>
        {/* Sub-header */}
        <div className="px-6 py-3 border-b border-slate-100 flex items-center gap-3">
          <button
            onClick={() => setView("calendar")}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path
                fillRule="evenodd"
                d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <span className="text-sm font-semibold text-slate-600">Back to Calendar</span>
        </div>
        <BulkCollectPanel
          patient={patient}
          selected={selected}
          paidSet={paidSet}
          onSuccess={() => {
            onSuccess();
            setSelected(new Set());
          }}
          onClose={onClose}
        />
      </>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="px-6 py-3 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap shrink-0">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold text-slate-700">
            <span className="text-indigo-600">{paidSet.size}</span>
            <span className="text-slate-400"> / {allDates.length}</span>
            <span className="text-slate-500"> days billed</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={selected.size === unpaidDates.length ? clearAll : selectAll}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            {selected.size === unpaidDates.length && unpaidDates.length > 0 ? "Deselect all" : "Select all"}
          </button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
        {Object.entries(byMonth).map(([month, dates]) => (
          <div key={month}>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{monthLabel(month)}</span>
              <div className="flex-1 h-px bg-slate-100" />
              <span className="text-xs text-slate-400">
                {dates.filter((d) => paidSet.has(d)).length}/{dates.length}
              </span>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {dates.map((d) => {
                const paid = paidSet.has(d);
                const future = d > today;
                const sel = selected.has(d);
                const chargeEntry = paid ? (patient.bedCharges ?? []).find((c) => c.date === d) : null;

                let cellClass = "";
                if (paid) {
                  cellClass = "bg-emerald-50 border-emerald-200 text-emerald-700 cursor-default";
                } else if (future) {
                  cellClass = "bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed";
                } else if (sel) {
                  cellClass = "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200 scale-105";
                } else {
                  cellClass =
                    "bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:bg-indigo-50 cursor-pointer active:scale-95";
                }

                return (
                  <button
                    key={d}
                    disabled={paid || future}
                    onClick={() => toggle(d)}
                    title={
                      paid
                        ? `Billed · ${chargeEntry?.spaceName ?? ""} · ${fmt.currency(chargeEntry?.net ?? chargeEntry?.amount ?? 0)}`
                        : future
                          ? "Future date"
                          : `${d} · ${fmt.currency(resolveAmount(patient, d))}`
                    }
                    className={`relative flex flex-col items-center justify-center aspect-square rounded-xl border text-xs font-semibold transition-all select-none ${cellClass}`}
                  >
                    <span className={`text-[9px] font-normal leading-none mb-0.5 ${sel ? "opacity-80" : "opacity-50"}`}>
                      {weekday(d)}
                    </span>
                    <span className="text-sm font-bold leading-none">{parseInt(d.slice(8))}</span>
                    {paid && <span className="text-[8px] leading-none mt-0.5 font-bold">✓</span>}
                    {sel && !paid && (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-white border-2 border-indigo-500 rounded-full flex items-center justify-center">
                        <svg className="w-2 h-2 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Sticky footer — collect bar */}
      <div
        className={`border-t border-slate-100 bg-white px-6 py-4 shrink-0 transition-all duration-200 ${
          selected.size > 0 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
        }`}
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-slate-400 font-medium">
              {selected.size} day{selected.size !== 1 ? "s" : ""} selected
            </p>
            <p className="text-xl font-black text-slate-800 leading-tight">{fmt.currency(selectedGross)}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={clearAll}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-500 border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              Clear
            </button>
            <button
              onClick={() => setView("collect")}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[.98] text-white text-sm font-bold transition-all shadow-lg shadow-indigo-200 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Collect Charges
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main exported component ──────────────────────────────────────────────────
export default function BedChargeSection({ patient, onSuccess }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const paidSet = new Set((patient.bedCharges ?? []).map((c) => c.date));
  const allDates = buildDateRange(patient);
  const today = todayBst();
  const unpaidCount = allDates.filter((d) => !paidSet.has(d) && d <= today).length;

  const totalBilled = (patient.bedCharges ?? []).reduce((s, c) => s + (c.net ?? c.amount ?? 0), 0);
  const totalGross = (patient.bedCharges ?? []).reduce((s, c) => s + (c.amount ?? 0), 0);
  const totalWaiver = totalGross - totalBilled;

  // Last 5 charges for preview
  const recent = [...(patient.bedCharges ?? [])].sort((a, b) => (b.date > a.date ? 1 : -1)).slice(0, 5);

  return (
    <>
      {/* Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Card header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
              <span className="text-base">🛏️</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 leading-none">Bed Charges</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {paidSet.size} of {allDates.length} days billed
              </p>
            </div>
          </div>
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[.98] text-white text-xs font-bold transition-all shadow-md shadow-indigo-100"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            Manage Charges
            {unpaidCount > 0 && (
              <span className="ml-1 w-4 h-4 rounded-full bg-white/20 text-[10px] font-black flex items-center justify-center">
                {unpaidCount > 9 ? "9+" : unpaidCount}
              </span>
            )}
          </button>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 divide-x divide-slate-100">
          {[
            { label: "Gross", value: fmt.currency(totalGross), color: "text-slate-800" },
            {
              label: "Waiver",
              value: totalWaiver > 0 ? `− ${fmt.currency(totalWaiver)}` : "—",
              color: "text-amber-600",
            },
            { label: "Net Billed", value: fmt.currency(totalBilled), color: "text-emerald-700" },
          ].map(({ label, value, color }) => (
            <div key={label} className="px-5 py-3.5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
              <p className={`text-base font-black ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="px-5 pb-1 pt-1">
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-700"
              style={{ width: allDates.length > 0 ? `${(paidSet.size / allDates.length) * 100}%` : "0%" }}
            />
          </div>
        </div>

        {/* Recent charges preview */}
        {recent.length > 0 ? (
          <div className="px-5 pt-3 pb-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Recent</p>
            <div className="space-y-1.5">
              {recent.map((c) => (
                <div key={c.date} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                    <span className="text-slate-600 font-medium">{c.date}</span>
                    <span className="text-slate-400 text-xs">{c.spaceName}</span>
                    {c.bedNumber != null && <span className="text-slate-400 text-xs">· Bed {c.bedNumber}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    {c.waiver && (
                      <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-100">
                        −{fmt.currency(c.waiver.amount)}
                      </span>
                    )}
                    <span className="font-bold text-slate-700">{fmt.currency(c.net ?? c.amount)}</span>
                  </div>
                </div>
              ))}
            </div>
            {paidSet.size > 5 && (
              <button
                onClick={() => setDrawerOpen(true)}
                className="mt-2 text-xs text-indigo-500 hover:text-indigo-700 font-semibold transition-colors"
              >
                View all {paidSet.size} charges →
              </button>
            )}
          </div>
        ) : (
          <div className="px-5 py-6 text-center">
            <p className="text-sm text-slate-400">No bed charges recorded yet</p>
            {unpaidCount > 0 && (
              <p className="text-xs text-indigo-500 mt-1 font-medium">
                {unpaidCount} day{unpaidCount !== 1 ? "s" : ""} pending
              </p>
            )}
          </div>
        )}
      </div>

      {/* Drawer */}
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Bed Charge Calendar">
        <BedChargeDrawerContent patient={patient} onSuccess={onSuccess} onClose={() => setDrawerOpen(false)} />
      </Drawer>
    </>
  );
}
