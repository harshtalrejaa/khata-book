import React, { useState, useEffect } from 'react';
import { UserPlus, X } from 'lucide-react';

export default function CustomerModal({
  isOpen,
  onClose,
  editingCustomer,
  onSaveCustomer,
  onShowToast,
}) {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (editingCustomer) {
        setName(editingCustomer.name || '');
        setMobile(editingCustomer.mobile || '');
        setNotes(editingCustomer.notes || '');
      } else {
        setName('');
        setMobile('');
        setNotes('');
      }
    }
  }, [isOpen, editingCustomer]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      onShowToast('Customer name is required', 'error');
      return;
    }

    onSaveCustomer({
      id: editingCustomer ? editingCustomer.id : null,
      name: cleanName,
      mobile: mobile.trim(),
      notes: notes.trim(),
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="modal-icon-badge primary">
              <UserPlus size={15} />
            </div>
            <h2 className="modal-title">
              {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
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
                  Customer Name<span className="form-label-req">*</span>
                </span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Ramesh Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Mobile Number</label>
              <input
                type="tel"
                className="form-input"
                placeholder="e.g. 9876543210"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Address / Notes (Optional)</label>
              <textarea
                className="form-textarea"
                placeholder="e.g. Flat 402 / Regular morning customer"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
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
            <button type="submit" className="btn btn-primary">
              {editingCustomer ? 'Update Customer' : 'Save Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
