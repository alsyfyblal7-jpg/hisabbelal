import { Customer, Transaction, StoreSettings } from './types';

const CUSTOMERS_KEY = 'grocery_store_customers';
const SETTINGS_KEY = 'store_settings';

// Default mock data is empty to let the user start fresh
const defaultCustomers: Customer[] = [];

const defaultStoreSettings: StoreSettings = {
  name: 'البقالة',
  logo: null,
  darkMode: true,
  currency: 'YER',
  storePhone: '77xxxxxxx'
};

export const getStoreSettings = (): StoreSettings => {
  const current = localStorage.getItem(SETTINGS_KEY);
  if (!current) {
    return defaultStoreSettings;
  }
  try {
    return { ...defaultStoreSettings, ...JSON.parse(current) };
  } catch {
    return defaultStoreSettings;
  }
};

export const saveStoreSettings = (settings: StoreSettings): void => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

export const getCustomers = (): Customer[] => {
  const current = localStorage.getItem(CUSTOMERS_KEY);
  if (!current) {
    // Populate with defaults
    localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(defaultCustomers));
    return defaultCustomers;
  }
  try {
    return JSON.parse(current);
  } catch {
    return defaultCustomers;
  }
};

export const saveCustomers = (customers: Customer[]): void => {
  localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers));
};

export const getCustomerBalance = (customer: Customer): number => {
  return customer.transactions.reduce((acc, tx) => {
    if (tx.type === 'debt') {
      return acc + tx.amount;
    } else {
      return acc - tx.amount;
    }
  }, 0);
};

export const isOverCreditLimit = (customer: Customer): boolean => {
  if (customer.creditLimit <= 0) return false;
  const balance = getCustomerBalance(customer);
  return balance > customer.creditLimit;
};

export const getRemainingCredit = (customer: Customer): number => {
  if (customer.creditLimit <= 0) return Infinity;
  const balance = getCustomerBalance(customer);
  return Math.max(0, customer.creditLimit - balance);
};

// Formats number to Arabic locale but keeping it readable, e.g. "15,500" or similar
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(Math.abs(amount));
};

export const getCurrencySymbol = (code: string): string => {
  switch (code) {
    case 'YER': return 'ر.ي';
    case 'SAR': return 'ر.س';
    case 'USD': return '$';
    case 'EUR': return '€';
    case 'AED': return 'د.إ';
    case 'KWD': return 'د.ك';
    default: return 'ر.ي';
  }
};

export const getCurrencyName = (code: string): string => {
  switch (code) {
    case 'YER': return 'ريال يمني';
    case 'SAR': return 'ريال سعودي';
    case 'USD': return 'دولار أمريكي';
    case 'EUR': return 'يورو';
    case 'AED': return 'درهم إماراتي';
    case 'KWD': return 'دينار كويتي';
    default: return 'ريال يمني';
  }
};

// Returns date as string like "الخميس 15 يناير 2025" or fallback formatted Arabic date string
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('ar-YE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
};

export const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('ar-YE', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(date);
};
