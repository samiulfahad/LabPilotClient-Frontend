/**
 * useCallback / useMemo are intentionally absent throughout this file.
 * babel-plugin-react-compiler handles all memoization automatically.
 */
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { AlertCircle, RotateCcw, X, FileText, Pencil, CheckCircle2 } from "lucide-react";
import SchemaRenderer from "./SchemaRenderer";
import testService from "../../api/test";
import reportService from "../../api/report";

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

// ─── Error state ──────────────────────────────────────────────────────────────

function ErrorState({ message, onRetry }) {
  return (
    <div className="flex items-center justify-center py-16 px-6 font-noto">
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm py-9 px-8 max-w-[360px] w-full text-center">
        <div className="w-12 h-12 bg-red-50 border border-red-200 rounded-xl flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-5 h-5 text-red-500" />
        </div>
        <div className="text-base font-bold text-slate-900 mb-2 tracking-tight">Failed to Load</div>
        <div className="text-[13px] text-slate-500 leading-relaxed mb-5">
          {message || "Something went wrong while loading the report."}
        </div>
        <button
          className="inline-flex items-center gap-2 py-2.5 px-5 bg-slate-900 text-white rounded-lg text-[13px] font-semibold transition-colors hover:bg-slate-800"
          onClick={onRetry}
        >
          <RotateCcw className="w-[13px] h-[13px]" />
          Try Again
        </button>
      </div>
    </div>
  );
}

// ─── Success / Error Modal ────────────────────────────────────────────────────

function ResultModal({ type, message, onGoBack, onDismiss }) {
  const isSuccess = type === "success";
  return (
    <div
      className="fixed inset-0 z-[10000] bg-slate-900/55 backdrop-blur-sm flex items-center justify-center p-6 animate-[ur-fade-in_0.2s_ease]"
      onClick={isSuccess ? onGoBack : onDismiss}
    >
      <div
        className="bg-white rounded-2xl py-10 px-9 max-w-[380px] w-full text-center shadow-2xl animate-[ur-pop-in_0.3s_cubic-bezier(0.34,1.56,0.64,1)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 border-2 ${
            isSuccess ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"
          }`}
        >
          {isSuccess ? (
            <CheckCircle2 className="w-[30px] h-[30px] text-emerald-600" />
          ) : (
            <AlertCircle className="w-[30px] h-[30px] text-red-500" />
          )}
        </div>
        <div className="font-noto text-xl font-extrabold text-slate-900 tracking-tight mb-2">
          {isSuccess ? "All Done!" : "Something went wrong"}
        </div>
        <div className="text-[13.5px] text-slate-500 leading-relaxed mb-7">{message}</div>
        {isSuccess ? (
          <button
            className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-xl text-white text-sm font-bold tracking-wide bg-emerald-600 shadow-md shadow-emerald-200 transition-colors hover:bg-emerald-700"
            onClick={onGoBack}
          >
            Back to Reports
          </button>
        ) : (
          <button
            className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-xl text-white text-sm font-bold tracking-wide bg-slate-900 transition-colors hover:bg-slate-800"
            onClick={onDismiss}
          >
            Dismiss
          </button>
        )}
      </div>
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
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [resultModal, setResultModal] = useState(null);
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
    if (resultModal?.type === "success") {
      goBack();
      return;
    }
    setClosing(true);
    setTimeout(() => navigate(-1), 250);
  };

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [resultModal]);

  const fetchData = async () => {
    const hasRequiredIds = isIndoor ? patientId && testId : invoiceId && testId;
    if (!hasRequiredIds) {
      setError("Missing patient or test information.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

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
      setError(e?.response?.data?.message || e?.message || "Failed to load report data.");
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
      setResultModal({
        type: "success",
        message: "Report submitted successfully. Click below to return to the reports page.",
      });
    } catch (e) {
      setResultModal({ type: "error", message: e?.response?.data?.message || "Could not submit report." });
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
      setResultModal({
        type: "success",
        message: "Report updated successfully. Click below to return to the reports page.",
      });
    } catch (e) {
      setResultModal({ type: "error", message: e?.response?.data?.message || "Could not update report." });
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
        @keyframes ur-fade-in   { from { opacity: 0; } to { opacity: 1; } }
        @keyframes ur-pop-in    { from { opacity: 0; transform: scale(0.85); } to { opacity: 1; transform: scale(1); } }

        .ur-drawer-body-scroll::-webkit-scrollbar { width: 4px; }
        .ur-drawer-body-scroll::-webkit-scrollbar-track { background: transparent; }
        .ur-drawer-body-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
      `}</style>

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
          {!loading && error && <ErrorState message={error} onRetry={fetchData} />}
          {!loading && !error && schema && (
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

      {resultModal && (
        <ResultModal
          type={resultModal.type}
          message={resultModal.message}
          onGoBack={goBack}
          onDismiss={() => setResultModal(null)}
        />
      )}
    </>
  );
}

function ReportUpload() {
  return createPortal(<ReportUploadInner />, document.body);
}

export default ReportUpload;
