/**
 * useCallback / useMemo are intentionally absent throughout this file.
 * babel-plugin-react-compiler handles all memoization automatically.
 */
import { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  X,
  FlaskConical,
  RotateCcw,
  Wifi,
  WifiOff,
  ArrowLeft,
  Settings,
  Trash2,
  ChevronDown,
  ChevronRight,
  Check,
  CheckCircle2,
  AlertCircle,
  Eye,
  FileText,
  Loader2,
  XCircle,
  AlertTriangle,
  Layers,
} from "lucide-react";
import testService from "../../../api/test";
import Popup from "../../../components/popup";

// ── Palette ────────────────────────────────────────────────────────────────────

const C = {
  ink: "#0F172A",
  muted: "#94A3B8",
  sub: "#64748B",
  border: "#E2E8F0",
  paper: "#F8FAFC",
  hover: "#F1F5F9",
  divider: "#EEF2FF",
  teal: "#0D9488",
  indigo: "#6366F1",
  red: "#EF4444",
  amber: "#F59E0B",
  purple: "#8B5CF6",
  green: "#10B981",
  blue: "#3B82F6",
};

const UNCATEGORIZED_ID = "uncategorized";
const STATUS_OPTIONS = [
  { value: "all",     label: "সব" },
  { value: "online",  label: "অনলাইন" },
  { value: "offline", label: "অফলাইন" },
];

// ── Shared input helpers ───────────────────────────────────────────────────────

const inputBase =
  "w-full outline-none transition-all rounded-xl border-[1.5px] border-[#E2E8F0] bg-white text-[#0F172A] font-['IBM_Plex_Mono',monospace]";

const focusInput = (e) => {
  e.target.style.borderColor = "#0D9488";
  e.target.style.boxShadow = "0 0 0 3px #0D948820";
};
const blurInput = (e) => {
  e.target.style.borderColor = "#E2E8F0";
  e.target.style.boxShadow = "";
};

// ── Modal Shell ────────────────────────────────────────────────────────────────

const ModalShell = ({ onClose, children, wide }) => {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <div className="fixed inset-0 flex items-center justify-center px-4 z-[9999]">
      <div
        className="absolute inset-0 backdrop-blur-[6px]"
        style={{ background: "rgba(15,23,42,0.6)" }}
        onClick={onClose}
      />
      <div className={`relative w-full max-h-[calc(100svh-48px)] overflow-y-auto ${wide ? "max-w-[640px]" : "max-w-[520px]"}`}>
        {children}
      </div>
    </div>
  );
};

// ── Delete Confirm Modal ───────────────────────────────────────────────────────

const DeleteModal = ({ name, onConfirm, onCancel, loading }) => (
  <ModalShell onClose={onCancel}>
    <div className="bg-white overflow-hidden rounded-[24px] shadow-[0_25px_60px_rgba(15,23,42,0.2)]">
      <div
        className="px-6 py-6 flex items-center gap-4 border-b border-[#FECACA]"
        style={{ background: "linear-gradient(135deg,#FEF2F2,#FFE4E6)" }}
      >
        <div
          className="flex items-center justify-center shrink-0 w-11 h-11 rounded-[14px] shadow-[0_8px_20px_rgba(239,68,68,0.35)]"
          style={{ background: "linear-gradient(135deg,#EF4444,#DC2626)" }}
        >
          <Trash2 className="w-[18px] h-[18px] text-white" />
        </div>
        <div>
          <p className="font-['IBM_Plex_Mono',monospace] text-[10px] font-bold uppercase tracking-[0.1em] text-[#DC2626] mb-[2px]">
            বিপজ্জনক অপারেশন
          </p>
          <p className="font-['IBM_Plex_Sans',sans-serif] text-base font-bold text-[#0F172A]">
            টেস্ট মুছে ফেলবেন?
          </p>
        </div>
      </div>
      <div className="px-6 py-5">
        <p className="font-['IBM_Plex_Mono',monospace] text-[13px] leading-[1.7] text-[#64748B]">
          <span className="font-bold text-[#0F172A]">{name}</span> স্থায়ীভাবে মুছে যাবে। এই কাজ পূর্বাবস্থায় ফেরানো যাবে না।
        </p>
      </div>
      <div className="px-6 pb-6 flex gap-3">
        <button
          onClick={onCancel}
          disabled={loading}
          className="flex-1 py-3 font-semibold transition-all rounded-xl border-[1.5px] border-[#E2E8F0] text-[#64748B] font-['IBM_Plex_Mono',monospace] text-xs bg-white hover:bg-[#F1F5F9]"
        >
          রাখুন
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 py-3 flex items-center justify-center gap-2 font-semibold transition-all rounded-xl border-none text-white font-['IBM_Plex_Mono',monospace] text-xs"
          style={{
            background: "linear-gradient(135deg,#EF4444,#DC2626)",
            boxShadow: loading ? "none" : "0 4px 14px rgba(239,68,68,0.4)",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading
            ? <span className="animate-spin inline-block w-[14px] h-[14px] rounded-full border-2 border-white/40 border-t-white" />
            : <Trash2 className="w-[13px] h-[13px]" />
          }
          হ্যাঁ, মুছুন
        </button>
      </div>
    </div>
  </ModalShell>
);

// ── Test Config Modal (design unchanged from original) ─────────────────────────

const TestConfigModal = ({ test, onClose, onSave }) => {
  const [price, setPrice] = useState(test.price ?? "");
  const [schemas, setSchemas] = useState([]);
  const [selectedSchemaId, setSelectedSchemaId] = useState(test.schemaId ?? null);
  const [loadingSchemas, setLoadingSchemas] = useState(false);
  const [schemaError, setSchemaError] = useState(null);

  useEffect(() => {
    if (!test.testId) return;
    const load = async () => {
      setLoadingSchemas(true);
      setSchemaError(null);
      try {
        const res = await testService.getSchemasByTestId(test.testId);
        setSchemas(res.data ?? []);
      } catch {
        setSchemaError("Could not load formats");
        setSchemas([]);
      } finally {
        setLoadingSchemas(false);
      }
    };
    load();
  }, [test.testId]);

  const handleSubmit = () => onSave({ ...test, price: parseFloat(price) || 0, schemaId: selectedSchemaId });

  return (
    <ModalShell onClose={onClose} wide>
      <div className="bg-white overflow-hidden rounded-[24px] shadow-[0_25px_60px_rgba(15,23,42,0.2)]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-teal-50 to-cyan-50">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="w-6 h-6 text-teal-600" />
            Configure Test
          </h2>
          <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1.5">
            <FlaskConical className="w-3.5 h-3.5 text-teal-500" />
            {test.name}
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-6 bg-gray-50 space-y-5">
          {/* Price */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span className="text-gray-500 font-bold">৳</span> Test Price
            </h3>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-sm pointer-events-none select-none">৳</span>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Enter price"
                min="0"
                className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none
                  focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all
                  [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
            </div>
          </div>

          {/* Schemas */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-500" /> Available Formats
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {selectedSchemaId
                  ? "This test is currently online. Select a different format or make it offline."
                  : "Select a format to make this test available online."}
              </p>
            </div>

            {selectedSchemaId && (
              <div className="mb-3 p-3 bg-orange-50 border-2 border-orange-200 rounded-lg flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium text-orange-900">Test is Online</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedSchemaId(null)}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white
                    bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700
                    rounded-lg transition-all shadow-sm hover:shadow"
                >
                  <XCircle className="w-4 h-4" /> Make Offline
                </button>
              </div>
            )}

            {loadingSchemas ? (
              <div className="flex items-center justify-center py-8 gap-2">
                <Loader2 className="w-6 h-6 text-teal-600 animate-spin" />
                <span className="text-sm text-gray-500">Loading schemas...</span>
              </div>
            ) : schemaError ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <p className="text-sm text-red-600">{schemaError}</p>
              </div>
            ) : schemas.length === 0 ? (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                <FlaskConical className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 font-medium">No formats available</p>
              </div>
            ) : (
              <div className="space-y-2">
                {schemas.map((schema) => {
                  const isSelected = selectedSchemaId === schema._id;
                  const isActive = schema.isActive;
                  return (
                    <div
                      key={schema._id}
                      onClick={() => isActive && setSelectedSchemaId(schema._id)}
                      className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                        !isActive
                          ? "border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed"
                          : isSelected
                          ? "border-teal-500 bg-teal-50 cursor-pointer"
                          : "border-gray-200 bg-white hover:border-gray-300 cursor-pointer"
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                            isSelected ? "border-teal-500 bg-teal-500" : "border-gray-400"
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-800 truncate">{schema.name}</p>
                            {!isActive && (
                              <span className="text-xs font-medium text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full flex-shrink-0">
                                Inactive
                              </span>
                            )}
                          </div>
                          {schema.description && (
                            <p className="text-xs text-gray-500 truncate mt-0.5">{schema.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                        {isSelected && (
                          <span className="flex items-center gap-1 text-xs font-semibold text-teal-700 bg-teal-100 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" /> Selected
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 bg-white border border-gray-200 hover:border-purple-300 hover:bg-purple-50 rounded-lg transition-all"
                        >
                          <Eye className="w-3.5 h-3.5 text-gray-500" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-white flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all
              bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 hover:border-gray-400"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all
              bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700
              text-white shadow-sm hover:shadow"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </ModalShell>
  );
};

// ── Add Test Modal ─────────────────────────────────────────────────────────────

const AddTestModal = ({ existingTests, onClose, onSaved }) => {
  const [availableTests, setAvailableTests] = useState([]);
  const [categories, setCategories] = useState([]);
  const [registeredTests, setRegisteredTests] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTests, setSelectedTests] = useState({});
  const [expandedCategories, setExpandedCategories] = useState({});

  useEffect(() => {
    const load = async () => {
      try {
        const [testsRes, catsRes, ownTestsRes] = await Promise.all([
          testService.getTestCatalog(),
          testService.getCategories(),
          existingTests.length === 0 ? testService.getTestList() : Promise.resolve({ data: existingTests }),
        ]);
        setAvailableTests(testsRes.data);
        setCategories(catsRes.data);
        setRegisteredTests(ownTestsRes.data);
        const expanded = {};
        catsRes.data.forEach((c) => { if (c._id) expanded[c._id] = true; });
        expanded["uncategorized"] = true;
        setExpandedCategories(expanded);
      } catch {
        setError("টেস্ট লোড করতে ব্যর্থ।");
      } finally {
        setInitialLoading(false);
      }
    };
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const existingTestIds = new Set(registeredTests.map((t) => t.testId));
  const categoryMap = Object.fromEntries(categories.filter((c) => c._id).map((c) => [c._id, c.name]));

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return availableTests.filter((t) => !q || t.name.toLowerCase().includes(q));
  }, [availableTests, searchQuery]);

  const groupedTests = useMemo(() => {
    const groups = {};
    filtered.forEach((test) => {
      const catKey = test.categoryId || "uncategorized";
      const catName = categoryMap[catKey] || "Uncategorized";
      if (!groups[catKey]) groups[catKey] = { name: catName, tests: [] };
      groups[catKey].tests.push(test);
    });
    return groups;
  }, [filtered, categoryMap]);

  const toggleSelect = (testKey) => {
    if (!testKey || existingTestIds.has(testKey)) return;
    setSelectedTests((prev) => {
      const updated = { ...prev };
      if (updated[testKey]) {
        delete updated[testKey];
      } else {
        const test = availableTests.find((t) => t._id === testKey);
        if (!test) return prev;
        updated[testKey] = { price: "" };
      }
      return updated;
    });
  };

  const updatePrice = (testKey, value) =>
    setSelectedTests((prev) => ({ ...prev, [testKey]: { ...prev[testKey], price: value } }));

  const toggleCategory = (catKey) =>
    setExpandedCategories((prev) => ({ ...prev, [catKey]: !prev[catKey] }));

  const handleSave = async () => {
    const selectedCount = Object.keys(selectedTests).length;
    if (selectedCount === 0) { setError("কমপক্ষে একটি টেস্ট নির্বাচন করুন।"); return; }
    const toSave = Object.entries(selectedTests).map(([testKey, config]) => {
      const test = availableTests.find((t) => t._id === testKey);
      return {
        name: test.name,
        testId: testKey,
        categoryId: test.categoryId ?? null,
        schemaId: test.schemaId ?? null,
        price: parseFloat(config.price) || 0,
      };
    });
    try {
      setSaving(true);
      await Promise.all(toSave.map((t) => testService.addTest(t)));
      onSaved(toSave);
    } catch {
      setError("টেস্ট যোগ করতে ব্যর্থ।");
    } finally {
      setSaving(false);
    }
  };

  const selectedCount = Object.keys(selectedTests).length;

  return (
    <ModalShell onClose={onClose} wide>
      <div className="bg-white flex flex-col overflow-hidden rounded-[0px] shadow-[0_25px_60px_rgba(15,23,42,0.2)]">
        {/* Header */}
        <div
          className="shrink-0 px-6 py-5 flex items-center justify-between border-b border-[#0D948820]"
          style={{ background: "linear-gradient(135deg,#0D948815 0%,#0F766E08 100%)" }}
        >
          <div className="flex items-center gap-3.5">
            <div
              className="flex items-center justify-center shrink-0 w-11 h-11 rounded-[14px] shadow-[0_8px_20px_#0D948840]"
              style={{ background: "linear-gradient(135deg,#0D9488,#0F766E)" }}
            >
              <Plus className="w-[18px] h-[18px] text-white" />
            </div>
            <div>
              <p className="font-['IBM_Plex_Mono',monospace] text-[10px] font-bold uppercase tracking-[0.1em] mb-[2px] text-[#0D9488]">
                ক্যাটালগ থেকে যোগ করুন
              </p>
              <p className="font-['IBM_Plex_Sans',sans-serif] text-base font-bold text-[#0F172A]">
                টেস্ট নির্বাচন করুন
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-[10px] text-[#94A3B8] border-[1.5px] border-[#E2E8F0] transition-all hover:bg-[#F1F5F9] hover:text-[#0F172A]"
          >
            <X className="w-[15px] h-[15px]" />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 pt-4 pb-3 bg-[#F8FAFC] border-b border-[#E2E8F0]">
          <div className="relative">
            <Search className="w-[13px] h-[13px] text-[#94A3B8] absolute left-[11px] top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="টেস্টের নাম খুঁজুন…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`${inputBase} pl-8 ${searchQuery ? "pr-8" : "pr-3"} py-2 text-xs`}
              onFocus={focusInput}
              onBlur={blurInput}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-[10px] top-1/2 -translate-y-1/2 text-[#94A3B8]">
                <X className="w-[13px] h-[13px]" />
              </button>
            )}
          </div>
        </div>

        {/* List */}
        <div className="overflow-y-auto" style={{ maxHeight: "52vh" }}>
          {initialLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse flex items-center gap-3 px-2 py-3 border-b border-[#E2E8F0]">
                  <div className="w-5 h-5 rounded bg-[#E2E8F0]" />
                  <div className="flex-1 h-3 bg-[#E2E8F0] rounded" />
                </div>
              ))}
            </div>
          ) : Object.keys(groupedTests).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-[#94A3B8]">
              <FlaskConical className="w-7 h-7 opacity-40" />
              <p className="font-['IBM_Plex_Mono',monospace] text-xs">কোনো টেস্ট পাওয়া যায়নি</p>
            </div>
          ) : (
            <div className="px-4 py-3 space-y-1">
              {Object.entries(groupedTests).map(([catKey, { name: catName, tests: catTests }]) => (
                <div key={catKey}>
                  {/* Category header */}
                  <button
                    onClick={() => toggleCategory(catKey)}
                    className="w-full flex items-center gap-2 py-2 px-1 group"
                  >
                    <span className="font-['IBM_Plex_Mono',monospace] text-[9px] font-bold uppercase tracking-[0.1em] text-[#0D9488]">
                      {catName}
                    </span>
                    <span
                      className="font-['IBM_Plex_Mono',monospace] text-[10px] font-bold px-1.5 py-px rounded-[5px] text-[#0D9488]"
                      style={{ background: "#0D948812", border: "1px solid #0D948825" }}
                    >
                      {catTests.length}
                    </span>
                    <div className="flex-1 h-px bg-[#0D948820]" />
                    {expandedCategories[catKey]
                      ? <ChevronDown className="w-3 h-3 text-[#94A3B8]" />
                      : <ChevronRight className="w-3 h-3 text-[#94A3B8]" />
                    }
                  </button>

                  {expandedCategories[catKey] && catTests.map((test, index) => {
                    const testKey = test._id;
                    const isAlreadyAdded = existingTestIds.has(testKey);
                    const isSelected = !!selectedTests[testKey];

                    return (
                      <div
                        key={testKey || `test-${catKey}-${index}`}
                        onClick={() => !isAlreadyAdded && toggleSelect(testKey)}
                        className={`flex items-start gap-3 px-2 py-2.5 rounded-xl transition-all mb-0.5
                          ${isAlreadyAdded ? "opacity-50 cursor-not-allowed" : isSelected ? "bg-[#0D948808] cursor-pointer" : "hover:bg-[#F1F5F9] cursor-pointer"}`}
                      >
                        {/* Checkbox */}
                        <div className="shrink-0 mt-0.5">
                          {isAlreadyAdded ? (
                            <div className="w-5 h-5 rounded-full bg-[#10B98120] border-2 border-[#10B981] flex items-center justify-center">
                              <CheckCircle2 className="w-3 h-3 text-[#10B981]" />
                            </div>
                          ) : (
                            <span
                              className="flex items-center justify-center w-5 h-5 rounded-[5px] border-[1.5px] transition-all"
                              style={{
                                background: isSelected ? C.teal : undefined,
                                borderColor: isSelected ? C.teal : "#CBD5E1",
                              }}
                            >
                              {isSelected && <Check className="w-[9px] h-[9px] text-white" />}
                            </span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className="font-['IBM_Plex_Sans',sans-serif] text-sm font-semibold text-[#0F172A]">{test.name}</span>
                              {isAlreadyAdded && (
                                <span className="font-['IBM_Plex_Mono',monospace] text-[10px] font-bold text-[#10B981] bg-[#10B98110] border border-[#10B98125] rounded-[6px] px-1.5 py-px shrink-0">
                                  যোগ করা আছে
                                </span>
                              )}
                            </div>
                            {isSelected && !isAlreadyAdded && (
                              <div className="mt-2 sm:mt-0 sm:w-40 shrink-0" onClick={(e) => e.stopPropagation()}>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-['IBM_Plex_Mono',monospace] text-xs font-bold text-[#0D9488]">৳</span>
                                  <input
                                    type="number"
                                    value={selectedTests[testKey]?.price ?? ""}
                                    onChange={(e) => updatePrice(testKey, e.target.value)}
                                    placeholder="মূল্য"
                                    min="0"
                                    className={`${inputBase} pl-7 pr-3 py-1.5 text-xs`}
                                    onFocus={focusInput}
                                    onBlur={blurInput}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="px-5 py-2">
            <div className="flex items-start gap-2.5 px-4 py-3 bg-[#EF444408] border-[1.5px] border-[#EF444430] rounded-xl">
              <AlertTriangle className="w-[14px] h-[14px] text-[#EF4444] shrink-0 mt-[1px]" />
              <span className="text-xs font-['IBM_Plex_Mono',monospace] text-[#EF4444]">{error}</span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="shrink-0 px-6 py-4 flex items-center justify-between gap-3 bg-white border-t border-[#E2E8F0]">
          <span className="font-['IBM_Plex_Mono',monospace] text-xs text-[#64748B]">
            {selectedCount > 0 ? `${selectedCount}টি নির্বাচিত` : "কোনোটি নির্বাচিত নয়"}
          </span>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="py-2.5 px-5 font-semibold transition-all rounded-xl border-[1.5px] border-[#E2E8F0] text-[#64748B] font-['IBM_Plex_Mono',monospace] text-xs hover:bg-[#F1F5F9]"
            >
              বাতিল
            </button>
            <button
              onClick={handleSave}
              disabled={saving || selectedCount === 0}
              className="py-2.5 px-5 flex items-center justify-center gap-2 font-semibold transition-all rounded-xl border-none text-white font-['IBM_Plex_Mono',monospace] text-xs"
              style={{
                background: saving || selectedCount === 0 ? C.muted : "linear-gradient(135deg,#0D9488,#0F766E)",
                cursor: saving || selectedCount === 0 ? "not-allowed" : "pointer",
                boxShadow: saving || selectedCount === 0 ? "none" : "0 4px 14px rgba(13,148,136,0.4)",
              }}
            >
              {saving
                ? <span className="animate-spin inline-block w-[14px] h-[14px] rounded-full border-2 border-white/40 border-t-white" />
                : <Plus className="w-[13px] h-[13px]" />
              }
              {selectedCount > 0 ? `${selectedCount}টি টেস্ট যোগ করুন` : "যোগ করুন"}
            </button>
          </div>
        </div>
      </div>
    </ModalShell>
  );
};

// ── Action Chip ────────────────────────────────────────────────────────────────

const ActionChip = ({ onClick, icon: Icon, label, color }) => (
  <button
    onClick={onClick}
    className="inline-flex items-center gap-1.5 transition-all font-semibold px-3 py-[5px] rounded-lg font-['IBM_Plex_Mono',monospace] text-[11px]"
    style={{ border: `1.5px solid ${color}25`, color, background: `${color}08` }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = `${color}18`;
      e.currentTarget.style.borderColor = `${color}50`;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = `${color}08`;
      e.currentTarget.style.borderColor = `${color}25`;
    }}
  >
    <Icon className="w-[11px] h-[11px]" />
    {label}
  </button>
);

// ── Test Row ───────────────────────────────────────────────────────────────────

const TestRow = ({ test, index, onConfigure, onDelete }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="transition-all border-b border-[#E2E8F0]">
      <button onClick={() => setExpanded((v) => !v)} className="w-full text-left">
        <div className="flex items-center gap-3 py-3 px-2 rounded-xl transition-all hover:bg-[#F1F5F9]">
          <span className="flex items-center justify-center shrink-0 w-[26px] h-[26px] rounded-lg bg-[#EEF2FF] font-['IBM_Plex_Mono',monospace] text-[10px] font-bold text-[#64748B]">
            {String(index + 1).padStart(2, "0")}
          </span>
          <div className="flex-1 min-w-0">
            <span className="font-['IBM_Plex_Sans',sans-serif] text-sm font-semibold text-[#0F172A]">{test.name}</span>
          </div>
          {/* Price */}
          {test.price > 0 && (
            <span className="shrink-0 font-['IBM_Plex_Mono',monospace] text-xs font-bold text-[#0D9488]">
              ৳{test.price.toLocaleString("en-IN")}
            </span>
          )}
          {/* Online badge */}
          <span
            className={`shrink-0 hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-lg border-[1.5px] font-['IBM_Plex_Mono',monospace] text-[10px] font-bold
              ${test.isOnline
                ? "bg-[#10B98115] border-[#10B98130] text-[#10B981]"
                : "bg-[#F59E0B15] border-[#F59E0B30] text-[#F59E0B]"
              }`}
          >
            {test.isOnline
              ? <><Wifi className="w-[10px] h-[10px]" /> অনলাইন</>
              : <><WifiOff className="w-[10px] h-[10px]" /> অফলাইন</>
            }
          </span>
          <ChevronDown
            className={`w-[14px] h-[14px] text-[#94A3B8] transition-transform duration-200 shrink-0 ${expanded ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {expanded && (
        <div
          className="mx-2 mb-3 px-4 py-3 rounded-xl border border-[#E2E8F0]"
          style={{ background: "linear-gradient(135deg,#F8FAFC,#EEF2FF)" }}
        >
          <div className="font-['IBM_Plex_Mono',monospace] text-xs text-[#64748B] leading-loose mb-3 flex flex-wrap gap-x-4 gap-y-1">
            <span>
              মূল্য:{" "}
              <span className="font-bold text-[#0D9488]">
                {test.price > 0 ? `৳${test.price.toLocaleString("en-IN")}` : "নির্ধারিত নয়"}
              </span>
            </span>
            <span>
              বিভাগ: <span className="font-bold text-[#0F172A]">{test.categoryName}</span>
            </span>
            <span className="flex items-center gap-1">
              স্ট্যাটাস:{" "}
              {test.isOnline
                ? <><Wifi className="w-3 h-3 text-[#10B981]" /><span className="font-bold text-[#10B981]">অনলাইন</span></>
                : <><WifiOff className="w-3 h-3 text-[#F59E0B]" /><span className="font-bold text-[#F59E0B]">অফলাইন</span></>
              }
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ActionChip onClick={onConfigure} icon={Settings} label="কনফিগার" color={C.teal} />
            <ActionChip onClick={onDelete} icon={Trash2} label="মুছুন" color={C.red} />
          </div>
        </div>
      )}
    </div>
  );
};

// ── Stat Card ──────────────────────────────────────────────────────────────────

const StatCard = ({ label, value, color, grad, icon: Icon }) => (
  <div className="bg-white relative overflow-hidden border border-[#E2E8F0] rounded-2xl p-[14px_16px] shadow-[0_2px_8px_rgba(15,23,42,0.05)]">
    <div className="absolute top-0 right-0 w-16 h-16 opacity-5 rounded-[0_16px_0_100%]" style={{ background: grad }} />
    <div className="flex items-center gap-2 mb-2">
      <div className="flex items-center justify-center w-[26px] h-[26px] rounded-lg" style={{ background: grad }}>
        <Icon className="w-[13px] h-[13px] text-white" />
      </div>
      <p className="font-['IBM_Plex_Mono',monospace] text-[9px] font-bold uppercase tracking-[0.06em] text-[#94A3B8]">
        {label}
      </p>
    </div>
    <p className="font-['IBM_Plex_Mono',monospace] text-[26px] font-extrabold leading-none" style={{ color }}>
      {value}
    </p>
  </div>
);

// ── Skeleton ───────────────────────────────────────────────────────────────────

const Skeleton = () => (
  <div className="bg-white animate-pulse overflow-hidden border border-[#E2E8F0] rounded-[20px]">
    <div className="px-6 py-4 flex gap-4 border-b border-[#E2E8F0]">
      {[120, 70, 90].map((w, i) => (
        <div key={i} className="h-3 bg-[#E2E8F0] rounded-md" style={{ width: w }} />
      ))}
    </div>
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="flex items-center gap-3 px-6 py-3.5 border-b border-[#E2E8F0]">
        <div className="w-[26px] h-[26px] bg-[#E2E8F0] rounded-lg" />
        <div className="flex-1 h-[13px] bg-[#E2E8F0] rounded-md" />
        <div className="w-[60px] h-[22px] bg-[#E2E8F0] rounded-lg" />
      </div>
    ))}
  </div>
);

// ── Section Divider ────────────────────────────────────────────────────────────

const SectionDivider = ({ title, count }) => (
  <div className="flex items-center gap-2 pt-3 pb-1 first:pt-0">
    <span className="font-['IBM_Plex_Mono',monospace] text-[9px] font-bold uppercase tracking-[0.1em] text-[#0D9488]">
      {title}
    </span>
    <span
      className="font-['IBM_Plex_Mono',monospace] text-[10px] font-bold px-1.5 py-px rounded-[5px] text-[#0D9488]"
      style={{ background: "#0D948812", border: "1px solid #0D948825" }}
    >
      {count}
    </span>
    <div className="flex-1 h-px bg-[#0D948820]" />
  </div>
);

// ── Filter Dropdown ────────────────────────────────────────────────────────────

const FilterDropdown = ({ value, onChange, options }) => (
  <div className="relative">
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`appearance-none outline-none cursor-pointer transition-all font-['IBM_Plex_Mono',monospace] text-xs rounded-[10px] py-[7px] pl-3 pr-[30px] border-[1.5px]
        ${value !== "all" ? "border-[#0D948860] bg-[#0D948808] text-[#0F172A] shadow-[0_2px_8px_#0D948815]" : "border-[#E2E8F0] bg-white text-[#64748B]"}`}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
    <ChevronDown className="w-3 h-3 text-[#94A3B8] absolute right-[9px] top-1/2 -translate-y-1/2 pointer-events-none" />
  </div>
);

// ── Main Page ──────────────────────────────────────────────────────────────────

const getErrorStatus = (error) => error?.response?.status ?? error?.status ?? null;

const ManageTests = () => {
  const [tests, setTests] = useState([]);
  const [categories, setCategories] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [popup, setPopup] = useState(null);
  const [addModal, setAddModal] = useState(false);
  const [configTest, setConfigTest] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [search, setSearch] = useState("");
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
        setPopup({ type: "error", message: "টেস্ট লোড করতে ব্যর্থ।" });
      } finally {
        setInitialLoading(false);
      }
    };
    load();
  }, []);

  const categoryMap = useMemo(
    () => Object.fromEntries(categories.filter((c) => c._id).map((c) => [c._id, c.name])),
    [categories],
  );

  const enrichedTests = useMemo(() =>
    tests.map((t) => ({
      ...t,
      categoryId: t.categoryId || UNCATEGORIZED_ID,
      categoryName: t.categoryId && categoryMap[t.categoryId] ? categoryMap[t.categoryId] : "Uncategorized",
      isOnline: !!t.schemaId,
    })),
    [tests, categoryMap],
  );

  const stats = useMemo(() => ({
    total: enrichedTests.length,
    online: enrichedTests.filter((t) => t.isOnline).length,
    offline: enrichedTests.filter((t) => !t.isOnline).length,
    categories: new Set(enrichedTests.map((t) => t.categoryId)).size,
  }), [enrichedTests]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return enrichedTests
      .filter((t) => statusFilter === "online" ? t.isOnline : statusFilter === "offline" ? !t.isOnline : true)
      .filter((t) => !q || t.name.toLowerCase().includes(q));
  }, [enrichedTests, statusFilter, search]);

  const groups = useMemo(() => {
    const groupsMap = {};
    filtered.forEach((test) => {
      if (!groupsMap[test.categoryId]) {
        groupsMap[test.categoryId] = { categoryId: test.categoryId, categoryName: test.categoryName, tests: [] };
      }
      groupsMap[test.categoryId].tests.push(test);
    });
    return Object.values(groupsMap).sort((a, b) => {
      if (a.categoryName === "Uncategorized") return 1;
      if (b.categoryName === "Uncategorized") return -1;
      return a.categoryName.localeCompare(b.categoryName);
    });
  }, [filtered]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setSaving(true);
      await testService.deleteTest(deleteTarget._id);
      setTests((prev) => prev.filter((t) => t._id !== deleteTarget._id));
      setPopup({ type: "success", message: "টেস্ট মুছে ফেলা হয়েছে।" });
    } catch (e) {
      if (getErrorStatus(e) === 404) {
        setTests((prev) => prev.filter((t) => t._id !== deleteTarget._id));
      }
      setPopup({ type: "error", message: "টেস্ট মুছতে ব্যর্থ।" });
    } finally {
      setSaving(false);
      setDeleteTarget(null);
    }
  };

  const handleConfigSave = async (updatedTest) => {
    try {
      setSaving(true);
      await testService.editTest({ testId: updatedTest._id, price: updatedTest.price, schemaId: updatedTest.schemaId });
      setTests((prev) => prev.map((t) => (t._id === updatedTest._id ? { ...t, ...updatedTest } : t)));
      setConfigTest(null);
      setPopup({ type: "success", message: "টেস্ট কনফিগারেশন সংরক্ষিত।" });
    } catch (e) {
      if (getErrorStatus(e) === 404) {
        setTests((prev) => prev.filter((t) => t._id !== updatedTest._id));
        setConfigTest(null);
      }
      setPopup({ type: "error", message: "কনফিগারেশন সংরক্ষণ ব্যর্থ।" });
    } finally {
      setSaving(false);
    }
  };

  const handleAdded = async (added) => {
    setAddModal(false);
    const [testsRes, catsRes] = await Promise.all([testService.getTestList(), testService.getCategories()]);
    setTests(Array.isArray(testsRes?.data) ? testsRes.data : []);
    setCategories(Array.isArray(catsRes?.data) ? catsRes.data : []);
    setPopup({ type: "success", message: `${added.length}টি টেস্ট যোগ করা হয়েছে।` });
  };

  const hasFilters = search !== "" || statusFilter !== "all";

  return (
    <section
      className="min-h-screen px-4 py-6 font-[Noto_Sans_Bengali,sans-serif]"
      style={{ background: "linear-gradient(to bottom right,#f8fafc,#f0fdf4,#ecfdf5)" }}
    >
      {popup && <Popup type={popup.type} message={popup.message} onClose={() => setPopup(null)} />}

      {addModal &&
        createPortal(
          <AddTestModal existingTests={tests} onClose={() => setAddModal(false)} onSaved={handleAdded} />,
          document.body,
        )}

      {configTest &&
        createPortal(
          <TestConfigModal test={configTest} onClose={() => setConfigTest(null)} onSave={handleConfigSave} />,
          document.body,
        )}

      {deleteTarget &&
        createPortal(
          <DeleteModal
            name={deleteTarget.name}
            onConfirm={handleDelete}
            onCancel={() => setDeleteTarget(null)}
            loading={saving}
          />,
          document.body,
        )}

      <div className="max-w-2xl mx-auto">
        {/* Page header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="font-['IBM_Plex_Mono',monospace] text-[10px] uppercase tracking-[0.1em] text-[#0D9488] mb-1">
              ল্যাব অপারেশন
            </p>
            <h1 className="font-['IBM_Plex_Sans',sans-serif] text-[26px] font-bold text-[#0F172A] leading-tight">
              টেস্ট ব্যবস্থাপনা
            </h1>
            <p className="text-sm text-[#64748B] mt-1">মূল্য, ফরম্যাট ও অনলাইন স্ট্যাটাস পরিচালনা।</p>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Link
              to="/lab-management"
              className="flex items-center gap-1.5 transition-all font-semibold px-[14px] py-2 border-[1.5px] border-[#E2E8F0] rounded-xl text-[#64748B] font-['IBM_Plex_Mono',monospace] text-xs bg-white hover:bg-[#F1F5F9] hover:text-[#0F172A]"
            >
              <ArrowLeft className="w-[13px] h-[13px]" /> ফিরে
            </Link>
            <button
              onClick={() => setAddModal(true)}
              className="flex items-center gap-1.5 transition-all font-semibold px-4 py-2 rounded-xl text-white font-['IBM_Plex_Mono',monospace] text-xs border-none shadow-[0_4px_14px_rgba(13,148,136,0.4)] hover:shadow-[0_6px_20px_rgba(13,148,136,0.5)]"
              style={{ background: "linear-gradient(135deg,#0D9488,#0F766E)" }}
            >
              <Plus className="w-[13px] h-[13px]" /> নতুন
            </button>
          </div>
        </div>

        {/* Stats */}
        {!initialLoading && (
          <div className="grid grid-cols-4 gap-3 mb-5">
            <StatCard label="মোট টেস্ট"  value={stats.total}      color={C.teal}   grad="linear-gradient(135deg,#0D9488,#0F766E)" icon={FlaskConical} />
            <StatCard label="অনলাইন"      value={stats.online}     color={C.green}  grad="linear-gradient(135deg,#10B981,#059669)" icon={Wifi} />
            <StatCard label="অফলাইন"      value={stats.offline}    color={C.amber}  grad="linear-gradient(135deg,#F59E0B,#D97706)" icon={WifiOff} />
            <StatCard label="বিভাগ"        value={stats.categories} color={C.purple} grad="linear-gradient(135deg,#8B5CF6,#7C3AED)" icon={Layers} />
          </div>
        )}

        {/* Main card */}
        {initialLoading ? (
          <Skeleton />
        ) : (
          <div className="bg-white overflow-hidden border border-[#E2E8F0] rounded-[20px] shadow-[0_4px_20px_rgba(15,23,42,0.07)]">
            {/* Card header */}
            <div
              className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]"
              style={{ background: "linear-gradient(135deg,#F8FAFC,#F0FDF4)" }}
            >
              <div>
                <p className="font-['IBM_Plex_Mono',monospace] text-[10px] font-bold uppercase tracking-[0.1em] text-[#0D9488] mb-1">
                  টেস্ট লেজার
                </p>
                <div className="flex items-center gap-3">
                  <span className="font-['IBM_Plex_Mono',monospace] text-[13px] font-semibold text-[#64748B]">
                    মোট {stats.total}টি
                  </span>
                  {stats.online > 0 && (
                    <span className="px-2 py-0.5 font-['IBM_Plex_Mono',monospace] text-[11px] font-bold text-[#10B981] bg-[#10B98110] rounded-[6px] border border-[#10B98125]">
                      অনলাইন {stats.online}টি
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Toolbar */}
            <div className="px-4 py-3 flex flex-wrap items-center gap-2 border-b border-[#E2E8F0] bg-[#F8FAFC]">
              <div className="relative flex-[1_1_160px]">
                <Search className="w-[13px] h-[13px] text-[#94A3B8] absolute left-[11px] top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="টেস্টের নাম খুঁজুন…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={`${inputBase} pl-8 ${search ? "pr-8" : "pr-3"} py-2 text-xs`}
                  onFocus={focusInput}
                  onBlur={blurInput}
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-[10px] top-1/2 -translate-y-1/2 text-[#94A3B8]">
                    <X className="w-[13px] h-[13px]" />
                  </button>
                )}
              </div>
              <FilterDropdown value={statusFilter} onChange={setStatusFilter} options={STATUS_OPTIONS} />
              {hasFilters && (
                <button
                  onClick={() => { setSearch(""); setStatusFilter("all"); }}
                  className="flex items-center gap-1.5 transition-all font-semibold py-[7px] px-3 border-[1.5px] border-[#EF444430] rounded-[10px] text-[#EF4444] font-['IBM_Plex_Mono',monospace] text-[11px] bg-[#EF444406] hover:bg-[#EF444412]"
                >
                  <RotateCcw className="w-3 h-3" /> রিসেট
                </button>
              )}
            </div>

            {/* Column labels */}
            <div className="flex items-center gap-3 px-4 pt-3 pb-1">
              <span className="font-['IBM_Plex_Mono',monospace] text-[9px] font-bold uppercase tracking-[0.08em] text-[#94A3B8] w-[26px] shrink-0">#</span>
              <span className="font-['IBM_Plex_Mono',monospace] text-[9px] font-bold uppercase tracking-[0.08em] text-[#94A3B8] flex-1">টেস্ট</span>
              <span className="font-['IBM_Plex_Mono',monospace] text-[9px] font-bold uppercase tracking-[0.08em] text-[#94A3B8] shrink-0">স্ট্যাটাস</span>
              <span className="w-[14px] shrink-0" />
            </div>

            {/* Rows */}
            <div className="px-4 pb-4">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2 text-[#94A3B8]">
                  <AlertCircle className="w-7 h-7 opacity-40" />
                  <p className="font-['IBM_Plex_Mono',monospace] text-xs">
                    {hasFilters ? "কোনো টেস্ট পাওয়া যায়নি" : "এখনো কোনো টেস্ট যোগ করা হয়নি"}
                  </p>
                </div>
              ) : (
                groups.map((group) => (
                  <div key={group.categoryId}>
                    <SectionDivider title={group.categoryName} count={group.tests.length} />
                    {group.tests.map((test, index) => (
                      <TestRow
                        key={test._id}
                        test={test}
                        index={index}
                        onConfigure={() => setConfigTest(test)}
                        onDelete={() => setDeleteTarget(test)}
                      />
                    ))}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-[#E2E8F0] bg-[#F8FAFC]">
              <p className="font-['IBM_Plex_Mono',monospace] text-[10px] text-[#94A3B8]">
                * অনলাইন টেস্টে রিপোর্ট ফরম্যাট নির্ধারিত আছে
              </p>
            </div>
          </div>
        )}

        <p className="font-['IBM_Plex_Mono',monospace] text-[11px] text-[#94A3B8] text-center mt-4 pb-6">
          LabPilotPro · টেস্ট ম্যানেজমেন্ট সিস্টেম
        </p>
      </div>
    </section>
  );
};

export default ManageTests;