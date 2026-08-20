import React, { useState, useEffect } from 'react';
import { CheckCircle2, X, Receipt } from 'lucide-react';
import { getTransactionRemainingDue } from '../services/storage';

export default function PaymentModal({
  isOpen,
  onClose,
  customers,
  transactions,
  preselectedCustomerId,
  customerBalance,
  editingTransaction,
  prefillData,
  currency,
  onSavePayment,
  onShowToast,
}) {
  const [customerId, setCustomerId] = useState('');
  const [targetTxId, setTargetTxId] = useState('auto'); // 'auto' or specific tx.id
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (editingTransaction) {
        // Editing existing payment or settlement
        setCustomerId(editingTransaction.customerId || '');
        setTargetTxId(editingTransaction.targetTxId || 'auto');
        setAmount(editingTransaction.amount ? editingTransaction.amount.toString() : '');
        setDate(editingTransaction.date || new Date().toISOString().split('T')[0]);
        setPaymentMode(editingTransaction.paymentMode || 'Cash');
        setNote(editingTransaction.note || '');
      } else if (prefillData) {
        // Opened with prefill (e.g., from clicking "Settle Bill" or "Settle Full Dues")
        setCustomerId(prefillData.customerId || preselectedCustomerId || '');
        setTargetTxId(prefillData.targetTxId || 'auto');
        setAmount(prefillData.amount ? prefillData.amount.toString() : '');
        setDate(new Date().toISOString().split('T')[0]);
        setPaymentMode('Cash');
        setNote(prefillData.note || '');
      } else {
        // Fresh payment
        const activeId = preselectedCustomerId || (customers.length > 0 ? customers[0].id : '');
        setCustomerId(activeId);
        setTargetTxId('auto');
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
  }, [isOpen, preselectedCustomerId, customerBalance, editingTransaction, prefillData, customers]);

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
    if (txId !== 'auto') {
      const tx = transactions.find((t) => t.id === txId);
      if (tx) {
        const remaining = getTransactionRemainingDue(tx);
        setAmount(remaining.toString());
        setNote(`Settlement for bill of ${formatMoney(tx.amount)} on ${tx.date}`);
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
      onShowToast('Please enter a valid settlement amount', 'error');
      return;
    }

    onSavePayment({
      id: editingTransaction ? editingTransaction.id : null,
      settlementId: editingTransaction ? editingTransaction.settlementId : null,
      customerId,
      targetTxId, // 'auto' or specific tx.id
      amount: numAmount,
      date,
      paymentMode,
      note: note.trim(),
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="modal-icon-badge payment">
              <CheckCircle2 size={15} strokeWidth={2.4} />
            </div>
            <h2 className="modal-title">
              {editingTransaction ? 'Edit Settlement' : 'Record Settlement'}
            </h2>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="modal-body">
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
                  setTargetTxId('auto');
                }}
                required
              >
                <option value="">-- Choose Customer --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.mobile ? `(${c.mobile})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Associate with specific Credit Purchase Bill */}
            {activeCustomerTxs.length > 0 && (
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

            {/* Quick Settle Helper Buttons */}
            {customerBalance > 0 && !editingTransaction && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.6rem 0.75rem',
                  background: 'var(--bg-surface-raised)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  flexWrap: 'wrap',
                }}
              >
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Quick Settle:
                </span>
                <button
                  type="button"
                  className="btn btn-sm btn-payment"
                  style={{ padding: '0.2rem 0.55rem', fontSize: '0.75rem' }}
                  onClick={handleQuickSettleFull}
                >
                  ⚡ Full {formatMoney(customerBalance)}
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  style={{ padding: '0.2rem 0.55rem', fontSize: '0.75rem' }}
                  onClick={handleQuickSettleHalf}
                >
                  50% ({formatMoney(customerBalance / 2)})
                </button>
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  <span>
                    Settlement Amount<span className="form-label-req">*</span>
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
                    Payment Date<span className="form-label-req">*</span>
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

            <div className="form-group">
              <label className="form-label">Payment Note / Reference (Optional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Paid in cash, UPI ref #123"
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
              {editingTransaction ? 'Update Settlement' : 'Save Settlement Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
