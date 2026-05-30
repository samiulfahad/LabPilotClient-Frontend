// React Compiler active — no useCallback/useMemo
import { useNavigate } from "react-router-dom";
import { BedDouble, UserPlus, Users, Search, FlaskConical } from "lucide-react";

const ipdNav = [
  {
    label: "Admit Patient",
    path: "/ipd/admit",
    icon: UserPlus,
    description: "Register a new indoor patient",
    color: "emerald",
  },
  {
    label: "Patient List",
    path: "/ipd/patients",
    icon: Users,
    description: "Admitted, released & all",
    color: "blue",
  },
  {
    label: "Search Patient",
    path: "/ipd/search",
    icon: Search,
    description: "Find by name, ID or phone",
    color: "amber",
  },
  {
    label: "Add Tests / Products",
    path: "/ipd/add-items",
    icon: FlaskConical,
    description: "Add to an admitted patient",
    color: "rose",
  },
];

const colorMap = {
  emerald: {
    card: "hover:border-emerald-200 hover:bg-emerald-50/60",
    iconBox: "group-hover:bg-emerald-100 group-hover:border-emerald-200",
    icon: "group-hover:text-emerald-500",
    label: "group-hover:text-emerald-900",
    desc: "group-hover:text-emerald-400",
    bar: "from-emerald-500 to-emerald-400",
  },
  blue: {
    card: "hover:border-blue-200 hover:bg-blue-50/60",
    iconBox: "group-hover:bg-blue-100 group-hover:border-blue-200",
    icon: "group-hover:text-blue-500",
    label: "group-hover:text-blue-900",
    desc: "group-hover:text-blue-400",
    bar: "from-blue-500 to-blue-400",
  },
  violet: {
    card: "hover:border-violet-200 hover:bg-violet-50/60",
    iconBox: "group-hover:bg-violet-100 group-hover:border-violet-200",
    icon: "group-hover:text-violet-500",
    label: "group-hover:text-violet-900",
    desc: "group-hover:text-violet-400",
    bar: "from-violet-500 to-violet-400",
  },
  amber: {
    card: "hover:border-amber-200 hover:bg-amber-50/60",
    iconBox: "group-hover:bg-amber-100 group-hover:border-amber-200",
    icon: "group-hover:text-amber-500",
    label: "group-hover:text-amber-900",
    desc: "group-hover:text-amber-400",
    bar: "from-amber-500 to-amber-400",
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

const IndoorPatientMaster = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center shadow-md shadow-blue-200 shrink-0">
            <BedDouble size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-[16px] font-black text-slate-900 tracking-tight leading-none">Indoor Patients</h1>
            <p className="text-[11.5px] text-slate-400 mt-0.5">IPD Management — Wards, Beds & Billing</p>
          </div>
        </div>

        {/* Nav cards */}
        <div className="grid grid-cols-2 gap-3">
          {ipdNav.map((item) => {
            const Icon = item.icon;
            const c = colorMap[item.color];
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`group relative flex flex-col items-center gap-3 p-5 rounded-2xl border border-slate-200 bg-white transition-all duration-200 cursor-pointer overflow-hidden ${c.card}`}
              >
                {/* Top accent bar */}
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

export default IndoorPatientMaster;
