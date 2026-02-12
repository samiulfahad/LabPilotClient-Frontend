import DesktopMenu from "./DesktopMenu";
import MobileMenu from "./MobileMenu";

const Layout = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <MobileMenu />
      <DesktopMenu />

      {/* Main content wrapper */}
      <div className="lg:ml-64 flex-1 flex flex-col min-h-screen">
        {/* Main content area */}
        <main className="flex-1 bg-white">
          <div className="pt-20 lg:pt-6 px-4 sm:px-6 lg:px-8 pb-8">
            <div className="max-w-7xl mx-auto">{children}</div>
          </div>
        </main>

        {/* Global Footer */}
        <footer className="bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* Bottom copyright */}
            <div className=" pt-4 border-t border-gray-200">
              <p className="text-center text-xs text-gray-500">
                © {new Date().getFullYear()} LabPilot Pro by Samiul Fahad. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Layout;
