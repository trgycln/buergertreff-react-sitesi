import { supabase } from '../supabaseClient';

// Amtsinhaber-Historie (Tabelle accounting_signatories).
// Jedes Dokument nimmt den Eintrag, der zu SEINEM Datum gültig war,
// damit alte Dokumente nach einem Amtswechsel unverändert bleiben.

export const SIGNATORY_ROLES = {
  vorsitzende: { label: '1. Vorsitzende/r', settingsKey: 'vorsitzende_name', usage: 'Rechnungen' },
  kassierer: { label: 'Kassierer/in', settingsKey: 'treasurer_name', usage: 'Spendenbescheinigungen' },
};

export const SIGNATURE_BUCKET = 'receipts';

const toDateKey = (value) => {
  if (!value) return new Date().toISOString().slice(0, 10);
  if (typeof value === 'string') return value.slice(0, 10);
  return new Date(value).toISOString().slice(0, 10);
};

export async function fetchSignatories(role) {
  let query = supabase
    .from('accounting_signatories')
    .select('*')
    .order('valid_from', { ascending: true });
  if (role) query = query.eq('role', role);
  const { data, error } = await query;
  if (error) {
    console.warn('Could not load signatories:', error.message);
    return [];
  }
  return data || [];
}

// Liefert den Eintrag, der am angegebenen Datum gültig war (letzter mit valid_from <= Datum).
export function pickSignatory(list, role, date) {
  const day = toDateKey(date);
  const candidates = (list || [])
    .filter((s) => s.role === role && String(s.valid_from) <= day)
    .sort((a, b) => String(a.valid_from).localeCompare(String(b.valid_from)));
  return candidates[candidates.length - 1] || null;
}

// Öffentlicher Pfad ('/imza.png', 'https://…') wird direkt genutzt,
// sonst signierte URL aus dem privaten Bucket.
export async function getSignatureUrl(signaturePath, expiresIn = 600) {
  if (!signaturePath) return null;
  if (signaturePath.startsWith('/') || /^https?:\/\//i.test(signaturePath)) return signaturePath;
  const { data, error } = await supabase.storage
    .from(SIGNATURE_BUCKET)
    .createSignedUrl(signaturePath, expiresIn);
  if (error) {
    console.warn('Could not sign signature url:', error.message);
    return null;
  }
  return data?.signedUrl || null;
}

// Name + Unterschrift-URL für ein Dokument mit gegebenem Datum.
export async function resolveSignatoryForDate(role, date) {
  const list = await fetchSignatories(role);
  const entry = pickSignatory(list, role, date);
  if (!entry) return { found: false, name: null, signatureUrl: null };
  return { found: true, name: entry.name, signatureUrl: await getSignatureUrl(entry.signature_path) };
}

export const escapeAttr = (value = '') =>
  String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
