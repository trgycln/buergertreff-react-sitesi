// src/pages/admin/SponsorManagement.js
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import { 
    FaPlus, 
    FaEdit, 
    FaTrash, 
    FaSave, 
    FaTimes, 
    FaArrowUp, 
    FaArrowDown, 
    FaExternalLinkAlt, 
    FaBuilding, 
    FaHeart, 
    FaSearch,
    FaUpload
} from 'react-icons/fa';

const EMPTY_FORM = {
    name: '',
    category: 'institution', // 'institution' veya 'person'
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
    
    // Filtreleme state'leri
    const [filterCategory, setFilterCategory] = useState('all'); // 'all', 'institution', 'person'
    const [searchQuery, setSearchQuery] = useState('');

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

    const openNew = (defaultCategory = 'institution') => {
        const maxOrder = sponsors.reduce((max, s) => Math.max(max, s.sort_order || 0), 0);
        setForm({ ...EMPTY_FORM, category: defaultCategory, sort_order: maxOrder + 1 });
        setLogoFile(null);
        setLogoPreview('');
        setMessage({ type: '', text: '' });
        setEditingId('new');
    };

    const openEdit = (sponsor) => {
        setForm({
            name: sponsor.name || '',
            category: sponsor.category || (sponsor.logo_url || sponsor.website_url ? 'institution' : 'person'),
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
                category: form.category || 'institution',
                logo_url: form.category === 'person' ? null : (logoUrl || null),
                website_url: form.website_url ? form.website_url.trim() : null,
                description: form.description ? form.description.trim() : null,
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

            if (error) {
                // Eğer veritabanında category kolonu henüz yoksa geriye dönük uyumluluk:
                if (error.message && error.message.includes('category')) {
                    delete payload.category;
                    if (editingId === 'new') {
                        const res = await supabase.from('sponsors').insert(payload);
                        if (res.error) throw new Error(res.error.message);
                    } else {
                        const res = await supabase.from('sponsors').update(payload).eq('id', editingId);
                        if (res.error) throw new Error(res.error.message);
                    }
                } else {
                    throw new Error(error.message);
                }
            }

            setMessage({ 
                type: 'success', 
                text: editingId === 'new' 
                    ? 'Förderer/Sponsor erfolgreich hinzugefügt!' 
                    : 'Erfolgreich gespeichert!' 
            });
            await fetchSponsors();
            setTimeout(() => setEditingId(null), 1000);
        } catch (err) {
            setMessage({ type: 'error', text: `Fehler: ${err.message}` });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (sponsor) => {
        if (!window.confirm(`"${sponsor.name}" wirklich löschen?`)) return;
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

    // Filtrelenmiş liste
    const filteredSponsors = sponsors.filter((sponsor) => {
        const matchesCategory = 
            filterCategory === 'all' || 
            (filterCategory === 'person' && sponsor.category === 'person') ||
            (filterCategory === 'institution' && sponsor.category !== 'person');
        
        const matchesSearch = 
            !searchQuery.trim() || 
            sponsor.name.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesCategory && matchesSearch;
    });

    const institutionCount = sponsors.filter(s => s.category !== 'person').length;
    const personCount = sponsors.filter(s => s.category === 'person').length;

    // --- FORM GÖRÜNÜMÜ ---
    if (editingId !== null) {
        return (
            <div className="max-w-2xl">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-rcDarkGray">
                            {editingId === 'new' ? 'Neuen Förderer / Sponsor hinzufügen' : 'Eintrag bearbeiten'}
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Unternehmen mit Logo oder private Spender (Wall of Gratitude)
                        </p>
                    </div>
                    <button onClick={cancelEdit} className="text-gray-400 hover:text-gray-600 p-2">
                        <FaTimes size={20} />
                    </button>
                </div>

                {message.text && (
                    <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 md:p-8 rounded-2xl border border-gray-200 shadow-sm">
                    
                    {/* 1. Kategori Seçimi */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            Kategorie / Art des Unterstützers <span className="text-rcRed">*</span>
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => setForm(f => ({ ...f, category: 'institution' }))}
                                className={`flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${
                                    form.category !== 'person'
                                        ? 'border-rcBlue bg-blue-50/50 text-rcBlue font-bold shadow-sm'
                                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                                }`}
                            >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${form.category !== 'person' ? 'bg-rcBlue text-white' : 'bg-gray-100 text-gray-500'}`}>
                                    <FaBuilding />
                                </div>
                                <div>
                                    <div className="text-sm">Unternehmen / Institution</div>
                                    <div className="text-xs text-gray-500 font-normal">Firma, Stiftung, Verein (mit Logo)</div>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => setForm(f => ({ ...f, category: 'person' }))}
                                className={`flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${
                                    form.category === 'person'
                                        ? 'border-rcRed bg-red-50/50 text-rcRed font-bold shadow-sm'
                                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                                }`}
                            >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${form.category === 'person' ? 'bg-rcRed text-white' : 'bg-gray-100 text-gray-500'}`}>
                                    <FaHeart />
                                </div>
                                <div>
                                    <div className="text-sm">Private Förderer</div>
                                    <div className="text-xs text-gray-500 font-normal">Bürger & Spender (Name)</div>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* 2. Name */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                            {form.category === 'person' ? 'Vor- und Nachname (oder Familie)' : 'Name des Unternehmens / der Organisation'} <span className="text-rcRed">*</span>
                        </label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rcBlue"
                            placeholder={form.category === 'person' ? 'z. B. Dr. Hans Müller oder Familie Schmidt' : 'z. B. Sparkasse Westerwald-Sieg'}
                            required
                        />
                    </div>

                    {/* 3. Logo (Sadece Kurumlar için veya opsiyonel) */}
                    {form.category !== 'person' ? (
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Firmen- / Institutions-Logo</label>
                            <div className="flex items-start gap-4">
                                <div className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0 relative group">
                                    {logoPreview ? (
                                        <img src={logoPreview} alt="Logo-Vorschau" className="max-w-full max-h-full object-contain p-2" />
                                    ) : (
                                        <div className="text-center p-2">
                                            <FaBuilding className="text-gray-300 text-2xl mx-auto mb-1" />
                                            <span className="text-[10px] text-gray-400 leading-tight block">Kein Logo</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <input
                                        type="file"
                                        accept="image/png,image/jpeg,image/svg+xml,image/webp"
                                        onChange={handleLogoChange}
                                        className="block w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-rcBlue file:text-white hover:file:bg-blue-700 cursor-pointer"
                                    />
                                    <p className="text-xs text-gray-500 mt-1.5">PNG, JPG, WEBP oder SVG (Transparent bevorzugt, max. 2 MB)</p>
                                    {form.logo_url && !logoFile && (
                                        <p className="text-[11px] text-gray-400 mt-1 truncate">Aktueller Pfad: {form.logo_url}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-red-50/60 border border-red-100 rounded-xl p-3 flex items-center gap-3 text-xs text-gray-600">
                            <FaHeart className="text-rcRed text-lg flex-shrink-0" />
                            <span>Private Förderer werden auf der Website als elegante <strong>Spender-Plakette</strong> mit Vor- und Nachnamen in der Ehrentafel gewürdigt. Ein Logo ist nicht erforderlich.</span>
                        </div>
                    )}

                    {/* 4. Website URL */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Website-URL {form.category === 'person' ? '(Optional)' : ''}
                        </label>
                        <input
                            type="url"
                            value={form.website_url || ''}
                            onChange={(e) => setForm((f) => ({ ...f, website_url: e.target.value }))}
                            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rcBlue"
                            placeholder="https://www.beispiel.de"
                        />
                    </div>

                    {/* 5. Kurzbeschreibung */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Optionale Beschreibung / Zusatznotiz</label>
                        <textarea
                            value={form.description || ''}
                            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                            rows={2}
                            className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rcBlue resize-none"
                            placeholder="z. B. Hauptsponsor oder Projektpartner..."
                        />
                    </div>

                    {/* 6. Reihenfolge & Status */}
                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Reihenfolge (Sortierung)</label>
                            <input
                                type="number"
                                min={0}
                                value={form.sort_order}
                                onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))}
                                className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rcBlue"
                            />
                        </div>
                        <div className="flex items-center pt-6 gap-2">
                            <input
                                type="checkbox"
                                id="is_active"
                                checked={form.is_active}
                                onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                                className="w-5 h-5 accent-rcBlue rounded cursor-pointer"
                            />
                            <label htmlFor="is_active" className="text-sm font-semibold text-gray-700 cursor-pointer">
                                Auf Website anzeigen (Aktiv)
                            </label>
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={cancelEdit}
                            className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                        >
                            Abbrechen
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-rcBlue rounded-xl hover:bg-blue-700 disabled:opacity-60 shadow transition-colors"
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
        <div className="space-y-6">
            
            {/* Üst Bar: Başlık, Sekmeler & Ekleme Butonları */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-rcDarkGray">Förderer & Sponsoren verwalten</h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                        100 € und mehr: Unternehmen mit Logo und private Förderer in der Spenderwand
                    </p>
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={() => openNew('institution')}
                        className="flex items-center gap-2 px-4 py-2 text-xs md:text-sm font-semibold text-white bg-rcBlue rounded-xl shadow-sm hover:bg-blue-700 transition-colors"
                    >
                        <FaBuilding />
                        <span>Neues Unternehmen / Logo</span>
                    </button>
                    <button
                        onClick={() => openNew('person')}
                        className="flex items-center gap-2 px-4 py-2 text-xs md:text-sm font-semibold text-white bg-red-600 rounded-xl shadow-sm hover:bg-red-700 transition-colors"
                    >
                        <FaHeart />
                        <span>Privater Spender</span>
                    </button>
                </div>
            </div>

            {/* Mesaj Bildirimi */}
            {message.text && (
                <div className={`px-4 py-3 rounded-xl text-sm font-medium ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {message.text}
                </div>
            )}

            {/* Filtre ve Arama Çubuğu */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                
                {/* Kategori Sekmeleri */}
                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
                    <button
                        onClick={() => setFilterCategory('all')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            filterCategory === 'all'
                                ? 'bg-white text-rcDarkGray shadow-sm'
                                : 'text-gray-500 hover:text-gray-800'
                        }`}
                    >
                        Alle ({sponsors.length})
                    </button>
                    <button
                        onClick={() => setFilterCategory('institution')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            filterCategory === 'institution'
                                ? 'bg-white text-rcBlue shadow-sm'
                                : 'text-gray-500 hover:text-gray-800'
                        }`}
                    >
                        <FaBuilding size={12} />
                        Unternehmen ({institutionCount})
                    </button>
                    <button
                        onClick={() => setFilterCategory('person')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            filterCategory === 'person'
                                ? 'bg-white text-rcRed shadow-sm'
                                : 'text-gray-500 hover:text-gray-800'
                        }`}
                    >
                        <FaHeart size={12} />
                        Privatpersonen ({personCount})
                    </button>
                </div>

                {/* Arama Inputu */}
                <div className="relative flex-1 md:max-w-xs">
                    <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                    <input
                        type="text"
                        placeholder="Förderer suchen..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-1.5 border border-gray-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rcBlue"
                    />
                </div>
            </div>

            {/* Liste */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-rcBlue border-t-transparent"></div>
                    <p className="text-gray-500 mt-2 text-xs">Lade Förderer...</p>
                </div>
            ) : filteredSponsors.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300 p-8">
                    <p className="text-gray-500 mb-4 text-sm">Keine Einträge gefunden.</p>
                    <div className="flex justify-center gap-3">
                        <button onClick={() => openNew('institution')} className="px-4 py-2 text-xs font-semibold text-white bg-rcBlue rounded-xl">
                            Unternehmen anlegen
                        </button>
                        <button onClick={() => openNew('person')} className="px-4 py-2 text-xs font-semibold text-white bg-red-600 rounded-xl">
                            Privaten Spender anlegen
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredSponsors.map((sponsor, idx) => {
                        const isPerson = sponsor.category === 'person';
                        const hasNoLogo = !isPerson && !sponsor.logo_url;

                        return (
                            <div
                                key={sponsor.id}
                                className={`flex items-center gap-4 bg-white rounded-2xl border p-4 shadow-sm transition-all hover:border-gray-300 ${
                                    !sponsor.is_active ? 'opacity-50 border-gray-200' : 'border-gray-200'
                                }`}
                            >
                                {/* Logo / İkon */}
                                <div className={`w-14 h-14 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 border ${
                                    isPerson 
                                        ? 'bg-red-50 border-red-100 text-rcRed' 
                                        : 'bg-gray-50 border-gray-200 text-rcBlue'
                                }`}>
                                    {isPerson ? (
                                        <FaHeart size={20} />
                                    ) : sponsor.logo_url ? (
                                        <img src={sponsor.logo_url} alt={sponsor.name} className="w-12 h-12 object-contain" />
                                    ) : (
                                        <div className="text-center">
                                            <FaBuilding size={16} className="mx-auto text-gray-400" />
                                            <span className="text-[9px] text-gray-400 leading-none">Kein Logo</span>
                                        </div>
                                    )}
                                </div>

                                {/* Bilgiler */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="font-bold text-rcDarkGray text-sm md:text-base truncate">
                                            {sponsor.name}
                                        </p>
                                        
                                        {/* Kategori Rozeti */}
                                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                            isPerson 
                                                ? 'bg-red-100 text-red-700' 
                                                : 'bg-blue-100 text-blue-700'
                                        }`}>
                                            {isPerson ? 'Privat' : 'Unternehmen'}
                                        </span>

                                        {!sponsor.is_active && (
                                            <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                                                Inaktiv
                                            </span>
                                        )}

                                        {hasNoLogo && (
                                            <button
                                                onClick={() => openEdit(sponsor)}
                                                className="flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full hover:bg-amber-100"
                                            >
                                                <FaUpload size={9} />
                                                Logo fehlt (klicken zum Hochladen)
                                            </button>
                                        )}
                                    </div>

                                    {sponsor.website_url && (
                                        <a
                                            href={sponsor.website_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 text-xs text-rcBlue hover:underline mt-1"
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
                                        className="p-1.5 text-gray-400 hover:text-rcBlue disabled:opacity-20 transition-colors"
                                    >
                                        <FaArrowUp size={12} />
                                    </button>
                                    <button
                                        onClick={() => moveOrder(sponsor, 'down')}
                                        disabled={idx === filteredSponsors.length - 1}
                                        title="Nach unten"
                                        className="p-1.5 text-gray-400 hover:text-rcBlue disabled:opacity-20 transition-colors"
                                    >
                                        <FaArrowDown size={12} />
                                    </button>
                                </div>

                                {/* Aksiyon Butonları */}
                                <div className="flex gap-1.5">
                                    <button
                                        onClick={() => openEdit(sponsor)}
                                        title="Bearbeiten"
                                        className="p-2 text-rcBlue hover:bg-blue-50 rounded-xl transition-colors"
                                    >
                                        <FaEdit size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(sponsor)}
                                        title="Löschen"
                                        className="p-2 text-rcRed hover:bg-red-50 rounded-xl transition-colors"
                                    >
                                        <FaTrash size={16} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default SponsorManagement;
