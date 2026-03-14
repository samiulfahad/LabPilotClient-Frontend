import { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import { AlertCircle, RotateCcw, Wifi } from "lucide-react";
import SchemaRenderer from "./SchemaRenderer";
import LoadingScreen from "../../components/loadingPage";
import Popup from "../../components/popup";
import testService from "../../api/test";
import reportService from "../../api/report";

// ─── Inline styles for the error / loading state overlays ────────────────────
const pageStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

  .ur-error-shell {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background: #f7f8fa;
    font-family: 'Outfit', sans-serif;
    padding: 24px;
  }
  .ur-error-card {
    background: #ffffff;
    border: 1px solid #e4e7ed;
    border-radius: 16px;
    padding: 40px 36px;
    max-width: 400px;
    width: 100%;
    text-align: center;
    box-shadow: 0 4px 16px rgba(0,0,0,0.07);
  }
  .ur-error-icon {
    width: 52px; height: 52px;
    background: #fef2f2;
    border: 1.5px solid rgba(220,38,38,0.2);
    border-radius: 14px;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 20px;
  }
  .ur-error-title {
    font-size: 17px; font-weight: 700; color: #0d1117;
    letter-spacing: -0.02em; margin-bottom: 8px;
  }
  .ur-error-msg {
    font-size: 13.5px; color: #6b7280; line-height: 1.6;
    margin-bottom: 24px;
  }
  .ur-error-btn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 11px 22px;
    background: #0d1117; color: #fff;
    border: none; border-radius: 10px;
    font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 600;
    cursor: pointer; transition: all 0.15s;
    box-shadow: 0 2px 8px rgba(13,17,23,0.2);
  }
  .ur-error-btn:hover {
    background: #1e2530;
    box-shadow: 0 4px 14px rgba(13,17,23,0.3);
    transform: translateY(-1px);
  }
  .ur-error-code {
    display: inline-block; margin-top: 16px;
    font-family: 'JetBrains Mono', monospace; font-size: 11px;
    color: #9ca3af; background: #f3f4f6;
    padding: 3px 10px; border-radius: 20px;
  }
`;

function InjectPageStyles() {
  useEffect(() => {
    const id = "ur-page-styles";
    if (!document.getElementById(id)) {
      const el = document.createElement("style");
      el.id = id;
      el.textContent = pageStyles;
      document.head.appendChild(el);
    }
  }, []);
  return null;
}

// ─── Error state ──────────────────────────────────────────────────────────────
function ErrorState({ message, onRetry }) {
  return (
    <div className="ur-error-shell">
      <InjectPageStyles />
      <div className="ur-error-card">
        <div className="ur-error-icon">
          <AlertCircle style={{ width: 22, height: 22, color: "#dc2626" }} />
        </div>
        <div className="ur-error-title">Failed to Load Schema</div>
        <div className="ur-error-msg">
          {message || "Something went wrong while loading the report schema. Please try again."}
        </div>
        <button className="ur-error-btn" onClick={onRetry}>
          <RotateCcw style={{ width: 14, height: 14 }} />
          Try Again
        </button>
        <div className="ur-error-code">ERR_SCHEMA_LOAD</div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
function UploadReport() {
  const { schemaId } = useParams();
  const location = useLocation();

  const { invoice, test, report: existingReport } = location.state ?? {};
  const isEditMode = Boolean(existingReport && Object.keys(existingReport).length > 0);

  const [schema, setSchema] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [popup, setPopup] = useState(null);

  // ── Load schema ────────────────────────────────────────────────────────────
  const fetchSchema = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await testService.getSchemaBySchemaId(test.schemaId);
      setSchema(response.data);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to load schema.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchema();
  }, [schemaId]);

  // ── Create ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (payload) => {
    try {
      setSubmitting(true);
      await reportService.addReport({
        report: payload,
        invoiceId: invoice.invoiceId,
        testId: test.testId,
      });
      setPopup({ type: "success", message: "Report submitted successfully" });
    } catch (e) {
      setPopup({ type: "error", message: e?.response?.data?.message || "Could not submit report" });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Update ─────────────────────────────────────────────────────────────────
  const handleUpdate = async (payload) => {
    try {
      setSubmitting(true);
      await reportService.updateReport({
        report: payload,
        invoiceId: invoice.invoiceId,
        testId: test.testId,
      });
      setPopup({ type: "success", message: "Report updated successfully" });
    } catch (e) {
      setPopup({ type: "error", message: e?.response?.data?.message || "Could not update report" });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) return <LoadingScreen />;
  if (error) return <ErrorState message={error} onRetry={fetchSchema} />;

  return (
    <div>
      {submitting && <LoadingScreen />}
      {popup && <Popup type={popup.type} message={popup.message} onClose={() => setPopup(null)} />}
      <SchemaRenderer
        schema={schema}
        invoice={invoice ?? null}
        onSubmit={handleSubmit}
        onUpdate={handleUpdate}
        loading={submitting}
        existingReport={isEditMode ? existingReport : null}
      />
    </div>
  );
}

export default UploadReport;
