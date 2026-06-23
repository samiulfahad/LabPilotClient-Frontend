import { useState } from "react";
import { Phone, Mail, Shield, FileText, FilePlus, FileEdit, Trash, Upload, Download, ChevronDown } from "lucide-react";

const PERMISSIONS_LIST = [
  { key: "createInvoice", label: "Invoice Create", icon: FilePlus, color: "blue" },
  { key: "editInvoice", label: "Invoice Edit", icon: FileEdit, color: "amber" },
  { key: "deleteInvoice", label: "Invoice Delete", icon: Trash, color: "red" },
  { key: "cashmemo", label: "Cashmemo", icon: FileText, color: "green" },
  { key: "uploadReport", label: "Upload Report", icon: Upload, color: "purple" },
  { key: "downloadReport", label: "Download Report", icon: Download, color: "teal" },
];

const CHIP_COLORS = {
  blue: "bg-blue-50 text-blue-700 border-blue-200",
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  red: "bg-rose-50 text-rose-700 border-rose-200",
  green: "bg-emerald-50 text-emerald-700 border-emerald-200",
  purple: "bg-purple-50 text-purple-700 border-purple-200",
  teal: "bg-teal-50 text-teal-700 border-teal-200",
};

// ─── Action chip with gradient border (no icons) ────────────────────────────

const ActionChip = ({ onClick, label, color }) => {
  const gradientMap = {
    indigo: "linear-gradient(135deg, #6366f1, #4f46e5)",
    amber: "linear-gradient(135deg, #f59e0b, #d97706)",
    emerald: "linear-gradient(135deg, #10b981, #059669)",
    rose: "linear-gradient(135deg, #f43f5e, #e11d48)",
  };
  const grad = gradientMap[color] || gradientMap.indigo;

  return (
    <button
      onClick={onClick}
      className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-normal transition-all hover:scale-105 active:scale-95 text-slate-900"
      style={{
        border: "1px solid transparent",
        borderImage: `${grad} 1`,
        background: "white",
        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
      }}
    >
      {label}
    </button>
  );
};

// ─── Main Staff Row ──────────────────────────────────────────────────────────

const Staff = ({ input, index, onEdit, onDelete, onDeactivate, onActivate }) => {
  const [expanded, setExpanded] = useState(false);
  const activePermissions = PERMISSIONS_LIST.filter((p) => input.permissions[p.key]);
  const hasFullAccess = activePermissions.length === PERMISSIONS_LIST.length;

  // Determine role label (as per backend: admin, staff, or other)
  const role = input.role === "admin" ? "প্রশাসক" : input.role === "staff" ? "কর্মী" : "অন্যান্য";
  const roleColor =
    input.role === "admin"
      ? "text-purple-600 bg-purple-50 border-purple-200"
      : input.role === "staff"
        ? "text-indigo-600 bg-indigo-50 border-indigo-200"
        : "text-slate-600 bg-slate-50 border-slate-200";

  return (
    <div
      className={`border-b border-slate-100 last:border-0 transition-opacity ${
        input.isActive ? "opacity-100" : "opacity-60"
      }`}
    >
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full group transition-colors rounded-xl hover:bg-slate-50/80 px-2 -mx-2"
      >
        <div className="flex items-center gap-3 py-3">
          {/* Index */}
          <span className="font-mono text-xs text-slate-400 w-6 flex-shrink-0 text-center">
            {String(index + 1).padStart(2, "0")}
          </span>

          {/* Name + Role */}
          <div className="flex-1 min-w-0 flex items-baseline gap-2">
            <span className="font-semibold text-sm text-slate-800 group-hover:text-slate-900 transition-colors">
              {input.name}
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${roleColor}`}
            >
              {role}
            </span>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Status indicator */}
            <span className={`text-[10px] font-mono ${input.isActive ? "text-emerald-600" : "text-slate-400"}`}>
              {input.isActive ? "সক্রিয়" : "নিষ্ক্রিয়"}
            </span>

            {/* Permission count / Full access badge */}
            {hasFullAccess && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-indigo-100 text-indigo-700 border border-indigo-200">
                <Shield className="w-3 h-3" /> সম্পূর্ণ
              </span>
            )}

            {/* Expand icon */}
            <ChevronDown
              className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
            />
          </div>
        </div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="ml-8 pl-4 py-3 space-y-3 border-t border-slate-100 bg-slate-50/50 rounded-b-xl -mx-2 px-4">
          {/* Contact info */}
          <div className="space-y-1.5 text-sm text-slate-600">
            {input.email && (
              <p className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-mono text-xs">{input.email}</span>
              </p>
            )}
            {input.phone && (
              <p className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-mono text-xs">{input.phone}</span>
              </p>
            )}
          </div>

          {/* Permissions */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <Shield className="w-3.5 h-3.5" />
              <span>
                অনুমতি ({activePermissions.length}/{PERMISSIONS_LIST.length})
              </span>
            </div>
            {activePermissions.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {activePermissions.map(({ key, label, icon: Icon, color }) => (
                  <span
                    key={key}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${CHIP_COLORS[color]}`}
                  >
                    <Icon className="w-3 h-3" /> {label}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">কোনো অনুমতি নেই</p>
            )}
          </div>

          {/* Actions — no icons, only text with gradient border */}
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <ActionChip onClick={onEdit} label="সম্পাদনা" color="indigo" />
            {input.isActive ? (
              <ActionChip onClick={onDeactivate} label="নিষ্ক্রিয় করুন" color="amber" />
            ) : (
              <ActionChip onClick={onActivate} label="সক্রিয় করুন" color="emerald" />
            )}
            <ActionChip onClick={onDelete} label="মুছুন" color="rose" />
          </div>
        </div>
      )}
    </div>
  );
};

export default Staff;
