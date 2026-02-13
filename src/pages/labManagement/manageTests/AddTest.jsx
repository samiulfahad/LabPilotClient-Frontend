import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, X, FlaskConical, Check, Plus, ChevronDown, ChevronRight, CheckCircle2 } from "lucide-react";
import testService from "../../../api/test";
import Popup from "../../../components/popup";
import InputField from "../../../components/html/InputField";

// Helper: extract a plain string ID from either a plain string or a { $oid } object
const resolveId = (id) => {
  if (!id) return null;
  if (typeof id === "object" && id.$oid) return id.$oid;
  return String(id);
};

// Skeleton components for loading state
const SkeletonTestItem = () => (
  <div className="p-4 bg-white animate-pulse">
    <div className="flex items-center gap-3">
      <div className="w-5 h-5 rounded bg-gray-200"></div>
      <div className="flex-1">
        <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
        <div className="h-3 bg-gray-100 rounded w-1/2"></div>
      </div>
    </div>
  </div>
);

const SkeletonCategory = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
    <div className="px-4 py-3 bg-gradient-to-r from-gray-100 to-gray-50 border-b border-gray-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-300 rounded"></div>
          <div className="h-4 bg-gray-300 rounded w-32"></div>
          <div className="h-5 w-8 bg-gray-200 rounded-full"></div>
        </div>
        <div className="w-4 h-4 bg-gray-300 rounded"></div>
      </div>
    </div>
    <div className="divide-y divide-gray-50">
      {[1, 2, 3].map((i) => (
        <SkeletonTestItem key={i} />
      ))}
    </div>
  </div>
);

const AddTest = ({ existingTests = [], onBack, onSave }) => {
  const navigate = useNavigate();
  const [availableTests, setAvailableTests] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTests, setSelectedTests] = useState({});
  const [expandedCategories, setExpandedCategories] = useState({});
  const [registeredTests, setRegisteredTests] = useState([]);
  const [categories, setCategories] = useState([]);

  // Load all three data sources in parallel on mount.
  useEffect(() => {
    const loadAll = async () => {
      try {
        const [testsRes, catsRes, ownTestsRes] = await Promise.all([
          testService.getTestCatalog(),
          testService.getCategories(),
          existingTests.length === 0 ? testService.getTestList() : Promise.resolve({ data: existingTests }),
        ]);

        setAvailableTests(testsRes.data);
        setCategories(catsRes.data);
        setRegisteredTests(ownTestsRes.data);
        console.log(testsRes.data);

        const expanded = {};
        catsRes.data.forEach((c) => {
          const id = resolveId(c._id);
          if (id) expanded[id] = true;
        });
        expanded["uncategorized"] = true;
        setExpandedCategories(expanded);
      } catch (e) {
        setPopup({ type: "error", message: "Could not load tests" });
      } finally {
        setInitialLoading(false);
      }
    };
    loadAll();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Registered tests use `testId` field to reference a global test's _id
  const existingTestIds = new Set(registeredTests.map((t) => t.testId));

  // Build category map: resolvedId -> name
  const categoryMap = {};
  categories.forEach((c) => {
    const id = resolveId(c._id);
    if (id) categoryMap[id] = c.name;
  });

  // Filter tests
  let filtered = [...availableTests];
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter((t) => t.name.toLowerCase().includes(q));
  }

  // Group by category — resolve categoryId whether it's a string or { $oid }
  const groupedTests = {};
  filtered.forEach((test) => {
    const catKey = resolveId(test.categoryId) || "uncategorized";
    const catName = categoryMap[catKey] || "Uncategorized";
    if (!groupedTests[catKey]) {
      groupedTests[catKey] = { name: catName, tests: [] };
    }
    groupedTests[catKey].tests.push(test);
  });

  const getTestKey = (test) => resolveId(test._id);

  const toggleSelect = (testKey) => {
    if (!testKey) return;
    if (existingTestIds.has(testKey)) return;

    setSelectedTests((prev) => {
      const updated = { ...prev };
      if (updated[testKey]) {
        delete updated[testKey];
      } else {
        const test = availableTests.find((t) => resolveId(t._id) === testKey);
        if (!test) return prev;
        updated[testKey] = { price: "" };
      }
      return updated;
    });
  };

  const updateTestField = (testKey, field, value) => {
    setSelectedTests((prev) => ({
      ...prev,
      [testKey]: { ...prev[testKey], [field]: value },
    }));
  };

  const toggleCategory = (catKey) => {
    setExpandedCategories((prev) => ({ ...prev, [catKey]: !prev[catKey] }));
  };

  const selectedCount = Object.keys(selectedTests).length;

  const handleSave = async () => {
    if (selectedCount === 0) {
      setPopup({ type: "error", message: "Please select at least one test" });
      return;
    }

    const toSave = Object.entries(selectedTests).map(([testKey, config]) => {
      const test = availableTests.find((t) => resolveId(t._id) === testKey);
      return {
        name: test.name,
        testId: testKey,
        categoryId: resolveId(test.categoryId),
        schemaId: test.schemaId ? resolveId(test.schemaId) : null,
        price: parseFloat(config.price) || 0,
      };
    });

    try {
      setLoading(true);
      await Promise.all(toSave.map((t) => testService.addTest(t)));
      if (onSave) {
        onSave(toSave);
      } else {
        setPopup({ type: "success", message: `${toSave.length} test(s) added successfully` });
        setTimeout(() => navigate(-1), 1500);
      }
    } catch (e) {
      setPopup({ type: "error", message: "Could not add tests" });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (onBack) onBack();
    else navigate(-1);
  };

  return (
    <section className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-cyan-50 px-4 py-6">
      {loading && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
        </div>
      )}
      {popup && <Popup type={popup.type} message={popup.message} onClose={() => setPopup(null)} />}

      <div className="max-w-4xl mx-auto" style={{ paddingBottom: selectedCount > 0 ? "88px" : "0" }}>
        {/* ===== RESPONSIVE HEADER ===== */}
        {/* Row 1: Heading + Back button */}
        <div className="flex items-center justify-between mb-2 sm:mb-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Plus className="w-6 h-6 sm:w-7 sm:h-7 text-teal-600" />
              Add Lab Tests
            </h1>
            {/* Subtitle – hidden on desktop (will show below) */}
            <p className="text-sm text-gray-500 mt-0.5 hidden sm:block">Select tests, set price, then save</p>
          </div>

          {/* Back button – always top right */}
          <button
            onClick={handleBack}
            className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white/50 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 flex items-center gap-2 text-sm font-medium shadow-sm hover:shadow shrink-0"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back</span>
          </button>
        </div>

        {/* Row 2: Subtitle – visible only on mobile */}
        <p className="text-sm text-gray-500 mb-4 sm:hidden">Select tests, set price, then save</p>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search available tests..."
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
        <div className="space-y-4">
          {initialLoading ? (
            // Skeleton loading state
            <>
              {[1, 2, 3].map((i) => (
                <SkeletonCategory key={i} />
              ))}
            </>
          ) : Object.keys(groupedTests).length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center border border-gray-100">
              <FlaskConical className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No tests found</p>
            </div>
          ) : (
            Object.entries(groupedTests).map(([catKey, { name: categoryName, tests: catTests }]) => (
              <div key={catKey} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(catKey)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-teal-50 to-cyan-50 border-b border-gray-100 hover:from-teal-100 hover:to-cyan-100 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <FlaskConical className="w-4 h-4 text-teal-600" />
                    <span className="font-semibold text-gray-800 text-sm">{categoryName}</span>
                    <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-200">
                      {catTests.length}
                    </span>
                  </div>
                  {expandedCategories[catKey] ? (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  )}
                </button>

                {/* Tests */}
                {expandedCategories[catKey] && (
                  <div className="divide-y divide-gray-50">
                    {catTests.map((test, index) => {
                      const testKey = getTestKey(test);
                      const isAlreadyAdded = existingTestIds.has(testKey);
                      const isSelected = !!selectedTests[testKey];

                      return (
                        <div
                          key={testKey || `test-${catKey}-${index}`}
                          onClick={() => !isAlreadyAdded && toggleSelect(testKey)}
                          className={`p-4 transition-all ${
                            isAlreadyAdded
                              ? "bg-gray-50 opacity-70 cursor-not-allowed"
                              : isSelected
                                ? "bg-teal-50 cursor-pointer"
                                : "hover:bg-gray-50 cursor-pointer"
                          }`}
                        >
                          <div className="flex items-start sm:items-center gap-3">
                            {/* Checkbox */}
                            <div className="flex-shrink-0 mt-0.5 sm:mt-0">
                              {isAlreadyAdded ? (
                                <div className="w-5 h-5 rounded-full bg-green-100 border-2 border-green-400 flex items-center justify-center">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                                </div>
                              ) : (
                                <div
                                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                    isSelected ? "bg-teal-600 border-teal-600" : "border-gray-300 bg-white"
                                  }`}
                                >
                                  {isSelected && <Check className="w-3 h-3 text-white" />}
                                </div>
                              )}
                            </div>

                            {/* Right side: name row + price */}
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
                                {/* Name & badges */}
                                <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
                                  <span className="font-semibold text-gray-800 text-sm">{test.name}</span>
                                  {!testKey && (
                                    <span className="text-xs font-medium text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                                      Missing ID
                                    </span>
                                  )}
                                  {isAlreadyAdded && (
                                    <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                                      Already registered
                                    </span>
                                  )}
                                </div>

                                {/* Price – only when selected */}
                                {isSelected && !isAlreadyAdded && (
                                  <div
                                    className="mt-2 sm:mt-0 sm:flex-shrink-0 sm:w-48"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <InputField
                                      label="Price"
                                      name="price"
                                      type="number"
                                      value={selectedTests[testKey]?.price ?? ""}
                                      onChange={(e) => updateTestField(testKey, "price", e.target.value)}
                                      placeholder="0"
                                      min="0"
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Sticky Bottom Save Bar */}
      {selectedCount > 0 && (
        <div className="fixed bottom-0 left-0 lg:left-64 right-0 z-20 border-t border-gray-200 px-4 sm:px-6 lg:px-8 py-4 bg-white shadow-lg">
          <div className="flex gap-3 max-w-4xl mx-auto">
            <button
              type="button"
              onClick={handleBack}
              className="flex-1 py-2.5 px-4 rounded-lg font-medium transition-all text-sm bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 py-2.5 px-4 rounded-lg font-medium transition-all text-sm bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white shadow-sm hover:shadow"
            >
              Save {selectedCount} Test{selectedCount !== 1 ? "s" : ""}
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default AddTest;
