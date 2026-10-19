import { createContext, useContext, useState, useCallback } from 'react';

const AdminToastContext = createContext(null);

export function AdminToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((type = 'info', title, message) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, title, message }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <AdminToastContext.Provider value={{ showToast }}>
      {children}
      <div className="admin-toast-container">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`admin-toast admin-toast--${toast.type}`}
            onClick={() => removeToast(toast.id)}
            style={{ cursor: 'pointer' }}
          >
            <div>
              {toast.type === 'success' && '✓'}
              {toast.type === 'error' && '✕'}
              {toast.type === 'info' && 'ℹ'}
            </div>
            <div>
              <div className="admin-toast__title">{toast.title}</div>
              <div className="admin-toast__message">{toast.message}</div>
            </div>
          </div>
        ))}
      </div>
    </AdminToastContext.Provider>
  );
}

export function useAdminToast() {
  const context = useContext(AdminToastContext);
  if (!context) {
    throw new Error('useAdminToast must be used within an AdminToastProvider');
  }
  return context;
}
