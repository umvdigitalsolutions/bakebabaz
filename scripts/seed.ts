import { config } from "dotenv";
config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });

import mongoose from "mongoose";
import { connectToDatabase } from "../lib/db/mongoose";
import { hashPassword } from "../lib/auth/password";
import { AddOn } from "../models/AddOn";
import { Admin } from "../models/Admin";
import { Category } from "../models/Category";
import { Coupon } from "../models/Coupon";
import { CustomizationOption } from "../models/CustomizationOption";
import { DeliverySlot } from "../models/DeliverySlot";
import { DeliveryZone } from "../models/DeliveryZone";
import { PricingRule } from "../models/PricingRule";
import { Product } from "../models/Product";
import { StoreSettings } from "../models/StoreSettings";
import {
  IMG,
  addOns,
  categories,
  coupons,
  customizationOptions,
  deliverySlots,
  deliveryZones,
  faqs,
  pricingRules,
  products,
} from "./seed-data";

const RESET = process.argv.includes("--reset");

function readPath(source: unknown, path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>(
      (value, key) =>
        value && typeof value === "object"
          ? (value as Record<string, unknown>)[key]
          : undefined,
      source,
    );
}

function isBlank(value: unknown) {
  if (value == null) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

async function main() {
  await connectToDatabase();
  console.log("→ connected to MongoDB");

  if (RESET) {
    console.log("→ --reset: clearing catalogue collections");
    await Promise.all([
      Category.deleteMany({}),
      Product.deleteMany({}),
      CustomizationOption.deleteMany({}),
      AddOn.deleteMany({}),
      PricingRule.deleteMany({}),
      DeliverySlot.deleteMany({}),
      DeliveryZone.deleteMany({}),
      Coupon.deleteMany({}),
    ]);
  }

  // ---- Categories -------------------------------------------------------
  const categoryIds = new Map<string, mongoose.Types.ObjectId>();
  for (const category of categories) {
    const doc = await Category.findOneAndUpdate(
      { slug: category.slug },
      {
        $set: {
          name: category.name,
          description: category.description,
          icon: category.icon,
          image: { url: category.image, alt: category.name },
          active: true,
          featured: category.featured,
          sortOrder: category.sortOrder,
          prepTimeHours: category.prepTimeHours,
          seo: {
            title: `${category.name} in Bikaner — Bake Baba'z`,
            description: category.description,
          },
        },
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    );
    categoryIds.set(category.slug, doc._id);
  }
  console.log(`→ ${categories.length} categories`);

  // ---- Add-ons ----------------------------------------------------------
  const addOnIds: mongoose.Types.ObjectId[] = [];
  for (const addOn of addOns) {
    const doc = await AddOn.findOneAndUpdate(
      { name: addOn.name },
      { $set: { ...addOn, active: true } },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    );
    addOnIds.push(doc._id);
  }
  console.log(`→ ${addOns.length} add-ons`);

  // ---- Products ---------------------------------------------------------
  for (const product of products) {
    const categoryId = categoryIds.get(product.categorySlug);
    if (!categoryId) {
      console.warn(`  ! skipping ${product.slug}: unknown category`);
      continue;
    }

    await Product.findOneAndUpdate(
      { slug: product.slug },
      {
        $set: {
          name: product.name,
          category: categoryId,
          shortDescription: product.shortDescription,
          description: product.description,
          images: product.images.map((url) => ({
            url,
            alt: product.name,
          })),
          basePrice: product.base,
          weights: product.weights,
          flavours: product.flavours ?? [],
          fillings: product.fillings ?? [],
          shapes: product.shapes ?? [],
          eggOptions: product.eggOptions ?? ["eggless", "with-egg"],
          addOns: addOnIds,
          tags: product.tags ?? [],
          occasions: product.occasions ?? [],
          stock: product.stock ?? 0,
          unlimitedStock: product.unlimitedStock ?? true,
          customisable: product.customisable ?? true,
          allowMessage: product.customisable ?? true,
          featured: product.featured ?? false,
          bestseller: product.bestseller ?? false,
          isVegetarian: true,
          ingredients: product.ingredients,
          allergens: product.allergens,
          storageInstructions: product.storageInstructions,
          deliveryInfo:
            "Delivered chilled across Bikaner in your chosen slot. Store pickup is available from our counter.",
          prepTimeHours: product.prepTimeHours,
          status: "active",
          seo: {
            title: `${product.name} — order online in Bikaner`,
            description: product.shortDescription,
          },
        },
        // Ratings only ever come from approved reviews, and re-running the seed
        // must not overwrite real ratings or sales the store has since earned.
        $setOnInsert: {
          rating: { average: 0, count: 0 },
          salesCount: product.salesCount ?? 0,
        },
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    );
  }
  console.log(`→ ${products.length} products`);

  // ---- Customization options (the cake builder's vocabulary) -------------
  for (const option of customizationOptions) {
    await CustomizationOption.findOneAndUpdate(
      { type: option.type, value: option.value },
      {
        $set: {
          label: option.label,
          description: "description" in option ? option.description : undefined,
          modifierKind: option.modifierKind,
          modifierAmount: option.modifierAmount,
          numericValue:
            "numericValue" in option ? option.numericValue : undefined,
          extraPrepHours:
            "extraPrepHours" in option ? option.extraPrepHours : 0,
          badge: "badge" in option ? option.badge : undefined,
          active: true,
          sortOrder: option.sortOrder,
        },
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    );
  }
  console.log(`→ ${customizationOptions.length} customization options`);

  // ---- Pricing rules ----------------------------------------------------
  for (const rule of pricingRules) {
    await PricingRule.findOneAndUpdate(
      { code: rule.code },
      { $set: { ...rule, active: true } },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    );
  }
  console.log(`→ ${pricingRules.length} pricing rules`);

  // ---- Delivery ---------------------------------------------------------
  for (const slot of deliverySlots) {
    await DeliverySlot.findOneAndUpdate(
      { label: slot.label },
      { $set: { ...slot, active: true } },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    );
  }
  for (const zone of deliveryZones) {
    await DeliveryZone.findOneAndUpdate(
      { pincode: zone.pincode },
      { $set: { ...zone, active: true } },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    );
  }
  console.log(
    `→ ${deliverySlots.length} delivery slots, ${deliveryZones.length} zones`,
  );

  // ---- Coupons ----------------------------------------------------------
  for (const coupon of coupons) {
    await Coupon.findOneAndUpdate(
      { code: coupon.code },
      {
        $set: {
          ...coupon,
          active: true,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 180),
        },
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    );
  }
  console.log(`→ ${coupons.length} coupons`);

  // ---- Store settings (homepage CMS content) ----------------------------
  const featuredProducts = await Product.find({ featured: true })
    .select("_id")
    .limit(8)
    .lean();
  const featuredCategories = await Category.find({ featured: true })
    .select("_id")
    .lean();

  // Settings are filled in only where they're still blank, so re-running the
  // seed never overwrites policies, FAQs or homepage picks the owner has
  // since edited in the admin panel.
  const seedSettings: Record<string, unknown> = {
    "hero.images": [
      {
        url: IMG.aiHero,
        alt: "AI-generated illustration of a dessert table with chocolate cake, cupcakes and bonbons",
      },
    ],
    "homepage.featuredProducts": featuredProducts.map((p) => p._id),
    "homepage.featuredCategories": featuredCategories.map((c) => c._id),
    "homepage.gallery": [
      {
        image: {
          url: IMG.chocolateTruffleCake,
          alt: "Chocolate truffle cake",
        },
        caption: "Chocolate truffle cakes",
        link: "/product/belgian-chocolate-truffle-cake",
      },
      {
        image: { url: IMG.cheesecakeWhole, alt: "Creamy cheesecake" },
        caption: "Creamy cheesecakes",
        link: "/shop/cheesecakes",
      },
      {
        image: { url: IMG.chocolate, alt: "Flavoured chocolates" },
        caption: "Flavoured chocolates",
        link: "/shop/chocolates",
      },
      {
        image: { url: IMG.jalapenoSnacks, alt: "Jalapeno snack tub" },
        caption: "Savoury snack tubs",
        link: "/product/just-jalapenos-snack-tub",
      },
    ],
    "customCake.heroImage": {
      url: IMG.aiHero,
      alt: "AI-generated illustration of a dessert table with chocolate cake, cupcakes and bonbons",
    },
    "seo.ogImage": { url: IMG.ogImage, alt: "Bake Baba'z" },
    faqs: faqs.map((faq, index) => ({
      ...faq,
      sortOrder: index,
      active: true,
    })),
    "policies.privacy":
      "We collect only what we need to bake and deliver your order — your name, contact details, delivery address and order history. We never sell your data. Payment details are handled entirely by Razorpay and never touch our servers.",
    "policies.terms":
      "Placing an order confirms you accept these terms. Prices are calculated on our servers at checkout and are the amount you will be charged. We reserve the right to contact you if a design cannot be delivered as configured.",
    "policies.shipping":
      "We deliver across Bikaner in the slot you choose. Delivery charges vary by PIN code and are shown before payment. Someone must be available to receive the order — cakes cannot be left unattended.",
    "policies.cancellation":
      "Orders can be cancelled free of charge until we begin preparation. Once baking has started, cancellations are assessed case by case. Message us on WhatsApp with your order number as early as possible.",
    "policies.refund":
      "If something is wrong with your order, tell us within 24 hours with photographs and we will replace it or refund you. Approved refunds are returned to the original payment method within 5–7 working days.",
  };
  const currentSettings = await StoreSettings.findOne({ key: "store" }).lean();
  const blankSettings = Object.fromEntries(
    Object.entries(seedSettings).filter(([path]) =>
      isBlank(readPath(currentSettings, path)),
    ),
  );

  if (Object.keys(blankSettings).length > 0) {
    await StoreSettings.findOneAndUpdate(
      { key: "store" },
      { $set: blankSettings },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    );
  }
  console.log(
    `→ store settings (${Object.keys(blankSettings).length} blank fields filled)`,
  );

  // ---- Bootstrap admin --------------------------------------------------
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    const existing = await Admin.findOne({ email: adminEmail.toLowerCase() });
    if (!existing) {
      await Admin.create({
        name: process.env.ADMIN_NAME || "Bake Baba'z Owner",
        email: adminEmail.toLowerCase(),
        passwordHash: await hashPassword(adminPassword),
        role: "owner",
        active: true,
      });
      console.log(`→ admin account created for ${adminEmail}`);
    } else {
      console.log(`→ admin ${adminEmail} already exists (unchanged)`);
    }
  } else {
    console.log(
      "→ no ADMIN_EMAIL/ADMIN_PASSWORD in env — run `npm run create-admin` to add a staff login",
    );
  }

  console.log("\n✓ Seed complete.\n");
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error("\n✗ Seed failed:\n", error);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
