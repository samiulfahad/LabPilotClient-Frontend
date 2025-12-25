import { useState, useEffect } from "react";
import { NavLink, Link } from "react-router-dom";
import menu from "./menu";

const MobileMenu = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [lastScroll, setLastScroll] = useState(0);
  const [scrollDirection, setScrollDirection] = useState("");

  // Scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const currentScroll = window.pageYOffset;

      if (currentScroll <= 0) {
        setScrollDirection("");
        return;
      }

      if (currentScroll > lastScroll && scrollDirection !== "down") {
        setScrollDirection("down");
      } else if (currentScroll < lastScroll && scrollDirection === "down") {
        setScrollDirection("up");
      }

      setLastScroll(currentScroll);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScroll, scrollDirection]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleMenuClick = () => {
    setIsMenuOpen(false);
  };

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isMenuOpen]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMenuOpen]);

  return (
    <>
      {/* Modern Mobile Navbar */}
      <div className="lg:hidden">
        <nav
          className={`fixed top-0 left-0 right-0 z-50 flex justify-between items-center py-4 px-5 bg-sky-100 backdrop-blur-sm border-b border-gray-100 transition-all duration-300 ${
            scrollDirection === "down" ? "-translate-y-full" : "translate-y-0 shadow-sm"
          }`}
        >
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm">LP</span>
            </div>
            <span className="text-gray-900 font-bold text-lg">LabPilotPro</span>
          </Link>

          {/* Modern Hamburger Button */}
          <button
            onClick={toggleMenu}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-sky-200 hover:bg-sky-300 transition-all duration-200 border border-gray-200"
          >
            <div className="flex flex-col items-center justify-center w-5 h-5">
              <span
                className={`w-5 h-0.5 bg-gray-700 rounded-full transition-all duration-300 ${
                  isMenuOpen ? "rotate-45 translate-y-1.5" : "mb-1.5"
                }`}
              ></span>
              <span
                className={`w-5 h-0.5 bg-gray-700 rounded-full transition-all duration-300 ${
                  isMenuOpen ? "opacity-0" : "mb-1.5"
                }`}
              ></span>
              <span
                className={`w-5 h-0.5 bg-gray-700 rounded-full transition-all duration-300 ${
                  isMenuOpen ? "-rotate-45 -translate-y-1.5" : ""
                }`}
              ></span>
            </div>
          </button>
        </nav>

        {/* Spacer */}
        <div className="h-16"></div>
      </div>

      {/* Modern Overlay */}
      {isMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/25 backdrop-blur-[1px] transition-all duration-300"
          onClick={toggleMenu}
        />
      )}

      {/* Modern Mobile Sidebar */}
      <div
        className={`lg:hidden fixed top-0 right-0 h-full w-80 bg-white/98 backdrop-blur-md border-l border-gray-100 z-50 transform transition-all duration-300 ease-out ${
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Flex container for proper scrolling */}
        <div className="flex flex-col h-full">
          {/* Header - Fixed */}
          <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-blue-500 to-sky-200">
            <div className="flex flex-col items-center space-x-3">
               <div className="w-20 h-10 flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-sm">Lab Pilot</span>
              </div> 
              { /* <div>
                <p className="text-gray-800 text-xs font-semibold">Azizul Haque Diagnostic Center and Hospital</p>
                <p className="text-gray-800 text-xs">@sfahad</p>
              </div> */}
            </div>

            <button
              onClick={toggleMenu}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-blue-500 hover:bg-blue-700 transition-all duration-200 border border-gray-200 shadow-sm"
            >
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Scrollable Menu Items */}
          <div className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto">
              <div className="space-y-2 p-4">
                {menu.map((item, index) => (
                  <NavLink
                    key={index}
                    to={item.path}
                    end={item.path === "/"}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 p-2 rounded-2xl transition-all duration-200 group ${
                        isActive
                          ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`
                    }
                    onClick={handleMenuClick}
                  >
                    {({ isActive }) => (
                      <>
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 ${
                            isActive ? "bg-white/20" : "bg-gray-100 group-hover:bg-blue-100 group-hover:text-blue-600"
                          }`}
                        >
                          <span className="text-base">{item.icon}</span>
                        </div>
                        <span className="font-medium text-sm">{item.label}</span>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          </div>

          {/* Fixed Logout Section */}
          <div className="flex-shrink-0 p-5 border-t border-gray-100 bg-white/95 backdrop-blur-sm">
            <button
              className="w-full flex items-center justify-center space-x-2 p-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-2xl font-medium hover:from-red-500 hover:to-red-600 transition-all duration-200 shadow-sm hover:shadow-md"
              onClick={handleMenuClick}
            >
              <span className="text-lg">🚪</span>
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileMenu;
