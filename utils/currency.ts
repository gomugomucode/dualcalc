
// Mock exchange rates (Base: USD) relative values as of roughly 2024
// Used as a fallback if the API fails
export const DEFAULT_EXCHANGE_RATES: Record<string, number> = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 151.5,
  INR: 83.5,
  CAD: 1.36,
  AUD: 1.52,
  CNY: 7.23,
  CHF: 0.91,
  SGD: 1.35
};

export const CURRENCY_NAMES: Record<string, string> = {
  USD: 'US Dollar',
  EUR: 'Euro',
  GBP: 'British Pound',
  JPY: 'Japanese Yen',
  INR: 'Indian Rupee',
  CAD: 'Canadian Dollar',
  AUD: 'Australian Dollar',
  CNY: 'Chinese Yuan',
  CHF: 'Swiss Franc',
  SGD: 'Singapore Dollar'
};

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  INR: '₹',
  CAD: 'C$',
  AUD: 'A$',
  CNY: '¥',
  CHF: 'Fr',
  SGD: 'S$'
};

export const CURRENCY_FLAGS: Record<string, string> = {
  USD: '🇺🇸',
  EUR: '🇪🇺',
  GBP: '🇬🇧',
  JPY: '🇯🇵',
  INR: '🇮🇳',
  CAD: '🇨🇦',
  AUD: '🇦🇺',
  CNY: '🇨🇳',
  CHF: '🇨🇭',
  SGD: '🇸🇬'
};

/**
 * Fetches real-time exchange rates from the Frankfurter API.
 * Base currency is set to USD.
 */
export const fetchExchangeRates = async (): Promise<Record<string, number> | null> => {
  try {
    // Frankfurt API is a free, open-source API for current exchange rates.
    // We request rates with USD as the base.
    const response = await fetch('https://api.frankfurter.app/latest?from=USD');
    
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    
    // The API returns rates relative to USD. 
    // We explicitly ensure USD is 1.0 (though it's the base, so it's implied).
    const newRates: Record<string, number> = { USD: 1.0, ...data.rates };
    
    return newRates;
  } catch (error) {
    console.error('Failed to fetch exchange rates:', error);
    return null;
  }
};

/**
 * Converts an amount from one currency to another using provided rates.
 */
export const convertCurrency = (amount: number, from: string, to: string, rates: Record<string, number> = DEFAULT_EXCHANGE_RATES): number => {
  if (isNaN(amount) || !isFinite(amount)) return 0;
  
  const rateFrom = rates[from];
  const rateTo = rates[to];
  
  if (!rateFrom || !rateTo) return 0;
  
  // Convert to USD (base) then to Target
  const inUSD = amount / rateFrom;
  return inUSD * rateTo;
};

/**
 * Gets the exchange rate between two currencies (1 Unit From = X Unit To) using provided rates.
 */
export const getExchangeRate = (from: string, to: string, rates: Record<string, number> = DEFAULT_EXCHANGE_RATES): number => {
    const rateFrom = rates[from];
    const rateTo = rates[to];
    if (!rateFrom || !rateTo) return 0;
    return rateTo / rateFrom;
};
