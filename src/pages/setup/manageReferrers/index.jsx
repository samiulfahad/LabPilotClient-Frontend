import { useEffect, useState, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  ArrowLeft,
  Search,
  X,
  RotateCcw,
  UserPlus,
  UserCheck,
  UserX,
  Stethoscope,
  Briefcase,
  Building2,
  AlertCircle,
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

const Skeleton = () => (
  <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden animate-pulse">
    <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex gap-4">
      {[120, 70, 90].map((w, i) => (
        <div key={i} className="h-3 bg-slate-200 rounded" style={{ width: w }} />
      ))}
    </div>
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="flex items-center gap-3 px-6 py-3 border-b border-slate-100">
        <div className="w-5 h-3 bg-slate-200 rounded" />
        <div className="flex-1 h-3 bg-slate-200 rounded" />
        <div className="w-16 h-3 bg-slate-200 rounded" />
      </div>
    ))}
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
  const [search, setSearch] = useState("");
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

  const filteredReferrers = useMemo(
    () =>
      referrers.filter((r) => {
        if (typeFilter !== "all" && r.type !== typeFilter) return false;
        if (statusFilter === "active" && !r.isActive) return false;
        if (statusFilter === "inactive" && r.isActive) return false;
        if (search.trim()) {
          const q = search.toLowerCase();
          return r.name.toLowerCase().includes(q) || r.contactNumber.includes(q) || r.degree?.toLowerCase().includes(q);
        }
        return true;
      }),
    [referrers, typeFilter, statusFilter, search],
  );

  const handleFormChange = (field, value) => setFormData((p) => ({ ...p, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name?.trim()) return setPopup({ type: "error", message: "Name is required" });
    if (!formData.contactNumber?.trim()) return setPopup({ type: "error", message: "Contact number is required" });
    try {
      setLoading(true);
      setLoadingMessage(formData.formType === "addReferrer" ? "Creating referrer" : "Updating referrer");
      if (formData.formType === "addReferrer") {
        await referrerService.addReferrer(formData);
      } else {
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
      setPopup({ type: "error", message: e?.response?.data?.error || "Could not save referrer" });
    } finally {
      setLoading(false);
      setLoadingMessage("Processing request");
    }
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
    }
  };

  const handleToggleStatus = async (isActivating) => {
    try {
      setLoading(true);
      setLoadingMessage(isActivating ? "Activating referrer" : "Deactivating referrer");
      if (isActivating) {
        await referrerService.activateReferrer(popup._id);
      } else {
        await referrerService.deactivateReferrer(popup._id);
      }
      setReferrers((prev) => prev.map((r) => (r._id === popup._id ? { ...r, isActive: isActivating } : r)));
      setPopup({
        type: "success",
        message: `Referrer ${isActivating ? "activated" : "deactivated"} successfully`,
      });
    } catch (e) {
      setPopup({ type: "error", message: e?.response?.data?.error || "Could not update status" });
    } finally {
      setLoading(false);
    }
  };

  const hasFilters = typeFilter !== "all" || statusFilter !== "all";

  // Removed "সক্রিয়" from stat items
  const statItems = [
    { label: "মোট", value: stats.total, icon: Users, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "ডাক্তার", value: stats.doctors, icon: Stethoscope, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "এজেন্ট", value: stats.agents, icon: Briefcase, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "প্রতিষ্ঠান", value: stats.institutes, icon: Building2, color: "text-teal-600", bg: "bg-teal-50" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 px-4 py-8 font-noto">
      {loading && <LoadingScreen message={loadingMessage} />}
      {popup && (
        <Popup
          type={popup.type}
          message={popup.message}
          onClose={() => setPopup(null)}
          onConfirm={
            popup.action === "delete"
              ? handleDelete
              : popup.action === "deactivate"
                ? () => handleToggleStatus(false)
                : popup.action === "activate"
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
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">রেফারার ব্যবস্থাপনা</h1>
              <p className="text-sm text-slate-400">রেফারেল ও কমিশন পরিচালনা করুন</p>
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
                setFormData({ ...initialData, formType: "addReferrer" });
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium shadow-lg shadow-indigo-200 transition-all active:scale-95"
            >
              <UserPlus className="w-4 h-4" /> নতুন রেফারার
            </button>
          </div>
        </div>

        {/* Stats */}
        {!initialLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {statItems.map(({ label, value, icon: Icon, color, bg }) => (
              <div
                key={label}
                className={`${bg} border border-slate-200/80 rounded-2xl px-3 py-3 shadow-sm flex items-center gap-2`}
              >
                <div className={`${bg} p-1.5 rounded-xl`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <div>
                  <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{label}</p>
                  <p className={`text-lg font-bold ${color}`}>{value}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Main Card */}
        {initialLoading ? (
          <Skeleton />
        ) : (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/80 shadow-xl shadow-slate-200/30 overflow-hidden">
            {/* Card Header */}
            <div className="px-6 py-4 border-b border-slate-200/80 bg-slate-50/50 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">রেফারার লেজার</p>
                <p className="text-sm text-slate-500">মোট {stats.total} জন</p>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="px-4 py-3 border-b border-slate-200/80 bg-slate-50/30 flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[160px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="নাম, নম্বর বা ডিগ্রি…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all appearance-none cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 10px center",
                  paddingRight: "32px",
                }}
              >
                <option value="all">সব ধরন</option>
                <option value="doctor">ডাক্তার</option>
                <option value="agent">এজেন্ট</option>
                <option value="institute">প্রতিষ্ঠান</option>
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
              >
                <option value="all">সব স্ট্যাটাস</option>
                <option value="active">সক্রিয়</option>
                <option value="inactive">নিষ্ক্রিয়</option>
              </select>

              {hasFilters && (
                <button
                  onClick={() => {
                    setTypeFilter("all");
                    setStatusFilter("all");
                    setSearch("");
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 border border-rose-200/60 transition-all"
                >
                  <RotateCcw className="w-4 h-4" /> রিসেট
                </button>
              )}
            </div>

            {/* List Header */}
            <div className="px-6 pt-3 pb-1 flex items-center gap-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <span className="w-6">#</span>
              <span className="flex-1">রেফারার</span>
              <span className="w-24 text-right">কমিশন</span>
              <span className="w-8" />
            </div>

            {/* Rows */}
            <div className="px-6 pb-4">
              {filteredReferrers.length === 0 ? (
                <div className="flex items-center gap-2 py-8 text-slate-400">
                  <AlertCircle className="w-5 h-5" />
                  <p className="text-sm">
                    {hasFilters || search ? "কোনো রেফারার পাওয়া যায়নি" : "এখনো কোনো রেফারার যোগ করা হয়নি"}
                  </p>
                </div>
              ) : (
                filteredReferrers.map((item, index) => (
                  <Referrer
                    key={item._id}
                    input={item}
                    index={index}
                    onEdit={() => {
                      setFormData({ ...item, formType: "editReferrer" });
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
                ))
              )}
            </div>

            <div className="px-6 py-2.5 border-t border-slate-200/80 bg-slate-50/30">
              <p className="text-[10px] text-slate-400">* শুধুমাত্র সক্রিয় রেফারারের কমিশন প্রযোজ্য</p>
            </div>
          </div>
        )}

        <Modal
          isOpen={isModalOpen}
          size="md"
          onClose={() => {
            setIsModalOpen(false);
            setFormData(initialData);
          }}
        >
          <ReferrerForm
            formData={formData}
            onChange={handleFormChange}
            onSubmit={handleSubmit}
            onClose={() => {
              setIsModalOpen(false);
              setFormData(initialData);
            }}
          />
        </Modal>

        <p className="text-center text-xs text-slate-400 mt-6 pb-4 border-t border-slate-200/50 pt-4">
          ল্যাবপাইলটপ্রো · রেফারার ম্যানেজমেন্ট সিস্টেম
        </p>
      </div>
    </div>
  );
};

export default ManageReferrer;
