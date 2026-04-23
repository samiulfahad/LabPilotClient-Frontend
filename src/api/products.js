import api from "./baseAPI";

const productService = {
  // Get products — supports search + pagination
  getProducts: ({ search = "", page = 1, limit = 50 } = {}) =>
    api.get("/products", { params: { search, page, limit } }),

  // Get a single product
  getProduct: (productId) => api.get(`/products/${productId}`),

  // Create a new product
  createProduct: (data) => api.post("/products", data),

  // Update an existing product (partial update)
  updateProduct: (productId, data) => api.patch(`/products/${productId}`, data),

  // Adjust stock by a delta (positive = add, negative = remove)
  adjustStock: (productId, delta, note) => api.post(`/products/${productId}/stock/adjust`, { delta, note }),

  // Soft delete a product
  deleteProduct: (productId) => api.delete(`/products/${productId}`),
};

export default productService;
