import React, { useState, useEffect } from 'react';
import {
  loadInitialData,
  persistCustomers,
  persistTransactions,
  persistSettings,
  calculateCustomerBalance,
  defaultSettings,
} from './services/storage';

import {
  subscribeToCloudData,
  cloudSaveCustomer,
  cloudDeleteCustomer,
  cloudSaveTransaction,
  cloudDeleteTransaction,
  cloudSaveSettings,
  cloudUploadAllData,
} from './services/firebase';

import Navbar from './components/Navbar';
import CustomerSidebar from './components/CustomerSidebar';
import CustomerPassbook from './components/CustomerPassbook';
import CreditPurchaseModal from './components/CreditPurchaseModal';
import PaymentModal from './components/PaymentModal';
import CustomerModal from './components/CustomerModal';
import WhatsAppModal from './components/WhatsAppModal';
import SettingsModal from './components/SettingsModal';
import Toast from './components/Toast';

export default function App() {
  const [data, setData] = useState(() => loadInitialData());
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [cloudStatus, setCloudStatus] = useState('syncing');

  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [isMobileHidden, setIsMobileHidden] = useState(false);

  // Modals state
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [prefillPaymentData, setPrefillPaymentData] = useState(null);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Toast notifications
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'info') => {
    const id = Date.now() + Math.random().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  };

  // Realtime Cloud Synchronization with Firebase Firestore
  useEffect(() => {
    const unsubscribe = subscribeToCloudData(
      (cloudData) => {
        if (cloudData) {
          setData((prev) => {
            const hasCloudCust = Array.isArray(cloudData.customers) && cloudData.customers.length > 0;
            const hasCloudTx = Array.isArray(cloudData.transactions) && cloudData.transactions.length > 0;
            return {
              customers: hasCloudCust ? cloudData.customers : prev.customers,
              transactions: hasCloudTx ? cloudData.transactions : prev.transactions,
              settings: cloudData.settings ? { ...prev.settings, ...cloudData.settings } : prev.settings,
            };
          });
        }
      },
      (status) => setCloudStatus(status)
    );
    return () => unsubscribe();
  }, []);

  // Sync with LocalStorage
  useEffect(() => {
    persistCustomers(data.customers);
  }, [data.customers]);

  useEffect(() => {
    persistTransactions(data.transactions);
  }, [data.transactions]);

  useEffect(() => {
    persistSettings(data.settings);
    document.documentElement.setAttribute('data-theme', data.settings.theme || 'dark');
    document.title = data.settings.shopName || 'My Khata Book';
  }, [data.settings]);

  // Derived state: Customer balances
  const customersWithBalance = data.customers.map((cust) => {
    const balance = calculateCustomerBalance(cust.id, data.transactions);
    return { ...cust, balance };
  });

  const totalOutstandingDue = customersWithBalance.reduce((sum, c) => {
    return c.balance > 0 ? sum + c.balance : sum;
  }, 0);

  const selectedCustomer = data.customers.find(
    (c) => c.id === selectedCustomerId
  );
  const selectedCustomerTransactions = selectedCustomerId
    ? data.transactions.filter((t) => t.customerId === selectedCustomerId)
    : [];
  const selectedCustomerBalance = selectedCustomerId
    ? calculateCustomerBalance(selectedCustomerId, data.transactions)
    : 0;

  // Handlers
  const handleToggleTheme = () => {
    const nextTheme = data.settings.theme === 'light' ? 'dark' : 'light';
    const nextSettings = { ...data.settings, theme: nextTheme };
    setData((prev) => ({
      ...prev,
      settings: nextSettings,
    }));
    cloudSaveSettings(nextSettings);
  };

  const handleSelectCustomer = (id) => {
    setSelectedCustomerId((prev) => (prev === id ? null : id));
    if (window.innerWidth <= 860) {
      setIsMobileHidden(true);
    }
  };

  // Customer Edit
  const handleOpenCustomerModal = (editId = null) => {
    if (editId) {
      const cust = data.customers.find((c) => c.id === editId);
      setEditingCustomer(cust || null);
    } else {
      setEditingCustomer(null);
    }
    setIsCustomerModalOpen(true);
  };

  const handleSaveCustomer = ({ id, name, mobile, notes }) => {
    if (id) {
      const updatedCust = { id, name, mobile, notes, updatedAt: new Date().toISOString() };
      setData((prev) => ({
        ...prev,
        customers: prev.customers.map((c) =>
          c.id === id ? { ...c, ...updatedCust } : c
        ),
      }));
      cloudSaveCustomer(updatedCust);
      showToast('Customer info updated', 'success');
    }
    setIsCustomerModalOpen(false);
  };

  const handleDeleteCustomer = (customerId) => {
    const cust = data.customers.find((c) => c.id === customerId);
    if (!cust) return;

    if (
      window.confirm(
        `Are you sure you want to delete customer "${cust.name}" and all their records?`
      )
    ) {
      const custTxIds = data.transactions
        .filter((t) => t.customerId === customerId)
        .map((t) => t.id);

      setData((prev) => ({
        ...prev,
        customers: prev.customers.filter((c) => c.id !== customerId),
        transactions: prev.transactions.filter(
          (t) => t.customerId !== customerId
        ),
      }));

      cloudDeleteCustomer(customerId, custTxIds);

      const remaining = data.customers.filter((c) => c.id !== customerId);
      setSelectedCustomerId(remaining.length > 0 ? remaining[0].id : null);
      showToast(`Customer "${cust.name}" deleted`, 'success');
    }
  };

  // Edit Transaction Handler
  const handleEditTransaction = (tx) => {
    setEditingTransaction(tx);
    if (tx.type === 'CREDIT') {
      setIsCreditModalOpen(true);
    } else if (tx.type === 'PAYMENT') {
      setIsPaymentModalOpen(true);
    }
  };

  // Unified Credit Purchase & Customer Creation (New or Edit)
  const handleSaveCredit = ({ id, customerName, mobileNumber, date, items, amount, note }) => {
    const trimmedName = customerName.trim();
    const cleanPhone = mobileNumber ? mobileNumber.trim() : '';

    // Check if a customer with this name already exists (case-insensitive)
    const existingCust = data.customers.find(
      (c) => c.name.toLowerCase().trim() === trimmedName.toLowerCase()
    );

    let targetCustomerId;
    let updatedCustomers = [...data.customers];

    if (existingCust) {
      // Existing customer: use their ID and update mobile if provided
      targetCustomerId = existingCust.id;
      if (cleanPhone && existingCust.mobile !== cleanPhone) {
        updatedCustomers = updatedCustomers.map((c) =>
          c.id === existingCust.id ? { ...c, mobile: cleanPhone } : c
        );
      }
    } else {
      // New customer: automatically create customer record
      const newCust = {
        id: 'cust_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        name: trimmedName,
        mobile: cleanPhone,
        notes: '',
        createdAt: new Date().toISOString(),
      };
      targetCustomerId = newCust.id;
      updatedCustomers.push(newCust);
    }

    if (id) {
      // Update existing credit transaction
      const updatedTx = {
        id,
        customerId: targetCustomerId,
        type: 'CREDIT',
        date: date || new Date().toISOString().split('T')[0],
        items,
        amount,
        note: note || '',
        updatedAt: new Date().toISOString(),
      };

      setData((prev) => ({
        ...prev,
        customers: updatedCustomers,
        transactions: prev.transactions.map((t) =>
          t.id === id ? { ...t, ...updatedTx } : t
        ),
      }));

      cloudSaveTransaction(updatedTx);

      showToast(
        `Credit purchase of ${data.settings.currency}${amount.toFixed(2)} updated!`,
        'success'
      );
    } else {
      // Create new credit transaction
      const newTx = {
        id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        customerId: targetCustomerId,
        type: 'CREDIT',
        date: date || new Date().toISOString().split('T')[0],
        items,
        amount,
        settlements: [],
        note: note || '',
        createdAt: new Date().toISOString(),
      };

      setData((prev) => ({
        ...prev,
        customers: updatedCustomers,
        transactions: [...prev.transactions, newTx],
      }));

      const activeCust = updatedCustomers.find((c) => c.id === targetCustomerId);
      if (activeCust) cloudSaveCustomer(activeCust);
      cloudSaveTransaction(newTx);

      if (existingCust) {
        showToast(
          `Added credit purchase of ${data.settings.currency}${amount.toFixed(
            2
          )} to existing account: "${existingCust.name}"`,
          'success'
        );
      } else {
        showToast(
          `Created account for "${trimmedName}" and recorded credit purchase of ${data.settings.currency}${amount.toFixed(
            2
          )}!`,
          'success'
        );
      }
    }

    setSelectedCustomerId(targetCustomerId);
    setIsCreditModalOpen(false);
    setEditingTransaction(null);
  };

  // Payment / Settlement Transaction (Directly Associated with Transactions)
  const handleSavePayment = ({ id, settlementId, customerId, targetTxId, amount, date, paymentMode, note }) => {
    const paymentDate = date || new Date().toISOString().split('T')[0];
    const newSettlement = {
      id: settlementId || 'stl_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      amount: Number(amount),
      date: paymentDate,
      paymentMode: paymentMode || 'Cash',
      note: note || '',
      createdAt: new Date().toISOString(),
    };

    if (targetTxId && targetTxId !== 'auto') {
      // Direct settlement associated with a specific credit purchase
      const targetTx = data.transactions.find((t) => t.id === targetTxId);
      if (targetTx) {
        const currentSettlements = Array.isArray(targetTx.settlements) ? targetTx.settlements : [];
        const updatedTx = {
          ...targetTx,
          settlements: [...currentSettlements, newSettlement],
          updatedAt: new Date().toISOString(),
        };

        setData((prev) => ({
          ...prev,
          transactions: prev.transactions.map((t) => (t.id === targetTxId ? updatedTx : t)),
        }));

        cloudSaveTransaction(updatedTx);

        showToast(
          `Recorded settlement of ${data.settings.currency}${Number(amount).toFixed(2)} for this bill!`,
          'success'
        );
      }
    } else {
      // Auto-allocate settlement across oldest unpaid credit bills
      let remainingToAllocate = Number(amount);
      const customerCreditTxs = data.transactions
        .filter((t) => t.customerId === customerId && t.type === 'CREDIT')
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      let updatedTransactions = [...data.transactions];
      const touchedTxs = [];

      for (let tx of customerCreditTxs) {
        if (remainingToAllocate <= 0) break;

        const currentSettled = Array.isArray(tx.settlements)
          ? tx.settlements.reduce((sum, s) => sum + (Number(s.amount) || 0), 0)
          : 0;
        const dueOnThisTx = Math.max(0, (Number(tx.amount) || 0) - currentSettled);

        if (dueOnThisTx > 0) {
          const allocateAmount = Math.min(remainingToAllocate, dueOnThisTx);
          const allocatedSettlement = {
            id: 'stl_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            amount: allocateAmount,
            date: paymentDate,
            paymentMode: paymentMode || 'Cash',
            note: note || 'Account Settlement',
            createdAt: new Date().toISOString(),
          };

          updatedTransactions = updatedTransactions.map((t) => {
            if (t.id === tx.id) {
              const prevStls = Array.isArray(t.settlements) ? t.settlements : [];
              const updated = {
                ...t,
                settlements: [...prevStls, allocatedSettlement],
                updatedAt: new Date().toISOString(),
              };
              touchedTxs.push(updated);
              return updated;
            }
            return t;
          });

          remainingToAllocate = Math.round((remainingToAllocate - allocateAmount) * 100) / 100;
        }
      }

      // If any amount remains after paying off all credit bills (or no credit bills exist)
      if (remainingToAllocate > 0) {
        const extraPaymentTx = {
          id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
          customerId,
          type: 'PAYMENT',
          date: paymentDate,
          items: [],
          amount: remainingToAllocate,
          paymentMode: paymentMode || 'Cash',
          note: note || 'General Payment',
          createdAt: new Date().toISOString(),
        };
        updatedTransactions.push(extraPaymentTx);
        touchedTxs.push(extraPaymentTx);
      }

      setData((prev) => ({
        ...prev,
        transactions: updatedTransactions,
      }));

      touchedTxs.forEach((tx) => cloudSaveTransaction(tx));

      showToast(
        `Settlement payment of ${data.settings.currency}${Number(amount).toFixed(2)} recorded!`,
        'success'
      );
    }

    setSelectedCustomerId(customerId);
    setIsPaymentModalOpen(false);
    setEditingTransaction(null);
    setPrefillPaymentData(null);
  };

  // Delete an attached settlement payment from a transaction
  const handleDeleteSettlement = (txId, settlementId) => {
    if (window.confirm('Remove this payment record from the bill?')) {
      const targetTx = data.transactions.find((t) => t.id === txId);
      if (!targetTx) return;

      const updatedTx = {
        ...targetTx,
        settlements: (targetTx.settlements || []).filter((s) => s.id !== settlementId),
        updatedAt: new Date().toISOString(),
      };

      setData((prev) => ({
        ...prev,
        transactions: prev.transactions.map((t) => (t.id === txId ? updatedTx : t)),
      }));

      cloudSaveTransaction(updatedTx);
      showToast('Payment record removed', 'success');
    }
  };

  // Open Payment / Settlement Modal
  const handleOpenPaymentModal = (
    customerId = null,
    prefillAmount = null,
    note = '',
    targetTxId = 'auto'
  ) => {
    setEditingTransaction(null);
    if (prefillAmount !== null || note || targetTxId !== 'auto') {
      setPrefillPaymentData({
        customerId: customerId || selectedCustomerId,
        amount: prefillAmount,
        note,
        targetTxId: targetTxId || 'auto',
      });
    } else {
      setPrefillPaymentData(null);
    }
    setIsPaymentModalOpen(true);
  };

  const handleDeleteTransaction = (txId) => {
    if (window.confirm('Delete this transaction record?')) {
      setData((prev) => ({
        ...prev,
        transactions: prev.transactions.filter((t) => t.id !== txId),
      }));
      cloudDeleteTransaction(txId);
      showToast('Transaction deleted', 'success');
    }
  };

  // Settings & Backup Handlers
  const handleSaveSettings = (newSettings) => {
    setData((prev) => ({ ...prev, settings: newSettings }));
    cloudSaveSettings(newSettings);
    showToast('Settings saved', 'success');
  };

  const handleSyncAllToCloud = async () => {
    const ok = await cloudUploadAllData(data);
    if (ok) {
      showToast('All local records synced to Firebase Cloud!', 'success');
    } else {
      showToast('Failed uploading data to Firebase', 'error');
    }
  };

  const handleExportBackup = () => {
    const backupObj = {
      version: 1,
      exportDate: new Date().toISOString(),
      customers: data.customers,
      transactions: data.transactions,
      settings: data.settings,
    };
    const jsonStr = JSON.stringify(backupObj, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `khatabook_backup_${
      new Date().toISOString().split('T')[0]
    }.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Backup JSON downloaded', 'success');
  };

  const handleImportBackup = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (Array.isArray(parsed.customers) && Array.isArray(parsed.transactions)) {
          setData({
            customers: parsed.customers,
            transactions: parsed.transactions,
            settings: parsed.settings || defaultSettings,
          });
          setSelectedCustomerId(
            parsed.customers.length > 0 ? parsed.customers[0].id : null
          );
          setIsSettingsModalOpen(false);
          showToast(
            `Restored ${parsed.customers.length} customers and ${parsed.transactions.length} transactions!`,
            'success'
          );
        } else {
          showToast('Invalid backup file structure', 'error');
        }
      } catch (err) {
        showToast('Failed to parse JSON file', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleResetDemoData = () => {
    if (window.confirm('Reset to demo sample data? Current data will be replaced.')) {
      localStorage.clear();
      const fresh = loadInitialData();
      setData(fresh);
      setSelectedCustomerId(fresh.customers.length > 0 ? fresh.customers[0].id : null);
      setIsSettingsModalOpen(false);
      showToast('Sample demo data loaded!', 'success');
    }
  };

  const handleClearAllData = () => {
    if (window.confirm('Clear ALL customers and transactions?')) {
      setData((prev) => ({ ...prev, customers: [], transactions: [] }));
      setSelectedCustomerId(null);
      setIsSettingsModalOpen(false);
      showToast('All records cleared', 'success');
    }
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsCreditModalOpen(false);
        setIsPaymentModalOpen(false);
        setIsCustomerModalOpen(false);
        setIsWhatsAppModalOpen(false);
        setIsSettingsModalOpen(false);
      } else if (e.altKey && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        setEditingTransaction(null);
        setIsCreditModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <Navbar
        shopName={data.settings.shopName}
        currency={data.settings.currency}
        totalDue={totalOutstandingDue}
        theme={data.settings.theme}
        cloudStatus={cloudStatus}
        onToggleTheme={handleToggleTheme}
        onOpenCreditModal={() => {
          setEditingTransaction(null);
          setIsCreditModalOpen(true);
        }}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onGoHome={() => setSelectedCustomerId(null)}
      />

      {/* Main Split Layout */}
      <main className="main-layout">
        <CustomerSidebar
          customersWithBalance={customersWithBalance}
          selectedCustomerId={selectedCustomerId}
          onSelectCustomer={handleSelectCustomer}
          onOpenCreditModal={() => {
            setEditingTransaction(null);
            setIsCreditModalOpen(true);
          }}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
          currency={data.settings.currency}
          isMobileHidden={isMobileHidden}
        />

        <CustomerPassbook
          customer={selectedCustomer}
          transactions={selectedCustomerTransactions}
          balance={selectedCustomerBalance}
          currency={data.settings.currency}
          onOpenCreditModal={() => {
            setEditingTransaction(null);
            setIsCreditModalOpen(true);
          }}
          onOpenPaymentModal={handleOpenPaymentModal}
          onOpenCustomerModal={handleOpenCustomerModal}
          onDeleteCustomer={handleDeleteCustomer}
          onDeleteTransaction={handleDeleteTransaction}
          onEditTransaction={handleEditTransaction}
          onDeleteSettlement={handleDeleteSettlement}
          onOpenWhatsApp={() => setIsWhatsAppModalOpen(true)}
          onBack={() => {
            setSelectedCustomerId(null);
            setIsMobileHidden(false);
          }}
        />
      </main>

      {/* Modals */}
      <CreditPurchaseModal
        isOpen={isCreditModalOpen}
        onClose={() => {
          setIsCreditModalOpen(false);
          setEditingTransaction(null);
        }}
        customers={data.customers}
        preselectedCustomerId={selectedCustomerId}
        editingTransaction={editingTransaction}
        currency={data.settings.currency}
        onSaveCredit={handleSaveCredit}
        onShowToast={showToast}
      />

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setEditingTransaction(null);
          setPrefillPaymentData(null);
        }}
        customers={data.customers}
        transactions={data.transactions}
        preselectedCustomerId={selectedCustomerId}
        customerBalance={selectedCustomerBalance}
        editingTransaction={editingTransaction}
        prefillData={prefillPaymentData}
        currency={data.settings.currency}
        onSavePayment={handleSavePayment}
        onShowToast={showToast}
      />

      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        editingCustomer={editingCustomer}
        onSaveCustomer={handleSaveCustomer}
        onShowToast={showToast}
      />

      <WhatsAppModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
        customer={selectedCustomer}
        balance={selectedCustomerBalance}
        transactions={data.transactions}
        shopName={data.settings.shopName}
        currency={data.settings.currency}
        onShowToast={showToast}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={data.settings}
        cloudStatus={cloudStatus}
        onSaveSettings={handleSaveSettings}
        onExportBackup={handleExportBackup}
        onImportBackup={handleImportBackup}
        onSyncAllToCloud={handleSyncAllToCloud}
        onResetDemoData={handleResetDemoData}
        onClearAllData={handleClearAllData}
      />

      {/* Toast Notifications */}
      <Toast toasts={toasts} />
    </div>
  );
}
