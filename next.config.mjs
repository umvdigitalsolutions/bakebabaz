/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "images.pexels.com" },
    ],
    formats: ["image/avif", "image/webp"],
    qualities: [60, 75, 85, 90],
  },
  serverExternalPackages: ["mongoose", "bcryptjs"],
  poweredByHeader: false,
  // Retired storefront pages land in the catalogue instead of returning 404s.
  async redirects() {
    return [
      { source: "/our-bakes", destination: "/shop", permanent: true },
      { source: "/favourites", destination: "/shop", permanent: true },
      { source: "/login", destination: "/shop", permanent: true },
      { source: "/register", destination: "/shop", permanent: true },
      { source: "/forgot-password", destination: "/shop", permanent: true },
      { source: "/reset-password", destination: "/shop", permanent: true },
      { source: "/account", destination: "/shop", permanent: true },
      {
        source: "/account/:path*",
        destination: "/shop",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
