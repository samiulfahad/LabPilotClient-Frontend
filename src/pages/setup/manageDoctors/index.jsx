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
  Layers,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Check,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import { Link } from "react-router-dom";
import doctorService from "../../../api/doctor";
import departmentService from "../../../api/department";
import Popup from "../../../components/popup";

// ── Palette ────────────────────────────────────────────────────────────────────

const C = {
  ink:     "#1C1F1E",
  muted:   "#A8ACA3",
  sub:     "#6F756F",
  border:  "#E3E0D6",
  dashed:  "#D8D5CB",
  paper:   "#FAF9F5",
  hover:   "#F0EFE9",
  divider: "#EDEBE3",
  teal:    "#0F6E5C",
  blue:    "#1E4FA0",
  red:     "#C0312B",
  amber:   "#92400E",
  purple:  "#7C3AED",
};

// ── Helpers ────────────────────────────────────────────────────────────────────

const fmt = (n, type) =>
  type === "percentage"
    ? `${n}%`
    : `৳${typeof n === "number" ? n.toLocaleString("en-IN") : n}`;

const EMPTY_FORM = {
  name: "", degree: "", contactNumber: "", designation: "",
  departments: [], commissionType: "percentage", commissionValue: "",
};

// ── Shared input style ─────────────────────────────────────────────────────────

const inputStyle = {
  border: `1px solid ${C.dashed}`,
  borderRadius: "2px",
  background: C.paper,
  color: C.ink,
  fontFamily: "'IBM Plex Mono', monospace",
};

const focusInput = (e) => {
  e.target.style.borderColor = C.blue;
  e.target.style.boxShadow = `0 0 0 1px ${C.blue}`;
  e.target.style.background = "white";
};
const blurInput = (e) => {
  e.target.style.borderColor = C.dashed;
  e.target.style.boxShadow = "";
  e.target.style.background = C.paper;
};

// ── Modal Shell ────────────────────────────────────────────────────────────────

const Modal = ({ onClose, children }) => {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <div className="fixed inset-0" style={{ zIndex: 9999 }}>
      <div
        className="absolute inset-0"
        style={{ background: "rgba(28,31,30,0.5)", backdropFilter: "blur(3px)" }}
        onClick={onClose}
      />
      <div className="absolute inset-0 flex items-start justify-center px-4 pt-12 pb-6 overflow-y-auto">
        <div className="relative w-full" style={{ maxWidth: "520px" }}>
          {children}
        </div>
      </div>
    </div>
  );
};

// ── Form Field ─────────────────────────────────────────────────────────────────

const FormField = ({ label, required, children }) => (
  <div>
    <label
      className="block mb-1.5"
      style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.05em", color: C.sub }}
    >
      {label}{required && <span style={{ color: C.red, marginLeft: "2px" }}>*</span>}
    </label>
    {children}
  </div>
);

// ── Multi-Department Select ────────────────────────────────────────────────────

const DepartmentMultiSelect = ({ departments, selected, onChange }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const toggle = (v) => onChange(selected.includes(v) ? selected.filter((s) => s !== v) : [...selected, v]);
  const filtered = departments.filter((d) => d.label.toLowerCase().includes(search.toLowerCase()));
  const selectedDepts = departments.filter((d) => selected.includes(d.value));

  return (
    <div ref={ref} className="relative">
      <div
        onClick={() => setOpen((o) => !o)}
        className="min-h-[38px] w-full px-2.5 py-1.5 cursor-pointer flex flex-wrap items-center gap-1.5 transition-all"
        style={{
          ...inputStyle,
          borderColor: open ? C.blue : C.dashed,
          boxShadow: open ? `0 0 0 1px ${C.blue}` : undefined,
          background: open ? "white" : C.paper,
        }}
      >
        {selected.length === 0 ? (
          <span style={{ fontSize: "12px", color: C.muted }}>বিভাগ নির্বাচন করুন</span>
        ) : (
          selectedDepts.map((d) => (
            <span
              key={d.value}
              className="inline-flex items-center gap-1 px-2 py-0.5"
              style={{ background: `${C.blue}0D`, border: `1px solid ${C.blue}33`, borderRadius: "2px", color: C.blue, fontSize: "10px", fontFamily: "'IBM Plex Mono', monospace" }}
            >
              {d.label}
              <button type="button" onClick={(e) => { e.stopPropagation(); onChange(selected.filter((v) => v !== d.value)); }}>
                <X style={{ width: "8px", height: "8px" }} />
              </button>
            </span>
          ))
        )}
        <ChevronDown style={{ width: "14px", height: "14px", color: C.muted, marginLeft: "auto", flexShrink: 0, transition: "transform 0.15s", transform: open ? "rotate(180deg)" : undefined }} />
      </div>

      {open && (
        <div
          className="absolute z-50 mt-1 w-full bg-white overflow-hidden"
          style={{ border: `1px solid ${C.dashed}`, borderRadius: "2px", boxShadow: "0 4px 16px rgba(28,31,30,0.1)" }}
        >
          <div className="p-2" style={{ borderBottom: `1px solid ${C.border}` }}>
            <div className="relative">
              <Search style={{ width: "11px", height: "11px", color: C.muted, position: "absolute", left: "8px", top: "50%", transform: "translateY(-50%)" }} />
              <input
                autoFocus value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="অনুসন্ধান…"
                className="w-full outline-none"
                style={{ ...inputStyle, paddingLeft: "24px", paddingRight: "8px", paddingTop: "6px", paddingBottom: "6px", fontSize: "11px", background: "white", borderColor: C.border }}
              />
            </div>
          </div>
          <div style={{ maxHeight: "200px", overflowY: "auto" }}>
            {filtered.length === 0 ? (
              <p style={{ textAlign: "center", padding: "16px", fontSize: "11px", color: C.muted, fontFamily: "'IBM Plex Mono', monospace" }}>কোনো ফলাফল নেই</p>
            ) : filtered.map((d) => {
              const checked = selected.includes(d.value);
              return (
                <button
                  key={d.value} type="button" onClick={() => toggle(d.value)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left transition-colors"
                  style={{ background: checked ? `${C.blue}08` : undefined, fontSize: "12px", fontFamily: "'IBM Plex Mono', monospace", color: checked ? C.blue : C.ink }}
                  onMouseEnter={(e) => { if (!checked) e.currentTarget.style.background = C.divider; }}
                  onMouseLeave={(e) => { if (!checked) e.currentTarget.style.background = ""; }}
                >
                  <span
                    className="flex items-center justify-center shrink-0"
                    style={{ width: "14px", height: "14px", border: `1px solid ${checked ? C.blue : C.dashed}`, borderRadius: "2px", background: checked ? C.blue : undefined }}
                  >
                    {checked && <Check style={{ width: "8px", height: "8px", color: "white" }} />}
                  </span>
                  {d.label}
                </button>
              );
            })}
          </div>
          {selected.length > 0 && (
            <div className="flex justify-between items-center px-3 py-2" style={{ borderTop: `1px solid ${C.border}` }}>
              <span style={{ fontSize: "10px", color: C.muted, fontFamily: "'IBM Plex Mono', monospace" }}>{selected.length}টি নির্বাচিত</span>
              <button onClick={() => onChange([])} style={{ fontSize: "10px", color: C.red, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, textTransform: "uppercase" }}>
                সব বাদ
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Delete Modal ───────────────────────────────────────────────────────────────

const DeleteModal = ({ doctor, onConfirm, onCancel, loading }) => (
  <Modal onClose={onCancel}>
    <div className="bg-white" style={{ border: `1px solid ${C.border}`, borderRadius: "3px", boxShadow: "0 8px 32px rgba(28,31,30,0.15)" }}>
      <div className="px-6 py-5 flex items-center gap-3" style={{ borderBottom: `1px solid ${C.border}`, background: C.paper }}>
        <div className="flex items-center justify-center shrink-0" style={{ width: "32px", height: "32px", border: `1px solid ${C.red}33`, borderRadius: "2px", background: `${C.red}08` }}>
          <Trash2 style={{ width: "14px", height: "14px", color: C.red }} />
        </div>
        <div>
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", color: C.red }}>বিপজ্জনক অপারেশন</p>
          <p style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: "14px", fontWeight: 700, color: C.ink, marginTop: "1px" }}>ডাক্তার মুছে ফেলবেন?</p>
        </div>
      </div>
      <div className="px-6 py-5">
        <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "12px", lineHeight: "1.6", color: C.sub }}>
          <span style={{ fontWeight: 700, color: C.ink }}>{doctor.name}</span> এবং তার সমস্ত তথ্য স্থায়ীভাবে মুছে যাবে।
        </p>
      </div>
      <div className="px-6 pb-5 flex gap-2" style={{ borderTop: `1px solid ${C.border}`, paddingTop: "16px" }}>
        <button onClick={onCancel} disabled={loading} className="flex-1 py-2.5 transition-colors"
          style={{ border: `1px solid ${C.dashed}`, borderRadius: "2px", color: C.sub, fontFamily: "'IBM Plex Mono', monospace", fontSize: "11px", textTransform: "uppercase" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = C.divider; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = ""; }}
        >রাখুন</button>
        <button onClick={onConfirm} disabled={loading} className="flex-1 py-2.5 flex items-center justify-center gap-1.5 transition-colors"
          style={{ border: `1px solid ${C.red}`, borderRadius: "2px", color: C.red, fontFamily: "'IBM Plex Mono', monospace", fontSize: "11px", textTransform: "uppercase" }}
          onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.background = C.red; e.currentTarget.style.color = "white"; } }}
          onMouseLeave={(e) => { e.currentTarget.style.background = ""; e.currentTarget.style.color = C.red; }}
        >
          {loading
            ? <span className="animate-spin" style={{ width: "13px", height: "13px", border: `2px solid ${C.red}30`, borderTopColor: C.red, borderRadius: "50%", display: "inline-block" }} />
            : <Trash2 style={{ width: "12px", height: "12px" }} />}
          হ্যাঁ, মুছুন
        </button>
      </div>
    </div>
  </Modal>
);

// ── Doctor Form Modal ──────────────────────────────────────────────────────────

const DoctorFormModal = ({ initial, onClose, onSaved, departments, designations }) => {
  const isEdit = !!initial?._id;
  const [form, setForm] = useState(() =>
    initial ? {
      name: initial.name ?? "", degree: initial.degree ?? "",
      contactNumber: initial.contactNumber ?? "", designation: initial.designation ?? "",
      departments: initial.departments ?? (initial.department ? [initial.department] : []),
      commissionType: initial.commissionType ?? "percentage",
      commissionValue: initial.commissionValue ?? "",
    } : EMPTY_FORM,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (name, value) => setForm((f) => ({ ...f, [name]: value }));
  const handle = (e) => set(e.target.name, e.target.value);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.departments.length) return setError("অন্তত একটি বিভাগ নির্বাচন করুন।");
    const val = Number(form.commissionValue);
    if (isNaN(val) || val < 0) return setError("কমিশন মান অবশ্যই ধনাত্মক সংখ্যা হতে হবে।");
    if (form.commissionType === "percentage" && val > 100) return setError("শতাংশ ০–১০০ এর মধ্যে হতে হবে।");
    try {
      setSaving(true);
      const payload = { ...form, commissionValue: val };
      isEdit ? await doctorService.update(initial._id, payload) : await doctorService.create(payload);
      onSaved(isEdit);
    } catch (err) {
      setError(err?.response?.data?.error ?? "সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally { setSaving(false); }
  };

  const accentColor = isEdit ? C.purple : C.teal;

  return (
    <Modal onClose={onClose}>
      <div className="bg-white flex flex-col" style={{ height: "min(660px, calc(100svh - 48px))", border: `1px solid ${C.border}`, borderRadius: "3px", boxShadow: "0 8px 32px rgba(28,31,30,0.15)" }}>
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${C.border}`, background: C.paper }}>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center shrink-0" style={{ width: "32px", height: "32px", border: `1px solid ${accentColor}33`, borderRadius: "2px", background: `${accentColor}08` }}>
              {isEdit ? <Pencil style={{ width: "14px", height: "14px", color: accentColor }} /> : <UserPlus style={{ width: "14px", height: "14px", color: accentColor }} />}
            </div>
            <div>
              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", color: accentColor }}>
                {isEdit ? "তথ্য সম্পাদনা" : "নতুন নিবন্ধন"}
              </p>
              <p style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: "14px", fontWeight: 700, color: C.ink, marginTop: "1px" }}>
                {isEdit ? "ডাক্তার সম্পাদনা" : "ডাক্তার নিবন্ধন"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="flex items-center justify-center transition-colors"
            style={{ width: "28px", height: "28px", borderRadius: "2px", color: C.muted }}
            onMouseEnter={(e) => { e.currentTarget.style.background = C.divider; e.currentTarget.style.color = C.ink; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = ""; e.currentTarget.style.color = C.muted; }}
          ><X style={{ width: "15px", height: "15px" }} /></button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <FormField label="পূর্ণ নাম" required>
            <input name="name" value={form.name} onChange={handle} required placeholder="ডা. আমিনুর রহমান"
              className="w-full px-3 py-2.5 text-sm outline-none transition-all"
              style={inputStyle} onFocus={focusInput} onBlur={blurInput} />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="ডিগ্রি">
              <input name="degree" value={form.degree} onChange={handle} placeholder="MBBS, MD…"
                className="w-full px-3 py-2.5 text-sm outline-none transition-all"
                style={inputStyle} onFocus={focusInput} onBlur={blurInput} />
            </FormField>
            <FormField label="যোগাযোগ নম্বর" required>
              <input name="contactNumber" value={form.contactNumber} onChange={handle} required placeholder="01XXXXXXXXX"
                className="w-full px-3 py-2.5 text-sm outline-none transition-all"
                style={inputStyle} onFocus={focusInput} onBlur={blurInput} />
            </FormField>
          </div>

          <FormField label="পদবি">
            <div className="relative">
              <select name="designation" value={form.designation} onChange={handle}
                className="w-full px-3 py-2.5 text-sm appearance-none outline-none transition-all"
                style={{ ...inputStyle, color: form.designation ? C.ink : C.muted }}
                onFocus={focusInput} onBlur={blurInput}
              >
                <option value="">পদবি নির্বাচন করুন</option>
                {designations.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <ChevronDown style={{ width: "13px", height: "13px", color: C.muted, position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            </div>
          </FormField>

          <FormField label="বিভাগ" required>
            {departments.length === 0 ? (
              <div className="flex items-center gap-2 px-3 py-2.5" style={{ border: `1px solid #FCD34D4D`, borderRadius: "2px", background: "#FFFBEB" }}>
                <AlertTriangle style={{ width: "13px", height: "13px", color: C.amber, flexShrink: 0 }} />
                <span style={{ fontSize: "11px", fontFamily: "'IBM Plex Mono', monospace", color: C.amber }}>কোনো বিভাগ পাওয়া যায়নি।</span>
              </div>
            ) : (
              <DepartmentMultiSelect departments={departments} selected={form.departments} onChange={(v) => set("departments", v)} />
            )}
          </FormField>

          {/* Commission */}
          <div style={{ border: `1px solid ${C.border}`, borderRadius: "2px", overflow: "hidden" }}>
            <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: C.paper, borderBottom: `1px solid ${C.border}` }}>
              <BadgePercent style={{ width: "12px", height: "12px", color: C.muted }} />
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", color: C.muted, fontWeight: 700 }}>কমিশন</span>
            </div>
            <div className="p-4 space-y-3 bg-white">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { type: "percentage", label: "শতাংশ (%)", Icon: BadgePercent, color: C.amber },
                  { type: "fixed",      label: "নির্দিষ্ট (৳)",  Icon: Banknote,    color: C.teal  },
                ].map(({ type, label, Icon, color }) => {
                  const active = form.commissionType === type;
                  return (
                    <button key={type} type="button"
                      onClick={() => { set("commissionType", type); set("commissionValue", ""); }}
                      className="flex items-center gap-2 px-3 py-2.5 transition-all"
                      style={{ border: `1px solid ${active ? color + "55" : C.dashed}`, borderRadius: "2px", background: active ? `${color}0A` : "white", color: active ? color : C.muted, fontFamily: "'IBM Plex Mono', monospace", fontSize: "11px" }}
                    >
                      <Icon style={{ width: "13px", height: "13px", flexShrink: 0 }} />
                      {label}
                    </button>
                  );
                })}
              </div>
              <div className="relative">
                <input name="commissionValue" type="number" min="0" step="0.01"
                  max={form.commissionType === "percentage" ? 100 : undefined}
                  value={form.commissionValue} onChange={handle} required
                  placeholder={form.commissionType === "percentage" ? "০ – ১০০" : "পরিমাণ লিখুন"}
                  className="w-full outline-none transition-all"
                  style={{ ...inputStyle, padding: form.commissionType === "percentage" ? "10px 32px 10px 12px" : "10px 12px 10px 28px", fontSize: "13px" }}
                  onFocus={focusInput} onBlur={blurInput}
                />
                {form.commissionType === "percentage"
                  ? <span style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", fontFamily: "'IBM Plex Mono', monospace", fontSize: "13px", fontWeight: 700, color: C.amber }}>%</span>
                  : <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", fontFamily: "'IBM Plex Mono', monospace", fontSize: "13px", fontWeight: 700, color: C.teal }}>৳</span>
                }
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 px-4 py-3" style={{ background: `${C.red}08`, border: `1px solid ${C.red}33`, borderRadius: "2px" }}>
              <AlertTriangle style={{ width: "13px", height: "13px", color: C.red, flexShrink: 0, marginTop: "1px" }} />
              <span style={{ fontSize: "11px", fontFamily: "'IBM Plex Mono', monospace", color: C.red }}>{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 px-6 py-4 flex gap-2" style={{ borderTop: `1px solid ${C.border}` }}>
          <button type="button" onClick={onClose} disabled={saving} className="flex-1 py-2.5 transition-colors"
            style={{ border: `1px solid ${C.dashed}`, borderRadius: "2px", color: C.sub, fontFamily: "'IBM Plex Mono', monospace", fontSize: "11px", textTransform: "uppercase" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = C.divider; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = ""; }}
          >বাতিল</button>
          <button onClick={handleSubmit} disabled={saving || !departments.length}
            className="flex-1 py-2.5 flex items-center justify-center gap-1.5 transition-colors"
            style={{ border: `1px solid ${accentColor}`, borderRadius: "2px", color: accentColor, fontFamily: "'IBM Plex Mono', monospace", fontSize: "11px", textTransform: "uppercase", opacity: (saving || !departments.length) ? 0.4 : 1, cursor: (saving || !departments.length) ? "not-allowed" : "pointer" }}
            onMouseEnter={(e) => { if (!saving && departments.length) { e.currentTarget.style.background = accentColor; e.currentTarget.style.color = "white"; } }}
            onMouseLeave={(e) => { e.currentTarget.style.background = ""; e.currentTarget.style.color = accentColor; }}
          >
            {saving
              ? <span className="animate-spin" style={{ width: "13px", height: "13px", border: `2px solid ${accentColor}30`, borderTopColor: accentColor, borderRadius: "50%", display: "inline-block" }} />
              : isEdit ? <Pencil style={{ width: "12px", height: "12px" }} /> : <UserPlus style={{ width: "12px", height: "12px" }} />}
            {isEdit ? "পরিবর্তন সংরক্ষণ" : "নিবন্ধন করুন"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

// ── Action Chip ────────────────────────────────────────────────────────────────

const ActionChip = ({ onClick, icon: Icon, label, color }) => {
  const col = color ?? C.sub;
  return (
    <button onClick={onClick}
      className="inline-flex items-center gap-1 transition-colors"
      style={{ padding: "4px 10px", border: `1px solid ${col}33`, borderRadius: "2px", color: col, fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.05em" }}
      onMouseEnter={(e) => { e.currentTarget.style.background = `${col}0D`; e.currentTarget.style.borderColor = `${col}55`; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = ""; e.currentTarget.style.borderColor = `${col}33`; }}
    >
      <Icon style={{ width: "11px", height: "11px" }} />
      {label}
    </button>
  );
};

// ── Doctor Row ─────────────────────────────────────────────────────────────────

const DoctorRow = ({ doctor, index, deptLabelMap, desigLabelMap, onEdit, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const isPercent = doctor.commissionType === "percentage";

  return (
    <div style={{ borderBottom: `1px solid ${C.divider}` }}>
      <button onClick={() => setExpanded((v) => !v)} className="w-full text-left">
        <div
          className="flex items-center gap-3 py-2.5 px-1 transition-colors rounded-sm"
          onMouseEnter={(e) => { e.currentTarget.style.background = C.hover; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = ""; }}
        >
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "11px", color: C.muted, width: "20px", flexShrink: 0 }}>
            {String(index + 1).padStart(2, "0")}
          </span>
          <div className="flex-1 min-w-0 flex items-baseline gap-2">
            <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: "13px", fontWeight: 600, color: C.ink }}>{doctor.name}</span>
            {doctor.degree && (
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: C.muted }}>{doctor.degree}</span>
            )}
          </div>
          <span className="flex-1 hidden sm:block" style={{ borderBottom: `1px dotted ${C.dashed}`, transform: "translateY(-3px)" }} />
          <div className="flex items-center gap-3 shrink-0">
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "12px", fontWeight: 600, color: isPercent ? C.amber : C.teal }}>
              {fmt(doctor.commissionValue, doctor.commissionType)}
            </span>
            <ChevronDown style={{ width: "13px", height: "13px", color: C.muted, transition: "transform 0.15s", transform: expanded ? "rotate(180deg)" : undefined }} />
          </div>
        </div>
      </button>

      {expanded && (
        <div className="pl-8 pr-1 py-3" style={{ background: C.paper, borderTop: `1px solid ${C.border}` }}>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "11px", color: C.sub, lineHeight: "1.8" }} className="mb-3">
            {doctor.designation && <p>{desigLabelMap[doctor.designation] ?? doctor.designation}</p>}
            {doctor.contactNumber && (
              <p className="flex items-center gap-1.5">
                <Phone style={{ width: "11px", height: "11px" }} />
                {doctor.contactNumber}
              </p>
            )}
            {doctor.departments?.length > 0 && (
              <p className="flex items-center gap-1.5 flex-wrap">
                <Layers style={{ width: "11px", height: "11px", flexShrink: 0 }} />
                {doctor.departments.map((d) => deptLabelMap[d] ?? d).join(" · ")}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <ActionChip onClick={onEdit} icon={Pencil} label="সম্পাদনা" />
            <ActionChip onClick={onDelete} icon={Trash2} label="মুছুন" color={C.red} />
          </div>
        </div>
      )}
    </div>
  );
};

// ── Pagination ─────────────────────────────────────────────────────────────────

const Pagination = ({ page, totalPages, onPage }) => {
  if (totalPages <= 1) return null;
  const delta = 1;
  const start = Math.max(1, page - delta);
  const end   = Math.min(totalPages, page + delta);
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  const Btn = ({ onClick, disabled, active, children }) => (
    <button onClick={onClick} disabled={disabled}
      className="flex items-center justify-center transition-colors"
      style={{ width: "28px", height: "28px", border: `1px solid ${active ? C.ink : C.dashed}`, borderRadius: "2px", background: active ? C.ink : "white", color: active ? "white" : disabled ? C.muted : C.sub, fontFamily: "'IBM Plex Mono', monospace", fontSize: "11px", fontWeight: 700, opacity: disabled ? 0.35 : 1, cursor: disabled ? "not-allowed" : "pointer" }}
    >{children}</button>
  );

  return (
    <div className="flex items-center justify-center gap-1">
      <Btn onClick={() => onPage(page - 1)} disabled={page === 1}><ChevronLeft style={{ width: "13px", height: "13px" }} /></Btn>
      {start > 1 && (<><Btn onClick={() => onPage(1)}>1</Btn>{start > 2 && <span style={{ color: C.muted, fontSize: "10px", padding: "0 2px" }}>…</span>}</>)}
      {pages.map((p) => <Btn key={p} onClick={() => onPage(p)} active={p === page}>{p}</Btn>)}
      {end < totalPages && (<>{end < totalPages - 1 && <span style={{ color: C.muted, fontSize: "10px", padding: "0 2px" }}>…</span>}<Btn onClick={() => onPage(totalPages)}>{totalPages}</Btn></>)}
      <Btn onClick={() => onPage(page + 1)} disabled={page === totalPages}><ChevronRight style={{ width: "13px", height: "13px" }} /></Btn>
    </div>
  );
};

// ── Filter Dropdown ────────────────────────────────────────────────────────────

const FilterDropdown = ({ value, onChange, options, placeholder }) => (
  <div className="relative">
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="appearance-none outline-none cursor-pointer transition-all"
      style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "11px", color: value === "all" ? C.sub : C.ink, border: `1px solid ${value !== "all" ? C.ink + "55" : C.dashed}`, borderRadius: "2px", background: value !== "all" ? C.divider : "white", padding: "6px 26px 6px 10px" }}
    >
      <option value="all">{placeholder}</option>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
    <ChevronDown style={{ width: "11px", height: "11px", color: C.muted, position: "absolute", right: "7px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
  </div>
);

// ── Skeleton ───────────────────────────────────────────────────────────────────

const Skeleton = () => (
  <div className="bg-white animate-pulse" style={{ border: `1px solid ${C.border}`, borderRadius: "3px" }}>
    <div className="px-6 py-4 flex gap-4" style={{ borderBottom: `1px solid ${C.border}`, background: C.paper }}>
      {[120, 70, 90].map((w, i) => <div key={i} style={{ height: "11px", width: `${w}px`, background: "#E5E3DB", borderRadius: "2px" }} />)}
    </div>
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className="flex items-center gap-3 px-6 py-3" style={{ borderBottom: `1px solid ${C.divider}` }}>
        <div style={{ width: "20px", height: "10px", background: "#E5E3DB", borderRadius: "2px" }} />
        <div style={{ flex: 1, height: "12px", background: "#E5E3DB", borderRadius: "2px" }} />
        <div style={{ width: "55px", height: "12px", background: "#E5E3DB", borderRadius: "2px" }} />
      </div>
    ))}
  </div>
);

// ── Main Page ──────────────────────────────────────────────────────────────────

const COMM_OPTIONS = [
  { value: "percentage", label: "শতাংশ (%)  " },
  { value: "fixed",      label: "নির্দিষ্ট (৳)" },
];

const ManageDoctors = () => {
  const [doctors,        setDoctors]        = useState([]);
  const [departments,    setDepartments]    = useState([]);
  const [designations,   setDesignations]   = useState([]);
  const [pagination,     setPagination]     = useState({ page: 1, totalPages: 1, total: 0 });
  const [initialLoading, setInitialLoading] = useState(true);
  const [search,         setSearch]         = useState("");
  const [deptFilter,     setDeptFilter]     = useState("all");
  const [commFilter,     setCommFilter]     = useState("all");
  const [popup,          setPopup]          = useState(null);
  const [formModal,      setFormModal]      = useState(null);
  const [deleteTarget,   setDeleteTarget]   = useState(null);
  const [deleting,       setDeleting]       = useState(false);
  const debounceRef = useRef(null);

  const deptLabelMap  = Object.fromEntries(departments.map((d) => [d.value, d.label]));
  const desigLabelMap = Object.fromEntries(designations.map((d) => [d.value, d.label]));

  useEffect(() => {
    Promise.all([departmentService.getAll(), departmentService.getDesignations()])
      .then(([dR, dsR]) => {
        setDepartments(dR.data.departments ?? []);
        setDesignations(dsR.data.designations ?? []);
      })
      .catch(() => setPopup({ type: "error", message: "বিভাগ লোড করতে ব্যর্থ।" }));
  }, []);

  const fetchDoctors = async ({ search: s = "", department: d = "", page = 1 } = {}) => {
    try {
      const res = await doctorService.getAll({ search: s, department: d, page });
      const { doctors: data, total, totalPages, page: cur } = res.data;
      setDoctors(data);
      setPagination({ page: cur, totalPages, total });
    } catch {
      setPopup({ type: "error", message: "ডাক্তার লোড করতে ব্যর্থ।" });
    } finally { setInitialLoading(false); }
  };

  useEffect(() => { fetchDoctors(); }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(
      () => fetchDoctors({ search, department: deptFilter !== "all" ? deptFilter : "", page: 1 }),
      400,
    );
    return () => clearTimeout(debounceRef.current);
  }, [search, deptFilter]);

  const handlePage = (page) =>
    fetchDoctors({ search, department: deptFilter !== "all" ? deptFilter : "", page });

  const handleSaved = (isEdit) => {
    setFormModal(null);
    fetchDoctors({ search, department: deptFilter !== "all" ? deptFilter : "", page: pagination.page });
    setPopup({ type: "success", message: isEdit ? "ডাক্তারের তথ্য আপডেট হয়েছে।" : "ডাক্তার নিবন্ধিত হয়েছে।" });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await doctorService.delete(deleteTarget._id);
      setDeleteTarget(null);
      const page = doctors.length === 1 && pagination.page > 1 ? pagination.page - 1 : pagination.page;
      fetchDoctors({ search, department: deptFilter !== "all" ? deptFilter : "", page });
      setPopup({ type: "success", message: "ডাক্তার মুছে ফেলা হয়েছে।" });
    } catch {
      setPopup({ type: "error", message: "ডাক্তার মুছতে ব্যর্থ।" });
    } finally { setDeleting(false); }
  };

  const visibleDoctors = useMemo(
    () => commFilter !== "all" ? doctors.filter((d) => d.commissionType === commFilter) : doctors,
    [doctors, commFilter],
  );

  const stats = useMemo(() => ({
    total:      pagination.total,
    percentage: doctors.filter((d) => d.commissionType === "percentage").length,
    fixed:      doctors.filter((d) => d.commissionType === "fixed").length,
    multiDept:  doctors.filter((d) => (d.departments?.length ?? 0) > 1).length,
  }), [doctors, pagination.total]);

  const hasFilters = deptFilter !== "all" || commFilter !== "all";
  const deptOptions = departments.map((d) => ({ value: d.value, label: d.label }));

  return (
    <section
      className="min-h-screen px-4 py-6"
      style={{
        backgroundColor: "#F5F4EF",
        backgroundImage: "radial-gradient(circle, rgba(28,31,30,0.045) 1px, transparent 1px)",
        backgroundSize: "18px 18px",
        fontFamily: "Noto Sans Bengali, sans-serif",
      }}
    >
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

      <div className="max-w-2xl mx-auto">

        {/* ── Page header ── */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", color: C.teal, marginBottom: "4px" }}>
              ল্যাব অপারেশন
            </p>
            <h1 style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: "26px", fontWeight: 600, color: C.ink, lineHeight: 1.2 }}>
              ডাক্তার তালিকা
            </h1>
            <p style={{ fontSize: "14px", color: "#767D78", marginTop: "4px" }}>
              কমিশন ও রেফারেল ডাক্তার পরিচালনা।
            </p>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Link to="/lab-management"
              className="flex items-center gap-1.5 transition-colors"
              style={{ padding: "7px 12px", border: `1px solid ${C.ink}18`, borderRadius: "2px", color: C.sub, fontFamily: "'IBM Plex Mono', monospace", fontSize: "11px", textTransform: "uppercase" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = C.ink; e.currentTarget.style.color = "white"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = ""; e.currentTarget.style.color = C.sub; }}
            >
              <ArrowLeft style={{ width: "13px", height: "13px" }} /> ফিরে
            </Link>
            <button onClick={() => setFormModal({})}
              className="flex items-center gap-1.5 transition-colors"
              style={{ padding: "7px 14px", border: `1px solid ${C.teal}`, borderRadius: "2px", color: C.teal, fontFamily: "'IBM Plex Mono', monospace", fontSize: "11px", textTransform: "uppercase", fontWeight: 600 }}
              onMouseEnter={(e) => { e.currentTarget.style.background = C.teal; e.currentTarget.style.color = "white"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = ""; e.currentTarget.style.color = C.teal; }}
            >
              <UserPlus style={{ width: "13px", height: "13px" }} /> নতুন
            </button>
          </div>
        </div>

        {/* ── Stats strip ── */}
        {!initialLoading && (
          <div className="grid grid-cols-4 gap-2 mb-4">
            {[
              { label: "মোট ডাক্তার", value: stats.total,      color: C.blue   },
              { label: "শতাংশ কমিশন", value: stats.percentage, color: C.amber  },
              { label: "নির্দিষ্ট কমিশন", value: stats.fixed,  color: C.teal   },
              { label: "বহু-বিভাগ",   value: stats.multiDept,  color: C.purple },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white" style={{ border: `1px solid ${C.border}`, borderRadius: "3px", padding: "10px 14px" }}>
                <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.06em", color: C.muted, marginBottom: "5px" }}>{label}</p>
                <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "22px", fontWeight: 700, color, lineHeight: 1 }}>{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Ledger card ── */}
        {initialLoading ? <Skeleton /> : (
          <div className="bg-white" style={{ border: `1px solid ${C.border}`, borderRadius: "3px", boxShadow: "0 1px 3px rgba(28,31,30,0.05)" }}>

            {/* Ledger head */}
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${C.border}`, background: C.paper }}>
              <div>
                <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", color: C.teal, marginBottom: "4px" }}>
                  ডাক্তার লেজার
                </p>
                <div className="flex items-baseline gap-4">
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "13px", color: C.sub }}>
                    মোট {pagination.total}জন
                  </span>
                  {stats.percentage > 0 && (
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "11px", color: C.amber }}>
                      % {stats.percentage}জন
                    </span>
                  )}
                  {stats.fixed > 0 && (
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "11px", color: C.teal }}>
                      নির্দিষ্ট {stats.fixed}জন
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Toolbar: search + filters */}
            <div className="px-6 py-3 flex flex-wrap items-center gap-2" style={{ borderBottom: `1px solid ${C.border}`, background: C.paper }}>
              {/* Search */}
              <div className="relative" style={{ flex: "1 1 160px" }}>
                <Search style={{ width: "12px", height: "12px", color: C.muted, position: "absolute", left: "9px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                <input
                  type="text" placeholder="নাম, ডিগ্রি বা নম্বর…"
                  value={search} onChange={(e) => setSearch(e.target.value)}
                  className="w-full outline-none transition-all"
                  style={{ ...inputStyle, paddingLeft: "28px", paddingRight: search ? "28px" : "10px", paddingTop: "7px", paddingBottom: "7px", fontSize: "11px" }}
                  onFocus={focusInput} onBlur={blurInput}
                />
                {search && (
                  <button onClick={() => setSearch("")} style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", color: C.muted }}>
                    <X style={{ width: "12px", height: "12px" }} />
                  </button>
                )}
              </div>

              {/* Department filter */}
              <FilterDropdown value={deptFilter} onChange={setDeptFilter} options={deptOptions} placeholder="সব বিভাগ" />

              {/* Commission filter */}
              <FilterDropdown value={commFilter} onChange={setCommFilter} options={COMM_OPTIONS} placeholder="সব কমিশন" />

              {/* Reset */}
              {hasFilters && (
                <button
                  onClick={() => { setDeptFilter("all"); setCommFilter("all"); }}
                  className="flex items-center gap-1 transition-colors"
                  style={{ padding: "6px 10px", border: `1px solid ${C.red}33`, borderRadius: "2px", color: C.red, fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", textTransform: "uppercase" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = `${C.red}08`; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = ""; }}
                >
                  <RotateCcw style={{ width: "11px", height: "11px" }} /> রিসেট
                </button>
              )}
            </div>

            {/* Column labels */}
            <div className="flex items-center gap-3 px-6 pt-3 pb-1">
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.08em", color: C.muted, width: "20px", flexShrink: 0 }}>#</span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.08em", color: C.muted, flex: 1 }}>ডাক্তার</span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.08em", color: C.muted, flexShrink: 0 }}>কমিশন</span>
            </div>

            {/* Doctor rows */}
            <div className="px-6 pb-4">
              {visibleDoctors.length === 0 ? (
                <div className="flex items-center gap-2 py-8" style={{ color: C.muted }}>
                  <AlertCircle style={{ width: "13px", height: "13px" }} />
                  <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "11px" }}>
                    {hasFilters || search ? "কোনো ডাক্তার পাওয়া যায়নি" : "এখনো কোনো ডাক্তার নিবন্ধিত হয়নি"}
                  </p>
                </div>
              ) : (
                visibleDoctors.map((doctor, index) => (
                  <DoctorRow
                    key={doctor._id}
                    doctor={doctor}
                    index={index}
                    deptLabelMap={deptLabelMap}
                    desigLabelMap={desigLabelMap}
                    onEdit={() => setFormModal(doctor)}
                    onDelete={() => setDeleteTarget(doctor)}
                  />
                ))
              )}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-4" style={{ borderTop: `1px solid ${C.border}` }}>
                <Pagination page={pagination.page} totalPages={pagination.totalPages} onPage={handlePage} />
              </div>
            )}

            {/* Footer note */}
            <div className="px-6 py-2.5" style={{ borderTop: `1px solid ${C.border}`, background: C.paper }}>
              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: C.muted }}>
                * শুধুমাত্র সক্রিয় ডাক্তারের তথ্য অন্তর্ভুক্ত
              </p>
            </div>
          </div>
        )}

        <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "11px", color: C.muted, textAlign: "center", marginTop: "16px", paddingBottom: "24px" }}>
          LabPilotPro · ডাক্তার ম্যানেজমেন্ট সিস্টেম
        </p>
      </div>
    </section>
  );
};

export default ManageDoctors;