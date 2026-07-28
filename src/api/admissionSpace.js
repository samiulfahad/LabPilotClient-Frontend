import api from "./baseAPI";
import staticDataAPI from "./staticData";

const spaceService = {
  /** Reuse the canonical department list from staticDataAPI */
  getDepartments: () => staticDataAPI.getDepartments(),

  getAll: (params) => api.get("/spaces", { params }),
  getById: (id) => api.get(`/space/${id}`),
  create: (data) => api.post("/space/add", data),
  update: (id, data) => api.put(`/space/edit/${id}`, data),
  updatePrice: (id, chargePerDay) => api.patch(`/space/${id}/price`, { chargePerDay }),
  delete: (id) => api.delete(`/space/${id}`),
  reserve: (id, note = "") => api.patch(`/space/${id}/reserve`, { note }),
  releaseReservation: (id) => api.patch(`/space/${id}/release-reservation`),
  reserveBed: (id, bedNumber, note = "") => api.patch(`/space/${id}/reserve-bed`, { bedNumber, note }),
  releaseBedReservation: (id, bedNumber) => api.patch(`/space/${id}/release-bed-reservation`, { bedNumber }),
};

export default spaceService;
