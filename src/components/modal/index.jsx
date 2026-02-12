import { useEffect, useState } from "react";
import Portal from "../Portal";

const Modal = ({
  isOpen,
  children,
  size = "md", // sm, md, lg, xl
  onClose,
}) => {
  const [isClosing, setIsClosing] = useState(false);

  // Handle body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Handle close animation
  const handleClose = () => {
    if (onClose) {
      setIsClosing(true);
      setTimeout(() => {
        onClose();
        setIsClosing(false);
      }, 200);
    }
  };

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "w-full max-w-md",
    md: "w-full max-w-2xl",
    lg: "w-full max-w-4xl",
    xl: "w-full max-w-6xl",
  };

  return (
    <Portal>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm transition-opacity duration-200 ${
          isClosing ? "opacity-0" : "opacity-100"
        }`}
        onClick={handleClose}
        style={{ margin: 0, padding: 0 }}
      />

      {/* Modal Container */}
      <div
        className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none"
        style={{ margin: 0 }}
      >
        <div
          className={`${sizeClasses[size]} bg-white rounded-xl shadow-2xl transform transition-all duration-200 flex flex-col max-h-[90vh] border border-gray-100 pointer-events-auto overflow-hidden ${
            isClosing ? "opacity-0 scale-95 -translate-y-4" : "opacity-100 scale-100 translate-y-0"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Content */}
          <div className="flex-1 overflow-y-auto modal-scrollbar">{children}</div>
        </div>
      </div>

      {/* Global Scrollbar Styles */}
      <style>{`
        .modal-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        
        .modal-scrollbar::-webkit-scrollbar-track {
          background: transparent;
          margin: 16px 0;
        }
        
        .modal-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        
        .modal-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </Portal>
  );
};

export default Modal;
