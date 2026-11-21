import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import {
  FaSpinner,
  FaPaperclip,
  FaExternalLinkAlt,
  FaCheckCircle,
  FaExclamationTriangle,
  FaUpload,
  FaEye,
  FaTimes,
  FaFilter
} from 'react-icons/fa';

export default function Vouchers({ readOnly }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [years, setYears] = useState([]);
  const [docFilter, setDocFilter] = useState('all'); // 'all' | 'with_doc' | 'missing_doc'
  const [uploadingRowId, setUploadingRowId] = useState(null);
  const [dragOverRowId, setDragOverRowId] = useState(null);
  const [previewModal, setPreviewModal] = useState({
    isOpen: false,
    trx: null,
    signedUrl: null,
    isPdf: false,
    loading: false
  });

  useEffect(() => {
    const currentYear = new Date().getFullYear();
    setYears([currentYear - 2, currentYear - 1, currentYear, currentYear + 1]);
    fetchTransactions();
  }, [filterYear]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('accounting_transactions')
        .select('*, accounting_categories(name), accounting_accounts(name), accounting_contacts(name)')
        .gte('date', `${filterYear}-01-01`)
        .lte('date', `${filterYear}-12-31`)
        .order('date', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
    setLoading(false);
  };

  const openDocument = async (path) => {
    if (!path) return;
    const { data, error } = await supabase.storage.from('receipts').createSignedUrl(path, 60);
    if (error) { alert(error.message); return; }
    window.open(data.signedUrl, '_blank');
  };

  const openPreviewModal = async (trx) => {
    if (!trx?.document_url) return;
    const isPdf = trx.document_url.toLowerCase().split('?')[0].endsWith('.pdf');
    setPreviewModal({ isOpen: true, trx, signedUrl: null, isPdf, loading: true });

    const { data, error } = await supabase.storage.from('receipts').createSignedUrl(trx.document_url, 300);
    if (error) {
      alert('Fehler beim Laden des Belegs: ' + error.message);
      setPreviewModal({ isOpen: false, trx: null, signedUrl: null, isPdf: false, loading: false });
      return;
    }

    setPreviewModal(prev =>
      prev.isOpen && prev.trx?.id === trx.id
        ? { ...prev, signedUrl: data.signedUrl, loading: false }
        : prev
    );
  };

  const closePreviewModal = () => {
    setPreviewModal({ isOpen: false, trx: null, signedUrl: null, isPdf: false, loading: false });
  };

  const uploadDocumentForTransaction = async (trxId, file) => {
    if (readOnly || !trxId || !file) return;
    try {
      setUploadingRowId(trxId);
      const fileExt = file.name.includes('.') ? file.name.split('.').pop() : '';
      const randomName = `${Date.now()}_${Math.random().toString(36).substring(2)}`;
      const filePath = fileExt ? `${randomName}.${fileExt}` : randomName;

      const { error: uploadError } = await supabase.storage.from('receipts').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase
        .from('accounting_transactions')
        .update({ document_url: filePath })
        .eq('id', trxId);
      if (updateError) throw updateError;

      setTransactions(prev =>
        prev.map(t => (t.id === trxId ? { ...t, document_url: filePath } : t))
      );

      if (previewModal.isOpen && previewModal.trx?.id === trxId) {
        const isPdf = filePath.toLowerCase().split('?')[0].endsWith('.pdf');
        const { data: signedData } = await supabase.storage.from('receipts').createSignedUrl(filePath, 300);
        setPreviewModal(prev =>
          prev.isOpen && prev.trx?.id === trxId
            ? {
                ...prev,
                trx: { ...prev.trx, document_url: filePath },
                signedUrl: signedData?.signedUrl || prev.signedUrl,
                isPdf,
                loading: false
              }
            : prev
        );
      }
    } catch (error) {
      alert('Upload-Fehler: ' + error.message);
    } finally {
      setUploadingRowId(null);
    }
  };

  const handleRowFileSelect = async (trxId, e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    await uploadDocumentForTransaction(trxId, file);
  };

  const handleRowDragOver = (trxId, e) => {
    if (readOnly) return;
    e.preventDefault();
    e.stopPropagation();
    if (dragOverRowId !== trxId) setDragOverRowId(trxId);
  };

  const handleRowDragLeave = (trxId, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragOverRowId === trxId) setDragOverRowId(null);
  };

  const handleRowDrop = async (trxId, e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverRowId(null);
    if (readOnly) return;
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      await uploadDocumentForTransaction(trxId, file);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center p-8"><FaSpinner className="animate-spin text-2xl" /></div>;
  }

  const totalCount = transactions.length;
  const withDocCount = transactions.filter(t => Boolean(t.document_url)).length;
  const missingDocCount = totalCount - withDocCount;
  const completionRate = totalCount > 0 ? Math.round((withDocCount / totalCount) * 100) : 100;

  const displayedTransactions = transactions.filter(t => {
    if (docFilter === 'with_doc') return Boolean(t.document_url);
    if (docFilter === 'missing_doc') return !t.document_url;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h3 className="text-xl font-bold text-gray-800">Buchungsbelege (Evrak Kontrol &amp; Yükleme)</h3>
          <p className="text-sm text-gray-600">Rechnungen, Quittungen und Bankbelege – eksik ve yüklü evrak takibi</p>
        </div>
        <select
          value={filterYear}
          onChange={(e) => setFilterYear(parseInt(e.target.value, 10))}
          className="border border-gray-300 rounded px-3 py-2 bg-white"
        >
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Beleg-Kontrolle / Evrak Durumu Özeti */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setDocFilter('all')}
            className={`text-left p-3 rounded-lg border transition ${
              docFilter === 'all'
                ? 'bg-white border-blue-500 ring-2 ring-blue-100 shadow-sm'
                : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-xs font-semibold uppercase text-gray-500">Gesamt ({filterYear})</div>
            <div className="text-2xl font-bold text-gray-800 mt-1">{totalCount}</div>
            <div className="text-xs text-gray-500 mt-0.5">Tüm kayıtlar</div>
          </button>

          <button
            type="button"
            onClick={() => setDocFilter('with_doc')}
            className={`text-left p-3 rounded-lg border transition ${
              docFilter === 'with_doc'
                ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-100 shadow-sm'
                : 'bg-white border-emerald-200 hover:bg-emerald-50/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-emerald-700">Beleg vorhanden (Yüklü)</span>
              <FaCheckCircle className="text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-emerald-700 mt-1">{withDocCount}</div>
            <div className="text-xs text-emerald-600 mt-0.5">Evrakı yüklenmiş kayıt</div>
          </button>

          <button
            type="button"
            onClick={() => setDocFilter('missing_doc')}
            className={`text-left p-3 rounded-lg border transition ${
              docFilter === 'missing_doc'
                ? 'bg-rose-50 border-rose-500 ring-2 ring-rose-100 shadow-sm'
                : 'bg-white border-rose-200 hover:bg-rose-50/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-rose-700">Beleg fehlt (Eksik)</span>
              <FaExclamationTriangle className="text-rose-600" />
            </div>
            <div className="text-2xl font-bold text-rose-700 mt-1">{missingDocCount}</div>
            <div className="text-xs text-rose-600 mt-0.5">Evrak yüklenmesi gereken</div>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="flex-1">
            <div className="flex justify-between text-xs font-medium text-gray-600 mb-1">
              <span>Evrak Tamamlanma Oranı ({filterYear})</span>
              <span>{completionRate}% ({withDocCount}/{totalCount})</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  completionRate === 100 ? 'bg-emerald-500' : completionRate >= 50 ? 'bg-blue-500' : 'bg-amber-500'
                }`}
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-gray-500 flex items-center gap-1 mr-1"><FaFilter /> Filtre:</span>
            <button
              type="button"
              onClick={() => setDocFilter('all')}
              className={`px-3 py-1 rounded-md text-xs font-semibold border transition ${
                docFilter === 'all' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
              }`}
            >
              Alle ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => setDocFilter('with_doc')}
              className={`px-3 py-1 rounded-md text-xs font-semibold border transition ${
                docFilter === 'with_doc' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50'
              }`}
            >
              Mit Beleg ({withDocCount})
            </button>
            <button
              type="button"
              onClick={() => setDocFilter('missing_doc')}
              className={`px-3 py-1 rounded-md text-xs font-semibold border transition ${
                docFilter === 'missing_doc' ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-rose-700 border-rose-300 hover:bg-rose-50'
              }`}
            >
              Ohne Beleg ({missingDocCount})
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-200">
        {displayedTransactions.length === 0 ? (
          <p className="text-gray-500 text-center py-12">
            {transactions.length === 0
              ? 'Keine Transaktionen gefunden.'
              : 'Bu filtreye uygun kayıt bulunamadı.'}
          </p>
        ) : (
          displayedTransactions.map(trx => {
            const hasDoc = Boolean(trx.document_url);
            const isUploading = uploadingRowId === trx.id;
            const isDragOver = dragOverRowId === trx.id;

            return (
              <div
                key={trx.id}
                onDragOver={(e) => handleRowDragOver(trx.id, e)}
                onDragLeave={(e) => handleRowDragLeave(trx.id, e)}
                onDrop={(e) => handleRowDrop(trx.id, e)}
                className={`p-4 transition ${
                  isDragOver
                    ? 'bg-blue-50 ring-2 ring-inset ring-blue-400'
                    : hasDoc
                    ? 'hover:bg-gray-50'
                    : 'bg-rose-50/25 hover:bg-rose-50/50'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                      <span className="text-sm font-semibold text-gray-700">
                        {new Date(trx.date).toLocaleDateString('de-DE')}
                      </span>
                      {trx.receipt_no && (
                        <span className="text-xs font-mono font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded">
                          Beleg: #{trx.receipt_no}
                        </span>
                      )}
                      {trx.file_no && (
                        <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded">
                          Ordner: {trx.file_no}
                        </span>
                      )}
                      <span className={`text-sm font-bold ${trx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {trx.type === 'income' ? '+' : '-'} {parseFloat(trx.amount).toFixed(2)} €
                      </span>
                    </div>
                    <p className="text-sm text-gray-800 font-medium">
                      {trx.accounting_categories?.name || 'Sonstige'}
                      {trx.accounting_accounts?.name && (
                        <span className="text-xs font-normal text-gray-500 ml-2">({trx.accounting_accounts.name})</span>
                      )}
                    </p>
                    {trx.description && <p className="text-xs text-gray-600 mt-1">{trx.description}</p>}
                    {trx.accounting_contacts && (
                      <p className="text-xs text-gray-500 mt-1">Kontakt: {trx.accounting_contacts.name}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {isUploading ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200">
                        <FaSpinner className="animate-spin" /> Yükleniyor...
                      </span>
                    ) : hasDoc ? (
                      <>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
                          <FaCheckCircle /> Beleg vorhanden (Yüklü)
                        </span>
                        <button
                          type="button"
                          onClick={() => openPreviewModal(trx)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition"
                          title="Beleg ansehen / Önizle"
                        >
                          <FaEye /> Ansehen
                        </button>
                        <button
                          type="button"
                          onClick={() => openDocument(trx.document_url)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition"
                          title="In neuem Tab öffnen / Yeni sekmede aç"
                        >
                          <FaPaperclip /> <FaExternalLinkAlt className="text-[10px]" />
                        </button>
                        {!readOnly && (
                          <label
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 text-xs font-semibold cursor-pointer transition"
                            title="Evrakı değiştir"
                          >
                            <FaUpload className="text-[11px]" /> Değiştir
                            <input
                              type="file"
                              accept="image/*,.pdf"
                              className="hidden"
                              onChange={(e) => handleRowFileSelect(trx.id, e)}
                            />
                          </label>
                        )}
                      </>
                    ) : (
                      <>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-semibold">
                          <FaExclamationTriangle /> Beleg fehlt (Eksik)
                        </span>
                        {!readOnly && (
                          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold cursor-pointer shadow-sm transition">
                            <FaUpload /> Beleg hochladen / Evrak Yükle
                            <input
                              type="file"
                              accept="image/*,.pdf"
                              className="hidden"
                              onChange={(e) => handleRowFileSelect(trx.id, e)}
                            />
                          </label>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Document Preview Modal */}
      {previewModal.isOpen && previewModal.trx && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
            <div className="flex justify-between items-start gap-4 px-6 py-4 border-b bg-gray-50">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Belegvorschau / Evrak Önizleme</h3>
                <p className="text-xs text-gray-600 mt-1">
                  {new Date(previewModal.trx.date).toLocaleDateString('de-DE')}
                  {previewModal.trx.receipt_no ? ` • Beleg-Nr: ${previewModal.trx.receipt_no}` : ''}
                  {previewModal.trx.accounting_categories?.name ? ` • ${previewModal.trx.accounting_categories.name}` : ''}
                  {' • '}
                  <span className={previewModal.trx.type === 'income' ? 'text-green-700 font-semibold' : 'text-red-700 font-semibold'}>
                    {previewModal.trx.type === 'income' ? '+' : '-'}{parseFloat(previewModal.trx.amount).toFixed(2)} €
                  </span>
                  {previewModal.trx.description ? ` • ${previewModal.trx.description}` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={closePreviewModal}
                className="p-2 text-gray-400 hover:text-gray-700 rounded-lg transition"
                aria-label="Schließen"
              >
                <FaTimes className="text-lg" />
              </button>
            </div>

            <div className="p-4 flex-1 overflow-auto bg-gray-100 flex items-center justify-center min-h-[300px]">
              {previewModal.loading ? (
                <div className="flex flex-col items-center gap-2 text-gray-600">
                  <FaSpinner className="animate-spin text-3xl text-blue-600" />
                  <span className="text-sm">Beleg wird geladen...</span>
                </div>
              ) : previewModal.isPdf && previewModal.signedUrl ? (
                <iframe
                  src={previewModal.signedUrl}
                  title="Beleg PDF"
                  className="w-full h-[65vh] rounded border bg-white"
                />
              ) : previewModal.signedUrl ? (
                <img
                  src={previewModal.signedUrl}
                  alt="Beleg"
                  className="max-w-full max-h-[65vh] mx-auto rounded shadow object-contain bg-white"
                />
              ) : null}
            </div>

            <div className="flex flex-wrap justify-between items-center gap-2 px-6 py-3 border-t bg-white">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => openDocument(previewModal.trx.document_url)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold transition"
                >
                  <FaExternalLinkAlt /> Yeni Sekmede Aç
                </button>
                {!readOnly && (
                  <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold cursor-pointer transition">
                    <FaUpload /> Yeni Evrak Yükle / Değiştir
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={(e) => handleRowFileSelect(previewModal.trx.id, e)}
                    />
                  </label>
                )}
              </div>
              <button
                type="button"
                onClick={closePreviewModal}
                className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-900 text-white text-xs font-semibold transition"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

