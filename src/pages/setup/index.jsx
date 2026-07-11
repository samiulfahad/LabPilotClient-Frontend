import { Link } from "react-router-dom";
import { FlaskConical, Package, Users, UserCheck, BedDouble, Stethoscope } from "lucide-react";
import { useAuthStore } from "../../store/authStore";

const CARDS = [
  {
    title: "ল্যাব টেস্ট",
    subtitle: "পরীক্ষা সংক্রান্ত সকল তথ্য",
    icon: FlaskConical,
    link: "/manage-tests",
    color: "blue",
  },
  {
    title: "ঔষধ,পণ্য, সেবা",
    subtitle: "ইনভেন্টরি ও স্টক",
    icon: Package,
    link: "/manage-products",
    color: "amber",
  },
  {
    title: "ল্যাব টাফ",
    subtitle: "স্টাফদের তথ্য",
    icon: Users,
    link: "/manage-staffs",
    color: "emerald",
  },
  {
    title: "রোগী রেফারার",
    subtitle: "রেফারারদের তালিকা ও কমিশন",
    icon: UserCheck,
    link: "/manage-referrers",
    color: "purple",
  },
  {
    title: "ইনডোর রোগীর ভর্তির স্থান",
    subtitle: "ওয়ার্ড, কেবিন, আইসিইউ ব্যবস্থাপনা",
    icon: BedDouble,
    link: "/manage-spaces",
    color: "sky",
    hospitalOnly: true, // diagnosticCenter labs have no IPD module — hide this card for them
  },
  {
    title: "কর্তব্যরত চিকিৎসক",
    subtitle: "ডাক্তারদের তথ্য ও ডিউটি",
    icon: Stethoscope,
    link: "/manage-doctors",
    color: "rose",
    badge: "নিয়োগকৃত",
  },
];

const colorMap = {
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
  emerald: {
    card: "hover:border-emerald-200 hover:bg-emerald-50/60",
    iconBox: "bg-emerald-50 border-emerald-100 group-hover:bg-emerald-100 group-hover:border-emerald-200",
    icon: "text-emerald-500",
    label: "group-hover:text-emerald-900",
    desc: "group-hover:text-emerald-500/70",
    bar: "from-emerald-500 to-emerald-400",
  },
  purple: {
    card: "hover:border-purple-200 hover:bg-purple-50/60",
    iconBox: "bg-purple-50 border-purple-100 group-hover:bg-purple-100 group-hover:border-purple-200",
    icon: "text-purple-500",
    label: "group-hover:text-purple-900",
    desc: "group-hover:text-purple-500/70",
    bar: "from-purple-500 to-purple-400",
  },
  sky: {
    card: "hover:border-sky-200 hover:bg-sky-50/60",
    iconBox: "bg-sky-50 border-sky-100 group-hover:bg-sky-100 group-hover:border-sky-200",
    icon: "text-sky-500",
    label: "group-hover:text-sky-900",
    desc: "group-hover:text-sky-500/70",
    bar: "from-sky-500 to-sky-400",
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

const Setup = () => {
  const user = useAuthStore((state) => state.user);
  const isHospital = user?.type === "hospital";
  const visibleCards = CARDS.filter((item) => !item.hospitalOnly || isHospital);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 px-4 py-8 font-noto">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-400 flex items-center justify-center shadow-md shadow-indigo-200 shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-[22px] font-black text-slate-900 tracking-tight leading-tight">ল্যাব ম্যানেজমেন্ট</h1>
            <p className="text-[15px] text-slate-400 mt-0.5">সিস্টেম কনফিগারেশন ও ব্যবস্থাপনা</p>
          </div>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-2 gap-3">
          {visibleCards.map((item) => {
            const Icon = item.icon;
            const c = colorMap[item.color];

            return (
              <Link
                key={item.link}
                to={item.link}
                className={`group relative flex flex-col items-center gap-3 p-5 rounded-2xl border border-slate-200 bg-white transition-all duration-200 cursor-pointer overflow-hidden ${c.card}`}
              >
                {/* Top accent bar on hover */}
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
                    className={`text-[17px] font-bold text-slate-700 tracking-tight transition-colors duration-200 leading-snug ${c.label}`}
                  >
                    {item.title}
                  </p>
                  <p className={`text-[14px] text-slate-400 transition-colors duration-200 leading-snug ${c.desc}`}>
                    {item.subtitle}
                  </p>
                  {item.badge && (
                    <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-50 text-rose-500 border border-rose-200">
                      {item.badge}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 mt-4 pt-2 border-t border-slate-200/50">
          ল্যাবপাইলটপ্রো · ল্যাব ম্যানেজমেন্ট সিস্টেম
        </p>
      </div>
    </div>
  );
};

export default Setup;
