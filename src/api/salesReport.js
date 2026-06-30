// api/testStats.js
import api from "./baseAPI";

const salesReportAPI = {
  /**
   * Fetch test/product order counts for a date range.
   * Response includes outdoor counts (testCounts/productCounts) always,
   * and indoor counts (indoorTestCounts/indoorProductCounts) for hospitals
   * with an IPD module.
   * @param {number} startDate  Unix ms timestamp — start of range
   * @param {number} endDate    Unix ms timestamp — end of range
   * @param {number} [limit]    Max number of tests to return (default 50)
   */
  getSummary: ({ startDate, endDate, limit }) => {
    const params = new URLSearchParams({
      startDate,
      endDate,
      ...(limit ? { limit } : {}),
    });
    return api.get(`/test-stats/summary?${params}`);
  },
};

export default salesReportAPI;
