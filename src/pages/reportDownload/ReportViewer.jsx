import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import {
  FlaskConical,
  MapPin,
  Mail,
  Phone,
  User,
  Calendar,
  Stethoscope,
  Hash,
  ClipboardList,
  TrendingDown,
  TrendingUp,
  Share2,
  Printer,
  Download,
  ChevronDown,
  Check,
  CheckCircle2,
  FileText,
  Loader2,
} from "lucide-react";
import { ReportPDFDocument } from "./ReportPDF";

const LAB_INFO = {
  name: "MediScan Diagnostics",
  tagline: "Precision Medicine · Trusted Results",
  address: "House 12, Road 5, Dhanmondi, Dhaka-1205, Bangladesh",
  email: "reports@mediscan.com.bd",
  phone: "+880 1711-000000",
  regNo: "DGDA/LAB/2024/0042",
};

const EMPTY_PATIENT = {
  name: "",
  age: "",
  gender: "",
  contact: "",
  referredBy: "",
  sampleDate: "",
  reportDate: "",
};

const REPORT_META_KEYS = new Set(["_id", "name", "reportDate", "sampleCollectionDate"]);

function parseRange(ref) {
  if (!ref) return null;
  const m = ref.match(/^([\d.]+)\s*[–\-]\s*([\d.]+)$/);
  if (!m) return null;
  return { min: parseFloat(m[1]), max: parseFloat(m[2]) };
}

function fmt(num) {
  return num
    .toFixed(3)
    .replace(/\.?0+$/, "")
    .replace(/^0\./, ".");
}
function fmtLow(num) {
  return num.toFixed(3).replace(/\.?0+$/, "");
}

function getStatusInfo(value, ref) {
  const n = parseFloat(value);
  if (isNaN(n) || !ref) return null;
  const r = parseRange(ref);
  if (!r) return null;
  if (n > r.max) return { status: "high", label: `Higher (${fmt(n / r.max)}x)` };
  if (n < r.min) {
    if (r.min === 0) return { status: "low", label: "Low" };
    return { status: "low", label: `Lower (${fmtLow(n / r.min)}x)` };
  }
  return { status: "normal", label: "Normal" };
}

function getStatus(value, ref) {
  const info = getStatusInfo(value, ref);
  return info ? info.status : null;
}

function isResultField(field) {
  if (!field || typeof field !== "object") return false;
  return Boolean(field.referenceRange) || Boolean(field.unit);
}

function getSectionEntries(sectionData) {
  return Object.entries(sectionData).filter(([key]) => key !== "__showTitle");
}

// ── Status pill ───────────────────────────────────────────────────────────────
function StatusPill({ value, ref }) {
  const info = getStatusInfo(value, ref);
  if (!info) return <span className="text-xs text-slate-300">—</span>;

  const cfg = {
    normal: { cls: "bg-emerald-100 text-emerald-800 border-emerald-300", Icon: CheckCircle2 },
    low: { cls: "bg-amber-100  text-amber-800  border-amber-300", Icon: TrendingDown },
    high: { cls: "bg-red-100    text-red-800    border-red-300", Icon: TrendingUp },
  }[info.status];

  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border whitespace-nowrap ${cfg.cls}`}
    >
      <cfg.Icon className="w-2.5 h-2.5 flex-shrink-0" />
      {info.label}
    </span>
  );
}

const ROW_STYLE = {
  high: { row: "bg-red-50", value: "text-red-700" },
  low: { row: "bg-amber-50", value: "text-amber-800" },
  normal: { row: "bg-emerald-50/50", value: "text-slate-900" },
};

function ResultRow({ name, field, hasUnits }) {
  const value = String(field.value ?? "");
  const unit = field.unit || "";
  const ref = field.referenceRange || "";
  const info = getStatusInfo(value, ref);
  const style = info ? (ROW_STYLE[info.status] ?? {}) : {};

  return (
    <tr className={style.row ?? ""}>
      <td className="pl-4 pr-3 py-2.5 text-sm text-slate-700 border-b border-slate-100">{name}</td>
      <td
        className={`px-3 py-2.5 text-sm font-bold tabular-nums border-b border-slate-100 ${style.value ?? "text-slate-900"}`}
      >
        {value}
      </td>
      {hasUnits && (
        <td className="px-3 py-2.5 text-[10px] font-semibold text-slate-500 uppercase border-b border-slate-100">
          {unit || <span className="text-slate-300">—</span>}
        </td>
      )}
      <td className="px-3 py-2.5 text-xs text-slate-500 border-b border-slate-100 tabular-nums">
        {ref || <span className="text-slate-300">—</span>}
      </td>
      <td className="px-3 pr-4 py-2.5 border-b border-slate-100">
        <StatusPill value={value} ref={ref} />
      </td>
    </tr>
  );
}

function PlainRow({ name, field, colSpan }) {
  const val = Array.isArray(field.value) ? field.value.join(", ") : String(field.value ?? "—");
  return (
    <tr className="odd:bg-white even:bg-slate-50/30">
      <td className="pl-4 pr-3 py-2.5 text-sm text-slate-500 border-b border-slate-100">{name}</td>
      <td className="px-3 pr-4 py-2.5 text-sm font-semibold text-slate-800 border-b border-slate-100" colSpan={colSpan}>
        {val || "—"}
      </td>
    </tr>
  );
}

// ── Section — no badge/letter, just the name ──────────────────────────────────
function Section({ sectionName, sectionData, showHeader }) {
  const [collapsed, setCollapsed] = useState(false);
  const entries = getSectionEntries(sectionData);
  const resultEntries = entries.filter(([, v]) => isResultField(v));
  const plainEntries = entries.filter(([, v]) => !isResultField(v));
  const hasUnits = resultEntries.some(([, v]) => Boolean(v.unit));

  const tableBody = (
    <>
      {resultEntries.length > 0 && (
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="pl-4 pr-3 py-1.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider w-[34%]">
                Parameter
              </th>
              <th className="px-3 py-1.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider w-[16%]">
                Result
              </th>
              {hasUnits && (
                <th className="px-3 py-1.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider w-[12%]">
                  Unit
                </th>
              )}
              <th className="px-3 py-1.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider w-[24%]">
                Ref. Range
              </th>
              <th className="px-3 pr-4 py-1.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider w-[18%]">
                Status (1 is base)
              </th>
            </tr>
          </thead>
          <tbody>
            {resultEntries.map(([n, f]) => (
              <ResultRow key={n} name={n} field={f} hasUnits={hasUnits} />
            ))}
          </tbody>
        </table>
      )}
      {plainEntries.length > 0 && (
        <table className={`w-full border-collapse ${resultEntries.length > 0 ? "border-t border-slate-200" : ""}`}>
          <tbody>
            {plainEntries.map(([n, f]) => (
              <PlainRow key={n} name={n} field={f} colSpan={hasUnits ? 4 : 3} />
            ))}
          </tbody>
        </table>
      )}
    </>
  );

  if (!showHeader) {
    return <div className="rounded-lg overflow-hidden border border-sky-100 mb-2.5">{tableBody}</div>;
  }

  return (
    <div className="rounded-lg overflow-hidden border border-sky-100 mb-2.5 shadow-sm">
      {/* ── Section header: sky blue, name only, no badge ── */}
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors"
        style={{ background: "linear-gradient(90deg, #0ea5e9 0%, #38bdf8 100%)" }}
      >
        <span className="text-sm font-semibold text-white tracking-wide">{sectionName}</span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-sky-100 font-medium">
            {entries.length} parameter{entries.length !== 1 ? "s" : ""}
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-sky-100 transition-transform flex-shrink-0 ${collapsed ? "" : "rotate-180"}`}
          />
        </div>
      </button>
      {!collapsed && <div>{tableBody}</div>}
    </div>
  );
}

function SummaryStrip({ sections }) {
  let normal = 0,
    low = 0,
    high = 0;
  sections.forEach(([, sec]) => {
    getSectionEntries(sec).forEach(([, field]) => {
      if (!isResultField(field)) return;
      const s = getStatus(field.value, field.referenceRange);
      if (s === "normal") normal++;
      else if (s === "low") low++;
      else if (s === "high") high++;
    });
  });
  const total = normal + low + high;
  if (total === 0) return null;
  return (
    <div className="flex items-center gap-1 text-xs">
      <ClipboardList className="w-3 h-3 text-sky-400 mr-1 flex-shrink-0" />
      <span className="text-slate-500 font-medium">{total} parameters:</span>
      <span className="font-bold text-emerald-600 ml-1">{normal} Normal</span>
      {low > 0 && (
        <>
          <span className="text-slate-300 mx-0.5">·</span>
          <span className="font-bold text-amber-600">{low} Low</span>
        </>
      )}
      {high > 0 && (
        <>
          <span className="text-slate-300 mx-0.5">·</span>
          <span className="font-bold text-red-600">{high} High</span>
        </>
      )}
    </div>
  );
}

function PatientGrid({ patient }) {
  const allFields = [
    { label: "Patient Name", value: patient.name, Icon: User },
    { label: "Age / Gender", value: [patient.age, patient.gender].filter(Boolean).join(" · "), Icon: Hash },
    { label: "Contact", value: patient.contact, Icon: Phone },
    ...(patient.sampleDate ? [{ label: "Sample Date", value: patient.sampleDate, Icon: Calendar }] : []),
    ...(patient.reportDate ? [{ label: "Report Date", value: patient.reportDate, Icon: Calendar }] : []),
  ];
  const colCount = allFields.length;

  const Cell = ({ label, value, Icon }) => (
    <div className="bg-white px-3 py-2">
      <div className="flex items-center gap-1 mb-0.5">
        <Icon className="w-2.5 h-2.5 text-sky-400 flex-shrink-0" />
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
      </div>
      <p className="text-xs font-semibold text-slate-800 truncate">{value || "—"}</p>
    </div>
  );

  return (
    <div className="border-b border-slate-200">
      <div
        className="grid gap-px bg-slate-200 border-b border-slate-200"
        style={{ gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))` }}
      >
        {allFields.map((f) => (
          <Cell key={f.label} {...f} />
        ))}
      </div>
      <div className="bg-white px-3 py-1.5 flex items-center gap-3">
        <Stethoscope className="w-2.5 h-2.5 text-sky-400 flex-shrink-0" />
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Referred By</span>
        <span className="text-xs font-semibold text-slate-800">{patient.referredBy || "—"}</span>
      </div>
    </div>
  );
}

// ── Print HTML builder ────────────────────────────────────────────────────────
function buildPrintHTML({ reportName, shortId, patient, labInfo, sections, printType }) {
  const isPad = printType === "PAD";

  const statusInfo = (value, ref) => {
    const n = parseFloat(value);
    if (isNaN(n) || !ref) return null;
    const m = ref.match(/^([\d.]+)\s*[–\-]\s*([\d.]+)$/);
    if (!m) return null;
    const min = parseFloat(m[1]),
      max = parseFloat(m[2]);
    const fmt = (x) =>
      x
        .toFixed(3)
        .replace(/\.?0+$/, "")
        .replace(/^0\./, ".");
    const fmtLow = (x) => x.toFixed(3).replace(/\.?0+$/, "");
    if (n > max) return { status: "high", label: `Higher (${fmt(n / max)}x)` };
    if (n < min) {
      if (min === 0) return { status: "low", label: "Low" };
      return { status: "low", label: `Lower (${fmtLow(n / min)}x)` };
    }
    return { status: "normal", label: "Normal" };
  };

  const pillColor = (s) => ({ normal: "#059669", low: "#92400e", high: "#b91c1c" })[s] || "#94a3b8";
  const pillBg = (s) => ({ normal: "#f0fdf4", low: "#fffbeb", high: "#fef2f2" })[s] || "white";
  const rowBg = (s) => ({ normal: "#f0fdf4", low: "#fffbeb", high: "#fef2f2" })[s] || "white";
  const valColor = (s) => ({ normal: "#111827", low: "#92400e", high: "#b91c1c" })[s] || "#111827";

  const renderSection = (sectionName, sectionData, index) => {
    const showHeader = sectionData.__showTitle !== false;
    const entries = getSectionEntries(sectionData);
    const resultEntries = entries.filter(([, v]) => isResultField(v));
    const plainEntries = entries.filter(([, v]) => !isResultField(v));
    const hasUnits = resultEntries.some(([, v]) => Boolean(v.unit));

    const unitHeader = hasUnits
      ? `<th style="padding:5px 12px;text-align:left;font-size:9px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;width:12%;">Unit</th>`
      : "";

    const resultRows = resultEntries
      .map(([name, field]) => {
        const unit = field.unit || "";
        const ref = field.referenceRange || "";
        const info = statusInfo(field.value, ref);
        const s = info ? info.status : null;
        const label = info ? info.label : "—";
        return `<tr style="background:${rowBg(s)};">
        <td style="padding:7px 12px;font-size:12px;color:#374151;border-bottom:1px solid #e2e8f0;">${name}</td>
        <td style="padding:7px 12px;font-size:12px;font-weight:700;color:${valColor(s)};border-bottom:1px solid #e2e8f0;">${field.value}</td>
        ${hasUnits ? `<td style="padding:7px 12px;font-size:10px;font-weight:600;color:#64748b;text-transform:uppercase;border-bottom:1px solid #e2e8f0;">${unit || "—"}</td>` : ""}
        <td style="padding:7px 12px;font-size:11px;color:#6b7280;border-bottom:1px solid #e2e8f0;">${ref || "—"}</td>
        <td style="padding:7px 12px;border-bottom:1px solid #e2e8f0;">
          <span style="font-size:9px;font-weight:700;padding:2px 8px;border-radius:99px;background:${pillBg(s)};color:${pillColor(s)};border:1px solid ${pillColor(s)}55;">${label}</span>
        </td>
      </tr>`;
      })
      .join("");

    const plainRows = plainEntries
      .map(([name, field]) => {
        const val = Array.isArray(field.value) ? field.value.join(", ") : String(field.value ?? "—");
        return `<tr style="background:white;"><td style="padding:7px 12px;font-size:12px;color:#6b7280;border-bottom:1px solid #e2e8f0;">${name}</td><td style="padding:7px 12px;font-size:12px;font-weight:600;color:#111827;border-bottom:1px solid #e2e8f0;" colspan="${hasUnits ? 4 : 3}">${val || "—"}</td></tr>`;
      })
      .join("");

    // Section header: sky gradient, name only — no badge/letter
    const headerHTML = showHeader
      ? `<div style="background:linear-gradient(90deg,#0ea5e9 0%,#38bdf8 100%);padding:8px 14px;display:flex;align-items:center;justify-content:space-between;">
           <span style="color:white;font-size:12px;font-weight:600;">${sectionName}</span>
           <span style="color:rgba(255,255,255,0.75);font-size:9px;">${entries.length} parameter${entries.length !== 1 ? "s" : ""}</span>
         </div>`
      : "";

    const resultTable =
      resultEntries.length > 0
        ? `<table style="width:100%;border-collapse:collapse;">
          <thead><tr style="background:#f8fafc;border-bottom:1px solid #e2e8f0;">
            <th style="padding:5px 12px;text-align:left;font-size:9px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;width:34%;">Parameter</th>
            <th style="padding:5px 12px;text-align:left;font-size:9px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;width:16%;">Result</th>
            ${unitHeader}
            <th style="padding:5px 12px;text-align:left;font-size:9px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;width:24%;">Ref. Range</th>
            <th style="padding:5px 12px;text-align:left;font-size:9px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;width:18%;">Status</th>
          </tr></thead>
          <tbody>${resultRows}</tbody>
        </table>`
        : "";

    const plainTable =
      plainEntries.length > 0
        ? `<table style="width:100%;border-collapse:collapse;${resultEntries.length > 0 ? "border-top:1px solid #e2e8f0;" : ""}"><tbody>${plainRows}</tbody></table>`
        : "";

    return `<div style="border:1px solid #bae6fd;border-radius:8px;overflow:hidden;margin-bottom:10px;">${headerHTML}${resultTable}${plainTable}</div>`;
  };

  const mainFields = [
    { label: "Patient Name", value: patient.name },
    { label: "Age / Gender", value: [patient.age, patient.gender].filter(Boolean).join(" · ") },
    { label: "Contact", value: patient.contact },
    ...(patient.sampleDate ? [{ label: "Sample Date", value: patient.sampleDate }] : []),
    ...(patient.reportDate ? [{ label: "Report Date", value: patient.reportDate }] : []),
  ];
  const colPct = Math.floor(100 / mainFields.length);
  const mainCells = mainFields
    .map(
      ({ label, value }) =>
        `<td style="padding:6px 12px;background:white;vertical-align:top;border-right:1px solid #e2e8f0;width:${colPct}%;"><div style="font-size:8px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.06em;">${label}</div><div style="font-size:11px;font-weight:600;color:#1e293b;margin-top:2px;">${value || "—"}</div></td>`,
    )
    .join("");

  let normal = 0,
    low = 0,
    high = 0;
  sections.forEach(([, sec]) => {
    getSectionEntries(sec).forEach(([, field]) => {
      if (!isResultField(field)) return;
      const s = getStatus(field.value, field.referenceRange);
      if (s === "normal") normal++;
      else if (s === "low") low++;
      else if (s === "high") high++;
    });
  });
  const total = normal + low + high;

  // Lab header: sky-blue gradient for Plain, blank spacer for PAD
  const topBlock = isPad
    ? `<div style="height:1.5in;background:white;"></div>`
    : `<div style="background:linear-gradient(135deg,#0369a1 0%,#0ea5e9 55%,#38bdf8 100%);padding:16px 20px;display:flex;align-items:flex-start;justify-content:space-between;border-radius:10px 10px 0 0;">
         <div>
           <div style="font-size:16px;font-weight:800;color:white;letter-spacing:-0.02em;">${labInfo.name}</div>
           ${labInfo.tagline ? `<div style="font-size:10px;color:rgba(255,255,255,0.75);margin-top:3px;">${labInfo.tagline}</div>` : ""}
           <div style="font-size:9px;color:rgba(255,255,255,0.6);margin-top:5px;">📍 ${labInfo.address}</div>
         </div>
         <div style="text-align:right;">
           <div style="font-size:9px;color:rgba(255,255,255,0.8);">📞 ${labInfo.phone}</div>
           ${labInfo.email ? `<div style="font-size:9px;color:rgba(255,255,255,0.8);margin-top:2px;">✉ ${labInfo.email}</div>` : ""}
           ${labInfo.regNo ? `<div style="font-size:9px;color:rgba(255,255,255,0.5);margin-top:4px;font-family:monospace;">Registration No.: ${labInfo.regNo}</div>` : ""}
         </div>
       </div>`;

  const footerBlock = isPad
    ? ""
    : `<div class="footer-fixed"><table style="width:100%;max-width:680px;margin:0 auto 8px;"><tr><td style="width:45%;padding-right:20px;"><div style="height:30px;border-bottom:1px dashed #cbd5e1;"></div><div style="font-size:9px;color:#94a3b8;margin-top:3px;">Pathologist Signature &amp; Seal</div></td><td style="width:10%;"></td><td style="width:45%;padding-left:20px;"><div style="height:30px;border-bottom:1px dashed #cbd5e1;"></div><div style="font-size:9px;color:#94a3b8;margin-top:3px;text-align:right;">Authorized Signatory</div></td></tr></table><div style="font-size:9px;color:#94a3b8;text-align:center;max-width:680px;margin:0 auto;">For qualified medical professionals only. Interpret results in full clinical context. · ${labInfo.name} · ${labInfo.phone}</div></div>`;

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><title>${reportName}</title><style>* { box-sizing:border-box;margin:0;padding:0 } body { font-family:'Segoe UI',Arial,sans-serif;background:white;color:#1e293b;-webkit-print-color-adjust:exact;print-color-adjust:exact } @page { size:A4;margin:14mm } @media print { .footer-fixed { position:fixed;bottom:0;left:0;right:0;padding:10px 20px;background:white;border-top:1px solid #f1f5f9; } }</style></head><body><div style="max-width:680px;margin:0 auto;padding-bottom:${isPad ? "20px" : "90px"};">${topBlock}<div style="background:#e0f2fe;padding:8px 20px;display:flex;align-items:center;justify-content:space-between;border-left:1px solid #bae6fd;border-right:1px solid #bae6fd;border-bottom:1px solid #bae6fd;"><div style="font-size:14px;font-weight:700;color:#0c4a6e;">${reportName}</div>${shortId ? `<div style="font-size:9px;color:#0369a1;font-family:monospace;">Invoice No: ${shortId}</div>` : ""}</div><table style="width:100%;border-collapse:collapse;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;"><tr style="border-bottom:1px solid #e2e8f0;">${mainCells}</tr><tr><td colspan="5" style="padding:5px 12px;background:white;"><span style="font-size:8px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.06em;margin-right:10px;">Referred By</span><span style="font-size:11px;font-weight:600;color:#1e293b;">${patient.referredBy || "—"}</span></td></tr></table>${total > 0 ? `<div style="background:#f0f9ff;padding:7px 20px;border-left:1px solid #bae6fd;border-right:1px solid #bae6fd;border-bottom:1px solid #bae6fd;font-size:11px;display:flex;gap:6px;"><span style="color:#0369a1;">${total} parameters:</span><span style="font-weight:700;color:#059669;">${normal} Normal</span>${low > 0 ? `<span>·</span><span style="font-weight:700;color:#d97706;">${low} Low</span>` : ""}${high > 0 ? `<span>·</span><span style="font-weight:700;color:#dc2626;">${high} High</span>` : ""}</div>` : ""}<div style="padding:14px 20px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">${sections.map(([name, data], i) => renderSection(name, data, i)).join("")}</div></div>${footerBlock}</body></html>`;
}

// ── Main Component ────────────────────────────────────────────────────────────
function ReportViewer({
  report,
  patient = null,
  reportName,
  labInfo = LAB_INFO,
  printType = "PLAIN",
  invoiceId = null,
}) {
  const [dlStatus, setDlStatus] = useState("idle");
  const [shareStatus, setShareStatus] = useState("idle");

  const resolvedPatient = patient ?? EMPTY_PATIENT;
  const isPad = printType === "PAD";
  const resolvedReportName = report.name || reportName || "Lab Report";
  const filename = `${resolvedReportName.replace(/\s+/g, "_")}_report.pdf`;
  const shortId = invoiceId || report.invoiceId || "";

  const sections = Object.entries(report).filter(
    ([key, val]) =>
      !REPORT_META_KEYS.has(key) && val !== null && typeof val === "object" && !Array.isArray(val) && !val.$oid,
  );

  const generateBlob = () =>
    pdf(
      <ReportPDFDocument
        report={report}
        reportName={resolvedReportName}
        shortId={shortId}
        patient={resolvedPatient}
        labInfo={labInfo}
      />,
    ).toBlob();

  const handlePrint = () => {
    const html = buildPrintHTML({
      reportName: resolvedReportName,
      shortId,
      patient: resolvedPatient,
      labInfo,
      sections,
      printType,
    });
    const existing = document.getElementById("ur-print-frame");
    if (existing) existing.remove();
    const iframe = document.createElement("iframe");
    iframe.id = "ur-print-frame";
    iframe.style.cssText = "position:fixed;top:0;left:0;width:0;height:0;border:none;visibility:hidden;";
    document.body.appendChild(iframe);
    iframe.contentDocument.open();
    iframe.contentDocument.write(html);
    iframe.contentDocument.close();
    iframe.onload = () => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => iframe.remove(), 1000);
    };
  };

  const handleDownload = async () => {
    setDlStatus("loading");
    try {
      const blob = await generateBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDlStatus("done");
    } catch (e) {
      console.error(e);
      setDlStatus("idle");
      alert("PDF generation failed.");
    } finally {
      setTimeout(() => setDlStatus("idle"), 2500);
    }
  };

  const handleShare = async () => {
    setShareStatus("loading");
    try {
      const blob = await generateBlob();
      const file = new File([blob], filename, { type: "application/pdf" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: resolvedReportName });
        setShareStatus("done");
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setShareStatus("copied");
      }
    } catch (e) {
      if (e.name !== "AbortError") {
        console.error(e);
        setShareStatus("idle");
      } else setShareStatus("idle");
    } finally {
      setTimeout(() => setShareStatus("idle"), 2500);
    }
  };

  const dlIcon =
    dlStatus === "loading" ? (
      <Loader2 className="w-3.5 h-3.5 animate-spin" />
    ) : dlStatus === "done" ? (
      <Check className="w-3.5 h-3.5 text-emerald-400" />
    ) : (
      <Download className="w-3.5 h-3.5" />
    );
  const dlLabel = dlStatus === "loading" ? "Generating…" : dlStatus === "done" ? "Downloaded!" : "Download PDF";

  const shIcon =
    shareStatus === "loading" ? (
      <Loader2 className="w-3.5 h-3.5 animate-spin" />
    ) : shareStatus === "copied" || shareStatus === "done" ? (
      <Check className="w-3.5 h-3.5 text-emerald-500" />
    ) : (
      <Share2 className="w-3.5 h-3.5" />
    );
  const shLabel =
    shareStatus === "loading"
      ? "Preparing…"
      : shareStatus === "done"
        ? "Shared!"
        : shareStatus === "copied"
          ? "Saved!"
          : "Share";

  return (
    <div className="max-w-2xl mx-auto font-sans">
      {/* ── Action buttons ── */}
      <div className="flex items-center justify-end gap-2 mb-3">
        <button
          onClick={handleShare}
          disabled={shareStatus === "loading"}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:border-slate-400 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {shIcon} {shLabel}
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:border-slate-400 transition-all"
        >
          <Printer className="w-3.5 h-3.5" />
          {isPad ? "Print (Pad)" : "Print (Plain A4)"}
        </button>
        <button
          onClick={handleDownload}
          disabled={dlStatus === "loading"}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white rounded-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ background: "linear-gradient(90deg,#0369a1,#0ea5e9)" }}
        >
          {dlIcon} {dlLabel}
        </button>
      </div>

      {/* ── Report card ── */}
      <div className="bg-white border border-sky-100 rounded-xl overflow-hidden shadow-sm">
        {/* ── Lab header: sky-blue gradient ── */}
        {!isPad && (
          <div
            className="px-5 py-4 flex items-start justify-between gap-4"
            style={{ background: "linear-gradient(135deg,#0369a1 0%,#0ea5e9 55%,#38bdf8 100%)" }}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: "rgba(255,255,255,0.18)" }}
              >
                <FlaskConical className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-extrabold text-white tracking-tight">{labInfo.name}</p>
                {labInfo.tagline && (
                  <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.75)" }}>
                    {labInfo.tagline}
                  </p>
                )}
                <div className="flex items-center gap-1 mt-1.5">
                  <MapPin className="w-2.5 h-2.5 flex-shrink-0" style={{ color: "rgba(255,255,255,0.55)" }} />
                  <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.6)" }}>
                    {labInfo.address}
                  </p>
                </div>
              </div>
            </div>
            <div className="text-right flex-shrink-0 space-y-1">
              <div className="flex items-center justify-end gap-1">
                <Phone className="w-2.5 h-2.5" style={{ color: "rgba(255,255,255,0.55)" }} />
                <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.8)" }}>
                  {labInfo.phone}
                </p>
              </div>
              {labInfo.email && (
                <div className="flex items-center justify-end gap-1">
                  <Mail className="w-2.5 h-2.5" style={{ color: "rgba(255,255,255,0.55)" }} />
                  <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.8)" }}>
                    {labInfo.email}
                  </p>
                </div>
              )}
              {labInfo.regNo && (
                <p className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.5)" }}>
                  Registration No: {labInfo.regNo}
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── Report title bar: sky-tinted ── */}
        <div
          className="flex items-center justify-between px-5 py-2.5 border-b border-sky-100"
          style={{ background: "#e0f2fe" }}
        >
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-sky-500 flex-shrink-0" />
            <h2 className="text-sm font-bold text-sky-900">{resolvedReportName}</h2>
          </div>
          {shortId && <p className="text-[10px] text-sky-500 font-mono">Invoice No: {shortId}</p>}
        </div>

        <PatientGrid patient={resolvedPatient} />

        {/* ── Summary strip: sky-tinted ── */}
        <div className="px-5 py-2 border-b border-sky-100" style={{ background: "#f0f9ff" }}>
          <SummaryStrip sections={sections} />
        </div>

        {/* ── Sections ── */}
        <div className="px-5 pt-4 pb-4">
          {sections.map(([sectionName, sectionData]) => (
            <Section
              key={sectionName}
              sectionName={sectionName}
              sectionData={sectionData}
              showHeader={sectionData.__showTitle !== false}
            />
          ))}
        </div>
      </div>

      {/* ── Footer signatures ── */}
      {!isPad && (
        <div className="mt-8 pt-6 border-t border-sky-100">
          <div className="grid grid-cols-2 gap-8 mb-5">
            <div>
              <div className="h-10 border-b border-dashed border-slate-300" />
              <p className="text-[10px] text-slate-400 mt-1.5">Pathologist Signature &amp; Seal</p>
            </div>
            <div>
              <div className="h-10 border-b border-dashed border-slate-300" />
              <p className="text-[10px] text-slate-400 mt-1.5 text-right">Authorized Signatory</p>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 text-center leading-relaxed">
            For qualified medical professionals only. Interpret results in full clinical context.
            <span className="mx-1.5">·</span>
            {labInfo.name}
            <span className="mx-1.5">·</span>
            {labInfo.phone}
          </p>
        </div>
      )}
    </div>
  );
}

export default ReportViewer;
