import React, { useState, useEffect } from 'react';
import { Settings, Download, Upload, Cloud, RefreshCw, X } from 'lucide-react';

export default function SettingsModal({
  isOpen,
  onClose,
  settings,
  cloudStatus,
  onSaveSettings,
  onExportBackup,
  onImportBackup,
  onSyncAllToCloud,
  onResetDemoData,
  onClearAllData,
}) {
  const [shopName, setShopName] = useState('');
  const [currency, setCurrency] = useState('₹');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShopName(settings.shopName || 'My Khata Book');
      setCurrency(settings.currency || '₹');
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveSettings({
      ...settings,
      shopName: shopName.trim() || 'My Khata Book',
      currency,
    });
    onClose();
  };

  const handleCloudUpload = async () => {
    setIsUploading(true);
    await onSyncAllToCloud();
    setIsUploading(false);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="modal-icon-badge primary">
              <Settings size={15} />
            </div>
            <h2 className="modal-title">Settings & Cloud Sync</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Shop / Business Name</label>
            <input
              type="text"
              className="form-input"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="e.g. My Grocery Store"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Currency Symbol</label>
            <select
              className="form-select"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              <option value="₹">₹ (Indian Rupee - INR)</option>
              <option value="$">$ (US Dollar - USD)</option>
              <option value="€">€ (Euro - EUR)</option>
              <option value="£">£ (British Pound - GBP)</option>
              <option value="AED">AED (UAE Dirham)</option>
              <option value="Rs">Rs (Rupee)</option>
            </select>
          </div>

          {/* Firebase Cloud Sync Section */}
          <div
            style={{
              borderTop: '1px solid var(--border-subtle)',
              paddingTop: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.65rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label
                className="form-label"
                style={{ fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}
              >
                Firebase Cloud Database
              </label>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: cloudStatus === 'synced' ? 'var(--accent-received)' : '#eab308',
                }}
              >
                {cloudStatus === 'synced' ? '● Connected (Live)' : '● Connecting...'}
              </span>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Project: <b>credit-book-cd673</b> • Realtime Cloud Firestore sync enabled.
            </span>
            <div>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={handleCloudUpload}
                disabled={isUploading}
                style={{ gap: '0.4rem' }}
              >
                {isUploading ? <RefreshCw size={14} className="spin-icon" /> : <Cloud size={14} />}
                <span>{isUploading ? 'Uploading to Firebase...' : 'Upload All Local Data to Cloud'}</span>
              </button>
            </div>
          </div>

          {/* JSON Backup & Restore */}
          <div
            style={{
              borderTop: '1px solid var(--border-subtle)',
              paddingTop: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
          >
            <label
              className="form-label"
              style={{ fontWeight: 700, color: 'var(--text-primary)' }}
            >
              Offline File Backup
            </label>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={onExportBackup}
              >
                <Download size={14} />
                <span>Download JSON Backup</span>
              </button>
              <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer' }}>
                <Upload size={14} />
                <span>Restore Backup</span>
                <input
                  type="file"
                  accept=".json"
                  style={{ display: 'none' }}
                  onChange={onImportBackup}
                />
              </label>
            </div>
          </div>

          <div
            style={{
              borderTop: '1px solid var(--border-subtle)',
              paddingTop: '1rem',
              display: 'flex',
              gap: '0.75rem',
              flexWrap: 'wrap',
            }}
          >
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={onResetDemoData}
            >
              Load Demo Records
            </button>
            <button
              type="button"
              className="btn btn-danger-outline btn-sm"
              onClick={onClearAllData}
            >
              Clear All Data
            </button>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSave}>
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
