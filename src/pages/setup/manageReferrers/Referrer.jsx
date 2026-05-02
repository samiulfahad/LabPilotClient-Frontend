import {
  Phone,
  GraduationCap,
  DollarSign,
  Edit2,
  UserX,
  UserCheck,
  Trash2,
  Stethoscope,
  Briefcase,
  Building2,
} from "lucide-react";

const TYPE_CONFIG = {
  doctor: { label: "Doctor", icon: Stethoscope, classes: "bg-indigo-50 text-indigo-700" },
  agent: { label: "Agent", icon: Briefcase, classes: "bg-amber-50 text-amber-700" },
  institute: { label: "Institute", icon: Building2, classes: "bg-teal-50 text-teal-700" },
};

const Referrer = ({ input, onEdit, onDelete, onDeactivate, onActivate }) => {
  const typeConfig = TYPE_CONFIG[input.type] ?? TYPE_CONFIG.doctor;
  const TypeIcon = typeConfig.icon;

  return (
    <div className="group relative bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.04)] transition-all duration-300 p-5 border border-gray-100/80 hover:border-blue-200">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
        {/* Left */}
        <div className="flex-1 min-w-0 flex items-start gap-4">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-700 font-semibold text-base shadow-sm ring-1 ring-black/5">
              {input.name.charAt(0).toUpperCase()}
            </div>
            <div
              className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm ${input.isActive ? "bg-emerald-500" : "bg-slate-400"}`}
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 space-y-2">
            {/* Name + badges */}
            <div className="flex items-center flex-wrap gap-2">
              <h3 className="text-lg font-semibold text-gray-900 tracking-tight truncate">{input.name}</h3>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${typeConfig.classes}`}
              >
                <TypeIcon className="w-3 h-3" />
                {typeConfig.label}
              </span>
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${input.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
              >
                {input.isActive ? "Active" : "Inactive"}
              </span>
            </div>

            {/* Contact row */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <Phone className="w-3.5 h-3.5 text-blue-500" />
                <span className="font-medium">{input.contactNumber}</span>
              </div>
              {input.degree && (
                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="font-medium">{input.degree}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 text-xs bg-gradient-to-r from-green-50 to-emerald-50 px-2.5 py-1 rounded-full border border-green-100/50">
                <DollarSign className="w-3 h-3 text-emerald-600" />
                <span className="font-medium text-emerald-700">
                  {input.commissionType === "percentage" ? `${input.commissionValue}%` : `৳${input.commissionValue}`}
                </span>
                <span className="text-[10px] text-gray-500">
                  {input.commissionType === "percentage" ? "commission" : "fixed"}
                </span>
              </div>
            </div>

            {input.details && (
              <p className="text-xs text-gray-500 bg-gray-50/70 rounded-lg p-3 border border-gray-100 leading-relaxed">
                {input.details}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap mx-auto lg:mx-0">
          <button
            onClick={onEdit}
            className="px-4 py-2 rounded-lg text-xs font-medium bg-white border border-blue-300 text-gray-700 hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700 transition-all inline-flex items-center gap-1.5 shadow-sm hover:shadow"
          >
            <Edit2 className="w-3.5 h-3.5" /> Edit
          </button>
          {input.isActive ? (
            <button
              onClick={onDeactivate}
              className="px-4 py-2 rounded-lg text-xs font-medium bg-white border border-amber-300 text-gray-700 hover:bg-amber-50 hover:border-amber-400 hover:text-amber-700 transition-all inline-flex items-center gap-1.5 shadow-sm hover:shadow"
            >
              <UserX className="w-3.5 h-3.5" /> Deactivate
            </button>
          ) : (
            <button
              onClick={onActivate}
              className="px-4 py-2 rounded-lg text-xs font-medium bg-white border border-emerald-300 text-gray-700 hover:bg-emerald-50 hover:border-emerald-400 hover:text-emerald-700 transition-all inline-flex items-center gap-1.5 shadow-sm hover:shadow"
            >
              <UserCheck className="w-3.5 h-3.5" /> Activate
            </button>
          )}
          <button
            onClick={onDelete}
            className="px-4 py-2 rounded-lg text-xs font-medium bg-white border border-rose-300 text-gray-700 hover:bg-rose-50 hover:border-rose-400 hover:text-rose-600 transition-all inline-flex items-center gap-1.5 shadow-sm hover:shadow"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default Referrer;
