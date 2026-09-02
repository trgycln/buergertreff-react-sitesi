// src/components/AktuellesTeaser.js
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaRegCalendarAlt, FaMapMarkerAlt, FaArrowRight } from 'react-icons/fa';
import { supabase } from '../supabaseClient';
import { dateToKey, expandRecurringEntries, getComparableEventDate, isEventInPast, mergeUpcomingEvents, parseLocalDate } from '../utils/calendarUtils';

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

const AktuellesTeaser = () => {
    const [events, setEvents] = useState([]);
    const [recurringEntries, setRecurringEntries] = useState([]);
    const [singleEntries, setSingleEntries] = useState([]);
    const [exceptions, setExceptions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEvents = async () => {
            setLoading(true);
            const today = parseLocalDate(new Date());
            const horizon = new Date(today);
            horizon.setMonth(horizon.getMonth() + 4);
            const todayKey = dateToKey(today);
            const horizonKey = dateToKey(horizon);

            const [eventsResponse, recurringResponse, singleResponse, exceptionsResponse] = await Promise.all([
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
                supabase.from('calendar_recurring_exceptions').select('*'),
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
                setExceptions(exceptionsResponse.data || []);
            }

            setLoading(false);
        };

        fetchEvents();
    }, []);

    const upcoming = useMemo(() => {
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
                    category: e.category,
                    location: e.location,
                    description: e.description,
                    eventDate: e.event_date,
                    startTime: eventDate ? String(eventDate.toTimeString()).slice(0, 5) : null,
                    linkTo: `/angebote/${e.id}`,
                    sortKey: eventDate ? eventDate.getTime() : Number.MAX_SAFE_INTEGER,
                    isPriority: true,
                };
            });

        const upcomingFromRecurring = expandRecurringEntries(recurringEntries, rangeStart, rangeEnd, exceptions).map((entry) => ({
            id: entry.id,
            title: entry.title,
            category: entry.category,
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
            category: entry.category,
            location: entry.location,
            description: entry.description,
            dateKey: entry.entry_date,
            startTime: entry.start_time,
            linkTo: entry.source_event_id ? `/angebote/${entry.source_event_id}` : null,
            sortKey: parseLocalDate(entry.entry_date)?.getTime() || Number.MAX_SAFE_INTEGER,
        }));

        const sortByDate = (a, b) => {
            if (a.sortKey !== b.sortKey) return a.sortKey - b.sortKey;
            const leftTime = a.startTime ? String(a.startTime).slice(0, 5) : '99:99';
            const rightTime = b.startTime ? String(b.startTime).slice(0, 5) : '99:99';
            if (leftTime !== rightTime) return leftTime.localeCompare(rightTime);
            return String(a.title || '').localeCompare(String(b.title || ''), 'de');
        };

        const allMerged = mergeUpcomingEvents([...upcomingFromEvents, ...upcomingFromRecurring, ...upcomingFromSingle])
            .filter((entry) => {
                if (entry.dateKey) {
                    return !isEventInPast(entry.dateKey, now, entry.startTime);
                }
                return !isEventInPast(entry.eventDate, now, entry.startTime);
            });

        const priorityEvents = allMerged.filter((e) => e.isPriority).sort(sortByDate);
        const calendarEvents = allMerged.filter((e) => !e.isPriority).sort(sortByDate);
        const remainingSlots = Math.max(0, 6 - priorityEvents.length);
        return [...priorityEvents, ...calendarEvents.slice(0, remainingSlots)];
    }, [events, recurringEntries, singleEntries, exceptions]);

    return (
        <section className="bg-white py-12 md:py-16">
            <div className="container mx-auto px-6">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 pb-3 border-b-2 border-rcLightBlue gap-2">
                    <h2 className="text-2xl sm:text-3xl font-bold text-rcDarkGray">Aktuelles</h2>
                    <Link to="/angebote" className="text-xs sm:text-sm md:text-base font-semibold text-rcBlue hover:underline inline-flex items-center gap-1 group whitespace-nowrap self-start sm:self-auto">
                        <span>Alle Veranstaltungen anzeigen</span>
                        <FaArrowRight className="text-xs transition-transform duration-300 group-hover:translate-x-1" />
                    </Link>
                </div>

                {loading ? (
                    <p className="text-gray-600">Aktuelles wird geladen...</p>
                ) : (
                    <div className="bg-rcGray p-6 md:p-8 rounded-2xl border border-gray-200 shadow-sm">
                        <h3 className="text-xl font-semibold text-rcDarkGray mb-6">Nächste Termine</h3>

                        {upcoming.length === 0 ? (
                            <p className="text-gray-500 italic">Aktuell sind keine kommenden Termine geplant.</p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {upcoming.map((event) => {
                                    const cardContent = (
                                        <div className="flex flex-col h-full bg-white p-5 rounded-xl border border-gray-200 hover:border-rcBlue/40 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                                            <div className="flex items-center justify-between gap-2 mb-2">
                                                <span className="flex items-center text-xs font-semibold text-rcBlue bg-blue-50 px-2.5 py-1 rounded-md">
                                                    <FaRegCalendarAlt className="mr-1.5 text-rcRed" />
                                                    {formatUpcomingDate(event)}
                                                </span>
                                                {event.category && (
                                                    <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                                                        {event.category === 'Offene Treff' ? 'Offener Treff' : event.category}
                                                    </span>
                                                )}
                                            </div>

                                            <h4 className="text-base font-bold text-rcDarkGray group-hover:text-rcBlue transition-colors line-clamp-2 mb-2 mt-1">
                                                {event.title}
                                            </h4>

                                            {event.location && (
                                                <div className="flex items-center text-xs text-gray-600 mb-2">
                                                    <FaMapMarkerAlt className="mr-1.5 text-gray-400 flex-shrink-0" />
                                                    <span className="truncate">{event.location}</span>
                                                </div>
                                            )}

                                            {event.description && (
                                                <p className="text-xs text-gray-600 line-clamp-2 mt-1 mb-3">
                                                    {event.description}
                                                </p>
                                            )}

                                            {event.linkTo && (
                                                <div className="text-right mt-auto pt-2 border-t border-gray-100">
                                                    <span className="text-xs font-semibold text-rcBlue group-hover:underline inline-flex items-center gap-1">
                                                        <span>Mehr erfahren</span>
                                                        <FaArrowRight className="text-[10px]" />
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    );

                                    return event.linkTo ? (
                                        <Link key={event.id} to={event.linkTo} className="group block h-full">
                                            {cardContent}
                                        </Link>
                                    ) : (
                                        <div key={event.id} className="h-full">
                                            {cardContent}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
};

export default AktuellesTeaser;