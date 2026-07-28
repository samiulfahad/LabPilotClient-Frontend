import { useNavigate } from "react-router-dom";
import { PlusCircle, ListOrdered, Trash2, Receipt, Lock } from "lucide-react";
import { useAuthStore } from "../../store/authStore";

const expenseNav = [
  {
    label: "নতুন খরচ",
    path: "/expense/new",
    icon: PlusCircle,
    description: "নতুন খরচের হিসাব যোগ করুন",
    color: "teal",
    permission: "addExpense",
  },
  {
    label: "খরচের তালিকা",
    path: "/expense/all",
    icon: ListOrdered,
    description: "সকল খরচের হিসাব দেখুন",
    color: "ochre",
    permission: "expenseList",
  },
  {
    label: "খরচ ডিলিট",
    path: "/expense/delete",
    icon: Trash2,
    description: "খরচের রেকর্ড মুছে ফেলুন",
    color: "rust",
    permission: "deleteExpense",
  },
];

const colorMap = {
  teal: {
    ring: "group-hover:ring-teal-200",
    iconBox: "bg-teal-50 border-teal-100 group-hover:bg-teal-100 group-hover:border-teal-200",
    icon: "text-teal-600",
    label: "group-hover:text-teal-900",
    desc: "group-hover:text-teal-600/70",
    bar: "from-teal-500 to-teal-400",
  },
  ochre: {
    ring: "group-hover:ring-amber-200",
    iconBox: "bg-amber-50 border-amber-100 group-hover:bg-amber-100 group-hover:border-amber-200",
    icon: "text-amber-600",
    label: "group-hover:text-amber-900",
    desc: "group-hover:text-amber-600/70",
    bar: "from-amber-500 to-amber-400",
  },
  rust: {
    ring: "group-hover:ring-orange-200",
    iconBox: "bg-orange-50 border-orange-100 group-hover:bg-orange-100 group-hover:border-orange-200",
    icon: "text-orange-700",
    label: "group-hover:text-orange-900",
    desc: "group-hover:text-orange-700/70",
    bar: "from-orange-600 to-orange-500",
  },
};

const Expense = () => {
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
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-600 to-amber-500 flex items-center justify-center shadow-md shadow-orange-200/60 shrink-0">
            <Receipt size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-[22px] font-black text-gray-900 tracking-tight leading-tight font-noto">
              খরচ ব্যবস্থাপনা
            </h1>
            <p className="text-[15px] text-gray-400 mt-0.5 font-noto">যে কাজটি করতে চান তা নির্বাচন করুন</p>
          </div>
        </div>

        {/* Nav cards */}
        <div className="grid grid-cols-2 gap-3">
          {expenseNav.map((item, idx) => {
            const Icon = item.icon;
            const c = colorMap[item.color];
            const isLastOdd = expenseNav.length % 2 !== 0 && idx === expenseNav.length - 1;
            const allowed = hasAccess(item);

            return (
              <button
                key={item.path}
                onClick={allowed ? () => navigate(item.path) : undefined}
                disabled={!allowed}
                title={!allowed ? "No Permission" : undefined}
                style={{ animationDelay: `${idx * 40}ms` }}
                className={`group relative flex flex-col items-center gap-3 p-5 rounded-2xl border bg-white shadow-sm transition-all duration-200 overflow-hidden animate-[cardIn_0.4s_cubic-bezier(.22,1,.36,1)_both] ${
                  isLastOdd ? "col-span-2" : ""
                } ${
                  allowed
                    ? `border-gray-100 cursor-pointer hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-200/60 hover:ring-1 ${c.ring}`
                    : "border-gray-100 cursor-not-allowed select-none opacity-70 saturate-0"
                }`}
              >
                {/* Top accent bar on hover */}
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
                      allowed ? `text-gray-700 ${c.label}` : "text-slate-400"
                    }`}
                  >
                    {item.label}
                  </p>
                  <p
                    className={`text-[14px] transition-colors duration-200 font-noto leading-snug ${
                      allowed ? `text-gray-400 ${c.desc}` : "text-slate-300"
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

export default Expense;
