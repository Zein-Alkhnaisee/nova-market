import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAppSelector } from "../app/store/hooks";
import { selectIsAuthenticated } from "../features/auth/authSlice";

export function useAuthGuard() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

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

  return isAuthenticated;
}
