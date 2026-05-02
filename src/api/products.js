import api from "./baseAPI";

const productService = {
  // List products — filter by type, supports search + pagination
  // type: "medicine" | "product" | "service"
  getProducts: ({ type, search = "", page = 1, limit = 50 } = {}) =>
    api.get("/products", { params: { ...(type && { type }), search, page, limit } }),

  // Get a single product
  getProduct: (itemId) => api.get(`/products/${itemId}`),

  // Create a product (type required in data)
  createProduct: (data) => api.post("/products", data),

  // Partial update
  updateProduct: (itemId, data) => api.patch(`/products/${itemId}`, data),

  // Adjust stock by a signed delta
  adjustStock: (itemId, delta, note) => api.post(`/products/${itemId}/stock/adjust`, { delta, note }),

  // Delete
  deleteProduct: (itemId) => api.delete(`/products/${itemId}`),
};

export default productService;
