// src/components/EventList.js
// GÜNCELLENDİ: 'archiveView="list"' olduğunda daha zengin bir liste görünümü eklendi.

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import EventCard from './EventCard'; // Kart görünümü
import { Link } from 'react-router-dom'; 
import { FaRegCalendarAlt, FaMapMarkerAlt } from 'react-icons/fa'; // İkonlar eklendi
import fallbackImage from '../assets/images/ana_logo.jpg'; // Varsayılan resim eklendi
import ImageCarousel from './ImageCarousel';
import { dateToKey, expandRecurringEntries, formatTimeRange, getComparableEventDate, isEventInPast, mergeUpcomingEvents, parseLocalDate } from '../utils/calendarUtils';

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

const normalizeCategory = (value = '') => {
    const trimmed = String(value || '').trim();
    if (trimmed === 'Offener Treff') return 'Offene Treff';
    if (trimmed === 'OffeneTreff') return 'Offene Treff';
    return trimmed;
};

const formatCategoryLabel = (value = '') => {
    if (normalizeCategory(value) === 'Offene Treff') return 'Offener Treff';
    return value;
};

const formatUpcomingDate = (dateKey, startTime, endTime) => {
    if (!dateKey) return '';

    const date = parseLocalDate(dateKey);
    if (!date) return dateKey;

    const dateLabel = date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });

    if (!startTime) return dateLabel;
    return `${dateLabel}, ${formatTimeRange(startTime, endTime)}`;
};

const normalizeText = (value = '') => String(value || '').trim().toLocaleLowerCase('de-DE');

const getDescriptionLookupKey = (title = '', category = '') => {
    return `${normalizeText(title)}|${normalizeText(category)}`;
};

const normalizeTitleForMatch = (value = '') => {
    return normalizeText(value)
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim();
};

const findDescriptionBySimilarity = (archiveEvents = [], title = '', category = '') => {
    const sourceTitle = normalizeTitleForMatch(title);
    const sourceCategory = normalizeCategory(category);
    if (!sourceTitle) return '';

    const sourceTokens = sourceTitle.split(' ').filter(Boolean);
    let best = { score: 0, description: '' };

    archiveEvents.forEach((event) => {
        const description = String(event.description || '').trim();
        if (!description) return;
        if (normalizeCategory(event.category) !== sourceCategory) return;

        const targetTitle = normalizeTitleForMatch(event.title);
        if (!targetTitle) return;

        let score = 0;
        if (targetTitle === sourceTitle) score += 100;
        if (targetTitle.includes(sourceTitle) || sourceTitle.includes(targetTitle)) score += 40;

        const targetTokens = targetTitle.split(' ').filter(Boolean);
        const overlaps = sourceTokens.filter((token) => targetTokens.includes(token)).length;
        score += overlaps * 5;

        if (score > best.score) {
            best = { score, description };
        }
    });

    return best.score >= 10 ? best.description : '';
};

const pickDescription = (primary, fallback) => {
    const primaryText = String(primary || '').trim();
    if (primaryText) return primary;
    return String(fallback || '').trim() ? fallback : '';
};

const EventList = ({ filterCategory = 'Alle', archiveView = 'card', maxUpcomingEvents = 3 }) => {
    const [events, setEvents] = useState([]);
    const [recurringEntries, setRecurringEntries] = useState([]);
    const [singleEntries, setSingleEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Verileri Supabase'den çek
    useEffect(() => {
        const fetchEvents = async () => {
            setLoading(true);

            const today = parseLocalDate(new Date());
            const horizon = new Date(today);
            horizon.setMonth(horizon.getMonth() + 4);
            const todayKey = dateToKey(today);
            const horizonKey = dateToKey(horizon);
            
            const [eventsResponse, recurringResponse, singleResponse] = await Promise.all([
                supabase
                    .from('ereignisse')
                    .select('*')
                    .eq('is_public', true)
                    .order('event_date', { ascending: false }),
                supabase
                    .from('calendar_recurring_entries')
                    .select('*')
                    .eq('is_public', true)
                    .eq('is_active', true)
                    .gte('end_date', todayKey)
                    .lte('start_date', horizonKey)
                    .order('start_date', { ascending: true }),
                supabase
                    .from('calendar_single_entries')
                    .select('*')
                    .eq('is_public', true)
                    .eq('is_active', true)
                    .gte('entry_date', todayKey)
                    .lte('entry_date', horizonKey)
                    .order('entry_date', { ascending: true }),
            ]);

            if (eventsResponse.error || recurringResponse.error || singleResponse.error) {
                console.error("Fehler beim Abrufen der Veranstaltungsdaten:", eventsResponse.error || recurringResponse.error || singleResponse.error);
                setError("Die Veranstaltungen konnten nicht geladen werden.");
            } else {
                setEvents(eventsResponse.data || []);
                setRecurringEntries(recurringResponse.data || []);
                setSingleEntries(singleResponse.data || []);
            }
            setLoading(false);
        };
        fetchEvents();
    }, []); 

    // Etkinlikleri filtrele ve "Gelecek" / "Geçmiş" olarak ayır
    const { upcomingEvents, pastEvents } = useMemo(() => {
        const now = new Date();
        const nowTimestamp = now.getTime();
        const horizon = new Date(now);
        horizon.setMonth(horizon.getMonth() + 4);
        const normalizedFilter = normalizeCategory(filterCategory);

        const filteredArchive = events.filter(event => {
            if (filterCategory === 'Alle') return true;
            return normalizeCategory(event.category) === normalizedFilter;
        });

        const archiveById = new Map();
        const archiveDescriptionByKey = new Map();

        filteredArchive.forEach((event) => {
            archiveById.set(event.id, event);

            if (!String(event.description || '').trim()) return;
            const key = getDescriptionLookupKey(event.title, event.category);
            if (!archiveDescriptionByKey.has(key)) {
                archiveDescriptionByKey.set(key, event.description);
            }
        });

        const filteredRecurring = recurringEntries.filter((entry) => {
            if (filterCategory === 'Alle') return true;
            return normalizeCategory(entry.category) === normalizedFilter;
        });

        const filteredSingle = singleEntries.filter((entry) => {
            if (filterCategory === 'Alle') return true;
            return normalizeCategory(entry.category) === normalizedFilter;
        });

        const archiveUpcoming = filteredArchive
            .filter((event) => {
                const eventDate = getComparableEventDate(event.event_date);
                return eventDate && eventDate.getTime() >= nowTimestamp;
            })
            .map((event) => {
                const parsedDate = getComparableEventDate(event.event_date);
                return {
                    id: `event-${event.id}`,
                    title: event.title,
                    category: event.category,
                    location: event.location,
                    description: event.description,
                    dateKey: parsedDate ? dateToKey(parsedDate) : '',
                    startTime: parsedDate ? String(parsedDate.toTimeString()).slice(0, 5) : null,
                    detailId: event.id,
                    isPriority: true,
                };
            });

        const recurringOccurrences = expandRecurringEntries(filteredRecurring, parseLocalDate(new Date()), parseLocalDate(horizon)).map((item) => {
            const directDescription = archiveDescriptionByKey.get(getDescriptionLookupKey(item.title, item.category));
            const similarityDescription = findDescriptionBySimilarity(filteredArchive, item.title, item.category);

            return {
            id: item.id,
            title: item.title,
            category: item.category,
            location: item.location,
            description: pickDescription(item.description, pickDescription(directDescription, similarityDescription)),
            dateKey: item.dateKey,
            startTime: item.startTime,
            endTime: item.endTime,
            detailId: null,
            };
        });

        const singleOccurrences = filteredSingle.map((entry) => {
            const sourceDescription = archiveById.get(entry.source_event_id)?.description;
            const directDescription = archiveDescriptionByKey.get(getDescriptionLookupKey(entry.title, entry.category));
            const similarityDescription = findDescriptionBySimilarity(filteredArchive, entry.title, entry.category);

            return {
            id: `single-${entry.id}`,
            title: entry.title,
            category: entry.category,
            location: entry.location,
            description: pickDescription(
                entry.description,
                pickDescription(sourceDescription, pickDescription(directDescription, similarityDescription))
            ),
            dateKey: entry.entry_date,
            startTime: entry.start_time,
            endTime: entry.end_time,
            detailId: entry.source_event_id || null,
            };
        });

        const sortByDate = (a, b) => {
            if (a.dateKey !== b.dateKey) return a.dateKey.localeCompare(b.dateKey);
            const leftTime = a.startTime ? String(a.startTime).slice(0, 5) : '99:99';
            const rightTime = b.startTime ? String(b.startTime).slice(0, 5) : '99:99';
            if (leftTime !== rightTime) return leftTime.localeCompare(rightTime);
            return String(a.title).localeCompare(String(b.title), 'de');
        };

        const allMerged = mergeUpcomingEvents([...archiveUpcoming, ...recurringOccurrences, ...singleOccurrences])
            .filter((entry) => entry.dateKey && !isEventInPast(entry.dateKey, now, entry.startTime));

        const priorityUpcoming = allMerged.filter((e) => e.isPriority).sort(sortByDate);
        const calendarUpcoming = allMerged.filter((e) => !e.isPriority).sort(sortByDate);
        const remainingSlots = Math.max(0, maxUpcomingEvents - priorityUpcoming.length);
        const upcoming = [...priorityUpcoming, ...calendarUpcoming.slice(0, remainingSlots)];

        const past = filteredArchive
            .filter((event) => event.event_date && isEventInPast(event.event_date, now))
            .sort((a, b) => {
                const left = getComparableEventDate(a.event_date)?.getTime() || 0;
                const right = getComparableEventDate(b.event_date)?.getTime() || 0;
                return right - left;
            }); 

        return {
            upcomingEvents: upcoming,
            pastEvents: past,
        };
    }, [events, recurringEntries, singleEntries, filterCategory, maxUpcomingEvents]); 

    const latestPastEventWithPhotos = useMemo(() => {
        return pastEvents.find(
            (event) => Array.isArray(event.archive_photos) && event.archive_photos.length > 0
        ) || null;
    }, [pastEvents]);

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
                                className="w-24 h-16 object-contain bg-gray-100 rounded-md border border-gray-200 flex-shrink-0" 
                            />
                            
                            {/* 2. Bilgi Alanı */}
                            <div className="flex-grow">
                                {/* Kategori */}
                                {event.category && (
                                    <span className="text-xs font-semibold text-rcRed uppercase tracking-wide">
                                        {event.category === 'Offene Treff' ? 'Offener Treff' : event.category}
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

    const renderUpcomingList = (eventList, noEventsMessage) => {
        if (eventList.length === 0) {
            return <p className="text-gray-500 italic">{noEventsMessage}</p>;
        }

        return (
            <ul className="space-y-4 divide-y divide-gray-200 rounded-xl border border-gray-200 bg-white p-4">
                {eventList.map((event) => {
                    const content = (
                        <>
                            <div className="flex-grow">
                                {event.category && (
                                    <span className="text-xs font-semibold text-rcRed uppercase tracking-wide">
                                        {formatCategoryLabel(event.category)}
                                    </span>
                                )}
                                <h3 className="text-lg font-semibold text-rcDarkGray mb-1">
                                    {event.title}
                                </h3>

                                <div className="flex flex-col sm:flex-row sm:items-center text-sm text-gray-500 gap-x-4 gap-y-1">
                                    <span className="flex items-center">
                                        <FaRegCalendarAlt className="mr-1.5" />
                                        {formatUpcomingDate(event.dateKey, event.startTime, event.endTime)}
                                    </span>
                                    {event.location && (
                                        <span className="flex items-center">
                                            <FaMapMarkerAlt className="mr-1.5" />
                                            {event.location}
                                        </span>
                                    )}
                                </div>

                                {event.description && (
                                    <div className="mt-3 rounded-lg bg-gray-50 border border-gray-200 p-3">
                                        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1">Beschreibung</p>
                                        <p className="text-sm leading-6 text-gray-700 whitespace-pre-wrap line-clamp-4">{event.description}</p>
                                    </div>
                                )}
                            </div>
                            {event.detailId && (
                                <span className="text-sm font-semibold text-rcBlue whitespace-nowrap">Details &rarr;</span>
                            )}
                        </>
                    );

                    return (
                        <li key={event.id} className="pt-4 first:pt-0">
                            {event.detailId ? (
                                <Link to={`/angebote/${event.detailId}`} className="flex items-start justify-between gap-4 group hover:bg-gray-50 rounded-md p-2 -m-2">
                                    {content}
                                </Link>
                            ) : (
                                <div className="flex items-start justify-between gap-4 p-2">{content}</div>
                            )}
                        </li>
                    );
                })}
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

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
                    <div className="xl:col-span-2">
                        {renderUpcomingList(
                            upcomingEvents,
                            "Zurzeit sind keine Veranstaltungen in dieser Kategorie geplant."
                        )}
                    </div>

                    {latestPastEventWithPhotos && (
                        <aside className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
                            <h3 className="text-xl font-semibold text-rcDarkGray mb-3">
                                Letzte Aktivität in Bildern
                            </h3>
                            <p className="text-sm text-gray-600 mb-3">
                                {latestPastEventWithPhotos.title}
                            </p>
                            <ImageCarousel images={latestPastEventWithPhotos.archive_photos} objectFit="contain" />
                            <div className="mt-3 text-right">
                                <Link
                                    to={`/angebote/${latestPastEventWithPhotos.id}`}
                                    className="text-sm font-semibold text-rcBlue hover:underline"
                                >
                                    Zum Rückblick &rarr;
                                </Link>
                            </div>
                        </aside>
                    )}
                </div>
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