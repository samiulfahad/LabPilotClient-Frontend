import DesktopMenu from "./DesktopMenu";
import MobileMenu from "./MobileMenu";

const Layout = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <div className="print:hidden">
        <MobileMenu />
      </div>
      <div className="print:hidden">
        <DesktopMenu />
      </div>

      {/* FIX: Removed min-h-screen — flex-1 already fills remaining height via the
          parent's min-h-screen. Adding min-h-screen here stacks on top of the pt-16
          mobile offset and makes the page ~64px taller than the viewport. */}
      <div className="flex-1 flex flex-col lg:ml-64 print:ml-0">
        {/* FIX: Removed the max-w-7xl wrapper around {children}. Each page manages
            its own max-width internally (e.g. InvoiceList uses max-w-5xl). Having a
            second outer constraint here can cause unexpected horizontal clipping on
            wide pages and doesn't add value. */}
        <main className="flex-1 bg-white/80 backdrop-blur-sm relative pt-16 lg:pt-0 print:pt-0">{children}</main>

        {/* Global Footer – hide on print */}
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
