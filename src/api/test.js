import api from "./baseAPI";

const testService = {
  getTestCatalog: () => api.get("test/catalog"),
  getCategories: () => api.get("/test/categories"),
  getTestList: () => api.get("/test/all"),
  addTest: (data) => api.post("/test", data),
  updatePrice: (testId, price) => api.patch(`/test/${testId}/price`, { price }),
  updateSchema: (testId, schemaId) => api.patch(`/test/${testId}/schema`, { schemaId }),
  deleteTest: (_id) => api.delete(`/test/${_id}`),
  getSchemasByTestId: (testId) => api.get("/test/schema/" + testId),
  getSchemaBySchemaId: (schemaId) => api.get("/schema/" + schemaId),
};

export default testService;
