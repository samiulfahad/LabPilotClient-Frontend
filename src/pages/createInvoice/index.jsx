import { useEffect, useState, useMemo, useRef } from "react";
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

// ============================================================================
// HELPERS
// ============================================================================

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    minimumFractionDigits: 0,
  }).format(amount);

const calculateReferrerCommission = (referredBy, totalAmount, discountAmount = 0) => {
  if (!referredBy || typeof referredBy !== "object") return 0;
  if (!referredBy.commissionType || !referredBy.commissionValue) return 0;

  const gross =
    referredBy.commissionType === "percentage"
      ? parseFloat(((totalAmount * referredBy.commissionValue) / 100).toFixed(2))
      : referredBy.commissionValue;

  return Math.max(0, parseFloat((gross - discountAmount).toFixed(2)));
};

const resolveReferrerDiscountAmount = (formData) => {
  if (!formData.hasReferrerDiscount || typeof formData.referredBy !== "object" || !formData.referredBy) return 0;

  if (formData.referredBy.commissionType === "percentage" && formData.referrerDiscount > 0) {
    return parseFloat(((formData.totalAmount * formData.referrerDiscount) / 100).toFixed(2));
  }
  if (formData.referredBy.commissionType === "fixed") {
    return parseFloat(formData.referrerDiscount) || 0;
  }
  return 0;
};

// ============================================================================
// INVOICE SUMMARY
// ============================================================================

const InvoiceSummary = ({ formData, onConfirm, onClose }) => {
  const dueAmount = Math.max(0, formData.finalPrice - (formData.paidAmount || 0));
  const isFullyPaid = dueAmount === 0;

  return (
    <div className="bg-white rounded-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-xl">
      <div className="bg-white px-8 py-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 rounded-xl">
            <Receipt className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Invoice Preview</h2>
            <p className="text-sm text-gray-500">Review details before confirmation</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
        {/* Patient */}
        <div className="bg-gray-50 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-white rounded-lg shadow-sm">
              <UserCircle className="w-4 h-4 text-gray-700" />
            </div>
            <h3 className="font-medium text-gray-900">Patient Details</h3>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <p className="text-gray-500">Full Name</p>
              <p className="font-medium text-gray-900">{formData.patientName}</p>
            </div>
            <div>
              <p className="text-gray-500">Gender</p>
              <p className="font-medium text-gray-900 capitalize">{formData.gender}</p>
            </div>
            <div>
              <p className="text-gray-500">Age</p>
              <p className="font-medium text-gray-900">{formData.age} years</p>
            </div>
            <div>
              <p className="text-gray-500">Contact</p>
              <p className="font-medium text-gray-900">{formData.contactNumber}</p>
            </div>
            {formData.referredBy && (
              <div className="col-span-2">
                <p className="text-gray-500">Referred By</p>
                <p className="font-medium text-gray-900">
                  {typeof formData.referredBy === "string" ? formData.referredBy : formData.referredBy.name}
                  {typeof formData.referredBy === "object" && formData.referredBy.degree && (
                    <span className="text-gray-600 text-sm font-normal ml-2">({formData.referredBy.degree})</span>
                  )}
                </p>
                {typeof formData.referredBy === "object" && formData.referredBy.commissionValue > 0 && (
                  <p className="text-xs text-blue-600 mt-0.5">
                    Commission:{" "}
                    {formData.referredBy.commissionType === "percentage"
                      ? `${formData.referredBy.commissionValue}% = ${formatCurrency(formData.referrerCommission)}`
                      : `Fixed ${formatCurrency(formData.referrerCommission)}`}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tests */}
        <div className="bg-gray-50 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-white rounded-lg shadow-sm">
                <FileText className="w-4 h-4 text-gray-700" />
              </div>
              <h3 className="font-medium text-gray-900">Diagnostic Tests</h3>
            </div>
            <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
              {formData.selectedTests.length} {formData.selectedTests.length === 1 ? "Test" : "Tests"}
            </span>
          </div>
          <div className="space-y-2">
            {formData.selectedTests.map((test, index) => (
              <div key={test._id || index} className="flex items-center justify-between p-3 bg-white rounded-lg">
                <span className="text-sm text-gray-900">{test.name}</span>
                <span className="text-sm font-medium text-gray-900">{formatCurrency(test.price)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Summary */}
        <div className="bg-gray-50 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-white rounded-lg shadow-sm">
              <DollarSign className="w-4 h-4 text-gray-700" />
            </div>
            <h3 className="font-medium text-gray-900">Payment Summary</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium text-gray-900">{formatCurrency(formData.totalAmount)}</span>
            </div>
            {formData.hasReferrerDiscount && formData.totalAmount !== formData.priceAfterReferrerDiscount && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    Referrer Discount{" "}
                    {formData.referredBy?.commissionType === "percentage"
                      ? `(${formData.referrerDiscount}%)`
                      : "(Fixed)"}
                  </span>
                  <span className="text-red-600">
                    - {formatCurrency(formData.totalAmount - formData.priceAfterReferrerDiscount)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="text-gray-600">After Referrer Discount</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(formData.priceAfterReferrerDiscount)}
                  </span>
                </div>
              </>
            )}
            {formData.hasLabAdjustment && formData.labAdjustmentAmount > 0 && (
              <div className="flex justify-between pt-2 border-t border-gray-200">
                <span className="text-gray-600">Lab Adjustment</span>
                <span className="text-red-600">- {formatCurrency(formData.labAdjustmentAmount)}</span>
              </div>
            )}
            <div className="flex justify-between pt-3 border-t-2 border-gray-200 text-base">
              <span className="font-semibold text-gray-900">Total Amount</span>
              <span className="text-xl font-bold text-blue-600">{formatCurrency(formData.finalPrice)}</span>
            </div>
            <div className="mt-3 pt-3 border-t border-dashed border-gray-300 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-green-600" />
                  Paid Amount
                </span>
                <span className="font-medium text-green-600">{formatCurrency(formData.paidAmount || 0)}</span>
              </div>
              {!isFullyPaid ? (
                <div className="flex justify-between">
                  <span className="text-gray-600">Due Amount</span>
                  <span className="font-medium text-red-600">{formatCurrency(dueAmount)}</span>
                </div>
              ) : (
                <div className="flex items-center justify-end gap-1.5">
                  <Check className="w-3.5 h-3.5 text-green-600" />
                  <span className="text-green-600 text-xs font-medium">Fully Paid</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100 bg-white px-8 py-4 flex items-center justify-end gap-3">
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

// ============================================================================
// INVOICE FORM
// ============================================================================

const InvoiceForm = ({
  formData,
  availableReferrers,
  availableTests,
  onChange,
  onTestSelection,
  onSubmit,
  pendingReferrerNameRef,
}) => {
  const [referrerSearchQuery, setReferrerSearchQuery] = useState("");
  const [testSearchQuery, setTestSearchQuery] = useState("");
  const [showReferrerDropdown, setShowReferrerDropdown] = useState(false);
  const [showTestDropdown, setShowTestDropdown] = useState(false);
  const testDropdownRef = useRef(null);
  const referrerSearchQueryRef = useRef("");

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (testDropdownRef.current && !testDropdownRef.current.contains(event.target)) {
        setShowTestDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredReferrers = useMemo(() => {
    const active = availableReferrers.filter((r) => r.isActive);
    if (!referrerSearchQuery.trim()) return active;
    const query = referrerSearchQuery.toLowerCase();
    return active.filter((r) => r.name.toLowerCase().includes(query) || r.contactNumber.includes(query));
  }, [referrerSearchQuery, availableReferrers]);

  const filteredTests = useMemo(() => {
    if (!testSearchQuery.trim()) return availableTests;
    const query = testSearchQuery.toLowerCase();
    return availableTests.filter((t) => t.name.toLowerCase().includes(query));
  }, [testSearchQuery, availableTests]);

  const handleReferrerSelect = (referrer) => {
    onChange("referredBy", referrer);
    setShowReferrerDropdown(false);
    setReferrerSearchQuery("");
    referrerSearchQueryRef.current = "";
  };

  const handleTestSelect = (test) => {
    onTestSelection(test);
    setTestSearchQuery("");
  };

  const isTestSelected = (testId) => formData.selectedTests.some((t) => t._id === testId);

  const dueAmount = Math.max(0, formData.finalPrice - (formData.paidAmount || 0));
  const isFullyPaid = formData.paidAmount >= formData.finalPrice && formData.finalPrice > 0;

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Patient Information */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 rounded-lg">
              <UserCircle className="w-4 h-4 text-blue-600" />
            </div>
            <h3 className="font-medium text-gray-900">Patient Information</h3>
          </div>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Patient Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={formData.patientName}
                onChange={(e) => onChange("patientName", e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                placeholder="Enter patient's full name"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Age <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="number"
                value={formData.age}
                onChange={(e) => onChange("age", e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                placeholder="Enter age"
                min="0"
                max="150"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Contact Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="tel"
                value={formData.contactNumber}
                onChange={(e) => onChange("contactNumber", e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                placeholder="01XXXXXXXXX"
                maxLength={11}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Gender <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              {["male", "female"].map((g) => (
                <label
                  key={g}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 border rounded-lg cursor-pointer transition-all text-sm font-medium select-none ${
                    formData.gender === g
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-300 text-gray-600 hover:border-gray-400 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="gender"
                    value={g}
                    checked={formData.gender === g}
                    onChange={() => onChange("gender", g)}
                    className="sr-only"
                    required={!formData.gender}
                  />
                  <span className="capitalize">{g}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Referred By <span className="text-gray-400 text-xs">(Optional)</span>
            </label>
            <div>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                <input
                  type="text"
                  value={
                    formData.referredBy && typeof formData.referredBy === "object"
                      ? `${formData.referredBy.name}${formData.referredBy.degree ? ` (${formData.referredBy.degree})` : ""}`
                      : referrerSearchQuery
                  }
                  onChange={(e) => {
                    setReferrerSearchQuery(e.target.value);
                    referrerSearchQueryRef.current = e.target.value;
                    if (pendingReferrerNameRef) pendingReferrerNameRef.current = e.target.value;
                    if (typeof formData.referredBy === "object") onChange("referredBy", null);
                    setShowReferrerDropdown(true);
                  }}
                  onFocus={() => setShowReferrerDropdown(true)}
                  onBlur={() => {
                    if (referrerSearchQuery.trim() && typeof formData.referredBy !== "object") {
                      onChange("referredBy", referrerSearchQuery.trim());
                    }
                    setShowReferrerDropdown(false);
                  }}
                  className="w-full pl-9 pr-9 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                  placeholder="Search by name or contact number"
                />

                {formData.referredBy && (
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onChange("referredBy", null);
                      setReferrerSearchQuery("");
                      referrerSearchQueryRef.current = "";
                      if (pendingReferrerNameRef) pendingReferrerNameRef.current = "";
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                {showReferrerDropdown && referrerSearchQuery && (
                  <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto z-20">
                    {filteredReferrers.length > 0 ? (
                      filteredReferrers.map((referrer) => (
                        <button
                          key={referrer._id}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleReferrerSelect(referrer);
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900 text-sm">{referrer.name}</p>
                              <p className="text-xs text-gray-500">
                                {referrer.contactNumber}
                                {referrer.degree && ` • ${referrer.degree}`}
                              </p>
                              {referrer.commissionValue > 0 && (
                                <p className="text-xs text-blue-500 mt-0.5">
                                  Commission:{" "}
                                  {referrer.commissionType === "percentage"
                                    ? `${referrer.commissionValue}%`
                                    : `Fixed ${formatCurrency(referrer.commissionValue)}`}
                                </p>
                              )}
                            </div>
                            {referrer.type && (
                              <span
                                className={`px-2 py-0.5 text-xs font-medium rounded capitalize ${
                                  referrer.type === "doctor"
                                    ? "bg-blue-100 text-blue-700"
                                    : referrer.type === "agent"
                                      ? "bg-amber-100 text-amber-700"
                                      : "bg-teal-100 text-teal-700"
                                }`}
                              >
                                {referrer.type}
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

              {formData.referredBy &&
                typeof formData.referredBy === "object" &&
                formData.referredBy.commissionValue > 0 && (
                  <p className="mt-1 text-xs text-blue-600 pl-1">
                    Commission:{" "}
                    {formData.referredBy.commissionType === "percentage"
                      ? `${formData.referredBy.commissionValue}% of subtotal`
                      : `Fixed ${formatCurrency(formData.referredBy.commissionValue)}`}
                  </p>
                )}
            </div>
          </div>
        </div>
      </div>

      {/* Diagnostic Tests */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 rounded-lg">
              <FileText className="w-4 h-4 text-blue-600" />
            </div>
            <h3 className="font-medium text-gray-900">Diagnostic Tests</h3>
          </div>
        </div>
        <div className="p-6">
          <div className="relative mb-5" ref={testDropdownRef}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
            <input
              type="text"
              value={testSearchQuery}
              onChange={(e) => {
                setTestSearchQuery(e.target.value);
                setShowTestDropdown(true);
              }}
              onFocus={() => setShowTestDropdown(true)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
              placeholder="Search tests by name..."
            />
            {showTestDropdown && testSearchQuery && (
              <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto z-20">
                {filteredTests.length > 0 ? (
                  filteredTests.map((test) => {
                    const selected = isTestSelected(test._id);
                    return (
                      <button
                        key={test._id}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleTestSelect(test);
                        }}
                        className={`w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0 ${selected ? "bg-blue-50" : ""}`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{test.name}</p>
                            <p className="text-xs text-blue-600 font-medium">{formatCurrency(test.price)}</p>
                          </div>
                          {selected && (
                            <div className="ml-3 p-1 bg-blue-600 rounded-full">
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

          {formData.selectedTests.length > 0 ? (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-700">Selected Tests</h4>
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                  {formData.selectedTests.length} Selected
                </span>
              </div>
              <div className="space-y-2">
                {formData.selectedTests.map((test, index) => (
                  <div
                    key={test._id || index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{test.name}</p>
                      <p className="text-xs text-blue-600 font-medium">{formatCurrency(test.price)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleTestSelect(test)}
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
        </div>
      </div>

      {/* Pricing & Adjustments */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 rounded-lg">
              <DollarSign className="w-4 h-4 text-blue-600" />
            </div>
            <h3 className="font-medium text-gray-900">Pricing & Adjustments</h3>
          </div>
        </div>
        <div className="p-6 space-y-5">
          <div className="p-4 bg-gray-50 rounded-lg flex items-center justify-between">
            <span className="text-sm text-gray-600">Subtotal Amount</span>
            <span className="text-xl font-semibold text-gray-900">{formatCurrency(formData.totalAmount)}</span>
          </div>

          {/* Referrer Discount */}
          {formData.referredBy && typeof formData.referredBy === "object" && (
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.hasReferrerDiscount}
                  onChange={(e) => {
                    onChange("hasReferrerDiscount", e.target.checked);
                    onChange("referrerDiscount", e.target.checked ? formData.referredBy.commissionValue || 0 : 0);
                  }}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <div className="flex items-center gap-1.5">
                  <div className="p-1.5 bg-white rounded">
                    <Percent className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Apply Referrer Discount</span>
                </div>
              </label>

              {formData.hasReferrerDiscount && (
                <div className="ml-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {formData.referredBy.commissionType === "percentage" ? "Discount Percentage" : "Discount Amount"}
                    <span className="ml-1.5 text-xs font-normal text-blue-600">
                      (max{" "}
                      {formData.referredBy.commissionType === "percentage"
                        ? `${formData.referredBy.commissionValue}%`
                        : formatCurrency(formData.referredBy.commissionValue)}
                      )
                    </span>
                  </label>
                  <div className="relative">
                    {formData.referredBy.commissionType === "percentage" ? (
                      <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    ) : (
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    )}
                    <input
                      type="number"
                      value={formData.referrerDiscount}
                      onChange={(e) => {
                        if (e.target.value === "") {
                          onChange("referrerDiscount", "");
                          return;
                        }
                        const max =
                          formData.referredBy.commissionValue ||
                          (formData.referredBy.commissionType === "percentage" ? 100 : Infinity);
                        onChange("referrerDiscount", Math.min(parseFloat(e.target.value) || 0, max));
                      }}
                      className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                      min="0"
                      max={formData.referredBy.commissionValue}
                      step="0.01"
                    />
                  </div>
                  <div className="mt-3 p-3 bg-white rounded-lg border border-blue-200 flex items-center justify-between text-sm">
                    <span className="text-gray-600">After Referrer Discount</span>
                    <span className="font-medium text-blue-600">
                      {formatCurrency(formData.priceAfterReferrerDiscount)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Lab Adjustment */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.hasLabAdjustment}
                onChange={(e) => {
                  onChange("hasLabAdjustment", e.target.checked);
                  if (!e.target.checked) onChange("labAdjustmentAmount", 0);
                }}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <div className="flex items-center gap-1.5">
                <div className="p-1.5 bg-white rounded">
                  <DollarSign className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Apply Lab Adjustment</span>
              </div>
            </label>
            {formData.hasLabAdjustment && (
              <div className="ml-6 p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Lab Adjustment Amount</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    value={formData.labAdjustmentAmount}
                    onChange={(e) => onChange("labAdjustmentAmount", parseFloat(e.target.value) || 0)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                    placeholder="Enter adjustment amount"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Final Price */}
          <div className="p-5 bg-blue-600 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-white" />
              <span className="text-sm font-medium text-white uppercase tracking-wide">Total Amount</span>
            </div>
            <span className="text-2xl font-bold text-white">{formatCurrency(formData.finalPrice)}</span>
          </div>

          {/* Paid Amount */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-green-50 rounded">
                <Wallet className="w-3.5 h-3.5 text-green-600" />
              </div>
              <label className="text-sm font-medium text-gray-700">Paid Amount</label>
            </div>
            <div className="relative">
              <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="number"
                value={formData.paidAmount}
                onChange={(e) => onChange("paidAmount", parseFloat(e.target.value) || 0)}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-sm"
                placeholder="Enter amount paid by patient"
                min="0"
                step="0.01"
              />
            </div>
            {formData.finalPrice > 0 && (
              <div className="p-4 rounded-lg border border-gray-200 bg-gray-50 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                    Paid
                  </span>
                  <span className="font-medium text-green-600">{formatCurrency(formData.paidAmount || 0)}</span>
                </div>
                {!isFullyPaid ? (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                      Due
                    </span>
                    <span className="font-medium text-red-600">{formatCurrency(dueAmount)}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-green-600 text-sm font-medium">
                    <Check className="w-3.5 h-3.5" />
                    Fully Paid
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

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

// ============================================================================
// MAIN
// ============================================================================

const initialFormData = {
  patientName: "",
  gender: "",
  age: "",
  contactNumber: "",
  referredBy: null,
  selectedTests: [],
  totalAmount: 0,
  hasReferrerDiscount: false,
  referrerDiscount: 0,
  priceAfterReferrerDiscount: 0,
  hasLabAdjustment: false,
  labAdjustmentAmount: 0,
  finalPrice: 0,
  paidAmount: 0,
  referrerCommission: 0,
};

const CreateInvoice = () => {
  const navigate = useNavigate();
  const [availableReferrers, setAvailableReferrers] = useState([]);
  const [availableTests, setAvailableTests] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState(null);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const pendingReferrerNameRef = useRef("");

  useEffect(() => {
    const loadRequiredData = async () => {
      try {
        const response = await invoiceService.getRequiredData();
        setAvailableReferrers(response.data.referrers || []);
        setAvailableTests(response.data.tests || []);
      } catch {
        setPopup({ type: "error", message: "Could not load required data" });
      } finally {
        setInitialLoading(false);
      }
    };
    loadRequiredData();
  }, []);

  useEffect(() => {
    const totalAmount = formData.selectedTests.reduce((sum, t) => sum + (t.price || 0), 0);
    const discountAmount = resolveReferrerDiscountAmount({ ...formData, totalAmount });
    const priceAfterReferrerDiscount = totalAmount - discountAmount;
    const finalPrice = Math.max(
      0,
      formData.hasLabAdjustment && formData.labAdjustmentAmount
        ? priceAfterReferrerDiscount - formData.labAdjustmentAmount
        : priceAfterReferrerDiscount,
    );
    const referrerCommission = calculateReferrerCommission(formData.referredBy, totalAmount, discountAmount);

    setFormData((prev) => ({ ...prev, totalAmount, priceAfterReferrerDiscount, finalPrice, referrerCommission }));
  }, [
    formData.selectedTests,
    formData.hasReferrerDiscount,
    formData.referrerDiscount,
    formData.hasLabAdjustment,
    formData.labAdjustmentAmount,
    formData.referredBy,
  ]);

  const handleFormChange = (field, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "referredBy") {
        updated.hasReferrerDiscount = false;
        updated.referrerDiscount = 0;
      }
      return updated;
    });
  };

  const handleTestSelection = (test) => {
    setFormData((prev) => ({
      ...prev,
      selectedTests: prev.selectedTests.some((t) => t._id === test._id)
        ? prev.selectedTests.filter((t) => t._id !== test._id)
        : [...prev.selectedTests, test],
    }));
  };

  const handleCreateInvoice = (e) => {
    e.preventDefault();
    if (!formData.patientName?.trim()) return setPopup({ type: "error", message: "Patient name is required" });
    if (!formData.gender) return setPopup({ type: "error", message: "Gender is required" });
    if (!formData.age) return setPopup({ type: "error", message: "Age is required" });
    if (!formData.contactNumber?.trim()) return setPopup({ type: "error", message: "Contact number is required" });
    if (formData.selectedTests.length === 0)
      return setPopup({ type: "error", message: "Please select at least one test" });
    setIsSummaryModalOpen(true);
  };

  const handleConfirmInvoice = async () => {
    try {
      setLoading(true);

      const discountAmount = resolveReferrerDiscountAmount(formData);
      const referrerCommission = calculateReferrerCommission(formData.referredBy, formData.totalAmount, discountAmount);

      const invoiceData = {
        patientName: formData.patientName,
        gender: formData.gender,
        age: formData.age,
        contactNumber: formData.contactNumber,
        referrer: {
          id: formData.referredBy?._id ?? null,
          name:
            typeof formData.referredBy === "object" && formData.referredBy !== null
              ? formData.referredBy.name
              : typeof formData.referredBy === "string"
                ? formData.referredBy
                : pendingReferrerNameRef.current.trim() || null,
          discount: discountAmount,
          commission: referrerCommission,
          type: formData.referredBy?.type ?? null,
        },
        tests: formData.selectedTests.map((test) => ({
          testId: test._id,
          name: test.name,
          price: test.price,
          schemaId: test?.schemaId || null,
        })),
        totalAmount: formData.totalAmount,
        priceAfterReferrerDiscount: formData.priceAfterReferrerDiscount,
        labAdjustmentAmount: formData.labAdjustmentAmount,
        finalPrice: formData.finalPrice,
        paidAmount: formData.paidAmount || 0,
      };

      const response = await invoiceService.createInvoice(invoiceData);

      navigate(`/invoice/print/${response.data.invoiceId}`, {
        state: {
          invoiceData: {
            ...invoiceData,
            invoiceId: response?.data?.invoiceId,
            tests: formData.selectedTests,
            referredBy: formData.referredBy,
          },
        },
      });

      setFormData(initialFormData);
      setIsSummaryModalOpen(false);
    } catch (error) {
      setPopup({ type: "error", message: error?.response?.data?.error || "Could not create invoice" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {loading && <LoadingScreen message="Creating invoice" />}
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
          ) : (
            <InvoiceForm
              formData={formData}
              availableReferrers={availableReferrers}
              availableTests={availableTests}
              onChange={handleFormChange}
              onTestSelection={handleTestSelection}
              onSubmit={handleCreateInvoice}
              pendingReferrerNameRef={pendingReferrerNameRef}
            />
          )}
        </div>
      </div>

      <Modal isOpen={isSummaryModalOpen} onClose={() => setIsSummaryModalOpen(false)} maxWidth="max-w-2xl">
        <InvoiceSummary
          formData={formData}
          onConfirm={handleConfirmInvoice}
          onClose={() => setIsSummaryModalOpen(false)}
        />
      </Modal>
    </>
  );
};

export default CreateInvoice;
