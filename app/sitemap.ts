import type { MetadataRoute } from "next";
import { connectToDatabase } from "@/lib/db/mongoose";
import { Category } from "@/models/Category";
import { Product } from "@/models/Product";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Without this the sitemap is prerendered once at build time, so products and
// collections added in the admin afterwards would never be listed.
export const revalidate = 3600;

const STATIC_ROUTES: {
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
}[] = [
  { path: "", priority: 1, changeFrequency: "daily" },
  { path: "/shop", priority: 0.9, changeFrequency: "daily" },
  { path: "/customize-your-cake", priority: 0.9, changeFrequency: "weekly" },
  { path: "/our-story", priority: 0.6, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.6, changeFrequency: "monthly" },
  { path: "/policies/privacy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/policies/terms", priority: 0.3, changeFrequency: "yearly" },
  { path: "/policies/shipping", priority: 0.3, changeFrequency: "yearly" },
  { path: "/policies/cancellation", priority: 0.3, changeFrequency: "yearly" },
  { path: "/policies/refund", priority: 0.3, changeFrequency: "yearly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${APP_URL}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  // A database hiccup must not break the build or serve a broken sitemap —
  // the static routes still ship.
  try {
    await connectToDatabase();
    const [categories, products] = await Promise.all([
      Category.find({ active: true }).select("slug updatedAt").lean(),
      Product.find({ status: "active" })
        .select("slug updatedAt")
        .limit(5000)
        .lean(),
    ]);

    for (const category of categories) {
      entries.push({
        url: `${APP_URL}/shop/${category.slug}`,
        lastModified: category.updatedAt ?? now,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }

    for (const product of products) {
      entries.push({
        url: `${APP_URL}/product/${product.slug}`,
        lastModified: product.updatedAt ?? now,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  } catch (error) {
    console.error(
      "[sitemap] catalogue unavailable, serving static routes",
      error,
    );
  }

  return entries;
}
