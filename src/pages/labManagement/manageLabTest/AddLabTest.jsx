import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  X,
  FlaskConical,
  Check,
  DollarSign,
  Wifi,
  WifiOff,
  Plus,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import labTestService from "../../../api/labTest";
import LoadingScreen from "../../../components/loadingPage";
import Popup from "../../../components/popup";

const AddLabTest = ({ existingTests = [], onBack, onSave }) => {
  const navigate = useNavigate();
  const [availableTests, setAvailableTests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTests, setSelectedTests] = useState({});
  const [expandedCategories, setExpandedCategories] = useState({});
  const [registeredTests, setRegisteredTests] = useState([]);

  // Fetch registered tests if not provided via props
  useEffect(() => {
    const fetchRegisteredTests = async () => {
      if (existingTests.length === 0) {
        try {
          const response = await labTestService.getTestList();
          setRegisteredTests(response.data);
        } catch (e) {
          console.error("Could not load registered tests", e);
        }
      } else {
        setRegisteredTests(existingTests);
      }
    };
    fetchRegisteredTests();
  }, [existingTests]);

  const existingIds = new Set(registeredTests.map((t) => t._id));

  const loadData = async () => {
    try {
      setLoading(true);
      const [testsRes, catsRes] = await Promise.all([
        labTestService.getGlobalTestList(),
        labTestService.getCategoryList(),
      ]);

      // Build category name map
      const catMap = {};
      catsRes.data.forEach((c) => {
        catMap[c._id] = c.name;
      });

      // Merge category name into each test
      const merged = testsRes.data.map((t) => ({
        ...t,
        categoryName: catMap[t.categoryId] || "Uncategorized",
      }));

      setAvailableTests(merged);

      // Expand all categories by default
      const expanded = {};
      catsRes.data.forEach((c) => (expanded[c.name] = true));
      expanded["Uncategorized"] = true;
      setExpandedCategories(expanded);
    } catch (e) {
      setPopup({ type: "error", message: "Could not load tests" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtering inline — React Compiler handles this
  let filtered = [...availableTests];
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

  const toggleSelect = (testId) => {
    if (existingIds.has(testId)) return;
    setSelectedTests((prev) => {
      const updated = { ...prev };
      if (updated[testId]) {
        delete updated[testId];
      } else {
        const test = availableTests.find((t) => t._id === testId);
        updated[testId] = { price: "", isOnline: !!test?.schemaId };
      }
      return updated;
    });
  };

  const updateTestField = (testId, field, value) => {
    setSelectedTests((prev) => ({
      ...prev,
      [testId]: { ...prev[testId], [field]: value },
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

    const toSave = Object.entries(selectedTests).map(([id, config]) => {
      const test = availableTests.find((t) => t._id === id);
      return {
        ...test,
        price: parseFloat(config.price) || 0,
        isOnline: config.isOnline,
      };
    });

    try {
      setLoading(true);
      // Add each test via API
      await Promise.all(toSave.map((t) => labTestService.addLabTest(t)));

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
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <section className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-cyan-50 px-4 py-6">
      {loading && <LoadingScreen />}
      {popup && <Popup type={popup.type} message={popup.message} onClose={() => setPopup(null)} />}

      <div className="max-w-4xl mx-auto" style={{ paddingBottom: selectedCount > 0 ? "88px" : "0" }}>
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={handleBack}
            className="p-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl shadow-sm transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Plus className="w-6 h-6 text-teal-600" />
              Add Lab Tests
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">Select tests, set price & mode, then save</p>
          </div>
          {selectedCount > 0 && (
            <button
              onClick={handleSave}
              className="hidden sm:flex bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-semibold py-2.5 px-5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 items-center gap-2 text-sm"
            >
              <Check className="w-4 h-4" />
              Save {selectedCount} Test{selectedCount !== 1 ? "s" : ""}
            </button>
          )}
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search available tests..."
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
        <div className="space-y-4">
          {Object.keys(groupedTests).length === 0 && !loading ? (
            <div className="bg-white rounded-xl p-8 text-center border border-gray-100">
              <FlaskConical className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No tests found</p>
            </div>
          ) : (
            Object.entries(groupedTests).map(([categoryName, catTests]) => (
              <div key={categoryName} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(categoryName)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-teal-50 to-cyan-50 border-b border-gray-100 hover:from-teal-100 hover:to-cyan-100 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <FlaskConical className="w-4 h-4 text-teal-600" />
                    <span className="font-semibold text-gray-800 text-sm">{categoryName}</span>
                    <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-200">
                      {catTests.length}
                    </span>
                  </div>
                  {expandedCategories[categoryName] ? (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  )}
                </button>

                {/* Tests */}
                {expandedCategories[categoryName] && (
                  <div className="divide-y divide-gray-50">
                    {catTests.map((test) => {
                      const isAlreadyAdded = existingIds.has(test._id);
                      const isSelected = !!selectedTests[test._id];

                      return (
                        <div
                          key={test._id}
                          className={`p-4 transition-all ${
                            isAlreadyAdded
                              ? "bg-gray-50 opacity-70"
                              : isSelected
                                ? "bg-teal-50"
                                : "hover:bg-gray-50 cursor-pointer"
                          }`}
                          onClick={() => !isAlreadyAdded && toggleSelect(test._id)}
                        >
                          <div className="flex items-start gap-3">
                            {/* Checkbox */}
                            <div className="mt-0.5 flex-shrink-0">
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

                            {/* Test Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-gray-800 text-sm">{test.name}</span>
                                {isAlreadyAdded && (
                                  <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                                    Already registered
                                  </span>
                                )}
                                {!isAlreadyAdded && test.schemaId && (
                                  <span className="text-xs text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full font-medium">
                                    Has schema
                                  </span>
                                )}
                              </div>

                              {/* Config fields — inline when selected */}
                              {isSelected && !isAlreadyAdded && (
                                <div
                                  className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {/* Price */}
                                  <div>
                                    <label className="text-xs font-medium text-gray-600 mb-1.5 block">Price (৳)</label>
                                    <div className="relative">
                                      <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                      <input
                                        type="number"
                                        value={selectedTests[test._id]?.price ?? ""}
                                        onChange={(e) => updateTestField(test._id, "price", e.target.value)}
                                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none text-sm"
                                        placeholder="Enter price"
                                        min="0"
                                      />
                                    </div>
                                  </div>

                                  {/* Mode Display */}
                                  <div>
                                    <label className="text-xs font-medium text-gray-600 mb-1.5 block">Mode</label>
                                    <div
                                      className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border-2 ${
                                        selectedTests[test._id]?.isOnline
                                          ? "bg-blue-50 border-blue-200"
                                          : "bg-orange-50 border-orange-200"
                                      }`}
                                    >
                                      {selectedTests[test._id]?.isOnline ? (
                                        <>
                                          <Wifi className="w-4 h-4 text-blue-600" />
                                          <span className="text-sm font-medium text-blue-700">Online</span>
                                        </>
                                      ) : (
                                        <>
                                          <WifiOff className="w-4 h-4 text-orange-600" />
                                          <span className="text-sm font-medium text-orange-700">Offline</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
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

export default AddLabTest;
