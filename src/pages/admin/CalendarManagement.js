import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaBan, FaCalendarAlt, FaEdit, FaEye, FaPlus, FaTrashAlt } from 'react-icons/fa';
import { supabase } from '../../supabaseClient';
import { dateToKey, expandRecurringEntries, formatDateLabel, formatRecurrenceRule, formatTimeRange, parseLocalDate, WEEKDAY_OPTIONS } from '../../utils/calendarUtils';

const recurringInitialState = {
    title: '',
    category: '',
    location: '',
    description: '',
    startDate: '',
    endDate: '',
    recurrenceUnit: 'week',
    recurrenceInterval: 1,
    weekdays: [1],
    startTime: '',
    endTime: '',
    color: 'red',
    isPublic: true,
    isActive: true,
};

const singleInitialState = {
    title: '',
    category: '',
    location: '',
    description: '',
    entryDate: '',
    startTime: '',
    endTime: '',
    color: 'red',
    isPublic: true,
    isActive: true,
};

const exceptionInitialState = {
    recurringEntryId: '',
    originalDate: '',
    exceptionType: 'cancelled',
    newDate: '',
    newStartTime: '',
    newEndTime: '',
    note: '',
};

const colorOptions = [
    { value: 'red', label: 'Rot' },
    { value: 'emerald', label: 'Grün' },
    { value: 'amber', label: 'Gelb' },
    { value: 'blue', label: 'Blau' },
];

const categoryOptions = [
    'Frühstück',
    'Offene Treff',
    'Ausstellungen',
    'Spielen',
    'Singen',
    'Handarbeiten',
    'Schreibwerkstatt',
    'Nachbarschaftsbörse',
    'Sonntagsgespräch',
    'Beratung',
    'Nachhilfe',
    'Bürgertreff unterwegs',
    'Sonstiges',
];

const normalizeTime = (value) => (value ? String(value).slice(0, 5) : '');

const normalizeInterval = (value) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 1) return 1;
    return Math.floor(parsed);
};

const MessageBanner = ({ message }) => {
    if (!message?.text) return null;

    return (
        <div
            className={`rounded-lg border px-4 py-3 text-sm ${
                message.type === 'error'
                    ? 'border-red-300 bg-red-50 text-red-700'
                    : 'border-green-300 bg-green-50 text-green-700'
            }`}
        >
            {message.text}
        </div>
    );
};

const FormInput = ({ label, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-rcDarkGray">{label}</label>
        <input
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-rcBlue focus:outline-none focus:ring-rcBlue"
            {...props}
        />
    </div>
);

const FormTextarea = ({ label, rows = 4, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-rcDarkGray">{label}</label>
        <textarea
            rows={rows}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-rcBlue focus:outline-none focus:ring-rcBlue"
            {...props}
        />
    </div>
);

const FormSelect = ({ label, children, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-rcDarkGray">{label}</label>
        <select
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-rcBlue focus:outline-none focus:ring-rcBlue"
            {...props}
        >
            {children}
        </select>
    </div>
);

const CheckboxField = ({ checked, label, onChange }) => (
    <label className="flex items-center gap-2 text-sm text-rcDarkGray">
        <input
            type="checkbox"
            checked={checked}
            onChange={(event) => onChange(event.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-rcBlue focus:ring-rcBlue"
        />
        {label}
    </label>
);

export default function CalendarManagement() {
    const [activeTab, setActiveTab] = useState('recurring');
    const [recurringEntries, setRecurringEntries] = useState([]);
    const [singleEntries, setSingleEntries] = useState([]);
    const [exceptions, setExceptions] = useState([]);
    const [recurringForm, setRecurringForm] = useState(recurringInitialState);
    const [singleForm, setSingleForm] = useState(singleInitialState);
    const [exceptionForm, setExceptionForm] = useState(exceptionInitialState);
    const [editingRecurringId, setEditingRecurringId] = useState(null);
    const [editingSingleId, setEditingSingleId] = useState(null);
    const [editingExceptionId, setEditingExceptionId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState(null);

    const fetchCalendarData = async () => {
        setLoading(true);

        const [recurringResponse, singleResponse, exceptionsResponse] = await Promise.all([
            supabase.from('calendar_recurring_entries').select('*').order('start_date', { ascending: false }),
            supabase.from('calendar_single_entries').select('*').order('entry_date', { ascending: false }),
            supabase.from('calendar_recurring_exceptions').select('*').order('original_date', { ascending: false }),
        ]);

        if (recurringResponse.error || singleResponse.error) {
            setMessage({
                type: 'error',
                text: recurringResponse.error?.message || singleResponse.error?.message || 'Kalenderdaten konnten nicht geladen werden.',
            });
        } else {
            setRecurringEntries(recurringResponse.data || []);
            setSingleEntries(singleResponse.data || []);
            setExceptions(exceptionsResponse.data || []);
        }

        setLoading(false);
    };

    useEffect(() => {
        fetchCalendarData();
    }, []);

    const resetRecurringForm = () => {
        setEditingRecurringId(null);
        setRecurringForm(recurringInitialState);
    };

    const resetSingleForm = () => {
        setEditingSingleId(null);
        setSingleForm(singleInitialState);
    };

    const handleRecurringChange = (field, value) => {
        setRecurringForm((current) => ({ ...current, [field]: value }));
    };

    const handleSingleChange = (field, value) => {
        setSingleForm((current) => ({ ...current, [field]: value }));
    };

    const toggleRecurringWeekday = (weekdayValue) => {
        setRecurringForm((current) => {
            const exists = current.weekdays.includes(weekdayValue);
            const weekdays = exists
                ? current.weekdays.filter((item) => item !== weekdayValue)
                : [...current.weekdays, weekdayValue].sort((left, right) => left - right);

            return {
                ...current,
                weekdays,
            };
        });
    };

    const handleRecurringSubmit = async (event) => {
        event.preventDefault();

        if (recurringForm.recurrenceUnit === 'week' && recurringForm.weekdays.length === 0) {
            setMessage({ type: 'error', text: 'Bitte mindestens einen Wochentag auswählen.' });
            return;
        }

        const normalizedInterval = normalizeInterval(recurringForm.recurrenceInterval);
        const anchorDate = parseLocalDate(recurringForm.startDate);
        const fallbackWeekday = anchorDate ? anchorDate.getDay() : 1;
        const weekdays = recurringForm.recurrenceUnit === 'month'
            ? recurringForm.weekdays.length > 0
                ? recurringForm.weekdays
                : [fallbackWeekday]
            : recurringForm.weekdays;

        setSubmitting(true);
        setMessage(null);

        const payload = {
            title: recurringForm.title.trim(),
            category: recurringForm.category.trim() || null,
            location: recurringForm.location.trim() || null,
            description: recurringForm.description.trim() || null,
            start_date: recurringForm.startDate,
            end_date: recurringForm.endDate,
            recurrence_unit: recurringForm.recurrenceUnit,
            recurrence_interval: normalizedInterval,
            weekdays,
            start_time: recurringForm.startTime || null,
            end_time: recurringForm.endTime || null,
            color: recurringForm.color,
            is_public: recurringForm.isPublic,
            is_active: recurringForm.isActive,
        };

        const response = editingRecurringId
            ? await supabase.from('calendar_recurring_entries').update(payload).eq('id', editingRecurringId)
            : await supabase.from('calendar_recurring_entries').insert(payload);

        if (response.error) {
            setMessage({ type: 'error', text: `Speichern fehlgeschlagen: ${response.error.message}` });
        } else {
            setMessage({
                type: 'success',
                text: editingRecurringId ? 'Regelmäßiger Termin aktualisiert.' : 'Regelmäßiger Termin angelegt.',
            });
            resetRecurringForm();
            await fetchCalendarData();
        }

        setSubmitting(false);
    };

    const handleSingleSubmit = async (event) => {
        event.preventDefault();
        setSubmitting(true);
        setMessage(null);

        const payload = {
            title: singleForm.title.trim(),
            category: singleForm.category.trim() || null,
            location: singleForm.location.trim() || null,
            description: singleForm.description.trim() || null,
            entry_date: singleForm.entryDate,
            start_time: singleForm.startTime || null,
            end_time: singleForm.endTime || null,
            color: singleForm.color,
            is_public: singleForm.isPublic,
            is_active: singleForm.isActive,
        };

        const response = editingSingleId
            ? await supabase.from('calendar_single_entries').update(payload).eq('id', editingSingleId)
            : await supabase.from('calendar_single_entries').insert(payload);

        if (response.error) {
            setMessage({ type: 'error', text: `Speichern fehlgeschlagen: ${response.error.message}` });
        } else {
            setMessage({
                type: 'success',
                text: editingSingleId ? 'Sondertermin aktualisiert.' : 'Sondertermin angelegt.',
            });
            resetSingleForm();
            await fetchCalendarData();
        }

        setSubmitting(false);
    };

    const handleEditRecurring = (entry) => {
        setActiveTab('recurring');
        setEditingRecurringId(entry.id);
        setRecurringForm({
            title: entry.title || '',
            category: entry.category || '',
            location: entry.location || '',
            description: entry.description || '',
            startDate: entry.start_date || '',
            endDate: entry.end_date || '',
            recurrenceUnit: entry.recurrence_unit === 'month' ? 'month' : 'week',
            recurrenceInterval: normalizeInterval(entry.recurrence_interval),
            weekdays: Array.isArray(entry.weekdays) ? entry.weekdays.map(Number) : [],
            startTime: normalizeTime(entry.start_time),
            endTime: normalizeTime(entry.end_time),
            color: entry.color || 'red',
            isPublic: Boolean(entry.is_public),
            isActive: Boolean(entry.is_active),
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleEditSingle = (entry) => {
        setActiveTab('single');
        setEditingSingleId(entry.id);
        setSingleForm({
            title: entry.title || '',
            category: entry.category || '',
            location: entry.location || '',
            description: entry.description || '',
            entryDate: entry.entry_date || '',
            startTime: normalizeTime(entry.start_time),
            endTime: normalizeTime(entry.end_time),
            color: entry.color || 'red',
            isPublic: Boolean(entry.is_public),
            isActive: Boolean(entry.is_active),
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const resetExceptionForm = () => {
        setEditingExceptionId(null);
        setExceptionForm(exceptionInitialState);
    };

    const handleExceptionChange = (field, value) => {
        setExceptionForm((current) => ({ ...current, [field]: value }));
    };

    // Compute the upcoming occurrences of the selected recurring series for the next 6 months
    const upcomingDatesForSeries = useMemo(() => {
        if (!exceptionForm.recurringEntryId) return [];
        const entry = recurringEntries.find((e) => e.id === exceptionForm.recurringEntryId);
        if (!entry) return [];
        const rangeStart = parseLocalDate(new Date());
        const rangeEnd = new Date(rangeStart);
        rangeEnd.setMonth(rangeEnd.getMonth() + 6);
        return expandRecurringEntries([entry], rangeStart, rangeEnd)
            .map((occ) => occ.dateKey)
            .sort();
    }, [exceptionForm.recurringEntryId, recurringEntries]);

    const handleExceptionSubmit = async (event) => {
        event.preventDefault();
        if (!exceptionForm.recurringEntryId || !exceptionForm.originalDate) {
            setMessage({ type: 'error', text: 'Bitte Terminserie und Datum auswählen.' });
            return;
        }
        if (exceptionForm.exceptionType === 'rescheduled' && !exceptionForm.newDate) {
            setMessage({ type: 'error', text: 'Bitte das neue Datum für die Verschiebung angeben.' });
            return;
        }
        setSubmitting(true);
        setMessage(null);

        const payload = {
            recurring_entry_id: exceptionForm.recurringEntryId,
            original_date: exceptionForm.originalDate,
            exception_type: exceptionForm.exceptionType,
            new_date: exceptionForm.exceptionType === 'rescheduled' ? exceptionForm.newDate || null : null,
            new_start_time: exceptionForm.exceptionType === 'rescheduled' ? exceptionForm.newStartTime || null : null,
            new_end_time: exceptionForm.exceptionType === 'rescheduled' ? exceptionForm.newEndTime || null : null,
            note: exceptionForm.note.trim() || null,
        };

        const response = editingExceptionId
            ? await supabase.from('calendar_recurring_exceptions').update(payload).eq('id', editingExceptionId)
            : await supabase.from('calendar_recurring_exceptions').insert(payload);

        if (response.error) {
            setMessage({ type: 'error', text: `Speichern fehlgeschlagen: ${response.error.message}` });
        } else {
            setMessage({
                type: 'success',
                text: editingExceptionId ? 'Ausnahme aktualisiert.' : 'Ausnahme gespeichert.',
            });
            resetExceptionForm();
            await fetchCalendarData();
        }
        setSubmitting(false);
    };

    const handleEditException = (ex) => {
        setActiveTab('exceptions');
        setEditingExceptionId(ex.id);
        setExceptionForm({
            recurringEntryId: ex.recurring_entry_id,
            originalDate: ex.original_date,
            exceptionType: ex.exception_type,
            newDate: ex.new_date || '',
            newStartTime: ex.new_start_time ? String(ex.new_start_time).slice(0, 5) : '',
            newEndTime: ex.new_end_time ? String(ex.new_end_time).slice(0, 5) : '',
            note: ex.note || '',
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (tableName, id, title) => {
        if (!window.confirm(`Soll "${title}" wirklich gelöscht werden?`)) {
            return;
        }

        setSubmitting(true);
        const { error } = await supabase.from(tableName).delete().eq('id', id);

        if (error) {
            setMessage({ type: 'error', text: `Löschen fehlgeschlagen: ${error.message}` });
        } else {
            setMessage({ type: 'success', text: 'Eintrag erfolgreich gelöscht.' });
            await fetchCalendarData();
        }

        setSubmitting(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 rounded-xl border border-blue-100 bg-gradient-to-r from-white to-blue-50 p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h2 className="text-2xl font-semibold text-rcDarkGray">Terminkalender verwalten</h2>
                    <p className="mt-2 max-w-3xl text-sm text-gray-600">
                        Legen Sie wiederkehrende Termine und einzelne Sondertermine getrennt an. Der öffentliche Kalender nutzt ausschließlich diese Daten.
                    </p>
                </div>
                <Link
                    to="/terminkalender"
                    className="inline-flex items-center justify-center rounded-lg bg-rcBlue px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
                >
                    <FaEye className="mr-2" />
                    Öffentlichen Kalender ansehen
                </Link>
            </div>

            <MessageBanner message={message} />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <p className="text-sm text-gray-500">Regelmäßige Termine</p>
                    <p className="mt-2 text-3xl font-bold text-rcBlue">{recurringEntries.length}</p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <p className="text-sm text-gray-500">Sondertermine</p>
                    <p className="mt-2 text-3xl font-bold text-rcBlue">{singleEntries.length}</p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <p className="text-sm text-gray-500">Ausnahmen (Absagen & Verschiebungen)</p>
                    <p className="mt-2 text-3xl font-bold text-orange-500">{exceptions.length}</p>
                </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="flex border-b border-gray-200">
                    <button
                        type="button"
                        onClick={() => setActiveTab('recurring')}
                        className={`flex-1 px-5 py-4 text-sm font-semibold ${
                            activeTab === 'recurring' ? 'bg-blue-50 text-rcBlue' : 'text-gray-500 hover:bg-gray-50'
                        }`}
                    >
                        Wiederkehrende Termine
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('single')}
                        className={`flex-1 px-5 py-4 text-sm font-semibold ${
                            activeTab === 'single' ? 'bg-blue-50 text-rcBlue' : 'text-gray-500 hover:bg-gray-50'
                        }`}
                    >
                        Sondertermine
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('exceptions')}
                        className={`flex-1 px-5 py-4 text-sm font-semibold flex items-center justify-center gap-2 ${
                            activeTab === 'exceptions' ? 'bg-orange-50 text-orange-600' : 'text-gray-500 hover:bg-gray-50'
                        }`}
                    >
                        <FaBan className="text-xs" />
                        Ausnahmen
                        {exceptions.length > 0 && (
                            <span className="ml-1 rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-bold text-white">
                                {exceptions.length}
                            </span>
                        )}
                    </button>
                </div>

                {activeTab === 'recurring' ? (
                    <div className="space-y-6 p-6">
                        <form onSubmit={handleRecurringSubmit} className="space-y-6 rounded-xl border border-gray-200 bg-gray-50 p-6">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-rcDarkGray">
                                        {editingRecurringId ? 'Regelmäßigen Termin bearbeiten' : 'Neuen regelmäßigen Termin anlegen'}
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        Beispiele: wöchentlich montags, alle 2 Wochen dienstags oder monatlich am Startdatum.
                                    </p>
                                </div>
                                {editingRecurringId && (
                                    <button
                                        type="button"
                                        onClick={resetRecurringForm}
                                        className="text-sm font-semibold text-rcBlue hover:underline"
                                    >
                                        Bearbeitung abbrechen
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <FormInput
                                    label="Titel"
                                    value={recurringForm.title}
                                    onChange={(event) => handleRecurringChange('title', event.target.value)}
                                    required
                                />
                                <FormSelect
                                    label="Kategorie"
                                    value={recurringForm.category}
                                    onChange={(event) => handleRecurringChange('category', event.target.value)}
                                >
                                    <option value="">Kategorie wählen</option>
                                    {categoryOptions.map((category) => (
                                        <option key={category} value={category}>
                                            {category === 'Offene Treff' ? 'Offener Treff' : category}
                                        </option>
                                    ))}
                                </FormSelect>
                                <FormInput
                                    label="Ort"
                                    value={recurringForm.location}
                                    onChange={(event) => handleRecurringChange('location', event.target.value)}
                                />
                                <FormSelect
                                    label="Akzentfarbe"
                                    value={recurringForm.color}
                                    onChange={(event) => handleRecurringChange('color', event.target.value)}
                                >
                                    {colorOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </FormSelect>
                                <FormInput
                                    label="Startdatum"
                                    type="date"
                                    value={recurringForm.startDate}
                                    onChange={(event) => handleRecurringChange('startDate', event.target.value)}
                                    required
                                />
                                <FormInput
                                    label="Enddatum"
                                    type="date"
                                    value={recurringForm.endDate}
                                    onChange={(event) => handleRecurringChange('endDate', event.target.value)}
                                    required
                                />
                                <FormSelect
                                    label="Wiederholung"
                                    value={recurringForm.recurrenceUnit}
                                    onChange={(event) => handleRecurringChange('recurrenceUnit', event.target.value)}
                                >
                                    <option value="week">Wöchentlich</option>
                                    <option value="month">Monatlich</option>
                                </FormSelect>
                                <FormInput
                                    label="Intervall"
                                    type="number"
                                    min="1"
                                    step="1"
                                    value={recurringForm.recurrenceInterval}
                                    onChange={(event) => handleRecurringChange('recurrenceInterval', event.target.value)}
                                    required
                                />
                                <FormInput
                                    label="Beginn"
                                    type="time"
                                    value={recurringForm.startTime}
                                    onChange={(event) => handleRecurringChange('startTime', event.target.value)}
                                />
                                <FormInput
                                    label="Ende"
                                    type="time"
                                    value={recurringForm.endTime}
                                    onChange={(event) => handleRecurringChange('endTime', event.target.value)}
                                />
                            </div>

                            {recurringForm.recurrenceUnit === 'week' ? (
                                <div>
                                    <p className="block text-sm font-medium text-rcDarkGray">Wochentage</p>
                                    <div className="mt-2 flex flex-wrap gap-3">
                                        {WEEKDAY_OPTIONS.map((option) => (
                                            <label key={option.value} className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700">
                                                <input
                                                    type="checkbox"
                                                    checked={recurringForm.weekdays.includes(option.value)}
                                                    onChange={() => toggleRecurringWeekday(option.value)}
                                                    className="h-4 w-4 rounded border-gray-300 text-rcBlue focus:ring-rcBlue"
                                                />
                                                {option.longLabel}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                                    Monatliche Wiederholung erfolgt am Kalendertag des Startdatums.
                                </div>
                            )}

                            <FormTextarea
                                label="Beschreibung"
                                value={recurringForm.description}
                                onChange={(event) => handleRecurringChange('description', event.target.value)}
                            />

                            <div className="flex flex-wrap gap-5">
                                <CheckboxField
                                    checked={recurringForm.isPublic}
                                    onChange={(checked) => handleRecurringChange('isPublic', checked)}
                                    label="Öffentlich sichtbar"
                                />
                                <CheckboxField
                                    checked={recurringForm.isActive}
                                    onChange={(checked) => handleRecurringChange('isActive', checked)}
                                    label="Aktiv"
                                />
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="inline-flex items-center rounded-lg bg-rcBlue px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <FaPlus className="mr-2" />
                                    {editingRecurringId ? 'Änderungen speichern' : 'Terminserie anlegen'}
                                </button>
                                <button
                                    type="button"
                                    onClick={resetRecurringForm}
                                    className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100"
                                >
                                    Formular zurücksetzen
                                </button>
                            </div>
                        </form>

                        <div className="overflow-x-auto rounded-xl border border-gray-200">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Titel</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Rhythmus</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Zeitraum</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Zeit</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Aktionen</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {loading ? (
                                        <tr>
                                            <td colSpan="6" className="px-4 py-8 text-center text-sm text-gray-500">
                                                Lade Terminserien...
                                            </td>
                                        </tr>
                                    ) : recurringEntries.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="px-4 py-8 text-center text-sm text-gray-500">
                                                Noch keine wiederkehrenden Termine vorhanden.
                                            </td>
                                        </tr>
                                    ) : (
                                        recurringEntries.map((entry) => (
                                            <tr key={entry.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-4 align-top">
                                                    <div className="font-medium text-rcDarkGray">{entry.title}</div>
                                                    <div className="text-xs text-gray-500">{entry.category || 'Ohne Kategorie'}</div>
                                                </td>
                                                <td className="px-4 py-4 align-top text-sm text-gray-700">{formatRecurrenceRule(entry)}</td>
                                                <td className="px-4 py-4 align-top text-sm text-gray-700">
                                                    {entry.start_date} bis {entry.end_date}
                                                </td>
                                                <td className="px-4 py-4 align-top text-sm text-gray-700">{formatTimeRange(entry.start_time, entry.end_time)}</td>
                                                <td className="px-4 py-4 align-top text-sm text-gray-700">
                                                    <div>{entry.is_public ? 'Öffentlich' : 'Intern'}</div>
                                                    <div className="text-xs text-gray-500">{entry.is_active ? 'Aktiv' : 'Inaktiv'}</div>
                                                </td>
                                                <td className="px-4 py-4 align-top text-right text-sm">
                                                    <div className="flex justify-end gap-3">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleEditRecurring(entry)}
                                                            className="text-rcBlue hover:text-blue-700"
                                                            title="Bearbeiten"
                                                        >
                                                            <FaEdit />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDelete('calendar_recurring_entries', entry.id, entry.title)}
                                                            className="text-rcRed hover:text-red-700"
                                                            title="Löschen"
                                                            disabled={submitting}
                                                        >
                                                            <FaTrashAlt />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : activeTab === 'single' ? (
                    <div className="space-y-6 p-6">
                        <form onSubmit={handleSingleSubmit} className="space-y-6 rounded-xl border border-gray-200 bg-gray-50 p-6">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-rcDarkGray">
                                        {editingSingleId ? 'Sondertermin bearbeiten' : 'Neuen Sondertermin anlegen'}
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        Einmalige Einträge ergänzen bestehende Terminserien im öffentlichen Kalender.
                                    </p>
                                </div>
                                {editingSingleId && (
                                    <button
                                        type="button"
                                        onClick={resetSingleForm}
                                        className="text-sm font-semibold text-rcBlue hover:underline"
                                    >
                                        Bearbeitung abbrechen
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <FormInput
                                    label="Titel"
                                    value={singleForm.title}
                                    onChange={(event) => handleSingleChange('title', event.target.value)}
                                    required
                                />
                                <FormSelect
                                    label="Kategorie"
                                    value={singleForm.category}
                                    onChange={(event) => handleSingleChange('category', event.target.value)}
                                >
                                    <option value="">Kategorie wählen</option>
                                    {categoryOptions.map((category) => (
                                        <option key={category} value={category}>
                                            {category === 'Offene Treff' ? 'Offener Treff' : category}
                                        </option>
                                    ))}
                                </FormSelect>
                                <FormInput
                                    label="Ort"
                                    value={singleForm.location}
                                    onChange={(event) => handleSingleChange('location', event.target.value)}
                                />
                                <FormSelect
                                    label="Akzentfarbe"
                                    value={singleForm.color}
                                    onChange={(event) => handleSingleChange('color', event.target.value)}
                                >
                                    {colorOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </FormSelect>
                                <FormInput
                                    label="Datum"
                                    type="date"
                                    value={singleForm.entryDate}
                                    onChange={(event) => handleSingleChange('entryDate', event.target.value)}
                                    required
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormInput
                                        label="Beginn"
                                        type="time"
                                        value={singleForm.startTime}
                                        onChange={(event) => handleSingleChange('startTime', event.target.value)}
                                    />
                                    <FormInput
                                        label="Ende"
                                        type="time"
                                        value={singleForm.endTime}
                                        onChange={(event) => handleSingleChange('endTime', event.target.value)}
                                    />
                                </div>
                            </div>

                            <FormTextarea
                                label="Beschreibung"
                                value={singleForm.description}
                                onChange={(event) => handleSingleChange('description', event.target.value)}
                            />

                            <div className="flex flex-wrap gap-5">
                                <CheckboxField
                                    checked={singleForm.isPublic}
                                    onChange={(checked) => handleSingleChange('isPublic', checked)}
                                    label="Öffentlich sichtbar"
                                />
                                <CheckboxField
                                    checked={singleForm.isActive}
                                    onChange={(checked) => handleSingleChange('isActive', checked)}
                                    label="Aktiv"
                                />
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="inline-flex items-center rounded-lg bg-rcBlue px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <FaCalendarAlt className="mr-2" />
                                    {editingSingleId ? 'Änderungen speichern' : 'Sondertermin anlegen'}
                                </button>
                                <button
                                    type="button"
                                    onClick={resetSingleForm}
                                    className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100"
                                >
                                    Formular zurücksetzen
                                </button>
                            </div>
                        </form>

                        <div className="overflow-x-auto rounded-xl border border-gray-200">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Titel</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Datum</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Zeit</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Aktionen</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {loading ? (
                                        <tr>
                                            <td colSpan="5" className="px-4 py-8 text-center text-sm text-gray-500">
                                                Lade Sondertermine...
                                            </td>
                                        </tr>
                                    ) : singleEntries.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="px-4 py-8 text-center text-sm text-gray-500">
                                                Noch keine Sondertermine vorhanden.
                                            </td>
                                        </tr>
                                    ) : (
                                        singleEntries.map((entry) => (
                                            <tr key={entry.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-4 align-top">
                                                    <div className="font-medium text-rcDarkGray">{entry.title}</div>
                                                    <div className="text-xs text-gray-500">{entry.category || 'Ohne Kategorie'}</div>
                                                </td>
                                                <td className="px-4 py-4 align-top text-sm text-gray-700">
                                                    {parseLocalDate(entry.entry_date)
                                                        ? formatDateLabel(parseLocalDate(entry.entry_date))
                                                        : entry.entry_date}
                                                </td>
                                                <td className="px-4 py-4 align-top text-sm text-gray-700">{formatTimeRange(entry.start_time, entry.end_time)}</td>
                                                <td className="px-4 py-4 align-top text-sm text-gray-700">
                                                    <div>{entry.is_public ? 'Öffentlich' : 'Intern'}</div>
                                                    <div className="text-xs text-gray-500">{entry.is_active ? 'Aktiv' : 'Inaktiv'}</div>
                                                </td>
                                                <td className="px-4 py-4 align-top text-right text-sm">
                                                    <div className="flex justify-end gap-3">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleEditSingle(entry)}
                                                            className="text-rcBlue hover:text-blue-700"
                                                            title="Bearbeiten"
                                                        >
                                                            <FaEdit />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDelete('calendar_single_entries', entry.id, entry.title)}
                                                            className="text-rcRed hover:text-red-700"
                                                            title="Löschen"
                                                            disabled={submitting}
                                                        >
                                                            <FaTrashAlt />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : activeTab === 'exceptions' ? (
                    <div className="space-y-6 p-6">
                        {/* Exception Form */}
                        <form onSubmit={handleExceptionSubmit} className="space-y-6 rounded-xl border border-orange-200 bg-orange-50 p-6">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-rcDarkGray">
                                        {editingExceptionId ? 'Ausnahme bearbeiten' : 'Neue Ausnahme hinzufügen'}
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        Einzelne Termine aus einer Serie absagen oder auf einen anderen Tag verschieben.
                                    </p>
                                </div>
                                {editingExceptionId && (
                                    <button type="button" onClick={resetExceptionForm} className="text-sm font-semibold text-rcBlue hover:underline">
                                        Bearbeitung abbrechen
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                {/* Series selector */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-rcDarkGray">Terminserie</label>
                                    <select
                                        className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-rcBlue focus:outline-none"
                                        value={exceptionForm.recurringEntryId}
                                        onChange={(e) => handleExceptionChange('recurringEntryId', e.target.value)}
                                        required
                                    >
                                        <option value="">– Serie auswählen –</option>
                                        {recurringEntries.map((entry) => (
                                            <option key={entry.id} value={entry.id}>
                                                {entry.title} ({formatRecurrenceRule(entry)})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Original date — dropdown from computed occurrences */}
                                <div>
                                    <label className="block text-sm font-medium text-rcDarkGray">Betroffenes Datum (original)</label>
                                    {upcomingDatesForSeries.length > 0 ? (
                                        <select
                                            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-rcBlue focus:outline-none"
                                            value={exceptionForm.originalDate}
                                            onChange={(e) => handleExceptionChange('originalDate', e.target.value)}
                                            required
                                        >
                                            <option value="">– Datum wählen –</option>
                                            {upcomingDatesForSeries.map((dateKey) => {
                                                const d = parseLocalDate(dateKey);
                                                const label = d ? formatDateLabel(d) : dateKey;
                                                const alreadyHasException = exceptions.some(
                                                    (ex) => ex.recurring_entry_id === exceptionForm.recurringEntryId && ex.original_date === dateKey
                                                );
                                                return (
                                                    <option key={dateKey} value={dateKey}>
                                                        {label}{alreadyHasException ? ' ⚠ bereits geändert' : ''}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    ) : (
                                        <input
                                            type="date"
                                            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-rcBlue focus:outline-none"
                                            value={exceptionForm.originalDate}
                                            onChange={(e) => handleExceptionChange('originalDate', e.target.value)}
                                            required
                                        />
                                    )}
                                    <p className="mt-1 text-xs text-gray-500">
                                        {upcomingDatesForSeries.length > 0
                                            ? 'Nächste 6 Monate der Serie werden angezeigt.'
                                            : 'Bitte zuerst eine Terminserie auswählen.'}
                                    </p>
                                </div>

                                {/* Exception type */}
                                <div>
                                    <label className="block text-sm font-medium text-rcDarkGray">Art der Ausnahme</label>
                                    <div className="mt-2 flex flex-col gap-2">
                                        <label className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 cursor-pointer hover:bg-gray-50">
                                            <input
                                                type="radio"
                                                name="exceptionType"
                                                value="cancelled"
                                                checked={exceptionForm.exceptionType === 'cancelled'}
                                                onChange={() => handleExceptionChange('exceptionType', 'cancelled')}
                                                className="text-rcBlue"
                                            />
                                            <span className="text-sm font-medium text-gray-800">🚫 Termin fällt aus (Absage)</span>
                                        </label>
                                        <label className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 cursor-pointer hover:bg-gray-50">
                                            <input
                                                type="radio"
                                                name="exceptionType"
                                                value="rescheduled"
                                                checked={exceptionForm.exceptionType === 'rescheduled'}
                                                onChange={() => handleExceptionChange('exceptionType', 'rescheduled')}
                                                className="text-rcBlue"
                                            />
                                            <span className="text-sm font-medium text-gray-800">📅 Termin wird verschoben</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Reschedule fields */}
                            {exceptionForm.exceptionType === 'rescheduled' && (
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3 rounded-lg border border-orange-300 bg-white p-4">
                                    <p className="md:col-span-3 text-sm font-semibold text-orange-700">Neuer Termin</p>
                                    <FormInput
                                        label="Neues Datum"
                                        type="date"
                                        value={exceptionForm.newDate}
                                        onChange={(e) => handleExceptionChange('newDate', e.target.value)}
                                        required
                                    />
                                    <FormInput
                                        label="Neue Uhrzeit (Beginn)"
                                        type="time"
                                        value={exceptionForm.newStartTime}
                                        onChange={(e) => handleExceptionChange('newStartTime', e.target.value)}
                                    />
                                    <FormInput
                                        label="Neue Uhrzeit (Ende)"
                                        type="time"
                                        value={exceptionForm.newEndTime}
                                        onChange={(e) => handleExceptionChange('newEndTime', e.target.value)}
                                    />
                                </div>
                            )}

                            {/* Note */}
                            <FormInput
                                label="Hinweis (optional, z. B. Grund der Absage)"
                                value={exceptionForm.note}
                                onChange={(e) => handleExceptionChange('note', e.target.value)}
                                placeholder="z.B. Wegen Feiertag, Raumwechsel, ..."
                            />

                            <div className="flex flex-wrap gap-3">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="inline-flex items-center rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <FaBan className="mr-2" />
                                    {editingExceptionId ? 'Ausnahme aktualisieren' : 'Ausnahme speichern'}
                                </button>
                                <button
                                    type="button"
                                    onClick={resetExceptionForm}
                                    className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100"
                                >
                                    Formular zurücksetzen
                                </button>
                            </div>
                        </form>

                        {/* Exceptions list */}
                        <div className="overflow-x-auto rounded-xl border border-gray-200">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Terminserie</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Datum (original)</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Art</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Neues Datum</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Hinweis</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Aktionen</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {loading ? (
                                        <tr>
                                            <td colSpan="6" className="px-4 py-8 text-center text-sm text-gray-500">Lade Ausnahmen...</td>
                                        </tr>
                                    ) : exceptions.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="px-4 py-8 text-center text-sm text-gray-500">
                                                Keine Ausnahmen vorhanden. Alle Termine laufen wie geplant.
                                            </td>
                                        </tr>
                                    ) : (
                                        exceptions.map((ex) => {
                                            const series = recurringEntries.find((e) => e.id === ex.recurring_entry_id);
                                            const originalDate = parseLocalDate(ex.original_date);
                                            const newDate = ex.new_date ? parseLocalDate(ex.new_date) : null;
                                            return (
                                                <tr key={ex.id} className="hover:bg-gray-50">
                                                    <td className="px-4 py-4 align-top">
                                                        <div className="font-medium text-rcDarkGray">{series?.title || '–'}</div>
                                                        <div className="text-xs text-gray-500">{series ? formatRecurrenceRule(series) : ''}</div>
                                                    </td>
                                                    <td className="px-4 py-4 align-top text-sm text-gray-700">
                                                        {originalDate ? originalDate.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }) : ex.original_date}
                                                    </td>
                                                    <td className="px-4 py-4 align-top">
                                                        {ex.exception_type === 'cancelled' ? (
                                                            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
                                                                🚫 Abgesagt
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-700">
                                                                📅 Verschoben
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-4 align-top text-sm text-gray-700">
                                                        {newDate ? (
                                                            <div>
                                                                <div>{newDate.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
                                                                {(ex.new_start_time || ex.new_end_time) && (
                                                                    <div className="text-xs text-gray-500">{formatTimeRange(ex.new_start_time, ex.new_end_time)}</div>
                                                                )}
                                                            </div>
                                                        ) : '–'}
                                                    </td>
                                                    <td className="px-4 py-4 align-top text-sm text-gray-500 max-w-[180px]">
                                                        {ex.note || '–'}
                                                    </td>
                                                    <td className="px-4 py-4 align-top text-right text-sm">
                                                        <div className="flex justify-end gap-3">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleEditException(ex)}
                                                                className="text-rcBlue hover:text-blue-700"
                                                                title="Bearbeiten"
                                                            >
                                                                <FaEdit />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDelete('calendar_recurring_exceptions', ex.id, `Ausnahme vom ${ex.original_date}`)}
                                                                className="text-rcRed hover:text-red-700"
                                                                title="Löschen"
                                                                disabled={submitting}
                                                            >
                                                                <FaTrashAlt />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
}