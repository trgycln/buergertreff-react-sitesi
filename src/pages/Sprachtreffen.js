// src/pages/Sprachtreffen.js
// GÜNCELLENDİ: "Wann/Wo" bölümü ve "Arşiv" bölümü dinamik hale getirildi.

import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom'; // Link eklendi
import { supabase } from '../supabaseClient'; // Supabase eklendi
import ContentBlock from '../components/ContentBlock';
import PageBanner from '../components/PageBanner';
import sprachtreffenImage from '../assets/images/sprachtreffen-image.jpg';
import sprachtreffenBanner from '../assets/images/sprachtreffen-banner.jpg';
import { FaCheckCircle, FaUser, FaRegCalendarAlt, FaMapMarkerAlt, FaArrowRight } from 'react-icons/fa';

// --- Tarih Formatlama Fonksiyonları ---

// "Wann" kartı için detaylı format
const formatCardDate = (dateString) => {
    if (!dateString) return null;
    try {
        const date = new Date(dateString);
        return date.toLocaleString('de-DE', {
            weekday: 'long', 
            day: '2-digit', 
            month: 'long', 
            year: 'numeric',
            hour: '2-digit', 
            minute: '2-digit'
         }) + ' Uhr';
    } catch (e) { return dateString; }
};

// Arşiv listesi için kısa format
const formatListDate = (dateString) => {
    if (!dateString) return ""; 
    try {
        const date = new Date(dateString);
        return date.toLocaleString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
         });
    } catch (e) { return ""; }
};
// --- Bitiş: Tarih Formatlama ---


const Sprachtreffen = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- YENİ: Veri Çekme ---
    useEffect(() => {
        const fetchSprachtreffEvents = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('ereignisse')
                .select('*')
                .eq('is_public', true) // Sadece public olanlar
                .eq('category', 'Sprachtreff') // Sadece Sprachtreff kategorisi
                .order('event_date', { ascending: true }); // Tarihe göre sırala

            if (error) {
                console.error("Fehler beim Abrufen der Sprachtreff-Ereignisse:", error);
                setError("Ereignisse konnten nicht geladen werden.");
            } else {
                setEvents(data);
            }
            setLoading(false);
        };

        fetchSprachtreffEvents();
    }, []);
    // --- BİTİŞ: Veri Çekme ---

    // --- YENİ: Veriyi Ayırma (Gelecek ve Geçmiş) ---
    const { nextEvent, pastEvents } = useMemo(() => {
        const today = new Date().setHours(0, 0, 0, 0);

        const upcoming = events
            .filter(e => !e.event_date || new Date(e.event_date) >= today)
            .sort((a, b) => new Date(a.event_date) - new Date(b.event_date)); // En yakın tarihli olan en üstte

        const past = events
            .filter(e => e.event_date && new Date(e.event_date) < today)
            .sort((a, b) => new Date(b.event_date) - new Date(a.event_date)); // En yeni geçmiş en üstte

        return { 
            nextEvent: upcoming.length > 0 ? upcoming[0] : null, // Sadece en yakın tarihli olanı al
            pastEvents: past 
        };
    }, [events]);
    // --- BİTİŞ: Veriyi Ayırma ---


    // --- YENİ: Arşiv Listesi Render Fonksiyonu ---
    const renderArchiveList = () => {
        if (loading) return <p className="text-gray-500">Lade Archiv...</p>;
        if (pastEvents.length === 0) {
            return <p className="text-gray-500 italic">Noch keine vergangenen Veranstaltungen vorhanden.</p>;
        }
        
        return (
            <ul className="space-y-4 divide-y divide-gray-200">
                {pastEvents.map(event => (
                    <li key={event.id} className="pt-4 first:pt-0">
                        <Link 
                            to={`/angebote/${event.id}`}
                            className="flex items-center gap-4 group"
                        >
                            <img 
                                src={event.image_url || sprachtreffenImage} // Yedek resim
                                alt={event.title} 
                                className="w-24 h-16 object-cover rounded-md border border-gray-200 flex-shrink-0" 
                            />
                            <div className="flex-grow">
                                <h3 className="text-lg font-semibold text-rcDarkGray group-hover:text-rcBlue mb-1 truncate">
                                    {event.title}
                                </h3>
                                <div className="flex items-center text-sm text-gray-500">
                                    <FaRegCalendarAlt className="mr-1.5" /> 
                                    {formatListDate(event.event_date)}
                                </div>
                            </div>
                            <FaArrowRight className="text-gray-400 group-hover:text-rcBlue opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                        </Link>
                    </li>
                ))}
            </ul>
        );
    };
    // --- BİTİŞ: Arşiv Render ---


    return (
        <div>
            {/* PageBanner (Değişiklik yok) */}
            <PageBanner 
                title="Sprachtreffen"
                imageUrl={sprachtreffenBanner}
            />

            {/* ContentBlock (Değişiklik yok) */}
            <ContentBlock 
                title="Was ist das Sprachtreffen?"
                imageUrl={sprachtreffenImage}
                imageSide="right"
            >
                <p>
                    Unser Sprachtreffen ist ein offener und ungezwungener Treffpunkt für alle, die ihre Deutschkenntnisse verbessern möchten. Egal, ob Sie Anfänger sind oder bereits fortgeschrittene Kenntnisse haben, hier können Sie in entspannter Atmosphäre sprechen, neue Wörter lernen und Kontakte knüpfen.
                </p>
                <p>
                    Wir unterhalten uns über alltägliche Themen, spielen Sprachspiele und unterstützen uns gegenseitig. Die Teilnahme ist kostenlos und eine Anmeldung ist nicht erforderlich.
                </p>
            </ContentBlock>

            {/* "Für wen ist das?" Bölümü (Değişiklik yok) */}
            <section className="bg-white py-12 md:py-16">
                <div className="container mx-auto px-6 max-w-4xl">
                    <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">Für wen ist das Sprachtreffen?</h2>
                    <ul className="space-y-4">
                        <li className="flex items-start">
                            <FaCheckCircle className="text-green-500 mr-3 mt-1 flex-shrink-0" />
                            <span className="text-gray-700">Für alle, die neu in Deutschland sind und ihre Sprachkenntnisse im Alltag anwenden möchten.</span>
                        </li>
                        <li className="flex items-start">
                            <FaCheckCircle className="text-green-500 mr-3 mt-1 flex-shrink-0" />
                            <span className="text-gray-700">Für Menschen, die bereits einen Sprachkurs besuchen und zusätzlich üben wollen.</span>
                        </li>
                        <li className="flex items-start">
                            <FaCheckCircle className="text-green-500 mr-3 mt-1 flex-shrink-0" />
                            <span className="text-gray-700">Für Einheimische, die gerne neue Kulturen kennenlernen und als Gesprächspartner helfen möchten.</span>
                        </li>
                    </ul>
                </div>
            </section>

            {/* --- DÜZELTME: Dinamik "Wann & Wo" Bölümü --- */}
            <div className="bg-gray-50 py-12">
                <div className="container mx-auto px-6 max-w-4xl">
                    
                    {loading && (
                        <p className="text-center text-gray-500">Lade nächste Termine...</p>
                    )}

                    {!loading && nextEvent && (
                        // Gelecek etkinlik VARSA
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-center">
                            <div className="bg-red-50 p-6 rounded-lg">
                                <h3 className="text-2xl font-bold text-red-700 mb-2">Wann?</h3>
                                <p className="text-gray-700 text-lg font-medium">
                                    {formatCardDate(nextEvent.event_date)}
                                </p>
                            </div>
                            <div className="bg-blue-50 p-6 rounded-lg">
                                <h3 className="text-2xl font-bold text-blue-700 mb-2">Wo?</h3>
                                <p className="text-gray-700 text-lg font-medium">
                                    {nextEvent.location}
                                </p>
                            </div>
                        </div>
                    )}
                    
                    {!loading && !nextEvent && !error && (
                        // Gelecek etkinlik YOKSA (ama hata da yoksa)
                         <div className="text-center bg-gray-100 p-8 rounded-lg">
                            <h3 className="text-2xl font-bold text-gray-700 mb-2">Nächster Termin</h3>
                            <p className="text-gray-600 text-lg">
                                Planung läuft! Wir arbeiten mit Hochdruck daran, die nächsten Sprachtreffen zu organisieren. Schauen Sie bald wieder vorbei.
                            </p>
                         </div>
                    )}

                </div>
            </div>
            {/* --- BİTİŞ: Dinamik "Wann & Wo" --- */}


            {/* İlgili Kişi Bölümü (Değişiklik yok) */}
            <section className="bg-white py-12 md:py-16">
                <div className="container mx-auto px-6 max-w-2xl text-center">
                    <FaUser className="text-gray-400 text-4xl mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-gray-800">Ansprechpartnerin</h3>
                    <p className="mt-2 text-lg text-gray-600">
                        Erika Uber
                    </p>
                    <p className="mt-1 text-gray-600">
                        Haben Sie Fragen? Sie erreichen Frau Uber per E-Mail: <a href="mailto:Erika.uber@t-online.de" className="text-red-600 hover:underline">Erika.uber@t-online.de</a>
                    </p>
                </div>
            </section>

            {/* --- YENİ: Arşiv Bölümü --- */}
            <section className="bg-rcGray py-12 md:py-16">
                <div className="container mx-auto px-6 max-w-4xl">
                    <h2 className="text-3xl font-bold text-rcDarkGray mb-8">
                        Archiv: Vergangene Sprachtreffen
                    </h2>
                    {renderArchiveList()}
                </div>
            </section>
        </div>
    );
};

export default Sprachtreffen;