import api from "./baseAPI";

const spaceService = {
  /** GET /spaces */
  getAll: (params) => api.get("/spaces", { params }),
  /** GET /space/:id */
  getById: (id) => api.get(`/space/${id}`),
  /** POST /space/add */
  create: (data) => api.post("/space/add", data),
  /** PUT /space/edit/:id */
  update: (id, data) => api.put(`/space/edit/${id}`, data),
  /** DELETE /space/:id */
  delete: (id) => api.delete(`/space/${id}`),

  /** PATCH /space/:id/reserve — single-bed */
  reserve: (id, note = "") => api.patch(`/space/${id}/reserve`, { note }),
  /** PATCH /space/:id/release-reservation — single-bed */
  releaseReservation: (id) => api.patch(`/space/${id}/release-reservation`),
  /** PATCH /space/:id/reserve-bed — multi-bed */
  reserveBed: (id, bedNumber, note = "") => api.patch(`/space/${id}/reserve-bed`, { bedNumber, note }),
  /** PATCH /space/:id/release-bed-reservation — multi-bed */
  releaseBedReservation: (id, bedNumber) => api.patch(`/space/${id}/release-bed-reservation`, { bedNumber }),
};

export default spaceService;
