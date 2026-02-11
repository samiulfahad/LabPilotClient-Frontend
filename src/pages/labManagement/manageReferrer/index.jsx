import { useEffect, useState, useMemo } from "react";
import Modal from "../../../components/modal";
import Popup from "../../../components/popup";
import Referrer from "./Referrer";
import ReferrerForm from "./ReferrerForm";
import referrerService from "../../../api/referrers";

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

  const loadReferrers = async () => {
    try {
      const response = await referrerService.getReferrers();
      setReferrers(response.data);
    } catch (e) {}
  };

  useEffect(() => {
    loadReferrers();
  }, []);

  // Stats calculation
  const stats = useMemo(() => {
    const total = referrers.length;
    const active = referrers.filter((r) => r.isActive).length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [referrers]);

  // Filtered referrers based on search
  const filteredReferrers = useMemo(() => {
    if (!searchQuery.trim()) return referrers;
    const query = searchQuery.toLowerCase();
    return referrers.filter(
      (r) =>
        r.name.toLowerCase().includes(query) ||
        r.contactNumber.includes(query) ||
        r.degree?.toLowerCase().includes(query),
    );
  }, [referrers, searchQuery]);

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
      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 shadow-2xl">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto"></div>
            <p className="mt-4 text-gray-700 font-semibold text-lg">Processing...</p>
          </div>
        </div>
      )}

      {/* Popup */}
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
        {/* Header with Add Button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">
              Referrer Management
            </h1>
            <p className="text-gray-600 flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                  clipRule="evenodd"
                />
              </svg>
              Manage your medical referrers and commissions
            </p>
          </div>
          <button
            onClick={() => {
              setFormData({ ...initialData, type: "addReferrer" });
              setIsModalOpen(true);
            }}
            className="group bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:via-blue-800 hover:to-indigo-800 text-white font-semibold py-3.5 px-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 flex items-center gap-2 whitespace-nowrap transform hover:scale-105"
          >
            <svg
              className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Add Referrer
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="group bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-md hover:shadow-2xl p-6 border border-blue-100 hover:border-blue-300 transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold mb-2 uppercase tracking-wide">Total Referrers</p>
                <p className="text-5xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {stats.total}
                </p>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="group bg-gradient-to-br from-white to-green-50 rounded-2xl shadow-md hover:shadow-2xl p-6 border border-green-100 hover:border-green-300 transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold mb-2 uppercase tracking-wide">Active</p>
                <p className="text-5xl font-extrabold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  {stats.active}
                </p>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-4 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="group bg-gradient-to-br from-white to-red-50 rounded-2xl shadow-md hover:shadow-2xl p-6 border border-red-100 hover:border-red-300 transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold mb-2 uppercase tracking-wide">Inactive</p>
                <p className="text-5xl font-extrabold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
                  {stats.inactive}
                </p>
              </div>
              <div className="bg-gradient-to-br from-red-500 to-rose-600 p-4 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-2xl shadow-md hover:shadow-lg p-5 mb-8 border border-gray-100 transition-all duration-300">
          <div className="relative">
            <svg
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
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
              className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all text-gray-700 placeholder-gray-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Modal */}
        <Modal isOpen={isModalOpen} size="lg">
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
          <div className="bg-white rounded-2xl shadow-lg p-16 text-center">
            <div className="bg-gray-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              {searchQuery ? "No referrers found" : "No referrers yet"}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchQuery ? "Try adjusting your search criteria" : "Get started by adding your first referrer"}
            </p>
            {!searchQuery && (
              <button
                onClick={() => {
                  setFormData({ ...initialData, type: "addReferrer" });
                  setIsModalOpen(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl shadow-md hover:shadow-lg transition-all"
              >
                Add Your First Referrer
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
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
