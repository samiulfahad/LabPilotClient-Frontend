// api/indoorPatient.js
import api from "./baseAPI";

const indoorPatientService = {
  /** @param {{ search?, status?, page? }} params */
  getAll: ({ search, status, page = 1 } = {}) => {
    const params = new URLSearchParams({ page });
    if (search?.trim()) params.set("search", search.trim());
    if (status?.trim()) params.set("status", status.trim());
    return api.get(`/indoor-patients?${params}`);
  },

  /** @param {string} id */
  getById: (id) => api.get(`/indoor-patient/${id}`),

  /** @param {object} data */
  admit: (data) => api.post("/indoor-patient/admit", data),

  /** @param {string} id @param {object} data */
  update: (id, data) => api.put(`/indoor-patient/edit/${id}`, data),

  /** @param {string} id @param {{ releaseDate?, releaseNotes? }} data */
  release: (id, data = {}) => api.patch(`/indoor-patient/${id}/release`, data),

  /**
   * Transfer patient to a new location.
   * @param {string} id
   * @param {{ toType: string, toDetail?: string, reason?: string }} data
   */
  transfer: (id, data) => api.patch(`/indoor-patient/${id}/transfer`, data),

  /** @param {string} id */
  delete: (id) => api.delete(`/indoor-patient/${id}`),
};

export default indoorPatientService;
