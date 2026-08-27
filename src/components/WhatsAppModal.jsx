import React, { useState, useEffect } from 'react';
import { MessageCircle, Copy, ExternalLink, X } from 'lucide-react';

export default function WhatsAppModal({
  isOpen,
  onClose,
  customer,
  balance,
  transactions,
  shopName,
  currency,
  onShowToast,
}) {
  const [messageText, setMessageText] = useState('');

  const formatMoney = (amount) => {
    return `${currency}${Number(amount || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  useEffect(() => {
    if (isOpen && customer) {
      const custTxs = transactions.filter((t) => t.customerId === customer.id);
      const recentCredit = [...custTxs]
        .reverse()
        .find((t) => t.type === 'CREDIT');

      let itemsSnippet = '';
      if (
        recentCredit &&
        Array.isArray(recentCredit.items) &&
        recentCredit.items.length > 0
      ) {
        itemsSnippet =
          '\nRecent items purchased:\n' +
          recentCredit.items
            .map((i) => {
              const disc = Number(i.discount || i.discountPercent || 0);
              const discText = disc > 0 ? ` (-${disc}% off)` : '';
              return `• ${i.name} (x${i.qty || 1}${discText}): ${formatMoney(i.total)}`;
            })
            .join('\n');
      }

      const msg = `Hello ${customer.name},\nThis is a reminder from *${
        shopName || 'My Khata Book'
      }*.\nYour current outstanding credit balance is *${formatMoney(
        balance
      )}*.${itemsSnippet}\n\nPlease clear the pending dues at your earliest convenience. Thank you!`;

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
