import api from "./baseAPI";

const supportService = {
  sendMessage: (message, contact) => api.post("/support", { message, contact }),
};

export default supportService;
