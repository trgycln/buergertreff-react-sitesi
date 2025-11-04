// src/components/admin/EreignisList.js
// Zeigt eine Tabelle aller Ereignisse mit Filter-, Bearbeiten- und Löschen-Funktionen an.

import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Link } from 'react-router-dom';
import { FaPlus, FaPencilAlt, FaTrashAlt, FaFilter, FaStar, FaRegStar } from 'react-icons/fa'; // Icons hinzugefügt

// Hilfsfunktion zum Formatieren des Datums
const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' Uhr';
    } catch (e) {
        return dateString; // Fallback
    }
};

export default function EreignisList({ pageInfo }) {
    const [ereignisse, setEreignisse] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [filterCategory, setFilterCategory] = useState(''); // State für den Kategorie-Filter

    // Eindeutige Kategorien aus den Ereignissen extrahieren (für den Filter-Dropdown)
    const uniqueCategories = [...new Set(ereignisse.map(e => e.category))].sort();

    // Alle Ereignisse laden (oder gefilterte)
    useEffect(() => {
        const fetchEreignisse = async () => {
            setLoading(true);
            let query = supabase
                .from('ereignisse')
                .select('*')
                .order('event_date', { ascending: false }); // Neueste zuerst

            // Filter anwenden, falls eine Kategorie ausgewählt ist
            if (filterCategory) {
                query = query.eq('category', filterCategory);
            }

            const { data, error } = await query;

            if (data) {
                setEreignisse(data);
            } else {
                setMessage(`Fehler beim Laden: ${error?.message}`);
            }
            setLoading(false);
        };
        fetchEreignisse();
    }, [filterCategory]); // Effekt neu ausführen, wenn sich der Filter ändert

    // Ereignis löschen
    const handleDelete = async (id, title) => {
        if (!window.confirm(`Sind Sie sicher, dass Sie das Ereignis "${title}" löschen möchten?`)) {
            return;
        }

        setMessage('Lösche...');
        setLoading(true); // Verhindert Klicks während des Löschens

        // Optional: Zugehöriges Bild im Storage löschen (falls vorhanden)
        const eventToDelete = ereignisse.find(e => e.id === id);
        if (eventToDelete?.image_url) {
            try {
                const fileName = eventToDelete.image_url.split('/').pop();
                await supabase.storage.from('page_assets').remove([fileName]);
            } catch (storageError) {
                console.warn("Fehler beim Löschen des Bildes aus Storage:", storageError);
                // Wir machen trotzdem weiter, um den DB-Eintrag zu löschen
            }
        }

        // Eintrag aus 'ereignisse' löschen
        const { error } = await supabase
            .from('ereignisse')
            .delete()
            .eq('id', id);

        if (error) {
            setMessage(`Fehler beim Löschen: ${error.message}`);
        } else {
            setMessage('Ereignis erfolgreich gelöscht.');
            // Liste im State aktualisieren
            setEreignisse(ereignisse.filter(e => e.id !== id));
        }
        setLoading(false);
        setTimeout(() => setMessage(''), 3000);
    };

    // "Featured"-Status umschalten (Bonus-Funktion!)
    const toggleFeatured = async (id, currentStatus) => {
        setMessage('Aktualisiere...');
        const { error } = await supabase
            .from('ereignisse')
            .update({ is_featured: !currentStatus })
            .eq('id', id);

        if (error) {
            setMessage(`Fehler beim Aktualisieren: ${error.message}`);
        } else {
            setMessage(`Status erfolgreich geändert.`);
            // Liste im State aktualisieren
            setEreignisse(ereignisse.map(e => e.id === id ? { ...e, is_featured: !currentStatus } : e));
        }
         setTimeout(() => setMessage(''), 2000);
    };


    if (loading && ereignisse.length === 0) { // Nur initial "Lade..." anzeigen
        return <div className="p-8">Lade Ereignisliste...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Kopfbereich mit Titel, Filter und "Neu hinzufügen"-Button */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h2 className="text-2xl font-semibold text-rcDarkGray">
                    Alle Ereignisse verwalten ({ereignisse.length})
                </h2>
                <div className="flex items-center gap-4">
                    {/* Kategorie-Filter */}
                    <div className="relative">
                        <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-rcBlue focus:border-rcBlue text-sm"
                        >
                            <option value="">Alle Kategorien</option>
                            {uniqueCategories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                    {/* "Neu hinzufügen"-Button (Link zur Formularseite) */}
                    <Link
                        to="/admin/ereignisse/new" // Ziel-URL für das Formular
                        className="flex items-center px-4 py-2 bg-rcBlue text-white font-semibold rounded-md shadow hover:bg-blue-700 transition-colors"
                    >
                        <FaPlus className="mr-2" />
                        Neues Ereignis
                    </Link>
                </div>
            </div>

            {/* Status-/Fehlermeldungen */}
            {message && (
                <p className={`p-3 rounded-md border text-sm ${message.startsWith('Fehler') ? 'bg-red-100 text-rcRed border-red-300' : 'bg-green-100 text-green-800 border-green-300'}`}>
                    {message}
                </p>
            )}

            {/* Die Tabelle (Listenansicht) */}
            <div className="bg-white shadow-lg rounded-lg overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-rcDarkGray uppercase tracking-wider">Titel</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-rcDarkGray uppercase tracking-wider">Kategorie</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-rcDarkGray uppercase tracking-wider">Datum & Uhrzeit</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-rcDarkGray uppercase tracking-wider">Hervorgehoben?</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-rcDarkGray uppercase tracking-wider">Aktionen</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading && ereignisse.length > 0 && (
                             <tr><td colSpan="5" className="px-6 py-4 text-center text-gray-500 italic">Filtere neu...</td></tr>
                        )}
                        {!loading && ereignisse.length === 0 && (
                            <tr>
                                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                                    Keine Ereignisse gefunden {filterCategory ? `für Kategorie "${filterCategory}"` : ''}.
                                </td>
                            </tr>
                        )}
                        {!loading && ereignisse.map(event => (
                            <tr key={event.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-rcDarkGray">{event.title}</div>
                                    <div className="text-xs text-gray-500">{event.location || ''}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-rcBlue">
                                        {event.category}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">{formatDate(event.event_date)}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    {/* Knopf zum Umschalten des "Featured"-Status */}
                                    <button
                                        onClick={() => toggleFeatured(event.id, event.is_featured)}
                                        title={event.is_featured ? "Hervorhebung entfernen" : "Als Hauptereignis hervorheben"}
                                        className={`p-1 rounded-full ${event.is_featured ? 'text-rcAccentYellow' : 'text-gray-300 hover:text-rcAccentYellow'}`}
                                        disabled={loading}
                                    >
                                        {event.is_featured ? <FaStar size={18} /> : <FaRegStar size={18} />}
                                    </button>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                                    {/* "Bearbeiten" Knopf (Link zur Formularseite mit ID) */}
                                    <Link
                                        to={`/admin/ereignisse/edit/${event.id}`} // Ziel-URL für Bearbeiten
                                        className="text-rcBlue hover:text-blue-700"
                                        title="Bearbeiten"
                                    >
                                        <FaPencilAlt />
                                    </Link>
                                    {/* "Löschen" Knopf */}
                                    <button
                                        onClick={() => handleDelete(event.id, event.title)}
                                        className="text-rcRed hover:text-red-700"
                                        title="Löschen"
                                        disabled={loading}
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