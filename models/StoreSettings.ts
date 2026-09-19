import mongoose, { Schema, type Model } from "mongoose";
import { ImageSchema } from "./shared";
import type { ImageRef } from "@/types";

const BRAND_MEDIA = {
  instagram: "https://www.instagram.com/bake.baba/",
  ogImage: "/brand/bake-babaz-og.jpg",
  aiHero: "/brand/ai-bakery-hero.png",
  chocolateTruffleCake: "/products/chocolate-truffle-cake.jpg",
  cheesecake: "/products/cheesecake.jpg",
  assortedChocolate12Pc:
    "/products/assorted-homemade-flavored-chocolate-12pc.jpg",
  jalapenoSnacks: "/products/jalapeno-snacks.jpg",
} as const;

export interface IFaq {
  question: string;
  answer: string;
  sortOrder: number;
  active: boolean;
}

export interface IStoreSettings {
  _id: mongoose.Types.ObjectId;
  key: string;
  brand: {
    name: string;
    location: string;
    tagline: string;
    phone: string;
    whatsapp: string;
    email: string;
    instagram: string;
    instagramHandle: string;
    addressLines: string[];
    mapsUrl?: string;
  };
  announcement: { enabled: boolean; text: string; link?: string };
  hero: {
    eyebrow: string;
    headingLead: string;
    headingEmphasis: string;
    description: string;
    primaryCta: { label: string; href: string };
    secondaryCta: { label: string; href: string };
    ribbon: string;
    images: ImageRef[];
  };
  homepage: {
    marquee: string[];
    collectionsHeading: string;
    collectionsSubheading: string;
    featuredCategories: mongoose.Types.ObjectId[];
    featuredProducts: mongoose.Types.ObjectId[];
    galleryHeading: string;
    gallerySubheading: string;
    gallery: { image: ImageRef; caption: string; link?: string }[];
    orderBannerImage?: ImageRef | null;
    philosophyHeading: string;
    philosophyQuote: string;
    philosophyBody: string;
  };
  customCake: {
    /** `instant` prices and sells immediately; `approval` routes through a quote. */
    mode: "instant" | "approval";
    basePricePerKg: number;
    minWeightKg: number;
    maxWeightKg: number;
    maxReferenceImages: number;
    maxImageSizeMb: number;
    rushWindowHours: number;
    depositPercent: number;
    minLeadHours: number;
    heroEyebrow: string;
    heroHeading: string;
    heroDescription: string;
    heroImage?: ImageRef | null;
    checklist: string[];
  };
  story: {
    heroImage?: ImageRef | null;
    bakeryImage?: ImageRef | null;
    celebrationImage?: ImageRef | null;
    kitchenImage?: ImageRef | null;
  };
  payments: {
    manualEnabled: boolean;
    manualQrCode?: ImageRef;
    manualInstructions: string;
    razorpayEnabled: boolean;
    codEnabled: boolean;
    codMaxAmount: number;
    codMinAmount: number;
  };
  delivery: {
    defaultFee: number;
    freeDeliveryThreshold: number;
    pickupEnabled: boolean;
    sameDayEnabled: boolean;
    minLeadHours: number;
    maxDaysAhead: number;
    blockedDates: string[];
    storeAddress: string;
    pickupInstructions: string;
  };
  policies: {
    privacy: string;
    terms: string;
    shipping: string;
    cancellation: string;
    refund: string;
  };
  seo: { defaultTitle: string; defaultDescription: string; ogImage?: ImageRef };
  faqs: IFaq[];
  createdAt: Date;
  updatedAt: Date;
}

const FaqSchema = new Schema<IFaq>(
  {
    question: { type: String, required: true, trim: true },
    answer: { type: String, required: true, trim: true },
    sortOrder: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { _id: false },
);

const CtaSchema = new Schema({ label: String, href: String }, { _id: false });

/**
 * A single document (`key: "store"`) holding every piece of copy the owner can
 * edit without a developer. Read through `lib/data/settings.ts`, never directly.
 */
const StoreSettingsSchema = new Schema<IStoreSettings>(
  {
    key: { type: String, default: "store", unique: true },
    brand: {
      name: { type: String, default: "Bake Baba'z" },
      location: { type: String, default: "Bikaner" },
      tagline: { type: String, default: "B'coz every bite has a story." },
      phone: { type: String, default: "+91 85628 48811" },
      whatsapp: { type: String, default: "918562848811" },
      email: { type: String, default: "bakebabaz05@gmail.com" },
      instagram: { type: String, default: BRAND_MEDIA.instagram },
      instagramHandle: { type: String, default: "@bake.baba" },
      addressLines: {
        type: [String],
        default: ["Bikaner, Rajasthan 334001", "India"],
      },
      mapsUrl: String,
    },
    announcement: {
      enabled: { type: Boolean, default: true },
      text: {
        type: String,
        default: "Free delivery across Bikaner on orders above ₹1,500",
      },
      link: String,
    },
    hero: {
      eyebrow: { type: String, default: "Handcrafted in Bikaner" },
      headingLead: { type: String, default: "Every bite has" },
      headingEmphasis: { type: String, default: "a story." },
      description: {
        type: String,
        default:
          "Celebration cakes, bakery gifting and everyday treats—made fresh and personalised for the moments you'll remember.",
      },
      primaryCta: {
        type: CtaSchema,
        default: () => ({ label: "Order now", href: "/shop" }),
      },
      secondaryCta: {
        type: CtaSchema,
        default: () => ({
          label: "Design your own cake",
          href: "/customize-your-cake",
        }),
      },
      ribbon: {
        type: String,
        default: "Fresh bakes · Thoughtful gifting · Custom orders",
      },
      images: {
        type: [ImageSchema],
        default: () => [
          {
            url: BRAND_MEDIA.aiHero,
            alt: "AI-generated illustration of a dessert table with chocolate cake, cupcakes and bonbons",
            width: 1823,
            height: 863,
          },
        ],
      },
    },
    homepage: {
      marquee: {
        type: [String],
        default: [
          "Wedding Cakes",
          "Gift Hampers",
          "Cookies",
          "Personalised Orders",
          "Cheesecakes",
          "Fresh Breads",
        ],
      },
      collectionsHeading: { type: String, default: "Made for every moment" },
      collectionsSubheading: {
        type: String,
        default:
          "Four ways people order from Bake Baba'z — pick the one that fits your celebration.",
      },
      featuredCategories: [{ type: Schema.Types.ObjectId, ref: "Category" }],
      featuredProducts: [{ type: Schema.Types.ObjectId, ref: "Product" }],
      galleryHeading: { type: String, default: "Fresh from our kitchen" },
      gallerySubheading: { type: String, default: "See the craft up close." },
      gallery: {
        type: [
          new Schema(
            { image: ImageSchema, caption: String, link: String },
            { _id: false },
          ),
        ],
        default: () => [
          {
            image: {
              url: BRAND_MEDIA.chocolateTruffleCake,
              alt: "Chocolate truffle cake from Bake Baba'z",
              width: 1600,
              height: 1066,
            },
            caption: "Chocolate truffle cakes",
            link: "/product/belgian-chocolate-truffle-cake",
          },
          {
            image: {
              url: BRAND_MEDIA.cheesecake,
              alt: "Creamy cheesecake from Bake Baba'z",
              width: 1600,
              height: 1066,
            },
            caption: "Creamy cheesecakes",
            link: "/shop/cheesecakes",
          },
          {
            image: {
              url: BRAND_MEDIA.assortedChocolate12Pc,
              alt: "Flavoured chocolates from Bake Baba'z",
              width: 1600,
              height: 1066,
            },
            caption: "Flavoured chocolates",
            link: "/shop/chocolates",
          },
          {
            image: {
              url: BRAND_MEDIA.jalapenoSnacks,
              alt: "Jalapeno snack tub from Bake Baba'z",
              width: 1280,
              height: 853,
            },
            caption: "Savoury snack tubs",
            link: "/product/just-jalapenos-snack-tub",
          },
        ],
      },
      orderBannerImage: {
        type: ImageSchema,
        default: () => ({
          url: BRAND_MEDIA.chocolateTruffleCake,
          alt: "Chocolate truffle cake from Bake Baba'z",
          width: 1600,
          height: 1066,
        }),
      },
      philosophyHeading: { type: String, default: "Baked with intention" },
      philosophyQuote: {
        type: String,
        default:
          "Baking 'for you' is love—your own unforgettable little moment, made sweeter.",
      },
      philosophyBody: {
        type: String,
        default:
          "Small batches, real ingredients and a kitchen that treats every order like it is going to someone's favourite day.",
      },
    },
    story: {
      heroImage: {
        type: ImageSchema,
        default: () => ({
          url: "/brand/founder/mishika-daawra-hero.jpeg",
          alt: "Mishika Daawra, Founder of Bake Baba'z",
        }),
      },
      bakeryImage: {
        type: ImageSchema,
        default: () => ({
          url: "/brand/founder/mishika-dawra-founder-cake.jpeg",
          alt: "Mishika Daawra holding a celebration cake in the bakery",
        }),
      },
      celebrationImage: {
        type: ImageSchema,
        default: () => ({
          url: "/brand/founder/mishika-dawra-custom-cakes.jpeg",
          alt: "Mishika Daawra with custom cakes for a celebration",
        }),
      },
      kitchenImage: {
        type: ImageSchema,
        default: () => ({
          url: "/brand/founder/mishika-dawra-kitchen.jpeg",
          alt: "Mishika Daawra presenting freshly prepared food",
        }),
      },
    },
    customCake: {
      mode: { type: String, enum: ["instant", "approval"], default: "instant" },
      basePricePerKg: { type: Number, default: 700 },
      minWeightKg: { type: Number, default: 0.5 },
      maxWeightKg: { type: Number, default: 15 },
      maxReferenceImages: { type: Number, default: 5 },
      maxImageSizeMb: { type: Number, default: 5 },
      rushWindowHours: { type: Number, default: 24 },
      depositPercent: { type: Number, default: 100 },
      minLeadHours: { type: Number, default: 24 },
      heroEyebrow: { type: String, default: "Made especially for you" },
      heroHeading: { type: String, default: "Design your own cake." },
      heroDescription: {
        type: String,
        default:
          "Tell us about your celebration, flavours and creative ideas. Add a reference image, watch the price update as you build, and send it straight to your cart.",
      },
      heroImage: {
        type: ImageSchema,
        default: () => ({
          url: BRAND_MEDIA.aiHero,
          alt: "AI-generated illustration of a dessert table with chocolate cake, cupcakes and bonbons",
          width: 1823,
          height: 863,
        }),
      },
      checklist: {
        type: [String],
        default: [
          "Add flavours, colours and design details",
          "Upload reference images",
          "Choose weight and servings",
          "Select delivery date",
          "Receive live, updating pricing",
          "Add directly to cart",
        ],
      },
    },
    payments: {
      manualEnabled: { type: Boolean, default: true },
      manualQrCode: ImageSchema,
      manualInstructions: {
        type: String,
        default:
          "Scan the QR code and pay the exact amount. We will confirm your payment before preparing the order.",
      },
      razorpayEnabled: { type: Boolean, default: true },
      codEnabled: { type: Boolean, default: true },
      codMaxAmount: { type: Number, default: 5000 },
      codMinAmount: { type: Number, default: 0 },
    },
    delivery: {
      defaultFee: { type: Number, default: 60 },
      freeDeliveryThreshold: { type: Number, default: 1500 },
      pickupEnabled: { type: Boolean, default: true },
      sameDayEnabled: { type: Boolean, default: true },
      minLeadHours: { type: Number, default: 6 },
      maxDaysAhead: { type: Number, default: 90 },
      blockedDates: { type: [String], default: [] },
      storeAddress: {
        type: String,
        default: "Bake Baba'z, Bikaner, Rajasthan 334001",
      },
      pickupInstructions: {
        type: String,
        default:
          "Please carry your order number. Pickups are handled at the counter during your chosen slot.",
      },
    },
    policies: {
      privacy: { type: String, default: "" },
      terms: { type: String, default: "" },
      shipping: { type: String, default: "" },
      cancellation: { type: String, default: "" },
      refund: { type: String, default: "" },
    },
    seo: {
      defaultTitle: {
        type: String,
        default: "Bake Baba'z — Handcrafted cakes & bakes in Bikaner",
      },
      defaultDescription: {
        type: String,
        default:
          "Celebration cakes, custom designs, gift hampers and fresh everyday bakes, handcrafted in Bikaner and delivered to your door.",
      },
      ogImage: {
        type: ImageSchema,
        default: () => ({
          url: BRAND_MEDIA.ogImage,
          alt: "Bake Baba'z",
          width: 1200,
          height: 630,
        }),
      },
    },
    faqs: { type: [FaqSchema], default: [] },
  },
  { timestamps: true },
);

export const StoreSettings: Model<IStoreSettings> =
  (mongoose.models.StoreSettings as Model<IStoreSettings>) ||
  mongoose.model<IStoreSettings>("StoreSettings", StoreSettingsSchema);
