import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import { FaSpinner } from 'react-icons/fa';

export default function CashJournal() {
  const [loading, setLoading] = useState(true);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [years, setYears] = useState([]);
  const [dailySummary, setDailySummary] = useState([]);
  const [openingBalance, setOpeningBalance] = useState(0);
  const [currentCashBalance, setCurrentCashBalance] = useState(0);

  useEffect(() => {
    const currentYear = new Date().getFullYear();
    setYears([currentYear - 2, currentYear - 1, currentYear, currentYear + 1]);
    fetchTransactions();
  }, [filterYear]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const yearStart = `${filterYear}-01-01`;
      const yearEnd = `${filterYear}-12-31`;

      const { data, error } = await supabase
        .from('accounting_transactions')
        .select('id, date, type, amount, description, accounting_categories(name), accounting_accounts(name)')
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

      // Group by date
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
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setOpeningBalance(0);
      setCurrentCashBalance(0);
      setDailySummary([]);
    }
    setLoading(false);
  };

  if (loading) {
    return <div className="flex justify-center items-center p-8"><FaSpinner className="animate-spin text-2xl" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-gray-800">Kassenbuch</h3>
          <p className="text-sm text-gray-600">Nur Barbewegungen (Einnahmen/Ausgaben) mit automatischem Jahresvortrag</p>
        </div>
        <select
          value={filterYear}
          onChange={(e) => setFilterYear(parseInt(e.target.value))}
          className="border border-gray-300 rounded px-3 py-2"
        >
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
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
          <p className="text-gray-500 text-center py-8">Keine Bartransaktionen für dieses Jahr gefunden.</p>
        ) : (
          dailySummary.map((day, index) => (
            <div key={day.date} className="border border-gray-200 rounded-lg p-4">
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
                  <div key={trx.id} className="text-sm flex justify-between items-center py-1">
                    <span className="text-gray-700">{trx.accounting_categories?.name || 'Sonstige'}{trx.description ? ` - ${trx.description}` : ''}</span>
                    <span className={trx.type === 'income' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                      {trx.type === 'income' ? '+' : '-'} {parseFloat(trx.amount).toFixed(2)} €
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
