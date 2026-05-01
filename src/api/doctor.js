// api/doctor.js
import api from "./baseAPI";

const doctorService = {
  /**
   * Fetch doctors for the authenticated lab.
   * @param {{ search?: string, department?: string }} params  Optional filters
   */
  getAll: ({ search, department } = {}) => {
    const params = new URLSearchParams();
    if (search?.trim()) params.set("search", search.trim());
    if (department?.trim()) params.set("department", department.trim());
    const qs = params.toString();
    return api.get(`/doctors${qs ? `?${qs}` : ""}`);
  },

  /**
   * Fetch a single doctor by ID.
   * @param {string} id  MongoDB ObjectId string
   */
  getById: (id) => api.get(`/doctor/${id}`),

  /**
   * Register a new doctor.
   * @param {{ name, degree, contactNumber, designation, department, commissionType, commissionValue }} data
   */
  create: (data) => api.post("/doctor/add", data),

  /**
   * Update an existing doctor.
   * @param {string} id    MongoDB ObjectId string
   * @param {object} data  Partial doctor fields to update
   */
  update: (id, data) => api.put(`/doctor/edit/${id}`, data),

  /**
   * Hard-delete a doctor.
   * @param {string} id  MongoDB ObjectId string
   */
  delete: (id) => api.delete(`/doctor/${id}`),
};

export default doctorService;
