import { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import { AlertCircle, RotateCcw } from "lucide-react";
import SchemaRenderer from "./SchemaRenderer";
import LoadingScreen from "../../components/loadingPage";
import Popup from "../../components/popup";
import testService from "../../api/test";
import reportService from "../../api/report";

function UploadReport() {
  const { schemaId } = useParams();
  const location = useLocation();

  // invoice   — full invoice object (patientName, age, gender, invoiceId …)
  // test      — the specific test being reported { testId, schemaId, name … }
  // report    — (optional) existing embedded report → activates edit mode
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

  // ── Create handler ─────────────────────────────────────────────────────────
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

  // ── Update handler ─────────────────────────────────────────────────────────
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

  // ── Render states ──────────────────────────────────────────────────────────
  if (loading) return <LoadingScreen />;

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertCircle className="w-10 h-10 text-red-400" />
          <p className="text-sm text-gray-600">{error}</p>
          <button
            onClick={fetchSchema}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> Retry
          </button>
        </div>
      </div>
    );
  }

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
