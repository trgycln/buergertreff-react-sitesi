import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { 
  FaPlus, FaEdit, FaTrash, FaPrint, FaHandHoldingHeart, 
  FaArrowDown, FaArrowUp, FaPaperclip, FaExclamationTriangle, FaSpinner 
} from 'react-icons/fa';

export default function BuchhaltungTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filtreleme State'leri
  const [filterType, setFilterType] = useState('all'); 
  const [dateFilter, setDateFilter] = useState({
    preset: 'this_year', 
    start: new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10), 
    end: new Date(new Date().getFullYear(), 11, 31).toISOString().slice(0, 10) 
  });
  
  // Dropdown Verileri
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [orgSettings, setOrgSettings] = useState({});

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    type: 'expense',
    amount: '',
    category_id: '',
    account_id: '',
    contact_id: '',
    receipt_no: '',
    file_no: '',
    description: '',
    document_url: ''
  });

  useEffect(() => {
    fetchDropdownData();
    fetchTransactions();
    fetchOrgSettings();
  }, [dateFilter, filterType]);

  const handlePresetChange = (e) => {
    const val = e.target.value;
    const now = new Date();
    let start = '';
    let end = '';

    switch(val) {
      case 'this_month':
        start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
        break;
      case 'last_month':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10);
        end = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10);
        break;
      case 'this_year':
        start = new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10);
        end = new Date(now.getFullYear(), 11, 31).toISOString().slice(0, 10);
        break;
      case 'last_year':
        start = new Date(now.getFullYear() - 1, 0, 1).toISOString().slice(0, 10);
        end = new Date(now.getFullYear() - 1, 11, 31).toISOString().slice(0, 10);
        break;
      case 'custom':
        start = dateFilter.start;
        end = dateFilter.end;
        break;
      default:
        break;
    }
    setDateFilter({ preset: val, start, end });
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateFilter(prev => ({ ...prev, preset: 'custom', [name]: value }));
  };

  const fetchOrgSettings = async () => {
    const { data } = await supabase
      .from('site_settings')
      .select('key, value')
      .in('key', ['org_name', 'org_address', 'org_tax_id', 'exemption_date', 'exemption_office']);
    
    const settings = {};
    if (data) {
      data.forEach(item => { settings[item.key] = item.value; });
    }
    setOrgSettings(settings);
  };

  const fetchDropdownData = async () => {
    const { data: catData } = await supabase.from('accounting_categories').select('*').eq('is_active', true);
    const { data: accData } = await supabase.from('accounting_accounts').select('*').eq('is_active', true);
    const { data: conData } = await supabase.from('accounting_contacts').select('id, name, address').order('name');

    if (catData) setCategories(catData);
    if (accData) setAccounts(accData);
    if (conData) setContacts(conData);
  };

  const fetchTransactions = async () => {
    setLoading(true);
    let query = supabase
      .from('accounting_transactions')
      .select(`*, accounting_categories (name, type), accounting_accounts (name), accounting_contacts (name)`)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (filterType !== 'all') query = query.eq('type', filterType);
    if (dateFilter.start) query = query.gte('date', dateFilter.start);
    if (dateFilter.end) query = query.lte('date', dateFilter.end);

    const { data, error } = await query;
    if (error) console.error(error);
    else setTransactions(data || []);
    setLoading(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = async (e) => {
    try {
      setUploading(true);
      const file = e.target.files[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error } = await supabase.storage.from('receipts').upload(filePath, file);
      if (error) throw error;

      setFormData(prev => ({ ...prev, document_url: filePath }));
      alert('Datei erfolgreich hochgeladen!');
    } catch (error) {
      alert('Fehler: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const openDocument = async (path) => {
    if (!path) return;
    const { data, error } = await supabase.storage.from('receipts').createSignedUrl(path, 60);
    if (error) { alert(error.message); return; }
    window.open(data.signedUrl, '_blank');
  };

  // --- YAZDIRMA FONKSİYONLARI ---

  // 1. BELEG DRUCKEN (Standart Fiş)
  const printVoucher = async (trx) => {
    let signedUrl = null;
    let isPdf = false;
    if (trx.document_url) {
      const { data } = await supabase.storage.from('receipts').createSignedUrl(trx.document_url, 60);
      if (data) signedUrl = data.signedUrl;
      if (trx.document_url.toLowerCase().endsWith('.pdf')) isPdf = true;
    }
    if (isPdf && signedUrl) { window.open(signedUrl, '_blank'); return; }

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) return;

    const dateStr = new Date(trx.date).toLocaleDateString('de-DE');
    const amountStr = parseFloat(trx.amount).toFixed(2) + ' €';
    const typeStr = trx.type === 'income' ? 'Einnahme' : 'Ausgabe';
    
    const htmlContent = `
      <html>
        <head>
          <title>Beleg - ${trx.id}</title>
          <style>
            body { font-family: Arial; padding: 20px; }
            .header { border-bottom: 2px solid #333; margin-bottom: 20px; }
            .row { display: flex; margin-bottom: 10px; border-bottom: 1px solid #eee; }
            .label { font-weight: bold; width: 150px; }
            img { max-width: 100%; max-height: 800px; }
          </style>
        </head>
        <body>
          <div class="header"><h3>Buchungsbeleg</h3></div>
          <div class="row"><div class="label">Datum:</div><div>${dateStr}</div></div>
          <div class="row"><div class="label">Typ:</div><div>${typeStr}</div></div>
          <div class="row"><div class="label">Kategorie:</div><div>${trx.accounting_categories?.name}</div></div>
          <div class="row"><div class="label">Beschreibung:</div><div>${trx.description || '-'}</div></div>
          <div class="row"><div class="label">Betrag:</div><div style="font-weight:bold;">${amountStr}</div></div>
          ${signedUrl ? `<div style="margin-top:30px;"><img src="${signedUrl}" onload="window.print()" /></div>` : '<script>window.onload = function() { window.print(); }</script>'}
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // 2. SPENDENBESCHEINIGUNG (Bağış Makbuzu - GÜNCELLENDİ)
  const printDonationReceipt = (trx) => {
    if (trx.type !== 'income') return;
    const contact = contacts.find(c => c.id === trx.contact_id);
    if (!contact || !contact.address) { alert('Kontakt oder Adresse fehlt!'); return; }

    const printWindow = window.open('', '_blank', 'width=900,height=1000');
    if (!printWindow) return;

    const dateStr = new Date(trx.date).toLocaleDateString('de-DE');
    const amountVal = parseFloat(trx.amount);
    const amountStr = amountVal.toFixed(2).replace('.', ',');
    // Basit sayıdan yazıya çevirme (Örn: 50.00 -> 50 Euro und 00 Cent)
    const amountInWords = `${Math.floor(amountVal)} Euro und ${(amountVal % 1).toFixed(2).substring(2)} Cent`; 

    // Organizasyon verileri (Word belgesi ve prompt'tan)
    const orgName = "Bürgertreff Wissen e.V.";
    const stNr = "02/650/36212";
    const exemptionDate = orgSettings.exemption_date ? new Date(orgSettings.exemption_date).toLocaleDateString('de-DE') : "03.06.2025";
    const faName = orgSettings.exemption_office || "Finanzamt Altenkirchen";

    const htmlContent = `
      <html>
        <head>
          <title>Spendenbescheinigung</title>
          <style>
            @page { size: A4; margin: 15mm 20mm; }
            body { font-family: Arial, Helvetica, sans-serif; font-size: 11pt; line-height: 1.3; color: #000; margin-bottom: 50px; }
            .container { width: 100%; max-width: 210mm; margin: 0 auto; }
            
            .header-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .logo-img { max-width: 200px; height: auto; }
            
            h1 { font-size: 18pt; font-weight: bold; text-align: left; margin: 10px 0; }
            .issuer { font-weight: bold; margin-bottom: 10px; }
            .legal-text { font-size: 10pt; text-align: justify; margin-bottom: 15px; }
            
            .box-section { border: 1px solid #000; padding: 10px; margin-bottom: 15px; background-color: #fcfcfc; }
            .data-grid { display: grid; grid-template-columns: 1fr 2fr 1fr; gap: 10px; margin-bottom: 10px; border: 1px solid #000; padding: 10px; }
            .grid-item strong { display: block; font-size: 9pt; margin-bottom: 5px; }
            
            .checkbox-row { display: flex; justify-content: space-between; align-items: center; border: 1px solid #000; padding: 10px; margin-bottom: 15px; }
            
            .tax-info { font-size: 9pt; margin-bottom: 15px; line-height: 1.4; }
            .tax-info ul { list-style: none; padding-left: 0; }
            .tax-info li { margin-bottom: 5px; padding-left: 15px; position: relative; }
            .tax-info li::before { content: "•"; position: absolute; left: 0; }
            
            .signature-box { display: flex; justify-content: space-between; margin-top: 30px; margin-bottom: 40px; }
            .sig-line { border-top: 1px solid #000; width: 40%; text-align: center; padding-top: 5px; font-size: 9pt; }
            
            /* Footer Stili - Sabit Alt Bilgi */
            .page-footer {
              position: fixed;
              bottom: 0;
              left: 0;
              right: 0;
              text-align: center;
              font-size: 8pt;
              color: #444;
              border-top: 1px solid #ccc;
              padding-top: 5px;
              padding-bottom: 5px;
              background-color: #fff;
              line-height: 1.4;
            }

            @media print {
              body { margin: 0; }
              .box-section, .data-grid, .checkbox-row { border: 1px solid #000 !important; }
              .page-footer { position: fixed; bottom: 0; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            
            <table class="header-table">
              <tr>
                <td style="width: 70%;"></td>
                <td style="width: 30%; text-align: right;">
                  <img src="/logo.png" alt="Logo" class="logo-img" onerror="this.style.display='none'; this.parentElement.innerHTML='[LOGO]';" />
                </td>
              </tr>
            </table>

            <h1>Spendenbescheinigung</h1>
            
            <div class="issuer">Aussteller: ${orgName}</div>

            <div class="legal-text">
              Bestätigung über Geldzuwendungen im Sinne des § 10b des Einkommensteuergesetzes an eine der in § 5 Abs. 1 Nr. 9 des Körperschaftsteuergesetzes bezeichneten Körperschaften.
            </div>

            <div class="box-section">
              <div><strong>Name und Anschrift des Zuwendenden:</strong></div>
              <div style="margin-top: 10px; font-size: 12pt;">
                ${contact.name}<br>${contact.address}
              </div>
            </div>

            <div class="data-grid">
              <div class="grid-item">
                <strong>Betrag der Zuwendung in Ziffern:</strong>
                <span style="font-size: 12pt;">${amountStr} €</span>
              </div>
              <div class="grid-item">
                <strong>Betrag der Zuwendung in Buchstaben:</strong>
                <span style="font-size: 11pt; font-style: italic;">${amountInWords}</span>
              </div>
              <div class="grid-item">
                <strong>Tag der Zuwendung:</strong>
                <span style="font-size: 12pt;">${dateStr}</span>
              </div>
            </div>

            <div class="checkbox-row">
              <div class="cb-label">Es handelt sich um den Verzicht auf Erstattung von Aufwendungen</div>
              <div class="cb-options"><span>( ) Ja</span> &nbsp;&nbsp; <span>(X) Nein</span></div>
            </div>

            <div class="tax-info">
              <div><strong>Wir sind wegen Förderung</strong></div>
              <ul>
                <li>der Jugend- und Altenhilfe</li>
                <li>internationaler Gesinnung, der Toleranz und des Völkerverständigungsgedankens</li>
                <li>des bürgerschaftlichen Engagements zugunsten gemeinnütziger Zwecke</li>
              </ul>
              <div style="margin-top: 10px; text-align: justify;">
                nach dem Freistellungsbescheid des <strong>${faName}</strong>, Steuernummer <strong>${stNr}</strong>, vom <strong>${exemptionDate}</strong> von der Körperschaftsteuer befreit.
              </div>
            </div>

            <div style="margin: 20px 0; font-weight: bold;">
              Die Zuwendung wird von uns unmittelbar für den angegebenen Zweck verwendet.
            </div>

            <div class="signature-box">
              <div class="sig-line">Wissen, den ${new Date().toLocaleDateString('de-DE')}</div>
              <div class="sig-line">Unterschrift</div>
            </div>

          </div>

          <div class="page-footer" style="text-align: left;">
            Bürgertreff Wissen e.V., c/o Erika Uber (1. Vorsitzende), Hauptstr. 79, 57587 Birken-Honigsessen<br>
            Tel. 01516 5179082 - buergertreff.wissen@gmail.com – www.buergertreff-wissen.de<br>
            Sparkasse Westerwald-Sieg IBAN: DE27 5735 1030 0055 0844 38 BIC: MALADE51AKI<br>
            StNr. 02/650/36212 – Die Gemeinnützigkeit ist anerkannt
          </div>

          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // 3. LISTE DRUCKEN
  const printList = () => {
    const printWindow = window.open('', '_blank', 'width=1000,height=800');
    if (!printWindow) return;
    const dateStr = new Date().toLocaleDateString('de-DE');
    
    const htmlContent = `
      <html>
        <head>
          <title>Buchungsliste</title>
          <style>
            body { font-family: Arial; padding: 20px; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .amount { text-align: right; }
            .income { color: green; }
            .expense { color: red; }
          </style>
        </head>
        <body>
          <h1>Buchungsliste</h1>
          <p>Datum: ${dateStr}</p>
          <table>
            <thead>
              <tr><th>Datum</th><th>Kat.</th><th>Beschreibung</th><th>Kontakt</th><th class="amount">Einnahme</th><th class="amount">Ausgabe</th></tr>
            </thead>
            <tbody>
              ${transactions.map(trx => {
                const isIncome = trx.type === 'income';
                const amount = parseFloat(trx.amount).toFixed(2).replace('.', ',');
                return `
                  <tr>
                    <td>${new Date(trx.date).toLocaleDateString('de-DE')}</td>
                    <td>${trx.accounting_categories?.name || ''}</td>
                    <td>${trx.description || ''}</td>
                    <td>${trx.accounting_contacts?.name || ''}</td>
                    <td class="amount income">${isIncome ? amount + ' €' : ''}</td>
                    <td class="amount expense">${!isIncome ? amount + ' €' : ''}</td>
                  </tr>`;
              }).join('')}
            </tbody>
          </table>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || !formData.category_id || !formData.account_id) {
      alert('Pflichtfelder fehlen!'); return;
    }
    const payload = { ...formData, contact_id: formData.contact_id || null };

    if (editingId) {
      const { error } = await supabase.from('accounting_transactions').update(payload).eq('id', editingId);
      if (!error) { fetchTransactions(); resetForm(); } else alert(error.message);
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('accounting_transactions').insert([{ ...payload, created_by: user.id }]);
      if (!error) { fetchTransactions(); resetForm(); } else alert(error.message);
    }
  };

  const handleEdit = (trx) => {
    setFormData({
      date: trx.date, type: trx.type, amount: trx.amount, category_id: trx.category_id,
      account_id: trx.account_id, contact_id: trx.contact_id || '', receipt_no: trx.receipt_no || '',
      file_no: trx.file_no || '', description: trx.description || '', document_url: trx.document_url || ''
    });
    setEditingId(trx.id);
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Löschen?')) return;
    const { error } = await supabase.from('accounting_transactions').delete().eq('id', id);
    if (!error) setTransactions(transactions.filter(t => t.id !== id));
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().slice(0, 10), type: 'expense', amount: '', category_id: '',
      account_id: '', contact_id: '', receipt_no: '', file_no: '', description: '', document_url: ''
    });
    setEditingId(null);
    setIsFormOpen(false);
  };

  const filteredCategories = categories.filter(c => c.type === formData.type);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Üst Bar */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex gap-2 items-center">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button onClick={() => setFilterType('all')} className={`px-3 py-1 rounded-md text-sm ${filterType === 'all' ? 'bg-white shadow text-blue-600' : 'text-gray-600'}`}>Alle</button>
            <button onClick={() => setFilterType('income')} className={`px-3 py-1 rounded-md text-sm ${filterType === 'income' ? 'bg-white shadow text-green-600' : 'text-gray-600'}`}>Einnahmen</button>
            <button onClick={() => setFilterType('expense')} className={`px-3 py-1 rounded-md text-sm ${filterType === 'expense' ? 'bg-white shadow text-red-600' : 'text-gray-600'}`}>Ausgaben</button>
          </div>
          <select value={dateFilter.preset} onChange={handlePresetChange} className="bg-gray-50 border p-1 rounded text-sm">
            <option value="this_year">Dieses Jahr</option>
            <option value="last_month">Letzten Monat</option>
            <option value="custom">Benutzerdefiniert</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button onClick={printList} className="bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"><FaPrint /> Liste</button>
          <button onClick={() => { resetForm(); setIsFormOpen(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"><FaPlus /> Neu</button>
        </div>
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <h3 className="text-lg font-bold mb-4">{editingId ? 'Bearbeiten' : 'Neue Transaktion'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex gap-4">
                <label className="flex-1 border p-2 text-center rounded"><input type="radio" name="type" value="income" checked={formData.type === 'income'} onChange={handleInputChange} className="mr-2"/>Einnahme (+)</label>
                <label className="flex-1 border p-2 text-center rounded"><input type="radio" name="type" value="expense" checked={formData.type === 'expense'} onChange={handleInputChange} className="mr-2"/>Ausgabe (-)</label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input type="date" name="date" value={formData.date} onChange={handleInputChange} className="border p-2 rounded w-full" required />
                <input type="number" name="amount" value={formData.amount} onChange={handleInputChange} placeholder="Betrag €" className="border p-2 rounded w-full" step="0.01" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <select name="category_id" value={formData.category_id} onChange={handleInputChange} className="border p-2 rounded w-full" required>
                  <option value="">Kategorie wählen...</option>
                  {filteredCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select name="account_id" value={formData.account_id} onChange={handleInputChange} className="border p-2 rounded w-full" required>
                  <option value="">Konto wählen...</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <select name="contact_id" value={formData.contact_id} onChange={handleInputChange} className="border p-2 rounded w-full">
                <option value="">Kontakt (Optional)...</option>
                {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input type="text" name="description" value={formData.description} onChange={handleInputChange} placeholder="Beschreibung" className="border p-2 rounded w-full" />
              
              <div className="border-t pt-4">
                <label className="block text-sm mb-2">Beleg (Optional)</label>
                <input type="file" onChange={handleFileUpload} disabled={uploading} className="block w-full text-sm text-gray-500" />
                {formData.document_url && <div className="text-xs text-green-600 mt-1"><FaPaperclip /> Datei vorhanden</div>}
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={resetForm} className="bg-gray-200 px-4 py-2 rounded">Abbrechen</button>
                <button type="submit" disabled={uploading} className="bg-blue-600 text-white px-4 py-2 rounded">Speichern</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tablo */}
      <style>{`
        @media (max-width: 768px) {
          .responsive-table thead { display: none; }
          .responsive-table, .responsive-table tbody, .responsive-table tr, .responsive-table td { display: block; width: 100%; }
          .responsive-table tr { margin-bottom: 1rem; border-bottom: 1px solid #eee; }
          .responsive-table td { text-align: left !important; padding-left: 40%; position: relative; min-height: 40px; }
          .responsive-table td:before {
            position: absolute;
            left: 1rem;
            top: 0.75rem;
            width: 35%;
            white-space: nowrap;
            font-weight: bold;
            color: #888;
          }
          .responsive-table td[data-label]:before { content: attr(data-label); }
        }
        .amount-cell { white-space: nowrap; }
        .amount-euro { margin-left: 2px; }
      `}</style>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 responsive-table">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Datum</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kategorie</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Konto / Kontakt</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Betrag</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aktionen</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.map((trx) => (
              <tr key={trx.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-600" data-label="Datum">
                  {new Date(trx.date).toLocaleDateString('de-DE')}
                  {trx.file_no && <div className="text-xs text-blue-600">Ordner: {trx.file_no}</div>}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900" data-label="Kategorie">
                  {trx.accounting_categories?.name}
                  <div className="text-xs text-gray-500">{trx.description}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900" data-label="Konto / Kontakt">
                  {trx.accounting_accounts?.name}
                  {trx.accounting_contacts && <div className="text-xs text-blue-600">{trx.accounting_contacts.name}</div>}
                </td>
                <td className={`px-6 py-4 text-right text-sm font-bold amount-cell ${trx.type === 'income' ? 'text-green-600' : 'text-red-600'}`} data-label="Betrag">
                  {trx.type === 'income' ? '+' : '-'} {parseFloat(trx.amount).toFixed(2)}<span className="amount-euro"> €</span>
                </td>
                <td className="px-6 py-4 text-right text-sm font-medium flex justify-end gap-2" data-label="Aktionen">
                  <button onClick={() => printVoucher(trx)} className="text-gray-600 hover:text-gray-900" title="Beleg"><FaPrint /></button>
                  {trx.type === 'income' && parseFloat(trx.amount) <= 300 && (
                    <button onClick={() => printDonationReceipt(trx)} className="text-pink-600 hover:text-pink-900" title="Spendenbescheinigung"><FaHandHoldingHeart /></button>
                  )}
                  <button onClick={() => handleEdit(trx)} className="text-blue-600 hover:text-blue-900"><FaEdit /></button>
                  <button onClick={() => handleDelete(trx.id)} className="text-red-600 hover:text-red-900"><FaTrash /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}