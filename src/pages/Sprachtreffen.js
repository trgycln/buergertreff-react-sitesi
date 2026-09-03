// src/pages/Sprachtreffen.js
// GÜNCELLENDİ: "Wann/Wo" bölümü ve "Arşiv" bölümü takvim modülüyle tam entegre ve dinamik hale getirildi.

import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import ContentBlock from '../components/ContentBlock';
import PageBanner from '../components/PageBanner';
import sprachtreffenImage from '../assets/images/sprachtreffen-image.jpg';
import sprachtreffenBanner from '../assets/images/sprachtreffen-banner.jpg';
import { FaUser, FaRegCalendarAlt, FaArrowRight } from 'react-icons/fa';
import { Helmet } from 'react-helmet-async';
import {
    dateToKey,
    expandRecurringEntries,
    getComparableEventDate,
    isEventInPast,
    mergeUpcomingEvents,
    parseLocalDate,
} from '../utils/calendarUtils';

// --- Tarih Formatlama Fonksiyonları ---

// "Wann" kartı için detaylı format
const formatCardDate = (dateKey, startTime, endTime) => {
    if (!dateKey) return null;
    const date = parseLocalDate(dateKey);
    if (!date) return dateKey;

    const dateFormatted = date.toLocaleDateString('de-DE', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    });

    const start = startTime ? String(startTime).slice(0, 5) : '';
    const end = endTime ? String(endTime).slice(0, 5) : '';

    if (start && end) {
        return `${dateFormatted}, ${start} - ${end} Uhr`;
    }
    if (start) {
        return `${dateFormatted}, ab ${start} Uhr`;
    }
    return dateFormatted;
};

// Arşiv listesi için kısa format
const formatListDate = (dateString) => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    } catch (e) {
        return '';
    }
};

const isOffenerTreff = (item) => {
    const title = (item?.title || '').toLowerCase();
    const category = (item?.category || '').toLowerCase();
    return (
        title.includes('offener treff') ||
        title.includes('offene treff') ||
        title.includes('sprachtreff') ||
        category.includes('offene treff') ||
        category.includes('offener treff') ||
        category.includes('offenetreff') ||
        category.includes('sprachtreff')
    );
};

const Sprachtreffen = () => {
    const [recurringEntries, setRecurringEntries] = useState([]);
    const [singleEntries, setSingleEntries] = useState([]);
    const [exceptions, setExceptions] = useState([]);
    const [archiveEvents, setArchiveEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- Takvim ve Arşiv Verilerini Çekme ---
    useEffect(() => {
        const fetchAllData = async () => {
            setLoading(true);
            const today = parseLocalDate(new Date());
            const horizon = new Date(today);
            horizon.setMonth(horizon.getMonth() + 3);
            const todayKey = dateToKey(today);
            const horizonKey = dateToKey(horizon);

            const [recurringRes, singleRes, ereignisseRes, exceptionsRes] = await Promise.all([
                supabase
                    .from('calendar_recurring_entries')
                    .select('*')
                    .eq('is_public', true)
                    .eq('is_active', true)
                    .gte('end_date', todayKey)
                    .lte('start_date', horizonKey),
                supabase
                    .from('calendar_single_entries')
                    .select('*')
                    .eq('is_public', true)
                    .eq('is_active', true)
                    .gte('entry_date', todayKey)
                    .lte('entry_date', horizonKey),
                supabase
                    .from('ereignisse')
                    .select('*')
                    .eq('is_public', true)
                    .order('event_date', { ascending: false }),
                supabase.from('calendar_recurring_exceptions').select('*'),
            ]);

            if (recurringRes.error || ereignisseRes.error) {
                console.error('Fehler beim Abrufen der Offene-Treff-Ereignisse:', recurringRes.error || ereignisseRes.error);
                setError('Ereignisse konnten nicht geladen werden.');
            } else {
                setRecurringEntries(recurringRes.data || []);
                setSingleEntries(singleRes.data || []);
                setArchiveEvents(ereignisseRes.data || []);
                setExceptions(exceptionsRes.data || []);
            }
            setLoading(false);
        };

        fetchAllData();
    }, []);

    // Takvimdeki tekrarlayan plana göre dinamik saat/gün metni
    const scheduleText = useMemo(() => {
        const offenerTreffItems = recurringEntries.filter(isOffenerTreff);
        if (offenerTreffItems.length === 0) {
            return 'Jeden Dienstag, Donnerstag und Sonntag von 14.30 bis 16.30 Uhr.';
        }

        const weekdaySet = new Set();
        let startTime = '';
        let endTime = '';

        offenerTreffItems.forEach((entry) => {
            if (Array.isArray(entry.weekdays)) {
                entry.weekdays.forEach((w) => weekdaySet.add(Number(w)));
            }
            if (!startTime && entry.start_time) startTime = String(entry.start_time).slice(0, 5);
            if (!endTime && entry.end_time) endTime = String(entry.end_time).slice(0, 5);
        });

        const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
        const WEEKDAY_NAMES = {
            1: 'Dienstag', // Map to correct German weekday
            2: 'Dienstag',
            3: 'Mittwoch',
            4: 'Donnerstag',
            5: 'Freitag',
            6: 'Samstag',
            0: 'Sonntag',
        };
        // German weekday mapping: 1 is Montag, 2 is Dienstag, 3 is Mittwoch, 4 is Donnerstag, 5 is Freitag, 6 is Samstag, 0 is Sonntag
        const GERMAN_WEEKDAY_NAMES = {
            1: 'Montag',
            2: 'Dienstag',
            3: 'Mittwoch',
            4: 'Donnerstag',
            5: 'Freitag',
            6: 'Samstag',
            0: 'Sonntag',
        };

        const sortedWeekdays = WEEKDAY_ORDER.filter((w) => weekdaySet.has(w));
        if (sortedWeekdays.length === 0) {
            return 'Jeden Dienstag, Donnerstag und Sonntag von 14.30 bis 16.30 Uhr.';
        }

        const weekdayNames = sortedWeekdays.map((w) => GERMAN_WEEKDAY_NAMES[w]);
        let daysText = '';
        if (weekdayNames.length === 1) {
            daysText = weekdayNames[0];
        } else if (weekdayNames.length === 2) {
            daysText = `${weekdayNames[0]} und ${weekdayNames[1]}`;
        } else {
            daysText = `${weekdayNames.slice(0, -1).join(', ')} und ${weekdayNames[weekdayNames.length - 1]}`;
        }

        let timeText = '';
        if (startTime && endTime) {
            timeText = ` von ${startTime} bis ${endTime} Uhr`;
        } else if (startTime) {
            timeText = ` ab ${startTime} Uhr`;
        }

        return `Jeden ${daysText}${timeText}.`;
    }, [recurringEntries]);

    // En yakın gelecek tarih (Next Event) ve geçmiş arşiv
    const { nextEvent, pastEvents } = useMemo(() => {
        const now = new Date();
        const today = parseLocalDate(now);
        const horizon = new Date(today);
        horizon.setMonth(horizon.getMonth() + 3);

        const past = archiveEvents
            .filter((e) => isOffenerTreff(e) && e.event_date && isEventInPast(e.event_date, now))
            .sort((a, b) => new Date(b.event_date) - new Date(a.event_date));

        const recurringOccurrences = expandRecurringEntries(recurringEntries, today, horizon, exceptions)
            .filter(isOffenerTreff)
            .map((entry) => ({
                id: entry.id,
                title: entry.title,
                category: entry.category,
                location: entry.location,
                dateKey: entry.dateKey,
                startTime: entry.startTime,
                endTime: entry.endTime,
                isPriority: false,
            }));

        const singleOccurrences = singleEntries
            .filter(isOffenerTreff)
            .map((entry) => ({
                id: `single-${entry.id}`,
                title: entry.title,
                category: entry.category,
                location: entry.location,
                dateKey: entry.entry_date,
                startTime: entry.start_time,
                endTime: entry.end_time,
                detailId: entry.source_event_id || null,
                isPriority: false,
            }));

        const ereignisseUpcoming = archiveEvents
            .filter((e) => isOffenerTreff(e) && (!e.event_date || !isEventInPast(e.event_date, now)))
            .map((e) => {
                const ed = getComparableEventDate(e.event_date);
                return {
                    id: `event-${e.id}`,
                    title: e.title,
                    category: e.category,
                    location: e.location,
                    dateKey: ed ? dateToKey(ed) : '',
                    startTime: ed ? String(ed.toTimeString()).slice(0, 5) : null,
                    endTime: e.end_time ? String(e.end_time).slice(0, 5) : null,
                    detailId: e.id,
                    isPriority: true,
                };
            });

        const allMerged = mergeUpcomingEvents([
            ...ereignisseUpcoming,
            ...recurringOccurrences,
            ...singleOccurrences,
        ]).filter((item) => item.dateKey && !isEventInPast(item.dateKey, now, item.startTime));

        allMerged.sort((a, b) => {
            if (a.dateKey !== b.dateKey) return (a.dateKey || '').localeCompare(b.dateKey || '');
            const leftTime = a.startTime ? String(a.startTime).slice(0, 5) : '99:99';
            const rightTime = b.startTime ? String(b.startTime).slice(0, 5) : '99:99';
            return leftTime.localeCompare(rightTime);
        });

        return {
            nextEvent: allMerged.length > 0 ? allMerged[0] : null,
            pastEvents: past,
        };
    }, [recurringEntries, singleEntries, exceptions, archiveEvents]);


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
        <>
        <Helmet>
            <title>Offener Treff: Deutsch Lernen & Austausch | Bürgertreff Wissen</title>
    <meta 
        name="description" 
        content="Nehmen Sie an unserem Offenen Treff in Wissen teil. Ideal zum Deutschlernen, Üben und für interkulturellen Austausch in entspannter Atmosphäre."
    />
</Helmet>
 <div>
            {/* PageBanner (Değişiklik yok) */}
            <PageBanner 
                title="Offener Treff"
                imageUrl={sprachtreffenBanner}
            />

            <ContentBlock 
                title="Was ist der Offene Treff?"
                imageUrl={sprachtreffenImage}
                imageSide="right"
            >
                <p>
                    Sich ganz zwanglos treffen, bei einer Tasse Kaffee oder Tee miteinander ins Gespräch kommen, nette Leute kennen lernen, vielleicht zusammen spielen, singen, basteln… oder einfach nur dabei sein.
                </p>
                <p className="font-semibold text-rcBlue">
                    {scheduleText}
                </p>
                <p>
                    Kommen Sie rein und nehmen Sie Platz. Jeder und jede ist herzlich willkommen!
                </p>
            </ContentBlock>

            {/* --- Dinamik "Wann & Wo" Bölümü --- */}
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
                                    {formatCardDate(nextEvent.dateKey, nextEvent.startTime, nextEvent.endTime)}
                                </p>
                            </div>
                            <div className="bg-blue-50 p-6 rounded-lg">
                                <h3 className="text-2xl font-bold text-blue-700 mb-2">Wo?</h3>
                                <p className="text-gray-700 text-lg font-medium">
                                    {nextEvent.location || 'Bürgertreff Wissen (Marktstr. 8, 57537 Wissen)'}
                                </p>
                            </div>
                        </div>
                    )}
                    
                    {!loading && !nextEvent && !error && (
                        // Gelecek etkinlik YOKSA (ama hata da yoksa)
                         <div className="text-center bg-gray-100 p-8 rounded-lg">
                            <h3 className="text-2xl font-bold text-gray-700 mb-2">Nächster Termin</h3>
                            <p className="text-gray-600 text-lg">
                                Planung läuft! Wir arbeiten mit Hochdruck daran, die nächsten Offene-Treff-Termine zu organisieren. Schauen Sie bald wieder vorbei.
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
                        Archiv: Vergangene Offene-Treff-Termine
                    </h2>
                    {renderArchiveList()}
                </div>
            </section>
        </div>
        </>
       
    );
};

export default Sprachtreffen;