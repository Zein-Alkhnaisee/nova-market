/** Why the visitor is being sent to the login page. Drives the short notice shown above the form. */
export type AuthReason = "checkout";

/** Login URL that returns the visitor to `redirect` afterwards (the param LoginPage/RegisterPage read). */
export function buildLoginUrl(redirect: string, reason?: AuthReason): string {
  const params = new URLSearchParams({ redirect });
  if (reason) params.set("reason", reason);
  return `/auth/login?${params.toString()}`;
}

/** The query string to carry between the login and register pages so neither forgets where the visitor was headed. */
export function carryAuthParams(searchParams: URLSearchParams): string {
  const params = new URLSearchParams();
  const redirect = searchParams.get("redirect");
  const reason = searchParams.get("reason");
  if (redirect) params.set("redirect", redirect);
  if (reason) params.set("reason", reason);
  const query = params.toString();
  return query ? `?${query}` : "";
}
