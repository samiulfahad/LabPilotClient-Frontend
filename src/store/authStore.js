import { create } from "zustand";
import { persist } from "zustand/middleware";
import { jwtDecode } from "jwt-decode";
import api from "../api/baseAPI";
import { getDeviceInfo } from "../utils/deviceInfo";

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      lab: null,
      token: null, // in-memory only — NOT persisted, see partialize below
      isAuthenticated: false,
      isInitializing: true, // true until the initial /refresh check resolves

      // billingStatus is intentionally NOT persisted — it's a live reflection
      // of the backend's 5-min cache, not identity/session data. Re-fetched
      // fresh on every app mount instead of trusted from localStorage.
      billingStatus: null, // { hasUnpaidBill, isOverdue, dueDate, amount } | null

      setToken: (newToken) => set({ token: newToken }),

      // ── Called once on app mount (see App.jsx) ─────────────────────────────
      // The access token lives only in memory, so a hard refresh/new tab
      // always starts with token: null. This re-derives a fresh access token
      // from the httpOnly refresh cookie — same mechanism as the 444 retry
      // flow in baseAPI.js — so the session survives a reload without ever
      // putting the token in localStorage.
      //
      // `user`/`lab` ARE persisted (non-sensitive display info), so on a
      // normal reload they're already populated from storage before this
      // resolves — we just refresh them from the server response as the
      // source of truth, and fall back to whatever's already in the store
      // if the backend doesn't hand back `lab` for some reason.
      initialize: async () => {
        try {
          const { data } = await api.post("/refresh");
          const decodedUser = jwtDecode(data.accessToken);
          set((state) => ({
            user: decodedUser,
            lab: data.lab ?? state.lab,
            token: data.accessToken,
            isAuthenticated: true,
            isInitializing: false,
          }));
        } catch {
          set({
            user: null,
            lab: null,
            token: null,
            isAuthenticated: false,
            billingStatus: null,
            isInitializing: false,
          });
        }
      },

      login: async (labKey, phone, password) => {
        try {
          const response = await api.post("/login", {
            labKey: String(labKey),
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
          set({ user: null, lab: null, token: null, isAuthenticated: false, billingStatus: null });
        }
      },

      // ── Logout all devices (requires auth, clears all tokens in DB) ────────
      logoutAll: async () => {
        try {
          await api.post("/logout-all");
        } catch (error) {
          console.error("Logout-all API failed, but clearing local state anyway", error);
        } finally {
          set({ user: null, lab: null, token: null, isAuthenticated: false, billingStatus: null });
        }
      },

      // ── Billing status ──────────────────────────────────────────────────────
      // Merge-style setter: header updates (hasUnpaidBill/isOverdue/dueDate)
      // don't carry `amount`, so a partial update must not wipe out the amount
      // set by the last full /billing/status fetch.
      setBillingStatus: (partial) => set((state) => ({ billingStatus: { ...state.billingStatus, ...partial } })),

      // Full fetch — call on app mount to seed state, and right after a
      // successful payment to make the banner disappear instantly for the
      // paying session (other sessions pick it up via response headers).
      fetchBillingStatus: async () => {
        try {
          const { data } = await api.get("/billing/status");
          if (!data.hasUnpaidBill) {
            set({ billingStatus: { hasUnpaidBill: false, isOverdue: false, dueDate: null, amount: null } });
            return;
          }
          set({
            billingStatus: {
              hasUnpaidBill: true,
              isOverdue: data.isOverdue,
              dueDate: data.bill.dueDate,
              amount: data.bill.amount,
            },
          });
        } catch (error) {
          console.error("Failed to fetch billing status", error);
        }
      },
    }),
    {
      name: "chinku_pappa",
      // Only non-sensitive display info survives a reload. `token` is
      // deliberately excluded — an access token in localStorage is
      // readable by any injected script (XSS, malicious extension, a
      // compromised dependency). `isAuthenticated` is excluded too, so a
      // stale "true" can't flash protected UI before initialize() confirms
      // the session is actually still valid.
      partialize: (state) => ({
        user: state.user,
        lab: state.lab,
      }),
    },
  ),
);