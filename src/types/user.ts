export type UserRole = "customer" | "admin";

export interface User {
  id: string;
  fullName: string;
  email: string;
  /**
   * Optional so sessions persisted before Phase 12 (which have no role) still
   * load; a missing role is treated as "customer" everywhere it is checked.
   */
  role?: UserRole;
}
