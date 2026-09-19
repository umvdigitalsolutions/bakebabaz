"use client";

import { Checkbox, Textarea } from "@/components/ui/Field";
import { BuilderSection } from "./BuilderSection";
import { ReferenceUploader } from "./ReferenceUploader";
import type { BuilderErrors, BuilderState } from "./types";

export function InspirationStep({
  state,
  errors,
  update,
  maxImages,
  maxSizeMb,
  brandName,
}: {
  state: BuilderState;
  errors: BuilderErrors;
  update: (patch: Partial<BuilderState>) => void;
  maxImages: number;
  maxSizeMb: number;
  brandName: string;
}) {
  return (
    <BuilderSection
      step={4}
      id="step-inspiration"
      title="Inspiration and details"
      description="A reference image is the fastest way to get exactly what you're picturing."
    >
      <div className="space-y-7">
        <div>
          <p className="field-label">Reference images</p>
          <ReferenceUploader
            images={state.referenceImages}
            onChange={(images) => update({ referenceImages: images })}
            maxImages={maxImages}
            maxSizeMb={maxSizeMb}
          />
        </div>

        <Textarea
          label="Additional instructions"
          rows={4}
          maxLength={2000}
          placeholder="Allergies, the exact spelling of a name, how the cake will be photographed, anything else we should know…"
          value={state.notes}
          onChange={(event) => update({ notes: event.target.value })}
        />

        <Checkbox
          checked={state.consent}
          onChange={(event) => update({ consent: event.target.checked })}
          error={errors.consent}
          label={
            <>
              I agree that {brandName} may use these details to prepare and
              deliver my cake order. <span className="text-coral">*</span>
            </>
          }
        />
      </div>
    </BuilderSection>
  );
}
