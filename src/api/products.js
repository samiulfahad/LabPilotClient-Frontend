import api from "./baseAPI";

const productService = {
  // Get all products for the lab
  getProducts: () => api.get("/products"),

  // Get a single product
  getProduct: (productId) => api.get(`/products/${productId}`),

  // Create a new product
  createProduct: (data) => api.post("/products", data),

  // Update an existing product (partial update)
  updateProduct: (productId, data) => api.patch(`/products/${productId}`, data),

  // Soft delete a product
  deleteProduct: (productId) => api.delete(`/products/${productId}`),
};

export default productService;
