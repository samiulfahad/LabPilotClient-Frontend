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
// INVOICE SUMMARY COMPONENT
// ============================================================================
const InvoiceSummary = ({ formData, onConfirm, onClose }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const dueAmount = Math.max(0, formData.finalPrice - (formData.paidAmount || 0));
  const isFullyPaid = dueAmount === 0;

  return (
    <div className="bg-white rounded-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-xl">
      {/* Header */}
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

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
        {/* Patient Information */}
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

        {/* Selected Tests */}
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

        {/* Pricing Breakdown */}
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
                      : `(Fixed)`}
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

            {/* Paid / Due Section */}
            <div className="mt-3 pt-3 border-t border-dashed border-gray-300 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-green-600" />
                  Paid Amount
                </span>
                <span className="font-medium text-green-600">{formatCurrency(formData.paidAmount || 0)}</span>
              </div>
              {!isFullyPaid && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Due Amount</span>
                  <span className="font-medium text-red-600">{formatCurrency(dueAmount)}</span>
                </div>
              )}
              {isFullyPaid && (
                <div className="flex items-center justify-end gap-1.5">
                  <Check className="w-3.5 h-3.5 text-green-600" />
                  <span className="text-green-600 text-xs font-medium">Fully Paid</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
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
// INVOICE FORM COMPONENT
// ============================================================================
const InvoiceForm = ({ formData, availableReferrers, availableTests, onChange, onTestSelection, onSubmit }) => {
  const [referrerSearchQuery, setReferrerSearchQuery] = useState("");
  const [testSearchQuery, setTestSearchQuery] = useState("");
  const [showReferrerDropdown, setShowReferrerDropdown] = useState(false);
  const [showTestDropdown, setShowTestDropdown] = useState(false);
  const referrerDropdownRef = useRef(null);
  const testDropdownRef = useRef(null);

  // Close referrer dropdown on outside click; save as custom referrer if text typed
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (referrerDropdownRef.current && !referrerDropdownRef.current.contains(event.target)) {
        if (referrerSearchQuery.trim() && (!formData.referredBy || typeof formData.referredBy !== "object")) {
          onChange("referredBy", referrerSearchQuery.trim());
        }
        setShowReferrerDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [referrerSearchQuery, formData.referredBy, onChange]);

  // Close test dropdown on outside click
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
    if (!referrerSearchQuery.trim()) return availableReferrers.filter((r) => r.isActive);
    const query = referrerSearchQuery.toLowerCase();
    return availableReferrers.filter(
      (referrer) =>
        referrer.isActive && (referrer.name.toLowerCase().includes(query) || referrer.contactNumber.includes(query)),
    );
  }, [referrerSearchQuery, availableReferrers]);

  const filteredTests = useMemo(() => {
    if (!testSearchQuery.trim()) return availableTests;
    const query = testSearchQuery.toLowerCase();
    return availableTests.filter((test) => test.name.toLowerCase().includes(query));
  }, [testSearchQuery, availableTests]);

  const handleReferrerSelect = (referrer) => {
    onChange("referredBy", referrer);
    setShowReferrerDropdown(false);
    setReferrerSearchQuery("");
  };

  const handleTestSelect = (test) => {
    onTestSelection(test);
    setTestSearchQuery("");
  };

  const isTestSelected = (testId) => formData.selectedTests.some((t) => t._id === testId);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT", minimumFractionDigits: 0 }).format(amount);

  const dueAmount = Math.max(0, formData.finalPrice - (formData.paidAmount || 0));
  const isFullyPaid = formData.paidAmount >= formData.finalPrice && formData.finalPrice > 0;

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Patient Information Section */}
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
          {/* Row 1: Name + Age */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Patient Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
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
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
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

          {/* Row 2: Contact + Gender */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Contact Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
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
                    required={formData.gender === ""}
                  />
                  <span className="capitalize">{g}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Row 3: Referred By — full width */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Referred By <span className="text-gray-400 text-xs">(Optional)</span>
            </label>
            <div className="relative" ref={referrerDropdownRef}>
              <Building2 className="absolute left-3 top-3.5 w-4 h-4 text-gray-400 z-10" />
              <input
                type="text"
                value={
                  formData.referredBy && typeof formData.referredBy === "object"
                    ? `${formData.referredBy.name}${formData.referredBy.degree ? ` (${formData.referredBy.degree})` : ""}`
                    : referrerSearchQuery
                }
                onChange={(e) => {
                  const val = e.target.value;
                  setReferrerSearchQuery(val);
                  if (formData.referredBy && typeof formData.referredBy === "object") {
                    onChange("referredBy", null);
                  }
                  setShowReferrerDropdown(true);
                }}
                onFocus={() => setShowReferrerDropdown(true)}
                className={`w-full pl-9 pr-9 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm ${
                  formData.referredBy && typeof formData.referredBy === "string"
                    ? "border-gray-400 bg-gray-50"
                    : "border-gray-300"
                }`}
                placeholder="Search by name or contact number"
              />

              {/* Clear button */}
              {formData.referredBy && (
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onChange("referredBy", null);
                    setReferrerSearchQuery("");
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {/* Free-text badge */}
              {formData.referredBy && typeof formData.referredBy === "string" && (
                <p className="mt-1 text-xs text-gray-500 pl-1">
                  Saved as custom referrer: <span className="font-medium text-gray-700">"{formData.referredBy}"</span>
                </p>
              )}

              {/* Commission badge for registered referrer */}
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

              {/* Dropdown list */}
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
                    <div className="px-4 py-4 text-sm text-gray-500">
                      <p className="text-center text-gray-400 text-xs mb-1">No matching referrers</p>
                      <p className="text-center text-gray-600 text-xs">
                        Click outside to save <span className="font-medium text-gray-800">"{referrerSearchQuery}"</span>{" "}
                        as a custom referrer
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Test Selection Section */}
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
          {/* Test Search */}
          <div className="relative mb-5" ref={testDropdownRef}>
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
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
                        className={`w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0 ${
                          selected ? "bg-blue-50" : ""
                        }`}
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

          {/* Selected Tests List */}
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
                    className="group flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{test.name}</p>
                      <p className="text-xs text-blue-600 font-medium">{formatCurrency(test.price)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleTestSelect(test)}
                      className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      aria-label="Remove test"
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

      {/* Pricing Details Section */}
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
          {/* Total Amount Display */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Subtotal Amount</span>
              <span className="text-xl font-semibold text-gray-900">{formatCurrency(formData.totalAmount)}</span>
            </div>
          </div>

          {/* Referrer Discount Section — only show for registered referrers */}
          {formData.referredBy && typeof formData.referredBy === "object" && (
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.hasReferrerDiscount}
                  onChange={(e) => {
                    onChange("hasReferrerDiscount", e.target.checked);
                    if (!e.target.checked) {
                      onChange("referrerDiscount", 0);
                    } else {
                      // Auto-fill with referrer's commission value
                      onChange("referrerDiscount", formData.referredBy.commissionValue || 0);
                    }
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
                  {/* Percentage-based referrer */}
                  {formData.referredBy.commissionType === "percentage" && (
                    <>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Discount Percentage
                        <span className="ml-1.5 text-xs font-normal text-blue-600">
                          (max {formData.referredBy?.commissionValue}%)
                        </span>
                      </label>
                      <div className="relative">
                        <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="number"
                          value={formData.referrerDiscount}
                          onChange={(e) => {
                            if (e.target.value === "") {
                              onChange("referrerDiscount", "");
                              return;
                            }
                            const max = formData.referredBy?.commissionValue || 100;
                            const val = Math.min(parseFloat(e.target.value) || 0, max);
                            onChange("referrerDiscount", val);
                          }}
                          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                          placeholder={`Max ${formData.referredBy?.commissionValue || 100}%`}
                          min="0"
                          max={formData.referredBy?.commissionValue || 100}
                          step="0.01"
                        />
                      </div>
                    </>
                  )}

                  {/* Fixed-based referrer */}
                  {formData.referredBy.commissionType === "fixed" && (
                    <>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Discount Amount
                        <span className="ml-1.5 text-xs font-normal text-blue-600">
                          (max {formatCurrency(formData.referredBy?.commissionValue)})
                        </span>
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="number"
                          value={formData.referrerDiscount}
                          onChange={(e) => {
                            if (e.target.value === "") {
                              onChange("referrerDiscount", "");
                              return;
                            }
                            const max = formData.referredBy?.commissionValue || Infinity;
                            const val = Math.min(parseFloat(e.target.value) || 0, max);
                            onChange("referrerDiscount", val);
                          }}
                          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                          placeholder={`Max ${formatCurrency(formData.referredBy?.commissionValue || 0)}`}
                          min="0"
                          max={formData.referredBy?.commissionValue}
                          step="0.01"
                        />
                      </div>
                    </>
                  )}

                  <div className="mt-3 p-3 bg-white rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">After Referrer Discount</span>
                      <span className="font-medium text-blue-600">
                        {formatCurrency(formData.priceAfterReferrerDiscount)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Lab Adjustment Section */}
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
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    value={formData.labAdjustmentAmount}
                    onChange={(e) => onChange("labAdjustmentAmount", parseFloat(e.target.value) || 0)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                    placeholder="Enter lab adjustment amount"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Final Price Display */}
          <div className="p-5 bg-blue-600 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-white" />
                <span className="text-sm font-medium text-white uppercase tracking-wide">Total Amount</span>
              </div>
              <span className="text-2xl font-bold text-white">{formatCurrency(formData.finalPrice)}</span>
            </div>
          </div>

          {/* Paid Amount Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-green-50 rounded">
                <Wallet className="w-3.5 h-3.5 text-green-600" />
              </div>
              <label className="text-sm font-medium text-gray-700">Paid Amount</label>
            </div>
            <div className="relative">
              <Wallet className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
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

            {/* Paid/Due Summary */}
            {formData.finalPrice > 0 && (
              <div className="p-4 rounded-lg border border-gray-200 bg-gray-50 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
                    Paid
                  </span>
                  <span className="font-medium text-green-600">{formatCurrency(formData.paidAmount || 0)}</span>
                </div>
                {!isFullyPaid && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span>
                      Due
                    </span>
                    <span className="font-medium text-red-600">{formatCurrency(dueAmount)}</span>
                  </div>
                )}
                {isFullyPaid && (
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

      {/* Submit Button */}
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
// HELPERS
// ============================================================================

/**
 * Calculate referrer net commission:
 *  - "percentage": commissionValue% of totalAmount
 *  - "fixed":      flat commissionValue
 *  - string / null (custom/unregistered referrer): 0
 *
 * If the referrer gave a discount (referrerDiscountAmount > 0),
 * that discount is deducted from their gross commission (floored at 0).
 */
const calculateReferrerCommission = (referredBy, totalAmount, referrerDiscountAmount = 0) => {
  if (!referredBy || typeof referredBy !== "object") return 0;
  if (!referredBy.commissionType || !referredBy.commissionValue) return 0;

  let grossCommission = 0;
  if (referredBy.commissionType === "percentage") {
    grossCommission = parseFloat(((totalAmount * referredBy.commissionValue) / 100).toFixed(2));
  } else if (referredBy.commissionType === "fixed") {
    grossCommission = referredBy.commissionValue;
  }

  return Math.max(0, parseFloat((grossCommission - referrerDiscountAmount).toFixed(2)));
};

// ============================================================================
// MAIN CREATE INVOICE COMPONENT
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
  referrerDiscount: 0, // always the % rate or fixed input — used only for UI/calculation
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
  const [loadingMessage, setLoadingMessage] = useState("Processing request");
  const [popup, setPopup] = useState(null);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [formData, setFormData] = useState(initialFormData);

  const loadRequiredData = async () => {
    try {
      const response = await invoiceService.getRequiredData();
      setAvailableReferrers(response.data.referrers || []);
      setAvailableTests(response.data.tests || []);
    } catch (error) {
      setPopup({ type: "error", message: "Could not load required data" });
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    loadRequiredData();
  }, []);

  useEffect(() => {
    calculatePrices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    formData.selectedTests,
    formData.hasReferrerDiscount,
    formData.referrerDiscount,
    formData.hasLabAdjustment,
    formData.labAdjustmentAmount,
    formData.referredBy,
  ]);

  const calculatePrices = () => {
    const totalAmount = formData.selectedTests.reduce((sum, test) => sum + (test.price || 0), 0);

    // Compute the actual monetary discount amount from the user's input
    let referrerDiscountAmount = 0;
    if (formData.hasReferrerDiscount && formData.referredBy && typeof formData.referredBy === "object") {
      if (formData.referredBy.commissionType === "percentage" && formData.referrerDiscount > 0) {
        referrerDiscountAmount = parseFloat(((totalAmount * formData.referrerDiscount) / 100).toFixed(2));
      } else if (formData.referredBy.commissionType === "fixed") {
        const fixedVal = parseFloat(formData.referrerDiscount) || 0;
        if (fixedVal > 0) referrerDiscountAmount = fixedVal;
      }
    }

    const priceAfterReferrerDiscount = totalAmount - referrerDiscountAmount;

    let finalPrice = priceAfterReferrerDiscount;
    if (formData.hasLabAdjustment && formData.labAdjustmentAmount) {
      finalPrice = priceAfterReferrerDiscount - formData.labAdjustmentAmount;
    }

    const referrerCommission = calculateReferrerCommission(formData.referredBy, totalAmount, referrerDiscountAmount);

    setFormData((prev) => ({
      ...prev,
      totalAmount,
      priceAfterReferrerDiscount,
      finalPrice: Math.max(0, finalPrice),
      referrerCommission,
    }));
  };

  const handleFormChange = (field, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      // Reset discount fields when referrer changes
      if (field === "referredBy") {
        updated.hasReferrerDiscount = false;
        updated.referrerDiscount = 0;
      }
      return updated;
    });
  };

  const handleTestSelection = (test) => {
    const isAlreadySelected = formData.selectedTests.some((t) => t._id === test._id);
    if (isAlreadySelected) {
      setFormData((prev) => ({
        ...prev,
        selectedTests: prev.selectedTests.filter((t) => t._id !== test._id),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        selectedTests: [...prev.selectedTests, test],
      }));
    }
  };

  const handleCreateInvoice = (e) => {
    e.preventDefault();

    if (!formData.patientName?.trim()) {
      setPopup({ type: "error", message: "Patient name is required" });
      return;
    }
    if (!formData.gender) {
      setPopup({ type: "error", message: "Gender is required" });
      return;
    }
    if (!formData.age) {
      setPopup({ type: "error", message: "Age is required" });
      return;
    }
    if (!formData.contactNumber?.trim()) {
      setPopup({ type: "error", message: "Contact number is required" });
      return;
    }
    if (formData.selectedTests.length === 0) {
      setPopup({ type: "error", message: "Please select at least one test" });
      return;
    }

    setIsSummaryModalOpen(true);
  };

  const handleConfirmInvoice = async () => {
    try {
      setLoading(true);
      setLoadingMessage("Creating invoice");

      // Recalculate the actual monetary discount amount at submission time as source of truth
      let referrerDiscountAmount = 0;
      if (formData.hasReferrerDiscount && formData.referredBy && typeof formData.referredBy === "object") {
        if (formData.referredBy.commissionType === "percentage" && formData.referrerDiscount > 0) {
          // FIX: convert percentage rate → actual monetary amount before sending to backend
          referrerDiscountAmount = parseFloat(((formData.totalAmount * formData.referrerDiscount) / 100).toFixed(2));
        } else if (formData.referredBy.commissionType === "fixed") {
          const fixedVal = parseFloat(formData.referrerDiscount) || 0;
          if (fixedVal > 0) referrerDiscountAmount = fixedVal;
        }
      }

      const referrerCommission = calculateReferrerCommission(
        formData.referredBy,
        formData.totalAmount,
        referrerDiscountAmount,
      );

      const invoiceData = {
        patientName: formData.patientName,
        gender: formData.gender,
        age: formData.age,
        contactNumber: formData.contactNumber,
        referredBy: formData.referredBy?._id || formData.referredBy || null,
        tests: formData.selectedTests.map((test) => ({
          testId: test._id,
          name: test.name,
          price: test.price,
          schemaId: test?.schemaId || null,
        })),
        totalAmount: formData.totalAmount,
        referrerDiscount: referrerDiscountAmount, // FIX: always the actual monetary discount, not the % rate
        referrerCommission,
        referrerCommissionType: formData.referredBy?.commissionType || null, // "percentage" | "fixed" | null
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
            referredByName: typeof formData.referredBy === "string" ? formData.referredBy : null,
            referrerType: formData.referredBy?.type || null,
          },
        },
      });

      setFormData(initialFormData);
      setIsSummaryModalOpen(false);
    } catch (error) {
      console.log(error);
      setPopup({
        type: "error",
        message: error?.response?.data?.error || "Could not create invoice",
      });
    } finally {
      setLoading(false);
      setLoadingMessage("Processing request");
    }
  };

  return (
    <>
      {loading && <LoadingScreen message={loadingMessage} />}
      {popup && <Popup type={popup.type} message={popup.message} onClose={() => setPopup(null)} />}

      <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-600 rounded-xl shadow-sm">
                <Receipt className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Create New Invoice</h1>
                <p className="text-sm text-gray-500">Generate patient invoice with diagnostic tests</p>
              </div>
            </div>
          </div>

          {/* Form or Loading Skeleton */}
          {initialLoading ? (
            <div className="space-y-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="bg-gray-100 px-6 py-4 animate-pulse">
                    <div className="h-5 bg-gray-200 rounded w-1/3"></div>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="h-10 bg-gray-100 rounded animate-pulse"></div>
                    <div className="h-10 bg-gray-100 rounded animate-pulse"></div>
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
            />
          )}
        </div>
      </div>

      {/* Summary Modal */}
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
