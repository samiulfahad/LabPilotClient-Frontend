import { useNavigate } from "react-router-dom";
import { FilePlus2, Search, Trash2, LayoutList, Lock } from "lucide-react";
import { useAuthStore } from "../../store/authStore";

const buildInvoiceNav = (isHospital) => [
  {
    label: "ইনভয়েস লিস্ট",
    path: "/outdoor/invoice/all",
    icon: LayoutList,
    description: isHospital ? "সকল আউটডোর রোগীর ইনভয়েস দেখুন" : "সকল রোগীর ইনভয়েস দেখুন",
    color: "indigo",
    permission: "invoiceList",
  },
  {
    label: "নতুন ইনভয়েস",
    path: "/outdoor/invoice/new",
    icon: FilePlus2,
    description: isHospital ? "আউটডোর রোগীর জন্য নতুন ইনভয়েস তৈরি করুন" : "রোগীর জন্য নতুন ইনভয়েস তৈরি করুন",
    color: "emerald",
    permission: "createInvoice",
  },
  {
    label: "ইনভয়েস খুঁজুন",
    path: "/outdoor/search-invoice",
    icon: Search,
    description: "আইডি বা রোগীর নাম দিয়ে খুঁজুন",
    color: "sky",
  },
  {
    label: "ইনভয়েস ডিলিট",
    path: "/outdoor/invoice/delete",
    icon: Trash2,
    description: "ইনভয়েস রেকর্ড মুছে ফেলুন",
    color: "rose",
    permission: "deleteInvoice",
  },
];

const colorMap = {
  indigo: {
    ring: "group-hover:ring-indigo-100",
    iconBox: "bg-indigo-50 border-indigo-100 group-hover:bg-indigo-100 group-hover:border-indigo-200",
    icon: "text-indigo-500",
    label: "group-hover:text-indigo-900",
    desc: "group-hover:text-indigo-500",
    bar: "from-indigo-500 to-indigo-400",
  },
  emerald: {
    ring: "group-hover:ring-emerald-100",
    iconBox: "bg-emerald-50 border-emerald-100 group-hover:bg-emerald-100 group-hover:border-emerald-200",
    icon: "text-emerald-500",
    label: "group-hover:text-emerald-900",
    desc: "group-hover:text-emerald-500",
    bar: "from-emerald-500 to-emerald-400",
  },
  sky: {
    ring: "group-hover:ring-sky-100",
    iconBox: "bg-sky-50 border-sky-100 group-hover:bg-sky-100 group-hover:border-sky-200",
    icon: "text-sky-500",
    label: "group-hover:text-sky-900",
    desc: "group-hover:text-sky-500",
    bar: "from-sky-500 to-sky-400",
  },
  rose: {
    ring: "group-hover:ring-rose-100",
    iconBox: "bg-rose-50 border-rose-100 group-hover:bg-rose-100 group-hover:border-rose-200",
    icon: "text-rose-500",
    label: "group-hover:text-rose-900",
    desc: "group-hover:text-rose-500",
    bar: "from-rose-500 to-rose-400",
  },
};

const OutdoorPatient = () => {
  const navigate = useNavigate();
  const lab = useAuthStore((s) => s.lab);
  const role = useAuthStore((s) => s.user?.role);
  const permissions = useAuthStore((s) => s.user?.permissions);
  const isAdmin = role === "admin";
  const isHospital = lab?.type === "hospital";
  const pageTitle = isHospital ? "আউটডোর রোগী" : "Invoice Master";
  const invoiceNav = buildInvoiceNav(isHospital);

  const hasAccess = (item) => {
    if (isAdmin) return true;
    if (!item.permission) return true;
    return !!permissions?.[item.permission];
  };

  const unlockedCount = invoiceNav.filter(hasAccess).length;

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_120%_80%_at_50%_-10%,#eef2ff_0%,#f8fafc_45%,#f8fafc_100%)] px-4 py-8 font-noto">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-400 flex items-center justify-center shadow-md shadow-indigo-200 shrink-0">
            <LayoutList size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-[22px] font-black text-slate-900 tracking-tight leading-tight">{pageTitle}</h1>
            <p className="text-[13.5px] text-slate-400 mt-0.5">
              {unlockedCount}/{invoiceNav.length} বিভাগে প্রবেশাধিকার আছে
            </p>
          </div>
        </div>

        {/* Nav cards */}
        <div className="grid grid-cols-2 gap-3.5">
          {invoiceNav.map((item, idx) => {
            const Icon = item.icon;
            const c = colorMap[item.color];
            const allowed = hasAccess(item);

            return (
              <button
                key={item.path}
                onClick={allowed ? () => navigate(item.path) : undefined}
                disabled={!allowed}
                title={!allowed ? "প্রবেশাধিকার নেই" : undefined}
                style={{ animationDelay: `${idx * 40}ms` }}
                className={`group relative flex flex-col items-center gap-3 p-5 rounded-2xl border bg-white transition-all duration-200 overflow-hidden outline-none focus:outline-none hover:outline-none focus-visible:outline-none active:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 animate-[cardIn_0.4s_cubic-bezier(.22,1,.36,1)_both] ${
                  allowed
                    ? `border-slate-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-200/60 ring-1 ring-transparent ${c.ring} focus-visible:ring-indigo-400`
                    : "border-slate-100 cursor-not-allowed select-none opacity-70 saturate-0"
                }`}
              >
                {/* Persistent category rail — always visible at low opacity, brightens on hover */}
                <div
                  className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${
                    allowed ? c.bar : "from-slate-200 to-slate-200"
                  } opacity-40 group-hover:opacity-100 transition-opacity duration-300`}
                />

                {/* Icon */}
                <div className="relative">
                  <div
                    className={`w-12 h-12 rounded-[13px] border flex items-center justify-center transition-all duration-200 ${
                      allowed ? c.iconBox : "bg-slate-50 border-slate-100"
                    }`}
                  >
                    <Icon
                      size={20}
                      className={`transition-colors duration-200 ${allowed ? c.icon : "text-slate-300"}`}
                    />
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
                    className={`text-[15.5px] font-bold tracking-tight transition-colors duration-200 leading-snug ${
                      allowed ? `text-slate-700 ${c.label}` : "text-slate-400"
                    }`}
                  >
                    {item.label}
                  </p>
                  <p
                    className={`text-[13px] transition-colors duration-200 leading-snug ${
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
        @media (prefers-reduced-motion: reduce) {
          [class*="animate-\\[cardIn"] { animation: none !important; }
        }
      `}</style>
    </div>
  );
};

export default OutdoorPatient;
