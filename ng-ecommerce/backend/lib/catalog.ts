/** Same category codes as the Angular app (src/app/models/catalog.ts). */
const CATEGORY_CODES: Record<string, string> = {
  Engine: 'ENG',
  Brakes: 'BRK',
  'Suspension & Steering': 'SUS',
  'Electrical & Battery': 'ELE',
  Filters: 'FLT',
  Lighting: 'LGT',
  'Body & Exterior': 'BDY',
  'Transmission & Clutch': 'TRN',
  'Cooling & Heating': 'CLG',
  Exhaust: 'EXH',
  'Tyres & Wheels': 'TYR',
  'Oils & Fluids': 'OIL',
  'Interior & Accessories': 'ACC',
};

export function categoryCode(name: string): string {
  return CATEGORY_CODES[name] ?? 'GEN';
}

export function formatItemCode(category: string, n: number): string {
  return `${categoryCode(category)}-${String(n).padStart(5, '0')}`;
}
