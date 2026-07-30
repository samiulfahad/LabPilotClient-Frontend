import React from "react";
import { CheckCircle2, XCircle, AlertTriangle, X } from "lucide-react";
import Portal from "../Portal";

// Four types: success, error, warning (confirm/cancel), denied (info-only)
const typeConfig = {
  success: {
    icon: CheckCircle2,
    title: "Success!",
    titleColor: "text-green-600",
    iconBgColor: "bg-gradient-to-br from-green-100 to-emerald-100",
    iconColor: "text-green-600",
    buttonColor: "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700",
    singleButton: true,
  },
  error: {
    icon: XCircle,
    title: "Error!",
    titleColor: "text-red-600",
    iconBgColor: "bg-gradient-to-br from-red-100 to-rose-100",
    iconColor: "text-red-600",
    buttonColor: "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700",
    singleButton: true,
  },
  warning: {
    icon: AlertTriangle,
    title: "Are you sure?",
    titleColor: "text-yellow-600",
    iconBgColor: "bg-gradient-to-br from-yellow-100 to-amber-100",
    iconColor: "text-yellow-600",
    confirmButtonColor: "bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-700 hover:to-amber-700",
    cancelButtonColor: "bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700",
    singleButton: false,
  },
  denied: {
    icon: AlertTriangle,
    title: "No Permission",
    titleColor: "text-amber-600",
    iconBgColor: "bg-gradient-to-br from-amber-100 to-yellow-100",
    iconColor: "text-amber-600",
    buttonColor: "bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700",
    singleButton: true,
  },
};

// Matching ring/focus colors keyed by type, so buttons and icon halo stay in sync with the config above
const ringColor = {
  success: "ring-green-100 focus:ring-green-200",
  error: "ring-red-100 focus:ring-red-200",
  warning: "ring-yellow-100 focus:ring-yellow-200",
  denied: "ring-amber-100 focus:ring-amber-200",
};

const Popup = ({
  type = "success",
  message = "",
  onClose,
  onConfirm,
  confirmText = "Confirm",
  cancelText = "Cancel",
}) => {
  const config = typeConfig[type];
  const IconComponent = config.icon;
  const [isClosing, setIsClosing] = React.useState(false);

  const handleConfirm = () => {
    onConfirm?.();
    handleClose();
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose?.();
    }, 180);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) handleClose();
  };

  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        handleClose();
      } else if (e.key === "Enter") {
        config.singleButton ? handleClose() : handleConfirm();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [config.singleButton]);

  return (
    <Portal>
      <div
        className={`fixed inset-0 flex items-center justify-center bg-slate-900/30 backdrop-blur-md z-[99999] p-4 transition-opacity duration-200 ${
          isClosing ? "opacity-0" : "opacity-100"
        }`}
        onClick={handleBackdropClick}
      >
        <div
          className={`relative w-full max-w-sm bg-white/95 rounded-[28px] shadow-[0_20px_60px_-15px_rgba(15,23,42,0.35)] ring-1 ring-slate-900/5 transition-all duration-200 ease-out ${
            isClosing ? "opacity-0 scale-90 translate-y-3" : "opacity-100 scale-100 translate-y-0"
          }`}
        >
          {/* Close button */}
          <button
            onClick={handleClose}
            className={`absolute top-3.5 right-3.5 text-slate-400 hover:text-slate-600 transition-all duration-200 p-1.5 rounded-full hover:bg-slate-100 ${
              isClosing ? "opacity-0" : "opacity-100"
            }`}
            aria-label="Close"
          >
            <X className="w-4 h-4" strokeWidth={2} />
          </button>

          <div className="px-8 pt-9 pb-8 text-center">
            {/* Icon with halo ring instead of flat block */}
            <div className="flex justify-center mb-5">
              <div
                className={`relative flex items-center justify-center w-16 h-16 rounded-full ${config.iconBgColor} ring-8 ring-slate-50 transition-all duration-300 ${
                  isClosing ? "scale-75 opacity-0" : "scale-100 opacity-100"
                }`}
              >
                <IconComponent className={`w-8 h-8 ${config.iconColor}`} strokeWidth={1.75} />
              </div>
            </div>

            {/* Title */}
            <h3
              className={`text-xl font-semibold tracking-tight mb-2 ${config.titleColor} transition-all duration-200 delay-75 ${
                isClosing ? "opacity-0 translate-y-1" : "opacity-100 translate-y-0"
              }`}
            >
              {config.title}
            </h3>

            {/* Message */}
            <p
              className={`text-slate-500 mb-7 text-[15px] leading-relaxed transition-all duration-200 delay-100 ${
                isClosing ? "opacity-0 translate-y-1" : "opacity-100 translate-y-0"
              }`}
            >
              {message}
            </p>

            {/* Buttons */}
            <div
              className={`transition-all duration-200 delay-150 ${
                isClosing ? "opacity-0 translate-y-1" : "opacity-100 translate-y-0"
              }`}
            >
              {config.singleButton ? (
                <button
                  onClick={handleClose}
                  className={`
                    w-full py-3 px-6 text-white text-[15px] font-semibold rounded-2xl
                    transition-all duration-200 focus:outline-none focus:ring-4 ${ringColor[type]}
                    shadow-md shadow-slate-900/10 hover:shadow-lg transform hover:scale-[1.015] active:scale-[0.98]
                    ${config.buttonColor}
                  `}
                  autoFocus
                >
                  OK
                </button>
              ) : (
                <div className="flex gap-2.5">
                  <button
                    onClick={handleClose}
                    className="
                      flex-1 py-3 px-6 text-slate-600 text-[15px] font-semibold rounded-2xl
                      border border-slate-200 bg-white
                      transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-slate-100
                      hover:bg-slate-50 hover:border-slate-300 transform hover:scale-[1.015] active:scale-[0.98]
                    "
                  >
                    {cancelText}
                  </button>
                  <button
                    onClick={handleConfirm}
                    className={`
                      flex-1 py-3 px-6 text-white text-[15px] font-semibold rounded-2xl
                      transition-all duration-200 focus:outline-none focus:ring-4 ${ringColor[type]}
                      shadow-md shadow-slate-900/10 hover:shadow-lg transform hover:scale-[1.015] active:scale-[0.98]
                      ${config.confirmButtonColor}
                    `}
                    autoFocus
                  >
                    {confirmText}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
};

export default Popup;
