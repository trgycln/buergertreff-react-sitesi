import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaUser, FaBuilding, FaHandHoldingHeart, FaPrint } from 'react-icons/fa';

export default function BuchhaltungContacts({ readOnly }) {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    category: 'person', // 'person' = Privatperson, 'institution' = Unternehmen/Organisation
    type: 'member', // member, sponsor, supplier, other
    email: '',
    phone: '',
    address: '',
    tax_number: '',
    member_since: '',
    notes: '',
    logo_url: '',
    website_url: ''
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

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const uploadLogo = async (file) => {
    const ext = file.name.split('.').pop();
    const fileName = `sponsors/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('page_assets').upload(fileName, file);
    if (error) throw new Error(`Logo-Upload fehlgeschlagen: ${error.message}`);
    const { data: { publicUrl } } = supabase.storage.from('page_assets').getPublicUrl(fileName);
    return publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (readOnly) return;
    
    try {
      let finalLogoUrl = formData.logo_url;
      if (logoFile) {
        finalLogoUrl = await uploadLogo(logoFile);
      }

      // Clean empty date fields - convert empty strings to null
      const dataToSave = {
        ...formData,
        category: formData.category || 'person',
        logo_url: formData.category === 'person' ? null : (finalLogoUrl || null),
        website_url: formData.website_url ? formData.website_url.trim() : null,
        member_since: formData.member_since || null
      };

      if (editingId) {
        // Update
        let { error } = await supabase
          .from('accounting_contacts')
          .update(dataToSave)
          .eq('id', editingId);
          
        if (error && (error.message.includes('category') || error.message.includes('logo_url') || error.message.includes('website_url'))) {
          // Geriye dönük uyumluluk
          const fallbackData = { ...dataToSave };
          delete fallbackData.category;
          delete fallbackData.logo_url;
          delete fallbackData.website_url;
          const retry = await supabase.from('accounting_contacts').update(fallbackData).eq('id', editingId);
          error = retry.error;
        }

        if (!error) {
          // Sponsors tablosu ile de senkronize et
          try {
            const { data: existingSponsor } = await supabase
              .from('sponsors')
              .select('id')
              .ilike('name', `%${formData.name.trim()}%`)
              .maybeSingle();

            const sponsorPayload = {
              name: formData.name.trim(),
              category: formData.category || 'institution',
              logo_url: finalLogoUrl || null,
              website_url: formData.website_url ? formData.website_url.trim() : null,
              is_active: true,
              updated_at: new Date().toISOString()
            };

            if (existingSponsor) {
              await supabase.from('sponsors').update(sponsorPayload).eq('id', existingSponsor.id);
            } else if (formData.category === 'institution' || finalLogoUrl) {
              await supabase.from('sponsors').insert([sponsorPayload]);
            }
          } catch (e) {
            console.log('Sponsors sync:', e);
          }

          fetchContacts();
          resetForm();
        } else {
          alert('Fehler beim Aktualisieren: ' + error.message);
        }
      } else {
        // Insert
        let { error } = await supabase
          .from('accounting_contacts')
          .insert([dataToSave]);
          
        if (error && (error.message.includes('category') || error.message.includes('logo_url') || error.message.includes('website_url'))) {
          const fallbackData = { ...dataToSave };
          delete fallbackData.category;
          delete fallbackData.logo_url;
          delete fallbackData.website_url;
          const retry = await supabase.from('accounting_contacts').insert([fallbackData]);
          error = retry.error;
        }

        if (!error) {
          try {
            if (formData.category === 'institution' || finalLogoUrl) {
              await supabase.from('sponsors').insert([{
                name: formData.name.trim(),
                category: formData.category || 'institution',
                logo_url: finalLogoUrl || null,
                website_url: formData.website_url ? formData.website_url.trim() : null,
                is_active: true
              }]);
            }
          } catch (e) {
            console.log('Sponsors sync insert:', e);
          }

          fetchContacts();
          resetForm();
        } else {
          alert('Fehler beim Hinzufügen: ' + error.message);
        }
      }
    } catch (err) {
      alert('Fehler: ' + err.message);
    }
  };

  const handleEdit = (contact) => {
    if (readOnly) return;
    setFormData({
      name: contact.name,
      category: contact.category || (contact.logo_url || contact.type === 'supplier' || contact.type === 'sponsor' ? 'institution' : 'person'),
      type: contact.type || 'member',
      email: contact.email || '',
      phone: contact.phone || '',
      address: contact.address || '',
      tax_number: contact.tax_number || '',
      member_since: contact.member_since || '',
      notes: contact.notes || '',
      logo_url: contact.logo_url || '',
      website_url: contact.website_url || ''
    });
    setLogoFile(null);
    setLogoPreview(contact.logo_url || '');
    setEditingId(contact.id);
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (readOnly) return;
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
      category: 'person',
      type: 'member',
      email: '',
      phone: '',
      address: '',
      tax_number: '',
      member_since: '',
      notes: '',
      logo_url: '',
      website_url: ''
    });
    setLogoFile(null);
    setLogoPreview('');
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

  const getLastName = (fullName) => {
    if (!fullName) return '';
    const parts = fullName.trim().split(/\s+/);
    return parts[parts.length - 1];
  };

  const getFirstName = (fullName) => {
    if (!fullName) return '';
    const parts = fullName.trim().split(/\s+/);
    return parts.slice(0, -1).join(' ');
  };

  const formatNameAsLastFirst = (fullName) => {
    const firstName = getFirstName(fullName);
    const lastName = getLastName(fullName);
    return firstName ? `${lastName}, ${firstName}` : lastName;
  };

  const escapeHtml = (value) => {
    if (value === null || value === undefined || value === '') return '-';

    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  const printMembersList = async () => {
    const members = contacts.filter(c => c.type === 'member');

    // Her üye için ilk ödeme tarihini ve yıllık aidatları al
    const membersWithFirstPayment = await Promise.all(
      members.map(async (member) => {
        // İlk ödeme tarihi
        const { data: firstPaymentData } = await supabase
          .from('accounting_transactions')
          .select('date')
          .eq('contact_id', member.id)
          .eq('type', 'income')
          .order('date', { ascending: true })
          .limit(1);

        // Tüm işlemleri al (2025 ve 2026 için)
        const { data: allTransactions } = await supabase
          .from('accounting_transactions')
          .select('amount, date, description, accounting_categories(name)')
          .eq('contact_id', member.id)
          .eq('type', 'income');

        // 2025 ve 2026 aidatlarını hesapla
        const calculateYearPayment = (year) => {
          if (!allTransactions) return 0;

          return allTransactions
            .filter(t => {
              const catName = t.accounting_categories?.name?.toLowerCase() || '';
              const desc = t.description?.toLowerCase() || '';
              return catName.includes('mitglied') || catName.includes('beitrag') || desc.includes('beitrag');
            })
            .filter(t => {
              const trxDateYear = new Date(t.date).getFullYear();
              const desc = t.description || '';
              const yearMatch = desc.match(/202[0-9]/);
              const effectiveYear = yearMatch ? parseInt(yearMatch[0]) : trxDateYear;
              return effectiveYear === year;
            })
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);
        };

        return {
          ...member,
          first_payment_date: firstPaymentData && firstPaymentData.length > 0 ? firstPaymentData[0].date : null,
          payment_2025: calculateYearPayment(2025),
          payment_2026: calculateYearPayment(2026)
        };
      })
    );

    // Soyadına göre alfabetik sıralama
    const sortedMembers = membersWithFirstPayment.sort((a, b) =>
      getLastName(a.name).localeCompare(getLastName(b.name), 'de-DE')
    );

    printContactList(sortedMembers, 'Mitgliederliste', true);
  };

  const printSponsorsList = async () => {
    const { data: transactions, error } = await supabase
      .from('accounting_transactions')
      .select('contact_id, date, amount, description, accounting_categories(name)')
      .eq('type', 'income')
      .not('contact_id', 'is', null)
      .order('date', { ascending: true });

    if (error) {
      alert('Fehler beim Laden der Spenderliste: ' + error.message);
      return;
    }

    const donationStatsByContactId = new Map();
    const donationKeywords = ['spende', 'zuwendung', 'donation', 'bagis', 'bağış', 'sponsor'];
    const nonDonationKeywords = ['mitglied', 'beitrag', 'aidat', 'darlehen', 'kredit'];

    (transactions || []).forEach((trx) => {
      const categoryName = trx.accounting_categories?.name?.toLowerCase() || '';
      const description = trx.description?.toLowerCase() || '';
      const text = `${categoryName} ${description}`;
      const isExcluded = nonDonationKeywords.some((keyword) => text.includes(keyword));
      const isDonation = donationKeywords.some((keyword) => text.includes(keyword));

      if (!isDonation || isExcluded || !trx.contact_id) return;

      const currentStats = donationStatsByContactId.get(trx.contact_id) || {
        firstDate: trx.date,
        lastDate: trx.date,
        totalAmount: 0,
        donationDates: []
      };

      const trxAmount = parseFloat(trx.amount) || 0;
      currentStats.totalAmount += trxAmount;
      currentStats.donationDates.push(trx.date);

      if (trx.date < currentStats.firstDate) currentStats.firstDate = trx.date;
      if (trx.date > currentStats.lastDate) currentStats.lastDate = trx.date;

      donationStatsByContactId.set(trx.contact_id, currentStats);
    });

    const donorsWithFirstPayment = contacts
      .filter((contact) => donationStatsByContactId.has(contact.id))
      .map((contact) => {
        const stats = donationStatsByContactId.get(contact.id);
        return {
        ...contact,
        first_payment_date: stats.firstDate,
        last_payment_date: stats.lastDate,
        total_donation_amount: stats.totalAmount,
        donation_dates: Array.from(new Set(stats.donationDates)).sort()
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'de-DE'));

    printContactList(donorsWithFirstPayment, 'Spenderliste', false);
  };

  const printContactList = (contactList, title, showFirstPayment = true) => {
    const printWindow = window.open('', '_blank', 'width=1100,height=800');
    if (!printWindow) return;
    const isDonorList = title === 'Spenderliste';
    const isMemberList = title === 'Mitgliederliste';
    const totalDonationSum = isDonorList
      ? contactList.reduce((sum, contact) => sum + (parseFloat(contact.total_donation_amount) || 0), 0)
      : 0;
    const totalDonationSumText = totalDonationSum.toLocaleString('de-DE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    let tableRows = '';
    contactList.forEach((contact, index) => {
      const seitDate = showFirstPayment && contact.first_payment_date
        ? formatDateDE(contact.first_payment_date)
        : (contact.member_since ? formatDateDE(contact.member_since) : '-');
      const donorTotalAmount = typeof contact.total_donation_amount === 'number'
        ? `${contact.total_donation_amount.toFixed(2)} €`
        : '-';
      const donorDates = Array.isArray(contact.donation_dates) && contact.donation_dates.length > 0
        ? contact.donation_dates.map((date) => formatDateDE(date)).join(', ')
        : '-';
      const displayName = isMemberList ? formatNameAsLastFirst(contact.name) : contact.name;
      const safeName = escapeHtml(displayName);
      const safeEmail = escapeHtml(contact.email);
      const safePhone = escapeHtml(contact.phone);
      const safeAddress = escapeHtml(contact.address);
      const safeTaxNumber = escapeHtml(contact.tax_number);
      const safeNotes = escapeHtml(contact.notes);
      
      // 2025 ve 2026 aidatları (sadece üye listesinde göster)
      const payment2025 = contact.payment_2025 ? `${contact.payment_2025.toFixed(0)} €` : '-';
      const payment2026 = contact.payment_2026 ? `${contact.payment_2026.toFixed(0)} €` : '-';
      
      tableRows += `
        <tr>
          <td style="text-align: center; width: 28px;">${index + 1}</td>
          <td style="width: 120px; word-break: normal; overflow-wrap: break-word;">${safeName}</td>
          <td style="width: 140px; word-break: break-word;">${safeEmail}</td>
          ${isDonorList ? `
          <td style="width: 85px; text-align: right; font-weight: bold;">${donorTotalAmount}</td>
          <td style="width: 240px; font-size: 8.2pt; text-align: center;">${donorDates}</td>
          ` : `
          <td style="width: 85px; text-align: center;">${safePhone}</td>
          <td style="width: 150px;">${safeAddress}</td>
          <td style="width: 70px; text-align: center;">${safeTaxNumber}</td>
          <td style="width: 70px; text-align: center;">${escapeHtml(seitDate)}</td>
          <td style="width: 100px;">${safeNotes}</td>
          `}
          ${title === 'Mitgliederliste' ? `
          <td style="width: 55px; text-align: center; font-weight: bold;">${payment2025}</td>
          <td style="width: 55px; text-align: center; font-weight: bold;">${payment2026}</td>
          ` : ''}
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
              size: A4 landscape;
              margin: 8mm;
            }
            
            @media print {
              body {
                margin: 0;
                padding: 0;
              }
            }
            
            body {
              font-family: Arial, Helvetica, sans-serif;
              font-size: 8.5pt;
              line-height: 1.3;
              color: #000;
              margin: 8mm;
              padding: 0;
            }
            
            .document-header {
              text-align: center;
              margin-bottom: 8px;
              padding-bottom: 6px;
              border-bottom: 2px solid #333;
              page-break-after: avoid;
            }
            
            .document-header img {
              max-height: 40px;
              margin-bottom: 4px;
            }
            
            .document-header h1 {
              font-size: 13pt;
              font-weight: bold;
              margin: 4px 0;
              text-transform: uppercase;
            }
            
            .document-header p {
              font-size: 8.5pt;
              color: #555;
              margin: 2px 0;
            }
            
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
              table-layout: fixed;
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
              padding: 6px 3px;
              text-align: left;
              font-weight: bold;
              font-size: 8pt;
            }
            
            td {
              border: 1px solid #ccc;
              padding: 5px 3px;
              text-align: left;
              font-size: 8pt;
              word-break: break-word;
              vertical-align: top;
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
                <th style="width: 28px; text-align: center;">Nr.</th>
                <th style="width: 120px;">Name</th>
                <th style="width: 140px;">E-Mail</th>
                ${title === 'Spenderliste' ? `
                <th style="width: 85px; text-align: right;">Gesamt</th>
                <th style="width: 240px; text-align: center;">Spende Daten</th>
                ` : `
                <th style="width: 85px; text-align: center;">Telefon</th>
                <th style="width: 150px;">Adresse</th>
                <th style="width: 70px; text-align: center;">Steuernr.</th>
                <th style="width: 70px; text-align: center;">Mitglied seit</th>
                <th style="width: 100px;">Notiz</th>
                `}
                ${title === 'Mitgliederliste' ? `
                <th style="width: 55px; text-align: center;">2025</th>
                <th style="width: 55px; text-align: center;">2026</th>
                ` : ''}
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>

          <div class="footer">
            <p>Gesamt: ${contactList.length} ${title === 'Mitgliederliste' ? 'Mitglieder' : 'Spender/Sponsoren'}</p>
            ${isDonorList ? `<p>Spende Gesamtbetrag: ${totalDonationSumText} €</p>` : ''}
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
      case 'former_member': return { label: 'Ehem. Mitglied', color: 'bg-gray-100 text-gray-400', icon: <FaUser /> };
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
          {!readOnly && (
            <button 
              onClick={() => { resetForm(); setIsFormOpen(true); }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <FaPlus /> <span className="hidden md:inline">Neuer Kontakt</span>
            </button>
          )}
        </div>
      </div>

      {/* FORM MODAL (Simple overlay) */}
      {isFormOpen && !readOnly && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-bold mb-4 border-b pb-2">
                {editingId ? 'Kontakt bearbeiten' : 'Neuen Kontakt hinzufügen'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Kategorie (Şahıs / Kurum) Seçimi */}
                <div className="bg-blue-50/60 p-3 rounded-lg border border-blue-100">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Kategorie (Art des Kontakts) *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                      formData.category === 'person' 
                        ? 'bg-white border-blue-600 text-blue-900 font-bold shadow-sm' 
                        : 'bg-white/50 border-gray-200 text-gray-600 hover:bg-white'
                    }`}>
                      <input
                        type="radio"
                        name="category"
                        value="person"
                        checked={formData.category === 'person'}
                        onChange={handleInputChange}
                        className="accent-blue-600"
                      />
                      <span className="text-xs">👤 Privatperson (Şahıs)</span>
                    </label>

                    <label className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                      formData.category === 'institution' 
                        ? 'bg-white border-blue-600 text-blue-900 font-bold shadow-sm' 
                        : 'bg-white/50 border-gray-200 text-gray-600 hover:bg-white'
                    }`}>
                      <input
                        type="radio"
                        name="category"
                        value="institution"
                        checked={formData.category === 'institution'}
                        onChange={handleInputChange}
                        className="accent-blue-600"
                      />
                      <span className="text-xs">🏢 Unternehmen / Institution (Kurum)</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {formData.category === 'person' ? 'Vor- und Nachname *' : 'Name des Unternehmens / der Institution *'}
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      className="w-full border rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder={formData.category === 'person' ? 'z. B. Armin Uber' : 'z. B. Sparkasse Westerwald-Sieg'}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rolle im Verein</label>
                    <select
                      name="type"
                      className="w-full border rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                      value={formData.type}
                      onChange={handleInputChange}
                    >
                      <option value="member">Mitglied</option>
                      <option value="former_member">Ehem. Mitglied (ausgetreten)</option>
                      <option value="sponsor">Sponsor / Förderer</option>
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

                {/* Logo ve Website URL */}
                <div className="border-t pt-3 mt-2 bg-gray-50 p-3 rounded-lg">
                  <div className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <FaBuilding /> Sponsor / Kurum Bilgileri (Website & Logo)
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Website URL</label>
                      <input
                        type="url"
                        name="website_url"
                        className="w-full border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                        value={formData.website_url || ''}
                        onChange={handleInputChange}
                        placeholder="https://www.beispiel.de"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Logo</label>
                      <div className="flex items-center gap-2">
                        {logoPreview && (
                          <div className="w-10 h-10 rounded border bg-white flex items-center justify-center overflow-hidden flex-shrink-0">
                            <img src={logoPreview} alt="Logo" className="max-w-full max-h-full object-contain" />
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoChange}
                          className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
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
                      placeholder="YYYY-MM-DD"
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
              {!readOnly && (
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aktionen</th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredContacts.length === 0 ? (
              <tr>
                <td colSpan={readOnly ? "3" : "4"} className="px-6 py-4 text-center text-gray-500">
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
                    {!readOnly && (
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
                    )}
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
