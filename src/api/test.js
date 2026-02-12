import api from "./baseAPI";
import externalAPI from "./externalAPI";

const testService = {
  getGlobalTestList: () => externalAPI.get("/lab/test/all"),
  getCategoryList: () => externalAPI.get("/lab/testCategory/all/"),
  getTestList: () => api.get("/tests"),
  addTest: (data) => api.post("/test/add", data),
  editTest: (data) => api.put("/test/edit/" + data._id, data),
  deleteTest: (_id) => api.delete(`/test/${_id}`),
};

export default testService;



