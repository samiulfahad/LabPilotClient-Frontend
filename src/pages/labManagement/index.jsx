import Icons from "../../components/icons"; // Adjust the import path as needed

const LabManagement = () => {
  const handleCardClick = (section) => {
    // In a real app, this would use react-router or navigation
    alert(`Navigating to ${section} section...`);
    // Example: navigate(`/${section.toLowerCase().replace(/\s+/g, '-')}`);
  };

  const handleChangeCredentials = () => {
    alert("Opening change password/email modal...");
    // In a real app, this would open a modal or navigate to settings
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-8">
      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {/* Manage Test List Card */}
        <div
          onClick={() => handleCardClick("Manage Test List")}
          className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer border border-gray-100 overflow-hidden"
        >
          <div className="p-6">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-blue-100 rounded-xl mr-4 group-hover:bg-blue-200 transition-colors">
                <Icons.TestList className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Manage Test List</h2>
            </div>
            <p className="text-gray-600 mb-4">টেস্ট লিস্ট, নতুন টেস্ট Add করা, টেস্টের মূল্য ইত্যাদি </p>
            <div className="flex justify-between items-center">
              <span className="text-sm text-blue-600 font-medium group-hover:text-blue-800">Click to manage →</span>
            </div>
          </div>
        </div>

        {/* Manage Not Test Item List Card */}
        <div
          onClick={() => handleCardClick("Manage Not Test Item List")}
          className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer border border-gray-100 overflow-hidden"
        >
          <div className="p-6">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-amber-100 rounded-xl mr-4 group-hover:bg-amber-200 transition-colors">
                <Icons.NonTestItems className="w-8 h-8 text-amber-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Non-Test Items</h2>
            </div>
            <p className="text-gray-600 mb-4">টেস্ট ব্যতীত অন্যান্য সেবা ও পণ্যের নাম, তালিকা, মূল্য ইত্যাদি</p>
            <div className="flex justify-between items-center">
              <span className="text-sm text-amber-600 font-medium group-hover:text-amber-800">Click to manage →</span>
            </div>
          </div>
        </div>

        {/* Manage Staffs Card */}
        <div
          onClick={() => handleCardClick("Manage Staffs")}
          className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer border border-gray-100 overflow-hidden"
        >
          <div className="p-6">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-emerald-100 rounded-xl mr-4 group-hover:bg-emerald-200 transition-colors">
                <Icons.Staff className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Manage Staff</h2>
            </div>
            <p className="text-gray-600 mb-4">আপনার প্রতিষ্ঠানের কর্মরত ব্যক্তিদের Account, তাদের Access Management ইত্যাদি</p>
            <div className="flex justify-between items-center">
              <span className="text-sm text-emerald-600 font-medium group-hover:text-emerald-800">
                Click to manage →
              </span>
            </div>
          </div>
        </div>

        {/* Manage Referrers Card */}
        <div
          onClick={() => handleCardClick("Manage Referrers")}
          className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer border border-gray-100 overflow-hidden"
        >
          <div className="p-6">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-purple-100 rounded-xl mr-4 group-hover:bg-purple-200 transition-colors">
                <Icons.Referrers className="w-8 h-8 text-purple-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Manage Referrers</h2>
            </div>
            <p className="text-gray-600 mb-4">Referrer List, Add, Edit, Delete</p>
            <div className="flex justify-between items-center">
              <span className="text-sm text-purple-600 font-medium group-hover:text-purple-800">Click to manage →</span>
            </div>
          </div>
        </div>

        {/* Account Settings Card */}
        <div
          onClick={handleChangeCredentials}
          className="group bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden col-span-full lg:col-span-1"
        >
          <div className="p-6">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-white/20 rounded-xl mr-4 backdrop-blur-sm">
                <Icons.AccountSecurity className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-white">Account Security</h2>
            </div>
            <p className="text-blue-100 mb-4">Change your password, email</p>
            <div className="flex justify-between items-center">
              <span className="text-sm text-white font-medium group-hover:text-gray-100">Update credentials →</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Note */}
      <div className="mt-12 text-center text-gray-500 text-sm">
        <p>Lab Management System v2.0 • Secure Access Enabled</p>
      </div>
    </div>
  );
};

export default LabManagement;
