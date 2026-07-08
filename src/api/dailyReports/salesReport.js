// salesReportAPI.js
import api from "../baseAPI";

const salesReportAPI = {
  /**
   * Fetch test and product order counts for a date range.
   * @param {number} startDate  Unix ms timestamp — start of range
   * @param {number} endDate    Unix ms timestamp — end of range
   * @param {number} [limit]    Max items per category
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
