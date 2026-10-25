import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PGlite ships WASM and sharp ships native binaries; neither can be bundled.
  serverExternalPackages: ["@electric-sql/pglite", "sharp", "postgres"],

  images: {
    /*
     * Local uploads are served from /uploads; with Supabase Storage configured they come
     * from the project's CDN host, which next/image requires to be allow-listed.
     *
     * Matched by wildcard rather than read from SUPABASE_URL, because this file is
     * evaluated once at build time: a deployment built before that variable was set (or
     * set to the wrong value — the Postgres URL is an easy mix-up) baked in an allow-list
     * that no longer matches, and every image then failed at runtime with no clue why.
     * The path stays pinned to public storage objects.
     */
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
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
