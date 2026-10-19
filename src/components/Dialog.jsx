import { useEffect, useId, useRef, useState } from 'react';
import Icon from './Icon';
import { ApiErrorAlert } from './Feedback';
import { toApiError } from '../api/client';

/**
 * חלון בתוך הדף, מבוסס על האלמנט dialog של הדפדפן:
 * המיקוד נשאר בתוך החלון, Esc סוגר, ובסגירה המיקוד חוזר לכפתור שפתח אותו.
 */
export function Dialog({ open, title, onClose, children, footer, size = 'md' }) {
  const ref = useRef(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={`dialog dialog-${size}`}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        // לחיצה על הרקע (מחוץ לתיבה) סוגרת
        if (event.target === ref.current) onClose();
      }}
    >
      {open && (
        <div className="dialog-box">
          <header className="dialog-header">
            <h2 id={titleId}>{title}</h2>
            <button type="button" className="icon-btn" onClick={onClose} aria-label="סגירת החלון">
              <Icon name="x" />
            </button>
          </header>
          <div className="dialog-content">{children}</div>
          {footer && <footer className="dialog-footer">{footer}</footer>}
        </div>
      )}
    </dialog>
  );
}

/**
 * חלון אישור לפעולה (מחיקה, ביטול). onConfirm יכול להיות אסינכרוני:
 * הכפתור ננעל עד שהשרת עונה, ושגיאה מהשרת מוצגת בתוך החלון.
 */
export function ConfirmDialog({
  open, title, children, confirmLabel = 'אישור', cancelLabel = 'חזרה', danger = false, onConfirm, onClose
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) setError(null);
  }, [open]);

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(toApiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      title={title}
      onClose={busy ? () => {} : onClose}
      size="sm"
      footer={(
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>{cancelLabel}</button>
          <button
            type="button"
            className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
            onClick={confirm}
            disabled={busy}
            aria-busy={busy}
          >
            {busy ? 'רגע…' : confirmLabel}
          </button>
        </>
      )}
    >
      <div className="confirm-text">{children}</div>
      <ApiErrorAlert error={error} className="mt-3" />
    </Dialog>
  );
}
