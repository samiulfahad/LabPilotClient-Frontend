import api from "./baseAPI";

const supportService = {
  sendMessage: (message) => api.post("/support", { message }),
};

export default supportService;
