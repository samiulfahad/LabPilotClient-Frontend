import { User, Phone, Shield, Check, FileText, FilePlus, FileEdit, Trash, Upload, AtSign, Mail } from "lucide-react";

const StaffForm = ({ formData, onChange, onSubmit, onClose }) => {
  const label = {};
  if (formData.type === "editStaff") {
    label.formTitle = "Edit Staff";
    label.button = "Update";
  } else {
    label.formTitle = "Add New Staff";
    label.button = "Create Staff";
  }

  const handleFieldChange = (field, value) => {
    onChange(field, value);
  };

  const handlePermissionChange = (permission, value) => {
    onChange("permissions", {
      ...formData.permissions,
      [permission]: value,
    });
  };

  const permissionsList = [
    {
      key: "createInvoice",
      label: "Create Invoice",
      description: "Allow creating new invoices",
      icon: FilePlus,
      color: "blue",
    },
    {
      key: "editInvoice",
      label: "Edit Invoice",
      description: "Allow editing existing invoices",
      icon: FileEdit,
      color: "amber",
    },
    {
      key: "deleteInvoice",
      label: "Delete Invoice",
      description: "Allow deleting invoices",
      icon: Trash,
      color: "red",
    },
    {
      key: "cashmemo",
      label: "Cashmemo",
      description: "Access to cashmemo management",
      icon: FileText,
      color: "green",
    },
    {
      key: "uploadReport",
      label: "Upload Report",
      description: "Allow uploading reports",
      icon: Upload,
      color: "purple",
    },
  ];

  const allPermissionsEnabled = permissionsList.every((perm) => formData.permissions[perm.key]);

  const toggleAllPermissions = () => {
    const newValue = !allPermissionsEnabled;
    const newPermissions = {};
    permissionsList.forEach((perm) => {
      newPermissions[perm.key] = newValue;
    });
    onChange("permissions", newPermissions);
  };

  return (
    <div className="relative">
      {/* Header - Sticky at top */}
      <div className="sticky top-0 z-10 px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Shield className="w-6 h-6 text-indigo-600" />
          {label.formTitle}
        </h2>
      </div>

      {/* Scrollable Content - Parent modal handles overflow */}
      <div className="px-6 py-6 bg-gray-50">
        <form onSubmit={onSubmit} className="space-y-5 max-w-2xl mx-auto">
          {/* Basic Information */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-gray-500" />
              Basic Information
            </h3>
            <div className="space-y-3">
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
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-sm"
                    placeholder="Enter staff name"
                    required
                  />
                </div>
              </div>

              {/* Username and Email - Same Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={formData.username || ""}
                      onChange={(e) => handleFieldChange("username", e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-sm"
                      placeholder="username"
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={formData.email || ""}
                      onChange={(e) => handleFieldChange("email", e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-sm"
                      placeholder="email@example.com"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Mobile Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.mobileNumber || ""}
                    onChange={(e) => handleFieldChange("mobileNumber", e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-sm"
                    placeholder="01XXXXXXXXX"
                    maxLength={11}
                    required
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Account Status</label>
                <select
                  value={formData.isActive ? "true" : "false"}
                  onChange={(e) => handleFieldChange("isActive", e.target.value === "true")}
                  className={`w-full px-4 py-2 border rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all appearance-none cursor-pointer text-sm ${
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

          {/* Permissions */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Shield className="w-4 h-4 text-gray-500" />
                Access & Permissions
              </h3>
              <button
                type="button"
                onClick={toggleAllPermissions}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  allPermissionsEnabled
                    ? "bg-red-100 text-red-700 hover:bg-red-200"
                    : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                }`}
              >
                {allPermissionsEnabled ? "Deselect All" : "Select All"}
              </button>
            </div>

            <div className="space-y-2">
              {permissionsList.map((perm) => {
                const Icon = perm.icon;
                const isChecked = formData.permissions[perm.key];
                const colorClasses = {
                  blue: {
                    bg: "bg-blue-50",
                    border: "border-blue-300",
                    text: "text-blue-700",
                    icon: "text-blue-600",
                  },
                  amber: {
                    bg: "bg-amber-50",
                    border: "border-amber-300",
                    text: "text-amber-700",
                    icon: "text-amber-600",
                  },
                  red: {
                    bg: "bg-red-50",
                    border: "border-red-300",
                    text: "text-red-700",
                    icon: "text-red-600",
                  },
                  green: {
                    bg: "bg-green-50",
                    border: "border-green-300",
                    text: "text-green-700",
                    icon: "text-green-600",
                  },
                  purple: {
                    bg: "bg-purple-50",
                    border: "border-purple-300",
                    text: "text-purple-700",
                    icon: "text-purple-600",
                  },
                };

                return (
                  <label
                    key={perm.key}
                    className={`relative flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      isChecked
                        ? `${colorClasses[perm.color].bg} ${colorClasses[perm.color].border}`
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => handlePermissionChange(perm.key, e.target.checked)}
                      className="mt-1 w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-md ${isChecked ? colorClasses[perm.color].bg : "bg-gray-100"}`}>
                          <Icon className={`w-4 h-4 ${isChecked ? colorClasses[perm.color].icon : "text-gray-400"}`} />
                        </div>
                        <div className="flex-1">
                          <p
                            className={`text-sm font-semibold ${
                              isChecked ? colorClasses[perm.color].text : "text-gray-700"
                            }`}
                          >
                            {perm.label}
                          </p>
                          <p className="text-xs text-gray-500">{perm.description}</p>
                        </div>
                      </div>
                    </div>
                    {isChecked && (
                      <div className="absolute top-2 right-2">
                        <Check className={`w-4 h-4 ${colorClasses[perm.color].icon}`} />
                      </div>
                    )}
                  </label>
                );
              })}
            </div>

            {Object.values(formData.permissions).every((val) => !val) && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs text-amber-700 font-medium flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5" />
                  Warning: No permissions selected. This staff will have no access.
                </p>
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Footer - Sticky at bottom */}
      <div className="sticky bottom-0 z-10 border-t border-gray-200 px-6 py-4 bg-white">
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
            className="flex-1 py-2.5 px-4 rounded-lg font-medium transition-all text-sm bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-sm hover:shadow"
          >
            {label.button}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StaffForm;
