/**
 * Where the API lives. Static export has no rewrites, so the browser calls the
 * API hostname directly (api.<domain>, CORS allowed for the web origin).
 *
 * When NEXT_PUBLIC_API_BASE_URL is unset in development and tests, requests are
 * answered by the temporary fixture server in lib/fixtures. Production builds
 * never use fixtures, so answer keys stay out of the shipped bundle. Remove the
 * fixture fallback when apps/api is live. The deploy build sets
 * REQUIRE_API_BASE_URL=true, which makes next.config.ts fail when the address
 * is empty.
 */
export const API_BASE_URL: string = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export const USE_FIXTURES: boolean = process.env.NODE_ENV !== "production" && API_BASE_URL === "";
