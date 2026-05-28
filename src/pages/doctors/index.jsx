/**
 * useCallback / useMemo are intentionally absent throughout this file.
 * babel-plugin-react-compiler handles all memoization automatically.
 */
import { useState, useEffect, useRef, useMemo } from "react";
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
  Layers,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Check,
  Filter,
  RotateCcw,
  Activity,
  Building2,
} from "lucide-react";
import { Link } from "react-router-dom";
import doctorService from "../../api/doctor";
import departmentService from "../../api/department";
import Popup from "../../components/popup";

// ── Constants ──────────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  name: "",
  degree: "",
  contactNumber: "",
  designation: "",
  departments: [],
  commissionType: "percentage",
  commissionValue: "",
};

// ── Helpers ────────────────────────────────────────────────────────────────────

const fmt = (n, type) =>
  type === "percentage" ? `${n}%` : `৳${typeof n === "number" ? n.toLocaleString("en-IN") : n}`;

const initials = (name) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

const cls = (...args) => args.filter(Boolean).join(" ");

// ── Shared primitives ──────────────────────────────────────────────────────────

const inputCls =
  "w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition placeholder-gray-400 text-gray-900";

const Field = ({ label, required, children }) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-semibold text-gray-600">
      {label}
      {required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

const SelectField = ({ name, value, onChange, options, placeholder }) => (
  <div className="relative">
    <select
      name={name}
      value={value}
      onChange={onChange}
      className={cls(inputCls, "appearance-none pr-8", !value && "text-gray-400")}
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
    <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
  </div>
);

// ── Skeleton ───────────────────────────────────────────────────────────────────

const SkeletonCard = () => (
  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4 flex-1">
        <div className="w-12 h-12 rounded-full bg-gray-200 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-40" />
          <div className="h-3 bg-gray-100 rounded w-28" />
          <div className="flex gap-1.5">
            <div className="h-5 w-20 bg-gray-100 rounded-full" />
            <div className="h-5 w-16 bg-gray-100 rounded-full" />
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <div className="h-9 w-20 bg-gray-200 rounded-lg" />
        <div className="h-9 w-20 bg-gray-200 rounded-lg" />
      </div>
    </div>
  </div>
);

// ── Multi-Department Select ────────────────────────────────────────────────────

const DepartmentMultiSelect = ({ departments, selected, onChange }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = (v) => onChange(selected.includes(v) ? selected.filter((s) => s !== v) : [...selected, v]);
  const filtered = departments.filter((d) => d.label.toLowerCase().includes(search.toLowerCase()));
  const selectedDepts = departments.filter((d) => selected.includes(d.value));

  return (
    <div ref={ref} className="relative">
      <div
        onClick={() => setOpen((o) => !o)}
        className={cls(
          "min-h-[40px] w-full px-2.5 py-1.5 rounded-lg border bg-white cursor-pointer flex flex-wrap items-center gap-1.5 transition",
          open ? "border-blue-500 ring-2 ring-blue-100" : "border-gray-200 hover:border-gray-300",
        )}
      >
        {selected.length === 0 ? (
          <span className="text-sm text-gray-400 select-none px-0.5">Select departments</span>
        ) : (
          selectedDepts.map((d) => (
            <span
              key={d.value}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-[11px] font-semibold"
            >
              {d.label}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(selected.filter((v) => v !== d.value));
                }}
                className="w-3 h-3 rounded-full flex items-center justify-center hover:bg-blue-200 transition-colors"
              >
                <X className="w-2 h-2" />
              </button>
            </span>
          ))
        )}
        <ChevronDown
          className={cls("w-3.5 h-3.5 text-gray-400 ml-auto shrink-0 transition-transform", open && "rotate-180")}
        />
      </div>

      {open && (
        <div className="absolute z-50 mt-1.5 w-full bg-white border border-gray-200 rounded-xl shadow-xl shadow-gray-900/10 overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="w-3 h-3 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search…"
                className="w-full pl-7 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition"
              />
            </div>
          </div>
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">No departments match</p>
            ) : (
              filtered.map((d) => {
                const checked = selected.includes(d.value);
                return (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => toggle(d.value)}
                    className={cls(
                      "w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors",
                      checked ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50",
                    )}
                  >
                    <span
                      className={cls(
                        "w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-colors",
                        checked ? "bg-blue-600 border-blue-600" : "border-gray-300",
                      )}
                    >
                      {checked && <Check className="w-2 h-2 text-white" />}
                    </span>
                    <span className="font-medium">{d.label}</span>
                  </button>
                );
              })
            )}
          </div>
          {selected.length > 0 && (
            <div className="px-3 py-2 border-t border-gray-100 flex justify-between items-center">
              <span className="text-[10px] text-gray-400">{selected.length} selected</span>
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-[10px] font-bold text-red-400 hover:text-red-600 transition-colors"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Modal Shell ────────────────────────────────────────────────────────────────

const Modal = ({ onClose, children }) => {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div className="fixed inset-0" style={{ zIndex: 9999 }}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={onClose} />
      <div className="absolute inset-0 flex items-start justify-center px-5 pt-10 pb-5 overflow-y-auto">
        <div className="relative w-full" style={{ maxWidth: "580px" }}>
          {children}
        </div>
      </div>
    </div>
  );
};

// ── Delete Modal ───────────────────────────────────────────────────────────────

const DeleteModal = ({ doctor, onConfirm, onCancel, loading }) => (
  <Modal onClose={onCancel}>
    <div className="bg-white rounded-[28px] overflow-hidden shadow-2xl">
      {/* Top danger zone */}
      <div className="bg-gradient-to-br from-red-50 to-rose-100 px-8 pt-8 pb-6 flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-white shadow-md shadow-red-100 flex items-center justify-center mb-4">
          <Trash2 className="w-7 h-7 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 text-center">Remove doctor?</h2>
        <p className="text-sm text-gray-500 text-center mt-2 leading-relaxed">
          <span className="font-semibold text-gray-700">{doctor.name}</span> will be permanently deleted along with all
          their data.
        </p>
      </div>
      {/* Actions */}
      <div className="px-8 py-6 bg-white flex gap-3">
        <button
          onClick={onCancel}
          disabled={loading}
          className="flex-1 h-12 rounded-2xl border-2 border-gray-100 text-sm font-semibold text-gray-500 hover:border-gray-200 hover:bg-gray-50 transition-all disabled:opacity-40"
        >
          Keep doctor
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 h-12 rounded-2xl bg-red-500 hover:bg-red-600 active:scale-95 text-white text-sm font-bold transition-all disabled:opacity-40 flex items-center justify-center gap-2"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
          Yes, delete
        </button>
      </div>
    </div>
  </Modal>
);

// ── Doctor Form Modal ──────────────────────────────────────────────────────────

const DoctorFormModal = ({ initial, onClose, onSaved, departments, designations }) => {
  const isEdit = !!initial?._id;
  const [form, setForm] = useState(() =>
    initial
      ? {
          name: initial.name ?? "",
          degree: initial.degree ?? "",
          contactNumber: initial.contactNumber ?? "",
          designation: initial.designation ?? "",
          departments: initial.departments ?? (initial.department ? [initial.department] : []),
          commissionType: initial.commissionType ?? "percentage",
          commissionValue: initial.commissionValue ?? "",
        }
      : EMPTY_FORM,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (name, value) => setForm((f) => ({ ...f, [name]: value }));
  const handleChange = (e) => set(e.target.name, e.target.value);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.departments.length === 0) return setError("Please select at least one department.");
    const val = Number(form.commissionValue);
    if (isNaN(val) || val < 0) return setError("Commission value must be a positive number.");
    if (form.commissionType === "percentage" && val > 100) return setError("Percentage must be between 0 and 100.");
    try {
      setSaving(true);
      const payload = { ...form, commissionValue: val };
      isEdit ? await doctorService.update(initial._id, payload) : await doctorService.create(payload);
      onSaved(isEdit);
    } catch (err) {
      setError(err?.response?.data?.error ?? "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const accent = isEdit
    ? {
        from: "from-violet-500",
        via: "via-purple-600",
        to: "to-indigo-500",
        bg: "bg-violet-50",
        text: "text-violet-600",
        shadow: "shadow-violet-200",
        btn: "from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700",
      }
    : {
        from: "from-blue-500",
        via: "via-indigo-600",
        to: "to-blue-400",
        bg: "bg-blue-50",
        text: "text-blue-600",
        shadow: "shadow-blue-200",
        btn: "from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700",
      };

  return (
    <Modal onClose={onClose}>
      <div
        className="bg-white rounded-[28px] shadow-2xl flex flex-col overflow-hidden"
        style={{ height: "min(700px, calc(100svh - 40px))" }}
      >
        {/* ── Header ── */}
        <div className="shrink-0 relative overflow-hidden">
          {/* Gradient bg */}
          <div className={cls("absolute inset-0 bg-gradient-to-br opacity-[0.07]", accent.from, accent.to)} />
          <div className="relative flex items-center justify-between px-7 py-5 border-b border-gray-100">
            <div className="flex items-center gap-3.5">
              <div className={cls("w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm", accent.bg)}>
                {isEdit ? (
                  <Pencil className={cls("w-5 h-5", accent.text)} />
                ) : (
                  <UserPlus className={cls("w-5 h-5", accent.text)} />
                )}
              </div>
              <div>
                <h2 className="text-[15px] font-bold text-gray-900 leading-tight">
                  {isEdit ? "Edit doctor" : "Register doctor"}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {isEdit ? "Update the details below" : "Add a new doctor referrer"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-7 py-6 space-y-5">
            <Field label="Full name" required>
              <input
                name="name"
                className={inputCls}
                placeholder="Dr. Aminur Rahman"
                value={form.name}
                onChange={handleChange}
                required
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Degree">
                <input
                  name="degree"
                  className={inputCls}
                  placeholder="MBBS, MD…"
                  value={form.degree}
                  onChange={handleChange}
                />
              </Field>
              <Field label="Contact number" required>
                <input
                  name="contactNumber"
                  className={inputCls}
                  placeholder="01XXXXXXXXX"
                  value={form.contactNumber}
                  onChange={handleChange}
                  required
                />
              </Field>
            </div>

            <Field label="Designation">
              <SelectField
                name="designation"
                value={form.designation}
                onChange={handleChange}
                options={designations}
                placeholder="Select designation"
              />
            </Field>

            <Field label="Departments" required>
              {departments.length === 0 ? (
                <div className="flex items-center gap-2 px-4 py-3 text-xs rounded-xl border border-amber-200 bg-amber-50 text-amber-700">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  No departments available.
                </div>
              ) : (
                <DepartmentMultiSelect
                  departments={departments}
                  selected={form.departments}
                  onChange={(val) => set("departments", val)}
                />
              )}
            </Field>

            {/* Commission card */}
            <div className="rounded-2xl border border-gray-100 overflow-hidden">
              <div className="bg-gray-50 px-5 py-3 border-b border-gray-100 flex items-center gap-2">
                <BadgePercent className="w-3.5 h-3.5 text-gray-400" />
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Commission</p>
              </div>
              <div className="p-5 space-y-4 bg-white">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    {
                      type: "percentage",
                      label: "Percentage",
                      Icon: BadgePercent,
                      ring: "ring-amber-200 bg-amber-50 text-amber-700",
                    },
                    {
                      type: "fixed",
                      label: "Fixed (BDT)",
                      Icon: Banknote,
                      ring: "ring-emerald-200 bg-emerald-50 text-emerald-700",
                    },
                  ].map(({ type, label, Icon, ring }) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        set("commissionType", type);
                        set("commissionValue", "");
                      }}
                      className={cls(
                        "flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-semibold transition-all ring-1",
                        form.commissionType === type
                          ? ring
                          : "ring-gray-200 bg-white text-gray-400 hover:ring-gray-300",
                      )}
                    >
                      <Icon className="w-4 h-4 shrink-0" /> {label}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <input
                    name="commissionValue"
                    type="number"
                    min="0"
                    max={form.commissionType === "percentage" ? 100 : undefined}
                    step="0.01"
                    className={cls(inputCls, form.commissionType === "percentage" ? "pr-9" : "pl-8")}
                    placeholder={form.commissionType === "percentage" ? "Enter 0 – 100" : "Enter amount"}
                    value={form.commissionValue}
                    onChange={handleChange}
                    required
                  />
                  {form.commissionType === "percentage" ? (
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-amber-400">
                      %
                    </span>
                  ) : (
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-emerald-500">
                      ৳
                    </span>
                  )}
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-3 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="shrink-0 px-7 py-5 border-t border-gray-100 bg-white flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex-1 h-12 rounded-2xl border-2 border-gray-100 text-sm font-semibold text-gray-500 hover:border-gray-200 hover:bg-gray-50 transition-all disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || departments.length === 0}
            className={cls(
              "flex-1 h-12 rounded-2xl bg-gradient-to-r text-white text-sm font-bold transition-all disabled:opacity-40 flex items-center justify-center gap-2 shadow-lg active:scale-95",
              accent.btn,
              accent.shadow,
            )}
          >
            {saving ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : isEdit ? (
              <Pencil className="w-4 h-4" />
            ) : (
              <UserPlus className="w-4 h-4" />
            )}
            {isEdit ? "Save changes" : "Register doctor"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

// ── Pagination ─────────────────────────────────────────────────────────────────

const Pagination = ({ page, totalPages, onPage }) => {
  if (totalPages <= 1) return null;
  const delta = 1;
  const start = Math.max(1, page - delta);
  const end = Math.min(totalPages, page + delta);
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);
  const btn = "w-8 h-8 rounded-lg border text-xs font-bold transition-colors flex items-center justify-center";

  return (
    <div className="flex items-center justify-center gap-1 pt-6 pb-2">
      <button
        onClick={() => onPage(page - 1)}
        disabled={page === 1}
        className={cls(
          btn,
          "border-gray-200 bg-white text-gray-400 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed",
        )}
      >
        <ChevronLeft className="w-3.5 h-3.5" />
      </button>

      {start > 1 && (
        <>
          <button
            onClick={() => onPage(1)}
            className={cls(btn, "border-gray-200 bg-white text-gray-500 hover:bg-gray-50")}
          >
            1
          </button>
          {start > 2 && <span className="text-gray-300 text-xs px-0.5">…</span>}
        </>
      )}

      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPage(p)}
          className={cls(
            btn,
            p === page
              ? "bg-blue-600 border-blue-600 text-white"
              : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50",
          )}
        >
          {p}
        </button>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="text-gray-300 text-xs px-0.5">…</span>}
          <button
            onClick={() => onPage(totalPages)}
            className={cls(btn, "border-gray-200 bg-white text-gray-500 hover:bg-gray-50")}
          >
            {totalPages}
          </button>
        </>
      )}

      <button
        onClick={() => onPage(page + 1)}
        disabled={page === totalPages}
        className={cls(
          btn,
          "border-gray-200 bg-white text-gray-400 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed",
        )}
      >
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

// ── Doctor Card ────────────────────────────────────────────────────────────────

const DoctorCard = ({ doctor, deptLabelMap, desigLabelMap, onEdit, onDelete }) => (
  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all duration-200">
    <div className="flex items-center justify-between gap-4">
      {/* Avatar + info */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-sm font-black text-white shrink-0 select-none shadow-sm">
          {initials(doctor.name)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-gray-900">{doctor.name}</p>
            {doctor.designation && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-violet-50 border border-violet-100 text-violet-700">
                {desigLabelMap[doctor.designation] ?? doctor.designation}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            {doctor.degree && (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <GraduationCap className="w-3 h-3 shrink-0" />
                {doctor.degree}
              </span>
            )}
            {doctor.contactNumber && (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Phone className="w-3 h-3 shrink-0" />
                {doctor.contactNumber}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5 mt-2">
            {doctor.departments?.map((d) => (
              <span
                key={d}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 border border-blue-100 text-blue-700"
              >
                <Layers className="w-2.5 h-2.5 shrink-0" />
                {deptLabelMap[d] ?? d}
              </span>
            ))}
            <span
              className={cls(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border",
                doctor.commissionType === "percentage"
                  ? "bg-amber-50 border-amber-100 text-amber-700"
                  : "bg-emerald-50 border-emerald-100 text-emerald-700",
              )}
            >
              {doctor.commissionType === "percentage" ? (
                <BadgePercent className="w-2.5 h-2.5 shrink-0" />
              ) : (
                <Banknote className="w-2.5 h-2.5 shrink-0" />
              )}
              {fmt(doctor.commissionValue, doctor.commissionType)}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onEdit}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
        >
          <Pencil className="w-3.5 h-3.5" />
          Edit
        </button>
        <button
          onClick={onDelete}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-600 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all shadow-sm"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete
        </button>
      </div>
    </div>
  </div>
);

// ── Stats Config ───────────────────────────────────────────────────────────────

const STATS_CONFIG = [
  {
    key: "total",
    label: "Total Doctors",
    icon: Stethoscope,
    color: "blue",
    textColor: "text-gray-900",
  },
  {
    key: "percentage",
    label: "% Commission",
    icon: BadgePercent,
    color: "amber",
    textColor: "text-amber-600",
  },
  {
    key: "fixed",
    label: "Fixed Commission",
    icon: Banknote,
    color: "emerald",
    textColor: "text-emerald-600",
  },
  {
    key: "multiDept",
    label: "Multi-Dept",
    icon: Building2,
    color: "indigo",
    textColor: "text-indigo-600",
  },
];

// ── Main Page ──────────────────────────────────────────────────────────────────

const Doctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [commFilter, setCommFilter] = useState("all");
  const [popup, setPopup] = useState(null);
  const [formModal, setFormModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const debounceRef = useRef(null);

  const deptLabelMap = Object.fromEntries(departments.map((d) => [d.value, d.label]));
  const desigLabelMap = Object.fromEntries(designations.map((d) => [d.value, d.label]));

  useEffect(() => {
    Promise.all([departmentService.getAll(), departmentService.getDesignations()])
      .then(([deptRes, desigRes]) => {
        setDepartments(deptRes.data.departments ?? []);
        setDesignations(desigRes.data.designations ?? []);
      })
      .catch(() => setPopup({ type: "error", message: "Failed to load departments." }));
  }, []);

  const fetchDoctors = async ({ search: s = "", department: d = "", page = 1 } = {}) => {
    try {
      setLoading(true);
      const res = await doctorService.getAll({ search: s, department: d, page });
      const { doctors: data, total, totalPages, page: currentPage } = res.data;
      setDoctors(data);
      setPagination({ page: currentPage, totalPages, total });
    } catch {
      setPopup({ type: "error", message: "Failed to load doctors. Please try again." });
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(
      () =>
        fetchDoctors({
          search,
          department: deptFilter !== "all" ? deptFilter : "",
          page: 1,
        }),
      400,
    );
    return () => clearTimeout(debounceRef.current);
  }, [search, deptFilter]);

  const handlePage = (page) =>
    fetchDoctors({
      search,
      department: deptFilter !== "all" ? deptFilter : "",
      page,
    });

  const handleSaved = (isEdit) => {
    setFormModal(null);
    fetchDoctors({
      search,
      department: deptFilter !== "all" ? deptFilter : "",
      page: pagination.page,
    });
    setPopup({
      type: "success",
      message: isEdit ? "Doctor updated successfully." : "Doctor registered successfully.",
    });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await doctorService.delete(deleteTarget._id);
      setDeleteTarget(null);
      const page = doctors.length === 1 && pagination.page > 1 ? pagination.page - 1 : pagination.page;
      fetchDoctors({ search, department: deptFilter !== "all" ? deptFilter : "", page });
      setPopup({ type: "success", message: "Doctor deleted successfully." });
    } catch {
      setPopup({ type: "error", message: "Failed to delete doctor. Please try again." });
    } finally {
      setDeleting(false);
    }
  };

  // Client-side commission filter only (dept filter is server-side)
  const visibleDoctors = useMemo(
    () => (commFilter !== "all" ? doctors.filter((d) => d.commissionType === commFilter) : doctors),
    [doctors, commFilter],
  );

  const stats = useMemo(
    () => ({
      total: pagination.total,
      percentage: doctors.filter((d) => d.commissionType === "percentage").length,
      fixed: doctors.filter((d) => d.commissionType === "fixed").length,
      multiDept: doctors.filter((d) => (d.departments?.length ?? 0) > 1).length,
    }),
    [doctors, pagination.total],
  );

  const hasFilters = deptFilter !== "all" || commFilter !== "all";

  return (
    <section className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 px-4 py-6">
      {popup && <Popup type={popup.type} message={popup.message} onClose={() => setPopup(null)} />}

      {formModal !== null && (
        <DoctorFormModal
          initial={formModal._id ? formModal : null}
          onClose={() => setFormModal(null)}
          onSaved={handleSaved}
          departments={departments}
          designations={designations}
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

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-2 sm:mb-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Stethoscope className="w-7 h-7 sm:w-8 sm:h-8 text-blue-600" />
              Doctor Management
            </h1>
            <p className="text-sm text-gray-600 mt-1 hidden sm:flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-blue-500" /> Manage doctors &amp; commissions
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/lab-management"
              className="px-2 md:px-4 py-2.5 rounded-xl border border-gray-200 bg-white/50 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center gap-2 text-sm font-medium shadow-sm hover:shadow"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </Link>
            <button
              onClick={() => setFormModal({})}
              className="hidden sm:flex bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-2.5 px-5 rounded-xl shadow-lg hover:shadow-xl transition-all items-center gap-2 text-sm"
            >
              <UserPlus className="w-5 h-5" /> Register Doctor
            </button>
          </div>
        </div>

        {/* Mobile register button */}
        <div className="flex flex-col gap-3 sm:hidden mb-6">
          <p className="text-sm text-gray-600 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-blue-500" /> Manage doctors &amp; commissions
          </p>
          <button
            onClick={() => setFormModal({})}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-2.5 px-5 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 text-sm"
          >
            <UserPlus className="w-5 h-5" /> Register Doctor
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {STATS_CONFIG.map(({ key, label, icon: Icon, color, textColor }) => (
            <div
              key={key}
              className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-2">
                <div className={`p-2 bg-${color}-50 rounded-lg`}>
                  <Icon className={`w-6 h-6 text-${color}-600`} />
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-medium">{label}</p>
                  {initialLoading ? (
                    <div className="h-8 w-10 bg-gray-200 rounded animate-pulse" />
                  ) : (
                    <p className={`text-2xl font-bold ${textColor}`}>{stats[key]}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-semibold text-gray-700">Filters:</span>
            </div>

            {/* Department filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500">Department</span>
              <div className="flex rounded-lg bg-gray-100 p-1 gap-0.5">
                <button
                  onClick={() => setDeptFilter("all")}
                  disabled={initialLoading}
                  className={cls(
                    "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                    deptFilter === "all" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                  )}
                >
                  All
                </button>
                {departments.slice(0, 5).map((d) => (
                  <button
                    key={d.value}
                    onClick={() => setDeptFilter(d.value)}
                    disabled={initialLoading}
                    className={cls(
                      "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                      deptFilter === d.value ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                    )}
                  >
                    {d.label}
                  </button>
                ))}
                {departments.length > 5 && (
                  <select
                    value={departments.slice(5).some((d) => d.value === deptFilter) ? deptFilter : ""}
                    onChange={(e) => e.target.value && setDeptFilter(e.target.value)}
                    disabled={initialLoading}
                    className="px-2 py-1.5 text-xs font-medium rounded-md bg-transparent text-gray-600 focus:outline-none cursor-pointer disabled:opacity-50"
                  >
                    <option value="">More…</option>
                    {departments.slice(5).map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Commission filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500">Commission</span>
              <div className="flex rounded-lg bg-gray-100 p-1">
                {[
                  { value: "all", label: "Any" },
                  { value: "percentage", label: "%" },
                  { value: "fixed", label: "Fixed" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setCommFilter(opt.value)}
                    disabled={initialLoading}
                    className={cls(
                      "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                      commFilter === opt.value
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-gray-600 hover:text-gray-900",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {hasFilters && (
              <button
                onClick={() => {
                  setDeptFilter("all");
                  setCommFilter("all");
                }}
                disabled={initialLoading}
                className="ml-auto text-xs text-gray-500 hover:text-blue-600 flex items-center gap-1.5 font-medium px-3 py-1.5 hover:bg-blue-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, degree, or contact…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              disabled={initialLoading}
              className="w-full pl-11 pr-11 py-2.5 text-sm border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder-gray-400 disabled:bg-gray-50 disabled:cursor-not-allowed"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                disabled={initialLoading}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-1 transition-colors disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* List */}
        {initialLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : visibleDoctors.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Stethoscope className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {hasFilters || search ? "No doctors found" : "No doctors yet"}
            </h3>
            <p className="text-gray-500 text-sm mb-4 max-w-md mx-auto">
              {hasFilters || search
                ? "Try adjusting your filters or search criteria"
                : "Register your first doctor to begin tracking commissions"}
            </p>
            {!hasFilters && !search && (
              <button
                onClick={() => setFormModal({})}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-5 rounded-lg shadow-sm hover:shadow transition-all"
              >
                <UserPlus className="w-4 h-4" /> Register First Doctor
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Result count */}
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-500">
                <span className="font-bold text-gray-700">{visibleDoctors.length}</span>
                {pagination.total !== visibleDoctors.length && (
                  <>
                    {" "}
                    of <span className="font-bold text-gray-700">{pagination.total}</span>
                  </>
                )}{" "}
                doctor{visibleDoctors.length !== 1 ? "s" : ""}
              </p>
              {pagination.totalPages > 1 && (
                <p className="text-xs text-gray-400">
                  Page {pagination.page} of {pagination.totalPages}
                </p>
              )}
            </div>
            <div className="space-y-3">
              {visibleDoctors.map((doctor) => (
                <DoctorCard
                  key={doctor._id}
                  doctor={doctor}
                  deptLabelMap={deptLabelMap}
                  desigLabelMap={desigLabelMap}
                  onEdit={() => setFormModal(doctor)}
                  onDelete={() => setDeleteTarget(doctor)}
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

export default Doctors;
