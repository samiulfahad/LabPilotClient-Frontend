import api from "./baseAPI";

const referrerService = {
  getRequiredData: () => api.get("/invoice/required-data"),
  createInvoice: (data) => api.post("/invoice/add", data),
  getInvoices: () => api.get("/invoice/all"),
  getInvoiceByInvoiceId:(_id) => api.get(`/invoice/${_id}`),

  addReferrer: (data) => api.post("/referrer/add", data),
  editReferrer: (data) => api.put("/referrer/edit/" + data._id, data),
  deactivateReferrer: (_id) => api.patch(`/referrer/${_id}/deactivate`),
  activateReferrer: (_id) => api.patch(`/referrer/${_id}/activate`),
  deleteReferrer: (_id) => api.delete(`/referrer/${_id}`),
};

export default referrerService;
