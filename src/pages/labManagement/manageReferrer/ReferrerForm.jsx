const ReferrerForm = ({ formData, onChange, onSubmit, onClose }) => {
  const label = {};
  if (formData.type === "editReferrer") {
    label.formTitle = "Edit Referrer";
    label.button = "Update Referrer";
  } else {
    label.formTitle = "Add New Referrer";
    label.button = "Create Referrer";
  }

  const handleFieldChange = (field, value) => {
    onChange(field, value);
  };

  return (
    <div className="space-y-1 p-2">
      {/* Heading */}
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">{label.formTitle}</h2>
      </div>

      <form onSubmit={onSubmit} className="space-y-3">
        {/* Is Doctor Toggle - Modern Design at Top */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-4">
          <label className="block text-sm font-semibold text-gray-700 mb-3">Is this referrer a doctor?</label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => handleFieldChange("isDoctor", true)}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                formData.isDoctor
                  ? "bg-blue-600 text-white shadow-lg scale-105"
                  : "bg-white text-gray-600 border-2 border-gray-300 hover:border-blue-400"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                {formData.isDoctor && (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                <span>Yes, Doctor</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => handleFieldChange("isDoctor", false)}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                !formData.isDoctor
                  ? "bg-purple-600 text-white shadow-lg scale-105"
                  : "bg-white text-gray-600 border-2 border-gray-300 hover:border-purple-400"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                {!formData.isDoctor && (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                <span>No, Non-Doctor</span>
              </div>
            </button>
          </div>
        </div>

        {/* Name */}
        <div className="flex border border-gray-300 rounded-lg overflow-hidden">
          <label className="w-32 px-3 py-2 text-sm font-medium text-gray-700 border-r border-gray-300 bg-gray-50 flex items-center">
            Name <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="text"
            value={formData.name || ""}
            onChange={(e) => handleFieldChange("name", e.target.value)}
            className="flex-1 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
            placeholder="Enter referrer name"
            required
          />
        </div>

        {/* Contact Number */}
        <div className="flex border border-gray-300 rounded-lg overflow-hidden">
          <label className="w-32 px-3 py-2 text-sm font-medium text-gray-700 border-r border-gray-300 bg-gray-50 flex items-center">
            Contact <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="tel"
            value={formData.contactNumber || ""}
            onChange={(e) => handleFieldChange("contactNumber", e.target.value)}
            className="flex-1 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
            placeholder="01XXXXXXXXX"
            maxLength={11}
            required
          />
        </div>

        {/* Degree - Only show if isDoctor is true */}
        {formData.isDoctor && (
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <label className="w-32 px-3 py-2 text-sm font-medium text-gray-700 border-r border-gray-300 bg-gray-50 flex items-center">
              Degree
            </label>
            <input
              type="text"
              value={formData.degree || ""}
              onChange={(e) => handleFieldChange("degree", e.target.value)}
              className="flex-1 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
              placeholder="e.g., MBBS, MD, FCPS"
            />
          </div>
        )}

        {/* Details */}
        <div className="flex border border-gray-300 rounded-lg overflow-hidden">
          <label className="w-32 px-3 py-2 text-sm font-medium text-gray-700 border-r border-gray-300 bg-gray-50 flex items-start pt-3">
            Details
          </label>
          <textarea
            value={formData.details || ""}
            onChange={(e) => handleFieldChange("details", e.target.value)}
            className="flex-1 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset resize-none"
            placeholder="Additional information about the referrer"
            rows={3}
          />
        </div>

        {/* Status */}
        <div className="flex border border-gray-300 rounded-lg overflow-hidden">
          <label className="w-32 px-3 py-2 text-sm font-medium text-gray-700 border-r border-gray-300 bg-gray-50 flex items-center">
            Status
          </label>
          <select
            value={formData.isActive ? "true" : "false"}
            onChange={(e) => handleFieldChange("isActive", e.target.value === "true")}
            className={`flex-1 px-3 py-2 focus:outline-none ${
              formData.isActive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
            }`}
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>

        {/* Commission Type & Value */}
        <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Commission Details</h3>

          {/* Commission Type Radio Buttons */}
          <div className="flex gap-4 mb-3">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="commissionType"
                value="percentage"
                checked={formData.commissionType === "percentage"}
                onChange={(e) => handleFieldChange("commissionType", e.target.value)}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">Percentage (%)</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="commissionType"
                value="fixed"
                checked={formData.commissionType === "fixed"}
                onChange={(e) => handleFieldChange("commissionType", e.target.value)}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">Fixed Amount (৳)</span>
            </label>
          </div>

          {/* Commission Value */}
          <div className="flex border border-gray-300 rounded-lg overflow-hidden bg-white">
            <label className="w-32 px-3 py-2 text-sm font-medium text-gray-700 border-r border-gray-300 bg-gray-50 flex items-center">
              {formData.commissionType === "percentage" ? "Percentage" : "Amount"}
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="number"
              value={formData.commissionValue || ""}
              onChange={(e) => handleFieldChange("commissionValue", parseFloat(e.target.value) || 0)}
              className="flex-1 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
              placeholder={formData.commissionType === "percentage" ? "0-100" : "Amount in BDT"}
              min="0"
              max={formData.commissionType === "percentage" ? "100" : undefined}
              step={formData.commissionType === "percentage" ? "0.1" : "1"}
              required
            />
            <span className="px-3 py-2 text-sm font-medium text-gray-700 border-l border-gray-300 bg-gray-50 flex items-center">
              {formData.commissionType === "percentage" ? "%" : "৳"}
            </span>
          </div>

          {/* Helper Text */}
          <p className="text-xs text-gray-500 mt-2">
            {formData.commissionType === "percentage"
              ? "Enter a value between 0 and 100"
              : "Enter the fixed commission amount in BDT"}
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-lg font-semibold transition-colors text-sm bg-gray-500 hover:bg-gray-600 text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 py-3 px-4 rounded-lg font-semibold transition-colors text-sm bg-blue-600 hover:bg-blue-700 text-white"
          >
            {label.button}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReferrerForm;
