import { useState, useEffect, useRef } from "react";
import PortalDropdown from "./PortalDropdown";

const SearchAndSelect = ({
  label,
  name,
  value,
  onChange,
  disabled = false,
  options = [],
  placeholder = "Select...",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLabel, setSelectedLabel] = useState("");
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const [isArrowClicked, setIsArrowClicked] = useState(false);

  // Initialize selected label
  useEffect(() => {
    const selectedOption = options.find((option) => option.value === value);
    const label = selectedOption ? selectedOption.label : "";
    setSelectedLabel(label);
    setSearchTerm(label);
  }, [value, options]);

  // Filter options based on search term
  // If arrow was clicked (dropdown opened), show all options initially
  // If user starts typing, filter based on search term
  const filteredOptions = searchTerm
    ? options.filter((option) =>
        option?.label?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : isArrowClicked && isOpen
    ? options // Show all when arrow clicked and dropdown is open
    : []; // Don't show any options when dropdown is not open

  // Handle input change
  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Only open dropdown when user starts typing and arrow hasn't been clicked yet
    if (!isOpen && !isArrowClicked) {
      setIsOpen(true);
    }
  };

  // Toggle dropdown
  const toggleDropdown = () => {
    if (disabled) return;
    
    const newState = !isOpen;
    setIsOpen(newState);
    setIsArrowClicked(true); // Mark that arrow was clicked
    
    if (newState) {
      // When opening via arrow, clear search to show all options
      setSearchTerm("");
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 0);
    } else {
      // When closing, reset arrow click state
      setIsArrowClicked(false);
      setSearchTerm(selectedLabel);
    }
  };

  // Handle option selection
  const handleSelect = (selectedValue) => {
    console.log("Selecting:", selectedValue);
    const selectedOption = options.find((option) => option.value === selectedValue);
    if (selectedOption) {
      // Create a proper change event
      const event = {
        target: {
          name: name,
          value: selectedValue,
          type: "select",
        },
      };
      onChange(event);
      setSearchTerm(selectedOption.label);
      setSelectedLabel(selectedOption.label);
    }
    setIsOpen(false);
    setIsArrowClicked(false); // Reset arrow click state
  };

  // Handle dropdown close
  const handleClose = () => {
    setIsOpen(false);
    setIsArrowClicked(false); // Reset arrow click state
    setSearchTerm(selectedLabel);
  };

  return (
    <div className="flex border border-gray-300 rounded-lg overflow-hidden relative">
      <label
        className={`w-32 px-3 py-2 text-sm font-medium border-r border-gray-300 flex items-center ${
          disabled ? "bg-gray-100 text-gray-400" : "bg-gray-50 text-gray-700"
        }`}
      >
        {label}
      </label>
      <div className="relative flex-1" ref={wrapperRef}>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={handleInputChange}
            onFocus={() => {
              if (!disabled) {
                // Don't open dropdown on focus, only if user starts typing
              }
            }}
            placeholder={placeholder}
            disabled={disabled}
            className={`w-full px-3 py-2 text-left focus:outline-none transition-colors pr-10 ${
              disabled
                ? "bg-gray-100 text-gray-400 cursor-not-allowed opacity-75"
                : "hover:border-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            } ${searchTerm ? "text-gray-900" : "text-gray-500"}`}
          />
          <button
            type="button"
            onClick={toggleDropdown}
            disabled={disabled}
            className={`absolute right-0 top-0 h-full w-10 flex items-center justify-center ${
              disabled ? "text-gray-400 cursor-not-allowed" : "text-gray-500 hover:text-gray-700 cursor-pointer"
            }`}
            aria-label="Toggle dropdown"
          >
            {isOpen ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </button>
        </div>

        {/* Portal Dropdown */}
        <PortalDropdown targetRef={wrapperRef} isOpen={isOpen && !disabled} onClose={handleClose}>
          <ul className="max-h-60 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <li
                  key={option.value}
                  onMouseDown={(e) => {
                    e.preventDefault(); // Prevent input blur
                    e.stopPropagation();
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelect(option.value);
                  }}
                  className={`px-3 py-2 hover:bg-gray-100 cursor-pointer ${
                    value === option.value ? "bg-blue-50 text-blue-600" : "text-gray-900"
                  }`}
                >
                  {option.label}
                </li>
              ))
            ) : (
              <li className="px-3 py-2 text-gray-500 text-center">
                {isArrowClicked && !searchTerm 
                  ? "Start typing to search..." 
                  : "No options found"}
              </li>
            )}
          </ul>
        </PortalDropdown>
      </div>
    </div>
  );
};

export default SearchAndSelect;