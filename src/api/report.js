import api from "./baseAPI";

const reportService = {
  // ── Outdoor ──────────────────────────────────────────────────────────────────
  addReport: (data) => api.post("/report/add", data),
  updateReport: (data) => api.put("/report/update", data),
  updateDates: (data) => api.put("/report/dates", data),
  getReport: (invoiceId, testId) => api.get(`/report/${invoiceId}/${testId}`),

  // ── Indoor ───────────────────────────────────────────────────────────────────
  addIndoorReport: (data) => api.post("/indoor-report/add", data),
  updateIndoorReport: (data) => api.put("/indoor-report/update", data),
  updateIndoorDates: (data) => api.put("/indoor-report/dates", data),
  getIndoorReport: (patientId, testId) => api.get(`/indoor-report/${patientId}/${testId}`),
};

export default reportService;