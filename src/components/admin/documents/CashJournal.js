import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import { FaSpinner } from 'react-icons/fa';

export default function CashJournal() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [years, setYears] = useState([]);
  const [dailySummary, setDailySummary] = useState([]);

  useEffect(() => {
    const currentYear = new Date().getFullYear();
    setYears([currentYear - 2, currentYear - 1, currentYear, currentYear + 1]);
    fetchTransactions();
  }, [filterYear]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('accounting_transactions')
        .select('*, accounting_categories(name), accounting_accounts(name)')
        .gte('date', `${filterYear}-01-01`)
        .lte('date', `${filterYear}-12-31`)
        .order('date', { ascending: false });

      if (error) throw error;

      // Group by date
      const grouped = {};
      (data || []).forEach(trx => {
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

      const summary = Object.values(grouped).sort((a, b) => new Date(b.date) - new Date(a.date));
      
      // Calculate running balance
      let runningBalance = 0;
      summary.forEach(day => {
        runningBalance += day.cashIn - day.cashOut;
        day.closingBalance = runningBalance;
      });

      setDailySummary(summary);
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
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
          <h3 className="text-xl font-bold text-gray-800">Kassenbuch (Kasa Defteri)</h3>
          <p className="text-sm text-gray-600">Automatisch aus Transaktionen generiert</p>
        </div>
        <select
          value={filterYear}
          onChange={(e) => setFilterYear(parseInt(e.target.value))}
          className="border border-gray-300 rounded px-3 py-2"
        >
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <div className="space-y-3">
        {dailySummary.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Keine Transaktionen gefunden.</p>
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
                    <span className="text-gray-700">{trx.accounting_categories?.name || 'Sonstige'}</span>
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
