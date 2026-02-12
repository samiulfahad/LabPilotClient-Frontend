import { FlaskConical, Settings, Trash2, Wifi, WifiOff, DollarSign, FileText, UserX, UserCheck } from "lucide-react";

const LabTest = ({ input, index, onConfigure, onDelete, onDeactivate, onActivate }) => {
  return (
    <div className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 p-4 border border-gray-200 hover:border-teal-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left Section */}
        <div className="flex items-start gap-4 flex-1 min-w-0">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="bg-gradient-to-br from-teal-500 to-cyan-600 text-white w-11 h-11 rounded-xl flex items-center justify-center font-bold shadow-md group-hover:shadow-lg transition-all duration-300">
              <FlaskConical className="w-5 h-5" />
            </div>
            {/* Online/Offline dot */}
            <div
              className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm flex items-center justify-center ${
                input.isOnline ? "bg-blue-500" : "bg-orange-400"
              }`}
            >
              {input.isOnline ? <Wifi className="w-2 h-2 text-white" /> : <WifiOff className="w-2 h-2 text-white" />}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <h3 className="text-base font-bold text-gray-900 truncate">{input.name}</h3>

              {/* Online/Offline badge */}
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 ${
                  input.isOnline ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"
                }`}
              >
                {input.isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                {input.isOnline ? "Online" : "Offline"}
              </span>

              {/* Active/Inactive badge */}
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${
                  input.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                }`}
              >
                {input.isActive ? "Active" : "Inactive"}
              </span>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              {/* Price */}
              <div className="flex items-center gap-1.5 text-sm">
                <div className="bg-green-100 p-1 rounded-md">
                  <DollarSign className="w-3 h-3 text-green-600" />
                </div>
                <span className="font-semibold text-green-700">
                  {input.price ? `৳${input.price}` : "Price not set"}
                </span>
              </div>

              {/* Formats count */}
              {input.formats && input.formats.length > 0 && (
                <div className="flex items-center gap-1.5 text-sm">
                  <div className="bg-purple-100 p-1 rounded-md">
                    <FileText className="w-3 h-3 text-purple-600" />
                  </div>
                  <span className="text-xs font-medium text-purple-700">
                    {input.formats.length} format{input.formats.length !== 1 ? "s" : ""}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 sm:flex-col flex-wrap sm:flex-nowrap">
          <button
            onClick={onConfigure}
            className="flex-1 sm:flex-initial bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md text-sm"
          >
            <Settings className="w-4 h-4" />
            <span>Configure</span>
          </button>

          {input.isActive ? (
            <button
              onClick={onDeactivate}
              className="flex-1 sm:flex-initial bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md text-sm"
            >
              <UserX className="w-4 h-4" />
              <span>Deactivate</span>
            </button>
          ) : (
            <button
              onClick={onActivate}
              className="flex-1 sm:flex-initial bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md text-sm"
            >
              <UserCheck className="w-4 h-4" />
              <span>Activate</span>
            </button>
          )}

          <button
            onClick={onDelete}
            className="flex-1 sm:flex-initial bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md text-sm"
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
