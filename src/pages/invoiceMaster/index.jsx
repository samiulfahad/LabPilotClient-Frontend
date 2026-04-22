import { useNavigate } from "react-router-dom";
import { FilePlus2, Search, Trash2, LayoutList, Receipt } from "lucide-react";

const invoiceNav = [
  {
    label: "Invoice List",
    path: "/invoice/all",
    icon: LayoutList,
    description: "Browse all invoices",
    color: "indigo",
  },
  {
    label: "Create Invoice",
    path: "/invoice/new",
    icon: FilePlus2,
    description: "Generate a new invoice",
    color: "emerald",
  },
  {
    label: "Search Invoice",
    path: "/search-invoice",
    icon: Search,
    description: "Find by ID or patient",
    color: "sky",
  },
  {
    label: "Delete Invoice",
    path: "/invoice/delete",
    icon: Trash2,
    description: "Remove an invoice record",
    color: "rose",
  },
];

const colorMap = {
  indigo: {
    card: "hover:border-indigo-200 hover:bg-indigo-50/60",
    iconBox: "group-hover:bg-indigo-100 group-hover:border-indigo-200",
    icon: "group-hover:text-indigo-500",
    label: "group-hover:text-indigo-900",
    desc: "group-hover:text-indigo-400",
    bar: "from-indigo-500 to-indigo-400",
  },
  emerald: {
    card: "hover:border-emerald-200 hover:bg-emerald-50/60",
    iconBox: "group-hover:bg-emerald-100 group-hover:border-emerald-200",
    icon: "group-hover:text-emerald-500",
    label: "group-hover:text-emerald-900",
    desc: "group-hover:text-emerald-400",
    bar: "from-emerald-500 to-emerald-400",
  },
  sky: {
    card: "hover:border-sky-200 hover:bg-sky-50/60",
    iconBox: "group-hover:bg-sky-100 group-hover:border-sky-200",
    icon: "group-hover:text-sky-500",
    label: "group-hover:text-sky-900",
    desc: "group-hover:text-sky-400",
    bar: "from-sky-500 to-sky-400",
  },
  rose: {
    card: "hover:border-rose-200 hover:bg-rose-50/60",
    iconBox: "group-hover:bg-rose-100 group-hover:border-rose-200",
    icon: "group-hover:text-rose-500",
    label: "group-hover:text-rose-900",
    desc: "group-hover:text-rose-400",
    bar: "from-rose-500 to-rose-400",
  },
};

const InvoiceMaster = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-400 flex items-center justify-center shadow-md shadow-indigo-200 shrink-0">
            <Receipt size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-[16px] font-black text-slate-900 tracking-tight leading-none">Invoice Master</h1>
            <p className="text-[11.5px] text-slate-400 mt-0.5">Select an action to get started</p>
          </div>
        </div>

        {/* Nav cards */}
        <div className="grid grid-cols-2 gap-3">
          {invoiceNav.map((item) => {
            const Icon = item.icon;
            const c = colorMap[item.color];

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`group relative flex flex-col items-center gap-3 p-5 rounded-2xl border border-slate-200 bg-white transition-all duration-200 cursor-pointer overflow-hidden ${c.card}`}
              >
                {/* Top accent bar on hover */}
                <div
                  className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${c.bar} scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left`}
                />

                {/* Icon */}
                <div
                  className={`w-12 h-12 rounded-[13px] border border-slate-200 bg-slate-50 flex items-center justify-center transition-all duration-200 ${c.iconBox}`}
                >
                  <Icon size={20} className={`transition-colors duration-200 text-slate-400 ${c.icon}`} />
                </div>

                {/* Text */}
                <div className="text-center space-y-1">
                  <p
                    className={`text-[13px] font-bold text-slate-700 tracking-tight transition-colors duration-200 ${c.label}`}
                  >
                    {item.label}
                  </p>
                  <p className={`text-[11px] text-slate-400 transition-colors duration-200 ${c.desc}`}>
                    {item.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default InvoiceMaster;
