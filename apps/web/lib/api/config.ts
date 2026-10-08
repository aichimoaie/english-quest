/**
 * Where the API lives. Static export has no rewrites, so the browser calls the
 * API hostname directly (api.<domain>, CORS allowed for the web origin).
 *
 * When NEXT_PUBLIC_API_BASE_URL is unset (local development before the API
 * exists), requests are answered by the temporary fixture server in
 * lib/fixtures. Remove that fallback when apps/api is live.
 */
export const API_BASE_URL: string = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export const USE_FIXTURES: boolean = API_BASE_URL === "";
