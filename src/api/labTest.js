import api from "./baseAPI";
import externalAPI from "./externalAPI";

const labTestService = {
  getGlobalTestList: () => externalAPI.get("/lab/test/all"),
  getCategoryList: () => externalAPI.get("/lab/testCategory/all/"),
  getTestList: () => api.get("/testList"),
  addLabTest: (data) => api.post("/labTest/add", data),
  editLabTest: (data) => api.put("/labTest/edit/" + data._id, data),
  deactivateTest: (_id) => api.patch(`/labTest/${_id}/deactivate`),
  activateTest: (_id) => api.patch(`/labTest/${_id}/activate`),
  deleteTest: (_id) => api.delete(`/labTest/${_id}`),
};

export default labTestService;
