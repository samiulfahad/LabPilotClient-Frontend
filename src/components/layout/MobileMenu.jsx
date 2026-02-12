import { useState, useEffect } from "react";
import { NavLink, Link } from "react-router-dom";
import menu from "./menu";
import { LogOut, Menu, X } from "lucide-react";

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
          className={`fixed top-0 left-0 right-0 z-50 flex justify-between items-center py-3.5 px-4 bg-white/95 backdrop-blur-md border-b border-gray-200 transition-all duration-300 ${
            scrollDirection === "down" ? "-translate-y-full" : "translate-y-0 shadow-sm"
          }`}
        >
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-base">LP</span>
            </div>
            <span className="text-gray-900 font-bold text-lg">LabPilot</span>
          </Link>

          {/* Modern Hamburger Button */}
          <button
            onClick={toggleMenu}
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-all duration-200"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="w-6 h-6 text-gray-700" /> : <Menu className="w-6 h-6 text-gray-700" />}
          </button>
        </nav>

        {/* Spacer */}
        <div className="h-16"></div>
      </div>

      {/* Modern Overlay */}
      {isMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-all duration-300"
          onClick={toggleMenu}
        />
      )}

      {/* Modern Mobile Sidebar */}
      <div
        className={`lg:hidden fixed top-0 right-0 h-full w-80 bg-white z-50 shadow-2xl transform transition-all duration-300 ease-out ${
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Flex container for proper scrolling */}
        <div className="flex flex-col h-full">
          {/* Header - Fixed */}
          <div className="flex-shrink-0 p-5 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">LP</span>
                </div>
                <div>
                  <p className="text-white font-bold text-base">LabPilot Pro</p>
                  <p className="text-blue-100 text-xs">Professional Edition</p>
                </div>
              </div>

              <button
                onClick={toggleMenu}
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/20 hover:bg-white/30 transition-all duration-200"
                aria-label="Close menu"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Scrollable Menu Items */}
          <div className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto">
              <div className="p-4 space-y-1">
                {menu.map((item, index) => (
                  <NavLink
                    key={index}
                    to={item.path}
                    end={item.path === "/"}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                        isActive
                          ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200"
                          : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                      }`
                    }
                    onClick={handleMenuClick}
                  >
                    {({ isActive }) => (
                      <>
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 ${
                            isActive
                              ? "bg-blue-100 text-blue-600"
                              : "bg-gray-100 text-gray-600 group-hover:bg-blue-50 group-hover:text-blue-600"
                          }`}
                        >
                          <span className="text-lg">{item.icon}</span>
                        </div>
                        <span className="font-medium text-sm flex-1">{item.label}</span>
                        {isActive && <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          </div>

          {/* Fixed Logout Section */}
          <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-gray-50">
            <button
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-medium hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-sm hover:shadow-md"
              onClick={handleMenuClick}
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-semibold">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileMenu;
