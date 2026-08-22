import api from "./baseAPI";

const helpCenterService = {
  sendMessage: (message, contact) => api.post("/support", { message, contact }),
};

export default helpCenterService;
