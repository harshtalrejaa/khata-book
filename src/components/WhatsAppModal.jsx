import React, { useState, useEffect } from 'react';
import { MessageCircle, Copy, ExternalLink, X } from 'lucide-react';

export default function WhatsAppModal({
  isOpen,
  onClose,
  customer = null,
  balance = 0,
  transactions = [],
  shopName = 'My Khata Book',
  currency = '₹',
  onShowToast,
}) {
  const [messageText, setMessageText] = useState('');

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

  useEffect(() => {
    if (isOpen && customer) {
      const custTxs = transactions.filter((t) => t.customerId === customer.id);
      const creditTxs = custTxs.filter((t) => t.type === 'CREDIT');
      const sortedCredits = [...creditTxs].sort((a, b) => {
        const diff = new Date(b.date) - new Date(a.date);
        if (diff !== 0) return diff;
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      });
      const recentCredit = sortedCredits[0];

      let purchaseDetails = '';
      if (recentCredit) {
        const dateStr = formatDate(recentCredit.date);
        let itemsList = '';
        if (Array.isArray(recentCredit.items) && recentCredit.items.length > 0) {
          itemsList = recentCredit.items
            .map((i) => `• ${i.name || 'Item'} (x${i.qty || 1}): ${formatMoney(i.total)}`)
            .join('\n');
        }

        purchaseDetails = `\n\n*Last Purchase Date:* ${dateStr || 'N/A'}`;
        if (itemsList) {
          purchaseDetails += `\n*Recent Items:*\n${itemsList}`;
        }
      }

      const msg = `Hello ${customer.name},\nThis is a reminder from *${
        shopName || 'My Khata Book'
      }*.\n\n*Total Outstanding Balance:* *${formatMoney(
        balance
      )}*${purchaseDetails}\n\nPlease clear the pending dues at your earliest convenience. Thank you!`;

      setMessageText(msg);
    }
  }, [isOpen, customer, balance, transactions, shopName, currency]);

  if (!isOpen || !customer) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText).then(() => {
      onShowToast('Reminder message copied to clipboard!', 'success');
    });
  };

  const handleSendDirect = () => {
    let phone = customer.mobile ? customer.mobile.replace(/[^0-9]/g, '') : '';
    if (phone.length === 10) {
      phone = '91' + phone;
    }
    const text = encodeURIComponent(messageText);
    const waUrl = phone
      ? `https://wa.me/${phone}?text=${text}`
      : `https://wa.me/?text=${text}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="modal-icon-badge" style={{ background: '#25d366' }}>
              <MessageCircle size={15} />
            </div>
            <h2 className="modal-title">WhatsApp Payment Reminder</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Customer Contact</label>
            <input
              type="text"
              className="form-input"
              value={`${customer.name} ${
                customer.mobile ? `(${customer.mobile})` : '[No phone]'
              }`}
              readOnly
            />
          </div>

          <div className="form-group">
            <label className="form-label">Message Preview (Editable)</label>
            <textarea
              className="form-textarea"
              rows={6}
              style={{ minHeight: '130px' }}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={handleCopy}>
            <Copy size={16} />
            <span>Copy Text</span>
          </button>
          <button
            type="button"
            className="btn btn-payment"
            onClick={handleSendDirect}
          >
            <span>Open in WhatsApp</span>
            <ExternalLink size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
