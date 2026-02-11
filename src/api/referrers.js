import api from "./baseAPI";

const referrerService = {
  getReferrers: () => api.get("/referrers"),
  addReferrer: (data) => api.post("/referrers/add", data),
  editReferrer: (data) => api.put("/referrers/edit/" + data._id, data),
  deactivateReferrer: (_id) => api.patch(`/referrers/${_id}/deactivate`),
  activateReferrer: (_id) => api.patch(`/referrers/${_id}/activate`),
  deleteReferrer: (_id) => api.delete(`/referrers/${_id}`),
};

export default referrerService;
