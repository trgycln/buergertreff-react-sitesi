import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { FaWallet, FaArrowUp, FaArrowDown, FaLandmark, FaMoneyBillWave } from 'react-icons/fa';

export default function BuchhaltungDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBalance: 0,
    totalIncome: 0,
    totalExpense: 0,
    monthIncome: 0,
    monthExpense: 0
  });
  const [accountBalances, setAccountBalances] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    
    // 1. Tüm İşlemleri Çek (Hesaplama için)
    // Not: Gerçek bir uygulamada bu hesaplamaları veritabanı tarafında (SQL View veya RPC) yapmak daha performanslıdır.
    // Ancak şimdilik basitlik adına React tarafında topluyoruz.
    const { data: allTrx, error } = await supabase
      .from('accounting_transactions')
      .select('amount, type, date, account_id, accounting_accounts(name)');

    if (error) {
      console.error('Error fetching transactions:', error);
      setLoading(false);
      return;
    }

    // 2. Son 5 İşlemi Çek (Liste için)
    const { data: recentTrx } = await supabase
      .from('accounting_transactions')
      .select(`
        *,
        accounting_categories (name),
        accounting_contacts (name)
      `)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(5);

    setRecentTransactions(recentTrx || []);

    // 3. İstatistikleri Hesapla
    let totalInc = 0;
    let totalExp = 0;
    let monthInc = 0;
    let monthExp = 0;
    
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const accMap = {}; // Hesap bazlı toplamlar için

    allTrx.forEach(t => {
      const amount = parseFloat(t.amount);
      const isIncome = t.type === 'income';
      const isCurrentMonth = t.date.startsWith(currentMonth);

      // Genel Toplamlar
      if (isIncome) totalInc += amount;
      else totalExp += amount;

      // Ay Toplamları
      if (isCurrentMonth) {
        if (isIncome) monthInc += amount;
        else monthExp += amount;
      }

      // Hesap Bakiyeleri
      if (t.account_id) {
        if (!accMap[t.account_id]) {
          accMap[t.account_id] = { 
            name: t.accounting_accounts?.name || 'Unbekannt', 
            balance: 0 
          };
        }
        if (isIncome) accMap[t.account_id].balance += amount;
        else accMap[t.account_id].balance -= amount;
      }
    });

    setStats({
      totalBalance: totalInc - totalExp,
      totalIncome: totalInc,
      totalExpense: totalExp,
      monthIncome: monthInc,
      monthExpense: monthExp
    });

    setAccountBalances(Object.values(accMap));
    setLoading(false);
  };

  if (loading) return <div className="text-center p-8">Lade Übersicht...</div>;

  return (
    <div className="space-y-6">
      
      {/* ÜST KARTLAR (Genel Durum) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Bakiye Kartı */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Aktueller Saldo</p>
              <h3 className={`text-2xl font-bold mt-1 ${stats.totalBalance >= 0 ? 'text-gray-800' : 'text-red-600'}`}>
                {stats.totalBalance.toFixed(2)} €
              </h3>
            </div>
            <div className="p-3 bg-blue-100 rounded-full text-blue-600">
              <FaWallet size={20} />
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500">
            Gesamtvermögen aller Konten
          </div>
        </div>

        {/* Bu Ay Gelir */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Einnahmen (Dieser Monat)</p>
              <h3 className="text-2xl font-bold mt-1 text-green-600">
                + {stats.monthIncome.toFixed(2)} €
              </h3>
            </div>
            <div className="p-3 bg-green-100 rounded-full text-green-600">
              <FaArrowUp size={20} />
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500">
            Gesamteinnahmen: {stats.totalIncome.toFixed(2)} €
          </div>
        </div>

        {/* Bu Ay Gider */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Ausgaben (Dieser Monat)</p>
              <h3 className="text-2xl font-bold mt-1 text-red-600">
                - {stats.monthExpense.toFixed(2)} €
              </h3>
            </div>
            <div className="p-3 bg-red-100 rounded-full text-red-600">
              <FaArrowDown size={20} />
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500">
            Gesamtausgaben: {stats.totalExpense.toFixed(2)} €
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* HESAP DURUMLARI */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Kontostände</h3>
          <div className="space-y-4">
            {accountBalances.length === 0 ? (
              <p className="text-gray-500 text-sm">Keine Kontodaten verfügbar.</p>
            ) : (
              accountBalances.map((acc, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${acc.name.toLowerCase().includes('bank') ? 'bg-indigo-100 text-indigo-600' : 'bg-yellow-100 text-yellow-600'}`}>
                      {acc.name.toLowerCase().includes('bank') ? <FaLandmark /> : <FaMoneyBillWave />}
                    </div>
                    <span className="font-medium text-gray-700">{acc.name}</span>
                  </div>
                  <span className={`font-bold ${acc.balance >= 0 ? 'text-gray-800' : 'text-red-600'}`}>
                    {acc.balance.toFixed(2)} €
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* SON İŞLEMLER */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Letzte Transaktionen</h3>
          <div className="space-y-3">
            {recentTransactions.length === 0 ? (
              <p className="text-gray-500 text-sm">Keine Transaktionen gefunden.</p>
            ) : (
              recentTransactions.map((trx) => (
                <div key={trx.id} className="flex justify-between items-center text-sm border-b last:border-0 pb-2 last:pb-0">
                  <div>
                    <div className="font-medium text-gray-800">{trx.accounting_categories?.name || 'Unbekannt'}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(trx.date).toLocaleDateString('de-DE')} 
                      {trx.accounting_contacts && ` • ${trx.accounting_contacts.name}`}
                    </div>
                  </div>
                  <span className={`font-bold ${trx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {trx.type === 'income' ? '+' : '-'} {parseFloat(trx.amount).toFixed(2)} €
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
