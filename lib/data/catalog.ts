import "server-only";
import type { QueryFilter, SortOrder } from "mongoose";
import { connectToDatabase, serialize } from "@/lib/db/mongoose";
import { Category } from "@/models/Category";
import { Product, type IProduct } from "@/models/Product";
import { Review } from "@/models/Review";
import { AddOn } from "@/models/AddOn";
import { startingPrice, compareAtPrice } from "@/lib/pricing/product";

export type ProductCardData = {
  id: string;
  name: string;
  slug: string;
  image?: { url: string; alt?: string };
  hoverImage?: { url: string; alt?: string };
  categoryName?: string;
  categorySlug?: string;
  price: number;
  compareAt?: number;
  rating: number;
  ratingCount: number;
  isEggless: boolean;
  customisable: boolean;
  bestseller: boolean;
  featured: boolean;
  outOfStock: boolean;
};

export type CategoryData = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: { url: string; alt?: string };
  icon?: string;
  productCount?: number;
};

export type ShopFilters = {
  categorySlug?: string;
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  eggless?: boolean;
  vegetarian?: boolean;
  flavour?: string;
  occasion?: string;
  weight?: string;
  inStock?: boolean;
  sort?: string;
  page?: number;
  perPage?: number;
};

function toCard(
  product: IProduct & { category?: { name?: string; slug?: string } },
): ProductCardData {
  return {
    id: String(product._id),
    name: product.name,
    slug: product.slug,
    image: product.images?.[0]
      ? { url: product.images[0].url, alt: product.images[0].alt }
      : undefined,
    hoverImage: product.images?.[1]
      ? { url: product.images[1].url, alt: product.images[1].alt }
      : undefined,
    categoryName: product.category?.name,
    categorySlug: product.category?.slug,
    price: startingPrice(product),
    compareAt: compareAtPrice(product),
    rating: product.rating?.average ?? 0,
    ratingCount: product.rating?.count ?? 0,
    isEggless: product.eggOptions?.includes("eggless") ?? false,
    customisable: product.customisable,
    bestseller: product.bestseller,
    featured: product.featured,
    outOfStock: !product.unlimitedStock && product.stock <= 0,
  };
}

export async function getCategories(options?: {
  featuredOnly?: boolean;
  withCounts?: boolean;
}): Promise<CategoryData[]> {
  await connectToDatabase();
  const filter: Record<string, unknown> = { active: true };
  if (options?.featuredOnly) filter.featured = true;

  const categories = await Category.find(filter)
    .sort({ sortOrder: 1, name: 1 })
    .lean();

  let counts = new Map<string, number>();
  if (options?.withCounts) {
    const grouped = await Product.aggregate<{ _id: unknown; count: number }>([
      { $match: { status: "active" } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);
    counts = new Map(grouped.map((row) => [String(row._id), row.count]));
  }

  return categories.map((category) => ({
    id: String(category._id),
    name: category.name,
    slug: category.slug,
    description: category.description,
    image: category.image?.url
      ? { url: category.image.url, alt: category.image.alt }
      : undefined,
    icon: category.icon,
    productCount: counts.get(String(category._id)) ?? undefined,
  }));
}

export async function getCategoryBySlug(slug: string) {
  await connectToDatabase();
  const category = await Category.findOne({ slug, active: true }).lean();
  return category ? serialize(category) : null;
}

const SORTS: Record<string, Record<string, SortOrder>> = {
  featured: { featured: -1, sortOrder: 1, createdAt: -1 },
  bestselling: { bestseller: -1, salesCount: -1, createdAt: -1 },
  newest: { createdAt: -1 },
  "price-asc": { basePrice: 1 },
  "price-desc": { basePrice: -1 },
  rating: { "rating.average": -1, "rating.count": -1 },
};

export async function getProducts(filters: ShopFilters = {}) {
  await connectToDatabase();

  const perPage = Math.min(Math.max(filters.perPage ?? 12, 1), 48);
  const page = Math.max(filters.page ?? 1, 1);

  // Built loosely, then handed to Mongoose as a typed filter — the shape is
  // assembled from many optional branches, which a strict type fights.
  const query: Record<string, unknown> = { status: "active" };

  if (filters.categorySlug) {
    const category = await Category.findOne({
      slug: filters.categorySlug,
      active: true,
    })
      .select("_id")
      .lean();
    if (!category) return { products: [], total: 0, page, perPage, pages: 0 };
    query.category = category._id;
  }

  if (filters.q) {
    const safe = filters.q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").slice(0, 60);
    const pattern = new RegExp(safe, "i");
    query.$or = [
      { name: pattern },
      { shortDescription: pattern },
      { tags: pattern },
      { occasions: pattern },
      { "flavours.name": pattern },
    ];
  }

  if (filters.minPrice != null || filters.maxPrice != null) {
    const range: Record<string, number> = {};
    if (filters.minPrice != null) range.$gte = filters.minPrice;
    if (filters.maxPrice != null) range.$lte = filters.maxPrice;
    query.basePrice = range;
  }

  if (filters.eggless) query.eggOptions = "eggless";
  if (filters.vegetarian) query.isVegetarian = true;
  if (filters.flavour) query["flavours.name"] = filters.flavour;
  if (filters.occasion) query.occasions = filters.occasion;
  if (filters.weight) query["weights.label"] = filters.weight;
  if (filters.inStock) {
    query.$and = [{ $or: [{ unlimitedStock: true }, { stock: { $gt: 0 } }] }];
  }

  const sort = SORTS[filters.sort ?? "featured"] ?? SORTS.featured;

  const filter = query as QueryFilter<IProduct>;

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate<{ category: { name: string; slug: string } }>(
        "category",
        "name slug",
      )
      .sort(sort)
      .skip((page - 1) * perPage)
      .limit(perPage)
      .lean(),
    Product.countDocuments(filter),
  ]);

  return {
    products: products.map((product) => toCard(product as never)),
    total,
    page,
    perPage,
    pages: Math.ceil(total / perPage),
  };
}

const isWeightLabel = (label: string) => /^\d+(\.\d+)?\s*k?g\b/i.test(label);

/** Distinct filter values, so the shop sidebar only offers real options. */
export async function getShopFacets(categorySlug?: string) {
  await connectToDatabase();
  const match: Record<string, unknown> = { status: "active" };
  if (categorySlug) {
    const category = await Category.findOne({ slug: categorySlug })
      .select("_id")
      .lean();
    if (category) match.category = category._id;
  }

  const [flavours, occasions, weights, priceRange] = await Promise.all([
    Product.distinct("flavours.name", match as QueryFilter<IProduct>),
    Product.distinct("occasions", match as QueryFilter<IProduct>),
    // Ordered by actual weight, so "500 g" comes before "1 kg" rather than
    // after "5 kg" as a plain string sort would put it. Piece counts such as
    // "Box of 4" follow the true weights (see below).
    Product.aggregate<{ _id: string; grams: number }>([
      { $match: match },
      { $unwind: "$weights" },
      { $group: { _id: "$weights.label", grams: { $min: "$weights.grams" } } },
      { $sort: { grams: 1, _id: 1 } },
    ]),
    Product.aggregate<{ min: number; max: number }>([
      { $match: match },
      {
        $group: {
          _id: null,
          min: { $min: "$basePrice" },
          max: { $max: "$basePrice" },
        },
      },
    ]),
  ]);

  return {
    flavours: (flavours as string[]).filter(Boolean).sort(),
    occasions: (occasions as string[]).filter(Boolean).sort(),
    weights: weights
      .filter((weight) => weight._id)
      .sort(
        (a, b) => Number(isWeightLabel(b._id)) - Number(isWeightLabel(a._id)),
      )
      .map((weight) => weight._id),
    minPrice: Math.floor(priceRange[0]?.min ?? 0),
    maxPrice: Math.ceil(priceRange[0]?.max ?? 5000),
  };
}

export async function getProductBySlug(slug: string) {
  await connectToDatabase();
  const product = await Product.findOne({
    slug,
    status: { $in: ["active", "draft"] },
  })
    .populate<{
      category: { name: string; slug: string; prepTimeHours: number };
    }>("category", "name slug prepTimeHours")
    .populate("addOns")
    .lean();

  return product ? serialize(product) : null;
}

export async function getRelatedProducts(
  categoryId: string,
  excludeId: string,
  limit = 4,
) {
  await connectToDatabase();
  const products = await Product.find({
    status: "active",
    category: categoryId,
    _id: { $ne: excludeId },
  })
    .populate<{ category: { name: string; slug: string } }>(
      "category",
      "name slug",
    )
    .sort({ bestseller: -1, salesCount: -1 })
    .limit(limit)
    .lean();

  return products.map((product) => toCard(product as never));
}

export async function getFeaturedProducts(limit = 8, ids?: string[]) {
  await connectToDatabase();
  const query: Record<string, unknown> = { status: "active" };
  if (ids?.length) {
    query._id = { $in: ids };
  } else {
    query.featured = true;
  }

  const products = await Product.find(query as QueryFilter<IProduct>)
    .populate<{ category: { name: string; slug: string } }>(
      "category",
      "name slug",
    )
    .sort({ sortOrder: 1, createdAt: -1 })
    .limit(limit)
    .lean();

  return products.map((product) => toCard(product as never));
}

export async function getBestsellers(limit = 8) {
  await connectToDatabase();
  const products = await Product.find({ status: "active", bestseller: true })
    .populate<{ category: { name: string; slug: string } }>(
      "category",
      "name slug",
    )
    .sort({ salesCount: -1, "rating.average": -1 })
    .limit(limit)
    .lean();
  return products.map((product) => toCard(product as never));
}

export async function getProductReviews(productId: string, limit = 8) {
  await connectToDatabase();
  const reviews = await Review.find({ product: productId, approved: true })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  return serialize(reviews);
}

export async function getActiveAddOns() {
  await connectToDatabase();
  const addOns = await AddOn.find({ active: true })
    .sort({ sortOrder: 1 })
    .lean();
  return serialize(addOns);
}
