import { createContext, useCallback, useContext, useRef, useState } from 'react';
import Icon from './Icon';

const ToastContext = createContext(() => {});

/**
 * הודעות קצרות אחרי פעולה מוצלחת ("הרישום נשמר").
 * האזור מוכרז לקורא מסך (aria-live), וההודעה נעלמת לבד אחרי כמה שניות.
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), []);

  const show = useCallback((message, type = 'success') => {
    const id = nextId.current++;
    setToasts((list) => [...list, { id, message, type }]);
    setTimeout(() => dismiss(id), 5000);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="toasts" aria-live="polite" aria-atomic="false">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <Icon name={toast.type === 'success' ? 'check' : 'info'} size={18} />
            <span>{toast.message}</span>
            <button type="button" className="icon-btn" onClick={() => dismiss(toast.id)} aria-label="סגירת ההודעה">
              <Icon name="x" size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
