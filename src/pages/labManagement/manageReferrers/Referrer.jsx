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
} from "lucide-react";

const Referrer = ({ input, onEdit, onDelete, onDeactivate, onActivate }) => {
  return (
    <div className="group relative bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.02),0_4px_12px_rgba(0,0,0,0.01)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.04)] transition-all duration-300 p-5 border border-gray-100/80 hover:border-blue-200">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
        {/* Left Section - Avatar & Primary Info (unchanged) */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-4">
            {/* Avatar - Clean monogram */}
            <div className="relative flex-shrink-0">
              <div
                className="
                  w-12 h-12 rounded-xl flex items-center justify-center
                  bg-gradient-to-br from-blue-50 to-indigo-50
                  text-blue-700 font-semibold text-base tracking-tight
                  shadow-sm ring-1 ring-black/5
                  group-hover:shadow transition-all duration-300
                "
              >
                {input.name.charAt(0).toUpperCase()}
              </div>
              {/* Status indicator - Elegant dot */}
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

                {/* Type - Refined pill */}
                <span
                  className={`
                    inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
                    text-xs font-medium
                    ${input.isDoctor ? "bg-indigo-50 text-indigo-700" : "bg-amber-50 text-amber-700"}
                  `}
                >
                  {input.isDoctor ? <Stethoscope className="w-3 h-3" /> : <Briefcase className="w-3 h-3" />}
                  {input.isDoctor ? "Doctor" : "Agent"}
                </span>

                {/* Status - Subtle */}
                <span
                  className={`
                    inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
                    text-xs font-medium
                    ${input.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}
                  `}
                >
                  {input.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              {/* Contact - Clean, minimal */}
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

                {/* Commission - Compact & clear */}
                <div className="flex items-center gap-1.5 text-xs bg-gradient-to-r from-green-50 to-emerald-50 px-2.5 py-1 rounded-full border border-green-100/50">
                  <DollarSign className="w-3 h-3 text-emerald-600" />
                  <span className="font-medium text-emerald-700">
                    {input.commissionType === "percentage" ? `${input.commissionValue}%` : `৳${input.commissionValue}`}
                  </span>
                  <span className="text-[10px] font-normal text-gray-500">
                    {input.commissionType === "percentage" ? "commission" : "fixed"}
                  </span>
                </div>
              </div>

              {/* Details - Subtle, separated */}
              {input.details && (
                <div className="mt-3 text-xs text-gray-500 bg-gray-50/70 rounded-lg p-3 border border-gray-100 leading-relaxed">
                  {input.details}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Section - Actions - Centered on mobile, right-aligned on desktop */}
        <div className="flex flex-row items-center gap-2 shrink-0 flex-wrap mx-auto lg:mx-0">
          {/* Edit - Blue border, black icon & text, hover turns blue */}
          <button
            onClick={onEdit}
            className="
              px-4 py-2 rounded-lg text-xs font-medium
              bg-white text-gray-700 border border-blue-300
              hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700
              transition-all duration-200
              inline-flex items-center justify-center gap-1.5
              shadow-sm hover:shadow
              [&>svg]:text-gray-700 hover:[&>svg]:text-blue-700
            "
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit</span>
          </button>

          {/* Activate/Deactivate - Amber/Emerald border, black icon & text, hover turns coloured */}
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

          {/* Delete - Rose border, black icon & text, hover turns rose */}
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

export default Referrer;
