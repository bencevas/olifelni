import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PGlite ships WASM and sharp ships native binaries; neither can be bundled.
  serverExternalPackages: ["@electric-sql/pglite", "sharp", "postgres"],

  images: {
    /*
     * Our own loader instead of Vercel's image optimizer. The free plan's optimization quota
     * ran out, and from then on every photo not already cached failed with 402 Payment
     * Required. Photos are stored at fixed sizes instead (src/lib/storage.ts) and the loader
     * picks one — see src/lib/image-loader.ts.
     */
    loader: "custom",
    loaderFile: "./src/lib/image-loader.ts",
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
