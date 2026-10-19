import { useEffect } from 'react';
import { SITE } from '../config';

/** כותרת הלשונית בדפדפן – גם קורא המסך מכריז עליה במעבר בין דפים */
export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | ${SITE.name}` : SITE.fullName;
  }, [title]);
}
