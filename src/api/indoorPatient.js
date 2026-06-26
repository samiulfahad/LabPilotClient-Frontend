// indoorPatient.js
import api from "./baseAPI";

const indoorPatientService = {
  getRequiredData: () => api.get("/indoor-patients/required-data"),
  getPatients: (params) => api.get("/indoor-patients", { params }),
  getPatient: (id) => api.get(`/indoor-patient/${id}`),
  getByAdmissionId: (admissionId) => api.get(`/indoor-patient/by-admission-id/${admissionId}`),
  admit: (data) => api.post("/indoor-patient/admit", data),
  updateInfo: (id, data) => api.patch(`/indoor-patient/${id}/patient-info`, data),
  transferWard: (id, data) => api.patch(`/indoor-patient/${id}/transfer-ward`, data),
  changeDoctor: (id, data) => api.patch(`/indoor-patient/${id}/change-doctor`, data),
  addExpense: (id, data) => api.post(`/indoor-patient/${id}/expense`, data),
  addPayment: (id, data) => api.post(`/indoor-patient/${id}/payment`, data),
  addDiscount: (id, data) => api.post(`/indoor-patient/${id}/discount`, data),
  release: (id, data) => api.patch(`/indoor-patient/${id}/release`, data),
};

export default indoorPatientService;
