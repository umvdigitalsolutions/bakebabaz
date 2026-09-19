import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Private staff routes and transactional pages should not be indexed.
        disallow: [
          "/admin",
          "/admin/",
          "/cart",
          "/checkout",
          "/order-success/",
          "/custom-cake/",
          "/api/",
        ],
      },
    ],
    sitemap: `${appUrl}/sitemap.xml`,
    host: appUrl,
  };
}
