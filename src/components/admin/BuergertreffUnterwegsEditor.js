// src/components/admin/BuergertreffUnterwegsEditor.js
// Bu, geçmiş gezilerin listesini gösterir ve form sayfalarına yönlendirir.

import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient'; // Yolun doğru olduğundan emin olun
import { Link } from 'react-router-dom';
import { FaPlus, FaPencilAlt, FaTrashAlt } from 'react-icons/fa';

// Tarih formatlama (kısa versiyon)
const formatDateShort = (dateString) => {
    if (!dateString) return '-';
    try {
        // Sadece metin olarak gösteriyoruz (trip_date_text)
        return dateString;
    } catch (e) {
        return dateString;
    }
};

export default function BuergertreffUnterwegsEditor({ pageInfo }) {
    const [pastTrips, setPastTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

    // Tüm geçmiş gezileri ('past_trips') yükle
    useEffect(() => {
        const fetchPastTrips = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('past_trips')
                .select('id, title, trip_date_text') // Gerekli sütunları seç
                .order('created_at', { ascending: false }); // En yeni en üstte
            
            if (data) {
                setPastTrips(data);
            } else {
                 setMessage(`Fehler beim Laden: ${error?.message}`);
            }
            setLoading(false);
        };
        fetchPastTrips();
    }, []);

    // Geçmiş geziyi silme
    const handleDelete = async (tripId, title) => {
        if (!window.confirm(`Sind Sie sicher, dass Sie den Archiv-Eintrag "${title}" und alle zugehörigen Fotos löschen möchten?`)) {
            return;
        }

        setMessage('Lösche...');
        setLoading(true);

        // 'past_trips'den sil (CASCADE sayesinde galeri de silinir)
        const { error } = await supabase
            .from('past_trips')
            .delete()
            .eq('id', tripId);

        if (error) {
            setMessage(`Fehler beim Löschen: ${error.message}`);
        } else {
            setMessage('Eintrag erfolgreich gelöscht.');
            setPastTrips(pastTrips.filter(t => t.id !== tripId)); // Listeden kaldır
        }
        setLoading(false);
        setTimeout(() => setMessage(''), 3000);
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Lade Archivliste...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Başlık ve "Yeni Ekle" Butonu */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h2 className="text-2xl font-semibold text-rcDarkGray">
                    Archiv "Bürgertreff Unterwegs" ({pastTrips.length})
                </h2>
                <Link
                    to="/admin/edit/buergertreff-unterwegs/new" // Yeni ekleme formuna link
                    className="flex items-center px-4 py-2 bg-rcBlue text-white font-semibold rounded-md shadow hover:bg-blue-700 transition-colors"
                >
                    <FaPlus className="mr-2" />
                    Neuen Archiv-Eintrag erstellen
                </Link>
            </div>

            {/* Mesaj Alanı */}
            {message && (
                <p className={`p-3 rounded-md border text-sm ${message.startsWith('Fehler') ? 'bg-red-100 text-rcRed border-red-300' : 'bg-green-100 text-green-800 border-green-300'}`}>
                    {message}
                </p>
            )}

            {/* Arşiv Tablosu */}
            <div className="bg-white shadow-lg rounded-lg overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-rcDarkGray uppercase tracking-wider">Titel</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-rcDarkGray uppercase tracking-wider">Datum (Text)</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-rcDarkGray uppercase tracking-wider">Aktionen</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {pastTrips.length === 0 && (
                            <tr>
                                <td colSpan="3" className="px-6 py-4 text-center text-gray-500 italic">
                                    Noch keine Einträge im Archiv.
                                </td>
                            </tr>
                        )}
                        {pastTrips.map(trip => (
                            <tr key={trip.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-rcDarkGray">{trip.title}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-500">{formatDateShort(trip.trip_date_text)}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                                    {/* Düzenleme Butonu */}
                                    <Link
                                        to={`/admin/edit/buergertreff-unterwegs/edit/${trip.id}`} // Düzenleme formuna link
                                        className="text-rcBlue hover:text-blue-700"
                                        title="Bearbeiten"
                                    >
                                        <FaPencilAlt />
                                    </Link>
                                    {/* Silme Butonu */}
                                    <button
                                        onClick={() => handleDelete(trip.id, trip.title)}
                                        className="text-rcRed hover:text-red-700"
                                        title="Löschen"
                                        disabled={loading} // Silme işlemi sırasında deaktif
                                    >
                                        <FaTrashAlt />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}