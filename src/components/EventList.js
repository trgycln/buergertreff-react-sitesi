// src/components/EventList.js
// GÜNCELLENDİ: 'archiveView="list"' olduğunda daha zengin bir liste görünümü eklendi.

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import EventCard from './EventCard'; // Kart görünümü
import { Link } from 'react-router-dom'; 
import { FaRegCalendarAlt, FaMapMarkerAlt } from 'react-icons/fa'; // İkonlar eklendi
import fallbackImage from '../assets/images/ana_logo.jpg'; // Varsayılan resim eklendi

// Tarih formatlama (Liste için kısa format)
const formatListDate = (dateString) => {
    if (!dateString) return ""; 
    try {
        const date = new Date(dateString);
        return date.toLocaleString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
         });
    } catch (e) {
        return dateString;
    }
};

const EventList = ({ filterCategory = 'Alle', archiveView = 'card' }) => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Verileri Supabase'den çek
    useEffect(() => {
        const fetchEvents = async () => {
            setLoading(true);
            
            const { data, error } = await supabase
                .from('ereignisse')
                .select('*')
                .eq('is_public', true) // Sadece kamuya açık olanlar
                .order('event_date', { ascending: false }); 

            if (error) {
                console.error("Fehler beim Abrufen der Ereignisse:", error);
                setError("Die Veranstaltungen konnten nicht geladen werden.");
            } else {
                setEvents(data);
            }
            setLoading(false);
        };
        fetchEvents();
    }, []); 

    // Etkinlikleri filtrele ve "Gelecek" / "Geçmiş" olarak ayır
    const { upcomingEvents, pastEvents } = useMemo(() => {
        const today = new Date().setHours(0, 0, 0, 0); 

        const filtered = events.filter(event => {
            if (filterCategory === 'Alle') return true;
            return event.category === filterCategory;
        });

        const upcoming = filtered
            .filter(e => !e.event_date || new Date(e.event_date) >= today)
            .sort((a, b) => new Date(a.event_date) - new Date(b.event_date)); 

        const past = filtered
            .filter(e => e.event_date && new Date(e.event_date) < today)
            .sort((a, b) => new Date(b.event_date) - new Date(a.event_date)); 

        return { upcomingEvents: upcoming, pastEvents: past };
    }, [events, filterCategory]); 

    // --- RENDER FONKSİYONLARI ---

    if (loading) {
        return (
            <div className="text-center py-10">
                <p className="text-lg text-rcDarkGray">Lade Veranstaltungen...</p>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="text-center py-10 bg-red-100 text-rcRed">
                <p className="font-semibold">{error}</p>
            </div>
        );
    }

    // KART GÖRÜNÜMÜ (Gelecek etkinlikler için)
    const renderEventGrid = (eventList, noEventsMessage) => {
        if (eventList.length === 0) {
            return <p className="text-gray-500 italic">{noEventsMessage}</p>;
        }
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {eventList.map(event => (
                    <EventCard key={event.id} event={event} />
                ))}
            </div>
        );
    };

    // GÜNCELLENDİ: ZENGİN LİSTE GÖRÜNÜMÜ (Arşiv bölümü için)
    const renderEventList = (eventList, noEventsMessage) => {
        if (eventList.length === 0) {
            return <p className="text-gray-500 italic">{noEventsMessage}</p>;
        }
        return (
            // Dikey ayırıcı çizgiler eklendi
            <ul className="space-y-4 divide-y divide-gray-200">
                {eventList.map(event => (
                    <li key={event.id} className="pt-4 first:pt-0">
                        {/* Link tüm alanı kaplıyor */}
                        <Link 
                            to={`/angebote/${event.id}`}
                            className="flex items-center gap-4 group"
                        >
                            {/* 1. Küçük Resim */}
                            <img 
                                src={event.image_url || fallbackImage} 
                                alt={event.title} 
                                className="w-24 h-16 object-cover rounded-md border border-gray-200 flex-shrink-0" 
                            />
                            
                            {/* 2. Bilgi Alanı */}
                            <div className="flex-grow">
                                {/* Kategori */}
                                {event.category && (
                                    <span className="text-xs font-semibold text-rcRed uppercase tracking-wide">
                                        {event.category}
                                    </span>
                                )}
                                
                                {/* Başlık */}
                                <h3 className="text-lg font-semibold text-rcDarkGray group-hover:text-rcBlue mb-1 truncate">
                                    {event.title}
                                </h3>
                                
                                {/* Tarih ve Konum */}
                                <div className="flex flex-col sm:flex-row sm:items-center text-sm text-gray-500 gap-x-4">
                                    <span className="flex items-center">
                                        <FaRegCalendarAlt className="mr-1.5" /> 
                                        {formatListDate(event.event_date)}
                                    </span>
                                    {event.location && (
                                        <span className="flex items-center">
                                            <FaMapMarkerAlt className="mr-1.5" /> 
                                            {event.location}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </Link>
                    </li>
                ))}
            </ul>
        );
    };

    return (
        <div className="space-y-16">
            {/* --- BÖLÜM 1: GELECEK ETKİNLİKLER (Kart olarak kalır) --- */}
            <section>
                <h2 className="text-3xl font-bold text-rcDarkGray mb-6 pb-3 border-b-2 border-rcLightBlue">
                    Kommende Veranstaltungen
                </h2>
                {renderEventGrid(
                    upcomingEvents, 
                    "Zurzeit sind keine Veranstaltungen in dieser Kategorie geplant."
                )}
            </section>

            {/* --- BÖLÜM 2: GEÇMİŞ ETKİNLİKLER (ARŞİV) --- */}
            <section>
                <h2 className="text-3xl font-bold text-rcDarkGray mb-6 pb-3 border-b-2 border-rcLightBlue">
                    Rückblick / Archiv
                </h2>
                {/* DÜZELTME: archiveView prop'una göre 'list' veya 'card' render edilir */}
                {archiveView === 'list' ? (
                    renderEventList(
                        pastEvents,
                        "Keine vergangenen Veranstaltungen in dieser Kategorie gefunden."
                    )
                ) : (
                    renderEventGrid(
                        pastEvents,
                        "Keine vergangenen Veranstaltungen in dieser Kategorie gefunden."
                    )
                )}
            </section>
        </div>
    );
};

export default EventList;