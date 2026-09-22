import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { FaWallet, FaArrowUp, FaArrowDown, FaLandmark, FaMoneyBillWave, FaSpinner, FaPrint } from 'react-icons/fa';

export default function BuchhaltungDashboard() {
  const [loading, setLoading] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);
  const [stats, setStats] = useState({
    totalBalance: 0,
    totalIncome: 0,
    totalExpense: 0,
    yearIncome: 0,
    yearExpense: 0,
    loanBalance: 0,
    totalLoanIncome: 0,
    totalLoanRepayment: 0
  });
  const [accountBalances, setAccountBalances] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [yearlyContributionSummary, setYearlyContributionSummary] = useState([]);
  const [detailedStats, setDetailedStats] = useState({});
  const [selectedDetailYear, setSelectedDetailYear] = useState(new Date().getFullYear().toString());

  const normalizeCategoryName = (name = '') =>
    name
      .toLowerCase()
      .replace(/ä/g, 'ae')
      .replace(/ö/g, 'oe')
      .replace(/ü/g, 'ue')
      .replace(/ß/g, 'ss')
      .replace(/ğ/g, 'g')
      .replace(/ı/g, 'i')
      .replace(/i̇/g, 'i') // for dotted capital I
      .replace(/ş/g, 's')
      .replace(/ç/g, 'c')
      .replace(/[\s\-_]/g, '');

  const escapeHtml = (value = '') =>
    String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const toFiniteNumber = (value) => {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : 0;
    }
    const normalizedValue = String(value ?? '').replace(',', '.').trim();
    const numericValue = Number.parseFloat(normalizedValue);
    return Number.isFinite(numericValue) ? numericValue : 0;
  };

  const formatAmount = (value = 0) =>
    toFiniteNumber(value).toLocaleString('de-DE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

  const formatEuro = (value = 0) => `${formatAmount(value)} €`;

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    
    // 1. Tüm İşlemleri Çek (Hesaplama için)
    const { data: allTrx, error } = await supabase
      .from('accounting_transactions')
      .select('amount, type, date, description, account_id, subcategory, accounting_accounts(name), accounting_categories(name)');

    if (error) {
      console.error('Error fetching transactions:', error);
      setLoading(false);
      return;
    }

    // 2. Son 5 İşlemi Çek (Liste için)
    const { data: recentTrx } = await supabase
      .from('accounting_transactions')
      .select(`
        *,
        accounting_categories (name),
        accounting_contacts (name)
      `)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(5);

    setRecentTransactions(recentTrx || []);

    // 3. İstatistikleri Hesapla
    let totalInc = 0;
    let totalExp = 0;
    let yearInc = 0;
    let yearExp = 0;
    let totalLoanIncome = 0;
    let totalLoanRepayment = 0;
    const yearlySummaryMap = {};
    const detailedSummaryMap = {};
    
    const currentYear = new Date().getFullYear().toString();
    const accMap = {};

    allTrx.forEach(t => {
      const amount = toFiniteNumber(t.amount);
      const isIncome = t.type === 'income';
      const dateValue = t.date || '';
      const isCurrentYear = dateValue.startsWith(currentYear);
      const trxYear = /^\d{4}/.test(dateValue) ? dateValue.slice(0, 4) : 'Ohne Datum';

      if (!detailedSummaryMap[trxYear]) {
        detailedSummaryMap[trxYear] = { incomes: {}, expenses: {} };
      }
      
      let catName = t.accounting_categories?.name || 'Sonstige / Unbekannt';
      
      if (catName.toLowerCase().includes('veranstaltung')) {
        catName = 'Veranstaltungen';
      }

      const subName = t.subcategory || 'Allgemein';

      if (isIncome) {
        if (!detailedSummaryMap[trxYear].incomes[catName]) {
          detailedSummaryMap[trxYear].incomes[catName] = { total: 0, subs: {}, items: [] };
        }
        detailedSummaryMap[trxYear].incomes[catName].total += amount;
        detailedSummaryMap[trxYear].incomes[catName].subs[subName] = (detailedSummaryMap[trxYear].incomes[catName].subs[subName] || 0) + amount;
        if (t.description) {
          detailedSummaryMap[trxYear].incomes[catName].items.push({
            desc: t.description,
            sub: subName,
            amount: amount,
            date: t.date
          });
        }
      } else {
        if (!detailedSummaryMap[trxYear].expenses[catName]) {
          detailedSummaryMap[trxYear].expenses[catName] = { total: 0, subs: {}, items: [] };
        }
        detailedSummaryMap[trxYear].expenses[catName].total += amount;
        detailedSummaryMap[trxYear].expenses[catName].subs[subName] = (detailedSummaryMap[trxYear].expenses[catName].subs[subName] || 0) + amount;
        if (t.description) {
          detailedSummaryMap[trxYear].expenses[catName].items.push({
            desc: t.description,
            sub: subName,
            amount: amount,
            date: t.date
          });
        }
      }

      // Genel Toplamlar
      if (isIncome) totalInc += amount;
      else totalExp += amount;

      // Yıl Toplamları
      if (isCurrentYear) {
        if (isIncome) yearInc += amount;
        else yearExp += amount;
      }

      const normalizedCategoryName = normalizeCategoryName(t.accounting_categories?.name || '');
      
      const isCashJarIncome =
        normalizedCategoryName.includes('spendenbox') ||
        normalizedCategoryName.includes('sammelglas') ||
        normalizedCategoryName.includes('kavanoz') ||
        normalizedCategoryName.includes('tischglas');
      const isDonation = !isCashJarIncome && (
        normalizedCategoryName.includes('spende') ||
        normalizedCategoryName.includes('zuwendung') ||
        normalizedCategoryName.includes('bagis') ||
        normalizedCategoryName.includes('donation')
      );
      const isMembership = (normalizedCategoryName.includes('mitglied') && normalizedCategoryName.includes('beitrag')) || normalizedCategoryName.includes('aidat');
      const isLoanTransaction = normalizedCategoryName.includes('darlehen') || normalizedCategoryName.includes('kredit') || normalizedCategoryName.includes('loan');

      if (!yearlySummaryMap[trxYear]) {
        yearlySummaryMap[trxYear] = {
          year: trxYear,
          spende: 0,
          mitgliederbeitrag: 0,
          sonstiges: 0,
          sonstigesBreakdown: {},
          ausgaben: 0,
          netChange: 0
        };
      }

      const trackSonstiges = (val, catName) => {
        yearlySummaryMap[trxYear].sonstiges += val;
        if (!yearlySummaryMap[trxYear].sonstigesBreakdown[catName]) {
          yearlySummaryMap[trxYear].sonstigesBreakdown[catName] = 0;
        }
        yearlySummaryMap[trxYear].sonstigesBreakdown[catName] += val;
      };

      yearlySummaryMap[trxYear].netChange += isIncome ? amount : -amount;

      if (isIncome) {
        if (isMembership) {
          yearlySummaryMap[trxYear].mitgliederbeitrag += amount;
        } else if (isCashJarIncome) {
          trackSonstiges(amount, t.accounting_categories?.name || 'Spendenbox');
        } else if (isDonation) {
          yearlySummaryMap[trxYear].spende += amount;
        } else {
          trackSonstiges(amount, t.accounting_categories?.name || 'Sonstiges');
        }
      } else if (isLoanTransaction) {
        trackSonstiges(-amount, t.accounting_categories?.name || 'Darlehen');
      } else {
        yearlySummaryMap[trxYear].ausgaben += amount;
      }

      if (isLoanTransaction) {
        if (isIncome) totalLoanIncome += amount;
        else totalLoanRepayment += amount;
      }

      // Hesap Bakiyeleri
      if (t.account_id) {
        if (!accMap[t.account_id]) {
          accMap[t.account_id] = { 
            name: t.accounting_accounts?.name || 'Unbekannt', 
            balance: 0 
          };
        }
        if (isIncome) accMap[t.account_id].balance += amount;
        else accMap[t.account_id].balance -= amount;
      }
    });

    setStats({
      totalBalance: totalInc - totalExp,
      totalIncome: totalInc,
      totalExpense: totalExp,
      yearIncome: yearInc,
      yearExpense: yearExp,
      loanBalance: totalLoanIncome - totalLoanRepayment,
      totalLoanIncome,
      totalLoanRepayment
    });

    let runningBalance = 0;
    const yearlySummary = Object.values(yearlySummaryMap)
      .map(item => ({
        ...item,
        total: item.netChange
      }))
      .sort((a, b) => {
        if (a.year === 'Ohne Datum') return 1;
        if (b.year === 'Ohne Datum') return -1;
        return Number(a.year) - Number(b.year);
      })
      .map(item => {
        runningBalance += item.total;
        return {
          ...item,
          closingBalance: runningBalance
        };
      });

    setYearlyContributionSummary(yearlySummary);
    setDetailedStats(detailedSummaryMap);
    
    const availableYears = Object.keys(detailedSummaryMap).sort((a,b) => b.localeCompare(a));
    if (availableYears.length > 0 && !availableYears.includes(selectedDetailYear)) {
      setSelectedDetailYear(availableYears[0]);
    }

    setAccountBalances(Object.values(accMap));
    setLoading(false);
  };

  const handlePrintFullReport = () => {
    setIsPrinting(true);
    
    setTimeout(() => {
      const printWindow = window.open('', '_blank', 'width=1000,height=1200');
      if (!printWindow) {
        alert('Bitte erlauben Sie Pop-ups, um die Druckansicht zu öffnen.');
        setIsPrinting(false);
        return;
      }

      const year = selectedDetailYear;
      const yearData = detailedStats[year] || { incomes: {}, expenses: {} };
      const incEntries = Object.entries(yearData.incomes).sort((a,b) => b[1].total - a[1].total);
      const expEntries = Object.entries(yearData.expenses).sort((a,b) => b[1].total - a[1].total);
      const totalInc = incEntries.reduce((acc, curr) => acc + curr[1].total, 0);
      const totalExp = expEntries.reduce((acc, curr) => acc + curr[1].total, 0);
      const netResult = totalInc - totalExp;

      const summaryItem = yearlyContributionSummary.find(s => s.year === year) || { total: netResult, closingBalance: netResult };
      const uebertrag = summaryItem.closingBalance - summaryItem.total;
      
      const renderTableRows = (entries) => {
        if (entries.length === 0) return '<tr><td colspan="2" class="empty">Keine Buchungen</td></tr>';
        return entries.map(([cat, dataObj]) => `
          <tr>
            <td class="cat-name">${escapeHtml(cat)}</td>
            <td class="amount">${formatAmount(dataObj.total)}</td>
          </tr>
          ${(Object.keys(dataObj.subs).length > 1 || (Object.keys(dataObj.subs).length === 1 && Object.keys(dataObj.subs)[0] !== 'Allgemein')) 
            ? Object.entries(dataObj.subs).map(([sub, subAmt]) => `
              <tr>
                <td class="sub-cat">↳ ${escapeHtml(sub)}</td>
                <td class="amount sub-cat-amount">${formatAmount(subAmt)}</td>
              </tr>
            `).join('') 
            : ''}
        `).join('');
      };

      const yearlyRowsHtml = yearlyContributionSummary.map(item => `
        <tr>
          <td class="fw-bold text-center">${item.year}</td>
          <td class="text-right">${formatAmount(item.spende)}</td>
          <td class="text-right">${formatAmount(item.mitgliederbeitrag)}</td>
          <td class="text-right">${formatAmount(item.sonstiges)}</td>
          <td class="text-right text-red fw-bold">${formatAmount(item.ausgaben)}</td>
          <td class="text-right fw-bold ${item.total >= 0 ? 'text-green' : 'text-red'}">${item.total > 0 ? '+' : ''}${formatAmount(item.total)}</td>
          <td class="text-right fw-black ${item.closingBalance >= 0 ? 'text-blue' : 'text-red'}">${formatAmount(item.closingBalance)}</td>
        </tr>
      `).join('');

      let contentHtml = `
        <!DOCTYPE html>
        <html lang="de">
        <head>
          <meta charset="utf-8" />
          <title>Finanzbericht - Bürgertreff Wissen e.V.</title>
          <style>
            @page { size: A4 portrait; margin: 12mm; }
            body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; line-height: 1.4; font-size: 10pt; }
            .header { text-align: center; margin-bottom: 6mm; border-bottom: 2px solid #cbd5e1; padding-bottom: 4mm; }
            .header h1 { margin: 0 0 2mm 0; color: #0f172a; font-size: 18pt; }
            .header h2 { margin: 0 0 2mm 0; color: #475569; font-size: 14pt; font-weight: normal; }
            .header p { margin: 0; color: #64748b; font-size: 10pt; }
            
            .top-cards { display: flex; justify-content: space-between; margin-bottom: 5mm; gap: 4mm; }
            .card { flex: 1; border: 1px solid #e2e8f0; border-radius: 8px; padding: 3.5mm; background: #f8fafc; text-align: center; }
            .card.main { border-color: #93c5fd; background: #eff6ff; border-width: 2px; }
            .card-title { font-size: 8.5pt; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 1.5mm; font-weight: bold; }
            .card-value { font-size: 13.5pt; font-weight: bold; }
            .text-green { color: #059669; }
            .text-red { color: #e11d48; }
            .text-blue { color: #1d4ed8; }
            .text-amber { color: #b45309; }
            .fw-bold { font-weight: 600; }
            .fw-black { font-weight: 800; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }

            .accounts-banner { display: flex; justify-content: space-between; align-items: center; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 2.5mm 4mm; margin-bottom: 6mm; flex-wrap: wrap; gap: 2.5mm; }
            .accounts-label { font-size: 8.5pt; font-weight: bold; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; }
            .accounts-list { display: flex; gap: 3mm; flex-wrap: wrap; }
            .acc-pill { background: #ffffff; border: 1px solid #cbd5e1; border-radius: 4px; padding: 1.5mm 3mm; font-size: 8.5pt; display: flex; align-items: center; gap: 1.5mm; }
            .loan-pill { border-color: #fde68a; background: #fffbeb; }
            .acc-name { font-weight: 600; color: #334155; }
            .acc-val { font-weight: bold; }

            .section-title { font-size: 13pt; color: #334155; border-bottom: 2px solid #94a3b8; margin-bottom: 3.5mm; padding-bottom: 1.5mm; margin-top: 0; }

            .table-container { margin-bottom: 7mm; page-break-inside: avoid; }
            table.overview-table { width: 100%; border-collapse: collapse; font-size: 8.5pt; }
            table.overview-table th, table.overview-table td { border: 1px solid #cbd5e1; padding: 5px; }
            table.overview-table th { background: #f1f5f9; font-weight: bold; text-align: center; }
            table.overview-table tr:nth-child(even) { background: #f8fafc; }
            table.overview-table tfoot th, table.overview-table tfoot td { background: #e2e8f0; font-weight: bold; }

            .detail-section { page-break-inside: auto; }
            .grid { display: flex; width: 100%; gap: 6mm; align-items: stretch; }
            .col { flex: 1; }
            .box { border: 1px solid #e2e8f0; border-radius: 6px; padding: 3.5mm; background: #ffffff; height: 100%; box-sizing: border-box; }
            .box h3 { margin: 0 0 2.5mm 0; font-size: 11pt; border-bottom: 2px solid #cbd5e1; padding-bottom: 1.5mm; display: flex; justify-content: space-between; align-items: center; }
            
            table.detail-table { width: 100%; border-collapse: collapse; font-size: 8.5pt; }
            table.detail-table td { padding: 4px 0; border-bottom: 1px dashed #e2e8f0; }
            table.detail-table tr:last-child td { border-bottom: none; }
            .amount { text-align: right; font-weight: bold; }
            .cat-name { color: #334155; font-weight: 700; }
            .sub-cat { padding-left: 12px; font-size: 8pt; color: #64748b; font-weight: normal; }
            .sub-cat-amount { font-size: 8pt; color: #64748b; font-weight: normal; }
            .empty { color: #94a3b8; font-style: italic; font-size: 8.5pt; text-align: center; }

            .result-box { margin-top: 5mm; padding: 4mm; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; display: flex; justify-content: space-around; align-items: center; text-align: center; page-break-inside: avoid; }
            .result-item { flex: 1; }
            .result-label { font-size: 8.5pt; color: #3b82f6; font-weight: bold; text-transform: uppercase; margin-bottom: 1.5mm; letter-spacing: 0.5px; }
            .result-val { font-size: 13pt; font-weight: bold; }
            .operator { font-size: 18pt; font-weight: 300; color: #93c5fd; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Bürgertreff Wissen e.V.</h1>
            <h2>Finanzieller Monatsbericht</h2>
            <p>Bericht erstellt am: ${new Date().toLocaleDateString('de-DE')} &nbsp;|&nbsp; Berichtsjahr: ${year}</p>
          </div>

          <div class="top-cards">
            <div class="card">
              <div class="card-title">Gesamteinnahmen (${year})</div>
              <div class="card-value text-green">+ ${formatAmount(totalInc)} €</div>
            </div>
            <div class="card main">
              <div class="card-title">Aktueller Gesamtsaldo</div>
              <div class="card-value ${stats.totalBalance >= 0 ? 'text-blue' : 'text-red'}">${formatAmount(stats.totalBalance)} €</div>
            </div>
            <div class="card">
              <div class="card-title">Gesamtausgaben (${year})</div>
              <div class="card-value text-red">- ${formatAmount(totalExp)} €</div>
            </div>
          </div>

          <div class="accounts-banner">
            <span class="accounts-label">Kassen- &amp; Bankbestände (Aktuell):</span>
            <div class="accounts-list">
              ${accountBalances.map(acc => `
                <div class="acc-pill">
                  <span class="acc-name">${escapeHtml(acc.name)}:</span>
                  <span class="acc-val ${acc.balance >= 0 ? 'text-blue' : 'text-red'}">${formatAmount(acc.balance)} €</span>
                </div>
              `).join('')}
              ${stats.loanBalance !== 0 ? `
                <div class="acc-pill loan-pill">
                  <span class="acc-name">Offenes Darlehen:</span>
                  <span class="acc-val text-amber">${formatAmount(stats.loanBalance)} €</span>
                </div>
              ` : ''}
            </div>
          </div>

          <div class="table-container">
            <h2 class="section-title">Jahresübersicht (Alle Jahre)</h2>
            <table class="overview-table">
              <thead>
                <tr>
                  <th rowspan="2">Jahr</th>
                  <th colspan="3">Einnahmen</th>
                  <th rowspan="2">Ausgaben</th>
                  <th colspan="2">Saldo & Bestand</th>
                </tr>
                <tr>
                  <th>Spenden</th>
                  <th>Beiträge</th>
                  <th>Sonstiges</th>
                  <th>Ergebnis</th>
                  <th>Bestand (Ende Jahr)</th>
                </tr>
              </thead>
              <tbody>
                ${yearlyRowsHtml}
              </tbody>
              <tfoot>
                <tr>
                  <td class="text-right">Gesamt</td>
                  <td class="text-right">${formatAmount(summaryTotals.spende)}</td>
                  <td class="text-right">${formatAmount(summaryTotals.mitgliederbeitrag)}</td>
                  <td class="text-right">${formatAmount(summaryTotals.sonstiges)}</td>
                  <td class="text-right text-red">${formatAmount(summaryTotals.ausgaben)}</td>
                  <td class="text-right ${stats.totalBalance >= 0 ? 'text-green' : 'text-red'}">${stats.totalBalance > 0 ? '+' : ''}${formatAmount(stats.totalBalance)}</td>
                  <td class="text-right text-blue">${formatAmount(stats.totalBalance)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div class="detail-section">
            <h2 class="section-title">Detaillierte Bilanz für das Geschäftsjahr ${year}</h2>
            <div class="grid">
              <div class="col">
                <div class="box">
                  <h3 class="text-green"><span>Einnahmen</span> <span>${formatAmount(totalInc)} €</span></h3>
                  <table class="detail-table">
                    <tbody>${renderTableRows(incEntries)}</tbody>
                  </table>
                </div>
              </div>
              <div class="col">
                <div class="box">
                  <h3 class="text-red"><span>Ausgaben</span> <span>${formatAmount(totalExp)} €</span></h3>
                  <table class="detail-table">
                    <tbody>${renderTableRows(expEntries)}</tbody>
                  </table>
                </div>
              </div>
            </div>

            <div class="result-box">
              <div class="result-item">
                <div class="result-label">Übertrag aus Vorjahr</div>
                <div class="result-val text-blue">${formatAmount(uebertrag)} €</div>
              </div>
              <div class="result-item">
                <div class="operator">+</div>
              </div>
              <div class="result-item">
                <div class="result-label">Jahresergebnis ${year}</div>
                <div class="result-val ${netResult >= 0 ? 'text-green' : 'text-red'}">${netResult > 0 ? '+' : ''}${formatAmount(netResult)} €</div>
              </div>
              <div class="result-item">
                <div class="operator">=</div>
              </div>
              <div class="result-item">
                <div class="result-label">Neuer Bestand (Ende ${year})</div>
                <div class="result-val text-blue" style="font-size: 15pt;">${formatAmount(summaryItem.closingBalance)} €</div>
              </div>
            </div>
          </div>
          <script>
            window.onload = function() { 
              setTimeout(function() { 
                window.print(); 
              }, 500);
            }
            window.onafterprint = function() { window.close(); }
          </script>
        </body>
        </html>
      `;

      printWindow.document.write(contentHtml);
      printWindow.document.close();
      setIsPrinting(false);
    }, 100);
  };

  const summaryTotals = yearlyContributionSummary.reduce(
    (acc, item) => {
      acc.spende += item.spende;
      acc.mitgliederbeitrag += item.mitgliederbeitrag;
      acc.sonstiges += item.sonstiges;
      acc.ausgaben += item.ausgaben;
      acc.total += item.total;
      return acc;
    },
    { spende: 0, mitgliederbeitrag: 0, sonstiges: 0, ausgaben: 0, total: 0 }
  );

  if (loading) return <div className="text-center p-8">Lade Übersicht...</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Übersicht</h2>
          <p className="text-sm text-gray-500">Diese Ansicht fasst alle wesentlichen Kontodaten zusammen.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={handlePrintFullReport}
            disabled={isPrinting}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-red-700 hover:shadow-md disabled:cursor-not-allowed disabled:bg-red-300"
          >
            {isPrinting ? <FaSpinner className="animate-spin" /> : <FaPrint />}
            <span>{isPrinting ? 'Bericht wird vorbereitet...' : 'Toplantı Raporu Oluştur (PDF / Yazdır)'}</span>
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-4xl space-y-4 rounded-xl bg-gray-50 p-4 sm:p-5">
        <div className="border-b border-gray-200 pb-3">
          <h3 className="text-lg font-bold text-gray-800">Bürgertreff Wissen e.V. – Buchhaltung Übersicht</h3>
          <p className="text-sm text-gray-500">Stand: {new Date().toLocaleDateString('de-DE')}</p>
        </div>
      
      {/* ÜST KARTLAR (Genel Durum) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Bakiye Kartı */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Aktueller Saldo</p>
              <h3 className={`text-2xl font-bold mt-1 ${stats.totalBalance >= 0 ? 'text-gray-800' : 'text-red-600'}`}>
                {stats.totalBalance.toFixed(2)} €
              </h3>
            </div>
            <div className="p-3 bg-blue-100 rounded-full text-blue-600">
              <FaWallet size={20} />
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500">
            Gesamtvermögen aller Konten
          </div>
        </div>

        {/* Bu Ay Gelir */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Einnahmen (Dieses Jahr)</p>
              <h3 className="text-2xl font-bold mt-1 text-green-600">
                + {stats.yearIncome.toFixed(2)} €
              </h3>
            </div>
            <div className="p-3 bg-green-100 rounded-full text-green-600">
              <FaArrowUp size={20} />
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500">
            Gesamteinnahmen: {stats.totalIncome.toFixed(2)} €
          </div>
        </div>

        {/* Bu Ay Gider */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Ausgaben (Dieses Jahr)</p>
              <h3 className="text-2xl font-bold mt-1 text-red-600">
                - {stats.yearExpense.toFixed(2)} €
              </h3>
            </div>
            <div className="p-3 bg-red-100 rounded-full text-red-600">
              <FaArrowDown size={20} />
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500">
            Gesamtausgaben: {stats.totalExpense.toFixed(2)} €
          </div>
        </div>
      </div>

      {/* KASSEN- & KONTOBESTÄNDE (KOMPAKT) */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <FaWallet className="text-blue-600" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Kassen- &amp; Kontostände (Aktuell):</span>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {accountBalances.map((acc, index) => (
            <div key={index} className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-sm font-medium">
              <span className="text-slate-600">{acc.name.toLowerCase().includes('bank') ? <FaLandmark className="text-indigo-600 inline mr-1" /> : <FaMoneyBillWave className="text-emerald-600 inline mr-1" />} {acc.name}:</span>
              <span className={`font-bold ${acc.balance >= 0 ? 'text-blue-700' : 'text-rose-600'}`}>{formatAmount(acc.balance)} €</span>
            </div>
          ))}
          {stats.loanBalance !== 0 && (
            <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg text-sm font-medium text-amber-900">
              <span className="text-amber-700 font-semibold">Offenes Darlehen:</span>
              <span className="font-bold text-amber-800">{formatAmount(stats.loanBalance)} €</span>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="mb-6 border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
              <FaLandmark className="text-blue-600" />
              Jahresübersicht
            </h3>
            <p className="mt-1 text-sm text-slate-500 max-w-2xl">
              Detaillierte Entwicklung von Einnahmen, Ausgaben und dem Gesamtsaldo über die Jahre.
              Darlehen sowie Sammelglas- und Spendenbox-Einnahmen sind in der Spalte <span className="font-semibold text-slate-700">„Sonstiges *“</span> enthalten.
            </p>
          </div>
        </div>
        
        {yearlyContributionSummary.length === 0 ? (
          <div className="rounded-lg bg-slate-50 p-8 text-center text-slate-500 border border-slate-200">
            <p>Keine Buchungsdaten für die Jahresübersicht gefunden.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm tabular-nums border-collapse">
                <thead>
                  <tr>
                    <th rowSpan={2} className="bg-slate-50 border-b border-r border-slate-200 p-4 text-left font-bold text-slate-800 align-bottom uppercase tracking-wider text-xs">Jahr</th>
                    <th colSpan={3} className="bg-emerald-50/50 border-b border-r border-slate-200 py-3 text-center font-bold text-emerald-800 uppercase tracking-wider text-xs">Einnahmen</th>
                    <th rowSpan={2} className="bg-rose-50/50 border-b border-r border-slate-200 p-4 text-right font-bold text-rose-800 align-bottom uppercase tracking-wider text-xs">Ausgaben</th>
                    <th colSpan={2} className="bg-blue-50/50 border-b border-slate-200 py-3 text-center font-bold text-blue-800 uppercase tracking-wider text-xs">Saldo & Bestand</th>
                  </tr>
                  <tr>
                    <th className="bg-emerald-50/30 border-b border-r border-slate-200 px-4 py-2 text-right font-semibold text-emerald-700">Spenden</th>
                    <th className="bg-emerald-50/30 border-b border-r border-slate-200 px-4 py-2 text-right font-semibold text-emerald-700">Beiträge</th>
                    <th className="bg-emerald-50/30 border-b border-r border-slate-200 px-4 py-2 text-right font-semibold text-emerald-700">Sonstiges</th>
                    <th className="bg-blue-50/30 border-b border-r border-slate-200 px-4 py-2 text-right font-semibold text-blue-700">Jahresergebnis</th>
                    <th className="bg-blue-50/30 border-b border-slate-200 px-4 py-2 text-right font-semibold text-blue-700">Bestand (Ende Jahr)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {yearlyContributionSummary.map((item) => (
                    <tr key={item.year} className="hover:bg-slate-50 transition-colors">
                      <td className="border-r border-slate-100 px-4 py-3 font-bold text-slate-800 align-top">{item.year}</td>
                      <td className="border-r border-slate-100 px-4 py-3 text-right text-slate-600 align-top">{formatAmount(item.spende)}</td>
                      <td className="border-r border-slate-100 px-4 py-3 text-right text-slate-600 align-top">{formatAmount(item.mitgliederbeitrag)}</td>
                      <td className={`border-r border-slate-100 px-4 py-3 text-right align-top ${item.sonstiges >= 0 ? 'text-slate-600' : 'text-rose-600'}`}>
                        <div className="font-bold">{formatAmount(item.sonstiges)}</div>
                        {Object.keys(item.sonstigesBreakdown || {}).length > 0 && (
                          <div className="mt-1 flex flex-col gap-0.5 text-[10px] text-slate-400">
                            {Object.entries(item.sonstigesBreakdown).filter(([_, val]) => val !== 0).map(([name, val]) => (
                              <div key={name} className="flex justify-end gap-1 items-center">
                                <span className="truncate max-w-[90px]" title={name}>{name}:</span>
                                <span className={val > 0 ? 'text-emerald-500' : 'text-rose-500'}>{val > 0 ? '+' : ''}{formatAmount(val)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="border-r border-slate-100 px-4 py-3 text-right font-medium text-rose-700 align-top">{formatAmount(item.ausgaben)}</td>
                      <td className={`border-r border-slate-100 px-4 py-3 text-right font-bold align-top ${item.total >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {item.total > 0 && '+'}{formatAmount(item.total)}
                      </td>
                      <td className={`px-4 py-3 text-right font-extrabold align-top ${item.closingBalance >= 0 ? 'text-blue-700' : 'text-rose-700'}`}>
                        {formatAmount(item.closingBalance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 border-t-2 border-slate-300 shadow-sm">
                    <td className="border-r border-slate-200 px-4 py-4 font-black text-slate-900">Gesamt / Aktuell</td>
                    <td className="border-r border-slate-200 px-4 py-4 text-right font-bold text-emerald-800">{formatAmount(summaryTotals.spende)}</td>
                    <td className="border-r border-slate-200 px-4 py-4 text-right font-bold text-emerald-800">{formatAmount(summaryTotals.mitgliederbeitrag)}</td>
                    <td className={`border-r border-slate-200 px-4 py-4 text-right font-bold ${summaryTotals.sonstiges >= 0 ? 'text-emerald-800' : 'text-rose-700'}`}>
                      {formatAmount(summaryTotals.sonstiges)}
                    </td>
                    <td className="border-r border-slate-200 px-4 py-4 text-right font-bold text-rose-800">{formatAmount(summaryTotals.ausgaben)}</td>
                    <td className={`border-r border-slate-200 px-4 py-4 text-right font-black ${stats.totalBalance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {stats.totalBalance > 0 && '+'}{formatAmount(stats.totalBalance)}
                    </td>
                    <td className={`px-4 py-4 text-right font-black ${stats.totalBalance >= 0 ? 'text-blue-800' : 'text-rose-800'}`}>
                      {formatAmount(stats.totalBalance)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* DETAILS SECTION (Her zaman görünür) */}
        <div className="mt-8 pt-6 border-t border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-6 gap-4">
            <div>
              <h4 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                Bilanz-Details nach Kategorien
              </h4>
              <p className="mt-1 text-sm text-slate-500">
                Wählen Sie ein Jahr aus, um die Einnahmen und Ausgaben detailliert nach Kategorien zu betrachten.
              </p>
            </div>
          </div>
          
          {/* Yıl Seçme Sekmeleri */}
          <div className="flex flex-wrap gap-2 mb-6">
            {Object.keys(detailedStats).sort((a,b) => b.localeCompare(a)).map(year => (
              <button
                key={year}
                onClick={() => setSelectedDetailYear(year)}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                  selectedDetailYear === year 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                {year}
              </button>
            ))}
          </div>

          <div className="space-y-6">
            {Object.keys(detailedStats)
              .filter(year => year === selectedDetailYear)
              .map(year => {
              const yearData = detailedStats[year];
              const incEntries = Object.entries(yearData.incomes).sort((a,b) => b[1].total - a[1].total);
              const expEntries = Object.entries(yearData.expenses).sort((a,b) => b[1].total - a[1].total);
              const totalInc = incEntries.reduce((acc, curr) => acc + curr[1].total, 0);
              const totalExp = expEntries.reduce((acc, curr) => acc + curr[1].total, 0);
              const netResult = totalInc - totalExp;

              const summaryItem = yearlyContributionSummary.find(s => s.year === year) || { total: netResult, closingBalance: netResult };
              const uebertrag = summaryItem.closingBalance - summaryItem.total;
              const neuerBestand = summaryItem.closingBalance;

              return (
                <div key={year} className="bg-slate-50/50 rounded-xl p-5 border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-center mb-4 border-b border-slate-200 pb-2">
                    <h5 className="text-xl font-black text-slate-700">Geschäftsjahr {year}</h5>
                  </div>

                  <div className="bg-blue-50/60 rounded-xl p-4 mb-8 border border-blue-100 flex flex-col md:flex-row justify-between items-center shadow-sm">
                    <div className="text-center md:text-left mb-4 md:mb-0">
                      <div className="text-xs uppercase tracking-wider font-bold text-blue-600/70 mb-1">Übertrag aus Vorjahr</div>
                      <div className="text-xl font-extrabold text-blue-800">{formatAmount(uebertrag)} €</div>
                    </div>
                    
                    <div className="hidden md:block text-blue-200 text-3xl font-light">+</div>
                    
                    <div className="text-center mb-4 md:mb-0">
                      <div className="text-xs uppercase tracking-wider font-bold text-blue-600/70 mb-1">Jahresergebnis</div>
                      <div className={`text-xl font-extrabold ${netResult >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {netResult > 0 && '+'}{formatAmount(netResult)} €
                      </div>
                    </div>
                    
                    <div className="hidden md:block text-blue-200 text-3xl font-light">=</div>
                    
                    <div className="bg-white rounded-xl px-6 py-3 shadow-sm border border-blue-100/50 text-center md:text-right">
                      <div className="text-xs uppercase tracking-wider font-extrabold text-slate-400 mb-1">Neuer Bestand (Kasa)</div>
                      <div className="text-2xl font-black text-blue-700">{formatAmount(neuerBestand)} €</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Einnahmen */}
                    <div className="bg-white rounded-lg p-4 border border-emerald-100 shadow-sm">
                      <h6 className="font-bold text-emerald-700 mb-3 flex justify-between border-b border-emerald-100 pb-2">
                        <span>Einnahmen</span>
                        <span>{formatAmount(totalInc)} €</span>
                      </h6>
                      <ul className="space-y-3">
                        {incEntries.length === 0 ? <li className="text-sm text-slate-500 italic">Keine Einnahmen gebucht</li> : 
                          incEntries.map(([cat, dataObj]) => (
                            <li key={cat}>
                              <div className="flex justify-between text-sm items-center">
                                <span className="text-slate-600 font-medium">{cat}</span>
                                <span className="font-semibold text-slate-900">{formatAmount(dataObj.total)}</span>
                              </div>
                              {(Object.keys(dataObj.subs).length > 1 || (Object.keys(dataObj.subs).length === 1 && Object.keys(dataObj.subs)[0] !== 'Allgemein')) && (
                                <ul className="mt-1 pl-3 space-y-1">
                                  {Object.entries(dataObj.subs).map(([sub, subAmt]) => (
                                    <li key={sub} className="flex justify-between text-xs items-center text-slate-500">
                                      <span>↳ {sub}</span>
                                      <span>{formatAmount(subAmt)}</span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </li>
                          ))
                        }
                      </ul>
                    </div>
                    
                    {/* Ausgaben */}
                    <div className="bg-white rounded-lg p-4 border border-rose-100 shadow-sm">
                      <h6 className="font-bold text-rose-700 mb-3 flex justify-between border-b border-rose-100 pb-2">
                        <span>Ausgaben</span>
                        <span>{formatAmount(totalExp)} €</span>
                      </h6>
                      <ul className="space-y-3">
                        {expEntries.length === 0 ? <li className="text-sm text-slate-500 italic">Keine Ausgaben gebucht</li> : 
                          expEntries.map(([cat, dataObj]) => (
                            <li key={cat}>
                              <div className="flex justify-between text-sm items-center">
                                <span className="text-slate-600 font-medium">{cat}</span>
                                <span className="font-semibold text-slate-900">{formatAmount(dataObj.total)}</span>
                              </div>
                              {(Object.keys(dataObj.subs).length > 1 || (Object.keys(dataObj.subs).length === 1 && Object.keys(dataObj.subs)[0] !== 'Allgemein')) && (
                                <ul className="mt-1 pl-3 space-y-1">
                                  {Object.entries(dataObj.subs).map(([sub, subAmt]) => (
                                    <li key={sub} className="flex justify-between text-xs items-center text-slate-500">
                                      <span>↳ {sub}</span>
                                      <span>{formatAmount(subAmt)}</span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </li>
                          ))
                        }
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Kontostände</h3>
        
        {/* Darlehen Bilgisi - Kompakt */}
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FaLandmark className="text-amber-600" />
              <span className="text-sm font-medium text-gray-700">Offenes Darlehen</span>
            </div>
            <span className={`text-lg font-bold ${stats.loanBalance >= 0 ? 'text-amber-700' : 'text-red-600'}`}>
              {stats.loanBalance.toFixed(2)} €
            </span>
          </div>
          <div className="mt-1 text-xs text-gray-600 pl-6">
            Aufnahme: {stats.totalLoanIncome.toFixed(2)} € • Rückzahlung: {stats.totalLoanRepayment.toFixed(2)} €
          </div>
        </div>

        <div className="space-y-4">
          {accountBalances.length === 0 ? (
            <p className="text-gray-500 text-sm">Keine Kontodaten verfügbar.</p>
          ) : (
            accountBalances.map((acc, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${acc.name.toLowerCase().includes('bank') ? 'bg-indigo-100 text-indigo-600' : 'bg-yellow-100 text-yellow-600'}`}>
                    {acc.name.toLowerCase().includes('bank') ? <FaLandmark /> : <FaMoneyBillWave />}
                  </div>
                  <span className="font-medium text-gray-700">{acc.name}</span>
                </div>
                <span className={`font-bold ${acc.balance >= 0 ? 'text-gray-800' : 'text-red-600'}`}>
                  {acc.balance.toFixed(2)} €
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Letzte Transaktionen</h3>
        <div className="space-y-3">
          {recentTransactions.length === 0 ? (
            <p className="text-gray-500 text-sm">Keine Transaktionen gefunden.</p>
          ) : (
            recentTransactions.map((trx) => (
              <div key={trx.id} className="flex flex-col md:flex-row md:justify-between md:items-center text-sm border-b last:border-0 pb-2 last:pb-0 gap-1">
                <div className="flex-1">
                  <div className="font-medium text-gray-800">
                    {trx.accounting_categories?.name || 'Unbekannt'}
                    {trx.subcategory && <span className="text-xs text-gray-500 font-normal ml-1">(↳ {trx.subcategory})</span>}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(trx.date).toLocaleDateString('de-DE')}
                    {trx.accounting_contacts && ` • ${trx.accounting_contacts.name}`}
                  </div>
                  {trx.description && (
                    <div className="text-xs text-gray-600 mt-1">{trx.description}</div>
                  )}
                  {trx.account_id && trx.accounting_accounts?.name && (
                    <div className="text-xs text-gray-400 mt-1">Konto: {trx.accounting_accounts.name}</div>
                  )}
                  {trx.receipt_no && (
                    <div className="text-xs text-gray-400 mt-1">Beleg-Nr: {trx.receipt_no}</div>
                  )}
                </div>
                <span className={`font-bold ${trx.type === 'income' ? 'text-green-600' : 'text-red-600'} md:ml-4`}>
                  {trx.type === 'income' ? '+' : '-'} {formatEuro(trx.amount)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
