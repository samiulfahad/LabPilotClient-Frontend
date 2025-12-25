import React from "react";

const TextAreaField = ({ label, name, value, onChange, disabled = false, rows = 4, ...props }) => {
  return (
    <div className="flex border border-gray-300 rounded-lg overflow-hidden">
      <label
        className={`w-32 px-3 py-2 text-sm font-medium border-r border-gray-300 flex items-center ${
          disabled ? "bg-gray-100 text-gray-400" : "bg-gray-50 text-gray-700"
        }`}
      >
        {label}
      </label>
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        rows={rows}
        className={`flex-1 px-3 py-2 focus:outline-none transition-colors resize-vertical ${
          disabled
            ? "bg-gray-100 text-gray-400 cursor-not-allowed opacity-75"
            : "hover:border-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
        }`}
        {...props}
      />
    </div>
  );
};

export default TextAreaField;
