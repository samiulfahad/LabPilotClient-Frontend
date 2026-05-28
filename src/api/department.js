// api/department.js
import api from "./baseAPI";

const departmentService = {
  /** All canonical departments from the server */
  getAll: () => api.get("/departments"),

  /** All canonical designations from the server */
  getDesignations: () => api.get("/designations"),
};

export default departmentService;
