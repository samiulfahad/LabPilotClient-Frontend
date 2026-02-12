import Icons from "../../components/icons";
import { Link } from "react-router-dom";
import { Settings, ChevronRight } from "lucide-react";

const LabManagement = () => {
  const handleChangeCredentials = () => {
    alert("Opening change password/email modal...");
    // In a real app, this would open a modal or navigate to settings
  };

  const cards = [
    {
      title: "Manage Test List",
      description: "টেস্ট লিস্ট, নতুন টেস্ট Add করা, টেস্টের মূল্য ইত্যাদি",
      icon: Icons.TestList,
      color: "blue",
      gradient: "from-blue-500 to-blue-600",
      bgGradient: "from-blue-50 to-blue-100",
      link: "/manage-testList",
    },
    {
      title: "Non-Test Items",
      description: "টেস্ট ব্যতীত অন্যান্য সেবা ও পণ্যের নাম, তালিকা, মূল্য ইত্যাদি",
      icon: Icons.NonTestItems,
      color: "amber",
      gradient: "from-amber-500 to-amber-600",
      bgGradient: "from-amber-50 to-amber-100",
      link: null,
    },
    {
      title: "Manage Staff",
      description: "আপনার প্রতিষ্ঠানে কর্মরত ব্যক্তিদের Account, তাদের Access Management ইত্যাদি",
      icon: Icons.Staff,
      color: "emerald",
      gradient: "from-emerald-500 to-emerald-600",
      bgGradient: "from-emerald-50 to-emerald-100",
      link: "/manage-staffs",
    },
    {
      title: "Manage Referrers",
      description: "Referrer List, Add, Edit, Delete",
      icon: Icons.Referrers,
      color: "purple",
      gradient: "from-purple-500 to-purple-600",
      bgGradient: "from-purple-50 to-purple-100",
      link: "/manage-referrers",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header Section */}
        <div className="mb-8 sm:mb-12">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <Settings className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Lab Management</h1>
              <p className="text-sm text-gray-600 mt-1">Manage your laboratory operations efficiently</p>
            </div>
          </div>
        </div>

        {/* Management Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5 sm:gap-6 mb-6">
          {cards.map((card, index) => {
            const CardContent = (
              <div className="group relative bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-gray-100 overflow-hidden h-full">
                {/* Gradient Accent */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${card.gradient}`} />

                <div className="p-6 sm:p-7">
                  {/* Icon and Title */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-3.5 bg-gradient-to-br ${card.bgGradient} rounded-xl group-hover:scale-110 transition-transform duration-300 shadow-sm`}
                      >
                        <card.icon className={`w-7 h-7 text-${card.color}-600`} />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900 group-hover:text-gray-700 transition-colors">
                          {card.title}
                        </h2>
                      </div>
                    </div>
                    <ChevronRight
                      className={`w-5 h-5 text-${card.color}-500 group-hover:translate-x-1 transition-transform opacity-0 group-hover:opacity-100`}
                    />
                  </div>

                  {/* Description */}
                  <p className="text-gray-600 leading-relaxed mb-4 min-h-[3rem]">{card.description}</p>

                  {/* Action Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span
                      className={`text-sm font-semibold text-${card.color}-600 group-hover:text-${card.color}-700 transition-colors flex items-center gap-1.5`}
                    >
                      Click to manage
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </div>
            );

            return card.link ? (
              <Link key={index} to={card.link} className="block h-full">
                {CardContent}
              </Link>
            ) : (
              <div key={index} className="cursor-pointer h-full">
                {CardContent}
              </div>
            );
          })}
        </div>

        {/* Account Security Card - Full Width Highlight */}
        <div
          onClick={handleChangeCredentials}
          className="group relative bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-700 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden"
        >
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24" />

          <div className="relative p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="p-4 bg-white/20 backdrop-blur-sm rounded-xl group-hover:bg-white/30 transition-all shadow-lg">
                  <Icons.AccountSecurity className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                    Account Security
                    <span className="px-2.5 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold">
                      Important
                    </span>
                  </h2>
                  <p className="text-blue-100 text-sm sm:text-base">
                    Update your password and email to keep your account secure
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-white font-semibold group-hover:gap-3 transition-all">
                <span className="text-sm sm:text-base">Update credentials</span>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LabManagement;
