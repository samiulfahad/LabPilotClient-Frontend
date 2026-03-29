// src/api/profile.js

import api from "./baseAPI"; // your existing axios instance

const profileService = {
  /** GET /profile — returns full profile of the logged-in user */
  getMe: () => api.get("/profile"),

  /**
   * PATCH /profile/phone
   * @param {{ phone: string, currentPassword: string }} data
   */
  changePhone: (data) => api.patch("/profile/phone", data),

  /**
   * PATCH /profile/password
   * @param {{ currentPassword: string, newPassword: string }} data
   */
  changePassword: (data) => api.patch("/profile/password", data),
};

export default profileService;
