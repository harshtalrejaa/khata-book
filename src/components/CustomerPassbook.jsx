import React from 'react';
import {
  Users,
  ChevronLeft,
  Edit2,
  Trash2,
  MessageCircle,
  Printer,
  Plus,
  CheckCircle2,
  FileText,
  Phone,
  PhoneCall,
  Wallet,
} from 'lucide-react';
import {
  getTransactionSettledAmount,
  getTransactionRemainingDue,
} from '../services/storage';

export default function CustomerPassbook({
  customer = null,
  transactions = [],
  balance = 0,
  currency = '₹',
  onOpenCreditModal,
  onOpenPaymentModal,
  onOpenCustomerModal,
  onDeleteCustomer,
  onDeleteTransaction,
  onEditTransaction,
  onDeleteSettlement,
  onOpenWhatsApp,
  onBack,
}) {
  const formatMoney = (amount) => {
    return `${currency}${Number(amount || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // If no customer is selected (Hidden on mobile so CustomerSidebar takes 100% view)
  if (!customer) {
    return (
      <section className="ledger-view desktop-only-empty">
        <div className="empty-selection-view">
          <div className="empty-selection-art">
            <img src="/logo.png" alt="Khata Book Logo" className="empty-logo-img" />
          </div>
          <h2 className="empty-selection-title">Select an Account</h2>
          <p className="empty-selection-subtitle">
            Choose a customer from the left list to view their purchase
            history, or click <b>Credit Purchase</b> to record items.
          </p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-credit" onClick={onOpenCreditModal}>
              <Plus size={14} strokeWidth={2.4} />
              <span>New Credit Purchase</span>
            </button>
          </div>
        </div>
      </section>
    );
  }

  const initial = customer.name.charAt(0).toUpperCase();

  // Calculate total pending amount across all credit bills
  const totalBillsDue = transactions
    .filter((t) => t && t.type === 'CREDIT')
    .reduce((sum, tx) => sum + getTransactionRemainingDue(tx), 0);

  // Calculate total unallocated deposits
  const totalDeposits = transactions
    .filter((t) => t && t.type === 'PAYMENT')
    .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

  const netDue = Math.max(0, Math.round((totalBillsDue - totalDeposits) * 100) / 100);

  // Sort transactions in descending order by date (newest first)
  const sortedTxs = [...transactions].sort((a, b) => {
    const dateDiff = new Date(b.date) - new Date(a.date);
    if (dateDiff !== 0) return dateDiff;
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });

  return (
    <section className="ledger-view">
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Customer Header Banner */}
        <div className="ledger-header">
          <div className="ledger-customer-profile">
            <button
              className="btn btn-icon-only back-btn"
              onClick={onBack}
              title="Back to accounts"
              aria-label="Back"
            >
              <ChevronLeft size={18} strokeWidth={2.4} />
            </button>
            <div className="ledger-avatar">{initial}</div>
            <div className="ledger-cust-details">
              <div className="ledger-cust-name-row">
                <h1 className="ledger-cust-name">{customer.name}</h1>
                <button
                  className="btn btn-xs btn-icon-only"
                  onClick={() => onOpenCustomerModal(customer.id)}
                  title="Edit Customer Info"
                >
                  <Edit2 size={12} />
                </button>
              </div>
              <div className="ledger-cust-meta">
                {customer.mobile ? (
                  <a
                    href={`tel:${customer.mobile}`}
                    className="ledger-cust-phone-link"
                    title="Tap to call"
                  >
                    <PhoneCall size={11} />
                    <span>{customer.mobile}</span>
                  </a>
                ) : (
                  <span className="ledger-cust-phone">
                    <Phone size={11} />
                    <span>No phone</span>
                  </span>
                )}
                {customer.notes && <span className="ledger-cust-notes">• {customer.notes}</span>}
              </div>
            </div>
          </div>

          {/* Right Header Block: Balance Card & Actions */}
          <div className="ledger-header-right-block">
            <div className="ledger-header-top-row">
              {/* Balance Card: Total Bills Due */}
              <div className="ledger-balance-card">
                <div className="balance-col">
                  <span className="balance-title">Current Balance Due</span>
                  <span
                    className={`balance-amount ${totalBillsDue > 0 ? 'due' : 'settled'}`}
                  >
                    {formatMoney(totalBillsDue)}
                  </span>
                </div>
                {totalBillsDue > 0 ? (
                  <button
                    className="btn btn-xs btn-payment"
                    onClick={() =>
                      onOpenPaymentModal(
                        customer.id,
                        netDue > 0 ? netDue : totalBillsDue,
                        `Full Account Settlement for ${customer.name}`,
                        'auto',
                        'settle'
                      )
                    }
                    title={`Settle dues`}
                  >
                    <CheckCircle2 size={13} strokeWidth={2.4} />
                    <span>
                      {totalDeposits > 0
                        ? `Settle Net (${formatMoney(netDue)})`
                        : `Settle Full (${formatMoney(totalBillsDue)})`}
                    </span>
                  </button>
                ) : (
                  <span
                    className="customer-status-badge settled"
                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', fontWeight: 700 }}
                  >
                    ✓ Fully Settled
                  </span>
                )}
              </div>

              {/* Standalone Deposit Pill beside Current Balance Due */}
              {totalDeposits > 0 && (
                <div
                  className="ledger-deposit-pill-card"
                  title="Total unallocated deposit in account"
                >
                  <div className="deposit-pill-icon">
                    <Wallet size={12} strokeWidth={2.4} />
                  </div>
                  <div className="deposit-pill-col">
                    <span className="deposit-pill-label">Deposit Balance</span>
                    <span className="deposit-pill-amount">+{formatMoney(totalDeposits)}</span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="ledger-actions">
                <button
                  className="btn btn-secondary btn-xs"
                  onClick={onOpenWhatsApp}
                  title="Send WhatsApp Reminder"
                >
                  <MessageCircle size={13} />
                  <span>WhatsApp</span>
                </button>
                <button
                  className="btn btn-outline btn-xs"
                  onClick={() => window.print()}
                  title="Print Statement"
                >
                  <Printer size={13} />
                  <span>Print</span>
                </button>
                <button
                  className="btn btn-danger-outline btn-xs"
                  onClick={() => onDeleteCustomer(customer.id)}
                  title="Delete customer"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction Timeline */}
        <div className="ledger-body">
          {sortedTxs.length === 0 ? (
            <div className="empty-list-state" style={{ padding: '2rem 1rem' }}>
              <FileText className="empty-icon" size={36} />
              <p style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                No transactions yet
              </p>
              <span
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                }}
              >
                Click <b>Credit Purchase</b> or <b>Deposit</b> below to add entries.
              </span>
            </div>
          ) : (
            <>
              <div className="timeline-section-title">
                <span>Transaction History ({sortedTxs.length} entries)</span>
              </div>
              {sortedTxs.map((tx) => {
                const isCredit = tx.type === 'CREDIT';
                const isDeposit = tx.type === 'PAYMENT';
                const settledAmount = isCredit ? getTransactionSettledAmount(tx) : 0;
                const remainingDue = isCredit ? getTransactionRemainingDue(tx) : 0;
                const isFullyPaid = isCredit && remainingDue === 0 && tx.amount > 0;
                const isPartiallyPaid = isCredit && settledAmount > 0 && remainingDue > 0;

                const badgeClass = isCredit ? 'credit' : 'payment';
                const badgeLabel = isCredit
                  ? 'Credit Bill'
                  : `Deposit (${tx.paymentMode || 'Cash'})`;

                return (
                  <div
                    key={tx.id}
                    className={`tx-card ${
                      isCredit
                        ? isFullyPaid
                          ? 'tx-credit settled-card'
                          : 'tx-credit'
                        : 'tx-payment tx-deposit-card'
                    }`}
                  >
                    <div className="tx-card-top">
                      <div className="tx-type-info">
                        <span className={`tx-badge ${badgeClass}`}>
                          {badgeLabel}
                        </span>
                        <span className="tx-date-time">
                          {formatDate(tx.date)}
                        </span>
                        {/* Status Badges for Credit Purchase */}
                        {isCredit && (
                          <>
                            {isFullyPaid && (
                              <span className="customer-status-badge settled">
                                ✓ Paid
                              </span>
                            )}
                            {isPartiallyPaid && (
                              <span
                                className="customer-status-badge"
                                style={{
                                  background: 'rgba(234, 179, 8, 0.15)',
                                  color: '#eab308',
                                  border: '1px solid rgba(234, 179, 8, 0.3)',
                                  fontSize: '0.7rem',
                                }}
                              >
                                Due: {formatMoney(remainingDue)}
                              </span>
                            )}
                            {!isFullyPaid && !isPartiallyPaid && (
                              <span className="customer-status-badge due" style={{ fontSize: '0.7rem' }}>
                                Due: {formatMoney(tx.amount)}
                              </span>
                            )}
                          </>
                        )}
                        {/* Standalone Deposit Tag */}
                        {isDeposit && (
                          <span
                            className="customer-status-badge advance"
                            style={{ fontSize: '0.68rem', padding: '0.08rem 0.35rem' }}
                          >
                            💰 Deposit
                          </span>
                        )}
                      </div>

                      <div className="tx-amount-col">
                        <span className={`tx-amount ${isCredit ? 'credit' : 'payment'}`}>
                          {isCredit ? '+' : '-'}{formatMoney(tx.amount)}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          {isCredit && remainingDue > 0 && (
                            <button
                              className="btn btn-xs btn-payment"
                              style={{
                                padding: '0.2rem 0.5rem',
                                fontSize: '0.7rem',
                                gap: '0.2rem',
                              }}
                              onClick={() =>
                                onOpenPaymentModal(
                                  customer.id,
                                  remainingDue,
                                  `Settlement for bill on ${formatDate(tx.date)} (${formatMoney(remainingDue)})`,
                                  tx.id,
                                  'settle'
                                )
                              }
                              title={`Settle remaining: ${formatMoney(remainingDue)}`}
                            >
                              <CheckCircle2 size={11} strokeWidth={2.4} />
                              <span>Settle ({formatMoney(remainingDue)})</span>
                            </button>
                          )}
                          <button
                            className="tx-action-btn edit"
                            onClick={() => onEditTransaction(tx)}
                            title="Edit"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            className="tx-action-btn delete"
                            onClick={() => onDeleteTransaction(tx.id)}
                            title="Delete"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Items table if credit entry */}
                    {isCredit && Array.isArray(tx.items) && tx.items.length > 0 && (
                      <div className="table-responsive">
                        <table className="tx-items-table">
                          <thead>
                            <tr>
                              <th>Item Name</th>
                              <th style={{ width: '40px', textAlign: 'right' }}>
                                Qty
                              </th>
                              <th style={{ width: '60px', textAlign: 'right' }}>
                                Price
                              </th>
                              <th style={{ width: '65px', textAlign: 'right' }}>
                                Disc ({currency})
                              </th>
                              <th style={{ width: '70px', textAlign: 'right' }}>
                                Total
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {tx.items.map((item, idx) => {
                              const disc = Number(item.discount || 0);
                              const subtotal = (Number(item.qty) || 1) * (Number(item.price) || 0);
                              const discAmount = Math.min(subtotal, disc);
                              const calcTotal = item.total !== undefined ? item.total : Math.max(0, subtotal - discAmount);

                              return (
                                <tr key={idx}>
                                  <td>
                                    <b>{item.name || 'Item'}</b>
                                  </td>
                                  <td className="td-num">{item.qty || 1}</td>
                                  <td className="td-num">
                                    {formatMoney(item.price)}
                                  </td>
                                  <td className="td-num">
                                    {disc > 0 ? (
                                      <span className="item-disc-badge">-{formatMoney(disc)}</span>
                                    ) : (
                                      <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>-</span>
                                    )}
                                  </td>
                                  <td className="td-num">
                                    <b>{formatMoney(calcTotal)}</b>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Note if present */}
                    {tx.note && (
                      <div className="tx-note-box">
                        <FileText size={12} />
                        <span>{tx.note}</span>
                      </div>
                    )}

                    {/* Embedded Associated Settlements / Payments List for Credit Bills */}
                    {isCredit && Array.isArray(tx.settlements) && tx.settlements.length > 0 && (
                      <div className="tx-settlements-box">
                        <div className="tx-settlements-header">
                          <CheckCircle2 size={11} strokeWidth={2.4} />
                          <span>Payments Received ({tx.settlements.length}):</span>
                        </div>
                        <div className="tx-settlements-list">
                          {tx.settlements.map((stl) => (
                            <div key={stl.id} className="tx-settlement-row">
                              <div className="stl-info">
                                <span className="stl-date">{formatDate(stl.date)}</span>
                                <span className="stl-mode-badge">{stl.paymentMode || 'Cash'}</span>
                                {stl.note && <span className="stl-note">"{stl.note}"</span>}
                              </div>
                              <div className="stl-amount-col">
                                <span className="stl-amount">+{formatMoney(stl.amount)}</span>
                                <button
                                  className="tx-action-btn delete"
                                  onClick={() => onDeleteSettlement(tx.id, stl.id)}
                                  title="Delete payment"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Bottom Action Bar */}
        <div className="ledger-bottom-bar">
          <div className="bottom-bar-left">
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Actions:
            </span>
          </div>
          <div className="bottom-bar-actions">
            <button
              className="btn btn-secondary"
              onClick={() => onOpenPaymentModal(customer.id, null, 'General Deposit', 'deposit', 'deposit')}
              title="Record standalone rough deposit or advance payment (not tied to any bill)"
            >
              <Wallet size={14} strokeWidth={2.4} />
              <span>Deposit</span>
            </button>
            <button
              className="btn btn-payment"
              onClick={() => onOpenPaymentModal(customer.id, balance > 0 ? balance : null, 'General Account Settlement', 'auto', 'settle')}
              title="Record bill settlement"
            >
              <CheckCircle2 size={14} strokeWidth={2.4} />
              <span>Record Settlement</span>
            </button>
            <button
              className="btn btn-credit"
              onClick={() => onOpenCreditModal(customer.id)}
            >
              <Plus size={14} strokeWidth={2.4} />
              <span>Credit Purchase</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
