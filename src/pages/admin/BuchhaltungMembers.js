import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { FaPrint, FaSearch, FaEye, FaTimes } from 'react-icons/fa';

export default function BuchhaltungMembers() {
  const [members, setMembers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);

  // Sadece 2025 ve 2026 sütunları gösterilecek
  const trackedYears = [2025, 2026];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    // 1. Üyeleri Çek
    const { data: memberData, error: memberError } = await supabase
      .from('accounting_contacts')
      .select('*')
      .eq('type', 'member');

    if (memberError) console.error('Üye hatası:', memberError);

    // 2. Gelirleri Çek
    const { data: trxData, error: trxError } = await supabase
      .from('accounting_transactions')
      .select('id, amount, date, contact_id, description, accounting_categories(name)')
      .eq('type', 'income');

    if (trxError) console.error('İşlem hatası:', trxError);

    setMembers(memberData || []);
    setTransactions(trxData || []);
    setLoading(false);
  };

  // --- ÜYELİK BAŞLANGIÇ TARİHİNİ BUL (DÜZELTİLDİ) ---
  const getFirstPaymentDate = (memberId) => {
    // Sadece bu üyeye ait işlemleri al
    const memberTrxs = transactions.filter(t => t.contact_id === memberId);
    
    // Sadece "Beitrag" veya "Mitglied" içeren ödemeleri filtrele (Bağışları vs karıştırma)
    const relevantTrxs = memberTrxs.filter(t => {
       const catName = t.accounting_categories?.name?.toLowerCase() || '';
       const desc = t.description?.toLowerCase() || '';
       return catName.includes('mitglied') || catName.includes('beitrag') || desc.includes('beitrag');
    });

    if (relevantTrxs.length === 0) return null;

    // Tarihe göre ESKİDEN YENİYE sırala
    const sortedTrxs = relevantTrxs.sort((a, b) => new Date(a.date) - new Date(b.date));

    // En eski tarihi döndür
    return new Date(sortedTrxs[0].date);
  };

  // --- YILLIK ÖDEME HESAPLAMA (Yıl Kaymasını Önleyen Mantık) ---
  const getPaymentForYear = (memberId, targetYear) => {
    if (!transactions || transactions.length === 0) return 0;
    
    return transactions
      .filter(t => t.contact_id === memberId)
      // Sadece Aidat/Üyelik işlemlerini al
      .filter(t => {
        const catName = t.accounting_categories?.name?.toLowerCase() || '';
        const desc = t.description?.toLowerCase() || '';
        return catName.includes('mitglied') || catName.includes('beitrag') || desc.includes('beitrag');
      })
      // Yıl Kontrolü: Açıklamada Yıl Yazıyorsa Tarihi Ez!
      .filter(t => {
        const trxDateYear = new Date(t.date).getFullYear();
        const desc = t.description || '';
        
        // Açıklamada "202x" gibi bir yıl geçiyor mu?
        const yearMatch = desc.match(/202[0-9]/);
        
        let effectiveYear = trxDateYear; // Normalde işlem yılını baz al

        if (yearMatch) {
          // Açıklamada yıl varsa (Örn: "Beitrag 2026"), işlem tarihi ne olursa olsun o yılı kullan
          effectiveYear = parseInt(yearMatch[0]);
        }

        return effectiveYear === targetYear;
      })
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  };

  // --- LİSTELEME VE SIRALAMA ---
  const processedMembers = members.map(member => {
    const firstPayment = getFirstPaymentDate(member.id);
    // Veritabanında elle girilmiş tarih varsa onu kullan, yoksa bulduğumuz ilk ödeme tarihini kullan
    const displayDate = member.member_since ? new Date(member.member_since) : firstPayment;
    return { ...member, displayDate };
  }).sort((a, b) => {
    // Tarihe göre sırala (Eskiler üste)
    if (!a.displayDate) return 1;
    if (!b.displayDate) return -1;
    return a.displayDate - b.displayDate;
  });

  const filteredMembers = processedMembers.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- YAZDIRMA (A4) ---
  const printMemberList = () => {
    const printWindow = window.open('', '_blank', 'width=1100,height=800');
    if (!printWindow) return;

    const dateStr = new Date().toLocaleDateString('de-DE');

    const htmlContent = `
      <html>
        <head>
          <title>Mitgliederliste</title>
          <style>
            @page { size: A4; margin: 15mm; }
            body { font-family: Arial, sans-serif; font-size: 11pt; color: #000; }
            h1 { text-align: center; font-size: 16pt; margin-bottom: 5px; }
            p { text-align: center; font-size: 10pt; color: #555; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            thead { display: table-header-group; }
            tr { page-break-inside: avoid; }
            th, td { border: 1px solid #000; padding: 6px 8px; text-align: left; vertical-align: middle; font-size: 10pt; }
            th { background-color: #f0f0f0; font-weight: bold; text-align: center; }
            .amount-cell { text-align: center; }
            .paid { font-weight: bold; color: #000; }
            .unpaid { color: #ccc; }
            .index-col { width: 40px; text-align: center; }
          </style>
        </head>
        <body>
          <h1>Mitgliederliste & Beitragsübersicht</h1>
          <p>Bürgertreff Wissen e.V. - Stand: ${dateStr}</p>
          <table>
            <thead>
              <tr>
                <th class="index-col">Nr.</th>
                <th>Name / Vorname</th>
                <th style="text-align:center;">Mitglied seit</th>
                ${trackedYears.map(y => `<th style="width: 80px;">Beitrag ${y}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${filteredMembers.map((m, index) => {
                const dateText = m.displayDate ? m.displayDate.toLocaleDateString('de-DE') : '-';
                const paymentCells = trackedYears.map(y => {
                  const amount = getPaymentForYear(m.id, y);
                  return `<td class="amount-cell ${amount > 0 ? 'paid' : 'unpaid'}">${amount > 0 ? amount.toFixed(0) + ' €' : '-'}</td>`;
                }).join('');
                return `
                  <tr>
                    <td class="index-col">${index + 1}</td>
                    <td><strong>${m.name}</strong></td>
                    <td style="text-align:center;">${dateText}</td>
                    ${paymentCells}
                  </tr>`;
              }).join('')}
            </tbody>
          </table>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Üst Bar */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Mitgliederverwaltung</h2>
          <p className="text-sm text-gray-500">Sortiert nach Eintrittsdatum</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <input type="text" placeholder="Suchen..." className="w-full pl-10 pr-4 py-2 border rounded-lg" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
          </div>
          <button onClick={printMemberList} className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-black flex items-center gap-2">
            <FaPrint /> <span className="hidden md:inline">Liste Drucken</span>
          </button>
        </div>
      </div>

      {/* Tablo */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 border">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-12">Nr.</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Mitglied Seit</th>
              {trackedYears.map(year => (
                <th key={year} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">{year}</th>
              ))}
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Details</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={4 + trackedYears.length} className="text-center py-4">Lade Daten...</td></tr>
            ) : filteredMembers.map((member, index) => (
              <tr key={member.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                <td className="px-4 py-3 text-sm font-bold text-gray-900">{member.name}</td>
                <td className="px-4 py-3 text-sm text-center text-gray-600">
                  {/* Tarih varsa göster, yoksa tire */}
                  {member.displayDate ? member.displayDate.toLocaleDateString('de-DE') : '-'}
                </td>
                {trackedYears.map(year => {
                  const amount = getPaymentForYear(member.id, year);
                  return (
                    <td key={year} className="px-4 py-3 text-center text-sm">
                      {amount > 0 ? 
                        <span className="text-green-700 font-bold bg-green-50 px-2 py-1 rounded-full border border-green-200">{amount.toFixed(0)} €</span> 
                        : <span className="text-gray-300">-</span>}
                    </td>
                  );
                })}
                <td className="px-4 py-3 text-right">
                  <button onClick={() => setSelectedMember(member)} className="text-blue-600 hover:text-blue-900 p-2 rounded-full hover:bg-blue-50">
                    <FaEye />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 text-xs text-gray-500 italic">
        * "Mitglied seit" wird aus dem ersten gefundenen Beitrag berechnet, falls kein Datum im Kontakt hinterlegt ist.
      </div>

      {/* DETAY MODALI */}
      {selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto relative">
            <button onClick={() => setSelectedMember(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><FaTimes size={20} /></button>
            <div className="p-6">
              <h3 className="text-xl font-bold mb-1">{selectedMember.name}</h3>
              <p className="text-sm text-gray-500 mb-6">Mitgliedsdetails</p>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <h4 className="font-bold text-sm text-gray-700 mb-2 border-b pb-1">Kontaktdaten</h4>
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-500">Email:</span><span className="font-medium">{selectedMember.email || '-'}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Telefon:</span><span className="font-medium">{selectedMember.phone || '-'}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Adresse:</span><span className="font-medium text-right">{selectedMember.address || '-'}</span></div>
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-gray-700 mb-2">Zahlungshistorie (Alle)</h4>
                  <div className="border rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr><th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Datum</th><th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Beschreibung</th><th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Betrag</th></tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {transactions.filter(t => t.contact_id === selectedMember.id).sort((a,b) => new Date(b.date) - new Date(a.date)).map(t => (
                            <tr key={t.id}><td className="px-3 py-2 text-xs">{new Date(t.date).toLocaleDateString('de-DE')}</td><td className="px-3 py-2 text-xs text-gray-500 truncate max-w-[150px]">{t.description || t.accounting_categories?.name}</td><td className="px-3 py-2 text-xs text-right font-medium text-green-600">+{parseFloat(t.amount).toFixed(2)} €</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <div className="mt-6 text-right"><button onClick={() => setSelectedMember(null)} className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 text-sm">Schließen</button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}