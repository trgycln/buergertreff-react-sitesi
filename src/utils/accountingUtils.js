// Geldtransit (z. B. Bareinzahlung Kasse → Bank) ist erfolgsneutral:
// Die Buchungen zählen für Kontostände (Kasse/Bank) und das Kassenbuch,
// aber NICHT für Einnahmen-/Ausgabensummen, EÜR und Kategorie-Statistiken.
export const GELDTRANSIT_CATEGORY_NAME = 'Geldtransit';

export const isGeldtransitCategory = (name = '') =>
  String(name).toLowerCase().replace(/[\s\-_]/g, '').includes('geldtransit');
