import { useState, useEffect } from "react";
import { NavLink, Link } from "react-router-dom";
import {
  LogOut,
  Menu,
  X,
  ChevronRight,
  AlertTriangle,
  Home as HomeIcon,
  FlaskConical,
  Activity,
  Plus,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { getMenuForLabType } from "./menu";
import LoadingScreen from "../loadingPage";
import Modal from "../modal";

// Same admin-bypass + `modules.includes` rule as hasModuleAccess in Home.jsx,
// RequireModules in App.jsx, and getMenuForLabType in menu.js — kept local
// so the bottom quick-access bar only ever shows buttons this user's
// modules actually grant.
const hasModuleAccess = (user, moduleKey) => {
  if (moduleKey === null) return true;
  const isAdmin = user?.role === "admin";
  return isAdmin || !!user?.modules?.includes(moduleKey);
};

const MobileMenu = () => {
  const logout = useAuthStore((s) => s.logout);
  const lab = useAuthStore((s) => s.lab);
  const user = useAuthStore((s) => s.user);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [lastScroll, setLastScroll] = useState(0);
  const [scrollDirection, setScrollDirection] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const visibleMenu = getMenuForLabType(lab?.type, user);

  // Quick-access slots for the bottom bar. Home/My Activity/Menu are
  // `module: null` in menu.js (always visible); Report/Invoice only render
  // if this user's modules grant them — same rule as the full drawer menu,
  // so nothing here ever 404s.
  const hasReportAccess = hasModuleAccess(user, "testReport");
  const hasInvoiceAccess = hasModuleAccess(user, "invoice");

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

  const toggleMenu = () => setIsMenuOpen((v) => !v);
  const closeMenu = () => setIsMenuOpen(false);

  useEffect(() => {
    const locked = isMenuOpen || showConfirm;
    document.body.style.overflow = locked ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMenuOpen, showConfirm]);

  const handleLogoutClick = () => {
    closeMenu();
    setTimeout(() => setShowConfirm(true), 150);
  };

  const handleLogoutConfirm = async () => {
    setShowConfirm(false);
    setLoggingOut(true);
    await logout();
    setLoggingOut(false);
  };

  const navBtnClass = ({ isActive }) =>
    `flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
      isActive ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
    }`;

  return (
    <>
      {/* ─── Mobile Navbar (bottom, quick-access) ──────────────────────── */}
      <div className="lg:hidden font-anek">
        {/* Spacer so page content isn't hidden behind the fixed bottom bar */}
        <div className="h-16" />

        <nav
          className={`
            fixed bottom-0 left-0 right-0 z-50
            h-16 px-1
            bg-white/90 backdrop-blur-md border-t border-gray-200/80
            shadow-[0_-2px_12px_rgba(0,0,0,0.04)]
            transition-all duration-300
            ${scrollDirection === "down" ? "translate-y-full" : "translate-y-0"}
          `}
        >
          <div className="relative h-full flex items-center">
            <NavLink to="/" end className={navBtnClass}>
              <HomeIcon className="w-5 h-5" />
              <span className="text-[10px] font-medium font-anek">হোম</span>
            </NavLink>

            {hasReportAccess && (
              <NavLink to="/report" className={navBtnClass}>
                <FlaskConical className="w-5 h-5" />
                <span className="text-[10px] font-medium font-anek">রিপোর্টস</span>
              </NavLink>
            )}

            {/* Elevated FAB — raised above the bar, common "primary action"
               pattern for mobile bottom nav. Only rendered if the user can
               actually create invoices (route is gated the same way). */}
            {hasInvoiceAccess && (
              <div className="flex-1 flex items-center justify-center">
                <Link
                  to="/outdoor/invoice/new"
                  onClick={closeMenu}
                  aria-label="নতুন ইনভয়েস"
                  className="-mt-8 w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 ring-4 ring-white active:scale-95 transition-transform duration-150"
                >
                  <Plus className="w-6 h-6 text-white" strokeWidth={2.5} />
                </Link>
              </div>
            )}

            <NavLink to="/my-activity" className={navBtnClass}>
              <Activity className="w-5 h-5" />
              <span className="text-[10px] font-medium font-anek">এক্টিভিটি</span>
            </NavLink>

            <button
              onClick={toggleMenu}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
                isMenuOpen ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
              }`}
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              <span className="text-[10px] font-medium font-anek">মেনু</span>
            </button>
          </div>
        </nav>
      </div>

      {isMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}

      <div
        className={`
          lg:hidden font-anek fixed top-0 right-0 h-full w-80 max-w-[85vw]
          bg-white/95 backdrop-blur-xl z-50 shadow-2xl
          transform transition-transform duration-300 ease-out
          ${isMenuOpen ? "translate-x-0" : "translate-x-full"}
        `}
        aria-hidden={!isMenuOpen}
      >
        <div className="flex flex-col h-full">
          {/* Drawer Header */}
          <div className="flex-shrink-0 p-5 bg-gradient-to-br from-blue-600 to-indigo-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 shrink-0 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center ring-1 ring-white/30">
                  <span className="text-white font-bold text-xl">LP</span>
                </div>
                <div className="min-w-0">
                  <p className="text-white font-semibold text-base truncate">LabPilot Pro</p>
                  <p className="text-blue-100/90 text-sm font-medium truncate">The Modern Lab Management System</p>
                </div>
              </div>
              <button
                onClick={closeMenu}
                className="w-9 h-9 shrink-0 flex items-center justify-center rounded-lg bg-white/20 hover:bg-white/30"
                aria-label="Close menu"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Menu Content */}
          <div className="flex-1 overflow-y-auto px-3 py-4 bg-gray-50/50">
            <div className="space-y-0.5">
              {visibleMenu.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end
                    onClick={closeMenu}
                    className={({ isActive }) =>
                      `flex items-center gap-1 px-4 py-1 rounded-xl transition-all duration-200 group ${
                        isActive
                          ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200/80 shadow-sm"
                          : "text-gray-600 hover:bg-white hover:text-gray-900 border border-transparent"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div
                          className={`w-9 h-9 shrink-0 rounded-lg flex items-center justify-center transition-all ${
                            isActive
                              ? "bg-blue-100 text-blue-600"
                              : "bg-gray-100 text-gray-500 group-hover:bg-blue-50 group-hover:text-blue-600"
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="font-medium text-base flex-1 truncate">{item.label}</span>
                        <ChevronRight
                          className={`w-5 h-5 shrink-0 ${
                            isActive ? "text-blue-600" : "text-gray-400 group-hover:translate-x-0.5"
                          } transition-transform`}
                        />
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>

          {/* Drawer Footer */}
          <div className="flex-shrink-0 p-4 border-t border-gray-200/80 bg-white/50">
            <button
              onClick={handleLogoutClick}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-gray-700 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all duration-200 group"
            >
              <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="text-red-600 font-medium text-base">লগ আউট</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── Logout confirm modal ────────────────────────────────────────── */}
      <Modal isOpen={showConfirm} onClose={() => setShowConfirm(false)} size="sm">
        <div className="p-6">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4 border border-red-100">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-2">Confirm Logout</h3>
            <p className="text-base text-gray-500 mb-8 px-4">
              Are you sure you want to sign out of <strong>LabPilot Pro</strong>?
            </p>

            <div className="flex w-full gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-3 rounded-xl text-base font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLogoutConfirm}
                className="flex-1 px-4 py-3 rounded-xl text-base font-semibold text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-200 transition-all active:scale-95"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {loggingOut && <LoadingScreen message="Signing you out" />}
    </>
  );
};

export default MobileMenu;
