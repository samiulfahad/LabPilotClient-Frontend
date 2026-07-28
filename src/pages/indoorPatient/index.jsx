// React Compiler active — no useCallback/useMemo
import { useNavigate } from "react-router-dom";
import { BedDouble, UserPlus, Users, Search, FlaskConical, Lock } from "lucide-react";
import { useAuthStore } from "../../store/authStore";

const ipdNav = [
  {
    label: "রোগী ভর্তি",
    path: "/ipd/admit",
    icon: UserPlus,
    description: "নতুন ইনডোর রোগী রেজিস্ট্রেশন",
    color: "emerald",
    permission: "admitPatient",
  },
  {
    label: "রোগীর তালিকা",
    path: "/ipd/patients",
    icon: Users,
    description: "ভর্তি, রিলিজড ও সকল রোগী",
    color: "blue",
    permission: "patientList",
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
    permission: "addExpenseToPatient",
  },
];

const colorMap = {
  emerald: {
    ring: "group-hover:ring-emerald-200",
    iconBox: "bg-emerald-50 border-emerald-100 group-hover:bg-emerald-100 group-hover:border-emerald-200",
    icon: "text-emerald-500",
    label: "group-hover:text-emerald-900",
    desc: "group-hover:text-emerald-500/70",
    bar: "from-emerald-500 to-emerald-400",
  },
  blue: {
    ring: "group-hover:ring-blue-200",
    iconBox: "bg-blue-50 border-blue-100 group-hover:bg-blue-100 group-hover:border-blue-200",
    icon: "text-blue-500",
    label: "group-hover:text-blue-900",
    desc: "group-hover:text-blue-500/70",
    bar: "from-blue-500 to-blue-400",
  },
  amber: {
    ring: "group-hover:ring-amber-200",
    iconBox: "bg-amber-50 border-amber-100 group-hover:bg-amber-100 group-hover:border-amber-200",
    icon: "text-amber-600",
    label: "group-hover:text-amber-900",
    desc: "group-hover:text-amber-600/70",
    bar: "from-amber-500 to-amber-400",
  },
  rose: {
    ring: "group-hover:ring-rose-200",
    iconBox: "bg-rose-50 border-rose-100 group-hover:bg-rose-100 group-hover:border-rose-200",
    icon: "text-rose-500",
    label: "group-hover:text-rose-900",
    desc: "group-hover:text-rose-500/70",
    bar: "from-rose-500 to-rose-400",
  },
};

const IndoorPatient = () => {
  const navigate = useNavigate();
  const role = useAuthStore((s) => s.user?.role);
  const permissions = useAuthStore((s) => s.user?.permissions);
  const isAdmin = role === "admin";

  const hasAccess = (item) => {
    if (isAdmin) return true;
    if (!item.permission) return true;
    return !!permissions?.[item.permission];
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_120%_80%_at_50%_-10%,#eef2ff_0%,#f8fafc_45%,#f8fafc_100%)] px-4 py-8 font-noto">
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
          {ipdNav.map((item, idx) => {
            const Icon = item.icon;
            const c = colorMap[item.color];
            const allowed = hasAccess(item);

            return (
              <button
                key={item.path}
                onClick={allowed ? () => navigate(item.path) : undefined}
                disabled={!allowed}
                title={!allowed ? "No Permission" : undefined}
                style={{ animationDelay: `${idx * 40}ms` }}
                className={`group relative flex flex-col items-center gap-3 p-5 rounded-2xl border bg-white transition-all duration-200 overflow-hidden animate-[cardIn_0.4s_cubic-bezier(.22,1,.36,1)_both] ${
                  allowed
                    ? `border-slate-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-200/60 hover:ring-1 ${c.ring}`
                    : "border-slate-100 cursor-not-allowed select-none opacity-70 saturate-0"
                }`}
              >
                {/* Top accent bar */}
                {allowed && (
                  <div
                    className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${c.bar} scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out origin-left`}
                  />
                )}

                {/* Icon */}
                <div className="relative">
                  <div
                    className={`w-12 h-12 rounded-[13px] border flex items-center justify-center transition-all duration-200 ${
                      allowed ? c.iconBox : "bg-slate-50 border-slate-100"
                    }`}
                  >
                    {allowed ? (
                      <Icon size={20} className={`transition-colors duration-200 ${c.icon}`} />
                    ) : (
                      <Icon size={20} className="text-slate-300" />
                    )}
                  </div>
                  {!allowed && (
                    <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center">
                      <Lock className="w-3 h-3 text-slate-400" strokeWidth={2.5} />
                    </div>
                  )}
                </div>

                {/* Text */}
                <div className="text-center space-y-1.5">
                  <p
                    className={`text-[17px] font-bold tracking-tight transition-colors duration-200 font-noto leading-snug ${
                      allowed ? `text-slate-700 ${c.label}` : "text-slate-400"
                    }`}
                  >
                    {item.label}
                  </p>
                  <p
                    className={`text-[14px] transition-colors duration-200 font-noto leading-snug ${
                      allowed ? `text-slate-400 ${c.desc}` : "text-slate-300"
                    }`}
                  >
                    {allowed ? item.description : "অনুমতি প্রয়োজন"}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default IndoorPatient;
