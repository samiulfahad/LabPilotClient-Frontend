// src/api/transaction.js
// Mirror the pattern of commissionService

import api from "../baseAPI"; // your existing axios instance

const collectionReportAPI = {
  /**
   * GET /collection-report/summary?startDate=...&endDate=...
   * @param {{ startDate: number, endDate: number }} params  Unix ms timestamps
   */
  getSummary: ({ startDate, endDate }) => api.get("/collection-report/summary", { params: { startDate, endDate } }),
};

export default collectionReportAPI;
