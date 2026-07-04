import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { transliterateArmenian } from './transliterate.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const locationsPath = path.join(__dirname, '../data/locations.json');
const rawData = fs.readFileSync(locationsPath, 'utf8');
const locationsData = JSON.parse(rawData);

const validCityNames = new Set<string>();

const addCity = (name: string) => {
  if (!name) return;
  validCityNames.add(name.toLowerCase());
  validCityNames.add(transliterateArmenian(name, 'en').toLowerCase());
  validCityNames.add(transliterateArmenian(name, 'ru').toLowerCase());
};

for (const region of locationsData) {
  if (region.type === 'capital') {
    addCity(region.name);
    if (region.districts) {
      for (const d of region.districts) {
        addCity(`${d} (${region.name})`);
      }
    }
  } else {
    if (region.cities) {
      for (const c of region.cities) {
        addCity(c);
      }
    }
    if (region.villages) {
      for (const v of region.villages) {
        addCity(v);
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
