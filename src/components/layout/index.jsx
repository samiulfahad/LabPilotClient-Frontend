import DesktopMenu from "./DesktopMenu";
import MobileMenu from "./MobileMenu";

const Layout = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <MobileMenu />
      <DesktopMenu />

      {/* Main content - Adjusted for simpler sidebar */}
      <main className="lg:ml-64 flex-1 min-h-screen bg-white">
        <div className="space-y-8 pt-20 lg:pt-3 bg-white w-full max-w-[100vw] mx-auto p-4">{children}</div>
      </main>
    </div>
  );
};

export default Layout;
