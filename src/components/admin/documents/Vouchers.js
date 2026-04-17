import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import { FaSpinner, FaPaperclip, FaExternalLinkAlt } from 'react-icons/fa';

export default function Vouchers() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [years, setYears] = useState([]);

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
        .select('*, accounting_categories(name), accounting_accounts(name), accounting_contacts(name)')
        .gte('date', `${filterYear}-01-01`)
        .lte('date', `${filterYear}-12-31`)
        .order('date', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
    setLoading(false);
  };

  const openDocument = async (path) => {
    if (!path) return;
    const { data, error } = await supabase.storage.from('receipts').createSignedUrl(path, 60);
    if (error) { alert(error.message); return; }
    window.open(data.signedUrl, '_blank');
  };

  if (loading) {
    return <div className="flex justify-center items-center p-8"><FaSpinner className="animate-spin text-2xl" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-gray-800">Buchungsbelege</h3>
          <p className="text-sm text-gray-600">Rechnungen, Quittungen und Bankbelege</p>
        </div>
        <select
          value={filterYear}
          onChange={(e) => setFilterYear(parseInt(e.target.value))}
          className="border border-gray-300 rounded px-3 py-2"
        >
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-200">
        {transactions.length === 0 ? (
          <p className="text-gray-500 text-center py-12">Keine Transaktionen gefunden.</p>
        ) : (
          transactions.map(trx => (
            <div key={trx.id} className="p-4 hover:bg-gray-50">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-medium text-gray-600">
                      {new Date(trx.date).toLocaleDateString('de-DE')}
                    </span>
                    {trx.receipt_no && (
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">#{trx.receipt_no}</span>
                    )}
                    <span className={`text-sm font-bold ${trx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {trx.type === 'income' ? '+' : '-'} {parseFloat(trx.amount).toFixed(2)} €
                    </span>
                  </div>
                  <p className="text-sm text-gray-800 font-medium">
                    {trx.accounting_categories?.name || 'Sonstige'}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">{trx.description}</p>
                  {trx.accounting_contacts && (
                    <p className="text-xs text-gray-500 mt-1">Kontakt: {trx.accounting_contacts.name}</p>
                  )}
                </div>
                {trx.document_url && (
                  <button
                    onClick={() => openDocument(trx.document_url)}
                    className="ml-4 flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
                  >
                    <FaPaperclip /> <FaExternalLinkAlt className="text-xs" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
