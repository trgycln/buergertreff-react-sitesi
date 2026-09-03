// src/components/admin/EreignisForm.js
// Ultra-praktischer Foto-Bericht Uploader:
// Wählt einfach ein Datum -> Erkennt automatisch Termine aus dem Terminkalender -> Fotos hochladen -> Fertig!

import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
    FaCamera,
    FaCheckCircle,
    FaClock,
    FaCloudUploadAlt,
    FaMapMarkerAlt,
    FaTimes,
    FaArrowLeft,
    FaSpinner,
    FaInfoCircle,
} from 'react-icons/fa';
import { supabase } from '../../supabaseClient';
import {
    dateToKey,
    expandRecurringEntries,
    formatDateLabel,
    formatTimeRange,
    parseLocalDate,
} from '../../utils/calendarUtils';

export default function EreignisForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = !!id;

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    // Datum (Standard: Heute)
    const [selectedDate, setSelectedDate] = useState(() => {
        return dateToKey(new Date());
    });

    // Aktivitäts-Details (werden automatisch aus dem Kalender befüllt)
    const [selectedEventId, setSelectedEventId] = useState('');
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('Offene Treff');
    const [location, setLocation] = useState('Bürgertreff Wissen');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [description, setDescription] = useState('');

    // Fotos & Rückblick
    const [photos, setPhotos] = useState([]); // Array von Bild-URLs
    const [selectedCoverUrl, setSelectedCoverUrl] = useState(''); // Ausgewähltes Titelbild für Startseite
    const [archiveSummary, setArchiveSummary] = useState('');
    const [uploadingFiles, setUploadingFiles] = useState(false);

    // Kalenderdaten für automatische Erkennung
    const [recurringEntries, setRecurringEntries] = useState([]);
    const [singleEntries, setSingleEntries] = useState([]);
    const [exceptions, setExceptions] = useState([]);

    // 1. Kalenderdaten für Erkennung laden
    useEffect(() => {
        const loadCalendarData = async () => {
            const [recRes, singleRes, exRes] = await Promise.all([
                supabase.from('calendar_recurring_entries').select('*').eq('is_active', true),
                supabase.from('calendar_single_entries').select('*').eq('is_active', true),
                supabase.from('calendar_recurring_exceptions').select('*'),
            ]);

            setRecurringEntries(recRes.data || []);
            setSingleEntries(singleRes.data || []);
            setExceptions(exRes.data || []);
        };

        loadCalendarData();
    }, []);

    // 2. Bestehenden Eintrag laden (falls Bearbeitungsmodus)
    useEffect(() => {
        if (!isEditMode) return;

        const loadExistingEvent = async () => {
            setLoading(true);
            const { data, error } = await supabase.from('ereignisse').select('*').eq('id', id).single();
            if (data) {
                setTitle(data.title || '');
                setCategory(data.category || 'Offene Treff');
                setLocation(data.location || 'Bürgertreff Wissen');
                setDescription(data.description || '');
                setArchiveSummary(data.archive_summary || '');
                setEndTime(data.end_time || '');

                if (data.event_date) {
                    const parsed = new Date(data.event_date);
                    setSelectedDate(dateToKey(parsed));
                    setStartTime(parsed.toTimeString().slice(0, 5));
                }

                const existingPhotos = Array.isArray(data.archive_photos) && data.archive_photos.length > 0
                    ? data.archive_photos
                    : data.image_url ? [data.image_url] : [];
                setPhotos(existingPhotos);
                setSelectedCoverUrl(data.image_url || (existingPhotos.length > 0 ? existingPhotos[0] : ''));
            } else if (error) {
                setMessage(`Fehler beim Laden: ${error.message}`);
            }
            setLoading(false);
        };

        loadExistingEvent();
    }, [id, isEditMode]);

    // 3. Termine finden, die an dem gewählten Datum im Kalender stattfinden
    const dayEvents = useMemo(() => {
        if (!selectedDate) return [];

        const dateObj = parseLocalDate(selectedDate);
        if (!dateObj) return [];

        // Wiederkehrende Termine für diesen Tag expandieren
        const recurringForDay = expandRecurringEntries(recurringEntries, dateObj, dateObj, exceptions);

        // Einzeltermine für diesen Tag (außer diesem Event selbst beim Bearbeiten)
        const singlesForDay = singleEntries
            .filter((s) => s.entry_date === selectedDate && (!isEditMode || Number(s.source_event_id) !== Number(id)))
            .map((s) => ({
                id: `single-${s.id}`,
                title: s.title,
                category: s.category,
                location: s.location,
                startTime: s.start_time,
                endTime: s.end_time,
                description: s.description,
            }));

        const combined = [...recurringForDay, ...singlesForDay];

        // Eindeutige Titel
        const map = new Map();
        combined.forEach((item) => {
            const key = (item.title || '').trim().toLowerCase();
            if (!map.has(key)) {
                map.set(key, item);
            }
        });

        return Array.from(map.values());
    }, [selectedDate, recurringEntries, singleEntries, exceptions, isEditMode, id]);

    // 4. Automatische Auswahl: Wenn an diesem Tag Termine existieren, ersten automatisch übernehmen
    useEffect(() => {
        if (isEditMode) return;

        if (dayEvents.length > 0) {
            const current = dayEvents.find((e) => e.id === selectedEventId) || dayEvents[0];
            setSelectedEventId(current.id);
            setTitle(current.title || '');
            setCategory(current.category || 'Offene Treff');
            setLocation(current.location || 'Bürgertreff Wissen');
            setStartTime(current.startTime ? String(current.startTime).slice(0, 5) : '');
            setEndTime(current.endTime ? String(current.endTime).slice(0, 5) : '');
            setDescription(current.description || '');
        } else {
            setSelectedEventId('custom');
        }
    }, [dayEvents, isEditMode]);

    const handleSelectDayEvent = (eventItem) => {
        setSelectedEventId(eventItem.id);
        setTitle(eventItem.title || '');
        setCategory(eventItem.category || 'Offene Treff');
        setLocation(eventItem.location || 'Bürgertreff Wissen');
        setStartTime(eventItem.startTime ? String(eventItem.startTime).slice(0, 5) : '');
        setEndTime(eventItem.endTime ? String(eventItem.endTime).slice(0, 5) : '');
        setDescription(eventItem.description || '');
    };

    // 5. Mehrere Fotos hochladen
    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        setUploadingFiles(true);
        setMessage('');

        try {
            const uploadedUrls = [];
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const fileExt = file.name.split('.').pop();
                const fileName = `event_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;

                const { error: uploadError } = await supabase.storage.from('page_assets').upload(fileName, file);
                if (uploadError) {
                    console.error('Fehler beim Bildupload:', uploadError);
                    continue;
                }

                const { data: { publicUrl } } = supabase.storage.from('page_assets').getPublicUrl(fileName);
                if (publicUrl) {
                    uploadedUrls.push(publicUrl);
                }
            }
            setPhotos((prev) => {
                const next = [...prev, ...uploadedUrls];
                if (!selectedCoverUrl && next.length > 0) {
                    setSelectedCoverUrl(next[0]);
                }
                return next;
            });
        } catch (err) {
            setMessage(`Fehler beim Hochladen: ${err.message}`);
        } finally {
            setUploadingFiles(false);
            e.target.value = '';
        }
    };

    const handleRemovePhoto = (indexToRemove) => {
        const photoToRemove = photos[indexToRemove];
        const remaining = photos.filter((_, idx) => idx !== indexToRemove);
        setPhotos(remaining);
        if (selectedCoverUrl === photoToRemove) {
            setSelectedCoverUrl(remaining.length > 0 ? remaining[0] : '');
        }
    };

    // 6. Formular absenden (Speichern)
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!title.trim()) {
            setMessage('Fehler: Bitte wählen Sie eine Aktivität aus oder geben Sie einen Titel an.');
            return;
        }

        setSaving(true);
        setMessage('Speichere Foto-Bericht...');

        try {
            let eventDateIso = null;
            if (selectedDate) {
                const [year, month, day] = selectedDate.split('-').map(Number);
                const [hours = 12, minutes = 0] = (startTime || '12:00').split(':').map(Number);
                eventDateIso = new Date(year, month - 1, day, hours, minutes).toISOString();
            }

            const coverImage = selectedCoverUrl || (photos.length > 0 ? photos[0] : null);

            // Titelbild en başa gelecek şekilde fotoğrafları düzenle
            let orderedPhotos = [...photos];
            if (coverImage && orderedPhotos.includes(coverImage)) {
                orderedPhotos = [coverImage, ...orderedPhotos.filter((p) => p !== coverImage)];
            }

            const payload = {
                title: title.trim(),
                category: category || 'Offene Treff',
                location: location || 'Bürgertreff Wissen',
                description: description || null,
                archive_summary: archiveSummary || description || null,
                event_date: eventDateIso,
                end_time: endTime || null,
                image_url: coverImage,
                archive_photos: orderedPhotos.length > 0 ? orderedPhotos : null,
                is_public: true,
                is_featured: false,
            };

            let savedId = id;
            if (isEditMode) {
                const { error } = await supabase.from('ereignisse').update(payload).eq('id', id);
                if (error) throw error;
            } else {
                const { data, error } = await supabase.from('ereignisse').insert(payload).select('id').single();
                if (error) throw error;
                savedId = data.id;
            }

            // Sicherstellen, dass kein doppelter Einzeltermin im Kalender liegt
            await supabase.from('calendar_single_entries').delete().eq('source_event_id', Number(savedId));

            setMessage('✅ Foto-Bericht erfolgreich gespeichert!');
            setTimeout(() => {
                navigate('/admin/ereignisse');
            }, 1200);
        } catch (err) {
            console.error('Fehler beim Speichern:', err);
            setMessage(`Fehler beim Speichern: ${err.message}`);
        } finally {
            setSaving(false);
        }
    };

    const formattedDisplayDate = selectedDate ? formatDateLabel(parseLocalDate(selectedDate)) : '';

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-12">
            {/* Kopfzeile */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
                <div>
                    <Link
                        to="/admin/ereignisse"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-rcBlue hover:underline mb-2"
                    >
                        <FaArrowLeft size={12} /> Zurück zur Liste
                    </Link>
                    <h1 className="text-2xl sm:text-3xl font-bold text-rcDarkGray flex items-center gap-3">
                        <FaCamera className="text-rcBlue" />
                        {isEditMode ? 'Foto-Bericht bearbeiten' : 'Fotos für Aktivität hochladen'}
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Wählen Sie einfach das Datum der Aktivität. Der Termin wird automatisch aus dem Terminkalender erkannt.
                    </p>
                </div>
            </div>

            {message && (
                <div
                    className={`p-4 rounded-xl border text-sm font-medium ${
                        message.startsWith('Fehler')
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    }`}
                >
                    {message}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* 1. DATUM & KALENDER-ZUORDNUNG */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-5">
                    <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-rcBlue">
                            1
                        </span>
                        <h2 className="text-lg font-bold text-rcDarkGray">Datum der Aktivität wählen</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                                Datum
                            </label>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                required
                                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-base font-medium shadow-sm focus:border-rcBlue focus:outline-none focus:ring-2 focus:ring-rcBlue/20"
                            />
                            {formattedDisplayDate && (
                                <p className="mt-1.5 text-xs text-gray-500 font-medium">
                                    📅 {formattedDisplayDate}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                                Aktivität im Kalender
                            </label>
                            {dayEvents.length > 0 ? (
                                <div className="space-y-2">
                                    {dayEvents.map((evt) => {
                                        const isSelected = selectedEventId === evt.id;
                                        return (
                                            <button
                                                key={evt.id}
                                                type="button"
                                                onClick={() => handleSelectDayEvent(evt)}
                                                className={`w-full text-left p-3 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                                                    isSelected
                                                        ? 'bg-blue-50/80 border-rcBlue ring-2 ring-rcBlue/30 shadow-sm'
                                                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                                }`}
                                            >
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-rcDarkGray text-sm">{evt.title}</span>
                                                        {evt.category && (
                                                            <span className="text-[10px] font-semibold bg-white border border-gray-200 rounded px-1.5 py-0.5 text-gray-600">
                                                                {evt.category}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                                                        {(evt.startTime || evt.start_time) && (
                                                            <span className="flex items-center gap-1">
                                                                <FaClock size={11} className="text-rcBlue" />
                                                                {formatTimeRange(evt.startTime || evt.start_time, evt.endTime || evt.end_time)}
                                                            </span>
                                                        )}
                                                        {evt.location && (
                                                            <span className="flex items-center gap-1 truncate">
                                                                <FaMapMarkerAlt size={11} className="text-rcBlue" />
                                                                {evt.location}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                {isSelected && (
                                                    <FaCheckCircle className="text-rcBlue text-lg flex-shrink-0 mt-0.5" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="rounded-xl border border-dashed border-gray-300 p-3 bg-gray-50 text-xs text-gray-600">
                                    <p className="font-medium text-gray-700">An diesem Tag ist kein Termin im Kalender eingetragen.</p>
                                    <p className="mt-1 text-gray-500">
                                        Geben Sie den Titel unten einfach manuell an:
                                    </p>
                                    <input
                                        type="text"
                                        placeholder="z.B. Offener Treff, Frühlingsfest..."
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm bg-white"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Erkannte Aktivitäts-Zusammenfassung */}
                    {title && dayEvents.length > 0 && (
                        <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3 text-xs text-gray-600 flex items-center gap-2">
                            <FaInfoCircle className="text-rcBlue flex-shrink-0" />
                            <span>
                                Ausgewählt: <strong>{title}</strong>
                                {startTime ? ` (${formatTimeRange(startTime, endTime)})` : ''}
                                {' '}– Fotos werden direkt mit diesem Kalendereintrag und der Startseite verknüpft.
                            </span>
                        </div>
                    )}
                </div>

                {/* 2. FOTOS HOCHLADEN */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-5">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-rcBlue">
                                2
                            </span>
                            <h2 className="text-lg font-bold text-rcDarkGray">Fotos auswählen & hochladen</h2>
                        </div>
                        {photos.length > 0 && (
                            <span className="text-xs font-semibold text-rcBlue bg-blue-50 border border-blue-200 rounded-full px-3 py-1">
                                {photos.length} Foto{photos.length > 1 ? 's' : ''} bereit
                            </span>
                        )}
                    </div>

                    {/* Upload Dropzone */}
                    <div className="relative rounded-2xl border-2 border-dashed border-gray-300 p-6 text-center hover:border-rcBlue transition-colors bg-gray-50/50">
                        <input
                            type="file"
                            accept="image/png, image/jpeg, image/webp"
                            multiple
                            onChange={handleFileUpload}
                            disabled={uploadingFiles || loading}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                            title="Dateien auswählen"
                        />
                        <div className="space-y-2">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-rcBlue">
                                {uploadingFiles ? <FaSpinner className="animate-spin" size={20} /> : <FaCloudUploadAlt size={24} />}
                            </div>
                            <p className="text-sm font-semibold text-rcDarkGray">
                                {uploadingFiles ? 'Bilder werden hochgeladen...' : 'Klicken oder Fotos hierher ziehen'}
                            </p>
                            <p className="text-xs text-gray-500">
                                PNG, JPG oder WebP – Sie können mehrere Fotos gleichzeitig auswählen.
                            </p>
                        </div>
                    </div>

                    {/* Vorschau der hochgeladenen Fotos mit Titelbild-Auswahl */}
                    {photos.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                                <span className="font-bold uppercase tracking-wider text-gray-500">
                                    Hochgeladene Fotos ({photos.length})
                                </span>
                                <span className="text-gray-500 font-medium">
                                    ⭐ Klicken Sie auf ein Foto, um es als <strong>Titelbild</strong> für die Startseite festzulegen.
                                </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                {photos.map((url, idx) => {
                                    const isCover = selectedCoverUrl ? selectedCoverUrl === url : idx === 0;
                                    return (
                                        <div
                                            key={idx}
                                            onClick={() => setSelectedCoverUrl(url)}
                                            className={`group relative aspect-square rounded-2xl overflow-hidden border-2 cursor-pointer transition-all shadow-sm ${
                                                isCover
                                                    ? 'border-amber-500 ring-4 ring-amber-400/30 shadow-md'
                                                    : 'border-gray-200 hover:border-rcBlue'
                                            }`}
                                            title={isCover ? 'Aktuelles Titelbild' : 'Klicken, um als Titelbild festzulegen'}
                                        >
                                            <img
                                                src={url}
                                                alt={`Foto ${idx + 1}`}
                                                className="w-full h-full object-cover"
                                            />

                                            {isCover ? (
                                                <span className="absolute top-2 left-2 flex items-center gap-1 rounded-lg bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white shadow ring-1 ring-white/50">
                                                    ⭐ Titelbild
                                                </span>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedCoverUrl(url);
                                                    }}
                                                    className="absolute top-2 left-2 flex items-center gap-1 rounded-lg bg-black/60 hover:bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    ☆ Als Titelbild
                                                </button>
                                            )}

                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRemovePhoto(idx);
                                                }}
                                                className="absolute top-2 right-2 rounded-full bg-red-600 text-white p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 shadow"
                                                title="Foto entfernen"
                                            >
                                                <FaTimes size={11} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* 3. KURZER RÜCKBLICK (OPTIONAL) */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-rcBlue">
                            3
                        </span>
                        <h2 className="text-lg font-bold text-rcDarkGray">Kurzer Rückblick (Optional)</h2>
                    </div>

                    <div>
                        <textarea
                            rows={3}
                            value={archiveSummary}
                            onChange={(e) => setArchiveSummary(e.target.value)}
                            placeholder="z.B. Trotz des Regens kamen viele Besucher zusammen und verbrachten einen geselligen Nachmittag bei Kaffee und Kuchen..."
                            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm shadow-sm focus:border-rcBlue focus:outline-none focus:ring-2 focus:ring-rcBlue/20"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            Dieser Text erscheint im Archiv und auf der Veranstaltungsseite über den Fotos. Kann auch leer gelassen werden.
                        </p>
                    </div>
                </div>

                {/* Speichern Button */}
                <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
                    <Link
                        to="/admin/ereignisse"
                        className="w-full sm:w-auto px-5 py-3 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 text-center transition-colors"
                    >
                        Abbrechen
                    </Link>
                    <button
                        type="submit"
                        disabled={saving || uploadingFiles || loading}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-rcBlue text-white text-sm font-bold shadow-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                    >
                        {saving ? (
                            <>
                                <FaSpinner className="animate-spin" /> Speichere...
                            </>
                        ) : (
                            <>
                                <FaCamera /> {isEditMode ? 'Änderungen speichern' : 'Foto-Bericht veröffentlichen'}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}