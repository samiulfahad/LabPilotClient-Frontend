/**
 * useCallback / useMemo are intentionally absent throughout this file.
 * babel-plugin-react-compiler handles all memoization automatically.
 */
import { useState, useEffect, useRef } from "react";
import {
  Stethoscope,
  UserPlus,
  Search,
  ArrowLeft,
  X,
  Pencil,
  Trash2,
  ChevronDown,
  BadgePercent,
  Banknote,
  Phone,
  GraduationCap,
  Building2,
  Layers,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Activity,
} from "lucide-react";
import { Link } from "react-router-dom";
import doctorService from "../../api/doctor";
import Popup from "../../components/popup";

// ─── Constants ────────────────────────────────────────────────────────────────

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

const DESIGNATIONS = [
  "Professor",
  "Associate Professor",
  "Assistant Professor",
  "Consultant",
  "Senior Consultant",
  "Resident",
  "Medical Officer",
  "House Officer",
  "Intern",
  "General Practitioner",
  "Specialist",
  "Other",
];

const EMPTY_FORM = {
  name: "",
  degree: "",
  contactNumber: "",
  designation: "",
  department: "",
  commissionType: "percentage",
  commissionValue: "",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n, type) => {
  if (type === "percentage") return `${n}%`;
  return `৳${typeof n === "number" ? n.toLocaleString("en-IN") : n}`;
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const SkeletonCard = () => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-pulse">
    <div className="px-5 py-4 flex items-start justify-between gap-3">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-gray-200 shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="h-4 w-36 bg-gray-200 rounded" />
          <div className="h-3 w-24 bg-gray-100 rounded" />
          <div className="h-3 w-20 bg-gray-100 rounded" />
        </div>
      </div>
      <div className="h-6 w-16 bg-gray-100 rounded-full" />
    </div>
    <div className="px-5 pb-4 flex items-center justify-between border-t border-gray-50 pt-3">
      <div className="h-3 w-28 bg-gray-100 rounded" />
      <div className="flex gap-2">
        <div className="h-8 w-8 bg-gray-100 rounded-lg" />
        <div className="h-8 w-8 bg-gray-100 rounded-lg" />
      </div>
    </div>
  </div>
);

// ─── Doctor Card ──────────────────────────────────────────────────────────────

const DoctorCard = ({ doctor, onEdit, onDelete }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md hover:border-indigo-100 transition-all duration-200 group">
    <div className="px-5 pt-4 pb-3 flex items-start justify-between gap-3">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
          <Stethoscope className="w-5 h-5 text-indigo-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 truncate">{doctor.name}</p>
          {doctor.degree && (
            <div className="flex items-center gap-1 mt-0.5">
              <GraduationCap className="w-3 h-3 text-gray-400 shrink-0" />
              <p className="text-[11px] text-gray-500 truncate">{doctor.degree}</p>
            </div>
          )}
          {doctor.designation && (
            <div className="flex items-center gap-1 mt-0.5">
              <BadgePercent className="w-3 h-3 text-indigo-400 shrink-0" />
              <p className="text-[11px] text-indigo-600 font-medium truncate">{doctor.designation}</p>
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0">
        {doctor.isActive !== false ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3" /> Active
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-400 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full">
            <XCircle className="w-3 h-3" /> Inactive
          </span>
        )}
      </div>
    </div>

    <div className="px-5 pb-4 grid grid-cols-2 gap-2">
      {doctor.department && (
        <div className="flex items-center gap-1.5 bg-purple-50 border border-purple-100 rounded-lg px-3 py-2">
          <Layers className="w-3 h-3 text-purple-400 shrink-0" />
          <p className="text-[11px] font-semibold text-purple-700 truncate">{doctor.department}</p>
        </div>
      )}
      {doctor.contactNumber && (
        <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
          <Phone className="w-3 h-3 text-gray-400 shrink-0" />
          <p className="text-[11px] font-medium text-gray-600 truncate">{doctor.contactNumber}</p>
        </div>
      )}
    </div>

    <div className="px-5 pb-4 flex items-center justify-between border-t border-gray-50 pt-3">
      <div className="flex items-center gap-1.5">
        {doctor.commissionType === "percentage" ? (
          <BadgePercent className="w-3.5 h-3.5 text-amber-500" />
        ) : (
          <Banknote className="w-3.5 h-3.5 text-emerald-500" />
        )}
        <p className="text-[11px] text-gray-500">
          Commission:{" "}
          <span className="font-bold text-gray-800">{fmt(doctor.commissionValue, doctor.commissionType)}</span>
        </p>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onEdit(doctor)}
          className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500 hover:bg-indigo-100 transition-colors"
          title="Edit"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onDelete(doctor)}
          className="w-8 h-8 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center text-red-400 hover:bg-red-100 transition-colors"
          title="Delete"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  </div>
);

// ─── Form Field ───────────────────────────────────────────────────────────────

const Field = ({ label, required, children }) => (
  <div>
    <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    {children}
  </div>
);

const inputCls =
  "w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition placeholder-gray-300";

const SelectField = ({ value, onChange, options, placeholder, required }) => (
  <div className="relative">
    <select
      value={value}
      onChange={onChange}
      required={required}
      className={`${inputCls} appearance-none pr-9 ${!value ? "text-gray-300" : "text-gray-900"}`}
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
    <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
  </div>
);

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

const DeleteModal = ({ doctor, onConfirm, onCancel, loading }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
    <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-sm p-6 animate-[fadeIn_0.15s_ease]">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-red-500" />
        </div>
        <div>
          <p className="text-base font-bold text-gray-900">Delete Doctor</p>
          <p className="text-[11px] text-gray-400">This action cannot be undone</p>
        </div>
      </div>
      <p className="text-sm text-gray-600 mb-5">
        Are you sure you want to delete <span className="font-bold text-gray-900">{doctor.name}</span>? All associated
        data will be permanently removed.
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

// ─── Doctor Form Modal ────────────────────────────────────────────────────────

const DoctorFormModal = ({ initial, onClose, onSaved }) => {
  const isEdit = !!initial?._id;
  const [form, setForm] = useState(
    initial
      ? {
          name: initial.name ?? "",
          degree: initial.degree ?? "",
          contactNumber: initial.contactNumber ?? "",
          designation: initial.designation ?? "",
          department: initial.department ?? "",
          commissionType: initial.commissionType ?? "percentage",
          commissionValue: initial.commissionValue ?? "",
        }
      : EMPTY_FORM,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const val = Number(form.commissionValue);
    if (isNaN(val) || val < 0) return setError("Commission value must be a positive number.");
    if (form.commissionType === "percentage" && val > 100) return setError("Percentage must be between 0 and 100.");

    const payload = { ...form, commissionValue: val };

    try {
      setSaving(true);
      if (isEdit) {
        await doctorService.update(initial._id, payload);
      } else {
        await doctorService.create(payload);
      }
      onSaved();
    } catch (err) {
      setError(err?.response?.data?.error ?? "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50/60 to-purple-50/30 sticky top-0 z-10 rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
              {isEdit ? (
                <Pencil className="w-4 h-4 text-indigo-600" />
              ) : (
                <UserPlus className="w-4 h-4 text-indigo-600" />
              )}
            </div>
            <div>
              <p className="text-sm font-extrabold text-gray-900">{isEdit ? "Edit Doctor" : "Register Doctor"}</p>
              <p className="text-[11px] text-gray-400">
                {isEdit ? "Update doctor details" : "Add a new doctor referrer"}
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
          {/* Name */}
          <Field label="Full Name" required>
            <input
              className={inputCls}
              placeholder="Dr. Aminur Rahman"
              value={form.name}
              onChange={set("name")}
              required
            />
          </Field>

          {/* Degree + Contact */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Degree">
              <input className={inputCls} placeholder="MBBS, MD…" value={form.degree} onChange={set("degree")} />
            </Field>
            <Field label="Contact Number" required>
              <input
                className={inputCls}
                placeholder="01XXXXXXXXX"
                value={form.contactNumber}
                onChange={set("contactNumber")}
                required
              />
            </Field>
          </div>

          {/* Designation */}
          <Field label="Designation">
            <SelectField
              value={form.designation}
              onChange={set("designation")}
              options={DESIGNATIONS}
              placeholder="Select designation"
            />
          </Field>

          {/* Department */}
          <Field label="Department" required>
            <SelectField
              value={form.department}
              onChange={set("department")}
              options={DEPARTMENTS}
              placeholder="Select department"
              required
            />
          </Field>

          {/* Commission */}
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-3">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Commission</p>
            <div className="grid grid-cols-2 gap-2">
              {["percentage", "fixed"].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, commissionType: type, commissionValue: "" }))}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                    form.commissionType === type
                      ? type === "percentage"
                        ? "bg-amber-50 border-amber-300 text-amber-700"
                        : "bg-emerald-50 border-emerald-300 text-emerald-700"
                      : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}
                >
                  {type === "percentage" ? <BadgePercent className="w-4 h-4" /> : <Banknote className="w-4 h-4" />}
                  {type === "percentage" ? "Percentage" : "Fixed (BDT)"}
                </button>
              ))}
            </div>
            <div className="relative">
              <input
                type="number"
                min="0"
                max={form.commissionType === "percentage" ? 100 : undefined}
                step="0.01"
                className={`${inputCls} ${form.commissionType === "percentage" ? "pr-10" : "pl-8"}`}
                placeholder={form.commissionType === "percentage" ? "0 – 100" : "Amount in BDT"}
                value={form.commissionValue}
                onChange={set("commissionValue")}
                required
              />
              {form.commissionType === "percentage" ? (
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-amber-500">%</span>
              ) : (
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-emerald-500">৳</span>
              )}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
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
              className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-bold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : isEdit ? (
                <Pencil className="w-4 h-4" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              {isEdit ? "Save Changes" : "Register Doctor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const Doctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [popup, setPopup] = useState(null);
  const [formModal, setFormModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const debounceRef = useRef(null);

  const fetchDoctors = async ({ search: s, department: d } = {}) => {
    try {
      setLoading(true);
      const res = await doctorService.getAll({ search: s, department: d });
      setDoctors(res.data);
    } catch {
      setPopup({ type: "error", message: "Failed to load doctors. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  // Debounce search + dept filter — fires 400ms after last change
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchDoctors({ search, department: deptFilter });
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [search, deptFilter]);

  const handleSaved = () => {
    setFormModal(null);
    fetchDoctors({ search, department: deptFilter });
    setPopup({
      type: "success",
      message: formModal?._id ? "Doctor updated successfully." : "Doctor registered successfully.",
    });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await doctorService.delete(deleteTarget._id);
      setDeleteTarget(null);
      fetchDoctors({ search, department: deptFilter });
      setPopup({ type: "success", message: "Doctor deleted successfully." });
    } catch {
      setPopup({ type: "error", message: "Failed to delete doctor. Please try again." });
    } finally {
      setDeleting(false);
    }
  };

  // dept options derived from current result set
  const uniqueDepts = [...new Set(doctors.map((d) => d.department).filter(Boolean))].sort();

  return (
    <section className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 px-4 py-6">
      {popup && <Popup type={popup.type} message={popup.message} onClose={() => setPopup(null)} />}
      {formModal !== null && (
        <DoctorFormModal
          initial={formModal._id ? formModal : null}
          onClose={() => setFormModal(null)}
          onSaved={handleSaved}
        />
      )}
      {deleteTarget && (
        <DeleteModal
          doctor={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}

      <div className="max-w-2xl mx-auto">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Stethoscope className="w-7 h-7 text-indigo-600" /> Doctors
            </h1>
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-indigo-400" /> Manage doctor referrers
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFormModal({})}
              className="px-3 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-all flex items-center gap-2 text-sm font-medium shadow-sm"
            >
              <UserPlus className="w-4 h-4" /> Register
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
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition placeholder-gray-300 shadow-sm"
              placeholder="Search by name, degree, contact…"
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

          {uniqueDepts.length > 0 && (
            <div className="relative">
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="pl-3 pr-8 py-2.5 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition appearance-none shadow-sm text-gray-700"
              >
                <option value="">All Depts</option>
                {uniqueDepts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <Building2 className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}
        </div>

        {/* Stats bar */}
        {!loading && doctors.length > 0 && (
          <div className="flex items-center gap-3 mb-4 px-4 py-2.5 bg-white/60 border border-gray-100 rounded-xl text-[11px] font-semibold text-gray-400 uppercase tracking-wide shadow-sm">
            <span className="text-indigo-600 font-black text-sm">{doctors.length}</span> Showing &nbsp;·&nbsp;
            <span className="text-emerald-600 font-black text-sm">
              {doctors.filter((d) => d.isActive !== false).length}
            </span>{" "}
            Active
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : doctors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-4">
              <Stethoscope className="w-8 h-8 text-indigo-300" />
            </div>
            <p className="text-base font-bold text-gray-700">
              {search || deptFilter ? "No doctors found" : "No doctors yet"}
            </p>
            <p className="text-sm text-gray-400 mt-1 max-w-xs">
              {search || deptFilter
                ? "Try a different search term or clear the filter."
                : "Register your first doctor by clicking the Register button above."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {doctors.map((doctor) => (
              <DoctorCard
                key={doctor._id}
                doctor={doctor}
                onEdit={(d) => setFormModal(d)}
                onDelete={(d) => setDeleteTarget(d)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Doctors;
