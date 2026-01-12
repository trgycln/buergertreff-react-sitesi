import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { FaPlus, FaTrash, FaCheck, FaTimes, FaSave } from 'react-icons/fa';

export default function BuchhaltungSettings() {
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Yeni Ekleme State'leri
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState('expense'); // Default: Gider
  const [newAccName, setNewAccName] = useState('');

  // Organizasyon Ayarları
  const [orgSettings, setOrgSettings] = useState({
    org_name: '',
    org_address: '',
    org_tax_id: '',
    exemption_date: '',
    exemption_office: '',
    treasurer_name: ''
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
      .in('key', ['org_name', 'org_address', 'org_tax_id', 'exemption_date', 'exemption_office', 'treasurer_name']);

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
      .insert([{ name: newCatName, type: newCatType }])
      .select();

    if (!error && data) {
      setCategories([...categories, data[0]]);
      setNewCatName('');
    } else {
      alert('Fehler: ' + error.message);
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

  if (loading) return <div className="text-center p-4">Lade Einstellungen...</div>;

  return (
    <div className="space-y-8">
      
      {/* ORGANİZASYON AYARLARI (SPENDENBESCHEINIGUNG İÇİN) */}
      <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
        <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
          <FaSave className="text-blue-500" /> Vereinsdaten für Spendenbescheinigungen
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Diese Daten werden automatisch in die Spendenbescheinigungen (bis 300 €) eingefügt.
        </p>
        
        <form onSubmit={saveOrgSettings} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Vereinsname (Offiziell)</label>
            <input
              type="text"
              name="org_name"
              className="w-full border rounded px-3 py-2 focus:outline-none focus:border-blue-500"
              value={orgSettings.org_name}
              onChange={handleOrgSettingChange}
              placeholder="z.B. Bürgertreff Wissen e.V."
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Anschrift</label>
            <input
              type="text"
              name="org_address"
              className="w-full border rounded px-3 py-2 focus:outline-none focus:border-blue-500"
              value={orgSettings.org_address}
              onChange={handleOrgSettingChange}
              placeholder="Straße, PLZ, Ort"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Steuernummer</label>
            <input
              type="text"
              name="org_tax_id"
              className="w-full border rounded px-3 py-2 focus:outline-none focus:border-blue-500"
              value={orgSettings.org_tax_id}
              onChange={handleOrgSettingChange}
              placeholder="z.B. 12/345/67890"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Datum des Freistellungsbescheids</label>
            <input
              type="date"
              name="exemption_date"
              className="w-full border rounded px-3 py-2 focus:outline-none focus:border-blue-500"
              value={orgSettings.exemption_date}
              onChange={handleOrgSettingChange}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Finanzamt (Optional)</label>
            <input
              type="text"
              name="exemption_office"
              className="w-full border rounded px-3 py-2 focus:outline-none focus:border-blue-500"
              value={orgSettings.exemption_office}
              onChange={handleOrgSettingChange}
              placeholder="z.B. Finanzamt Altenkirchen-Hachenburg"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Schatzmeister (für Unterschrift)</label>
            <input
              type="text"
              name="treasurer_name"
              className="w-full border rounded px-3 py-2 focus:outline-none focus:border-blue-500"
              value={orgSettings.treasurer_name}
              onChange={handleOrgSettingChange}
              placeholder="z.B. Turgay Celen"
            />
          </div>

          <div className="md:col-span-2 flex justify-end">
            <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 flex items-center gap-2">
              <FaSave /> Speichern
            </button>
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* SOL KOLON: KATEGORİLER */}
        <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Kategorien (Einnahmen & Ausgaben)</h2>
        
        {/* Yeni Kategori Ekleme Formu */}
        <form onSubmit={addCategory} className="mb-6 flex gap-2">
          <input
            type="text"
            placeholder="Neue Kategorie (z.B. Sommerfest)"
            className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
          />
          <select
            className="border border-gray-300 rounded px-3 py-2 text-sm bg-gray-50"
            value={newCatType}
            onChange={(e) => setNewCatType(e.target.value)}
          >
            <option value="income">Einnahme (+)</option>
            <option value="expense">Ausgabe (-)</option>
          </select>
          <button type="submit" className="bg-green-600 text-white p-2 rounded hover:bg-green-700">
            <FaPlus />
          </button>
        </form>

        {/* Kategori Listesi */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {categories.map((cat) => (
            <div key={cat.id} className={`flex justify-between items-center p-3 rounded border ${!cat.is_active ? 'bg-gray-100 opacity-60' : 'bg-white'}`}>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-bold px-2 py-1 rounded ${cat.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {cat.type === 'income' ? 'Einnahme' : 'Ausgabe'}
                </span>
                <span className="font-medium text-gray-700">{cat.name}</span>
              </div>
              <button 
                onClick={() => toggleCategoryStatus(cat.id, cat.is_active)}
                className={`text-sm px-3 py-1 rounded border ${cat.is_active ? 'text-red-600 border-red-200 hover:bg-red-50' : 'text-green-600 border-green-200 hover:bg-green-50'}`}
              >
                {cat.is_active ? 'Deaktivieren' : 'Aktivieren'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* SAĞ KOLON: HESAPLAR */}
      <div className="bg-white p-6 rounded-lg shadow-md h-fit">
        <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Konten (Kasse & Bank)</h2>
        
        {/* Yeni Hesap Ekleme Formu */}
        <form onSubmit={addAccount} className="mb-6 flex gap-2">
          <input
            type="text"
            placeholder="Neues Konto (z.B. PayPal)"
            className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            value={newAccName}
            onChange={(e) => setNewAccName(e.target.value)}
          />
          <button type="submit" className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
            <FaPlus />
          </button>
        </form>

        {/* Hesap Listesi */}
        <div className="space-y-2">
          {accounts.map((acc) => (
            <div key={acc.id} className={`flex justify-between items-center p-3 rounded border ${!acc.is_active ? 'bg-gray-100 opacity-60' : 'bg-white'}`}>
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 text-blue-600 p-2 rounded-full">
                  <FaCheck size={12} />
                </div>
                <span className="font-medium text-gray-700">{acc.name}</span>
              </div>
              <button 
                onClick={() => toggleAccountStatus(acc.id, acc.is_active)}
                className={`text-sm px-3 py-1 rounded border ${acc.is_active ? 'text-red-600 border-red-200 hover:bg-red-50' : 'text-green-600 border-green-200 hover:bg-green-50'}`}
              >
                {acc.is_active ? 'Deaktivieren' : 'Aktivieren'}
              </button>
            </div>
          ))}
        </div>
      </div>

    </div>
    </div>
  );
}
