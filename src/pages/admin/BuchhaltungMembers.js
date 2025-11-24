import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { FaUser, FaCheckCircle, FaTimesCircle, FaSearch, FaEye } from 'react-icons/fa';

export default function BuchhaltungMembers() {
  const [members, setMembers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState(null); // For detail modal

  // Yılları dinamik olarak belirleyelim (Örn: Geçen yıl, Bu yıl, Gelecek yıl)
  const currentYear = new Date().getFullYear();
  const yearsToShow = [currentYear - 1, currentYear, currentYear + 1];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    // 1. Üyeleri Çek
    const { data: memberData, error: memberError } = await supabase
      .from('accounting_contacts')
      .select('*')
      .eq('type', 'member') // Sadece üyeler
      .order('name');

    if (memberError) {
      console.error('Error fetching members:', memberError);
      setLoading(false);
      return;
    }

    // 2. Bu üyelere ait gelirleri çek (Aidat ödemeleri)
    // Not: Kategori isminde "Mitglied" geçenleri veya tüm gelirleri alıp filtreleyebiliriz.
    // Şimdilik tüm gelirleri alıp, contact_id'ye göre eşleştireceğiz.
    const { data: trxData, error: trxError } = await supabase
      .from('accounting_transactions')
      .select('id, date, amount, contact_id, description, accounting_categories(name)')
      .eq('type', 'income')
      .not('contact_id', 'is', null);

    if (trxError) {
      console.error('Error fetching transactions:', trxError);
    }

    setMembers(memberData || []);
    setTransactions(trxData || []);
    setLoading(false);
  };

  // Üye bazında ödeme verilerini hesapla
  const getMemberPaymentData = (memberId) => {
    const memberTrxs = transactions.filter(t => t.contact_id === memberId);
    
    // Son aidat tarihini bul
    let lastPaymentDate = null;
    let lastPaymentAmount = 0;
    let firstPaymentDate = null;

    // Tarihe göre sırala (en yeni en üstte)
    const sortedTrxs = [...memberTrxs].sort((a, b) => new Date(b.date) - new Date(a.date));

    // En son ödemeyi bul
    for (const t of sortedTrxs) {
      const catName = t.accounting_categories?.name?.toLowerCase() || '';
      const isMembershipFee = catName.includes('mitglied') || catName.includes('beitrag');
      
      if (isMembershipFee) {
        lastPaymentDate = t.date;
        lastPaymentAmount = t.amount;
        break; 
      }
    }

    // İlk ödemeyi bul (Üyelik başlangıcı tahmini için)
    for (let i = sortedTrxs.length - 1; i >= 0; i--) {
      const t = sortedTrxs[i];
      const catName = t.accounting_categories?.name?.toLowerCase() || '';
      const isMembershipFee = catName.includes('mitglied') || catName.includes('beitrag');
      
      if (isMembershipFee) {
        firstPaymentDate = t.date;
        break; 
      }
    }

    return { 
      lastPaymentDate, 
      lastPaymentAmount, 
      firstPaymentDate,
      totalPaid: memberTrxs.reduce((sum, t) => sum + parseFloat(t.amount), 0), 
      transactions: memberTrxs 
    };
  };

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.email && m.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-gray-800">Mitgliederliste & Beitragsstatus</h2>
          <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
            Gesamt: {members.length}
          </span>
        </div>
        <div className="relative w-64">
          <input
            type="text"
            placeholder="Mitglied suchen..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <FaSearch className="absolute left-3 top-3 text-gray-400" />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">Nr.</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kontakt</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Letzter Beitrag</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aktionen</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan="5" className="text-center py-4">Lade Daten...</td></tr>
            ) : filteredMembers.length === 0 ? (
              <tr><td colSpan="5" className="text-center py-4 text-gray-500">Keine Mitglieder gefunden.</td></tr>
            ) : (
              filteredMembers.map((member, index) => {
                const { lastPaymentDate, lastPaymentAmount, firstPaymentDate, transactions: memberTrxs } = getMemberPaymentData(member.id);
                
                // Üyelik tarihi: Veritabanındaki tarih VEYA ilk ödeme tarihi
                const memberSince = member.member_since || firstPaymentDate;

                return (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{member.name}</div>
                      <div className="text-xs text-gray-500">
                        Mitglied seit: {memberSince ? new Date(memberSince).toLocaleDateString('de-DE', { month: '2-digit', year: 'numeric' }) : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{member.email}</div>
                      <div className="text-xs text-gray-500">{member.phone}</div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {lastPaymentDate ? (
                        <div>
                          <div className="text-sm font-medium text-green-600">
                            {new Date(lastPaymentDate).toLocaleDateString('de-DE')}
                          </div>
                          <div className="text-xs text-gray-500">
                            {parseFloat(lastPaymentAmount).toFixed(2)} €
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => setSelectedMember({ ...member, transactions: memberTrxs })}
                        className="text-blue-600 hover:text-blue-900"
                        title="Details anzeigen"
                      >
                        <FaEye /> Details
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* DETAIL MODAL */}
      {selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4 border-b pb-2">
                <h3 className="text-lg font-bold">Zahlungshistorie: {selectedMember.name}</h3>
                <button onClick={() => setSelectedMember(null)} className="text-gray-500 hover:text-gray-700">
                  <FaTimesCircle size={24} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><strong>Adresse:</strong> {selectedMember.address || '-'}</div>
                    <div><strong>Email:</strong> {selectedMember.email || '-'}</div>
                    <div><strong>Telefon:</strong> {selectedMember.phone || '-'}</div>
                    <div><strong>Steuernummer:</strong> {selectedMember.tax_number || '-'}</div>
                  </div>
                </div>

                <h4 className="font-bold text-gray-700 mt-4">Alle Zahlungen</h4>
                <table className="min-w-full divide-y divide-gray-200 border">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Datum</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Kategorie</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Beschreibung</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Betrag</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedMember.transactions.length === 0 ? (
                      <tr><td colSpan="4" className="px-4 py-2 text-center text-sm text-gray-500">Keine Zahlungen gefunden.</td></tr>
                    ) : (
                      selectedMember.transactions.sort((a,b) => new Date(b.date) - new Date(a.date)).map(t => (
                        <tr key={t.id}>
                          <td className="px-4 py-2 text-sm text-gray-900">{new Date(t.date).toLocaleDateString('de-DE')}</td>
                          <td className="px-4 py-2 text-sm text-gray-600">{t.accounting_categories?.name}</td>
                          <td className="px-4 py-2 text-sm text-gray-500">{t.description}</td>
                          <td className="px-4 py-2 text-sm font-bold text-green-600 text-right">{parseFloat(t.amount).toFixed(2)} €</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedMember(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  Schließen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
