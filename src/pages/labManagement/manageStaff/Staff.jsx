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

const Staff = ({ input, onEdit, onDelete, onDeactivate, onActivate }) => {
  const permissionsList = [
    { key: "createInvoice", label: "Create Invoice", icon: FilePlus, color: "blue" },
    { key: "editInvoice", label: "Edit Invoice", icon: FileEdit, color: "amber" },
    { key: "deleteInvoice", label: "Delete Invoice", icon: Trash, color: "red" },
    { key: "cashmemo", label: "Cashmemo", icon: FileText, color: "green" },
    { key: "uploadReport", label: "Upload Report", icon: Upload, color: "purple" },
  ];

  const activePermissions = permissionsList.filter((perm) => input.permissions[perm.key]);
  const hasFullAccess = activePermissions.length === permissionsList.length;

  // Colour mapping for permission chips
  const chipColors = {
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    red: "bg-rose-50 text-rose-700 border-rose-200",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
  };

  return (
    <div className="group relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.02),0_4px_12px_rgba(0,0,0,0.01)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.04)] transition-all duration-300 p-5 border border-white/20 hover:border-indigo-200">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
        {/* Left Section - Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-4">
            {/* Avatar with integrated status dot */}
            <div className="relative flex-shrink-0">
              <div
                className="
                  w-12 h-12 rounded-xl flex items-center justify-center
                  bg-gradient-to-br from-indigo-50 to-purple-50
                  text-indigo-700 font-semibold text-base tracking-tight
                  shadow-sm ring-1 ring-black/5
                  group-hover:shadow transition-all duration-300
                "
              >
                {input.name.charAt(0).toUpperCase()}
              </div>
              {/* Status dot - integrated */}
              <div
                className={`
                  absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full
                  border-2 border-white shadow-sm
                  ${input.isActive ? "bg-emerald-500" : "bg-slate-400"}
                `}
              />
            </div>

            {/* Name + Badges */}
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center flex-wrap gap-2">
                <h3 className="text-lg font-semibold text-gray-900 tracking-tight truncate">{input.name}</h3>

                {/* Full Access badge - subtle */}
                {hasFullAccess && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                    <Shield className="w-3 h-3" />
                    Full Access
                  </span>
                )}

                {/* Status badge - subtle */}
                <span
                  className={`
                    inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                    ${
                      input.isActive
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-slate-100 text-slate-600 border border-slate-200"
                    }
                  `}
                >
                  {input.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              {/* Contact info - soft pills */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Username */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-full text-xs">
                  <div className="bg-indigo-100 p-1 rounded-full">
                    <User className="w-3 h-3 text-indigo-600" />
                  </div>
                  <span className="font-medium text-gray-700">@{input.username}</span>
                </div>

                {/* Email */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-full text-xs">
                  <div className="bg-blue-100 p-1 rounded-full">
                    <Mail className="w-3 h-3 text-blue-600" />
                  </div>
                  <span className="font-medium text-gray-700 truncate max-w-[180px]">{input.email}</span>
                </div>

                {/* Mobile */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-full text-xs">
                  <div className="bg-purple-100 p-1 rounded-full">
                    <Phone className="w-3 h-3 text-purple-600" />
                  </div>
                  <span className="font-medium text-gray-700">{input.mobileNumber}</span>
                </div>
              </div>

              {/* Permissions - subtle chips */}
              <div className="mt-3 pt-2 border-t border-gray-100">
                <div className="flex items-center gap-1.5 mb-2 text-xs font-medium text-gray-500">
                  <Shield className="w-3.5 h-3.5 text-indigo-500" />
                  <span>
                    Permissions ({activePermissions.length}/{permissionsList.length})
                  </span>
                </div>
                {activePermissions.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {activePermissions.map((perm) => {
                      const Icon = perm.icon;
                      return (
                        <span
                          key={perm.key}
                          className={`
                            inline-flex items-center gap-1.5 px-2.5 py-1 
                            rounded-full text-xs font-medium border
                            ${chipColors[perm.color]}
                          `}
                        >
                          <Icon className="w-3 h-3" />
                          {perm.label}
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">No permissions assigned</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Section - Actions (horizontal row, border colours, black icons) */}
        {/* Centered on mobile, right-aligned on desktop */}
        <div className="flex flex-row items-center gap-2 shrink-0 flex-wrap mx-auto lg:mx-0">
          {/* Edit - Indigo border */}
          <button
            onClick={onEdit}
            className="
              px-4 py-2 rounded-lg text-xs font-medium
              bg-white text-gray-700 border border-indigo-300
              hover:bg-indigo-50 hover:border-indigo-400 hover:text-indigo-700
              transition-all duration-200
              inline-flex items-center justify-center gap-1.5
              shadow-sm hover:shadow
              [&>svg]:text-gray-700 hover:[&>svg]:text-indigo-700
            "
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit</span>
          </button>

          {/* Activate/Deactivate - Amber / Emerald border */}
          {input.isActive ? (
            <button
              onClick={onDeactivate}
              className="
                px-4 py-2 rounded-lg text-xs font-medium
                bg-white text-gray-700 border border-amber-300
                hover:bg-amber-50 hover:border-amber-400 hover:text-amber-700
                transition-all duration-200
                inline-flex items-center justify-center gap-1.5
                shadow-sm hover:shadow
                [&>svg]:text-gray-700 hover:[&>svg]:text-amber-700
              "
            >
              <UserX className="w-3.5 h-3.5" />
              <span>Deactivate</span>
            </button>
          ) : (
            <button
              onClick={onActivate}
              className="
                px-4 py-2 rounded-lg text-xs font-medium
                bg-white text-gray-700 border border-emerald-300
                hover:bg-emerald-50 hover:border-emerald-400 hover:text-emerald-700
                transition-all duration-200
                inline-flex items-center justify-center gap-1.5
                shadow-sm hover:shadow
                [&>svg]:text-gray-700 hover:[&>svg]:text-emerald-700
              "
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Activate</span>
            </button>
          )}

          {/* Delete - Rose border */}
          <button
            onClick={onDelete}
            className="
              px-4 py-2 rounded-lg text-xs font-medium
              bg-white text-gray-700 border border-rose-300
              hover:bg-rose-50 hover:border-rose-400 hover:text-rose-600
              transition-all duration-200
              inline-flex items-center justify-center gap-1.5
              shadow-sm hover:shadow
              [&>svg]:text-gray-700 hover:[&>svg]:text-rose-600
            "
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Staff;
