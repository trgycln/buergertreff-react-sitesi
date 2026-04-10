import React, { useEffect, useState } from 'react';
import { FaPrint } from 'react-icons/fa';
import { supabase } from '../../../supabaseClient';

const formatCurrency = (value) => {
  const amount = Number.parseFloat(value);
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
};

const formatDisplayDate = (value) => {
  if (!value) return '—';
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

const formatLongDate = (value) => {
  if (!value) return '—';
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
};

const buildDocumentNumber = (dateValue) => {
  if (!dateValue) return 'EB-YYYY-MM-DD';
  const [year, month, day] = dateValue.split('-');
  return `EB-${year}-${month}-${day}`;
};

const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export default function CashCountProtocol() {
  const today = new Date().toISOString().slice(0, 10);

  const [orgSettings, setOrgSettings] = useState({
    org_name: 'Bürgertreff Wissen e.V.',
    org_address: '',
    org_postal_code: '',
    org_city: 'Wissen',
    treasurer_name: 'Turgay Celen',
  });

  const [formData, setFormData] = useState({
    documentNumber: buildDocumentNumber(today),
    date: today,
    location: 'Wissen',
    title: 'Kassenzählprotokoll',
    description: 'Bareinnahmen aus dem Sammelglas / der Spendenbox',
    total: '',
    businessIncome: '',
    donations: '',
    note: 'Die Aufteilung auf wirtschaftlichen Geschäftsbetrieb und ideellen Bereich wurde sachgerecht vorgenommen.',
    secondSigner: '',
    secondSignerRole: 'Weiteres Vorstands- oder Vereinsmitglied',
  });

  useEffect(() => {
    const fetchOrgSettings = async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', ['org_name', 'org_address', 'org_postal_code', 'org_city', 'treasurer_name']);

      if (error || !data) return;

      setOrgSettings((prev) => {
        const next = { ...prev };
        data.forEach((item) => {
          next[item.key] = item.value || prev[item.key];
        });
        return next;
      });

      const settingsMap = {};
      data.forEach((item) => {
        settingsMap[item.key] = item.value;
      });

      setFormData((prev) => ({
        ...prev,
        location: prev.location || settingsMap.org_city || 'Wissen',
      }));
    };

    fetchOrgSettings();
  }, []);

  const orgName = orgSettings.org_name || 'Bürgertreff Wissen e.V.';
  const treasurerName = orgSettings.treasurer_name || 'Turgay Celen';
  const addressLine = [
    orgSettings.org_address,
    [orgSettings.org_postal_code, orgSettings.org_city].filter(Boolean).join(' '),
  ]
    .filter(Boolean)
    .join(', ');

  const businessAmount = Number.parseFloat(formData.businessIncome) || 0;
  const donationAmount = Number.parseFloat(formData.donations) || 0;
  const calculatedTotal = Number((businessAmount + donationAmount).toFixed(2));
  const enteredTotal = Number.parseFloat(formData.total);
  const effectiveTotal = Number.isFinite(enteredTotal) ? enteredTotal : calculatedTotal;
  const isTotalMismatch = Number.isFinite(enteredTotal) && Math.abs(enteredTotal - calculatedTotal) > 0.009;

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const next = { ...prev, [name]: value };

      if (name === 'date' && (!prev.documentNumber || prev.documentNumber === buildDocumentNumber(prev.date))) {
        next.documentNumber = buildDocumentNumber(value);
      }

      return next;
    });
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=960,height=1280');
    if (!printWindow) return;

    const noteText = formData.note.trim() || 'Die Aufteilung auf wirtschaftlichen Geschäftsbetrieb und ideellen Bereich wurde sachgerecht vorgenommen.';
    const secondSignerText = formData.secondSigner.trim() || 'Name in Druckschrift / Unterschrift';

    const htmlContent = `
      <html>
        <head>
          <title>Eigenbeleg - Kassenzählprotokoll</title>
          <style>
            @page { size: A4; margin: 8mm; }
            * { box-sizing: border-box; }
            body {
              margin: 0;
              font-family: Arial, Helvetica, sans-serif;
              color: #0f172a;
              background: #ffffff;
              font-size: 10pt;
              line-height: 1.28;
            }
            .sheet {
              width: 100%;
              min-height: calc(297mm - 16mm);
              border: 1px solid #cbd5e1;
              padding: 7mm 8mm;
              display: flex;
              flex-direction: column;
            }
            .header {
              display: flex;
              justify-content: space-between;
              gap: 8mm;
              border-bottom: 2px solid #334155;
              padding-bottom: 4mm;
            }
            .meta {
              text-align: right;
              font-size: 9pt;
              line-height: 1.35;
            }
            .eyebrow {
              text-transform: uppercase;
              letter-spacing: 0.24em;
              font-size: 8pt;
              color: #64748b;
              font-weight: bold;
              text-align: center;
              margin-top: 4mm;
            }
            h1 {
              text-align: center;
              margin: 2mm 0 1mm;
              font-size: 16pt;
            }
            .subtitle {
              text-align: center;
              color: #475569;
              margin-bottom: 4mm;
              font-size: 9pt;
            }
            .grid {
              display: table;
              width: 100%;
              table-layout: fixed;
              margin-bottom: 4mm;
            }
            .grid-cell {
              display: table-cell;
              width: 50%;
              border: 1px solid #cbd5e1;
              padding: 2.6mm;
              vertical-align: top;
            }
            .label {
              font-size: 8pt;
              text-transform: uppercase;
              color: #64748b;
              font-weight: bold;
              margin-bottom: 1mm;
            }
            .value-strong {
              font-size: 13pt;
              font-weight: bold;
            }
            .notice {
              border: 1px solid #cbd5e1;
              background: #f8fafc;
              padding: 2.8mm;
              margin: 4mm 0;
              font-size: 9.2pt;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 2mm;
            }
            th, td {
              border: 1px solid #cbd5e1;
              padding: 2mm 2.4mm;
              text-align: left;
              font-size: 9pt;
            }
            th {
              background: #f8fafc;
              font-size: 8.5pt;
            }
            .amount {
              text-align: right;
              white-space: nowrap;
              font-weight: bold;
            }
            .confirmation {
              border: 1px solid #cbd5e1;
              padding: 2.8mm;
              margin-top: 4mm;
              font-size: 9.2pt;
            }
            .signature-grid {
              display: table;
              width: 100%;
              table-layout: fixed;
              margin-top: auto;
              padding-top: 6mm;
            }
            .signature-cell {
              display: table-cell;
              width: 50%;
              padding-right: 5mm;
              vertical-align: bottom;
            }
            .signature-line {
              border-top: 1px solid #0f172a;
              padding-top: 1.5mm;
              margin-top: 9mm;
              font-size: 8.5pt;
            }
          </style>
        </head>
        <body>
          <div class="sheet">
            <div class="header">
              <div>
                <div style="font-size:16pt;font-weight:700;letter-spacing:0.03em;">${escapeHtml(orgName)}</div>
                ${addressLine ? `<div style="margin-top:2mm;color:#475569;">${escapeHtml(addressLine)}</div>` : ''}
                <div style="margin-top:2mm;color:#475569;">Interner Buchhaltungsbeleg</div>
              </div>
              <div class="meta">
                <div><strong>Beleg-Nr.:</strong> ${escapeHtml(formData.documentNumber)}</div>
                <div><strong>Ausstellungsdatum:</strong> ${escapeHtml(formatDisplayDate(formData.date))}</div>
                <div><strong>Ort:</strong> ${escapeHtml(formData.location)}</div>
              </div>
            </div>

            <div class="eyebrow">Eigenbeleg</div>
            <h1>${escapeHtml(formData.title)}</h1>
            <div class="subtitle">Dokumentation einer Bareinnahme ohne externen Einzelbeleg</div>

            <div class="grid">
              <div class="grid-cell">
                <div class="label">Beschreibung</div>
                <div><strong>${escapeHtml(formData.description)}</strong></div>
              </div>
              <div class="grid-cell">
                <div class="label">Gesamtbetrag</div>
                <div class="value-strong">${escapeHtml(formatCurrency(effectiveTotal))}</div>
              </div>
            </div>

            <div class="notice">
              <div style="font-weight:700;margin-bottom:2mm;">Begründung des Eigenbelegs</div>
              <div>
                Im Rahmen der Kassenaufnahme vom ${escapeHtml(formatDisplayDate(formData.date))} wurde die Bareinnahme aus dem Sammelglas bzw. der Spendenbox gezählt.
                Da für diese Einnahme kein gesonderter Fremdbeleg vorliegt, erfolgt die ordnungsgemäße Dokumentation durch diesen Eigenbeleg.
                ${escapeHtml(noteText)}
              </div>
            </div>

            <div>
              <div style="font-weight:700;margin-bottom:2mm;">Aufteilung der Einnahme</div>
              <table>
                <thead>
                  <tr>
                    <th>Position</th>
                    <th style="width:34mm;">Betrag</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Kaffee- und Tee-Einnahmen (wirtschaftlicher Geschäftsbetrieb)</td>
                    <td class="amount">${escapeHtml(formatCurrency(businessAmount))}</td>
                  </tr>
                  <tr>
                    <td>Freiwillige Spenden (ideeller Bereich)</td>
                    <td class="amount">${escapeHtml(formatCurrency(donationAmount))}</td>
                  </tr>
                  <tr>
                    <td><strong>Gesamtbetrag</strong></td>
                    <td class="amount"><strong>${escapeHtml(formatCurrency(effectiveTotal))}</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="confirmation">
              <div style="font-weight:700;margin-bottom:2mm;">Bestätigung</div>
              <div>
                Hiermit wird bestätigt, dass der oben genannte Gesamtbetrag am ${escapeHtml(formatLongDate(formData.date))} gezählt,
                nachvollziehbar festgehalten und zur Verbuchung in der Vereinsbuchhaltung freigegeben wurde.
                Die Unterzeichnung erfolgt nach dem Vier-Augen-Prinzip.
              </div>
            </div>

            <div style="margin-top:5mm;"><strong>Ort, Datum:</strong> ${escapeHtml(formData.location)}, ${escapeHtml(formatLongDate(formData.date))}</div>

            <div class="signature-grid">
              <div class="signature-cell">
                <div class="signature-line">
                  <strong>Schatzmeister / Kassenwart</strong><br>
                  ${escapeHtml(treasurerName)}
                </div>
              </div>
              <div class="signature-cell">
                <div class="signature-line">
                  <strong>${escapeHtml(formData.secondSignerRole)}</strong><br>
                  ${escapeHtml(secondSignerText)}
                </div>
              </div>
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <span className="inline-flex items-center rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">
            Eigenbeleg
          </span>
          <h3 className="mt-3 text-xl font-bold text-slate-900">Kassenzählprotokoll für Bareinnahmen</h3>
          <p className="mt-1 text-sm text-slate-600">
            Tragen Sie Datum, Beträge und Beschreibung ein und drucken Sie den Beleg anschließend zur physischen Ablage aus.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-900"
        >
          <FaPrint />
          Druckansicht öffnen
        </button>
      </div>

      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
        <h4 className="text-sm font-bold text-blue-900">Belegdaten eingeben</h4>
        <p className="mt-1 text-xs text-blue-800">
          Diese Felder sind frei ausfüllbar. Die A4-Vorschau darunter aktualisiert sich sofort für den Ausdruck.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">
            Beleg-Nr.
            <input
              type="text"
              name="documentNumber"
              value={formData.documentNumber}
              onChange={handleInputChange}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>

          <label className="text-sm font-medium text-slate-700">
            Datum
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>

          <label className="text-sm font-medium text-slate-700">
            Ort
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>

          <label className="text-sm font-medium text-slate-700">
            Gesamtbetrag (optional manuell)
            <input
              type="number"
              step="0.01"
              min="0"
              name="total"
              value={formData.total}
              onChange={handleInputChange}
              placeholder="Wird sonst aus der Aufteilung berechnet"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>

          <label className="text-sm font-medium text-slate-700">
            Kaffee- / Tee-Einnahmen
            <input
              type="number"
              step="0.01"
              min="0"
              name="businessIncome"
              value={formData.businessIncome}
              onChange={handleInputChange}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>

          <label className="text-sm font-medium text-slate-700">
            Freiwillige Spenden
            <input
              type="number"
              step="0.01"
              min="0"
              name="donations"
              value={formData.donations}
              onChange={handleInputChange}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>

          <label className="md:col-span-2 text-sm font-medium text-slate-700">
            Beschreibung
            <input
              type="text"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>

          <label className="md:col-span-2 text-sm font-medium text-slate-700">
            Zusatzvermerk / Begründung
            <textarea
              name="note"
              value={formData.note}
              onChange={handleInputChange}
              rows="3"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>

          <label className="text-sm font-medium text-slate-700">
            Weitere Unterschrift (optional)
            <input
              type="text"
              name="secondSigner"
              value={formData.secondSigner}
              onChange={handleInputChange}
              placeholder="Name in Druckschrift"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>

          <label className="text-sm font-medium text-slate-700">
            Funktion der zweiten Person
            <input
              type="text"
              name="secondSignerRole"
              value={formData.secondSignerRole}
              onChange={handleInputChange}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
        </div>

        <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700">
          <strong>Aktuelle Summe aus der Aufteilung:</strong> {formatCurrency(calculatedTotal)}
          {isTotalMismatch && (
            <div className="mt-2 text-red-600">
              Achtung: Manuell eingegebener Gesamtbetrag und Aufteilung stimmen derzeit nicht überein.
            </div>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <div
          className="mx-auto w-full border border-slate-300 bg-white shadow-lg"
          style={{ maxWidth: '210mm', minHeight: '297mm' }}
        >
          <div className="flex min-h-[297mm] flex-col px-4 py-5 text-[12px] leading-snug text-slate-800 sm:px-7 sm:py-6">
            <div className="flex flex-col gap-3 border-b-2 border-slate-700 pb-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="text-lg font-bold uppercase tracking-wide text-slate-900">{orgName}</div>
                {addressLine && <div className="mt-1 text-sm text-slate-600">{addressLine}</div>}
                <div className="mt-1 text-sm text-slate-600">Interner Buchhaltungsbeleg</div>
              </div>

              <div className="space-y-1 text-sm text-slate-700 sm:text-right">
                <div>
                  <span className="font-semibold">Beleg-Nr.:</span> {formData.documentNumber}
                </div>
                <div>
                  <span className="font-semibold">Ausstellungsdatum:</span> {formatDisplayDate(formData.date)}
                </div>
                <div>
                  <span className="font-semibold">Ort:</span> {formData.location}
                </div>
              </div>
            </div>

            <div className="mt-5 text-center">
              <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">Eigenbeleg</div>
              <h1 className="mt-1 text-xl font-bold text-slate-900">{formData.title}</h1>
              <p className="mt-1 text-xs text-slate-600">
                Dokumentation einer Bareinnahme ohne externen Einzelbeleg
              </p>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-slate-200 p-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Beschreibung</div>
                <div className="mt-2 font-semibold text-slate-900">{formData.description}</div>
              </div>

              <div className="rounded-lg border border-slate-200 p-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Gesamtbetrag</div>
                <div className="mt-1 text-xl font-bold text-slate-900">{formatCurrency(effectiveTotal)}</div>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="mb-1 text-sm font-semibold text-slate-900">Begründung des Eigenbelegs</div>
              <p className="text-xs text-slate-700">
                Im Rahmen der Kassenaufnahme vom {formatDisplayDate(formData.date)} wurde die Bareinnahme aus dem
                Sammelglas bzw. der Spendenbox gezählt. Da für diese Einnahme kein gesonderter Fremdbeleg vorliegt,
                erfolgt die ordnungsgemäße Dokumentation durch diesen Eigenbeleg. {formData.note}
              </p>
            </div>

            <div className="mt-4">
              <div className="mb-1 text-sm font-semibold text-slate-900">Aufteilung der Einnahme</div>
              <div className="overflow-hidden rounded-lg border border-slate-200">
                <table className="min-w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-700">
                      <th className="border-b border-slate-200 px-3 py-2 text-left font-semibold">Position</th>
                      <th className="border-b border-slate-200 px-3 py-2 text-right font-semibold">Betrag</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border-b border-slate-200 px-3 py-2">
                        Kaffee- und Tee-Einnahmen (wirtschaftlicher Geschäftsbetrieb)
                      </td>
                      <td className="border-b border-slate-200 px-3 py-2 text-right font-semibold">
                        {formatCurrency(businessAmount)}
                      </td>
                    </tr>
                    <tr>
                      <td className="border-b border-slate-200 px-3 py-2">Freiwillige Spenden (ideeller Bereich)</td>
                      <td className="border-b border-slate-200 px-3 py-2 text-right font-semibold">
                        {formatCurrency(donationAmount)}
                      </td>
                    </tr>
                    <tr className="bg-slate-50">
                      <td className="px-3 py-2 font-bold text-slate-900">Gesamtbetrag</td>
                      <td className="px-3 py-2 text-right font-bold text-slate-900">
                        {formatCurrency(effectiveTotal)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-slate-200 p-3">
              <div className="mb-1 text-sm font-semibold text-slate-900">Bestätigung</div>
              <p className="text-xs text-slate-700">
                Hiermit wird bestätigt, dass der oben genannte Gesamtbetrag am {formatLongDate(formData.date)} gezählt,
                nachvollziehbar festgehalten und zur Verbuchung in der Vereinsbuchhaltung freigegeben wurde. Die
                Unterzeichnung erfolgt nach dem Vier-Augen-Prinzip.
              </p>
            </div>

            <div className="mt-5 text-xs text-slate-800">
              <span className="font-semibold">Ort, Datum:</span> {formData.location}, {formatLongDate(formData.date)}
            </div>

            <div className="mt-auto grid grid-cols-1 gap-6 pt-6 md:grid-cols-2">
              <div>
                <div className="border-t border-slate-800 pt-2 text-sm">
                  <div className="font-semibold text-slate-900">Schatzmeister / Kassenwart</div>
                  <div className="text-slate-700">{treasurerName}</div>
                </div>
              </div>

              <div>
                <div className="border-t border-slate-800 pt-2 text-sm">
                  <div className="font-semibold text-slate-900">{formData.secondSignerRole}</div>
                  <div className="text-slate-500">{formData.secondSigner || 'Name in Druckschrift / Unterschrift'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
