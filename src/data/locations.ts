import locationsData from './locations.json';

export type LocationType = 'capital' | 'marz';

export interface CommunityNode {
  name: string;
  districts?: string[]; // For Yerevan
  villages?: string[]; // Represents all settlements (cities/villages) in the community
  _note?: string;
}

export interface LocationNode {
  name: string;
  type: LocationType;
  center?: string;
  communities: CommunityNode[];
}

export const ARMENIA_LOCATIONS: LocationNode[] = locationsData as LocationNode[];

// Generate a flat list of all unique location names for validation or simple dropdowns
export const FLAT_ARMENIAN_LOCATIONS: string[] = ARMENIA_LOCATIONS.reduce((acc: string[], marz) => {
  marz.communities?.forEach(community => {
    if (community.districts) {
      acc.push(...community.districts.map(d => `${d} (${marz.name})`));
    }
    if (community.villages) {
      acc.push(...community.villages);
    }
  });
  return acc;
}, []);
