import { Badge } from '@/components/ui/badge';
import { facilityFieldGroups } from '@/lib/facilityFields';
import type { SoberLivingHome } from '@/data/listings';

interface FacilityDetailsProps {
  listing: SoberLivingHome;
}

const FacilityDetails = ({ listing }: FacilityDetailsProps) => {
  // Filter to only groups that have at least one "true" field
  const activeGroups = facilityFieldGroups
    .map((group) => ({
      ...group,
      activeFields: group.fields.filter((field) => listing[field.key] === true),
    }))
    .filter((group) => group.activeFields.length > 0);

  if (activeGroups.length === 0) return null;

  return (
    <div className="space-y-6">
      {activeGroups.map((group) => (
        <div key={group.section}>
          <h3 className="mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            {group.section}
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {group.activeFields.map((field) => (
              <Badge key={field.key} variant="secondary" className="text-xs">
                {field.label}
              </Badge>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default FacilityDetails;
