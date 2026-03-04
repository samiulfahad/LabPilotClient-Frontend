import api from "./baseAPI";

const invoiceService = {
  getRequiredData: () => api.get("/invoice/required-data"),
  createInvoice: (data) => api.post("/invoice/add", data),
  getInvoices: () => api.get("/invoice/all"),
  getInvoiceByInvoiceId: (_id) => api.get(`/invoice/${_id}`),
  updatePatientInfo: (invoiceId, data) => api.patch(`/invoice/${invoiceId}/patient-info`, data),
  collectDue: (invoiceId) => api.patch(`/invoice/${invoiceId}/collect-due`),
  markDelivered: (invoiceId) => api.patch(`/invoice/${invoiceId}/mark-delivered`),
};

export default invoiceService;
