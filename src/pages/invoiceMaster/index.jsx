import { NavLink, Routes, Route, useLocation, Outlet, Navigate } from "react-router-dom";
import { FilePlus2, Search, Trash2, LayoutList, Receipt, ChevronRight } from "lucide-react";

// ── Sub-nav config ──────────────────────────────────────────────────────────
const invoiceNav = [
  {
    label: "Invoice List",
    path: "list",
    icon: LayoutList,
    description: "Browse all invoices",
    color: "indigo",
  },
  {
    label: "Create Invoice",
    path: "create",
    icon: FilePlus2,
    description: "Generate a new invoice",
    color: "emerald",
  },
  {
    label: "Search Invoice",
    path: "search",
    icon: Search,
    description: "Find by ID or patient",
    color: "sky",
  },
  {
    label: "Delete Invoice",
    path: "delete",
    icon: Trash2,
    description: "Remove an invoice record",
    color: "rose",
  },
];

const colorMap = {
  indigo: {
    card: "hover:border-indigo-200 hover:bg-indigo-50/60",
    active: "border-indigo-200 bg-indigo-50",
    iconBox: "bg-indigo-100 border-indigo-200",
    icon: "text-indigo-500",
    label: "text-indigo-900",
    desc: "text-indigo-400",
    dot: "bg-indigo-500 shadow-[0_0_0_3px_rgba(99,102,241,0.15)]",
    bar: "from-indigo-500 to-indigo-400",
    badge: "bg-indigo-100 text-indigo-600",
  },
  emerald: {
    card: "hover:border-emerald-200 hover:bg-emerald-50/60",
    active: "border-emerald-200 bg-emerald-50",
    iconBox: "bg-emerald-100 border-emerald-200",
    icon: "text-emerald-500",
    label: "text-emerald-900",
    desc: "text-emerald-400",
    dot: "bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.15)]",
    bar: "from-emerald-500 to-emerald-400",
    badge: "bg-emerald-100 text-emerald-600",
  },
  sky: {
    card: "hover:border-sky-200 hover:bg-sky-50/60",
    active: "border-sky-200 bg-sky-50",
    iconBox: "bg-sky-100 border-sky-200",
    icon: "text-sky-500",
    label: "text-sky-900",
    desc: "text-sky-400",
    dot: "bg-sky-500 shadow-[0_0_0_3px_rgba(14,165,233,0.15)]",
    bar: "from-sky-500 to-sky-400",
    badge: "bg-sky-100 text-sky-600",
  },
  rose: {
    card: "hover:border-rose-200 hover:bg-rose-50/60",
    active: "border-rose-200 bg-rose-50",
    iconBox: "bg-rose-100 border-rose-200",
    icon: "text-rose-500",
    label: "text-rose-900",
    desc: "text-rose-400",
    dot: "bg-rose-500 shadow-[0_0_0_3px_rgba(244,63,94,0.15)]",
    bar: "from-rose-500 to-rose-400",
    badge: "bg-rose-100 text-rose-600",
  },
};

// ── Placeholder sub-pages ───────────────────────────────────────────────────
const PlaceholderPage = ({ title, icon: Icon, color }) => {
  const c = colorMap[color];
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
      <div className={`w-16 h-16 rounded-2xl border-2 ${c.iconBox} flex items-center justify-center`}>
        <Icon size={28} className={c.icon} />
      </div>
      <p className="text-[15px] font-bold text-slate-700">{title}</p>
      <p className="text-[13px] text-slate-400 max-w-xs">
        This section is under construction. Your component goes here.
      </p>
    </div>
  );
};

// ── InvoiceMaster ───────────────────────────────────────────────────────────
const InvoiceMaster = () => {
  const location = useLocation();

  // Derive active nav item for the header
  const activeNav = invoiceNav.find((n) => location.pathname.includes(`/invoices/${n.path}`));

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Page header */}
      <div className="bg-white border-b border-slate-100 px-6 py-5">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-400 flex items-center justify-center shadow-md shadow-indigo-200 shrink-0">
            <Receipt size={15} className="text-white" />
          </div>
          <div>
            <h1 className="text-[15px] font-black text-slate-900 tracking-tight leading-none">Invoice Master</h1>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {activeNav ? activeNav.description : "Manage all invoice operations"}
            </p>
          </div>

          {/* Breadcrumb */}
          {activeNav && (
            <div className="ml-auto flex items-center gap-1.5 text-[11.5px]">
              <span className="text-slate-400 font-medium">Invoices</span>
              <ChevronRight size={11} className="text-slate-300" />
              <span className={`font-semibold px-2 py-0.5 rounded-md ${colorMap[activeNav.color].badge}`}>
                {activeNav.label}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        {/* Sub-navigation cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {invoiceNav.map((item) => {
            const Icon = item.icon;
            const c = colorMap[item.color];

            return (
              <NavLink key={item.path} to={item.path} className="no-underline">
                {({ isActive }) => (
                  <div
                    className={`relative group flex flex-col items-center gap-2.5 p-4 rounded-2xl border transition-all duration-200 cursor-pointer
                      ${isActive ? c.active : `border-slate-200 bg-white ${c.card}`}`}
                  >
                    {/* Active top bar */}
                    {isActive && (
                      <div
                        className={`absolute top-0 left-4 right-4 h-[3px] rounded-b-full bg-gradient-to-r ${c.bar}`}
                      />
                    )}

                    {/* Icon */}
                    <div
                      className={`w-11 h-11 rounded-[13px] border flex items-center justify-center transition-all duration-200
                        ${isActive ? `${c.iconBox}` : "bg-slate-50 border-slate-200 group-hover:border-slate-300"}`}
                    >
                      <Icon
                        size={18}
                        className={`transition-colors duration-200 ${
                          isActive ? c.icon : "text-slate-400 group-hover:text-slate-600"
                        }`}
                      />
                    </div>

                    {/* Label */}
                    <span
                      className={`text-[12px] font-bold tracking-tight text-center leading-tight transition-colors duration-200
                        ${isActive ? c.label : "text-slate-500 group-hover:text-slate-700"}`}
                    >
                      {item.label}
                    </span>

                    {/* Active dot */}
                    {isActive && <div className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />}
                  </div>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Sub-route content area */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_2px_12px_rgba(15,23,42,0.04)] overflow-hidden">
          <Routes>
            <Route index element={<Navigate to="list" replace />} />
            <Route path="list" element={<PlaceholderPage title="Invoice List" icon={LayoutList} color="indigo" />} />
            <Route
              path="create"
              element={<PlaceholderPage title="Create Invoice" icon={FilePlus2} color="emerald" />}
            />
            <Route path="search" element={<PlaceholderPage title="Search Invoice" icon={Search} color="sky" />} />
            <Route path="delete" element={<PlaceholderPage title="Delete Invoice" icon={Trash2} color="rose" />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default InvoiceMaster;
