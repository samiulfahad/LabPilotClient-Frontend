import api from "./baseAPI";
import externalAPI from "./externalAPI";

const labTestService = {
  getGlobalTestList: () => externalAPI.get("/lab/test/all"),
  getCategoryList: () => externalAPI.get("/lab/testCategory/all/"),
  getTestList: () => api.get("/tests"),
  addLabTest: (data) => api.post("/test/add", data),
  editLabTest: (data) => api.put("/test/edit/" + data._id, data),
  deleteTest: (_id) => api.delete(`/test/${_id}`),
};

export default labTestService;


// http://localhost:5000/api/v1/test/698de55ef6e82e02c421fe9c


