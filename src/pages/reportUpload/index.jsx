/**
 * useCallback / useMemo are intentionally absent throughout this file.
 * babel-plugin-react-compiler handles all memoization automatically.
 */
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { X, FileText, Pencil } from "lucide-react";
import SchemaRenderer from "./SchemaRenderer";
import testService from "../../api/test";
import reportService from "../../api/report";
import Popup from "../../components/popup";

// ─── Error helpers (mirrors ManageReferrer.jsx / CashMemo.jsx / DeleteInvoices.jsx) ──

const PERMISSION_DENIED_MESSAGE = "আপনার কর্তৃপক্ষ আপনাকে এই কাজটি করার বা এই তথ্যটি পাওয়ার অনুমতি দেয়নি।";

const getErrorMessage = (err, fallback) => {
  if (err?.response?.status === 403) return PERMISSION_DENIED_MESSAGE;
  return err?.response?.data?.message ?? err?.response?.data?.error ?? fallback;
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const Shimmer = ({ className = "" }) => <div className={`bg-slate-200 rounded-md animate-pulse ${className}`} />;

function SkeletonLoader() {
  return (
    <div className="max-w-5xl mx-auto p-5 space-y-3 font-noto">
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
        <div className="flex gap-3.5 mb-5">
          <Shimmer className="w-11 h-11 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2.5">
            <Shimmer className="h-2.5 w-2/5" />
            <Shimmer className="h-5 w-2/3" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2.5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2">
              <Shimmer className="h-2 w-3/5" />
              <Shimmer className="h-5 w-2/5" />
            </div>
          ))}
        </div>
      </div>
      {[...Array(2)].map((_, si) => (
        <div key={si} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="bg-slate-900 py-3.5 px-[18px] flex items-center gap-2.5">
            <Shimmer className="w-7 h-7 rounded-md bg-white/10" />
            <Shimmer className="h-[11px] flex-1 bg-white/10" />
          </div>
          <div className="p-5 grid grid-cols-2 md:grid-cols-3 gap-x-5 gap-y-4">
            {[...Array(si === 0 ? 4 : 2)].map((_, fi) => (
              <div key={fi} className="space-y-1.5">
                <div className="border border-slate-200 rounded-lg px-3.5 py-3 space-y-2.5">
                  <Shimmer className="h-2 w-3/5" />
                  <Shimmer className="h-4 w-2/5" />
                </div>
                <Shimmer className="h-2 w-2/5" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

function ReportUploadInner() {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    invoiceId,
    patientId,
    testId,
    testName: stateTestName,
    isEdit = false,
    type = "outdoor",
    addedAt = null, // ← disambiguates duplicate test entries for indoor
  } = location.state ?? {};

  const isIndoor = type === "indoor";

  const [schema, setSchema] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const [existingReport, setExistingReport] = useState(null);
  const [resolvedName, setResolvedName] = useState(stateTestName ?? "Report");
  const [admissionId, setAdmissionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [popup, setPopup] = useState(null);
  const [closing, setClosing] = useState(false);

  const goBack = () => {
    setClosing(true);
    setTimeout(() => {
      if (isIndoor) {
        navigate("/report", { state: { admissionId } });
      } else {
        navigate("/report", { state: { invoiceId } });
      }
    }, 250);
  };

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => navigate(-1), 250);
  };

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const fetchData = async () => {
    const hasRequiredIds = isIndoor ? patientId && testId : invoiceId && testId;
    if (!hasRequiredIds) {
      setLoadFailed(true);
      setLoading(false);
      setPopup({ type: "error", message: "Missing patient or test information.", onClose: handleClose });
      return;
    }

    setLoading(true);
    setLoadFailed(false);

    try {
      if (isIndoor) {
        // Pass addedAt so backend returns the exact entry when duplicates exist
        const { data } = await reportService.getIndoorReport(patientId, testId, addedAt);
        setAdmissionId(data.admissionId);
        setResolvedName(data.testName ?? stateTestName ?? "Report");
        setInvoice({ invoiceId: data.admissionId, patient: data.patient });
        if (isEdit && data.report && Object.keys(data.report).length > 0) {
          setExistingReport(data.report);
        }
        const schemaRes = await testService.getSchemaBySchemaId(data.schemaId);
        setSchema(schemaRes.data);
      } else {
        const { data } = await reportService.getReport(invoiceId, testId);
        setResolvedName(data.testName ?? stateTestName ?? "Report");
        setInvoice({ invoiceId: data.invoiceId, patient: data.patient });
        if (isEdit && data.report && Object.keys(data.report).length > 0) {
          setExistingReport(data.report);
        }
        const schemaRes = await testService.getSchemaBySchemaId(data.schemaId);
        setSchema(schemaRes.data);
      }
    } catch (e) {
      setLoadFailed(true);
      setPopup({ type: "error", message: getErrorMessage(e, "Failed to load report data."), onClose: handleClose });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (payload) => {
    try {
      setSubmitting(true);
      if (isIndoor) {
        // addedAt not needed for add — backend finds first incomplete entry
        await reportService.addIndoorReport({ report: payload, patientId, testId });
      } else {
        await reportService.addReport({ report: payload, invoiceId, testId });
      }
      setPopup({ type: "success", message: "Report submitted successfully.", onClose: goBack });
    } catch (e) {
      setPopup({ type: "error", message: getErrorMessage(e, "Could not submit report.") });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (payload) => {
    try {
      setSubmitting(true);
      if (isIndoor) {
        // addedAt required — identifies the exact entry among duplicates
        await reportService.updateIndoorReport({ report: payload, patientId, testId, addedAt });
      } else {
        await reportService.updateReport({ report: payload, invoiceId, testId });
      }
      setPopup({ type: "success", message: "Report updated successfully.", onClose: goBack });
    } catch (e) {
      setPopup({ type: "error", message: getErrorMessage(e, "Could not update report.") });
    } finally {
      setSubmitting(false);
    }
  };

  const headerSubtitle = isIndoor
    ? admissionId
      ? `Admission #${admissionId}`
      : "Indoor Patient"
    : invoiceId
      ? `Invoice #${invoiceId}`
      : "New Report";

  return (
    <>
      <style>{`
        @keyframes ur-slide-in  { from { transform: translateX(-100%); } to { transform: translateX(0); } }
        @keyframes ur-slide-out { from { transform: translateX(0); } to { transform: translateX(-100%); } }

        .ur-drawer-body-scroll::-webkit-scrollbar { width: 4px; }
        .ur-drawer-body-scroll::-webkit-scrollbar-track { background: transparent; }
        .ur-drawer-body-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
      `}</style>

      {popup && (
        <Popup
          type={popup.type}
          message={popup.message}
          onClose={() => {
            const after = popup.onClose;
            setPopup(null);
            if (after) after();
          }}
        />
      )}

      <div
        className={`fixed inset-0 z-[9999] bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex flex-col ${
          closing
            ? "animate-[ur-slide-out_0.25s_cubic-bezier(0.32,0,0.67,0)_forwards]"
            : "animate-[ur-slide-in_0.3s_cubic-bezier(0.32,0.72,0,1)_forwards]"
        }`}
      >
        {/* Header */}
        <div className="flex items-center gap-3 py-4 px-5 bg-gradient-to-br from-slate-100 via-blue-100 to-indigo-100 border-b border-slate-200 shrink-0 shadow-sm">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
              isEdit ? "bg-violet-100 border-violet-200" : "bg-blue-100 border-blue-200"
            }`}
          >
            {isEdit ? <Pencil className="w-4 h-4 text-violet-600" /> : <FileText className="w-4 h-4 text-blue-600" />}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-noto text-sm font-bold text-slate-900 tracking-tight leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
              {isEdit ? `Edit — ${resolvedName}` : `Upload — ${resolvedName}`}
            </h2>
            <p className="font-mono text-[10px] text-slate-500 mt-0.5 uppercase tracking-wider">{headerSubtitle}</p>
          </div>
          <button
            className="w-9 h-9 rounded-lg bg-white/70 border border-slate-200 flex items-center justify-center text-slate-500 transition-colors shrink-0 hover:bg-red-50 hover:border-red-200 hover:text-red-600"
            onClick={handleClose}
            title="Close (Esc)"
          >
            <X className="w-[17px] h-[17px]" />
          </button>
        </div>

        {/* Body */}
        <div className="ur-drawer-body-scroll flex-1 overflow-y-auto overscroll-contain">
          {loading && <SkeletonLoader />}
          {!loading && !loadFailed && schema && (
            <SchemaRenderer
              schema={schema}
              invoice={invoice}
              onSubmit={handleSubmit}
              onUpdate={handleUpdate}
              loading={submitting}
              existingReport={isEdit ? existingReport : null}
            />
          )}
        </div>
      </div>
    </>
  );
}

function ReportUpload() {
  return createPortal(<ReportUploadInner />, document.body);
}

export default ReportUpload;
