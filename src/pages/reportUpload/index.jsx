import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { AlertCircle, RotateCcw, X, FileText, Pencil, CheckCircle2 } from "lucide-react";
import SchemaRenderer from "./SchemaRenderer";
import testService from "../../api/test";
import reportService from "../../api/report";

// ─── Styles ───────────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

  .ur-portal-root {
    position: fixed; inset: 0; z-index: 9999;
    background: #f7f8fa;
    display: flex; flex-direction: column;
    animation: ur-slide-in 0.3s cubic-bezier(0.32, 0.72, 0, 1) forwards;
  }
  .ur-portal-root.closing {
    animation: ur-slide-out 0.25s cubic-bezier(0.32, 0, 0.67, 0) forwards;
  }
  @keyframes ur-slide-in  { from { transform: translateX(-100%); } to { transform: translateX(0); } }
  @keyframes ur-slide-out { from { transform: translateX(0); } to { transform: translateX(-100%); } }

  .ur-drawer-header {
    display: flex; align-items: center; gap: 12px;
    padding: 16px 20px;
    background: #0d1117;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    flex-shrink: 0;
  }
  .ur-drawer-icon {
    width: 34px; height: 34px; border-radius: 9px;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .ur-drawer-icon.create { background: rgba(37,99,235,0.25); }
  .ur-drawer-icon.edit   { background: rgba(124,58,237,0.25); }

  .ur-drawer-title { flex: 1; min-width: 0; }
  .ur-drawer-title h2 {
    font-family: 'Outfit', sans-serif;
    font-size: 14px; font-weight: 700; color: #f1f5f9;
    letter-spacing: -0.01em; margin: 0; line-height: 1.2;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .ur-drawer-title p {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px; color: rgba(255,255,255,0.3);
    margin: 2px 0 0; text-transform: uppercase; letter-spacing: 0.07em;
  }

  .ur-close-btn {
    width: 38px; height: 38px; border-radius: 9px;
    background: rgba(255,255,255,0.1);
    border: 1.5px solid rgba(255,255,255,0.22);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: #ffffff;
    transition: all 0.15s; flex-shrink: 0;
  }
  .ur-close-btn:hover {
    background: rgba(220,38,38,0.35);
    border-color: rgba(220,38,38,0.55);
    color: #fca5a5;
    transform: scale(1.05);
  }

  .ur-drawer-body {
    flex: 1; overflow-y: auto;
    overscroll-behavior: contain;
  }
  .ur-drawer-body::-webkit-scrollbar { width: 4px; }
  .ur-drawer-body::-webkit-scrollbar-track { background: transparent; }
  .ur-drawer-body::-webkit-scrollbar-thumb { background: #d1d5de; border-radius: 4px; }

  /* ── Success overlay ── */
  .ur-success-overlay {
    position: fixed; inset: 0; z-index: 10000;
    background: rgba(0,0,0,0.55); backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center;
    padding: 24px;
    animation: ur-fade-in 0.2s ease;
  }
  @keyframes ur-fade-in { from { opacity: 0; } to { opacity: 1; } }

  .ur-success-card {
    background: #fff; border-radius: 20px;
    padding: 40px 36px; max-width: 380px; width: 100%;
    text-align: center;
    box-shadow: 0 24px 60px rgba(0,0,0,0.18);
    animation: ur-pop-in 0.3s cubic-bezier(0.34,1.56,0.64,1);
  }
  @keyframes ur-pop-in { from { opacity:0; transform:scale(0.85); } to { opacity:1; transform:scale(1); } }

  .ur-success-icon-wrap {
    width: 64px; height: 64px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 20px;
  }
  .ur-success-icon-wrap.success { background: #ecfdf5; border: 2px solid rgba(5,150,105,0.25); }
  .ur-success-icon-wrap.error   { background: #fef2f2; border: 2px solid rgba(220,38,38,0.25); }

  .ur-success-title {
    font-family: 'Outfit', sans-serif;
    font-size: 20px; font-weight: 800; color: #0d1117;
    letter-spacing: -0.03em; margin-bottom: 8px;
  }
  .ur-success-msg {
    font-size: 13.5px; color: #6b7280; line-height: 1.6; margin-bottom: 28px;
  }
  .ur-success-btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    width: 100%; padding: 13px 24px;
    border-radius: 12px; border: none; cursor: pointer;
    font-family: 'Outfit', sans-serif; font-size: 14px; font-weight: 700;
    letter-spacing: 0.01em; transition: all 0.15s;
  }
  .ur-success-btn.go    { background: #059669; color: #fff; box-shadow: 0 4px 14px rgba(5,150,105,0.35); }
  .ur-success-btn.go:hover { background: #047857; transform: translateY(-1px); box-shadow: 0 6px 18px rgba(5,150,105,0.4); }
  .ur-success-btn.err   { background: #0d1117; color: #fff; }
  .ur-success-btn.err:hover { background: #1e2530; }

  /* ── Skeleton ── */
  .ur-skeleton-shell { padding: 24px 20px; font-family: 'Outfit', sans-serif; }
  .ur-sk {
    background: linear-gradient(90deg, #e4e7ed 25%, #f2f4f7 50%, #e4e7ed 75%);
    background-size: 200% 100%; border-radius: 8px;
    animation: ur-shimmer 1.5s infinite;
  }
  @keyframes ur-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

  /* ── Error ── */
  .ur-error-shell {
    display: flex; align-items: center; justify-content: center;
    padding: 60px 24px; font-family: 'Outfit', sans-serif;
  }
  .ur-error-card {
    background: #fff; border: 1px solid #e4e7ed;
    border-radius: 16px; padding: 36px 32px;
    max-width: 360px; width: 100%; text-align: center;
    box-shadow: 0 4px 16px rgba(0,0,0,0.06);
  }
  .ur-error-icon {
    width: 48px; height: 48px; background: #fef2f2;
    border: 1.5px solid rgba(220,38,38,0.2); border-radius: 12px;
    display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;
  }
  .ur-error-title { font-size: 16px; font-weight: 700; color: #0d1117; margin-bottom: 8px; letter-spacing: -0.02em; }
  .ur-error-msg   { font-size: 13px; color: #6b7280; line-height: 1.6; margin-bottom: 20px; }
  .ur-error-btn {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 10px 20px; background: #0d1117; color: #fff;
    border: none; border-radius: 9px; font-family: 'Outfit', sans-serif;
    font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s;
  }
  .ur-error-btn:hover { background: #1e2530; transform: translateY(-1px); }
`;

function StyleInjector() {
  useEffect(() => {
    const id = "ur-styles-v3";
    if (!document.getElementById(id)) {
      const el = document.createElement("style");
      el.id = id;
      el.textContent = STYLES;
      document.head.appendChild(el);
    }
  }, []);
  return null;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonLoader() {
  return (
    <div className="ur-skeleton-shell">
      <div style={{ background: "#fff", border: "1px solid #e4e7ed", borderRadius: 16, padding: 24, marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 14, marginBottom: 20 }}>
          <div className="ur-sk" style={{ width: 44, height: 44, borderRadius: 10, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div className="ur-sk" style={{ height: 10, width: "40%", marginBottom: 10 }} />
            <div className="ur-sk" style={{ height: 22, width: "65%" }} />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ background: "#f2f4f7", borderRadius: 10, padding: "12px 14px" }}>
              <div className="ur-sk" style={{ height: 8, width: "60%", marginBottom: 8 }} />
              <div className="ur-sk" style={{ height: 20, width: "40%" }} />
            </div>
          ))}
        </div>
      </div>
      {[...Array(2)].map((_, si) => (
        <div
          key={si}
          style={{
            background: "#fff",
            border: "1px solid #e4e7ed",
            borderRadius: 14,
            overflow: "hidden",
            marginBottom: 10,
          }}
        >
          <div style={{ background: "#0d1117", padding: "14px 18px", display: "flex", alignItems: "center", gap: 10 }}>
            <div
              className="ur-sk"
              style={{ width: 28, height: 28, borderRadius: 6, background: "rgba(255,255,255,0.1)" }}
            />
            <div className="ur-sk" style={{ height: 11, flex: 1, background: "rgba(255,255,255,0.1)" }} />
          </div>
          <div
            style={{
              padding: "20px 18px",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(190px,1fr))",
              gap: "14px 18px",
            }}
          >
            {[...Array(si === 0 ? 4 : 2)].map((_, fi) => (
              <div key={fi}>
                <div
                  style={{
                    border: "1.5px solid #e4e7ed",
                    borderRadius: 10,
                    padding: "18px 14px 10px 12px",
                    minHeight: 54,
                  }}
                >
                  <div className="ur-sk" style={{ height: 9, width: "55%", marginBottom: 10 }} />
                  <div className="ur-sk" style={{ height: 16, width: "35%" }} />
                </div>
                <div className="ur-sk" style={{ height: 8, width: "40%", marginTop: 6 }} />
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
    <div className="ur-error-shell">
      <div className="ur-error-card">
        <div className="ur-error-icon">
          <AlertCircle style={{ width: 20, height: 20, color: "#dc2626" }} />
        </div>
        <div className="ur-error-title">Failed to Load</div>
        <div className="ur-error-msg">{message || "Something went wrong while loading the report."}</div>
        <button className="ur-error-btn" onClick={onRetry}>
          <RotateCcw style={{ width: 13, height: 13 }} />
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
    <div className="ur-success-overlay" onClick={isSuccess ? onGoBack : onDismiss}>
      <div className="ur-success-card" onClick={(e) => e.stopPropagation()}>
        <div className={`ur-success-icon-wrap ${isSuccess ? "success" : "error"}`}>
          {isSuccess ? (
            <CheckCircle2 style={{ width: 30, height: 30, color: "#059669" }} />
          ) : (
            <AlertCircle style={{ width: 30, height: 30, color: "#dc2626" }} />
          )}
        </div>
        <div className="ur-success-title">{isSuccess ? "All Done!" : "Something went wrong"}</div>
        <div className="ur-success-msg">{message}</div>
        {isSuccess ? (
          <button className="ur-success-btn go" onClick={onGoBack}>
            Back to Reports
          </button>
        ) : (
          <button className="ur-success-btn err" onClick={onDismiss}>
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

  const { invoiceId, testId, testName: stateTestName, isEdit = false } = location.state ?? {};

  const [schema, setSchema] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const [existingReport, setExistingReport] = useState(null);
  const [resolvedName, setResolvedName] = useState(stateTestName ?? "Report");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [resultModal, setResultModal] = useState(null); // { type, message }
  const [closing, setClosing] = useState(false);

  const goBack = () => {
    setClosing(true);
    setTimeout(() => navigate("/report", { state: { invoiceId } }), 250);
  };

  const handleClose = () => {
    // If a success modal is showing, clicking X still goes back properly
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
    if (!invoiceId || !testId) {
      setError("Missing invoice or test information.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data } = await reportService.getById(invoiceId, testId);
      setResolvedName(data.testName ?? stateTestName ?? "Report");
      setInvoice({ invoiceId: data.invoiceId, patient: data.patient });
      if (isEdit && data.report && Object.keys(data.report).length > 0) setExistingReport(data.report);
      const schemaRes = await testService.getSchemaBySchemaId(data.schemaId);
      setSchema(schemaRes.data);
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
      await reportService.addReport({ report: payload, invoiceId, testId });
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
      await reportService.updateReport({ report: payload, invoiceId, testId });
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

  return (
    <>
      <StyleInjector />

      {/* Full-screen portal panel */}
      <div className={`ur-portal-root${closing ? " closing" : ""}`}>
        {/* Header */}
        <div className="ur-drawer-header">
          <div className={`ur-drawer-icon ${isEdit ? "edit" : "create"}`}>
            {isEdit ? (
              <Pencil style={{ width: 15, height: 15, color: "#c4b5fd" }} />
            ) : (
              <FileText style={{ width: 15, height: 15, color: "#93c5fd" }} />
            )}
          </div>
          <div className="ur-drawer-title">
            <h2>{isEdit ? `Edit — ${resolvedName}` : `Upload — ${resolvedName}`}</h2>
            <p>{invoiceId ? `Invoice #${invoiceId}` : "New Report"}</p>
          </div>
          <button className="ur-close-btn" onClick={handleClose} title="Close (Esc)">
            <X style={{ width: 17, height: 17 }} />
          </button>
        </div>

        {/* Body */}
        <div className="ur-drawer-body">
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

      {/* Result modal — rendered on top of everything */}
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

// Wrap in a portal so it escapes the Layout's DOM tree entirely
function ReportUpload() {
  return createPortal(<ReportUploadInner />, document.body);
}

export default ReportUpload;
