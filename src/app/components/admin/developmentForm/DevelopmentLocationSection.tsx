import type { Development } from "../../../data/developments";
import { PropertyLocationSection } from "../propertyForm/PropertyLocationSection";

type Props = {
  draft: Development;
  onDraftChange: (patch: Partial<Development>) => void;
};

export function DevelopmentLocationSection({ draft, onDraftChange }: Props) {
  const { lat, lng } = draft.coordinates;
  return (
    <PropertyLocationSection
      location={draft.location}
      colony={draft.colony}
      fullAddress={draft.fullAddress}
      lat={lat}
      lng={lng}
      onLocationChange={(location) => onDraftChange({ location })}
      onColonyChange={(colony) => onDraftChange({ colony })}
      onFullAddressChange={(fullAddress) => onDraftChange({ fullAddress })}
      onCoordsChange={(lat, lng) => onDraftChange({ coordinates: { lat, lng } })}
    />
  );
}
