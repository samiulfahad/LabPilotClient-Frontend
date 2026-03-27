import { Link } from "react-router-dom";
import { Settings, ChevronRight, FlaskConical, Package, Users, UserCheck } from "lucide-react";

const CARDS = [
  {
    title: "Manage Test List",
    icon: FlaskConical,
    link: "/manage-tests",
    bgIcon: "bg-gradient-to-br from-blue-50 to-indigo-50",
    iconColor: "text-blue-600",
    hoverBorder: "group-hover:border-blue-200",
    textColor: "text-blue-600",
  },
  {
    title: "Non-Test Items",
    icon: Package,
    link: null,
    bgIcon: "bg-gradient-to-br from-amber-50 to-amber-100",
    iconColor: "text-amber-600",
    hoverBorder: "group-hover:border-amber-200",
    textColor: "text-amber-600",
  },
  {
    title: "Manage Staff",
    icon: Users,
    link: "/manage-staffs",
    bgIcon: "bg-gradient-to-br from-emerald-50 to-emerald-100",
    iconColor: "text-emerald-600",
    hoverBorder: "group-hover:border-emerald-200",
    textColor: "text-emerald-600",
  },
  {
    title: "Manage Referrers",
    icon: UserCheck,
    link: "/manage-referrers",
    bgIcon: "bg-gradient-to-br from-purple-50 to-purple-100",
    iconColor: "text-purple-600",
    hoverBorder: "group-hover:border-purple-200",
    textColor: "text-purple-600",
  },
];

const ActionButton = ({ onClick, label, className = "" }) => (
  <button
    onClick={onClick}
    className={`group inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium text-indigo-700 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 transition-all shadow-sm hover:shadow ${className}`}
  >
    {label}
    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
  </button>
);

const CredentialRow = ({ label, icon: Icon, value, buttonLabel, onAction }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg hover:bg-gray-50/80 transition-colors">
    {/* Mobile: label + button */}
    <div className="flex items-center justify-between w-full sm:hidden">
      <div className="flex items-center gap-3">
        <div className="p-1.5 bg-indigo-50 rounded-md">
          <Icon className="w-3.5 h-3.5 text-indigo-600" />
        </div>
        <span className="text-sm font-medium text-gray-700">{label}</span>
      </div>
      <ActionButton onClick={onAction} label="Change" />
    </div>

    {/* Desktop: icon + label + value + button */}
    <div className="flex items-center gap-3 pl-10 sm:pl-0 w-full">
      <div className="hidden sm:flex items-center gap-3">
        <div className="p-1.5 bg-indigo-50 rounded-md">
          <Icon className="w-3.5 h-3.5 text-indigo-600" />
        </div>
        <span className="text-sm font-medium text-gray-700">{label}</span>
      </div>
      <span className="text-xs font-mono text-gray-600 bg-gray-100 px-2.5 py-1 rounded-md border border-gray-200">
        {value}
      </span>
      <ActionButton onClick={onAction} label={buttonLabel} className="hidden sm:inline-flex ml-auto w-36" />
    </div>
  </div>
);

const LabManagement = () => {
 
  return (
    <div className="min-h-screen bg-slate-50 px-6 py-2">
      <div className="max-w-6xl mx-auto px-4 py-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-md">
            <Settings className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900">Lab Management</h1>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {CARDS.map((card) => {
            const content = (
              <div
                className={`group bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/80 hover:border-gray-300 shadow-sm hover:shadow-md transition-all duration-200 p-5 h-full ${card.hoverBorder}`}
              >
                <div className="flex flex-col h-full">
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`flex-shrink-0 p-2.5 rounded-lg bg-white shadow-sm ${card.bgIcon}`}>
                      <card.icon className={`w-5 h-5 ${card.iconColor}`} />
                    </div>
                    <h2 className="text-base font-semibold text-gray-900 tracking-tight">{card.title}</h2>
                  </div>
                  <div className="flex items-center justify-between pt-3 mt-auto border-t border-gray-100">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-medium ${card.textColor} opacity-80 group-hover:opacity-100`}
                    >
                      {card.link ? "Manage" : "Soon"}
                      <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                    {card.link && <span className="text-xs text-gray-400">→</span>}
                  </div>
                </div>
              </div>
            );

            return card.link ? (
              <Link key={card.title} to={card.link} className="block h-full">
                {content}
              </Link>
            ) : (
              <div key={card.title} className="block h-full cursor-not-allowed opacity-70">
                {content}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LabManagement;
