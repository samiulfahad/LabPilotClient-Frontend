import { useState, useEffect } from "react";
import { Settings, DollarSign, FileText, Eye, Star, FlaskConical, XCircle, Loader2, CheckCircle2 } from "lucide-react";
import testService from "../../../api/test";

const TestConfigModal = ({ test, onClose, onSave }) => {
  const [price, setPrice] = useState(test.price || "");
  const [schemas, setSchemas] = useState([]);
  const [selectedSchemaId, setSelectedSchemaId] = useState(test.schemaId || null);
  const [loadingSchemas, setLoadingSchemas] = useState(false);
  const [schemaError, setSchemaError] = useState(null);

  // Load schemas when modal opens
  useEffect(() => {
    const loadSchemas = async () => {
      try {
        setLoadingSchemas(true);
        setSchemaError(null);
        const response = await testService.getSchemasByTestId(test.testId);
        setSchemas(response.data || []);
      } catch (error) {
        console.error("Failed to load formats:", error);
        setSchemaError("Could not load formats");
        setSchemas([]);
      } finally {
        setLoadingSchemas(false);
      }
    };

    if (test.testId) {
      loadSchemas();
    }
  }, [test.testId]);

  const handleSubmit = () => {
    onSave({
      ...test,
      price: parseFloat(price) || 0,
      schemaId: selectedSchemaId,
    });
  };

  const handleRemoveSchema = () => {
    setSelectedSchemaId(null);
  };

  return (
    <div className="relative">
      {/* Header - Sticky at top */}
      <div className="sticky top-0 z-10 px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-teal-50 to-cyan-50">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="w-6 h-6 text-teal-600" />
          Configure Test
        </h2>
        <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1.5">
          <FlaskConical className="w-3.5 h-3.5 text-teal-500" />
          {test.name}
        </p>
      </div>

      {/* Scrollable Content - Parent modal handles scrolling */}
      <div className="px-6 py-6 bg-gray-50">
        <div className="space-y-5 max-w-2xl mx-auto">
          {/* Price */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-gray-500" />
              Test Price
            </h3>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-sm">৳</span>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all text-sm"
                placeholder="Enter price"
                min="0"
              />
            </div>
          </div>

          {/* Schemas Section */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="mb-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-500" />
                  Available Formats
                </h3>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {selectedSchemaId
                  ? "This test is currently online. You can select a different format or make it offline."
                  : "Select a format to make this test available online"}
              </p>
            </div>

            {selectedSchemaId && (
              <div className="mb-3 p-3 bg-orange-50 border-2 border-orange-200 rounded-lg">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-orange-900">Test is Online</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveSchema}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 rounded-lg transition-all shadow-sm hover:shadow"
                  >
                    <XCircle className="w-4 h-4" />
                    Make Offline
                  </button>
                </div>
              </div>
            )}

            {loadingSchemas ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-teal-600 animate-spin" />
                <span className="ml-2 text-sm text-gray-500">Loading schemas...</span>
              </div>
            ) : schemaError ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <p className="text-sm text-red-600">{schemaError}</p>
              </div>
            ) : schemas.length === 0 ? (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                <FlaskConical className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 font-medium">No formats available</p>
              </div>
            ) : (
              <div className="space-y-2">
                {schemas.map((schema) => {
                  const isSelected = selectedSchemaId === schema._id;
                  const isActive = schema.isActive;

                  return (
                    <div
                      key={schema._id}
                      onClick={() => isActive && setSelectedSchemaId(schema._id)}
                      className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                        !isActive
                          ? "border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed"
                          : isSelected
                            ? "border-teal-500 bg-teal-50 cursor-pointer"
                            : "border-gray-200 bg-white hover:border-gray-300 cursor-pointer"
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            isSelected ? "border-teal-500 bg-teal-500" : "border-gray-400"
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-800 truncate">{schema.name}</p>
                            {!isActive && (
                              <span className="text-xs font-medium text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full flex-shrink-0">
                                Inactive
                              </span>
                            )}
                          </div>
                          {schema.description && (
                            <p className="text-xs text-gray-500 truncate mt-0.5">{schema.description}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                        {isSelected && (
                          <span className="flex items-center gap-1 text-xs font-semibold text-teal-700 bg-teal-100 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" />
                            Selected
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            // TODO: Implement view schema functionality
                            console.log("View schema:", schema._id);
                          }}
                          className="p-1.5 bg-white border border-gray-200 hover:border-purple-300 hover:bg-purple-50 rounded-lg transition-all"
                          title="View schema details"
                        >
                          <Eye className="w-3.5 h-3.5 text-gray-500" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer - Sticky at bottom */}
      <div className="sticky bottom-0 z-10 border-t border-gray-200 px-6 py-4 bg-white">
        <div className="flex gap-3 max-w-2xl mx-auto">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-lg font-medium transition-all text-sm bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 hover:border-gray-400"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex-1 py-2.5 px-4 rounded-lg font-medium transition-all text-sm bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white shadow-sm hover:shadow"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestConfigModal;
