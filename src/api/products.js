import api from "./baseAPI";

const productService = {
  getProducts: (params) => api.get("/products", { params }),
  createProduct: (data) => api.post("/products", data),
  updateProductInfo: (itemId, data) => api.patch(`/products/${itemId}/info`, data),
  updateProductPrice: (itemId, price) => api.patch(`/products/${itemId}/price`, { price }),
  adjustStock: (itemId, delta, note) => api.post(`/products/${itemId}/stock/adjust`, { delta, note }),
  deleteProduct: (itemId) => api.delete(`/products/${itemId}`),
};

export default productService;
