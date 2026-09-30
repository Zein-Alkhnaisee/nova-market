import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAppSelector } from "../app/store/hooks";
import { selectIsAuthenticated, selectUser } from "../features/auth/authSlice";
import type { UserRole } from "../types/user";

interface AuthGuardOptions {
  /** When set, the signed-in user must also hold this role. */
  role?: UserRole;
}

/**
 * Returns true only when the visitor is signed in (and, if `role` is given,
 * holds that role).
 *
 * - Unauthenticated: redirected to login once, on landing, with a `redirect`
 *   param so they return to where they were headed.
 * - Authenticated but wrong role: NOT redirected. The hook returns false and
 *   the caller renders a "no access" state in place — bouncing a signed-in
 *   customer away from /admin would hide why they can't get in.
 *
 * This is a UX guard only. Real authorization must be enforced by the backend
 * (MASTER_SPEC §97); a client-side role check can be bypassed.
 */
export function useAuthGuard({ role }: AuthGuardOptions = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectUser);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate(`/auth/login?redirect=${encodeURIComponent(location.pathname)}`, { replace: true });
    }
    // Checked once per landing, same rationale as useCheckoutGuard: this
    // should stop someone from *arriving* at a protected page unauthenticated,
    // not re-fire mid-navigation when a page's own action (e.g. logout)
    // changes the very state being guarded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isAuthenticated) return false;
  if (role && (user?.role ?? "customer") !== role) return false;
  return true;
}
