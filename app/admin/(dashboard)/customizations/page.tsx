import type { Metadata } from "next";
import Link from "next/link";
import { connectToDatabase, serialize } from "@/lib/db/mongoose";
import { CustomizationOption } from "@/models/CustomizationOption";
import { PricingRule } from "@/models/PricingRule";
import { AdminCard, AdminPage } from "@/components/admin/AdminShell";
import {
  CustomizationOptionsManager,
  PricingRulesManager,
} from "@/components/admin/resources/CustomizationsManager";

export const metadata: Metadata = { title: "Cake options" };

export default async function AdminCustomizationsPage() {
  await connectToDatabase();
  const [options, rules] = await Promise.all([
    CustomizationOption.find().sort({ type: 1, sortOrder: 1 }).lean(),
    PricingRule.find().sort({ sortOrder: 1 }).lean(),
  ]);

  return (
    <AdminPage
      title="Cake options & pricing"
      description="Everything the custom cake builder offers, and what each choice costs."
    >
      <AdminCard title="How pricing works" className="mb-4">
        <p className="text-[13.5px] leading-relaxed text-[#475569]">
          A custom cake starts at the base rate per kilogram set in{" "}
          <Link
            href="/admin/settings"
            className="font-semibold text-[#16324f] underline underline-offset-4"
          >
            Settings
          </Link>
          . Every option below adds to that total, and the pricing rules handle
          the cross-cutting charges — rush orders, extra tiers and so on. The
          storefront shows this breakdown live, and the server recalculates it
          from these same values before taking any payment.
        </p>
      </AdminCard>

      <CustomizationOptionsManager initial={serialize(options) as never} />

      <div className="mt-6">
        <h2 className="mb-3 text-[15px] font-semibold">Pricing rules</h2>
        <PricingRulesManager initial={serialize(rules) as never} />
      </div>
    </AdminPage>
  );
}
