import { NavLink } from "react-router-dom";
import { LogOut } from "lucide-react";
import menu from "./menu";

const DesktopMenu = () => {
  return (
    <nav className="hidden lg:flex w-64 fixed left-0 top-0 h-screen flex-col bg-sky-200/10 backdrop-blur-md border-r border-gray-200/80 shadow-lg z-40">
      {/* Fixed Header – Modern Enterprise Design */}
      <div className="flex-shrink-0 px-5 py-4 bg-gradient-to-br from-blue-200 to-slate-200 border-b border-slate-200">
        <div className="flex items-center gap-3">
          {/* Modern Icon Badge */}
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/20">
            <span className="text-white font-bold text-sm">LP</span>
          </div>

          {/* Brand Text */}
          <div className="flex flex-col">
            <span
              className="text-slate-900 font-bold text-base leading-none"
              style={{ fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif", letterSpacing: "-0.02em" }}
            >
              LabPilot<span className="font-light">Pro</span>
            </span>
            <span className="text-[10px] text-slate-500 font-medium leading-tight mt-1">Modern Health Management</span>
          </div>
        </div>
      </div>

      {/* Scrollable Menu – Refined Navigation */}
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
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
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
                      {isActive && <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse" />}
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>
      </div>

      {/* Fixed Footer – Ghost Logout */}
      <div className="flex-shrink-0 p-4 border-t border-gray-200/80 bg-white/50 backdrop-blur-sm">
        <button className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-gray-700 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all duration-200 group">
          <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </nav>
  );
};

export default DesktopMenu;

// import { NavLink } from "react-router-dom";
// import menu from "./menu";

// const DesktopMenu = () => {
//   return (
//     <nav className="hidden lg:flex w-64 fixed left-0 top-0 h-screen flex-col bg-white border-r border-gray-200 shadow-sm z-40">
//       {/* Flex container for proper scrolling */}
//       <div className="flex flex-col h-full">
//         {/* Fixed Header */}
//         <div className="flex-shrink-0 px-2 py-4 bg-gradient-to-r from-blue-600 to-blue-400 text-gray-500 border-b border-gray-200">
//           <div className="flex items-center space-x-3">
//             <div className="w-10 h-10 bg-blue-800 rounded-xl flex items-center justify-center">
//               <span className="text-white font-bold text-lg">LP</span>
//             </div>
//             <div className="text-start">
//               <h1 className="text-white font-bold text-sm">Azizul Haque Diagnostic Center & Hospital</h1>
//               {/* <p className="text-gray-500 text-xs">Azizul Haque Diagnostic Center </p> */}
//             </div>
//           </div>
//         </div>

//         {/* Scrollable Navigation Menu */}
//         <div className="flex-1 overflow-hidden">
//           <div className="h-full overflow-y-auto">
//             <div className="p-4">
//               <div className="space-y-1">
//                 {menu.map((item) => (
//                   <NavLink
//                     key={item.path}
//                     to={item.path}
//                     end={item.path === "/"}
//                     className={({ isActive }) =>
//                       `flex items-center space-x-3 p-1 rounded-lg transition-colors duration-200 ${
//                         isActive
//                           ? "bg-blue-50 text-blue-700 border border-blue-200"
//                           : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
//                       }`
//                     }
//                   >
//                     {({ isActive }) => (
//                       <>
//                         <span className="text-lg">{item.icon}</span>
//                         <span className="font-medium text-sm">{item.label}</span>
//                       </>
//                     )}
//                   </NavLink>
//                 ))}
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Fixed Footer */}
//         <div className="flex-shrink-0 p-4 border-t border-gray-400">
//           <button className="w-full flex items-center space-x-2 p-1 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200">
//             <span>🚪</span>
//             <span className="text-sm font-medium">Logout</span>
//           </button>
//         </div>
//       </div>
//     </nav>
//   );
// };

// export default DesktopMenu;
