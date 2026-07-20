// src/api/dailyReports/discountReport.js
// Mirror the pattern of collectionReportAPI

import api from "../baseAPI"; // your existing axios instance

const discountReportAPI = {
  /**
   * GET /discount-report/summary?startDate=...&endDate=...
   * @param {{ startDate: number, endDate: number }} params  Unix ms timestamps
   */
  getSummary: ({ startDate, endDate }) => api.get("/discount-report/summary", { params: { startDate, endDate } }),
};

export default discountReportAPI;
