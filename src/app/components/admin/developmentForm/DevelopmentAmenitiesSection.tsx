import type { Development } from "../../../data/developments";
import { PropertyAmenitiesEditor } from "../propertyForm/PropertyAmenitiesEditor";

type Props = {
  draft: Development;
  onDraftChange: (patch: Partial<Development>) => void;
};

export function DevelopmentAmenitiesSection({ draft, onDraftChange }: Props) {
  return (
    <PropertyAmenitiesEditor
      amenities={draft.amenities ?? []}
      services={draft.services ?? []}
      additionalFeatures={draft.additionalFeatures ?? []}
      onAmenitiesChange={(amenities) => onDraftChange({ amenities })}
      onServicesChange={(services) => onDraftChange({ services })}
      onAdditionalChange={(additionalFeatures) => onDraftChange({ additionalFeatures })}
    />
  );
}
