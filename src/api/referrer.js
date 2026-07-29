import api from "./baseAPI";

const referrerService = {
  getAll: () => api.get("/referrers"),
  addReferrer: (data) => api.post("/referrer/add", data),
  editReferrer: ({ _id, ...data }) => api.put("/referrer/edit/" + _id, data),
  updateCommission: (data) =>
    api.put(`/referrer/${data._id}/commission`, {
      commissionType: data.commissionType,
      commissionValue: data.commissionValue,
    }),
  deleteReferrer: (_id) => api.delete(`/referrer/${_id}`),
};

export default referrerService;
