// expenseReportAPI.js
import api from "../baseAPI";

const expenseReportAPI = {
  /**
   * Fetch expense totals grouped by type for a date range.
   * @param {number} startDate  Unix ms timestamp — start of range
   * @param {number} endDate    Unix ms timestamp — end of range
   */
  getSummary: ({ startDate, endDate }) => {
    const params = new URLSearchParams({ startDate, endDate });
    return api.get(`/expense/summary?${params}`);
  },
};

export default expenseReportAPI;
