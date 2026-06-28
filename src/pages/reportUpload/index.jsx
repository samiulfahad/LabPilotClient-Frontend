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
function SkeletonLoader() {
  return (
    <div className="p-6 px-5 font-['Outfit',_sans-serif]">
      <div className="bg-white border border-[#e4e7ed] rounded-[16px] p-6 mb-3">
        <div className="flex gap-[14px] mb-5">
          <div className="bg-[linear-gradient(90deg,#e4e7ed_25%,#f2f4f7_50%,#e4e7ed_75%)] bg-[length:200%_100%] rounded-lg animate-[ur-shimmer_1.5s_infinite] w-[44px] h-[44px] rounded-[10px] shrink-0" />
          <div className="flex-1">
            <div className="bg-[linear-gradient(90deg,#e4e7ed_25%,#f2f4f7_50%,#e4e7ed_75%)] bg-[length:200%_100%] rounded-lg animate-[ur-shimmer_1.5s_infinite] h-[10px] w-[40%] mb-2.5" />
            <div className="bg-[linear-gradient(90deg,#e4e7ed_25%,#f2f4f7_50%,#e4e7ed_75%)] bg-[length:200%_100%] rounded-lg animate-[ur-shimmer_1.5s_infinite] h-[22px] w-[65%]" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-[#f2f4f7] rounded-[10px] py-3 px-[14px]">
              <div className="bg-[linear-gradient(90deg,#e4e7ed_25%,#f2f4f7_50%,#e4e7ed_75%)] bg-[length:200%_100%] rounded-lg animate-[ur-shimmer_1.5s_infinite] h-2 w-[60%] mb-2" />
              <div className="bg-[linear-gradient(90deg,#e4e7ed_25%,#f2f4f7_50%,#e4e7ed_75%)] bg-[length:200%_100%] rounded-lg animate-[ur-shimmer_1.5s_infinite] h-5 w-[40%]" />
            </div>
          ))}
        </div>
      </div>
      {[...Array(2)].map((_, si) => (
        <div key={si} className="bg-white border border-[#e4e7ed] rounded-[14px] overflow-hidden mb-2.5">
          <div className="bg-[#0d1117] py-[14px] px-[18px] flex items-center gap-2.5">
            <div className="bg-[linear-gradient(90deg,#e4e7ed_25%,#f2f4f7_50%,#e4e7ed_75%)] bg-[length:200%_100%] rounded-lg animate-[ur-shimmer_1.5s_infinite] w-7 h-7 rounded-md bg-white/10" />
            <div className="bg-[linear-gradient(90deg,#e4e7ed_25%,#f2f4f7_50%,#e4e7ed_75%)] bg-[length:200%_100%] rounded-lg animate-[ur-shimmer_1.5s_infinite] h-[11px] flex-1 bg-white/10" />
          </div>
          <div className="py-5 px-[18px] grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-y-[14px] gap-x-[18px]">
            {[...Array(si === 0 ? 4 : 2)].map((_, fi) => (
              <div key={fi}>
                <div className="border-[1.5px] border-[#e4e7ed] rounded-[10px] pt-[18px] pr-[14px] pb-[10px] pl-[12px] min-h-[54px]">
                  <div className="bg-[linear-gradient(90deg,#e4e7ed_25%,#f2f4f7_50%,#e4e7ed_75%)] bg-[length:200%_100%] rounded-lg animate-[ur-shimmer_1.5s_infinite] h-[9px] w-[55%] mb-2.5" />
                  <div className="bg-[linear-gradient(90deg,#e4e7ed_25%,#f2f4f7_50%,#e4e7ed_75%)] bg-[length:200%_100%] rounded-lg animate-[ur-shimmer_1.5s_infinite] h-4 w-[35%]" />
                </div>
                <div className="bg-[linear-gradient(90deg,#e4e7ed_25%,#f2f4f7_50%,#e4e7ed_75%)] bg-[length:200%_100%] rounded-lg animate-[ur-shimmer_1.5s_infinite] h-2 w-[40%] mt-1.5" />
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
    <div className="flex items-center justify-center py-[60px] px-6 font-['Outfit',_sans-serif]">
      <div className="bg-white border border-[#e4e7ed] rounded-[16px] py-9 px-8 max-w-[360px] w-full text-center shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
        <div className="w-12 h-12 bg-[#fef2f2] border-[1.5px] border-[#dc2626]/20 rounded-[12px] flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-5 h-5 text-[#dc2626]" />
        </div>
        <div className="text-base font-bold text-[#0d1117] mb-2 tracking-[-0.02em]">Failed to Load</div>
        <div className="text-[13px] text-[#6b7280] leading-[1.6] mb-5">
          {message || "Something went wrong while loading the report."}
        </div>
        <button
          className="inline-flex items-center gap-[7px] py-2.5 px-5 bg-[#0d1117] text-white border-none rounded-[9px] font-['Outfit',_sans-serif] text-[13px] font-semibold cursor-pointer transition-all duration-150 hover:bg-[#1e2530] hover:-translate-y-[1px]"
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
      className="fixed inset-0 z-[10000] bg-black/55 backdrop-blur-sm flex items-center justify-center p-6 animate-[ur-fade-in_0.2s_ease]"
      onClick={isSuccess ? onGoBack : onDismiss}
    >
      <div
        className="bg-white rounded-[20px] py-10 px-9 max-w-[380px] w-full text-center shadow-[0_24px_60px_rgba(0,0,0,0.18)] animate-[ur-pop-in_0.3s_cubic-bezier(0.34,1.56,0.64,1)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 border-2 ${isSuccess ? "bg-[#ecfdf5] border-[#059669]/25" : "bg-[#fef2f2] border-[#dc2626]/25"}`}
        >
          {isSuccess ? (
            <CheckCircle2 className="w-[30px] h-[30px] text-[#059669]" />
          ) : (
            <AlertCircle className="w-[30px] h-[30px] text-[#dc2626]" />
          )}
        </div>
        <div className="font-['Outfit',_sans-serif] text-[20px] font-extrabold text-[#0d1117] tracking-[-0.03em] mb-2">
          {isSuccess ? "All Done!" : "Something went wrong"}
        </div>
        <div className="text-[13.5px] text-[#6b7280] leading-[1.6] mb-7">{message}</div>
        {isSuccess ? (
          <button
            className="inline-flex items-center justify-center gap-2 w-full py-[13px] px-6 rounded-xl border-none cursor-pointer font-['Outfit',_sans-serif] text-[14px] font-bold tracking-[0.01em] transition-all duration-150 bg-[#059669] text-white shadow-[0_4px_14px_rgba(5,150,105,0.35)] hover:bg-[#047857] hover:-translate-y-[1px] hover:shadow-[0_6px_18px_rgba(5,150,105,0.4)]"
            onClick={onGoBack}
          >
            Back to Reports
          </button>
        ) : (
          <button
            className="inline-flex items-center justify-center gap-2 w-full py-[13px] px-6 rounded-xl border-none cursor-pointer font-['Outfit',_sans-serif] text-[14px] font-bold tracking-[0.01em] transition-all duration-150 bg-[#0d1117] text-white hover:bg-[#1e2530]"
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
        @keyframes ur-shimmer   { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

        .ur-drawer-body-scroll::-webkit-scrollbar { width: 4px; }
        .ur-drawer-body-scroll::-webkit-scrollbar-track { background: transparent; }
        .ur-drawer-body-scroll::-webkit-scrollbar-thumb { background: #d1d5de; border-radius: 4px; }
      `}</style>

      <div
        className={`fixed inset-0 z-[9999] bg-[#f7f8fa] flex flex-col ${closing ? "animate-[ur-slide-out_0.25s_cubic-bezier(0.32,0,0.67,0)_forwards]" : "animate-[ur-slide-in_0.3s_cubic-bezier(0.32,0.72,0,1)_forwards]"}`}
      >
        {/* Header */}
        <div className="flex items-center gap-3 py-4 px-5 bg-[#0d1117] border-b border-white/5 shrink-0">
          <div
            className={`w-[34px] h-[34px] rounded-[9px] flex items-center justify-center shrink-0 ${isEdit ? "bg-[#7c3aed]/25" : "bg-[#2563eb]/25"}`}
          >
            {isEdit ? (
              <Pencil className="w-[15px] h-[15px] text-[#c4b5fd]" />
            ) : (
              <FileText className="w-[15px] h-[15px] text-[#93c5fd]" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-['Outfit',_sans-serif] text-[14px] font-bold text-[#f1f5f9] tracking-[-0.01em] m-0 leading-[1.2] whitespace-nowrap overflow-hidden text-ellipsis">
              {isEdit ? `Edit — ${resolvedName}` : `Upload — ${resolvedName}`}
            </h2>
            <p className="font-['JetBrains_Mono',_monospace] text-[10px] text-white/30 mt-[2px] mb-0 uppercase tracking-[0.07em]">
              {headerSubtitle}
            </p>
          </div>
          <button
            className="w-[38px] h-[38px] rounded-[9px] bg-white/10 border-[1.5px] border-white/20 flex items-center justify-center cursor-pointer text-white transition-all duration-150 shrink-0 hover:bg-[#dc2626]/35 hover:border-[#dc2626]/55 hover:text-[#fca5a5] hover:scale-105"
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
