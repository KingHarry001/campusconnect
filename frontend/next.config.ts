// next.config.ts
import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "tcpzenciiykmdhzrhamb.supabase.co" },
    ],
    unoptimized: true,
  },
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;