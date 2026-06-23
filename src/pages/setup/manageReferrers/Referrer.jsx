import { useState } from "react";
import {
  Pencil,
  Trash2,
  UserX,
  UserCheck,
  ChevronDown,
  Phone,
  BadgePercent,
  Banknote,
  Stethoscope,
  Briefcase,
  Building2,
} from "lucide-react";

const C = {
  ink: "#1C1F1E",
  muted: "#A8ACA3",
  sub: "#6F756F",
  border: "#E3E0D6",
  dashed: "#D8D5CB",
  paper: "#FAF9F5",
  hover: "#F0EFE9",
  divider: "#EDEBE3",
  teal: "#0F6E5C",
  blue: "#1E4FA0",
  red: "#C0312B",
  amber: "#92400E",
};

const TYPE_CONFIG = {
  doctor: { label: "ডাক্তার", icon: Stethoscope, color: C.blue, bg: "#EEF2FA", border: "rgba(30,79,160,.25)" },
  agent: { label: "এজেন্ট", icon: Briefcase, color: C.amber, bg: "#FEF3C7", border: "rgba(146,64,14,.25)" },
  institute: { label: "প্রতিষ্ঠান", icon: Building2, color: C.teal, bg: "#E5F4F0", border: "rgba(15,110,92,.25)" },
};

const ActionChip = ({ onClick, icon: Icon, label, color }) => {
  const col = color ?? C.sub;
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 transition-colors"
      style={{
        padding: "3px 9px",
        border: `1px solid ${col}33`,
        borderRadius: "2px",
        color: col,
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: "10px",
        textTransform: "uppercase",
        letterSpacing: ".05em",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = `${col}0D`;
        e.currentTarget.style.borderColor = `${col}55`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "";
        e.currentTarget.style.borderColor = `${col}33`;
      }}
    >
      <Icon style={{ width: "11px", height: "11px" }} />
      {label}
    </button>
  );
};

const Referrer = ({ input, index, onEdit, onDelete, onDeactivate, onActivate }) => {
  const [expanded, setExpanded] = useState(false);
  const cfg = TYPE_CONFIG[input.type] ?? TYPE_CONFIG.doctor;
  const TypeIcon = cfg.icon;
  const isPercent = input.commissionType === "percentage";
  const commColor = isPercent ? C.amber : C.teal;

  return (
    <div style={{ borderBottom: `1px solid ${C.divider}`, opacity: input.isActive ? 1 : 0.5 }}>
      <button onClick={() => setExpanded((v) => !v)} className="w-full text-left">
        <div
          className="flex items-center gap-3 py-2.5 px-1 rounded-sm transition-colors"
          onMouseEnter={(e) => {
            e.currentTarget.style.background = C.hover;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "";
          }}
        >
          <span
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "11px",
              color: C.muted,
              width: "20px",
              flexShrink: 0,
            }}
          >
            {String(index + 1).padStart(2, "0")}
          </span>
          <div className="flex-1 min-w-0 flex items-baseline gap-2">
            <span
              style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: "13px", fontWeight: 600, color: C.ink }}
            >
              {input.name}
            </span>
            {input.degree && (
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: C.muted }}>
                {input.degree}
              </span>
            )}
          </div>
          <span
            className="flex-1 hidden sm:block"
            style={{ borderBottom: `1px dotted ${C.dashed}`, transform: "translateY(-3px)" }}
          />
          <div className="flex items-center gap-2 shrink-0">
            <span
              className="inline-flex items-center gap-1"
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "9px",
                textTransform: "uppercase",
                letterSpacing: ".07em",
                border: `1px solid ${cfg.border}`,
                borderRadius: "2px",
                padding: "2px 7px",
                background: cfg.bg,
                color: cfg.color,
              }}
            >
              <TypeIcon style={{ width: "9px", height: "9px" }} />
              {cfg.label}
            </span>
            {!input.isActive && (
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: C.muted }}>
                নিষ্ক্রিয়
              </span>
            )}
            <span
              style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "12px", fontWeight: 700, color: commColor }}
            >
              {isPercent ? `${input.commissionValue}%` : `৳${input.commissionValue?.toLocaleString("en-IN")}`}
            </span>
            <ChevronDown
              style={{
                width: "13px",
                height: "13px",
                color: C.muted,
                transition: "transform 0.15s",
                transform: expanded ? "rotate(180deg)" : undefined,
              }}
            />
          </div>
        </div>
      </button>

      {expanded && (
        <div className="pl-8 pr-1 py-3" style={{ background: C.paper, borderTop: `1px solid ${C.border}` }}>
          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "11px",
              color: C.sub,
              lineHeight: "1.8",
              marginBottom: "10px",
            }}
          >
            {input.contactNumber && (
              <p className="flex items-center gap-1.5">
                <Phone style={{ width: "11px", height: "11px" }} />
                {input.contactNumber}
              </p>
            )}
            {input.details && <p style={{ marginTop: "2px" }}>{input.details}</p>}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <ActionChip onClick={onEdit} icon={Pencil} label="সম্পাদনা" />
            {input.isActive ? (
              <ActionChip onClick={onDeactivate} icon={UserX} label="নিষ্ক্রিয়" color={C.amber} />
            ) : (
              <ActionChip onClick={onActivate} icon={UserCheck} label="সক্রিয়" color={C.teal} />
            )}
            <ActionChip onClick={onDelete} icon={Trash2} label="মুছুন" color={C.red} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Referrer;
