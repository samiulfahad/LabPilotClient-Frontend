import { create } from "zustand";
import { persist } from "zustand/middleware";
import { jwtDecode } from "jwt-decode";
import api from "../api/baseAPI";
import { getDeviceInfo } from "../utils/deviceInfo";

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      lab: null,
      token: null,
      isAuthenticated: false,

      setToken: (newToken) => set({ token: newToken }),

      login: async (labKey, phone, password) => {
        try {
          const response = await api.post("/login", {
            labKey: Number(labKey),
            phone,
            password,
            device: getDeviceInfo(),
          });

          const { accessToken, lab } = response.data;
          const decodedUser = jwtDecode(accessToken);

          set({
            user: decodedUser,
            lab,
            token: accessToken,
            isAuthenticated: true,
          });

          return { success: true };
        } catch (error) {
          const message = error.response?.data?.error || "Login failed. Please check your credentials.";
          return { success: false, message };
        }
      },

      // ── Logout current device only ─────────────────────────────────────────
      logout: async () => {
        try {
          await api.post("/logout");
        } catch (error) {
          console.error("Logout API failed, but clearing local state anyway", error);
        } finally {
          set({ user: null, lab: null, token: null, isAuthenticated: false });
        }
      },

      // ── Logout all devices (requires auth, clears all tokens in DB) ────────
      logoutAll: async () => {
        try {
          await api.post("/logout-all");
        } catch (error) {
          console.error("Logout-all API failed, but clearing local state anyway", error);
        } finally {
          set({ user: null, lab: null, token: null, isAuthenticated: false });
        }
      },
    }),
    {
      name: "labpilot-auth",
      partialize: (state) => ({
        user: state.user,
        lab: state.lab,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
