/**
 * Storage Service for React KhataBook
 * Supports itemized credit purchases with directly associated settlement payments.
 */

const STORAGE_KEY_CUSTOMERS = 'khatabook_customers_v1';
const STORAGE_KEY_TRANSACTIONS = 'khatabook_transactions_v1';
const STORAGE_KEY_SETTINGS = 'khatabook_settings_v1';

export const defaultSettings = {
  currency: '₹',
  shopName: 'My Khata Book',
  theme: 'dark',
};

const sampleCustomers = [
  {
    id: 'cust_1',
    name: 'Ramesh Sharma',
    mobile: '9876543210',
    notes: 'Regular grocery customer, pays weekly',
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: 'cust_2',
    name: 'Anita Verma',
    mobile: '9812345678',
    notes: 'Apartment 402',
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: 'cust_3',
    name: 'Vikram Singh',
    mobile: '9899112233',
    notes: 'Hardware & electrical supplies',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  }
];

const sampleTransactions = [
  {
    id: 'tx_1',
    customerId: 'cust_1',
    type: 'CREDIT',
    date: new Date(Date.now() - 12 * 86400000).toISOString().split('T')[0],
    items: [
      { name: 'Basmati Rice (5kg)', qty: 1, price: 450, discount: 0, total: 450 },
      { name: 'Sunflower Oil (1L)', qty: 2, price: 140, discount: 0, total: 280 },
      { name: 'Sugar (2kg)', qty: 1, price: 100, discount: 10, total: 90 }
    ],
    amount: 820,
    settlements: [
      {
        id: 'stl_1',
        amount: 500,
        date: new Date(Date.now() - 8 * 86400000).toISOString().split('T')[0],
        paymentMode: 'UPI',
        note: 'Paid via GPay',
        createdAt: new Date(Date.now() - 8 * 86400000).toISOString(),
      }
    ],
    note: 'Weekly ration items',
    createdAt: new Date(Date.now() - 12 * 86400000).toISOString(),
  },
  {
    id: 'tx_3',
    customerId: 'cust_1',
    type: 'CREDIT',
    date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
    items: [
      { name: 'Wheat Flour (10kg)', qty: 1, price: 380, discount: 0, total: 380 },
      { name: 'Tea Powder (500g)', qty: 1, price: 210, discount: 0, total: 210 }
    ],
    amount: 590,
    settlements: [],
    note: 'Emergency evening purchase',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'tx_4',
    customerId: 'cust_2',
    type: 'CREDIT',
    date: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
    items: [
      { name: 'Laundry Detergent (2kg)', qty: 1, price: 280, discount: 14, total: 266 },
      { name: 'Dish Soap (750ml)', qty: 2, price: 110, discount: 0, total: 220 }
    ],
    amount: 486,
    settlements: [],
    note: 'Dairy items',
    createdAt: new Date(Date.now() - 6 * 86400000).toISOString(),
  },
  {
    id: 'tx_5',
    customerId: 'cust_3',
    type: 'CREDIT',
    date: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
    items: [
      { name: 'LED Bulb 12W', qty: 3, price: 120, discount: 0, total: 360 },
      { name: 'Extension Cord 4-way', qty: 1, price: 450, discount: 0, total: 450 },
      { name: 'Insulation Tape', qty: 2, price: 25, discount: 0, total: 50 }
    ],
    amount: 860,
    settlements: [
      {
        id: 'stl_2',
        amount: 860,
        date: new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0],
        paymentMode: 'Cash',
        note: 'Full settlement paid in cash',
        createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      }
    ],
    note: 'Shop wiring accessories',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  }
];

export const getTransactionSettledAmount = (tx) => {
  if (!tx || !Array.isArray(tx.settlements)) return 0;
  return tx.settlements.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
};

export const getTransactionRemainingDue = (tx) => {
  if (!tx) return 0;
  const original = Number(tx.amount) || 0;
  const settled = getTransactionSettledAmount(tx);
  return Math.max(0, Math.round((original - settled) * 100) / 100);
};

export const calculateCustomerBalance = (customerId, transactions) => {
  const custTxs = transactions.filter((t) => t.customerId === customerId);
  let balance = 0;

  custTxs.forEach((tx) => {
    if (tx.type === 'CREDIT') {
      balance += getTransactionRemainingDue(tx);
    } else if (tx.type === 'PAYMENT') {
      // Any standalone payment not associated with a specific credit
      balance -= Number(tx.amount) || 0;
    }
  });

  return Math.max(0, Math.round(balance * 100) / 100);
};

export const calculateTransactionTotal = (items = []) => {
  if (!Array.isArray(items)) return 0;
  const total = items.reduce((sum, i) => {
    if (i.total !== undefined && !isNaN(Number(i.total)) && Number(i.total) > 0) {
      return sum + Number(i.total);
    }
    const q = Number(i.qty) || 1;
    const p = Number(i.price) || 0;
    const d = Number(i.discount || 0);
    const subtotal = q * p;
    const discAmount = Math.min(subtotal, Math.max(0, d));
    const itemTotal = Math.max(0, subtotal - discAmount);
    return sum + (itemTotal > 0 ? itemTotal : 0);
  }, 0);
  return Math.round(total * 100) / 100;
};

export const loadInitialData = () => {
  let customers = sampleCustomers;
  let transactions = sampleTransactions;
  let settings = defaultSettings;

  try {
    const rawCust = localStorage.getItem(STORAGE_KEY_CUSTOMERS);
    if (rawCust) customers = JSON.parse(rawCust);
  } catch (e) {
    console.error('Failed reading customers', e);
  }

  try {
    const rawTx = localStorage.getItem(STORAGE_KEY_TRANSACTIONS);
    if (rawTx) {
      const parsed = JSON.parse(rawTx);
      // Ensure all credit transactions have a settlements array
      transactions = parsed.map((t) => {
        if (t.type === 'CREDIT' && !Array.isArray(t.settlements)) {
          return { ...t, settlements: [] };
        }
        return t;
      });
    }
  } catch (e) {
    console.error('Failed reading transactions', e);
  }

  try {
    const rawSet = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (rawSet) settings = { ...defaultSettings, ...JSON.parse(rawSet) };
  } catch (e) {
    console.error('Failed reading settings', e);
  }

  return { customers, transactions, settings };
};

export const persistCustomers = (customers) => {
  localStorage.setItem(STORAGE_KEY_CUSTOMERS, JSON.stringify(customers));
};

export const persistTransactions = (transactions) => {
  localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(transactions));
};

export const persistSettings = (settings) => {
  localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
};
