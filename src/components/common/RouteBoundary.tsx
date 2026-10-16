import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { ErrorBoundary } from "./ErrorBoundary";

/**
 * Error boundary for one route area (storefront, account, checkout, auth, admin).
 * It sits INSIDE the area's shell, so the header/footer/sidebar stay usable when
 * only the page content crashes, and it resets when the person navigates away.
 */
export function RouteBoundary({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  return <ErrorBoundary resetKey={pathname}>{children}</ErrorBoundary>;
}
