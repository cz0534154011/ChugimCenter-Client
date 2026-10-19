import { useCallback, useEffect, useRef, useState } from 'react';
import { toApiError } from '../api/client';

/**
 * טעינת נתונים מהשרת: מחזיר data, ‏error, ‏loading ו-reload.
 * deps – כשאחד מהם משתנה (למשל סינון או עמוד), הנתונים נטענים מחדש.
 * תשובה ישנה שמגיעה אחרי תשובה חדשה יותר מתעלמים ממנה.
 */
export function useFetch(fetcher, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const requestId = useRef(0);

  const load = useCallback(fetcher, deps);

  const run = useCallback(async ({ silent = false } = {}) => {
    const id = ++requestId.current;
    if (!silent) setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await load();
      if (id === requestId.current) setState({ data, error: null, loading: false });
    } catch (error) {
      if (id === requestId.current) setState((s) => ({ ...s, error: toApiError(error), loading: false }));
    }
  }, [load]);

  useEffect(() => {
    run();
  }, [run]);

  return { ...state, reload: run, setData: (data) => setState((s) => ({ ...s, data })) };
}
