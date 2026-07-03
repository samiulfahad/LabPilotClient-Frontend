import api from "./baseAPI";

const expenseService = {
  createExpense: (data) => api.post("/expense/add", data),
  editExpense: (expenseId, data) => api.patch(`/expense/${expenseId}/edit`, data),
  deleteExpense: (expenseId) => api.patch(`/expense/${expenseId}/delete`),
  getExpenseById: (expenseId) => api.get(`/expense/${expenseId}`),
  getExpenses: ({
    cursor = null,
    limit = 20,
    startDate = null,
    endDate = null,
    type = null,
    minAmount = null,
    maxAmount = null,
  } = {}) => {
    const params = new URLSearchParams({ limit });
    if (cursor) params.append("cursor", cursor);
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    if (type) params.append("type", type);
    if (minAmount !== null && minAmount !== "") params.append("minAmount", minAmount);
    if (maxAmount !== null && maxAmount !== "") params.append("maxAmount", maxAmount);
    return api.get(`/expense/all?${params}`);
  },
  getDeletedExpenses: ({ cursor = null, limit = 20, startDate = null, endDate = null, type = null } = {}) => {
    const params = new URLSearchParams({ limit });
    if (cursor) params.append("cursor", cursor);
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    if (type) params.append("type", type);
    return api.get(`/expense/deleted?${params}`);
  },
};

export default expenseService;
