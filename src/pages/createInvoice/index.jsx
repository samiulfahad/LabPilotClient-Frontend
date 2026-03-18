/**
 * useCallback / useMemo are intentionally absent throughout this file.
 * babel-plugin-react-compiler handles all memoization automatically.
 */
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Search,
  X,
  User,
  Phone,
  UserCircle,
  Check,
  Percent,
  DollarSign,
  Plus,
  Trash2,
  AlertCircle,
  Receipt,
  Sparkles,
  ChevronRight,
  Calendar,
  Building2,
  Wallet,
} from "lucide-react";
import Modal from "../../components/modal";
import Popup from "../../components/popup";
import invoiceService from "../../api/invoice";
import LoadingScreen from "../../components/loadingPage";

// ─── Constants ───────────────────────────────────────────────────────────────

const GENDERS = ["male", "female"];

const INITIAL_FORM = {
  patient: { name: "", gender: "", age: "", contactNumber: "" },
  referredBy: null,
  selectedTests: [],
  hasReferrerDiscount: false,
  referrerDiscount: 0,
  hasLabAdjustment: false,
  labAdjustmentAmount: 0,
  paidAmount: 0,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n) =>
  new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT", minimumFractionDigits: 0 }).format(n);

const toFixed2 = (n) => parseFloat(n.toFixed(2));

/**
 * For doctors: "Dr. Smith ( MBBS, FCPS )"
 * For others: just the name
 */
const formatReferrerName = (referrer) => {
  if (!referrer || typeof referrer !== "object") return referrer ?? "";
  if (referrer.type === "doctor" && referrer.degree?.trim()) return `${referrer.name} ( ${referrer.degree.trim()} )`;
  return referrer.name;
};

/** Discount the patient pays (subtracted from their bill) */
const calcReferrerDiscount = ({ referredBy, hasReferrerDiscount, referrerDiscount, initial }) => {
  if (!hasReferrerDiscount || typeof referredBy !== "object" || !referredBy) return 0;
  if (referredBy.commissionType === "percentage" && referrerDiscount > 0)
    return toFixed2((initial * referrerDiscount) / 100);
  if (referredBy.commissionType === "fixed") return toFixed2(parseFloat(referrerDiscount) || 0);
  return 0;
};

/** Commission owed to the referrer (gross − discount given to patient) */
const calcReferrerCommission = (referredBy, initial, referrerDiscountAmt) => {
  if (!referredBy?.commissionType || !referredBy?.commissionValue) return 0;
  const gross =
    referredBy.commissionType === "percentage"
      ? toFixed2((initial * referredBy.commissionValue) / 100)
      : referredBy.commissionValue;
  return Math.max(0, toFixed2(gross - referrerDiscountAmt));
};

/** Derive the full `amount` object from raw form state */
const computeAmount = (form) => {
  const initial = form.selectedTests.reduce((s, t) => s + (t.price || 0), 0);
  const labAdjustment = form.hasLabAdjustment ? parseFloat(form.labAdjustmentAmount) || 0 : 0;
  const referrerDiscount = calcReferrerDiscount({ ...form, initial });
  const referrerCommission = calcReferrerCommission(form.referredBy, initial, referrerDiscount);
  const afterLabAdjustment = initial - labAdjustment;
  const afterLabAdjustmentAndReferrerDiscount = afterLabAdjustment - referrerDiscount;
  const final = Math.max(0, afterLabAdjustmentAndReferrerDiscount);
  const net = Math.max(0, final - referrerCommission);
  const paid = parseFloat(form.paidAmount) || 0;
  return { initial, labAdjustment, referrerDiscount, referrerCommission, final, net, paid };
};

// ─── UI primitives ───────────────────────────────────────────────────────────

const Field = ({ label, required, optional, children }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1.5">
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
      {optional && <span className="text-gray-400 text-xs ml-1">(Optional)</span>}
    </label>
    {children}
  </div>
);

const IconInput = ({ icon: Icon, className = "", ...props }) => (
  <div className="relative">
    <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10" />
    <input
      className={`w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm
        focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${className}`}
      {...props}
    />
  </div>
);

const SectionCard = ({ icon: Icon, title, children }) => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
    <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
      <div className="p-2 bg-blue-50 rounded-lg">
        <Icon className="w-4 h-4 text-blue-600" />
      </div>
      <h3 className="font-medium text-gray-900">{title}</h3>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

const AmountRow = ({ label, value, accent, border, large }) => (
  <div
    className={`flex justify-between ${border ? "pt-2 border-t border-gray-200" : ""} ${large ? "pt-3 border-t-2 border-gray-200 text-base" : "text-sm"}`}
  >
    <span className={large ? "font-semibold text-gray-900" : "text-gray-600"}>{label}</span>
    <span className={`font-medium ${accent || (large ? "text-xl font-bold text-blue-600" : "text-gray-900")}`}>
      {value}
    </span>
  </div>
);

// ─── Invoice Summary modal ────────────────────────────────────────────────────

const InvoiceSummary = ({ formData, amount, onConfirm, onClose }) => {
  const { patient, referredBy, selectedTests, hasReferrerDiscount, referrerDiscount, hasLabAdjustment } = formData;
  const due = Math.max(0, amount.final - amount.paid);

  return (
    <div className="bg-white rounded-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-xl">
      {/* Header */}
      <div className="px-8 py-6 border-b border-gray-100 flex items-center gap-3">
        <div className="p-2.5 bg-blue-50 rounded-xl">
          <Receipt className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Invoice Preview</h2>
          <p className="text-sm text-gray-500">Review details before confirmation</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
        {/* Patient */}
        <SummaryBlock icon={UserCircle} title="Patient Details">
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <Detail label="Full Name" value={patient.name} />
            <Detail label="Gender" value={<span className="capitalize">{patient.gender}</span>} />
            <Detail label="Age" value={`${patient.age} years`} />
            <Detail label="Contact" value={patient.contactNumber} />
            {referredBy && (
              <div className="col-span-2">
                <p className="text-gray-500">Referred By</p>
                <p className="font-medium text-gray-900">{formatReferrerName(referredBy)}</p>
                {referredBy?.commissionValue > 0 && (
                  <p className="text-xs text-blue-600 mt-0.5">
                    Commission:{" "}
                    {referredBy.commissionType === "percentage"
                      ? `${referredBy.commissionValue}% = ${fmt(amount.referrerCommission)}`
                      : `Fixed ${fmt(amount.referrerCommission)}`}
                  </p>
                )}
              </div>
            )}
          </div>
        </SummaryBlock>

        {/* Tests */}
        <SummaryBlock
          icon={FileText}
          title="Diagnostic Tests"
          badge={`${selectedTests.length} ${selectedTests.length === 1 ? "Test" : "Tests"}`}
        >
          <div className="space-y-2">
            {selectedTests.map((t) => (
              <div key={t.testId} className="flex items-center justify-between p-3 bg-white rounded-lg">
                <span className="text-sm text-gray-900">{t.name}</span>
                <span className="text-sm font-medium text-gray-900">{fmt(t.price)}</span>
              </div>
            ))}
          </div>
        </SummaryBlock>

        {/* Payment */}
        <SummaryBlock icon={DollarSign} title="Payment Summary">
          <div className="space-y-2 text-sm">
            <AmountRow label="Subtotal" value={fmt(amount.initial)} />
            {hasReferrerDiscount && amount.referrerDiscount > 0 && (
              <>
                <AmountRow
                  label={`Referrer Discount ${referredBy?.commissionType === "percentage" ? `(${referrerDiscount}%)` : "(Fixed)"}`}
                  value={`- ${fmt(amount.referrerDiscount)}`}
                  accent="text-red-600"
                />
                <AmountRow label="After Referrer Discount" value={fmt(amount.final)} border />
              </>
            )}
            {hasLabAdjustment && amount.labAdjustment > 0 && (
              <AmountRow label="Lab Adjustment" value={`- ${fmt(amount.labAdjustment)}`} accent="text-red-600" border />
            )}
            <AmountRow label="Total Amount" value={fmt(amount.final)} large />
            <div className="mt-3 pt-3 border-t border-dashed border-gray-300 space-y-2">
              <AmountRow
                label={
                  <span className="flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5 text-green-600" /> Paid Amount
                  </span>
                }
                value={fmt(amount.paid)}
                accent="text-green-600"
              />
              {due > 0 ? (
                <AmountRow label="Due Amount" value={fmt(due)} accent="text-red-600" />
              ) : (
                <div className="flex items-center justify-end gap-1.5">
                  <Check className="w-3.5 h-3.5 text-green-600" />
                  <span className="text-green-600 text-xs font-medium">Fully Paid</span>
                </div>
              )}
            </div>
          </div>
        </SummaryBlock>
      </div>

      <div className="border-t border-gray-100 px-8 py-4 flex items-center justify-end gap-3">
        <button
          onClick={onClose}
          className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          Confirm & Create
        </button>
      </div>
    </div>
  );
};

const SummaryBlock = ({ icon: Icon, title, badge, children }) => (
  <div className="bg-gray-50 rounded-xl p-5">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <div className="p-1.5 bg-white rounded-lg shadow-sm">
          <Icon className="w-4 h-4 text-gray-700" />
        </div>
        <h3 className="font-medium text-gray-900">{title}</h3>
      </div>
      {badge && <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">{badge}</span>}
    </div>
    {children}
  </div>
);

const Detail = ({ label, value }) => (
  <div>
    <p className="text-gray-500">{label}</p>
    <p className="font-medium text-gray-900">{value}</p>
  </div>
);

// ─── Invoice Form ─────────────────────────────────────────────────────────────

const InvoiceForm = ({
  formData,
  amount,
  availableReferrers,
  availableTests,
  onChange,
  onPatientChange,
  onTestToggle,
  onSubmit,
  pendingReferrerNameRef,
}) => {
  const [referrerQuery, setReferrerQuery] = useState("");
  const [testQuery, setTestQuery] = useState("");
  const [showReferrerDrop, setShowReferrerDrop] = useState(false);
  const [showTestDrop, setShowTestDrop] = useState(false);
  const testDropRef = useRef(null);

  const {
    patient,
    referredBy,
    selectedTests,
    hasReferrerDiscount,
    referrerDiscount,
    hasLabAdjustment,
    labAdjustmentAmount,
    paidAmount,
  } = formData;
  const due = Math.max(0, amount.final - amount.paid);

  // Close test dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (testDropRef.current && !testDropRef.current.contains(e.target)) setShowTestDrop(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Name-only search
  const filteredReferrers = referrerQuery.trim()
    ? availableReferrers.filter((r) => r.name.toLowerCase().includes(referrerQuery.toLowerCase()))
    : availableReferrers;

  const filteredTests = testQuery.trim()
    ? availableTests.filter((t) => t.name.toLowerCase().includes(testQuery.toLowerCase()))
    : availableTests;

  const selectReferrer = (r) => {
    onChange("referredBy", r);
    setShowReferrerDrop(false);
    setReferrerQuery("");
  };

  const referrerDisplayValue =
    referredBy && typeof referredBy === "object" ? formatReferrerName(referredBy) : referrerQuery;

  const clearReferrer = (e) => {
    e.preventDefault();
    onChange("referredBy", null);
    setReferrerQuery("");
    if (pendingReferrerNameRef) pendingReferrerNameRef.current = "";
  };

  const handleReferrerDiscountToggle = (checked) => {
    onChange("hasReferrerDiscount", checked);
    onChange("referrerDiscount", checked ? referredBy?.commissionValue || 0 : 0);
  };

  const handleLabAdjustToggle = (checked) => {
    onChange("hasLabAdjustment", checked);
    if (!checked) onChange("labAdjustmentAmount", 0);
  };

  const clampDiscount = (val) => {
    if (val === "") return onChange("referrerDiscount", "");
    const max = referredBy?.commissionValue ?? (referredBy?.commissionType === "percentage" ? 100 : Infinity);
    onChange("referrerDiscount", Math.min(parseFloat(val) || 0, max));
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* ── Patient Information ─────────────────────────────────── */}
      <SectionCard icon={UserCircle} title="Patient Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Patient Name" required>
            <IconInput
              icon={User}
              value={patient.name}
              onChange={(e) => onPatientChange("name", e.target.value)}
              placeholder="Enter patient's full name"
              required
            />
          </Field>

          <Field label="Age" required>
            <IconInput
              icon={Calendar}
              type="number"
              value={patient.age}
              onChange={(e) => onPatientChange("age", e.target.value)}
              placeholder="Enter age"
              min="0"
              max="150"
              required
            />
          </Field>

          <Field label="Contact Number" required>
            <IconInput
              icon={Phone}
              type="tel"
              value={patient.contactNumber}
              onChange={(e) => onPatientChange("contactNumber", e.target.value)}
              placeholder="01XXXXXXXXX"
              maxLength={11}
              required
            />
          </Field>

          <Field label="Gender" required>
            <div className="flex gap-2">
              {GENDERS.map((g) => (
                <label
                  key={g}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 border rounded-lg cursor-pointer transition-all text-sm font-medium select-none ${
                    patient.gender === g
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-300 text-gray-600 hover:border-gray-400 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="gender"
                    value={g}
                    checked={patient.gender === g}
                    onChange={() => onPatientChange("gender", g)}
                    className="sr-only"
                    required={!patient.gender}
                  />
                  <span className="capitalize">{g}</span>
                </label>
              ))}
            </div>
          </Field>

          <div className="md:col-span-2">
            <Field label="Referred By" optional>
              <div className="relative">
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                  <input
                    type="text"
                    value={referrerDisplayValue}
                    onChange={(e) => {
                      setReferrerQuery(e.target.value);
                      if (pendingReferrerNameRef) pendingReferrerNameRef.current = e.target.value;
                      if (typeof referredBy === "object") onChange("referredBy", null);
                      setShowReferrerDrop(true);
                    }}
                    onFocus={() => setShowReferrerDrop(true)}
                    onBlur={() => {
                      if (referrerQuery.trim() && typeof referredBy !== "object")
                        onChange("referredBy", referrerQuery.trim());
                      setShowReferrerDrop(false);
                    }}
                    className="w-full pl-9 pr-9 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="Search by name"
                  />
                  {referredBy && (
                    <button
                      type="button"
                      onMouseDown={clearReferrer}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {showReferrerDrop && referrerQuery && (
                  <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto z-20">
                    {filteredReferrers.length > 0 ? (
                      filteredReferrers.map((r) => (
                        <button
                          key={r._id}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            selectReferrer(r);
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900 text-sm">{formatReferrerName(r)}</p>
                              {r.commissionValue > 0 && (
                                <p className="text-xs text-blue-500 mt-0.5">
                                  Commission:{" "}
                                  {r.commissionType === "percentage"
                                    ? `${r.commissionValue}%`
                                    : `Fixed ${fmt(r.commissionValue)}`}
                                </p>
                              )}
                            </div>
                            {r.type && (
                              <span
                                className={`px-2 py-0.5 text-xs font-medium rounded capitalize ${
                                  r.type === "doctor"
                                    ? "bg-blue-100 text-blue-700"
                                    : r.type === "agent"
                                      ? "bg-amber-100 text-amber-700"
                                      : "bg-teal-100 text-teal-700"
                                }`}
                              >
                                {r.type}
                              </span>
                            )}
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-center text-xs text-gray-400">No matching referrers</div>
                    )}
                  </div>
                )}
              </div>
              {referredBy?.commissionValue > 0 && (
                <p className="mt-1 text-xs text-blue-600 pl-1">
                  Commission:{" "}
                  {referredBy.commissionType === "percentage"
                    ? `${referredBy.commissionValue}% of subtotal`
                    : `Fixed ${fmt(referredBy.commissionValue)}`}
                </p>
              )}
            </Field>
          </div>
        </div>
      </SectionCard>

      {/* ── Diagnostic Tests ────────────────────────────────────── */}
      <SectionCard icon={FileText} title="Diagnostic Tests">
        <div className="relative mb-5" ref={testDropRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={testQuery}
              onChange={(e) => {
                setTestQuery(e.target.value);
                setShowTestDrop(true);
              }}
              onFocus={() => setShowTestDrop(true)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              placeholder="Search tests by name..."
            />
          </div>
          {showTestDrop && testQuery && (
            <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto z-20">
              {filteredTests.length > 0 ? (
                filteredTests.map((test) => {
                  const selected = selectedTests.some((t) => t.testId === test.testId);
                  return (
                    <button
                      key={test.testId}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        onTestToggle(test);
                        setTestQuery("");
                      }}
                      className={`w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0 ${selected ? "bg-blue-50" : ""}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{test.name}</p>
                          <p className="text-xs text-blue-600 font-medium">{fmt(test.price)}</p>
                        </div>
                        {selected && (
                          <div className="p-1 bg-blue-600 rounded-full">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="px-4 py-6 text-center text-gray-500 text-sm">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p>No tests found</p>
                </div>
              )}
            </div>
          )}
        </div>

        {selectedTests.length > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-700">Selected Tests</h4>
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                {selectedTests.length} Selected
              </span>
            </div>
            <div className="space-y-2">
              {selectedTests.map((test) => (
                <div
                  key={test.testId}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{test.name}</p>
                    <p className="text-xs text-blue-600 font-medium">{fmt(test.price)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onTestToggle(test)}
                    className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-white rounded-full shadow-sm mb-3">
              <Plus className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-gray-900 font-medium mb-1">No tests selected</p>
            <p className="text-sm text-gray-500">Search and add tests using the search bar above</p>
          </div>
        )}
      </SectionCard>

      {/* ── Pricing & Adjustments ───────────────────────────────── */}
      <SectionCard icon={DollarSign} title="Pricing & Adjustments">
        <div className="space-y-5">
          <div className="p-4 bg-gray-50 rounded-lg flex items-center justify-between">
            <span className="text-sm text-gray-600">Subtotal Amount</span>
            <span className="text-xl font-semibold text-gray-900">{fmt(amount.initial)}</span>
          </div>

          {/* Referrer Discount */}
          {referredBy && typeof referredBy === "object" && (
            <div className="space-y-3">
              <CheckboxToggle
                checked={hasReferrerDiscount}
                onChange={handleReferrerDiscountToggle}
                icon={Percent}
                label="Apply Referrer Discount"
              />
              {hasReferrerDiscount && (
                <div className="ml-6 p-4 bg-blue-50 rounded-lg border border-blue-100 space-y-3">
                  <Field
                    label={
                      <>
                        {referredBy.commissionType === "percentage" ? "Discount Percentage" : "Discount Amount"}
                        <span className="ml-1.5 text-xs font-normal text-blue-600">
                          (max{" "}
                          {referredBy.commissionType === "percentage"
                            ? `${referredBy.commissionValue}%`
                            : fmt(referredBy.commissionValue)}
                          )
                        </span>
                      </>
                    }
                  >
                    <IconInput
                      icon={referredBy.commissionType === "percentage" ? Percent : DollarSign}
                      type="number"
                      value={referrerDiscount}
                      onChange={(e) => clampDiscount(e.target.value)}
                      min="0"
                      max={referredBy.commissionValue}
                      step="0.01"
                    />
                  </Field>
                  <div className="p-3 bg-white rounded-lg border border-blue-200 flex items-center justify-between text-sm">
                    <span className="text-gray-600">After Referrer Discount</span>
                    <span className="font-medium text-blue-600">{fmt(amount.final)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Lab Adjustment */}
          <div className="space-y-3">
            <CheckboxToggle
              checked={hasLabAdjustment}
              onChange={handleLabAdjustToggle}
              icon={DollarSign}
              label="Apply Lab Adjustment"
            />
            {hasLabAdjustment && (
              <div className="ml-6 p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                <Field label="Lab Adjustment Amount">
                  <IconInput
                    icon={DollarSign}
                    type="number"
                    value={labAdjustmentAmount}
                    onChange={(e) => onChange("labAdjustmentAmount", parseFloat(e.target.value) || 0)}
                    placeholder="Enter adjustment amount"
                    min="0"
                    step="0.01"
                  />
                </Field>
              </div>
            )}
          </div>

          {/* Final total */}
          <div className="p-5 bg-blue-600 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-white" />
              <span className="text-sm font-medium text-white uppercase tracking-wide">Total Amount</span>
            </div>
            <span className="text-2xl font-bold text-white">{fmt(amount.final)}</span>
          </div>

          {/* Paid Amount */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-green-50 rounded">
                <Wallet className="w-3.5 h-3.5 text-green-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">Paid Amount</span>
            </div>
            <IconInput
              icon={Wallet}
              type="number"
              value={paidAmount}
              onChange={(e) => onChange("paidAmount", parseFloat(e.target.value) || 0)}
              placeholder="Enter amount paid by patient"
              min="0"
              step="0.01"
              className="focus:ring-green-500/20 focus:border-green-500"
            />
            {amount.final > 0 && (
              <div className="p-4 rounded-lg border border-gray-200 bg-gray-50 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Paid
                  </span>
                  <span className="font-medium text-green-600">{fmt(amount.paid)}</span>
                </div>
                {due > 0 ? (
                  <div className="flex justify-between">
                    <span className="text-gray-600 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Due
                    </span>
                    <span className="font-medium text-red-600">{fmt(due)}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-green-600 font-medium">
                    <Check className="w-3.5 h-3.5" /> Fully Paid
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </SectionCard>

      <div className="flex justify-end">
        <button
          type="submit"
          className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2"
        >
          <Receipt className="w-4 h-4" />
          <span>Preview Invoice</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
};

const CheckboxToggle = ({ checked, onChange, icon: Icon, label }) => (
  <label className="flex items-center gap-2 cursor-pointer">
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
    />
    <div className="flex items-center gap-1.5">
      <div className="p-1.5 bg-white rounded">
        <Icon className="w-3.5 h-3.5 text-blue-600" />
      </div>
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </div>
  </label>
);

// ─── Skeleton loader ──────────────────────────────────────────────────────────

const FormSkeleton = () => (
  <div className="space-y-5">
    {[1, 2, 3].map((i) => (
      <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gray-100 px-6 py-4 animate-pulse">
          <div className="h-5 bg-gray-200 rounded w-1/3" />
        </div>
        <div className="p-6 space-y-4">
          <div className="h-10 bg-gray-100 rounded animate-pulse" />
          <div className="h-10 bg-gray-100 rounded animate-pulse" />
        </div>
      </div>
    ))}
  </div>
);

// ─── Main page ────────────────────────────────────────────────────────────────

const CreateInvoice = () => {
  const navigate = useNavigate();
  const [availableReferrers, setAvailableReferrers] = useState([]);
  const [availableTests, setAvailableTests] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [popup, setPopup] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const pendingReferrerNameRef = useRef("");

  const amount = computeAmount(formData);

  useEffect(() => {
    invoiceService
      .getRequiredData()
      .then((res) => {
        setAvailableReferrers(res.data.referrers || []);
        setAvailableTests(res.data.tests || []);
        console.log(res.data);
      })
      .catch(() => setPopup({ type: "error", message: "Could not load required data" }))
      .finally(() => setInitialLoading(false));
  }, []);

  const handleChange = (field, value) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "referredBy") {
        next.hasReferrerDiscount = false;
        next.referrerDiscount = 0;
      }
      return next;
    });
  };

  const handlePatientChange = (field, value) => {
    setFormData((prev) => ({ ...prev, patient: { ...prev.patient, [field]: value } }));
  };

  const handleTestToggle = (test) => {
    setFormData((prev) => ({
      ...prev,
      selectedTests: prev.selectedTests.some((t) => t.testId === test.testId)
        ? prev.selectedTests.filter((t) => t.testId !== test.testId)
        : [...prev.selectedTests, test],
    }));
  };

  const handlePreview = (e) => {
    e.preventDefault();
    const { patient, selectedTests } = formData;
    if (!patient.name?.trim()) return setPopup({ type: "error", message: "Patient name is required" });
    if (!patient.gender) return setPopup({ type: "error", message: "Gender is required" });
    if (!patient.age) return setPopup({ type: "error", message: "Age is required" });
    if (!patient.contactNumber?.trim()) return setPopup({ type: "error", message: "Contact number is required" });
    if (!selectedTests.length) return setPopup({ type: "error", message: "Please select at least one test" });
    setShowSummary(true);
  };

  const handleConfirm = async () => {
    try {
      setSubmitting(true);
      const { patient, referredBy, selectedTests } = formData;

      const invoiceData = {
        patient,
        referrer: {
          id: referredBy?._id ?? null,
          // Doctor: "Dr. Smith ( MBBS, FCPS )" — degree concatenated at submit time
          name:
            typeof referredBy === "object" && referredBy !== null
              ? formatReferrerName(referredBy)
              : typeof referredBy === "string"
                ? referredBy
                : pendingReferrerNameRef.current.trim() || null,
          type: referredBy?.type ?? null,
        },
        tests: selectedTests.map(({ testId, name, price, schemaId }) => ({
          testId,
          name,
          price,
          schemaId: schemaId || null,
        })),
        amount,
      };

      const { data } = await invoiceService.createInvoice(invoiceData);

      navigate(`/invoice/print/${data.invoiceId}`, {
        state: { invoiceData: { ...invoiceData, invoiceId: data.invoiceId, tests: selectedTests, referredBy } },
      });

      setFormData(INITIAL_FORM);
      setShowSummary(false);
    } catch (err) {
      setPopup({ type: "error", message: err?.response?.data?.error || "Could not create invoice" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {submitting && <LoadingScreen message="Creating invoice" />}
      {popup && <Popup type={popup.type} message={popup.message} onClose={() => setPopup(null)} />}

      <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 rounded-xl shadow-sm">
              <Receipt className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Create New Invoice</h1>
              <p className="text-sm text-gray-500">Generate patient invoice with diagnostic tests</p>
            </div>
          </div>

          {initialLoading ? (
            <FormSkeleton />
          ) : (
            <InvoiceForm
              formData={formData}
              amount={amount}
              availableReferrers={availableReferrers}
              availableTests={availableTests}
              onChange={handleChange}
              onPatientChange={handlePatientChange}
              onTestToggle={handleTestToggle}
              onSubmit={handlePreview}
              pendingReferrerNameRef={pendingReferrerNameRef}
            />
          )}
        </div>
      </div>

      <Modal isOpen={showSummary} onClose={() => setShowSummary(false)} maxWidth="max-w-2xl">
        <InvoiceSummary
          formData={formData}
          amount={amount}
          onConfirm={handleConfirm}
          onClose={() => setShowSummary(false)}
        />
      </Modal>
    </>
  );
};

export default CreateInvoice;
