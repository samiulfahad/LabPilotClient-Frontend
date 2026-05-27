import api from "./baseAPI";

const departmentService = {
  /** GET /departments/allowed — canonical whitelist, no auth required */
  getAllowed: () => api.get("/departments/allowed"),

  /** GET /departments — this hospital's active department list */
  getActive: () => api.get("/departments"),

  /** POST /departments/set — replace the full active list */
  set: (departments) => api.post("/departments/set", { departments }),

  /** DELETE /department/:value — remove a single department */
  remove: (value) => api.delete(`/department/${value}`),
};

export default departmentService;
