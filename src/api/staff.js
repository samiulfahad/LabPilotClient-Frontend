import api from "./baseAPI";

const staffService = {
  getStaffs: () => api.get("/staffs"),
  addStaff: (data) => api.post("/staff/add", data),
  editStaff: (data) => api.put("/staff/edit/" + data._id, data),
  deactivateStaff: (_id) => api.patch(`/staff/${_id}/deactivate`),
  activateStaff: (_id) => api.patch(`/staff/${_id}/activate`),
  deleteStaff: (_id) => api.delete(`/staff/${_id}`),
};

export default staffService;
