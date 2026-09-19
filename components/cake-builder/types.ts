import type { EggPreference, ImageRef } from "@/types";

export type BuilderState = {
  // 01 — About you
  name: string;
  phone: string;
  email: string;

  // 02 — Your celebration
  occasion: string;
  requiredDate: string;
  deliverySlot: string;
  servings: string;

  // 03 — Build your cake
  style: string;
  flavour: string;
  filling: string;
  shape: string;
  weightKg: number;
  eggPreference: EggPreference;
  tiers: number;
  colourTheme: string;
  message: string;
  addOns: string[];

  // 04 — Inspiration and details
  referenceImages: ImageRef[];
  notes: string;
  consent: boolean;

  quantity: number;
};

export type BuilderErrors = Partial<Record<keyof BuilderState, string>>;

export const initialBuilderState = (
  defaults?: Partial<BuilderState>,
): BuilderState => ({
  name: "",
  phone: "",
  email: "",
  occasion: "",
  requiredDate: "",
  deliverySlot: "",
  servings: "",
  style: "",
  flavour: "",
  filling: "",
  shape: "round",
  weightKg: 1,
  eggPreference: "eggless",
  tiers: 1,
  colourTheme: "",
  message: "",
  addOns: [],
  referenceImages: [],
  notes: "",
  consent: false,
  quantity: 1,
  ...defaults,
});
