import api from "./baseAPI";

const accountService = {
  /** GET /account — full profile, no password */
  getMe: () => api.get("/account"),
  /** GET /account/sessions — all active sessions */
  getSessions: () => api.get("/account/sessions"),
  /**
   * DELETE /account/sessions/:deviceId — revoke a specific session
   * @param {string} deviceId
   */
  revokeSession: (deviceId) => api.delete(`/account/sessions/${deviceId}`),
  /**
   * PATCH /account/phone
   * @param {{ phone: string, currentPassword: string }} data
   */
  changePhone: (data) => api.patch("/account/phone", data),
  /**
   * PATCH /account/password
   * @param {{ currentPassword: string, newPassword: string }} data
   */
  changePassword: (data) => api.patch("/account/password", data),
  /**
   * PATCH /account/email
   * @param {{ email: string, currentPassword: string }} data
   */
  changeEmail: (data) => api.patch("/account/email", data),
};

export default accountService;
