import api from "./baseAPI";
import departmentService from "./department"; // ← add

const spaceService = {
  /** Reuse the canonical department list from departmentService */
  getDepartments: () => departmentService.getAll(), // ← add

  getAll: (params) => api.get("/spaces", { params }),
  getById: (id) => api.get(`/space/${id}`),
  create: (data) => api.post("/space/add", data),
  update: (id, data) => api.put(`/space/edit/${id}`, data),
  delete: (id) => api.delete(`/space/${id}`),
  reserve: (id, note = "") => api.patch(`/space/${id}/reserve`, { note }),
  releaseReservation: (id) => api.patch(`/space/${id}/release-reservation`),
  reserveBed: (id, bedNumber, note = "") => api.patch(`/space/${id}/reserve-bed`, { bedNumber, note }),
  releaseBedReservation: (id, bedNumber) => api.patch(`/space/${id}/release-bed-reservation`, { bedNumber }),
};
export default spaceService;
