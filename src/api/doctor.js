// api/doctor.js
import api from "./baseAPI";

const doctorService = {
  /**
   * Fetch paginated doctors for the authenticated lab.
   * @param {{ search?: string, department?: string, page?: number }} params
   * @returns {{ doctors, total, page, totalPages, pageSize }}
   */
  getAll: ({ search, department, page = 1 } = {}) => {
    const params = new URLSearchParams({ page });
    if (search?.trim()) params.set("search", search.trim());
    if (department?.trim()) params.set("department", department.trim());
    return api.get(`/doctors?${params}`);
  },

  /**
   * Fetch a single doctor by ID.
   * @param {string} id  MongoDB ObjectId string
   */
  getById: (id) => api.get(`/doctor/${id}`),

  /**
   * Register a new doctor.
   * @param {{ name, degree, contactNumber, designation, departments, commissionType, commissionValue }} data
   * departments is an array of department value strings e.g. ["neurology", "general"]
   */
  create: (data) => api.post("/doctor/add", data),

  /**
   * Update a doctor's basic info only (name, degree, contactNumber,
   * designation, departments). Commission is edited separately via
   * updateCommission below.
   * @param {string} id    MongoDB ObjectId string
   * @param {object} data  Partial basic-info fields to update
   */
  update: (id, data) => api.put(`/doctor/edit/${id}`, data),

  /**
   * Update a doctor's commission only.
   * @param {string} id    MongoDB ObjectId string
   * @param {{ commissionType, commissionValue }} data
   */
  updateCommission: (id, data) =>
    api.put(`/doctor/${id}/commission`, {
      commissionType: data.commissionType,
      commissionValue: data.commissionValue,
    }),

  /**
   * Hard-delete a doctor.
   * @param {string} id  MongoDB ObjectId string
   */
  delete: (id) => api.delete(`/doctor/${id}`),
};

export default doctorService;
