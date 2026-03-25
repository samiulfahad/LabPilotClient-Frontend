import { create } from "zustand";
import { persist } from "zustand/middleware";

// ── Mock users (matching your DB documents) ──────────────────────────────────
const MOCK_USERS = [
  {
    _id: "69bf99cb7961a1fa58421222",
    labOid: "69bd7e4b9a381e898978f7b0",
    labId: 12345,
    name: "Support Admin",
    phone: "SUPPORTADMIN",
    password: "hasan1",
    role: "supportAdmin",
    permissions: {
      createInvoice: true,
      editInvoice: true,
      deleteInvoice: true,
      cashmemo: true,
      uploadReport: true,
      downloadReport: true,
    },
    isActive: false,
    isDeleted: true,
  },
  {
    _id: "69bf9572ab03690c07bfe612",
    labOid: "69bd7e4b9a381e898978f7b0",
    labId: 12345,
    name: "hjj j",
    phone: "01723939836",
    password: "hasan1", // mock password
    role: "staff",
    permissions: {
      createInvoice: false,
      editInvoice: true,
      deleteInvoice: false,
      cashmemo: false,
      uploadReport: false,
      downloadReport: false,
    },
    isActive: false,
    isDeleted: true,
    email: "kjkj@jgs.con",
  },
  {
    _id: "69bf9522ab03690c07bfe611",
    labOid: "69bd7e4b9a381e898978f7b0",
    labId: 12345,
    name: "jhkj",
    phone: "01735935619",
    password: "hasan1", // mock password
    role: "admin",
    permissions: {
      createInvoice: true,
      editInvoice: true,
      deleteInvoice: true,
      cashmemo: true,
      uploadReport: true,
      downloadReport: true,
    },
    isActive: true,
    isDeleted: false,
    email: "kjkj@jgs.conwwq",
  },
];

// ── Store ─────────────────────────────────────────────────────────────────────
export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      // Returns { success: true } or { success: false, message: string }
      login: async (labId, phone, password) => {
        // Simulate network delay
        await new Promise((r) => setTimeout(r, 1500));

        const found = MOCK_USERS.find((u) => u.labId === Number(labId) && u.phone === phone && u.password === password);

        if (!found) {
          return { success: false, message: "Invalid Lab ID, phone, or password." };
        }

        // Strip password before storing
        const { password: _pw, ...safeUser } = found;

        set({ user: safeUser, isAuthenticated: true });
        return { success: true };
      },

      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: "labpilot-auth", // key in localStorage
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
