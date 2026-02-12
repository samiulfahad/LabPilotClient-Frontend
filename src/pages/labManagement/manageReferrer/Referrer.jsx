import {
  Phone,
  GraduationCap,
  User,
  DollarSign,
  Edit2,
  UserX,
  UserCheck,
  Trash2,
  Stethoscope,
  Briefcase,
} from "lucide-react";

const Referrer = ({ input, index, onEdit, onDelete, onDeactivate, onActivate }) => {
  return (
    <div className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 p-5 border border-gray-200 hover:border-blue-300">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        {/* Left Section - Info */}
        <div className="flex-1 space-y-4">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shadow-md group-hover:shadow-lg transition-all duration-300">
                {input.name.charAt(0).toUpperCase()}
              </div>
              <div
                className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${
                  input.isActive ? "bg-green-500" : "bg-red-500"
                }`}
              ></div>
            </div>

            {/* Name and Type Badge */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <h3 className="text-lg font-bold text-gray-900 truncate">{input.name}</h3>
                <span
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5 ${
                    input.isDoctor ? "bg-purple-100 text-purple-700" : "bg-orange-100 text-orange-700"
                  }`}
                >
                  {input.isDoctor ? (
                    <>
                      <Stethoscope className="w-3 h-3" />
                      Doctor
                    </>
                  ) : (
                    <>
                      <Briefcase className="w-3 h-3" />
                      Agent
                    </>
                  )}
                </span>
                <span
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wide ${
                    input.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  }`}
                >
                  {input.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Contact */}
                <div className="flex items-center gap-2 text-gray-700 bg-gray-50 rounded-lg px-3 py-2 hover:bg-blue-50 transition-colors">
                  <div className="bg-blue-100 p-1.5 rounded-md">
                    <Phone className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <span className="truncate font-medium text-sm">{input.contactNumber}</span>
                </div>

                {/* Degree */}
                {input.degree && (
                  <div className="flex items-center gap-2 text-gray-700 bg-gray-50 rounded-lg px-3 py-2 hover:bg-purple-50 transition-colors">
                    <div className="bg-purple-100 p-1.5 rounded-md">
                      <GraduationCap className="w-3.5 h-3.5 text-purple-600" />
                    </div>
                    <span className="truncate font-medium text-sm">{input.degree}</span>
                  </div>
                )}

                {/* Commission */}
                <div
                  className={`flex items-center gap-2 text-gray-700 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg px-3 py-2 border border-green-200 ${!input.degree ? "sm:col-span-2" : ""}`}
                >
                  <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-1.5 rounded-md">
                    <DollarSign className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="font-bold text-sm text-green-700">
                    {input.commissionType === "percentage"
                      ? `${input.commissionValue}% Commission`
                      : `৳${input.commissionValue} Fixed`}
                  </span>
                </div>
              </div>

              {/* Details */}
              {input.details && (
                <div className="mt-3 text-sm text-gray-600 bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <p className="leading-relaxed line-clamp-2">{input.details}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Section - Actions */}
        <div className="flex lg:flex-col gap-2 flex-wrap lg:flex-nowrap">
          <button
            onClick={onEdit}
            className="flex-1 lg:flex-initial bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
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

export default Referrer;
