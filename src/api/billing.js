import api from "./baseAPI";

// ─── Helper Utilities ────────────────────────────────────────────────────────

const billingService = {
  getStatus: () => api.get("/billing/status"),
  getHistory: () => api.get("/billing/history"),
  pay: (billingId) => api.post(`/billing/pay/${billingId}`),
};
export default billingService