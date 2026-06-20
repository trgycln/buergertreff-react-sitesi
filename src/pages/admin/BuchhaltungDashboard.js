import React, { useState, useEffect, useRef } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { supabase } from '../../supabaseClient';
import { FaWallet, FaArrowUp, FaArrowDown, FaLandmark, FaMoneyBillWave, FaFilePdf, FaSpinner, FaPrint } from 'react-icons/fa';

export default function BuchhaltungDashboard() {
  const [loading, setLoading] = useState(true);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const dashboardRef = useRef(null);
  const normalizeCategoryName = (name = '') =>
    name
      .toLowerCase()
      .replace(/ä/g, 'ae')
      .replace(/ö/g, 'oe')
      .replace(/ü/g, 'ue')
      .replace(/ß/g, 'ss')
      .replace(/[\s\-_]/g, '');

  const escapeHtml = (value = '') =>
    String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

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
  const [showDetails, setShowDetails] = useState(false);

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
    // Not: Gerçek bir uygulamada bu hesaplamaları veritabanı tarafında (SQL View veya RPC) yapmak daha performanslıdır.
    // Ancak şimdilik basitlik adına React tarafında topluyoruz.
    const { data: allTrx, error } = await supabase
      .from('accounting_transactions')
      .select('amount, type, date, description, account_id, accounting_accounts(name), accounting_categories(name)');

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
    
    const currentYear = new Date().getFullYear().toString(); // "2026"
    const accMap = {}; // Hesap bazlı toplamlar için

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
      
      // Benzer kategorileri tek bir isim altında toplama (Örn: Veranstaltungen ve Veranstaltungskosten)
      if (catName.toLowerCase().includes('veranstaltung')) {
        catName = 'Veranstaltungen';
      }

      if (isIncome) {
        detailedSummaryMap[trxYear].incomes[catName] = (detailedSummaryMap[trxYear].incomes[catName] || 0) + amount;
      } else {
        detailedSummaryMap[trxYear].expenses[catName] = (detailedSummaryMap[trxYear].expenses[catName] || 0) + amount;
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
      const normalizedDescription = normalizeCategoryName(t.description || '');
      const normalizedTransactionText = `${normalizedCategoryName} ${normalizedDescription}`;
      const isCashJarIncome =
        normalizedTransactionText.includes('spendenbox') ||
        normalizedTransactionText.includes('sammelglas') ||
        normalizedTransactionText.includes('kavanoz') ||
        normalizedTransactionText.includes('tischglas');
      const isDonation = !isCashJarIncome && (
        normalizedTransactionText.includes('spende') ||
        normalizedTransactionText.includes('zuwendung') ||
        normalizedTransactionText.includes('bagis') ||
        normalizedTransactionText.includes('donation')
      );
      const isMembership = (normalizedTransactionText.includes('mitglied') && normalizedTransactionText.includes('beitrag')) || normalizedTransactionText.includes('aidat');
      const isLoanTransaction = normalizedTransactionText.includes('darlehen') || normalizedTransactionText.includes('kredit') || normalizedTransactionText.includes('loan');

      if (!yearlySummaryMap[trxYear]) {
        yearlySummaryMap[trxYear] = {
          year: trxYear,
          spende: 0,
          mitgliederbeitrag: 0,
          sonstiges: 0,
          ausgaben: 0,
          netChange: 0
        };
      }

      yearlySummaryMap[trxYear].netChange += isIncome ? amount : -amount;

      if (isIncome) {
        if (isMembership) {
          yearlySummaryMap[trxYear].mitgliederbeitrag += amount;
        } else if (isCashJarIncome) {
          yearlySummaryMap[trxYear].sonstiges += amount;
        } else if (isDonation) {
          yearlySummaryMap[trxYear].spende += amount;
        } else {
          yearlySummaryMap[trxYear].sonstiges += amount;
        }
      } else if (isLoanTransaction) {
        yearlySummaryMap[trxYear].sonstiges -= amount;
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

    setAccountBalances(Object.values(accMap));
    setLoading(false);
  };

  const captureDashboardCanvas = async () => {
    if (!dashboardRef.current) return null;

    const element = dashboardRef.current;
    return html2canvas(element, {
      scale: 1.4,
      useCORS: true,
      backgroundColor: '#f9fafb',
      logging: false,
      scrollX: 0,
      scrollY: -window.scrollY,
      windowWidth: Math.max(element.scrollWidth, element.clientWidth),
      windowHeight: Math.max(element.scrollHeight, element.clientHeight)
    });
  };

  const handleExportPdf = async () => {
    setIsExportingPdf(true);

    try {
      const canvas = await captureDashboardCanvas();
      if (!canvas) return;

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      const margin = 6;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const maxWidth = pageWidth - margin * 2;
      const maxHeight = pageHeight - margin * 2;
      const ratio = Math.min(maxWidth / canvas.width, maxHeight / canvas.height);
      const pdfWidth = canvas.width * ratio;
      const pdfHeight = canvas.height * ratio;
      const offsetX = (pageWidth - pdfWidth) / 2;
      const offsetY = (pageHeight - pdfHeight) / 2;

      pdf.addImage(imgData, 'PNG', offsetX, offsetY, pdfWidth, pdfHeight, undefined, 'FAST');

      const fileDate = new Date().toISOString().split('T')[0];
      pdf.save(`Buchhaltung_Uebersicht_${fileDate}.pdf`);
    } catch (error) {
      console.error('PDF export failed:', error);
      alert('Beim Erstellen der PDF ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handlePrintDashboard = async () => {
    setIsPrinting(true);

    try {
      const canvas = await captureDashboardCanvas();
      if (!canvas) return;

      const imgData = canvas.toDataURL('image/png');
      const printWindow = window.open('', '_blank', 'width=900,height=1200');

      if (!printWindow) {
        alert('Bitte erlauben Sie Pop-ups, um die Druckansicht zu öffnen.');
        return;
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="de">
          <head>
            <meta charset="utf-8" />
            <title>Buchhaltung Übersicht</title>
            <style>
              @page { size: A4 portrait; margin: 6mm; }
              html, body {
                margin: 0;
                padding: 0;
                background: #ffffff;
              }
              body {
                display: flex;
                justify-content: center;
                align-items: flex-start;
              }
              img {
                width: 100%;
                max-width: 198mm;
                max-height: 285mm;
                object-fit: contain;
                display: block;
              }
            </style>
          </head>
          <body>
            <img src="${imgData}" alt="Buchhaltung Übersicht" />
            <script>
              window.onload = function () {
                window.focus();
                window.print();
              };
              window.onafterprint = function () {
                window.close();
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } catch (error) {
      console.error('Print preview failed:', error);
      alert('Beim Öffnen der Druckansicht ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.');
    } finally {
      setIsPrinting(false);
    }
  };

  const handlePrintDetails = () => {
    const printWindow = window.open('', '_blank', 'width=900,height=1200');
    if (!printWindow) {
      alert('Bitte erlauben Sie Pop-ups, um die Druckansicht zu öffnen.');
      return;
    }

    let contentHtml = `
      <!DOCTYPE html>
      <html lang="de">
      <head>
        <meta charset="utf-8" />
        <title>Bilanz-Details nach Kategorien</title>
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; line-height: 1.5; }
          .header { text-align: center; margin-bottom: 10mm; border-bottom: 2px solid #cbd5e1; padding-bottom: 5mm; }
          .header h1 { margin: 0 0 2mm 0; color: #0f172a; font-size: 20pt; }
          .header p { margin: 0; color: #64748b; font-size: 10pt; }
          .year-block { page-break-inside: avoid; margin-bottom: 15mm; }
          .year-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #94a3b8; margin-bottom: 4mm; padding-bottom: 2mm; }
          .year-header h2 { margin: 0; font-size: 16pt; color: #334155; }
          .net-result { font-size: 12pt; font-weight: bold; padding: 4px 12px; border-radius: 4px; }
          .net-positive { background-color: #d1fae5; color: #065f46; }
          .net-negative { background-color: #ffe4e6; color: #9f1239; }
          .grid { display: table; width: 100%; table-layout: fixed; border-spacing: 5mm 0; margin-left: -5mm; margin-right: -5mm; }
          .col { display: table-cell; width: 50%; vertical-align: top; }
          .box { border: 1px solid #e2e8f0; border-radius: 6px; padding: 4mm; background: #f8fafc; }
          .box h3 { margin: 0 0 3mm 0; font-size: 12pt; border-bottom: 1px solid #cbd5e1; padding-bottom: 2mm; display: flex; justify-content: space-between; }
          .text-emerald { color: #059669; }
          .text-rose { color: #e11d48; }
          table { width: 100%; border-collapse: collapse; font-size: 10pt; }
          td { padding: 4px 0; border-bottom: 1px dashed #cbd5e1; }
          tr:last-child td { border-bottom: none; }
          .amount { text-align: right; font-weight: 500; }
          .cat-name { color: #475569; }
          .empty { color: #94a3b8; font-style: italic; font-size: 9pt; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Bürgertreff Wissen e.V.</h1>
          <h2 style="margin: 0 0 2mm 0; color: #475569; font-size: 16pt; font-weight: normal;">Bilanz-Details nach Kategorien</h2>
          <p style="margin-bottom: 4mm;">Stand: ${new Date().toLocaleDateString('de-DE')}</p>
          <div style="display: inline-block; padding: 6px 16px; background-color: #f1f5f9; border: 1px solid #cbd5e1; color: #0f172a; border-radius: 6px; font-weight: bold; font-size: 14pt;">
            Aktueller Gesamtsaldo: <span style="color: ${stats.totalBalance >= 0 ? '#059669' : '#e11d48'};">${formatAmount(stats.totalBalance)} €</span>
          </div>
        </div>
    `;

    Object.keys(detailedStats).sort((a, b) => b.localeCompare(a)).forEach(year => {
      const yearData = detailedStats[year];
      const incEntries = Object.entries(yearData.incomes).sort((a, b) => b[1] - a[1]);
      const expEntries = Object.entries(yearData.expenses).sort((a, b) => b[1] - a[1]);
      const totalInc = incEntries.reduce((acc, curr) => acc + curr[1], 0);
      const totalExp = expEntries.reduce((acc, curr) => acc + curr[1], 0);
      const netResult = totalInc - totalExp;

      const resultClass = netResult >= 0 ? 'net-positive' : 'net-negative';
      const resultSign = netResult > 0 ? '+' : '';

      contentHtml += `
        <div class="year-block">
          <div class="year-header">
            <h2>Geschäftsjahr ${year}</h2>
            <div class="net-result ${resultClass}">Ergebnis: ${resultSign}${formatAmount(netResult)} €</div>
          </div>
          <div class="grid">
            <div class="col">
              <div class="box">
                <h3 class="text-emerald"><span>Einnahmen</span> <span>${formatAmount(totalInc)} €</span></h3>
                <table>
                  <tbody>
                    ${incEntries.length === 0 ? '<tr><td class="empty">Keine Einnahmen gebucht</td></tr>' : 
                      incEntries.map(([cat, amt]) => `
                        <tr>
                          <td class="cat-name">${escapeHtml(cat)}</td>
                          <td class="amount">${formatAmount(amt)}</td>
                        </tr>
                      `).join('')
                    }
                  </tbody>
                </table>
              </div>
            </div>
            <div class="col">
              <div class="box">
                <h3 class="text-rose"><span>Ausgaben</span> <span>${formatAmount(totalExp)} €</span></h3>
                <table>
                  <tbody>
                    ${expEntries.length === 0 ? '<tr><td class="empty">Keine Ausgaben gebucht</td></tr>' : 
                      expEntries.map(([cat, amt]) => `
                        <tr>
                          <td class="cat-name">${escapeHtml(cat)}</td>
                          <td class="amount">${formatAmount(amt)}</td>
                        </tr>
                      `).join('')
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      `;
    });

    contentHtml += `
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(contentHtml);
    printWindow.document.close();
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
          <p className="text-sm text-gray-500">Die aktuelle Ansicht kann als einseitige A4-PDF exportiert oder direkt gedruckt werden.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={isExportingPdf || isPrinting}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
          >
            {isExportingPdf ? <FaSpinner className="animate-spin" /> : <FaFilePdf />}
            <span>{isExportingPdf ? 'PDF wird erstellt...' : 'A4 PDF herunterladen'}</span>
          </button>
          <button
            type="button"
            onClick={handlePrintDashboard}
            disabled={isExportingPdf || isPrinting}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isPrinting ? <FaSpinner className="animate-spin" /> : <FaPrint />}
            <span>{isPrinting ? 'Druckansicht wird geöffnet...' : 'Drucken'}</span>
          </button>
        </div>
      </div>

      <div ref={dashboardRef} className="mx-auto max-w-4xl space-y-4 rounded-xl bg-gray-50 p-4 sm:p-5">
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

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="mb-6 border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
              <FaLandmark className="text-blue-600" />
              Jahresübersicht
            </h3>
            <p className="mt-1 text-sm text-slate-500 max-w-2xl">
              Detaillierte Entwicklung von Einnahmen, Ausgaben und dem Gesamtsaldo über die Jahre.
              Darlehen sowie Sammelglas- und Spendenbox-Einnahmen sind in der Spalte <span className="font-semibold text-slate-700">„Sonstiges“</span> enthalten.
            </p>
          </div>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="shrink-0 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 border border-blue-200 shadow-sm"
          >
            {showDetails ? 'Details ausblenden' : 'Bilanz-Details einblenden'}
          </button>
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
                      <td className="border-r border-slate-100 px-4 py-3 font-bold text-slate-800">{item.year}</td>
                      <td className="border-r border-slate-100 px-4 py-3 text-right text-slate-600">{formatAmount(item.spende)}</td>
                      <td className="border-r border-slate-100 px-4 py-3 text-right text-slate-600">{formatAmount(item.mitgliederbeitrag)}</td>
                      <td className={`border-r border-slate-100 px-4 py-3 text-right ${item.sonstiges >= 0 ? 'text-slate-600' : 'text-rose-600'}`}>
                        {formatAmount(item.sonstiges)}
                      </td>
                      <td className="border-r border-slate-100 px-4 py-3 text-right font-medium text-rose-700">{formatAmount(item.ausgaben)}</td>
                      <td className={`border-r border-slate-100 px-4 py-3 text-right font-bold ${item.total >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {item.total > 0 && '+'}{formatAmount(item.total)}
                      </td>
                      <td className={`px-4 py-3 text-right font-extrabold ${item.closingBalance >= 0 ? 'text-blue-700' : 'text-rose-700'}`}>
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

        {/* DETAILS SECTION */}
        {showDetails && (
          <div className="mt-8 pt-6 border-t border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-6 gap-4">
              <div>
                <h4 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                  Bilanz-Details nach Kategorien
                </h4>
                <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-800 font-bold border border-slate-200 shadow-sm text-sm">
                  <FaWallet className="text-slate-500" />
                  Aktueller Gesamtsaldo: <span className={stats.totalBalance >= 0 ? 'text-emerald-700' : 'text-rose-700'}>{formatAmount(stats.totalBalance)} €</span>
                </div>
              </div>
              <button
                onClick={handlePrintDetails}
                className="shrink-0 inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 shadow-sm"
              >
                <FaFilePdf />
                Als PDF exportieren (Drucken)
              </button>
            </div>
            
            <div className="space-y-6">
              {Object.keys(detailedStats).sort((a,b) => b.localeCompare(a)).map(year => {
                const yearData = detailedStats[year];
                const incEntries = Object.entries(yearData.incomes).sort((a,b) => b[1] - a[1]);
                const expEntries = Object.entries(yearData.expenses).sort((a,b) => b[1] - a[1]);
                const totalInc = incEntries.reduce((acc, curr) => acc + curr[1], 0);
                const totalExp = expEntries.reduce((acc, curr) => acc + curr[1], 0);
                const netResult = totalInc - totalExp;

                return (
                  <div key={year} className="bg-slate-50/50 rounded-xl p-5 border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-4 border-b border-slate-200 pb-2">
                      <h5 className="text-xl font-black text-slate-700">Geschäftsjahr {year}</h5>
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${netResult >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                        Ergebnis: {netResult > 0 && '+'}{formatAmount(netResult)} €
                      </span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Einnahmen */}
                      <div className="bg-white rounded-lg p-4 border border-emerald-100 shadow-sm">
                        <h6 className="font-bold text-emerald-700 mb-3 flex justify-between border-b border-emerald-100 pb-2">
                          <span>Einnahmen</span>
                          <span>{formatAmount(totalInc)} €</span>
                        </h6>
                        <ul className="space-y-2">
                          {incEntries.length === 0 ? <li className="text-sm text-slate-500 italic">Keine Einnahmen gebucht</li> : 
                            incEntries.map(([cat, amt]) => (
                              <li key={cat} className="flex justify-between text-sm items-center">
                                <span className="text-slate-600 font-medium">{cat}</span>
                                <span className="font-semibold text-slate-900">{formatAmount(amt)}</span>
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
                        <ul className="space-y-2">
                          {expEntries.length === 0 ? <li className="text-sm text-slate-500 italic">Keine Ausgaben gebucht</li> : 
                            expEntries.map(([cat, amt]) => (
                              <li key={cat} className="flex justify-between text-sm items-center">
                                <span className="text-slate-600 font-medium">{cat}</span>
                                <span className="font-semibold text-slate-900">{formatAmount(amt)}</span>
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
        )}
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

    <div className="bg-white rounded-lg shadow p-6" data-html2canvas-ignore="true">
      <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Letzte Transaktionen</h3>
      <div className="space-y-3">
        {recentTransactions.length === 0 ? (
          <p className="text-gray-500 text-sm">Keine Transaktionen gefunden.</p>
        ) : (
          recentTransactions.map((trx) => (
            <div key={trx.id} className="flex flex-col md:flex-row md:justify-between md:items-center text-sm border-b last:border-0 pb-2 last:pb-0 gap-1">
              <div className="flex-1">
                <div className="font-medium text-gray-800">{trx.accounting_categories?.name || 'Unbekannt'}</div>
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
