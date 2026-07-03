import api from "./baseAPI";

const salesReportAPI = {
  getSummary: ({ startDate, endDate, limit }) => {
    const params = new URLSearchParams({
      startDate,
      endDate,
      ...(limit ? { limit } : {}),
    });
    return api.get(`/test-stats/summary?${params}`);
  },

  /**
   * Fetch expense totals grouped by type for a date range.
   * @param {number} startDate  Unix ms timestamp — start of range
   * @param {number} endDate    Unix ms timestamp — end of range
   */
  getExpenseSummary: ({ startDate, endDate }) => {
    const params = new URLSearchParams({ startDate, endDate });
    return api.get(`/expense/summary?${params}`);
  },
};

export default salesReportAPI;
