import React, { useState, useEffect, useRef } from 'react';
import { Plus, X, Trash2, ShoppingBag, User, Percent } from 'lucide-react';

export default function CreditPurchaseModal({
  isOpen,
  onClose,
  customers = [],
  preselectedCustomerId = null,
  editingTransaction = null,
  currency = '₹',
  onSaveCredit,
  onShowToast,
}) {
  const [customerName, setCustomerName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  const [items, setItems] = useState([
    { name: '', qty: 1, price: '', discount: '', total: 0 },
  ]);

  // Suggestions state for customer name auto-match
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef(null);

  const formatMoney = (val) => {
    return `${currency || '₹'}${Number(val || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  useEffect(() => {
    if (isOpen) {
      if (editingTransaction) {
        // Populate for editing
        const cust = customers.find((c) => c.id === editingTransaction.customerId);
        setCustomerName(cust ? cust.name : '');
        setMobileNumber(cust ? cust.mobile || '' : '');
        setDate(editingTransaction.date || new Date().toISOString().split('T')[0]);
        setNote(editingTransaction.note || '');

        if (
          Array.isArray(editingTransaction.items) &&
          editingTransaction.items.length > 0
        ) {
          setItems(
            editingTransaction.items.map((it) => {
              const q = it.qty !== undefined ? it.qty : 1;
              const p = it.price !== undefined ? it.price : '';
              const d = it.discount !== undefined ? it.discount : (it.discountPercent !== undefined ? it.discountPercent : '');
              const subtotal = (Number(q) || 0) * (Number(p) || 0);
              const discAmount = subtotal * ((Number(d) || 0) / 100);
              const calculatedTotal = Math.max(0, Math.round((subtotal - discAmount) * 100) / 100);

              return {
                name: it.name || '',
                qty: q,
                price: p,
                discount: d,
                total: it.total !== undefined ? it.total : calculatedTotal,
              };
            })
          );
        } else {
          setItems([
            {
              name: 'Item / Service',
              qty: 1,
              price: editingTransaction.amount || 0,
              discount: '',
              total: editingTransaction.amount || 0,
            },
          ]);
        }
      } else if (preselectedCustomerId) {
        // Preselect customer
        const cust = customers.find((c) => c.id === preselectedCustomerId);
        if (cust) {
          setCustomerName(cust.name);
          setMobileNumber(cust.mobile || '');
        } else {
          setCustomerName('');
          setMobileNumber('');
        }
        setDate(new Date().toISOString().split('T')[0]);
        setNote('');
        setItems([{ name: '', qty: 1, price: '', discount: '', total: 0 }]);
      } else {
        // Fresh entry
        setCustomerName('');
        setMobileNumber('');
        setDate(new Date().toISOString().split('T')[0]);
        setNote('');
        setItems([{ name: '', qty: 1, price: '', discount: '', total: 0 }]);
      }
      setShowSuggestions(false);
    }
  }, [isOpen, preselectedCustomerId, editingTransaction, customers]);

  // Handle outside click for suggestions dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen) return null;

  // Name change and autocomplete search
  const handleNameChange = (e) => {
    const val = e.target.value;
    setCustomerName(val);

    if (val.trim().length > 0) {
      const filtered = customers.filter((c) =>
        c.name.toLowerCase().includes(val.toLowerCase().trim())
      );
      setSuggestions(filtered);
      setShowSuggestions(true);

      // If exact match, auto-populate mobile
      const exact = customers.find(
        (c) => c.name.toLowerCase().trim() === val.toLowerCase().trim()
      );
      if (exact && exact.mobile) {
        setMobileNumber(exact.mobile);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectCustomerSuggestion = (cust) => {
    setCustomerName(cust.name);
    setMobileNumber(cust.mobile || '');
    setShowSuggestions(false);
  };

  // Item rows management
  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const updated = [...prev];
      const target = { ...updated[index] };

      if (field === 'name') {
        target.name = value;
      } else if (field === 'qty') {
        target.qty = value === '' ? '' : Math.max(0, parseFloat(value) || 0);
      } else if (field === 'price') {
        target.price = value === '' ? '' : Math.max(0, parseFloat(value) || 0);
      } else if (field === 'discount') {
        target.discount = value === '' ? '' : Math.min(100, Math.max(0, parseFloat(value) || 0));
      }

      const q = typeof target.qty === 'number' ? target.qty : 0;
      const p = typeof target.price === 'number' ? target.price : 0;
      const d = typeof target.discount === 'number' ? target.discount : 0;
      const subtotal = q * p;
      const discAmount = subtotal * (d / 100);
      target.total = Math.max(0, Math.round((subtotal - discAmount) * 100) / 100);

      updated[index] = target;
      return updated;
    });
  };

  const handleAddItemRow = () => {
    setItems((prev) => [...prev, { name: '', qty: 1, price: '', discount: '', total: 0 }]);
  };

  const handleDeleteItemRow = (index) => {
    if (items.length <= 1) {
      setItems([{ name: '', qty: 1, price: '', discount: '', total: 0 }]);
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Grand Total Calculation
  const grandTotal = Array.isArray(items)
    ? items.reduce((sum, i) => {
        const itemTotal = Number(i.total) || 0;
        return sum + (itemTotal > 0 ? itemTotal : 0);
      }, 0)
    : 0;

  const handleSubmit = (e) => {
    e.preventDefault();

    const cleanName = customerName.trim();
    if (!cleanName) {
      onShowToast('Customer name is required', 'error');
      return;
    }

    // Filter valid items
    const validItems = items
      .filter((i) => i.name.trim() || Number(i.price) > 0)
      .map((i) => {
        const qty = Number(i.qty) > 0 ? Number(i.qty) : 1;
        const price = Number(i.price) >= 0 ? Number(i.price) : 0;
        const discount = Number(i.discount) > 0 ? Math.min(100, Number(i.discount)) : 0;
        const subtotal = qty * price;
        const discAmount = subtotal * (discount / 100);
        const total = Math.max(0, Math.round((subtotal - discAmount) * 100) / 100);

        return {
          name: i.name.trim() || 'Item',
          qty,
          price,
          discount,
          total,
        };
      });

    if (validItems.length === 0 || grandTotal <= 0) {
      onShowToast('Please add at least one item with a valid price', 'error');
      return;
    }

    onSaveCredit({
      id: editingTransaction ? editingTransaction.id : null,
      customerName: cleanName,
      mobileNumber: mobileNumber.trim(),
      date,
      items: validItems,
      amount: grandTotal,
      note: note.trim(),
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container modal-lg">
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="modal-icon-badge credit">
              <Plus size={15} strokeWidth={2.4} />
            </div>
            <h2 className="modal-title">
              {editingTransaction ? 'Edit Credit Purchase' : 'New Credit Purchase'}
            </h2>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="modal-body">
            {/* Customer Name & Mobile Row */}
            <div className="form-row" style={{ position: 'relative' }}>
              <div className="form-group" style={{ position: 'relative' }} ref={suggestionsRef}>
                <label className="form-label">
                  <span>
                    Customer Name<span className="form-label-req">*</span>
                  </span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Type customer's name..."
                    value={customerName}
                    onChange={handleNameChange}
                    onFocus={() => setShowSuggestions(true)}
                    autoFocus
                    required
                  />
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="suggestions-dropdown">
                      <div className="suggestions-header">
                        Existing Customers
                      </div>
                      {suggestions.map((cust) => (
                        <div
                          key={cust.id}
                          className="suggestion-item"
                          onMouseDown={() => handleSelectCustomerSuggestion(cust)}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <User size={13} color="var(--brand-primary-light)" />
                            <span style={{ fontWeight: 600 }}>{cust.name}</span>
                          </div>
                          {cust.mobile && (
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                              {cust.mobile}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <span className="form-help-text">
                  Auto-adds to account or creates a new one
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span>Mobile Number</span>
                </label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="e.g. 9876543210"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                />
                <span className="form-help-text">
                  Used for WhatsApp reminders
                </span>
              </div>
            </div>

            {/* Date of Purchase */}
            <div className="form-group">
              <label className="form-label">
                <span>
                  Date of Purchase<span className="form-label-req">*</span>
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

            {/* Dynamic Multi-Item Cards / Table */}
            <div className="items-entry-container">
              <div className="items-header-bar">
                <span className="items-header-title">
                  <ShoppingBag size={14} />
                  Purchased Items & Prices ({items.length})
                </span>
              </div>

              <div className="items-list-scroll">
                {items.map((item, index) => (
                  <div key={index} className="item-card-row">
                    <div className="item-card-name-col">
                      <label className="item-mini-label">Item #{index + 1} Name</label>
                      <input
                        type="text"
                        className="form-input item-input-name"
                        placeholder="e.g. Rice, Sugar, Oil"
                        value={item.name}
                        onChange={(e) =>
                          handleItemChange(index, 'name', e.target.value)
                        }
                        required
                      />
                    </div>
                    <div className="item-card-details-row">
                      <div className="item-sub-col">
                        <label className="item-mini-label">Qty</label>
                        <input
                          type="number"
                          inputMode="decimal"
                          className="form-input"
                          placeholder="Qty"
                          min="0.01"
                          step="any"
                          value={item.qty}
                          onChange={(e) =>
                            handleItemChange(index, 'qty', e.target.value)
                          }
                          required
                        />
                      </div>
                      <div className="item-sub-col">
                        <label className="item-mini-label">Price ({currency})</label>
                        <input
                          type="number"
                          inputMode="decimal"
                          className="form-input"
                          placeholder="0.00"
                          min="0"
                          step="any"
                          value={item.price}
                          onChange={(e) =>
                            handleItemChange(index, 'price', e.target.value)
                          }
                          required
                        />
                      </div>
                      <div className="item-sub-col item-disc-col">
                        <label className="item-mini-label">Disc %</label>
                        <input
                          type="number"
                          inputMode="decimal"
                          className="form-input"
                          placeholder="0%"
                          min="0"
                          max="100"
                          step="any"
                          value={item.discount}
                          onChange={(e) =>
                            handleItemChange(index, 'discount', e.target.value)
                          }
                          title="Discount percentage (e.g. 5 for 5%)"
                        />
                      </div>
                      <div className="item-sub-col item-total-sub-col">
                        <label className="item-mini-label">Total</label>
                        <div className="item-calc-total-badge">
                          {formatMoney(item.total)}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="item-delete-btn"
                        onClick={() => handleDeleteItemRow(index)}
                        title="Remove item"
                        aria-label="Remove item"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Add Item Button directly below the items */}
                <button
                  type="button"
                  className="btn-add-item-row"
                  onClick={handleAddItemRow}
                >
                  <Plus size={13} strokeWidth={2.4} />
                  <span>Add Another Item</span>
                </button>
              </div>

              {/* Grand Total */}
              <div className="items-grand-total-row">
                <span className="grand-total-label">
                  Total Bill Amount:
                </span>
                <span className="grand-total-val">
                  {formatMoney(grandTotal)}
                </span>
              </div>
            </div>

            {/* Remarks / Notes */}
            <div className="form-group">
              <label className="form-label">Notes / Remarks (Optional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Bill #104, evening purchase, emergency ration"
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
            <button type="submit" className="btn btn-credit">
              {editingTransaction ? 'Update Purchase' : 'Save Credit Purchase'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
