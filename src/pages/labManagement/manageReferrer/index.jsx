import { useEffect, useState, useMemo } from "react";
import Modal from "../../../components/modal";
import Popup from "../../../components/popup";
import Referrer from "./Referrer";
import ReferrerForm from "./ReferrerForm";
import referrerService from "../../../api/referrers";
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
    return { total, active, inactive };
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
        {/* 📱 HEADER – Button always top‑right, even on mobile */}
        <div className="flex flex-row items-center justify-between gap-2 mb-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent truncate">
              Referrer Management
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-1 mt-0.5 truncate">
              <svg className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="truncate">Manage referrers & commissions</span>
            </p>
          </div>
          <button
            onClick={() => {
              setFormData({ ...initialData, type: "addReferrer" });
              setIsModalOpen(true);
            }}
            className="group bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-2 px-3 sm:py-2.5 sm:px-5 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 flex items-center gap-1 sm:gap-2 text-xs sm:text-base whitespace-nowrap flex-shrink-0"
          >
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-90 transition-transform duration-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden xs:inline sm:inline">Add Referrer</span>
            <span className="inline p-2 xs:hidden sm:hidden">Add</span>
          </button>
        </div>

        {/* ULTRA-COMPACT STATS */}
        <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-lg border border-gray-100 px-4 py-2 mb-4 text-sm shadow-sm">
          <span className="font-medium text-gray-700">
            Total: <span className="font-bold text-gray-900 ml-1">{stats.total}</span>
          </span>
          <span className="text-gray-300">|</span>
          <span className="font-medium text-gray-700">
            Active: <span className="font-bold text-green-600 ml-1">{stats.active}</span>
          </span>
          <span className="text-gray-300">|</span>
          <span className="font-medium text-gray-700">
            Inactive: <span className="font-bold text-red-600 ml-1">{stats.inactive}</span>
          </span>
        </div>

        {/* Filter Bar – Type & Status */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-3 mb-4 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Type</span>
            <div className="flex rounded-md bg-gray-100 p-0.5">
              {["all", "doctor", "agent"].map((type) => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={`px-3 py-1 text-xs font-medium rounded transition-all capitalize ${
                    typeFilter === type ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Status</span>
            <div className="flex rounded-md bg-gray-100 p-0.5">
              {["all", "active", "inactive"].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1 text-xs font-medium rounded transition-all capitalize ${
                    statusFilter === status ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
          {(typeFilter !== "all" || statusFilter !== "all") && (
            <button
              onClick={() => {
                setTypeFilter("all");
                setStatusFilter("all");
              }}
              className="ml-auto text-xs text-gray-500 hover:text-blue-600 flex items-center gap-1 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Reset
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-3 mb-6">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search by name, contact, or degree..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-9 py-2 text-sm border border-gray-200 rounded-md focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder-gray-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Modal */}
        <Modal isOpen={isModalOpen} size="md">
          <ReferrerForm
            formData={formData}
            onChange={handleFormChange}
            onSubmit={handleSubmit}
            onClose={handleClose}
            type={formData.type}
          />
        </Modal>

        {/* Referrers List */}
        {filteredReferrers.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 text-center">
            <div className="bg-gray-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h3 className="text-md font-semibold text-gray-800 mb-1">
              {searchQuery || typeFilter !== "all" || statusFilter !== "all"
                ? "No referrers found"
                : "No referrers yet"}
            </h3>
            <p className="text-gray-500 text-xs mb-3">
              {searchQuery || typeFilter !== "all" || statusFilter !== "all"
                ? "Try adjusting your filters or search criteria"
                : "Get started by adding your first referrer"}
            </p>
            {!searchQuery && typeFilter === "all" && statusFilter === "all" && (
              <button
                onClick={() => {
                  setFormData({ ...initialData, type: "addReferrer" });
                  setIsModalOpen(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md shadow-sm hover:shadow text-xs"
              >
                Add Your First Referrer
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
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
