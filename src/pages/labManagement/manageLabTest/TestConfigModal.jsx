import { useState } from "react";
import { Settings, DollarSign, FileText, Eye, Star, FlaskConical } from "lucide-react";

const TestConfigModal = ({ test, onClose, onSave }) => {
  const [price, setPrice] = useState(test.price || "");
  const [defaultFormat, setDefaultFormat] = useState(test.defaultFormat || test.formats?.[0]?.id || null);

  const handleSubmit = () => {
    onSave({
      ...test,
      price: parseFloat(price) || 0,
      defaultFormat,
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-teal-50 to-cyan-50">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="w-6 h-6 text-teal-600" />
          Configure Test
        </h2>
        <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1.5">
          <FlaskConical className="w-3.5 h-3.5 text-teal-500" />
          {test.name}
        </p>
      </div>

      {/* Content – parent Modal handles scrolling */}
      <div className="flex-1 px-6 py-6 bg-gray-50">
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

          {/* Test Form & Report View */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-500" />
              Test Documents
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                className="flex items-center gap-2 px-4 py-2.5 border border-teal-300 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg transition-all text-sm font-medium"
              >
                <Eye className="w-4 h-4" />
                View Test Form
              </button>
              <button
                type="button"
                className="flex items-center gap-2 px-4 py-2.5 border border-purple-300 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition-all text-sm font-medium"
              >
                <Eye className="w-4 h-4" />
                View Test Report
              </button>
            </div>
          </div>

          {/* Formats – only when multiple formats exist */}
          {test.formats && test.formats.length > 0 && (
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-1 flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-500" />
                Report Formats
              </h3>
              <p className="text-xs text-gray-500 mb-3">Select a default format for this test</p>
              <div className="space-y-2">
                {test.formats.map((format) => (
                  <div
                    key={format.id}
                    onClick={() => setDefaultFormat(format.id)}
                    className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all cursor-pointer ${
                      defaultFormat === format.id
                        ? "border-teal-500 bg-teal-50"
                        : "border-gray-200 bg-gray-50 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          defaultFormat === format.id ? "border-teal-500 bg-teal-500" : "border-gray-400"
                        }`}
                      >
                        {defaultFormat === format.id && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{format.name}</p>
                        {format.description && <p className="text-xs text-gray-500">{format.description}</p>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {defaultFormat === format.id && (
                        <span className="flex items-center gap-1 text-xs font-semibold text-teal-700 bg-teal-100 px-2 py-0.5 rounded-full">
                          <Star className="w-3 h-3" />
                          Default
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 bg-white border border-gray-200 hover:border-purple-300 hover:bg-purple-50 rounded-lg transition-all"
                        title="View format"
                      >
                        <Eye className="w-3.5 h-3.5 text-gray-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer – normal block */}
      <div className="border-t border-gray-200 px-6 py-4 bg-white">
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