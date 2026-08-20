import React from 'react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

export default function Toast({ toasts }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type || 'info'}`}>
          {t.type === 'success' && <CheckCircle2 size={16} color="#10b981" />}
          {t.type === 'error' && <AlertCircle size={16} color="#ef4444" />}
          {t.type === 'info' && <Info size={16} color="#6366f1" />}
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}
