import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import { FaSpinner, FaPrint } from 'react-icons/fa';

export default function MemberTracking() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [years, setYears] = useState([]);

  useEffect(() => {
    const currentYear = new Date().getFullYear();
    setYears([currentYear - 2, currentYear - 1, currentYear, currentYear + 1]);
    fetchPayments();
  }, [filterYear]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('accounting_transactions')
        .select(`
          id, date, amount, description, receipt_no,
          contact_id, accounting_contacts!inner(id, name),
          accounting_categories(name),
          accounting_accounts(name)
        `)
        .eq('type', 'income')
        .eq('accounting_contacts.type', 'member')
        .gte('date', `${filterYear}-01-01`)
        .lte('date', `${filterYear}-12-31`)
        .order('date', { ascending: false });

      if (error) throw error;

      // Filter nur Mitgliedsbeitrag
      const filtered = (data || []).filter(trx => {
        const catName = (trx.accounting_categories?.name || '').toLowerCase();
        const desc = (trx.description || '').toLowerCase();
        return catName.includes('mitglied') || catName.includes('beitrag') || desc.includes('beitrag');
      });

      setPayments(filtered);
    } catch (error) {
      console.error('Error fetching member payments:', error);
    }
    setLoading(false);
  };

  const formatDateDE = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getPaymentMethod = (accountName) => {
    if (!accountName) return '-';
    const name = accountName.toLowerCase();
    if (name.includes('bargeld')) return 'Bar';
    if (name.includes('überwisung') || name.includes('bank')) return 'Überweisung';
    return '-';
  };

  const extractPeriod = (description) => {
    if (!description) return '-';
    // Versuche "2024", "2024/1", oder ähnliche Muster zu finden
    const match = description.match(/(\d{4}(?:\/[1-2])?)/);
    return match ? match[1] : '-';
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    if (!printWindow) return;

    let tableRows = '';
    payments.forEach((payment, index) => {
      const memberName = payment.accounting_contacts?.name || '-';
      const date = formatDateDE(payment.date);
      const amount = payment.amount ? `${payment.amount.toFixed(2)} €` : '-';
      const period = extractPeriod(payment.description);
      const paymentMethod = getPaymentMethod(payment.accounting_accounts?.name);
      const receipt = payment.receipt_no || `-`;

      tableRows += `
        <tr>
          <td style="text-align: center; width: 40px;">${index + 1}</td>
          <td style="width: 150px;">${memberName}</td>
          <td style="width: 90px; text-align: center;">${date}</td>
          <td style="width: 80px; text-align: right; font-weight: bold;">${amount}</td>
          <td style="width: 120px;">Mitgliedsbeitrag</td>
          <td style="width: 90px; text-align: center;">${period}</td>
          <td style="width: 90px; text-align: center;">${paymentMethod}</td>
          <td style="width: 80px; text-align: center;">${receipt}</td>
        </tr>`;
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Mitgliederbeitragsliste</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            @page {
              size: A4 landscape;
              margin: 15mm;
            }
            
            @media print {
              body { margin: 0; padding: 0; }
            }
            
            body {
              font-family: Arial, Helvetica, sans-serif;
              font-size: 9pt;
              line-height: 1.4;
              color: #000;
              margin: 15mm;
            }
            
            .document-header {
              text-align: center;
              margin-bottom: 12px;
              padding-bottom: 8px;
              border-bottom: 2px solid #333;
              page-break-after: avoid;
            }
            
            .document-header h1 {
              font-size: 14pt;
              font-weight: bold;
              margin: 4px 0;
            }
            
            .document-header p {
              font-size: 9pt;
              color: #555;
              margin: 2px 0;
            }
            
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
            }
            
            thead {
              display: table-header-group;
            }
            
            tbody {
              display: table-row-group;
            }
            
            tr {
              page-break-inside: avoid;
            }
            
            th {
              background-color: #333;
              color: white;
              border: 1px solid #999;
              padding: 6px 4px;
              text-align: left;
              font-weight: bold;
              font-size: 8.5pt;
            }
            
            td {
              border: 1px solid #ccc;
              padding: 5px 4px;
              font-size: 8.5pt;
            }

            .footer {
              margin-top: 20px;
              padding-top: 10px;
              border-top: 1px solid #ccc;
              text-align: center;
              font-size: 8pt;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="document-header">
            <h1>Mitgliederbeitragsliste</h1>
            <p>Bürgertreff Wissen e.V.</p>
            <p>Stand: ${formatDateDE(new Date().toISOString().slice(0, 10))}</p>
          </div>
          
          <table>
            <thead>
              <tr>
                <th style="text-align: center;">Nr.</th>
                <th>Name, Vorname</th>
                <th style="text-align: center;">Zahlungsdatum</th>
                <th style="text-align: right;">Betrag</th>
                <th>Verwendungszweck</th>
                <th style="text-align: center;">Zeitraum</th>
                <th style="text-align: center;">Zahlungsart</th>
                <th style="text-align: center;">Beleg-Nr.</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>

          <div class="footer">
            <p>Gesamt: ${payments.length} Zahlungen | Summe: ${payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0).toFixed(2)} €</p>
          </div>
          
          <script>
            window.addEventListener('load', function() {
              setTimeout(function() { window.print(); }, 250);
            });
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  if (loading) {
    return <div className="flex justify-center items-center p-8"><FaSpinner className="animate-spin text-2xl" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-gray-800">Mitgliederbeitragsliste</h3>
          <p className="text-sm text-gray-600">Jahresübersicht der Mitgliedsbeitragszahlungen</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(parseInt(e.target.value))}
            className="border border-gray-300 rounded px-3 py-2 text-sm"
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button
            onClick={handlePrint}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2"
          >
            <FaPrint /> Drucken
          </button>
        </div>
      </div>

      <div className="overflow-x-auto border border-gray-300 rounded-lg bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-200">
            <tr>
              <th className="px-3 py-2 text-center font-bold w-12">Nr.</th>
              <th className="px-3 py-2 text-left font-bold">Name, Vorname</th>
              <th className="px-3 py-2 text-center font-bold w-24">Zahlungsdatum</th>
              <th className="px-3 py-2 text-right font-bold w-20">Betrag</th>
              <th className="px-3 py-2 text-left font-bold w-32">Verwendungszweck</th>
              <th className="px-3 py-2 text-center font-bold w-20">Zeitraum</th>
              <th className="px-3 py-2 text-center font-bold w-20">Zahlungsart</th>
              <th className="px-3 py-2 text-center font-bold w-16">Beleg-Nr.</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment, index) => {
              const memberName = payment.accounting_contacts?.name || '-';
              const date = formatDateDE(payment.date);
              const amount = payment.amount ? `${payment.amount.toFixed(2)} €` : '-';
              const period = extractPeriod(payment.description);
              const paymentMethod = getPaymentMethod(payment.accounting_accounts?.name);
              const receipt = payment.receipt_no || '-';

              return (
                <tr key={payment.id} className="border-t border-gray-200 hover:bg-gray-50">
                  <td className="px-3 py-2 text-center">{index + 1}</td>
                  <td className="px-3 py-2">{memberName}</td>
                  <td className="px-3 py-2 text-center text-sm">{date}</td>
                  <td className="px-3 py-2 text-right font-semibold">{amount}</td>
                  <td className="px-3 py-2 text-sm">Mitgliedsbeitrag</td>
                  <td className="px-3 py-2 text-center text-sm">{period}</td>
                  <td className="px-3 py-2 text-center text-sm">{paymentMethod}</td>
                  <td className="px-3 py-2 text-center text-sm">{receipt}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {payments.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <p className="text-blue-800">
            Keine Mitgliedsbeitragszahlungen für das Jahr {filterYear} gefunden.
          </p>
        </div>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
        <strong>Hinweis zur Nakit-Akış-Prensibi (Zu- und Abflussprinzip):</strong> Die Zahlungsdaten 
        zeigen den Zeitpunkt des Geldeingangs auf dem Vereinskonto oder in der Kasse, nicht das 
        Rechnungsdatum. Dies ist erforderlich für die deutsche Steuererklärung.
      </div>
    </div>
  );
}
