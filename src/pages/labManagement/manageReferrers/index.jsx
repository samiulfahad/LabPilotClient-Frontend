import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom"; // ✅ added
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
  ArrowLeft, // ✅ added
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
  isDoctor: true,
  commissionType: "percentage",
  commissionValue: 0,
  isActive: true,
};

const ManageReferrer = () => {
  const [referrers, setReferrers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(initialData);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadReferrers = async () => {
    try {
      setLoading(true);
      const response = await referrerService.getReferrers();
      setReferrers(response.data);
    } catch (e) {
      setPopup({ type: "error", message: "Could not load referrers" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReferrers();
  }, []);

  const stats = useMemo(() => {
    const total = referrers.length;
    const active = referrers.filter((r) => r.isActive).length;
    const inactive = total - active;
    const doctors = referrers.filter((r) => r.isDoctor).length;
    const agents = total - doctors;
    return { total, active, inactive, doctors, agents };
  }, [referrers]);

  const filteredReferrers = useMemo(() => {
    let filtered = [...referrers];

    if (typeFilter === "doctor") {
      filtered = filtered.filter((r) => r.isDoctor === true);
    } else if (typeFilter === "agent") {
      filtered = filtered.filter((r) => r.isDoctor === false);
    }

    if (statusFilter === "active") {
      filtered = filtered.filter((r) => r.isActive === true);
    } else if (statusFilter === "inactive") {
      filtered = filtered.filter((r) => r.isActive === false);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.name.toLowerCase().includes(query) ||
          r.contactNumber.includes(query) ||
          r.degree?.toLowerCase().includes(query),
      );
    }

    return filtered;
  }, [referrers, typeFilter, statusFilter, searchQuery]);

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      if (!formData.name.trim()) {
        setPopup({ type: "error", message: "Name is required" });
        setLoading(false);
        return;
      }

      if (!formData.contactNumber.trim()) {
        setPopup({ type: "error", message: "Contact number is required" });
        setLoading(false);
        return;
      }

      if (
        formData.commissionType === "percentage" &&
        (formData.commissionValue < 0 || formData.commissionValue > 100)
      ) {
        setPopup({ type: "error", message: "Percentage must be between 0 and 100" });
        setLoading(false);
        return;
      }

      if (formData.commissionValue < 0) {
        setPopup({ type: "error", message: "Commission value cannot be negative" });
        setLoading(false);
        return;
      }

      if (formData.type === "addReferrer") {
        const response = await referrerService.addReferrer(formData);
        setReferrers((prev) => [...prev, { _id: response.data._id, ...formData }]);
        setPopup({ type: "success", message: "Referrer created successfully" });
      }

      if (formData.type === "editReferrer") {
        await referrerService.editReferrer(formData);
        setReferrers((prev) => prev.map((item) => (item._id === formData._id ? { ...item, ...formData } : item)));
        setPopup({ type: "success", message: "Referrer updated successfully" });
      }

      setIsModalOpen(false);
      setFormData(initialData);
    } catch (e) {
      console.error("Error:", e);
      let message = formData.type === "editReferrer" ? "Could not edit referrer" : "Could not add referrer";
      setPopup({ type: "error", message });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setFormData(initialData);
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      await referrerService.deleteReferrer(popup._id);
      setReferrers((prev) => prev.filter((referrer) => referrer._id !== popup._id));
      setPopup({ type: "success", message: "Referrer deleted successfully" });
    } catch (e) {
      console.error("Error deleting:", e);
      setPopup({ type: "error", message: "Could not delete referrer" });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (isActivating) => {
    try {
      setLoading(true);
      const serviceCall = isActivating
        ? referrerService.activateReferrer(popup._id)
        : referrerService.deactivateReferrer(popup._id);

      await serviceCall;

      setReferrers((prev) =>
        prev.map((referrer) => (referrer._id === popup._id ? { ...referrer, isActive: isActivating } : referrer)),
      );
      setPopup({
        type: "success",
        message: `Referrer ${isActivating ? "activated" : "deactivated"} successfully`,
      });
    } catch (e) {
      console.error(`Error ${isActivating ? "activating" : "deactivating"}:`, e);
      setPopup({
        type: "error",
        message: `Could not ${isActivating ? "activate" : "deactivate"} referrer`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 px-4 py-6">
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

      <div className="max-w-7xl mx-auto">
        {/* ===== RESPONSIVE HEADER ===== */}
        {/* Row 1: Heading + Back button (desktop: also includes Add Referrer) */}
        <div className="flex items-center justify-between mb-2 sm:mb-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-7 h-7 sm:w-8 sm:h-8 text-blue-600" />
              Referrer Management
            </h1>
            {/* Subtitle – hidden on desktop (shown below on mobile) */}
            <p className="text-sm text-gray-600 mt-1 hidden sm:flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-blue-500" />
              Manage referrers & commissions
            </p>
          </div>

          {/* Right side: Back button + Add Referrer button (desktop) */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Back button – always visible */}
            <Link
              to="/lab-management" // change this to your desired back destination
              className="px-2 md:px-4 py-2.5 rounded-xl border border-gray-200 bg-white/50 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 flex items-center gap-2 text-sm font-medium shadow-sm hover:shadow"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back</span>
            </Link>

            {/* Add Referrer button – desktop only */}
            <button
              onClick={() => {
                setFormData({ ...initialData, type: "addReferrer" });
                setIsModalOpen(true);
              }}
              className="hidden sm:flex bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-2.5 px-5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 items-center justify-center gap-2 text-sm sm:text-base"
            >
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
              <span>Add Referrer</span>
            </button>
          </div>
        </div>

        {/* Row 2: Mobile-only subtitle + full-width Add Referrer button */}
        <div className="flex flex-col gap-3 sm:hidden mb-6">
          <p className="text-sm text-gray-600 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-blue-500" />
            Manage referrers & commissions
          </p>
          <button
            onClick={() => {
              setFormData({ ...initialData, type: "addReferrer" });
              setIsModalOpen(true);
            }}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-2.5 px-5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 text-sm"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
            <span>Add Referrer</span>
          </button>
        </div>

        {/* Stats Cards – unchanged */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600 font-medium">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-50 rounded-lg">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600 font-medium">Active</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Stethoscope className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600 font-medium">Doctors</p>
                <p className="text-2xl font-bold text-purple-600">{stats.doctors}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-orange-50 rounded-lg">
                <Briefcase className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600 font-medium">Agents</p>
                <p className="text-2xl font-bold text-orange-600">{stats.agents}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters – unchanged */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-semibold text-gray-700">Filters:</span>
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500">Type</span>
              <div className="flex rounded-lg bg-gray-100 p-1">
                {["all", "doctor", "agent"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setTypeFilter(type)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all capitalize ${
                      typeFilter === type ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500">Status</span>
              <div className="flex rounded-lg bg-gray-100 p-1">
                {["all", "active", "inactive"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all capitalize ${
                      statusFilter === status ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Reset */}
            {(typeFilter !== "all" || statusFilter !== "all") && (
              <button
                onClick={() => {
                  setTypeFilter("all");
                  setStatusFilter("all");
                }}
                className="ml-auto text-xs text-gray-500 hover:text-blue-600 flex items-center gap-1.5 transition-colors font-medium px-3 py-1.5 hover:bg-blue-50 rounded-lg"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Search Bar – unchanged */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, contact, or degree..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-11 py-2.5 text-sm border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder-gray-400"
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

        {/* Modal – unchanged */}
        <Modal isOpen={isModalOpen} size="md" onClose={handleClose}>
          <ReferrerForm
            formData={formData}
            onChange={handleFormChange}
            onSubmit={handleSubmit}
            onClose={handleClose}
            type={formData.type}
          />
        </Modal>

        {/* Referrers List – unchanged */}
        {filteredReferrers.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {searchQuery || typeFilter !== "all" || statusFilter !== "all"
                ? "No referrers found"
                : "No referrers yet"}
            </h3>
            <p className="text-gray-500 text-sm mb-4 max-w-md mx-auto">
              {searchQuery || typeFilter !== "all" || statusFilter !== "all"
                ? "Try adjusting your filters or search criteria to find what you're looking for"
                : "Get started by adding your first referrer to begin tracking commissions"}
            </p>
            {!searchQuery && typeFilter === "all" && statusFilter === "all" && (
              <button
                onClick={() => {
                  setFormData({ ...initialData, type: "addReferrer" });
                  setIsModalOpen(true);
                }}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-5 rounded-lg shadow-sm hover:shadow transition-all"
              >
                <UserPlus className="w-4 h-4" />
                Add Your First Referrer
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredReferrers.map((item, index) => (
              <Referrer
                key={item._id}
                input={item}
                index={index}
                onEdit={() => {
                  setFormData({ ...item, type: "editReferrer", _id: item._id });
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
