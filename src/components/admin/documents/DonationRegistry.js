import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import { FaSpinner, FaChartBar, FaPrint } from 'react-icons/fa';

export default function DonationRegistry() {
  const [summary, setSummary] = useState({
    totalDonations: 0,
    totalDonors: 0,
    totalCount: 0,
    largestDonation: 0,
    averageDonation: 0,
    cashDonations: 0,
    transferDonations: 0
  });
  const [donorRows, setDonorRows] = useState([]);
  const [yearColumns, setYearColumns] = useState([]);
  const [yearlyRows, setYearlyRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const normalizeCategoryName = (name = '') =>
    name
      .toLowerCase()
      .replace(/ä/g, 'ae')
      .replace(/ö/g, 'oe')
      .replace(/ü/g, 'ue')
      .replace(/ß/g, 'ss')
      .replace(/[\s\-_]/g, '');

  useEffect(() => {
    fetchSummary();
  }, []);

  const isDonationTransaction = (trx) => {
    const category = normalizeCategoryName(trx.accounting_categories?.name || '');
    const desc = normalizeCategoryName(trx.description || '');
    const text = `${category} ${desc}`;

    const isCashJarIncome =
      text.includes('spendenbox') ||
      text.includes('sammelglas') ||
      text.includes('kavanoz') ||
      text.includes('tischglas');

    const include = ['spende', 'zuwendung', 'donation', 'bagis'];
    const exclude = ['mitglied', 'beitrag', 'aidat', 'darlehen', 'kredit', 'loan'];

    return !isCashJarIncome && include.some((k) => text.includes(k)) && !exclude.some((k) => text.includes(k));
  };

  const isCashAccount = (accountName = '') => {
    const name = normalizeCategoryName(accountName);
    if (!name) return false;
    if (name.includes('sparkasse')) return false;
    return name.includes('bar') || name.includes('bargeld') || name.includes('kasse') || name.includes('cash');
  };

  const formatDateDE = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatAmount = (value = 0) => `${(Number(value) || 0).toFixed(2)} €`;

  const escapeHtml = (value = '') =>
    String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('accounting_transactions')
        .select('*, accounting_categories(name), accounting_contacts(id, name, address, email, phone, type, notes), accounting_accounts(name)')
        .eq('type', 'income');

      if (error) throw error;

      const donations = (data || []).filter(isDonationTransaction);

      let totalDonations = 0;
      let cashDonations = 0;
      let transferDonations = 0;
      const uniqueDonors = new Set();
      const amounts = [];
      const donorMap = {};
      const yearlyMap = {};

      donations.forEach(don => {
        const amount = parseFloat(don.amount) || 0;
        const year = (don.date || '').slice(0, 4);
        if (!/^\d{4}$/.test(year)) return;

        totalDonations += amount;
        amounts.push(amount);
        
        const donorId = don.accounting_contacts?.id || `unknown-${don.id}`;
        if (don.accounting_contacts?.id || don.accounting_contacts?.name) {
          uniqueDonors.add(donorId);
        }

        if (!donorMap[donorId]) {
          donorMap[donorId] = {
            donorId,
            name: don.accounting_contacts?.name || 'Unbekannter Spender',
            type: don.accounting_contacts?.type || 'spender',
            address: don.accounting_contacts?.address || '',
            phone: don.accounting_contacts?.phone || '',
            email: don.accounting_contacts?.email || '',
            notes: don.accounting_contacts?.notes || '',
            donations: [],
            yearTotals: {},
            totalAmount: 0,
            donationCount: 0,
            lastDonationDate: ''
          };
        }

        donorMap[donorId].donations.push({
          date: don.date,
          amount,
          description: don.description || ''
        });
        donorMap[donorId].yearTotals[year] = (donorMap[donorId].yearTotals[year] || 0) + amount;
        donorMap[donorId].totalAmount += amount;
        donorMap[donorId].donationCount += 1;
        if (!donorMap[donorId].lastDonationDate || don.date > donorMap[donorId].lastDonationDate) {
          donorMap[donorId].lastDonationDate = don.date;
        }

        if (!yearlyMap[year]) {
          yearlyMap[year] = { year, totalAmount: 0, donationCount: 0, donors: new Set() };
        }
        yearlyMap[year].totalAmount += amount;
        yearlyMap[year].donationCount += 1;
        yearlyMap[year].donors.add(donorId);

        if (isCashAccount(don.accounting_accounts?.name || '')) {
          cashDonations += amount;
        } else {
          transferDonations += amount;
        }
      });

      amounts.sort((a, b) => b - a);

      const donors = Object.values(donorMap)
        .map((row) => ({
          ...row,
          donations: row.donations.sort((a, b) => new Date(b.date) - new Date(a.date))
        }))
        .sort((a, b) => a.name.localeCompare(b.name, 'de'));

      const years = Object.keys(yearlyMap).sort((a, b) => Number(a) - Number(b));
      const yearly = years.map((year) => ({
        year,
        totalAmount: yearlyMap[year].totalAmount,
        donationCount: yearlyMap[year].donationCount,
        donorCount: yearlyMap[year].donors.size
      }));

      setDonorRows(donors);
      setYearColumns(years);
      setYearlyRows(yearly);

      setSummary({
        totalDonations,
        cashDonations,
        transferDonations,
        totalDonors: uniqueDonors.size,
        totalCount: donations.length,
        largestDonation: amounts[0] || 0,
        averageDonation: donations.length > 0 ? totalDonations / donations.length : 0
      });
    } catch (error) {
      console.error('Error fetching donation summary:', error);
      setDonorRows([]);
      setYearColumns([]);
      setYearlyRows([]);
    }
    setLoading(false);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    if (!printWindow) return;

    const donationListRows = donorRows
      .map((row, index) => {
        const yearCells = yearColumns
          .map((year) => `<td style="text-align:right; width:80px;">${row.yearTotals[year] ? formatAmount(row.yearTotals[year]) : '-'}</td>`)
          .join('');

        const history = row.donations.length > 0
          ? row.donations.map((d) => `${formatDateDE(d.date)}: ${formatAmount(d.amount)}`).join('<br/>')
          : '-';

        return `
          <tr>
            <td style="text-align:center; width:34px;">${index + 1}</td>
            <td style="width:140px;">${escapeHtml(row.name)}</td>
            <td style="width:90px; text-align:center;">${escapeHtml(row.type || '-')}</td>
            <td style="width:160px;">${escapeHtml(row.address || '-')}</td>
            <td style="width:95px; text-align:center;">${escapeHtml(row.phone || '-')}</td>
            <td style="width:160px;">${escapeHtml(row.email || '-')}</td>
            ${yearCells}
            <td style="width:90px; text-align:center;">${row.lastDonationDate ? formatDateDE(row.lastDonationDate) : '-'}</td>
            <td style="width:220px; font-size:7pt;">${history}</td>
          </tr>
        `;
      })
      .join('');

    const yearHeaderCells = yearColumns
      .map((year) => `<th style="text-align:right; width:80px;">${year}</th>`)
      .join('');

    const yearSumCells = yearColumns
      .map((year) => {
        const total = donorRows.reduce((sum, row) => sum + (row.yearTotals[year] || 0), 0);
        return `<td style="text-align:right; font-weight:bold;">${formatAmount(total)}</td>`;
      })
      .join('');

    const yearlySummaryRows = yearlyRows
      .map((row) => `
        <tr>
          <td style="text-align:center;">${row.year}</td>
          <td style="text-align:right; font-weight:bold;">${formatAmount(row.totalAmount)}</td>
          <td style="text-align:center;">${row.donationCount}</td>
          <td style="text-align:center;">${row.donorCount}</td>
        </tr>
      `)
      .join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Spendenverwaltungsblatt</title>
          <style>
            @page { size: A4 landscape; margin: 8mm; }
            * { box-sizing: border-box; }
            body { font-family: Arial, Helvetica, sans-serif; margin: 8mm; font-size: 8pt; color: #111; }
            h1 { margin: 0 0 3mm 0; font-size: 14pt; }
            h2 { margin: 5mm 0 2mm 0; font-size: 10pt; }
            p.meta { margin: 0 0 2mm 0; color: #555; }
            table { width: 100%; border-collapse: collapse; table-layout: fixed; margin-top: 2mm; }
            thead { display: table-header-group; }
            tr { page-break-inside: avoid; }
            th, td { border: 1px solid #cbd5e1; padding: 3px; vertical-align: top; }
            th { background: #334155; color: white; font-size: 7.2pt; }
            .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 2.5mm; margin-top: 3mm; }
            .card { border: 1px solid #cbd5e1; border-radius: 3mm; padding: 2.5mm; }
            .card .label { font-size: 7.4pt; color: #475569; }
            .card .value { font-size: 11pt; font-weight: 700; margin-top: 1mm; }
            .block { margin-top: 4mm; }
          </style>
        </head>
        <body>
          <h1>Spendenverwaltungsblatt</h1>
          <p class="meta">Bürgertreff Wissen e.V. | Stand: ${formatDateDE(new Date().toISOString().slice(0, 10))}</p>

          <div class="summary">
            <div class="card"><div class="label">Gesamtspenden (alle Jahre)</div><div class="value">${formatAmount(summary.totalDonations)}</div></div>
            <div class="card"><div class="label">Anzahl Spender/Sponsoren</div><div class="value">${summary.totalDonors}</div></div>
            <div class="card"><div class="label">Anzahl Spenden</div><div class="value">${summary.totalCount}</div></div>
            <div class="card"><div class="label">Größte Einzelspende</div><div class="value">${formatAmount(summary.largestDonation)}</div></div>
          </div>

          <div class="block">
            <h2>Spender-/Sponsorenliste mit Kontaktdaten und Spendenhistorie</h2>
            <table>
              <thead>
                <tr>
                  <th style="text-align:center; width:34px;">Nr.</th>
                  <th style="width:140px;">Name</th>
                  <th style="width:90px; text-align:center;">Typ</th>
                  <th style="width:160px;">Adresse</th>
                  <th style="width:95px; text-align:center;">Telefon</th>
                  <th style="width:160px;">E-Mail</th>
                  ${yearHeaderCells}
                  <th style="width:90px; text-align:center;">Letzte Spende</th>
                  <th style="width:220px;">Spenden (Datum: Betrag)</th>
                </tr>
              </thead>
              <tbody>
                ${donationListRows}
                <tr>
                  <td colspan="6" style="font-weight:bold; text-align:center;">Summen</td>
                  ${yearSumCells}
                  <td></td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="block">
            <h2>Jahresübersicht und Gesamtauswertung</h2>
            <table>
              <thead>
                <tr>
                  <th style="text-align:center; width:110px;">Jahr</th>
                  <th style="text-align:right; width:160px;">Spenden-Summe</th>
                  <th style="text-align:center; width:160px;">Anzahl Spenden</th>
                  <th style="text-align:center; width:180px;">Aktive Spender/Sponsoren</th>
                </tr>
              </thead>
              <tbody>
                ${yearlySummaryRows}
                <tr>
                  <td style="font-weight:bold; text-align:center;">Gesamt</td>
                  <td style="font-weight:bold; text-align:right;">${formatAmount(summary.totalDonations)}</td>
                  <td style="font-weight:bold; text-align:center;">${summary.totalCount}</td>
                  <td style="font-weight:bold; text-align:center;">${summary.totalDonors}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <script>
            window.addEventListener('load', function() {
              setTimeout(function() { window.print(); }, 250);
            });
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  if (loading) {
    return <div className="flex justify-center items-center p-8"><FaSpinner className="animate-spin text-2xl" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-gray-800">Spendenverwaltungsblatt</h3>
          <p className="text-sm text-gray-600">Spender-/Sponsorenliste mit Kontaktdaten und Jahresauswertung</p>
        </div>
        <button
          onClick={handlePrint}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2"
        >
          <FaPrint /> Drucken
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-pink-50 to-pink-100 border-2 border-pink-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <FaChartBar className="text-2xl text-pink-600" />
            <p className="text-sm font-medium text-gray-600">Gesamtspenden (alle Jahre)</p>
          </div>
          <p className="text-3xl font-bold text-pink-700">{summary.totalDonations?.toFixed(2)} €</p>
          <p className="text-xs text-gray-600 mt-2">{summary.totalCount} Transaktionen</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-lg p-6">
          <p className="text-sm font-medium text-gray-600 mb-2">Anzahl Spender/Sponsoren</p>
          <p className="text-3xl font-bold text-blue-700">{summary.totalDonors}</p>
          <p className="text-xs text-gray-600 mt-2">Eindeutige Kontakte</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-lg p-6">
          <p className="text-sm font-medium text-gray-600 mb-2">Durchschnittsspende</p>
          <p className="text-3xl font-bold text-green-700">{summary.averageDonation?.toFixed(2)} €</p>
          <p className="text-xs text-gray-600 mt-2">Pro Transaktion</p>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-200 rounded-lg p-6">
          <p className="text-sm font-medium text-gray-600 mb-2">Größte Einzelspende</p>
          <p className="text-3xl font-bold text-amber-700">{summary.largestDonation?.toFixed(2)} €</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h4 className="font-bold text-lg text-gray-800 mb-3">Spender-/Sponsorenliste (alle Jahre)</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-center font-bold">Nr.</th>
                <th className="px-3 py-2 text-left font-bold min-w-[180px]">Name</th>
                <th className="px-3 py-2 text-center font-bold min-w-[100px]">Typ</th>
                <th className="px-3 py-2 text-left font-bold min-w-[220px]">Adresse</th>
                <th className="px-3 py-2 text-center font-bold min-w-[130px]">Telefon</th>
                <th className="px-3 py-2 text-left font-bold min-w-[220px]">E-Mail</th>
                {yearColumns.map((year) => (
                  <th key={year} className="px-3 py-2 text-right font-bold min-w-[100px]">{year}</th>
                ))}
                <th className="px-3 py-2 text-center font-bold min-w-[130px]">Letzte Spende</th>
                <th className="px-3 py-2 text-left font-bold min-w-[260px]">Spendenhistorie (Datum: Betrag)</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {donorRows.map((row, index) => (
                <tr key={row.donorId} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-center">{index + 1}</td>
                  <td className="px-3 py-2">{row.name}</td>
                  <td className="px-3 py-2 text-center">{row.type || '-'}</td>
                  <td className="px-3 py-2">{row.address || '-'}</td>
                  <td className="px-3 py-2 text-center">{row.phone || '-'}</td>
                  <td className="px-3 py-2">{row.email || '-'}</td>
                  {yearColumns.map((year) => (
                    <td key={`${row.donorId}-${year}`} className="px-3 py-2 text-right font-medium">
                      {row.yearTotals[year] ? formatAmount(row.yearTotals[year]) : '-'}
                    </td>
                  ))}
                  <td className="px-3 py-2 text-center">{row.lastDonationDate ? formatDateDE(row.lastDonationDate) : '-'}</td>
                  <td className="px-3 py-2 text-xs">
                    {row.donations.length === 0
                      ? '-'
                      : row.donations.map((d, i) => (
                          <div key={`${row.donorId}-${i}`}>{formatDateDE(d.date)}: {formatAmount(d.amount)}</div>
                        ))}
                  </td>
                </tr>
              ))}
              {donorRows.length > 0 && (
                <tr className="bg-gray-100 border-t-2 border-gray-400">
                  <td className="px-3 py-2 text-center font-bold" colSpan={6}>Summen</td>
                  {yearColumns.map((year) => {
                    const total = donorRows.reduce((sum, row) => sum + (row.yearTotals[year] || 0), 0);
                    return (
                      <td key={`year-total-${year}`} className="px-3 py-2 text-right font-bold">
                        {formatAmount(total)}
                      </td>
                    );
                  })}
                  <td className="px-3 py-2"></td>
                  <td className="px-3 py-2"></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h4 className="font-bold text-lg text-gray-800 mb-3">Jahresbasierte Spendenübersicht und Gesamtauswertung</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-center font-bold min-w-[120px]">Jahr</th>
                <th className="px-3 py-2 text-right font-bold min-w-[180px]">Spenden-Summe</th>
                <th className="px-3 py-2 text-center font-bold min-w-[160px]">Anzahl Spenden</th>
                <th className="px-3 py-2 text-center font-bold min-w-[220px]">Aktive Spender/Sponsoren</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {yearlyRows.map((row) => (
                <tr key={row.year} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-center">{row.year}</td>
                  <td className="px-3 py-2 text-right font-semibold">{formatAmount(row.totalAmount)}</td>
                  <td className="px-3 py-2 text-center">{row.donationCount}</td>
                  <td className="px-3 py-2 text-center">{row.donorCount}</td>
                </tr>
              ))}
              <tr className="bg-blue-50 border-t-2 border-blue-300">
                <td className="px-3 py-2 text-center font-bold">Gesamt</td>
                <td className="px-3 py-2 text-right font-bold">{formatAmount(summary.totalDonations)}</td>
                <td className="px-3 py-2 text-center font-bold">{summary.totalCount}</td>
                <td className="px-3 py-2 text-center font-bold">{summary.totalDonors}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Hinweis:</strong> Die Liste enthält Spender/Sponsoren mit Datum- und Betragshistorie aus allen Jahren.
          Unten sehen Sie zusätzlich die Jahreswerte und die Gesamtsumme über alle Jahre.
        </p>
      </div>
    </div>
  );
}
