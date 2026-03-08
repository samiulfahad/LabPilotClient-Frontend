import { useLocation, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import ReportViewer from "./ReportViewer";

export default function ReportPage() {
  const { state } = useLocation();
  const report = state?.report;

  if (!report) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-sm text-gray-600">No report data found.</p>
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Reports
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="mb-6">
        <button
           onClick={() => window.history.back()}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Reports
        </button>
      </div>
      <ReportViewer report={report} reportId={report._id} />
    </div>
  );
}
