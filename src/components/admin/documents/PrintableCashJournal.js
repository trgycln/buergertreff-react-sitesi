import React from 'react';

// Format helper
const formatEuro = (num) => {
  const val = typeof num === 'number' ? num : parseFloat(num) || 0;
  return val.toLocaleString('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + ' €';
};

const formatDateDE = (d) => {
  if (!d) return '-';
  try {
    const parts = d.split('-');
    if (parts.length === 3) return `${parts[2]}.${parts[1]}.${parts[0]}`;
    return new Date(d).toLocaleDateString('de-DE');
  } catch {
    return d;
  }
};

export const ROWS_PER_PAGE = 20;

/**
 * Prepares the transaction records into page chunks with calculated carryovers.
 */
export const prepareKassenbuchPages = (transactions = [], openingBalance = 0) => {
  const sorted = [...transactions].sort((a, b) => {
    const diff = new Date(a.date) - new Date(b.date);
    if (diff !== 0) return diff;
    return (a.id || 0) - (b.id || 0);
  });

  let currentBalance = openingBalance;
  let counter = 1;
  const processed = sorted.map(trx => {
    const amount = parseFloat(trx.amount) || 0;
    const isIncome = trx.type === 'income';
    currentBalance += isIncome ? amount : -amount;
    return {
      ...trx,
      rowNumber: counter++,
      amountNum: amount,
      isIncome,
      runningBalance: currentBalance,
      receiptNumber: trx.receipt_no || trx.file_no || (trx.id ? `TRX-${trx.id.toString().slice(0, 6)}` : '-')
    };
  });

  const pages = [];
  for (let i = 0; i < processed.length; i += ROWS_PER_PAGE) {
    pages.push(processed.slice(i, i + ROWS_PER_PAGE));
  }
  if (pages.length === 0) {
    pages.push([]);
  }

  return { processed, pages };
};

/**
 * Direct print function: creates an isolated popup window with pure standalone HTML & CSS.
 * This completely avoids any CSS conflicts, visibility: hidden, or iframe clipping.
 */
export const printKassenbuchDirect = ({ transactions, openingBalance, year, orgName = 'Bürgertreff Wissen e.V.' }) => {
  const { pages } = prepareKassenbuchPages(transactions, openingBalance);

  let pagesHtml = '';

  pages.forEach((pageTrx, pageIndex) => {
    const isFirstPage = pageIndex === 0;
    const isLastPage = pageIndex === pages.length - 1;

    const pageStartBalance = pageTrx.length > 0
      ? pageTrx[0].runningBalance - (pageTrx[0].isIncome ? pageTrx[0].amountNum : -pageTrx[0].amountNum)
      : openingBalance;

    const pageEndBalance = pageTrx.length > 0
      ? pageTrx[pageTrx.length - 1].runningBalance
      : pageStartBalance;

    let rowsHtml = '';

    // First row: Vortrag or Übertrag
    rowsHtml += `
      <tr class="carry-row">
        <td class="text-center">-</td>
        <td class="text-center">${isFirstPage ? '01.01.' + year : '-'}</td>
        <td class="text-center">-</td>
        <td class="font-bold">${isFirstPage ? 'Vortrag / Anfangsbestand aus ' + (year - 1) : 'Übertrag von Blatt ' + pageIndex}</td>
        <td class="text-right">-</td>
        <td class="text-right">-</td>
        <td class="text-right font-bold">${formatEuro(pageStartBalance)}</td>
      </tr>
    `;

    // Transaction rows
    pageTrx.forEach(trx => {
      const cat = trx.accounting_categories?.name || 'Sonstige';
      const desc = trx.description ? ` - ${trx.description}` : '';
      rowsHtml += `
        <tr>
          <td class="text-center">${trx.rowNumber}</td>
          <td class="text-center">${formatDateDE(trx.date)}</td>
          <td class="text-center">${trx.receiptNumber}</td>
          <td><span class="cat-label">${cat}</span>${desc}</td>
          <td class="text-right income">${trx.isIncome ? formatEuro(trx.amountNum) : ''}</td>
          <td class="text-right expense">${!trx.isIncome ? formatEuro(trx.amountNum) : ''}</td>
          <td class="text-right font-medium">${formatEuro(trx.runningBalance)}</td>
        </tr>
      `;
    });

    // Pad remaining rows up to ROWS_PER_PAGE for GoBD compliance
    const remaining = ROWS_PER_PAGE - pageTrx.length;
    for (let r = 0; r < remaining; r++) {
      rowsHtml += `
        <tr class="empty-row">
          <td class="text-center text-muted">-</td>
          <td class="text-center text-muted">-</td>
          <td class="text-center text-muted">-</td>
          <td class="text-muted">---------------------------------------------------------------------------------</td>
          <td class="text-right text-muted">-</td>
          <td class="text-right text-muted">-</td>
          <td class="text-right text-muted">-</td>
        </tr>
      `;
    }

    // Bottom summary row
    rowsHtml += `
      <tr class="summary-row">
        <td colspan="4" class="text-right font-bold text-uppercase">
          ${isLastPage ? 'Kassenendbestand per 31.12.' + year + ':' : 'Übertrag auf Blatt ' + (pageIndex + 2) + ':'}
        </td>
        <td colspan="2" class="text-right text-muted"></td>
        <td class="text-right font-bold final-amount">${formatEuro(pageEndBalance)}</td>
      </tr>
    `;

    pagesHtml += `
      <div class="sheet">
        <div class="sheet-header">
          <div class="header-left">
            <h2>KASSENBUCH</h2>
            <p class="subtitle">Wirtschaftsjahr: <strong>${year}</strong> &nbsp;|&nbsp; Kasse: <strong>Barkasse</strong></p>
          </div>
          <div class="header-right">
            <h3>${orgName}</h3>
            <p class="page-badge">Blatt <strong>${pageIndex + 1}</strong> von <strong>${pages.length}</strong></p>
          </div>
        </div>

        <table class="kassen-table">
          <thead>
            <tr>
              <th style="width: 38px;" class="text-center">Lfd.</th>
              <th style="width: 75px;" class="text-center">Datum</th>
              <th style="width: 100px;" class="text-center">Beleg-Nr.</th>
              <th>Buchungstext / Verwendungszweck</th>
              <th style="width: 90px;" class="text-right">Einnahmen</th>
              <th style="width: 90px;" class="text-right">Ausgaben</th>
              <th style="width: 105px;" class="text-right">Bestand</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="sheet-footer">
          <div class="signature-box">
            <div class="line"></div>
            <p class="sig-title">Ort, Datum &amp; Unterschrift</p>
            <p class="sig-role">Kassierer</p>
          </div>
          <div class="signature-box">
            <div class="line"></div>
            <p class="sig-title">Ort, Datum &amp; Unterschrift</p>
            <p class="sig-role">Vorstandsvorsitzender</p>
          </div>
        </div>
      </div>
    `;
  });

  const fullHtml = `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="utf-8" />
      <title>Kassenbuch_${year}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 10mm 12mm 10mm 12mm;
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
          color: #111;
          background: #fff;
          font-size: 11px;
          line-height: 1.25;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .sheet {
          width: 100%;
          height: 275mm;
          page-break-after: always;
          break-after: page;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 0;
          position: relative;
          overflow: hidden;
        }
        .sheet:last-child {
          page-break-after: auto;
          break-after: auto;
        }
        .sheet-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid #000;
          padding-bottom: 6px;
          margin-bottom: 6px;
        }
        .sheet-header h2 {
          font-size: 18px;
          font-weight: 800;
          letter-spacing: 1px;
        }
        .sheet-header .subtitle {
          font-size: 11px;
          color: #444;
          margin-top: 3px;
        }
        .header-right {
          text-align: right;
        }
        .header-right h3 {
          font-size: 13px;
          font-weight: 700;
          color: #222;
        }
        .header-right .page-badge {
          font-size: 11px;
          color: #555;
          margin-top: 2px;
        }
        .kassen-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 10.5px;
          flex-grow: 1;
        }
        .kassen-table th {
          background: #f1f3f5 !important;
          border: 1px solid #000;
          padding: 4px 6px;
          font-weight: 700;
          font-size: 10px;
          text-transform: uppercase;
        }
        .kassen-table td {
          border: 1px solid #ccc;
          padding: 3px 6px;
          vertical-align: middle;
          height: 21px;
        }
        .carry-row td {
          background: #f8f9fa !important;
          font-weight: 600;
          border-top: 1px solid #000;
          border-bottom: 1px solid #000;
        }
        .empty-row td {
          color: #bbb;
          background: #fafafa !important;
        }
        .summary-row td {
          background: #e9ecef !important;
          font-weight: 700;
          border-top: 2px solid #000;
          border-bottom: 2px solid #000;
          padding: 5px 6px;
        }
        .final-amount {
          font-size: 12px;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: 700; }
        .font-medium { font-weight: 600; }
        .cat-label { font-weight: 700; color: #222; margin-right: 4px; }
        .income { color: #166534; font-weight: 600; }
        .expense { color: #991b1b; font-weight: 600; }
        .text-muted { color: #aaa; }
        .sheet-footer {
          display: flex;
          justify-content: space-between;
          margin-top: 10px;
          padding-top: 8px;
          border-top: 1px solid #ddd;
        }
        .signature-box {
          width: 210px;
          text-align: center;
        }
        .signature-box .line {
          border-bottom: 1px solid #000;
          margin-bottom: 4px;
          height: 22px;
        }
        .signature-box .sig-title {
          font-size: 9px;
          color: #666;
        }
        .signature-box .sig-role {
          font-size: 11px;
          font-weight: 700;
          color: #000;
          margin-top: 2px;
        }
      </style>
    </head>
    <body>
      ${pagesHtml}
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank', 'width=1100,height=850');
  if (!printWindow) {
    alert('Bitte Popup-Fenster im Browser erlauben, um das Kassenbuch drucken zu können.');
    return;
  }
  printWindow.document.open();
  printWindow.document.write(fullHtml);
  printWindow.document.close();
  printWindow.focus();

  // Allow styles and DOM to fully paint before invoking print dialog
  setTimeout(() => {
    printWindow.print();
  }, 400);
};

/**
 * React Component for on-screen Preview and modal viewing.
 */
const PrintableCashJournal = ({ transactions = [], openingBalance = 0, year, orgName = 'Bürgertreff Wissen e.V.' }) => {
  const { pages } = prepareKassenbuchPages(transactions, openingBalance);

  return (
    <div className="kassenbuch-preview-wrapper space-y-8 bg-gray-100 p-6 rounded-lg max-h-[80vh] overflow-y-auto">
      {pages.map((pageTrx, pageIndex) => {
        const isFirstPage = pageIndex === 0;
        const isLastPage = pageIndex === pages.length - 1;

        const pageStartBalance = pageTrx.length > 0
          ? pageTrx[0].runningBalance - (pageTrx[0].isIncome ? pageTrx[0].amountNum : -pageTrx[0].amountNum)
          : openingBalance;

        const pageEndBalance = pageTrx.length > 0
          ? pageTrx[pageTrx.length - 1].runningBalance
          : pageStartBalance;

        const remaining = ROWS_PER_PAGE - pageTrx.length;

        return (
          <div
            key={pageIndex}
            className="kassenbuch-sheet bg-white text-gray-900 mx-auto p-8 shadow-xl border border-gray-300 rounded flex flex-col justify-between"
            style={{ width: '210mm', minHeight: '297mm', boxSizing: 'border-box' }}
          >
            <div>
              {/* Header */}
              <div className="flex justify-between items-start border-b-2 border-black pb-3 mb-4">
                <div>
                  <h2 className="text-2xl font-black tracking-wide text-gray-900">KASSENBUCH</h2>
                  <p className="text-xs text-gray-600 mt-1">
                    Wirtschaftsjahr: <span className="font-bold text-gray-900">{year}</span> &nbsp;|&nbsp; Kasse: <span className="font-bold text-gray-900">Barkasse</span>
                  </p>
                </div>
                <div className="text-right">
                  <h3 className="font-bold text-gray-900 text-sm">{orgName}</h3>
                  <p className="text-xs text-gray-600 mt-1">
                    Blatt <span className="font-bold text-gray-900">{pageIndex + 1}</span> von <span className="font-bold text-gray-900">{pages.length}</span>
                  </p>
                </div>
              </div>

              {/* Table */}
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-100 border border-black">
                    <th className="border border-black p-1 text-center w-10">Lfd.</th>
                    <th className="border border-black p-1 text-center w-20">Datum</th>
                    <th className="border border-black p-1 text-center w-24">Beleg-Nr.</th>
                    <th className="border border-black p-1 text-left">Buchungstext / Verwendungszweck</th>
                    <th className="border border-black p-1 text-right w-24">Einnahmen</th>
                    <th className="border border-black p-1 text-right w-24">Ausgaben</th>
                    <th className="border border-black p-1 text-right w-28">Bestand</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Vortrag / Übertrag Row */}
                  <tr className="bg-gray-50 border-b border-gray-400 font-semibold italic text-gray-800">
                    <td className="border border-gray-300 p-1 text-center text-gray-400">-</td>
                    <td className="border border-gray-300 p-1 text-center">{isFirstPage ? `01.01.${year}` : '-'}</td>
                    <td className="border border-gray-300 p-1 text-center text-gray-400">-</td>
                    <td className="border border-gray-300 p-1 font-bold text-gray-800">
                      {isFirstPage ? `Vortrag / Anfangsbestand aus ${year - 1}:` : `Übertrag von Blatt ${pageIndex}:`}
                    </td>
                    <td className="border border-gray-300 p-1 text-right text-gray-400">-</td>
                    <td className="border border-gray-300 p-1 text-right text-gray-400">-</td>
                    <td className="border border-gray-300 p-1 text-right font-bold text-gray-900">
                      {formatEuro(pageStartBalance)}
                    </td>
                  </tr>

                  {/* Transactions */}
                  {pageTrx.map(trx => (
                    <tr key={trx.id} className="border-b border-gray-200 hover:bg-blue-50/30">
                      <td className="border border-gray-300 p-1 text-center text-gray-500">{trx.rowNumber}</td>
                      <td className="border border-gray-300 p-1 text-center whitespace-nowrap">{formatDateDE(trx.date)}</td>
                      <td className="border border-gray-300 p-1 text-center font-mono text-[11px] text-gray-700">{trx.receiptNumber}</td>
                      <td className="border border-gray-300 p-1">
                        <span className="font-bold text-gray-800 mr-1">{trx.accounting_categories?.name || 'Sonstige'}</span>
                        {trx.description && <span className="text-gray-600">- {trx.description}</span>}
                      </td>
                      <td className="border border-gray-300 p-1 text-right text-green-700 font-medium whitespace-nowrap">
                        {trx.isIncome ? formatEuro(trx.amountNum) : ''}
                      </td>
                      <td className="border border-gray-300 p-1 text-right text-red-700 font-medium whitespace-nowrap">
                        {!trx.isIncome ? formatEuro(trx.amountNum) : ''}
                      </td>
                      <td className="border border-gray-300 p-1 text-right font-bold text-gray-900 whitespace-nowrap">
                        {formatEuro(trx.runningBalance)}
                      </td>
                    </tr>
                  ))}

                  {/* Padding empty rows */}
                  {Array.from({ length: remaining }).map((_, rIndex) => (
                    <tr key={`empty-${rIndex}`} className="border-b border-gray-100 bg-gray-50/50">
                      <td className="border border-gray-200 p-1 text-center text-gray-300">-</td>
                      <td className="border border-gray-200 p-1 text-center text-gray-300">-</td>
                      <td className="border border-gray-200 p-1 text-center text-gray-300">-</td>
                      <td className="border border-gray-200 p-1 text-gray-300">----------------------------------------------------</td>
                      <td className="border border-gray-200 p-1 text-right text-gray-300">-</td>
                      <td className="border border-gray-200 p-1 text-right text-gray-300">-</td>
                      <td className="border border-gray-200 p-1 text-right text-gray-300">-</td>
                    </tr>
                  ))}

                  {/* Summary / Carryover to next page */}
                  <tr className="bg-gray-200 border-t-2 border-black font-bold">
                    <td colSpan="4" className="border border-black p-2 text-right uppercase text-xs">
                      {isLastPage ? `Kassenendbestand per 31.12.${year}:` : `Übertrag auf Blatt ${pageIndex + 2}:`}
                    </td>
                    <td colSpan="2" className="border border-black p-2 text-right"></td>
                    <td className="border border-black p-2 text-right text-sm text-gray-900 font-black">
                      {formatEuro(pageEndBalance)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Signature Block */}
            <div className="mt-8 pt-4 border-t border-gray-300 flex justify-between px-6">
              <div className="w-56 text-center">
                <div className="border-b border-black mb-1 h-8"></div>
                <p className="text-[10px] text-gray-500">Ort, Datum &amp; Unterschrift</p>
                <p className="text-xs font-bold text-gray-900 mt-1">Kassierer</p>
              </div>
              <div className="w-56 text-center">
                <div className="border-b border-black mb-1 h-8"></div>
                <p className="text-[10px] text-gray-500">Ort, Datum &amp; Unterschrift</p>
                <p className="text-xs font-bold text-gray-900 mt-1">Vorstandsvorsitzender</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PrintableCashJournal;
