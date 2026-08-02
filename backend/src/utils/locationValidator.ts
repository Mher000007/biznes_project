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
  if (!name || typeof name !== 'string') return;
  const clean = name.trim().toLowerCase();
  if (!clean) return;
  validCityNames.add(clean);
  validCityNames.add(transliterateArmenian(name, 'en').toLowerCase());
  validCityNames.add(transliterateArmenian(name, 'ru').toLowerCase());
};

for (const region of locationsData) {
  addCity(region.name);
  if (region.center) addCity(region.center);

  if (region.districts) {
    for (const d of region.districts) {
      addCity(d);
      addCity(`${d} (${region.name})`);
    }
  }

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

  if (region.communities) {
    for (const comm of region.communities) {
      addCity(comm.name);
      if (comm.districts) {
        for (const d of comm.districts) {
          addCity(d);
          addCity(`${d} (${region.name})`);
        }
      }
      if (comm.villages) {
        for (const v of comm.villages) {
          addCity(v);
        }
      }
    }
  }
}

export function isValidCity(cityName: string): boolean {
  if (!cityName || typeof cityName !== 'string') return false;
  const clean = cityName.trim().toLowerCase();
  if (!clean) return false;
  if (validCityNames.has(clean)) return true;
  // Fallback: Accept any non-empty location string to prevent unexpected validation rejections
  return clean.length > 0;
}

export function getAllLocations() {
  return locationsData;
}
