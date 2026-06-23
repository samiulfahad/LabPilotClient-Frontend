import { useEffect, useState, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Search,
  X,
  Users,
  ArrowLeft,
  AlertCircle,
  RotateCcw,
  UserPlus,
  Stethoscope,
  Briefcase,
  Building2,
  UserCheck,
  ChevronDown,
} from "lucide-react";
import Modal from "../../../components/modal";
import Popup from "../../../components/popup";
import Referrer from "./Referrer";
import ReferrerForm from "./ReferrerForm";
import referrerService from "../../../api/referrer";
import LoadingScreen from "../../../components/loadingPage";

const C = {
  ink: "#1C1F1E",
  muted: "#A8ACA3",
  sub: "#6F756F",
  border: "#E3E0D6",
  dashed: "#D8D5CB",
  paper: "#FAF9F5",
  hover: "#F0EFE9",
  divider: "#EDEBE3",
  teal: "#0F6E5C",
  blue: "#1E4FA0",
  red: "#C0312B",
  amber: "#92400E",
};

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
  <div className="bg-white animate-pulse" style={{ border: `1px solid ${C.border}`, borderRadius: "3px" }}>
    <div className="px-6 py-4 flex gap-4" style={{ borderBottom: `1px solid ${C.border}`, background: C.paper }}>
      {[120, 70, 90].map((w, i) => (
        <div key={i} style={{ height: "11px", width: `${w}px`, background: "#E5E3DB", borderRadius: "2px" }} />
      ))}
    </div>
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="flex items-center gap-3 px-6 py-3" style={{ borderBottom: `1px solid ${C.divider}` }}>
        <div style={{ width: "20px", height: "10px", background: "#E5E3DB", borderRadius: "2px" }} />
        <div style={{ flex: 1, height: "12px", background: "#E5E3DB", borderRadius: "2px" }} />
        <div style={{ width: "60px", height: "12px", background: "#E5E3DB", borderRadius: "2px" }} />
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
      formData.formType === "addReferrer"
        ? await referrerService.addReferrer(formData)
        : await referrerService.editReferrer(formData);
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
      await (isActivating
        ? referrerService.activateReferrer(popup._id)
        : referrerService.deactivateReferrer(popup._id));
      setReferrers((prev) => prev.map((r) => (r._id === popup._id ? { ...r, isActive: isActivating } : r)));
      setPopup({ type: "success", message: `Referrer ${isActivating ? "activated" : "deactivated"} successfully` });
    } catch (e) {
      setPopup({ type: "error", message: e?.response?.data?.error || "Could not update status" });
    } finally {
      setLoading(false);
    }
  };

  const hasFilters = typeFilter !== "all" || statusFilter !== "all";

  const inputStyle = {
    border: `1px solid ${C.dashed}`,
    borderRadius: "2px",
    background: C.paper,
    color: C.ink,
    fontFamily: "'IBM Plex Mono', monospace",
  };

  const TYPE_FILTERS = [
    { key: "all", label: "সব" },
    { key: "doctor", label: "ডাক্তার" },
    { key: "agent", label: "এজেন্ট" },
    { key: "institute", label: "প্রতিষ্ঠান" },
  ];

  const STATUS_FILTERS = [
    { key: "all", label: "সব" },
    { key: "active", label: "সক্রিয়" },
    { key: "inactive", label: "নিষ্ক্রিয়" },
  ];

  return (
    <section
      className="min-h-screen px-4 py-6"
      style={{
        backgroundColor: "#F5F4EF",
        backgroundImage: "radial-gradient(circle, rgba(28,31,30,0.045) 1px, transparent 1px)",
        backgroundSize: "18px 18px",
        fontFamily: "'IBM Plex Sans', sans-serif",
      }}
    >
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
        <div className="flex items-start justify-between mb-5">
          <div>
            <p
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "10px",
                textTransform: "uppercase",
                letterSpacing: ".1em",
                color: C.teal,
                marginBottom: "4px",
              }}
            >
              ল্যাব অপারেশন
            </p>
            <h1
              style={{
                fontFamily: "'IBM Plex Sans', sans-serif",
                fontSize: "26px",
                fontWeight: 600,
                color: C.ink,
                lineHeight: 1.2,
                margin: 0,
              }}
            >
              রেফারার ব্যবস্থাপনা
            </h1>
            <p style={{ fontSize: "14px", color: "#767D78", marginTop: "4px" }}>রেফারেল ও কমিশন পরিচালনা।</p>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Link
              to="/lab-management"
              className="flex items-center gap-1.5 transition-colors"
              style={{
                padding: "7px 12px",
                border: `1px solid ${C.ink}18`,
                borderRadius: "2px",
                color: C.sub,
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "11px",
                textTransform: "uppercase",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = C.ink;
                e.currentTarget.style.color = "white";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "";
                e.currentTarget.style.color = C.sub;
              }}
            >
              <ArrowLeft style={{ width: "13px", height: "13px" }} /> ফিরে
            </Link>
            <button
              onClick={() => {
                setFormData({ ...initialData, formType: "addReferrer" });
                setIsModalOpen(true);
              }}
              className="flex items-center gap-1.5 transition-colors"
              style={{
                padding: "7px 14px",
                border: `1px solid ${C.teal}`,
                borderRadius: "2px",
                color: C.teal,
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "11px",
                textTransform: "uppercase",
                fontWeight: 600,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = C.teal;
                e.currentTarget.style.color = "white";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "";
                e.currentTarget.style.color = C.teal;
              }}
            >
              <UserPlus style={{ width: "13px", height: "13px" }} /> নতুন
            </button>
          </div>
        </div>

        {/* Stats strip */}
        {!initialLoading && (
          <div className="grid grid-cols-5 gap-2 mb-4">
            {[
              { label: "মোট", value: stats.total, color: C.ink },
              { label: "সক্রিয়", value: stats.active, color: C.teal },
              { label: "ডাক্তার", value: stats.doctors, color: C.blue },
              { label: "এজেন্ট", value: stats.agents, color: C.amber },
              { label: "প্রতিষ্ঠান", value: stats.institutes, color: C.teal },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                className="bg-white"
                style={{ border: `1px solid ${C.border}`, borderRadius: "3px", padding: "10px 14px" }}
              >
                <p
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: "9px",
                    textTransform: "uppercase",
                    letterSpacing: ".06em",
                    color: C.muted,
                    marginBottom: "5px",
                  }}
                >
                  {label}
                </p>
                <p
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: "22px",
                    fontWeight: 700,
                    color,
                    lineHeight: 1,
                    margin: 0,
                  }}
                >
                  {value}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Ledger card */}
        {initialLoading ? (
          <Skeleton />
        ) : (
          <div
            className="bg-white"
            style={{ border: `1px solid ${C.border}`, borderRadius: "3px", boxShadow: "0 1px 3px rgba(28,31,30,0.05)" }}
          >
            {/* Card head */}
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: `1px solid ${C.border}`, background: C.paper }}
            >
              <div>
                <p
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: "10px",
                    textTransform: "uppercase",
                    letterSpacing: ".1em",
                    color: C.teal,
                    marginBottom: "4px",
                  }}
                >
                  রেফারার লেজার
                </p>
                <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "13px", color: C.sub }}>
                  মোট {stats.total}জন · {stats.active}জন সক্রিয়
                </p>
              </div>
            </div>

            {/* Toolbar */}
            <div
              className="px-6 py-3 flex flex-wrap items-center gap-3"
              style={{ borderBottom: `1px solid ${C.border}`, background: C.paper }}
            >
              <div className="relative" style={{ flex: "1 1 160px" }}>
                <Search
                  style={{
                    width: "12px",
                    height: "12px",
                    color: C.muted,
                    position: "absolute",
                    left: "9px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    pointerEvents: "none",
                  }}
                />
                <input
                  type="text"
                  placeholder="নাম, নম্বর বা ডিগ্রি…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    ...inputStyle,
                    width: "100%",
                    padding: "7px 28px 7px 28px",
                    fontSize: "11px",
                    outline: "none",
                  }}
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    style={{
                      position: "absolute",
                      right: "8px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: C.muted,
                    }}
                  >
                    <X style={{ width: "12px", height: "12px" }} />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1">
                <span
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: "9.5px",
                    textTransform: "uppercase",
                    letterSpacing: ".07em",
                    color: C.muted,
                    marginRight: "4px",
                  }}
                >
                  ধরন
                </span>
                {TYPE_FILTERS.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setTypeFilter(key)}
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: "10px",
                      textTransform: "uppercase",
                      letterSpacing: ".06em",
                      border: `1px solid ${typeFilter === key ? `${C.ink}44` : "transparent"}`,
                      borderRadius: "2px",
                      padding: "4px 10px",
                      cursor: "pointer",
                      transition: "all .12s",
                      background: typeFilter === key ? C.ink : "transparent",
                      color: typeFilter === key ? "white" : C.sub,
                    }}
                    onMouseEnter={(e) => {
                      if (typeFilter !== key) {
                        e.currentTarget.style.borderColor = C.dashed;
                        e.currentTarget.style.background = C.divider;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (typeFilter !== key) {
                        e.currentTarget.style.borderColor = "transparent";
                        e.currentTarget.style.background = "transparent";
                      }
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1">
                <span
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: "9.5px",
                    textTransform: "uppercase",
                    letterSpacing: ".07em",
                    color: C.muted,
                    marginRight: "4px",
                  }}
                >
                  স্ট্যাটাস
                </span>
                {STATUS_FILTERS.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setStatusFilter(key)}
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: "10px",
                      textTransform: "uppercase",
                      letterSpacing: ".06em",
                      border: `1px solid ${statusFilter === key ? `${C.ink}44` : "transparent"}`,
                      borderRadius: "2px",
                      padding: "4px 10px",
                      cursor: "pointer",
                      transition: "all .12s",
                      background: statusFilter === key ? C.ink : "transparent",
                      color: statusFilter === key ? "white" : C.sub,
                    }}
                    onMouseEnter={(e) => {
                      if (statusFilter !== key) {
                        e.currentTarget.style.borderColor = C.dashed;
                        e.currentTarget.style.background = C.divider;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (statusFilter !== key) {
                        e.currentTarget.style.borderColor = "transparent";
                        e.currentTarget.style.background = "transparent";
                      }
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {hasFilters && (
                <button
                  onClick={() => {
                    setTypeFilter("all");
                    setStatusFilter("all");
                  }}
                  className="flex items-center gap-1 transition-colors"
                  style={{
                    marginLeft: "auto",
                    padding: "5px 10px",
                    border: `1px solid ${C.red}33`,
                    borderRadius: "2px",
                    color: C.red,
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: "10px",
                    textTransform: "uppercase",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = `${C.red}08`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "";
                  }}
                >
                  <RotateCcw style={{ width: "11px", height: "11px" }} /> রিসেট
                </button>
              )}
            </div>

            {/* Column labels */}
            <div className="flex items-center gap-3 px-6 pt-3 pb-1">
              <span
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: "9px",
                  textTransform: "uppercase",
                  letterSpacing: ".08em",
                  color: C.muted,
                  width: "20px",
                }}
              >
                #
              </span>
              <span
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: "9px",
                  textTransform: "uppercase",
                  letterSpacing: ".08em",
                  color: C.muted,
                  flex: 1,
                }}
              >
                রেফারার
              </span>
              <span
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: "9px",
                  textTransform: "uppercase",
                  letterSpacing: ".08em",
                  color: C.muted,
                  flexShrink: 0,
                }}
              >
                কমিশন
              </span>
            </div>

            {/* Rows */}
            <div className="px-6 pb-4">
              {filteredReferrers.length === 0 ? (
                <div className="flex items-center gap-2 py-8" style={{ color: C.muted }}>
                  <AlertCircle style={{ width: "13px", height: "13px" }} />
                  <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "11px" }}>
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

            <div className="px-6 py-2.5" style={{ borderTop: `1px solid ${C.border}`, background: C.paper }}>
              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: C.muted }}>
                * শুধুমাত্র সক্রিয় রেফারারের কমিশন প্রযোজ্য
              </p>
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

        <p
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "11px",
            color: C.muted,
            textAlign: "center",
            marginTop: "16px",
            paddingBottom: "24px",
          }}
        >
          LabPilotPro · রেফারার ম্যানেজমেন্ট সিস্টেম
        </p>
      </div>
    </section>
  );
};

export default ManageReferrer;
