// React Compiler active — no useCallback/useMemo
import { useNavigate } from "react-router-dom";
import { BedDouble, UserPlus, Users, Search, FlaskConical } from "lucide-react";

const ipdNav = [
  {
    label: "রোগী ভর্তি",
    path: "/ipd/admit",
    icon: UserPlus,
    description: "নতুন ইনডোর রোগী রেজিস্ট্রেশন",
    color: "emerald",
  },
  {
    label: "রোগীর তালিকা",
    path: "/ipd/patients",
    icon: Users,
    description: "ভর্তি, রিলিজড ও সকল রোগী",
    color: "blue",
  },
  {
    label: "রোগী খুঁজুন",
    path: "/ipd/search",
    icon: Search,
    description: "নাম, আইডি বা ফোন দিয়ে খুঁজুন",
    color: "amber",
  },
  {
    label: "টেস্ট / প্রোডাক্ট যোগ",
    path: "/ipd/add-items",
    icon: FlaskConical,
    description: "ভর্তি রোগীর সাথে যোগ করুন",
    color: "rose",
  },
];

const colorMap = {
  emerald: {
    card: "hover:border-emerald-200 hover:bg-emerald-50/60",
    iconBox: "bg-emerald-50 border-emerald-100 group-hover:bg-emerald-100 group-hover:border-emerald-200",
    icon: "text-emerald-500",
    label: "group-hover:text-emerald-900",
    desc: "group-hover:text-emerald-500/70",
    bar: "from-emerald-500 to-emerald-400",
  },
  blue: {
    card: "hover:border-blue-200 hover:bg-blue-50/60",
    iconBox: "bg-blue-50 border-blue-100 group-hover:bg-blue-100 group-hover:border-blue-200",
    icon: "text-blue-500",
    label: "group-hover:text-blue-900",
    desc: "group-hover:text-blue-500/70",
    bar: "from-blue-500 to-blue-400",
  },
  amber: {
    card: "hover:border-amber-200 hover:bg-amber-50/60",
    iconBox: "bg-amber-50 border-amber-100 group-hover:bg-amber-100 group-hover:border-amber-200",
    icon: "text-amber-600",
    label: "group-hover:text-amber-900",
    desc: "group-hover:text-amber-600/70",
    bar: "from-amber-500 to-amber-400",
  },
  rose: {
    card: "hover:border-rose-200 hover:bg-rose-50/60",
    iconBox: "bg-rose-50 border-rose-100 group-hover:bg-rose-100 group-hover:border-rose-200",
    icon: "text-rose-500",
    label: "group-hover:text-rose-900",
    desc: "group-hover:text-rose-500/70",
    bar: "from-rose-500 to-rose-400",
  },
};

const IndoorPatient = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 px-4 py-8 font-noto">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center shadow-md shadow-blue-200 shrink-0">
            <BedDouble size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-[22px] font-black text-slate-900 tracking-tight leading-tight font-noto">ইনডোর রোগী</h1>
            <p className="text-[15px] text-slate-400 mt-0.5 font-noto">আইপিডি ব্যবস্থাপনা — ওয়ার্ড, বেড ও বিলিং</p>
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
                  className={`w-12 h-12 rounded-[13px] border flex items-center justify-center transition-all duration-200 ${c.iconBox}`}
                >
                  <Icon size={20} className={`transition-colors duration-200 ${c.icon}`} />
                </div>

                {/* Text */}
                <div className="text-center space-y-1.5">
                  <p
                    className={`text-[17px] font-bold text-slate-700 tracking-tight transition-colors duration-200 font-noto leading-snug ${c.label}`}
                  >
                    {item.label}
                  </p>
                  <p
                    className={`text-[14px] text-slate-400 transition-colors duration-200 font-noto leading-snug ${c.desc}`}
                  >
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

export default IndoorPatient;
