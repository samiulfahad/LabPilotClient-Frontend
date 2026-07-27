// hooks/useGuardedAction.js
import { useState } from "react";
import { useAuthStore } from "../store/authStore";

const DEFAULT_MESSAGE = "আপনার কর্তৃপক্ষ আপনাকে এই কাজটি করার অনুমতি দেয়নি।";

/**
 * Wraps any handler so it only runs if the current user has the given
 * permission — admins bypass all permission checks.
 *
 * const { guard, denied, closeDenied } = useGuardedAction();
 * <Btn onClick={guard("deletePatient", handleDelete)}>Delete</Btn>
 * {denied && <Popup type="denied" message={denied} onClose={closeDenied} />}
 */
export const useGuardedAction = () => {
  const role = useAuthStore((s) => s.user?.role);
  const permissions = useAuthStore((s) => s.user?.permissions);
  const [denied, setDenied] = useState(null); // null | message string

  const isAdmin = role === "admin";

  const guard =
    (permissionKey, fn, customMessage) =>
    (...args) => {
      if (!isAdmin && !permissions?.[permissionKey]) {
        setDenied(customMessage || DEFAULT_MESSAGE);
        return;
      }
      return fn(...args);
    };

  return { guard, denied, closeDenied: () => setDenied(null) };
};
