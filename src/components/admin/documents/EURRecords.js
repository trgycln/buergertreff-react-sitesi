import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import { 
  FaPlus, FaEdit, FaTrash, FaFilter, FaSpinner, FaEye, FaLock, FaChevronDown,
  FaDownload, FaFileExcel, FaFilePdf, FaFileCsv
} from 'react-icons/fa';
import { exportEURToPDF, exportEURToExcel, exportEURToCSV, exportAllFormats } from '../../../utils/eurExportUtils';

export default function EURRecords() {
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [activeTab, setActiveTab] = useState('entries'); // 'entries' | 'summary'
  const [expandedSphaere, setExpandedSphaere] = useState(null);
  
  // Filtreler
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [filterSphaere, setFilterSphaere] = useState('all');
  const [filterType, setFilterType] = useState('all');
  
  const [years, setYears] = useState([]);

  const sphaeres = [
    { id: 'ideeller', label: 'Ideeller Bereich', color: 'blue', desc: 'Gemeinnützige Mitgliederaktivitäten, Mitgliedsbeiträge, Spenden und staatliche Zuschüsse' },
    { id: 'vermögensv', label: 'Vermögensverwaltung', color: 'green', desc: 'Kapitalanlage, Zinseinnahmen, Mieterträge und passive Einkommenquellen' },
    { id: 'zweckbetrieb', label: 'Zweckbetrieb', color: 'purple', desc: 'Betriebe zur Erfüllung des satzungsmäßigen Vereinszwecks ohne Gewinnerzielungsabsicht' },
    { id: 'wirtschaftlich', label: 'Wirtschaftlicher Geschäftsbetrieb', color: 'amber', desc: 'Kommerzielle Aktivitäten und nebengewerbe mit Gewinnerzielungsabsicht' }
  ];

  const subCategories = {
    ideeller: {
      income: ['Mitgliedsbeiträge', 'Spenden', 'Staatliche Zuschüsse', 'Beitrittgebühren'],
      expense: ['Verbandsgebühren', 'Personenkosten', 'Versicherungen', 'Vereinstätigkeit']
    },
    vermögensv: {
      income: ['Bankzinsen', 'Mieteinnahmen', 'Urheberrechtsgebühren'],
      expense: ['Bankgebühren', 'Instandhaltung', 'Energiekosten']
    },
    zweckbetrieb: {
      income: ['Veranstaltungseinnahmen', 'Schulungsgebühren', 'Sportkurse', 'Kulturveranstaltungen'],
      expense: ['Raummiete', 'Trainer-Honorare', 'Künstler-Honorare', 'Sportausrüstung', 'Kunstmaterialien']
    },
    wirtschaftlich: {
      income: ['Lebensmittel-/Getränkverkauf', 'Werbeeinnahmen', 'Produktverkauf'],
      expense: ['Wareneinkauf', 'Mitarbeiterlöhne', 'Werbekosten', 'Abschreibungen']
    }
  };

  const [formData, setFormData] = useState({
    fiscal_year: new Date().getFullYear(),
    entry_date: new Date().toISOString().slice(0, 10),
    buchungsnummer: '',
    vorgang: '',
    belegnummer: '',
    amount_gross: '',
    amount_net: '',
    amount_vat: '',
    vat_rate: '0',
    sphaere: 'ideeller',
    transaction_type: 'income',
    sub_category: '',
    document_url: '',
    stored_location: '',
    notes: ''
  });

  useEffect(() => {
    const currentYear = new Date().getFullYear();
    setYears([currentYear - 2, currentYear - 1, currentYear, currentYear + 1]);
    fetchRecords();
  }, [filterYear, filterSphaere, filterType]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('accounting_eur_records')
        .select('*')
        .eq('fiscal_year', filterYear);

      if (filterSphaere !== 'all') {
        query = query.eq('sphaere', filterSphaere);
      }
      if (filterType !== 'all') {
        query = query.eq('transaction_type', filterType);
      }

      const { data, error } = await query.order('entry_date', { ascending: false });

      if (error) throw error;
      setRecords(data || []);
      calculateSummary(data || []);
    } catch (error) {
      console.error('Error fetching EÜR records:', error);
    }
    setLoading(false);
  };

  const calculateSummary = (data) => {
    const sum = {};
    sphaeres.forEach(s => {
      sum[s.id] = { income: 0, expense: 0, net: 0 };
    });

    data.forEach(record => {
      const sp = record.sphaere;
      const amount = parseFloat(record.amount_gross) || 0;
      if (record.transaction_type === 'income') {
        sum[sp].income += amount;
      } else {
        sum[sp].expense += amount;
      }
      sum[sp].net = sum[sp].income - sum[sp].expense;
    });

    setSummary(sum);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const updatedForm = { ...formData, [name]: value };

    if (name === 'sphaere' || name === 'transaction_type') {
      updatedForm.sub_category = '';
    }

    // KDV hesaplaması
    if (name === 'amount_gross' || name === 'vat_rate') {
      const gross = parseFloat(updatedForm.amount_gross) || 0;
      const vatRate = parseFloat(updatedForm.vat_rate) || 0;
      const vat = (gross * vatRate) / (100 + vatRate);
      const net = gross - vat;
      
      updatedForm.amount_vat = vat.toFixed(2);
      updatedForm.amount_net = net.toFixed(2);
    }

    setFormData(updatedForm);
  };

  const handleAutoGenerateBuchungsnummer = () => {
    const count = records.filter(r => r.fiscal_year === parseInt(formData.fiscal_year)).length + 1;
    const number = String(count).padStart(5, '0');
    setFormData(prev => ({
      ...prev,
      buchungsnummer: `EÜR-${formData.fiscal_year}-${number}`
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.buchungsnummer) {
      alert('Lütfen Buchungsnummer giriniz veya otomatik oluşturun');
      return;
    }

    const dataToSubmit = {
      ...formData,
      amount_gross: parseFloat(formData.amount_gross) || 0,
      amount_net: parseFloat(formData.amount_net) || 0,
      amount_vat: parseFloat(formData.amount_vat) || 0,
      vat_rate: parseFloat(formData.vat_rate) || 0
    };

    try {
      if (editingId) {
        const { error } = await supabase
          .from('accounting_eur_records')
          .update(dataToSubmit)
          .eq('id', editingId);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('accounting_eur_records')
          .insert([dataToSubmit]);
        
        if (error) throw error;
      }

      fetchRecords();
      setIsFormOpen(false);
      setEditingId(null);
      resetForm();
    } catch (error) {
      console.error('Hata:', error);
      alert('Hata: ' + error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      fiscal_year: new Date().getFullYear(),
      entry_date: new Date().toISOString().slice(0, 10),
      buchungsnummer: '',
      vorgang: '',
      belegnummer: '',
      amount_gross: '',
      amount_net: '',
      amount_vat: '',
      vat_rate: '0',
      sphaere: 'ideeller',
      transaction_type: 'income',
      sub_category: '',
      document_url: '',
      stored_location: '',
      notes: ''
    });
  };

  const handleEdit = (record) => {
    setFormData({
      fiscal_year: record.fiscal_year,
      entry_date: record.entry_date,
      buchungsnummer: record.buchungsnummer,
      vorgang: record.vorgang || '',
      belegnummer: record.belegnummer || '',
      amount_gross: record.amount_gross.toString(),
      amount_net: record.amount_net ? record.amount_net.toString() : '',
      amount_vat: record.amount_vat ? record.amount_vat.toString() : '',
      vat_rate: record.vat_rate ? record.vat_rate.toString() : '0',
      sphaere: record.sphaere,
      transaction_type: record.transaction_type,
      sub_category: record.sub_category || '',
      document_url: record.document_url || '',
      stored_location: record.stored_location || '',
      notes: record.notes || ''
    });
    setEditingId(record.id);
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Möchten Sie diesen Eintrag wirklich löschen?')) {
      try {
        const { error } = await supabase
          .from('accounting_eur_records')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        fetchRecords();
      } catch (error) {
        console.error('Löschfehler:', error);
      }
    }
  };

  const getSphaereColor = (id) => {
    const sp = sphaeres.find(s => s.id === id);
    const colors = {
      blue: 'bg-blue-50 border-blue-200 text-blue-700',
      green: 'bg-green-50 border-green-200 text-green-700',
      purple: 'bg-purple-50 border-purple-200 text-purple-700',
      amber: 'bg-amber-50 border-amber-200 text-amber-700'
    };
    return colors[sp?.color] || colors.blue;
  };

  const getSphaereLabel = (id) => {
    const sp = sphaeres.find(s => s.id === id);
    return sp?.label || '';
  };

  if (loading) {
    return <div className="flex justify-center items-center p-8"><FaSpinner className="animate-spin text-2xl" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-gray-800">EÜR - Einnahmen-Überschuss-Rechnung</h3>
        <button
          onClick={() => {
            setIsFormOpen(!isFormOpen);
            setEditingId(null);
            resetForm();
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <FaPlus /> Transaktion hinzufügen
        </button>
      </div>

      {/* Bilgilendirme */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Zu- und Abflussprinzip:</strong> Einträge werden nicht nach dem Datum der Rechnung erfasst, sondern nach dem Datum, an dem das Geld tatsächlich auf das/vom Bankkonto fließt. 
          Jeder Eintrag muss mit einem Beleg unterstützt werden (Rechnung, Kontoauszug, Beleg).
        </p>
      </div>

      {/* Sekmeler */}
      <div className="flex space-x-2 border-b">
        <button
          onClick={() => setActiveTab('entries')}
          className={`px-4 py-2 font-medium transition ${
            activeTab === 'entries'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Buchungseinträge (Transaktionen)
        </button>
        <button
          onClick={() => setActiveTab('summary')}
          className={`px-4 py-2 font-medium transition ${
            activeTab === 'summary'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Zusammenfassung und Berichte
        </button>
      </div>

      {/* FORM */}
      {isFormOpen && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h4 className="font-bold mb-4 text-lg">{editingId ? 'Eintrag bearbeiten' : 'Neue Transaktion erfassen'}</h4>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Temel Bilgiler */}
            <div>
              <h5 className="font-semibold text-gray-800 mb-3 text-sm uppercase">Temel Bilgiler</h5>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Geschäftsjahr *</label>
                  <select
                    name="fiscal_year"
                    value={formData.fiscal_year}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  >
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Transaktionsdatum *</label>
                  <input
                    type="date"
                    name="entry_date"
                    value={formData.entry_date}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Buchungsnummer *</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      name="buchungsnummer"
                      value={formData.buchungsnummer}
                      onChange={handleInputChange}
                      placeholder="EÜR-2026-00001"
                      className="flex-1 border border-gray-300 rounded px-3 py-2"
                      required
                    />
                    <button
                      type="button"
                      onClick={handleAutoGenerateBuchungsnummer}
                      className="bg-gray-300 text-gray-700 px-3 py-2 rounded hover:bg-gray-400 transition text-xs font-medium"
                    >
                      Oto
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Belge No</label>
                  <input
                    type="text"
                    name="belegnummer"
                    value={formData.belegnummer}
                    onChange={handleInputChange}
                    placeholder="Fatura/Dekont no"
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
              </div>
            </div>

            {/* Vergi Alanı ve Tür */}
            <div>
              <h5 className="font-semibold text-gray-800 mb-3 text-sm uppercase">Transaktionstyp & Kategorie</h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vergi Alanı (Sphäre) *</label>
                  <select
                    name="sphaere"
                    value={formData.sphaere}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    required
                  >
                    {sphaeres.map(s => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {sphaeres.find(s => s.id === formData.sphaere)?.desc}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">İşlem Türü *</label>
                  <select
                    name="transaction_type"
                    value={formData.transaction_type}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    required
                  >
                    <option value="income">Einnahme</option>
                    <option value="expense">Ausgabe</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unterkategorie</label>
                  <select
                    name="sub_category"
                    value={formData.sub_category}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  >
                    <option value="">-- Seçin --</option>
                    {subCategories[formData.sphaere]?.[formData.transaction_type]?.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* İşlem Açıklaması */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">İşlem Açıklaması (Vorgang) *</label>
              <textarea
                name="vorgang"
                value={formData.vorgang}
                onChange={handleInputChange}
                placeholder="Örn: 'Ayın aidatı (15 kişi x 50€)', 'Kırtasiye alımı fatura 2026/351'"
                rows="2"
                className="w-full border border-gray-300 rounded px-3 py-2"
                required
              />
            </div>

            {/* Tutar Bilgileri */}
            <div>
              <h5 className="font-semibold text-gray-800 mb-3 text-sm uppercase">Tutar Bilgileri</h5>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Brüt Tutar (€) *</label>
                  <input
                    type="number"
                    name="amount_gross"
                    value={formData.amount_gross}
                    onChange={handleInputChange}
                    step="0.01"
                    placeholder="0.00"
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">KDV Oranı (%)</label>
                  <select
                    name="vat_rate"
                    value={formData.vat_rate}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  >
                    <option value="0">KDV Yok (0%)</option>
                    <option value="7">İndirimli (%7)</option>
                    <option value="19">Normal (%19)</option>
                  </select>
                </div>

                <div className="bg-gray-200 border border-gray-300 rounded px-3 py-2 flex items-center">
                  <div>
                    <p className="text-xs text-gray-600">Net Tutar</p>
                    <p className="text-lg font-bold text-gray-800">{formData.amount_net || '0.00'} €</p>
                  </div>
                </div>

                <div className="bg-orange-100 border border-orange-300 rounded px-3 py-2 flex items-center">
                  <div>
                    <p className="text-xs text-gray-600">KDV Tutarı</p>
                    <p className="text-lg font-bold text-orange-600">{formData.amount_vat || '0.00'} €</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Depolama ve Belgeler */}
            <div>
              <h5 className="font-semibold text-gray-800 mb-3 text-sm uppercase">Belgelendirme</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fiziksel Depolama Yeri</label>
                  <input
                    type="text"
                    name="stored_location"
                    value={formData.stored_location}
                    onChange={handleInputChange}
                    placeholder="Örn: Ordner 1/EÜR-2026"
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Belge URL (Tarama/Dosya)</label>
                  <input
                    type="text"
                    name="document_url"
                    value={formData.document_url}
                    onChange={handleInputChange}
                    placeholder="https://..."
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
              </div>
            </div>

            {/* Notlar */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notlar / Açıklamalar</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows="2"
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>

            {/* Butonlar */}
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition font-medium"
              >
                {editingId ? 'Aktualisieren' : 'Speichern'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsFormOpen(false);
                  setEditingId(null);
                  resetForm();
                }}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 transition"
              >
                Abbrechen
              </button>
            </div>
          </form>
        </div>
      )}

      {/* KAYITLAR SEKMESI */}
      {activeTab === 'entries' && (
        <div className="space-y-6">
          {/* Filtreler */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <FaFilter className="text-gray-600" />
              <span className="font-semibold text-gray-800">Filter</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Geschäftsjahr</label>
                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(parseInt(e.target.value))}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                >
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sphäre</label>
                <select
                  value={filterSphaere}
                  onChange={(e) => setFilterSphaere(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                >
                  <option value="all">-- Alle --</option>
                  {sphaeres.map(s => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transaktionstyp</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                >
                  <option value="all">-- Alle --</option>
                  <option value="income">Einnahme</option>
                  <option value="expense">Ausgabe</option>
                </select>
              </div>
            </div>
          </div>

          {/* Buchungseinträge */}
          <div className="space-y-3">
            {records.length === 0 ? (
              <p className="text-gray-500 text-center py-12 bg-white rounded border border-gray-200">
                Keine Einträge mit den ausgewählten Kriterien gefunden.
              </p>
            ) : (
              records.map(record => (
                <div key={record.id} className={`border-2 rounded-lg p-4 ${getSphaereColor(record.sphaere)}`}>
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-3">
                    <div>
                      <p className="text-xs font-semibold">Buchungsnummer</p>
                      <p className="font-mono text-sm font-bold">{record.buchungsnummer}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold">Datum</p>
                      <p className="text-sm">{new Date(record.entry_date).toLocaleDateString('de-DE')}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold">Sphäre</p>
                      <p className="text-sm font-semibold">{getSphaereLabel(record.sphaere)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold">Unterkategorie</p>
                      <p className="text-sm">{record.sub_category || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold">Betrag</p>
                      <p className={`text-sm font-bold ${record.transaction_type === 'income' ? 'text-green-700' : 'text-red-700'}`}>
                        {record.transaction_type === 'income' ? '+' : '-'} {parseFloat(record.amount_gross).toFixed(2)} €
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold">KDV</p>
                      <p className="text-sm">{parseFloat(record.amount_vat || 0).toFixed(2)} €</p>
                    </div>
                  </div>

                  <div className="border-t pt-3 mb-3">
                    <p className="text-sm"><strong>Açıklama:</strong> {record.vorgang}</p>
                    {record.belegnummer && <p className="text-xs text-gray-600">Belge: {record.belegnummer}</p>}
                    {record.notes && <p className="text-xs text-gray-600 mt-1"><strong>Not:</strong> {record.notes}</p>}
                  </div>

                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => handleEdit(record)}
                      className="text-blue-700 hover:text-blue-900 flex items-center gap-1 text-sm font-medium"
                    >
                      <FaEdit /> Bearbeiten
                    </button>
                    <button
                      onClick={() => handleDelete(record.id)}
                      className="text-red-700 hover:text-red-900 flex items-center gap-1 text-sm font-medium"
                    >
                      <FaTrash /> Löschen
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ZUSAMMENFASSUNGS-TAB */}
      {activeTab === 'summary' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h4 className="font-bold text-lg text-gray-800">Geschäftsjahr {filterYear} - Zusammenfassung der Steuersphären</h4>
              <div className="flex gap-2">
                <button
                  onClick={() => exportEURToPDF(records, summary, filterYear)}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded transition text-sm font-medium"
                  title="PDF-Bericht herunterladen"
                >
                  <FaFilePdf /> PDF
                </button>
                <button
                  onClick={() => exportEURToExcel(records, summary, filterYear)}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded transition text-sm font-medium"
                  title="Excel-Datei herunterladen"
                >
                  <FaFileExcel /> Excel
                </button>
                <button
                  onClick={() => exportEURToCSV(records, filterYear)}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded transition text-sm font-medium"
                  title="CSV-Datei herunterladen"
                >
                  <FaFileCsv /> CSV
                </button>
                <button
                  onClick={() => exportAllFormats(records, summary, filterYear)}
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded transition text-sm font-medium"
                  title="Alle Dateien herunterladen"
                >
                  <FaDownload /> Alle
                </button>
              </div>
            </div>
            
            <div className="space-y-4">
              {sphaeres.map(sphaere => {
                const data = summary[sphaere.id] || { income: 0, expense: 0, net: 0 };
                const colorClasses = {
                  blue: 'border-blue-300 bg-blue-50',
                  green: 'border-green-300 bg-green-50',
                  purple: 'border-purple-300 bg-purple-50',
                  amber: 'border-amber-300 bg-amber-50'
                };

                return (
                  <div key={sphaere.id} className={`border-2 ${colorClasses[sphaere.color]} rounded-lg p-5 hover:shadow-md transition`}>
                    <div 
                      className="flex justify-between items-start cursor-pointer gap-4"
                      onClick={() => setExpandedSphaere(expandedSphaere === sphaere.id ? null : sphaere.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <h5 className="font-bold text-lg text-gray-800 mb-2">{sphaere.label}</h5>
                        <p className="text-sm text-gray-600 leading-relaxed break-words">{sphaere.desc}</p>
                      </div>
                      <FaChevronDown 
                        className={`flex-shrink-0 transition-transform mt-1 text-gray-600 ${expandedSphaere === sphaere.id ? 'rotate-180' : ''}`}
                      />
                    </div>

                    {expandedSphaere === sphaere.id && (
                      <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-gray-300">
                        <div className="text-center">
                          <p className="text-xs font-semibold text-gray-600 mb-2">Einnahmen</p>
                          <p className="text-2xl font-bold text-green-600">
                            {data.income.toFixed(2)} €
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-semibold text-gray-600 mb-2">Ausgaben</p>
                          <p className="text-2xl font-bold text-red-600">
                            {data.expense.toFixed(2)} €
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-semibold text-gray-600 mb-2">Netto-Ergebnis</p>
                          <p className={`text-2xl font-bold ${data.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {data.net.toFixed(2)} €
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
