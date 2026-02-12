import { FlaskConical, Settings, Trash2, Wifi, WifiOff, DollarSign, FileText } from "lucide-react";

const LabTest = ({ input, onConfigure, onDelete }) => {
  return (
    <div className="group relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 p-5 border border-white/20 hover:border-teal-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        {/* Left Section - Info */}
        <div className="flex items-start gap-4 flex-1 min-w-0">
          {/* Avatar - Circular with integrated status dot */}
          <div className="relative flex-shrink-0">
            <div
              className={`
                w-12 h-12 rounded-2xl flex items-center justify-center
                bg-gradient-to-br from-teal-50 to-cyan-50
                text-teal-700 shadow-sm group-hover:shadow
                transition-all duration-300
              `}
            >
              <FlaskConical className="w-5 h-5" />
            </div>
            {/* Online/Offline dot - now inside the avatar area */}
            <div
              className={`
                absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full 
                border-2 border-white shadow-sm flex items-center justify-center
                ${input.isOnline ? "bg-emerald-500" : "bg-amber-500"}
              `}
            >
              {input.isOnline ? <Wifi className="w-2 h-2 text-white" /> : <WifiOff className="w-2 h-2 text-white" />}
            </div>
          </div>

          {/* Test Info */}
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-semibold text-gray-800 truncate">{input.name}</h3>

              {/* Online/Offline badge - subtle chip */}
              <span
                className={`
                  px-2.5 py-0.5 rounded-full text-xs font-medium
                  inline-flex items-center gap-1.5
                  ${input.isOnline ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}
                `}
              >
                {input.isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                {input.isOnline ? "Online" : "Offline"}
              </span>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Price - soft pill */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 rounded-full text-xs">
                <DollarSign className="w-3.5 h-3.5 text-gray-500" />
                <span className="font-medium text-gray-700">{input.price ? `৳${input.price}` : "Price NOT set"}</span>
              </div>

              {/* Formats count - soft pill */}
              {input.formats?.length > 0 && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 rounded-full text-xs">
                  <FileText className="w-3.5 h-3.5 text-purple-500" />
                  <span className="font-medium text-purple-700">
                    {input.formats.length} format
                    {input.formats.length !== 1 ? "s" : ""}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions - Outline buttons with hover states */}
        <div className="flex gap-2 sm:flex-row flex-wrap sm:flex-nowrap">
          <button
            onClick={onConfigure}
            className="
              flex-1 sm:flex-initial px-4 py-2 rounded-xl text-sm font-medium
              border border-teal-200 bg-white/50 text-teal-700
              hover:bg-teal-50 hover:border-teal-300 hover:text-teal-800
              transition-all duration-200
              inline-flex items-center justify-center gap-2
              shadow-sm hover:shadow
            "
          >
            <Settings className="w-4 h-4" />
            <span>Configure</span>
          </button>

          <button
            onClick={onDelete}
            className="
              flex-1 sm:flex-initial px-4 py-2 rounded-xl text-sm font-medium
              border border-rose-200 bg-white/50 text-rose-600
              hover:bg-rose-50 hover:border-rose-300 hover:text-rose-700
              transition-all duration-200
              inline-flex items-center justify-center gap-2
              shadow-sm hover:shadow
            "
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LabTest;
