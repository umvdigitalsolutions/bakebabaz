import "server-only";
import { cache } from "react";
import { connectToDatabase, serialize } from "@/lib/db/mongoose";
import { StoreSettings, type IStoreSettings } from "@/models/StoreSettings";

export type StoreSettingsData = Omit<
  IStoreSettings,
  "_id" | "createdAt" | "updatedAt" | "homepage"
> & {
  homepage: Omit<
    IStoreSettings["homepage"],
    "featuredCategories" | "featuredProducts"
  > & {
    featuredCategories: string[];
    featuredProducts: string[];
  };
};

const legacyImageDefaults = {
  orderBanner: {
    url: "/products/chocolate-truffle-cake.jpg",
    alt: "Chocolate truffle cake from Bake Baba'z",
    width: 1600,
    height: 1066,
  },
  story: {
    heroImage: {
      url: "/brand/founder/mishika-daawra-hero.jpeg",
      alt: "Mishika Daawra, Founder of Bake Baba'z",
    },
    bakeryImage: {
      url: "/brand/founder/mishika-dawra-founder-cake.jpeg",
      alt: "Mishika Daawra holding a celebration cake in the bakery",
    },
    celebrationImage: {
      url: "/brand/founder/mishika-dawra-custom-cakes.jpeg",
      alt: "Mishika Daawra with custom cakes for a celebration",
    },
    kitchenImage: {
      url: "/brand/founder/mishika-dawra-kitchen.jpeg",
      alt: "Mishika Daawra presenting freshly prepared food",
    },
  },
} satisfies Pick<StoreSettingsData, "story"> & {
  orderBanner: NonNullable<StoreSettingsData["homepage"]["orderBannerImage"]>;
};

/**
 * Mongoose does not backfill newly introduced nested defaults into an existing
 * settings document. Fill only undefined fields at read time: an explicit null
 * still means the owner intentionally removed that image.
 */
function withLegacyImageDefaults(data: StoreSettingsData): StoreSettingsData {
  if (data.homepage.orderBannerImage === undefined) {
    data.homepage.orderBannerImage = legacyImageDefaults.orderBanner;
  }

  if (!data.story) {
    data.story = { ...legacyImageDefaults.story };
  } else {
    for (const key of Object.keys(
      legacyImageDefaults.story,
    ) as (keyof StoreSettingsData["story"])[]) {
      if (data.story[key] === undefined) {
        data.story[key] = legacyImageDefaults.story[key];
      }
    }
  }

  return data;
}

/**
 * Reads the CMS singleton, creating it with schema defaults on first run so a
 * fresh database still renders a complete storefront.
 *
 * The find-or-create is a single atomic upsert on purpose. A read followed by a
 * create races: one request can render the layout and price the cart at the
 * same time, and on an empty database both paths would find nothing and both
 * would insert, leaving two "singletons" behind.
 *
 * Wrapped in React's `cache` so the many callers in one render — layout, page,
 * pricing catalog — share a single query per request.
 */
export const getStoreSettings = cache(async (): Promise<StoreSettingsData> => {
  await connectToDatabase();
  const doc = await StoreSettings.findOneAndUpdate(
    { key: "store" },
    { $setOnInsert: { key: "store" } },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  ).lean();
  return withLegacyImageDefaults(
    serialize(doc) as unknown as StoreSettingsData,
  );
});

export async function updateStoreSettings(patch: Record<string, unknown>) {
  await connectToDatabase();
  const doc = await StoreSettings.findOneAndUpdate(
    { key: "store" },
    { $set: patch },
    { returnDocument: "after", upsert: true, runValidators: true },
  ).lean();
  return withLegacyImageDefaults(
    serialize(doc) as unknown as StoreSettingsData,
  );
}
