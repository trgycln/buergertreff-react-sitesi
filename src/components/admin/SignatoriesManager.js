import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import { FaPlus, FaTrash, FaUpload, FaSignature } from 'react-icons/fa';
import {
  SIGNATORY_ROLES,
  SIGNATURE_BUCKET,
  fetchSignatories,
  pickSignatory,
  getSignatureUrl,
} from '../../utils/signatories';

const todayKey = () => new Date().toISOString().slice(0, 10);

const formatDate = (d) => {
  if (!d) return '';
  if (String(d).startsWith('1900-01-01')) return 'bisher (alle älteren Dokumente)';
  return new Date(d).toLocaleDateString('de-DE');
};

const MAX_SIZE = 2 * 1024 * 1024;

async function uploadSignature(role, file) {
  if (!file) return null;
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
    throw new Error('Bitte ein Bild (PNG, idealerweise mit transparentem Hintergrund) hochladen.');
  }
  if (file.size > MAX_SIZE) throw new Error('Die Datei ist zu groß (max. 2 MB).');
  const ext = file.name.includes('.') ? file.name.split('.').pop().toLowerCase() : 'png';
  const path = `unterschrift_${role}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from(SIGNATURE_BUCKET).upload(path, file, { contentType: file.type });
  if (error) throw error;
  return path;
}

function RoleCard({ role, entries, readOnly, onChanged }) {
  const meta = SIGNATORY_ROLES[role];
  const [previews, setPreviews] = useState({});
  const [form, setForm] = useState({ name: '', valid_from: todayKey(), file: null });
  const [busy, setBusy] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);

  const sorted = [...entries].sort((a, b) => String(b.valid_from).localeCompare(String(a.valid_from)));
  const current = pickSignatory(entries, role, todayKey());
  const latest = sorted[0];

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = {};
      for (const e of entries) {
        result[e.id] = await getSignatureUrl(e.signature_path, 600);
      }
      if (!cancelled) setPreviews(result);
    })();
    return () => { cancelled = true; };
  }, [entries]);

  const addEntry = async (e) => {
    e.preventDefault();
    if (readOnly) return;
    const name = form.name.trim();
    if (!name) { alert('Bitte den vollständigen Namen eintragen.'); return; }
    if (!form.valid_from) { alert('Bitte das Datum "gültig ab" angeben.'); return; }
    if (latest && form.valid_from <= String(latest.valid_from)) {
      alert(`"Gültig ab" muss nach dem ${formatDate(latest.valid_from)} liegen, damit bereits erstellte Dokumente unverändert bleiben.`);
      return;
    }
    const msg = `Ab ${new Date(form.valid_from).toLocaleDateString('de-DE')} erscheinen auf neuen ${meta.usage} "${name}"${form.file ? ' und die hochgeladene Unterschrift' : ' (ohne Unterschrift)'}.\n\nDokumente mit früherem Datum bleiben unverändert.\n\nFortfahren?`;
    if (!window.confirm(msg)) return;

    setBusy(true);
    try {
      const signature_path = await uploadSignature(role, form.file);
      const { error } = await supabase
        .from('accounting_signatories')
        .insert([{ role, name, valid_from: form.valid_from, signature_path }]);
      if (error) throw error;
      setForm({ name: '', valid_from: todayKey(), file: null });
      setFileInputKey((k) => k + 1);
      await onChanged();
    } catch (err) {
      alert('Fehler: ' + err.message);
    } finally {
      setBusy(false);
    }
  };

  // Unterschrift nur nachtragen, wenn der Eintrag noch keine hat (danach unveränderlich).
  const addSignatureToEntry = async (entry, file) => {
    if (readOnly || !file || entry.signature_path) return;
    const range = entry === latest ? 'ab' : 'im Zeitraum ab';
    if (!window.confirm(`Diese Unterschrift wird auf allen ${meta.usage} ${range} ${formatDate(entry.valid_from)} für "${entry.name}" angezeigt – auch auf bereits erstellten.\n\nDanach kann sie nicht mehr ersetzt werden. Fortfahren?`)) return;
    setBusy(true);
    try {
      const signature_path = await uploadSignature(role, file);
      const { error } = await supabase
        .from('accounting_signatories')
        .update({ signature_path })
        .eq('id', entry.id)
        .is('signature_path', null);
      if (error) throw error;
      await onChanged();
    } catch (err) {
      alert('Fehler: ' + err.message);
    } finally {
      setBusy(false);
    }
  };

  const deleteLatest = async (entry) => {
    if (readOnly || entries.length <= 1) return;
    if (!window.confirm(`Eintrag "${entry.name}" (gültig ab ${formatDate(entry.valid_from)}) wirklich löschen?\n\nNur für Tippfehler gedacht: Dokumente ab diesem Datum zeigen danach wieder den vorherigen Amtsinhaber.`)) return;
    setBusy(true);
    try {
      const { error } = await supabase.from('accounting_signatories').delete().eq('id', entry.id);
      if (error) throw error;
      if (entry.signature_path && !entry.signature_path.startsWith('/')) {
        await supabase.storage.from(SIGNATURE_BUCKET).remove([entry.signature_path]);
      }
      await onChanged();
    } catch (err) {
      alert('Fehler: ' + err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-bold text-gray-800">{meta.label}</h4>
          <p className="text-xs text-gray-500">Unterschrift erscheint automatisch auf: <strong>{meta.usage}</strong></p>
        </div>
        {current && (
          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-semibold">Aktuell: {current.name}</span>
        )}
      </div>

      <div className="space-y-2 mb-4">
        {sorted.length === 0 && (
          <div className="text-sm text-gray-400 italic">Noch kein Eintrag. Bitte SQL-Skript create_signatories_table.sql ausführen.</div>
        )}
        {sorted.map((entry) => (
          <div key={entry.id} className={`flex items-center gap-3 p-2 rounded border ${current?.id === entry.id ? 'border-green-200 bg-green-50/40' : 'border-gray-100 bg-gray-50'}`}>
            <div className="w-28 h-12 bg-white border border-dashed border-gray-200 rounded flex items-center justify-center overflow-hidden shrink-0">
              {previews[entry.id]
                ? <img src={previews[entry.id]} alt="Unterschrift" className="max-h-11 max-w-full object-contain" />
                : <span className="text-[10px] text-gray-400">keine Unterschrift</span>}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-800 truncate">{entry.name}</div>
              <div className="text-xs text-gray-500">gültig ab: {formatDate(entry.valid_from)}</div>
            </div>
            {!readOnly && !entry.signature_path && (
              <label className={`text-xs px-2 py-1 rounded border border-blue-200 text-blue-700 hover:bg-blue-50 cursor-pointer flex items-center gap-1 ${busy ? 'opacity-50 pointer-events-none' : ''}`}>
                <FaUpload size={10} /> Unterschrift
                <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
                  onChange={(e) => { addSignatureToEntry(entry, e.target.files?.[0]); e.target.value = ''; }} />
              </label>
            )}
            {!readOnly && entry === latest && entries.length > 1 && (
              <button type="button" disabled={busy} onClick={() => deleteLatest(entry)}
                className="text-xs px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50" title="Nur bei Tippfehlern">
                <FaTrash size={10} />
              </button>
            )}
          </div>
        ))}
      </div>

      {!readOnly && (
        <div className="border-t pt-3 grid grid-cols-1 sm:grid-cols-6 gap-2 items-end">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-gray-500 mb-1">Neue/r {meta.label} (vollständiger Name)</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addEntry(e); } }}
              className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="z.B. Max Mustermann" />
          </div>
          <div className="sm:col-span-1">
            <label className="block text-xs font-semibold text-gray-500 mb-1">Gültig ab</label>
            <input type="date" value={form.valid_from} onChange={(e) => setForm({ ...form, valid_from: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-gray-500 mb-1">Unterschrift (PNG, transparenter Hintergrund)</label>
            <input key={fileInputKey} type="file" accept="image/png,image/jpeg,image/webp"
              onChange={(e) => setForm({ ...form, file: e.target.files?.[0] || null })}
              className="w-full text-xs border rounded-lg px-2 py-1.5 bg-white" />
          </div>
          <div className="sm:col-span-1">
            <button type="button" onClick={addEntry} disabled={busy}
              className="w-full bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center justify-center gap-1 disabled:opacity-50">
              <FaPlus size={11} /> Wechsel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SignatoriesManager({ readOnly, onCurrentNamesChange }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const list = await fetchSignatories();
    setEntries(list);
    setLoading(false);

    // Aktuelle Namen mit site_settings abgleichen, damit alle übrigen
    // Stellen (Kontakt, Berichte, Kassenprotokoll …) wie bisher funktionieren.
    const today = todayKey();
    const names = {};
    Object.entries(SIGNATORY_ROLES).forEach(([role, meta]) => {
      const cur = pickSignatory(list, role, today);
      if (cur) names[meta.settingsKey] = cur.name;
    });
    if (Object.keys(names).length > 0) {
      onCurrentNamesChange?.(names);
      if (!readOnly) {
        await supabase.from('site_settings').upsert(
          Object.entries(names).map(([key, value]) => ({ key, value })),
          { onConflict: 'key' }
        );
      }
    }
  }, [readOnly, onCurrentNamesChange]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="text-sm text-gray-500">Lade Unterschriften…</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 text-xs text-gray-600 bg-amber-50 border border-amber-200 rounded p-3">
        <FaSignature className="text-amber-600 mt-0.5 shrink-0" />
        <div>
          Bei einem Amtswechsel hier einen <strong>neuen Eintrag mit „Gültig ab“-Datum</strong> anlegen – nicht den alten ändern.
          Jedes Dokument zeigt den Namen und die Unterschrift, die an <strong>seinem Datum</strong> gültig waren
          (Rechnung: Rechnungsdatum, Spendenbescheinigung: Tag der Zuwendung). Bereits erstellte Dokumente bleiben dadurch unverändert.
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Object.keys(SIGNATORY_ROLES).map((role) => (
          <RoleCard key={role} role={role} readOnly={readOnly}
            entries={entries.filter((e) => e.role === role)} onChanged={load} />
        ))}
      </div>
    </div>
  );
}
