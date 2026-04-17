import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import { FaSpinner, FaPrint } from 'react-icons/fa';

export default function EURRecords() {
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [years, setYears] = useState([]);

  useEffect(() => {
    const currentYear = new Date().getFullYear();
    setYears([currentYear - 2, currentYear - 1, currentYear, currentYear + 1]);
    fetchSummary();
  }, [filterYear]);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('accounting_transactions')
        .select('*, accounting_categories(name)')
        .gte('date', `${filterYear}-01-01`)
        .lte('date', `${filterYear}-12-31`);

      if (error) throw error;

      let totalIncome = 0;
      let totalExpense = 0;
      const categoryBreakdown = {};

      (data || []).forEach(trx => {
        const amount = parseFloat(trx.amount) || 0;
        const catName = trx.accounting_categories?.name || 'Sonstige';
        
        if (trx.type === 'income') {
          totalIncome += amount;
          if (!categoryBreakdown[catName]) categoryBreakdown[catName] = { income: 0, expense: 0 };
          categoryBreakdown[catName].income += amount;
        } else {
          totalExpense += amount;
          if (!categoryBreakdown[catName]) categoryBreakdown[catName] = { income: 0, expense: 0 };
          categoryBreakdown[catName].expense += amount;
        }
      });

      setSummary({
        totalIncome,
        totalExpense,
        netIncome: totalIncome - totalExpense,
        categoryBreakdown
      });
    } catch (error) {
      console.error('Error fetching EÜR data:', error);
    }
    setLoading(false);
  };

  const formatAmount = (value = 0) =>
    Number(value || 0).toLocaleString('de-DE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

  const escapeHtml = (value = '') =>
    String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const handlePrintReport = () => {
    setIsPrinting(true);

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      alert('Bitte erlauben Sie Pop-ups, um die Druckansicht zu öffnen.');
      setIsPrinting(false);
      return;
    }

    const categoryRows = Object.entries(summary.categoryBreakdown || {})
      .sort(([a], [b]) => a.localeCompare(b, 'de'))
      .map(([category, values]) => {
        const saldo = (values.income || 0) - (values.expense || 0);
        return `
          <tr>
            <td>${escapeHtml(category)}</td>
            <td class="num income">${values.income > 0 ? `+ ${formatAmount(values.income)} EUR` : '-'}</td>
            <td class="num expense">${values.expense > 0 ? `- ${formatAmount(values.expense)} EUR` : '-'}</td>
            <td class="num saldo ${saldo >= 0 ? 'plus' : 'minus'}">${saldo >= 0 ? '+' : ''}${formatAmount(saldo)} EUR</td>
          </tr>
        `;
      })
      .join('');

    const today = new Date().toLocaleDateString('de-DE');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="de">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>EÜR ${filterYear}</title>
        <style>
          @page { size: A4 portrait; margin: 12mm; }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            font-family: Arial, sans-serif;
            color: #111827;
            font-size: 11px;
            line-height: 1.35;
          }
          .report {
            width: 100%;
            max-width: 186mm;
            margin: 0 auto;
          }
          .header {
            display: flex;
            justify-content: space-between;
            gap: 8mm;
            margin-bottom: 6mm;
            border-bottom: 1px solid #d1d5db;
            padding-bottom: 3mm;
          }
          .title { font-size: 16px; font-weight: 700; margin: 0; }
          .sub { margin: 1mm 0 0; color: #4b5563; }
          .cards {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 3mm;
            margin-bottom: 5mm;
          }
          .card {
            border: 1px solid #d1d5db;
            border-radius: 3mm;
            padding: 3mm;
          }
          .card .label { color: #4b5563; font-size: 10px; margin-bottom: 1mm; }
          .card .value { font-size: 14px; font-weight: 700; }
          .income { color: #047857; }
          .expense { color: #b91c1c; }
          .plus { color: #1d4ed8; }
          .minus { color: #c2410c; }
          table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
          }
          th, td {
            border: 1px solid #e5e7eb;
            padding: 2.2mm;
            word-wrap: break-word;
          }
          th {
            background: #f9fafb;
            text-align: left;
            font-weight: 700;
            font-size: 10px;
          }
          .num { text-align: right; white-space: nowrap; }
          .note {
            margin-top: 4mm;
            padding: 2.8mm;
            border: 1px solid #fcd34d;
            background: #fffbeb;
            color: #78350f;
            border-radius: 3mm;
          }
          .muted { color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="report">
          <div class="header">
            <div>
              <h1 class="title">Einnahmen-Überschuss-Rechnung (EÜR)</h1>
              <p class="sub">Berichtsjahr: ${filterYear}</p>
            </div>
            <div class="muted">Erstellt am: ${today}</div>
          </div>

          <div class="cards">
            <div class="card">
              <div class="label">Gesamteinnahmen</div>
              <div class="value income">+ ${formatAmount(summary.totalIncome)} EUR</div>
            </div>
            <div class="card">
              <div class="label">Gesamtausgaben</div>
              <div class="value expense">- ${formatAmount(summary.totalExpense)} EUR</div>
            </div>
            <div class="card">
              <div class="label">Überschuss/Verlust</div>
              <div class="value ${summary.netIncome >= 0 ? 'plus' : 'minus'}">${summary.netIncome >= 0 ? '+' : ''}${formatAmount(summary.netIncome)} EUR</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 40%;">Kategorie</th>
                <th style="width: 20%;" class="num">Einnahmen</th>
                <th style="width: 20%;" class="num">Ausgaben</th>
                <th style="width: 20%;" class="num">Saldo</th>
              </tr>
            </thead>
            <tbody>
              ${categoryRows || '<tr><td colspan="4" class="muted">Keine Daten vorhanden.</td></tr>'}
            </tbody>
          </table>

          <div class="note">
            <strong>Hinweis:</strong> Die EÜR zeigt ausschließlich Einnahmen und Ausgaben des ausgewählten Jahres.
          </div>
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      setIsPrinting(false);
    }, 250);
  };

  if (loading) {
    return <div className="flex justify-center items-center p-8"><FaSpinner className="animate-spin text-2xl" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-gray-800">Einnahmen-Überschuss-Rechnung (EÜR)</h3>
          <p className="text-sm text-gray-600">Automatisch aus Transaktionen generiert</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(parseInt(e.target.value))}
            className="border border-gray-300 rounded px-3 py-2"
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button
            onClick={handlePrintReport}
            disabled={isPrinting}
            className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300 flex items-center gap-2"
          >
            {isPrinting ? <FaSpinner className="animate-spin" /> : <FaPrint />}
            <span>{isPrinting ? 'Wird vorbereitet...' : 'A4-Druck'}</span>
          </button>
        </div>
      </div>

      {/* Gesamtübersicht */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
          <p className="text-sm font-medium text-gray-600 mb-1">Gesamteinnahmen</p>
          <p className="text-3xl font-bold text-green-700">+ {summary.totalIncome?.toFixed(2)} €</p>
        </div>
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
          <p className="text-sm font-medium text-gray-600 mb-1">Gesamtausgaben</p>
          <p className="text-3xl font-bold text-red-700">- {summary.totalExpense?.toFixed(2)} €</p>
        </div>
        <div className={`${summary.netIncome >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'} border-2 rounded-lg p-6`}>
          <p className="text-sm font-medium text-gray-600 mb-1">Überschuss/Verlust</p>
          <p className={`text-3xl font-bold ${summary.netIncome >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
            {summary.netIncome >= 0 ? '+' : ''} {summary.netIncome?.toFixed(2)} €
          </p>
        </div>
      </div>

      {/* Kategorienaufschlüsselung */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="font-bold text-lg text-gray-800 mb-4">Aufschlüsselung nach Kategorien</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kategorie</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Einnahmen</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ausgaben</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Saldo</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.entries(summary.categoryBreakdown || {}).map(([category, values]) => (
                <tr key={category} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{category}</td>
                  <td className="px-4 py-3 text-sm text-right text-green-600">
                    {values.income > 0 ? `+ ${values.income.toFixed(2)} €` : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-red-600">
                    {values.expense > 0 ? `- ${values.expense.toFixed(2)} €` : '-'}
                  </td>
                  <td className={`px-4 py-3 text-sm text-right font-medium ${(values.income - values.expense) >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                    {(values.income - values.expense).toFixed(2)} €
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
