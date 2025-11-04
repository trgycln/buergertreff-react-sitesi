// src/pages/admin/PresseList.js
// YENİ SAYFA: Tüm basın makalelerini yönetmek için liste sayfası.

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { FaPlus, FaEdit, FaTrash, FaEye, FaEyeSlash } from 'react-icons/fa';

// Tarihi "dd.mm.yyyy" formatına çevirir
const formatDisplayDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    } catch (e) {
        return dateString;
    }
};

export default function PresseList() {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState(''); // Silme işlemi için mesaj

    // Supabase'den tüm makaleleri çek
    useEffect(() => {
        const fetchArticles = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('presse_articles')
                .select('*')
                .order('article_date', { ascending: false }); // En yeni tarihli olan en üstte

            if (error) {
                console.error("Fehler beim Laden der Presseartikel:", error);
                setError("Presseartikel konnten nicht geladen werden.");
            } else {
                setArticles(data);
            }
            setLoading(false);
        };
        fetchArticles();
    }, []);

    // Makale silme fonksiyonu
    const handleDelete = async (id) => {
        if (window.confirm("Sind Sie sicher, dass Sie diesen Artikel löschen möchten?")) {
            setLoading(true);
            const { error } = await supabase
                .from('presse_articles')
                .delete()
                .eq('id', id);

            if (error) {
                console.error("Fehler beim Löschen:", error);
                setMessage(`Fehler beim Löschen: ${error.message}`);
            } else {
                // Başarıyla silindikten sonra listeden de kaldır
                setArticles(articles.filter(article => article.id !== id));
                setMessage("Artikel erfolgreich gelöscht.");
            }
            setLoading(false);
            setTimeout(() => setMessage(''), 3000);
        }
    };

    if (loading && articles.length === 0) {
        return <p>Lade Presseartikel...</p>;
    }

    if (error) {
        return <p className="text-rcRed">{error}</p>;
    }

    return (
        <div className="space-y-6">
            {/* Mesaj alanı */}
            {message && (
                <p className={`p-3 rounded-md text-sm ${message.startsWith('Fehler') ? 'bg-red-100 text-rcRed' : 'bg-green-100 text-green-800'}`}>
                    {message}
                </p>
            )}

            {/* Başlık ve Yeni Ekle Butonu */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold text-rcDarkGray">Presseartikel Verwalten</h1>
                <Link
                    to="/admin/presse/neu"
                    className="flex items-center px-4 py-2 bg-rcBlue text-white font-semibold rounded-md shadow hover:bg-blue-700 transition-colors"
                >
                    <FaPlus className="mr-2" />
                    Neuen Artikel anlegen
                </Link>
            </div>

            {/* Makale Listesi Tablosu */}
            <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Datum</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Titel</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Publikation</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aktionen</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {articles.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                    Noch keine Presseartikel vorhanden.
                                </td>
                            </tr>
                        ) : (
                            articles.map(article => (
                                <tr key={article.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{formatDisplayDate(article.article_date)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-rcDarkGray">{article.title}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{article.publication || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        {article.is_public ? (
                                            <span className="flex items-center text-green-600">
                                                <FaEye className="mr-1.5" /> Öffentlich
                                            </span>
                                        ) : (
                                            <span className="flex items-center text-gray-500">
                                                <FaEyeSlash className="mr-1.5" /> Entwurf (Gizli)
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                                        <Link to={`/admin/presse/${article.id}`} className="text-rcBlue hover:text-blue-700" title="Bearbeiten">
                                            <FaEdit />
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(article.id)}
                                            className="text-rcRed hover:text-red-700"
                                            title="Löschen"
                                            disabled={loading}
                                        >
                                            <FaTrash />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}