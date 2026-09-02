// src/components/PageBanner.js
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { dateToKey, expandRecurringEntries, getComparableEventDate, isEventInPast, mergeUpcomingEvents, parseLocalDate } from '../utils/calendarUtils';
import AnnouncementTicker from './AnnouncementTicker';

const formatTickerDate = (dateString) => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        return date.toLocaleString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit',
        });
    } catch (e) {
        return '';
    }
};

const PageBanner = ({ title, imageUrl }) => {
    const [announcements, setAnnouncements] = useState([]);

    useEffect(() => {
        const fetchTickerEntries = async () => {
            const today = parseLocalDate(new Date());
            const horizon = new Date(today);
            horizon.setDate(horizon.getDate() + 30);
            const todayKey = dateToKey(today);
            const horizonKey = dateToKey(horizon);
            const now = new Date();

            const [recurringResponse, singleResponse, ereignisseResponse, exceptionsResponse] = await Promise.all([
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
                    .select('id, title, category, location, event_date, end_time, is_big_event')
                    .eq('is_public', true)
                    .order('event_date', { ascending: true }),
                supabase.from('calendar_recurring_exceptions').select('*')
            ]);

            const ereignisseOccurrences = (ereignisseResponse.data || [])
                .filter((event) => event.event_date && !isEventInPast(event.event_date, now))
                .map((event) => {
                    const eventDate = getComparableEventDate(event.event_date);
                    return {
                        dateKey: eventDate ? dateToKey(eventDate) : null,
                        title: event.title,
                        category: event.category,
                        location: event.location,
                        startTime: eventDate ? String(eventDate.toTimeString()).slice(0, 5) : null,
                        endTime: event.end_time ? String(event.end_time).slice(0, 5) : null,
                        sortKey: eventDate ? eventDate.getTime() : Number.MAX_SAFE_INTEGER,
                        isPriority: true,
                        isBigEvent: event.is_big_event || false,
                    };
                });

            const recurringOccurrences = expandRecurringEntries(recurringResponse.data || [], today, horizon, exceptionsResponse.data || []).map((entry) => ({
                dateKey: entry.dateKey,
                title: entry.title,
                category: entry.category,
                location: entry.location,
                startTime: entry.startTime,
                sortKey: parseLocalDate(entry.dateKey)?.getTime() || Number.MAX_SAFE_INTEGER,
                isPriority: false,
            }));

            const singleOccurrences = (singleResponse.data || []).map((entry) => ({
                dateKey: entry.entry_date,
                title: entry.title,
                category: entry.category,
                location: entry.location,
                startTime: entry.start_time,
                sortKey: parseLocalDate(entry.entry_date)?.getTime() || Number.MAX_SAFE_INTEGER,
                isPriority: false,
            }));

            const sortByDateKey = (a, b) => {
                if (a.dateKey !== b.dateKey) return (a.dateKey || '').localeCompare(b.dateKey || '');
                const leftTime = a.startTime ? String(a.startTime).slice(0, 5) : '99:99';
                const rightTime = b.startTime ? String(b.startTime).slice(0, 5) : '99:99';
                if (leftTime !== rightTime) return leftTime.localeCompare(rightTime);
                return String(a.title || '').localeCompare(String(b.title || ''), 'de');
            };

            const allMerged = mergeUpcomingEvents([...ereignisseOccurrences, ...recurringOccurrences, ...singleOccurrences]);
            const priorityItems = allMerged.filter((e) => e.isPriority).sort(sortByDateKey);
            const calendarItems = allMerged.filter((e) => !e.isPriority).sort(sortByDateKey);
            const combined = [...priorityItems, ...calendarItems.slice(0, 5)];

            const formatted = combined.map((entry) => {
                const date = formatTickerDate(entry.dateKey);
                const startTime = entry.startTime ? String(entry.startTime).slice(0, 5) : null;
                const endTime = entry.endTime ? String(entry.endTime).slice(0, 5) : null;
                let timeText = null;
                if (startTime && endTime) {
                    timeText = `${startTime}–${endTime} Uhr`;
                } else if (startTime) {
                    timeText = `${startTime} Uhr`;
                }
                let text = `${date}: ${entry.title}`;
                if (timeText) {
                    text += ` (${timeText})`;
                }
                if (entry.location) {
                    text += ` – ${entry.location}`;
                }
                return { text, isBig: entry.isBigEvent || false };
            });

            setAnnouncements(formatted);
        };

        fetchTickerEntries();
    }, []);

    return (
        <div className="relative h-64 sm:h-72 bg-gray-900 overflow-hidden">
            {/* Sayfa Banner Fotoğrafı Üzerine Yüzen Açık Buzlu Cam Kayan Yazı (Anasayfa ile birebir aynı format) */}
            {announcements && announcements.length > 0 && (
                <div className="absolute top-0 left-0 w-full z-20">
                    <AnnouncementTicker items={announcements} variant="heroGlass" />
                </div>
            )}

            <img
                src={imageUrl}
                alt={title}
                className="absolute inset-0 w-full h-full object-cover opacity-60"
            />
            
            {/* Karartma Gradyanı */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/70 pointer-events-none"></div>

            <div className="relative h-full flex justify-center items-center px-4 pt-8">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight drop-shadow-lg text-center">
                    {title}
                </h1>
            </div>
        </div>
    );
};

export default PageBanner;