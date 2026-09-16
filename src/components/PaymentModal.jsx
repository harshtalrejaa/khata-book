import React, { useState, useEffect } from 'react';
import { CheckCircle2, X, Wallet, Receipt, Coins } from 'lucide-react';
import { getTransactionRemainingDue } from '../services/storage';

export default function PaymentModal({
  isOpen,
  onClose,
  customers = [],
  transactions = [],
  preselectedCustomerId,
  customerBalance,
  editingTransaction,
  prefillData,
  currency,
  onSavePayment,
  onShowToast,
}) {
  const [entryMode, setEntryMode] = useState('settle'); // 'settle' | 'deposit'
  const [customerId, setCustomerId] = useState('');
  const [targetTxId, setTargetTxId] = useState('auto'); // 'auto', specific tx.id, or 'deposit'
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (editingTransaction) {
        // Editing existing payment or settlement
        const isStandalone = editingTransaction.type === 'PAYMENT' || editingTransaction.isDeposit;
        setEntryMode(isStandalone ? 'deposit' : 'settle');
        setCustomerId(editingTransaction.customerId || '');
        setTargetTxId(isStandalone ? 'deposit' : editingTransaction.targetTxId || 'auto');
        setAmount(editingTransaction.amount ? editingTransaction.amount.toString() : '');
        setDate(editingTransaction.date || new Date().toISOString().split('T')[0]);
        setPaymentMode(editingTransaction.paymentMode || 'Cash');
        setNote(editingTransaction.note || '');
      } else if (prefillData) {
        // Opened with prefill
        const isDep = prefillData.mode === 'deposit' || prefillData.targetTxId === 'deposit';
        setEntryMode(isDep ? 'deposit' : 'settle');
        setCustomerId(prefillData.customerId || preselectedCustomerId || '');
        setTargetTxId(isDep ? 'deposit' : prefillData.targetTxId || 'auto');
        setAmount(prefillData.amount ? prefillData.amount.toString() : '');
        setDate(new Date().toISOString().split('T')[0]);
        setPaymentMode('Cash');
        setNote(prefillData.note || (isDep ? 'General Deposit' : ''));
      } else {
        // Fresh modal open
        const activeId = preselectedCustomerId || (customers.length > 0 ? customers[0].id : '');
        setCustomerId(activeId);
        setEntryMode(customerBalance && customerBalance > 0 ? 'settle' : 'deposit');
        setTargetTxId(customerBalance && customerBalance > 0 ? 'auto' : 'deposit');
        setDate(new Date().toISOString().split('T')[0]);
        setPaymentMode('Cash');
        setNote('');

        if (customerBalance && customerBalance > 0) {
          setAmount(customerBalance.toString());
        } else {
          setAmount('');
        }
      }
    }
  }, [isOpen, preselectedCustomerId, customerBalance, editingTransaction, prefillData]);

  if (!isOpen) return null;

  const formatMoney = (val) => {
    return `${currency || '₹'}${Number(val || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Get customer's unpaid credit bills
  const activeCustomerTxs = transactions
    .filter((t) => t.customerId === customerId && t.type === 'CREDIT')
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const handleQuickSettleFull = () => {
    if (customerBalance && customerBalance > 0) {
      setAmount(customerBalance.toString());
      setNote('Full Account Settlement');
      setTargetTxId('auto');
    }
  };

  const handleQuickSettleHalf = () => {
    if (customerBalance && customerBalance > 0) {
      const half = Math.round((customerBalance / 2) * 100) / 100;
      setAmount(half.toString());
      setNote('50% Partial Settlement');
    }
  };

  const handleSelectSpecificBill = (txId) => {
    setTargetTxId(txId);
    if (txId !== 'auto' && txId !== 'deposit') {
      const tx = transactions.find((t) => t.id === txId);
      if (tx) {
        const remaining = getTransactionRemainingDue(tx);
        setAmount(remaining.toString());
        setNote(`Settlement for bill of ${formatMoney(tx.amount)} on ${tx.date}`);
      }
    }
  };

  const handleModeSwitch = (mode) => {
    setEntryMode(mode);
    if (mode === 'deposit') {
      setTargetTxId('deposit');
      if (!note || note.toLowerCase().includes('settlement')) {
        setNote('General Deposit');
      }
    } else {
      setTargetTxId('auto');
      if (note === 'General Deposit') {
        setNote('');
      }
      if (customerBalance && customerBalance > 0 && (!amount || amount === '0')) {
        setAmount(customerBalance.toString());
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!customerId) {
      onShowToast('Please select a customer', 'error');
      return;
    }
    if (!numAmount || numAmount <= 0) {
      onShowToast(`Please enter a valid ${entryMode === 'deposit' ? 'deposit' : 'settlement'} amount`, 'error');
      return;
    }

    onSavePayment({
      id: editingTransaction ? editingTransaction.id : null,
      settlementId: editingTransaction ? editingTransaction.settlementId : null,
      customerId,
      isDeposit: entryMode === 'deposit',
      targetTxId: entryMode === 'deposit' ? 'deposit' : targetTxId,
      amount: numAmount,
      date,
      paymentMode,
      note: note.trim() || (entryMode === 'deposit' ? 'General Deposit' : 'Account Settlement'),
    });
  };

  const isDepositMode = entryMode === 'deposit';

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="modal-icon-badge payment">
              {isDepositMode ? (
                <Wallet size={15} strokeWidth={2.4} />
              ) : (
                <CheckCircle2 size={15} strokeWidth={2.4} />
              )}
            </div>
            <h2 className="modal-title">
              {editingTransaction
                ? isDepositMode
                  ? 'Edit Deposit'
                  : 'Edit Settlement'
                : isDepositMode
                ? 'Record Deposit'
                : 'Record Bill Settlement'}
            </h2>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="modal-form">
          <div className="modal-body">
            {/* Mode Switcher: Bill Settlement vs Rough Deposit */}
            {!editingTransaction && (
              <div className="form-group">
                <label className="form-label">Payment Category</label>
                <div className="payment-mode-tabs">
                  <button
                    type="button"
                    className={`payment-mode-tab ${!isDepositMode ? 'active' : ''}`}
                    onClick={() => handleModeSwitch('settle')}
                  >
                    <Receipt size={13} />
                    <span>Settle Bill(s) / Dues</span>
                  </button>
                  <button
                    type="button"
                    className={`payment-mode-tab deposit-tab ${isDepositMode ? 'active' : ''}`}
                    onClick={() => handleModeSwitch('deposit')}
                  >
                    <Wallet size={13} />
                    <span>Deposit / Advance</span>
                  </button>
                </div>
              </div>
            )}

            {/* Customer Account Selector */}
            <div className="form-group">
              <label className="form-label">
                <span>
                  Customer Account<span className="form-label-req">*</span>
                </span>
              </label>
              <select
                className="form-select"
                value={customerId}
                onChange={(e) => {
                  setCustomerId(e.target.value);
                  if (!isDepositMode) setTargetTxId('auto');
                }}
              >
                <option value="">-- Choose Customer --</option>
                {customers
                  .slice()
                  .sort((a, b) =>
                    (a.name || '').localeCompare(b.name || '', undefined, {
                      sensitivity: 'base',
                      numeric: true,
                    })
                  )
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.mobile ? `(${c.mobile})` : ''}
                    </option>
                  ))}
              </select>
            </div>

            {/* In Settle Mode: Associate with specific Credit Purchase Bill */}
            {!isDepositMode && activeCustomerTxs.length > 0 && (
              <div className="form-group">
                <label className="form-label">
                  <span>Attach Settlement To:</span>
                </label>
                <select
                  className="form-select"
                  value={targetTxId}
                  onChange={(e) => handleSelectSpecificBill(e.target.value)}
                >
                  <option value="auto">⚡ Auto-settle oldest unpaid bills (Account Level)</option>
                  {activeCustomerTxs.map((tx) => {
                    const remaining = getTransactionRemainingDue(tx);
                    return (
                      <option key={tx.id} value={tx.id}>
                        Bill on {tx.date}: {formatMoney(tx.amount)} (Remaining Due: {formatMoney(remaining)})
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            {/* In Deposit Mode: Clarification Banner */}
            {isDepositMode && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.55rem 0.75rem',
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  borderRadius: 'var(--radius-xs)',
                  fontSize: '0.75rem',
                  color: 'var(--accent-received)',
                }}
              >
                <Coins size={14} style={{ flexShrink: 0 }} />
                <span>
                  <b>Standalone Deposit:</b> Kept in customer's account balance as unallocated credit, not tied to any bill.
                </span>
              </div>
            )}

            {/* Quick Helper Buttons for Settle Mode */}
            {!isDepositMode && customerBalance > 0 && !editingTransaction && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 0.65rem',
                  background: 'var(--bg-surface-raised)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-xs)',
                  flexWrap: 'wrap',
                }}
              >
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Quick Settle:
                </span>
                <button
                  type="button"
                  className="btn btn-xs btn-payment"
                  onClick={handleQuickSettleFull}
                >
                  ⚡ Full {formatMoney(customerBalance)}
                </button>
                <button
                  type="button"
                  className="btn btn-xs btn-outline"
                  onClick={handleQuickSettleHalf}
                >
                  50% ({formatMoney(customerBalance / 2)})
                </button>
              </div>
            )}

            {/* Amount & Date */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  <span>
                    {isDepositMode ? 'Deposit Amount' : 'Settlement Amount'}
                    <span className="form-label-req">*</span>
                  </span>
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  step="any"
                  min="0.01"
                  className="form-input"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span>
                    Date<span className="form-label-req">*</span>
                  </span>
                </label>
                <input
                  type="date"
                  className="form-input"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Payment Mode */}
            <div className="form-group">
              <label className="form-label">Payment Mode</label>
              <select
                className="form-select"
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                <option value="Bank Transfer">Bank Transfer / NEFT</option>
                <option value="Cheque">Cheque</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Note / Reference */}
            <div className="form-group">
              <label className="form-label">Note / Reference (Optional)</label>
              <input
                type="text"
                className="form-input"
                placeholder={isDepositMode ? 'e.g. Rough deposit / advance, UPI #123' : 'e.g. Paid in cash, UPI ref #123'}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-payment">
              {editingTransaction
                ? isDepositMode
                  ? 'Update Deposit'
                  : 'Update Settlement'
                : isDepositMode
                ? 'Save Deposit'
                : 'Save Bill Settlement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
