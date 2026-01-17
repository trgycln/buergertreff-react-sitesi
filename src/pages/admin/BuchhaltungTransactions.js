import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { 
  FaPlus, FaEdit, FaTrash, FaPrint, FaHandHoldingHeart, 
  FaArrowDown, FaArrowUp, FaPaperclip, FaExclamationTriangle, FaSpinner 
} from 'react-icons/fa';

// --- YARDIMCI FONKSİYON: Sayıyı Almanca Yazıya Çevirme ---
const numberToGermanWords = (n) => {
  if (n === 0) return "null";
  
  const units = ["", "ein", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun"];
  const unitsEins = ["", "eins", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun"]; 
  const teens = ["zehn", "elf", "zwölf", "dreizehn", "vierzehn", "fünfzehn", "sechzehn", "siebzehn", "achtzehn", "neunzehn"];
  const tens = ["", "", "zwanzig", "dreißig", "vierzig", "fünfzig", "sechzig", "siebzig", "achtzig", "neunzig"];

  const convertGroup = (num) => {
    if (num === 0) return "";
    if (num < 10) return unitsEins[num]; 
    if (num < 20) return teens[num - 10];
    if (num < 100) {
      const unit = num % 10;
      const ten = Math.floor(num / 10);
      if (unit === 0) return tens[ten];
      return units[unit] + "und" + tens[ten];
    }
    const hundred = Math.floor(num / 100);
    const rest = num % 100;
    let str = units[hundred] + "hundert";
    if (rest > 0) {
      if (rest === 1) str += "eins";
      else {
        if (rest < 10) str += unitsEins[rest];
        else if (rest < 20) str += teens[rest - 10];
        else {
          const u = rest % 10;
          const t = Math.floor(rest / 10);
          if (u === 0) str += tens[t];
          else str += units[u] + "und" + tens[t];
        }
      }
    }
    return str;
  };

  if (n < 1000) return convertGroup(n);
  
  const thousands = Math.floor(n / 1000);
  const remainder = n % 1000;
  
  let str = "";
  if (thousands === 1) str += "eintausend";
  else str += convertGroup(thousands).replace("eins", "ein") + "tausend"; 
  
  if (remainder > 0) str += convertGroup(remainder);
  
  return str;
};

// --- YARDIMCI FONKSİYON: Tarih Formatı (DD.MM.YYYY) ---
const formatDateDE = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

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
  
  const currentYear = new Date().getFullYear();
  const availableYears = [currentYear - 1, currentYear, currentYear + 1, currentYear + 2];

  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    type: 'expense',
    amount: '',
    category_id: '',
    account_id: '',
    contact_id: '',
    target_year: '',
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
      .in('key', ['org_name', 'org_address', 'org_tax_id', 'exemption_date', 'exemption_office', 'treasurer_name']);
    
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

  // 1. LİSTE YAZDIRMA (YENIDEN TASARLANDI)
  const printList = () => {
    const printWindow = window.open('', '_blank', 'width=1100,height=800');
    if (!printWindow) return;

    let showIncome = filterType === 'income' || filterType === 'all';
    let showExpense = filterType === 'expense' || filterType === 'all';

    // Toplamları hesapla (0 olan değerleri hariç tut)
    let totalIncome = 0;
    let totalExpense = 0;
    transactions.forEach(t => {
      const val = parseFloat(t.amount);
      // 0 olan transaksiyonları hariç tut
      if (val === 0) return;
      
      if (t.type === 'income') totalIncome += val;
      else totalExpense += val;
    });

    const netBalance = totalIncome - totalExpense;
    const dateStr = formatDateDE(new Date());
    const periodStr = (dateFilter.start && dateFilter.end) 
      ? `${formatDateDE(dateFilter.start)} - ${formatDateDE(dateFilter.end)}`
      : 'Gesamtübersicht';

    // Kategorilere göre grupla ve 0 olan değerleri filtrele
    const grouped = {};
    transactions.forEach(t => {
      const amount = parseFloat(t.amount);
      // 0 olan transaksiyonları hariç tut
      if (amount === 0) return;
      
      const cat = t.accounting_categories?.name || 'Unbekannt';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(t);
    });

    let tableRows = '';
    let rowNumber = 1; // Sıra numarası için sayaç
    Object.keys(grouped).forEach(cat => {
      const catRows = grouped[cat]
        .map(trx => {
          const isIncome = trx.type === 'income';
          const amount = parseFloat(trx.amount).toFixed(2).replace('.', ',');
          const row = `
            <tr>
              <td>${rowNumber}</td>
              <td>${formatDateDE(trx.date)}</td>
              <td>${trx.receipt_no || trx.file_no || '-'}</td>
              <td><span style="color:#555; font-size:8pt;">${trx.description || ''}</span></td>
              <td>${trx.accounting_accounts?.name || ''}${trx.accounting_contacts ? '<br><span style="font-size:8pt; color:#444;">' + trx.accounting_contacts.name + '</span>' : ''}</td>
              ${showIncome ? `<td class="amount income">${isIncome ? amount + ' €' : ''}</td>` : ''}
              ${showExpense ? `<td class="amount expense">${!isIncome ? amount + ' €' : ''}</td>` : ''}
            </tr>`;
          rowNumber++; // Her satırdan sonra numarayı arttır
          return row;
        })
        .join('');
      const catTotalIncome = grouped[cat].filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount), 0);
      const catTotalExpense = grouped[cat].filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount), 0);
      tableRows += `
        <tr style="background:#e6e6e6;font-weight:bold;"><td colspan="${showIncome && showExpense ? 7 : 6}">${cat}</td></tr>
        ${catRows}
        <tr class="cat-total"><td colspan="5" style="text-align:right;">${cat} Summe:</td>
          ${showIncome ? `<td class="amount income">${catTotalIncome ? catTotalIncome.toFixed(2).replace('.', ',') + ' €' : ''}</td>` : ''}
          ${showExpense ? `<td class="amount expense">${catTotalExpense ? catTotalExpense.toFixed(2).replace('.', ',') + ' €' : ''}</td>` : ''}
        </tr>
      `;
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Buchungsliste</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            @page {
              size: A4;
              margin: 20mm 20mm 20mm 20mm;
            }
            
            @media print {
              body {
                margin: 0;
                padding: 0;
              }
            }
            
            body {
              font-family: Arial, Helvetica, sans-serif;
              font-size: 9pt;
              line-height: 1.4;
              color: #000;
              margin: 20mm;
              padding: 0;
            }
            
            .document-header {
              text-align: center;
              margin-bottom: 8px;
              padding-bottom: 4px;
              border-bottom: 2px solid #333;
              page-break-after: avoid;
            }
            
            .document-header img {
              max-height: 50px;
              margin-bottom: 2px;
            }
            
            .document-header h1 {
              font-size: 14pt;
              font-weight: bold;
              margin: 0;
              text-transform: uppercase;
            }
            
            .document-header p {
              font-size: 9pt;
              color: #555;
              margin: 2px 0;
            }
            
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 8px;
            }
            
            thead {
              display: table-header-group;
            }
            
            tbody {
              display: table-row-group;
            }
            
            tfoot {
              display: table-footer-group;
            }
            
            tr {
              page-break-inside: avoid;
            }
            
            th {
              background-color: #f0f0f0;
              border: 1px solid #999;
              padding: 6px 4px;
              text-align: left;
              font-weight: bold;
              font-size: 8.5pt;
            }
            
            td {
              border: 1px solid #ccc;
              padding: 4px;
              text-align: left;
              font-size: 8.5pt;
            }
            
            .amount-col {
              text-align: right;
              white-space: nowrap;
              width: 70px;
            }
            
            .income {
              color: green;
              font-weight: bold;
            }
            
            .expense {
              color: red;
              font-weight: bold;
            }
            
            tr[style*="background:#e6e6e6"] {
              page-break-after: avoid;
            }
            
            .cat-total td {
              border-top: 2px solid #000;
              background-color: #f9f9f9;
              font-weight: bold;
              page-break-after: avoid;
            }
            
            .final-totals td {
              border-top: 2px solid #000;
              background-color: #f0f0f0;
              font-weight: bold;
              padding: 6px 4px;
            }
          </style>
        </head>
        <body>
          <div class="document-header">
            <img src="/logo.png" alt="Logo" onerror="this.style.display='none'" />
            <h1>Buchungsliste / Journal</h1>
            <p>${orgSettings.org_name || 'Bürgertreff Wissen e.V.'}</p>
            <p>Zeitraum: ${periodStr}</p>
          </div>
          
          <table>
            <thead>
              <tr>
                <th style="width: 40px;">Nr.</th>
                <th style="width: 60px;">Datum</th>
                <th style="width: 45px;">Beleg</th>
                <th style="flex: 1;">Beschreibung</th>
                <th style="width: 120px;">Konto / Kontakt</th>
                ${showIncome ? '<th class="amount-col">Einnahme</th>' : ''}
                ${showExpense ? '<th class="amount-col">Ausgabe</th>' : ''}
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
            <tfoot>
              <tr class="final-totals">
                <td colspan="5" style="text-align: right; padding-right: 10px;">GESAMTSUMME:</td>
                ${showIncome ? `<td class="amount-col">${totalIncome.toFixed(2).replace('.', ',')} €</td>` : ''}
                ${showExpense ? `<td class="amount-col">${totalExpense.toFixed(2).replace('.', ',')} €</td>` : ''}
              </tr>
              <tr class="final-totals">
                <td colspan="5" style="text-align: right; padding-right: 10px;">SALDO (Einnahmen - Ausgaben):</td>
                <td colspan="2" class="amount-col" style="color: ${netBalance >= 0 ? '#000' : '#f00'};">
                  ${netBalance.toFixed(2).replace('.', ',')} €
                </td>
              </tr>
            </tfoot>
          </table>
          
          <script>
            window.addEventListener('load', function() {
              setTimeout(function() { window.print(); }, 250);
            });
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // 1b. EVRAK FİHRİSTESİ YAZDIRMA (Denetleme ve Kontrol İçin)
  const printIndex = () => {
    const printWindow = window.open('', '_blank', 'width=1100,height=800');
    if (!printWindow) return;

    let showIncome = filterType === 'income' || filterType === 'all';
    let showExpense = filterType === 'expense' || filterType === 'all';

    // 0 olan transaksiyonları filtrele ve tarihe göre sırala
    const filteredTrx = transactions
      .filter(t => parseFloat(t.amount) !== 0)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    // Başlık belirle
    let headerTitle = 'Belegverzeichnis';
    if (filterType === 'income') headerTitle = 'Einnahmen-Verzeichnis';
    else if (filterType === 'expense') headerTitle = 'Ausgaben-Verzeichnis';

    // Tablo satırlarını oluştur
    let tableRows = '';
    filteredTrx.forEach((trx, index) => {
      const isIncome = trx.type === 'income';
      const amount = parseFloat(trx.amount).toFixed(2).replace('.', ',');
      const shouldShow = (isIncome && showIncome) || (!isIncome && showExpense);
      
      if (!shouldShow) return;

      tableRows += `
        <tr>
          <td style="text-align: center; vertical-align: middle; width: 35px;">${index + 1}</td>
          <td style="text-align: center; vertical-align: middle; width: 75px;">${formatDateDE(trx.date)}</td>
          <td style="text-align: center; vertical-align: middle; width: 90px;">${trx.receipt_no || trx.file_no || '-'}</td>
          <td style="text-align: left; vertical-align: middle; flex: 1;"><span style="color:#555; font-size:9pt;">${trx.description || ''}</span></td>
          <td style="text-align: center; vertical-align: middle; width: 110px;">${trx.accounting_accounts?.name || ''}${trx.accounting_contacts ? '<br><span style="font-size:8pt; color:#444;">' + trx.accounting_contacts.name + '</span>' : ''}</td>
          <td style="text-align: right; vertical-align: middle; width: 75px;">${amount} €</td>
        </tr>`;
    });

    const dateStr = formatDateDE(new Date());
    const periodStr = (dateFilter.start && dateFilter.end) 
      ? `${formatDateDE(dateFilter.start)} - ${formatDateDE(dateFilter.end)}`
      : 'Gesamtübersicht';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>${headerTitle}</title>
          <style>
            @page {
              size: A4;
              margin: 0;
            }
            
            @media print {
              * {
                margin: 0 !important;
                padding: 0 !important;
              }
              body {
                margin: 0 !important;
                padding: 25mm 15mm 25mm 20mm !important;
              }
              .document-header {
                margin-top: 0 !important;
                margin-bottom: 15px !important;
                padding-bottom: 10px !important;
              }
              table {
                margin-top: 12px !important;
                margin-left: 0 !important;
                margin-right: 0 !important;
              }
              tr {
                page-break-inside: avoid !important;
              }
            }
            
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: Arial, Helvetica, sans-serif;
              font-size: 10pt;
              line-height: 1.5;
              color: #000;
              margin: 0;
              padding: 0;
            }
            
            .document-header {
              text-align: center;
              margin-bottom: 15px;
              margin-top: 0;
              padding-bottom: 10px;
              border-bottom: 2px solid #333;
            }
            
            .document-header h1 {
              font-size: 16pt;
              font-weight: bold;
              margin: 4px 0;
              text-transform: uppercase;
            }
            
            .document-header p {
              font-size: 10pt;
              color: #555;
              margin: 2px 0;
            }
            
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 12px;
            }
            
            thead {
              display: table-header-group;
              page-break-after: auto;
            }
            
            tbody {
              display: table-row-group;
            }
            
            tr {
              page-break-inside: avoid;
            }
            
            th {
              background-color: #333;
              color: white;
              border: 1px solid #999;
              padding: 10px 6px;
              text-align: left;
              font-weight: bold;
              font-size: 9.5pt;
              vertical-align: middle;
              word-wrap: break-word;
              word-break: break-word;
            }
            
            td {
              border: 1px solid #ccc;
              padding: 8px 6px;
              text-align: left;
              font-size: 9.5pt;
              vertical-align: top;
              word-wrap: break-word;
              word-break: break-word;
              line-height: 1.3;
            }
          </style>
        </head>
        <body>
          <div class="document-header">
            <h1>${headerTitle}</h1>
            <p>${orgSettings.org_name || 'Bürgertreff Wissen e.V.'}</p>
            <p>Zeitraum: ${periodStr}</p>
          </div>
          
          <table>
            <thead>
              <tr>
                <th style="width: 35px; text-align: center;">Nr.</th>
                <th style="width: 75px;">Datum</th>
                <th style="width: 90px;">Beleg</th>
                <th style="flex: 1;">Beschreibung</th>
                <th style="width: 110px;">Konto / Kontakt</th>
                <th style="width: 75px; text-align: right;">Betrag</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
          
          <script>
            window.addEventListener('load', function() {
              setTimeout(function() { window.print(); }, 250);
            });
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // 2. BELEG DRUCKEN
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

    const dateStr = formatDateDE(trx.date);
    const amountStr = parseFloat(trx.amount).toFixed(2) + ' €';
    const typeStr = trx.type === 'income' ? 'Einnahme' : 'Ausgabe';
    
    const htmlContent = `
      <html><head><title>Beleg</title><style>body{font-family:Arial;padding:20px;}</style></head>
        <body>
          <h3>Buchungsbeleg</h3><p>Datum: ${dateStr} | Typ: ${typeStr}</p><p>Betrag: <strong>${amountStr}</strong></p><p>${trx.description || ''}</p>
          ${signedUrl ? `<img src="${signedUrl}" style="max-width:100%;" onload="window.print()"/>` : '<script>window.print()</script>'}
        </body></html>`;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // 3. SPENDENBESCHEINIGUNG (GÜNCELLENDİ)
  const printDonationReceipt = (trx) => {
    if (trx.type !== 'income') return;
    const contact = contacts.find(c => c.id === trx.contact_id);
    if (!contact) { alert('Kontakt fehlt!'); return; }

    const printWindow = window.open('', '_blank', 'width=900,height=1000');
    if (!printWindow) return;

    const dateStr = formatDateDE(trx.date); 
    const amountVal = parseFloat(trx.amount);
    const amountStr = amountVal.toFixed(2).replace('.', ',');
    const intPart = Math.floor(amountVal);
    const decimalPart = Math.round((amountVal - intPart) * 100);
    let euroText = numberToGermanWords(intPart);
    euroText = euroText.charAt(0).toUpperCase() + euroText.slice(1);
    let centText = numberToGermanWords(decimalPart);
    let amountInWords = '';
    if (decimalPart === 0) {
      amountInWords = `${euroText} Euro`;
    } else {
      amountInWords = `${euroText} Euro ${centText} Cent`;
    }

    // Behandlung mit oder ohne Adresse
    const donorInfo = contact.address 
      ? `${contact.name}<br>${contact.address}`
      : contact.name;

    const orgName = "Bürgertreff Wissen e.V.";
    const stNr = orgSettings.org_tax_id || "02/650/36212";
    const exemptionDate = orgSettings.exemption_date ? formatDateDE(orgSettings.exemption_date) : "03.06.2025";
    const faName = orgSettings.exemption_office || "Finanzamt Altenkirchen";

    const htmlContent = `
      <html>
        <head>
          <title>Spendenbescheinigung</title>
          <style>
            @page { size: A4; margin: 0; }
            body { 
              font-family: Arial, Helvetica, sans-serif; 
              font-size: 10pt; 
              line-height: 1.2; 
              color: #000; 
              padding: 18mm 25mm 15mm 25mm; 
              margin: 0; 
            }
            .container { width: 100%; margin: 0 auto; }
            .header-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
            .logo-img { max-width: 180px; height: auto; }
            h1 { font-size: 16pt; font-weight: bold; text-align: left; margin: 8px 0 12px 0; }
            .issuer { font-weight: bold; margin-bottom: 10px; font-size: 10pt; }
            .legal-text { font-size: 9pt; text-align: justify; margin-bottom: 10px; line-height: 1.25; hyphens: auto; word-spacing: -0.04em; }
            .box-section { border: 1px solid #000; padding: 8px; margin-bottom: 10px; background-color: #fcfcfc; }
            .data-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; margin-bottom: 10px; border: 1px solid #000; padding: 5px; align-items: start; }
            .grid-item strong { display: block; font-size: 7pt; margin-bottom: 2px; line-height: 1.0; }
            .checkbox-row { display: flex; justify-content: space-between; align-items: center; border: 1px solid #000; padding: 8px; margin-bottom: 10px; font-size: 9pt; }
            .tax-info { font-size: 8.5pt; margin-bottom: 10px; line-height: 1.3; text-align: justify; }
            .tax-info ul { list-style: none; padding-left: 0; margin: 5px 0; }
            .tax-info li { margin-bottom: 3px; padding-left: 15px; position: relative; }
            .tax-info li::before { content: "•"; position: absolute; left: 0; }
            .signature-box { margin-top: 25px; margin-bottom: 20px; }
            .page-footer {
              position: fixed; bottom: 12mm; left: 25mm; right: 25mm;
              text-align: center; font-size: 7.5pt; color: #444;
              border-top: 1px solid #ccc; padding-top: 4px; background-color: #fff; line-height: 1.25;
            }
            @media print { body { -webkit-print-color-adjust: exact; } .box-section, .data-grid, .checkbox-row { border: 1px solid #000 !important; } }
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
            <div class="legal-text">Bestätigung über Geldzuwendungen im Sinne des § 10b des Einkommen&shy;steuergesetzes an eine der in § 5 Abs. 1 Nr. 9 des Körperschaftsteuer&shy;gesetzes bezeichneten Körper&shy;schaften, Personen&shy;vereinigungen oder Vermögens&shy;massen.</div>
            <div class="box-section">
              <div><strong>Name und Anschrift des Zuwendenden:</strong></div>
              <div style="margin-top: 8px; font-size: 10.5pt;">${donorInfo}</div>
            </div>
            <div class="data-grid">
              <div class="grid-item"><strong>Betrag der Zuwendung in Ziffern:</strong><span style="font-size: 10.5pt;">${amountStr} €</span></div>
              <div class="grid-item"><strong>Betrag der Zuwendung in Buchstaben:</strong><span style="font-size: 9.5pt; font-style: italic;">${amountInWords}</span></div>
              <div class="grid-item"><strong>Tag der Zuwendung:</strong><span style="font-size: 10.5pt;">${dateStr}</span></div>
            </div>
            <div class="tax-info">
              <div><strong>Wir sind wegen Förderung</strong></div>
              <ul><li>der Jugend- und Altenhilfe</li><li>internationaler Gesinnung, der Toleranz auf allen Gebieten der Kultur und des Völker&shy;ver&shy;ständi&shy;gungs&shy;gedankens</li><li>des bürgerschaftlichen Engagements zugunsten gemeinnütziger, mildtätiger und kirchlicher Zwecke</li></ul>
              <div style="margin-top: 8px;">nach dem Freistellungsbescheid des <strong>${faName}</strong>, Steuernummer <strong>${stNr}</strong>, vom <strong>${exemptionDate}</strong> für den letzten Veranlagungszeitraum nach § 5 Abs. 1 Nr. 9 des Körperschaftsteuergesetzes von der Körperschaftsteuer und nach § 3 Nr. 6 des Gewerbesteuergesetzes von der Gewerbesteuer befreit.</div>
            </div>
            <div style="margin: 12px 0; font-weight: bold; font-size: 9.5pt;">Die Zuwendung wird von uns unmittelbar für den angegebenen Zweck verwendet.</div>
            <div class="signature-box">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; font-size: 10pt;">
                <span>Wissen, ${formatDateDE(new Date())}</span>
                <span style="margin-right: 80px;">${orgSettings.treasurer_name || 'Schatzmeister'}</span>
              </div>
              <div style="margin-top: 50px; border-top: 1px solid #000; padding-top: 5px; display: flex; justify-content: space-between;">
                <span style="font-size: 8pt; color: #666;">Ort, Datum</span>
                <span style="font-size: 8pt; color: #666; margin-right: 80px;">Unterschrift</span>
              </div>
            </div>
          </div>
          <div class="page-footer">
            Bürgertreff Wissen e.V., c/o Erika Uber (1. Vorsitzende), Hauptstr. 79, 57587 Birken-Honigsessen<br>
            Tel. 01516 5179082 - buergertreff.wissen@gmail.com – www.buergertreff-wissen.de<br>
            Sparkasse Westerwald-Sieg IBAN: DE27 5735 1030 0055 0844 38 BIC: MALADE51AKI<br>
            StNr. 02/650/36212 – Die Gemeinnützigkeit ist anerkannt
          </div>
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
    
    let finalDescription = formData.description;
    if (formData.target_year && !finalDescription.includes(formData.target_year)) {
      finalDescription = `${finalDescription} (Beitrag ${formData.target_year})`.trim();
    }

    const payload = { 
      ...formData, 
      description: finalDescription, 
      contact_id: formData.contact_id || null 
    };
    
    delete payload.target_year;

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
      file_no: trx.file_no || '', description: trx.description || '', document_url: trx.document_url || '',
      target_year: '' 
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
      account_id: '', contact_id: '', receipt_no: '', file_no: '', description: '', document_url: '', target_year: ''
    });
    setEditingId(null);
    setIsFormOpen(false);
  };

  const filteredCategories = categories.filter(c => c.type === formData.type);
  const allowedCategoryNames = [
    'Miete & Nebenkosten',
    'Bürokosten',
    'Vereinsverwaltung',
    'Fortbildung',
    'Inventar',
    'Sonstiges',
  ];
  const displayedCategories = formData.type === 'expense' 
    ? categories.filter(c => allowedCategoryNames.includes(c.name) && c.type === 'expense')
    : filteredCategories;

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
          <select value={dateFilter.preset} onChange={handlePresetChange} className="bg-gray-50 border p-1 rounded text-sm cursor-pointer">
            <option value="this_month">Dieser Monat</option>
            <option value="last_month">Letzter Monat</option>
            <option value="this_year">Dieses Jahr</option>
            <option value="last_year">Letztes Jahr</option>
            <option value="custom">Benutzerdefiniert</option>
          </select>
          {dateFilter.preset === 'custom' && (
            <div className="flex gap-2 items-center">
              <input 
                type="date" 
                name="start" 
                value={dateFilter.start} 
                onChange={handleDateChange}
                className="bg-white border border-gray-300 p-1 rounded text-sm"
                placeholder="Von"
              />
              <span className="text-gray-500">-</span>
              <input 
                type="date" 
                name="end" 
                value={dateFilter.end} 
                onChange={handleDateChange}
                className="bg-white border border-gray-300 p-1 rounded text-sm"
                placeholder="Bis"
              />
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={printList} className="bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"><FaPrint /> Liste</button>
          <button onClick={printIndex} className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"><FaPrint /> Verzeichnis</button>
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
                <label className="flex-1 border p-2 text-center rounded cursor-pointer hover:bg-gray-50"><input type="radio" name="type" value="income" checked={formData.type === 'income'} onChange={handleInputChange} className="mr-2"/>Einnahme (+)</label>
                <label className="flex-1 border p-2 text-center rounded cursor-pointer hover:bg-gray-50"><input type="radio" name="type" value="expense" checked={formData.type === 'expense'} onChange={handleInputChange} className="mr-2"/>Ausgabe (-)</label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input type="date" name="date" value={formData.date} onChange={handleInputChange} className="border p-2 rounded w-full" required />
                <input type="number" name="amount" value={formData.amount} onChange={handleInputChange} placeholder="Betrag €" className="border p-2 rounded w-full" step="0.01" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <select name="category_id" value={formData.category_id} onChange={handleInputChange} className="border p-2 rounded w-full" required>
                  <option value="">Kategorie wählen...</option>
                  {displayedCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select name="account_id" value={formData.account_id} onChange={handleInputChange} className="border p-2 rounded w-full" required>
                  <option value="">Konto wählen...</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>

              {formData.type === 'income' && (
                <div className="bg-blue-50 p-2 rounded border border-blue-200">
                  <label className="block text-xs font-bold text-blue-800 mb-1">Beitragsjahr (Optional)</label>
                  <select name="target_year" value={formData.target_year} onChange={handleInputChange} className="border p-2 rounded w-full text-sm">
                    <option value="">Automatisch (aktuelles Datum)</option>
                    {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              )}

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
                <button type="button" onClick={resetForm} className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300">Abbrechen</button>
                <button type="submit" disabled={uploading} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Speichern</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tablo */}
      <style>{`
        @media (max-width: 768px) {
          .responsive-table { display: block; width: 100%; overflow-x: auto; border-spacing: 0; }
          .responsive-table thead { display: table-header-group; }
          .responsive-table tr { display: table-row; }
          .responsive-table td, .responsive-table th { min-width: 120px; white-space: nowrap; }
        }
        .amount-cell { white-space: nowrap; }
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
                <td className="px-6 py-4 text-sm text-gray-600">
                  {formatDateDE(trx.date)}
                  {trx.file_no && <div className="text-xs text-blue-600">Ordner: {trx.file_no}</div>}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {trx.accounting_categories?.name}
                  <div className="text-xs text-gray-500">{trx.description}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {trx.accounting_accounts?.name}
                  {trx.accounting_contacts && <div className="text-xs text-blue-600">{trx.accounting_contacts.name}</div>}
                </td>
                <td className={`px-6 py-4 text-right text-sm font-bold amount-cell ${trx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                  {trx.type === 'income' ? '+' : '-'} {parseFloat(trx.amount).toFixed(2)} €
                </td>
                <td className="px-6 py-4 text-right text-sm font-medium flex justify-end gap-2">
                  <button onClick={() => printVoucher(trx)} className="text-gray-600 hover:text-gray-900" title="Beleg"><FaPrint /></button>
                  {trx.type === 'income' && parseFloat(trx.amount) >= 50 && (
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