import { useState } from "react";
import Modal from "../../../components/modal";
import Popup from "../../../components/popup";
import Referrer from "./Referrer";
import ReferrerForm from "./ReferrerForm";

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

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      // Validation
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

      if (formData.commissionType === "percentage" && (formData.commissionValue < 0 || formData.commissionValue > 100)) {
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
        const newReferrer = {
          ...formData,
          _id: Date.now().toString(),
          createdAt: new Date().toISOString(),
        };
        console.log("Adding new referrer:", newReferrer);
        
        setReferrers((prev) => [...prev, newReferrer]);
        setPopup({ type: "success", message: "Referrer created successfully" });
      }

      if (formData.type === "editReferrer") {
        console.log("Editing referrer:", formData);
        
        setReferrers((prev) =>
          prev.map((item) => (item._id === formData._id ? { ...item, ...formData } : item))
        );
        setPopup({ type: "success", message: "Referrer updated successfully" });
      }

      setIsModalOpen(false);
      setFormData(initialData);
    } catch (e) {
      console.error("Error:", e);
      let message = "Could not add referrer";
      if (formData.type === "editReferrer") message = "Could not edit referrer";
      setPopup({ type: "error", message: message });
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
      console.log("Deleting referrer with ID:", popup._id);
      
      setReferrers((prev) => prev.filter((referrer) => referrer._id !== popup._id));
      setLoading(false);
      setPopup({ type: "success", message: "Referrer deleted successfully" });
    } catch (e) {
      console.error("Error deleting:", e);
      setPopup({ type: "error", message: "Could not delete referrer" });
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async () => {
    try {
      setLoading(true);
      console.log("Deactivating referrer with ID:", popup._id);
      
      setReferrers((prev) =>
        prev.map((referrer) =>
          referrer._id === popup._id ? { ...referrer, isActive: false } : referrer
        )
      );
      setLoading(false);
      setPopup({ type: "success", message: "Referrer deactivated successfully" });
    } catch (e) {
      console.error("Error deactivating:", e);
      setPopup({ type: "error", message: "Could not deactivate referrer" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="px-2">
      {loading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-700 font-medium">Processing...</p>
          </div>
        </div>
      )}

      {popup && (
        <Popup
          type={popup.type}
          message={popup.message}
          onClose={() => setPopup(null)}
          onConfirm={
            popup.type === "warning" && popup.action === "delete"
              ? handleDelete
              : popup.type === "warning" && popup.action === "deactivate"
              ? handleDeactivate
              : null
          }
        />
      )}

      <div className="flex items-center justify-center mt-4 md:mt-2 my-2 md:my-4">
        <button
          onClick={() => {
            setFormData({ ...initialData, type: "addReferrer" });
            setIsModalOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add New Referrer
        </button>
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
      {referrers.length === 0 ? (
        <div className="text-center py-12">
          <svg
            className="w-16 h-16 mx-auto text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <p className="text-gray-500 text-lg">No referrers added yet</p>
          <p className="text-gray-400 text-sm mt-1">Click "Add New Referrer" to get started</p>
        </div>
      ) : (
        referrers.map((item, index) => (
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
                message: `Do you want to delete ${item.name}?`,
                action: "delete",
                _id: item._id,
              })
            }
            onDeactivate={() =>
              setPopup({
                type: "warning",
                message: `Do you want to deactivate ${item.name}?`,
                action: "deactivate",
                _id: item._id,
              })
            }
          />
        ))
      )}
    </section>
  );
};

export default ManageReferrer;