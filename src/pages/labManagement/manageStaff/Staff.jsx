import {
  Phone,
  User,
  Edit2,
  UserX,
  UserCheck,
  Trash2,
  Shield,
  FileText,
  FilePlus,
  FileEdit,
  Trash,
  Upload,
  Mail,
} from "lucide-react";

const Staff = ({ input, index, onEdit, onDelete, onDeactivate, onActivate }) => {
  const permissionsList = [
    { key: "createInvoice", label: "Create Invoice", icon: FilePlus, color: "blue" },
    { key: "editInvoice", label: "Edit Invoice", icon: FileEdit, color: "amber" },
    { key: "deleteInvoice", label: "Delete Invoice", icon: Trash, color: "red" },
    { key: "cashmemo", label: "Cashmemo", icon: FileText, color: "green" },
    { key: "uploadReport", label: "Upload Report", icon: Upload, color: "purple" },
  ];

  const activePermissions = permissionsList.filter((perm) => input.permissions[perm.key]);
  const hasFullAccess = activePermissions.length === permissionsList.length;

  return (
    <div className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 p-5 border border-gray-200 hover:border-indigo-300">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
        {/* Left Section - Info */}
        <div className="flex-1 space-y-4">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shadow-md group-hover:shadow-lg transition-all duration-300">
                {input.name.charAt(0).toUpperCase()}
              </div>
              <div
                className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${
                  input.isActive ? "bg-green-500" : "bg-red-500"
                }`}
              ></div>
            </div>

            {/* Name and Badges */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <h3 className="text-lg font-bold text-gray-900 truncate">{input.name}</h3>
                {hasFullAccess && (
                  <span className="px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wide bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 flex items-center gap-1.5">
                    <Shield className="w-3 h-3" />
                    Full Access
                  </span>
                )}
                <span
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wide ${
                    input.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  }`}
                >
                  {input.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-3">
                {/* Username */}
                <div className="flex items-center gap-2 text-gray-700 bg-gray-50 rounded-lg px-3 py-2 hover:bg-indigo-50 transition-colors">
                  <div className="bg-indigo-100 p-1.5 rounded-md">
                    <User className="w-3.5 h-3.5 text-indigo-600" />
                  </div>
                  <span className="truncate font-medium text-sm">@{input.username}</span>
                </div>

                {/* Email */}
                <div className="flex items-center gap-2 text-gray-700 bg-gray-50 rounded-lg px-3 py-2 hover:bg-blue-50 transition-colors">
                  <div className="bg-blue-100 p-1.5 rounded-md">
                    <Mail className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <span className="truncate font-medium text-sm">{input.email}</span>
                </div>

                {/* Mobile */}
                <div className="flex items-center gap-2 text-gray-700 bg-gray-50 rounded-lg px-3 py-2 hover:bg-purple-50 transition-colors sm:col-span-2">
                  <div className="bg-purple-100 p-1.5 rounded-md">
                    <Phone className="w-3.5 h-3.5 text-purple-600" />
                  </div>
                  <span className="truncate font-medium text-sm">{input.mobileNumber}</span>
                </div>
              </div>

              {/* Permissions */}
              <div className="bg-gradient-to-br from-gray-50 to-indigo-50 rounded-lg p-3 border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    Permissions ({activePermissions.length}/{permissionsList.length})
                  </span>
                </div>
                {activePermissions.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {activePermissions.map((perm) => {
                      const Icon = perm.icon;
                      const colorClasses = {
                        blue: "bg-blue-100 text-blue-700 border-blue-200",
                        amber: "bg-amber-100 text-amber-700 border-amber-200",
                        red: "bg-red-100 text-red-700 border-red-200",
                        green: "bg-green-100 text-green-700 border-green-200",
                        purple: "bg-purple-100 text-purple-700 border-purple-200",
                      };
                      return (
                        <span
                          key={perm.key}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${colorClasses[perm.color]}`}
                        >
                          <Icon className="w-3 h-3" />
                          {perm.label}
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 italic">No permissions assigned</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Section - Actions */}
        <div className="flex lg:flex-col gap-2 flex-wrap lg:flex-nowrap">
          <button
            onClick={onEdit}
            className="flex-1 lg:flex-initial bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
            <span className="text-sm">Edit</span>
          </button>

          {input.isActive ? (
            <button
              onClick={onDeactivate}
              className="flex-1 lg:flex-initial bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
              title="Deactivate"
            >
              <UserX className="w-4 h-4" />
              <span className="text-sm">Deactivate</span>
            </button>
          ) : (
            <button
              onClick={onActivate}
              className="flex-1 lg:flex-initial bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
              title="Activate"
            >
              <UserCheck className="w-4 h-4" />
              <span className="text-sm">Activate</span>
            </button>
          )}

          <button
            onClick={onDelete}
            className="flex-1 lg:flex-initial bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
            <span className="text-sm">Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Staff;
