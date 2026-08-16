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
      // `lab` IS persisted in full (see partialize below) so Home.jsx and
      // similar screens have contact/isActive/labKey etc. immediately on
      // reload, without the backend needing an extra DB lookup on /refresh.
      // `user` (permissions, role, labKey, labId, maxLabAdjustment) stays
      // memory-only and is null until this resolves — we always overwrite
      // both with the server response as source of truth, falling back to
      // the persisted `lab` only if the backend doesn't hand one back.
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
          // set({ lab: null }) above already makes the next persist write
          // {lab: null}, but that write only happens on the next tick — this
          // clears the localStorage entry immediately so nothing lingers if
          // the tab closes right after logout.
          localStorage.removeItem("labpilot-auth");
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
          localStorage.removeItem("labpilot-auth");
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
      name: "labpilot-auth",
      // Only `lab` is persisted — full object except `_id` (internal Mongo
      // id, no use to the frontend) — so screens like Home.jsx have
      // everything they need right after reload, before /refresh resolves,
      // without the backend needing an extra DB lookup just to hand it back.
      // `user` (permissions, role, labKey, labId, maxLabAdjustment) and
      // `token` are deliberately kept out of localStorage:
      //   - `token`: an access token readable by any injected script (XSS,
      //     malicious extension, a compromised dependency) is a real risk.
      //   - `isAuthenticated`: excluded so a stale "true" can't flash
      //     protected UI before initialize() confirms the session is valid.
      //   - `user`: this is a hospital/diagnostic SaaS, so permission maps
      //     stay out of storage too — initialize() re-derives the full
      //     `user` from the server on every mount anyway.
      partialize: (state) => {
        if (!state.lab) return { lab: null };
        const { _id, ...labWithoutId } = state.lab;
        return { lab: labWithoutId };
      },
    },
  ),
);
