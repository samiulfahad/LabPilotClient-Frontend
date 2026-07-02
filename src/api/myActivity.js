// src/api/myActivity.js
// Mirrors the pattern of collectionReportAPI / transaction.js

import api from "./baseAPI"; // your existing axios instance

const myActivityAPI = {
  /**
   * GET /my-activity/summary?startDate=...&endDate=...
   * Always scoped to the logged-in staff on the backend.
   * @param {{ startDate: number, endDate: number }} params  Unix ms timestamps
   */
  getSummary: ({ startDate, endDate }) => api.get("/my-activity/summary", { params: { startDate, endDate } }),

  /**
   * GET /my-activity/invoices?startDate=...&endDate=...
   * OPD invoices created by the logged-in staff in the given range.
   * @param {{ startDate: number, endDate: number }} params  Unix ms timestamps
   */
  getInvoices: ({ startDate, endDate }) => api.get("/my-activity/invoices", { params: { startDate, endDate } }),

  /**
   * GET /my-activity/collections?startDate=...&endDate=...
   * All payments (OPD + IPD) collected by the logged-in staff in the given range.
   * @param {{ startDate: number, endDate: number }} params  Unix ms timestamps
   */
  getCollections: ({ startDate, endDate }) => api.get("/my-activity/collections", { params: { startDate, endDate } }),
};

export default myActivityAPI;
