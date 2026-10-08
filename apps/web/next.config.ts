import type { NextConfig } from "next";

// Static export: the web app is plain files served by Azure Static Web Apps.
// Next.js rewrites do not exist in static export, so the API base URL comes
// from NEXT_PUBLIC_API_BASE_URL at build time (see lib/api/config.ts).
// REQUIRE_API_BASE_URL=true (set by the deploy job) fails the build when that
// address is empty. A bare local or check build without the flag still passes.
if (process.env.REQUIRE_API_BASE_URL === "true" && !process.env.NEXT_PUBLIC_API_BASE_URL) {
  throw new Error("REQUIRE_API_BASE_URL is true but NEXT_PUBLIC_API_BASE_URL is empty. A deploy build needs the API address.");
}

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  reactStrictMode: true,
};

export default nextConfig;
