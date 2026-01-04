import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { FaPrint, FaFileDownload, FaChartPie, FaSpinner } from 'react-icons/fa';

export default function BuchhaltungReports() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState({
    income: 0,
    expense: 0,
    balance: 0,
    categories: [],
    accounts: []
  });

  // Organizasyon verileri (Footer için)
  const [orgSettings, setOrgSettings] = useState({});

  useEffect(() => {
    fetchReportData();
    fetchOrgSettings();
  }, [year]);

  const fetchOrgSettings = async () => {
    const { data } = await supabase
      .from('site_settings')
      .select('key, value')
      .in('key', ['org_name', 'org_address', 'org_tax_id', 'exemption_date', 'exemption_office']);
    
    const settings = {};
    if (data) data.forEach(item => { settings[item.key] = item.value; });
    setOrgSettings(settings);
  };

  const fetchReportData = async () => {
    setLoading(true);
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    // 1. O yılki tüm işlemleri çek
    const { data: transactions, error } = await supabase
      .from('accounting_transactions')
      .select(`
        amount,
        type,
        accounting_categories (name),
        accounting_accounts (name)
      `)
      .gte('date', startDate)
      .lte('date', endDate);

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    // 2. Verileri Hesapla
    let totalIncome = 0;
    let totalExpense = 0;
    const catMap = {}; // Kategori bazlı toplamlar
    const accMap = {}; // Hesap bazlı hareketler

    transactions.forEach(trx => {
      const amount = parseFloat(trx.amount);
      const catName = trx.accounting_categories?.name || 'Diğer';
      const accName = trx.accounting_accounts?.name || 'Diğer';

      // Toplamlar
      if (trx.type === 'income') {
        totalIncome += amount;
      } else {
        totalExpense += amount;
      }

      // Kategori Gruplama
      if (!catMap[catName]) catMap[catName] = { name: catName, income: 0, expense: 0 };
      if (trx.type === 'income') catMap[catName].income += amount;
      else catMap[catName].expense += amount;

      // Hesap Gruplama (Sadece o yılki hareketler)
      if (!accMap[accName]) accMap[accName] = { name: accName, income: 0, expense: 0 };
      if (trx.type === 'income') accMap[accName].income += amount;
      else accMap[accName].expense += amount;
    });

    // Objeyi Array'e çevir ve sırala
    const categories = Object.values(catMap).sort((a, b) => a.name.localeCompare(b.name));
    const accounts = Object.values(accMap).sort((a, b) => a.name.localeCompare(b.name));

    setReportData({
      income: totalIncome,
      expense: totalExpense,
      balance: totalIncome - totalExpense,
      categories,
      accounts
    });
    setLoading(false);
  };

  // --- YAZDIRMA FONKSİYONU (A4 KAPAK SAYFASI) ---
  const printAnnualReport = () => {
    const printWindow = window.open('', '_blank', 'width=1000,height=800');
    if (!printWindow) return;

    const dateStr = new Date().toLocaleDateString('de-DE');
    const incomeStr = reportData.income.toFixed(2).replace('.', ',') + ' €';
    const expenseStr = reportData.expense.toFixed(2).replace('.', ',') + ' €';
    const balanceStr = reportData.balance.toFixed(2).replace('.', ',') + ' €';
    const balanceColor = reportData.balance >= 0 ? 'green' : 'red';

    // Footer Bilgileri (Varsayılan veya Veritabanından)
    const footerInfo = `
      Bürgertreff Wissen e.V., c/o Erika Uber (1. Vorsitzende), Hauptstr. 79, 57587 Birken-Honigsessen<br>
      Tel. 01516 5179082 - buergertreff.wissen@gmail.com – www.buergertreff-wissen.de<br>
      Sparkasse Westerwald-Sieg DE27 5735 1030 0055 0844 38 BIC MALADE51AKI<br>
      StNr. ${orgSettings.org_tax_id || '02/650/36212'} – Die Gemeinnützigkeit ist anerkannt
    `;

    const htmlContent = `
      <html>
        <head>
          <title>Jahresbericht ${year}</title>
          <style>
            @page { size: A4; margin: 20mm 18mm 22mm 18mm; }
            body { font-family: Arial, sans-serif; font-size: 9pt; color: #333; line-height: 1.2; margin:0; padding: 0 18mm; }
            h1 { text-align: center; font-size: 13pt; margin-bottom: 2px; text-transform: uppercase; }
            h2 { text-align: center; font-size: 10pt; margin-top: 0; font-weight: normal; margin-bottom: 10px; }
            h3 { border-bottom: 1px solid #ccc; padding-bottom: 2px; margin-top: 10px; font-size: 10pt; margin-bottom: 6px; }

            table { width: 100%; border-collapse: collapse; margin-top: 5px; font-size: 8pt; }
            th, td { border: 1px solid #ddd; padding: 4px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .amount { text-align: right; }

            .summary-box { display: flex; justify-content: space-between; margin: 10px 0; border: 1px solid #333; padding: 6px; background: #f9f9f9; }
            .sum-item { text-align: center; flex: 1; }
            .sum-label { font-size: 8pt; text-transform: uppercase; color: #666; display: block; }
            .sum-value { font-size: 11pt; font-weight: bold; display: block; margin-top: 2px; }

            .income-text { color: green; }
            .expense-text { color: red; }

            /* Sayfa kırılmalarını engelle */
            table, h1, h2, h3, .summary-box { page-break-inside: avoid; }
          </style>
        </head>
        <body>
          <div style="text-align:center; margin-bottom:20px;">
            <img src="/logo.png" style="height:80px;" onerror="this.style.display='none'" />
          </div>
          
          <h1>Jahresabschluss / Kassenbericht</h1>
          <h2>Geschäftsjahr ${year}</h2>

          <div class="summary-box">
            <div class="sum-item">
              <span class="sum-label">Gesamteinnahmen</span>
              <span class="sum-value income-text">+ ${incomeStr}</span>
            </div>
            <div class="sum-item" style="border-left: 1px solid #ccc; border-right: 1px solid #ccc;">
              <span class="sum-label">Gesamtausgaben</span>
              <span class="sum-value expense-text">- ${expenseStr}</span>
            </div>
            <div class="sum-item">
              <span class="sum-label">Ergebnis (Saldo)</span>
              <span class="sum-value" style="color: ${balanceColor};">${balanceStr}</span>
            </div>
          </div>

          <h3>1. Einnahmen nach Kategorien</h3>
          <table>
            <thead>
              <tr>
                <th>Kategorie</th>
                <th class="amount">Einnahmen</th>
              </tr>
            </thead>
            <tbody>
              ${reportData.categories.filter(cat => cat.income > 0).map(cat => `
                <tr>
                  <td>${cat.name}</td>
                  <td class="amount">${cat.income.toFixed(2).replace('.', ',')} €</td>
                </tr>
              `).join('')}
              <tr style="font-weight:bold;background:#e6ffe6;">
                <td style="text-align:right;">Summe Einnahmen:</td>
                <td class="amount">${reportData.income.toFixed(2).replace('.', ',')} €</td>
              </tr>
            </tbody>
          </table>

          <h3 style="margin-top:30px;">2. Ausgaben nach Kategorien</h3>
          <table>
            <thead>
              <tr>
                <th>Kategorie</th>
                <th class="amount">Ausgaben</th>
              </tr>
            </thead>
            <tbody>
              ${reportData.categories.filter(cat => cat.expense > 0).map(cat => `
                <tr>
                  <td>${cat.name}</td>
                  <td class="amount">${cat.expense.toFixed(2).replace('.', ',')} €</td>
                </tr>
              `).join('')}
              <tr style="font-weight:bold;background:#ffe6e6;">
                <td style="text-align:right;">Summe Ausgaben:</td>
                <td class="amount">${reportData.expense.toFixed(2).replace('.', ',')} €</td>
              </tr>
            </tbody>
          </table>



          <h3 style="margin-top:30px;">3. Zahlungsbewegungen nach Konten</h3>
          <p style="font-size:10pt; font-style:italic;">(Zeigt nur die Bewegungen im Jahr ${year}, keine Anfangsbestände)</p>
          <table>
            <thead>
              <tr>
                <th>Konto (Kasse/Bank)</th>
                <th class="amount">Zugang (+)</th>
                <th class="amount">Abgang (-)</th>
                <th class="amount">Veränderung</th>
              </tr>
            </thead>
            <tbody>
              ${reportData.accounts.map(acc => {
                const accChange = acc.income - acc.expense;
                return `
                  <tr>
                    <td>${acc.name}</td>
                    <td class="amount">${acc.income.toFixed(2).replace('.', ',')}</td>
                    <td class="amount">${acc.expense.toFixed(2).replace('.', ',')}</td>
                    <td class="amount" style="font-weight:bold;">${accChange.toFixed(2).replace('.', ',')}</td>
                  </tr>
                `;
              }).join('')}
              <tr style="font-weight:bold;background:#e6e6ff;">
                <td style="text-align:right;">Summe (Konto & Bar):</td>
                <td class="amount">${reportData.accounts.reduce((sum, acc) => sum + acc.income, 0).toFixed(2).replace('.', ',')} €</td>
                <td class="amount">${reportData.accounts.reduce((sum, acc) => sum + acc.expense, 0).toFixed(2).replace('.', ',')} €</td>
                <td class="amount">${reportData.accounts.reduce((sum, acc) => sum + (acc.income - acc.expense), 0).toFixed(2).replace('.', ',')} €</td>
              </tr>
            </tbody>
          </table>

          <div style="margin-top: 70px; padding: 0 40px;">
            <p>Ort, Datum: Wissen, den ${dateStr}</p>
            <br><br><br><br>
            <div style="display: flex; justify-content: space-between;">
              <span style="padding-left:30px;">Unterschrift Schatzmeister</span>
              <span style="padding-right:30px;">Unterschrift Kassenprüfer</span>
            </div>
          </div>

          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      
      {/* Üst Bar: Yıl Seçimi ve Yazdır */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 border-b pb-4">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <FaChartPie className="text-blue-600" />
          Finanzbericht / Jahresabschluss
        </h2>
        
        <div className="flex gap-4 mt-4 md:mt-0">
          <select 
            value={year} 
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="border rounded-lg px-4 py-2 bg-gray-50 font-bold"
          >
            {[2023, 2024, 2025, 2026].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          <button 
            onClick={printAnnualReport}
            className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-black flex items-center gap-2"
          >
            <FaPrint /> Bericht drucken
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10"><FaSpinner className="animate-spin text-4xl mx-auto text-blue-600"/></div>
      ) : (
        <>
          {/* Özet Kartları */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-green-50 p-6 rounded-lg border border-green-200 text-center">
              <h3 className="text-green-800 text-sm font-bold uppercase">Gesamteinnahmen</h3>
              <div className="text-3xl font-bold text-green-600 mt-2">
                + {reportData.income.toFixed(2).replace('.', ',')} €
              </div>
            </div>
            <div className="bg-red-50 p-6 rounded-lg border border-red-200 text-center">
              <h3 className="text-red-800 text-sm font-bold uppercase">Gesamtausgaben</h3>
              <div className="text-3xl font-bold text-red-600 mt-2">
                - {reportData.expense.toFixed(2).replace('.', ',')} €
              </div>
            </div>
            <div className={`p-6 rounded-lg border text-center ${reportData.balance >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}`}>
              <h3 className="text-gray-800 text-sm font-bold uppercase">Jahresergebnis</h3>
              <div className={`text-3xl font-bold mt-2 ${reportData.balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                {reportData.balance.toFixed(2).replace('.', ',')} €
              </div>
            </div>
          </div>

          {/* Kategori Tablosu */}
          <h3 className="font-bold text-lg mb-4">Aufschlüsselung nach Kategorien</h3>
          <div className="overflow-x-auto mb-8">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kategorie</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Einnahmen</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ausgaben</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Saldo</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.categories.map((cat, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{cat.name}</td>
                    <td className="px-6 py-4 text-sm text-right text-green-600">{cat.income > 0 ? cat.income.toFixed(2) : '-'}</td>
                    <td className="px-6 py-4 text-sm text-right text-red-600">{cat.expense > 0 ? cat.expense.toFixed(2) : '-'}</td>
                    <td className="px-6 py-4 text-sm text-right font-bold">
                      {(cat.income - cat.expense).toFixed(2)} €
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}