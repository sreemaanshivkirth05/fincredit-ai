import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optional server-side proxy keeps Codespaces browser API calls on one private origin.
  async rewrites() {
    const target = process.env.FINCREDIT_API_PROXY_URL;
    return target ? [{ source: "/api/:path*", destination: `${target}/api/:path*` }] : [];
  },
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
