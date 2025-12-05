export type UnitCategory = 'length' | 'weight' | 'volume' | 'temperature' | 'area' | 'speed' | 'time';

export interface UnitInfo {
  name: string;
  symbol: string;
  toBase: (value: number) => number;
  fromBase: (value: number) => number;
}

export const UNIT_CATEGORIES: Record<UnitCategory, { name: string; icon: string }> = {
  length: { name: 'Length', icon: '📏' },
  weight: { name: 'Weight', icon: '⚖️' },
  volume: { name: 'Volume', icon: '🧪' },
  temperature: { name: 'Temp', icon: '🌡️' },
  area: { name: 'Area', icon: '📐' },
  speed: { name: 'Speed', icon: '🚀' },
  time: { name: 'Time', icon: '⏱️' }
};

export const UNITS: Record<UnitCategory, Record<string, UnitInfo>> = {
  length: {
    m: { name: 'Meter', symbol: 'm', toBase: (v) => v, fromBase: (v) => v },
    km: { name: 'Kilometer', symbol: 'km', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
    cm: { name: 'Centimeter', symbol: 'cm', toBase: (v) => v / 100, fromBase: (v) => v * 100 },
    mm: { name: 'Millimeter', symbol: 'mm', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
    mi: { name: 'Mile', symbol: 'mi', toBase: (v) => v * 1609.344, fromBase: (v) => v / 1609.344 },
    yd: { name: 'Yard', symbol: 'yd', toBase: (v) => v * 0.9144, fromBase: (v) => v / 0.9144 },
    ft: { name: 'Foot', symbol: 'ft', toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
    in: { name: 'Inch', symbol: 'in', toBase: (v) => v * 0.0254, fromBase: (v) => v / 0.0254 }
  },
  weight: {
    kg: { name: 'Kilogram', symbol: 'kg', toBase: (v) => v, fromBase: (v) => v },
    g: { name: 'Gram', symbol: 'g', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
    mg: { name: 'Milligram', symbol: 'mg', toBase: (v) => v / 1000000, fromBase: (v) => v * 1000000 },
    lb: { name: 'Pound', symbol: 'lb', toBase: (v) => v * 0.453592, fromBase: (v) => v / 0.453592 },
    oz: { name: 'Ounce', symbol: 'oz', toBase: (v) => v * 0.0283495, fromBase: (v) => v / 0.0283495 },
    t: { name: 'Metric Ton', symbol: 't', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 }
  },
  volume: {
    L: { name: 'Liter', symbol: 'L', toBase: (v) => v, fromBase: (v) => v },
    mL: { name: 'Milliliter', symbol: 'mL', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
    gal: { name: 'Gallon (US)', symbol: 'gal', toBase: (v) => v * 3.78541, fromBase: (v) => v / 3.78541 },
    qt: { name: 'Quart (US)', symbol: 'qt', toBase: (v) => v * 0.946353, fromBase: (v) => v / 0.946353 },
    pt: { name: 'Pint (US)', symbol: 'pt', toBase: (v) => v * 0.473176, fromBase: (v) => v / 0.473176 },
    cup: { name: 'Cup (US)', symbol: 'cup', toBase: (v) => v * 0.236588, fromBase: (v) => v / 0.236588 },
    floz: { name: 'Fluid Ounce', symbol: 'fl oz', toBase: (v) => v * 0.0295735, fromBase: (v) => v / 0.0295735 }
  },
  temperature: {
    C: { name: 'Celsius', symbol: '°C', toBase: (v) => v, fromBase: (v) => v },
    F: { name: 'Fahrenheit', symbol: '°F', toBase: (v) => (v - 32) * 5/9, fromBase: (v) => v * 9/5 + 32 },
    K: { name: 'Kelvin', symbol: 'K', toBase: (v) => v - 273.15, fromBase: (v) => v + 273.15 }
  },
  area: {
    m2: { name: 'Square Meter', symbol: 'm²', toBase: (v) => v, fromBase: (v) => v },
    km2: { name: 'Square Km', symbol: 'km²', toBase: (v) => v * 1000000, fromBase: (v) => v / 1000000 },
    ha: { name: 'Hectare', symbol: 'ha', toBase: (v) => v * 10000, fromBase: (v) => v / 10000 },
    acre: { name: 'Acre', symbol: 'acre', toBase: (v) => v * 4046.86, fromBase: (v) => v / 4046.86 },
    ft2: { name: 'Square Foot', symbol: 'ft²', toBase: (v) => v * 0.092903, fromBase: (v) => v / 0.092903 },
    in2: { name: 'Square Inch', symbol: 'in²', toBase: (v) => v * 0.00064516, fromBase: (v) => v / 0.00064516 }
  },
  speed: {
    mps: { name: 'Meters/sec', symbol: 'm/s', toBase: (v) => v, fromBase: (v) => v },
    kmph: { name: 'Km/hour', symbol: 'km/h', toBase: (v) => v / 3.6, fromBase: (v) => v * 3.6 },
    mph: { name: 'Miles/hour', symbol: 'mph', toBase: (v) => v * 0.44704, fromBase: (v) => v / 0.44704 },
    knot: { name: 'Knot', symbol: 'kn', toBase: (v) => v * 0.514444, fromBase: (v) => v / 0.514444 },
    fps: { name: 'Feet/sec', symbol: 'ft/s', toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 }
  },
  time: {
    s: { name: 'Second', symbol: 's', toBase: (v) => v, fromBase: (v) => v },
    ms: { name: 'Millisecond', symbol: 'ms', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
    min: { name: 'Minute', symbol: 'min', toBase: (v) => v * 60, fromBase: (v) => v / 60 },
    hr: { name: 'Hour', symbol: 'hr', toBase: (v) => v * 3600, fromBase: (v) => v / 3600 },
    day: { name: 'Day', symbol: 'day', toBase: (v) => v * 86400, fromBase: (v) => v / 86400 },
    wk: { name: 'Week', symbol: 'wk', toBase: (v) => v * 604800, fromBase: (v) => v / 604800 }
  }
};

export const convertUnit = (
  value: number, 
  fromUnit: string, 
  toUnit: string, 
  category: UnitCategory
): number => {
  if (isNaN(value) || !isFinite(value)) return 0;
  
  const units = UNITS[category];
  const from = units[fromUnit];
  const to = units[toUnit];
  
  if (!from || !to) return 0;
  
  const baseValue = from.toBase(value);
  return to.fromBase(baseValue);
};

export const getConversionRate = (
  fromUnit: string, 
  toUnit: string, 
  category: UnitCategory
): number => {
  return convertUnit(1, fromUnit, toUnit, category);
};
