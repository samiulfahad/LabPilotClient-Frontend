import api from "./baseAPI";

const reportService = {
  // Returns all completed reports (flattened across all invoices)
  getAll: () => api.get("/report/all"),

  // Returns report data + patient info + schemaId for a specific test.
  // Shape: { report, isCompleted, completedAt, updatedAt, patient, invoiceId, testName, schemaId }
  getById: (invoiceId, testId) => api.get(`/report/${invoiceId}/${testId}`),

  // Upload a new report
  // data shape: { report: <SchemaRenderer payload>, invoiceId, testId }
  addReport: (data) => api.post("/report/add", data),

  // Update an existing report
  // data shape: { report: <SchemaRenderer payload>, invoiceId, testId }
  updateReport: (data) => api.put("/report/update", data),

  // Set or update sample collection date and report date
  // data shape: { invoiceId, testId, sampleCollectionDate?, reportDate? }
  updateDates: (data) => api.put("/report/dates", data),
};

export default reportService;
