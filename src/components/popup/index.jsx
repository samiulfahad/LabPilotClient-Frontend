import React from "react";
import Portal from "../Portal";
import Icons from "../icons"; // Import the centralized icons

// Only three types: success, error, warning
const typeConfig = {
  success: {
    icon: Icons.Success,
    title: "Success!",
    titleColor: "text-green-600",
    buttonColor: "bg-green-600 hover:bg-green-700",
    singleButton: true,
  },
  error: {
    icon: Icons.Error,
    title: "Error!",
    titleColor: "text-red-600",
    buttonColor: "bg-red-600 hover:bg-red-700",
    singleButton: true,
  },
  warning: {
    icon: Icons.Warning,
    title: "Are you sure?",
    titleColor: "text-yellow-600",
    confirmButtonColor: "bg-yellow-600 hover:bg-yellow-700",
    cancelButtonColor: "bg-gray-500 hover:bg-gray-600",
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

  const handleConfirm = () => {
    onConfirm?.();
    // Disappears popup while loading starts
    onClose?.();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose?.();
    }
  };

  // Close popup on Escape key or Enter key
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose?.();
      } else if (e.key === "Enter") {
        if (config.singleButton) {
          onClose?.();
        } else {
          handleConfirm();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, config.singleButton]);

  return (
    <Portal>
      <div
        className="fixed inset-0 flex items-center justify-center backdrop-blur-[3px] z-[11] p-4"
        onClick={handleBackdropClick}
      >
        <div className="bg-gray-100 rounded-2xl shadow-xl max-w-sm w-full mx-auto animate-in fade-in zoom-in-95 duration-200">
          <div className="px-12 py-8 text-center">
            <div className="flex justify-center mb-4">
              <IconComponent className="w-8 h-8" />
            </div>
            <h3 className={`text-xl font-semibold mb-2 ${config.titleColor}`}>{config.title}</h3>
            <div className="text-gray-600 mb-6 font-semibold text-black">{message}</div>

            {config.singleButton ? (
              <button
                onClick={onClose}
                className={`
                  w-full py-3 px-4 text-white font-medium rounded-lg 
                  transition-colors focus:outline-none
                  ${config.buttonColor}
                `}
                autoFocus
              >
                OK
              </button>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className={`
                    flex-1 py-3 px-4 text-white font-medium rounded-lg 
                    transition-colors focus:outline-none
                    ${config.cancelButtonColor}
                  `}
                >
                  {cancelText}
                </button>
                <button
                  onClick={handleConfirm}
                  className={`
                    flex-1 py-3 px-4 text-white font-medium rounded-lg 
                    transition-colors focus:outline-none
                    ${config.confirmButtonColor}
                  `}
                >
                  {confirmText}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Portal>
  );
};

export default Popup;
