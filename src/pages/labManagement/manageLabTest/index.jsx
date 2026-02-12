import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, X, FlaskConical, Filter, RotateCcw, Activity, Wifi, WifiOff, CheckCircle } from "lucide-react";
import Modal from "../../../components/modal";
import Popup from "../../../components/popup";
import LabTest from "./LabTest";
import TestConfigModal from "./TestConfigModal";
import labTestService from "../../../api/labTest";
import LoadingScreen from "../../../components/loadingPage";

const ManageLabTest = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState(null);
  const [configTest, setConfigTest] = useState(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadTests = async () => {
    try {
      setLoading(true);
      const response = await labTestService.getTestList();
      setTests(response.data);
    } catch (e) {
      setPopup({ type: "error", message: "Could not load lab tests" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTests();
  }, []);

  // Stats — React Compiler optimizes these automatically
  const total = tests.length;
  const online = tests.filter((t) => t.isOnline).length;
  const offline = total - online;
  const categoryCount = new Set(tests.map((t) => t.categoryName)).size;

  // Filtering
  let filtered = [...tests];
  if (statusFilter === "online") filtered = filtered.filter((t) => t.isOnline === true);
  else if (statusFilter === "offline") filtered = filtered.filter((t) => t.isOnline === false);
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter((t) => t.name.toLowerCase().includes(q));
  }

  // Group by category
  const groupedTests = {};
  filtered.forEach((test) => {
    const cat = test.categoryName || "Uncategorized";
    if (!groupedTests[cat]) groupedTests[cat] = [];
    groupedTests[cat].push(test);
  });

  const handleDelete = async () => {
    try {
      setLoading(true);
      await labTestService.deleteTest(popup._id);
      setTests((prev) => prev.filter((t) => t._id !== popup._id));
      setPopup({ type: "success", message: "Test deleted successfully" });
    } catch (e) {
      setPopup({ type: "error", message: "Could not delete test" });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (isActivating) => {
    try {
      setLoading(true);
      const serviceCall = isActivating
        ? labTestService.activateTest(popup._id)
        : labTestService.deactivateTest(popup._id);
      await serviceCall;
      setTests((prev) => prev.map((t) => (t._id === popup._id ? { ...t, isActive: isActivating } : t)));
      setPopup({
        type: "success",
        message: `Test ${isActivating ? "activated" : "deactivated"} successfully`,
      });
    } catch (e) {
      setPopup({
        type: "error",
        message: `Could not ${isActivating ? "activate" : "deactivate"} test`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfigSave = async (updatedTest) => {
    try {
      setLoading(true);
      await labTestService.editLabTest(updatedTest);
      setTests((prev) => prev.map((t) => (t._id === updatedTest._id ? { ...t, ...updatedTest } : t)));
      setIsConfigOpen(false);
      setPopup({ type: "success", message: "Test configuration saved" });
    } catch (e) {
      setPopup({ type: "error", message: "Could not save configuration" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-cyan-50 px-4 py-6">
      {loading && <LoadingScreen />}

      {popup && (
        <Popup
          type={popup.type}
          message={popup.message}
          onClose={() => setPopup(null)}
          onConfirm={
            popup.type === "warning" && popup.action === "delete"
              ? handleDelete
              : popup.type === "warning" && popup.action === "deactivate"
                ? () => handleToggleStatus(false)
                : popup.type === "warning" && popup.action === "activate"
                  ? () => handleToggleStatus(true)
                  : null
          }
        />
      )}

      <Modal isOpen={isConfigOpen} size="lg" onClose={() => setIsConfigOpen(false)}>
        {configTest && (
          <TestConfigModal test={configTest} onClose={() => setIsConfigOpen(false)} onSave={handleConfigSave} />
        )}
      </Modal>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <FlaskConical className="w-7 h-7 sm:w-8 sm:h-8 text-teal-600" />
              Lab Test Management
            </h1>
            <p className="text-sm text-gray-600 mt-1 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-teal-500" />
              Manage lab tests, pricing & formats
            </p>
          </div>
          <Link
            to="/add-labTest"
            className="group bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-semibold py-2.5 px-5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
            <span>Add Test</span>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-teal-50 rounded-lg">
                <FlaskConical className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600 font-medium">Total Tests</p>
                <p className="text-2xl font-bold text-gray-900">{total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Wifi className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600 font-medium">Online</p>
                <p className="text-2xl font-bold text-blue-600">{online}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-orange-50 rounded-lg">
                <WifiOff className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600 font-medium">Offline</p>
                <p className="text-2xl font-bold text-orange-600">{offline}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-50 rounded-lg">
                <CheckCircle className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600 font-medium">Categories</p>
                <p className="text-2xl font-bold text-purple-600">{categoryCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-semibold text-gray-700">Filters:</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500">Mode</span>
              <div className="flex rounded-lg bg-gray-100 p-1">
                {["all", "online", "offline"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all capitalize ${
                      statusFilter === s ? "bg-white text-teal-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {statusFilter !== "all" && (
              <button
                onClick={() => setStatusFilter("all")}
                className="ml-auto text-xs text-gray-500 hover:text-teal-600 flex items-center gap-1.5 transition-colors font-medium px-3 py-1.5 hover:bg-teal-50 rounded-lg"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search tests by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-11 py-2.5 text-sm border border-gray-200 rounded-lg focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all placeholder-gray-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-1 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Category-wise Test List */}
        {Object.keys(groupedTests).length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="bg-gradient-to-br from-teal-50 to-cyan-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <FlaskConical className="w-8 h-8 text-teal-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {searchQuery || statusFilter !== "all" ? "No tests found" : "No tests yet"}
            </h3>
            <p className="text-gray-500 text-sm mb-4 max-w-md mx-auto">
              {searchQuery || statusFilter !== "all"
                ? "Try adjusting your filters or search criteria"
                : "Get started by adding your first lab test"}
            </p>
            {!searchQuery && statusFilter === "all" && (
              <Link
                to="/admin/lab-tests/add"
                className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-medium py-2.5 px-5 rounded-lg shadow-sm hover:shadow transition-all"
              >
                <Plus className="w-4 h-4" />
                Add Your First Test
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedTests).map(([category, categoryTests]) => (
              <div key={category}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center gap-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white px-4 py-1.5 rounded-full text-sm font-semibold shadow-sm">
                    <FlaskConical className="w-3.5 h-3.5" />
                    {category}
                  </div>
                  <div className="flex-1 h-px bg-gradient-to-r from-teal-200 to-transparent" />
                  <span className="text-xs text-gray-500 font-medium">
                    {categoryTests.length} test{categoryTests.length !== 1 ? "s" : ""}
                  </span>
                </div>

                <div className="space-y-3">
                  {categoryTests.map((item, index) => (
                    <LabTest
                      key={item._id}
                      input={item}
                      index={index}
                      onConfigure={() => {
                        setConfigTest(item);
                        setIsConfigOpen(true);
                      }}
                      onDelete={() =>
                        setPopup({
                          type: "warning",
                          message: `Are you sure you want to delete "${item.name}"?`,
                          action: "delete",
                          _id: item._id,
                        })
                      }
                      onDeactivate={() =>
                        setPopup({
                          type: "warning",
                          message: `Are you sure you want to deactivate "${item.name}"?`,
                          action: "deactivate",
                          _id: item._id,
                        })
                      }
                      onActivate={() =>
                        setPopup({
                          type: "warning",
                          message: `Are you sure you want to activate "${item.name}"?`,
                          action: "activate",
                          _id: item._id,
                        })
                      }
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ManageLabTest;
