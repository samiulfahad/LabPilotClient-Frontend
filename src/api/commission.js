// api/commission.js
import api from "./baseAPI";

const commissionService = {
  getSummary: ({ startDate, endDate }) => {
    const params = new URLSearchParams({ startDate, endDate });
    return api.get(`/commission/summary?${params}`);
  },
};

export default commissionService;
