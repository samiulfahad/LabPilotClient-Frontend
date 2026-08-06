import api from "./baseAPI";

const reportService = {
  // ── Outdoor ──────────────────────────────────────────────────────────────────
  getOutdoorPatient: (invoiceId) => api.get(`/outdoorReport/${invoiceId}`),
  addReport: (data) => api.post("/outdoorReport/add", data),
  updateReport: (data) => api.put("/outdoorReport/update", data),
  updateDates: (data) => api.put("/outdoorRepot/dates", data),
  getReport: (invoiceId, testId) => api.get(`/outdoorReport/${invoiceId}/${testId}`),
  getTestSchema: (schemaId) => api.get("/outdoorReport/testSchema/" + schemaId), // ← moved from testService
  
  // ── Indoor ───────────────────────────────────────────────────────────────────
  getIndoorPatient: (admissionId) => api.get(`/indoorReport/${admissionId}`),
  addIndoorReport: (data) => api.post("/indoorReport/add", data),
  updateIndoorReport: (data) => api.put("/indoorReport/update", data),
  updateIndoorDates: (data) => api.put("/indoorReport/dates", data),
  getIndoorReport: (patientId, testId, addedAt) =>
    api.get(`/indoorReport/${patientId}/${testId}`, { params: addedAt ? { addedAt } : undefined }),
};

export default reportService;
