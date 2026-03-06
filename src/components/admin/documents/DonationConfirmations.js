import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import { FaSpinner, FaPaperclip, FaExternalLinkAlt, FaHandHoldingHeart } from 'react-icons/fa';

export default function DonationConfirmations() {
  const [donations, setDonations] = useState([]);
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
    fetchDonations();
  }, [filterYear]);

  const fetchDonations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('accounting_transactions')
        .select('*, accounting_categories(name), accounting_contacts(name, address)')
        .eq('type', 'income')
        .gte('date', `${filterYear}-01-01`)
        .lte('date', `${filterYear}-12-31`)
        .order('date', { ascending: false });

      if (error) throw error;

      // Filter only donation categories
      const filtered = (data || []).filter(trx => {
        const catName = normalizeCategoryName(trx.accounting_categories?.name || '');
        return catName.includes('spende');
      });

      setDonations(filtered);
    } catch (error) {
      console.error('Error fetching donations:', error);
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
          <h3 className="text-xl font-bold text-gray-800">Zuwendungsbestätigungen (Spendenb Bescheinigungen)</h3>
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

      <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-200">
        {donations.length === 0 ? (
          <p className="text-gray-500 text-center py-12">Keine Spenden gefunden.</p>
        ) : (
          donations.map(donation => (
            <div key={donation.id} className="p-4 hover:bg-gray-50">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <FaHandHoldingHeart className="text-pink-600" />
                    <span className="text-sm font-medium text-gray-600">
                      {new Date(donation.date).toLocaleDateString('de-DE')}
                    </span>
                    {donation.receipt_no && (
                      <span className="text-xs bg-pink-100 border border-pink-200 px-2 py-1 rounded">
                        #{donation.receipt_no}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-bold text-gray-800">
                        {donation.accounting_contacts?.name || 'Unbekannter Spender'}
                      </p>
                      {donation.accounting_contacts?.address && (
                        <p className="text-xs text-gray-600 mt-1">{donation.accounting_contacts.address}</p>
                      )}
                      {donation.description && (
                        <p className="text-xs text-gray-600 mt-1">{donation.description}</p>
                      )}
                    </div>
                    <div className="text-right md:text-left">
                      <p className="text-2xl font-bold text-green-600">
                        {parseFloat(donation.amount).toFixed(2)} €
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{donation.accounting_categories?.name}</p>
                    </div>
                  </div>
                </div>
                <div className="ml-4 flex flex-col gap-2">
                  {donation.document_url && (
                    <button
                      onClick={() => openDocument(donation.document_url)}
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
                      title="Beleg öffnen"
                    >
                      <FaPaperclip /> <FaExternalLinkAlt className="text-xs" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
