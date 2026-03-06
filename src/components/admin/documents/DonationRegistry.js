import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import { FaSpinner, FaChartBar } from 'react-icons/fa';

export default function DonationRegistry() {
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [years, setYears] = useState([]);

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
    fetchSummary();
  }, [filterYear]);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('accounting_transactions')
        .select('*, accounting_categories(name), accounting_contacts(id), accounting_accounts(name)')
        .eq('type', 'income')
        .gte('date', `${filterYear}-01-01`)
        .lte('date', `${filterYear}-12-31`);

      if (error) throw error;

      // Filter only donations
      const donations = (data || []).filter(trx => {
        const catName = normalizeCategoryName(trx.accounting_categories?.name || '');
        return catName.includes('spende');
      });

      let totalDonations = 0;
      let cashDonations = 0;
      let transferDonations = 0;
      const uniqueDonors = new Set();
      const amounts = [];

      donations.forEach(don => {
        const amount = parseFloat(don.amount) || 0;
        totalDonations += amount;
        amounts.push(amount);
        
        if (don.accounting_contacts?.id) {
          uniqueDonors.add(don.accounting_contacts.id);
        }

        // Determine payment method from account name
        const accountName = (don.accounting_accounts?.name || '').toLowerCase();
        if (accountName.includes('bargeld')) {
          cashDonations += amount;
        } else {
          transferDonations += amount;
        }
      });

      amounts.sort((a, b) => b - a);

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
          <h3 className="text-xl font-bold text-gray-800">Spendenverwaltungsblatt</h3>
          <p className="text-sm text-gray-600">Jahres übersicht aller Spenden</p>
        </div>
        <select
          value={filterYear}
          onChange={(e) => setFilterYear(parseInt(e.target.value))}
          className="border border-gray-300 rounded px-3 py-2"
        >
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-pink-50 to-pink-100 border-2 border-pink-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <FaChartBar className="text-2xl text-pink-600" />
            <p className="text-sm font-medium text-gray-600">Gesamtspenden</p>
          </div>
          <p className="text-3xl font-bold text-pink-700">{summary.totalDonations?.toFixed(2)} €</p>
          <p className="text-xs text-gray-600 mt-2">{summary.totalCount} Transaktionen</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-lg p-6">
          <p className="text-sm font-medium text-gray-600 mb-2">Anzahl Spender</p>
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

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-lg p-6">
          <p className="text-sm font-medium text-gray-600 mb-2">Barspenden (geschätzt)</p>
          <p className="text-3xl font-bold text-purple-700">{summary.cashDonations?.toFixed(2)} €</p>
        </div>

        <div className="bg-gradient-to-br from-teal-50 to-teal-100 border-2 border-teal-200 rounded-lg p-6">
          <p className="text-sm font-medium text-gray-600 mb-2">Überweisungen (geschätzt)</p>
          <p className="text-3xl font-bold text-teal-700">{summary.transferDonations?.toFixed(2)} €</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Hinweis:</strong> Diese Statistiken werden automatisch aus den Transaktionen mit der Kategorie "Spende" berechnet. 
          Bar-/Überweisungsaufteilung ist eine Schätzung und sollte manuell überprüft werden.
        </p>
      </div>
    </div>
  );
}
