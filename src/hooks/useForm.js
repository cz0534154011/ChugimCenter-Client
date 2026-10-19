import { useState } from 'react';
import { toApiError } from '../api/client';

/**
 * ניהול טופס: ערכים, שגיאות לפי שדה, שגיאה כללית ונעילה בזמן שליחה.
 * validate – בדיקה בצד הלקוח, לנוחות בלבד. הבדיקה הקובעת היא תמיד בשרת.
 * שגיאות שדה שהשרת מחזיר (400) מוצגות ליד השדה המתאים.
 */
export function useForm(initialValues, validate) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const setField = (name, value) => {
    setValues((v) => ({ ...v, [name]: value }));
    setErrors((e) => (e[name] ? { ...e, [name]: undefined } : e));
  };

  /** props לשדה: value, ‏onChange, ‏name – כדי לא לחזור על אותו קוד בכל שדה */
  const bind = (name) => ({
    name,
    value: values[name] ?? '',
    onChange: (event) => {
      const { type, checked, value } = event.target;
      setField(name, type === 'checkbox' ? checked : value);
    }
  });

  const handleSubmit = (onSubmit) => async (event) => {
    event?.preventDefault();
    if (submitting) return;
    setFormError(null);

    const clientErrors = validate ? validate(values) : {};
    const hasErrors = Object.values(clientErrors).some(Boolean);
    setErrors(clientErrors);
    if (hasErrors) {
      focusFirstError(event?.target, clientErrors);
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(values);
    } catch (error) {
      const apiError = toApiError(error);
      const fieldErrors = matchFieldNames(apiError.fieldErrors, values);
      setErrors(fieldErrors);
      setFormError({ ...apiError, fieldErrors });
      focusFirstError(event?.target, fieldErrors);
    } finally {
      setSubmitting(false);
    }
  };

  return { values, setValues, setField, bind, errors, setErrors, formError, setFormError, submitting, handleSubmit };
}

// השרת מחזיר שמות שדות באותיות של C# (FullName). מתאימים אותם לשמות בטופס (fullName)
function matchFieldNames(serverErrors, values) {
  const result = {};
  for (const [key, message] of Object.entries(serverErrors)) {
    const match = Object.keys(values).find((name) => name.toLowerCase() === key.toLowerCase());
    result[match ?? key] = message;
  }
  return result;
}

// מעבר עם המקלדת לשדה הראשון שיש בו שגיאה – חשוב לנגישות
function focusFirstError(form, errors) {
  if (!form?.querySelector) return;
  const first = Object.keys(errors).find((k) => errors[k]);
  if (!first) return;
  const field = form.querySelector(`[name="${first}" i]`);
  field?.focus();
}
