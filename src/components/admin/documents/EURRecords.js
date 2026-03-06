import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import { FaSpinner } from 'react-icons/fa';

export default function EURRecords() {
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
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
        <select
          value={filterYear}
          onChange={(e) => setFilterYear(parseInt(e.target.value))}
          className="border border-gray-300 rounded px-3 py-2"
        >
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
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
