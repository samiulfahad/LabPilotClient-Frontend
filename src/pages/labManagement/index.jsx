import Icons from "../../components/icons";
import { Link } from "react-router-dom";
import { Settings, ChevronRight, Shield, Key, Phone, Mail } from "lucide-react";

const LabManagement = () => {
  const handleChangeCredentials = (type) => {
    alert(`Opening ${type} change modal...`);
  };

  const cards = [
    {
      title: "Manage Test List",
      icon: Icons.TestList,
      link: "/manage-testList",
      bgIcon: "bg-gradient-to-br from-blue-50 to-indigo-50",
      iconColor: "text-blue-600",
      accentBorder: "bg-gradient-to-r from-blue-500 to-indigo-600",
      hoverBorder: "group-hover:border-blue-200",
      textColor: "text-blue-600",
    },
    {
      title: "Non-Test Items",
      icon: Icons.NonTestItems,
      link: null,
      bgIcon: "bg-gradient-to-br from-amber-50 to-amber-100",
      iconColor: "text-amber-600",
      accentBorder: "bg-gradient-to-r from-amber-500 to-amber-600",
      hoverBorder: "group-hover:border-amber-200",
      textColor: "text-amber-600",
    },
    {
      title: "Manage Staff",
      icon: Icons.Staff,
      link: "/manage-staffs",
      bgIcon: "bg-gradient-to-br from-emerald-50 to-emerald-100",
      iconColor: "text-emerald-600",
      accentBorder: "bg-gradient-to-r from-emerald-500 to-emerald-600",
      hoverBorder: "group-hover:border-emerald-200",
      textColor: "text-emerald-600",
    },
    {
      title: "Manage Referrers",
      icon: Icons.Referrers,
      link: "/manage-referrers",
      bgIcon: "bg-gradient-to-br from-purple-50 to-purple-100",
      iconColor: "text-purple-600",
      accentBorder: "bg-gradient-to-r from-purple-500 to-purple-600",
      hoverBorder: "group-hover:border-purple-200",
      textColor: "text-purple-600",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Header – minimal */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-md">
            <Settings className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900">Lab Management</h1>
        </div>

        {/* Cards – no descriptions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {cards.map((card, index) => {
            const CardContent = (
              <div
                className={`
                  group bg-white/80 backdrop-blur-sm rounded-xl
                  border border-gray-200/80 hover:border-gray-300
                  shadow-sm hover:shadow-md
                  transition-all duration-200 p-5 h-full
                  ${card.hoverBorder}
                `}
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
              <Link key={index} to={card.link} className="block h-full">
                {CardContent}
              </Link>
            ) : (
              <div key={index} className="block h-full cursor-not-allowed opacity-70">
                {CardContent}
              </div>
            );
          })}
        </div>

        {/* ===== ACCOUNT SECURITY – PASSWORD BUTTON AT 3RD POSITION ===== */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-[0_4px_12px_rgba(0,0,0,0.02)] p-5">
          {/* Header */}
          <div className="flex items-center gap-3 pb-3 border-b border-gray-100 mb-3">
            <div className="p-2 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg">
              <Shield className="w-4 h-4 text-indigo-600" />
            </div>
            <h2 className="text-sm font-semibold text-gray-800">Account Security</h2>
          </div>

          {/* Credential rows – Mobile → Email → Password */}
          <div className="space-y-3">
            {/* ─── 1. MOBILE ────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg hover:bg-gray-50/80 transition-colors">
              {/* Mobile row 1: label + button */}
              <div className="flex items-center justify-between w-full sm:hidden">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-indigo-50 rounded-md">
                    <Phone className="w-3.5 h-3.5 text-indigo-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Mobile</span>
                </div>
                <button
                  onClick={() => handleChangeCredentials("mobile")}
                  className="group inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium text-indigo-700 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 transition-all shadow-sm hover:shadow"
                >
                  Change
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>

              {/* Value chip (mobile indented, desktop inline) */}
              <div className="flex items-center gap-3 pl-10 sm:pl-0 sm:flex sm:flex-row sm:items-center sm:gap-3 w-full">
                <div className="hidden sm:flex sm:items-center sm:gap-3">
                  <div className="p-1.5 bg-indigo-50 rounded-md">
                    <Phone className="w-3.5 h-3.5 text-indigo-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Mobile</span>
                </div>

                <span className="text-xs font-mono text-gray-600 bg-gray-100 px-2.5 py-1 rounded-md border border-gray-200">
                  +880 1712 345678
                </span>

                {/* Desktop button */}
                <button
                  onClick={() => handleChangeCredentials("mobile")}
                  className="hidden sm:inline-flex group items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium text-indigo-700 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 transition-all shadow-sm hover:shadow sm:w-36 ml-auto"
                >
                  Change Number
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>

            {/* ─── 2. EMAIL ────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg hover:bg-gray-50/80 transition-colors">
              {/* Mobile row 1: label + button */}
              <div className="flex items-center justify-between w-full sm:hidden">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-indigo-50 rounded-md">
                    <Mail className="w-3.5 h-3.5 text-indigo-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Email</span>
                </div>
                <button
                  onClick={() => handleChangeCredentials("email")}
                  className="group inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium text-indigo-700 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 transition-all shadow-sm hover:shadow"
                >
                  Change
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>

              {/* Value chip (mobile indented, desktop inline) */}
              <div className="flex items-center gap-3 pl-10 sm:pl-0 sm:flex sm:flex-row sm:items-center sm:gap-3 w-full">
                <div className="hidden sm:flex sm:items-center sm:gap-3">
                  <div className="p-1.5 bg-indigo-50 rounded-md">
                    <Mail className="w-3.5 h-3.5 text-indigo-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Email</span>
                </div>

                <span className="text-xs font-mono text-gray-600 bg-gray-100 px-2.5 py-1 rounded-md border border-gray-200">
                  admieerwerhn@diagnostics.com
                </span>

                {/* Desktop button */}
                <button
                  onClick={() => handleChangeCredentials("email")}
                  className="hidden sm:inline-flex group items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium text-indigo-700 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 transition-all shadow-sm hover:shadow sm:w-36 ml-auto"
                >
                  Change Email
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>

            {/* ─── 3. PASSWORD – HALF WIDTH, CENTERED ────────────────── */}
            <div className="flex justify-center p-3 rounded-lg hover:bg-gray-50/80 transition-colors">
              <button
                onClick={() => handleChangeCredentials("password")}
                className="group inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium text-indigo-700 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 transition-all shadow-sm hover:shadow w-1/2"
              >
                Change Password
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LabManagement;
