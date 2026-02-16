// ============================================================================
// LAYOUT COMPONENT UPDATE - Add print-hide class to navigation elements
// ============================================================================

// Update your Layout component (src/components/layout/index.jsx) as follows:

import DesktopMenu from "./DesktopMenu";
import MobileMenu from "./MobileMenu";

const Layout = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Add print:hidden class to MobileMenu and DesktopMenu wrappers */}
      <div className="print:hidden">
        <MobileMenu />
      </div>
      <div className="print:hidden">
        <DesktopMenu />
      </div>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-64 print:ml-0">
        {/* Page Content - Add top padding on mobile to account for fixed navbar */}
        <main className="flex-1 bg-white/80 backdrop-blur-sm relative pt-16 lg:pt-0 print:pt-0">
          <div className="max-w-7xl mx-auto print:max-w-none">{children}</div>
        </main>

        {/* Global Footer – Minimal Enterprise - Hide on print */}
        <footer className="print:hidden border-t border-gray-200/80 bg-white/50 backdrop-blur-sm relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-gray-500 order-2 sm:order-1">
                © {new Date().getFullYear()} LabPilot Pro. All rights reserved.
              </p>
              <p className="text-xs text-gray-400 order-1 sm:order-2">Designed & Developed by Samiul Fahad</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Layout;

// ============================================================================
// KEY CHANGES:
// ============================================================================
// 1. Wrapped MobileMenu in <div className="print:hidden">
// 2. Wrapped DesktopMenu in <div className="print:hidden">
// 3. Added print:ml-0 to main content wrapper (removes left margin on print)
// 4. Added print:pt-0 to main content (removes top padding on print)
// 5. Added print:max-w-none to content container
// 6. Added print:hidden to footer element
// ============================================================================
