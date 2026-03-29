// src/api/transaction.js
// Mirror the pattern of commissionService

import api from "./baseAPI"; // your existing axios instance

const transactionService = {
  /**
   * GET /transactions/summary?startDate=...&endDate=...
   * @param {{ startDate: number, endDate: number }} params  Unix ms timestamps
   */
  getSummary: ({ startDate, endDate }) => api.get("/transactions/summary", { params: { startDate, endDate } }),
};

export default transactionService;
