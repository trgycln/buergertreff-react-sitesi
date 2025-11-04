// src/pages/BuergertreffUnterwegsForm.js
// Dies ist die NEUE, separate Formularseite (für Neu & Bearbeiten)

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, useParams, Link } from 'react-router-dom';

// --- UI Komponenten (Kopiert aus altem Editor) ---
const FormInput = ({ label, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-rcDarkGray">{label}</label>
    <input
      className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-rcBlue focus:border-rcBlue"
      {...props}
    />
  </div>
);
const FormTextarea = ({ label, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-rcDarkGray">{label}</label>
    <textarea
      className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-rcBlue focus:border-rcBlue"
      rows="3"
      {...props}
    ></textarea>
  </div>
);
const PastTripGalleryManager = ({ trip }) => {
    // Galerie-Manager für eine spezifische 'trip.id'
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const fetchImages = async () => {
            const { data } = await supabase.from('trips_gallery').select('*').eq('past_trip_id', trip.id).order('created_at', { ascending: false });
            setImages(data || []);
        };
        fetchImages();
    }, [trip.id]);

    const handleGalleryImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setLoading(true);
        setMessage('Lade Foto hoch...');
        const fileName = `gallery-${trip.id}-${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage.from('page_assets').upload(fileName, file);
        if (uploadError) { setMessage(`Upload Fehler: ${uploadError.message}`); setLoading(false); return; }
        const { data: { publicUrl } } = supabase.storage.from('page_assets').getPublicUrl(fileName);
        const { data: newImage, error: dbError } = await supabase.from('trips_gallery').insert({ image_url: publicUrl, alt_text: file.name, past_trip_id: trip.id }).select().single();
        if (newImage) setImages([newImage, ...images]);
        setMessage('Foto erfolgreich hinzugefügt!');
        setLoading(false);
        setTimeout(() => setMessage(''), 3000);
    };

    const handleDeleteGalleryImage = async (image) => {
        if (!window.confirm("Sind Sie sicher, dass Sie dieses Bild löschen möchten?")) return;
        setLoading(true);
        const fileName = image.image_url.split('/').pop();
        await supabase.storage.from('page_assets').remove([fileName]);
        await supabase.from('trips_gallery').delete().eq('id', image.id);
        setImages(images.filter(img => img.id !== image.id));
        setMessage('Bild gelöscht.');
        setLoading(false);
        setTimeout(() => setMessage(''), 3000);
    };

    return (
        <div className="space-y-4 pt-4 mt-4 border-t border-gray-200">
            {message && <p className="text-sm text-green-700">{message}</p>}
            <h4 className="text-lg font-medium text-rcDarkGray">Fotos für "{trip.title}"</h4>
            <input type="file" accept="image/png, image/jpeg" onChange={handleGalleryImageUpload} disabled={loading} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-rcLightBlue file:text-rcBlue hover:file:bg-blue-200" />
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">{images.map(image => (
                <div key={image.id} className="relative group border rounded-lg shadow-sm overflow-hidden">
                    <img src={image.image_url} alt={image.alt_text} className="h-40 w-full object-cover" />
                    <button onClick={() => handleDeleteGalleryImage(image)} disabled={loading} className="absolute top-1 right-1 p-1 bg-rcRed/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rcRed">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                    {/* HIER kommt später der "Als Titelbild"-Button hin */}
                </div>
            ))}</div>
        </div>
    );
};
// --- Ende UI Komponenten ---


// Haupt-Formularseite
export default function BuergertreffUnterwegsForm() {
    const { id } = useParams(); // URL-Parameter (:id) für den Bearbeiten-Modus
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    // Formular-State
    const [title, setTitle] = useState('');
    const [tripDate, setTripDate] = useState('');
    const [desc, setDesc] = useState('');
    const [videoId, setVideoId] = useState('');

    // 'id' varsa, bu "Bearbeiten"-Modus (Düzenleme Modu) demektir
    const isEditMode = !!id;

    // Bearbeiten-Modus ise, veriyi çek
    useEffect(() => {
        if (isEditMode) {
            setLoading(true);
            const fetchTrip = async () => {
                const { data, error } = await supabase
                    .from('past_trips')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (data) {
                    setTitle(data.title);
                    setTripDate(data.trip_date_text || '');
                    setDesc(data.description || '');
                    setVideoId(data.video_id || '');
                } else {
                    setMessage(`Fehler: Reise nicht gefunden. ${error?.message}`);
                }
                setLoading(false);
            };
            fetchTrip();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, isEditMode]); // Dependency Array angepasst

    // AKTUALISIERTE handleSubmit Funktion
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title) return;

        setLoading(true);
        setMessage('Speichere...');

        const tripData = {
            title: title,
            trip_date_text: tripDate,
            description: desc,
            video_id: videoId || null
        };

        let resultTripId = id; // Für den Bearbeiten-Modus ist die ID bekannt
        let error;

        if (isEditMode) {
            // BEARBEITEN (UPDATE)
            ({ error } = await supabase.from('past_trips').update(tripData).eq('id', id));
        } else {
            // NEU ERSTELLEN (INSERT)
            // Wichtig: '.select()' hinzufügen, um die Daten der neuen Zeile zurückzubekommen
            const { data: newTrip, error: insertError } = await supabase
                .from('past_trips')
                .insert(tripData)
                .select('id') // Nur die neue ID brauchen wir
                .single();

            if (newTrip) {
                resultTripId = newTrip.id; // Die ID der gerade erstellten Reise speichern
            }
            error = insertError;
        }

        if (error) {
            setMessage(`Fehler: ${error.message}`);
            setLoading(false); // Ladezustand beenden bei Fehler
        } else {
            setMessage('Erfolgreich gespeichert!');
            // --- NEUE LOGIK ---
            if (!isEditMode && resultTripId) {
                // Wenn es ein NEUER Eintrag war UND wir eine ID haben:
                // Leite zur Bearbeiten-Seite für DIESEN neuen Eintrag weiter
                setMessage('Weiterleitung zur Fotoverwaltung...'); // Informiere den User
                // Kleine Verzögerung, damit User die Meldung lesen kann
                setTimeout(() => {
                  navigate(`/admin/edit/buergertreff-unterwegs/edit/${resultTripId}`, { replace: true });
                }, 1500);
                // Loading bleibt true, bis die neue Seite geladen ist
            } else if (isEditMode) {
                 // Wenn es ein UPDATE war, bleibe auf der Seite
                 setLoading(false); // Ladezustand hier beenden
                 setTimeout(() => setMessage(''), 3000); // Erfolgsmeldung nach 3s ausblenden
            } else {
                 // Fallback (sollte nicht passieren)
                 setLoading(false);
                 navigate('/admin/edit/buergertreff-unterwegs');
            }
        }
    };


    if (loading && isEditMode && !message) { // Nur im Edit-Modus initial laden anzeigen
        return <div className="p-8">Lade Reise-Daten...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="mb-4">
                <Link to="/admin/edit/buergertreff-unterwegs" className="text-rcBlue font-semibold hover:underline">
                    &larr; Zurück zur Listenansicht
                </Link>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 shadow-lg rounded-lg">
                <h2 className="text-2xl font-semibold text-rcDarkGray">
                    {isEditMode ? 'Vergangene Reise bearbeiten' : 'Neue vergangene Reise hinzufügen'}
                </h2>

                <FormInput
                    label="Titel (z.B. 'Ein Tag in Wuppertal')"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormInput
                        label="Datum der Reise (z.B. 'Juli 2024')"
                        type="text"
                        value={tripDate}
                        onChange={(e) => setTripDate(e.target.value)}
                    />
                    <div> {/* Wrapper div for Input + Help Text */}
                        <FormInput
                            label="YouTube Video ID (Optional)"
                            type="text"
                            value={videoId}
                            onChange={(e) => setVideoId(e.target.value)}
                        />
                        {/* AKTUALISIERT: Hilfetext hinzugefügt */}
                        <p className="mt-1 text-xs text-gray-500">
                            Geben Sie hier nur die Video-ID aus der YouTube-URL ein.
                            Beispiel: Bei <code>https://www.youtube.com/watch?v=jby_soho76c</code> ist die ID <code>jby_soho76c</code>.
                        </p>
                    </div>
                </div>

                <FormTextarea
                    label="Kurze Beschreibung"
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                />

                <button type="submit" disabled={loading} className="px-6 py-2 bg-rcBlue text-white font-semibold rounded-md shadow hover:bg-blue-700 disabled:bg-gray-400">
                    {loading ? 'Speichere...' : (isEditMode ? 'Änderungen speichern' : 'Reise erstellen & Fotos hinzufügen')}
                </button>
                {message && <p className={`mt-2 text-sm ${message.startsWith('Fehler') ? 'text-rcRed' : 'text-green-700'}`}>{message}</p>}
            </form>

            {/* Galerie-Manager wird SADECE im Bearbeiten-Modus angezeigt */}
            {isEditMode && (
                <div className="bg-white p-6 shadow-lg rounded-lg">
                     <PastTripGalleryManager trip={{ id: id, title: title }} />
                </div>
            )}
        </div>
    );
}