import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Search,
  X,
  Users,
  Filter,
  RotateCcw,
  UserPlus,
  Activity,
  UserCheck,
  UserX,
  Stethoscope,
  Briefcase,
  Building2,
  ArrowLeft,
} from "lucide-react";
import Modal from "../../../components/modal";
import Popup from "../../../components/popup";
import Referrer from "./Referrer";
import ReferrerForm from "./ReferrerForm";
import referrerService from "../../../api/referrer";
import LoadingScreen from "../../../components/loadingPage";

const initialData = {
  name: "",
  contactNumber: "",
  degree: "",
  details: "",
  type: "doctor",
  commissionType: "percentage",
  commissionValue: 0,
  isActive: true,
};

const STATS_CONFIG = [
  { key: "total", label: "Total", icon: Users, color: "blue", textColor: "text-gray-900" },
  { key: "active", label: "Active", icon: UserCheck, color: "green", textColor: "text-green-600" },
  { key: "doctors", label: "Doctors", icon: Stethoscope, color: "indigo", textColor: "text-indigo-600" },
  { key: "agents", label: "Agents", icon: Briefcase, color: "amber", textColor: "text-amber-600" },
  { key: "institutes", label: "Institutes", icon: Building2, color: "teal", textColor: "text-teal-600" },
];

const SkeletonReferrer = () => (
  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4 flex-1">
        <div className="w-12 h-12 rounded-full bg-gray-200" />
        <div className="flex-1">
          <div className="h-5 bg-gray-200 rounded w-1/3 mb-2" />
          <div className="h-4 bg-gray-100 rounded w-1/4" />
        </div>
      </div>
      <div className="flex gap-2">
        <div className="h-9 w-20 bg-gray-200 rounded-lg" />
        <div className="h-9 w-20 bg-gray-200 rounded-lg" />
      </div>
    </div>
  </div>
);

const ManageReferrer = () => {
  const [referrers, setReferrers] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Processing request");
  const [popup, setPopup] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(initialData);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadReferrers = async () => {
    try {
      const response = await referrerService.getAll();
      setReferrers(response.data);
    } catch {
      setPopup({ type: "error", message: "Could not load referrers" });
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    loadReferrers();
  }, []);

  const stats = useMemo(
    () => ({
      total: referrers.length,
      active: referrers.filter((r) => r.isActive).length,
      doctors: referrers.filter((r) => r.type === "doctor").length,
      agents: referrers.filter((r) => r.type === "agent").length,
      institutes: referrers.filter((r) => r.type === "institute").length,
    }),
    [referrers],
  );

  const filteredReferrers = useMemo(() => {
    return referrers.filter((r) => {
      if (typeFilter !== "all" && r.type !== typeFilter) return false;
      if (statusFilter === "active" && !r.isActive) return false;
      if (statusFilter === "inactive" && r.isActive) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return r.name.toLowerCase().includes(q) || r.contactNumber.includes(q) || r.degree?.toLowerCase().includes(q);
      }
      return true;
    });
  }, [referrers, typeFilter, statusFilter, searchQuery]);

  const handleFormChange = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      setPopup({ type: "error", message: "Name is required" });
      return;
    }
    if (!formData.contactNumber?.trim()) {
      setPopup({ type: "error", message: "Contact number is required" });
      return;
    }
    if (formData.commissionType === "percentage" && (formData.commissionValue < 0 || formData.commissionValue > 100)) {
      setPopup({ type: "error", message: "Percentage must be between 0 and 100" });
      return;
    }
    if (formData.commissionValue < 0) {
      setPopup({ type: "error", message: "Commission value cannot be negative" });
      return;
    }

    try {
      setLoading(true);
      if (formData.formType === "addReferrer") {
        setLoadingMessage("Creating referrer");
        await referrerService.addReferrer(formData);
      } else {
        setLoadingMessage("Updating referrer");
        await referrerService.editReferrer(formData);
      }
      await loadReferrers();
      setPopup({
        type: "success",
        message: `Referrer ${formData.formType === "addReferrer" ? "created" : "updated"} successfully`,
      });
      setIsModalOpen(false);
      setFormData(initialData);
    } catch (e) {
      console.error("Error:", e);
      setPopup({
        type: "error",
        message:
          e?.response?.data?.error ||
          (formData.formType === "editReferrer" ? "Could not edit referrer" : "Could not add referrer"),
      });
    } finally {
      setLoading(false);
      setLoadingMessage("Processing request");
    }
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setFormData(initialData);
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      setLoadingMessage("Deleting referrer");
      await referrerService.deleteReferrer(popup._id);
      setReferrers((prev) => prev.filter((r) => r._id !== popup._id));
      setPopup({ type: "success", message: "Referrer deleted successfully" });
    } catch (e) {
      setPopup({ type: "error", message: e?.response?.data?.error || "Could not delete referrer" });
    } finally {
      setLoading(false);
      setLoadingMessage("Processing request");
    }
  };

  const handleToggleStatus = async (isActivating) => {
    try {
      setLoading(true);
      setLoadingMessage(isActivating ? "Activating referrer" : "Deactivating referrer");
      await (isActivating
        ? referrerService.activateReferrer(popup._id)
        : referrerService.deactivateReferrer(popup._id));
      setReferrers((prev) => prev.map((r) => (r._id === popup._id ? { ...r, isActive: isActivating } : r)));
      setPopup({ type: "success", message: `Referrer ${isActivating ? "activated" : "deactivated"} successfully` });
    } catch (e) {
      setPopup({
        type: "error",
        message: e?.response?.data?.error || `Could not ${isActivating ? "activate" : "deactivate"} referrer`,
      });
    } finally {
      setLoading(false);
      setLoadingMessage("Processing request");
    }
  };

  const hasFilters = typeFilter !== "all" || statusFilter !== "all";

  return (
    <section className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 px-4 py-6">
      {loading && <LoadingScreen message={loadingMessage} />}

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

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-2 sm:mb-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-7 h-7 sm:w-8 sm:h-8 text-blue-600" />
              Referrer Management
            </h1>
            <p className="text-sm text-gray-600 mt-1 hidden sm:flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-blue-500" /> Manage referrers & commissions
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/lab-management"
              className="px-2 md:px-4 py-2.5 rounded-xl border border-gray-200 bg-white/50 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center gap-2 text-sm font-medium shadow-sm hover:shadow"
            >
              <ArrowLeft className="w-4 h-4" /> <span>Back</span>
            </Link>
            <button
              onClick={() => {
                setFormData({ ...initialData, formType: "addReferrer" });
                setIsModalOpen(true);
              }}
              className="hidden sm:flex bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-2.5 px-5 rounded-xl shadow-lg hover:shadow-xl transition-all items-center gap-2 text-sm"
            >
              <Plus className="w-5 h-5" /> Add Referrer
            </button>
          </div>
        </div>

        {/* Mobile add button */}
        <div className="flex flex-col gap-3 sm:hidden mb-6">
          <p className="text-sm text-gray-600 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-blue-500" /> Manage referrers & commissions
          </p>
          <button
            onClick={() => {
              setFormData({ ...initialData, formType: "addReferrer" });
              setIsModalOpen(true);
            }}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-2.5 px-5 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 text-sm"
          >
            <Plus className="w-5 h-5" /> Add Referrer
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {STATS_CONFIG.map(({ key, label, icon: Icon, color, textColor }) => (
            <div
              key={key}
              className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-2">
                <div className={`p-2 bg-${color}-50 rounded-lg`}>
                  <Icon className={`w-6 h-6 text-${color}-600`} />
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-medium">{label}</p>
                  {initialLoading ? (
                    <div className="h-8 w-12 bg-gray-200 rounded animate-pulse" />
                  ) : (
                    <p className={`text-2xl font-bold ${textColor}`}>{stats[key]}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-semibold text-gray-700">Filters:</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500">Type</span>
              <div className="flex rounded-lg bg-gray-100 p-1">
                {["all", "doctor", "agent", "institute"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTypeFilter(t)}
                    disabled={initialLoading}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all capitalize ${typeFilter === t ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900"} disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500">Status</span>
              <div className="flex rounded-lg bg-gray-100 p-1">
                {["all", "active", "inactive"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    disabled={initialLoading}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all capitalize ${statusFilter === s ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900"} disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            {hasFilters && (
              <button
                onClick={() => {
                  setTypeFilter("all");
                  setStatusFilter("all");
                }}
                disabled={initialLoading}
                className="ml-auto text-xs text-gray-500 hover:text-blue-600 flex items-center gap-1.5 font-medium px-3 py-1.5 hover:bg-blue-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset Filters
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
              placeholder="Search by name, contact, or degree..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={initialLoading}
              className="w-full pl-11 pr-11 py-2.5 text-sm border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder-gray-400 disabled:bg-gray-50 disabled:cursor-not-allowed"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                disabled={initialLoading}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-1 transition-colors disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <Modal isOpen={isModalOpen} size="md" onClose={handleClose}>
          <ReferrerForm formData={formData} onChange={handleFormChange} onSubmit={handleSubmit} onClose={handleClose} />
        </Modal>

        {/* List */}
        {initialLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonReferrer key={i} />
            ))}
          </div>
        ) : filteredReferrers.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {hasFilters || searchQuery ? "No referrers found" : "No referrers yet"}
            </h3>
            <p className="text-gray-500 text-sm mb-4 max-w-md mx-auto">
              {hasFilters || searchQuery
                ? "Try adjusting your filters or search criteria"
                : "Get started by adding your first referrer to begin tracking commissions"}
            </p>
            {!hasFilters && !searchQuery && (
              <button
                onClick={() => {
                  setFormData({ ...initialData, formType: "addReferrer" });
                  setIsModalOpen(true);
                }}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-5 rounded-lg shadow-sm hover:shadow transition-all"
              >
                <UserPlus className="w-4 h-4" /> Add Your First Referrer
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredReferrers.map((item) => (
              <Referrer
                key={item._id}
                input={item}
                onEdit={() => {
                  setFormData({
                    name: item.name || "",
                    contactNumber: item.contactNumber || "",
                    degree: item.degree || "",
                    details: item.details || "",
                    type: item.type || "doctor",
                    commissionType: item.commissionType || "percentage",
                    commissionValue: item.commissionValue || 0,
                    isActive: item.isActive ?? true,
                    formType: "editReferrer",
                    _id: item._id,
                  });
                  setIsModalOpen(true);
                }}
                onDelete={() =>
                  setPopup({
                    type: "warning",
                    message: `Are you sure you want to delete ${item.name}?`,
                    action: "delete",
                    _id: item._id,
                  })
                }
                onDeactivate={() =>
                  setPopup({
                    type: "warning",
                    message: `Are you sure you want to deactivate ${item.name}?`,
                    action: "deactivate",
                    _id: item._id,
                  })
                }
                onActivate={() =>
                  setPopup({
                    type: "warning",
                    message: `Are you sure you want to activate ${item.name}?`,
                    action: "activate",
                    _id: item._id,
                  })
                }
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ManageReferrer;
