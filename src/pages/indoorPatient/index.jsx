/**
 * IndoorPatient.jsx
 * babel-plugin-react-compiler handles memoization — no manual useCallback/useMemo.
 */
import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  BedDouble,
  UserPlus,
  Search,
  ArrowLeft,
  X,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Phone,
  MapPin,
  User,
  Stethoscope,
  Users,
  Droplets,
  CalendarDays,
  LogOut,
  ReceiptText,
  Activity,
  ClipboardList,
  ShieldCheck,
  ArrowRightLeft,
  History,
  Building2,
} from "lucide-react";
import indoorPatientService from "../../api/indoorPatient";
import doctorService from "../../api/doctor";
import referrerService from "../../api/referrer";
import Popup from "../../components/popup";

// ─── Constants ────────────────────────────────────────────────────────────────

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "unknown"];
const GENDERS = ["male", "female", "other"];

const LOCATION_TYPES = ["Ward", "Bed", "ICU", "Cabin", "Floor", "OT", "CCU", "HDU", "NICU", "Emergency", "Other"];

const DEPARTMENTS = [
  "Medicine",
  "Cardiology",
  "Neurology",
  "Orthopedics",
  "Gynecology & Obstetrics",
  "Pediatrics",
  "Dermatology",
  "Ophthalmology",
  "ENT",
  "Urology",
  "Nephrology",
  "Gastroenterology",
  "Endocrinology",
  "Pulmonology",
  "Oncology",
  "Psychiatry",
  "Rheumatology",
  "Hematology",
  "Radiology",
  "Anesthesiology",
  "Surgery",
  "Dentistry",
  "Physiotherapy",
  "Pathology",
  "Microbiology",
  "Biochemistry",
  "Emergency Medicine",
  "Other",
];

const EMPTY_FORM = {
  name: "",
  age: "",
  gender: "",
  bloodGroup: "unknown",
  contactNumber: "",
  address: "",
  nid: "",
  guardianName: "",
  guardianRelation: "",
  guardianContact: "",
  admissionDate: Date.now(),
  locationType: "",
  locationDetail: "",
  department: "",
  diagnosis: "",
  notes: "",
  doctorId: "",
  referrerId: "",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (ts) =>
  ts ? new Date(ts).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const fmtDateTime = (ts) =>
  ts
    ? new Date(ts).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const fmtLocation = (p) =>
  p?.locationType ? `${p.locationType}${p.locationDetail ? ` – ${p.locationDetail}` : ""}` : null;

const bloodBg = {
  "A+": "bg-red-50 text-red-700 border-red-200",
  "A-": "bg-red-50 text-red-600 border-red-200",
  "B+": "bg-orange-50 text-orange-700 border-orange-200",
  "B-": "bg-orange-50 text-orange-600 border-orange-200",
  "AB+": "bg-purple-50 text-purple-700 border-purple-200",
  "AB-": "bg-purple-50 text-purple-600 border-purple-200",
  "O+": "bg-blue-50 text-blue-700 border-blue-200",
  "O-": "bg-blue-50 text-blue-600 border-blue-200",
  unknown: "bg-gray-100 text-gray-500 border-gray-200",
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const SkeletonRow = () => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 animate-pulse">
    <div className="flex items-start gap-3">
      <div className="w-11 h-11 rounded-xl bg-gray-200 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-40 bg-gray-200 rounded" />
        <div className="h-3 w-28 bg-gray-100 rounded" />
        <div className="flex gap-2 mt-2">
          <div className="h-6 w-16 bg-gray-100 rounded-full" />
          <div className="h-6 w-20 bg-gray-100 rounded-full" />
        </div>
      </div>
      <div className="flex gap-2 shrink-0">
        <div className="h-8 w-8 bg-gray-100 rounded-lg" />
        <div className="h-8 w-8 bg-gray-100 rounded-lg" />
        <div className="h-8 w-16 bg-gray-100 rounded-lg" />
      </div>
    </div>
  </div>
);

// ─── Transfer History Modal ───────────────────────────────────────────────────

const TransferHistoryModal = ({ patient, onClose }) => {
  const history = patient.transferHistory ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center">
              <History className="w-4 h-4 text-violet-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Transfer History</p>
              <p className="text-[11px] text-gray-400">{patient.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-4 max-h-80 overflow-y-auto">
          {history.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No transfers recorded yet.</p>
          ) : (
            <ol className="relative border-l border-gray-200 ml-2 space-y-4">
              {history.map((h, i) => (
                <li key={i} className="ml-4">
                  <div className="absolute -left-1.5 w-3 h-3 rounded-full bg-violet-400 border-2 border-white" />
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                      {h.fromType}
                      {h.fromDetail ? ` – ${h.fromDetail}` : ""}
                    </span>
                    <ArrowRightLeft className="w-3 h-3 text-violet-400 shrink-0" />
                    <span className="text-[11px] font-bold text-violet-700 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-full">
                      {h.toType}
                      {h.toDetail ? ` – ${h.toDetail}` : ""}
                    </span>
                  </div>
                  {h.reason && <p className="text-[11px] text-gray-500 mt-1">{h.reason}</p>}
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {fmtDateTime(h.at)} · {h.by?.name ?? "—"}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="px-5 pb-4">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Transfer Modal ───────────────────────────────────────────────────────────

const TransferModal = ({ patient, onConfirm, onCancel, loading }) => {
  const [toType, setToType] = useState("");
  const [toDetail, setToDetail] = useState("");
  const [reason, setReason] = useState("");

  const currentLocation = fmtLocation(patient) ?? "—";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center">
            <ArrowRightLeft className="w-5 h-5 text-violet-500" />
          </div>
          <div>
            <p className="text-base font-bold text-gray-900">Transfer Patient</p>
            <p className="text-[11px] text-gray-400">{patient.name}</p>
          </div>
        </div>

        {/* Current location */}
        <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl">
          <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <p className="text-[11px] text-gray-500">
            Current: <span className="font-bold text-gray-700">{currentLocation}</span>
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">
              Transfer To <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <select
                value={toType}
                onChange={(e) => setToType(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400 transition appearance-none pr-9"
              >
                <option value="" disabled>
                  Select location type
                </option>
                {LOCATION_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">
              Room / Bed / No.
            </label>
            <input
              value={toDetail}
              onChange={(e) => setToDetail(e.target.value)}
              placeholder="e.g. Bed 4, Room 12, ICU-A…"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400 transition placeholder-gray-300"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">
              Reason (optional)
            </label>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Critical condition, post-op monitoring…"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400 transition placeholder-gray-300"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => toType && onConfirm({ toType, toDetail, reason })}
            disabled={loading || !toType}
            className="flex-1 px-4 py-2.5 rounded-xl bg-violet-500 text-white text-sm font-bold hover:bg-violet-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <ArrowRightLeft className="w-4 h-4" />
            )}
            Transfer
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Patient Card ─────────────────────────────────────────────────────────────

const PatientCard = ({ patient, onEdit, onDelete, onRelease, onTransfer, onHistory }) => {
  const released = patient.status === "released";
  const location = fmtLocation(patient);
  const hasTransfers = (patient.transferHistory?.length ?? 0) > 0;

  return (
    <div
      className={`bg-white rounded-2xl border shadow-sm overflow-hidden hover:shadow-md transition-all duration-200 ${released ? "border-gray-100 opacity-80" : "border-gray-100 hover:border-teal-100"}`}
    >
      {/* Top row */}
      <div className="px-5 pt-4 pb-3 flex items-start gap-3">
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${released ? "bg-gray-50 border-gray-200" : "bg-teal-50 border-teal-100"}`}
        >
          <BedDouble className={`w-5 h-5 ${released ? "text-gray-400" : "text-teal-500"}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-gray-900 truncate">{patient.name}</p>
            {released && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 border border-gray-200 text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                <ShieldCheck className="w-2.5 h-2.5" /> Released
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            <p className="text-[11px] text-gray-500">
              {patient.age}y · <span className="capitalize">{patient.gender}</span>
            </p>
            {patient.contactNumber && (
              <div className="flex items-center gap-1">
                <Phone className="w-3 h-3 text-gray-400" />
                <p className="text-[11px] text-gray-500">{patient.contactNumber}</p>
              </div>
            )}
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {patient.bloodGroup && patient.bloodGroup !== "unknown" && (
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold ${bloodBg[patient.bloodGroup] ?? bloodBg.unknown}`}
              >
                <Droplets className="w-2.5 h-2.5" /> {patient.bloodGroup}
              </span>
            )}
            {patient.department && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-50 border border-violet-200 text-[10px] font-bold text-violet-700">
                <Stethoscope className="w-2.5 h-2.5" /> {patient.department}
              </span>
            )}
            {location && (
              <button
                onClick={hasTransfers ? onHistory : undefined}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-50 border border-sky-200 text-[10px] font-bold text-sky-700 ${hasTransfers ? "hover:bg-sky-100 cursor-pointer" : ""}`}
                title={hasTransfers ? "View transfer history" : undefined}
              >
                <MapPin className="w-2.5 h-2.5" /> {location}
                {hasTransfers && <History className="w-2.5 h-2.5 ml-0.5 text-sky-400" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Doctor / Referrer */}
      <div className="px-5 pb-3 grid grid-cols-2 gap-2">
        {patient.doctorName && (
          <div className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2 col-span-1">
            <Stethoscope className="w-3 h-3 text-indigo-400 shrink-0" />
            <p className="text-[11px] font-semibold text-indigo-700 truncate">{patient.doctorName}</p>
          </div>
        )}
        {patient.referrerName && (
          <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
            <Users className="w-3 h-3 text-emerald-400 shrink-0" />
            <p className="text-[11px] font-semibold text-emerald-700 truncate">Ref: {patient.referrerName}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 pb-4 flex items-center justify-between border-t border-gray-50 pt-3 gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
          <p className="text-[11px] text-gray-500">
            Admitted: <span className="font-bold text-gray-700">{fmtDate(patient.admissionDate)}</span>
          </p>
          {released && patient.releaseDate && (
            <p className="text-[11px] text-gray-400 ml-1">
              · Released: <span className="font-semibold">{fmtDate(patient.releaseDate)}</span>
            </p>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={onEdit}
            className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500 hover:bg-indigo-100 transition-colors"
            title="Edit"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>

          {!released && (
            <>
              <button
                onClick={onTransfer}
                className="h-8 px-3 rounded-lg bg-violet-50 border border-violet-200 flex items-center gap-1 text-violet-700 hover:bg-violet-100 transition-colors text-[11px] font-bold"
                title="Transfer location"
              >
                <ArrowRightLeft className="w-3 h-3" /> Transfer
              </button>
              <button
                onClick={onRelease}
                className="h-8 px-3 rounded-lg bg-amber-50 border border-amber-200 flex items-center gap-1 text-amber-700 hover:bg-amber-100 transition-colors text-[11px] font-bold"
                title="Release patient"
              >
                <LogOut className="w-3 h-3" /> Release
              </button>
            </>
          )}

          <Link
            to={`/indoor-patient/${patient._id}/expenditures`}
            className="h-8 px-3 rounded-lg bg-teal-50 border border-teal-200 flex items-center gap-1 text-teal-700 hover:bg-teal-100 transition-colors text-[11px] font-bold"
          >
            <ReceiptText className="w-3 h-3" /> Bills
          </Link>

          <button
            onClick={onDelete}
            className="w-8 h-8 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center text-red-400 hover:bg-red-100 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Pagination ───────────────────────────────────────────────────────────────

const Pagination = ({ page, totalPages, onPage }) => {
  if (totalPages <= 1) return null;
  const delta = 2;
  const start = Math.max(1, page - delta);
  const end = Math.min(totalPages, page + delta);
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  return (
    <div className="flex items-center justify-center gap-1.5 mt-5">
      <button
        onClick={() => onPage(page - 1)}
        disabled={page === 1}
        className="w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-sm"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      {start > 1 && (
        <>
          <button
            onClick={() => onPage(1)}
            className="w-8 h-8 rounded-lg border border-gray-200 bg-white text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors shadow-sm"
          >
            1
          </button>
          {start > 2 && <span className="text-gray-300 text-sm px-1">…</span>}
        </>
      )}
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPage(p)}
          className={`w-8 h-8 rounded-lg border text-sm font-semibold transition-colors shadow-sm ${p === page ? "bg-teal-600 border-teal-600 text-white" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"}`}
        >
          {p}
        </button>
      ))}
      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="text-gray-300 text-sm px-1">…</span>}
          <button
            onClick={() => onPage(totalPages)}
            className="w-8 h-8 rounded-lg border border-gray-200 bg-white text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors shadow-sm"
          >
            {totalPages}
          </button>
        </>
      )}
      <button
        onClick={() => onPage(page + 1)}
        disabled={page === totalPages}
        className="w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-sm"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

// ─── Form Primitives ──────────────────────────────────────────────────────────

const Field = ({ label, required, children, className = "" }) => (
  <div className={className}>
    <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    {children}
  </div>
);

const inputCls =
  "w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400 transition placeholder-gray-300";

const SelectField = ({ name, value, onChange, options, placeholder, required, labelKey = null, valueKey = null }) => (
  <div className="relative">
    <select
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      className={`${inputCls} appearance-none pr-9 ${!value ? "text-gray-400" : "text-gray-900"}`}
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {options.map((o) => {
        const val = valueKey ? String(o[valueKey]) : o;
        const lbl = labelKey ? o[labelKey] : o;
        return (
          <option key={val} value={val}>
            {lbl}
          </option>
        );
      })}
    </select>
    <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
  </div>
);

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

const DeleteModal = ({ patient, onConfirm, onCancel, loading }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
    <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-sm p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-red-500" />
        </div>
        <div>
          <p className="text-base font-bold text-gray-900">Delete Patient Record</p>
          <p className="text-[11px] text-gray-400">This action cannot be undone</p>
        </div>
      </div>
      <p className="text-sm text-gray-600 mb-5">
        Are you sure you want to permanently delete <span className="font-bold text-gray-900">{patient.name}</span>?
      </p>
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          disabled={loading}
          className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
          Delete
        </button>
      </div>
    </div>
  </div>
);

// ─── Release Confirm Modal ────────────────────────────────────────────────────

const ReleaseModal = ({ patient, onConfirm, onCancel, loading }) => {
  const [releaseNotes, setReleaseNotes] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center">
            <LogOut className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <p className="text-base font-bold text-gray-900">Release Patient</p>
            <p className="text-[11px] text-gray-400">{patient.name}</p>
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">
            Discharge Notes (optional)
          </label>
          <textarea
            value={releaseNotes}
            onChange={(e) => setReleaseNotes(e.target.value)}
            rows={3}
            placeholder="Summary of treatment, instructions…"
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 transition placeholder-gray-300 resize-none"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm({ releaseDate: Date.now(), releaseNotes })}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-bold hover:bg-amber-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <LogOut className="w-4 h-4" />
            )}
            Release
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Patient Form Modal ───────────────────────────────────────────────────────

const PatientFormModal = ({ initial, onClose, onSaved, doctors, referrers }) => {
  const isEdit = !!initial?._id;

  const [form, setForm] = useState(() => {
    if (initial?._id) {
      return {
        name: initial.name ?? "",
        age: initial.age ?? "",
        gender: initial.gender ?? "",
        bloodGroup: initial.bloodGroup ?? "unknown",
        contactNumber: initial.contactNumber ?? "",
        address: initial.address ?? "",
        nid: initial.nid ?? "",
        guardianName: initial.guardianName ?? "",
        guardianRelation: initial.guardianRelation ?? "",
        guardianContact: initial.guardianContact ?? "",
        admissionDate: initial.admissionDate ?? Date.now(),
        locationType: initial.locationType ?? "",
        locationDetail: initial.locationDetail ?? "",
        department: initial.department ?? "",
        diagnosis: initial.diagnosis ?? "",
        notes: initial.notes ?? "",
        doctorId: initial.doctorId ? String(initial.doctorId) : "",
        referrerId: initial.referrerId ? String(initial.referrerId) : "",
      };
    }
    return { ...EMPTY_FORM, admissionDate: Date.now() };
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.doctorId) return setError("Please select an attending doctor.");

    const payload = {
      ...form,
      age: Number(form.age),
      admissionDate: form.admissionDate || Date.now(),
      referrerId: form.referrerId || undefined,
      locationDetail: form.locationDetail || undefined,
    };

    try {
      setSaving(true);
      if (isEdit) await indoorPatientService.update(initial._id, payload);
      else await indoorPatientService.admit(payload);
      onSaved(isEdit);
    } catch (err) {
      setError(err?.response?.data?.error ?? "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const dtLocal = (ts) => {
    if (!ts) return "";
    const d = new Date(ts);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const sectionHead = (title, icon) => (
    <div className="flex items-center gap-2 pt-2">
      <div className="w-6 h-6 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center">
        {icon}
      </div>
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{title}</p>
      <div className="flex-1 h-px bg-gray-100" />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-teal-50/60 to-cyan-50/30 sticky top-0 z-10 rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
              {isEdit ? <Pencil className="w-4 h-4 text-teal-600" /> : <UserPlus className="w-4 h-4 text-teal-600" />}
            </div>
            <div>
              <p className="text-sm font-extrabold text-gray-900">
                {isEdit ? "Edit Patient Record" : "Admit New Patient"}
              </p>
              <p className="text-[11px] text-gray-400">
                {isEdit ? "Update patient details" : "Register a new indoor patient"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {sectionHead("Patient Information", <User className="w-3 h-3 text-teal-500" />)}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Full Name" required className="col-span-2">
              <input
                name="name"
                className={inputCls}
                placeholder="Patient full name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </Field>
            <Field label="Age" required>
              <input
                name="age"
                type="number"
                min="0"
                max="150"
                className={inputCls}
                placeholder="Age (years)"
                value={form.age}
                onChange={handleChange}
                required
              />
            </Field>
            <Field label="Gender" required>
              <SelectField
                name="gender"
                value={form.gender}
                onChange={handleChange}
                options={GENDERS}
                placeholder="Select gender"
                required
              />
            </Field>
            <Field label="Blood Group">
              <SelectField
                name="bloodGroup"
                value={form.bloodGroup}
                onChange={handleChange}
                options={BLOOD_GROUPS}
                placeholder="Blood group"
              />
            </Field>
            <Field label="Contact Number">
              <input
                name="contactNumber"
                className={inputCls}
                placeholder="01XXXXXXXXX"
                value={form.contactNumber}
                onChange={handleChange}
              />
            </Field>
            <Field label="Address" className="col-span-2">
              <input
                name="address"
                className={inputCls}
                placeholder="Full address"
                value={form.address}
                onChange={handleChange}
              />
            </Field>
            <Field label="NID / Passport">
              <input
                name="nid"
                className={inputCls}
                placeholder="National ID (optional)"
                value={form.nid}
                onChange={handleChange}
              />
            </Field>
          </div>

          {sectionHead("Guardian Information", <Users className="w-3 h-3 text-teal-500" />)}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Guardian Name">
              <input
                name="guardianName"
                className={inputCls}
                placeholder="Guardian full name"
                value={form.guardianName}
                onChange={handleChange}
              />
            </Field>
            <Field label="Relation">
              <input
                name="guardianRelation"
                className={inputCls}
                placeholder="Father / Mother / Spouse…"
                value={form.guardianRelation}
                onChange={handleChange}
              />
            </Field>
            <Field label="Guardian Contact">
              <input
                name="guardianContact"
                className={inputCls}
                placeholder="01XXXXXXXXX"
                value={form.guardianContact}
                onChange={handleChange}
              />
            </Field>
          </div>

          {sectionHead("Admission Details", <BedDouble className="w-3 h-3 text-teal-500" />)}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Admission Date & Time" required className="col-span-2 sm:col-span-1">
              <input
                name="admissionDate"
                type="datetime-local"
                className={inputCls}
                value={dtLocal(form.admissionDate)}
                onChange={(e) => setForm((f) => ({ ...f, admissionDate: new Date(e.target.value).getTime() }))}
                required
              />
            </Field>
            <Field label="Department">
              <SelectField
                name="department"
                value={form.department}
                onChange={handleChange}
                options={DEPARTMENTS}
                placeholder="Select department (optional)"
              />
            </Field>

            {/* Structured location */}
            <Field label="Location Type">
              <SelectField
                name="locationType"
                value={form.locationType}
                onChange={handleChange}
                options={LOCATION_TYPES}
                placeholder="Ward / ICU / Cabin…"
              />
            </Field>
            <Field label="Room / Bed / No.">
              <input
                name="locationDetail"
                className={inputCls}
                placeholder="e.g. Bed 4, Room 12, ICU-A…"
                value={form.locationDetail}
                onChange={handleChange}
              />
            </Field>
          </div>

          {sectionHead("Doctor & Referrer", <Stethoscope className="w-3 h-3 text-teal-500" />)}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Attending Doctor" required className="col-span-2 sm:col-span-1">
              <SelectField
                name="doctorId"
                value={form.doctorId}
                onChange={handleChange}
                options={doctors}
                placeholder="Select doctor"
                required
                labelKey="name"
                valueKey="_id"
              />
            </Field>
            <Field label="Referred By">
              <SelectField
                name="referrerId"
                value={form.referrerId}
                onChange={handleChange}
                options={referrers}
                placeholder="Select referrer (optional)"
                labelKey="name"
                valueKey="_id"
              />
            </Field>
          </div>

          {sectionHead("Clinical", <ClipboardList className="w-3 h-3 text-teal-500" />)}

          <Field label="Diagnosis / Chief Complaint">
            <textarea
              name="diagnosis"
              rows={2}
              className={`${inputCls} resize-none`}
              placeholder="Initial diagnosis or reason for admission…"
              value={form.diagnosis}
              onChange={handleChange}
            />
          </Field>
          <Field label="Additional Notes">
            <textarea
              name="notes"
              rows={2}
              className={`${inputCls} resize-none`}
              placeholder="Allergies, special instructions…"
              value={form.notes}
              onChange={handleChange}
            />
          </Field>

          {error && (
            <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 text-white text-sm font-bold hover:from-teal-700 hover:to-cyan-700 transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : isEdit ? (
                <Pencil className="w-4 h-4" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              {isEdit ? "Save Changes" : "Admit Patient"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const IndoorPatient = () => {
  const [patients, setPatients] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [popup, setPopup] = useState(null);
  const [formModal, setFormModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [releaseTarget, setReleaseTarget] = useState(null);
  const [transferTarget, setTransferTarget] = useState(null);
  const [historyTarget, setHistoryTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const [transferring, setTransferring] = useState(false);

  const [doctors, setDoctors] = useState([]);
  const [referrers, setReferrers] = useState([]);

  const filtersRef = useRef({ search: "", status: "", page: 1 });
  const debounceRef = useRef(null);
  const isMountRef = useRef(true);

  useEffect(() => {
    (async () => {
      try {
        const firstRes = await doctorService.getAll({ page: 1 });
        const { doctors: firstPage, totalPages } = firstRes.data;
        let allDoctors = firstPage ?? [];
        if (totalPages > 1) {
          const rest = await Promise.all(
            Array.from({ length: totalPages - 1 }, (_, i) =>
              doctorService.getAll({ page: i + 2 }).then((r) => r.data.doctors ?? []),
            ),
          );
          allDoctors = [...allDoctors, ...rest.flat()];
        }
        setDoctors(allDoctors);
      } catch (err) {
        console.error("Failed to load doctors:", err);
      }

      try {
        const refRes = await referrerService.getAll();
        const list = Array.isArray(refRes.data) ? refRes.data : (refRes.data?.referrers ?? []);
        setReferrers(list);
      } catch (err) {
        console.error("Failed to load referrers:", err);
      }
    })();
  }, []);

  const fetchPatients = async ({ search: s = "", status: st = "", page = 1 } = {}) => {
    try {
      setLoading(true);
      const res = await indoorPatientService.getAll({ search: s, status: st, page });
      const { patients: data, total, totalPages, page: currentPage } = res.data;
      setPatients(data);
      setPagination({ page: currentPage, totalPages, total });
    } catch {
      setPopup({ type: "error", message: "Failed to load patients. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    filtersRef.current = { search, status: statusFilter, page: 1 };

    if (isMountRef.current) {
      isMountRef.current = false;
      fetchPatients();
      return;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchPatients(filtersRef.current), 400);
    return () => clearTimeout(debounceRef.current);
  }, [search, statusFilter]);

  const handlePage = (p) => {
    const next = { ...filtersRef.current, page: p };
    filtersRef.current = next;
    fetchPatients(next);
  };

  const handleSaved = (isEdit) => {
    setFormModal(null);
    fetchPatients(filtersRef.current);
    setPopup({ type: "success", message: isEdit ? "Patient record updated." : "Patient admitted successfully." });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await indoorPatientService.delete(deleteTarget._id);
      setDeleteTarget(null);
      const targetPage = patients.length === 1 && pagination.page > 1 ? pagination.page - 1 : pagination.page;
      const next = { ...filtersRef.current, page: targetPage };
      filtersRef.current = next;
      fetchPatients(next);
      setPopup({ type: "success", message: "Patient record deleted." });
    } catch {
      setPopup({ type: "error", message: "Failed to delete record." });
    } finally {
      setDeleting(false);
    }
  };

  const handleRelease = async (data) => {
    if (!releaseTarget) return;
    try {
      setReleasing(true);
      await indoorPatientService.release(releaseTarget._id, data);
      setReleaseTarget(null);
      fetchPatients(filtersRef.current);
      setPopup({ type: "success", message: `${releaseTarget.name} has been released.` });
    } catch {
      setPopup({ type: "error", message: "Failed to release patient." });
    } finally {
      setReleasing(false);
    }
  };

  const handleTransfer = async (data) => {
    if (!transferTarget) return;
    try {
      setTransferring(true);
      await indoorPatientService.transfer(transferTarget._id, data);
      setTransferTarget(null);
      fetchPatients(filtersRef.current);
      setPopup({
        type: "success",
        message: `${transferTarget.name} transferred to ${data.toType}${data.toDetail ? ` – ${data.toDetail}` : ""}.`,
      });
    } catch {
      setPopup({ type: "error", message: "Failed to transfer patient." });
    } finally {
      setTransferring(false);
    }
  };

  return (
    <section className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/40 to-cyan-50 px-4 py-6">
      {popup && <Popup type={popup.type} message={popup.message} onClose={() => setPopup(null)} />}

      {formModal !== null && (
        <PatientFormModal
          initial={formModal._id ? formModal : null}
          onClose={() => setFormModal(null)}
          onSaved={handleSaved}
          doctors={doctors}
          referrers={referrers}
        />
      )}

      {deleteTarget && (
        <DeleteModal
          patient={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}

      {releaseTarget && (
        <ReleaseModal
          patient={releaseTarget}
          onConfirm={handleRelease}
          onCancel={() => setReleaseTarget(null)}
          loading={releasing}
        />
      )}

      {transferTarget && (
        <TransferModal
          patient={transferTarget}
          onConfirm={handleTransfer}
          onCancel={() => setTransferTarget(null)}
          loading={transferring}
        />
      )}

      {historyTarget && <TransferHistoryModal patient={historyTarget} onClose={() => setHistoryTarget(null)} />}

      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <BedDouble className="w-7 h-7 text-teal-600" /> Indoor Patients
            </h1>
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-teal-400" /> Manage admitted patients
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFormModal({})}
              className="px-3 py-2.5 rounded-xl border border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100 transition-all flex items-center gap-2 text-sm font-medium shadow-sm"
            >
              <UserPlus className="w-4 h-4" /> Admit
            </button>
            <Link
              to="/lab-management"
              className="px-3 py-2.5 rounded-xl border border-gray-200 bg-white/60 text-gray-700 hover:bg-gray-50 transition-all flex items-center gap-2 text-sm font-medium shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </Link>
          </div>
        </div>

        {/* Search + Filter */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              className="w-full pl-10 pr-9 py-2.5 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400 transition placeholder-gray-300 shadow-sm"
              placeholder="Search by name, location, contact, diagnosis…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-3 pr-8 py-2.5 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400 transition appearance-none shadow-sm text-gray-700"
            >
              <option value="">All Status</option>
              <option value="admitted">Admitted</option>
              <option value="released">Released</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Stats bar */}
        {!loading && pagination.total > 0 && (
          <div className="flex items-center gap-3 mb-4 px-4 py-2.5 bg-white/60 border border-gray-100 rounded-xl text-[11px] font-semibold text-gray-400 uppercase tracking-wide shadow-sm">
            <span className="text-teal-600 font-black text-sm">{pagination.total}</span> Total &nbsp;·&nbsp; Page{" "}
            <span className="text-teal-600 font-black text-sm">{pagination.page}</span> of{" "}
            <span className="text-teal-600 font-black text-sm">{pagination.totalPages}</span>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        ) : patients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center mb-4">
              <BedDouble className="w-8 h-8 text-teal-300" />
            </div>
            <p className="text-base font-bold text-gray-700">
              {search || statusFilter ? "No patients found" : "No patients admitted yet"}
            </p>
            <p className="text-sm text-gray-400 mt-1 max-w-xs">
              {search || statusFilter
                ? "Try a different search or clear the filter."
                : "Admit your first patient by clicking the Admit button above."}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {patients.map((patient) => (
                <PatientCard
                  key={patient._id}
                  patient={patient}
                  onEdit={() => setFormModal(patient)}
                  onDelete={() => setDeleteTarget(patient)}
                  onRelease={() => setReleaseTarget(patient)}
                  onTransfer={() => setTransferTarget(patient)}
                  onHistory={() => setHistoryTarget(patient)}
                />
              ))}
            </div>
            <Pagination page={pagination.page} totalPages={pagination.totalPages} onPage={handlePage} />
          </>
        )}
      </div>
    </section>
  );
};

export default IndoorPatient;
