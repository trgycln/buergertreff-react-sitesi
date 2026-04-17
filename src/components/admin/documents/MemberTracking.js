import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import { FaSpinner, FaPrint } from 'react-icons/fa';

export default function MemberTracking() {
  const [memberRows, setMemberRows] = useState([]);
  const [yearColumns, setYearColumns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMembersAndPayments();
  }, []);

  const fetchMembersAndPayments = async () => {
    setLoading(true);
    try {
      const { data: membersData, error: membersError } = await supabase
        .from('accounting_contacts')
        .select('id, name, email, phone, address, member_since, notes')
        .eq('type', 'member')
        .order('name', { ascending: true });

      if (membersError) throw membersError;

      const { data: paymentsData, error: paymentsError } = await supabase
        .from('accounting_transactions')
        .select(`
          id, date, amount, description, receipt_no,
          contact_id,
          accounting_categories(name),
          accounting_accounts(name)
        `)
        .eq('type', 'income')
        .order('date', { ascending: false });

      if (paymentsError) throw paymentsError;

      // Filter nur Mitgliedsbeitrag
      const filtered = (paymentsData || []).filter(trx => {
        const catName = (trx.accounting_categories?.name || '').toLowerCase();
        const desc = (trx.description || '').toLowerCase();
        return catName.includes('mitglied') || catName.includes('beitrag') || desc.includes('beitrag');
      });
      const detectedYears = new Set();

      const groupedByMember = {};
      (membersData || []).forEach((member) => {
        groupedByMember[member.id] = {
          memberId: member.id,
          memberName: member.name || 'Unbekannt',
          email: member.email || '',
          phone: member.phone || '',
          address: member.address || '',
          memberSince: member.member_since || '',
          notes: member.notes || '',
          yearTotals: {},
          totalPaid: 0,
          paymentCount: 0,
          lastPaymentDate: ''
        };
      });

      filtered.forEach((trx) => {
        if (!trx.contact_id) return;
        const memberId = trx.contact_id;
        const amount = parseFloat(trx.amount) || 0;
        const year = (trx.date || '').slice(0, 4);

        if (!/^\d{4}$/.test(year)) return;
        detectedYears.add(year);

        // Strictly keep only contacts that are real members.
        if (!groupedByMember[memberId]) return;

        groupedByMember[memberId].yearTotals[year] = (groupedByMember[memberId].yearTotals[year] || 0) + amount;
        groupedByMember[memberId].totalPaid += amount;
        groupedByMember[memberId].paymentCount += 1;

        if (!groupedByMember[memberId].lastPaymentDate || trx.date > groupedByMember[memberId].lastPaymentDate) {
          groupedByMember[memberId].lastPaymentDate = trx.date;
        }
      });

      const sortedYears = Array.from(detectedYears).sort((a, b) => Number(a) - Number(b));
      const rows = Object.values(groupedByMember).sort((a, b) => a.memberName.localeCompare(b.memberName, 'de'));

      setYearColumns(sortedYears);
      setMemberRows(rows);
    } catch (error) {
      console.error('Error fetching member payments:', error);
      setMemberRows([]);
      setYearColumns([]);
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

  const formatAmount = (value = 0) => `${(Number(value) || 0).toFixed(2)} €`;
  const escapeHtml = (value = '') =>
    String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    if (!printWindow) return;

    let tableRows = '';
    memberRows.forEach((row, index) => {
      const yearCells = yearColumns
        .map((year) => `<td style="width: 80px; text-align: right;">${row.yearTotals[year] ? formatAmount(row.yearTotals[year]) : '-'}</td>`)
        .join('');

      tableRows += `
        <tr>
          <td style="text-align: center; width: 40px;">${index + 1}</td>
          <td style="width: 140px;">${escapeHtml(row.memberName)}</td>
          <td style="width: 180px;">${escapeHtml(row.address || '-')}</td>
          <td style="width: 95px; text-align: center;">${escapeHtml(row.phone || '-')}</td>
          <td style="width: 170px;">${escapeHtml(row.email || '-')}</td>
          <td style="width: 90px; text-align: center;">${row.memberSince ? formatDateDE(row.memberSince) : '-'}</td>
          ${yearCells}
          <td style="width: 95px; text-align: center;">${row.lastPaymentDate ? formatDateDE(row.lastPaymentDate) : '-'}</td>
          <td style="width: 150px;">${escapeHtml(row.notes || '')}</td>
        </tr>`;
    });

    const yearHeaderCells = yearColumns
      .map((year) => `<th style="text-align: right; width: 80px;">${year}</th>`)
      .join('');

    const totalsByYear = yearColumns.reduce((acc, year) => {
      acc[year] = memberRows.reduce((sum, row) => sum + (row.yearTotals[year] || 0), 0);
      return acc;
    }, {});

    const totalYearCells = yearColumns
      .map((year) => `<td style="text-align: right; font-weight: bold;">${formatAmount(totalsByYear[year])}</td>`)
      .join('');

    const grandTotal = memberRows.reduce((sum, row) => sum + row.totalPaid, 0);

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
              margin: 8mm;
            }
            
            @media print {
              body { margin: 0; padding: 0; }
            }
            
            body {
              font-family: Arial, Helvetica, sans-serif;
              font-size: 8pt;
              line-height: 1.25;
              color: #000;
              margin: 8mm;
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
              margin-top: 8px;
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
              padding: 4px 3px;
              text-align: left;
              font-weight: bold;
              font-size: 7.5pt;
            }
            
            td {
              border: 1px solid #ccc;
              padding: 4px 3px;
              font-size: 7.5pt;
              vertical-align: top;
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
            <p>Gesamtübersicht mit Kontaktdaten und Jahresspalten</p>
            <p>Stand: ${formatDateDE(new Date().toISOString().slice(0, 10))}</p>
          </div>
          
          <table>
            <thead>
              <tr>
                <th style="text-align: center;">Nr.</th>
                <th>Name, Vorname</th>
                <th>Adresse</th>
                <th style="text-align: center;">Telefon</th>
                <th>E-Mail</th>
                <th style="text-align: center;">Mitglied seit</th>
                ${yearHeaderCells}
                <th style="text-align: center;">Letzte Zahlung</th>
                <th>Notiz</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
              <tr>
                <td colspan="6" style="font-weight: bold;">Summen</td>
                ${totalYearCells}
                <td style="text-align: center;"></td>
                <td style="text-align: center;">-</td>
              </tr>
            </tbody>
          </table>

          <div class="footer">
            <p>Mitglieder: ${memberRows.length} | Beitrags-Summe: ${formatAmount(grandTotal)}</p>
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
          <p className="text-sm text-gray-600">Gesamtübersicht mit Kontaktdaten und dynamischen Jahresspalten</p>
        </div>
        <div className="flex items-center gap-3">
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
              <th className="px-3 py-2 text-left font-bold min-w-[220px]">Adresse</th>
              <th className="px-3 py-2 text-center font-bold min-w-[130px]">Telefon</th>
              <th className="px-3 py-2 text-left font-bold min-w-[220px]">E-Mail</th>
              <th className="px-3 py-2 text-center font-bold min-w-[130px]">Mitglied seit</th>
              {yearColumns.map((year) => (
                <th key={year} className="px-3 py-2 text-right font-bold w-24">{year}</th>
              ))}
              <th className="px-3 py-2 text-center font-bold w-28">Letzte Zahlung</th>
              <th className="px-3 py-2 text-left font-bold min-w-[220px]">Notiz</th>
            </tr>
          </thead>
          <tbody>
            {memberRows.map((row, index) => {
              return (
                <tr key={row.memberId} className="border-t border-gray-200 hover:bg-gray-50">
                  <td className="px-3 py-2 text-center">{index + 1}</td>
                  <td className="px-3 py-2">{row.memberName}</td>
                  <td className="px-3 py-2">{row.address || '-'}</td>
                  <td className="px-3 py-2 text-center">{row.phone || '-'}</td>
                  <td className="px-3 py-2">{row.email || '-'}</td>
                  <td className="px-3 py-2 text-center text-sm">{row.memberSince ? formatDateDE(row.memberSince) : '-'}</td>
                  {yearColumns.map((year) => (
                    <td key={`${row.memberId}-${year}`} className="px-3 py-2 text-right font-medium">
                      {row.yearTotals[year] ? formatAmount(row.yearTotals[year]) : '-'}
                    </td>
                  ))}
                  <td className="px-3 py-2 text-center text-sm">{row.lastPaymentDate ? formatDateDE(row.lastPaymentDate) : '-'}</td>
                  <td className="px-3 py-2">{row.notes || ''}</td>
                </tr>
              );
            })}
            {memberRows.length > 0 && (
              <tr className="border-t-2 border-gray-400 bg-gray-100">
                <td className="px-3 py-2 font-bold text-center" colSpan={6}>Summen</td>
                {yearColumns.map((year) => {
                  const sumForYear = memberRows.reduce((sum, row) => sum + (row.yearTotals[year] || 0), 0);
                  return (
                    <td key={`sum-${year}`} className="px-3 py-2 text-right font-bold">
                      {formatAmount(sumForYear)}
                    </td>
                  );
                })}
                <td className="px-3 py-2 text-center">-</td>
                <td className="px-3 py-2 text-center"></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {memberRows.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <p className="text-blue-800">
            Keine Mitgliedsbeitragszahlungen gefunden.
          </p>
        </div>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
        <strong>Hinweis zum Zu- und Abflussprinzip:</strong> Die Zahlungsdaten 
        zeigen den Zeitpunkt des Geldeingangs auf dem Vereinskonto oder in der Kasse, nicht das 
        Rechnungsdatum. Dies ist erforderlich für die deutsche Steuererklärung.
      </div>
    </div>
  );
}
