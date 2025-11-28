import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { 
  FaPlus, FaEdit, FaTrash, FaSearch, FaFileInvoice, FaFilter, 
  FaArrowDown, FaArrowUp, FaPaperclip, FaExclamationTriangle, FaSpinner, FaPrint, FaHandHoldingHeart, FaIdCard 
} from 'react-icons/fa';

export default function BuchhaltungTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filtreleme State'leri
  const [filterType, setFilterType] = useState('all'); // all, income, expense
  const [dateFilter, setDateFilter] = useState({
    preset: 'this_year', // this_month, last_month, this_year, last_year, custom
    start: new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10), // Jan 1st
    end: new Date(new Date().getFullYear(), 11, 31).toISOString().slice(0, 10)  // Dec 31st
  });
  
  // Dropdown Verileri
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [orgSettings, setOrgSettings] = useState({});

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [uploading, setUploading] = useState(false); // Dosya yükleniyor mu?
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    type: 'expense',
    amount: '',
    category_id: '',
    account_id: '',
    contact_id: '',
    receipt_no: '', // Fatura/Fiş No
    file_no: '', // Dosya Sıra No (Ordner-Nr.)
    description: '',
    document_url: '' // Dosya yolu (path)
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
    setDateFilter(prev => ({
      ...prev,
      preset: 'custom',
      [name]: value
    }));
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
      .select(`
        *,
        accounting_categories (name, type),
        accounting_accounts (name),
        accounting_contacts (name)
      `)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (filterType !== 'all') {
      query = query.eq('type', filterType);
    }
    
    if (dateFilter.start) {
      query = query.gte('date', dateFilter.start);
    }
    if (dateFilter.end) {
      query = query.lte('date', dateFilter.end);
    }

    const { data, error } = await query;
    
    if (error) console.error('Error fetching transactions:', error);
    else setTransactions(data || []);
    setLoading(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // --- DOSYA YÜKLEME İŞLEMİ ---
  const handleFileUpload = async (e) => {
    try {
      setUploading(true);
      const file = e.target.files[0];
      if (!file) return;

      // Dosya ismi: YYYYMMDD_Random_OrjinalIsim
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      // Supabase Storage'a yükle
      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Başarılı ise dosya yolunu state'e kaydet
      setFormData(prev => ({ ...prev, document_url: filePath }));
      alert('Datei erfolgreich hochgeladen!');

    } catch (error) {
      alert('Fehler beim Hochladen: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  // --- DOSYA GÖRÜNTÜLEME (Signed URL) ---
  const openDocument = async (path) => {
    if (!path) return;
    
    // Private bucket olduğu için "Signed URL" oluşturuyoruz (60 saniye geçerli)
    const { data, error } = await supabase.storage
      .from('receipts')
      .createSignedUrl(path, 60);

    if (error) {
      alert('Fehler beim Öffnen: ' + error.message);
      return;
    }

    // Yeni sekmede aç
    window.open(data.signedUrl, '_blank');
  };

  // --- YAZDIRMA (BELEG DRUCKEN) ---
  const printVoucher = async (trx) => {
    let signedUrl = null;
    let isPdf = false;

    if (trx.document_url) {
      const { data } = await supabase.storage.from('receipts').createSignedUrl(trx.document_url, 60);
      if (data) signedUrl = data.signedUrl;
      if (trx.document_url.toLowerCase().endsWith('.pdf')) isPdf = true;
    }

    if (isPdf && signedUrl) {
      // PDF ise direkt aç, tarayıcıdan yazdırsınlar
      window.open(signedUrl, '_blank');
      return;
    }

    // HTML Penceresi oluştur
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) return;

    const dateStr = new Date(trx.date).toLocaleDateString('de-DE');
    const amountStr = parseFloat(trx.amount).toFixed(2) + ' €';
    const typeStr = trx.type === 'income' ? 'Einnahme' : 'Ausgabe';
    
    const htmlContent = `
      <html>
        <head>
          <title>Buchungsbeleg - ${trx.id}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
            .title { font-size: 24px; font-weight: bold; }
            .meta { margin-bottom: 20px; }
            .row { display: flex; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
            .label { font-weight: bold; width: 150px; }
            .value { flex: 1; }
            .image-container { margin-top: 30px; text-align: center; }
            img { max-width: 100%; max-height: 800px; border: 1px solid #ddd; }
            @media print {
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">Buchungsbeleg</div>
            <div>Bürgertreff Wissen e.V.</div>
          </div>
          
          <div class="meta">
            <div class="row"><div class="label">Datum:</div><div class="value">${dateStr}</div></div>
            <div class="row"><div class="label">Typ:</div><div class="value">${typeStr}</div></div>
            <div class="row"><div class="label">Kategorie:</div><div class="value">${trx.accounting_categories?.name || '-'}</div></div>
            <div class="row"><div class="label">Konto:</div><div class="value">${trx.accounting_accounts?.name || '-'}</div></div>
            <div class="row"><div class="label">Kontakt:</div><div class="value">${trx.accounting_contacts?.name || '-'}</div></div>
            <div class="row"><div class="label">Beschreibung:</div><div class="value">${trx.description || '-'}</div></div>
            <div class="row"><div class="label">Betrag:</div><div class="value" style="font-size: 1.2em; font-weight: bold;">${amountStr}</div></div>
          </div>

          ${signedUrl ? `
            <div class="image-container">
              <h3>Beleg / Quittung:</h3>
              <img src="${signedUrl}" onload="window.print();" onerror="alert('Bild konnte nicht geladen werden');" />
            </div>
          ` : '<div class="image-container"><p>Kein Beleg vorhanden.</p></div>'}
          
          ${!signedUrl ? '<script>window.onload = function() { window.print(); }</script>' : ''}
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // --- BAĞIŞ MAKBUZU (SPENDENBESCHEINIGUNG) ---
  const printDonationReceipt = (trx) => {
    if (trx.type !== 'income') return;
    
    const contact = contacts.find(c => c.id === trx.contact_id);
    if (!contact) {
      alert('Bitte wählen Sie zuerst einen Kontakt für diese Transaktion aus.');
      return;
    }
    if (!contact.address) {
      alert('Für diesen Kontakt ist keine Adresse hinterlegt. Bitte ergänzen Sie die Adresse im Kontakt-Menü.');
      return;
    }

    const printWindow = window.open('', '_blank', 'width=900,height=1000');
    if (!printWindow) return;

    const dateStr = new Date(trx.date).toLocaleDateString('de-DE');
    const amountStr = parseFloat(trx.amount).toFixed(2).replace('.', ',');
    
    // Organizasyon Bilgileri (Varsayılanlar veya Ayarlardan)
    const orgName = orgSettings.org_name || 'Bürgertreff Wissen e.V.';
    const orgAddress = orgSettings.org_address || 'Mittelstraße, 57537 Wissen';
    const orgTaxId = orgSettings.org_tax_id || '[Steuernummer fehlt]';
    const exemptionDate = orgSettings.exemption_date ? new Date(orgSettings.exemption_date).toLocaleDateString('de-DE') : '[Datum fehlt]';
    const exemptionOffice = orgSettings.exemption_office || 'Finanzamt Altenkirchen-Hachenburg';

    const htmlContent = `
      <html>
        <head>
          <title>Spendenbescheinigung - ${trx.id}</title>
          <style>
            body { font-family: 'Times New Roman', serif; padding: 20px; line-height: 1.3; font-size: 11pt; }
            h1 { font-size: 14pt; font-weight: bold; text-align: center; margin-bottom: 15px; text-decoration: underline; }
            h2 { font-size: 12pt; font-weight: bold; margin-top: 15px; margin-bottom: 8px; border-bottom: 1px solid #000; padding-bottom: 3px; }
            .section { margin-bottom: 10px; }
            .label { font-weight: bold; }
            .value { margin-left: 10px; }
            .box { border: 1px solid #ccc; padding: 8px; background: #f9f9f9; margin: 8px 0; font-size: 10pt; }
            .footer { margin-top: 30px; }
            .signature-line { border-top: 1px solid #000; width: 250px; margin-top: 30px; }
            .small-text { font-size: 9pt; color: #555; }
            ul { margin-top: 5px; margin-bottom: 5px; }
            li { margin-bottom: 5px; }
            @media print {
              body { padding: 0; margin: 15mm; }
              .box { background: none; border: 1px solid #000; }
            }
          </style>
        </head>
        <body>
          <h1>Vereinfachte Zuwendungsbestätigung<br><span style="font-size: 11pt; font-weight: normal; text-decoration: none;">(für Spenden bis 300 € gemäß § 50 EStDV)</span></h1>

          <div class="section">
            <h2>1. Zuwendungsempfänger (Der Verein)</h2>
            <div><span class="label">Name:</span> ${orgName}</div>
            <div><span class="label">Anschrift:</span> ${orgAddress}</div>
            <div><span class="label">Steuernummer:</span> ${orgTaxId}</div>
          </div>

          <div class="section">
            <h2>2. Zuwendender (Der Spender)</h2>
            <div><span class="label">Name / Firma:</span> ${contact.name}</div>
            <div><span class="label">Anschrift:</span> ${contact.address}</div>
            <div><span class="label">Datum der Zuwendung:</span> ${dateStr}</div>
          </div>

          <div class="section">
            <h2>3. Angaben zur Zuwendung</h2>
            <div><span class="label">Betrag:</span> ${amountStr} Euro</div>
            <div><span class="label">Art der Zuwendung:</span> Geldzuwendung (Kein Mitgliedsbeitrag)</div>
            <div><span class="label">Verwendungszweck:</span> Förderung steuerbegünstigter Zwecke gemäß Satzung</div>
          </div>

          <div class="section box">
            <h2>4. Steuerliche Anerkennung (Wichtig für das Finanzamt)</h2>
            <p>
              1. <strong>Steuerfreistellung:</strong> Wir sind wegen Förderung gemeinnütziger Zwecke nach dem letzten uns zugegangenen Freistellungsbescheid des Finanzamts ${exemptionOffice} vom <strong>${exemptionDate}</strong> von der Körperschaftsteuer befreit.
            </p>
            <p>
              2. <strong>Verwendung:</strong> Die Zuwendung wird nur für satzungsmäßige, gemeinnützige Zwecke verwendet.
            </p>
            <p>
              3. <strong>Bestätigung:</strong> Es wird bestätigt, dass es sich nicht um einen Mitgliedsbeitrag handelt, sondern um eine freiwillige Spende.
            </p>
          </div>

          <div class="section">
            <h2>5. Hinweis für den Spender</h2>
            <p class="small-text">
              <strong>Achtung:</strong> Diese Bestätigung allein reicht nicht aus! Um die Spende steuerlich geltend zu machen, müssen Sie diese Bestätigung zusammen mit Ihrem <strong>Kontoauszug</strong> (Buchungsbestätigung der Bank) oder dem Einzahlungsbeleg beim Finanzamt einreichen. Auf dem Bankbeleg müssen Name und Kontonummer von Auftraggeber und Empfänger sowie Betrag und Buchungstag ersichtlich sein.
            </p>
          </div>

          <div class="footer">
            <p>Wissen, den ${new Date().toLocaleDateString('de-DE')}</p>
            <div class="signature-line"></div>
            <p>Unterschrift (Schatzmeister / Vorstand)</p>
            <p style="font-size: 8pt; margin-top: 5px;">(Dieses Dokument wurde maschinell erstellt und ist ohne Unterschrift nur als Vorlage gültig.)</p>
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

  // --- ÜYELİK AİDATI MAKBUZU (MITGLIEDSBEITRAG) ---
  const printMembershipFeeReceipt = (trx) => {
    if (trx.type !== 'income') return;
    
    const contact = contacts.find(c => c.id === trx.contact_id);
    if (!contact) {
      alert('Bitte wählen Sie zuerst einen Kontakt (Mitglied) für diese Transaktion aus.');
      return;
    }
    if (!contact.address) {
      alert('Für diesen Kontakt ist keine Adresse hinterlegt. Bitte ergänzen Sie die Adresse im Kontakt-Menü.');
      return;
    }

    const printWindow = window.open('', '_blank', 'width=900,height=1000');
    if (!printWindow) return;

    const dateObj = new Date(trx.date);
    const dateStr = dateObj.toLocaleDateString('de-DE');
    const yearStr = dateObj.getFullYear();
    const amountStr = parseFloat(trx.amount).toFixed(2).replace('.', ',');
    
    // Organizasyon Bilgileri
    const orgName = orgSettings.org_name || 'Bürgertreff Wissen e.V.';
    const orgAddress = orgSettings.org_address || 'Mittelstraße, 57537 Wissen';
    const orgTaxId = orgSettings.org_tax_id || '[Steuernummer fehlt]';
    const exemptionDate = orgSettings.exemption_date ? new Date(orgSettings.exemption_date).toLocaleDateString('de-DE') : '[Datum fehlt]';
    const exemptionOffice = orgSettings.exemption_office || 'Finanzamt Altenkirchen-Hachenburg';

    const htmlContent = `
      <html>
        <head>
          <title>Mitgliedsbeitrag - ${trx.id}</title>
          <style>
            body { font-family: 'Times New Roman', serif; padding: 20px; line-height: 1.4; font-size: 11pt; }
            h1 { font-size: 14pt; font-weight: bold; text-align: center; margin-bottom: 5px; }
            .subtitle { text-align: center; font-size: 11pt; margin-bottom: 20px; font-style: italic; }
            h2 { font-size: 12pt; font-weight: bold; margin-top: 20px; margin-bottom: 10px; border-bottom: 1px solid #000; padding-bottom: 3px; }
            .section { margin-bottom: 15px; }
            .label { font-weight: bold; display: inline-block; width: 180px; }
            .value { display: inline-block; }
            .box { border: 1px solid #ccc; padding: 10px; background: #f9f9f9; margin: 15px 0; font-size: 10pt; }
            .footer { margin-top: 40px; }
            .signature-line { border-top: 1px solid #000; width: 250px; margin-top: 40px; }
            .small-text { font-size: 9pt; color: #555; }
            @media print {
              body { padding: 0; margin: 15mm; }
              .box { background: none; border: 1px solid #000; }
            }
          </style>
        </head>
        <body>
          <h1>BESTÄTIGUNG ÜBER MITGLIEDSBEITRÄGE</h1>
          <div class="subtitle">(Kleinbeträge bis 300 €)</div>

          <div class="section">
            <h2>1. Zuwendungsempfänger (Der Verein)</h2>
            <div><span class="label">Name:</span> ${orgName}</div>
            <div><span class="label">Anschrift:</span> ${orgAddress}</div>
            <div><span class="label">Steuernummer:</span> ${orgTaxId}</div>
          </div>

          <div class="section">
            <h2>2. Zuwendender (Das Mitglied)</h2>
            <div><span class="label">Name:</span> ${contact.name}</div>
            <div><span class="label">Anschrift:</span> ${contact.address}</div>
            <div><span class="label">Mitgliedsnummer:</span> ___________________</div>
          </div>

          <div class="section">
            <h2>3. Zahlungsdetails</h2>
            <div><span class="label">Beitragszeitraum:</span> Mitgliedsbeitrag ${yearStr}</div>
            <div><span class="label">Betrag:</span> ${amountStr} Euro</div>
            <div><span class="label">Zahlungstag:</span> ${dateStr}</div>
            <div><span class="label">Zahlungsart:</span> ${trx.description && trx.description.toLowerCase().includes('bank') ? 'Banküberweisung' : 'Bar / Sonstiges'}</div>
          </div>

          <div class="section box">
            <h2>4. Wichtige Hinweise (Steuerliche Anerkennung)</h2>
            <p>Diese Bestätigung dient dem Nachweis eines Mitgliedsbeitrags gemäß deutscher Gesetzgebung.</p>
            <p>
              <strong>1. Art der Zahlung:</strong> Es handelt sich um einen satzungsmäßigen <strong>MITGLIEDSBEITRAG</strong>. (Dies ist keine Spende).
            </p>
            <p>
              <strong>2. Steuerstatus des Vereins:</strong> Der Verein <em>${orgName}</em> ist nach dem letzten uns zugegangenen Freistellungsbescheid des Finanzamts <em>${exemptionOffice}</em> vom <strong>${exemptionDate}</strong> als steuerbegünstigte Körperschaft (gemeinnützig) anerkannt und von der Körperschaftsteuer befreit.
            </p>
            <p>
              Dieser Beitrag wird ausschließlich für die in der Satzung festgelegten steuerbegünstigten Zwecke verwendet.
            </p>
          </div>

          <div class="footer">
            <p>Wissen, den ${new Date().toLocaleDateString('de-DE')}</p>
            <div class="signature-line"></div>
            <p>Unterschrift (Schatzmeister / Vorstand)</p>
            <p class="small-text" style="margin-top: 10px;">
              <strong>Hinweis:</strong> Für Beiträge bis 300 € genügt dem Finanzamt in der Regel diese Bestätigung in Verbindung mit dem Bareinzahlungsbeleg oder der Buchungsbestätigung eines Kreditinstituts (Kontoauszug).
            </p>
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

  // --- LİSTE YAZDIRMA (LISTE DRUCKEN) ---
  const printList = () => {
    const printWindow = window.open('', '_blank', 'width=1000,height=800');
    if (!printWindow) return;

    const dateStr = new Date().toLocaleDateString('de-DE');
    
    const htmlContent = `
      <html>
        <head>
          <title>Buchungsliste - ${dateStr}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; font-size: 12px; }
            h1 { text-align: center; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .amount { text-align: right; }
            .income { color: green; }
            .expense { color: red; }
            @media print {
              body { padding: 0; }
              table { page-break-inside: auto; }
              tr { page-break-inside: avoid; page-break-after: auto; }
            }
          </style>
        </head>
        <body>
          <h1>Buchungsliste / Kassenbuch</h1>
          <p>Gedruckt am: ${dateStr}</p>
          
          <table>
            <thead>
              <tr>
                <th>Lfd. Nr.</th>
                <th>Datum</th>
                <th>Ordner-Nr.</th>
                <th>Beleg-Nr.</th>
                <th>Kategorie</th>
                <th>Beschreibung</th>
                <th>Konto / Kontakt</th>
                <th class="amount">Einnahme</th>
                <th class="amount">Ausgabe</th>
              </tr>
            </thead>
            <tbody>
              ${transactions.map((trx, index) => {
                const isIncome = trx.type === 'income';
                const amount = parseFloat(trx.amount).toFixed(2).replace('.', ',');
                return `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${new Date(trx.date).toLocaleDateString('de-DE')}</td>
                    <td><strong>${trx.file_no || ''}</strong></td>
                    <td>${trx.receipt_no || ''}</td>
                    <td>${trx.accounting_categories?.name || ''}</td>
                    <td>${trx.description || ''}</td>
                    <td>${trx.accounting_accounts?.name || ''} ${trx.accounting_contacts ? ' / ' + trx.accounting_contacts.name : ''}</td>
                    <td class="amount income">${isIncome ? amount + ' €' : ''}</td>
                    <td class="amount expense">${!isIncome ? amount + ' €' : ''}</td>
                  </tr>
                `;
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
      alert('Bitte füllen Sie alle Pflichtfelder aus (Betrag, Kategorie, Konto).');
      return;
    }

    const payload = {
      ...formData,
      contact_id: formData.contact_id === '' ? null : formData.contact_id
    };

    if (editingId) {
      const { error } = await supabase
        .from('accounting_transactions')
        .update(payload)
        .eq('id', editingId);
        
      if (!error) {
        fetchTransactions();
        resetForm();
      } else {
        alert('Fehler: ' + error.message);
      }
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('accounting_transactions')
        .insert([{ ...payload, created_by: user.id }]);
        
      if (!error) {
        fetchTransactions();
        resetForm();
      } else {
        alert('Fehler: ' + error.message);
      }
    }
  };

  const handleEdit = (trx) => {
    setFormData({
      date: trx.date,
      type: trx.type,
      amount: trx.amount,
      category_id: trx.category_id,
      account_id: trx.account_id,
      contact_id: trx.contact_id || '',
      receipt_no: trx.receipt_no || '',
      file_no: trx.file_no || '',
      description: trx.description || '',
      document_url: trx.document_url || ''
    });
    setEditingId(trx.id);
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Sind Sie sicher? Diese Aktion kann nicht rückgängig gemacht werden.')) return;

    const { error } = await supabase
      .from('accounting_transactions')
      .delete()
      .eq('id', id);

    if (error) {
      alert('Fehler: ' + error.message);
    } else {
      setTransactions(transactions.filter(t => t.id !== id));
    }
  };

  const resetForm = () => {
    setFormData({
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
    setEditingId(null);
    setIsFormOpen(false);
  };

  const filteredCategories = categories.filter(c => c.type === formData.type);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      
      {/* ÜST BAR */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex gap-2 items-center">
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button 
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-md text-sm ${filterType === 'all' ? 'bg-white shadow text-blue-600' : 'text-gray-600'}`}
            >
              Alle
            </button>
            <button 
              onClick={() => setFilterType('income')}
              className={`px-3 py-1 rounded-md text-sm ${filterType === 'income' ? 'bg-white shadow text-green-600' : 'text-gray-600'}`}
            >
              Einnahmen
            </button>
            <button 
              onClick={() => setFilterType('expense')}
              className={`px-3 py-1 rounded-md text-sm ${filterType === 'expense' ? 'bg-white shadow text-red-600' : 'text-gray-600'}`}
            >
              Ausgaben
            </button>
          </div>
          
          {/* Tarih Filtresi */}
          <div className="flex flex-wrap gap-2 items-center bg-gray-50 p-1 rounded-lg border">
            <select
              value={dateFilter.preset}
              onChange={handlePresetChange}
              className="border-none bg-transparent text-sm font-medium focus:ring-0 cursor-pointer outline-none"
            >
              <option value="this_month">Diesen Monat</option>
              <option value="last_month">Letzten Monat</option>
              <option value="this_year">Dieses Jahr</option>
              <option value="last_year">Letztes Jahr</option>
              <option value="custom">Benutzerdefiniert</option>
            </select>

            {dateFilter.preset === 'custom' && (
              <div className="flex items-center gap-1 text-sm">
                <input 
                  type="date" 
                  name="start"
                  value={dateFilter.start} 
                  onChange={handleDateChange}
                  className="border rounded px-2 py-1 w-32"
                />
                <span className="text-gray-400">-</span>
                <input 
                  type="date" 
                  name="end"
                  value={dateFilter.end} 
                  onChange={handleDateChange}
                  className="border rounded px-2 py-1 w-32"
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={printList}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center gap-2"
            title="Liste drucken"
          >
            <FaPrint /> <span className="hidden md:inline">Liste</span>
          </button>
          <button 
            onClick={() => { resetForm(); setIsFormOpen(true); }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <FaPlus /> <span className="hidden md:inline">Neue Transaktion</span>
          </button>
        </div>
      </div>

      {/* FORM MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-bold mb-4 border-b pb-2">
                {editingId ? 'Transaktion bearbeiten' : 'Neue Transaktion'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Tip Seçimi */}
                <div className="flex gap-4 mb-4">
                  <label className={`flex-1 cursor-pointer border rounded p-3 text-center ${formData.type === 'income' ? 'bg-green-50 border-green-500 text-green-700 font-bold' : 'hover:bg-gray-50'}`}>
                    <input 
                      type="radio" 
                      name="type" 
                      value="income" 
                      checked={formData.type === 'income'} 
                      onChange={handleInputChange} 
                      className="hidden"
                    />
                    <FaArrowUp className="inline mr-2" /> Einnahme (+)
                  </label>
                  <label className={`flex-1 cursor-pointer border rounded p-3 text-center ${formData.type === 'expense' ? 'bg-red-50 border-red-500 text-red-700 font-bold' : 'hover:bg-gray-50'}`}>
                    <input 
                      type="radio" 
                      name="type" 
                      value="expense" 
                      checked={formData.type === 'expense'} 
                      onChange={handleInputChange} 
                      className="hidden"
                    />
                    <FaArrowDown className="inline mr-2" /> Ausgabe (-)
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Datum *</label>
                    <input
                      type="date"
                      name="date"
                      required
                      className="w-full border rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                      value={formData.date}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ordner-Nr.</label>
                    <input
                      type="text"
                      name="file_no"
                      placeholder="z.B. 125"
                      className="w-full border rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                      value={formData.file_no}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Beleg-Nr.</label>
                    <input
                      type="text"
                      name="receipt_no"
                      placeholder="z.B. RE-2024-001"
                      className="w-full border rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                      value={formData.receipt_no}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Betrag (€) *</label>
                    <input
                      type="number"
                      step="0.01"
                      name="amount"
                      required
                      placeholder="0.00"
                      className="w-full border rounded px-3 py-2 focus:outline-none focus:border-blue-500 font-mono"
                      value={formData.amount}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kategorie *</label>
                    <select
                      name="category_id"
                      required
                      className="w-full border rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                      value={formData.category_id}
                      onChange={handleInputChange}
                    >
                      <option value="">Bitte wählen...</option>
                      {filteredCategories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Konto (Kasse/Bank) *</label>
                    <select
                      name="account_id"
                      required
                      className="w-full border rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                      value={formData.account_id}
                      onChange={handleInputChange}
                    >
                      <option value="">Bitte wählen...</option>
                      {accounts.map(a => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kontakt (Optional)</label>
                  <select
                    name="contact_id"
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                    value={formData.contact_id}
                    onChange={handleInputChange}
                  >
                    <option value="">- Kein Kontakt -</option>
                    {contacts.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Beschreibung</label>
                  <input
                    type="text"
                    name="description"
                    placeholder="Details zur Transaktion..."
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                    value={formData.description}
                    onChange={handleInputChange}
                  />
                </div>

                {/* DOSYA YÜKLEME ALANI */}
                <div className="border-t pt-4 mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Beleg / Quittung (Optional)</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileUpload}
                      disabled={uploading}
                      className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-sm file:font-semibold
                        file:bg-blue-50 file:text-blue-700
                        hover:file:bg-blue-100"
                    />
                    {uploading && <FaSpinner className="animate-spin text-blue-600" />}
                  </div>
                  {formData.document_url && (
                    <div className="mt-2 text-sm text-green-600 flex items-center gap-2">
                      <FaPaperclip /> Datei ist hochgeladen.
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {uploading ? 'Lädt hoch...' : 'Speichern'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* LİSTE */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Datum / Ordner</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kategorie / Beschreibung</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Konto / Kontakt</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Betrag</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Beleg</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aktionen</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan="6" className="text-center py-4">Lade Daten...</td></tr>
            ) : transactions.length === 0 ? (
              <tr><td colSpan="6" className="text-center py-4 text-gray-500">Keine Transaktionen gefunden.</td></tr>
            ) : (
              transactions.map((trx) => (
                <tr key={trx.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    <div>{new Date(trx.date).toLocaleDateString('de-DE')}</div>
                    {trx.file_no && (
                      <div className="text-xs font-bold text-blue-600 mt-1" title="Ordner-Nr.">Ordner: {trx.file_no}</div>
                    )}
                    {trx.receipt_no && (
                      <div className="text-xs text-gray-400 mt-1">#{trx.receipt_no}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {trx.accounting_categories?.name || 'Unbekannt'}
                    </div>
                    <div className="text-sm text-gray-500">{trx.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{trx.accounting_accounts?.name}</div>
                    {trx.accounting_contacts && (
                      <div className="text-xs text-blue-600">{trx.accounting_contacts.name}</div>
                    )}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-bold ${trx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {trx.type === 'income' ? '+' : '-'} {parseFloat(trx.amount).toFixed(2)} €
                  </td>
                  
                  {/* BELEG DURUMU (İKONLAR) */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {trx.document_url ? (
                      <button 
                        onClick={() => openDocument(trx.document_url)}
                        className="text-green-600 hover:text-green-800 p-2 rounded-full hover:bg-green-50 transition-colors"
                        title="Beleg anzeigen"
                      >
                        <FaPaperclip size={16} />
                      </button>
                    ) : (
                      <span 
                        className="text-yellow-500 inline-block p-2" 
                        title="Kein Beleg vorhanden!"
                      >
                        <FaExclamationTriangle size={16} />
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => printVoucher(trx)}
                      className="text-gray-600 hover:text-gray-900 mr-3"
                      title="Beleg drucken"
                    >
                      <FaPrint />
                    </button>
                    {trx.type === 'income' && parseFloat(trx.amount) <= 300 && (
                      <>
                        {trx.accounting_categories?.name?.toLowerCase().includes('spende') && (
                          <button 
                            onClick={() => printDonationReceipt(trx)}
                            className="text-pink-600 hover:text-pink-900 mr-3"
                            title="Spendenbescheinigung (bis 300€)"
                          >
                            <FaHandHoldingHeart />
                          </button>
                        )}
                        {trx.accounting_categories?.name?.toLowerCase().includes('mitglied') && (
                          <button 
                            onClick={() => printMembershipFeeReceipt(trx)}
                            className="text-indigo-600 hover:text-indigo-900 mr-3"
                            title="Mitgliedsbeitrag Bestätigung (bis 300€)"
                          >
                            <FaIdCard />
                          </button>
                        )}
                      </>
                    )}
                    <button 
                      onClick={() => handleEdit(trx)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      <FaEdit />
                    </button>
                    <button 
                      onClick={() => handleDelete(trx.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
