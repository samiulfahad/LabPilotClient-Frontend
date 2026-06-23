import { useState } from "react";
import {
  User,
  Phone,
  GraduationCap,
  FileText,
  BadgePercent,
  Banknote,
  Stethoscope,
  Briefcase,
  Building2,
  X,
  UserPlus,
  Pencil,
  AlertTriangle,
  Check,
} from "lucide-react";

const C = {
  ink: "#1C1F1E",
  muted: "#A8ACA3",
  sub: "#6F756F",
  border: "#E3E0D6",
  dashed: "#D8D5CB",
  paper: "#FAF9F5",
  divider: "#EDEBE3",
  teal: "#0F6E5C",
  blue: "#1E4FA0",
  red: "#C0312B",
  amber: "#92400E",
  purple: "#7C3AED",
};

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

const FormField = ({ label, required, children }) => (
  <div>
    <label
      style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: "10px",
        textTransform: "uppercase",
        letterSpacing: ".05em",
        color: C.sub,
        display: "block",
        marginBottom: "6px",
      }}
    >
      {label}
      {required && <span style={{ color: C.red, marginLeft: "2px" }}>*</span>}
    </label>
    {children}
  </div>
);

const TYPE_OPTIONS = [
  { value: "doctor", label: "ডাক্তার", icon: Stethoscope, color: C.blue },
  { value: "agent", label: "এজেন্ট", icon: Briefcase, color: C.amber },
  { value: "institute", label: "প্রতিষ্ঠান", icon: Building2, color: C.teal },
];

const ReferrerForm = ({ formData, onChange, onSubmit, onClose }) => {
  const isEdit = formData.formType === "editReferrer";
  const accentColor = isEdit ? C.purple : C.teal;

  const handleCommissionChange = (e) => {
    let val = parseFloat(e.target.value) || 0;
    // Enforce max 100 for percentage
    if (formData.commissionType === "percentage" && val > 100) {
      val = 100;
    }
    onChange("commissionValue", val);
  };

  return (
    <div
      className="bg-white flex flex-col"
      style={{
        maxHeight: "min(660px, calc(100svh - 48px))",
        border: `1px solid ${C.border}`,
        borderRadius: "3px",
        boxShadow: "0 8px 32px rgba(28,31,30,0.15)",
      }}
    >
      {/* Header */}
      <div
        className="shrink-0 flex items-center justify-between px-6 py-4"
        style={{ borderBottom: `1px solid ${C.border}`, background: C.paper }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center shrink-0"
            style={{
              width: "32px",
              height: "32px",
              border: `1px solid ${accentColor}33`,
              borderRadius: "2px",
              background: `${accentColor}08`,
            }}
          >
            {isEdit ? (
              <Pencil style={{ width: "14px", height: "14px", color: accentColor }} />
            ) : (
              <UserPlus style={{ width: "14px", height: "14px", color: accentColor }} />
            )}
          </div>
          <div>
            <p
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "10px",
                textTransform: "uppercase",
                letterSpacing: ".08em",
                color: accentColor,
              }}
            >
              {isEdit ? "তথ্য সম্পাদনা" : "নতুন নিবন্ধন"}
            </p>
            <p
              style={{
                fontFamily: "'IBM Plex Sans', sans-serif",
                fontSize: "14px",
                fontWeight: 700,
                color: C.ink,
                marginTop: "1px",
              }}
            >
              {isEdit ? "রেফারার সম্পাদনা" : "রেফারার নিবন্ধন"}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            width: "28px",
            height: "28px",
            borderRadius: "2px",
            color: C.muted,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = C.divider;
            e.currentTarget.style.color = C.ink;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "";
            e.currentTarget.style.color = C.muted;
          }}
        >
          <X style={{ width: "15px", height: "15px" }} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
        {/* Type selector */}
        <FormField label="ধরন" required>
          <div className="grid grid-cols-3 gap-2">
            {TYPE_OPTIONS.map(({ value, label, icon: Icon, color }) => {
              const active = formData.type === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => onChange("type", value)}
                  className="flex items-center gap-2 px-3 py-2.5 transition-all"
                  style={{
                    border: `1px solid ${active ? color + "55" : C.dashed}`,
                    borderRadius: "2px",
                    background: active ? `${color}0A` : "white",
                    color: active ? color : C.muted,
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: "11px",
                  }}
                >
                  <Icon style={{ width: "13px", height: "13px", flexShrink: 0 }} />
                  {label}
                  {active && <Check style={{ width: "11px", height: "11px", marginLeft: "auto" }} />}
                </button>
              );
            })}
          </div>
        </FormField>

        {/* Name + Contact */}
        <div className="grid grid-cols-2 gap-3">
          <FormField label="পূর্ণ নাম" required>
            <input
              type="text"
              value={formData.name || ""}
              onChange={(e) => onChange("name", e.target.value)}
              placeholder="রেফারারের নাম"
              required
              className="w-full px-3 py-2.5 text-sm outline-none transition-all"
              style={inputStyle}
              onFocus={focusInput}
              onBlur={blurInput}
            />
          </FormField>
          <FormField label="যোগাযোগ নম্বর" required>
            <input
              type="tel"
              value={formData.contactNumber || ""}
              onChange={(e) => onChange("contactNumber", e.target.value)}
              placeholder="01XXXXXXXXX"
              maxLength={11}
              required
              className="w-full px-3 py-2.5 text-sm outline-none transition-all"
              style={inputStyle}
              onFocus={focusInput}
              onBlur={blurInput}
            />
          </FormField>
        </div>

        {/* Degree (doctors only) */}
        {formData.type === "doctor" && (
          <FormField label="ডিগ্রি">
            <input
              type="text"
              value={formData.degree || ""}
              onChange={(e) => onChange("degree", e.target.value)}
              placeholder="MBBS, MD, FCPS…"
              className="w-full px-3 py-2.5 text-sm outline-none transition-all"
              style={inputStyle}
              onFocus={focusInput}
              onBlur={blurInput}
            />
          </FormField>
        )}

        {/* Details */}
        <FormField label="বিবরণ">
          <textarea
            value={formData.details || ""}
            onChange={(e) => onChange("details", e.target.value)}
            placeholder="অতিরিক্ত তথ্য…"
            rows={2}
            className="w-full px-3 py-2 text-sm outline-none transition-all resize-none"
            style={inputStyle}
            onFocus={focusInput}
            onBlur={blurInput}
          />
        </FormField>

        {/* Status */}
        <FormField label="স্ট্যাটাস">
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: true, label: "সক্রিয়", color: C.teal },
              { value: false, label: "নিষ্ক্রিয়", color: C.red },
            ].map(({ value, label, color }) => {
              const active = formData.isActive === value;
              return (
                <button
                  key={String(value)}
                  type="button"
                  onClick={() => onChange("isActive", value)}
                  className="flex items-center gap-2 px-3 py-2.5 transition-all"
                  style={{
                    border: `1px solid ${active ? color + "55" : C.dashed}`,
                    borderRadius: "2px",
                    background: active ? `${color}0A` : "white",
                    color: active ? color : C.muted,
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: "11px",
                  }}
                >
                  {active && <Check style={{ width: "11px", height: "11px" }} />}
                  {label}
                </button>
              );
            })}
          </div>
        </FormField>

        {/* Commission */}
        <div style={{ border: `1px solid ${C.border}`, borderRadius: "2px", overflow: "hidden" }}>
          <div
            className="px-4 py-2.5 flex items-center gap-2"
            style={{ background: C.paper, borderBottom: `1px solid ${C.border}` }}
          >
            <BadgePercent style={{ width: "12px", height: "12px", color: C.muted }} />
            <span
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "10px",
                textTransform: "uppercase",
                letterSpacing: ".1em",
                color: C.muted,
                fontWeight: 700,
              }}
            >
              কমিশন
            </span>
          </div>
          <div className="p-4 space-y-3 bg-white">
            <div className="grid grid-cols-2 gap-2">
              {[
                { type: "percentage", label: "শতাংশ (%)", Icon: BadgePercent, color: C.amber },
                { type: "fixed", label: "নির্দিষ্ট (৳)", Icon: Banknote, color: C.teal },
              ].map(({ type, label, Icon, color }) => {
                const active = formData.commissionType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      onChange("commissionType", type);
                      onChange("commissionValue", 0);
                    }}
                    className="flex items-center gap-2 px-3 py-2.5 transition-all"
                    style={{
                      border: `1px solid ${active ? color + "55" : C.dashed}`,
                      borderRadius: "2px",
                      background: active ? `${color}0A` : "white",
                      color: active ? color : C.muted,
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: "11px",
                    }}
                  >
                    <Icon style={{ width: "13px", height: "13px", flexShrink: 0 }} />
                    {label}
                  </button>
                );
              })}
            </div>
            <div className="relative">
              <input
                type="number"
                min="0"
                step={formData.commissionType === "percentage" ? "0.1" : "1"}
                max={formData.commissionType === "percentage" ? 100 : undefined}
                value={formData.commissionValue || ""}
                onChange={handleCommissionChange}
                placeholder={formData.commissionType === "percentage" ? "০ – ১০০" : "পরিমাণ লিখুন"}
                required
                className="w-full outline-none transition-all"
                style={{
                  ...inputStyle,
                  padding: formData.commissionType === "percentage" ? "10px 32px 10px 12px" : "10px 12px 10px 28px",
                  fontSize: "13px",
                }}
                onFocus={focusInput}
                onBlur={blurInput}
              />
              {formData.commissionType === "percentage" ? (
                <span
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: "13px",
                    fontWeight: 700,
                    color: C.amber,
                  }}
                >
                  %
                </span>
              ) : (
                <span
                  style={{
                    position: "absolute",
                    left: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: "13px",
                    fontWeight: 700,
                    color: C.teal,
                  }}
                >
                  ৳
                </span>
              )}
              {/* Helper text for percentage */}
              {formData.commissionType === "percentage" && (
                <p
                  style={{
                    marginTop: "4px",
                    fontSize: "10px",
                    color: C.muted,
                    fontFamily: "'IBM Plex Mono', monospace",
                  }}
                >
                  সর্বোচ্চ ১০০% পর্যন্ত
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 px-6 py-4 flex gap-2" style={{ borderTop: `1px solid ${C.border}` }}>
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-2.5 transition-colors"
          style={{
            border: `1px solid ${C.dashed}`,
            borderRadius: "2px",
            color: C.sub,
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "11px",
            textTransform: "uppercase",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = C.divider;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "";
          }}
        >
          বাতিল
        </button>
        <button
          onClick={onSubmit}
          className="flex-1 py-2.5 flex items-center justify-center gap-1.5 transition-colors"
          style={{
            border: `1px solid ${accentColor}`,
            borderRadius: "2px",
            color: accentColor,
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "11px",
            textTransform: "uppercase",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = accentColor;
            e.currentTarget.style.color = "white";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "";
            e.currentTarget.style.color = accentColor;
          }}
        >
          {isEdit ? (
            <Pencil style={{ width: "12px", height: "12px" }} />
          ) : (
            <UserPlus style={{ width: "12px", height: "12px" }} />
          )}
          {isEdit ? "পরিবর্তন সংরক্ষণ" : "নিবন্ধন করুন"}
        </button>
      </div>
    </div>
  );
};

export default ReferrerForm;
