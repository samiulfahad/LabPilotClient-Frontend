import api from "./baseAPI";

const indoorPatientService = {
  getRequiredData: () => api.get("/indoor-patients/required-data"),
  getPatients: (params) => api.get("/indoor-patients", { params }),
  getPatient: (id) => api.get(`/indoor-patient/${id}`),
  admit: (data) => api.post("/indoor-patient/admit", data),
  updateInfo: (id, data) => api.patch(`/indoor-patient/${id}/patient-info`, data),
  transferWard: (id, data) => api.patch(`/indoor-patient/${id}/transfer-ward`, data),
  changeDoctor: (id, data) => api.patch(`/indoor-patient/${id}/change-doctor`, data),
  addExpense: (id, data) => api.post(`/indoor-patient/${id}/expense`, data),
  addBedCharge: (id, data) => api.post(`/indoor-patient/${id}/bed-charge`, data),
  addBedChargesBulk: (id, data) => api.post(`/indoor-patient/${id}/bed-charges-bulk`, data),
  addPayment: (id, data) => api.post(`/indoor-patient/${id}/payment`, data),
  release: (id, data) => api.patch(`/indoor-patient/${id}/release`, data),
};

export default indoorPatientService;
