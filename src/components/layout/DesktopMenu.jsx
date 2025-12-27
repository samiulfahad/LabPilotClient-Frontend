import { NavLink } from "react-router-dom";
import menu from "./menu";

const DesktopMenu = () => {
  return (
    <nav className="hidden lg:flex w-64 fixed left-0 top-0 h-screen flex-col bg-white border-r border-gray-200 shadow-sm z-40">
      {/* Flex container for proper scrolling */}
      <div className="flex flex-col h-full">
        {/* Fixed Header */}
        <div className="flex-shrink-0 px-2 py-4 bg-gradient-to-r from-blue-600 to-blue-400 text-gray-500 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-800 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">LP</span>
            </div>
            <div className="text-start">
              <h1 className="text-white font-bold text-sm">Azizul Haque Diagnostic Center & Hospital</h1>
              {/* <p className="text-gray-500 text-xs">Azizul Haque Diagnostic Center </p> */}
            </div>
          </div>
        </div>

        {/* Scrollable Navigation Menu */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto">
            <div className="p-4">
              <div className="space-y-1">
                {menu.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === "/"}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 p-1 rounded-lg transition-colors duration-200 ${
                        isActive
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span className="text-lg">{item.icon}</span>
                        <span className="font-medium text-sm">{item.label}</span>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="flex-shrink-0 p-4 border-t border-gray-400">
          <button className="w-full flex items-center space-x-2 p-1 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200">
            <span>🚪</span>
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default DesktopMenu;
