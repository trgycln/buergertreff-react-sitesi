// src/components/BigEventBanner.js

import React, { useEffect, useState } from 'react';
import { FaCalendarAlt, FaMapMarkerAlt, FaArrowRight, FaTimes } from 'react-icons/fa';

const formatBannerDate = (dateString) => {
    if (!dateString) return null;
    try {
        const date = new Date(dateString);
        const dayName = date.toLocaleDateString('de-DE', { weekday: 'long' });
        const dayMonth = date.toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' });
        const time = date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
        return { dayName, dayMonth, time };
    } catch {
        return null;
    }
};

const BigEventBanner = ({ event, onClose }) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setVisible(true), 30);
        document.body.style.overflow = 'hidden';
        return () => {
            clearTimeout(timer);
            document.body.style.overflow = '';
        };
    }, []);

    const handleClose = () => {
        document.body.style.overflow = '';
        setVisible(false);
        setTimeout(onClose, 350);
    };

    const dateInfo = formatBannerDate(event.event_date);
    const hasImage = !!event.image_url;

    // Beschreibung bereinigen: alle Zeilen entfernen, die bereits als
    // strukturierte Felder (Titel, Datum, Uhrzeit, Ort) angezeigt werden.
    const titleLower = event.title?.toLowerCase() ?? '';
    const locationLower = event.location?.toLowerCase() ?? '';
    const cleanDescription = event.description
        ? event.description
              .split('\n')
              .filter((line) => {
                  const t = line.trim();
                  if (!t) return false;
                  const tl = t.toLowerCase();
                  // Zeile enthält den Titel (exakt oder als Teilstring)
                  if (titleLower && tl.includes(titleLower)) return false;
                  // Einladungsformulierungen
                  if (/wir laden (sie|euch|alle) herzlich ein/i.test(t)) return false;
                  if (/herzlich (willkommen|eingeladen)/i.test(t)) return false;
                  // Zeilen mit Label-Präfix (Datum:, Ort:, Uhrzeit: …)
                  if (/^(datum|uhrzeit|ort|time|date|location|wann|wo)\s*[:\-–]/i.test(t)) return false;
                  // Allein stehende Label-Wörter (z. B. "Ort", "Datum & Uhrzeit")
                  if (/^(datum\s*&?\s*uhrzeit|uhrzeit|ort|wann|wo)$/i.test(t)) return false;
                  // Zeilen, die den Ortsnamen enthalten
                  if (locationLower && tl.includes(locationLower)) return false;
                  // Zeilen mit Datumsangabe (z. B. "25.04.2026", "25. April 2026", "Samstag, 25.")
                  if (/\b\d{1,2}[\.\-]\s*\d{1,2}[\.\-]\s*\d{2,4}\b/.test(t)) return false;
                  if (/\b\d{1,2}\.\s*(januar|februar|märz|april|mai|juni|juli|august|september|oktober|november|dezember)\b/i.test(t)) return false;
                  // Zeilen mit Uhrzeitangabe (z. B. "14:00 Uhr", "11:00–18:00 Uhr")
                  if (/\b\d{1,2}[:\.]?\d{0,2}\s*uhr\b/i.test(t)) return false;
                  if (/\b\d{1,2}:\d{2}\b/.test(t)) return false;
                  return true;
              })
              .join('\n')
              .trim()
        : '';

    return (
        <div
            className={`fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-350 ${
                visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
        >
            {/* Tam ekran arka plan: fotoğraf bulanık ve karartılmış */}
            <div
                className="absolute inset-0 bg-cover bg-center scale-105"
                style={{
                    backgroundImage: hasImage
                        ? `url(${event.image_url})`
                        : undefined,
                    backgroundColor: hasImage ? undefined : '#1f5ea8',
                    filter: 'blur(6px)',
                }}
            />
            <div className="absolute inset-0 bg-black/55" />

            {/* X butonu */}
            <button
                onClick={handleClose}
                aria-label="Schließen"
                className="absolute top-4 right-4 z-10 flex items-center justify-center w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors border border-white/20"
            >
                <FaTimes size={16} />
            </button>

            {/* KART */}
            <div className="relative z-10 w-full max-w-md mx-4 sm:mx-auto flex flex-col rounded-2xl shadow-2xl overflow-hidden max-h-[90vh]">

                {/* Üst: büyük fotoğraf */}
                {hasImage ? (
                    <div className="h-56 sm:h-64 flex-shrink-0 overflow-hidden">
                        <img
                            src={event.image_url}
                            alt={event.title}
                            className="w-full h-full object-cover"
                        />
                    </div>
                ) : (
                    <div className="h-20 flex-shrink-0 bg-rcBlue" />
                )}

                {/* Alt: bilgi alanı (beyaz) */}
                <div className="bg-white flex flex-col overflow-y-auto">
                    <div className="px-6 pt-5 pb-4 space-y-4">

                        {/* Başlık – nur anzeigen wenn kein Bild (Bild zeigt den Titel bereits) */}
                        {!hasImage && (
                            <h1 className="text-2xl sm:text-3xl font-bold text-rcDarkGray leading-tight">
                                {event.title}
                            </h1>
                        )}

                        {/* Programmpunkte aus program_details Feld */}
                        {event.program_details && event.program_details.length > 0 ? (
                            <ul className="space-y-1.5">
                                {event.program_details.map((item, i) => {
                                    const text = typeof item === 'string'
                                        ? item
                                        : [item.time, item.activity].filter(Boolean).join(' – ');
                                    return (
                                        <li key={i} className="flex items-start gap-2 text-gray-600 text-sm">
                                            <span className="mt-1 w-1.5 h-1.5 rounded-full bg-rcBlue flex-shrink-0" />
                                            {text}
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : cleanDescription ? (
                            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                                {cleanDescription}
                            </p>
                        ) : null}

                        {/* Tarih – nur anzeigen wenn kein Bild (Bild enthält bereits diese Infos) */}
                        {dateInfo && !hasImage && (
                            <div className="flex items-start gap-3 border-t border-gray-100 pt-4">
                                <div className="mt-0.5 w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full bg-rcBlue/10">
                                    <FaCalendarAlt className="text-rcBlue" size={14} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-0.5">Datum & Uhrzeit</p>
                                    <p className="text-rcDarkGray font-semibold text-sm">
                                        {dateInfo.dayName}, {dateInfo.dayMonth}
                                    </p>
                                    <p className="text-rcBlue font-bold text-xl">
                                        {dateInfo.time}{event.end_time ? `–${String(event.end_time).slice(0, 5)} Uhr` : ' Uhr'}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Yer – nur anzeigen wenn kein Bild */}
                        {event.location && !hasImage && (
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full bg-red-50">
                                    <FaMapMarkerAlt className="text-rcRed" size={14} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-0.5">Ort</p>
                                    <p className="text-rcDarkGray font-semibold">{event.location}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Buton */}
                    <div className="px-6 pb-6 pt-2">
                        <button
                            onClick={handleClose}
                            className="w-full flex items-center justify-center gap-2 bg-rcBlue hover:bg-blue-700 text-white font-bold text-base py-3.5 rounded-xl transition-colors duration-200 shadow-md"
                        >
                            Weiter zur Website
                            <FaArrowRight size={13} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BigEventBanner;
