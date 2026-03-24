import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AlertCircle, RotateCcw, X, FileText, Pencil } from "lucide-react";
import SchemaRenderer from "./SchemaRenderer";
import Popup from "../../components/popup";
import testService from "../../api/test";
import reportService from "../../api/report";

// ─── Styles ───────────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

  .ur-overlay { display: none; }

  .ur-drawer {
    position: fixed; top: 0; left: 0; bottom: 0; right: 0; z-index: 201;
    background: #f7f8fa;
    display: flex; flex-direction: column;
    animation: ur-slide-in 0.3s cubic-bezier(0.32, 0.72, 0, 1) forwards;
  }
  @keyframes ur-slide-in {
    from { transform: translateX(-100%); }
    to   { transform: translateX(0); }
  }
  .ur-drawer.closing {
    animation: ur-slide-out 0.25s cubic-bezier(0.32, 0, 0.67, 0) forwards;
  }
  @keyframes ur-slide-out {
    from { transform: translateX(0); }
    to   { transform: translateX(-100%); }
  }
  @keyframes ur-fade-out { from { opacity: 1; } to { opacity: 0; } }

  .ur-drawer-header {
    display: flex; align-items: center; gap: 12px;
    padding: 16px 20px;
    background: #0d1117;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    flex-shrink: 0;
  }
  .ur-drawer-icon {
    width: 34px; height: 34px; border-radius: 9px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
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
    width: 32px; height: 32px; border-radius: 8px;
    background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: rgba(255,255,255,0.5);
    transition: all 0.15s; flex-shrink: 0;
  }
  .ur-close-btn:hover {
    background: rgba(220,38,38,0.2); border-color: rgba(220,38,38,0.3);
    color: #fca5a5;
  }

  .ur-drawer-body {
    flex: 1; overflow-y: auto;
    overscroll-behavior: contain;
  }
  .ur-drawer-body::-webkit-scrollbar { width: 4px; }
  .ur-drawer-body::-webkit-scrollbar-track { background: transparent; }
  .ur-drawer-body::-webkit-scrollbar-thumb { background: #d1d5de; border-radius: 4px; }

  .ur-skeleton-shell {
    padding: 24px 20px;
    font-family: 'Outfit', sans-serif;
  }
  .ur-sk {
    background: linear-gradient(90deg, #e4e7ed 25%, #f2f4f7 50%, #e4e7ed 75%);
    background-size: 200% 100%;
    border-radius: 8px;
    animation: ur-shimmer 1.5s infinite;
  }
  @keyframes ur-shimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

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
    const id = "ur-styles-v2";
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
        <div style={{ marginTop: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
            <div className="ur-sk" style={{ height: 9, width: "15%" }} />
            <div className="ur-sk" style={{ height: 9, width: "10%" }} />
          </div>
          <div className="ur-sk" style={{ height: 4, borderRadius: 4 }} />
        </div>
      </div>
      <div
        style={{
          background: "#fff",
          border: "1px solid #e4e7ed",
          borderRadius: 14,
          overflow: "hidden",
          marginBottom: 12,
        }}
      >
        <div style={{ background: "#1e2530", padding: "10px 18px", display: "flex", alignItems: "center", gap: 8 }}>
          <div
            className="ur-sk"
            style={{ width: 13, height: 13, borderRadius: "50%", background: "rgba(255,255,255,0.15)" }}
          />
          <div className="ur-sk" style={{ height: 9, width: 100, background: "rgba(255,255,255,0.1)" }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)" }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ padding: "14px 18px", borderRight: i < 3 ? "1px solid #e4e7ed" : "none" }}>
              <div className="ur-sk" style={{ height: 8, width: "50%", marginBottom: 8 }} />
              <div className="ur-sk" style={{ height: 14, width: "70%" }} />
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
            <div
              className="ur-sk"
              style={{ height: 20, width: 48, borderRadius: 20, background: "rgba(255,255,255,0.08)" }}
            />
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
      <div
        style={{
          background: "#fff",
          border: "1px solid #e4e7ed",
          borderRadius: 14,
          padding: "16px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div className="ur-sk" style={{ height: 11, width: 160 }} />
        <div style={{ display: "flex", gap: 10 }}>
          <div className="ur-sk" style={{ height: 42, width: 90, borderRadius: 10 }} />
          <div className="ur-sk" style={{ height: 42, width: 130, borderRadius: 10 }} />
        </div>
      </div>
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

// ─── Main Component ───────────────────────────────────────────────────────────
function ReportUpload() {
  const location = useLocation();
  const navigate = useNavigate();

  // Only identity fields come from route state — everything else is fetched.
  const { invoiceId, testId, testName: stateTestName, isEdit = false } = location.state ?? {};

  const [schema, setSchema] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const [existingReport, setExistingReport] = useState(null);
  const [resolvedName, setResolvedName] = useState(stateTestName ?? "Report");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false); // ← tracks successful submission
  const [popup, setPopup] = useState(null);
  const [closing, setClosing] = useState(false);

  // If submitted, go back to /report with the invoiceId so it refetches.
  // Otherwise fall back to normal back-navigation.
  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      if (submitted && invoiceId) {
        navigate("/report", { state: { invoiceId } });
      } else {
        navigate(-1);
      }
    }, 250);
  };

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [submitted]); // re-register when submitted changes so handleClose is fresh

  const fetchData = async () => {
    if (!invoiceId || !testId) {
      setError("Missing invoice or test information.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // reportService.getById returns: { report, patient, invoiceId, testName, schemaId, isCompleted }
      const { data } = await reportService.getById(invoiceId, testId);

      const name = data.testName ?? stateTestName ?? "Report";
      setResolvedName(name);

      setInvoice({ invoiceId: data.invoiceId, patient: data.patient });

      if (isEdit && data.report && Object.keys(data.report).length > 0) {
        setExistingReport(data.report);
      }

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
      setSubmitted(true); // ← mark success so handleClose navigates correctly
      setPopup({ type: "success", message: "Report submitted successfully" });
    } catch (e) {
      setPopup({ type: "error", message: e?.response?.data?.message || "Could not submit report" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (payload) => {
    try {
      setSubmitting(true);
      await reportService.updateReport({ report: payload, invoiceId, testId });
      setSubmitted(true); // ← mark success so handleClose navigates correctly
      setPopup({ type: "success", message: "Report updated successfully" });
    } catch (e) {
      setPopup({ type: "error", message: e?.response?.data?.message || "Could not update report" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <StyleInjector />
      {popup && <Popup type={popup.type} message={popup.message} onClose={() => setPopup(null)} />}

      <div className={`ur-overlay${closing ? " closing" : ""}`} onClick={handleClose} />

      <div className={`ur-drawer${closing ? " closing" : ""}`}>
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
            <X style={{ width: 15, height: 15 }} />
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
    </>
  );
}

export default ReportUpload;
