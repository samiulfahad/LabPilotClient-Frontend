import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";

const PortalDropdown = ({ children, targetRef, isOpen, onClose }) => {
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    if (isOpen && targetRef.current) {
      const rect = targetRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, [isOpen, targetRef]);

  // Handle clicks outside the dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (targetRef.current && !targetRef.current.contains(event.target)) {
        // Check if the click is on the portal dropdown itself
        const portalElement = document.getElementById("portal-dropdown");
        if (portalElement && !portalElement.contains(event.target)) {
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen, targetRef, onClose]);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div
      id="portal-dropdown"
      style={{
        position: "absolute",
        top: `${position.top}px`,
        left: `${position.left}px`,
        width: `${position.width}px`,
        zIndex: 9999,
      }}
      className="bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden"
    >
      {children}
    </div>,
    document.body
  );
};

export default PortalDropdown;
