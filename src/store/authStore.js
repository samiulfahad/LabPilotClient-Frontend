import { create } from "zustand";
import { persist } from "zustand/middleware";
import { jwtDecode } from "jwt-decode"; // You'll need to run: npm install jwt-decode
import api from "../api/baseAPI"; // Import your newly configured Axios instance

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      // Helper function used by the Axios interceptor
      setToken: (newToken) => set({ token: newToken }),

      login: async (labKey, phone, password) => {
        try {
          // Send request via your Axios instance (bypasses auth interceptor since no token exists yet)
          const response = await api.post("/login", {
            labKey: Number(labKey),
            phone,
            password,
          });

          const { accessToken } = response.data;

          // Decode the payload to get user data (role, permissions, etc.)
          const decodedUser = jwtDecode(accessToken);

          set({
            user: decodedUser,
            token: accessToken,
            isAuthenticated: true,
          });

          return { success: true };
        } catch (error) {
          // Handle specific backend error messages if available
          const message = error.response?.data?.error || "Login failed. Please check your credentials.";
          return { success: false, message };
        }
      },

      logout: async () => {
        try {
          // Tell the backend to clear the httpOnly cookies and delete the session from the DB
          await api.post("/logout");
        } catch (error) {
          console.error("Logout API failed, but clearing local state anyway", error);
        } finally {
          // Always clear local state, even if the backend request fails
          set({ user: null, token: null, isAuthenticated: false });
        }
      },
    }),
    {
      name: "labpilot-auth",
      partialize: (state) => ({
        user: state.user,
        // We persist the token so if they refresh the page before expiry, they remain logged in
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
