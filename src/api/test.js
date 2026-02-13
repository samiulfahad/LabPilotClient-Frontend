import api from "./baseAPI";
import externalAPI from "./externalAPI";

const testService = {
  getTestCatalog: () => api.get("test/catalog"),
  getCategories: () => api.get("/test/categories"),
  getTestList: () => api.get("/test/all"),
  addTest: (data) => api.post("/test", data),
  editTest: (data) => api.patch("/test/" + data.testId, data),
  deleteTest: (_id) => api.delete(`/test/${_id}`),
  getSchemasByTestId: (testId) => api.get("/test/schema/" + testId),
};

export default testService;
