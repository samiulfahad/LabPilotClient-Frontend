import {
  User,
  Phone,
  GraduationCap,
  FileText,
  DollarSign,
  Percent,
  Check,
  Stethoscope,
  Briefcase,
  Info,
} from "lucide-react";

const ReferrerForm = ({ formData, onChange, onSubmit, onClose }) => {
  const label = {};
  if (formData.type === "editReferrer") {
    label.formTitle = "Edit Referrer";
    label.button = "Update";
  } else {
    label.formTitle = "Add New Referrer";
    label.button = "Create Referrer";
  }

  const handleFieldChange = (field, value) => {
    onChange(field, value);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Scrollable Form Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 bg-gray-50" style={{ paddingBottom: "88px" }}>
        <form onSubmit={onSubmit} className="space-y-5 max-w-2xl mx-auto">
          {/* Is Doctor Toggle */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-3">Referrer Type</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleFieldChange("isDoctor", true)}
                className={`relative py-3 px-3 rounded-lg font-medium transition-all duration-200 border-2 ${
                  formData.isDoctor
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                }`}
              >
                <div className="flex flex-col items-center gap-1.5">
                  <Stethoscope className={`w-5 h-5 ${formData.isDoctor ? "text-blue-600" : "text-gray-400"}`} />
                  <span className="text-xs">Doctor</span>
                </div>
                {formData.isDoctor && (
                  <div className="absolute top-1.5 right-1.5">
                    <Check className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                )}
              </button>
              <button
                type="button"
                onClick={() => handleFieldChange("isDoctor", false)}
                className={`relative py-3 px-3 rounded-lg font-medium transition-all duration-200 border-2 ${
                  !formData.isDoctor
                    ? "border-purple-500 bg-purple-50 text-purple-700"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                }`}
              >
                <div className="flex flex-col items-center gap-1.5">
                  <Briefcase className={`w-5 h-5 ${!formData.isDoctor ? "text-purple-600" : "text-gray-400"}`} />
                  <span className="text-xs">Agent</span>
                </div>
                {!formData.isDoctor && (
                  <div className="absolute top-1.5 right-1.5">
                    <Check className="w-3.5 h-3.5 text-purple-600" />
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Basic Information */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="space-y-3">
              {/* Name and Contact Number - Same Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={formData.name || ""}
                      onChange={(e) => handleFieldChange("name", e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
                      placeholder="Enter referrer name"
                      required
                    />
                  </div>
                </div>

                {/* Contact Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      value={formData.contactNumber || ""}
                      onChange={(e) => handleFieldChange("contactNumber", e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
                      placeholder="01XXXXXXXXX"
                      maxLength={11}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Degree - Only show if isDoctor is true */}
              {formData.isDoctor && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Medical Degree</label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={formData.degree || ""}
                      onChange={(e) => handleFieldChange("degree", e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
                      placeholder="e.g., MBBS, MD, FCPS"
                    />
                  </div>
                </div>
              )}

              {/* Details */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Additional Details</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <textarea
                    value={formData.details || ""}
                    onChange={(e) => handleFieldChange("details", e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none text-sm"
                    placeholder="Additional information about the referrer"
                    rows={2}
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={formData.isActive ? "true" : "false"}
                  onChange={(e) => handleFieldChange("isActive", e.target.value === "true")}
                  className={`w-full px-4 py-2 border rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all appearance-none cursor-pointer text-sm ${
                    formData.isActive
                      ? "bg-green-50 text-green-700 border-green-300"
                      : "bg-red-50 text-red-700 border-red-300"
                  }`}
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Commission Details */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-gray-500" />
              Commission Details
            </h3>

            {/* Commission Type Radio Buttons */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <label
                className={`relative flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  formData.commissionType === "percentage"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="commissionType"
                  value="percentage"
                  checked={formData.commissionType === "percentage"}
                  onChange={(e) => handleFieldChange("commissionType", e.target.value)}
                  className="w-4 h-4 text-blue-600"
                />
                <div className="flex items-center gap-2">
                  <span
                    className={`font-medium text-sm ${formData.commissionType === "percentage" ? "text-blue-700" : "text-gray-700"}`}
                  >
                    Percentage
                  </span>
                </div>
              </label>
              <label
                className={`relative flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  formData.commissionType === "fixed"
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="commissionType"
                  value="fixed"
                  checked={formData.commissionType === "fixed"}
                  onChange={(e) => handleFieldChange("commissionType", e.target.value)}
                  className="w-4 h-4 text-green-600"
                />
                <div className="flex items-center gap-2">
                  <span
                    className={`font-medium text-sm ${formData.commissionType === "fixed" ? "text-green-700" : "text-gray-700"}`}
                  >
                    Fixed
                  </span>
                </div>
              </label>
            </div>

            {/* Commission Value */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {formData.commissionType === "percentage" ? "Percentage Value" : "Amount"}
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.commissionValue || ""}
                  onChange={(e) => handleFieldChange("commissionValue", parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
                  placeholder={formData.commissionType === "percentage" ? "0-100" : "Amount in BDT"}
                  min="0"
                  max={formData.commissionType === "percentage" ? "100" : undefined}
                  step={formData.commissionType === "percentage" ? "0.1" : "1"}
                  required
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500">
                  {formData.commissionType === "percentage" ? "%" : "৳"}
                </span>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Fixed Footer - Always at bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-gray-200 px-6 py-4 bg-white shadow-lg">
        <div className="flex gap-3 max-w-2xl mx-auto">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-lg font-medium transition-all text-sm bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 hover:border-gray-400"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={onSubmit}
            className="flex-1 py-2.5 px-4 rounded-lg font-medium transition-all text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow"
          >
            {label.button}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReferrerForm;
