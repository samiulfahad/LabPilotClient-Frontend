/**
 * ManageDepartments.jsx
 * Hospital Department Selection — multi-select from canonical whitelist.
 * Each hospital configures which departments it operates; the selection
 * is then available across the system (doctors, spaces, invoices, etc.)
 */

import { useState, useEffect, useCallback } from "react";
import {
  Stethoscope,
  CheckSquare,
  Square,
  Save,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  X,
  Search,
  LayoutGrid,
  RefreshCw,
} from "lucide-react";

import departmentService from "../../../api/department";

// ─── Canonical department list (mirrors backend ALLOWED_DEPARTMENTS) ──────────
// Keep in sync with departmentRoutes.js ALLOWED_DEPARTMENTS
const ALL_DEPARTMENTS = [
  { value: "general", label: "General Medicine", group: "Core" },
  { value: "emergency", label: "Emergency Medicine", group: "Core" },
  { value: "icu", label: "ICU / Critical Care", group: "Core" },
  { value: "surgery", label: "General Surgery", group: "Core" },
  { value: "cardiology", label: "Cardiology", group: "Specialties" },
  { value: "neurology", label: "Neurology", group: "Specialties" },
  { value: "psychiatry", label: "Psychiatry", group: "Specialties" },
  { value: "orthopedics", label: "Orthopedics", group: "Specialties" },
  { value: "gynecology", label: "Gynecology & Obstetrics", group: "Specialties" },
  { value: "pediatrics", label: "Pediatrics", group: "Specialties" },
  { value: "oncology", label: "Oncology", group: "Specialties" },
  { value: "urology", label: "Urology", group: "Specialties" },
  { value: "nephrology", label: "Nephrology", group: "Specialties" },
  { value: "gastroenterology", label: "Gastroenterology", group: "Specialties" },
  { value: "pulmonology", label: "Pulmonology", group: "Specialties" },
  { value: "endocrinology", label: "Endocrinology", group: "Specialties" },
  { value: "rheumatology", label: "Rheumatology", group: "Specialties" },
  { value: "hematology", label: "Hematology", group: "Specialties" },
  { value: "dermatology", label: "Dermatology", group: "Allied" },
  { value: "ophthalmology", label: "Ophthalmology", group: "Allied" },
  { value: "ent", label: "ENT (Ear, Nose & Throat)", group: "Allied" },
  { value: "radiology", label: "Radiology & Imaging", group: "Allied" },
  { value: "pathology", label: "Pathology & Lab", group: "Allied" },
  { value: "anesthesiology", label: "Anesthesiology", group: "Allied" },
  { value: "physiotherapy", label: "Physiotherapy & Rehab", group: "Allied" },
  { value: "dentistry", label: "Dentistry", group: "Allied" },
  { value: "nutrition", label: "Nutrition & Dietetics", group: "Allied" },
  { value: "other", label: "Other", group: "Allied" },
];

const GROUPS = ["Core", "Specialties", "Allied"];

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

// ─── Department Chip (selected) ───────────────────────────────────────────────
const DeptChip = ({ label, onRemove }) => (
  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
    {label}
    <button
      onClick={onRemove}
      className="w-3.5 h-3.5 flex items-center justify-center rounded-full hover:bg-indigo-200 transition-colors"
      aria-label={`Remove ${label}`}
    >
      <X className="w-2.5 h-2.5" />
    </button>
  </span>
);

// ─── Department Row ───────────────────────────────────────────────────────────
const DeptRow = ({ dept, selected, onToggle }) => {
  const checked = selected.includes(dept.value);
  return (
    <button
      onClick={() => onToggle(dept.value)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-150 text-left group ${
        checked
          ? "bg-indigo-50/70 border-indigo-200 shadow-sm"
          : "bg-white border-gray-200 hover:border-indigo-200 hover:bg-indigo-50/30"
      }`}
    >
      {checked ? (
        <CheckSquare className="w-4 h-4 text-indigo-600 shrink-0" />
      ) : (
        <Square className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 shrink-0 transition-colors" />
      )}
      <span className={`text-sm font-medium flex-1 ${checked ? "text-indigo-700" : "text-gray-700"}`}>
        {dept.label}
      </span>
    </button>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const ManageDepartments = () => {
  const [selected, setSelected] = useState([]);
  const [draft, setDraft] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [activeGroup, setActiveGroup] = useState("All");
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = "success") => setToast({ message, type }), []);

  useEffect(() => {
    departmentService
      .getActive()
      .then((r) => {
        setSelected(r.data.departments);
        setDraft(r.data.departments);
      })
      .catch(() => showToast("Failed to load departments", "error"))
      .finally(() => setLoading(false));
  }, []);

  const toggle = (value) => {
    setDraft((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  };

  const removeFromDraft = (value) => {
    setDraft((prev) => prev.filter((v) => v !== value));
  };

  const selectAll = (depts) => {
    const values = depts.map((d) => d.value);
    setDraft((prev) => [...new Set([...prev, ...values])]);
  };

  const deselectAll = (depts) => {
    const values = new Set(depts.map((d) => d.value));
    setDraft((prev) => prev.filter((v) => !values.has(v)));
  };

  const handleSave = async () => {
    if (draft.length === 0) {
      showToast("Select at least one department", "error");
      return;
    }
    setSaving(true);
    try {
      await departmentService.set(draft);
      setSelected(draft);
      showToast("Departments saved successfully");
    } catch (err) {
      showToast(err?.response?.data?.error ?? "Failed to save departments", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => setDraft(selected);

  const isDirty = JSON.stringify([...draft].sort()) !== JSON.stringify([...selected].sort());

  const filteredAll = ALL_DEPARTMENTS.filter((d) => {
    const matchesSearch = d.label.toLowerCase().includes(search.toLowerCase());
    const matchesGroup = activeGroup === "All" || d.group === activeGroup;
    return matchesSearch && matchesGroup;
  });

  const grouped = GROUPS.reduce((acc, g) => {
    const items = filteredAll.filter((d) => d.group === g);
    if (items.length) acc[g] = items;
    return acc;
  }, {});

  const selectedWithLabels = draft.map((v) => ALL_DEPARTMENTS.find((d) => d.value === v)).filter(Boolean);

  return (
    <section className="min-h-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 px-4 py-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="max-w-3xl mx-auto">
        {/* ── Header ──────────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
              <Stethoscope className="w-6 h-6 text-indigo-600 shrink-0" />
              Departments
            </h1>
            <p className="text-sm text-gray-500 mt-1">Select the departments your hospital operates</p>
          </div>

          <div className="flex items-center gap-2">
            {isDirty && (
              <button
                onClick={handleDiscard}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className="w-4 h-4" /> Discard
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={saving || !isDirty}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-200/60 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving…
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Save
                </>
              )}
            </button>
          </div>
        </div>

        {/* ── Stats bar ───────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            {
              label: "Total Available",
              value: ALL_DEPARTMENTS.length,
              color: "text-gray-900",
              bg: "bg-white",
            },
            {
              label: "Selected",
              value: draft.length,
              color: "text-indigo-700",
              bg: "bg-indigo-50",
            },
            {
              label: "Unsaved Changes",
              value: isDirty ? "Yes" : "No",
              color: isDirty ? "text-amber-600" : "text-green-600",
              bg: isDirty ? "bg-amber-50" : "bg-green-50",
            },
          ].map((s) => (
            <div key={s.label} className={`${s.bg} rounded-2xl border border-gray-100 px-4 py-3 shadow-sm`}>
              <p className="text-xs text-gray-400 font-medium">{s.label}</p>
              <p className={`text-2xl font-black mt-0.5 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* ── Selected chips ───────────────────────────────────────────────────── */}
        {selectedWithLabels.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-sm mb-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Active Departments</p>
            <div className="flex flex-wrap gap-2">
              {selectedWithLabels.map((d) => (
                <DeptChip key={d.value} label={d.label} onRemove={() => removeFromDraft(d.value)} />
              ))}
            </div>
          </div>
        )}

        {/* ── Search + Group Filter ────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search departments…"
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all bg-white"
            />
          </div>
          <div className="flex gap-2">
            {["All", ...GROUPS].map((g) => (
              <button
                key={g}
                onClick={() => setActiveGroup(g)}
                className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-colors ${
                  activeGroup === g
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                    : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* ── Department list ──────────────────────────────────────────────────── */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
          </div>
        ) : filteredAll.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-2xl py-14 text-center shadow-sm">
            <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
              <LayoutGrid className="w-5 h-5 text-gray-300" />
            </div>
            <p className="text-sm font-bold text-gray-400">No departments match</p>
            <p className="text-xs text-gray-300 mt-1">Try adjusting the search or filter</p>
          </div>
        ) : (
          <div className="space-y-5">
            {Object.entries(grouped).map(([group, depts]) => {
              const allGroupSelected = depts.every((d) => draft.includes(d.value));
              const someGroupSelected = depts.some((d) => draft.includes(d.value));
              return (
                <div key={group}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">{group}</p>
                    <button
                      onClick={() => (allGroupSelected ? deselectAll(depts) : selectAll(depts))}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      {allGroupSelected ? "Deselect all" : someGroupSelected ? "Select remaining" : "Select all"}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {depts.map((dept) => (
                      <DeptRow key={dept.value} dept={dept} selected={draft} onToggle={toggle} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Sticky save bar ──────────────────────────────────────────────────── */}
        {isDirty && (
          <div className="sticky bottom-4 mt-6">
            <div className="bg-white/90 backdrop-blur-md border border-indigo-100 rounded-2xl shadow-xl shadow-indigo-100/60 px-5 py-3.5 flex items-center justify-between gap-4">
              <p className="text-sm text-gray-600">
                <span className="font-bold text-indigo-700">{draft.length}</span> department
                {draft.length !== 1 ? "s" : ""} selected — unsaved changes
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleDiscard}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Discard
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-200/60 transition-all active:scale-95 disabled:opacity-60"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default ManageDepartments;
