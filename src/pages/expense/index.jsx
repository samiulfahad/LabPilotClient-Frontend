import { useNavigate } from "react-router-dom";
import { PlusCircle, ListOrdered, Trash2, Receipt } from "lucide-react";

const expenseNav = [
  {
    label: "নতুন খরচ",
    path: "/expense/new",
    icon: PlusCircle,
    description: "নতুন খরচের হিসাব যোগ করুন",
    color: "teal",
  },
  {
    label: "খরচের তালিকা",
    path: "/expense/all",
    icon: ListOrdered,
    description: "সকল খরচের হিসাব দেখুন",
    color: "ochre",
  },
  {
    label: "খরচ ডিলিট",
    path: "/expense/delete",
    icon: Trash2,
    description: "খরচের রেকর্ড মুছে ফেলুন",
    color: "rust",
  },
];

const colorMap = {
  teal: {
    card: "hover:border-teal-200 hover:bg-teal-50/60",
    iconBox: "bg-teal-50 border-teal-100 group-hover:bg-teal-100 group-hover:border-teal-200",
    icon: "text-teal-600",
    label: "group-hover:text-teal-900",
    desc: "group-hover:text-teal-600/70",
    bar: "from-teal-500 to-teal-400",
  },
  ochre: {
    card: "hover:border-amber-200 hover:bg-amber-50/60",
    iconBox: "bg-amber-50 border-amber-100 group-hover:bg-amber-100 group-hover:border-amber-200",
    icon: "text-amber-600",
    label: "group-hover:text-amber-900",
    desc: "group-hover:text-amber-600/70",
    bar: "from-amber-500 to-amber-400",
  },
  rust: {
    card: "hover:border-orange-200 hover:bg-orange-50/60",
    iconBox: "bg-orange-50 border-orange-100 group-hover:bg-orange-100 group-hover:border-orange-200",
    icon: "text-orange-700",
    label: "group-hover:text-orange-900",
    desc: "group-hover:text-orange-700/70",
    bar: "from-orange-600 to-orange-500",
  },
};

const Expense = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 px-4 py-8 font-noto">
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

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`group relative flex flex-col items-center gap-3 p-5 rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-200 cursor-pointer overflow-hidden ${c.card} ${
                  isLastOdd ? "col-span-2" : ""
                }`}
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
                    className={`text-[17px] font-bold text-gray-700 tracking-tight transition-colors duration-200 font-noto leading-snug ${c.label}`}
                  >
                    {item.label}
                  </p>
                  <p
                    className={`text-[14px] text-gray-400 transition-colors duration-200 font-noto leading-snug ${c.desc}`}
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

export default Expense;
