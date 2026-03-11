// api/cashmemo.js
import api from "./baseAPI";

const cashmemoService = {
  /**
   * Fetch aggregated financial summary for a date range.
   * @param {number} startDate  Unix ms timestamp — start of range
   * @param {number} endDate    Unix ms timestamp — end of range
   * @param {number} labId      Lab identifier (must match documents in DB)
   */
  getSummary: ({ startDate, endDate }) => {
    const params = new URLSearchParams({
      startDate,
      endDate,
    });
    return api.get(`/cashmemo/summary?${params}`);
  },
};

export default cashmemoService;
