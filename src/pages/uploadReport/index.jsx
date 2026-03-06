import { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import { AlertCircle, RotateCcw } from "lucide-react";
import SchemaRenderer from "./SchemaRenderer";
import LoadingScreen from "../../components/loadingPage";
import testService from "../../api/test";

function UploadReport() {
  const { schemaId } = useParams();
  const [schema, setSchema] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const location = useLocation();
  const { invoice, test } = location.state;
  console.log(invoice);

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
      <SchemaRenderer schema={schema} invoice={invoice ?? null} />
    </div>
  );
}

export default UploadReport;
