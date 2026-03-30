import React, { useEffect, useMemo, useState } from 'react';
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
    const isOccupied = entries.length > 0;
    const dayClasses = day.inCurrentMonth
        ? isOccupied
            ? 'border-indigo-200 bg-indigo-50 hover:bg-indigo-100'
            : 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100'
        : isOccupied
            ? 'border-indigo-100 bg-indigo-50/60 text-gray-400 hover:bg-indigo-100/80'
            : 'border-gray-200 bg-gray-50 text-gray-400 hover:bg-gray-100';

    return (
        <div className="relative">
            <button
                type="button"
                onClick={onClick}
                className={`group relative min-h-[96px] w-full rounded-xl border p-2 text-left transition sm:min-h-[112px] ${dayClasses} ${
                    isSelected ? 'ring-2 ring-rcBlue' : ''
                } ${day.isToday ? 'shadow-[inset_0_0_0_1px_#1f5ea8]' : ''}`}
            >
                <div className="flex items-start justify-between gap-2">
                    <span className={`text-sm font-semibold ${day.inCurrentMonth ? 'text-rcDarkGray' : 'text-gray-400'}`}>
                        {day.date.getDate()}
                    </span>
                    <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            isOccupied ? 'bg-indigo-600 text-white' : 'bg-emerald-600 text-white'
                        }`}
                    >
                        {isOccupied ? 'belegt' : 'frei'}
                    </span>
                </div>

                <div className="mt-2 space-y-1 hidden md:block">
                    {entries.slice(0, 2).map((entry) => (
                        <div key={entry.id} className="rounded-lg bg-white/80 px-2 py-1 text-xs text-rcDarkGray shadow-sm">
                            <div className="font-semibold">{entry.startTime ? String(entry.startTime).slice(0, 5) : '--:--'}</div>
                            <div className="truncate">{entry.title}</div>
                        </div>
                    ))}
                    {entries.length > 2 && (
                        <div className="text-xs font-semibold text-gray-600">+{entries.length - 2} weitere</div>
                    )}
                </div>

                <div className="mt-2 text-xs font-semibold text-gray-600 md:hidden">
                    {entries.length > 0 ? `${entries.length} Termin${entries.length > 1 ? 'e' : ''}` : 'Noch frei'}
                </div>

                {entries.length > 0 && (
                    <div className="pointer-events-none absolute left-0 top-full z-30 mt-2 hidden w-80 rounded-xl border border-gray-200 bg-white p-3 shadow-xl md:group-hover:block md:group-focus-visible:block">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Tagesvorschau</p>
                        <div className="space-y-3">
                            {entries.map((entry) => (
                                <div key={`preview-${entry.id}`} className="rounded-lg border border-gray-100 bg-gray-50 p-2">
                                    <p className="text-xs font-semibold text-rcBlue">{formatTimeRange(entry.startTime, entry.endTime)}</p>
                                    <p className="mt-1 text-sm font-semibold text-rcDarkGray">{entry.title}</p>
                                    {entry.description && <p className="mt-1 text-xs text-gray-600">{entry.description}</p>}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </button>
        </div>
    );
};

export default function Terminkalender() {
    const [currentMonth, setCurrentMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1, 12, 0, 0, 0));
    const [selectedDateKey, setSelectedDateKey] = useState(() => getDefaultSelectedKey(new Date()));
    const [recurringEntries, setRecurringEntries] = useState([]);
    const [singleEntries, setSingleEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

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

            const [recurringResponse, singleResponse] = await Promise.all([
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
            ]);

            if (recurringResponse.error || singleResponse.error) {
                setError(recurringResponse.error?.message || singleResponse.error?.message || 'Kalender konnte nicht geladen werden.');
                setRecurringEntries([]);
                setSingleEntries([]);
            } else {
                setRecurringEntries(recurringResponse.data || []);
                setSingleEntries(singleResponse.data || []);
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

    const entriesByDay = useMemo(() => {
        const recurringOccurrences = expandRecurringEntries(recurringEntries, rangeStart, rangeEnd);
        const singleOccurrences = buildSingleOccurrences(singleEntries);
        const groupedEntries = {};

        sortCalendarItems([...recurringOccurrences, ...singleOccurrences]).forEach((entry) => {
            if (!groupedEntries[entry.dateKey]) {
                groupedEntries[entry.dateKey] = [];
            }

            groupedEntries[entry.dateKey].push(entry);
        });

        return groupedEntries;
    }, [rangeEnd, rangeStart, recurringEntries, singleEntries]);

    const selectedDate = useMemo(() => parseLocalDate(selectedDateKey), [selectedDateKey]);
    const selectedEntries = entriesByDay[selectedDateKey] || [];
    const currentMonthDays = gridDays.filter((day) => day.inCurrentMonth);
    const occupiedDayCount = currentMonthDays.filter((day) => (entriesByDay[day.key] || []).length > 0).length;
    const freeDayCount = currentMonthDays.length - occupiedDayCount;
    const totalEntriesInMonth = currentMonthDays.reduce((sum, day) => sum + ((entriesByDay[day.key] || []).length), 0);

    const handleMonthChange = (offset) => {
        setCurrentMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1, 12, 0, 0, 0));
    };

    const handleDayClick = (day) => {
        setSelectedDateKey(day.key);
        if (!day.inCurrentMonth) {
            setCurrentMonth(new Date(day.date.getFullYear(), day.date.getMonth(), 1, 12, 0, 0, 0));
        }
    };

    return (
        <>
            <Helmet>
                <title>Terminkalender | Bürgertreff Wissen</title>
                <meta
                    name="description"
                    content="Monatsübersicht aller geplanten Angebote und regelmäßigen Aktivitäten des Bürgertreff Wissen. Belegte Tage sind sofort sichtbar, freie Tage bleiben grün markiert."
                />
            </Helmet>

            <div>
                <PageBanner title="Terminkalender" imageUrl={angeboteBannerImage} />

                <main className="bg-rcGray py-12 md:py-20">
                    <div className="container mx-auto space-y-8 px-6">
                        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
                            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                                <div className="max-w-3xl">
                                    <h2 className="text-3xl font-bold text-rcDarkGray">Belegte und freie Tage auf einen Blick</h2>
                                    <p className="mt-3 text-gray-600">
                                        Dieser Kalender zeigt ausschließlich die im separaten Kalender-Modul gepflegten Termine. Blau markierte Tage sind bereits belegt, grüne Tage sind derzeit noch frei.
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-3 text-sm font-semibold">
                                    <span className="inline-flex items-center rounded-full bg-indigo-100 px-4 py-2 text-indigo-700">Blau = belegt</span>
                                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-4 py-2 text-emerald-700">Grün = derzeit frei</span>
                                </div>
                            </div>
                        </section>

                        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                                <p className="text-sm text-gray-500">Belegte Tage im Monat</p>
                                <p className="mt-2 text-3xl font-bold text-indigo-600">{occupiedDayCount}</p>
                            </div>
                            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                                <p className="text-sm text-gray-500">Freie Tage im Monat</p>
                                <p className="mt-2 text-3xl font-bold text-emerald-600">{freeDayCount}</p>
                            </div>
                            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                                <p className="text-sm text-gray-500">Geplante Termine im Monat</p>
                                <p className="mt-2 text-3xl font-bold text-rcBlue">{totalEntriesInMonth}</p>
                            </div>
                        </section>

                        <section className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,2fr)_360px]">
                            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">
                                <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                    <div>
                                        <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">Monatsansicht</p>
                                        <h3 className="text-2xl font-bold text-rcDarkGray capitalize">{formatMonthTitle(currentMonth)}</h3>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleMonthChange(-1)}
                                            className="rounded-full border border-gray-300 p-3 text-gray-700 hover:bg-gray-100"
                                            aria-label="Vorheriger Monat"
                                        >
                                            <FaChevronLeft />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setCurrentMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1, 12, 0, 0, 0))}
                                            className="rounded-full border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-100"
                                        >
                                            Heute
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleMonthChange(1)}
                                            className="rounded-full border border-gray-300 p-3 text-gray-700 hover:bg-gray-100"
                                            aria-label="Nächster Monat"
                                        >
                                            <FaChevronRight />
                                        </button>
                                    </div>
                                </div>

                                <div className="-mx-1 overflow-x-auto pb-1">
                                    <div className="mb-3 grid min-w-[700px] grid-cols-7 gap-2 px-1">
                                    {WEEKDAY_OPTIONS.map((weekday) => (
                                        <div key={weekday.value} className="px-2 py-2 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            {weekday.label}
                                        </div>
                                    ))}
                                    </div>
                                </div>

                                {loading ? (
                                    <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 text-gray-500">
                                        Kalender wird geladen...
                                    </div>
                                ) : error ? (
                                    <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
                                        {error}
                                    </div>
                                ) : (
                                    <div className="-mx-1 overflow-x-auto pb-1">
                                        <div className="grid min-w-[700px] grid-cols-7 gap-2 px-1">
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
                                    </div>
                                )}
                            </div>

                            <aside className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm xl:sticky xl:top-24 xl:self-start">
                                <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">Tagesdetails</p>
                                <h3 className="mt-2 text-2xl font-bold text-rcDarkGray">
                                    {selectedDate ? formatDateLabel(selectedDate) : 'Datum wählen'}
                                </h3>

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