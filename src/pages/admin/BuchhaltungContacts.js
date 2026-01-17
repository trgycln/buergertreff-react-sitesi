import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaUser, FaBuilding, FaHandHoldingHeart, FaPrint } from 'react-icons/fa';

export default function BuchhaltungContacts() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'member', // member, sponsor, supplier, other
    email: '',
    phone: '',
    address: '',
    tax_number: '',
    member_since: '',
    notes: ''
  });

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('accounting_contacts')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) console.error('Error fetching contacts:', error);
    else setContacts(data || []);
    setLoading(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (editingId) {
      // Update
      const { error } = await supabase
        .from('accounting_contacts')
        .update(formData)
        .eq('id', editingId);
        
      if (!error) {
        fetchContacts();
        resetForm();
      } else {
        alert('Fehler beim Aktualisieren: ' + error.message);
      }
    } else {
      // Insert
      const { error } = await supabase
        .from('accounting_contacts')
        .insert([formData]);
        
      if (!error) {
        fetchContacts();
        resetForm();
      } else {
        alert('Fehler beim Hinzufügen: ' + error.message);
      }
    }
  };

  const handleEdit = (contact) => {
    setFormData({
      name: contact.name,
      type: contact.type || 'member',
      email: contact.email || '',
      phone: contact.phone || '',
      address: contact.address || '',
      tax_number: contact.tax_number || '',
      member_since: contact.member_since || '',
      notes: contact.notes || ''
    });
    setEditingId(contact.id);
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Sind Sie sicher, dass Sie diesen Kontakt löschen möchten?')) return;

    const { error } = await supabase
      .from('accounting_contacts')
      .delete()
      .eq('id', id);

    if (error) {
      alert('Fehler beim Löschen (vielleicht wird dieser Kontakt in Transaktionen verwendet?): ' + error.message);
    } else {
      setContacts(contacts.filter(c => c.id !== id));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'member',
      email: '',
      phone: '',
      address: '',
      tax_number: '',
      member_since: '',
      notes: ''
    });
    setEditingId(null);
    setIsFormOpen(false);
  };

  // Yazdırma Fonksiyonları
  const formatDateDE = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const printMembersList = async () => {
    const members = contacts.filter(c => c.type === 'member').sort((a, b) => a.name.localeCompare(b.name));
    
    // Her üye için ilk ödeme tarihini al
    const membersWithFirstPayment = await Promise.all(
      members.map(async (member) => {
        const { data } = await supabase
          .from('accounting_transactions')
          .select('date')
          .eq('contact_id', member.id)
          .eq('type', 'income')
          .order('date', { ascending: true })
          .limit(1);
        
        return {
          ...member,
          first_payment_date: data && data.length > 0 ? data[0].date : null
        };
      })
    );
    
    printContactList(membersWithFirstPayment, 'Mitgliederliste', true);
  };

  const printSponsorsList = async () => {
    const sponsors = contacts.filter(c => c.type === 'sponsor').sort((a, b) => a.name.localeCompare(b.name));
    
    // Her sponsor için ilk bağış tarihini al
    const sponsorsWithFirstPayment = await Promise.all(
      sponsors.map(async (sponsor) => {
        const { data } = await supabase
          .from('accounting_transactions')
          .select('date')
          .eq('contact_id', sponsor.id)
          .eq('type', 'income')
          .order('date', { ascending: true })
          .limit(1);
        
        return {
          ...sponsor,
          first_payment_date: data && data.length > 0 ? data[0].date : null
        };
      })
    );
    
    printContactList(sponsorsWithFirstPayment, 'Spenderliste / Sponsorenliste', false);
  };

  const printContactList = (contactList, title, showFirstPayment = true) => {
    const printWindow = window.open('', '_blank', 'width=1100,height=800');
    if (!printWindow) return;

    let tableRows = '';
    contactList.forEach((contact, index) => {
      const seitDate = showFirstPayment && contact.first_payment_date 
        ? formatDateDE(contact.first_payment_date)
        : (contact.member_since ? formatDateDE(contact.member_since) : '-');
      
      tableRows += `
        <tr>
          <td style="text-align: center; width: 40px;">${index + 1}</td>
          <td style="flex: 1;">${contact.name}</td>
          <td style="width: 200px;">${contact.email || '-'}</td>
          <td style="width: 100px;">${seitDate}</td>
        </tr>`;
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>${title}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            @page {
              size: A4;
              margin: 15mm 15mm 15mm 15mm;
            }
            
            @media print {
              body {
                margin: 0;
                padding: 0;
              }
            }
            
            body {
              font-family: Arial, Helvetica, sans-serif;
              font-size: 10pt;
              line-height: 1.5;
              color: #000;
              margin: 15mm;
              padding: 0;
            }
            
            .document-header {
              text-align: center;
              margin-bottom: 12px;
              padding-bottom: 8px;
              border-bottom: 2px solid #333;
              page-break-after: avoid;
            }
            
            .document-header img {
              max-height: 40px;
              margin-bottom: 4px;
            }
            
            .document-header h1 {
              font-size: 16pt;
              font-weight: bold;
              margin: 4px 0;
              text-transform: uppercase;
            }
            
            .document-header p {
              font-size: 10pt;
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
              padding: 8px 4px;
              text-align: left;
              font-weight: bold;
              font-size: 9.5pt;
            }
            
            td {
              border: 1px solid #ccc;
              padding: 6px 4px;
              text-align: left;
              font-size: 9.5pt;
            }

            .footer {
              margin-top: 20px;
              padding-top: 10px;
              border-top: 1px solid #ccc;
              text-align: center;
              font-size: 9pt;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="document-header">
            <img src="/logo.png" alt="Logo" onerror="this.style.display='none'" />
            <h1>${title}</h1>
            <p>Bürgertreff Wissen e.V.</p>
            <p>Stand: ${formatDateDE(new Date().toISOString().slice(0, 10))}</p>
          </div>
          
          <table>
            <thead>
              <tr>
                <th style="width: 40px; text-align: center;">Nr.</th>
                <th style="flex: 1;">Name</th>
                <th style="width: 200px;">E-Mail</th>
                <th style="width: 100px;">Seit</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>

          <div class="footer">
            <p>Gesamt: ${contactList.length} ${title === 'Mitgliederliste' ? 'Mitglieder' : 'Spender/Sponsoren'}</p>
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

  // Filter contacts
  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getTypeLabel = (type) => {
    switch(type) {
      case 'member': return { label: 'Mitglied', color: 'bg-blue-100 text-blue-800', icon: <FaUser /> };
      case 'sponsor': return { label: 'Sponsor', color: 'bg-yellow-100 text-yellow-800', icon: <FaHandHoldingHeart /> };
      case 'supplier': return { label: 'Lieferant', color: 'bg-purple-100 text-purple-800', icon: <FaBuilding /> };
      default: return { label: 'Sonstiges', color: 'bg-gray-100 text-gray-800', icon: <FaUser /> };
    }
  };

  if (loading) return <div className="text-center p-4">Lade Kontakte...</div>;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-xl font-bold text-gray-800">Kontaktverwaltung</h2>
        
        <div className="flex gap-2 w-full md:w-auto flex-wrap">
          <div className="relative flex-1 md:w-64">
            <input
              type="text"
              placeholder="Suchen..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
          </div>
          <button 
            onClick={printMembersList}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <FaPrint /> <span className="hidden sm:inline">Mitglieder</span>
          </button>
          <button 
            onClick={printSponsorsList}
            className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 flex items-center gap-2"
          >
            <FaPrint /> <span className="hidden sm:inline">Spender</span>
          </button>
          <button 
            onClick={() => { resetForm(); setIsFormOpen(true); }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <FaPlus /> <span className="hidden md:inline">Neuer Kontakt</span>
          </button>
        </div>
      </div>

      {/* FORM MODAL (Simple overlay) */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-bold mb-4 border-b pb-2">
                {editingId ? 'Kontakt bearbeiten' : 'Neuen Kontakt hinzufügen'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name / Firma *</label>
                    <input
                      type="text"
                      name="name"
                      required
                      className="w-full border rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                      value={formData.name}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Typ</label>
                    <select
                      name="type"
                      className="w-full border rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                      value={formData.type}
                      onChange={handleInputChange}
                    >
                      <option value="member">Mitglied</option>
                      <option value="sponsor">Sponsor</option>
                      <option value="supplier">Lieferant / Dienstleister</option>
                      <option value="other">Sonstiges</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">E-Mail</label>
                    <input
                      type="email"
                      name="email"
                      className="w-full border rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                      value={formData.email}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                    <input
                      type="text"
                      name="phone"
                      className="w-full border rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                      value={formData.phone}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Adresse (für Quittungen)</label>
                  <textarea
                    name="address"
                    rows="3"
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Straße, Hausnummer, PLZ, Stadt"
                  ></textarea>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Steuernummer (Optional)</label>
                    <input
                      type="text"
                      name="tax_number"
                      className="w-full border rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                      value={formData.tax_number}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mitglied seit</label>
                    <input
                      type="date"
                      name="member_since"
                      className="w-full border rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                      value={formData.member_since}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notizen</label>
                    <input
                      type="text"
                      name="notes"
                      className="w-full border rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                      value={formData.notes}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
                  >
                    Speichern
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* LISTE */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Typ</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kontakt</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aktionen</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredContacts.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                  Keine Kontakte gefunden.
                </td>
              </tr>
            ) : (
              filteredContacts.map((contact) => {
                const typeInfo = getTypeLabel(contact.type);
                return (
                  <tr key={contact.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{contact.name}</div>
                      {contact.notes && <div className="text-xs text-gray-500">{contact.notes}</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeInfo.color} gap-1`}>
                        {typeInfo.icon} {typeInfo.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{contact.email}</div>
                      <div className="text-sm text-gray-500">{contact.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => handleEdit(contact)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                        title="Bearbeiten"
                      >
                        <FaEdit />
                      </button>
                      <button 
                        onClick={() => handleDelete(contact.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Löschen"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
