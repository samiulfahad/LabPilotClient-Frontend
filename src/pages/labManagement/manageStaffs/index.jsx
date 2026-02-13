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
  Shield,
  ShieldCheck,
  ShieldOff,
  ArrowLeft,
} from "lucide-react";
import Modal from "../../../components/modal";
import Popup from "../../../components/popup";
import Staff from "./Staff";
import StaffForm from "./StaffForm";
import staffService from "../../../api/staff";
import LoadingScreen from "../../../components/loadingPage";

const initialData = {
  name: "",
  username: "",
  email: "",
  mobileNumber: "",
  permissions: {
    createInvoice: false,
    editInvoice: false,
    deleteInvoice: false,
    cashmemo: false,
    uploadReport: false,
  },
  isActive: true,
};

// Skeleton component for loading state
const SkeletonStaff = () => (
  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4 flex-1">
        <div className="w-12 h-12 rounded-full bg-gray-200"></div>
        <div className="flex-1">
          <div className="h-5 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-100 rounded w-1/4"></div>
        </div>
      </div>
      <div className="flex gap-2">
        <div className="h-9 w-20 bg-gray-200 rounded-lg"></div>
        <div className="h-9 w-20 bg-gray-200 rounded-lg"></div>
      </div>
    </div>
  </div>
);

const ManageStaff = () => {
  const [staff, setStaff] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Processing request");
  const [popup, setPopup] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(initialData);
  const [searchQuery, setSearchQuery] = useState("");
  const [permissionFilter, setPermissionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadStaff = async () => {
    try {
      const response = await staffService.getStaffs();
      setStaff(response.data);
    } catch (e) {
      setPopup({ type: "error", message: "Could not load staff" });
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const stats = useMemo(() => {
    const total = staff.length;
    const active = staff.filter((s) => s.isActive).length;
    const inactive = total - active;
    const withFullAccess = staff.filter((s) => {
      const perms = s.permissions;
      return perms.createInvoice && perms.editInvoice && perms.deleteInvoice && perms.cashmemo && perms.uploadReport;
    }).length;
    return { total, active, inactive, withFullAccess };
  }, [staff]);

  const filteredStaff = useMemo(() => {
    let filtered = [...staff];

    if (permissionFilter !== "all") {
      filtered = filtered.filter((s) => s.permissions[permissionFilter] === true);
    }

    if (statusFilter === "active") {
      filtered = filtered.filter((s) => s.isActive === true);
    } else if (statusFilter === "inactive") {
      filtered = filtered.filter((s) => s.isActive === false);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.username.toLowerCase().includes(query) ||
          s.email.toLowerCase().includes(query) ||
          s.mobileNumber.includes(query),
      );
    }

    return filtered;
  }, [staff, permissionFilter, statusFilter, searchQuery]);

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Defensive checks with optional chaining
    if (!formData.name?.trim()) {
      setPopup({ type: "error", message: "Name is required" });
      return;
    }

    if (!formData.username?.trim()) {
      setPopup({ type: "error", message: "Username is required" });
      return;
    }

    if (!formData.email?.trim()) {
      setPopup({ type: "error", message: "Email is required" });
      return;
    }

    if (!formData.mobileNumber?.trim()) {
      setPopup({ type: "error", message: "Mobile number is required" });
      return;
    }

    try {
      setLoading(true);

      if (formData.type === "addStaff") {
        setLoadingMessage("Creating staff member");
        const response = await staffService.addStaff(formData);
        setStaff((prev) => [...prev, { _id: response.data._id, ...formData }]);
        setPopup({ type: "success", message: "Staff created successfully" });
      }

      if (formData.type === "editStaff") {
        setLoadingMessage("Updating staff member");
        await staffService.editStaff(formData);
        setStaff((prev) => prev.map((item) => (item._id === formData._id ? { ...item, ...formData } : item)));
        setPopup({ type: "success", message: "Staff updated successfully" });
      }

      setIsModalOpen(false);
      setFormData(initialData);
    } catch (e) {
      const hasErrorMessage = e?.response?.data?.error;
      console.error("Error:", e);
      let message = formData.type === "editStaff" ? "Could not edit staff" : "Could not add staff";
      if (hasErrorMessage) {
        message = e?.response?.data?.error;
      }
      setPopup({ type: "error", message });
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
      setLoadingMessage("Deleting staff member");
      await staffService.deleteStaff(popup._id);
      setStaff((prev) => prev.filter((member) => member._id !== popup._id));
      setPopup({ type: "success", message: "Staff deleted successfully" });
    } catch (e) {
      console.error("Error deleting:", e);
      setPopup({ type: "error", message: "Could not delete staff" });
    } finally {
      setLoading(false);
      setLoadingMessage("Processing request");
    }
  };

  const handleToggleStatus = async (isActivating) => {
    try {
      setLoading(true);
      setLoadingMessage(isActivating ? "Activating staff member" : "Deactivating staff member");
      const serviceCall = isActivating
        ? staffService.activateStaff(popup._id)
        : staffService.deactivateStaff(popup._id);

      await serviceCall;

      setStaff((prev) =>
        prev.map((member) => (member._id === popup._id ? { ...member, isActive: isActivating } : member)),
      );
      setPopup({
        type: "success",
        message: `Staff ${isActivating ? "activated" : "deactivated"} successfully`,
      });
    } catch (e) {
      console.error(`Error ${isActivating ? "activating" : "deactivating"}:`, e);
      setPopup({
        type: "error",
        message: `Could not ${isActivating ? "activate" : "deactivate"} staff`,
      });
    } finally {
      setLoading(false);
      setLoadingMessage("Processing request");
    }
  };

  return (
    <section className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 px-4 py-6">
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
        {/* ===== RESPONSIVE HEADER ===== */}
        <div className="flex items-center justify-between mb-2 sm:mb-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Shield className="w-7 h-7 sm:w-8 sm:h-8 text-indigo-600" />
              Staff Management
            </h1>
            <p className="text-sm text-gray-600 mt-1 hidden sm:flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-indigo-500" />
              Manage staff accounts & permissions
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

            <button
              onClick={() => {
                setFormData({ ...initialData, type: "addStaff" });
                setIsModalOpen(true);
              }}
              className="hidden sm:flex bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-2.5 px-5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 items-center justify-center gap-2 text-sm sm:text-base"
            >
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
              <span>Add Staff</span>
            </button>
          </div>
        </div>

        {/* Mobile-only row */}
        <div className="flex flex-col gap-3 sm:hidden mb-6">
          <p className="text-sm text-gray-600 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-indigo-500" />
            Manage staff accounts & permissions
          </p>
          <button
            onClick={() => {
              setFormData({ ...initialData, type: "addStaff" });
              setIsModalOpen(true);
            }}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-2.5 px-5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 text-sm"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
            <span>Add Staff</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-50 rounded-lg">
                <Users className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600 font-medium">Total Staff</p>
                {initialLoading ? (
                  <div className="h-8 w-12 bg-gray-200 rounded animate-pulse"></div>
                ) : (
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-50 rounded-lg">
                <ShieldCheck className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600 font-medium">Active</p>
                {initialLoading ? (
                  <div className="h-8 w-12 bg-gray-200 rounded animate-pulse"></div>
                ) : (
                  <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-red-50 rounded-lg">
                <ShieldOff className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600 font-medium">Inactive</p>
                {initialLoading ? (
                  <div className="h-8 w-12 bg-gray-200 rounded animate-pulse"></div>
                ) : (
                  <p className="text-2xl font-bold text-red-600">{stats.inactive}</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600 font-medium">Full Access</p>
                {initialLoading ? (
                  <div className="h-8 w-12 bg-gray-200 rounded animate-pulse"></div>
                ) : (
                  <p className="text-2xl font-bold text-purple-600">{stats.withFullAccess}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
          <div className="flex flex-wrap items-start gap-4">
            <div className="flex items-center gap-2 mt-1">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-semibold text-gray-700">Filters:</span>
            </div>

            <div className="flex items-start gap-2 w-full sm:w-auto">
              <span className="text-xs font-medium text-gray-500 mt-2 shrink-0">Permission</span>
              <div className="flex flex-wrap gap-1 rounded-lg bg-gray-100 p-1">
                {[
                  { value: "all", label: "All" },
                  { value: "createInvoice", label: "Create" },
                  { value: "editInvoice", label: "Edit" },
                  { value: "deleteInvoice", label: "Delete" },
                  { value: "cashmemo", label: "Cashmemo" },
                  { value: "uploadReport", label: "Reports" },
                ].map((perm) => (
                  <button
                    key={perm.value}
                    onClick={() => setPermissionFilter(perm.value)}
                    disabled={initialLoading}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                      permissionFilter === perm.value
                        ? "bg-white text-indigo-600 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    } ${initialLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {perm.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500">Status</span>
              <div className="flex rounded-lg bg-gray-100 p-1">
                {["all", "active", "inactive"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    disabled={initialLoading}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all capitalize ${
                      statusFilter === status
                        ? "bg-white text-indigo-600 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    } ${initialLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {(permissionFilter !== "all" || statusFilter !== "all") && (
              <button
                onClick={() => {
                  setPermissionFilter("all");
                  setStatusFilter("all");
                }}
                disabled={initialLoading}
                className="ml-auto text-xs text-gray-500 hover:text-indigo-600 flex items-center gap-1.5 transition-colors font-medium px-3 py-1.5 hover:bg-indigo-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Filters
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
              placeholder="Search by name, username, email, or mobile number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={initialLoading}
              className="w-full pl-11 pr-11 py-2.5 text-sm border border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all placeholder-gray-400 disabled:bg-gray-50 disabled:cursor-not-allowed"
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

        {/* Modal */}
        <Modal isOpen={isModalOpen} size="lg" onClose={handleClose}>
          <StaffForm
            formData={formData}
            onChange={handleFormChange}
            onSubmit={handleSubmit}
            onClose={handleClose}
            type={formData.type}
          />
        </Modal>

        {/* Staff List */}
        {initialLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonStaff key={i} />
            ))}
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-indigo-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {searchQuery || permissionFilter !== "all" || statusFilter !== "all" ? "No staff found" : "No staff yet"}
            </h3>
            <p className="text-gray-500 text-sm mb-4 max-w-md mx-auto">
              {searchQuery || permissionFilter !== "all" || statusFilter !== "all"
                ? "Try adjusting your filters or search criteria to find what you're looking for"
                : "Get started by adding your first staff member to manage access and permissions"}
            </p>
            {!searchQuery && permissionFilter === "all" && statusFilter === "all" && (
              <button
                onClick={() => {
                  setFormData({ ...initialData, type: "addStaff" });
                  setIsModalOpen(true);
                }}
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-5 rounded-lg shadow-sm hover:shadow transition-all"
              >
                <UserPlus className="w-4 h-4" />
                Add Your First Staff
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredStaff.map((item, index) => (
              <Staff
                key={item._id}
                input={item}
                index={index}
                onEdit={() => {
                  // Normalize data to ensure all fields have valid values
                  setFormData({
                    name: item.name || "",
                    username: item.username || "",
                    email: item.email || "",
                    mobileNumber: item.mobileNumber || "",
                    permissions: item.permissions || initialData.permissions,
                    isActive: item.isActive ?? true,
                    type: "editStaff",
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

export default ManageStaff;
