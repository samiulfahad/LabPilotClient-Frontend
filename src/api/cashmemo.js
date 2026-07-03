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

  getIpdDiscountPatients: ({ startDate, endDate }) => {
    const params = new URLSearchParams({ startDate, endDate });
    return api.get(`/cashmemo/ipd-discount-patients?${params}`);
  },

  getIpdAdmittedPatients: ({ startDate, endDate }) => {
    const params = new URLSearchParams({ startDate, endDate });
    return api.get(`/cashmemo/ipd-admitted-patients?${params}`);
  },

  getIpdReleasedPatients: ({ startDate, endDate }) => {
    const params = new URLSearchParams({ startDate, endDate });
    return api.get(`/cashmemo/ipd-released-patients?${params}`);
  },

  getExpenseSummary: ({ startDate, endDate }) => {
    const params = new URLSearchParams({ startDate, endDate });
    return api.get(`/cashmemo/expense-summary?${params}`);
  },
};

export default cashmemoService;
