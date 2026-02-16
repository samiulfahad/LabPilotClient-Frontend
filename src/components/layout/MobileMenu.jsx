import { useState, useEffect } from "react";
import { NavLink, Link } from "react-router-dom";
import { LogOut, Menu, X, ChevronRight } from "lucide-react";
import menu from "./menu";

const MobileMenu = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [lastScroll, setLastScroll] = useState(0);
  const [scrollDirection, setScrollDirection] = useState("");

  // Hide navbar on scroll down, show on scroll up
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

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  // Escape key closes menu
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isMenuOpen) setIsMenuOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isMenuOpen]);

  // Prevent body scroll when menu open
  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMenuOpen]);

  return (
    <>
      {/* Modern Mobile Navbar – Glass Effect */}
      <div className="lg:hidden">
        <nav
          className={`
            fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3
            bg-white/90 backdrop-blur-md border-b border-gray-200/80
            transition-all duration-300 shadow-sm
            ${scrollDirection === "down" ? "-translate-y-full" : "translate-y-0"}
          `}
        >
          <Link to="/" className="flex flex-col">
            <span
              className="text-gray-900 font-bold text-base leading-none"
              style={{ fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif", letterSpacing: "-0.02em" }}
            >
              LabPilot<span className="font-light">Pro</span>
            </span>
            <span className="text-[10px] text-gray-500 font-medium leading-tight">Modern Health Management System</span>
          </Link>

          <button
            onClick={toggleMenu}
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100/80 transition-all duration-200"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="w-5 h-5 text-gray-700" /> : <Menu className="w-5 h-5 text-gray-700" />}
          </button>
        </nav>
        <div className="h-16" /> {/* Spacer */}
      </div>

      {/* Overlay */}
      {isMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity duration-300"
          onClick={closeMenu}
        />
      )}

      {/* Slide-out Drawer */}
      <div
        className={`
          lg:hidden fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white/95 backdrop-blur-xl 
          z-50 shadow-2xl transform transition-transform duration-300 ease-out
          ${isMenuOpen ? "translate-x-0" : "translate-x-full"}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Drawer Header – Premium Gradient */}
          <div className="flex-shrink-0 p-5 bg-gradient-to-br from-blue-600 to-indigo-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center ring-1 ring-white/30">
                  <span className="text-white font-bold text-lg">LP</span>
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">LabPilot Pro</p>
                  <p className="text-blue-100/90 text-xs font-medium">Professional Edition</p>
                </div>
              </div>
              <button
                onClick={closeMenu}
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/20 hover:bg-white/30 transition-all"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          {/* Scrollable Menu Items */}
          <div className="flex-1 overflow-hidden bg-gray-50/50">
            <div className="h-full overflow-y-auto px-3 py-4">
              <div className="space-y-0.5">
                {menu.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.path === "/"}
                      onClick={closeMenu}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                          isActive
                            ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200/80 shadow-sm"
                            : "text-gray-600 hover:bg-white hover:text-gray-900 hover:shadow-sm border border-transparent"
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <div
                            className={`
                              w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 flex-shrink-0
                              ${
                                isActive
                                  ? "bg-blue-100 text-blue-600"
                                  : "bg-gray-100 text-gray-500 group-hover:bg-blue-50 group-hover:text-blue-600"
                              }
                            `}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="font-medium text-sm flex-1">{item.label}</span>
                          <ChevronRight
                            className={`
                              w-4 h-4 transition-all duration-200
                              ${isActive ? "text-blue-600 translate-x-0" : "text-gray-400 group-hover:translate-x-0.5"}
                            `}
                          />
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Fixed Logout Button */}
          <div className="flex-shrink-0 p-4 border-t border-gray-200/80 bg-white/50 backdrop-blur-sm">
            <button
              onClick={closeMenu}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-gray-700 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all duration-200 group"
            >
              <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileMenu;
