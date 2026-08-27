import React from 'react';
import { BookOpen, Plus, Sun, Moon, Settings, Cloud, CloudOff, RefreshCw } from 'lucide-react';

export default function Navbar({
  shopName,
  currency,
  totalDue,
  theme,
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
          <BookOpen size={22} strokeWidth={2.4} />
        </div>
        <div className="brand-info">
          <span className="brand-title">{shopName || 'My Khata Book'}</span>
          <span className="brand-tagline">Credit Purchase Ledger</span>
        </div>
      </div>

      <div className="header-total-pill" title="Total Outstanding Credit (You will receive)">
        <span className="header-total-label">Total Outstanding Dues:</span>
        <span className="header-total-val">{formatMoney(totalDue)}</span>
      </div>

      <div className="header-actions">
        <button
          className="btn btn-credit"
          onClick={onOpenCreditModal}
          title="Create Credit Purchase (Shortcut: Alt+N)"
        >
          <Plus size={15} strokeWidth={2.4} />
          <span>Credit Purchase</span>
        </button>

        <button
          className="btn btn-icon-only"
          onClick={onToggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
        >
          {theme === 'light' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button
          className="btn btn-icon-only"
          onClick={onOpenSettings}
          title="Settings & Backup"
        >
          <Settings size={18} />
        </button>
      </div>
    </header>
  );
}
