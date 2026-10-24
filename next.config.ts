import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PGlite ships WASM and sharp ships native binaries; neither can be bundled.
  serverExternalPackages: ["@electric-sql/pglite", "sharp", "postgres"],

  images: {
    // Local uploads are served from /uploads. When Supabase Storage is configured,
    // images come from its CDN host instead, which must be allow-listed here.
    remotePatterns: process.env.SUPABASE_URL
      ? [
          {
            protocol: "https",
            hostname: new URL(process.env.SUPABASE_URL).hostname,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },

  async redirects() {
    return [
      // The old Wix brand pages served the wrong brand: /copy-of-bmw was Audi,
      // /copy-of-audi was Toyota, and so on. These send each to the right place.
      { source: "/bmw", destination: "/felnik?marka=BMW", permanent: true },
      { source: "/copy-of-bmw", destination: "/felnik?marka=Audi", permanent: true },
      { source: "/copy-of-audi", destination: "/felnik?marka=Toyota", permanent: true },
      { source: "/copy-of-audi-1", destination: "/felnik?marka=Mercedes+Benz", permanent: true },
      { source: "/copy-of-audi-2", destination: "/felnik?marka=Volkswagen", permanent: true },
      { source: "/copy-of-volkswagen", destination: "/felnik?marka=Seat", permanent: true },
    ];
  },
};

export default nextConfig;
