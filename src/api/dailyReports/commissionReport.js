// api/commission.js
import api from "../baseAPI";

const commissionReportAPI = {
  getSummary: ({ startDate, endDate }) => {
    const params = new URLSearchParams({ startDate, endDate });
    return api.get(`/commission-report/summary?${params}`);
  },
};

export default commissionReportAPI;
