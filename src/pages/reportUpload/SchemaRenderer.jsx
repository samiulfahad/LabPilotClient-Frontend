// React Compiler active — no useCallback/useMemo
import { useState, useEffect } from "react";
import {
  CheckCircle2,
  XCircle,
  ChevronDown,
  Info,
  TrendingUp,
  TrendingDown,
  User,
  RotateCcw,
  Send,
  AlertTriangle,
  Eye,
  ShieldCheck,
  Pencil,
  Save,
  Activity,
} from "lucide-react";

// ─── Range logic (unchanged) ──────────────────────────────────────────────────

export function getStandardRange(field, patientAge, patientGender) {
  const sr = field.standardRange;
  if (!sr || sr.type === "none") return null;
  if (sr.type === "simple") return { min: parseFloat(sr.data.min), max: parseFloat(sr.data.max) };
  if (sr.type === "age" && patientAge) {
    const age = parseFloat(patientAge);
    const row = sr.data.find((r) => age >= parseFloat(r.minAge) && age <= parseFloat(r.maxAge));
    if (row) return { min: parseFloat(row.minValue), max: parseFloat(row.maxValue) };
  }
  if (sr.type === "gender" && patientGender) {
    const g = sr.data[patientGender];
    if (g) return { min: parseFloat(g.min), max: parseFloat(g.max) };
  }
  if (sr.type === "combined" && patientAge && patientGender) {
    const age = parseFloat(patientAge);
    const row = sr.data.find(
      (r) => r.gender === patientGender && age >= parseFloat(r.minAge) && age <= parseFloat(r.maxAge),
    );
    if (row) return { min: parseFloat(row.minValue), max: parseFloat(row.maxValue) };
  }
  return null;
}

export function getRangeStatus(value, range) {
  if (!range || value === "" || value === null || value === undefined) return "neutral";
  const v = parseFloat(value);
  if (isNaN(v)) return "neutral";
  if (v < range.min) return "low";
  if (v > range.max) return "high";
  return "normal";
}

export function hydrateValuesFromReport(schema, existingReport) {
  if (!existingReport || !schema?.sections) return {};
  const values = {};
  schema.sections.forEach((section, si) => {
    const sectionData = existingReport[section.name];
    if (!sectionData) return;
    section.fields.forEach((field) => {
      const key = `${si}_${field.name}`;
      const fieldData = sectionData[field.name];
      if (!fieldData) return;
      values[key] = fieldData.value ?? fieldData;
    });
  });
  return values;
}

function buildPayload(schema, values, patientAge, patientGender) {
  const report = {};
  schema.sections.forEach((sec, si) => {
    const sd = {};
    sec.fields.forEach((field) => {
      const key = `${si}_${field.name}`;
      const val = values[key];
      if (val !== "" && val !== undefined && val !== null && !(Array.isArray(val) && val.length === 0)) {
        sd[field.name] = {
          value: val,
          ...(field.unit ? { unit: field.unit } : {}),
          ...(field.type === "number"
            ? (() => {
                const range = getStandardRange(field, patientAge, patientGender);
                return range ? { referenceRange: `${range.min}–${range.max}` } : {};
              })()
            : {}),
        };
      }
    });
    if (Object.keys(sd).length > 0) report[sec.name] = { ...sd, __showTitle: sec.showTitleInReport !== false };
  });

  return { ...report, name: schema.name };
}

// ─── Shared UI primitives ──────────────────────────────────────────────────────

const STATUS_BADGE = {
  normal: { icon: CheckCircle2, label: "Normal", cls: "bg-emerald-50 text-emerald-600 border-emerald-200" },
  low: { icon: TrendingDown, label: "Low", cls: "bg-orange-50 text-orange-600 border-orange-200" },
  high: { icon: TrendingUp, label: "High", cls: "bg-red-50 text-red-600 border-red-200" },
};

const EditedBadge = () => (
  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-violet-50 border border-violet-200 text-violet-600 text-[10px] font-semibold shrink-0">
    <Pencil className="w-2.5 h-2.5" />
    edited
  </span>
);

const FieldError = ({ msg }) =>
  msg ? (
    <p className="flex items-center gap-1 text-xs text-red-500 mt-1.5">
      <XCircle className="w-3 h-3 shrink-0" />
      {msg}
    </p>
  ) : null;

// ─── Field row shell: single pill container, prefix label box + value area ───
// Mirrors the Uiverse "container / prefix / input" pattern exactly.

function FieldRow({ field, isChanged, borderCls, footer, children }) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div
        className={`flex items-stretch w-full bg-white rounded-[10px] border-2 overflow-hidden shadow-[0_2px_4px_rgba(0,0,0,0.1)] transition-colors ${
          borderCls || "border-slate-800"
        }`}
      >
        <span className="flex items-center justify-center shrink-0 px-3.5 bg-[#f0f0f0] text-[#666] text-sm font-semibold whitespace-nowrap">
          {field.name}
          {field.required && <span className="text-red-500 ml-0.5">*</span>}
        </span>
        {children}
      </div>
      {(footer || isChanged) && (
        <div className="flex items-center gap-2 flex-wrap px-0.5">
          {isChanged && <EditedBadge />}
          {footer}
        </div>
      )}
    </div>
  );
}

// ─── Field types ───────────────────────────────────────────────────────────────

function NumberField({ field, value, onChange, error, patientAge, patientGender, originalValue, isEditMode }) {
  const range = getStandardRange(field, patientAge, patientGender);
  const status = getRangeStatus(value, range);
  const hasValue = value !== "" && value !== null && value !== undefined;
  const isChanged = isEditMode && originalValue !== undefined && String(value) !== String(originalValue ?? "");
  const badge = hasValue && range && STATUS_BADGE[status];

  let borderCls = "border-slate-800";
  if (error) borderCls = "border-red-500";
  else if (isChanged) borderCls = "border-violet-500";
  else if (status === "normal") borderCls = "border-emerald-500";
  else if (status === "low") borderCls = "border-orange-500";
  else if (status === "high") borderCls = "border-red-500";

  const footer =
    range || badge ? (
      <>
        {range && (
          <span className="text-[11px] text-slate-400 font-mono">
            Ref: {range.min}–{range.max}
            {field.unit ? ` ${field.unit}` : ""}
          </span>
        )}
        {badge && (
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold ${badge.cls}`}
          >
            <badge.icon className="w-2.5 h-2.5" />
            {badge.label}
          </span>
        )}
      </>
    ) : null;

  return (
    <FieldRow field={field} isChanged={isChanged} borderCls={borderCls} footer={footer}>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 min-w-0 px-3 py-2.5 bg-white text-sm font-mono text-slate-900 focus:outline-none"
      />
      {field.unit && (
        <span className="shrink-0 flex items-center px-3 bg-[#f0f0f0] border-l border-slate-200 text-xs font-medium text-slate-500">
          {field.unit}
        </span>
      )}
    </FieldRow>
  );
}

function ToggleGroup({ options, isSelected, onToggle, changedPredicate }) {
  return (
    <div className="flex flex-wrap gap-2 max-w-md">
      {options.map((opt) => {
        const sel = isSelected(opt);
        const changed = changedPredicate?.(opt, sel);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onToggle(opt)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
              sel
                ? changed
                  ? "bg-violet-600 border-violet-600 text-white"
                  : "bg-blue-600 border-blue-600 text-white"
                : changed
                  ? "bg-white border-violet-300 text-slate-600"
                  : "bg-white border-slate-300 text-slate-600 hover:border-slate-400 hover:bg-slate-50"
            }`}
          >
            <span
              className={`w-3 h-3 rounded-full border-2 shrink-0 flex items-center justify-center ${
                sel ? "border-white" : "border-slate-300"
              }`}
            >
              {sel && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
            </span>
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function RadioField({ field, options = [], value, onChange, error, originalValue, isEditMode }) {
  const isChanged = isEditMode && originalValue !== undefined && value !== (originalValue ?? "");
  return (
    <FieldRow field={field} isChanged={isChanged} footer={<FieldError msg={error} />}>
      <div className="flex-1 flex items-center px-3 py-2 bg-white">
        <ToggleGroup
          options={options}
          isSelected={(opt) => value === opt}
          onToggle={(opt) => onChange(value === opt ? "" : opt)}
          changedPredicate={(opt, sel) => isChanged && sel}
        />
      </div>
    </FieldRow>
  );
}

function CheckboxField({ field, options = [], value = [], onChange, error, originalValue, isEditMode }) {
  const toggle = (opt) => onChange(value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt]);
  const origArr = Array.isArray(originalValue) ? originalValue : [];
  const isChanged =
    isEditMode &&
    originalValue !== undefined &&
    JSON.stringify([...(value || [])].sort()) !== JSON.stringify([...origArr].sort());
  return (
    <FieldRow field={field} isChanged={isChanged} footer={<FieldError msg={error} />}>
      <div className="flex-1 flex items-center px-3 py-2 bg-white">
        <ToggleGroup
          options={options}
          isSelected={(opt) => value.includes(opt)}
          onToggle={toggle}
          changedPredicate={(opt, sel) => isEditMode && originalValue !== undefined && sel !== origArr.includes(opt)}
        />
      </div>
    </FieldRow>
  );
}

function DropdownField({ field, options = [], value, onChange, error, originalValue, isEditMode }) {
  const [open, setOpen] = useState(false);
  const isChanged = isEditMode && originalValue !== undefined && value !== (originalValue ?? "");

  return (
    <FieldRow field={field} isChanged={isChanged} footer={<FieldError msg={error} />}>
      <div className="relative flex-1">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={`w-full h-full flex items-center justify-between px-3.5 py-2.5 bg-white text-sm font-medium transition-colors focus:outline-none ${
            value ? "text-slate-900" : "text-slate-400"
          }`}
        >
          <span>{value || "— নির্বাচন করুন —"}</span>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        {open && (
          <div className="absolute z-40 top-[calc(100%+4px)] left-0 right-0 bg-white border-2 border-slate-800 rounded-[10px] shadow-lg overflow-y-auto max-h-52">
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between text-left px-3.5 py-2.5 text-sm transition-colors ${
                  value === opt ? "bg-slate-800 text-white font-semibold" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {opt}
                {value === opt && <CheckCircle2 className="w-3.5 h-3.5" />}
              </button>
            ))}
          </div>
        )}
      </div>
    </FieldRow>
  );
}

function TextareaField({ field, value, onChange, error, originalValue, isEditMode }) {
  const isChanged = isEditMode && originalValue !== undefined && value !== (originalValue ?? "");
  return (
    <FieldRow field={field} isChanged={isChanged} footer={<FieldError msg={error} />}>
      <div className="flex-1 flex flex-col bg-white">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={field.maxLength}
          rows={3}
          className="w-full px-3.5 py-2.5 bg-transparent text-sm text-slate-900 focus:outline-none resize-none font-noto"
        />
        <div className="text-right text-[10px] font-mono text-slate-400 px-3 pb-1.5">
          {(value || "").length}/{field.maxLength}
        </div>
      </div>
    </FieldRow>
  );
}

function TextInputField({ field, value, onChange, error, originalValue, isEditMode }) {
  const isChanged = isEditMode && originalValue !== undefined && value !== (originalValue ?? "");
  return (
    <FieldRow field={field} isChanged={isChanged} footer={<FieldError msg={error} />}>
      <div className="relative flex-1 flex items-center bg-white">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={field.maxLength}
          className="w-full px-3.5 py-2.5 bg-transparent text-sm text-slate-900 focus:outline-none font-noto"
          style={{ paddingRight: field.maxLength ? "48px" : undefined }}
        />
        {field.maxLength && (
          <span className="absolute right-3.5 text-[10px] font-mono text-slate-300">
            {(value || "").length}/{field.maxLength}
          </span>
        )}
      </div>
    </FieldRow>
  );
}

// ─── Section panel ─────────────────────────────────────────────────────────────

function SectionPanel({
  section,
  sectionIndex,
  values,
  onChange,
  errors,
  patientAge,
  patientGender,
  hideTitle,
  originalValues,
  isEditMode,
}) {
  const [collapsed, setCollapsed] = useState(false);
  const fieldCount = section.fields.length;
  const filledCount = section.fields.filter((f) => {
    const v = values[`${sectionIndex}_${f.name}`];
    return Array.isArray(v) ? v.length > 0 : v !== "" && v !== undefined && v !== null;
  }).length;
  const hasError = section.fields.some((f) => errors[`${sectionIndex}_${f.name}`]);
  const complete = filledCount === fieldCount && fieldCount > 0;
  const pct = fieldCount > 0 ? (filledCount / fieldCount) * 100 : 0;

  const rows = (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 px-5 py-4">
      {section.fields.map((field) => {
        const key = `${sectionIndex}_${field.name}`;
        const val = values[key] ?? (field.type === "checkbox" ? [] : "");
        const err = errors[key];
        const origVal = originalValues ? originalValues[key] : undefined;
        return (
          <div key={key} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
            {field.type === "number" && (
              <NumberField
                field={field}
                value={val}
                onChange={(v) => onChange(key, v)}
                error={err}
                patientAge={patientAge}
                patientGender={patientGender}
                originalValue={origVal}
                isEditMode={isEditMode}
              />
            )}
            {field.type === "radio" && (
              <RadioField
                field={field}
                options={field.options}
                value={val}
                onChange={(v) => onChange(key, v)}
                error={err}
                originalValue={origVal}
                isEditMode={isEditMode}
              />
            )}
            {field.type === "select" && (
              <DropdownField
                field={field}
                options={field.options}
                value={val}
                onChange={(v) => onChange(key, v)}
                error={err}
                originalValue={origVal}
                isEditMode={isEditMode}
              />
            )}
            {field.type === "checkbox" && (
              <CheckboxField
                field={field}
                options={field.options}
                value={val}
                onChange={(v) => onChange(key, v)}
                error={err}
                originalValue={origVal}
                isEditMode={isEditMode}
              />
            )}
            {field.type === "textarea" && (
              <TextareaField
                field={field}
                value={val}
                onChange={(v) => onChange(key, v)}
                error={err}
                originalValue={origVal}
                isEditMode={isEditMode}
              />
            )}
            {field.type === "input" && (
              <TextInputField
                field={field}
                value={val}
                onChange={(v) => onChange(key, v)}
                error={err}
                originalValue={origVal}
                isEditMode={isEditMode}
              />
            )}
          </div>
        );
      })}
    </div>
  );

  if (hideTitle) return <div className="bg-white rounded-xl py-1">{rows}</div>;

  return (
    <div
      className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-shadow hover:shadow-md ${hasError ? "border-red-200" : "border-slate-200"}`}
    >
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className={`w-full flex items-center gap-3 px-5 py-3.5 text-left border-b transition-colors ${
          hasError
            ? "bg-red-50 border-red-200 hover:bg-red-100/70"
            : "bg-slate-50 border-slate-200 hover:bg-slate-100/70"
        }`}
      >
        <div
          className={`w-7 h-7 rounded-md flex items-center justify-center text-[11px] font-mono font-semibold shrink-0 border ${
            complete
              ? "bg-blue-600 border-blue-600 text-white"
              : hasError
                ? "bg-red-500 border-red-500 text-white"
                : "bg-white border-slate-300 text-slate-500"
          }`}
        >
          {sectionIndex + 1}
        </div>
        <span className="flex-1 text-sm font-semibold text-slate-800 tracking-tight">{section.name}</span>
        <span
          className={`font-mono text-[11px] px-2.5 py-1 rounded-full border ${
            complete ? "bg-blue-50 border-blue-200 text-blue-600" : "bg-white border-slate-200 text-slate-400"
          }`}
        >
          {filledCount}/{fieldCount}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${!collapsed ? "rotate-180" : ""}`}
        />
      </button>
      <div className="h-[2px] bg-slate-100">
        <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      {!collapsed && rows}
    </div>
  );
}

// ─── Patient banner ─────────────────────────────────────────────────────────────

function PatientBanner({ invoice }) {
  const { patient } = invoice;
  const cells = [
    { label: "Full Name", val: patient.name },
    { label: "Age", val: `${patient.age} yrs` },
    { label: "Gender", val: patient.gender, cap: true },
    { label: "Contact", val: patient.contactNumber },
  ];
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-2.5 bg-slate-50 border-b border-slate-200">
        <User className="w-3.5 h-3.5 text-blue-500" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Patient Record</span>
        <span className="ml-auto font-mono text-[10px] text-slate-400">{invoice.invoiceId}</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-slate-100">
        {cells.map((c) => (
          <div key={c.label} className="px-5 py-3.5">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-0.5">{c.label}</div>
            <div className={`text-sm font-semibold text-slate-900 ${c.cap ? "capitalize" : ""}`}>{c.val}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Alert banner ─────────────────────────────────────────────────────────────

const ALERT_STYLES = {
  amber: {
    wrap: "bg-amber-50 border-amber-400",
    title: "text-amber-800",
    body: "text-amber-700",
    icon: "text-amber-500",
  },
  red: { wrap: "bg-red-50 border-red-400", title: "text-red-800", body: "text-red-700", icon: "text-red-500" },
  violet: {
    wrap: "bg-violet-50 border-violet-400",
    title: "text-violet-800",
    body: "text-violet-700",
    icon: "text-violet-500",
  },
};

function Alert({ tone, icon: Icon, title, children }) {
  const s = ALERT_STYLES[tone];
  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-lg border-l-4 ${s.wrap}`}>
      <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${s.icon}`} />
      <div>
        <div className={`text-xs font-bold uppercase tracking-wide mb-0.5 ${s.title}`}>{title}</div>
        <div className={`text-[13px] leading-relaxed ${s.body}`}>{children}</div>
      </div>
    </div>
  );
}

// ─── Stat tile ─────────────────────────────────────────────────────────────────

function StatTile({ label, value, tone }) {
  const toneCls = {
    default: "text-slate-900",
    green: "text-emerald-600",
    red: "text-red-600",
    violet: "text-violet-600",
    blue: "text-blue-600",
  };
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-0.5">{label}</div>
      <div className={`font-mono text-xl font-semibold leading-none ${toneCls[tone] || toneCls.default}`}>{value}</div>
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────────

function SchemaRenderer({ schema, invoice, onSubmit, onUpdate, loading = false, existingReport = null }) {
  const isEditMode = Boolean(existingReport);
  const computeInitial = () => (isEditMode ? hydrateValuesFromReport(schema, existingReport) : {});

  const [values, setValues] = useState(computeInitial);
  const [errors, setErrors] = useState({});
  const [originalValues] = useState(() => (isEditMode ? hydrateValuesFromReport(schema, existingReport) : {}));
  const patientAge = invoice?.patient?.age ?? existingReport?.patientAge ?? "";
  const patientGender = invoice?.patient?.gender ?? existingReport?.patientGender ?? "";

  useEffect(() => {
    setValues(computeInitial());
    setErrors({});
  }, [JSON.stringify(schema?.sections), JSON.stringify(existingReport)]);

  if (!schema || !schema.sections) return null;

  const handleChange = (key, val) => {
    setValues((v) => ({ ...v, [key]: val }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = () => {
    const errs = {};
    schema.sections.forEach((sec, si) => {
      sec.fields.forEach((field) => {
        if (!field.required) return;
        const key = `${si}_${field.name}`;
        const val = values[key];
        if (field.type === "checkbox") {
          if (!val || val.length === 0) errs[key] = "At least one option is required";
        } else if (val === "" || val === undefined || val === null) {
          errs[key] = "This field is required";
        }
      });
    });
    return errs;
  };

  const allKeys = schema.sections.flatMap((sec, si) => sec.fields.map((f) => `${si}_${f.name}`));

  const changedCount = isEditMode
    ? Object.keys(originalValues).filter((k) => {
        const cur = values[k],
          orig = originalValues[k];
        if (Array.isArray(orig)) return JSON.stringify([...(cur || [])].sort()) !== JSON.stringify([...orig].sort());
        return String(cur ?? "") !== String(orig ?? "");
      }).length
    : 0;

  const newlyFilled = isEditMode
    ? allKeys.filter((k) => {
        const cur = values[k],
          orig = originalValues[k];
        const empty = (v) => v === "" || v === undefined || v === null || (Array.isArray(v) && v.length === 0);
        return empty(orig) && !empty(cur);
      }).length
    : 0;

  const totalChanges = changedCount + newlyFilled;

  const handleSubmit = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    const payload = buildPayload(schema, values, patientAge, patientGender);
    if (isEditMode) onUpdate?.(payload);
    else onSubmit?.(payload);
  };

  const handleReset = () => {
    setValues(isEditMode ? hydrateValuesFromReport(schema, existingReport) : {});
    setErrors({});
  };

  const hasFields = schema.sections.some((s) => s.fields.length > 0);
  const totalFields = allKeys.length;
  const totalFilled = allKeys.filter((k) => {
    const v = values[k];
    return Array.isArray(v) ? v.length > 0 : v !== "" && v !== undefined && v !== null;
  }).length;
  const progress = totalFields > 0 ? (totalFilled / totalFields) * 100 : null;

  const numStatuses = schema.sections.flatMap((sec, si) =>
    sec.fields
      .filter((f) => f.type === "number")
      .map((f) => {
        const range = getStandardRange(f, patientAge, patientGender);
        return getRangeStatus(values[`${si}_${f.name}`], range);
      }),
  );
  const abnormalCount = numStatuses.filter((s) => s === "high" || s === "low").length;
  const normalCount = numStatuses.filter((s) => s === "normal").length;

  if (!hasFields) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center px-4 font-noto">
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 bg-white border border-slate-200 rounded-xl flex items-center justify-center shadow-sm mb-4">
            <Eye className="w-6 h-6 text-slate-300" />
          </div>
          <p className="font-semibold text-slate-600 text-sm">No fields configured</p>
          <p className="text-slate-400 text-sm mt-1">Add fields in the Builder to preview</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-6 px-4 sm:px-6 lg:px-8 font-noto">
      <div className="max-w-5xl mx-auto space-y-4">
        {/* Edit mode ribbon */}
        {isEditMode && (
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-lg bg-violet-50 border border-violet-200 text-violet-700 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
            <Pencil className="w-3.5 h-3.5" />
            <span className="font-bold uppercase tracking-wide text-[11px]">Edit Mode</span>
            <span className="font-mono text-[11px] opacity-70">— Modifying existing report</span>
            {totalChanges > 0 && (
              <span className="ml-auto font-mono text-[10px] bg-violet-600/10 text-violet-700 px-2.5 py-0.5 rounded-full font-semibold">
                {totalChanges} change{totalChanges !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        )}

        {/* Header card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-start gap-4 mb-5">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${isEditMode ? "bg-violet-600" : "bg-blue-600"}`}
            >
              {isEditMode ? <Pencil className="w-5 h-5 text-white" /> : <Activity className="w-5 h-5 text-white" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wide text-slate-400 mb-1">
                <span>{isEditMode ? "Lab Report · Edit" : "Lab Report Entry"}</span>
                <span className="w-[3px] h-[3px] rounded-full bg-slate-300" />
                <span className={schema.isActive ? "text-emerald-500" : "text-slate-400"}>
                  {schema.isActive ? "● Active" : "○ Inactive"}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{schema.name || "Untitled Schema"}</h1>
              {schema.description && (
                <p className="text-sm text-slate-500 mt-1 leading-relaxed">{schema.description}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {progress !== null && (
              <StatTile
                label="Progress"
                value={`${Math.round(progress)}%`}
                tone={progress === 100 ? "green" : "blue"}
              />
            )}
            <StatTile label="Filled" value={`${totalFilled}/${totalFields}`} />
            <StatTile label="In Range" value={normalCount} tone={normalCount > 0 ? "green" : "default"} />
            <StatTile label="Abnormal" value={abnormalCount} tone={abnormalCount > 0 ? "red" : "default"} />
            {isEditMode && (
              <StatTile label="Changes" value={totalChanges} tone={totalChanges > 0 ? "violet" : "default"} />
            )}
          </div>

          {progress !== null && (
            <div className="mt-5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Completion</span>
                <span className="font-mono text-[11px] text-slate-500">
                  {totalFilled} / {totalFields} fields
                </span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${progress === 100 ? "bg-emerald-500" : "bg-blue-500"}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Alerts */}
        {abnormalCount > 0 && (
          <Alert tone="amber" icon={AlertTriangle} title="Abnormal Values Detected">
            {abnormalCount} result{abnormalCount > 1 ? "s" : ""} outside the standard reference range — please review
            before submitting.
          </Alert>
        )}

        {isEditMode && totalChanges > 0 && (
          <Alert tone="violet" icon={Pencil} title="Unsaved Changes">
            {totalChanges} change{totalChanges !== 1 ? "s" : ""} pending. Edited fields are highlighted in purple. Click{" "}
            <strong>Update Report</strong> to save.
          </Alert>
        )}

        {/* Patient banner */}
        {invoice && <PatientBanner invoice={invoice} />}

        {/* Sections */}
        <div className="space-y-3">
          {schema.sections.map((section, si) => (
            <SectionPanel
              key={si}
              section={section}
              sectionIndex={si}
              values={values}
              onChange={handleChange}
              errors={errors}
              patientAge={patientAge}
              patientGender={patientGender}
              hideTitle={section.showTitleInReport === false}
              originalValues={isEditMode ? originalValues : undefined}
              isEditMode={isEditMode}
            />
          ))}
        </div>

        {/* Static range note */}
        {schema.hasStaticStandardRange && schema.staticStandardRange && (
          <Alert tone="amber" icon={Info} title="Standard Reference">
            {schema.staticStandardRange}
          </Alert>
        )}

        {/* Validation errors */}
        {Object.keys(errors).length > 0 && (
          <Alert tone="red" icon={XCircle} title="Validation Failed">
            {Object.keys(errors).length} field{Object.keys(errors).length > 1 ? "s" : ""} require attention before
            submitting.
          </Alert>
        )}

        {/* Action bar */}
        <div className="flex items-center justify-between flex-wrap gap-3 bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-4">
          <div className="flex items-center gap-1.5 text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="font-mono text-[11px]">
              {isEditMode ? "Editing existing report" : "Form validated on submit"}
            </span>
          </div>
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={handleReset}
              title={isEditMode ? "Revert all changes" : "Clear all fields"}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-600 text-sm font-semibold hover:bg-slate-50 hover:border-slate-400 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {isEditMode ? "Revert" : "Reset"}
            </button>
            <button
              type="button"
              disabled={loading || (isEditMode && totalChanges === 0)}
              onClick={handleSubmit}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-white text-sm font-semibold shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                isEditMode ? "bg-violet-600 hover:bg-violet-700" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {loading ? (
                <span className="w-2 h-2 rounded-full bg-white/70 animate-pulse" />
              ) : isEditMode ? (
                <Save className="w-4 h-4" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {loading
                ? isEditMode
                  ? "Updating…"
                  : "Submitting…"
                : isEditMode
                  ? totalChanges > 0
                    ? `Update Report (${totalChanges})`
                    : "No Changes"
                  : "Submit Report"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SchemaRenderer;

// import { useState, useEffect } from "react";
// import {
//   CheckCircle2,
//   XCircle,
//   ChevronDown,
//   Info,
//   TrendingUp,
//   TrendingDown,
//   User,
//   RotateCcw,
//   Send,
//   AlertTriangle,
//   Eye,
//   ShieldCheck,
//   Pencil,
//   Save,
//   Activity,
// } from "lucide-react";

// // ─── Global Styles ─────────────────────────────────────────────────────────────
// const STYLES = `
//   :root {
//     --c-bg:        #f7f8fa;
//     --c-surface:   #ffffff;
//     --c-surface-2: #f2f4f7;
//     --c-border:    #e4e7ed;
//     --c-border-2:  #d1d5de;
//     --c-ink:       #0d1117;
//     --c-ink-2:     #1e2530;
//     --c-ink-3:     #4a5568;
//     --c-ink-4:     #8492a6;
//     --c-blue:      #2563eb;
//     --c-blue-dim:  #eff4ff;
//     --c-blue-glow: rgba(37,99,235,0.12);
//     --c-green:     #059669;
//     --c-green-dim: #ecfdf5;
//     --c-amber:     #d97316;
//     --c-amber-dim: #fff7ed;
//     --c-red:       #dc2626;
//     --c-red-dim:   #fef2f2;
//     --c-violet:    #7c3aed;
//     --c-violet-dim:#f5f3ff;
//     --c-teal:      #0891b2;
//     --radius-sm:   6px;
//     --radius-md:   10px;
//     --radius-lg:   14px;
//     --radius-xl:   18px;
//     --shadow-sm:   0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
//     --shadow-md:   0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04);
//     --shadow-lg:   0 10px 30px rgba(0,0,0,0.1), 0 4px 10px rgba(0,0,0,0.06);
//     font-family: 'Outfit', sans-serif;
//     color: var(--c-ink);
//     background: var(--c-bg);
//   }

//   .sr2 * { box-sizing: border-box; margin: 0; padding: 0; }
//   .sr2 { background: var(--c-bg); min-height: 100vh; }

//   .sr2-ribbon {
//     display: flex; align-items: center; gap: 8px;
//     padding: 8px 14px; border-radius: var(--radius-md);
//     margin-bottom: 20px; font-size: 12px; font-weight: 500; border: 1px solid;
//   }
//   .sr2-ribbon.edit { background: var(--c-violet-dim); border-color: rgba(124,58,237,0.2); color: #5b21b6; }
//   .sr2-ribbon.edit .dot {
//     width: 6px; height: 6px; border-radius: 50%; background: var(--c-violet); flex-shrink: 0;
//     animation: pulse2 2s ease-in-out infinite;
//   }
//   @keyframes pulse2 { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.4; transform:scale(0.75); } }

//   .sr2-header {
//     background: var(--c-surface); border: 1px solid var(--c-border);
//     border-radius: var(--radius-xl); padding: 24px; margin-bottom: 16px; box-shadow: var(--shadow-sm);
//   }
//   .sr2-header-top { display: flex; align-items: flex-start; gap: 16px; margin-bottom: 20px; }
//   .sr2-icon-box {
//     width: 44px; height: 44px; border-radius: var(--radius-md);
//     display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: background 0.2s;
//   }
//   .sr2-icon-box.default { background: var(--c-ink); }
//   .sr2-icon-box.edit    { background: var(--c-violet); }

//   .sr2-meta { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: var(--c-ink-4); text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 4px; display: flex; align-items: center; gap: 8px; }
//   .sr2-meta-dot { width: 3px; height: 3px; border-radius: 50%; background: var(--c-border-2); }
//   .sr2-title { font-size: clamp(20px, 4vw, 28px); font-weight: 800; color: var(--c-ink); letter-spacing: -0.03em; line-height: 1.1; }
//   .sr2-desc { margin-top: 6px; font-size: 13.5px; color: var(--c-ink-3); line-height: 1.6; font-weight: 400; }

//   .sr2-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 8px; }
//   .sr2-stat { background: var(--c-surface-2); border: 1px solid var(--c-border); border-radius: var(--radius-md); padding: 12px 14px; display: flex; flex-direction: column; gap: 2px; }
//   .sr2-stat-label { font-size: 10px; font-weight: 600; color: var(--c-ink-4); text-transform: uppercase; letter-spacing: 0.07em; }
//   .sr2-stat-val { font-family: 'JetBrains Mono', monospace; font-size: 22px; font-weight: 600; color: var(--c-ink); line-height: 1; }
//   .sr2-stat-val.green  { color: var(--c-green); }
//   .sr2-stat-val.red    { color: var(--c-red); }
//   .sr2-stat-val.violet { color: var(--c-violet); }
//   .sr2-stat-val.blue   { color: var(--c-blue); }

//   .sr2-progress-wrap { margin-top: 16px; }
//   .sr2-progress-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
//   .sr2-progress-label { font-size: 11px; font-weight: 600; color: var(--c-ink-4); text-transform: uppercase; letter-spacing: 0.07em; }
//   .sr2-progress-count { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--c-ink-3); }
//   .sr2-track { height: 4px; background: var(--c-border); border-radius: 4px; overflow: hidden; }
//   .sr2-fill { height: 100%; border-radius: 4px; background: linear-gradient(90deg, var(--c-blue), var(--c-teal)); transition: width 0.6s cubic-bezier(0.4,0,0.2,1); }
//   .sr2-fill.complete { background: linear-gradient(90deg, var(--c-green), #10b981); }

//   .sr2-alert { display: flex; align-items: flex-start; gap: 12px; padding: 12px 16px; border-radius: var(--radius-md); border-left: 3px solid; margin-bottom: 12px; }
//   .sr2-alert.amber  { background: var(--c-amber-dim);  border-color: var(--c-amber); }
//   .sr2-alert.red    { background: var(--c-red-dim);    border-color: var(--c-red); }
//   .sr2-alert.violet { background: var(--c-violet-dim); border-color: var(--c-violet); }
//   .sr2-alert-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 2px; }
//   .sr2-alert.amber  .sr2-alert-title { color: #92400e; }
//   .sr2-alert.red    .sr2-alert-title { color: #991b1b; }
//   .sr2-alert.violet .sr2-alert-title { color: #4c1d95; }
//   .sr2-alert-body { font-size: 12.5px; line-height: 1.5; }
//   .sr2-alert.amber  .sr2-alert-body { color: #b45309; }
//   .sr2-alert.red    .sr2-alert-body { color: #b91c1c; }
//   .sr2-alert.violet .sr2-alert-body { color: #6d28d9; }

//   .sr2-patient { background: var(--c-surface); border: 1px solid var(--c-border); border-radius: var(--radius-lg); overflow: hidden; margin-bottom: 16px; box-shadow: var(--shadow-sm); }
//   .sr2-patient-head { display: flex; align-items: center; gap: 10px; padding: 10px 18px; background: var(--c-ink-2); }
//   .sr2-patient-head-label { font-size: 10px; font-weight: 700; color: rgba(255,255,255,0.55); text-transform: uppercase; letter-spacing: 0.1em; }
//   .sr2-patient-head-id { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: rgba(255,255,255,0.3); margin-left: auto; }
//   .sr2-patient-body { display: grid; grid-template-columns: repeat(4, 1fr); }
//   .sr2-patient-cell { padding: 14px 18px; border-right: 1px solid var(--c-border); }
//   .sr2-patient-cell:last-child { border-right: none; }
//   .sr2-patient-cell-label { font-size: 10px; font-weight: 600; color: var(--c-ink-4); text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 4px; }
//   .sr2-patient-cell-val { font-size: 14px; font-weight: 600; color: var(--c-ink); }

//   .sr2-section { background: var(--c-surface); border: 1px solid var(--c-border); border-radius: var(--radius-lg); overflow: hidden; box-shadow: var(--shadow-sm); transition: box-shadow 0.2s, border-color 0.2s; }
//   .sr2-section:hover { box-shadow: var(--shadow-md); }
//   .sr2-section.has-error { border-color: rgba(220,38,38,0.4); }
//   .sr2-section-head { display: flex; align-items: center; gap: 12px; padding: 14px 18px; background: var(--c-ink); cursor: pointer; border: none; width: 100%; text-align: left; transition: background 0.15s; }
//   .sr2-section-head:hover { background: var(--c-ink-2); }
//   .sr2-section-head.error { background: #7f1d1d; }
//   .sr2-section-num { width: 28px; height: 28px; border-radius: var(--radius-sm); background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.7); font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 600; display: flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1px solid rgba(255,255,255,0.15); }
//   .sr2-section-num.done { background: var(--c-blue); border-color: var(--c-blue); color: #fff; }
//   .sr2-section-num.err  { background: var(--c-red);  border-color: var(--c-red);  color: #fff; }
//   .sr2-section-name { flex: 1; font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.9); letter-spacing: 0.01em; }
//   .sr2-section-badge { font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 500; padding: 3px 9px; border-radius: 20px; background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.45); border: 1px solid rgba(255,255,255,0.1); }
//   .sr2-section-badge.done { background: rgba(37,99,235,0.3); color: #93c5fd; border-color: rgba(37,99,235,0.4); }
//   .sr2-section-bar { height: 2px; background: rgba(255,255,255,0.06); }
//   .sr2-section-bar-fill { height: 100%; background: var(--c-blue); transition: width 0.5s ease; }
//   .sr2-chevron { color: rgba(255,255,255,0.3); transition: transform 0.2s ease; flex-shrink: 0; }
//   .sr2-chevron.open { transform: rotate(180deg); }

//   .sr2-fields { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 14px 18px; padding: 20px 18px; }

//   .sr2-field-wrap { position: relative; background: var(--c-surface); border: 1.5px solid var(--c-border); border-radius: var(--radius-md); transition: border-color 0.15s, box-shadow 0.15s; }
//   .sr2-field-wrap:focus-within { border-color: var(--c-blue); box-shadow: 0 0 0 3px var(--c-blue-glow); }
//   .sr2-field-wrap.ok     { border-color: var(--c-green);  box-shadow: 0 0 0 3px rgba(5,150,105,0.1); }
//   .sr2-field-wrap.low    { border-color: var(--c-amber);  box-shadow: 0 0 0 3px rgba(217,115,22,0.1); }
//   .sr2-field-wrap.high   { border-color: var(--c-red);    box-shadow: 0 0 0 3px rgba(220,38,38,0.1); }
//   .sr2-field-wrap.err    { border-color: var(--c-red);    box-shadow: 0 0 0 3px rgba(220,38,38,0.1); background: #fff8f8; }
//   .sr2-field-wrap.edited { border-color: var(--c-violet); box-shadow: 0 0 0 3px rgba(124,58,237,0.1); }
//   .sr2-float-label { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); font-size: 12px; font-weight: 600; color: var(--c-ink-4); text-transform: uppercase; letter-spacing: 0.05em; pointer-events: none; line-height: 1; background: transparent; transition: all 0.15s ease; white-space: nowrap; max-width: calc(100% - 64px); overflow: hidden; text-overflow: ellipsis; }
//   .sr2-field-wrap.floated .sr2-float-label,
//   .sr2-field-wrap:focus-within .sr2-float-label { top: 0; transform: translateY(-50%); font-size: 9px; color: var(--c-blue); background: var(--c-surface); padding: 0 4px; left: 9px; }
//   .sr2-field-wrap.err.floated .sr2-float-label { background: #fff8f8; color: var(--c-red); }
//   .sr2-req { display: inline-block; width: 4px; height: 4px; border-radius: 50%; background: var(--c-blue); margin-left: 3px; vertical-align: middle; margin-bottom: 1px; }
//   .sr2-num-input { width: 100%; padding: 18px 14px 8px 12px; background: transparent; border: none; outline: none; font-family: 'JetBrains Mono', monospace; font-size: 15px; font-weight: 500; color: var(--c-ink); line-height: 1.2; min-height: 54px; }
//   .sr2-num-input::placeholder { color: transparent; }
//   .sr2-num-input::-webkit-outer-spin-button, .sr2-num-input::-webkit-inner-spin-button { -webkit-appearance: none; }
//   .sr2-unit { position: absolute; right: 0; top: 0; height: 100%; padding: 0 11px; display: flex; align-items: center; background: var(--c-surface-2); border-left: 1.5px solid var(--c-border); border-radius: 0 8px 8px 0; font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 500; color: var(--c-ink-3); text-transform: uppercase; letter-spacing: 0.06em; pointer-events: none; }

//   .sr2-range-row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-top: 5px; }
//   .sr2-range-text { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: var(--c-ink-4); }
//   .sr2-range-text span { color: var(--c-ink-3); font-weight: 500; }
//   .sr2-badge { display: inline-flex; align-items: center; gap: 3px; padding: 2px 7px; border-radius: 20px; font-size: 10px; font-weight: 600; letter-spacing: 0.04em; border: 1px solid; }
//   .sr2-badge.ok     { background: var(--c-green-dim);  color: var(--c-green);  border-color: rgba(5,150,105,0.25); }
//   .sr2-badge.low    { background: var(--c-amber-dim);  color: var(--c-amber);  border-color: rgba(217,115,22,0.25); }
//   .sr2-badge.high   { background: var(--c-red-dim);    color: var(--c-red);    border-color: rgba(220,38,38,0.25); }
//   .sr2-badge.edited { background: var(--c-violet-dim); color: var(--c-violet); border-color: rgba(124,58,237,0.2); font-family: 'JetBrains Mono', monospace; font-size: 9px; }
//   .sr2-tip-wrap { position: relative; display: inline-flex; }
//   .sr2-tip-box { position: absolute; z-index: 50; bottom: calc(100% + 8px); left: 50%; transform: translateX(-50%); width: 210px; background: var(--c-ink-2); color: #e2e8f0; font-size: 11px; border-radius: var(--radius-md); padding: 10px 12px; box-shadow: var(--shadow-lg); border: 1px solid rgba(255,255,255,0.08); pointer-events: none; }
//   .sr2-tip-title { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #60a5fa; margin-bottom: 7px; }
//   .sr2-tip-row { color: #94a3b8; line-height: 1.75; font-family: 'JetBrains Mono', monospace; font-size: 10.5px; }
//   .sr2-tip-row span { color: #e2e8f0; font-weight: 500; }
//   .sr2-tip-arrow { position: absolute; top: 100%; left: 50%; transform: translateX(-50%); border: 5px solid transparent; border-top-color: var(--c-ink-2); }
//   .sr2-info-btn { background: none; border: none; cursor: pointer; padding: 0; display: inline-flex; line-height: 0; }

//   .sr2-toggle { padding: 9px 14px; border-radius: var(--radius-sm); font-size: 13px; font-weight: 500; border: 1.5px solid var(--c-border); background: var(--c-surface); color: var(--c-ink-3); cursor: pointer; transition: all 0.12s; display: flex; align-items: center; gap: 8px; min-height: 42px; }
//   .sr2-toggle:hover { border-color: var(--c-ink-3); color: var(--c-ink); background: var(--c-surface-2); }
//   .sr2-toggle.on { background: var(--c-ink); border-color: var(--c-ink); color: #fff; box-shadow: 0 2px 8px rgba(13,17,23,0.2); }
//   .sr2-toggle.edited-on  { background: var(--c-violet); border-color: var(--c-violet); }
//   .sr2-toggle.edited-off { border-color: var(--c-violet); }

//   .sr2-dd-wrap { position: relative; }
//   .sr2-dd-btn { width: 100%; display: flex; align-items: flex-end; justify-content: space-between; padding: 18px 14px 8px 12px; border: 1.5px solid var(--c-border); border-radius: var(--radius-md); background: var(--c-surface); cursor: pointer; transition: all 0.15s; font-family: 'JetBrains Mono', monospace; font-size: 14px; font-weight: 500; color: var(--c-ink); min-height: 54px; }
//   .sr2-dd-btn.empty { color: transparent; }
//   .sr2-dd-btn.open, .sr2-dd-btn:focus { border-color: var(--c-blue); box-shadow: 0 0 0 3px var(--c-blue-glow); outline: none; }
//   .sr2-dd-label { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); font-size: 12px; font-weight: 600; color: var(--c-ink-4); text-transform: uppercase; letter-spacing: 0.05em; pointer-events: none; transition: all 0.15s ease; background: transparent; line-height: 1; white-space: nowrap; }
//   .sr2-dd-wrap.floated .sr2-dd-label { top: 0; transform: translateY(-50%); font-size: 9px; color: var(--c-blue); background: var(--c-surface); padding: 0 4px; left: 9px; }
//   .sr2-dd-menu { position: absolute; z-index: 40; top: calc(100% + 4px); left: 0; right: 0; background: var(--c-surface); border: 1.5px solid var(--c-border); border-radius: var(--radius-md); box-shadow: var(--shadow-lg); overflow-y: auto; max-height: 200px; }
//   .sr2-dd-item { width: 100%; text-align: left; padding: 11px 14px; font-size: 13.5px; font-weight: 400; color: var(--c-ink-3); background: none; border: none; cursor: pointer; display: flex; align-items: center; justify-content: space-between; transition: background 0.1s; min-height: 42px; }
//   .sr2-dd-item:hover    { background: var(--c-surface-2); color: var(--c-ink); }
//   .sr2-dd-item.selected { background: var(--c-ink); color: #fff; font-weight: 600; }

//   .sr2-ta-wrap { position: relative; border: 1.5px solid var(--c-border); border-radius: var(--radius-md); background: var(--c-surface); transition: all 0.15s; overflow: hidden; }
//   .sr2-ta-wrap:focus-within { border-color: var(--c-blue); box-shadow: 0 0 0 3px var(--c-blue-glow); }
//   .sr2-ta-wrap.err    { border-color: var(--c-red);    background: #fff8f8; }
//   .sr2-ta-wrap.edited { border-color: var(--c-violet); box-shadow: 0 0 0 3px rgba(124,58,237,0.1); }
//   .sr2-ta-label { position: absolute; left: 12px; top: 14px; font-size: 12px; font-weight: 600; color: var(--c-ink-4); text-transform: uppercase; letter-spacing: 0.05em; pointer-events: none; transition: all 0.15s ease; line-height: 1; }
//   .sr2-ta-wrap.floated .sr2-ta-label, .sr2-ta-wrap:focus-within .sr2-ta-label { top: 0; transform: translateY(-50%); font-size: 9px; color: var(--c-blue); background: var(--c-surface); padding: 0 4px; left: 9px; }
//   .sr2-ta { width: 100%; padding: 22px 14px 10px 12px; background: transparent; border: none; outline: none; resize: none; font-family: 'Outfit', sans-serif; font-size: 13.5px; color: var(--c-ink); }
//   .sr2-ta::placeholder { color: transparent; }
//   .sr2-char { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: var(--c-ink-4); text-align: right; padding: 2px 10px 6px; }

//   .sr2-ti-wrap { position: relative; border: 1.5px solid var(--c-border); border-radius: var(--radius-md); background: var(--c-surface); transition: all 0.15s; }
//   .sr2-ti-wrap:focus-within { border-color: var(--c-blue); box-shadow: 0 0 0 3px var(--c-blue-glow); }
//   .sr2-ti-wrap.err    { border-color: var(--c-red);    background: #fff8f8; }
//   .sr2-ti-wrap.edited { border-color: var(--c-violet); box-shadow: 0 0 0 3px rgba(124,58,237,0.1); }
//   .sr2-ti-label { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); font-size: 12px; font-weight: 600; color: var(--c-ink-4); text-transform: uppercase; letter-spacing: 0.05em; pointer-events: none; transition: all 0.15s ease; line-height: 1; white-space: nowrap; }
//   .sr2-ti-wrap.floated .sr2-ti-label, .sr2-ti-wrap:focus-within .sr2-ti-label { top: 0; transform: translateY(-50%); font-size: 9px; color: var(--c-blue); background: var(--c-surface); padding: 0 4px; left: 9px; }
//   .sr2-ti { width: 100%; padding: 18px 14px 8px 12px; background: transparent; border: none; outline: none; font-family: 'Outfit', sans-serif; font-size: 13.5px; color: var(--c-ink); min-height: 54px; }
//   .sr2-ti::placeholder { color: transparent; }

//   .sr2-action-bar { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; background: var(--c-surface); border: 1px solid var(--c-border); border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); flex-wrap: wrap; gap: 12px; }
//   .sr2-action-hint { display: flex; align-items: center; gap: 7px; font-size: 11.5px; color: var(--c-ink-4); }
//   .sr2-btn-ghost { display: flex; align-items: center; gap: 7px; padding: 10px 16px; border: 1.5px solid var(--c-border); border-radius: var(--radius-md); background: var(--c-surface); color: var(--c-ink-3); font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 600; letter-spacing: 0.02em; cursor: pointer; transition: all 0.15s; min-height: 42px; }
//   .sr2-btn-ghost:hover { border-color: var(--c-ink-2); color: var(--c-ink); background: var(--c-surface-2); }
//   .sr2-btn-primary { display: flex; align-items: center; gap: 8px; padding: 10px 24px; border-radius: var(--radius-md); background: var(--c-blue); color: #fff; font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 700; letter-spacing: 0.02em; border: none; cursor: pointer; transition: all 0.15s; box-shadow: 0 2px 8px rgba(37,99,235,0.3); min-height: 42px; }
//   .sr2-btn-primary:hover  { background: #1d4ed8; box-shadow: 0 4px 14px rgba(37,99,235,0.4); transform: translateY(-1px); }
//   .sr2-btn-primary:active { transform: translateY(0); }
//   .sr2-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
//   .sr2-btn-primary.edit { background: var(--c-violet); box-shadow: 0 2px 8px rgba(124,58,237,0.3); }
//   .sr2-btn-primary.edit:hover { background: #6d28d9; box-shadow: 0 4px 14px rgba(124,58,237,0.4); }
//   .sr2-spin-dot { width: 6px; height: 6px; border-radius: 50%; background: rgba(255,255,255,0.7); animation: pulse2 1.5s ease-in-out infinite; }

//   .sr2-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 24px; text-align: center; }
//   .sr2-empty-icon { width: 56px; height: 56px; background: var(--c-surface-2); border: 1.5px solid var(--c-border); border-radius: var(--radius-lg); display: flex; align-items: center; justify-content: center; margin-bottom: 16px; }

//   @media (max-width: 640px) {
//     .sr2-patient-body { grid-template-columns: 1fr 1fr; }
//     .sr2-patient-cell:nth-child(2) { border-right: none; }
//     .sr2-patient-cell:nth-child(3), .sr2-patient-cell:nth-child(4) { border-top: 1px solid var(--c-border); }
//     .sr2-patient-cell:nth-child(4) { border-right: none; }
//     .sr2-stats  { grid-template-columns: 1fr 1fr; }
//     .sr2-fields { grid-template-columns: 1fr 1fr; padding: 14px; gap: 10px; }
//     .sr2-btn-primary, .sr2-btn-ghost { padding: 10px 14px; font-size: 12px; }
//     .sr2-title  { font-size: 20px; }
//   }
//   @media (max-width: 380px) {
//     .sr2-fields { grid-template-columns: 1fr; }
//     .sr2-stats  { grid-template-columns: 1fr 1fr; }
//   }
// `;

// function StyleInjector() {
//   useEffect(() => {
//     const id = "sr2-styles-v1";
//     if (!document.getElementById(id)) {
//       const el = document.createElement("style");
//       el.id = id;
//       el.textContent = STYLES;
//       document.head.appendChild(el);
//     }
//   }, []);
//   return null;
// }

// // ─── Range Logic ──────────────────────────────────────────────────────────────

// export function getStandardRange(field, patientAge, patientGender) {
//   const sr = field.standardRange;
//   if (!sr || sr.type === "none") return null;
//   if (sr.type === "simple") return { min: parseFloat(sr.data.min), max: parseFloat(sr.data.max) };
//   if (sr.type === "age" && patientAge) {
//     const age = parseFloat(patientAge);
//     const row = sr.data.find((r) => age >= parseFloat(r.minAge) && age <= parseFloat(r.maxAge));
//     if (row) return { min: parseFloat(row.minValue), max: parseFloat(row.maxValue) };
//   }
//   if (sr.type === "gender" && patientGender) {
//     const g = sr.data[patientGender];
//     if (g) return { min: parseFloat(g.min), max: parseFloat(g.max) };
//   }
//   if (sr.type === "combined" && patientAge && patientGender) {
//     const age = parseFloat(patientAge);
//     const row = sr.data.find(
//       (r) => r.gender === patientGender && age >= parseFloat(r.minAge) && age <= parseFloat(r.maxAge),
//     );
//     if (row) return { min: parseFloat(row.minValue), max: parseFloat(row.maxValue) };
//   }
//   return null;
// }

// export function getRangeStatus(value, range) {
//   if (!range || value === "" || value === null || value === undefined) return "neutral";
//   const v = parseFloat(value);
//   if (isNaN(v)) return "neutral";
//   if (v < range.min) return "low";
//   if (v > range.max) return "high";
//   return "normal";
// }

// export function hydrateValuesFromReport(schema, existingReport) {
//   if (!existingReport || !schema?.sections) return {};
//   const values = {};
//   schema.sections.forEach((section, si) => {
//     const sectionData = existingReport[section.name];
//     if (!sectionData) return;
//     section.fields.forEach((field) => {
//       const key = `${si}_${field.name}`;
//       const fieldData = sectionData[field.name];
//       if (!fieldData) return;
//       values[key] = fieldData.value ?? fieldData;
//     });
//   });
//   return values;
// }

// // ─── Tooltip ─────────────────────────────────────────────────────────────────

// function RangeTooltip({ field }) {
//   const [open, setOpen] = useState(false);
//   const sr = field.standardRange;
//   if (!sr || sr.type === "none") return null;
//   return (
//     <div className="sr2-tip-wrap" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
//       <button className="sr2-info-btn" type="button">
//         <Info style={{ width: 12, height: 12, color: "var(--c-ink-4)" }} />
//       </button>
//       {open && (
//         <div className="sr2-tip-box">
//           <div className="sr2-tip-title">Reference Ranges</div>
//           {sr.type === "simple" && (
//             <div className="sr2-tip-row">
//               {sr.data.min} – {sr.data.max} {field.unit || ""}
//             </div>
//           )}
//           {sr.type === "age" &&
//             Array.isArray(sr.data) &&
//             sr.data.map((r, i) => (
//               <div key={i} className="sr2-tip-row">
//                 Age {r.minAge}–{r.maxAge === 999 ? "∞" : r.maxAge}:{" "}
//                 <span>
//                   {r.minValue}–{r.maxValue}
//                 </span>
//               </div>
//             ))}
//           {sr.type === "gender" &&
//             sr.data &&
//             Object.entries(sr.data).map(([g, v]) => (
//               <div key={g} className="sr2-tip-row" style={{ textTransform: "capitalize" }}>
//                 {g}:{" "}
//                 <span>
//                   {v.min}–{v.max}
//                 </span>
//               </div>
//             ))}
//           {sr.type === "combined" &&
//             Array.isArray(sr.data) &&
//             sr.data.map((r, i) => (
//               <div key={i} className="sr2-tip-row" style={{ textTransform: "capitalize" }}>
//                 {r.gender} {r.minAge}–{r.maxAge === 999 ? "∞" : r.maxAge}yr:{" "}
//                 <span>
//                   {r.minValue}–{r.maxValue}
//                 </span>
//               </div>
//             ))}
//           <div className="sr2-tip-arrow" />
//         </div>
//       )}
//     </div>
//   );
// }

// // ─── Number Field ─────────────────────────────────────────────────────────────

// function NumberField({ field, value, onChange, error, patientAge, patientGender, originalValue, isEditMode }) {
//   const range = getStandardRange(field, patientAge, patientGender);
//   const status = getRangeStatus(value, range);
//   const hasValue = value !== "" && value !== null && value !== undefined;
//   const isChanged = isEditMode && originalValue !== undefined && String(value) !== String(originalValue ?? "");

//   let cls = "sr2-field-wrap";
//   if (error) cls += " err";
//   else if (isChanged) cls += " edited";
//   else if (hasValue && range && status !== "neutral") cls += ` ${status === "normal" ? "ok" : status}`;
//   if (hasValue) cls += " floated";

//   return (
//     <div>
//       <div className={cls}>
//         <span className="sr2-float-label">
//           {field.name}
//           {field.required && <span className="sr2-req" />}
//         </span>
//         <input
//           type="number"
//           value={value}
//           onChange={(e) => onChange(e.target.value)}
//           placeholder=" "
//           className="sr2-num-input"
//           style={{ paddingRight: field.unit ? "62px" : "14px" }}
//         />
//         {field.unit && <span className="sr2-unit">{field.unit}</span>}
//       </div>
//       <div className="sr2-range-row">
//         {range ? (
//           <span className="sr2-range-text">
//             Ref:{" "}
//             <span>
//               {range.min}–{range.max}
//               {field.unit ? ` ${field.unit}` : ""}
//             </span>
//           </span>
//         ) : (
//           <span className="sr2-range-text">—</span>
//         )}
//         {hasValue && range && status !== "neutral" && (
//           <span className={`sr2-badge ${status === "normal" ? "ok" : status}`}>
//             {status === "normal" && <CheckCircle2 style={{ width: 9, height: 9 }} />}
//             {status === "low" && <TrendingDown style={{ width: 9, height: 9 }} />}
//             {status === "high" && <TrendingUp style={{ width: 9, height: 9 }} />}
//             {status === "normal" ? "Normal" : status === "low" ? "Low" : "High"}
//           </span>
//         )}
//         <RangeTooltip field={field} />
//         {isChanged && (
//           <span className="sr2-badge edited">
//             <Pencil style={{ width: 8, height: 8 }} />
//             edited
//           </span>
//         )}
//       </div>
//       {error && (
//         <div className="sr2-field-err">
//           <XCircle style={{ width: 11, height: 11, flexShrink: 0 }} />
//           {error}
//         </div>
//       )}
//     </div>
//   );
// }

// // ─── Radio ────────────────────────────────────────────────────────────────────

// function RadioField({ field, options = [], value, onChange, error, originalValue, isEditMode }) {
//   const isChanged = isEditMode && originalValue !== undefined && value !== (originalValue ?? "");
//   return (
//     <div>
//       <div style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
//         <span
//           style={{
//             fontSize: 11,
//             fontWeight: 700,
//             color: "var(--c-ink-4)",
//             textTransform: "uppercase",
//             letterSpacing: "0.07em",
//           }}
//         >
//           {field.name}
//           {field.required && <span className="sr2-req" style={{ marginLeft: 3 }} />}
//         </span>
//         {isChanged && (
//           <span className="sr2-badge edited">
//             <Pencil style={{ width: 8, height: 8 }} />
//             edited
//           </span>
//         )}
//       </div>
//       <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
//         {options.map((opt) => {
//           const sel = value === opt;
//           const optChanged = isEditMode && originalValue !== undefined && sel && value !== (originalValue ?? "");
//           return (
//             <button
//               key={opt}
//               type="button"
//               onClick={() => onChange(value === opt ? "" : opt)}
//               className={`sr2-toggle ${sel ? (optChanged ? "on edited-on" : "on") : optChanged ? "edited-off" : ""}`}
//             >
//               <span
//                 style={{
//                   display: "inline-block",
//                   width: 12,
//                   height: 12,
//                   borderRadius: "50%",
//                   flexShrink: 0,
//                   border: `2px solid ${sel ? "rgba(255,255,255,0.5)" : "var(--c-border-2)"}`,
//                   background: sel ? "#fff" : "transparent",
//                   boxShadow: sel ? "inset 0 0 0 2.5px var(--c-ink)" : "none",
//                 }}
//               />
//               {opt}
//             </button>
//           );
//         })}
//       </div>
//       {error && (
//         <div className="sr2-field-err" style={{ marginTop: 6 }}>
//           <XCircle style={{ width: 11, height: 11, flexShrink: 0 }} />
//           {error}
//         </div>
//       )}
//     </div>
//   );
// }

// // ─── Dropdown ─────────────────────────────────────────────────────────────────

// function DropdownField({ field, options = [], value, onChange, error, originalValue, isEditMode }) {
//   const [open, setOpen] = useState(false);
//   const floated = !!value;
//   const isChanged = isEditMode && originalValue !== undefined && value !== (originalValue ?? "");
//   return (
//     <div>
//       <div className={`sr2-dd-wrap ${floated ? "floated" : ""}`}>
//         <button
//           type="button"
//           onClick={() => setOpen(!open)}
//           className={`sr2-dd-btn ${!value ? "empty" : ""} ${open ? "open" : ""}`}
//           style={isChanged ? { borderColor: "var(--c-violet)", boxShadow: "0 0 0 3px rgba(124,58,237,0.1)" } : {}}
//         >
//           <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 14, fontWeight: 500 }}>{value || ""}</span>
//           <ChevronDown
//             className={`sr2-chevron ${open ? "open" : ""}`}
//             style={{ width: 15, height: 15, color: "var(--c-ink-4)" }}
//           />
//         </button>
//         <span className="sr2-dd-label">
//           {field.name}
//           {field.required && <span className="sr2-req" />}
//         </span>
//         {open && (
//           <div className="sr2-dd-menu">
//             {options.map((opt) => (
//               <button
//                 key={opt}
//                 type="button"
//                 className={`sr2-dd-item ${value === opt ? "selected" : ""}`}
//                 onClick={() => {
//                   onChange(opt);
//                   setOpen(false);
//                 }}
//               >
//                 {opt}
//                 {value === opt && <CheckCircle2 style={{ width: 13, height: 13 }} />}
//               </button>
//             ))}
//           </div>
//         )}
//       </div>
//       {isChanged && (
//         <div style={{ marginTop: 5 }}>
//           <span className="sr2-badge edited">
//             <Pencil style={{ width: 8, height: 8 }} />
//             edited
//           </span>
//         </div>
//       )}
//       {error && (
//         <div className="sr2-field-err" style={{ marginTop: 5 }}>
//           <XCircle style={{ width: 11, height: 11, flexShrink: 0 }} />
//           {error}
//         </div>
//       )}
//     </div>
//   );
// }

// // ─── Checkbox ─────────────────────────────────────────────────────────────────

// function CheckboxField({ field, options = [], value = [], onChange, error, originalValue, isEditMode }) {
//   const toggle = (opt) => onChange(value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt]);
//   const origArr = Array.isArray(originalValue) ? originalValue : [];
//   const isChanged =
//     isEditMode &&
//     originalValue !== undefined &&
//     JSON.stringify([...(value || [])].sort()) !== JSON.stringify([...origArr].sort());
//   return (
//     <div>
//       <div style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
//         <span
//           style={{
//             fontSize: 11,
//             fontWeight: 700,
//             color: "var(--c-ink-4)",
//             textTransform: "uppercase",
//             letterSpacing: "0.07em",
//           }}
//         >
//           {field.name}
//           {field.required && <span className="sr2-req" style={{ marginLeft: 3 }} />}
//         </span>
//         {isChanged && (
//           <span className="sr2-badge edited">
//             <Pencil style={{ width: 8, height: 8 }} />
//             edited
//           </span>
//         )}
//       </div>
//       <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
//         {options.map((opt) => {
//           const checked = value.includes(opt);
//           const optChanged = isEditMode && originalValue !== undefined && checked !== origArr.includes(opt);
//           return (
//             <button
//               key={opt}
//               type="button"
//               onClick={() => toggle(opt)}
//               className={`sr2-toggle ${checked ? (optChanged ? "on edited-on" : "on") : optChanged ? "edited-off" : ""}`}
//             >
//               <span
//                 style={{
//                   width: 14,
//                   height: 14,
//                   borderRadius: 3,
//                   flexShrink: 0,
//                   border: `2px solid ${checked ? "rgba(255,255,255,0.5)" : "var(--c-border-2)"}`,
//                   background: checked ? "#fff" : "transparent",
//                   display: "flex",
//                   alignItems: "center",
//                   justifyContent: "center",
//                 }}
//               >
//                 {checked && (
//                   <svg width="8" height="7" viewBox="0 0 10 8" fill="none">
//                     <path
//                       d="M1 4L3.5 6.5L9 1"
//                       stroke="var(--c-ink)"
//                       strokeWidth="2.5"
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                     />
//                   </svg>
//                 )}
//               </span>
//               {opt}
//             </button>
//           );
//         })}
//       </div>
//       {error && (
//         <div className="sr2-field-err" style={{ marginTop: 6 }}>
//           <XCircle style={{ width: 11, height: 11, flexShrink: 0 }} />
//           {error}
//         </div>
//       )}
//     </div>
//   );
// }

// // ─── Textarea ─────────────────────────────────────────────────────────────────

// function TextareaField({ field, value, onChange, error, originalValue, isEditMode }) {
//   const floated = !!(value && value.length > 0);
//   const isChanged = isEditMode && originalValue !== undefined && value !== (originalValue ?? "");
//   return (
//     <div>
//       <div className={`sr2-ta-wrap ${error ? "err" : ""} ${floated ? "floated" : ""} ${isChanged ? "edited" : ""}`}>
//         <span className="sr2-ta-label">
//           {field.name}
//           {field.required && <span className="sr2-req" />}
//         </span>
//         <textarea
//           value={value}
//           onChange={(e) => onChange(e.target.value)}
//           maxLength={field.maxLength}
//           rows={3}
//           placeholder=" "
//           className="sr2-ta"
//         />
//         <div className="sr2-char">
//           {(value || "").length}/{field.maxLength}
//         </div>
//       </div>
//       {isChanged && (
//         <div style={{ marginTop: 5 }}>
//           <span className="sr2-badge edited">
//             <Pencil style={{ width: 8, height: 8 }} />
//             edited
//           </span>
//         </div>
//       )}
//       {error && (
//         <div className="sr2-field-err" style={{ marginTop: 5 }}>
//           <XCircle style={{ width: 11, height: 11, flexShrink: 0 }} />
//           {error}
//         </div>
//       )}
//     </div>
//   );
// }

// // ─── Text Input ───────────────────────────────────────────────────────────────

// function TextInputField({ field, value, onChange, error, originalValue, isEditMode }) {
//   const floated = !!(value && value.length > 0);
//   const isChanged = isEditMode && originalValue !== undefined && value !== (originalValue ?? "");
//   return (
//     <div>
//       <div className={`sr2-ti-wrap ${error ? "err" : ""} ${floated ? "floated" : ""} ${isChanged ? "edited" : ""}`}>
//         <span className="sr2-ti-label">
//           {field.name}
//           {field.required && <span className="sr2-req" />}
//         </span>
//         <input
//           type="text"
//           value={value}
//           onChange={(e) => onChange(e.target.value)}
//           maxLength={field.maxLength}
//           placeholder=" "
//           className="sr2-ti"
//         />
//         <div className="sr2-char" style={{ position: "absolute", right: 0, bottom: 0, padding: "2px 10px 4px" }}>
//           {(value || "").length}/{field.maxLength}
//         </div>
//       </div>
//       {isChanged && (
//         <div style={{ marginTop: 5 }}>
//           <span className="sr2-badge edited">
//             <Pencil style={{ width: 8, height: 8 }} />
//             edited
//           </span>
//         </div>
//       )}
//       {error && (
//         <div className="sr2-field-err" style={{ marginTop: 5 }}>
//           <XCircle style={{ width: 11, height: 11, flexShrink: 0 }} />
//           {error}
//         </div>
//       )}
//     </div>
//   );
// }

// // ─── Section Panel ────────────────────────────────────────────────────────────

// function SectionPanel({
//   section,
//   sectionIndex,
//   values,
//   onChange,
//   errors,
//   patientAge,
//   patientGender,
//   hideTitle,
//   originalValues,
//   isEditMode,
// }) {
//   const [collapsed, setCollapsed] = useState(false);
//   const fieldCount = section.fields.length;
//   const filledCount = section.fields.filter((f) => {
//     const v = values[`${sectionIndex}_${f.name}`];
//     return Array.isArray(v) ? v.length > 0 : v !== "" && v !== undefined && v !== null;
//   }).length;
//   const hasError = section.fields.some((f) => errors[`${sectionIndex}_${f.name}`]);
//   const complete = filledCount === fieldCount && fieldCount > 0;
//   const pct = fieldCount > 0 ? (filledCount / fieldCount) * 100 : 0;

//   const grid = (
//     <div className="sr2-fields">
//       {section.fields.map((field) => {
//         const key = `${sectionIndex}_${field.name}`;
//         const val = values[key] ?? (field.type === "checkbox" ? [] : "");
//         const err = errors[key];
//         const origVal = originalValues ? originalValues[key] : undefined;
//         const full = field.type === "textarea" || field.type === "checkbox" || field.type === "radio";
//         return (
//           <div key={key} style={full ? { gridColumn: "1 / -1" } : {}}>
//             {field.type === "number" && (
//               <NumberField
//                 field={field}
//                 value={val}
//                 onChange={(v) => onChange(key, v)}
//                 error={err}
//                 patientAge={patientAge}
//                 patientGender={patientGender}
//                 originalValue={origVal}
//                 isEditMode={isEditMode}
//               />
//             )}
//             {field.type === "radio" && (
//               <RadioField
//                 field={field}
//                 options={field.options}
//                 value={val}
//                 onChange={(v) => onChange(key, v)}
//                 error={err}
//                 originalValue={origVal}
//                 isEditMode={isEditMode}
//               />
//             )}
//             {field.type === "select" && (
//               <DropdownField
//                 field={field}
//                 options={field.options}
//                 value={val}
//                 onChange={(v) => onChange(key, v)}
//                 error={err}
//                 originalValue={origVal}
//                 isEditMode={isEditMode}
//               />
//             )}
//             {field.type === "checkbox" && (
//               <CheckboxField
//                 field={field}
//                 options={field.options}
//                 value={val}
//                 onChange={(v) => onChange(key, v)}
//                 error={err}
//                 originalValue={origVal}
//                 isEditMode={isEditMode}
//               />
//             )}
//             {field.type === "textarea" && (
//               <TextareaField
//                 field={field}
//                 value={val}
//                 onChange={(v) => onChange(key, v)}
//                 error={err}
//                 originalValue={origVal}
//                 isEditMode={isEditMode}
//               />
//             )}
//             {field.type === "input" && (
//               <TextInputField
//                 field={field}
//                 value={val}
//                 onChange={(v) => onChange(key, v)}
//                 error={err}
//                 originalValue={origVal}
//                 isEditMode={isEditMode}
//               />
//             )}
//           </div>
//         );
//       })}
//     </div>
//   );

//   if (hideTitle) return <div style={{ background: "var(--c-surface)", borderRadius: "var(--radius-lg)" }}>{grid}</div>;

//   return (
//     <div className={`sr2-section ${hasError ? "has-error" : ""}`}>
//       <button
//         type="button"
//         onClick={() => setCollapsed(!collapsed)}
//         className={`sr2-section-head ${hasError ? "error" : ""}`}
//       >
//         <div className={`sr2-section-num ${complete ? "done" : hasError ? "err" : ""}`}>{sectionIndex + 1}</div>
//         <span className="sr2-section-name">{section.name}</span>
//         <span className={`sr2-section-badge ${complete ? "done" : ""}`}>
//           {filledCount}/{fieldCount}
//         </span>
//         <ChevronDown className={`sr2-chevron ${!collapsed ? "open" : ""}`} style={{ width: 15, height: 15 }} />
//       </button>
//       <div className="sr2-section-bar">
//         <div className="sr2-section-bar-fill" style={{ width: `${pct}%` }} />
//       </div>
//       {!collapsed && grid}
//     </div>
//   );
// }

// // ─── Patient Banner ───────────────────────────────────────────────────────────

// function PatientBanner({ invoice }) {
//   const { patient } = invoice;
//   return (
//     <div className="sr2-patient">
//       <div className="sr2-patient-head">
//         <User style={{ width: 13, height: 13, color: "#60a5fa" }} />
//         <span className="sr2-patient-head-label">Patient Record</span>
//         <span className="sr2-patient-head-id">{invoice.invoiceId}</span>
//       </div>
//       <div className="sr2-patient-body">
//         {[
//           { label: "Full Name", val: patient.name },
//           { label: "Age", val: `${patient.age} yrs` },
//           { label: "Gender", val: patient.gender, cap: true },
//           { label: "Contact", val: patient.contactNumber },
//         ].map((c) => (
//           <div key={c.label} className="sr2-patient-cell">
//             <div className="sr2-patient-cell-label">{c.label}</div>
//             <div className="sr2-patient-cell-val" style={{ textTransform: c.cap ? "capitalize" : undefined }}>
//               {c.val}
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// // ─── Build Payload ────────────────────────────────────────────────────────────

// function buildPayload(schema, values, patientAge, patientGender) {
//   const report = {};
//   schema.sections.forEach((sec, si) => {
//     const sd = {};
//     sec.fields.forEach((field) => {
//       const key = `${si}_${field.name}`;
//       const val = values[key];
//       if (val !== "" && val !== undefined && val !== null && !(Array.isArray(val) && val.length === 0)) {
//         sd[field.name] = {
//           value: val,
//           ...(field.unit ? { unit: field.unit } : {}),
//           ...(field.type === "number"
//             ? (() => {
//                 const range = getStandardRange(field, patientAge, patientGender);
//                 return range ? { referenceRange: `${range.min}–${range.max}` } : {};
//               })()
//             : {}),
//         };
//       }
//     });
//     if (Object.keys(sd).length > 0) report[sec.name] = { ...sd, __showTitle: sec.showTitleInReport !== false };
//   });

//   return { ...report, name: schema.name };
// }

// // ─── Main Component ───────────────────────────────────────────────────────────

// function SchemaRenderer({ schema, invoice, onSubmit, onUpdate, loading = false, existingReport = null }) {
//   const isEditMode = Boolean(existingReport);
//   const computeInitial = () => (isEditMode ? hydrateValuesFromReport(schema, existingReport) : {});

//   const [values, setValues] = useState(computeInitial);
//   const [errors, setErrors] = useState({});
//   const [originalValues] = useState(() => (isEditMode ? hydrateValuesFromReport(schema, existingReport) : {}));
//   const patientAge = invoice?.patient?.age ?? existingReport?.patientAge ?? "";
//   const patientGender = invoice?.patient?.gender ?? existingReport?.patientGender ?? "";

//   if (!schema || !schema.sections) return null;

//   useEffect(() => {
//     setValues(computeInitial());
//     setErrors({});
//   }, [JSON.stringify(schema?.sections), JSON.stringify(existingReport)]);

//   const handleChange = (key, val) => {
//     setValues((v) => ({ ...v, [key]: val }));
//     if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
//   };

//   const validate = () => {
//     const errs = {};
//     schema.sections.forEach((sec, si) => {
//       sec.fields.forEach((field) => {
//         if (!field.required) return;
//         const key = `${si}_${field.name}`;
//         const val = values[key];
//         if (field.type === "checkbox") {
//           if (!val || val.length === 0) errs[key] = "At least one option is required";
//         } else {
//           if (val === "" || val === undefined || val === null) errs[key] = "This field is required";
//         }
//       });
//     });
//     return errs;
//   };

//   const allKeys = schema.sections.flatMap((sec, si) => sec.fields.map((f) => `${si}_${f.name}`));

//   const changedCount = isEditMode
//     ? Object.keys(originalValues).filter((k) => {
//         const cur = values[k],
//           orig = originalValues[k];
//         if (Array.isArray(orig)) return JSON.stringify([...(cur || [])].sort()) !== JSON.stringify([...orig].sort());
//         return String(cur ?? "") !== String(orig ?? "");
//       }).length
//     : 0;

//   const newlyFilled = isEditMode
//     ? allKeys.filter((k) => {
//         const cur = values[k],
//           orig = originalValues[k];
//         const empty = (v) => v === "" || v === undefined || v === null || (Array.isArray(v) && v.length === 0);
//         return empty(orig) && !empty(cur);
//       }).length
//     : 0;

//   const totalChanges = changedCount + newlyFilled;

//   const handleSubmit = () => {
//     const errs = validate();
//     if (Object.keys(errs).length > 0) {
//       setErrors(errs);
//       return;
//     }
//     setErrors({});
//     const payload = buildPayload(schema, values, patientAge, patientGender);
//     if (isEditMode) onUpdate?.(payload);
//     else onSubmit?.(payload);
//   };

//   const handleReset = () => {
//     setValues(isEditMode ? hydrateValuesFromReport(schema, existingReport) : {});
//     setErrors({});
//   };

//   const hasFields = schema.sections.some((s) => s.fields.length > 0);
//   const totalFields = allKeys.length;
//   const totalFilled = allKeys.filter((k) => {
//     const v = values[k];
//     return Array.isArray(v) ? v.length > 0 : v !== "" && v !== undefined && v !== null;
//   }).length;
//   const progress = totalFields > 0 ? (totalFilled / totalFields) * 100 : null;

//   const numStatuses = schema.sections.flatMap((sec, si) =>
//     sec.fields
//       .filter((f) => f.type === "number")
//       .map((f) => {
//         const range = getStandardRange(f, patientAge, patientGender);
//         return getRangeStatus(values[`${si}_${f.name}`], range);
//       }),
//   );
//   const abnormalCount = numStatuses.filter((s) => s === "high" || s === "low").length;
//   const normalCount = numStatuses.filter((s) => s === "normal").length;

//   if (!hasFields) {
//     return (
//       <div className="sr2">
//         <StyleInjector />
//         <div className="sr2-empty">
//           <div className="sr2-empty-icon">
//             <Eye style={{ width: 22, height: 22, color: "var(--c-border-2)" }} />
//           </div>
//           <p style={{ fontWeight: 700, color: "var(--c-ink-3)", fontSize: 14 }}>No fields configured</p>
//           <p style={{ color: "var(--c-ink-4)", fontSize: 13, marginTop: 4 }}>Add fields in the Builder to preview</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="sr2">
//       <StyleInjector />
//       <div style={{ maxWidth: 1600, margin: "0 auto", padding: "28px 20px 56px" }}>
//         {/* Edit mode ribbon */}
//         {isEditMode && (
//           <div className="sr2-ribbon edit">
//             <span className="dot" />
//             <Pencil style={{ width: 12, height: 12 }} />
//             <span style={{ fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>
//               Edit Mode
//             </span>
//             <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, opacity: 0.6, marginLeft: 2 }}>
//               — Modifying existing report
//             </span>
//             {totalChanges > 0 && (
//               <span
//                 style={{
//                   marginLeft: "auto",
//                   fontFamily: "'JetBrains Mono',monospace",
//                   fontSize: 10,
//                   background: "rgba(124,58,237,0.15)",
//                   color: "var(--c-violet)",
//                   padding: "2px 9px",
//                   borderRadius: 20,
//                   fontWeight: 600,
//                 }}
//               >
//                 {totalChanges} change{totalChanges !== 1 ? "s" : ""}
//               </span>
//             )}
//           </div>
//         )}

//         {/* Header card */}
//         <div className="sr2-header">
//           <div className="sr2-header-top">
//             <div className={`sr2-icon-box ${isEditMode ? "edit" : "default"}`}>
//               {isEditMode ? (
//                 <Pencil style={{ width: 18, height: 18, color: "#fff" }} />
//               ) : (
//                 <Activity style={{ width: 18, height: 18, color: "#60a5fa" }} />
//               )}
//             </div>
//             <div style={{ flex: 1, minWidth: 0 }}>
//               <div className="sr2-meta">
//                 <span style={{ fontFamily: "'JetBrains Mono',monospace" }}>
//                   {isEditMode ? "Lab Report · Edit" : "Lab Report Entry"}
//                 </span>
//                 <span className="sr2-meta-dot" />
//                 <span style={{ color: schema.isActive ? "var(--c-green)" : "var(--c-ink-4)" }}>
//                   {schema.isActive ? "● Active" : "○ Inactive"}
//                 </span>
//               </div>
//               <h1 className="sr2-title">{schema.name || "Untitled Schema"}</h1>
//               {schema.description && <p className="sr2-desc">{schema.description}</p>}
//             </div>
//           </div>

//           <div className="sr2-stats">
//             {progress !== null && (
//               <div className="sr2-stat">
//                 <span className="sr2-stat-label">Progress</span>
//                 <span className={`sr2-stat-val ${progress === 100 ? "green" : "blue"}`}>{Math.round(progress)}%</span>
//               </div>
//             )}
//             <div className="sr2-stat">
//               <span className="sr2-stat-label">Filled</span>
//               <span className="sr2-stat-val">
//                 {totalFilled}
//                 <span style={{ fontSize: 13, color: "var(--c-ink-4)", fontWeight: 400 }}>/{totalFields}</span>
//               </span>
//             </div>
//             <div className="sr2-stat">
//               <span className="sr2-stat-label">In Range</span>
//               <span className={`sr2-stat-val ${normalCount > 0 ? "green" : ""}`}>{normalCount}</span>
//             </div>
//             <div className="sr2-stat">
//               <span className="sr2-stat-label">Abnormal</span>
//               <span className={`sr2-stat-val ${abnormalCount > 0 ? "red" : ""}`}>{abnormalCount}</span>
//             </div>
//             {isEditMode && (
//               <div className="sr2-stat">
//                 <span className="sr2-stat-label">Changes</span>
//                 <span className={`sr2-stat-val ${totalChanges > 0 ? "violet" : ""}`}>{totalChanges}</span>
//               </div>
//             )}
//           </div>

//           {progress !== null && (
//             <div className="sr2-progress-wrap">
//               <div className="sr2-progress-row">
//                 <span className="sr2-progress-label">Completion</span>
//                 <span className="sr2-progress-count">
//                   {totalFilled} / {totalFields} fields
//                 </span>
//               </div>
//               <div className="sr2-track">
//                 <div className={`sr2-fill ${progress === 100 ? "complete" : ""}`} style={{ width: `${progress}%` }} />
//               </div>
//             </div>
//           )}
//         </div>

//         {/* Alerts */}
//         {abnormalCount > 0 && (
//           <div className="sr2-alert amber">
//             <AlertTriangle style={{ width: 16, height: 16, color: "var(--c-amber)", flexShrink: 0, marginTop: 1 }} />
//             <div>
//               <div className="sr2-alert-title">Abnormal Values Detected</div>
//               <div className="sr2-alert-body">
//                 {abnormalCount} result{abnormalCount > 1 ? "s" : ""} outside the standard reference range — please
//                 review before submitting.
//               </div>
//             </div>
//           </div>
//         )}

//         {isEditMode && totalChanges > 0 && (
//           <div className="sr2-alert violet">
//             <Pencil style={{ width: 15, height: 15, color: "var(--c-violet)", flexShrink: 0, marginTop: 1 }} />
//             <div>
//               <div className="sr2-alert-title">Unsaved Changes</div>
//               <div className="sr2-alert-body">
//                 {totalChanges} change{totalChanges !== 1 ? "s" : ""} pending. Edited fields are highlighted in purple.
//                 Click <strong>Update Report</strong> to save.
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Patient banner */}
//         {invoice && <PatientBanner invoice={invoice} />}

//         {/* Sections */}
//         <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
//           {schema.sections.map((section, si) => (
//             <SectionPanel
//               key={si}
//               section={section}
//               sectionIndex={si}
//               values={values}
//               onChange={handleChange}
//               errors={errors}
//               patientAge={patientAge}
//               patientGender={patientGender}
//               hideTitle={section.showTitleInReport === false}
//               originalValues={isEditMode ? originalValues : undefined}
//               isEditMode={isEditMode}
//             />
//           ))}
//         </div>

//         {/* Static range note */}
//         {schema.hasStaticStandardRange && schema.staticStandardRange && (
//           <div className="sr2-alert amber" style={{ marginBottom: 12 }}>
//             <Info style={{ width: 15, height: 15, color: "var(--c-amber)", flexShrink: 0, marginTop: 1 }} />
//             <div>
//               <div className="sr2-alert-title">Standard Reference</div>
//               <div className="sr2-alert-body">{schema.staticStandardRange}</div>
//             </div>
//           </div>
//         )}

//         {/* Validation errors */}
//         {Object.keys(errors).length > 0 && (
//           <div className="sr2-alert red" style={{ marginBottom: 12 }}>
//             <XCircle style={{ width: 15, height: 15, color: "var(--c-red)", flexShrink: 0, marginTop: 1 }} />
//             <div>
//               <div className="sr2-alert-title">Validation Failed</div>
//               <div className="sr2-alert-body">
//                 {Object.keys(errors).length} field{Object.keys(errors).length > 1 ? "s" : ""} require attention before
//                 submitting.
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Action bar */}
//         <div className="sr2-action-bar">
//           <div className="sr2-action-hint">
//             <ShieldCheck style={{ width: 14, height: 14 }} />
//             <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11 }}>
//               {isEditMode ? "Editing existing report" : "Form validated on submit"}
//             </span>
//           </div>
//           <div style={{ display: "flex", gap: 10 }}>
//             <button
//               type="button"
//               className="sr2-btn-ghost"
//               onClick={handleReset}
//               title={isEditMode ? "Revert all changes" : "Clear all fields"}
//             >
//               <RotateCcw style={{ width: 13, height: 13 }} />
//               {isEditMode ? "Revert" : "Reset"}
//             </button>
//             <button
//               type="button"
//               className={`sr2-btn-primary ${isEditMode ? "edit" : ""}`}
//               disabled={loading || (isEditMode && totalChanges === 0)}
//               onClick={handleSubmit}
//             >
//               {loading ? (
//                 <span className="sr2-spin-dot" />
//               ) : isEditMode ? (
//                 <Save style={{ width: 14, height: 14 }} />
//               ) : (
//                 <Send style={{ width: 14, height: 14 }} />
//               )}
//               {loading
//                 ? isEditMode
//                   ? "Updating…"
//                   : "Submitting…"
//                 : isEditMode
//                   ? totalChanges > 0
//                     ? `Update Report (${totalChanges})`
//                     : "No Changes"
//                   : "Submit Report"}
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default SchemaRenderer;
