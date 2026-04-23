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
    
    const currentYear = new Date().getFullYear().toString(); // "2026"
    const accMap = {}; // Hesap bazlı toplamlar için

    allTrx.forEach(t => {
      const amount = toFiniteNumber(t.amount);
      const isIncome = t.type === 'income';
      const dateValue = t.date || '';
      const isCurrentYear = dateValue.startsWith(currentYear);
      const trxYear = /^\d{4}/.test(dateValue) ? dateValue.slice(0, 4) : 'Ohne Datum';

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
          <h3 className="text-lg font-bold text-gray-800">Buchhaltung – Übersicht</h3>
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

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="border-b pb-2 text-lg font-bold text-gray-800">Jahresübersicht: Einnahmen, Ausgaben und Saldoentwicklung</h3>
        <p className="mb-4 mt-2 text-xs text-gray-500">Darlehen sowie Sammelglas- und Spendenbox-Einnahmen sind in der Spalte „Sonstiges“ enthalten.</p>
        {yearlyContributionSummary.length === 0 ? (
          <p className="text-gray-500 text-sm">Keine Buchungsdaten für die Jahresübersicht gefunden.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm tabular-nums">
              <thead>
                <tr className="border-b text-left text-gray-600">
                  <th className="py-2 pr-4 font-semibold">Jahr</th>
                  <th className="py-2 pr-4 text-right font-semibold">Spende</th>
                  <th className="py-2 pr-4 text-right font-semibold">Mitgliederbeitrag</th>
                  <th className="py-2 pr-4 text-right font-semibold">Sonstiges</th>
                  <th className="py-2 pr-4 text-right font-semibold">Ausgaben</th>
                  <th className="py-2 pr-4 text-right font-semibold">Jahresergebnis</th>
                  <th className="py-2 text-right font-semibold">Kontostand Ende Jahr</th>
                </tr>
              </thead>
              <tbody>
                {yearlyContributionSummary.map((item) => (
                  <tr key={item.year} className="border-b last:border-b-0">
                    <td className="py-2 pr-4 font-medium text-gray-800">{item.year}</td>
                    <td className="whitespace-nowrap py-2 pr-4 text-right text-gray-700">{formatAmount(item.spende)}</td>
                    <td className="whitespace-nowrap py-2 pr-4 text-right text-gray-700">{formatAmount(item.mitgliederbeitrag)}</td>
                    <td className={`whitespace-nowrap py-2 pr-4 text-right ${item.sonstiges >= 0 ? 'text-gray-700' : 'text-red-600'}`}>{formatAmount(item.sonstiges)}</td>
                    <td className="whitespace-nowrap py-2 pr-4 text-right text-gray-700">{formatAmount(item.ausgaben)}</td>
                    <td className={`whitespace-nowrap py-2 pr-4 text-right font-semibold ${item.total >= 0 ? 'text-gray-900' : 'text-red-600'}`}>{formatAmount(item.total)}</td>
                    <td className={`whitespace-nowrap py-2 text-right font-semibold ${item.closingBalance >= 0 ? 'text-gray-900' : 'text-red-600'}`}>{formatAmount(item.closingBalance)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-300 bg-gray-50">
                  <td className="py-2 pr-4 font-bold text-gray-900">Gesamt / aktuell</td>
                  <td className="whitespace-nowrap py-2 pr-4 text-right font-bold text-gray-900">{formatAmount(summaryTotals.spende)}</td>
                  <td className="whitespace-nowrap py-2 pr-4 text-right font-bold text-gray-900">{formatAmount(summaryTotals.mitgliederbeitrag)}</td>
                  <td className={`whitespace-nowrap py-2 pr-4 text-right font-bold ${summaryTotals.sonstiges >= 0 ? 'text-gray-900' : 'text-red-600'}`}>{formatAmount(summaryTotals.sonstiges)}</td>
                  <td className="whitespace-nowrap py-2 pr-4 text-right font-bold text-gray-900">{formatAmount(summaryTotals.ausgaben)}</td>
                  <td className={`whitespace-nowrap py-2 pr-4 text-right font-bold ${stats.totalBalance >= 0 ? 'text-gray-900' : 'text-red-600'}`}>{formatAmount(stats.totalBalance)}</td>
                  <td className={`whitespace-nowrap py-2 text-right font-bold ${stats.totalBalance >= 0 ? 'text-gray-900' : 'text-red-600'}`}>{formatAmount(stats.totalBalance)}</td>
                </tr>
              </tfoot>
            </table>
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
