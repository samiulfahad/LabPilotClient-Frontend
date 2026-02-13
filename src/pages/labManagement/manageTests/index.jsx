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

// Helper: extract plain string ID from either a string or { $oid } object
const resolveId = (id) => {
  if (!id) return null;
  if (typeof id === "object" && id.$oid) return id.$oid;
  return String(id);
};

const UNCATEGORIZED_ID = "uncategorized";

// Skeleton component for loading state
const SkeletonTest = () => (
  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className="h-5 bg-gray-200 rounded w-1/3 mb-2"></div>
        <div className="h-4 bg-gray-100 rounded w-1/4"></div>
      </div>
      <div className="flex gap-2">
        <div className="h-9 w-20 bg-gray-200 rounded-lg"></div>
        <div className="h-9 w-20 bg-gray-200 rounded-lg"></div>
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

  // Utility to extract HTTP status from error
  const getErrorStatus = (error) => error?.response?.status || error?.status || null;

  // --- Initial data load ---
  useEffect(() => {
    const loadAll = async () => {
      try {
        const [testsRes, catsRes] = await Promise.all([testService.getTestList(), testService.getCategoryList()]);

        // Ensure we always have arrays, even if the API returns something unexpected
        setTests(Array.isArray(testsRes?.data) ? testsRes.data : []);
        setCategories(Array.isArray(catsRes?.data) ? catsRes.data : []);

        console.log(testsRes);
      } catch (e) {
        const status = getErrorStatus(e);
        if (status === 404) {
          setPopup({
            type: "info",
            message: "No lab tests or categories found. Please add some tests.",
          });
          setTests([]);
          setCategories([]);
        } else {
          setPopup({ type: "error", message: "Could not load lab tests. Please try again." });
          // Set empty arrays on error to prevent forEach errors
          setTests([]);
          setCategories([]);
        }
      } finally {
        setInitialLoading(false);
      }
    };
    loadAll();
  }, []);

  // --- Build category map ---
  const categoryMap = {};
  // Ensure categories is an array before using forEach
  if (Array.isArray(categories)) {
    categories.forEach((c) => {
      const id = resolveId(c._id);
      if (id) categoryMap[id] = c.name;
    });
  }

  // --- Enrich tests with categoryId, categoryName, isOnline ---
  // Ensure tests is an array before using map
  const enrichedTests = Array.isArray(tests)
    ? tests.map((t) => {
        const rawId = resolveId(t.categoryId);
        const categoryId = rawId || UNCATEGORIZED_ID;
        const categoryName = rawId && categoryMap[rawId] ? categoryMap[rawId] : "Uncategorized";
        return {
          ...t,
          categoryId,
          categoryName,
          isOnline: !!t.schemaId,
        };
      })
    : [];

  // --- Stats ---
  const total = enrichedTests.length;
  const online = enrichedTests.filter((t) => t.isOnline).length;
  const offline = total - online;
  const categoryCount = new Set(enrichedTests.map((t) => t.categoryId)).size;

  // --- Filtering ---
  let filtered = [...enrichedTests];
  if (statusFilter === "online") filtered = filtered.filter((t) => t.isOnline === true);
  else if (statusFilter === "offline") filtered = filtered.filter((t) => t.isOnline === false);
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter((t) => t.name.toLowerCase().includes(q));
  }

  // --- Group by categoryId (stable grouping) ---
  const groupsMap = {};
  filtered.forEach((test) => {
    const catId = test.categoryId;
    if (!groupsMap[catId]) {
      groupsMap[catId] = {
        categoryId: catId,
        categoryName: test.categoryName,
        tests: [],
      };
    }
    groupsMap[catId].tests.push(test);
  });

  const groups = Object.values(groupsMap).sort((a, b) => {
    if (a.categoryName === "Uncategorized") return 1;
    if (b.categoryName === "Uncategorized") return -1;
    return a.categoryName.localeCompare(b.categoryName);
  });

  // --- Delete handler (uses testId) ---
  const handleDelete = async () => {
    const { testId, _id } = popup;

    try {
      setLoading(true);
      setPopup(null);

      await testService.deleteTest(testId);
      setTests((prev) => prev.filter((t) => t._id !== _id));

      setTimeout(() => {
        setPopup({ type: "success", message: "Test deleted successfully" });
      }, 250);
    } catch (e) {
      const status = getErrorStatus(e);
      setPopup(null);

      if (status === 404) {
        setTests((prev) => prev.filter((t) => t._id !== _id));
        setTimeout(() => {
          setPopup({
            type: "info",
            message: "This test was already deleted or does not exist.",
          });
        }, 250);
      } else {
        setTimeout(() => {
          setPopup({ type: "error", message: "Could not delete test. Please try again." });
        }, 250);
      }
    } finally {
      setLoading(false);
    }
  };

  // --- Edit handler ---
  const handleConfigSave = async (updatedTest) => {
    try {
      setLoading(true);
      await testService.editTest(updatedTest);
      setTests((prev) => prev.map((t) => (t._id === updatedTest._id ? { ...t, ...updatedTest } : t)));
      setIsConfigOpen(false);
      setTimeout(() => {
        setPopup({ type: "success", message: "Test configuration saved" });
      }, 250);
    } catch (e) {
      const status = getErrorStatus(e);
      if (status === 404) {
        setTests((prev) => prev.filter((t) => t._id !== updatedTest._id));
        setIsConfigOpen(false);
        setTimeout(() => {
          setPopup({
            type: "info",
            message: "This test no longer exists. It has been removed from the list.",
          });
        }, 250);
      } else {
        setTimeout(() => {
          setPopup({ type: "error", message: "Could not save configuration. Please try again." });
        }, 250);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-cyan-50 px-4 py-6">
      {loading && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
        </div>
      )}

      {popup && (
        <Popup
          type={popup.type}
          message={popup.message}
          onClose={() => setPopup(null)}
          onConfirm={popup.type === "warning" && popup.action === "delete" ? handleDelete : null}
        />
      )}

      <Modal isOpen={isConfigOpen} size="lg" onClose={() => setIsConfigOpen(false)}>
        {configTest && (
          <TestConfigModal test={configTest} onClose={() => setIsConfigOpen(false)} onSave={handleConfigSave} />
        )}
      </Modal>

      <div className="max-w-7xl mx-auto">
        {/* ===== RESPONSIVE HEADER ===== */}
        <div className="flex items-center justify-between mb-2 sm:mb-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <FlaskConical className="w-7 h-7 sm:w-8 sm:h-8 text-teal-600" />
              Lab Test Management
            </h1>
            <p className="text-sm text-gray-600 mt-1 hidden sm:flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-teal-500" />
              Manage lab tests, pricing & formats
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/lab-management"
              className="px-2 md:px-4 py-2.5 rounded-xl border border-gray-200 bg-white/50 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 flex items-center gap-2 text-sm font-medium shadow-sm hover:shadow"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back</span>
            </Link>

            <Link
              to="/test/add"
              className="hidden sm:flex bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-semibold py-2.5 px-5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 items-center justify-center gap-2 text-sm sm:text-base"
            >
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
              <span>Add Test</span>
            </Link>
          </div>
        </div>

        {/* Mobile-only row */}
        <div className="flex flex-col gap-3 sm:hidden mb-6">
          <p className="text-sm text-gray-600 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-teal-500" />
            Manage lab tests, pricing & formats
          </p>
          <Link
            to="/test/add"
            className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-semibold py-2.5 px-5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 text-sm"
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
                {initialLoading ? (
                  <div className="h-8 w-12 bg-gray-200 rounded animate-pulse"></div>
                ) : (
                  <p className="text-2xl font-bold text-gray-900">{total}</p>
                )}
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
                {initialLoading ? (
                  <div className="h-8 w-12 bg-gray-200 rounded animate-pulse"></div>
                ) : (
                  <p className="text-2xl font-bold text-blue-600">{online}</p>
                )}
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
                {initialLoading ? (
                  <div className="h-8 w-12 bg-gray-200 rounded animate-pulse"></div>
                ) : (
                  <p className="text-2xl font-bold text-orange-600">{offline}</p>
                )}
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
                {initialLoading ? (
                  <div className="h-8 w-12 bg-gray-200 rounded animate-pulse"></div>
                ) : (
                  <p className="text-2xl font-bold text-purple-600">{categoryCount}</p>
                )}
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
                    disabled={initialLoading}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all capitalize ${
                      statusFilter === s ? "bg-white text-teal-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
                    } ${initialLoading ? "opacity-50 cursor-not-allowed" : ""}`}
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
                className="ml-auto text-xs text-gray-500 hover:text-teal-600 flex items-center gap-1.5 transition-colors font-medium px-3 py-1.5 hover:bg-teal-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
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
              disabled={initialLoading}
              className="w-full pl-11 pr-11 py-2.5 text-sm border border-gray-200 rounded-lg focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all placeholder-gray-400 disabled:bg-gray-50 disabled:cursor-not-allowed"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                disabled={initialLoading}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Category-wise Test List */}
        {initialLoading ? (
          <div className="space-y-6">
            {/* Skeleton loading state */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-7 w-32 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full animate-pulse"></div>
                <div className="flex-1 h-px bg-gray-200" />
                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
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
              {searchQuery || statusFilter !== "all" ? "No tests found" : "No tests yet"}
            </h3>
            <p className="text-gray-500 text-sm mb-4 max-w-md mx-auto">
              {searchQuery || statusFilter !== "all"
                ? "Try adjusting your filters or search criteria"
                : "Get started by adding your first lab test"}
            </p>
            {!searchQuery && statusFilter === "all" && (
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
                          testId: item.testId,
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
