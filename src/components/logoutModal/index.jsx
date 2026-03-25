// components/LogoutConfirmModal.jsx
import { LogOut, X } from "lucide-react";
import Portal from "../Portal";

const LogoutConfirmModal = ({ onConfirm, onCancel }) => {
  return (
    <Portal>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9998] bg-black/30 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div
          className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-200/80 overflow-hidden"
          style={{ animation: "modalIn 0.25s cubic-bezier(.22,1,.36,1) both" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top accent bar */}
          <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-indigo-500" />

          {/* Header */}
          <div className="flex items-start justify-between px-5 pt-5 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center flex-shrink-0">
                <LogOut className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm leading-none">Sign out</p>
                <p className="text-xs text-gray-400 mt-1">This device only</p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="px-5 pb-5">
            <p className="text-sm text-gray-500 leading-relaxed mb-5">
              Are you sure you want to log out? You'll need to sign in again to access your lab workspace.
            </p>

            {/* Actions */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={onCancel}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600
                  bg-gray-100 hover:bg-gray-200 border border-gray-200
                  transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white
                  bg-gradient-to-r from-red-500 to-rose-500
                  hover:from-red-600 hover:to-rose-600
                  border border-red-400/30 shadow-sm shadow-red-500/20
                  transition-all duration-200 hover:-translate-y-0.5"
              >
                Yes, log out
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95) translateY(8px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);   }
        }
      `}</style>
    </Portal>
  );
};

export default LogoutConfirmModal;