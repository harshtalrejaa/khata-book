import React from 'react';
import { Search, Phone, UserX, Plus } from 'lucide-react';

export default function CustomerSidebar({
  customersWithBalance,
  selectedCustomerId,
  onSelectCustomer,
  onOpenCreditModal,
  searchTerm,
  setSearchTerm,
  activeFilter,
  setActiveFilter,
  currency,
  isMobileHidden,
}) {
  const formatMoney = (amount) => {
    return `${currency}${Number(amount || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const filteredCustomers = customersWithBalance.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.mobile && c.mobile.includes(searchTerm));

    if (!matchesSearch) return false;
    if (activeFilter === 'due') return c.balance > 0;
    if (activeFilter === 'settled') return c.balance <= 0;
    return true;
  });

  return (
    <aside className={`customer-sidebar ${isMobileHidden ? 'hidden-mobile' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-title-row">
          <div className="sidebar-title">
            <span>Accounts</span>
            <span className="customer-count-badge">{filteredCustomers.length}</span>
          </div>
        </div>

        {/* Search input */}
        <div className="search-box">
          <Search className="search-icon" size={14} />
          <input
            type="text"
            className="search-input"
            placeholder="Search name or mobile..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              className="search-clear"
              onClick={() => setSearchTerm('')}
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="filter-tabs">
          <button
            className={`filter-tab ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            All ({customersWithBalance.length})
          </button>
          <button
            className={`filter-tab ${activeFilter === 'due' ? 'active' : ''}`}
            onClick={() => setActiveFilter('due')}
          >
            Dues ({customersWithBalance.filter((c) => c.balance > 0).length})
          </button>
          <button
            className={`filter-tab ${activeFilter === 'settled' ? 'active' : ''}`}
            onClick={() => setActiveFilter('settled')}
          >
            Settled ({customersWithBalance.filter((c) => c.balance <= 0).length})
          </button>
        </div>
      </div>

      {/* Customer List */}
      <div className="customer-list-wrap">
        {filteredCustomers.length === 0 ? (
          <div className="empty-list-state">
            <UserX className="empty-icon" size={36} />
            <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>No accounts found</p>
            <span style={{ fontSize: '0.75rem' }}>
              Create a credit purchase to automatically create accounts
            </span>
          </div>
        ) : (
          filteredCustomers.map((cust) => {
            const isSelected = cust.id === selectedCustomerId;
            const initial = cust.name.charAt(0).toUpperCase();
            const hasDue = cust.balance > 0;

            return (
              <div
                key={cust.id}
                className={`customer-card ${isSelected ? 'active' : ''}`}
                onClick={() => onSelectCustomer(cust.id)}
                role="button"
                tabIndex={0}
              >
                <div className="customer-card-header">
                  <div className="customer-card-name">
                    <div className="customer-avatar-initial">{initial}</div>
                    <span className="customer-name-text">{cust.name}</span>
                  </div>
                  <div
                    className={`customer-card-balance ${
                      hasDue ? 'has-due' : 'settled'
                    }`}
                  >
                    {formatMoney(cust.balance)}
                  </div>
                </div>
                <div className="customer-card-footer">
                  <div className="customer-card-phone">
                    <Phone size={11} />
                    <span>{cust.mobile || 'No phone'}</span>
                  </div>
                  <span
                    className={`customer-status-badge ${
                      hasDue ? 'due' : 'settled'
                    }`}
                  >
                    {hasDue ? 'Due' : 'Settled'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Mobile Floating Action Bar for rapid credit entry */}
      <div className="mobile-sidebar-footer">
        <button
          type="button"
          className="btn btn-credit btn-full-width"
          onClick={onOpenCreditModal}
        >
          <Plus size={16} strokeWidth={2.4} />
          <span>New Credit Purchase</span>
        </button>
      </div>
    </aside>
  );
}
