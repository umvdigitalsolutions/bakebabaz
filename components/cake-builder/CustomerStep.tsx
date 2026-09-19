"use client";

import { Input } from "@/components/ui/Field";
import { BuilderSection, FieldGrid, FullWidth } from "./BuilderSection";
import type { BuilderErrors, BuilderState } from "./types";

export function CustomerStep({
  state,
  errors,
  update,
}: {
  state: BuilderState;
  errors: BuilderErrors;
  update: (patch: Partial<BuilderState>) => void;
}) {
  return (
    <BuilderSection
      step={1}
      first
      id="step-about-you"
      title="About you"
      description="So we know who to reach when your cake is ready."
    >
      <FieldGrid>
        <Input
          label="Your name"
          required
          autoComplete="name"
          placeholder="Aarav Sharma"
          value={state.name}
          error={errors.name}
          onChange={(event) => update({ name: event.target.value })}
        />
        <Input
          label="Phone / WhatsApp"
          required
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="98765 43210"
          value={state.phone}
          error={errors.phone}
          onChange={(event) => update({ phone: event.target.value })}
        />
        <FullWidth>
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            hint="Optional, but it's where your order confirmation goes."
            value={state.email}
            error={errors.email}
            onChange={(event) => update({ email: event.target.value })}
          />
        </FullWidth>
      </FieldGrid>
    </BuilderSection>
  );
}
