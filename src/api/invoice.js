import api from "./baseAPI";

const invoiceService = {
  getRequiredData: () => api.get("/invoice/required-data"),
  createInvoice: (data) => api.post("/invoice/add", data),
  getInvoices: ({ cursor = null, limit = 20, startDate = null, endDate = null } = {}) => {
    const params = new URLSearchParams({ limit });
    if (cursor) params.append("cursor", cursor);
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    return api.get(`/invoice/all?${params}`);
  },
  getInvoiceByInvoiceId: (_id) => api.get(`/invoice/${_id}`),
  // Lean fetch for the Reports page — patient info, amounts, and per-test
  // status + dates only. No report body, no referrer, no schema details.
  getReportSummary: (invoiceId) => api.get(`/invoice/${invoiceId}/report-summary`),
  updatePatientInfo: (invoiceId, data) => api.patch(`/invoice/${invoiceId}/patient-info`, data),
  collectDue: (invoiceId) => api.patch(`/invoice/${invoiceId}/collect-due`),
  markDelivered: (invoiceId) => api.patch(`/invoice/${invoiceId}/mark-delivered`),
  deleteInvoice: (invoiceId) => api.patch(`/invoice/${invoiceId}/delete`),
  getDeletedInvoices: ({ cursor = null, limit = 20, startDate = null, endDate = null } = {}) => {
    const params = new URLSearchParams({ limit });
    if (cursor) params.append("cursor", cursor);
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    return api.get(`/invoice/deleted?${params}`);
  },

  searchInvoices: (query) => api.get(`/invoice/search?q=${encodeURIComponent(query)}`),
};

export default invoiceService;
