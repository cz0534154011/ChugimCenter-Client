import { useId } from 'react';

/**
 * שדה טופס נגיש: תווית מחוברת לשדה, הסבר ושגיאה שמוקראים עם השדה (aria-describedby),
 * וסימון aria-invalid כשיש שגיאה. as – ‏input (ברירת מחדל), ‏select או textarea.
 */
export default function FormField({
  label, hint, error, required, as = 'input', children, className = '', ...inputProps
}) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const Control = as;

  return (
    <div className={`field ${error ? 'field-invalid' : ''} ${className}`}>
      <label htmlFor={id} className="field-label">
        {label}
        {required && <span className="required" aria-hidden="true"> *</span>}
      </label>
      <Control
        id={id}
        className="field-control"
        aria-invalid={error ? 'true' : undefined}
        aria-required={required ? 'true' : undefined}
        aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
        {...inputProps}
      >
        {children}
      </Control>
      {hint && <p id={hintId} className="field-hint">{hint}</p>}
      {error && <p id={errorId} className="field-error">{error}</p>}
    </div>
  );
}

/** תיבת סימון עם תווית */
export function Checkbox({ label, ...props }) {
  return (
    <label className="checkbox">
      <input type="checkbox" {...props} />
      <span>{label}</span>
    </label>
  );
}
