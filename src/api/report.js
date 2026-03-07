import api from "./baseAPI";

const reportService = {
  // Returns all completed reports (flattened across all invoices)
  getAll: () => api.get("/report/all"),

  // Returns a single report for a specific test within an invoice
  getById: (invoiceId, testId) => api.get(`/report/${invoiceId}/${testId}`),

  // Upload a new report — embeds into invoice.tests[i].report
  // data shape: { report: <SchemaRenderer payload>, invoiceId, testId }
  addReport: (data) => api.post("/report/add", data),

  // Update an existing report
  // data shape: { report: <SchemaRenderer payload>, invoiceId, testId }
  updateReport: (data) => api.put("/report/update", data),
};

export default reportService;
