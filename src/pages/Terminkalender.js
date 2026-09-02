import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { FaChevronLeft, FaChevronRight, FaClock, FaMapMarkerAlt } from 'react-icons/fa';
import PageBanner from '../components/PageBanner';
import { supabase } from '../supabaseClient';
import angeboteBannerImage from '../assets/images/angebote-banner.jpg';
import {
    dateToKey,
    expandRecurringEntries,
    formatDateLabel,
    formatMonthTitle,
    formatTimeRange,
    getCalendarGridDays,
    parseLocalDate,
    sortCalendarItems,
    WEEKDAY_OPTIONS,
} from '../utils/calendarUtils';

const colorBadgeClasses = {
    red: 'bg-red-100 text-red-700',
    emerald: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-700',
    blue: 'bg-blue-100 text-blue-700',
};

const colorChipClasses = {
    red: 'bg-red-50 text-red-700 border-red-200/80',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    amber: 'bg-amber-50 text-amber-800 border-amber-200/80',
    blue: 'bg-blue-50 text-blue-700 border-blue-200/80',
};

const colorDotClasses = {
    red: 'bg-red-500',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    blue: 'bg-rcBlue',
};

const buildSingleOccurrences = (singleEntries = []) => {
    return singleEntries.map((entry) => ({
        id: `single-${entry.id}`,
        sourceType: 'single',
        sourceId: entry.id,
        dateKey: entry.entry_date,
        title: entry.title,
        category: entry.category,
        location: entry.location,
        description: entry.description,
        startTime: entry.start_time,
        endTime: entry.end_time,
        color: entry.color || 'red',
    }));
};

const getDefaultSelectedKey = (monthDate) => {
    const today = parseLocalDate(new Date());

    if (today.getFullYear() === monthDate.getFullYear() && today.getMonth() === monthDate.getMonth()) {
        return dateToKey(today);
    }

    return dateToKey(new Date(monthDate.getFullYear(), monthDate.getMonth(), 1, 12, 0, 0, 0));
};

const DayCell = ({ day, entries, isSelected, onClick }) => {
    const hasEntries = entries.length > 0;
    const isCurrentMonth = day.inCurrentMonth;

    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={isSelected}
            className={`group relative flex min-h-[48px] sm:min-h-[96px] w-full flex-col justify-between rounded-lg sm:rounded-xl border p-1 sm:p-2 text-left transition duration-150 ${
                isSelected
                    ? 'border-rcBlue bg-blue-50/70 ring-2 ring-rcBlue shadow-sm'
                    : isCurrentMonth
                    ? hasEntries
                        ? 'border-gray-200 bg-white hover:border-rcBlue/60 hover:bg-blue-50/20'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    : 'border-gray-100 bg-gray-50/40 text-gray-300'
            }`}
        >
            <div className="flex w-full items-center justify-center sm:justify-between">
                <span
                    className={`inline-flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full text-xs sm:text-sm font-semibold transition-colors ${
                        isSelected
                            ? 'bg-rcBlue text-white shadow-sm'
                            : day.isToday
                            ? 'border-2 border-rcBlue text-rcBlue font-bold'
                            : isCurrentMonth
                            ? 'text-gray-800'
                            : 'text-gray-400'
                    }`}
                >
                    {day.date.getDate()}
                </span>
            </div>

            {/* Desktop/Tablet: Color-coded Category or Title Chips */}
            {hasEntries && isCurrentMonth && (
                <div className="mt-1.5 hidden w-full space-y-1 sm:block">
                    {entries.slice(0, 2).map((entry) => {
                        const label = entry.category || entry.title;
                        const chipClass = colorChipClasses[entry.color] || colorChipClasses.blue;
                        return (
                            <div
                                key={entry.id}
                                className={`truncate rounded-md border px-1.5 py-0.5 text-[11px] font-semibold ${chipClass}`}
                                title={entry.title}
                            >
                                {label}
                            </div>
                        );
                    })}
                    {entries.length > 2 && (
                        <div className="text-[10px] font-bold text-gray-500 pl-1">
                            +{entries.length - 2} weitere
                        </div>
                    )}
                </div>
            )}

            {/* Mobile: Compact Colored Dots */}
            {hasEntries && isCurrentMonth ? (
                <div className="mt-0.5 flex w-full items-center justify-center gap-1 sm:hidden">
                    {entries.slice(0, 3).map((entry, i) => (
                        <span
                            key={i}
                            className={`h-1.5 w-1.5 rounded-full ${colorDotClasses[entry.color] || colorDotClasses.blue}`}
                        />
                    ))}
                    {entries.length > 3 && <span className="text-[9px] font-bold text-gray-500">+</span>}
                </div>
            ) : (
                <div className="h-1 sm:hidden" />
            )}
        </button>
    );
};

export default function Terminkalender() {
    const [currentMonth, setCurrentMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1, 12, 0, 0, 0));
    const [selectedDateKey, setSelectedDateKey] = useState(() => getDefaultSelectedKey(new Date()));
    const [recurringEntries, setRecurringEntries] = useState([]);
    const [singleEntries, setSingleEntries] = useState([]);
    const [exceptions, setExceptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [detailsHighlight, setDetailsHighlight] = useState(false);
    const detailsPanelRef = useRef(null);
    const detailsHighlightTimeoutRef = useRef(null);

    const gridDays = useMemo(() => getCalendarGridDays(currentMonth), [currentMonth]);
    const rangeStart = gridDays[0]?.date;
    const rangeEnd = gridDays[gridDays.length - 1]?.date;

    useEffect(() => {
        const fetchCalendarData = async () => {
            if (!rangeStart || !rangeEnd) return;

            setLoading(true);
            setError('');

            const startKey = dateToKey(rangeStart);
            const endKey = dateToKey(rangeEnd);

            const [recurringResponse, singleResponse, exceptionsResponse] = await Promise.all([
                supabase
                    .from('calendar_recurring_entries')
                    .select('*')
                    .eq('is_public', true)
                    .eq('is_active', true)
                    .lte('start_date', endKey)
                    .gte('end_date', startKey)
                    .order('start_date', { ascending: true }),
                supabase
                    .from('calendar_single_entries')
                    .select('*')
                    .eq('is_public', true)
                    .eq('is_active', true)
                    .gte('entry_date', startKey)
                    .lte('entry_date', endKey)
                    .order('entry_date', { ascending: true }),
                supabase.from('calendar_recurring_exceptions').select('*'),
            ]);

            if (recurringResponse.error || singleResponse.error) {
                setError(recurringResponse.error?.message || singleResponse.error?.message || 'Kalender konnte nicht geladen werden.');
                setRecurringEntries([]);
                setSingleEntries([]);
            } else {
                setRecurringEntries(recurringResponse.data || []);
                setSingleEntries(singleResponse.data || []);
                setExceptions(exceptionsResponse.data || []);
            }

            setLoading(false);
        };

        fetchCalendarData();
    }, [rangeStart, rangeEnd]);

    useEffect(() => {
        const visibleCurrentMonthKeys = new Set(gridDays.filter((day) => day.inCurrentMonth).map((day) => day.key));
        if (!visibleCurrentMonthKeys.has(selectedDateKey)) {
            setSelectedDateKey(getDefaultSelectedKey(currentMonth));
        }
    }, [currentMonth, gridDays, selectedDateKey]);

    useEffect(() => {
        return () => {
            if (detailsHighlightTimeoutRef.current) {
                window.clearTimeout(detailsHighlightTimeoutRef.current);
            }
        };
    }, []);

    const entriesByDay = useMemo(() => {
        const recurringOccurrences = expandRecurringEntries(recurringEntries, rangeStart, rangeEnd, exceptions);
        const singleOccurrences = buildSingleOccurrences(singleEntries);
        const groupedEntries = {};

        sortCalendarItems([...recurringOccurrences, ...singleOccurrences]).forEach((entry) => {
            if (!groupedEntries[entry.dateKey]) {
                groupedEntries[entry.dateKey] = [];
            }

            groupedEntries[entry.dateKey].push(entry);
        });

        return groupedEntries;
    }, [rangeEnd, rangeStart, recurringEntries, singleEntries, exceptions]);

    const selectedDate = useMemo(() => parseLocalDate(selectedDateKey), [selectedDateKey]);
    const selectedEntries = entriesByDay[selectedDateKey] || [];

    const handleMonthChange = (offset) => {
        setCurrentMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1, 12, 0, 0, 0));
    };

    const handleDayClick = (day) => {
        setSelectedDateKey(day.key);

        if (!day.inCurrentMonth) {
            setCurrentMonth(new Date(day.date.getFullYear(), day.date.getMonth(), 1, 12, 0, 0, 0));
        }

        setDetailsHighlight(true);
        if (detailsHighlightTimeoutRef.current) {
            window.clearTimeout(detailsHighlightTimeoutRef.current);
        }
        detailsHighlightTimeoutRef.current = window.setTimeout(() => setDetailsHighlight(false), 1800);
    };

    return (
        <>
            <Helmet>
                <title>Terminkalender | Bürgertreff Wissen</title>
                <meta
                    name="description"
                    content="Monatsübersicht aller geplanten Angebote und regelmäßigen Aktivitäten des Bürgertreff Wissen."
                />
            </Helmet>

            <div>
                <PageBanner title="Terminkalender" imageUrl={angeboteBannerImage} />

                <main className="bg-rcGray py-8 md:py-20">
                    <div className="container mx-auto space-y-6 md:space-y-8 px-4 sm:px-6">
                        {/* Header & Legend Card */}
                        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-8">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                <div className="max-w-3xl">
                                    <h2 className="text-xl font-bold text-rcDarkGray sm:text-2xl md:text-3xl">Monatliche Terminübersicht</h2>
                                    <p className="mt-1 text-xs text-gray-600 sm:text-sm">
                                        Wählen Sie einen beliebigen Tag im Kalender aus, um alle Termine und Angebote einzusehen.
                                    </p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm font-medium text-gray-600">
                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-rcBlue">
                                        <span className="h-2 w-2 rounded-full bg-rcBlue"></span>
                                        Termine vorhanden
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-600">
                                        <span className="h-2 w-2 rounded-full border-2 border-rcBlue"></span>
                                        Heute
                                    </span>
                                </div>
                            </div>
                        </section>

                        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_360px] xl:gap-8">
                            <div className="rounded-2xl border border-gray-200 bg-white p-3.5 shadow-sm sm:p-6">
                                <div className="mb-4 sm:mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Monatsansicht</p>
                                        <h3 className="text-xl font-bold capitalize text-rcDarkGray sm:text-2xl">{formatMonthTitle(currentMonth)}</h3>
                                    </div>
                                    <div className="flex items-center gap-1.5 sm:gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleMonthChange(-1)}
                                            className="rounded-full border border-gray-300 p-2 text-gray-700 hover:bg-gray-100 sm:p-3"
                                            aria-label="Vorheriger Monat"
                                        >
                                            <FaChevronLeft className="text-xs sm:text-base" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setCurrentMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1, 12, 0, 0, 0))}
                                            className="rounded-full border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 sm:px-4 sm:py-3 sm:text-sm"
                                        >
                                            Heute
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleMonthChange(1)}
                                            className="rounded-full border border-gray-300 p-2 text-gray-700 hover:bg-gray-100 sm:p-3"
                                            aria-label="Nächster Monat"
                                        >
                                            <FaChevronRight className="text-xs sm:text-base" />
                                        </button>
                                    </div>
                                </div>

                                <div className="mb-2 grid grid-cols-7 gap-1 sm:gap-2">
                                    {WEEKDAY_OPTIONS.map((weekday) => (
                                        <div key={weekday.value} className="py-1 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-500 sm:text-xs">
                                            {weekday.label}
                                        </div>
                                    ))}
                                </div>

                                {loading ? (
                                    <div className="flex min-h-[260px] items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 text-xs sm:text-sm text-gray-500 sm:min-h-[420px]">
                                        Kalender wird geladen...
                                    </div>
                                ) : error ? (
                                    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs sm:text-sm text-red-700">
                                        {error}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-7 gap-1 sm:gap-2">
                                        {gridDays.map((day) => (
                                            <DayCell
                                                key={day.key}
                                                day={day}
                                                entries={entriesByDay[day.key] || []}
                                                isSelected={selectedDateKey === day.key}
                                                onClick={() => handleDayClick(day)}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>

                            <aside
                                ref={detailsPanelRef}
                                className={`scroll-mt-24 rounded-2xl border bg-white p-6 shadow-sm transition-all duration-300 xl:sticky xl:top-24 xl:self-start ${
                                    detailsHighlight ? 'border-blue-300 ring-2 ring-rcBlue shadow-lg shadow-blue-100/80' : 'border-gray-200'
                                }`}
                            >
                                <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">Tagesdetails</p>
                                <h3 className="mt-2 text-2xl font-bold text-rcDarkGray">
                                    {selectedDate ? formatDateLabel(selectedDate) : 'Datum wählen'}
                                </h3>

                                <div aria-live="polite" className={`mt-4 rounded-xl border px-4 py-3 text-sm ${selectedEntries.length > 0 ? 'border-blue-100 bg-blue-50 text-gray-700' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
                                    <span className="font-semibold">Ausgewählter Tag:</span>{' '}
                                    {selectedEntries.length > 0
                                        ? `${selectedEntries.length} Termin${selectedEntries.length > 1 ? 'e' : ''} geöffnet.`
                                        : 'für diesen Tag ist aktuell nichts eingetragen.'}
                                </div>

                                <div className="mt-6 space-y-4">
                                    {selectedEntries.length === 0 ? (
                                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                                            Für diesen Tag ist aktuell keine Aktivität eingetragen.
                                        </div>
                                    ) : (
                                        selectedEntries.map((entry) => (
                                            <article key={entry.id} className="rounded-xl border border-gray-200 p-4">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <h4 className="text-lg font-semibold text-rcDarkGray">{entry.title}</h4>
                                                        {entry.category && (
                                                            <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${colorBadgeClasses[entry.color] || colorBadgeClasses.red}`}>
                                                                {entry.category}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="mt-4 space-y-2 text-sm text-gray-600">
                                                    <p className="flex items-center">
                                                        <FaClock className="mr-2 text-rcBlue" />
                                                        {formatTimeRange(entry.startTime, entry.endTime)}
                                                    </p>
                                                    {entry.location && (
                                                        <p className="flex items-center">
                                                            <FaMapMarkerAlt className="mr-2 text-rcBlue" />
                                                            {entry.location}
                                                        </p>
                                                    )}
                                                </div>

                                                {entry.description && (
                                                    <p className="mt-4 text-sm leading-6 text-gray-600">{entry.description}</p>
                                                )}
                                            </article>
                                        ))
                                    )}
                                </div>

                                <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-gray-700">
                                    Fragen zu freien Zeiten oder laufenden Angeboten? Nehmen Sie direkt Kontakt mit uns auf.
                                    <div className="mt-3">
                                        <Link to="/kontakt" className="font-semibold text-rcBlue hover:underline">
                                            Zur Kontaktseite
                                        </Link>
                                    </div>
                                </div>
                            </aside>
                        </section>
                    </div>
                </main>
            </div>
        </>
    );
}