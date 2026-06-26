// api/department.js
import api from "./baseAPI";

const staticDataAPI = {
  /** All canonical departments from the server */
  getDepartments: () => api.get("/departments"),

  /** All canonical designations from the server */
  getDesignations: () => api.get("/designations"),

  /** All canonical staff permissions from the server */
  getStaffPermissions: () => api.get("/staff-permissions"),
};

export default staticDataAPI;
