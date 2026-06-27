import api from "./baseAPI";

const cashmemoService = {
  getSummary: ({ startDate, endDate }) => {
    const params = new URLSearchParams({ startDate, endDate });
    return api.get(`/cashmemo/summary?${params}`);
  },

  getIpdSummary: ({ startDate, endDate }) => {
    const params = new URLSearchParams({ startDate, endDate });
    return api.get(`/cashmemo/ipd-summary?${params}`);
  },
};

export default cashmemoService;
