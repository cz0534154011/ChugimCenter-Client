// לכל תחום צבע עדין קבוע, לפי המזהה שלו. הצבע הוא קישוט בלבד – השם תמיד כתוב
const TONES = ['rose', 'lilac', 'sage', 'amber', 'sky', 'sand'];

export function categoryTone(categoryId) {
  return TONES[(Number(categoryId) - 1 + TONES.length) % TONES.length] ?? 'sand';
}
