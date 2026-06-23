import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  ArrowLeft,
  Search,
  X,
  RotateCcw,
  UserPlus,
  Activity,
  Shield,
  ShieldCheck,
  ShieldOff,
  AlertCircle,
} from "lucide-react";
import Modal from "../../../components/modal";
import Popup from "../../../components/popup";
import Staff from "./Staff";
import StaffForm from "./StaffForm";
import staffService from "../../../api/staff";
import LoadingScreen from "../../../components/loadingPage";

const initialData = {
  name: "",
  email: "",
  phone: "",
  permissions: {
    createInvoice: false,
    editInvoice: false,
    deleteInvoice: false,
    cashmemo: false,
    uploadReport: false,
    downloadReport: false,
  },
  isActive: true,
};

const STATS_CONFIG = [
  { key: "total", label: "মোট", icon: Users, color: "text-indigo-600", bg: "bg-indigo-50" },
  { key: "active", label: "সক্রিয়", icon: ShieldCheck, color: "text-emerald-600", bg: "bg-emerald-50" },
  { key: "inactive", label: "নিষ্ক্রিয়", icon: ShieldOff, color: "text-rose-600", bg: "bg-rose-50" },
  { key: "withFullAccess", label: "সম্পূর্ণ অ্যাক্সেস", icon: Shield, color: "text-purple-600", bg: "bg-purple-50" },
];

const PERMISSION_FILTERS = [
  { value: "all", label: "সব অনুমতি" },
  { value: "createInvoice", label: "ইনভয়েস তৈরি" },
  { value: "editInvoice", label: "ইনভয়েস সম্পাদনা" },
  { value: "deleteInvoice", label: "ইনভয়েস মুছুন" },
  { value: "cashmemo", label: "ক্যাশমেমু" },
  { value: "uploadReport", label: "রিপোর্ট আপলোড" },
  { value: "downloadReport", label: "রিপোর্ট ডাউনলোড" },
];

const STATUS_FILTERS = [
  { value: "all", label: "সব স্ট্যাটাস" },
  { value: "active", label: "সক্রিয়" },
  { value: "inactive", label: "নিষ্ক্রিয়" },
];

const SkeletonStaff = () => (
  <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden animate-pulse">
    <div className="px-4 py-3 flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-slate-200" />
      <div className="flex-1">
        <div className="h-4 bg-slate-200 rounded w-1/3 mb-1.5" />
        <div className="h-3 bg-slate-100 rounded w-1/4" />
      </div>
      <div className="flex gap-1.5">
        <div className="h-7 w-16 bg-slate-200 rounded-lg" />
        <div className="h-7 w-16 bg-slate-200 rounded-lg" />
      </div>
    </div>
  </div>
);

const SectionHeader = ({ title, count }) => (
  <div className="flex items-center gap-3 mb-3">
    <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</h2>
    <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200">
      {count}
    </span>
    <div className="flex-1 h-px bg-slate-200/60" />
  </div>
);

const ManageStaff = () => {
  const [staff, setStaff] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("প্রক্রিয়াকরণ");
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
    } catch {
      setPopup({ type: "error", message: "কর্মী লোড করতে ব্যর্থ" });
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const stats = useMemo(
    () => ({
      total: staff.length,
      active: staff.filter((s) => s.isActive).length,
      inactive: staff.filter((s) => !s.isActive).length,
      withFullAccess: staff.filter((s) => {
        const p = s.permissions;
        return p.createInvoice && p.editInvoice && p.deleteInvoice && p.cashmemo && p.uploadReport && p.downloadReport;
      }).length,
    }),
    [staff],
  );

  const filteredStaff = useMemo(() => {
    return staff.filter((s) => {
      if (permissionFilter !== "all" && !s.permissions[permissionFilter]) return false;
      if (statusFilter === "active" && !s.isActive) return false;
      if (statusFilter === "inactive" && s.isActive) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || s.phone.includes(q);
      }
      return true;
    });
  }, [staff, permissionFilter, statusFilter, searchQuery]);

  const admins = useMemo(() => filteredStaff.filter((s) => s.role === "admin"), [filteredStaff]);
  const staffMembers = useMemo(() => filteredStaff.filter((s) => s.role === "staff"), [filteredStaff]);
  const others = useMemo(
    () => filteredStaff.filter((s) => s.role !== "admin" && s.role !== "staff"),
    [filteredStaff],
  );

  const handleFormChange = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));
  const handleClose = () => {
    setIsModalOpen(false);
    setFormData(initialData);
  };
  const hasFilters = permissionFilter !== "all" || statusFilter !== "all" || searchQuery !== "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      setPopup({ type: "error", message: "নাম প্রয়োজন" });
      return;
    }
    if (!formData.phone?.trim()) {
      setPopup({ type: "error", message: "ফোন নম্বর প্রয়োজন" });
      return;
    }

    try {
      setLoading(true);
      if (formData.type === "addStaff") {
        setLoadingMessage("নতুন কর্মী তৈরি");
        const response = await staffService.addStaff(formData);
        setStaff((prev) => [...prev, { _id: response.data._id, ...formData }]);
        setPopup({ type: "success", message: "কর্মী তৈরি সফল" });
      } else {
        setLoadingMessage("কর্মী আপডেট");
        await staffService.editStaff(formData);
        setStaff((prev) => prev.map((item) => (item._id === formData._id ? { ...item, ...formData } : item)));
        setPopup({ type: "success", message: "কর্মী আপডেট সফল" });
      }
      setIsModalOpen(false);
      setFormData(initialData);
    } catch (e) {
      setPopup({
        type: "error",
        message: e?.response?.data?.error || "কর্মী সংরক্ষণ ব্যর্থ",
      });
    } finally {
      setLoading(false);
      setLoadingMessage("প্রক্রিয়াকরণ");
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      setLoadingMessage("কর্মী মুছুন");
      await staffService.deleteStaff(popup._id);
      setStaff((prev) => prev.filter((m) => m._id !== popup._id));
      setPopup({ type: "success", message: "কর্মী মুছে ফেলা হয়েছে" });
    } catch {
      setPopup({ type: "error", message: "কর্মী মুছতে ব্যর্থ" });
    } finally {
      setLoading(false);
      setLoadingMessage("প্রক্রিয়াকরণ");
    }
  };

  const handleToggleStatus = async (isActivating) => {
    try {
      setLoading(true);
      setLoadingMessage(isActivating ? "কর্মী সক্রিয়" : "কর্মী নিষ্ক্রিয়");
      await (isActivating ? staffService.activateStaff(popup._id) : staffService.deactivateStaff(popup._id));
      setStaff((prev) => prev.map((m) => (m._id === popup._id ? { ...m, isActive: isActivating } : m)));
      setPopup({ type: "success", message: `কর্মী ${isActivating ? "সক্রিয়" : "নিষ্ক্রিয়"} করা হয়েছে` });
    } catch {
      setPopup({ type: "error", message: `কর্মী ${isActivating ? "সক্রিয়" : "নিষ্ক্রিয়"} করতে ব্যর্থ` });
    } finally {
      setLoading(false);
      setLoadingMessage("প্রক্রিয়াকরণ");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 px-4 py-8 font-noto">
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

      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-400 flex items-center justify-center shadow-md shadow-indigo-200">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">কর্মী ব্যবস্থাপনা</h1>
              <p className="text-sm text-slate-400">অ্যাকাউন্ট ও অনুমতি পরিচালনা করুন</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/lab-management"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white/60 text-slate-600 hover:bg-slate-50 transition-all text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" /> ফিরে
            </Link>
            <button
              onClick={() => {
                setFormData({ ...initialData, type: "addStaff" });
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium shadow-lg shadow-indigo-200 transition-all active:scale-95"
            >
              <UserPlus className="w-4 h-4" /> নতুন কর্মী
            </button>
          </div>
        </div>

        {/* Stats */}
        {!initialLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {STATS_CONFIG.map(({ key, label, icon: Icon, color, bg }) => (
              <div
                key={key}
                className={`${bg} border border-slate-200/80 rounded-2xl px-3 py-3 shadow-sm flex items-center gap-2`}
              >
                <div className={`${bg} p-1.5 rounded-xl`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <div>
                  <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{label}</p>
                  <p className={`text-lg font-bold ${color}`}>{stats[key]}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Main Card */}
        {initialLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonStaff key={i} />
            ))}
          </div>
        ) : (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/80 shadow-xl shadow-slate-200/30 overflow-hidden">
            {/* Card Header */}
            <div className="px-6 py-4 border-b border-slate-200/80 bg-slate-50/50 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">কর্মী লেজার</p>
                <p className="text-sm text-slate-500">মোট {stats.total} জন</p>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="px-4 py-3 border-b border-slate-200/80 bg-slate-50/30 flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[160px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="নাম, ইমেইল বা ফোন…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  disabled={initialLoading}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <select
                value={permissionFilter}
                onChange={(e) => setPermissionFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all appearance-none cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 10px center",
                  paddingRight: "32px",
                }}
                disabled={initialLoading}
              >
                {PERMISSION_FILTERS.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all appearance-none cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 10px center",
                  paddingRight: "32px",
                }}
                disabled={initialLoading}
              >
                {STATUS_FILTERS.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>

              {hasFilters && (
                <button
                  onClick={() => {
                    setPermissionFilter("all");
                    setStatusFilter("all");
                    setSearchQuery("");
                  }}
                  disabled={initialLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 border border-rose-200/60 transition-all disabled:opacity-50"
                >
                  <RotateCcw className="w-4 h-4" /> রিসেট
                </button>
              )}
            </div>

            {/* List Header */}
            <div className="px-6 pt-3 pb-1 flex items-center gap-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <span className="w-6">#</span>
              <span className="flex-1">কর্মী</span>
              <span className="w-24 text-right">অনুমতি</span>
              <span className="w-8" />
            </div>

            {/* Rows */}
            <div className="px-6 pb-4">
              {filteredStaff.length === 0 ? (
                <div className="flex items-center gap-2 py-8 text-slate-400">
                  <AlertCircle className="w-5 h-5" />
                  <p className="text-sm">
                    {hasFilters ? "কোনো কর্মী পাওয়া যায়নি" : "এখনো কোনো কর্মী যোগ করা হয়নি"}
                  </p>
                </div>
              ) : (
                <>
                  {/* Admins */}
                  {admins.length > 0 && (
                    <>
                      <SectionHeader title="প্রশাসক" count={admins.length} />
                      <div className="space-y-2">
                        {admins.map((item, index) => (
                          <Staff
                            key={item._id}
                            input={item}
                            index={index}
                            onEdit={() => {
                              setFormData({
                                name: item.name || "",
                                email: item.email || "",
                                phone: item.phone || "",
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
                                message: `${item.name} কে মুছে ফেলবেন?`,
                                action: "delete",
                                _id: item._id,
                              })
                            }
                            onDeactivate={() =>
                              setPopup({
                                type: "warning",
                                message: `${item.name} কে নিষ্ক্রিয় করবেন?`,
                                action: "deactivate",
                                _id: item._id,
                              })
                            }
                            onActivate={() =>
                              setPopup({
                                type: "warning",
                                message: `${item.name} কে সক্রিয় করবেন?`,
                                action: "activate",
                                _id: item._id,
                              })
                            }
                          />
                        ))}
                      </div>
                    </>
                  )}

                  {/* Staff */}
                  {staffMembers.length > 0 && (
                    <>
                      <SectionHeader title="কর্মী" count={staffMembers.length} />
                      <div className="space-y-2">
                        {staffMembers.map((item, index) => (
                          <Staff
                            key={item._id}
                            input={item}
                            index={index}
                            onEdit={() => {
                              setFormData({
                                name: item.name || "",
                                email: item.email || "",
                                phone: item.phone || "",
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
                                message: `${item.name} কে মুছে ফেলবেন?`,
                                action: "delete",
                                _id: item._id,
                              })
                            }
                            onDeactivate={() =>
                              setPopup({
                                type: "warning",
                                message: `${item.name} কে নিষ্ক্রিয় করবেন?`,
                                action: "deactivate",
                                _id: item._id,
                              })
                            }
                            onActivate={() =>
                              setPopup({
                                type: "warning",
                                message: `${item.name} কে সক্রিয় করবেন?`,
                                action: "activate",
                                _id: item._id,
                              })
                            }
                          />
                        ))}
                      </div>
                    </>
                  )}

                  {/* Others */}
                  {others.length > 0 && (
                    <>
                      <SectionHeader title="অন্যান্য" count={others.length} />
                      <div className="space-y-2">
                        {others.map((item, index) => (
                          <Staff
                            key={item._id}
                            input={item}
                            index={index}
                            onEdit={() => {
                              setFormData({
                                name: item.name || "",
                                email: item.email || "",
                                phone: item.phone || "",
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
                                message: `${item.name} কে মুছে ফেলবেন?`,
                                action: "delete",
                                _id: item._id,
                              })
                            }
                            onDeactivate={() =>
                              setPopup({
                                type: "warning",
                                message: `${item.name} কে নিষ্ক্রিয় করবেন?`,
                                action: "deactivate",
                                _id: item._id,
                              })
                            }
                            onActivate={() =>
                              setPopup({
                                type: "warning",
                                message: `${item.name} কে সক্রিয় করবেন?`,
                                action: "activate",
                                _id: item._id,
                              })
                            }
                          />
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>

            <div className="px-6 py-2.5 border-t border-slate-200/80 bg-slate-50/30">
              <p className="text-[10px] text-slate-400">* শুধুমাত্র সক্রিয় কর্মীরা সিস্টেমে প্রবেশ করতে পারবেন</p>
            </div>
          </div>
        )}

        <Modal isOpen={isModalOpen} size="lg" onClose={handleClose}>
          <StaffForm formData={formData} onChange={handleFormChange} onSubmit={handleSubmit} onClose={handleClose} />
        </Modal>

        <p className="text-center text-xs text-slate-400 mt-6 pb-4 border-t border-slate-200/50 pt-4">
          ল্যাবপাইলটপ্রো · কর্মী ব্যবস্থাপনা সিস্টেম
        </p>
      </div>
    </div>
  );
};

export default ManageStaff;