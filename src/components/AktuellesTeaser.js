import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaRegCalendarAlt, FaMapMarkerAlt } from 'react-icons/fa';
import { supabase } from '../supabaseClient';
import ImageCarousel from './ImageCarousel';
import { dateToKey, expandRecurringEntries, getComparableEventDate, isEventInPast, parseLocalDate } from '../utils/calendarUtils';

const formatDate = (dateString) => {
    if (!dateString) return 'Datum folgt';
    try {
        const date = new Date(dateString);
        return date.toLocaleString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }) + ' Uhr';
    } catch (e) {
        return dateString;
    }
};

const formatUpcomingDate = (event) => {
    if (event.dateKey) {
        const date = parseLocalDate(event.dateKey);
        if (!date) return event.dateKey;

        const dateLabel = date.toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });

        if (!event.startTime) return dateLabel;
        return `${dateLabel}, ${String(event.startTime).slice(0, 5)} Uhr`;
    }

    return formatDate(event.eventDate);
};

const normalizeText = (value = '') => String(value || '').trim().toLocaleLowerCase('de-DE');

const getEventDayKey = (event) => {
    if (event.dateKey) return event.dateKey;
    if (!event.eventDate) return '';
    return dateToKey(new Date(event.eventDate));
};

const dedupeUpcomingEvents = (items = []) => {
    const deduped = new Map();

    items.forEach((item) => {
        const dayKey = getEventDayKey(item);
        const timeKey = item.startTime ? String(item.startTime).slice(0, 5) : '';
        const titleKey = normalizeText(item.title);
        const locationKey = normalizeText(item.location);
        const dedupeKey = `${dayKey}|${timeKey}|${titleKey}|${locationKey}`;
        const existing = deduped.get(dedupeKey);

        if (!existing) {
            deduped.set(dedupeKey, item);
            return;
        }

        if (!existing.linkTo && item.linkTo) {
            deduped.set(dedupeKey, item);
        }
    });

    return Array.from(deduped.values());
};

const AktuellesTeaser = () => {
    const [events, setEvents] = useState([]);
    const [recurringEntries, setRecurringEntries] = useState([]);
    const [singleEntries, setSingleEntries] = useState([]);
    const [loading, setLoading] = useState(true);

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
                console.error(
                    'Aktuelles konnte nicht geladen werden:',
                    eventsResponse.error || recurringResponse.error || singleResponse.error
                );
                setEvents([]);
                setRecurringEntries([]);
                setSingleEntries([]);
            } else {
                setEvents(eventsResponse.data || []);
                setRecurringEntries(recurringResponse.data || []);
                setSingleEntries(singleResponse.data || []);
            }

            setLoading(false);
        };

        fetchEvents();
    }, []);

    const { upcoming, latestWithPhotos } = useMemo(() => {
        const now = new Date();
        const nowTimestamp = now.getTime();
        const rangeStart = parseLocalDate(now);
        const rangeEnd = new Date(rangeStart);
        rangeEnd.setMonth(rangeEnd.getMonth() + 4);

        const upcomingFromEvents = events
            .filter((e) => {
                if (!e.event_date) return true;
                const eventDate = getComparableEventDate(e.event_date);
                return !eventDate || eventDate.getTime() >= nowTimestamp;
            })
            .map((e) => {
                const eventDate = getComparableEventDate(e.event_date);

                return {
                    id: `event-${e.id}`,
                    title: e.title,
                    location: e.location,
                    description: e.description,
                    eventDate: e.event_date,
                    startTime: eventDate ? String(eventDate.toTimeString()).slice(0, 5) : null,
                    linkTo: `/angebote/${e.id}`,
                    sortKey: eventDate ? eventDate.getTime() : Number.MAX_SAFE_INTEGER,
                };
            });

        const upcomingFromRecurring = expandRecurringEntries(recurringEntries, rangeStart, rangeEnd).map((entry) => ({
            id: entry.id,
            title: entry.title,
            location: entry.location,
            description: entry.description,
            dateKey: entry.dateKey,
            startTime: entry.startTime,
            linkTo: null,
            sortKey: parseLocalDate(entry.dateKey)?.getTime() || Number.MAX_SAFE_INTEGER,
        }));

        const upcomingFromSingle = singleEntries.map((entry) => ({
            id: `single-${entry.id}`,
            title: entry.title,
            location: entry.location,
            description: entry.description,
            dateKey: entry.entry_date,
            startTime: entry.start_time,
            linkTo: entry.source_event_id ? `/angebote/${entry.source_event_id}` : null,
            sortKey: parseLocalDate(entry.entry_date)?.getTime() || Number.MAX_SAFE_INTEGER,
        }));

        const upcomingEvents = dedupeUpcomingEvents([...upcomingFromEvents, ...upcomingFromRecurring, ...upcomingFromSingle])
            .filter((entry) => {
                if (entry.dateKey) {
                    return !isEventInPast(entry.dateKey, now, entry.startTime);
                }

                return !isEventInPast(entry.eventDate, now, entry.startTime);
            })
            .sort((a, b) => {
                if (a.sortKey !== b.sortKey) return a.sortKey - b.sortKey;
                const leftTime = a.startTime ? String(a.startTime).slice(0, 5) : '99:99';
                const rightTime = b.startTime ? String(b.startTime).slice(0, 5) : '99:99';
                if (leftTime !== rightTime) return leftTime.localeCompare(rightTime);
                return String(a.title || '').localeCompare(String(b.title || ''), 'de');
            })
            .slice(0, 3);

        const latestPastWithPhotos = events
            .filter((e) => e.event_date && isEventInPast(e.event_date, now))
            .sort((a, b) => {
                const left = getComparableEventDate(a.event_date)?.getTime() || 0;
                const right = getComparableEventDate(b.event_date)?.getTime() || 0;
                return right - left;
            })
            .find((e) => Array.isArray(e.archive_photos) && e.archive_photos.length > 0) || null;

        return {
            upcoming: upcomingEvents,
            latestWithPhotos: latestPastWithPhotos
        };
    }, [events, recurringEntries, singleEntries]);

    return (
        <section className="bg-white py-12 md:py-16">
            <div className="container mx-auto px-6">
                <div className="flex items-end justify-between mb-6 pb-3 border-b-2 border-rcLightBlue">
                    <h2 className="text-3xl font-bold text-rcDarkGray">Aktuelles</h2>
                    <Link to="/angebote" className="text-sm md:text-base font-semibold text-rcBlue hover:underline">
                        Alle Veranstaltungen anzeigen &rarr;
                    </Link>
                </div>

                {loading ? (
                    <p className="text-gray-600">Aktuelles wird geladen...</p>
                ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
                        <div className="xl:col-span-2 bg-rcGray p-5 rounded-lg border border-gray-200">
                            <h3 className="text-xl font-semibold text-rcDarkGray mb-4">Nächste Termine</h3>

                            {upcoming.length === 0 ? (
                                <p className="text-gray-500 italic">Aktuell sind keine kommenden Termine geplant.</p>
                            ) : (
                                <ul className="space-y-3 divide-y divide-gray-200">
                                    {upcoming.map((event) => (
                                        <li key={event.id} className="pt-3 first:pt-0">
                                            {event.linkTo ? (
                                                <Link to={event.linkTo} className="block group">
                                                    <h4 className="text-lg font-semibold text-rcDarkGray group-hover:text-rcBlue mb-1">
                                                        {event.title}
                                                    </h4>
                                                    <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 text-sm text-gray-600">
                                                        <span className="flex items-center">
                                                            <FaRegCalendarAlt className="mr-1.5" />
                                                            {formatUpcomingDate(event)}
                                                        </span>
                                                        {event.location && (
                                                            <span className="flex items-center">
                                                                <FaMapMarkerAlt className="mr-1.5" />
                                                                {event.location}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {event.description && (
                                                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">{event.description}</p>
                                                    )}
                                                </Link>
                                            ) : (
                                                <div className="block">
                                                    <h4 className="text-lg font-semibold text-rcDarkGray mb-1">
                                                        {event.title}
                                                    </h4>
                                                    <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 text-sm text-gray-600">
                                                        <span className="flex items-center">
                                                            <FaRegCalendarAlt className="mr-1.5" />
                                                            {formatUpcomingDate(event)}
                                                        </span>
                                                        {event.location && (
                                                            <span className="flex items-center">
                                                                <FaMapMarkerAlt className="mr-1.5" />
                                                                {event.location}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {event.description && (
                                                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">{event.description}</p>
                                                    )}
                                                </div>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {latestWithPhotos && (
                            <aside className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
                                <h3 className="text-xl font-semibold text-rcDarkGray mb-2">Letzte Aktivität</h3>
                                <p className="text-sm text-gray-600 mb-3">{latestWithPhotos.title}</p>
                                <ImageCarousel images={latestWithPhotos.archive_photos} objectFit="contain" />
                                <div className="mt-3 text-right">
                                    <Link
                                        to={`/angebote/${latestWithPhotos.id}`}
                                        className="text-sm font-semibold text-rcBlue hover:underline"
                                    >
                                        Zum Rückblick &rarr;
                                    </Link>
                                </div>
                            </aside>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
};

export default AktuellesTeaser;