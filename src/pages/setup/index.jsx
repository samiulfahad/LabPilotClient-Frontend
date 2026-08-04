import { Link } from "react-router-dom";
import { FlaskConical, Package, Users, UserCheck, BedDouble, Stethoscope, Lock, Settings2 } from "lucide-react";
import { useAuthStore } from "../../store/authStore";

const CARDS = [
  {
    title: "ল্যাব টেস্ট",
    subtitle: "পরীক্ষা সংক্রান্ত সকল তথ্য",
    icon: FlaskConical,
    link: "/manage-tests",
    color: "blue",
    permission: "manageTests", // correct key
  },
  {
    title: "ঔষধ,পণ্য, সেবা",
    subtitle: "ইনভেন্টরি ও স্টক",
    icon: Package,
    link: "/manage-products",
    color: "amber",
    permission: "manageProducts",
  },
  {
    title: "স্টাফ অ্যাকাউন্ট",
    subtitle: "স্টাফদের তথ্য",
    icon: Users,
    link: "/manage-staffs",
    color: "emerald",
    permission: "manageStaffs", // was adminOnly – now permission‑based
  },
  {
    title: "রোগী রেফারার",
    subtitle: "রেফারারদের তালিকা ও কমিশন",
    icon: UserCheck,
    link: "/manage-referrers",
    color: "purple",
    permission: "manageReferrers",
  },
  {
    title: "ইনডোর রোগীর ভর্তির স্থান",
    subtitle: "ওয়ার্ড, কেবিন, আইসিইউ ব্যবস্থাপনা",
    icon: BedDouble,
    link: "/manage-spaces",
    color: "sky",
    hospitalOnly: true, // hidden for diagnostic centres
    permission: "manageAdmissionSpace", // was adminOnly – now permission‑based
  },
  {
    title: "কর্তব্যরত চিকিৎসক",
    subtitle: "ডাক্তারদের তথ্য ও ডিউটি",
    icon: Stethoscope,
    link: "/manage-doctors",
    color: "rose",
    badge: "নিয়োগকৃত",
    permission: "manageDoctors",
  },
];

const colorMap = {
  /* …unchanged… */
};

const Setup = () => {
  const user = useAuthStore((state) => state.user);
  const role = useAuthStore((state) => state.user?.role);
  const permissions = useAuthStore((state) => state.user?.permissions);
  const isAdmin = role === "admin";
  const isHospital = user?.type === "hospital";

  // Filter out hospital‑only cards for diagnostic centres
  const visibleCards = CARDS.filter((item) => !item.hospitalOnly || isHospital);

  const hasAccess = (item) => {
    if (isAdmin) return true;
    if (!item.permission) return true; // items without a permission key are public
    return !!permissions?.[item.permission];
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_120%_80%_at_50%_-10%,#eef2ff_0%,#f8fafc_45%,#f8fafc_100%)] px-4 py-8 font-noto">
      <div className="max-w-2xl mx-auto space-y-7">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-200 shrink-0">
            <Settings2 className="w-5 h-5 text-white" strokeWidth={2.25} />
            <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/20" />
          </div>
          <div>
            <h1 className="text-[22px] font-black text-slate-900 tracking-tight leading-tight">ল্যাব ম্যানেজমেন্ট</h1>
            <p className="text-[14px] text-slate-400 mt-0.5">সিস্টেম কনফিগারেশন ও ব্যবস্থাপনা</p>
          </div>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-2 gap-3.5">
          {visibleCards.map((item, idx) => {
            const Icon = item.icon;
            const c = colorMap[item.color] || {};
            const allowed = hasAccess(item);

            const cardInner = (
              <>
                {allowed && (
                  <div
                    className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${c.bar} scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out origin-left`}
                  />
                )}

                <div className="relative">
                  <div
                    className={`w-12 h-12 rounded-[14px] border flex items-center justify-center transition-all duration-200 ${
                      allowed ? c.iconBox : "bg-slate-50 border-slate-100"
                    }`}
                  >
                    {allowed ? (
                      <Icon size={20} className={`transition-colors duration-200 ${c.icon}`} strokeWidth={2} />
                    ) : (
                      <Icon size={20} className="text-slate-300" strokeWidth={2} />
                    )}
                  </div>
                  {!allowed && (
                    <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center">
                      <Lock className="w-3 h-3 text-slate-400" strokeWidth={2.5} />
                    </div>
                  )}
                </div>

                <div className="text-center space-y-1.5">
                  <p
                    className={`text-[16px] font-bold tracking-tight transition-colors duration-200 leading-snug ${
                      allowed ? `text-slate-700 ${c.label}` : "text-slate-400"
                    }`}
                  >
                    {item.title}
                  </p>
                  <p
                    className={`text-[13px] transition-colors duration-200 leading-snug ${
                      allowed ? `text-slate-400 ${c.desc}` : "text-slate-300"
                    }`}
                  >
                    {allowed ? item.subtitle : "অনুমতি প্রয়োজন"}
                  </p>
                  {item.badge && allowed && (
                    <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-50 text-rose-500 border border-rose-200">
                      {item.badge}
                    </span>
                  )}
                </div>
              </>
            );

            const baseClass =
              "group relative flex flex-col items-center gap-3 p-5 rounded-2xl border bg-white transition-all duration-200 overflow-hidden outline-none focus:outline-none hover:outline-none focus-visible:outline-none active:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 animate-[cardIn_0.4s_cubic-bezier(.22,1,.36,1)_both]";

            if (!allowed) {
              return (
                <div
                  key={item.link}
                  title="No Permission"
                  style={{ animationDelay: `${idx * 40}ms` }}
                  className={`${baseClass} border-slate-100 hover:border-slate-100 cursor-not-allowed select-none opacity-70 saturate-0`}
                >
                  {cardInner}
                </div>
              );
            }

            return (
              <Link
                key={item.link}
                to={item.link}
                style={{ animationDelay: `${idx * 40}ms`, outline: "none" }}
                className={`${baseClass} border-slate-200 hover:border-slate-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-200/60 group-hover:ring-1 ${c.ring} ${c.focusRing}`}
              >
                {cardInner}
              </Link>
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

export default Setup;
