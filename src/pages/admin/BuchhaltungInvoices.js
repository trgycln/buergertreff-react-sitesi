import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { FaPlus, FaPrint, FaTrash, FaCheck, FaTimes, FaFileInvoice, FaEdit } from 'react-icons/fa';

const formatCurrency = (value) =>
  Number(value).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('de-DE');
};

function printInvoiceWindow(invoice, items, contact, settings) {
  // Gerçek site_settings anahtarlarından oku, yoksa derneğin gerçek bilgilerini kullan
  const orgName   = settings?.org_name || 'Bürgertreff Wissen e.V.';
  const orgPostal = settings?.org_postal_code || '57537';

  // Şehir adını temizle (içinde PLZ olabilir)
  const rawCity = settings?.org_city || 'Wissen';
  const orgCity = rawCity.replace(/\d{5}/g, '').replace(/[,\s]+$/, '').trim() || 'Wissen';

  // Sokak adını temizle (içinde PLZ veya şehir adı olabilir)
  const rawStreet = settings?.org_address || 'Marktstr. 8';
  const orgStreet = rawStreet
    .replace(/\d{5}/g, '')                                          // PLZ çıkar
    .replace(new RegExp(`\\b${orgCity}\\b`, 'i'), '')               // Şehir adı çıkar
    .replace(/[,\s]+$/, '').trim();                                  // Sondaki virgül/boşluk temizle

  const orgHeaderAddress = `${orgStreet} • ${orgPostal} ${orgCity}`;

  const bankName       = settings?.bank_name          || 'Sparkasse Westerwald-Sieg';
  const iban           = settings?.bank_iban          || 'DE27 5735 1030 0055 0844 38';
  const bic            = settings?.bank_bic           || 'MALADE51AKI';
  const taxId          = settings?.org_tax_id         || '02/666/34529';
  const vereinsreg     = settings?.vereinsregister    || '';
  const finanzamt      = settings?.exemption_office   || 'Altenkirchen-Hachenburg';

  // İmza: vorsitzende_name alanından oku, yoksa Erika Uber (1. Vorsitzende)
  const chairName      = settings?.vorsitzende_name   || 'Erika Uber';


  const itemRows = items.map((item, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td>${item.description || ''}</td>
      <td style="text-align:right">${item.quantity}</td>
      <td style="text-align:right">${formatCurrency(item.unit_price)}</td>
      <td style="text-align:right">${formatCurrency(item.total_price)}</td>
    </tr>
  `).join('');

  const notesHtml = invoice.notes
    ? `<div class="notes"><strong>Hinweise:</strong><br>${invoice.notes}</div>`
    : '';


  const html = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>Rechnung ${invoice.invoice_no}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: A4; margin: 15mm; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 10pt; color: #222; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #333; padding-bottom: 16px; margin-bottom: 24px; }
    .header-left img { height: 60px; display: block; margin-bottom: 6px; }
    .header-left h1 { font-size: 14pt; font-weight: bold; }
    .header-left p { font-size: 9pt; color: #555; }
    .header-right { text-align: right; }
    .header-right h2 { font-size: 22pt; font-weight: bold; color: #aaa; margin-bottom: 8px; }
    .header-right p { font-size: 9pt; margin-bottom: 2px; }
    .recipient { margin-bottom: 32px; }
    .recipient .sender-line { font-size: 8pt; color: #888; text-decoration: underline; margin-bottom: 6px; }
    .recipient .name { font-weight: bold; font-size: 11pt; }
    .recipient .address { font-size: 9pt; white-space: pre-wrap; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    thead tr { border-bottom: 2px solid #333; }
    th { padding: 6px 4px; text-align: left; font-size: 9pt; }
    td { padding: 8px 4px; font-size: 9pt; border-bottom: 1px solid #ddd; vertical-align: top; }
    .totals { display: flex; justify-content: flex-end; margin-bottom: 32px; }
    .totals-box { width: 50%; }
    .totals-row { display: flex; justify-content: space-between; font-size: 13pt; font-weight: bold; border-top: 2px solid #222; padding-top: 6px; }
    .tax-note { font-size: 7.5pt; color: #888; text-align: right; margin-top: 6px; }
    .notes { font-size: 9pt; margin-bottom: 32px; line-height: 1.5; }
    .footer { border-top: 1px solid #ccc; padding-top: 20px; display: flex; justify-content: space-between; margin-top: 40px; }
    .signature { width: 40%; }
    .signature .greeting { font-size: 9pt; margin-bottom: 6px; }
    .signature .sig-img { height: 50px; display: block; margin-bottom: 0; }
    .signature .sig-line { border-top: 1px solid #999; padding-top: 6px; font-size: 9pt; }
    .signature .sig-line strong { display: block; }
    .bank-info { width: 55%; text-align: right; font-size: 8pt; color: #666; line-height: 1.7; }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <img src="/logo.png" alt="Logo" onerror="this.style.display='none'" />
      <h1>${orgName}</h1>
      <p>${orgHeaderAddress}</p>
    </div>
    <div class="header-right">
      <h2>RECHNUNG</h2>
      <p><strong>Rechnungs-Nr:</strong> ${invoice.invoice_no}</p>
      <p><strong>Datum:</strong> ${formatDate(invoice.invoice_date)}</p>
    </div>
  </div>

  <div class="recipient">
    <div class="name">${contact.name || ''}</div>
    <div class="address">${contact.address || ''}</div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:30px">Pos.</th>
        <th>Beschreibung</th>
        <th style="width:60px;text-align:right">Menge</th>
        <th style="width:90px;text-align:right">Einzelpreis</th>
        <th style="width:90px;text-align:right">Gesamt</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-box">
      <div class="totals-row">
        <span>Rechnungsbetrag:</span>
        <span>${formatCurrency(invoice.total_amount)}</span>
      </div>
      <div class="tax-note">Der Verein ${orgName} ist als gemeinnützig anerkannt und von der Mehrwertsteuer befreit.</div>
    </div>
  </div>

  ${notesHtml}

  <div class="footer">
    <div class="signature">
      <p class="greeting">Mit freundlichen Grüßen</p>
      <img src="/imza.png" alt="Unterschrift" class="sig-img" onerror="this.style.display='none'" />
      <div class="sig-line">
        <strong>${chairName}</strong>
        <span>1. Vorsitzende</span>
      </div>
    </div>
    <div class="bank-info">
      ${bankName || iban ? `<strong>Bankverbindung:</strong><br>
      ${bankName ? `Bank: ${bankName}<br>` : ''}
      ${iban ? `IBAN: ${iban}<br>` : ''}
      ${bic ? `BIC: ${bic}<br><br>` : ''}` : ''}
      ${taxId ? `Steuernummer: ${taxId}<br>` : ''}
      ${vereinsreg ? `Vereinsregister: ${vereinsreg}<br>` : ''}
      ${finanzamt ? `Finanzamt: ${finanzamt}` : ''}
    </div>
  </div>

  <script>
    window.addEventListener('load', function() {
      setTimeout(function() { window.print(); }, 400);
    });
  </script>
</body>
</html>`;

  const printWindow = window.open('', '_blank', 'width=900,height=1100');
  if (!printWindow) {
    alert('Bitte erlauben Sie Pop-ups für diese Seite, um die Rechnung zu drucken.');
    return;
  }
  printWindow.document.write(html);
  printWindow.document.close();
}

export default function BuchhaltungInvoices({ readOnly }) {
  const [invoices, setInvoices] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [settings, setSettings] = useState({});
  const [editingId, setEditingId] = useState(null); // null = yeni fatura, UUID = düzenleme modu

  const [formData, setFormData] = useState({
    contact_id: '',
    invoice_no: `RE-${new Date().getFullYear()}-001`,
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: null,
    notes: 'Wir bitten um Überweisung auf u.a. Konto. Vielen Dank.',
    status: 'Entwurf'
  });
  const [items, setItems] = useState([{ description: '', quantity: 1, unit_price: 0 }]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: invData, error: invError } = await supabase
        .from('accounting_invoices')
        .select('*, accounting_contacts (id, name, address)')
        .order('created_at', { ascending: false });
      if (invError) throw invError;
      setInvoices(invData || []);

      const { data: contactData, error: contactError } = await supabase
        .from('accounting_contacts')
        .select('*')
        .order('name', { ascending: true });
      if (contactError) throw contactError;
      setContacts(contactData || []);

      // Load org settings from site_settings table
      try {
        const { data: settingsData, error: settingsError } = await supabase
          .from('site_settings')
          .select('key, value');
        if (!settingsError && settingsData && settingsData.length > 0) {
          const obj = {};
          settingsData.forEach(s => obj[s.key] = s.value);
          setSettings(obj);
        }
      } catch (e) {
        console.warn('Could not load site_settings:', e);
      }



    } catch (error) {
      console.error('Error fetching data:', error);
      if (error.code !== '42P01') {
        alert('Fehler beim Laden der Daten: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () =>
    items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unit_price)), 0);

  const handleAddItem = () => setItems([...items, { description: '', quantity: 1, unit_price: 0 }]);

  const handleRemoveItem = (index) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.contact_id) { alert('Bitte wählen Sie einen Kontakt aus.'); return; }
    if (!items[0].description) { alert('Bitte fügen Sie mindestens eine Position hinzu.'); return; }

    try {
      const totalAmount = calculateTotal();

      if (editingId) {
        // --- GÜNCELLEME ---
        const { error: updateError } = await supabase
          .from('accounting_invoices')
          .update({ ...formData, total_amount: totalAmount, due_date: null })
          .eq('id', editingId);
        if (updateError) throw updateError;

        // Eski kalemleri sil, yenilerini ekle
        await supabase.from('accounting_invoice_items').delete().eq('invoice_id', editingId);
        const itemsToInsert = items.map((item, idx) => ({
          invoice_id: editingId,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: Number(item.quantity) * Number(item.unit_price),
          sort_order: idx
        }));
        const { error: itemsError } = await supabase.from('accounting_invoice_items').insert(itemsToInsert);
        if (itemsError) throw itemsError;

        alert('Rechnung erfolgreich aktualisiert!');
      } else {
        // --- YENİ KAYIT ---
        const dataToInsert = { ...formData, total_amount: totalAmount, due_date: null };
        const { data: invoiceData, error: invoiceError } = await supabase
          .from('accounting_invoices')
          .insert([dataToInsert])
          .select()
          .single();
        if (invoiceError) throw invoiceError;

        const itemsToInsert = items.map((item, idx) => ({
          invoice_id: invoiceData.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: Number(item.quantity) * Number(item.unit_price),
          sort_order: idx
        }));
        const { error: itemsError } = await supabase.from('accounting_invoice_items').insert(itemsToInsert);
        if (itemsError) throw itemsError;

        alert('Rechnung erfolgreich erstellt!');
      }

      setShowModal(false);
      setEditingId(null);
      setFormData({
        contact_id: '',
        invoice_no: `RE-${new Date().getFullYear()}-${String(invoices.length + 2).padStart(3, '0')}`,
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: null,
        notes: 'Wir bitten um Überweisung auf u.a. Konto. Vielen Dank.',
        status: 'Entwurf'
      });
      setItems([{ description: '', quantity: 1, unit_price: 0 }]);
      fetchData();
    } catch (error) {
      console.error('Error saving invoice:', error);
      alert('Fehler beim Speichern der Rechnung: ' + error.message);
    }
  };

  const handleEdit = async (invoice) => {
    try {
      // Faturanın kalemlerini çek
      const { data: itemsData, error } = await supabase
        .from('accounting_invoice_items')
        .select('*')
        .eq('invoice_id', invoice.id)
        .order('sort_order', { ascending: true });
      if (error) throw error;

      setEditingId(invoice.id);
      setFormData({
        contact_id: String(invoice.contact_id),
        invoice_no: invoice.invoice_no,
        invoice_date: invoice.invoice_date,
        due_date: null,
        notes: invoice.notes || '',
        status: invoice.status
      });
      setItems(itemsData && itemsData.length > 0
        ? itemsData.map(i => ({ description: i.description, quantity: i.quantity, unit_price: i.unit_price }))
        : [{ description: '', quantity: 1, unit_price: 0 }]
      );
      setShowModal(true);
    } catch (error) {
      alert('Fehler beim Laden der Rechnung: ' + error.message);
    }
  };

  const handleDelete = async (invoice) => {
    if (!window.confirm(`Rechnung "${invoice.invoice_no}" wirklich löschen?`)) return;
    try {
      await supabase.from('accounting_invoice_items').delete().eq('invoice_id', invoice.id);
      const { error } = await supabase.from('accounting_invoices').delete().eq('id', invoice.id);
      if (error) throw error;
      fetchData();
    } catch (error) {
      alert('Fehler beim Löschen: ' + error.message);
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      const { error } = await supabase.from('accounting_invoices').update({ status: newStatus }).eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (error) {
      alert('Fehler beim Aktualisieren des Status.');
    }
  };

  const triggerPrint = async (invoice) => {
    try {
      const { data: itemsData, error: itemsError } = await supabase
        .from('accounting_invoice_items')
        .select('*')
        .eq('invoice_id', invoice.id)
        .order('sort_order', { ascending: true });
      if (itemsError) throw itemsError;

      // Find the contact — prefer embedded data, fallback to contacts list
      let contact = invoice.accounting_contacts;
      if (!contact) {
        contact = contacts.find(c => String(c.id) === String(invoice.contact_id));
      }
      if (!contact) {
        alert('Kontakt nicht gefunden.');
        return;
      }

      printInvoiceWindow(invoice, itemsData || [], contact, settings);
    } catch (error) {
      console.error('Print error:', error);
      alert('Fehler beim Vorbereiten des Drucks: ' + error.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Entwurf': return 'bg-gray-100 text-gray-800';
      case 'Gesendet': return 'bg-blue-100 text-blue-800';
      case 'Bezahlt': return 'bg-green-100 text-green-800';
      case 'Storniert': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <FaFileInvoice className="text-blue-600" />
          Rechnungen
        </h2>
        {!readOnly && (
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2"
          >
            <FaPlus /> Neue Rechnung
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-10">Laden...</div>
      ) : invoices.length === 0 ? (
        <div className="text-center py-10 text-gray-500 bg-gray-50 rounded">
          Keine Rechnungen gefunden.<br />
          <span className="text-sm">Bitte stelle sicher, dass du das SQL-Skript für die Rechnungstabellen in Supabase ausgeführt hast.</span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nr / Datum</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Empfänger</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Betrag</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aktionen</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{invoice.invoice_no}</div>
                    <div className="text-sm text-gray-500">{formatDate(invoice.invoice_date)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{invoice.accounting_contacts?.name || ''}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                    {formatCurrency(invoice.total_amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <select
                      value={invoice.status}
                      onChange={(e) => updateStatus(invoice.id, e.target.value)}
                      disabled={readOnly}
                      className={`text-xs font-semibold rounded-full px-3 py-1 border-0 ${!readOnly ? 'cursor-pointer' : 'cursor-not-allowed'} ${getStatusColor(invoice.status)}`}
                    >
                      <option value="Entwurf">Entwurf</option>
                      <option value="Gesendet">Gesendet</option>
                      <option value="Bezahlt">Bezahlt</option>
                      <option value="Storniert">Storniert</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end gap-1">
                    <button
                      onClick={() => handleEdit(invoice)}
                      className="text-yellow-600 hover:text-yellow-900 bg-yellow-50 p-2 rounded"
                      title="Bearbeiten"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => triggerPrint(invoice)}
                      className="text-blue-600 hover:text-blue-900 bg-blue-50 p-2 rounded"
                      title="Drucken / PDF"
                    >
                      <FaPrint />
                    </button>
                    <button
                      onClick={() => handleDelete(invoice)}
                      className="text-red-600 hover:text-red-900 bg-red-50 p-2 rounded"
                      title="Löschen"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal for New Invoice */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full my-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">
                {editingId ? '✏️ Rechnung bearbeiten' : '➕ Neue Rechnung erstellen'}
              </h3>
              <button onClick={() => { setShowModal(false); setEditingId(null); }} className="text-gray-500 hover:text-gray-700">
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Empfänger (Kontakt) *</label>
                  <select
                    required
                    value={formData.contact_id}
                    onChange={(e) => setFormData({ ...formData, contact_id: e.target.value })}
                    className="w-full border rounded p-2"
                  >
                    <option value="">-- Kontakt auswählen --</option>
                    {contacts.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rechnungs-Nr *</label>
                  <input
                    type="text"
                    required
                    value={formData.invoice_no}
                    onChange={(e) => setFormData({ ...formData, invoice_no: e.target.value })}
                    className="w-full border rounded p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Datum *</label>
                  <input
                    type="date"
                    required
                    value={formData.invoice_date}
                    onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                    className="w-full border rounded p-2"
                  />
                </div>
              </div>

              <div className="mb-6">
                <h4 className="font-semibold mb-2">Positionen</h4>
                <div className="bg-gray-50 p-4 rounded border">
                  {items.map((item, index) => (
                    <div key={index} className="flex gap-2 mb-2 items-start">
                      <div className="flex-grow">
                        <input
                          type="text"
                          placeholder="Beschreibung"
                          required
                          value={item.description}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                          className="w-full border rounded p-2 text-sm"
                        />
                      </div>
                      <div className="w-20">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Menge"
                          required
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          className="w-full border rounded p-2 text-sm"
                        />
                      </div>
                      <div className="w-28">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Preis €"
                          required
                          value={item.unit_price}
                          onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                          className="w-full border rounded p-2 text-sm"
                        />
                      </div>
                      <div className="w-28 p-2 text-right bg-white border rounded text-sm font-medium">
                        {formatCurrency(item.quantity * item.unit_price)}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded"
                        disabled={items.length === 1}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="mt-2 text-sm text-blue-600 font-medium hover:underline flex items-center gap-1"
                  >
                    <FaPlus className="text-xs" /> Position hinzufügen
                  </button>
                </div>
                <div className="text-right mt-2 text-lg font-bold">
                  Gesamtbetrag: {formatCurrency(calculateTotal())}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Hinweise (auf Rechnung)</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full border rounded p-2 h-20"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-100"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
                >
                  <FaCheck /> Rechnung speichern
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
