import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import { FaPlus, FaEdit, FaTrash, FaSpinner } from 'react-icons/fa';

export default function CashJournal() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    entry_date: new Date().toISOString().slice(0, 10),
    entry_number: '',
    opening_balance: '0',
    cash_in: '0',
    cash_out: '0',
    description: ''
  });

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('accounting_cash_journal')
        .select('*')
        .order('entry_date', { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (error) {
      console.error('Hata:', error);
    }
    setLoading(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculateClosingBalance = () => {
    const opening = parseFloat(formData.opening_balance) || 0;
    const inflow = parseFloat(formData.cash_in) || 0;
    const outflow = parseFloat(formData.cash_out) || 0;
    return (opening + inflow - outflow).toFixed(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const closingBalance = calculateClosingBalance();
    const dataToSubmit = {
      ...formData,
      opening_balance: parseFloat(formData.opening_balance) || 0,
      cash_in: parseFloat(formData.cash_in) || 0,
      cash_out: parseFloat(formData.cash_out) || 0,
      closing_balance: parseFloat(closingBalance)
    };

    try {
      if (editingId) {
        const { error } = await supabase
          .from('accounting_cash_journal')
          .update(dataToSubmit)
          .eq('id', editingId);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('accounting_cash_journal')
          .insert([dataToSubmit]);
        
        if (error) throw error;
      }

      fetchRecords();
      setIsFormOpen(false);
      setEditingId(null);
      setFormData({
        entry_date: new Date().toISOString().slice(0, 10),
        entry_number: '',
        opening_balance: '0',
        cash_in: '0',
        cash_out: '0',
        description: ''
      });
    } catch (error) {
      console.error('Hata:', error);
      alert('Hata: ' + error.message);
    }
  };

  const handleEdit = (record) => {
    setFormData({
      entry_date: record.entry_date,
      entry_number: record.entry_number || '',
      opening_balance: record.opening_balance.toString(),
      cash_in: record.cash_in.toString(),
      cash_out: record.cash_out.toString(),
      description: record.description || ''
    });
    setEditingId(record.id);
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bu kaydı silmek istediğinizden emin misiniz?')) {
      try {
        const { error } = await supabase
          .from('accounting_cash_journal')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        fetchRecords();
      } catch (error) {
        console.error('Hata:', error);
      }
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center p-8"><FaSpinner className="animate-spin text-2xl" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-gray-800">Kasa Defteri (Kassenbuch)</h3>
        <button
          onClick={() => {
            setIsFormOpen(!isFormOpen);
            setEditingId(null);
            setFormData({
              entry_date: new Date().toISOString().slice(0, 10),
              entry_number: '',
              opening_balance: '0',
              cash_in: '0',
              cash_out: '0',
              description: ''
            });
          }}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
        >
          <FaPlus /> Gün Kaydı Ekle
        </button>
      </div>

      {isFormOpen && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h4 className="font-bold mb-4">{editingId ? 'Kasa Kaydını Düzenle' : 'Yeni Kasa Kaydı'}</h4>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tarih *</label>
              <input
                type="date"
                name="entry_date"
                value={formData.entry_date}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gün Numarası</label>
              <input
                type="text"
                name="entry_number"
                value={formData.entry_number}
                onChange={handleInputChange}
                placeholder="001/2026"
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Açılış Bakiyesi (€)</label>
              <input
                type="number"
                name="opening_balance"
                value={formData.opening_balance}
                onChange={handleInputChange}
                step="0.01"
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Giriş Tutar (€)</label>
              <input
                type="number"
                name="cash_in"
                value={formData.cash_in}
                onChange={handleInputChange}
                step="0.01"
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Çıkış Tutar (€)</label>
              <input
                type="number"
                name="cash_out"
                value={formData.cash_out}
                onChange={handleInputChange}
                step="0.01"
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>

            <div className="bg-green-50 border border-green-200 rounded px-3 py-2 flex items-center">
              <div>
                <p className="text-xs text-gray-600">Kapanış Bakiyesi (Otomatik)</p>
                <p className="text-lg font-bold text-green-600">{calculateClosingBalance()} €</p>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="2"
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>

            <div className="md:col-span-2 flex gap-2">
              <button
                type="submit"
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
              >
                Kaydet
              </button>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 transition"
              >
                İptal
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {records.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Henüz kasa kaydı eklenmemiştir.</p>
        ) : (
          records.map(record => (
            <div key={record.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Tarih</p>
                  <p className="font-bold">{new Date(record.entry_date).toLocaleDateString('de-DE')}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Açılış</p>
                  <p className="font-bold">{parseFloat(record.opening_balance).toFixed(2)} €</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Giriş</p>
                  <p className="text-green-600 font-bold">+{parseFloat(record.cash_in).toFixed(2)} €</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Çıkış</p>
                  <p className="text-red-600 font-bold">-{parseFloat(record.cash_out).toFixed(2)} €</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Kapanış</p>
                  <p className="font-bold text-blue-600">{parseFloat(record.closing_balance).toFixed(2)} €</p>
                </div>
              </div>
              <div className="flex gap-2 justify-end mt-3 border-t pt-3">
                <button
                  onClick={() => handleEdit(record)}
                  className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <FaEdit /> Düzenle
                </button>
                <button
                  onClick={() => handleDelete(record.id)}
                  className="text-red-600 hover:text-red-800 flex items-center gap-1"
                >
                  <FaTrash /> Sil
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
