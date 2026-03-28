import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Search,
  X,
  FlaskConical,
  Filter,
  RotateCcw,
  Activity,
  Wifi,
  WifiOff,
  CheckCircle,
  ArrowLeft,
} from "lucide-react";
import Modal from "../../../components/modal";
import Popup from "../../../components/popup";
import Test from "./Test";
import TestConfigModal from "./TestConfigModal";
import testService from "../../../api/test";
import LoadingScreen from "../../../components/loadingPage";

const UNCATEGORIZED_ID = "uncategorized";
const STATUS_FILTERS = ["all", "online", "offline"];
const getErrorStatus = (error) => error?.response?.status ?? error?.status ?? null;

const SkeletonTest = () => (
  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className="h-5 bg-gray-200 rounded w-1/3 mb-2" />
        <div className="h-4 bg-gray-100 rounded w-1/4" />
      </div>
      <div className="flex gap-2">
        <div className="h-9 w-20 bg-gray-200 rounded-lg" />
        <div className="h-9 w-20 bg-gray-200 rounded-lg" />
      </div>
    </div>
  </div>
);

const StatCard = ({ icon: Icon, iconBg, iconColor, label, value, loading }) => (
  <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
    <div className="flex items-center gap-2">
      <div className={`p-2 ${iconBg} rounded-lg`}>
        <Icon className={`w-6 h-6 ${iconColor}`} />
      </div>
      <div>
        <p className="text-xs text-gray-600 font-medium">{label}</p>
        {loading ? (
          <div className="h-8 w-12 bg-gray-200 rounded animate-pulse" />
        ) : (
          <p className={`text-2xl font-bold ${iconColor}`}>{value}</p>
        )}
      </div>
    </div>
  </div>
);

const ManageTests = () => {
  const [tests, setTests] = useState([]);
  const [categories, setCategories] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState(null);
  const [configTest, setConfigTest] = useState(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const load = async () => {
      try {
        const [testsRes, catsRes] = await Promise.all([testService.getTestList(), testService.getCategories()]);
        setTests(Array.isArray(testsRes?.data) ? testsRes.data : []);
        setCategories(Array.isArray(catsRes?.data) ? catsRes.data : []);
      } catch (e) {
        setTests([]);
        setCategories([]);
        setPopup(
          getErrorStatus(e) === 404
            ? { type: "error", message: "No lab tests found. Please add some tests." }
            : { type: "error", message: "Could not load lab tests. Please try again." },
        );
      } finally {
        setInitialLoading(false);
      }
    };
    load();
  }, []);

  // Derived: category map
  const categoryMap = {};
  categories.forEach((c) => {
    if (c._id) categoryMap[c._id] = c.name;
  });

  // Derived: enriched tests
  const enrichedTests = tests.map((t) => ({
    ...t,
    categoryId: t.categoryId || UNCATEGORIZED_ID,
    categoryName: t.categoryId && categoryMap[t.categoryId] ? categoryMap[t.categoryId] : "Uncategorized",
    isOnline: !!t.schemaId,
  }));

  // Derived: stats
  const total = enrichedTests.length;
  const online = enrichedTests.filter((t) => t.isOnline).length;
  const offline = total - online;
  const categoryCount = new Set(enrichedTests.map((t) => t.categoryId)).size;

  // Derived: filtered + grouped
  const q = searchQuery.trim().toLowerCase();
  const filtered = enrichedTests
    .filter((t) => (statusFilter === "online" ? t.isOnline : statusFilter === "offline" ? !t.isOnline : true))
    .filter((t) => !q || t.name.toLowerCase().includes(q));

  const groupsMap = {};
  filtered.forEach((test) => {
    if (!groupsMap[test.categoryId]) {
      groupsMap[test.categoryId] = { categoryId: test.categoryId, categoryName: test.categoryName, tests: [] };
    }
    groupsMap[test.categoryId].tests.push(test);
  });

  const groups = Object.values(groupsMap).sort((a, b) => {
    if (a.categoryName === "Uncategorized") return 1;
    if (b.categoryName === "Uncategorized") return -1;
    return a.categoryName.localeCompare(b.categoryName);
  });

  // Handlers
  const handleDelete = async () => {
    const { testId, _id } = popup;
    setLoading(true);
    setPopup(null);
    try {
      await testService.deleteTest(testId);
      setTests((prev) => prev.filter((t) => t._id !== _id));
      setTimeout(() => setPopup({ type: "success", message: "Test deleted successfully" }), 250);
    } catch (e) {
      if (getErrorStatus(e) === 404) {
        setTests((prev) => prev.filter((t) => t._id !== _id));
        setTimeout(() => setPopup({ type: "error", message: "Test was already deleted." }), 250);
      } else {
        setTimeout(() => setPopup({ type: "error", message: "Could not delete test. Please try again." }), 250);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConfigSave = async (updatedTest) => {
    setLoading(true);
    try {
      await testService.editTest({
        testId: updatedTest._id,
        price: updatedTest.price,
        schemaId: updatedTest.schemaId,
      });
      setTests((prev) => prev.map((t) => (t._id === updatedTest._id ? { ...t, ...updatedTest } : t)));
      setIsConfigOpen(false);
      setTimeout(() => setPopup({ type: "success", message: "Test configuration saved" }), 250);
    } catch (e) {
      if (getErrorStatus(e) === 404) {
        setTests((prev) => prev.filter((t) => t._id !== updatedTest._id));
        setIsConfigOpen(false);
        setTimeout(() => setPopup({ type: "error", message: "Test no longer exists and has been removed." }), 250);
      } else {
        setTimeout(() => setPopup({ type: "error", message: "Could not save configuration. Please try again." }), 250);
      }
    } finally {
      setLoading(false);
    }
  };

  const openConfig = (item) => {
    setConfigTest(item);
    setIsConfigOpen(true);
  };
  const closeConfig = () => setIsConfigOpen(false);
  const isFiltered = searchQuery || statusFilter !== "all";

  return (
    <section className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-cyan-50 px-4 py-6">
      {loading && <LoadingScreen />}

      {popup && (
        <Popup
          type={popup.type}
          message={popup.message}
          onClose={() => setPopup(null)}
          onConfirm={popup.action === "delete" ? handleDelete : undefined}
        />
      )}

      <Modal isOpen={isConfigOpen} size="lg" onClose={closeConfig}>
        {configTest && <TestConfigModal test={configTest} onClose={closeConfig} onSave={handleConfigSave} />}
      </Modal>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-2 sm:mb-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <FlaskConical className="w-7 h-7 sm:w-8 sm:h-8 text-teal-600" />
              Lab Test Management
            </h1>
            <p className="text-sm text-gray-600 mt-1 hidden sm:flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-teal-500" />
              Manage lab tests, pricing &amp; formats
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/lab-management"
              className="flex items-center gap-2 px-2 md:px-4 py-2.5 rounded-xl text-sm font-medium
                border border-gray-200 bg-white/50 text-gray-700
                hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-sm hover:shadow"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </Link>
            <Link
              to="/test/add"
              className="hidden sm:flex items-center gap-2 py-2.5 px-5 rounded-xl text-sm sm:text-base font-semibold
                bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700
                text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Plus className="w-5 h-5" />
              Add Test
            </Link>
          </div>
        </div>

        {/* Mobile subtitle + add button */}
        <div className="flex flex-col gap-3 sm:hidden mb-6">
          <p className="text-sm text-gray-600 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-teal-500" />
            Manage lab tests, pricing &amp; formats
          </p>
          <Link
            to="/test/add"
            className="w-full flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl text-sm font-semibold
              bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700
              text-white shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Plus className="w-5 h-5" />
            Add Test
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={FlaskConical}
            iconBg="bg-teal-50"
            iconColor="text-teal-600"
            label="Total Tests"
            value={total}
            loading={initialLoading}
          />
          <StatCard
            icon={Wifi}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
            label="Online"
            value={online}
            loading={initialLoading}
          />
          <StatCard
            icon={WifiOff}
            iconBg="bg-orange-50"
            iconColor="text-orange-600"
            label="Offline"
            value={offline}
            loading={initialLoading}
          />
          <StatCard
            icon={CheckCircle}
            iconBg="bg-purple-50"
            iconColor="text-purple-600"
            label="Categories"
            value={categoryCount}
            loading={initialLoading}
          />
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
                {STATUS_FILTERS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    disabled={initialLoading}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all capitalize
                      disabled:opacity-50 disabled:cursor-not-allowed
                      ${statusFilter === s ? "bg-white text-teal-600 shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            {statusFilter !== "all" && (
              <button
                onClick={() => setStatusFilter("all")}
                disabled={initialLoading}
                className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                  text-gray-500 hover:text-teal-600 hover:bg-teal-50 transition-colors
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search tests by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={initialLoading}
              className="w-full pl-11 pr-11 py-2.5 text-sm border border-gray-200 rounded-lg outline-none
                focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all
                placeholder-gray-400 disabled:bg-gray-50 disabled:cursor-not-allowed"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                disabled={initialLoading}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-gray-400
                  hover:text-gray-600 hover:bg-gray-100 transition-colors
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Test list */}
        {initialLoading ? (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-7 w-32 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full animate-pulse" />
                <div className="flex-1 h-px bg-gray-200" />
                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <SkeletonTest key={i} />
                ))}
              </div>
            </div>
          </div>
        ) : groups.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="bg-gradient-to-br from-teal-50 to-cyan-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <FlaskConical className="w-8 h-8 text-teal-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {isFiltered ? "No tests found" : "No tests yet"}
            </h3>
            <p className="text-gray-500 text-sm mb-4 max-w-md mx-auto">
              {isFiltered
                ? "Try adjusting your filters or search criteria"
                : "Get started by adding your first lab test"}
            </p>
            {!isFiltered && (
              <Link
                to="/test/add"
                className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-medium py-2.5 px-5 rounded-lg shadow-sm hover:shadow transition-all"
              >
                <Plus className="w-4 h-4" />
                Add Your First Test
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {groups.map((group) => (
              <div key={group.categoryId}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center gap-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white px-4 py-1.5 rounded-full text-sm font-semibold shadow-sm">
                    <FlaskConical className="w-3.5 h-3.5" />
                    {group.categoryName}
                  </div>
                  <div className="flex-1 h-px bg-gradient-to-r from-teal-200 to-transparent" />
                  <span className="text-xs text-gray-500 font-medium">
                    {group.tests.length} test{group.tests.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="space-y-3">
                  {group.tests.map((item) => (
                    <Test
                      key={item._id}
                      input={item}
                      onConfigure={() => openConfig(item)}
                      onDelete={() =>
                        setPopup({
                          type: "warning",
                          message: `Are you sure you want to delete "${item.name}"?`,
                          action: "delete",
                          _id: item._id,
                          testId: item._id, // ✅ fixed: was item.testId (catalog ref), backend expects mongo _id
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

export default ManageTests;
