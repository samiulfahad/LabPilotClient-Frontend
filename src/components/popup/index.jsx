import React from "react";
import Portal from "../Portal";
import Icons from "../icons"; // Import the centralized icons

// Only three types: success, error, warning
const typeConfig = {
  success: {
    icon: Icons.Success,
    title: "Success!",
    titleColor: "text-green-600",
    iconBgColor: "bg-gradient-to-br from-green-100 to-emerald-100",
    iconColor: "text-green-600",
    buttonColor: "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700",
    singleButton: true,
  },
  error: {
    icon: Icons.Error,
    title: "Error!",
    titleColor: "text-red-600",
    iconBgColor: "bg-gradient-to-br from-red-100 to-rose-100",
    iconColor: "text-red-600",
    buttonColor: "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700",
    singleButton: true,
  },
  warning: {
    icon: Icons.Warning,
    title: "Are you sure?",
    titleColor: "text-yellow-600",
    iconBgColor: "bg-gradient-to-br from-yellow-100 to-amber-100",
    iconColor: "text-yellow-600",
    confirmButtonColor: "bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-700 hover:to-amber-700",
    cancelButtonColor: "bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700",
    singleButton: false,
  },
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
    // Disappears popup while loading starts
    handleClose();
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose?.();
    }, 200); // Match animation duration
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  // Close popup on Escape key or Enter key
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        handleClose();
      } else if (e.key === "Enter") {
        if (config.singleButton) {
          handleClose();
        } else {
          handleConfirm();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [config.singleButton]);

  return (
    <Portal>
      <div
        className={`fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-[99999] p-4 transition-all duration-200 ${
          isClosing ? "opacity-0" : "opacity-100"
        }`}
        onClick={handleBackdropClick}
      >
        <div
          className={`bg-white rounded-3xl shadow-2xl max-w-md w-full mx-auto border border-gray-100 transition-all duration-200 ${
            isClosing ? "opacity-0 scale-50 -translate-y-4" : "opacity-100 scale-100 translate-y-0"
          }`}
        >
          {/* Content */}
          <div className="px-8 py-10 text-center">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div
                className={`${config.iconBgColor} p-5 rounded-2xl shadow-lg transition-all duration-300 ${
                  isClosing ? "scale-50 opacity-0" : "scale-100 opacity-100"
                }`}
              >
                <IconComponent className={`w-10 h-10 ${config.iconColor}`} />
              </div>
            </div>

            {/* Title */}
            <h3
              className={`text-2xl font-bold mb-3 ${config.titleColor} transition-all duration-200 delay-75 ${
                isClosing ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
              }`}
            >
              {config.title}
            </h3>

            {/* Message */}
            <p
              className={`text-gray-600 mb-8 text-base leading-relaxed font-medium transition-all duration-200 delay-100 ${
                isClosing ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
              }`}
            >
              {message}
            </p>

            {/* Buttons */}
            <div
              className={`transition-all duration-200 delay-150 ${
                isClosing ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
              }`}
            >
              {config.singleButton ? (
                <button
                  onClick={handleClose}
                  className={`
                    w-full py-3.5 px-6 text-white font-semibold rounded-xl 
                    transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-green-200
                    shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]
                    ${config.buttonColor}
                  `}
                  autoFocus
                >
                  OK
                </button>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={handleClose}
                    className={`
                      flex-1 py-3.5 px-6 text-white font-semibold rounded-xl 
                      transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-gray-300
                      shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]
                      ${config.cancelButtonColor}
                    `}
                  >
                    {cancelText}
                  </button>
                  <button
                    onClick={handleConfirm}
                    className={`
                      flex-1 py-3.5 px-6 text-white font-semibold rounded-xl 
                      transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-yellow-200
                      shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]
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

          {/* Close button */}
          <button
            onClick={handleClose}
            className={`absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-all duration-200 p-2 hover:bg-gray-100 rounded-lg hover:rotate-90 ${
              isClosing ? "opacity-0 scale-75" : "opacity-100 scale-100"
            }`}
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </Portal>
  );
};

export default Popup;
