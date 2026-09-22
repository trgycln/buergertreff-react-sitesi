import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import { FaSpinner, FaPrint, FaEye, FaTimes } from 'react-icons/fa';
import PrintableCashJournal, { printKassenbuchDirect } from './PrintableCashJournal';

export default function CashJournal({ readOnly }) {
  const [loading, setLoading] = useState(true);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [years, setYears] = useState([]);
  const [dailySummary, setDailySummary] = useState([]);
  const [flatTransactions, setFlatTransactions] = useState([]);
  const [openingBalance, setOpeningBalance] = useState(0);
  const [currentCashBalance, setCurrentCashBalance] = useState(0);
  const [orgName, setOrgName] = useState('Bürgertreff Wissen e.V.');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    const currentYear = new Date().getFullYear();
    setYears([currentYear - 2, currentYear - 1, currentYear, currentYear + 1]);
    fetchTransactions();
    fetchOrgSettings();
  }, [filterYear]);

  const fetchOrgSettings = async () => {
    try {
      const { data } = await supabase
        .from('site_settings')
        .select('key, value')
        .eq('key', 'org_name')
        .maybeSingle();
      if (data?.value) {
        setOrgName(data.value);
      }
    } catch (err) {
      console.error('Error fetching org settings:', err);
    }
  };

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const yearStart = `${filterYear}-01-01`;
      const yearEnd = `${filterYear}-12-31`;

      const { data, error } = await supabase
        .from('accounting_transactions')
        .select('id, date, type, amount, description, receipt_no, file_no, accounting_categories(name), accounting_accounts(name)')
        .lte('date', yearEnd)
        .order('date', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) throw error;

      const normalize = (value = '') =>
        value
          .toLowerCase()
          .replace(/ä/g, 'ae')
          .replace(/ö/g, 'oe')
          .replace(/ü/g, 'ue')
          .replace(/ß/g, 'ss')
          .trim();

      const isCashAccount = (accountName = '') => {
        const name = normalize(accountName);
        if (!name) return false;

        // Avoid false positives like "Sparkasse".
        if (name.includes('sparkasse')) return false;

        return (
          name.includes('bargeld') ||
          name.includes('bar kasse') ||
          name.includes('barkasse') ||
          name === 'bar' ||
          name === 'kasse' ||
          name.includes('kasse') ||
          name.includes('cash')
        );
      };

      const cashTransactions = (data || []).filter((trx) =>
        isCashAccount(trx.accounting_accounts?.name)
      );

      const opening = cashTransactions.reduce((sum, trx) => {
        if (trx.date >= yearStart) return sum;
        const amount = parseFloat(trx.amount) || 0;
        return sum + (trx.type === 'income' ? amount : -amount);
      }, 0);

      const yearTransactions = cashTransactions.filter(
        (trx) => trx.date >= yearStart && trx.date <= yearEnd
      );

      // Group by date for the on-screen card view
      const grouped = {};
      yearTransactions.forEach(trx => {
        const date = trx.date;
        if (!grouped[date]) {
          grouped[date] = { date, cashIn: 0, cashOut: 0, transactions: [] };
        }
        const amount = parseFloat(trx.amount) || 0;
        if (trx.type === 'income') {
          grouped[date].cashIn += amount;
        } else {
          grouped[date].cashOut += amount;
        }
        grouped[date].transactions.push(trx);
      });

      const summaryChronological = Object.values(grouped).sort((a, b) => new Date(a.date) - new Date(b.date));
      
      // Running cash balance starts with prior year carry-over.
      let runningBalance = opening;
      summaryChronological.forEach(day => {
        runningBalance += day.cashIn - day.cashOut;
        day.closingBalance = runningBalance;
      });

      const summaryForDisplay = [...summaryChronological].reverse();
      const latestBalance = summaryChronological.length > 0 ? summaryChronological[summaryChronological.length - 1].closingBalance : opening;

      setOpeningBalance(opening);
      setCurrentCashBalance(latestBalance);
      setDailySummary(summaryForDisplay);
      setFlatTransactions(yearTransactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setOpeningBalance(0);
      setCurrentCashBalance(0);
      setDailySummary([]);
      setFlatTransactions([]);
    }
    setLoading(false);
  };

  const handlePrint = () => {
    printKassenbuchDirect({
      transactions: flatTransactions,
      openingBalance,
      year: filterYear,
      orgName
    });
  };

  if (loading) {
    return <div className="flex justify-center items-center p-8"><FaSpinner className="animate-spin text-2xl text-blue-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div>
          <h3 className="text-xl font-bold text-gray-800">Kassenbuch (Kasa Defteri)</h3>
          <p className="text-sm text-gray-600">Alman GoBD standartlarında, sayfa sayfa (20 satır) ve çift imzalı resmi döküm</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(parseInt(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>

          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="flex items-center px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-sm font-semibold transition"
            title="Druckvorschau anzeigen"
          >
            <FaEye className="mr-2" />
            Druckvorschau (Önizleme)
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center px-4 py-2 bg-gray-900 hover:bg-black text-white rounded-lg text-sm font-semibold shadow transition"
            title="Kassenbuch drucken"
          >
            <FaPrint className="mr-2" />
            Drucken (Yazdır)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-700">Vortrag aus {filterYear - 1}</p>
          <p className="text-lg font-bold text-blue-800">{openingBalance.toFixed(2)} €</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
          <p className="text-xs text-emerald-700">Aktueller Barkassenstand ({filterYear})</p>
          <p className="text-lg font-bold text-emerald-800">{currentCashBalance.toFixed(2)} €</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <p className="text-xs text-gray-600">Hinweis</p>
          <p className="text-sm text-gray-700">Der Vortrag wird aus allen Barbewegungen bis 31.12.{filterYear - 1} berechnet.</p>
        </div>
      </div>

      <div className="space-y-3">
        {dailySummary.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
            <p className="text-gray-500 font-medium">Keine Bartransaktionen für das Jahr {filterYear} gefunden.</p>
            <p className="text-xs text-gray-400 mt-1">Sie können trotzdem die leere Kassenbuchseite mit Vorjahresübertrag drucken.</p>
          </div>
        ) : (
          dailySummary.map((day) => (
            <div key={day.date} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3 pb-3 border-b">
                <div>
                  <p className="text-xs text-gray-500">Datum</p>
                  <p className="font-bold">{new Date(day.date).toLocaleDateString('de-DE')}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Einnahmen</p>
                  <p className="text-green-600 font-bold">+ {day.cashIn.toFixed(2)} €</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Ausgaben</p>
                  <p className="text-red-600 font-bold">- {day.cashOut.toFixed(2)} €</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Tagesstand</p>
                  <p className={`font-bold ${day.closingBalance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                    {day.closingBalance.toFixed(2)} €
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                {day.transactions.map(trx => (
                  <div key={trx.id} className="text-sm flex justify-between items-center py-1 border-b border-gray-100 last:border-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs px-1.5 py-0.5 bg-gray-100 rounded text-gray-600 font-mono">
                        {trx.receipt_no || trx.file_no || `TRX-${trx.id.toString().slice(0, 6)}`}
                      </span>
                      <span className="text-gray-800 font-medium">{trx.accounting_categories?.name || 'Sonstige'}</span>
                      {trx.description && <span className="text-gray-500 text-xs">({trx.description})</span>}
                    </div>
                    <span className={trx.type === 'income' ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                      {trx.type === 'income' ? '+' : '-'} {parseFloat(trx.amount).toFixed(2)} €
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Druckvorschau Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full flex flex-col max-h-[92vh]">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Kassenbuch Druckvorschau ({filterYear})</h3>
                <p className="text-xs text-gray-500">A4 Druckformat mit 20 Zeilen pro Blatt, Überträgen und Unterschriften</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex items-center px-4 py-2 bg-gray-900 hover:bg-black text-white rounded-lg text-sm font-semibold shadow transition"
                >
                  <FaPrint className="mr-2" />
                  Jetzt Drucken
                </button>
                <button
                  type="button"
                  onClick={() => setShowPreview(false)}
                  className="p-2 text-gray-400 hover:text-gray-700 rounded-lg transition"
                >
                  <FaTimes className="text-lg" />
                </button>
              </div>
            </div>

            <div className="p-4 overflow-y-auto flex-grow bg-gray-200">
              <PrintableCashJournal
                transactions={flatTransactions}
                openingBalance={openingBalance}
                year={filterYear}
                orgName={orgName}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
