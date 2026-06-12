export interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;              // ISO 8601 string
  type: 'debt' | 'payment';  // debt = دين, payment = سداد
  attachment?: string | null; // base64 representation of attached image
  attachmentName?: string;   // Original filename if any
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  creditLimit: number;       // 0 = unlimited / no limit
  transactions: Transaction[];
  createdAt: string;
}

export interface StoreSettings {
  name: string;              // Store Name (default: 'البقالة')
  logo: string | null;       // base64 store logo
  darkMode: boolean;         // true = dark mode (default inside our UI representation)
  currency: string;          // Currency code (YER, SAR, USD, AED, EUR, etc.)
  storePhone: string;        // Store Phone number
}
