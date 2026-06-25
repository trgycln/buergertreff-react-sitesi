import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { FaPlus, FaTrash, FaCheck, FaTimes, FaSave } from 'react-icons/fa';

export default function BuchhaltungSettings() {
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('vereinsdaten');

  // Yeni Ekleme State'leri
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState('expense'); // Default: Gider
  const [newCatSubcategories, setNewCatSubcategories] = useState('');
  const [newAccName, setNewAccName] = useState('');

  // Organizasyon Ayarları
  const [orgSettings, setOrgSettings] = useState({
    // Temel Bilgiler
    org_name: '',
    org_address: '',
    org_postal_code: '',
    org_city: '',
    
    // İletişim
    org_phone: '',
    org_email: '',
    org_website: '',
    
    // Sosyal Medya
    org_facebook: '',
    org_instagram: '',
    org_twitter: '',
    
    // Vergi & Muhasebe
    org_tax_id: '',
    exemption_date: '',
    exemption_office: '',
    
    // Sorumlu Kişi
    treasurer_name: '',
    
    // Amaçlar
    org_purpose: ''
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    // Kategorileri Çek
    const { data: catData } = await supabase
      .from('accounting_categories')
      .select('*')
      .order('type', { ascending: false }) // Önce Gelirler, Sonra Giderler
      .order('name', { ascending: true });

    // Hesapları Çek
    const { data: accData } = await supabase
      .from('accounting_accounts')
      .select('*')
      .order('name', { ascending: true });

    // Organizasyon Ayarlarını Çek
    const { data: settingsData } = await supabase
      .from('site_settings')
      .select('key, value')
      .in('key', [
        'org_name', 'org_address', 'org_postal_code', 'org_city',
        'org_phone', 'org_email', 'org_website',
        'org_facebook', 'org_instagram', 'org_twitter',
        'org_tax_id', 'exemption_date', 'exemption_office',
        'treasurer_name', 'org_purpose'
      ]);

    if (catData) setCategories(catData);
    if (accData) setAccounts(accData);
    
    if (settingsData) {
      const newSettings = { ...orgSettings };
      settingsData.forEach(item => {
        newSettings[item.key] = item.value;
      });
      setOrgSettings(newSettings);
    }

    setLoading(false);
  };

  // --- ORGANİZASYON AYARLARI ---
  const handleOrgSettingChange = (e) => {
    const { name, value } = e.target;
    setOrgSettings(prev => ({ ...prev, [name]: value }));
  };

  const saveOrgSettings = async (e) => {
    e.preventDefault();
    const updates = Object.keys(orgSettings).map(key => ({
      key: key,
      value: orgSettings[key]
    }));

    const { error } = await supabase
      .from('site_settings')
      .upsert(updates, { onConflict: 'key' });

    if (error) {
      alert('Fehler beim Speichern: ' + error.message);
    } else {
      alert('Einstellungen erfolgreich gespeichert!');
    }
  };

  // --- KATEGORİ İŞLEMLERİ ---
  const addCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const { data, error } = await supabase
      .from('accounting_categories')
      .insert([{ name: newCatName, type: newCatType, subcategories: newCatSubcategories }])
      .select();

    if (!error && data) {
      setCategories(prev => [...prev, data[0]]);
      setNewCatName('');
      setNewCatSubcategories('');
    } else {
      alert('Fehler: ' + error.message);
    }
  };

  const editSubcategories = async (cat) => {
    const newSubs = window.prompt('Unterkategorien (Komma-getrennt):', cat.subcategories || '');
    if (newSubs !== null) {
      const { error } = await supabase
        .from('accounting_categories')
        .update({ subcategories: newSubs })
        .eq('id', cat.id);
      
      if (!error) {
        setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, subcategories: newSubs } : c));
      } else {
        alert('Fehler: ' + error.message);
      }
    }
  };

  const toggleCategoryStatus = async (id, currentStatus) => {
    const { error } = await supabase
      .from('accounting_categories')
      .update({ is_active: !currentStatus })
      .eq('id', id);

    if (!error) {
      setCategories(categories.map(c => c.id === id ? { ...c, is_active: !currentStatus } : c));
    }
  };

  const cleanDuplicates = async () => {
    if (!window.confirm("Möchten Sie doppelte Kategorien automatisch zusammenführen? (Kopien werden gelöscht und deren Buchungen auf das Original übertragen)")) return;

    try {
      const { data: cats } = await supabase.from('accounting_categories').select('*').order('id', { ascending: true });
      if (!cats) return;

      const normalize = (name) => name.toLowerCase().replace(/[\s\-_]/g, '');
      const grouped = {};
      cats.forEach(c => {
        const norm = normalize(c.name);
        if (!grouped[norm]) grouped[norm] = [];
        grouped[norm].push(c);
      });

      let mergedCount = 0;

      for (const norm in grouped) {
        const list = grouped[norm];
        if (list.length > 1) {
          const main = list[0];
          const dups = list.slice(1);
          
          for (const dup of dups) {
            // Buchungen auf das Original umbuchen
            await supabase.from('accounting_transactions').update({ category_id: main.id }).eq('category_id', dup.id);
            // Kopie löschen
            await supabase.from('accounting_categories').delete().eq('id', dup.id);
            mergedCount++;
          }
        }
      }
      
      alert(`Erfolgreich! ${mergedCount} doppelte Kategorie(n) wurden bereinigt.`);
      fetchSettings(); 
    } catch (err) {
      alert("Fehler beim Bereinigen: " + err.message);
    }
  };

  // --- HESAP İŞLEMLERİ ---
  const addAccount = async (e) => {
    e.preventDefault();
    if (!newAccName.trim()) return;

    const { data, error } = await supabase
      .from('accounting_accounts')
      .insert([{ name: newAccName }])
      .select();

    if (!error && data) {
      setAccounts([...accounts, data[0]]);
      setNewAccName('');
    } else {
      alert('Fehler: ' + error.message);
    }
  };

  const toggleAccountStatus = async (id, currentStatus) => {
    const { error } = await supabase
      .from('accounting_accounts')
      .update({ is_active: !currentStatus })
      .eq('id', id);

    if (!error) {
      setAccounts(accounts.map(a => a.id === id ? { ...a, is_active: !currentStatus } : a));
    }
  };

  const renderCategoryCard = (cat, colorTheme) => (
    <div key={cat.id} className={`p-4 rounded-lg border ${!cat.is_active ? 'bg-gray-50 border-gray-200 opacity-60' : `bg-white border-${colorTheme}-200 shadow-sm`}`}>
      <div className="flex justify-between items-start mb-2">
        <div className="font-bold text-gray-800 text-base">{cat.name}</div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => toggleCategoryStatus(cat.id, cat.is_active)}
            className={`text-xs px-2 py-1 rounded border ${cat.is_active ? 'text-red-600 border-red-200 hover:bg-red-50' : 'text-green-600 border-green-200 hover:bg-green-50'}`}
          >
            {cat.is_active ? 'Deaktivieren' : 'Aktivieren'}
          </button>
          <button 
            onClick={async () => {
              if (window.confirm(`Möchten Sie die Kategorie "${cat.name}" wirklich endgültig löschen? (Nur möglich, wenn keine Buchungen damit verknüpft sind)`)) {
                const { error } = await supabase.from('accounting_categories').delete().eq('id', cat.id);
                if (error) {
                  alert('Fehler beim Löschen! Wahrscheinlich sind dieser Kategorie noch Buchungen zugeordnet.');
                } else {
                  setCategories(prev => prev.filter(c => c.id !== cat.id));
                }
              }
            }}
            className="text-xs px-2 py-1 rounded border text-red-600 border-red-200 hover:bg-red-50 flex items-center gap-1"
          >
            <FaTrash size={10} /> Löschen
          </button>
        </div>
      </div>
      
      <div className="mt-3 bg-gray-50 rounded p-2 border border-gray-100">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Unterkategorien</span>
          <button 
            onClick={() => editSubcategories(cat)}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            Bearbeiten
          </button>
        </div>
        {cat.subcategories ? (
          <div className="flex flex-wrap gap-2">
            {cat.subcategories.split(',').map((sub, idx) => (
              <span key={idx} className="inline-block bg-white border border-gray-200 shadow-sm text-gray-700 text-xs px-2 py-1 rounded-md">
                {sub.trim()}
              </span>
            ))}
          </div>
        ) : (
          <div className="text-xs text-gray-400 italic">Keine Unterkategorien (Allgemein)</div>
        )}
      </div>
    </div>
  );

  if (loading) return <div className="text-center p-8 text-gray-500">Lade Einstellungen...</div>;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <h1 className="text-2xl font-bold text-gray-800">Einstellungen</h1>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto hide-scrollbar space-x-1 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('vereinsdaten')}
          className={`px-4 py-3 font-medium text-sm whitespace-nowrap transition-colors border-b-2 ${activeTab === 'vereinsdaten' ? 'text-blue-600 border-blue-600 bg-blue-50/50' : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'}`}
        >
          📋 Vereinsdaten
        </button>
        <button
          onClick={() => setActiveTab('kategorien')}
          className={`px-4 py-3 font-medium text-sm whitespace-nowrap transition-colors border-b-2 ${activeTab === 'kategorien' ? 'text-blue-600 border-blue-600 bg-blue-50/50' : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'}`}
        >
          📂 Kategorien (Einnahmen & Ausgaben)
        </button>
        <button
          onClick={() => setActiveTab('konten')}
          className={`px-4 py-3 font-medium text-sm whitespace-nowrap transition-colors border-b-2 ${activeTab === 'konten' ? 'text-blue-600 border-blue-600 bg-blue-50/50' : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'}`}
        >
          💳 Konten (Kasse & Bank)
        </button>
      </div>

      {/* Tab İçerikleri */}
      <div className="mt-6">
        
        {/* --- VEREINSDATEN TAB --- */}
        {activeTab === 'vereinsdaten' && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-2 border-b pb-2 flex items-center gap-2">
              <FaSave className="text-blue-500" /> Vereinsinformationen
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Diese Daten werden in alle offiziellen Dokumente (Spendenbescheinigungen, Berichte) automatisch eingefügt.
            </p>
            
            <form onSubmit={saveOrgSettings} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div className="md:col-span-2 mb-2">
                <h3 className="text-sm font-bold text-blue-800 bg-blue-50 p-2 rounded">📋 Grundinformationen</h3>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Vereinsname (Offiziell)</label>
                <input type="text" name="org_name" className="w-full border rounded-lg px-3 py-2 bg-gray-50 focus:bg-white focus:ring-2 ring-blue-100 outline-none" value={orgSettings.org_name} onChange={handleOrgSettingChange} placeholder="z.B. Bürgertreff Wissen e.V." />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Straße / Hausnummer</label>
                <input type="text" name="org_address" className="w-full border rounded-lg px-3 py-2 bg-gray-50 focus:bg-white focus:ring-2 ring-blue-100 outline-none" value={orgSettings.org_address} onChange={handleOrgSettingChange} placeholder="z.B. Hauptstr. 42" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Postleitzahl</label>
                <input type="text" name="org_postal_code" className="w-full border rounded-lg px-3 py-2 bg-gray-50 focus:bg-white focus:ring-2 ring-blue-100 outline-none" value={orgSettings.org_postal_code} onChange={handleOrgSettingChange} placeholder="z.B. 57612" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stadt</label>
                <input type="text" name="org_city" className="w-full border rounded-lg px-3 py-2 bg-gray-50 focus:bg-white focus:ring-2 ring-blue-100 outline-none" value={orgSettings.org_city} onChange={handleOrgSettingChange} placeholder="z.B. Altenkirchen" />
              </div>

              <div className="md:col-span-2 mb-2 mt-4">
                <h3 className="text-sm font-bold text-blue-800 bg-blue-50 p-2 rounded">📞 Kontakt & Medien</h3>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                <input type="tel" name="org_phone" className="w-full border rounded-lg px-3 py-2 bg-gray-50 focus:bg-white focus:ring-2 ring-blue-100 outline-none" value={orgSettings.org_phone} onChange={handleOrgSettingChange} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email-Adresse</label>
                <input type="email" name="org_email" className="w-full border rounded-lg px-3 py-2 bg-gray-50 focus:bg-white focus:ring-2 ring-blue-100 outline-none" value={orgSettings.org_email} onChange={handleOrgSettingChange} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                <input type="url" name="org_website" className="w-full border rounded-lg px-3 py-2 bg-gray-50 focus:bg-white focus:ring-2 ring-blue-100 outline-none" value={orgSettings.org_website} onChange={handleOrgSettingChange} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Facebook / Instagram</label>
                <input type="url" name="org_facebook" className="w-full border rounded-lg px-3 py-2 bg-gray-50 focus:bg-white focus:ring-2 ring-blue-100 outline-none" value={orgSettings.org_facebook} onChange={handleOrgSettingChange} placeholder="Link zum Profil" />
              </div>

              <div className="md:col-span-2 mb-2 mt-4">
                <h3 className="text-sm font-bold text-blue-800 bg-blue-50 p-2 rounded">💼 Steuer & Buchhaltung</h3>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Steuernummer</label>
                <input type="text" name="org_tax_id" className="w-full border rounded-lg px-3 py-2 bg-gray-50 focus:bg-white focus:ring-2 ring-blue-100 outline-none" value={orgSettings.org_tax_id} onChange={handleOrgSettingChange} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Datum Freistellungsbescheid</label>
                <input type="date" name="exemption_date" className="w-full border rounded-lg px-3 py-2 bg-gray-50 focus:bg-white focus:ring-2 ring-blue-100 outline-none" value={orgSettings.exemption_date} onChange={handleOrgSettingChange} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Finanzamt</label>
                <input type="text" name="exemption_office" className="w-full border rounded-lg px-3 py-2 bg-gray-50 focus:bg-white focus:ring-2 ring-blue-100 outline-none" value={orgSettings.exemption_office} onChange={handleOrgSettingChange} />
              </div>

              <div className="md:col-span-2 mb-2 mt-4">
                <h3 className="text-sm font-bold text-blue-800 bg-blue-50 p-2 rounded">🎯 Verantwortliche & Zweck</h3>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Kassierer/in (für Unterschrift)</label>
                <input type="text" name="treasurer_name" className="w-full border rounded-lg px-3 py-2 bg-gray-50 focus:bg-white focus:ring-2 ring-blue-100 outline-none" value={orgSettings.treasurer_name} onChange={handleOrgSettingChange} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Satzungszweck (Verwendungszweck)</label>
                <textarea name="org_purpose" rows="3" className="w-full border rounded-lg px-3 py-2 bg-gray-50 focus:bg-white focus:ring-2 ring-blue-100 outline-none" value={orgSettings.org_purpose} onChange={handleOrgSettingChange} />
              </div>

              <div className="md:col-span-2 flex justify-end mt-4 pt-4 border-t border-gray-100">
                <button type="submit" className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 shadow-sm font-medium flex items-center gap-2">
                  <FaSave /> Vereinsdaten Speichern
                </button>
              </div>
            </form>
          </div>
        )}

        {/* --- KATEGORIEN TAB --- */}
        {activeTab === 'kategorien' && (
          <div className="space-y-8">
            
            {/* Yeni Kategori Ekle */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative">
              <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h2 className="text-lg font-bold text-gray-800">Neue Kategorie Hinzufügen</h2>
                <button 
                  onClick={cleanDuplicates}
                  type="button" 
                  className="text-xs bg-amber-100 text-amber-800 px-3 py-1.5 rounded-lg border border-amber-200 hover:bg-amber-200 transition-colors"
                >
                  🧹 Doppelte Kategorien Bereinigen
                </button>
              </div>
              <form onSubmit={addCategory} className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Kategoriename</label>
                  <input type="text" placeholder="z.B. Sommerfest" className="w-full border rounded-lg px-3 py-2 focus:ring-2 ring-blue-100 outline-none" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} required />
                </div>
                <div className="w-full lg:w-48">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Art</label>
                  <select className="w-full border rounded-lg px-3 py-2 bg-gray-50 focus:ring-2 ring-blue-100 outline-none" value={newCatType} onChange={(e) => setNewCatType(e.target.value)}>
                    <option value="income">Einnahme (+)</option>
                    <option value="expense">Ausgabe (-)</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Unterkategorien (Komma-getrennt)</label>
                  <input type="text" placeholder="z.B. Tee, Kaffee, Kuchen" className="w-full border rounded-lg px-3 py-2 focus:ring-2 ring-blue-100 outline-none" value={newCatSubcategories} onChange={(e) => setNewCatSubcategories(e.target.value)} />
                </div>
                <div className="flex items-end">
                  <button type="submit" className="w-full lg:w-auto bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 font-medium flex items-center justify-center gap-2 h-[42px]">
                    <FaPlus /> Speichern
                  </button>
                </div>
              </form>
            </div>

            {/* Listeler (İki Kolon) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* EINNAHMEN */}
              <div className="bg-white rounded-xl shadow-sm border border-emerald-100 overflow-hidden">
                <div className="bg-emerald-50 px-5 py-4 border-b border-emerald-100 flex justify-between items-center">
                  <h3 className="font-bold text-emerald-800 text-lg">Einnahmen (+)</h3>
                  <span className="bg-emerald-200 text-emerald-800 text-xs font-bold px-2 py-1 rounded-full">
                    {categories.filter(c => c.type === 'income' && c.is_active).length} Aktiv
                  </span>
                </div>
                <div className="p-5 space-y-4 max-h-[600px] overflow-y-auto">
                  {categories.filter(c => c.type === 'income').map(cat => renderCategoryCard(cat, 'emerald'))}
                </div>
              </div>

              {/* AUSGABEN */}
              <div className="bg-white rounded-xl shadow-sm border border-rose-100 overflow-hidden">
                <div className="bg-rose-50 px-5 py-4 border-b border-rose-100 flex justify-between items-center">
                  <h3 className="font-bold text-rose-800 text-lg">Ausgaben (-)</h3>
                  <span className="bg-rose-200 text-rose-800 text-xs font-bold px-2 py-1 rounded-full">
                    {categories.filter(c => c.type === 'expense' && c.is_active).length} Aktiv
                  </span>
                </div>
                <div className="p-5 space-y-4 max-h-[600px] overflow-y-auto">
                  {categories.filter(c => c.type === 'expense').map(cat => renderCategoryCard(cat, 'rose'))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* --- KONTEN TAB --- */}
        {activeTab === 'konten' && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 max-w-2xl">
            <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Konten (Kasse & Bank)</h2>
            
            <form onSubmit={addAccount} className="mb-6 flex gap-3">
              <input type="text" placeholder="Neues Konto (z.B. PayPal)" className="flex-1 border rounded-lg px-4 py-2 focus:ring-2 ring-blue-100 outline-none" value={newAccName} onChange={(e) => setNewAccName(e.target.value)} required />
              <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2">
                <FaPlus /> Konto Hinzufügen
              </button>
            </form>

            <div className="space-y-3">
              {accounts.map((acc) => (
                <div key={acc.id} className={`flex justify-between items-center p-4 rounded-lg border ${!acc.is_active ? 'bg-gray-50 border-gray-200 opacity-60' : 'bg-white border-blue-100 shadow-sm'}`}>
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 text-blue-600 p-2 rounded-full">
                      <FaCheck size={14} />
                    </div>
                    <span className="font-semibold text-gray-800">{acc.name}</span>
                  </div>
                  <button onClick={() => toggleAccountStatus(acc.id, acc.is_active)} className={`text-sm px-4 py-1.5 rounded-lg border font-medium ${acc.is_active ? 'text-rose-600 border-rose-200 hover:bg-rose-50' : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'}`}>
                    {acc.is_active ? 'Deaktivieren' : 'Aktivieren'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
