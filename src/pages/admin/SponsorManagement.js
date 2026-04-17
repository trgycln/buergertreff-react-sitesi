// src/pages/admin/SponsorManagement.js
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import { FaPlus, FaEdit, FaTrash, FaSave, FaTimes, FaArrowUp, FaArrowDown, FaExternalLinkAlt } from 'react-icons/fa';

const EMPTY_FORM = {
    name: '',
    logo_url: '',
    website_url: '',
    description: '',
    is_active: true,
    sort_order: 0,
};

const SponsorManagement = () => {
    const [sponsors, setSponsors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null); // null = liste, 'new' = yeni, uuid = düzenleme
    const [form, setForm] = useState(EMPTY_FORM);
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState('');
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const fetchSponsors = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('sponsors')
            .select('*')
            .order('sort_order', { ascending: true })
            .order('name', { ascending: true });
        if (error) {
            setMessage({ type: 'error', text: `Fehler beim Laden: ${error.message}` });
        } else {
            setSponsors(data || []);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchSponsors();
    }, [fetchSponsors]);

    const openNew = () => {
        const maxOrder = sponsors.reduce((max, s) => Math.max(max, s.sort_order || 0), 0);
        setForm({ ...EMPTY_FORM, sort_order: maxOrder + 1 });
        setLogoFile(null);
        setLogoPreview('');
        setMessage({ type: '', text: '' });
        setEditingId('new');
    };

    const openEdit = (sponsor) => {
        setForm({
            name: sponsor.name || '',
            logo_url: sponsor.logo_url || '',
            website_url: sponsor.website_url || '',
            description: sponsor.description || '',
            is_active: sponsor.is_active ?? true,
            sort_order: sponsor.sort_order ?? 0,
        });
        setLogoFile(null);
        setLogoPreview(sponsor.logo_url || '');
        setMessage({ type: '', text: '' });
        setEditingId(sponsor.id);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setLogoFile(null);
        setLogoPreview('');
        setMessage({ type: '', text: '' });
    };

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setLogoFile(file);
        setLogoPreview(URL.createObjectURL(file));
    };

    const uploadLogo = async (file) => {
        const ext = file.name.split('.').pop();
        const fileName = `sponsors/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from('page_assets').upload(fileName, file);
        if (error) throw new Error(`Logo-Upload fehlgeschlagen: ${error.message}`);
        const { data: { publicUrl } } = supabase.storage.from('page_assets').getPublicUrl(fileName);
        return publicUrl;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name.trim()) {
            setMessage({ type: 'error', text: 'Name ist ein Pflichtfeld.' });
            return;
        }
        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            let logoUrl = form.logo_url;
            if (logoFile) {
                logoUrl = await uploadLogo(logoFile);
            }

            const payload = {
                name: form.name.trim(),
                logo_url: logoUrl || null,
                website_url: form.website_url.trim() || null,
                description: form.description.trim() || null,
                is_active: form.is_active,
                sort_order: Number(form.sort_order) || 0,
                updated_at: new Date().toISOString(),
            };

            let error;
            if (editingId === 'new') {
                ({ error } = await supabase.from('sponsors').insert(payload));
            } else {
                ({ error } = await supabase.from('sponsors').update(payload).eq('id', editingId));
            }

            if (error) throw new Error(error.message);

            setMessage({ type: 'success', text: editingId === 'new' ? 'Sponsor erfolgreich hinzugefügt!' : 'Sponsor erfolgreich gespeichert!' });
            await fetchSponsors();
            setTimeout(() => setEditingId(null), 1200);
        } catch (err) {
            setMessage({ type: 'error', text: `Fehler: ${err.message}` });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (sponsor) => {
        if (!window.confirm(`Sponsor "${sponsor.name}" wirklich löschen?`)) return;
        const { error } = await supabase.from('sponsors').delete().eq('id', sponsor.id);
        if (error) {
            setMessage({ type: 'error', text: `Löschen fehlgeschlagen: ${error.message}` });
        } else {
            setMessage({ type: 'success', text: `"${sponsor.name}" wurde gelöscht.` });
            await fetchSponsors();
        }
    };

    const moveOrder = async (sponsor, direction) => {
        const sorted = [...sponsors].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
        const idx = sorted.findIndex((s) => s.id === sponsor.id);
        const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (swapIdx < 0 || swapIdx >= sorted.length) return;

        const current = sorted[idx];
        const swap = sorted[swapIdx];
        const tempOrder = current.sort_order;

        await Promise.all([
            supabase.from('sponsors').update({ sort_order: swap.sort_order }).eq('id', current.id),
            supabase.from('sponsors').update({ sort_order: tempOrder }).eq('id', swap.id),
        ]);
        await fetchSponsors();
    };

    // --- FORM GÖRÜNÜMÜ ---
    if (editingId !== null) {
        return (
            <div className="max-w-xl">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-rcDarkGray">
                        {editingId === 'new' ? 'Neuen Sponsor hinzufügen' : 'Sponsor bearbeiten'}
                    </h2>
                    <button onClick={cancelEdit} className="text-gray-500 hover:text-gray-700">
                        <FaTimes size={20} />
                    </button>
                </div>

                {message.text && (
                    <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Name <span className="text-rcRed">*</span></label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rcBlue"
                            placeholder="z. B. Sparkasse Westerwald-Sieg"
                        />
                    </div>

                    {/* Logo */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Logo</label>
                        <div className="flex items-start gap-4">
                            {logoPreview && (
                                <div className="w-20 h-20 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                                    <img src={logoPreview} alt="Logo-Vorschau" className="w-16 h-16 object-contain" />
                                </div>
                            )}
                            <div className="flex-1">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleLogoChange}
                                    className="block w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-rcBlue file:text-white hover:file:bg-blue-700"
                                />
                                <p className="text-xs text-gray-500 mt-1">PNG, JPG oder SVG (max. 2 MB)</p>
                                {form.logo_url && !logoFile && (
                                    <p className="text-xs text-gray-400 mt-1 truncate">Aktuell: {form.logo_url}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Website URL */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Website-URL</label>
                        <input
                            type="url"
                            value={form.website_url}
                            onChange={(e) => setForm((f) => ({ ...f, website_url: e.target.value }))}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rcBlue"
                            placeholder="https://www.beispiel.de"
                        />
                    </div>

                    {/* Beschreibung */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Kurzbeschreibung</label>
                        <textarea
                            value={form.description}
                            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                            rows={3}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rcBlue resize-none"
                            placeholder="Optionale Beschreibung des Sponsors..."
                        />
                    </div>

                    {/* Reihenfolge & Status */}
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Reihenfolge</label>
                            <input
                                type="number"
                                min={0}
                                value={form.sort_order}
                                onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rcBlue"
                            />
                        </div>
                        <div className="flex items-end pb-2 gap-2">
                            <input
                                type="checkbox"
                                id="is_active"
                                checked={form.is_active}
                                onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                                className="w-4 h-4 accent-rcBlue"
                            />
                            <label htmlFor="is_active" className="text-sm font-semibold text-gray-700">Aktiv / Sichtbar</label>
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={cancelEdit}
                            className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                        >
                            Abbrechen
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-rcBlue rounded-lg hover:bg-blue-700 disabled:opacity-60"
                        >
                            <FaSave />
                            {saving ? 'Speichere...' : 'Speichern'}
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    // --- LISTE GÖRÜNÜMÜ ---
    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-gray-500">
                    {sponsors.length} Sponsor{sponsors.length !== 1 ? 'en' : ''} insgesamt
                </p>
                <button
                    onClick={openNew}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-rcBlue rounded-lg shadow hover:bg-blue-700"
                >
                    <FaPlus />
                    Neuer Sponsor
                </button>
            </div>

            {message.text && (
                <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {message.text}
                </div>
            )}

            {loading ? (
                <p className="text-gray-500">Lade Sponsoren...</p>
            ) : sponsors.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
                    <p className="text-gray-500 mb-4">Noch keine Sponsoren vorhanden.</p>
                    <button onClick={openNew} className="px-4 py-2 text-sm font-semibold text-white bg-rcBlue rounded-lg hover:bg-blue-700">
                        Ersten Sponsor hinzufügen
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {sponsors.map((sponsor, idx) => (
                        <div
                            key={sponsor.id}
                            className={`flex items-center gap-4 bg-white rounded-xl border px-4 py-3 shadow-sm ${!sponsor.is_active ? 'opacity-50' : 'border-gray-200'}`}
                        >
                            {/* Logo */}
                            <div className="w-14 h-14 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                                {sponsor.logo_url ? (
                                    <img src={sponsor.logo_url} alt={sponsor.name} className="w-12 h-12 object-contain" />
                                ) : (
                                    <span className="text-xs text-gray-400">Kein Logo</span>
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className="font-semibold text-rcDarkGray truncate">{sponsor.name}</p>
                                    {!sponsor.is_active && (
                                        <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Inaktiv</span>
                                    )}
                                </div>
                                {sponsor.website_url && (
                                    <a
                                        href={sponsor.website_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 text-xs text-rcBlue hover:underline mt-0.5 w-fit"
                                    >
                                        <FaExternalLinkAlt size={10} />
                                        {sponsor.website_url.replace(/^https?:\/\//, '')}
                                    </a>
                                )}
                            </div>

                            {/* Sıralama Butonları */}
                            <div className="flex flex-col gap-1">
                                <button
                                    onClick={() => moveOrder(sponsor, 'up')}
                                    disabled={idx === 0}
                                    title="Nach oben"
                                    className="p-1 text-gray-400 hover:text-rcBlue disabled:opacity-20"
                                >
                                    <FaArrowUp size={12} />
                                </button>
                                <button
                                    onClick={() => moveOrder(sponsor, 'down')}
                                    disabled={idx === sponsors.length - 1}
                                    title="Nach unten"
                                    className="p-1 text-gray-400 hover:text-rcBlue disabled:opacity-20"
                                >
                                    <FaArrowDown size={12} />
                                </button>
                            </div>

                            {/* Aksiyon Butonları */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => openEdit(sponsor)}
                                    title="Bearbeiten"
                                    className="p-2 text-rcBlue hover:bg-blue-50 rounded-lg"
                                >
                                    <FaEdit size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(sponsor)}
                                    title="Löschen"
                                    className="p-2 text-rcRed hover:bg-red-50 rounded-lg"
                                >
                                    <FaTrash size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SponsorManagement;
