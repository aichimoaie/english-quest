import type { NextConfig } from "next";

// Static export: the web app is plain files served by Azure Static Web Apps.
// Next.js rewrites do not exist in static export, so the API base URL comes
// from NEXT_PUBLIC_API_BASE_URL at build time (see lib/api/config.ts).
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  reactStrictMode: true,
};

export default nextConfig;
