/**
 * ManageSpaces.jsx
 * Indoor Patient Spaces / Wards CRUD for LabPilot Pro
 * Reservation only — booking is handled via invoice flow.
 * Bed states (display only): booked | reserved | available
 * departments is now an array (multi-select).
 */

// React Compiler handles memoisation — no useCallback/useMemo

import { useState, useEffect, useCallback } from "react";
import {
  BedDouble,
  Plus,
  Pencil,
  Trash2,
  X,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Hash,
  Building2,
  Banknote,
  Layers,
  BookMarked,
  BookX,
} from "lucide-react";

import spaceService from "../../../api/admissionSpace";

const DEPARTMENTS = [
  { value: "general", label: "General" },
  { value: "cardiology", label: "Cardiology" },
  { value: "orthopedics", label: "Orthopedics" },
  { value: "neurology", label: "Neurology" },
  { value: "gynecology", label: "Gynecology" },
  { value: "pediatrics", label: "Pediatrics" },
  { value: "icu", label: "ICU" },
  { value: "oncology", label: "Oncology" },
  { value: "surgery", label: "Surgery" },
  { value: "urology", label: "Urology" },
  { value: "other", label: "Other" },
];

const fmt = (n) =>
  new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT", minimumFractionDigits: 0 }).format(n || 0);

const deptLabel = (val) => DEPARTMENTS.find((d) => d.value === val)?.label ?? val;

// ─── Toast ────────────────────────────────────────────────────────────────────
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  const styles =
    type === "success" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700";
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-lg text-sm font-semibold ${styles}`}
    >
      {type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
      {message}
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

// ─── Confirm Popup ────────────────────────────────────────────────────────────
const ConfirmPopup = ({ message, onConfirm, onCancel, confirmText = "Confirm", danger = true }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-7 max-w-sm w-full">
      <div className="flex flex-col items-center text-center">
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 border ${danger ? "bg-red-50 border-red-100" : "bg-amber-50 border-amber-100"}`}
        >
          <AlertTriangle className={`w-7 h-7 ${danger ? "text-red-500" : "text-amber-500"}`} />
        </div>
        <p className="text-sm text-gray-600 mb-6 leading-relaxed">{message}</p>
        <div className="flex w-full gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-95 shadow-lg ${danger ? "bg-red-500 hover:bg-red-600 shadow-red-200" : "bg-amber-500 hover:bg-amber-600 shadow-amber-200"}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  </div>
);

// ─── Reserve Note Modal ───────────────────────────────────────────────────────
const ReserveNoteModal = ({ isOpen, onClose, onConfirm, title, bedNumber }) => {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isOpen) setNote("");
  }, [isOpen]);

  const handleConfirm = async () => {
    setBusy(true);
    try {
      await onConfirm(note);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center">
              <BookMarked className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">{title}</h3>
              {bedNumber !== undefined && <p className="text-xs text-gray-400">Bed #{bedNumber}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-5 py-4">
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            Note <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            maxLength={300}
            placeholder="e.g. Reserved for patient admission tomorrow"
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-amber-100 focus:border-amber-400 transition-all"
          />
          <p className="text-right text-[10px] text-gray-400 mt-1">{note.length}/300</p>
        </div>
        <div className="px-5 pb-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={busy}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-200 transition-all active:scale-95 disabled:opacity-60"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookMarked className="w-4 h-4" />}
            Reserve
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Department Multi-Select Pills ────────────────────────────────────────────
const DeptPillSelect = ({ value, onChange, error }) => {
  const toggle = (val) => {
    if (value.includes(val)) {
      // keep at least 1 selected
      if (value.length === 1) return;
      onChange(value.filter((v) => v !== val));
    } else {
      onChange([...value, val]);
    }
  };

  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">
        Department(s) * <span className="text-gray-400 font-normal">(select all that apply)</span>
      </label>
      <div
        className={`flex flex-wrap gap-1.5 p-2.5 rounded-xl border transition-all ${
          error ? "border-red-300 bg-red-50" : "border-gray-200 bg-gray-50/50"
        }`}
      >
        {DEPARTMENTS.map((d) => {
          const active = value.includes(d.value);
          return (
            <button
              key={d.value}
              type="button"
              onClick={() => toggle(d.value)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all active:scale-95 ${
                active
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-200"
                  : "bg-white text-gray-500 border-gray-200 hover:border-indigo-300 hover:text-indigo-600"
              }`}
            >
              {d.label}
            </button>
          );
        })}
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
};

// ─── Space Form Modal ─────────────────────────────────────────────────────────
const EMPTY_FORM = {
  name: "",
  chargePerDay: "",
  departments: ["general"],
  multiBed: false,
  totalNumberOfBed: "",
  bedStartingNumber: 1,
};

const SpaceFormModal = ({ isOpen, onClose, onSaved, editSpace }) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isOpen) return;
    if (editSpace) {
      // normalise: legacy single `department` string → array
      const depts = editSpace.departments
        ? editSpace.departments
        : editSpace.department
          ? [editSpace.department]
          : ["general"];
      setForm({
        name: editSpace.name,
        chargePerDay: editSpace.chargePerDay,
        departments: depts,
        multiBed: editSpace.multiBed,
        totalNumberOfBed: editSpace.multiBedConf?.totalNumberOfBed ?? "",
        bedStartingNumber: editSpace.multiBedConf?.bedStartingNumber ?? 1,
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setErrors({});
  }, [isOpen, editSpace]);

  const set = (key, val) => {
    setForm((p) => ({ ...p, [key]: val }));
    setErrors((p) => ({ ...p, [key]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.chargePerDay || isNaN(form.chargePerDay) || Number(form.chargePerDay) < 0)
      e.chargePerDay = "Enter a valid charge";
    if (!form.departments.length) e.departments = "Select at least one department";
    if (form.multiBed) {
      if (!form.totalNumberOfBed || isNaN(form.totalNumberOfBed) || Number(form.totalNumberOfBed) < 1)
        e.totalNumberOfBed = "Enter total beds (≥ 1)";
      if (form.bedStartingNumber === "" || isNaN(form.bedStartingNumber) || Number(form.bedStartingNumber) < 0)
        e.bedStartingNumber = "Enter a valid starting number";
    }
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        chargePerDay: Number(form.chargePerDay),
        departments: form.departments,
        multiBed: form.multiBed,
        multiBedConf: form.multiBed
          ? {
              totalNumberOfBed: Number(form.totalNumberOfBed),
              bedStartingNumber: Number(form.bedStartingNumber),
              booked: editSpace?.multiBedConf?.booked ?? [],
            }
          : null,
      };
      if (editSpace) {
        await spaceService.update(editSpace._id, payload);
        onSaved("updated", { ...editSpace, ...payload });
      } else {
        const res = await spaceService.create(payload);
        onSaved("created", { ...res.data, ...payload });
      }
      onClose();
    } catch {
      setErrors({ general: "Failed to save. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-12 bg-black/30 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-200">
              <BedDouble className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-base">{editSpace ? "Edit Space" : "Add New Space"}</h2>
              <p className="text-xs text-gray-400">Ward, cabin, ICU, or any patient space</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {errors.general && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0" /> {errors.general}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Space Name *</label>
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Ward-1, Cabin-A, ICU"
              className={`w-full px-4 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all ${errors.name ? "border-red-300 bg-red-50" : "border-gray-200"}`}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Charge / Day (৳) *</label>
            <input
              type="number"
              min={0}
              value={form.chargePerDay}
              onChange={(e) => set("chargePerDay", e.target.value)}
              placeholder="500"
              className={`w-full px-4 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all ${errors.chargePerDay ? "border-red-300 bg-red-50" : "border-gray-200"}`}
            />
            {errors.chargePerDay && <p className="text-xs text-red-500 mt-1">{errors.chargePerDay}</p>}
          </div>

          <DeptPillSelect
            value={form.departments}
            onChange={(val) => set("departments", val)}
            error={errors.departments}
          />

          <div
            onClick={() => set("multiBed", !form.multiBed)}
            className={`flex items-center justify-between px-4 py-3 rounded-xl border cursor-pointer transition-all ${form.multiBed ? "border-blue-200 bg-blue-50/60" : "border-gray-200 bg-gray-50/60"}`}
          >
            <div>
              <p className="text-sm font-semibold text-gray-700">Multi-Bed Space</p>
              <p className="text-xs text-gray-400 mt-0.5">Enable for wards with multiple beds</p>
            </div>
            <div
              className={`w-10 h-6 rounded-full transition-colors flex items-center px-0.5 ${form.multiBed ? "bg-blue-600" : "bg-gray-300"}`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${form.multiBed ? "translate-x-4" : "translate-x-0"}`}
              />
            </div>
          </div>

          {form.multiBed && (
            <div className="grid grid-cols-2 gap-3 px-4 py-4 rounded-xl border border-blue-100 bg-blue-50/40">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Total Beds *</label>
                <input
                  type="number"
                  min={1}
                  value={form.totalNumberOfBed}
                  onChange={(e) => set("totalNumberOfBed", e.target.value)}
                  placeholder="20"
                  className={`w-full px-3 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 bg-white transition-all ${errors.totalNumberOfBed ? "border-red-300" : "border-gray-200"}`}
                />
                {errors.totalNumberOfBed && <p className="text-xs text-red-500 mt-1">{errors.totalNumberOfBed}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Bed Starting No.</label>
                <input
                  type="number"
                  min={0}
                  value={form.bedStartingNumber}
                  onChange={(e) => set("bedStartingNumber", e.target.value)}
                  className={`w-full px-3 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 bg-white transition-all ${errors.bedStartingNumber ? "border-red-300" : "border-gray-200"}`}
                />
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-200/60 transition-all active:scale-95 disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving…
              </>
            ) : editSpace ? (
              "Save Changes"
            ) : (
              "Add Space"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Bed Grid ─────────────────────────────────────────────────────────────────
const BedGrid = ({ conf, spaceId, onUpdate, showToast }) => {
  const [reserveModal, setReserveModal] = useState(null);
  const [busy, setBusy] = useState(null);

  if (!conf) return null;
  const { totalNumberOfBed, bedStartingNumber, booked = [], reserved = [] } = conf;
  const beds = Array.from({ length: totalNumberOfBed }, (_, i) => bedStartingNumber + i);

  const statusOf = (b) => {
    if (booked.includes(b)) return "booked";
    if (reserved.some((r) => r.bedNumber === b)) return "reserved";
    return "available";
  };
  const reservedNoteOf = (b) => reserved.find((r) => r.bedNumber === b)?.note ?? "";

  const doReserve = async (b, note) => {
    setBusy(b);
    try {
      await spaceService.reserveBed(spaceId, b, note);
      onUpdate((prev) => ({
        ...prev,
        multiBedConf: {
          ...prev.multiBedConf,
          reserved: [...(prev.multiBedConf.reserved ?? []), { bedNumber: b, note }],
        },
      }));
      showToast(`Bed ${b} reserved`);
    } catch (e) {
      showToast(e?.response?.data?.error ?? "Failed to reserve bed", "error");
    } finally {
      setBusy(null);
    }
  };

  const doReleaseReservation = async (b) => {
    setBusy(b);
    try {
      await spaceService.releaseBedReservation(spaceId, b);
      onUpdate((prev) => ({
        ...prev,
        multiBedConf: {
          ...prev.multiBedConf,
          reserved: (prev.multiBedConf.reserved ?? []).filter((r) => r.bedNumber !== b),
        },
      }));
      showToast(`Bed ${b} reservation released`);
    } catch (e) {
      showToast(e?.response?.data?.error ?? "Failed to release reservation", "error");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <ReserveNoteModal
        isOpen={!!reserveModal}
        bedNumber={reserveModal}
        title="Reserve Bed"
        onClose={() => setReserveModal(null)}
        onConfirm={(note) => doReserve(reserveModal, note)}
      />
      <div className="flex flex-wrap gap-1.5 mt-2">
        {beds.map((b) => {
          const s = statusOf(b);
          const isBusy = busy === b;
          const note = s === "reserved" ? reservedNoteOf(b) : "";
          const colorClass =
            s === "booked"
              ? "bg-red-50 text-red-400 border-red-200 cursor-default"
              : s === "reserved"
                ? "bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100 cursor-pointer"
                : "bg-green-50 text-green-600 border-green-200 hover:bg-green-100 cursor-pointer";
          const handleClick = () => {
            if (s === "booked" || isBusy) return;
            if (s === "available") setReserveModal(b);
            if (s === "reserved") doReleaseReservation(b);
          };
          return (
            <button
              key={b}
              onClick={handleClick}
              disabled={s === "booked" || isBusy}
              title={
                s === "booked"
                  ? `Bed ${b} — booked (managed via invoices)`
                  : s === "reserved"
                    ? `Bed ${b} — reserved${note ? `: ${note}` : ""} · click to release`
                    : `Bed ${b} — available · click to reserve`
              }
              className={`w-8 h-8 rounded-lg text-xs font-bold flex items-center justify-center border transition-colors relative ${colorClass} ${isBusy ? "opacity-50" : ""}`}
            >
              {isBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : b}
              {s === "reserved" && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 border border-white" />
              )}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-4 mt-3 text-[10px] font-medium">
        <span className="flex items-center gap-1 text-green-600">
          <span className="w-2.5 h-2.5 rounded bg-green-200 inline-block" /> Available
        </span>
        <span className="flex items-center gap-1 text-amber-600">
          <span className="w-2.5 h-2.5 rounded bg-amber-200 inline-block" /> Reserved
        </span>
        <span className="flex items-center gap-1 text-red-400">
          <span className="w-2.5 h-2.5 rounded bg-red-200 inline-block" /> Booked
        </span>
      </div>
      <p className="text-[10px] text-gray-400 mt-1.5">
        Click available bed to reserve · click reserved bed to release · booked beds are managed via invoices
      </p>
    </div>
  );
};

// ─── Dept Badges (card display) ───────────────────────────────────────────────
// Shows up to maxVisible badges then a "+N more" chip
const DeptBadges = ({ departments = [], maxVisible = 2 }) => {
  const visible = departments.slice(0, maxVisible);
  const overflow = departments.length - maxVisible;
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {visible.map((d) => (
        <span
          key={d}
          className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 text-indigo-600 border border-indigo-100"
        >
          {deptLabel(d)}
        </span>
      ))}
      {overflow > 0 && (
        <span
          className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-gray-100 text-gray-500 border border-gray-200"
          title={departments.slice(maxVisible).map(deptLabel).join(", ")}
        >
          +{overflow}
        </span>
      )}
    </div>
  );
};

// ─── Space Card ───────────────────────────────────────────────────────────────
const SpaceCard = ({ space: initialSpace, onEdit, onDelete, showToast, onSpaceUpdate }) => {
  const [expanded, setExpanded] = useState(false);
  const [space, setSpace] = useState(initialSpace);
  const [busy, setBusy] = useState(false);
  const [reserveModal, setReserveModal] = useState(false);
  const [confirmRelease, setConfirmRelease] = useState(false);

  useEffect(() => {
    setSpace(initialSpace);
  }, [initialSpace]);

  const handleSpaceUpdate = useCallback(
    (updater) => {
      setSpace((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        onSpaceUpdate(next);
        return next;
      });
    },
    [onSpaceUpdate],
  );

  const doReserveSingle = async (note) => {
    setBusy(true);
    try {
      await spaceService.reserve(space._id, note);
      handleSpaceUpdate((p) => ({ ...p, reserved: true, reservedNote: note }));
      showToast(`"${space.name}" reserved`);
    } catch (e) {
      showToast(e?.response?.data?.error ?? "Failed to reserve", "error");
    } finally {
      setBusy(false);
    }
  };

  const doReleaseSingle = async () => {
    setConfirmRelease(false);
    setBusy(true);
    try {
      await spaceService.releaseReservation(space._id);
      handleSpaceUpdate((p) => ({ ...p, reserved: false, reservedNote: "" }));
      showToast(`"${space.name}" reservation released`);
    } catch (e) {
      showToast(e?.response?.data?.error ?? "Failed to release", "error");
    } finally {
      setBusy(false);
    }
  };

  const totalBeds = space.multiBedConf?.totalNumberOfBed ?? 0;
  const bookedCount = space.multiBedConf?.booked?.length ?? 0;
  const reservedCount = space.multiBedConf?.reserved?.length ?? 0;
  const availableCount = totalBeds - bookedCount - reservedCount;

  // normalise legacy single dept string
  const depts = space.departments ?? (space.department ? [space.department] : []);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all duration-200 overflow-hidden">
      {confirmRelease && (
        <ConfirmPopup
          message={`Release reservation on "${space.name}"?`}
          confirmText="Release"
          danger={false}
          onConfirm={doReleaseSingle}
          onCancel={() => setConfirmRelease(false)}
        />
      )}
      <ReserveNoteModal
        isOpen={reserveModal}
        title={`Reserve "${space.name}"`}
        onClose={() => setReserveModal(false)}
        onConfirm={doReserveSingle}
      />

      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
          <BedDouble className="w-5 h-5 text-white" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-gray-900 text-sm">{space.name}</span>
            {!space.multiBed &&
              (space.reserved ? (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-600 border border-amber-200">
                  Reserved
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-green-50 text-green-600 border border-green-200">
                  Available
                </span>
              ))}
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <DeptBadges departments={depts} maxVisible={2} />
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Banknote className="w-3 h-3" /> {fmt(space.chargePerDay)}/day
            </span>
            {space.multiBed && space.multiBedConf ? (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Layers className="w-3 h-3" />
                <span className="text-green-600 font-semibold">{availableCount}</span>
                {reservedCount > 0 && (
                  <>
                    <span className="text-gray-300">·</span>
                    <span className="text-amber-600 font-semibold">{reservedCount} reserved</span>
                  </>
                )}
                {bookedCount > 0 && (
                  <>
                    <span className="text-gray-300">·</span>
                    <span className="text-red-400 font-semibold">{bookedCount} booked</span>
                  </>
                )}
                <span className="text-gray-400">/ {totalBeds}</span>
              </span>
            ) : (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Hash className="w-3 h-3" /> Single bed
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {!space.multiBed &&
            (space.reserved ? (
              <button
                onClick={() => setConfirmRelease(true)}
                disabled={busy}
                title="Release reservation"
                className="w-8 h-8 flex items-center justify-center rounded-lg text-amber-500 hover:text-amber-700 hover:bg-amber-50 transition-colors disabled:opacity-50"
              >
                {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BookX className="w-3.5 h-3.5" />}
              </button>
            ) : (
              <button
                onClick={() => setReserveModal(true)}
                disabled={busy}
                title="Reserve this space"
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors disabled:opacity-50"
              >
                {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BookMarked className="w-3.5 h-3.5" />}
              </button>
            ))}
          {space.multiBed && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
          <button
            onClick={() => onEdit(space)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(space)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {!space.multiBed && space.reserved && space.reservedNote && (
        <div className="px-4 pb-3">
          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-1.5">
            <span className="font-semibold">Note:</span> {space.reservedNote}
          </p>
        </div>
      )}

      {expanded && space.multiBed && space.multiBedConf && (
        <div className="px-4 pb-4 pt-1 border-t border-gray-50">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Bed Layout</p>
          <BedGrid conf={space.multiBedConf} spaceId={space._id} showToast={showToast} onUpdate={handleSpaceUpdate} />
        </div>
      )}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const ManageSpaces = () => {
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editSpace, setEditSpace] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [toast, setToast] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [filterDept, setFilterDept] = useState("all");

  const showToast = useCallback((message, type = "success") => setToast({ message, type }), []);

  useEffect(() => {
    spaceService
      .getAll()
      .then((r) => setSpaces(r.data))
      .catch(() => showToast("Failed to load spaces", "error"))
      .finally(() => setLoading(false));
  }, []);

  const handleSaved = (mode, space) => {
    if (mode === "created") {
      setSpaces((p) => [space, ...p]);
      showToast(`"${space.name}" added successfully`);
    } else {
      setSpaces((p) => p.map((s) => (s._id === space._id ? space : s)));
      showToast(`"${space.name}" updated`);
    }
  };

  const handleSpaceUpdate = useCallback((updated) => {
    setSpaces((prev) => prev.map((s) => (s._id === updated._id ? updated : s)));
  }, []);

  const handleDeleteConfirm = async () => {
    const { space } = confirm;
    setConfirm(null);
    setActionLoading(true);
    try {
      await spaceService.delete(space._id);
      setSpaces((p) => p.filter((s) => s._id !== space._id));
      showToast(`"${space.name}" deleted`);
    } catch {
      showToast("Failed to delete space", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Filter: space matches if filterDept is "all" or its departments array includes filterDept
  // Normalise legacy docs that still have a singular `department` string
  const filtered = spaces.filter((s) => {
    if (filterDept === "all") return true;
    const depts = s.departments ?? (s.department ? [s.department] : []);
    return depts.includes(filterDept);
  });

  const stats = {
    total: spaces.length,
    totalBeds: spaces.reduce((a, s) => a + (s.multiBedConf?.totalNumberOfBed ?? 1), 0),
    available: spaces.reduce((a, s) => {
      if (!s.multiBed || !s.multiBedConf) return a + (s.reserved ? 0 : 1);
      return (
        a +
        s.multiBedConf.totalNumberOfBed -
        (s.multiBedConf.booked?.length ?? 0) -
        (s.multiBedConf.reserved?.length ?? 0)
      );
    }, 0),
    reserved: spaces.reduce((a, s) => {
      if (!s.multiBed || !s.multiBedConf) return a + (s.reserved ? 1 : 0);
      return a + (s.multiBedConf.reserved?.length ?? 0);
    }, 0),
  };

  return (
    <section className="min-h-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 px-4 py-6">
      {actionLoading && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-white/60 backdrop-blur-sm">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {confirm?.type === "delete" && (
        <ConfirmPopup
          message={`Delete "${confirm.space.name}"? This cannot be undone.`}
          confirmText="Delete"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}

      <SpaceFormModal
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditSpace(null);
        }}
        onSaved={handleSaved}
        editSpace={editSpace}
      />

      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
              <Building2 className="w-6 h-6 text-indigo-600 shrink-0" /> Manage Spaces
            </h1>
            <p className="text-sm text-gray-500 mt-1">Wards, cabins, and indoor patient spaces</p>
          </div>
          <button
            onClick={() => {
              setEditSpace(null);
              setFormOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-200/60 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" /> Add Space
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: "Total Spaces", value: stats.total, color: "text-gray-900", bg: "bg-white" },
            { label: "Total Beds", value: stats.totalBeds, color: "text-indigo-700", bg: "bg-indigo-50" },
            { label: "Available", value: stats.available, color: "text-green-700", bg: "bg-green-50" },
            { label: "Reserved", value: stats.reserved, color: "text-amber-600", bg: "bg-amber-50" },
          ].map((s) => (
            <div key={s.label} className={`${s.bg} rounded-2xl border border-gray-100 px-4 py-3 shadow-sm`}>
              <p className="text-xs text-gray-400 font-medium">{s.label}</p>
              <p className={`text-2xl font-black mt-0.5 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Department Filter — pill strip */}
        <div className="flex flex-wrap gap-1.5 mb-5">
          {[{ value: "all", label: "All" }, ...DEPARTMENTS].map((d) => (
            <button
              key={d.value}
              onClick={() => setFilterDept(d.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                filterDept === d.value
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-200"
                  : "bg-white text-gray-500 border-gray-200 hover:border-indigo-300 hover:text-indigo-600"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-2xl py-16 text-center shadow-sm">
            <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
              <BedDouble className="w-5 h-5 text-gray-300" />
            </div>
            <p className="text-sm font-bold text-gray-400">No spaces found</p>
            <p className="text-xs text-gray-300 mt-1">
              {spaces.length === 0 ? "Add your first space to get started" : "Try adjusting the department filter"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((space) => (
              <SpaceCard
                key={space._id}
                space={space}
                showToast={showToast}
                onSpaceUpdate={handleSpaceUpdate}
                onEdit={(s) => {
                  setEditSpace(s);
                  setFormOpen(true);
                }}
                onDelete={(s) => setConfirm({ type: "delete", space: s })}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ManageSpaces;
