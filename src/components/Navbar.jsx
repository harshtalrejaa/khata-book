import React from 'react';
import { BookOpen, Plus, Sun, Moon, Settings, Cloud, CloudOff, RefreshCw } from 'lucide-react';

export default function Navbar({
  shopName,
  currency,
  totalDue,
  theme,
  cloudStatus = 'synced',
  onToggleTheme,
  onOpenCreditModal,
  onOpenSettings,
  onGoHome,
}) {
  const formatMoney = (amount) => {
    return `${currency}${Number(amount || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <header className="header-nav">
      <div
        className="brand"
        onClick={onGoHome}
        style={{ cursor: 'pointer' }}
        title="Go to main home view"
      >
        <div className="brand-icon-box">
          <BookOpen size={16} strokeWidth={2.2} />
        </div>
        <div className="brand-info">
          <span className="brand-title">{shopName || 'My Khata Book'}</span>
          <span className="brand-tagline">Credit Purchase Ledger</span>
        </div>
      </div>

      <div className="header-total-pill" title="Total Outstanding Credit">
        <span className="header-total-label">Total Dues:</span>
        <span className="header-total-val">{formatMoney(totalDue)}</span>
      </div>

      <div className="header-actions">
        {/* Firebase Cloud Sync Status Badge */}
        <div
          className="cloud-status-badge"
          title={
            cloudStatus === 'synced'
              ? 'Firebase Cloud: Real-time Synced'
              : cloudStatus === 'syncing'
              ? 'Firebase Cloud: Synchronizing...'
              : 'Firebase Cloud: Offline Mode'
          }
        >
          {cloudStatus === 'synced' ? (
            <Cloud size={13} style={{ color: 'var(--accent-received)' }} />
          ) : cloudStatus === 'syncing' ? (
            <RefreshCw size={13} className="spin-icon" style={{ color: '#eab308' }} />
          ) : (
            <CloudOff size={13} style={{ color: 'var(--text-muted)' }} />
          )}
          <span className="cloud-status-text">
            {cloudStatus === 'synced'
              ? 'Synced'
              : cloudStatus === 'syncing'
              ? 'Syncing'
              : 'Offline'}
          </span>
        </div>

        <button
          className="btn btn-credit nav-credit-btn"
          onClick={onOpenCreditModal}
          title="Create Credit Purchase (Shortcut: Alt+N)"
        >
          <Plus size={15} strokeWidth={2.4} />
          <span className="nav-credit-label">Credit Purchase</span>
        </button>

        <button
          className="btn btn-icon-only btn-nav-icon"
          onClick={onToggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        <button
          className="btn btn-icon-only btn-nav-icon"
          onClick={onOpenSettings}
          title="Settings & Cloud Backup"
          aria-label="Settings"
        >
          <Settings size={15} />
        </button>
      </div>
    </header>
  );
}
