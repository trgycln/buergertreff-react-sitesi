import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import { FaSpinner, FaPaperclip, FaExternalLinkAlt, FaHandHoldingHeart } from 'react-icons/fa';

export default function DonationConfirmations() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [years, setYears] = useState([]);
  const [orgSettings, setOrgSettings] = useState({});

  const normalizeCategoryName = (name = '') =>
    name
      .toLowerCase()
      .replace(/ä/g, 'ae')
      .replace(/ö/g, 'oe')
      .replace(/ü/g, 'ue')
      .replace(/ß/g, 'ss')
      .replace(/[\s\-_]/g, '');

  useEffect(() => {
    const currentYear = new Date().getFullYear();
    setYears([currentYear - 2, currentYear - 1, currentYear, currentYear + 1]);
    fetchDonations();
    fetchOrgSettings();
  }, [filterYear]);

  const fetchOrgSettings = async () => {
    const { data } = await supabase
      .from('site_settings')
      .select('key, value')
      .in('key', ['org_tax_id', 'exemption_date', 'exemption_office', 'treasurer_name']);

    const settings = {};
    (data || []).forEach((item) => {
      settings[item.key] = item.value;
    });
    setOrgSettings(settings);
  };

  const fetchDonations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('accounting_transactions')
        .select('*, accounting_categories(name), accounting_contacts(name, address)')
        .eq('type', 'income')
        .gte('date', `${filterYear}-01-01`)
        .lte('date', `${filterYear}-12-31`)
        .order('date', { ascending: false });

      if (error) throw error;

      // Keep only real donation transactions (exclude member fees, loans, etc.).
      const filtered = (data || []).filter(trx => {
        const category = normalizeCategoryName(trx.accounting_categories?.name || '');
        const desc = normalizeCategoryName(trx.description || '');
        const text = `${category} ${desc}`;

        const hasDonationKeyword =
          text.includes('spende') ||
          text.includes('zuwendung') ||
          text.includes('donation') ||
          text.includes('bagis');

        const hasExcludedKeyword =
          text.includes('mitglied') ||
          text.includes('beitrag') ||
          text.includes('aidat') ||
          text.includes('darlehen') ||
          text.includes('loan') ||
          text.includes('kredit');

        return hasDonationKeyword && !hasExcludedKeyword;
      });

      setDonations(filtered);
    } catch (error) {
      console.error('Error fetching donations:', error);
    }
    setLoading(false);
  };

  const openDocument = async (path) => {
    if (!path) return;
    const { data, error } = await supabase.storage.from('receipts').createSignedUrl(path, 60);
    if (error) { alert(error.message); return; }
    window.open(data.signedUrl, '_blank');
  };

  const formatDateDE = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const numberToGermanWords = (n) => {
    if (n === 0) return 'null';

    const units = ['', 'ein', 'zwei', 'drei', 'vier', 'fuenf', 'sechs', 'sieben', 'acht', 'neun'];
    const unitsEins = ['', 'eins', 'zwei', 'drei', 'vier', 'fuenf', 'sechs', 'sieben', 'acht', 'neun'];
    const teens = ['zehn', 'elf', 'zwoelf', 'dreizehn', 'vierzehn', 'fuenfzehn', 'sechzehn', 'siebzehn', 'achtzehn', 'neunzehn'];
    const tens = ['', '', 'zwanzig', 'dreissig', 'vierzig', 'fuenfzig', 'sechzig', 'siebzig', 'achtzig', 'neunzig'];

    const convertGroup = (num) => {
      if (num === 0) return '';
      if (num < 10) return unitsEins[num];
      if (num < 20) return teens[num - 10];
      if (num < 100) {
        const unit = num % 10;
        const ten = Math.floor(num / 10);
        if (unit === 0) return tens[ten];
        return units[unit] + 'und' + tens[ten];
      }
      const hundred = Math.floor(num / 100);
      const rest = num % 100;
      let str = units[hundred] + 'hundert';
      if (rest > 0) str += convertGroup(rest);
      return str;
    };

    if (n < 1000) return convertGroup(n);
    const thousands = Math.floor(n / 1000);
    const remainder = n % 1000;
    let str = thousands === 1 ? 'eintausend' : convertGroup(thousands).replace('eins', 'ein') + 'tausend';
    if (remainder > 0) str += convertGroup(remainder);
    return str;
  };

  const printDonationReceipt = (trx) => {
    if (!trx || trx.type !== 'income') return;

    const printWindow = window.open('', '_blank', 'width=900,height=1000');
    if (!printWindow) return;

    const donorName = trx.accounting_contacts?.name || 'Unbekannter Spender';
    const donorAddress = trx.accounting_contacts?.address || '';
    const donorInfo = donorAddress ? `${donorName}<br>${donorAddress}` : donorName;

    const dateStr = formatDateDE(trx.date);
    const amountVal = parseFloat(trx.amount) || 0;
    const amountStr = amountVal.toFixed(2).replace('.', ',');
    const intPart = Math.floor(amountVal);
    const decimalPart = Math.round((amountVal - intPart) * 100);

    let euroText = numberToGermanWords(intPart);
    euroText = euroText.charAt(0).toUpperCase() + euroText.slice(1);
    const centText = numberToGermanWords(decimalPart);
    const amountInWords = decimalPart === 0 ? `${euroText} Euro` : `${euroText} Euro ${centText} Cent`;

    const orgName = 'Bürgertreff Wissen e.V.';
    const stNr = orgSettings.org_tax_id || '02/650/36212';
    const exemptionDate = orgSettings.exemption_date ? formatDateDE(orgSettings.exemption_date) : '03.06.2025';
    const faName = orgSettings.exemption_office || 'Finanzamt Altenkirchen';

    const htmlContent = `
      <html>
        <head>
          <title>Spendenbescheinigung</title>
          <style>
            @page { size: A4; margin: 0; }
            body { font-family: Arial, Helvetica, sans-serif; font-size: 10pt; line-height: 1.2; color: #000; padding: 18mm 25mm 15mm 25mm; margin: 0; }
            .container { width: 100%; margin: 0 auto; }
            h1 { font-size: 16pt; font-weight: bold; text-align: left; margin: 8px 0 12px 0; }
            .issuer { font-weight: bold; margin-bottom: 10px; font-size: 10pt; }
            .legal-text { font-size: 9pt; text-align: justify; margin-bottom: 10px; line-height: 1.25; }
            .box-section { border: 1px solid #000; padding: 8px; margin-bottom: 10px; background-color: #fcfcfc; }
            .data-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; margin-bottom: 10px; border: 1px solid #000; padding: 5px; }
            .grid-item strong { display: block; font-size: 7pt; margin-bottom: 2px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Spendenbescheinigung</h1>
            <div class="issuer">Aussteller: ${orgName}</div>
            <div class="legal-text">Bestätigung über Geldzuwendungen im Sinne des § 10b EStG an eine in § 5 Abs. 1 Nr. 9 KStG bezeichnete Körperschaft.</div>
            <div class="box-section">
              <div><strong>Name und Anschrift des Zuwendenden:</strong></div>
              <div style="margin-top: 8px; font-size: 10.5pt;">${donorInfo}</div>
            </div>
            <div class="data-grid">
              <div class="grid-item"><strong>Betrag in Ziffern:</strong><span style="font-size: 10.5pt;">${amountStr} €</span></div>
              <div class="grid-item"><strong>Betrag in Buchstaben:</strong><span style="font-size: 9.5pt; font-style: italic;">${amountInWords}</span></div>
              <div class="grid-item"><strong>Tag der Zuwendung:</strong><span style="font-size: 10.5pt;">${dateStr}</span></div>
            </div>
            <div style="font-size: 8.5pt; margin-bottom: 10px;">
              Freistellungsbescheid des <strong>${faName}</strong>, Steuernummer <strong>${stNr}</strong>, vom <strong>${exemptionDate}</strong>.
            </div>
            <div style="margin-top: 18px; display: flex; justify-content: space-between; font-size: 10pt;">
              <span>Wissen, ${formatDateDE(new Date())}</span>
              <span>${orgSettings.treasurer_name || 'Kassierer/in'}</span>
            </div>
          </div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  if (loading) {
    return <div className="flex justify-center items-center p-8"><FaSpinner className="animate-spin text-2xl" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-gray-800">Zuwendungsbestätigungen (Spendenbescheinigungen)</h3>
          <p className="text-sm text-gray-600">Nur Spenden mit erzeugter Bescheinigung</p>
        </div>
        <select
          value={filterYear}
          onChange={(e) => setFilterYear(parseInt(e.target.value))}
          className="border border-gray-300 rounded px-3 py-2"
        >
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

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
            {donations.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-10 text-center text-gray-500">
                  Keine Spendenbescheinigungen gefunden.
                </td>
              </tr>
            ) : (
              donations.map((donation) => (
                <tr key={donation.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {formatDateDE(donation.date)}
                    {donation.receipt_no && <div className="text-xs text-blue-600">Beleg: #{donation.receipt_no}</div>}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {donation.accounting_categories?.name || 'Spende'}
                    <div className="text-xs text-gray-500">{donation.description || ''}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    Spende
                    <div className="text-xs text-blue-600">{donation.accounting_contacts?.name || 'Unbekannter Spender'}</div>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-bold amount-cell text-green-600">
                    + {parseFloat(donation.amount || 0).toFixed(2)} €
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium flex justify-end gap-2">
                    <button
                      onClick={() => printDonationReceipt(donation)}
                      className="text-pink-600 hover:text-pink-900"
                      title="Spendenbescheinigung"
                    >
                      <FaHandHoldingHeart />
                    </button>
                    {donation.document_url && (
                      <button
                        onClick={() => openDocument(donation.document_url)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Bankbeleg öffnen"
                      >
                        <FaPaperclip />
                      </button>
                    )}
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
