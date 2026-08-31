import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  onSnapshot,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCbpOaMXU6x4MfylHGUuprmBa_hse1cr4M",
  authDomain: "credit-book-cd673.firebaseapp.com",
  projectId: "credit-book-cd673",
  storageBucket: "credit-book-cd673.firebasestorage.app",
  messagingSenderId: "401260843913",
  appId: "1:401260843913:web:d70c0fefdc08178f634758"
};

// Initialize Firebase App and Firestore
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

const CUSTOMERS_COL = 'customers';
const TRANSACTIONS_COL = 'transactions';
const SETTINGS_DOC = 'settings/app_settings';

/**
 * Subscribe to real-time updates from Firestore.
 * Callback is invoked whenever data changes on the cloud.
 */
export const subscribeToCloudData = (onUpdate, onStatusChange) => {
  let isSubscribed = true;
  let cloudCustomers = null;
  let cloudTransactions = null;
  let cloudSettings = null;

  if (onStatusChange) onStatusChange('syncing');

  const maybeEmit = () => {
    if (!isSubscribed) return;
    if (cloudCustomers !== null && cloudTransactions !== null) {
      if (onStatusChange) onStatusChange('synced');
      onUpdate({
        customers: cloudCustomers,
        transactions: cloudTransactions,
        settings: cloudSettings,
      });
    }
  };

  // 1. Customers listener
  const unsubCustomers = onSnapshot(
    collection(db, CUSTOMERS_COL),
    (snapshot) => {
      cloudCustomers = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      maybeEmit();
    },
    (err) => {
      console.warn('Firestore customers sync notice:', err.message);
      if (onStatusChange) onStatusChange('offline');
    }
  );

  // 2. Transactions listener
  const unsubTransactions = onSnapshot(
    collection(db, TRANSACTIONS_COL),
    (snapshot) => {
      cloudTransactions = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          settlements: Array.isArray(data.settlements) ? data.settlements : [],
        };
      });
      maybeEmit();
    },
    (err) => {
      console.warn('Firestore transactions sync notice:', err.message);
      if (onStatusChange) onStatusChange('offline');
    }
  );

  // 3. Settings listener
  const unsubSettings = onSnapshot(
    doc(db, SETTINGS_DOC),
    (docSnap) => {
      if (docSnap.exists()) {
        cloudSettings = docSnap.data();
      }
      maybeEmit();
    },
    (err) => {
      console.warn('Firestore settings sync notice:', err.message);
    }
  );

  return () => {
    isSubscribed = false;
    unsubCustomers();
    unsubTransactions();
    unsubSettings();
  };
};

const sanitizeForFirestore = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  const clean = {};
  Object.keys(obj).forEach((key) => {
    const val = obj[key];
    if (val !== undefined) {
      if (Array.isArray(val)) {
        clean[key] = val.map((item) =>
          typeof item === 'object' && item !== null ? sanitizeForFirestore(item) : item
        );
      } else if (typeof val === 'object' && val !== null) {
        clean[key] = sanitizeForFirestore(val);
      } else {
        clean[key] = val;
      }
    }
  });
  return clean;
};

/**
 * Save or update a customer record in Firestore
 */
export const cloudSaveCustomer = async (customer) => {
  try {
    const custRef = doc(db, CUSTOMERS_COL, customer.id);
    const sanitized = sanitizeForFirestore(customer);
    await setDoc(custRef, sanitized, { merge: true });
  } catch (e) {
    console.error('Failed saving customer to cloud:', e);
  }
};

/**
 * Delete a customer and all their associated transactions from Firestore
 */
export const cloudDeleteCustomer = async (customerId, customerTxIds = []) => {
  try {
    const batch = writeBatch(db);
    const custRef = doc(db, CUSTOMERS_COL, customerId);
    batch.delete(custRef);

    customerTxIds.forEach((txId) => {
      const txRef = doc(db, TRANSACTIONS_COL, txId);
      batch.delete(txRef);
    });

    await batch.commit();
  } catch (e) {
    console.error('Failed deleting customer from cloud:', e);
  }
};

/**
 * Save or update a transaction record in Firestore
 */
export const cloudSaveTransaction = async (transaction) => {
  try {
    const txRef = doc(db, TRANSACTIONS_COL, transaction.id);
    const sanitized = sanitizeForFirestore(transaction);
    await setDoc(txRef, sanitized, { merge: true });
  } catch (e) {
    console.error('Failed saving transaction to cloud:', e);
  }
};

/**
 * Delete a transaction record from Firestore
 */
export const cloudDeleteTransaction = async (transactionId) => {
  try {
    const txRef = doc(db, TRANSACTIONS_COL, transactionId);
    await deleteDoc(txRef);
  } catch (e) {
    console.error('Failed deleting transaction from cloud:', e);
  }
};

/**
 * Save app settings to Firestore
 */
export const cloudSaveSettings = async (settings) => {
  try {
    const settingsRef = doc(db, SETTINGS_DOC);
    const sanitized = sanitizeForFirestore(settings);
    await setDoc(settingsRef, sanitized, { merge: true });
  } catch (e) {
    console.error('Failed saving settings to cloud:', e);
  }
};

/**
 * Upload initial local dataset or backup dataset to Firestore in batch
 */
export const cloudUploadAllData = async ({ customers, transactions, settings }) => {
  try {
    const batch = writeBatch(db);

    if (Array.isArray(customers)) {
      customers.forEach((c) => {
        const ref = doc(db, CUSTOMERS_COL, c.id);
        const sanitized = sanitizeForFirestore(c);
        batch.set(ref, sanitized, { merge: true });
      });
    }

    if (Array.isArray(transactions)) {
      transactions.forEach((t) => {
        const ref = doc(db, TRANSACTIONS_COL, t.id);
        const sanitized = sanitizeForFirestore(t);
        batch.set(ref, sanitized, { merge: true });
      });
    }

    if (settings) {
      const settingsRef = doc(db, SETTINGS_DOC);
      const sanitized = sanitizeForFirestore(settings);
      batch.set(settingsRef, sanitized, { merge: true });
    }

    await batch.commit();
    return true;
  } catch (e) {
    console.error('Failed batch uploading data to cloud:', e);
    return false;
  }
};
