import api from "./baseAPI";

const staffService = {
  getStaffs: () => api.get("/staffs"),
  addStaff: (data) => api.post("/staff/add", data),
  updatePermissions: (data) => api.put(`/staff/${data._id}/permissions`, { permissions: data.permissions }),
  updateAdjustment: (data) => api.put(`/staff/${data._id}/adjustment`, { maxLabAdjustment: data.maxLabAdjustment }),
  deactivateStaff: (_id) => api.patch(`/staff/${_id}/deactivate`),
  activateStaff: (_id) => api.patch(`/staff/${_id}/activate`),
  deleteStaff: (_id) => api.delete(`/staff/${_id}`),
  resendPasswordSetup: (_id) => api.post(`/staff/${_id}/resend-password-setup`),
};

export default staffService;
