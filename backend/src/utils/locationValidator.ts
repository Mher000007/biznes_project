import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const locationsPath = path.join(__dirname, '../data/locations.json');
const rawData = fs.readFileSync(locationsPath, 'utf8');
const locationsData = JSON.parse(rawData);

const validCityNames = new Set<string>();

for (const region of locationsData) {
  if (region.type === 'capital') {
    validCityNames.add(region.name.toLowerCase());
    if (region.districts) {
      for (const d of region.districts) {
        validCityNames.add(`${d} (${region.name})`.toLowerCase());
      }
    }
  } else {
    if (region.cities) {
      for (const c of region.cities) {
        validCityNames.add(c.toLowerCase());
      }
    }
    if (region.villages) {
      for (const v of region.villages) {
        validCityNames.add(v.toLowerCase());
      }
    }
  }
}

export function isValidCity(cityName: string): boolean {
  if (!cityName) return false;
  return validCityNames.has(cityName.toLowerCase().trim());
}

export function getAllLocations() {
  return locationsData;
}
