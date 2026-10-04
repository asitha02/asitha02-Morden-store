/** Category list. `code` is the prefix used for the auto-generated item code. */
export const CATEGORIES = [
  { name: 'Engine', code: 'ENG' },
  { name: 'Brakes', code: 'BRK' },
  { name: 'Suspension & Steering', code: 'SUS' },
  { name: 'Electrical & Battery', code: 'ELE' },
  { name: 'Filters', code: 'FLT' },
  { name: 'Lighting', code: 'LGT' },
  { name: 'Body & Exterior', code: 'BDY' },
  { name: 'Transmission & Clutch', code: 'TRN' },
  { name: 'Cooling & Heating', code: 'CLG' },
  { name: 'Exhaust', code: 'EXH' },
  { name: 'Tyres & Wheels', code: 'TYR' },
  { name: 'Oils & Fluids', code: 'OIL' },
  { name: 'Interior & Accessories', code: 'ACC' },
];

export const CATEGORY_NAMES: string[] = CATEGORIES.map((c) => c.name);

export const BRANDS: string[] = [
  'Bosch',
  'Brembo',
  'Castrol',
  'Denso',
  'Gates',
  'Honda Genuine',
  'KYB',
  'Mahle',
  'Mobil',
  'Monroe',
  'Nissan Genuine',
  'NGK',
  'Philips',
  'Suzuki Genuine',
  'Toyota Genuine',
  'Valeo',
  'Other / Generic',
];

export const VEHICLE_TYPES: string[] = [
  'Car',
  'SUV / Jeep',
  'Van',
  'Pickup / Truck',
  'Bus',
  'Motorcycle',
  'Three-wheeler',
  'Tractor',
];

export function categoryCode(name: string): string {
  return CATEGORIES.find((c) => c.name === name)?.code ?? 'GEN';
}
