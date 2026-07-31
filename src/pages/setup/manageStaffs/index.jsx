/**
 * useCallback / useMemo are intentionally absent throughout this file.
 * babel-plugin-react-compiler handles all memoization automatically.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  ArrowLeft,
  Search,
  X,
  RotateCcw,
  UserPlus,
  Shield,
  ShieldCheck,
  ShieldOff,
  AlertCircle,
  ChevronDown,
  Phone,
  Mail,
  Trash2,
  AlertTriangle,
  Pencil,
  UserX,
  UserCheck,
  Wallet,
  Receipt,
  BanknoteArrowUp,
  FileBarChart,
  FlaskConical,
  Settings2,
  CreditCard,
  BedDouble,
} from "lucide-react";
import Modal from "../../../components/modal";
import Popup from "../../../components/popup";
import staffService from "../../../api/staff";
import staticDataAPI from "../../../api/staticData";
import { useAuthStore } from "../../../store/authStore"; // adjust path if different

// ── Palette ────────────────────────────────────────────────────────────────────

const C = {
  ink: "#0F172A",
  muted: "#94A3B8",
  sub: "#64748B",
  border: "#E2E8F0",
  paper: "#F8FAFC",
  hover: "#F1F5F9",
  divider: "#EEF2FF",
  teal: "#0D9488",
  indigo: "#6366F1",
  red: "#EF4444",
  amber: "#F59E0B",
  purple: "#8B5CF6",
  green: "#10B981",
};

const buildInitialPerms = (list) => Object.fromEntries(list.map((p) => [p.key, false]));

// ── Permission group labels ──────────────────────────────────────────────────
// Matches the `group` key on each entry in ALLOWED_PERMISSIONS (staticData).

const GROUP_LABELS = {
  invoice: "ইনভয়েস",
  expense: "খরচ/ব্যয়",
  dailyReport: "দৈনিক রিপোর্ট",
  testReport: "টেস্ট রিপোর্ট",
  setup: "সেটআপ",
  billing: "বিলিং",
  indoorPatient: "ভর্তি রোগী (ইনডোর)",
};

// Distinct accent color per group — makes the modal's group headers
// immediately scannable instead of one flat gray label repeated.
const GROUP_COLORS = {
  invoice: "#6366F1",
  expense: "#F59E0B",
  dailyReport: "#0D9488",
  testReport: "#8B5CF6",
  setup: "#64748B",
  billing: "#10B981",
  indoorPatient: "#EF4444",
};

// One glyph per group so headers are scannable by shape, not just color —
// mirrors GROUP_COLORS by key with a neutral fallback for unknown groups.
const GROUP_ICONS = {
  invoice: Receipt,
  expense: BanknoteArrowUp,
  dailyReport: FileBarChart,
  testReport: FlaskConical,
  setup: Settings2,
  billing: CreditCard,
  indoorPatient: BedDouble,
};

const groupColor = (groupKey) => GROUP_COLORS[groupKey] ?? C.indigo;
const groupIcon = (groupKey) => GROUP_ICONS[groupKey] ?? Shield;

// ── Status / filter options ───────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: "all", label: "সব স্ট্যাটাস" },
  { value: "active", label: "সক্রিয়" },
  { value: "inactive", label: "নিষ্ক্রিয়" },
];

const EMPTY_FORM = {
  name: "",
  email: "",
  phone: "",
};

// ── Error helpers ──────────────────────────────────────────────────────────────

const PERMISSION_DENIED_MESSAGE = "আপনার কর্তৃপক্ষ আপনাকে এই কাজটি করার বা এই তথ্যটি পাওয়ার অনুমতি দেয়নি।";

const getErrorMessage = (err, fallback) => {
  if (err?.response?.status === 403) return PERMISSION_DENIED_MESSAGE;
  return err?.response?.data?.error ?? fallback;
};

const getErrorStatus = (error) => error?.response?.status ?? error?.status ?? null;

// ── Shared input helpers ───────────────────────────────────────────────────────

const inputBase =
  "w-full outline-none transition-all rounded-xl border-[1.5px] border-[#E2E8F0] bg-white text-[#0F172A] font-['IBM_Plex_Mono',monospace]";

const focusInput = (e) => {
  e.target.style.borderColor = "#6366F1";
  e.target.style.boxShadow = "0 0 0 3px #6366F120";
};
const blurInput = (e) => {
  e.target.style.borderColor = "#E2E8F0";
  e.target.style.boxShadow = "";
};

// ── Form Field ─────────────────────────────────────────────────────────────────

const FormField = ({ label, required, children, hint }) => (
  <div>
    <label className="block mb-1.5 font-['IBM_Plex_Mono',monospace] text-[11px] font-semibold uppercase tracking-[0.06em] text-[#64748B]">
      {label}
      {required && <span className="text-[#EF4444] ml-[3px]">*</span>}
    </label>
    {children}
    {hint && <p className="mt-1 font-['IBM_Plex_Mono',monospace] text-[10px] text-[#94A3B8]">{hint}</p>}
  </div>
);

// ── Toggle Switch ──────────────────────────────────────────────────────────────

const ToggleSwitch = ({ checked }) => (
  <span
    className="relative shrink-0 inline-flex items-center rounded-full transition-colors duration-200 w-[30px] h-[17px]"
    style={{ background: checked ? C.indigo : "#CBD5E1" }}
  >
    <span
      className="absolute rounded-full bg-white shadow-[0_1px_3px_rgba(15,23,42,0.35)] transition-transform duration-200 w-[13px] h-[13px]"
      style={{ left: 2, transform: checked ? "translateX(13px)" : "translateX(0)" }}
    />
  </span>
);

// ── Staff Form Modal ───────────────────────────────────────────────────────────
// On a failed save the modal stays OPEN (no onClose()) — a permission error
// or network hiccup shouldn't discard what the user entered. The error
// surfaces inline via `apiError` in the sticky footer so they can just retry.
//
// On EDIT, name/email/phone are immutable (set at registration) and are
// hidden entirely rather than shown read-only — the edit modal only ever
// touches permissions here. Active status is handled via the row's own
// activate/deactivate action, and the bill adjustment limit has its own
// dedicated modal (see AdjustmentModal below) for CHANGING an existing
// staff member's limit — neither lives in this form on edit.
//
// On CREATE, the adjustment limit CAN be set up front (toggle-then-reveal,
// same pattern as AdjustmentModal) so admins don't have to immediately jump
// into a second modal right after registering someone. This mirrors the
// backend, which now accepts `maxLabAdjustment` on the create route while
// still exposing permissions, adjustment, and active-status as three
// separate routes for edits.

const StaffFormModal = ({ initial, permissionsList, onClose, onSaved }) => {
  const isEdit = !!initial?._id;
  const isAdmin = initial?.role === "admin";

  const [form, setForm] = useState(() => {
    if (initial) {
      return {
        name: initial.name ?? "",
        email: initial.email ?? "",
        phone: initial.phone ?? "",
        permissions: initial.permissions ?? buildInitialPerms(permissionsList),
      };
    }
    return { ...EMPTY_FORM, permissions: buildInitialPerms(permissionsList) };
  });

  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState("");

  // Billing/lab adjustment limit — creation only. Same toggle-then-reveal
  // pattern as AdjustmentModal below, but scoped to this form since it's set
  // once at registration; changing it later still goes through the
  // dedicated AdjustmentModal/route.
  const [adjustmentEnabled, setAdjustmentEnabled] = useState(false);
  const [adjustmentAmount, setAdjustmentAmount] = useState(0);

  const toggleAdjustment = () => {
    if (adjustmentEnabled) {
      setAdjustmentEnabled(false);
      setAdjustmentAmount(0);
    } else {
      setAdjustmentEnabled(true);
    }
    if (apiError) setApiError("");
  };

  const set = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (apiError) setApiError("");
  };

  const allEnabled = permissionsList.every((p) => form.permissions[p.key]);

  const toggleAll = () => {
    const next = Object.fromEntries(permissionsList.map((p) => [p.key, !allEnabled]));
    set("permissions", next);
  };

  const toggleGroup = (groupKey, groupPerms, groupAllEnabled) => {
    set("permissions", {
      ...form.permissions,
      ...Object.fromEntries(groupPerms.map((p) => [p.key, !groupAllEnabled])),
    });
  };

  // Group permissions by their `group` key (invoice, expense, dailyReport, …)
  // so the modal can render them as labeled sections instead of one flat grid.
  const groupedPermissions = permissionsList.reduce((acc, p) => {
    (acc[p.group] ??= []).push(p);
    return acc;
  }, {});

  const handleSubmit = async () => {
    if (!isEdit) {
      if (!form.name.trim()) return setApiError("নাম প্রয়োজন।");
      if (!form.phone.trim()) return setApiError("ফোন নম্বর প্রয়োজন।");
      if (adjustmentEnabled && (!adjustmentAmount || Number(adjustmentAmount) <= 0)) {
        return setApiError("অ্যাডজাস্টমেন্ট লিমিট প্রয়োজন।");
      }
    }
    try {
      setSaving(true);
      setApiError("");
      if (isEdit) {
        // name/email/phone are intentionally NOT sent on edit — the backend
        // rejects them anyway, and the form doesn't even collect them here.
        // Dedicated permissions-only route — activate/deactivate and the
        // adjustment limit each live on their own routes now.
        await staffService.updatePermissions({ permissions: form.permissions, _id: initial._id });
      } else {
        await staffService.addStaff({
          ...form,
          maxLabAdjustment: adjustmentEnabled ? Number(adjustmentAmount) : 0,
          type: "addStaff",
        });
      }
      onSaved(isEdit);
    } catch (err) {
      setApiError(getErrorMessage(err, "সমস্যা হয়েছে। আবার চেষ্টা করুন।"));
    } finally {
      setSaving(false);
    }
  };

  const gradFrom = isEdit ? "#8B5CF6" : "#0D9488";
  const gradTo = isEdit ? "#7C3AED" : "#0F766E";
  const accentText = isEdit ? "text-[#8B5CF6]" : "text-[#0D9488]";
  const accentBorder = isEdit ? "border-[#8B5CF620]" : "border-[#0D948820]";

  return (
    <Modal isOpen size="md" onClose={onClose}>
      <div className="flex flex-col max-h-[calc(100svh-96px)] overflow-hidden">
        {/* Header — fixed, never scrolls */}
        <div
          className={`shrink-0 px-6 py-5 flex items-center justify-between border-b ${accentBorder}`}
          style={{ background: `linear-gradient(135deg,${gradFrom}15 0%,${gradTo}08 100%)` }}
        >
          <div className="flex items-center gap-3.5">
            <div
              className="flex items-center justify-center shrink-0 w-11 h-11 rounded-[14px]"
              style={{
                background: `linear-gradient(135deg,${gradFrom},${gradTo})`,
                boxShadow: `0 8px 20px ${gradFrom}40`,
              }}
            >
              {isEdit ? (
                <Pencil className="w-[18px] h-[18px] text-white" />
              ) : (
                <UserPlus className="w-[18px] h-[18px] text-white" />
              )}
            </div>
            <div>
              <p
                className={`font-['IBM_Plex_Mono',monospace] text-[10px] font-bold uppercase tracking-[0.1em] mb-[2px] ${accentText}`}
              >
                {isEdit ? "অনুমতি সম্পাদনা" : "নতুন নিবন্ধন"}
              </p>
              <p className="font-['IBM_Plex_Sans',sans-serif] text-base font-bold text-[#0F172A]">
                {isEdit ? initial.name : "কর্মী নিবন্ধন"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-[10px] text-[#94A3B8] border-[1.5px] border-[#E2E8F0] transition-all hover:bg-[#F1F5F9] hover:text-[#0F172A]"
          >
            <X className="w-[15px] h-[15px]" />
          </button>
        </div>

        {/* Body — the ONLY scrollable region, fills remaining space */}
        <div className="px-6 py-5 space-y-4 bg-[#F8FAFC] flex-1 min-h-0 overflow-y-auto">
          {/* Name / Email / Phone — registration only. These are fixed at
              signup and can't be changed afterwards, so the edit modal
              never shows them at all. The backend enforces this too, so
              even a direct API call can't change them post-registration. */}
          {!isEdit && (
            <>
              <FormField label="পূর্ণ নাম" required>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="কর্মীর নাম"
                  className={`${inputBase} px-3 py-2.5 text-sm`}
                  onFocus={focusInput}
                  onBlur={blurInput}
                />
              </FormField>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="ইমেইল">
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    placeholder="email@example.com"
                    className={`${inputBase} px-3 py-2.5 text-sm`}
                    onFocus={focusInput}
                    onBlur={blurInput}
                  />
                </FormField>
                <FormField label="ফোন নম্বর" required>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    placeholder="01XXXXXXXXX"
                    maxLength={15}
                    className={`${inputBase} px-3 py-2.5 text-sm`}
                    onFocus={focusInput}
                    onBlur={blurInput}
                  />
                </FormField>
              </div>

              {/* Billing/lab adjustment limit — optional, creation only.
                  Toggle-then-reveal, same UX as the standalone
                  AdjustmentModal used for editing this later. */}
              <div className="border-[1.5px] border-[#E2E8F0] rounded-2xl overflow-hidden bg-white">
                <button
                  type="button"
                  onClick={toggleAdjustment}
                  className="w-full flex items-center justify-between px-4 py-3"
                >
                  <div className="flex items-center gap-2">
                    <Wallet className="w-3 h-3 text-[#6366F1]" />
                    <span className="font-['IBM_Plex_Mono',monospace] text-[10px] font-bold uppercase tracking-[0.08em] text-[#64748B]">
                      বিল অ্যাডজাস্টমেন্ট
                    </span>
                  </div>
                  <ToggleSwitch checked={adjustmentEnabled} />
                </button>
                {adjustmentEnabled && (
                  <div className="px-4 pb-3.5">
                    <input
                      type="number"
                      min="0"
                      value={adjustmentAmount === 0 ? "" : adjustmentAmount}
                      onChange={(e) => {
                        setAdjustmentAmount(e.target.value === "" ? "" : Number(e.target.value));
                        if (apiError) setApiError("");
                      }}
                      placeholder="সর্বোচ্চ পরিমাণ (৳)"
                      className={`${inputBase} px-3 py-2.5 text-sm`}
                      onFocus={focusInput}
                      onBlur={blurInput}
                      autoFocus
                    />
                    <p className="mt-1 font-['IBM_Plex_Mono',monospace] text-[10px] text-[#94A3B8]">
                      এই কর্মী সর্বোচ্চ এই পরিমাণ পর্যন্ত বিল অ্যাডজাস্টমেন্ট করতে পারবেন।
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Immutable-fields notice on edit, so it's clear this isn't an
              oversight — name/email/phone simply can't be changed here. */}
          {isEdit && !isAdmin && (
            <div className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl border-[1.5px] border-[#E2E8F025] bg-[#94A3B808]">
              <AlertCircle className="w-[13px] h-[13px] text-[#94A3B8] shrink-0 mt-[1px]" />
              <p className="font-['IBM_Plex_Mono',monospace] text-[10.5px] leading-[1.5] text-[#64748B]">
                নাম, ইমেইল ও ফোন নম্বর নিবন্ধনের পর পরিবর্তনযোগ্য নয়। স্ট্যাটাস ও অ্যাডজাস্টমেন্ট লিমিট তালিকার অ্যাকশন
                বাটন থেকে পরিবর্তন করুন।
              </p>
            </div>
          )}

          {/* Permissions — grouped by category with color-coded, eye-catching
              headers. Not shown for admins, who always have full, fixed access. */}
          {!isAdmin && (
            <div className="border-[1.5px] border-[#E2E8F0] rounded-2xl overflow-hidden bg-white">
              <div className="px-4 pt-3 pb-2.5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Shield className="w-3 h-3 text-[#6366F1]" />
                    <span className="font-['IBM_Plex_Mono',monospace] text-[10px] font-bold uppercase tracking-[0.08em] text-[#64748B]">
                      অনুমতিসমূহ
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={toggleAll}
                    className={`font-['IBM_Plex_Mono',monospace] text-[10px] font-bold px-2 py-[3px] rounded-md transition-all
                    ${allEnabled ? "text-[#EF4444] bg-[#EF444410]" : "text-[#6366F1] bg-[#6366F110]"}`}
                  >
                    {allEnabled ? "সব বাদ দিন" : "সব নির্বাচন করুন"}
                  </button>
                </div>
                {/* Progress bar — visualizes enabled/total at a glance */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-[5px] rounded-full bg-[#E2E8F0] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${(permissionsList.filter((p) => form.permissions[p.key]).length / (permissionsList.length || 1)) * 100}%`,
                        background: `linear-gradient(90deg,${C.indigo},#818CF8)`,
                      }}
                    />
                  </div>
                  <span className="font-['IBM_Plex_Mono',monospace] text-[10px] font-semibold text-[#94A3B8] shrink-0">
                    {permissionsList.filter((p) => form.permissions[p.key]).length}/{permissionsList.length}
                  </span>
                </div>
              </div>

              <div className="px-2.5 pb-2.5 space-y-3">
                {Object.entries(groupedPermissions).map(([groupKey, groupPerms]) => {
                  const groupAllEnabled = groupPerms.every((p) => form.permissions[p.key]);
                  const groupEnabledCount = groupPerms.filter((p) => form.permissions[p.key]).length;
                  const groupHasSome = groupEnabledCount > 0;
                  const gc = groupColor(groupKey);
                  const GIcon = groupIcon(groupKey);
                  return (
                    <div key={groupKey}>
                      {/* Group header — icon chip + label/count on the left,
                          a compact per-group progress bar underneath, and the
                          group toggle-all pinned to the right. Reads as one
                          cohesive card rather than a single-line pill strip. */}
                      <div
                        className="relative overflow-hidden rounded-xl mb-1.5 border bg-white transition-all"
                        style={{
                          borderColor: groupHasSome ? `${gc}35` : "#E2E8F0",
                          boxShadow: groupHasSome ? `0 1px 6px ${gc}12` : "none",
                        }}
                      >
                        {/* Accent bar */}
                        <div
                          className="absolute left-0 top-0 bottom-0 w-[3px]"
                          style={{ background: groupHasSome ? gc : "#CBD5E1" }}
                        />
                        <div className="flex items-center gap-2.5 pl-3.5 pr-2.5 py-2">
                          <div
                            className="flex items-center justify-center shrink-0 w-6 h-6 rounded-[8px]"
                            style={{
                              background: groupHasSome ? `${gc}18` : "#E2E8F0",
                              color: groupHasSome ? gc : "#94A3B8",
                            }}
                          >
                            <GIcon className="w-3 h-3" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-1.5">
                              <span
                                className="font-['IBM_Plex_Mono',monospace] text-[11px] font-extrabold uppercase tracking-[0.06em]"
                                style={{ color: groupHasSome ? gc : "#64748B" }}
                              >
                                {GROUP_LABELS[groupKey] ?? groupKey}
                              </span>
                              <span
                                className="font-['IBM_Plex_Mono',monospace] text-[9.5px] font-bold"
                                style={{ color: groupHasSome ? `${gc}B0` : "#94A3B8" }}
                              >
                                {groupEnabledCount}/{groupPerms.length}
                              </span>
                            </div>
                            {/* Mini progress bar — same idea as the top-level
                                one, scoped to this group */}
                            <div className="mt-1 h-[3px] w-full max-w-[140px] rounded-full bg-[#E2E8F0] overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-300"
                                style={{
                                  width: `${(groupEnabledCount / (groupPerms.length || 1)) * 100}%`,
                                  background: gc,
                                }}
                              />
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleGroup(groupKey, groupPerms, groupAllEnabled)}
                            className="shrink-0 font-['IBM_Plex_Mono',monospace] text-[9.5px] font-bold px-2 py-[4px] rounded-[7px] transition-all"
                            style={{
                              color: groupAllEnabled ? "#EF4444" : gc,
                              background: groupAllEnabled ? "#EF444415" : `${gc}15`,
                            }}
                          >
                            {groupAllEnabled ? "বাদ দিন" : "সব নিন"}
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {groupPerms.map(({ key, label }) => {
                          const checked = form.permissions[key];
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => set("permissions", { ...form.permissions, [key]: !checked })}
                              className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border transition-all text-left"
                              style={{
                                background: checked ? `${C.indigo}0A` : "#F8FAFC",
                                borderColor: checked ? `${C.indigo}40` : "#E2E8F0",
                              }}
                            >
                              <span
                                className="font-['IBM_Plex_Mono',monospace] text-[11.5px] leading-[1.35] font-medium break-words"
                                style={{ color: checked ? "#0F172A" : C.sub }}
                              >
                                {label}
                              </span>
                              <ToggleSwitch checked={checked} />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer — fixed, never scrolls. apiError banner sits directly
            above the action buttons so it's the last thing seen before
            retrying. */}
        <div className="shrink-0 bg-white border-t border-[#E2E8F0]">
          {apiError && (
            <div className="mx-6 mt-4 flex items-start gap-2.5 px-4 py-3 bg-[#EF444408] border-[1.5px] border-[#EF444430] rounded-xl">
              <AlertTriangle className="w-[14px] h-[14px] text-[#EF4444] shrink-0 mt-[1px]" />
              <span className="text-xs font-['IBM_Plex_Mono',monospace] text-[#EF4444]">{apiError}</span>
            </div>
          )}
          <div className="px-6 py-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 py-3 font-semibold transition-all rounded-xl border-[1.5px] border-[#E2E8F0] text-[#64748B] font-['IBM_Plex_Mono',monospace] text-xs hover:bg-[#F1F5F9]"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex-1 py-3 flex items-center justify-center gap-2 font-semibold transition-all rounded-xl border-none text-white font-['IBM_Plex_Mono',monospace] text-xs"
              style={{
                background: saving ? C.muted : `linear-gradient(135deg,${gradFrom},${gradTo})`,
                cursor: saving ? "not-allowed" : "pointer",
              }}
            >
              {saving ? (
                <span className="animate-spin inline-block w-[14px] h-[14px] rounded-full border-2 border-white/40 border-t-white" />
              ) : isEdit ? (
                <Pencil className="w-[13px] h-[13px]" />
              ) : (
                <UserPlus className="w-[13px] h-[13px]" />
              )}
              {isEdit ? "Save" : "Add Staff"}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

// ── Adjustment Limit Modal ──────────────────────────────────────────────────
// Standalone modal, separate from StaffFormModal, dedicated to CHANGING the
// max lab/bill adjustment limit for an EXISTING staff member. Reuses the
// same toggle-then-reveal pattern (0 = disabled per backend contract) and
// PUTs only `maxLabAdjustment` to its own dedicated route — this never
// touches permissions or isActive, which each have their own routes now.
// (The limit can also be set up front at creation time, in StaffFormModal.)

const AdjustmentModal = ({ member, onClose, onSaved }) => {
  const [enabled, setEnabled] = useState((member.maxLabAdjustment ?? 0) > 0);
  const [amount, setAmount] = useState(member.maxLabAdjustment ?? 0);
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState("");

  const toggle = () => {
    if (enabled) {
      setEnabled(false);
      setAmount(0);
    } else {
      setEnabled(true);
    }
    if (apiError) setApiError("");
  };

  const handleSubmit = async () => {
    if (enabled && (!amount || Number(amount) <= 0)) {
      return setApiError("অ্যাডজাস্টমেন্ট লিমিট প্রয়োজন।");
    }
    try {
      setSaving(true);
      setApiError("");
      await staffService.updateAdjustment({
        maxLabAdjustment: enabled ? Number(amount) : 0,
        _id: member._id,
      });
      onSaved();
    } catch (err) {
      setApiError(getErrorMessage(err, "সমস্যা হয়েছে। আবার চেষ্টা করুন।"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen size="sm" onClose={onClose}>
      <div className="flex flex-col overflow-hidden">
        {/* Header */}
        <div
          className="shrink-0 px-6 py-5 flex items-center justify-between border-b border-[#6366F120]"
          style={{ background: "linear-gradient(135deg,#6366F115 0%,#4F46E508 100%)" }}
        >
          <div className="flex items-center gap-3.5">
            <div
              className="flex items-center justify-center shrink-0 w-11 h-11 rounded-[14px]"
              style={{ background: "linear-gradient(135deg,#6366F1,#4F46E5)", boxShadow: "0 8px 20px #6366F140" }}
            >
              <Wallet className="w-[18px] h-[18px] text-white" />
            </div>
            <div>
              <p className="font-['IBM_Plex_Mono',monospace] text-[10px] font-bold uppercase tracking-[0.1em] mb-[2px] text-[#6366F1]">
                অ্যাডজাস্টমেন্ট লিমিট
              </p>
              <p className="font-['IBM_Plex_Sans',sans-serif] text-base font-bold text-[#0F172A]">{member.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-[10px] text-[#94A3B8] border-[1.5px] border-[#E2E8F0] transition-all hover:bg-[#F1F5F9] hover:text-[#0F172A]"
          >
            <X className="w-[15px] h-[15px]" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 bg-[#F8FAFC]">
          <div className="border-[1.5px] border-[#E2E8F0] rounded-2xl overflow-hidden bg-white">
            <button type="button" onClick={toggle} className="w-full flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <Wallet className="w-3 h-3 text-[#6366F1]" />
                <span className="font-['IBM_Plex_Mono',monospace] text-[10px] font-bold uppercase tracking-[0.08em] text-[#64748B]">
                  বিল অ্যাডজাস্টমেন্ট
                </span>
              </div>
              <ToggleSwitch checked={enabled} />
            </button>
            {enabled && (
              <div className="px-4 pb-3.5">
                <input
                  type="number"
                  min="0"
                  value={amount === 0 ? "" : amount}
                  onChange={(e) => {
                    setAmount(e.target.value === "" ? "" : Number(e.target.value));
                    if (apiError) setApiError("");
                  }}
                  placeholder="সর্বোচ্চ পরিমাণ (৳)"
                  className={`${inputBase} px-3 py-2.5 text-sm`}
                  onFocus={focusInput}
                  onBlur={blurInput}
                  autoFocus
                />
                <p className="mt-1 font-['IBM_Plex_Mono',monospace] text-[10px] text-[#94A3B8]">
                  এই কর্মী সর্বোচ্চ এই পরিমাণ পর্যন্ত বিল অ্যাডজাস্টমেন্ট করতে পারবেন।
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 bg-white border-t border-[#E2E8F0]">
          {apiError && (
            <div className="mx-6 mt-4 flex items-start gap-2.5 px-4 py-3 bg-[#EF444408] border-[1.5px] border-[#EF444430] rounded-xl">
              <AlertTriangle className="w-[14px] h-[14px] text-[#EF4444] shrink-0 mt-[1px]" />
              <span className="text-xs font-['IBM_Plex_Mono',monospace] text-[#EF4444]">{apiError}</span>
            </div>
          )}
          <div className="px-6 py-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 py-3 font-semibold transition-all rounded-xl border-[1.5px] border-[#E2E8F0] text-[#64748B] font-['IBM_Plex_Mono',monospace] text-xs hover:bg-[#F1F5F9]"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex-1 py-3 flex items-center justify-center gap-2 font-semibold transition-all rounded-xl border-none text-white font-['IBM_Plex_Mono',monospace] text-xs"
              style={{
                background: saving ? C.muted : "linear-gradient(135deg,#6366F1,#4F46E5)",
                cursor: saving ? "not-allowed" : "pointer",
              }}
            >
              {saving ? (
                <span className="animate-spin inline-block w-[14px] h-[14px] rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <Wallet className="w-[13px] h-[13px]" />
              )}
              Save
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

// ── Action Chip ────────────────────────────────────────────────────────────────

const ActionChip = ({ onClick, icon: Icon, label, color }) => (
  <button
    onClick={onClick}
    className="inline-flex items-center gap-1.5 transition-all font-semibold px-3 py-[5px] rounded-lg font-['IBM_Plex_Mono',monospace] text-[11px]"
    style={{ border: `1.5px solid ${color}25`, color, background: `${color}08` }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = `${color}18`;
      e.currentTarget.style.borderColor = `${color}50`;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = `${color}08`;
      e.currentTarget.style.borderColor = `${color}25`;
    }}
  >
    <Icon className="w-[11px] h-[11px]" />
    {label}
  </button>
);

// ── Staff Row ──────────────────────────────────────────────────────────────────

const StaffRow = ({ member, index, permissionsList, onEdit, onAdjust, onDelete, onDeactivate, onActivate }) => {
  const [expanded, setExpanded] = useState(false);
  const activePerms = permissionsList.filter((p) => member.permissions[p.key]);
  const hasFullAccess = activePerms.length === permissionsList.length;

  const roleLabel = member.role === "admin" ? "অ্যাডমিন" : member.role === "staff" ? "স্টাফ" : "অন্যান্য";

  const roleColor =
    member.role === "admin"
      ? { bg: "bg-[#8B5CF615]", border: "border-[#8B5CF630]", text: "text-[#8B5CF6]" }
      : member.role === "staff"
        ? { bg: "bg-[#6366F115]", border: "border-[#6366F130]", text: "text-[#6366F1]" }
        : { bg: "bg-[#94A3B815]", border: "border-[#94A3B830]", text: "text-[#64748B]" };

  return (
    <div className={`transition-all border-b border-[#E2E8F0] ${member.isActive ? "opacity-100" : "opacity-55"}`}>
      <button onClick={() => setExpanded((v) => !v)} className="w-full text-left">
        <div className="flex items-center gap-3 py-3 px-2 rounded-xl transition-all hover:bg-[#F1F5F9]">
          <span className="flex items-center justify-center shrink-0 w-[26px] h-[26px] rounded-lg bg-[#EEF2FF] font-['IBM_Plex_Mono',monospace] text-[10px] font-bold text-[#64748B]">
            {String(index + 1).padStart(2, "0")}
          </span>
          <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
            <span className="font-['IBM_Plex_Sans',sans-serif] text-sm font-semibold text-[#0F172A]">
              {member.name}
            </span>
            <span
              className={`font-['IBM_Plex_Mono',monospace] text-[10px] font-bold px-1.5 py-px rounded-[6px] border-[1.5px] ${roleColor.bg} ${roleColor.border} ${roleColor.text}`}
            >
              {roleLabel}
            </span>
            {!member.isActive && (
              <span className="font-['IBM_Plex_Mono',monospace] text-[10px] font-bold text-[#EF4444] bg-[#EF444410] border border-[#EF444425] rounded-[6px] px-1.5 py-px">
                নিষ্ক্রিয়
              </span>
            )}
          </div>
          {member.role !== "admin" && hasFullAccess && (
            <span className="shrink-0 hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-lg border-[1.5px] font-['IBM_Plex_Mono',monospace] text-[10px] font-bold bg-[#6366F115] border-[#6366F130] text-[#6366F1]">
              <Shield className="w-[10px] h-[10px]" /> সম্পূর্ণ
            </span>
          )}
          {member.role !== "admin" && !hasFullAccess && (
            <span className="shrink-0 font-['IBM_Plex_Mono',monospace] text-[10px] text-[#94A3B8]">
              {activePerms.length}/{permissionsList.length}
            </span>
          )}
          <ChevronDown
            className={`w-[14px] h-[14px] text-[#94A3B8] transition-transform duration-200 shrink-0 ${expanded ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {expanded && (
        <div
          className="mx-2 mb-3 px-4 py-3 rounded-xl border border-[#E2E8F0]"
          style={{ background: "linear-gradient(135deg,#F8FAFC,#EEF2FF)" }}
        >
          {/* Contact */}
          <div className="font-['IBM_Plex_Mono',monospace] text-xs text-[#64748B] leading-loose mb-3">
            {member.email && (
              <p className="flex items-center gap-1.5">
                <Mail className="w-3 h-3 text-[#6366F1]" /> {member.email}
              </p>
            )}
            {member.phone && (
              <p className="flex items-center gap-1.5">
                <Phone className="w-3 h-3 text-[#6366F1]" /> {member.phone}
              </p>
            )}
            {member.role !== "admin" && member.maxLabAdjustment > 0 && (
              <p className="flex items-center gap-1.5">
                <Wallet className="w-3 h-3 text-[#6366F1]" /> সর্বোচ্চ অ্যাডজাস্টমেন্ট ৳{member.maxLabAdjustment}
              </p>
            )}
          </div>

          {/* Permissions — flat, side-by-side badges (not grouped). Not
              shown for admins who always have full, fixed access. Grouping
              is reserved for the edit modal only. */}
          {member.role !== "admin" && (
            <div className="mb-3">
              <p className="font-['IBM_Plex_Mono',monospace] text-[9px] font-bold uppercase tracking-[0.08em] text-[#94A3B8] mb-1.5">
                অনুমতিসমূহ ({activePerms.length}/{permissionsList.length})
              </p>
              {activePerms.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {activePerms.map(({ key, label }) => (
                    <span
                      key={key}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-['IBM_Plex_Mono',monospace] text-[10px] font-semibold border"
                      style={{ color: C.indigo, background: `${C.indigo}12`, borderColor: `${C.indigo}30` }}
                    >
                      {label}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="font-['IBM_Plex_Mono',monospace] text-[11px] text-[#94A3B8] italic">কোনো অনুমতি নেই</p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {member.role !== "admin" && (
              <ActionChip onClick={onEdit} icon={Pencil} label="Permissions" color={C.indigo} />
            )}
            {member.role !== "admin" && (
              <ActionChip onClick={onAdjust} icon={Wallet} label="Adjustment Limit" color={C.purple} />
            )}
            {member.role === "admin" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-[5px] font-['IBM_Plex_Mono',monospace] text-[11px] font-semibold text-[#94A3B8]">
                <Shield className="w-[11px] h-[11px]" /> অ্যাডমিন অ্যাকাউন্ট সুরক্ষিত
              </span>
            )}
            {member.role !== "admin" && (
              <>
                {member.isActive ? (
                  <ActionChip onClick={onDeactivate} icon={UserX} label="Deactivate" color={C.amber} />
                ) : (
                  <ActionChip onClick={onActivate} icon={UserCheck} label="Activate" color={C.green} />
                )}
                <ActionChip onClick={onDelete} icon={Trash2} label="Delete" color={C.red} />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Section Divider ────────────────────────────────────────────────────────────

const SectionDivider = ({ title, count, color }) => (
  <div className="flex items-center gap-2 pt-3 pb-1 first:pt-0">
    <span
      className="font-['IBM_Plex_Mono',monospace] text-[9px] font-bold uppercase tracking-[0.1em]"
      style={{ color }}
    >
      {title}
    </span>
    <span
      className="font-['IBM_Plex_Mono',monospace] text-[10px] font-bold px-1.5 py-px rounded-[5px]"
      style={{ color, background: `${color}12`, border: `1px solid ${color}25` }}
    >
      {count}
    </span>
    <div className="flex-1 h-px" style={{ background: `${color}20` }} />
  </div>
);

// ── Filter Dropdown ────────────────────────────────────────────────────────────

const FilterDropdown = ({ value, onChange, options }) => (
  <div className="relative">
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`appearance-none outline-none cursor-pointer transition-all font-['IBM_Plex_Mono',monospace] text-xs rounded-[10px] py-[7px] pl-3 pr-[30px] border-[1.5px]
        ${value !== "all" ? "border-[#6366F160] bg-[#6366F108] text-[#0F172A] shadow-[0_2px_8px_#6366F115]" : "border-[#E2E8F0] bg-white text-[#64748B]"}`}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
    <ChevronDown className="w-3 h-3 text-[#94A3B8] absolute right-[9px] top-1/2 -translate-y-1/2 pointer-events-none" />
  </div>
);

// ── Stat Card ──────────────────────────────────────────────────────────────────

const StatCard = ({ label, value, color, grad, icon: Icon }) => (
  <div className="bg-white relative overflow-hidden border border-[#E2E8F0] rounded-2xl p-[14px_16px] shadow-[0_2px_8px_rgba(15,23,42,0.05)]">
    <div className="absolute top-0 right-0 w-16 h-16 opacity-5 rounded-[0_16px_0_100%]" style={{ background: grad }} />
    <div className="flex items-center gap-2 mb-2">
      <div className="flex items-center justify-center w-[26px] h-[26px] rounded-lg" style={{ background: grad }}>
        <Icon className="w-[13px] h-[13px] text-white" />
      </div>
      <p className="font-['IBM_Plex_Mono',monospace] text-[9px] font-bold uppercase tracking-[0.06em] text-[#94A3B8]">
        {label}
      </p>
    </div>
    <p className="font-['IBM_Plex_Mono',monospace] text-[26px] font-extrabold leading-none" style={{ color }}>
      {value}
    </p>
  </div>
);

// ── Skeleton ───────────────────────────────────────────────────────────────────

const Skeleton = () => (
  <div className="bg-white animate-pulse overflow-hidden border border-[#E2E8F0] rounded-[20px]">
    <div className="px-6 py-4 flex gap-4 border-b border-[#E2E8F0]">
      {[120, 70, 90].map((w, i) => (
        <div key={i} className="h-3 bg-[#E2E8F0] rounded-md" style={{ width: w }} />
      ))}
    </div>
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="flex items-center gap-3 px-6 py-3.5 border-b border-[#E2E8F0]">
        <div className="w-[26px] h-[26px] bg-[#E2E8F0] rounded-lg" />
        <div className="flex-1 h-[13px] bg-[#E2E8F0] rounded-md" />
        <div className="w-[50px] h-[22px] bg-[#E2E8F0] rounded-lg" />
      </div>
    ))}
  </div>
);

// ── Main Page ──────────────────────────────────────────────────────────────────

const ManageStaff = () => {
  const labType = useAuthStore((s) => s.lab?.type); // "hospital" | "diagnosticCenter"

  const [staff, setStaff] = useState([]);
  const [permissionsList, setPermissionsList] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [popup, setPopup] = useState(null);
  const [formModal, setFormModal] = useState(null); // null | {} | member object
  const [adjustModal, setAdjustModal] = useState(null); // null | member object
  // Delete / activate / deactivate confirmations use the shared
  // <Popup type="warning"> directly (see render section below), not a
  // bespoke modal — same pattern as Products.jsx / ManageReferrer.jsx /
  // ManageTests.jsx. `modal` just carries which action + which member.
  const [modal, setModal] = useState(null); // { type: "delete" | "deactivate" | "activate", member }
  const [search, setSearch] = useState("");
  const [permFilter, setPermFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const boot = async () => {
      try {
        const [staffRes, permsRes] = await Promise.all([staffService.getStaffs(), staticDataAPI.getStaffPermissions()]);
        setStaff(staffRes.data);
        const visiblePerms = permsRes.data.permissions.filter(
          (p) => p.for !== "hospitalOnly" || labType === "hospital",
        );
        setPermissionsList(visiblePerms);
      } catch (err) {
        setPopup({ type: "error", message: getErrorMessage(err, "ডেটা লোড করতে ব্যর্থ।") });
      } finally {
        setInitialLoading(false);
      }
    };
    boot();
  }, [labType]);

  const loadStaff = async () => {
    try {
      const res = await staffService.getStaffs();
      setStaff(res.data);
    } catch (err) {
      setPopup({ type: "error", message: getErrorMessage(err, "কর্মী লোড করতে ব্যর্থ।") });
    }
  };

  // Derived permission filter options — always in sync with the server list
  const permFilterOptions = [
    { value: "all", label: "সব অনুমতি" },
    ...permissionsList.map((p) => ({ value: p.key, label: p.label })),
  ];

  const stats = {
    total: staff.length,
    active: staff.filter((s) => s.isActive).length,
    inactive: staff.filter((s) => !s.isActive).length,
    fullAccess: staff.filter((s) => s.role === "admin" || permissionsList.every((p) => s.permissions[p.key])).length,
  };

  const filtered = staff.filter((s) => {
    if (permFilter !== "all" && !s.permissions[permFilter]) return false;
    if (statusFilter === "active" && !s.isActive) return false;
    if (statusFilter === "inactive" && s.isActive) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return s.name.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q) || s.phone?.includes(q);
    }
    return true;
  });

  const admins = filtered.filter((s) => s.role === "admin");
  const staffMembers = filtered.filter((s) => s.role === "staff");
  const others = filtered.filter((s) => s.role !== "admin" && s.role !== "staff");

  const handleSaved = async (isEdit) => {
    setFormModal(null);
    await loadStaff();
    setPopup({ type: "success", message: isEdit ? "কর্মী আপডেট হয়েছে।" : "কর্মী নিবন্ধিত হয়েছে।" });
  };

  const handleAdjustSaved = async () => {
    setAdjustModal(null);
    await loadStaff();
    setPopup({ type: "success", message: "অ্যাডজাস্টমেন্ট লিমিট আপডেট হয়েছে।" });
  };

  // No in-flight spinner on the confirm popup itself — it closes as soon as
  // onConfirm fires, so a failure just surfaces as a follow-up error toast.
  // Mirrors handleDelete in Products.jsx / ManageReferrer.jsx / ManageTests.jsx.
  const handleDelete = async (member) => {
    try {
      await staffService.deleteStaff(member._id);
      setStaff((prev) => prev.filter((m) => m._id !== member._id));
      setPopup({ type: "success", message: "কর্মী মুছে ফেলা হয়েছে।" });
    } catch (err) {
      if (getErrorStatus(err) === 404) {
        setStaff((prev) => prev.filter((m) => m._id !== member._id));
      }
      setPopup({ type: "error", message: getErrorMessage(err, "কর্মী মুছতে ব্যর্থ।") });
    }
  };

  const handleToggle = async (member, activate) => {
    try {
      activate ? await staffService.activateStaff(member._id) : await staffService.deactivateStaff(member._id);
      setStaff((prev) => prev.map((m) => (m._id === member._id ? { ...m, isActive: activate } : m)));
      setPopup({ type: "success", message: `কর্মী ${activate ? "সক্রিয়" : "নিষ্ক্রিয়"} করা হয়েছে।` });
    } catch (err) {
      setPopup({ type: "error", message: getErrorMessage(err, "স্ট্যাটাস পরিবর্তন ব্যর্থ।") });
    }
  };

  const hasFilters = permFilter !== "all" || statusFilter !== "all" || search !== "";

  const rowProps = (member) => ({
    member,
    permissionsList,
    onEdit: () => setFormModal(member),
    onAdjust: () => setAdjustModal(member),
    onDelete: () => setModal({ type: "delete", member }),
    onDeactivate: () => setModal({ type: "deactivate", member }),
    onActivate: () => setModal({ type: "activate", member }),
  });

  return (
    <section
      className="min-h-screen px-4 py-6 font-[Noto_Sans_Bengali,sans-serif]"
      style={{ background: "linear-gradient(to bottom right,#f8fafc,#eff6ff,#eef2ff)" }}
    >
      {popup && <Popup type={popup.type} message={popup.message} onClose={() => setPopup(null)} />}

      {formModal !== null && (
        <StaffFormModal
          initial={formModal._id ? formModal : null}
          permissionsList={permissionsList}
          onClose={() => setFormModal(null)}
          onSaved={handleSaved}
        />
      )}

      {adjustModal !== null && (
        <AdjustmentModal member={adjustModal} onClose={() => setAdjustModal(null)} onSaved={handleAdjustSaved} />
      )}

      {modal?.type === "delete" && (
        <Popup
          type="warning"
          message={`"${modal.member.name}"-এর সমস্ত তথ্য স্থায়ীভাবে মুছে যাবে। এই কাজ পূর্বাবস্থায় ফেরানো যাবে না।`}
          confirmText="হ্যাঁ, মুছুন"
          cancelText="রাখুন"
          onConfirm={() => handleDelete(modal.member)}
          onClose={() => setModal(null)}
        />
      )}

      {modal?.type === "deactivate" && (
        <Popup
          type="warning"
          message={`"${modal.member.name}"-কে নিষ্ক্রিয় করলে তিনি সিস্টেমে প্রবেশ করতে পারবেন না।`}
          confirmText="হ্যাঁ, নিষ্ক্রিয় করুন"
          cancelText="বাতিল"
          onConfirm={() => handleToggle(modal.member, false)}
          onClose={() => setModal(null)}
        />
      )}

      {modal?.type === "activate" && (
        <Popup
          type="warning"
          message={`"${modal.member.name}"-কে সক্রিয় করলে তিনি পুনরায় সিস্টেমে প্রবেশ করতে পারবেন।`}
          confirmText="হ্যাঁ, সক্রিয় করুন"
          cancelText="বাতিল"
          onConfirm={() => handleToggle(modal.member, true)}
          onClose={() => setModal(null)}
        />
      )}

      <div className="max-w-2xl mx-auto">
        {/* Page header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="font-['IBM_Plex_Sans',sans-serif] text-[26px] font-bold text-[#0F172A] leading-tight">
              স্টাফ অ্যাকাউন্ট
            </h1>
            <p className="text-sm text-[#64748B] mt-1">অ্যাকাউন্ট ও অনুমতি পরিচালনা।</p>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Link
              to="/lab-management"
              className="flex items-center gap-1.5 transition-all font-semibold px-[14px] py-2 border-[1.5px] border-[#E2E8F0] rounded-xl text-[#64748B] font-['IBM_Plex_Mono',monospace] text-xs bg-white hover:bg-[#F1F5F9] hover:text-[#0F172A]"
            >
              <ArrowLeft className="w-[13px] h-[13px]" /> ফিরে
            </Link>
            <button
              onClick={() => setFormModal({})}
              className="flex items-center gap-1.5 transition-all font-semibold px-4 py-2 rounded-xl text-white font-['IBM_Plex_Mono',monospace] text-xs border-none shadow-[0_4px_14px_rgba(99,102,241,0.4)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.5)]"
              style={{ background: "linear-gradient(135deg,#6366F1,#4F46E5)" }}
            >
              <UserPlus className="w-[13px] h-[13px]" /> নতুন স্টাফ
            </button>
          </div>
        </div>

        {/* Stats */}
        {!initialLoading && (
          <div className="grid grid-cols-4 gap-3 mb-5">
            <StatCard
              label="মোট কর্মী"
              value={stats.total}
              color={C.indigo}
              grad="linear-gradient(135deg,#6366F1,#4F46E5)"
              icon={Users}
            />
            <StatCard
              label="সক্রিয়"
              value={stats.active}
              color={C.green}
              grad="linear-gradient(135deg,#10B981,#059669)"
              icon={ShieldCheck}
            />
            <StatCard
              label="নিষ্ক্রিয়"
              value={stats.inactive}
              color={C.red}
              grad="linear-gradient(135deg,#EF4444,#DC2626)"
              icon={ShieldOff}
            />
            <StatCard
              label="সম্পূর্ণ অ্যাক্সেস"
              value={stats.fullAccess}
              color={C.purple}
              grad="linear-gradient(135deg,#8B5CF6,#7C3AED)"
              icon={Shield}
            />
          </div>
        )}

        {/* Main card */}
        {initialLoading ? (
          <Skeleton />
        ) : (
          <div className="bg-white overflow-hidden border border-[#E2E8F0] rounded-[20px] shadow-[0_4px_20px_rgba(15,23,42,0.07)]">
            {/* Card header */}
            <div
              className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]"
              style={{ background: "linear-gradient(135deg,#F8FAFC,#EEF2FF)" }}
            >
              <div>
                <p className="font-['IBM_Plex_Mono',monospace] text-[10px] font-bold uppercase tracking-[0.1em] text-[#6366F1] mb-1">
                  কর্মী লেজার
                </p>
                <div className="flex items-center gap-3">
                  <span className="font-['IBM_Plex_Mono',monospace] text-[13px] font-semibold text-[#64748B]">
                    মোট {stats.total}জন
                  </span>
                  {stats.active > 0 && (
                    <span className="px-2 py-0.5 font-['IBM_Plex_Mono',monospace] text-[11px] font-bold text-[#10B981] bg-[#10B98110] rounded-[6px] border border-[#10B98125]">
                      সক্রিয় {stats.active}জন
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Toolbar */}
            <div className="px-4 py-3 flex flex-wrap items-center gap-2 border-b border-[#E2E8F0] bg-[#F8FAFC]">
              <div className="relative flex-[1_1_160px]">
                <Search className="w-[13px] h-[13px] text-[#94A3B8] absolute left-[11px] top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="নাম, ইমেইল বা ফোন…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={`${inputBase} pl-8 ${search ? "pr-8" : "pr-3"} py-2 text-xs`}
                  onFocus={focusInput}
                  onBlur={blurInput}
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-[10px] top-1/2 -translate-y-1/2 text-[#94A3B8]"
                  >
                    <X className="w-[13px] h-[13px]" />
                  </button>
                )}
              </div>
              <FilterDropdown value={permFilter} onChange={setPermFilter} options={permFilterOptions} />
              <FilterDropdown value={statusFilter} onChange={setStatusFilter} options={STATUS_OPTIONS} />
              {hasFilters && (
                <button
                  onClick={() => {
                    setPermFilter("all");
                    setStatusFilter("all");
                    setSearch("");
                  }}
                  className="flex items-center gap-1.5 transition-all font-semibold py-[7px] px-3 border-[1.5px] border-[#EF444430] rounded-[10px] text-[#EF4444] font-['IBM_Plex_Mono',monospace] text-[11px] bg-[#EF444406] hover:bg-[#EF444412]"
                >
                  <RotateCcw className="w-3 h-3" /> রিসেট
                </button>
              )}
            </div>

            {/* Column labels */}
            <div className="flex items-center gap-3 px-4 pt-3 pb-1">
              <span className="font-['IBM_Plex_Mono',monospace] text-[9px] font-bold uppercase tracking-[0.08em] text-[#94A3B8] w-[26px] shrink-0">
                #
              </span>
              <span className="font-['IBM_Plex_Mono',monospace] text-[9px] font-bold uppercase tracking-[0.08em] text-[#94A3B8] flex-1">
                কর্মী
              </span>
              <span className="font-['IBM_Plex_Mono',monospace] text-[9px] font-bold uppercase tracking-[0.08em] text-[#94A3B8] shrink-0">
                অনুমতি
              </span>
              <span className="w-[14px] shrink-0" />
            </div>

            {/* Rows */}
            <div className="px-4 pb-4">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2 text-[#94A3B8]">
                  <AlertCircle className="w-7 h-7 opacity-40" />
                  <p className="font-['IBM_Plex_Mono',monospace] text-xs">
                    {hasFilters ? "কোনো কর্মী পাওয়া যায়নি" : "এখনো কোনো কর্মী যোগ করা হয়নি"}
                  </p>
                </div>
              ) : (
                <>
                  {admins.length > 0 && (
                    <>
                      <SectionDivider title="অ্যাডমিন" count={admins.length} color={C.purple} />
                      {admins.map((m, i) => (
                        <StaffRow key={m._id} index={i} {...rowProps(m)} />
                      ))}
                    </>
                  )}
                  {staffMembers.length > 0 && (
                    <>
                      <SectionDivider title="স্টাফ" count={staffMembers.length} color={C.indigo} />
                      {staffMembers.map((m, i) => (
                        <StaffRow key={m._id} index={i} {...rowProps(m)} />
                      ))}
                    </>
                  )}
                  {others.length > 0 && (
                    <>
                      <SectionDivider title="অন্যান্য" count={others.length} color={C.sub} />
                      {others.map((m, i) => (
                        <StaffRow key={m._id} index={i} {...rowProps(m)} />
                      ))}
                    </>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-[#E2E8F0] bg-[#F8FAFC]">
              <p className="font-['IBM_Plex_Mono',monospace] text-[10px] text-[#94A3B8]">
                * শুধুমাত্র সক্রিয় কর্মীরা সিস্টেমে প্রবেশ করতে পারবেন
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default ManageStaff;
