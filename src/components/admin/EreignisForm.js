// src/components/admin/EreignisForm.js
// DÜZELTME: Eksik olan "Programm-Details" bölümü ve "is_featured" açıklaması geri eklendi.

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { PrintableFlyerA4 } from './pdf/PrintableFlyerA4';
import { PrintableFlyerA5 } from './pdf/PrintableFlyerA5';
import { FaTimes } from 'react-icons/fa'; 

// --- Form Yardımcı Bileşenleri ---
const FormInput = ({ label, type = 'text', hint, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-rcDarkGray">{label}</label>
        <input
            type={type}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-rcBlue focus:border-rcBlue"
            {...props}
        />
        {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
);
const FormTextarea = ({ label, rows = 4, hint, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-rcDarkGray">{label}</label>
        <textarea
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-rcBlue focus:border-rcBlue"
            rows={rows}
            {...props}
        ></textarea>
         {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
);
const FormSelect = ({ label, children, ...props }) => (
     <div>
        <label className="block text-sm font-medium text-rcDarkGray">{label}</label>
        <select
             className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-rcBlue focus:border-rcBlue"
             {...props}
        >
            {children}
        </select>
    </div>
);
const FormCheckbox = ({ label, hint, ...props }) => ( 
    <div>
        <div className="flex items-center">
            <input
                type="checkbox"
                className="h-4 w-4 text-rcBlue border-gray-300 rounded focus:ring-rcBlue"
                {...props}
            />
            <label htmlFor={props.id} className="ml-2 block text-sm font-medium text-rcDarkGray">
                {label}
            </label>
        </div>
        {hint && <p className="mt-1 text-xs text-gray-500 ml-6">{hint}</p>}
    </div>
);
// --- Bitiş: Form Yardımcı Bileşenleri ---


// Ana Form Bileşeni
export default function EreignisForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [isDownloading, setIsDownloading] = useState(false); 

    // --- Form state'leri ---
    const [title, setTitle] = useState('');
    const [eventDate, setEventDate] = useState('');
    const [location, setLocation] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('Offene Stube');
    const [imageUrl, setImageUrl] = useState(''); 
    const [isFeatured, setIsFeatured] = useState(false);
    const [registrationDetails, setRegistrationDetails] = useState('');
    const [cost, setCost] = useState('');
    const [contactPerson, setContactPerson] = useState('');
    const [programDetails, setProgramDetails] = useState([]); // Bu state zaten vardı
    const [notes, setNotes] = useState('');
    const [isPublic, setIsPublic] = useState(false); 
    const [archiveSummary, setArchiveSummary] = useState(''); 
    const [archivePhotos, setArchivePhotos] = useState([]); 
    const [youtubeUrl, setYoutubeUrl] = useState('');

    const [currentEventDataForPdf, setCurrentEventDataForPdf] = useState(null);
    const categoryOptions = [
        'Offene Stube', 'Frühstück', 'Sprachtreff', 'Ausstellungen', 'Spielen',
        'Singen', 'Handarbeiten', 'Schreibwerkstatt', 'Nachbarschaftsbörse',
        'Sonntagsgespräch', 'Beratung', 'Nachhilfe', 'Bürgertreff unterwegs', 'Sonstiges',
        'Intern'
    ];

    const a4Ref = useRef();
    const a5Ref = useRef();
    const isEditMode = !!id;
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [previewType, setPreviewType] = useState(null);
    const [previewData, setPreviewData] = useState(null);

    // Düzenleme modunda veriyi çek
    useEffect(() => {
        if (isEditMode) {
            setLoading(true);
            const fetchEvent = async () => {
                const { data, error } = await supabase.from('ereignisse').select('*').eq('id', id).single();
                if (data) {
                    setCurrentEventDataForPdf(data);
                    setTitle(data.title || '');
                    setEventDate(data.event_date ? new Date(data.event_date).toISOString().slice(0, 16) : '');
                    setLocation(data.location || '');
                    setDescription(data.description || '');
                    setCategory(data.category || 'Offene Stube');
                    setImageUrl(data.image_url || '');
                    setIsFeatured(data.is_featured || false);
                    setRegistrationDetails(data.registration_details || '');
                    setCost(data.cost || '');
                    setContactPerson(data.contact_person || '');
                    setProgramDetails(data.program_details || []); // Veritabanından çek
                    setNotes(data.notes || '');
                    setIsPublic(data.is_public || false);
                    setArchiveSummary(data.archive_summary || '');
                    setArchivePhotos(data.archive_photos || []);
                    setYoutubeUrl(data.youtube_url || ''); 
                } else {
                    setMessage(`Fehler: Ereignis mit ID ${id} nicht gefunden. ${error?.message}`);
                }
                setLoading(false);
            };
            fetchEvent();
        }
    }, [id, isEditMode]);

    // Formu gönderme (Kaydetme)
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('Speichere...');
        const eventData = {
            title,
            event_date: eventDate ? new Date(eventDate).toISOString() : null,
            location,
            description,
            category,
            image_url: imageUrl || null,
            is_featured: isFeatured,
            registration_details: registrationDetails || null,
            cost: cost || null,
            contact_person: contactPerson || null,
            program_details: programDetails.length > 0 ? programDetails : null, // Veritabanına kaydet
            notes: notes || null,
            is_public: isPublic,
            archive_summary: archiveSummary || null,
            archive_photos: archivePhotos.length > 0 ? archivePhotos : null,
            youtube_url: youtubeUrl || null,
        };
        
        let error;
        let savedEventId = id;
        if (isEditMode) {
            ({ error } = await supabase.from('ereignisse').update(eventData).eq('id', id));
        } else {
            const { data: newEvent, error: insertError } = await supabase.from('ereignisse').insert(eventData).select('id').single();
            if (newEvent) savedEventId = newEvent.id;
            error = insertError;
        }
        if (error) {
            setMessage(`Fehler beim Speichern: ${error.message}`);
            setLoading(false);
        } else {
            setMessage('Ereignis erfolgreich gespeichert!');
             const updatedDataForPdf = { ...eventData, id: savedEventId, created_at: currentEventDataForPdf?.created_at || new Date().toISOString() };
             setCurrentEventDataForPdf(updatedDataForPdf);
            setLoading(false);
             setTimeout(() => { navigate('/admin/ereignisse'); }, 1500);
        }
    };

    // Ana Resim Yükleme
    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setLoading(true);
        setMessage('Lade Hauptbild hoch...');
        const fileName = `event-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        
        const { error: uploadError } = await supabase.storage.from('page_assets').upload(fileName, file);
        
        if (uploadError) {
            setMessage(`Upload Fehler: ${uploadError.message}`);
        } else {
            const { data: { publicUrl } } = supabase.storage.from('page_assets').getPublicUrl(fileName);
            setImageUrl(publicUrl);
            setMessage('Hauptbild erfolgreich hochgeladen.');
        }
        setLoading(false);
        setTimeout(() => setMessage(''), 4000);
    };

    // Arşiv Resim Yükleme (Çoklu)
    const handleArchivePhotosUpload = async (e) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        
        setLoading(true);
        setMessage(`Lade ${files.length} Archivfoto(s) hoch...`);
        
        const uploadPromises = [];
        for (const file of files) {
            const fileName = `archive-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
            uploadPromises.push(supabase.storage.from('page_assets').upload(fileName, file));
        }

        try {
            const results = await Promise.all(uploadPromises);
            const newUrls = [];
            let uploadErrors = [];

            for (const result of results) {
                if (result.error) {
                    uploadErrors.push(result.error.message);
                } else if (result.data) {
                    const { data: { publicUrl } } = supabase.storage.from('page_assets').getPublicUrl(result.data.path);
                    if(publicUrl) {
                        newUrls.push(publicUrl);
                    }
                }
            }

            if (newUrls.length > 0) {
                setArchivePhotos(prevPhotos => [...prevPhotos, ...newUrls]);
                setMessage(`${newUrls.length} von ${files.length} Foto(s) erfolgreich hochgeladen.`);
            }

            if (uploadErrors.length > 0) {
                setMessage(`Fehler bei einigen Uploads: ${uploadErrors.join(', ')}`);
            }

        } catch (err) {
            console.error("Fehler beim Hochladen der Archivfotos:", err);
            setMessage(`Upload Fehler: ${err.message}`);
        }

        setLoading(false);
        setTimeout(() => setMessage(''), 5000);
    };

    // Arşivden Fotoğraf Silme
    const handleRemoveArchivePhoto = (urlToRemove) => {
        setArchivePhotos(prevPhotos => prevPhotos.filter(url => url !== urlToRemove));
        setMessage("Foto aus der Archiv-Galerie entfernt. (Änderungen speichern nicht vergessen!)");
        setTimeout(() => setMessage(''), 4000);
    };


    // PDF İNDİRME FONKSİYONU
    const handleDownloadPdf = () => {
        setIsDownloading(true); 
        let node, format, width, height, fileName;
        const safeTitle = (previewData.title || 'ereignis').replace(/[^a-zA-Z0-9.-]/g, '_');
        if (previewType === 'a4') {
            node = a4Ref.current; format = 'a4'; width = 210; height = 297;
            fileName = `Flyer_A4_${safeTitle}.pdf`;
        } else {
            node = a5Ref.current; format = 'a5'; width = 148; height = 210;
            fileName = `Flyer_A5_${safeTitle}.pdf`;
        }
        if (!node) { alert("Hata: İndirilecek bileşen referansı (ref) bulunamadı."); setIsDownloading(false); return; }

        toPng(node, { pixelRatio: 3, backgroundColor: '#ffffff' })
            .then((dataUrl) => {
                const pdf = new jsPDF('p', 'mm', format);
                pdf.addImage(dataUrl, 'PNG', 0, 0, width, height);
                pdf.save(fileName);
                setIsDownloading(false);
                setIsPreviewOpen(false);
            })
            .catch((err) => {
                console.error('PDF oluşturulurken hata oluştu:', err);
                alert('PDF oluşturulurken bir hata oluştu: ' + err.message);
                setIsDownloading(false);
            });
    };

    // Modal Açma Fonksiyonları
    const openPrintPreview = (type) => {
        const latestPdfData = {
            id: currentEventDataForPdf?.id || null, created_at: currentEventDataForPdf?.created_at || new Date().toISOString(),
            title, event_date: eventDate, location, description, category, image_url: imageUrl, is_featured: isFeatured,
            registration_details: registrationDetails, cost, contact_person: contactPerson,
            program_details: programDetails, notes,
            is_public: isPublic, archive_summary: archiveSummary, archive_photos: archivePhotos,
            youtube_url: youtubeUrl
        };
        setPreviewData(latestPdfData);
        setPreviewType(type);
        setIsPreviewOpen(true);
    };
    
    // Program Detayları Yönetimi Fonksiyonları
    const handleAddProgramItem = () => { setProgramDetails([...programDetails, { time: '', activity: '' }]); };
    const handleProgramItemChange = (index, field, value) => { const newP = [...programDetails]; newP[index][field] = value; setProgramDetails(newP); };
    const handleRemoveProgramItem = (index) => { setProgramDetails(programDetails.filter((_, i) => i !== index)); };


    if (loading && isEditMode && !message) {
        return <div className="p-8 text-center text-gray-500">Lade Ereignisdaten...</div>;
    }

    const pdfData = previewData || currentEventDataForPdf || {
         id: null, created_at: new Date().toISOString(), title, event_date: eventDate, location, description, category, image_url: imageUrl, is_featured: isFeatured,
         registration_details: registrationDetails, cost, contact_person: contactPerson, program_details: programDetails, notes,
         is_public: isPublic, archive_summary: archiveSummary, archive_photos: archivePhotos, youtube_url: youtubeUrl
    };

    return (
        <div className="space-y-6">
            {/* --- Yazdırma Önizleme Modal Penceresi (Değişiklik yok) --- */}
            {isPreviewOpen && previewData && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[95vh] flex flex-col my-auto">
                        <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white z-10">
                            <h3 className="text-xl font-semibold text-rcDarkGray"> Vorschau ({previewType === 'a4' ? 'A4' : 'A5'}) </h3>
                            <button onClick={() => setIsPreviewOpen(false)} className="text-gray-400 hover:text-rcRed text-2xl" > &times; </button>
                        </div>
                        <div className="p-6 overflow-auto flex-grow bg-gray-200 print-preview-visible">
                             {previewType === 'a4' && (
                                <div className="mx-auto bg-white shadow-lg border border-gray-300">
                                    <PrintableFlyerA4 ref={a4Ref} trip={previewData} />
                                </div>
                             )}
                             {previewType === 'a5' && (
                                <div className="mx-auto bg-white shadow-lg border border-gray-300" style={{ width: '148mm' }}>
                                     <PrintableFlyerA5 ref={a5Ref} trip={previewData} />
                                </div>
                             )}
                        </div>
                        <div className="flex justify-end items-center p-4 border-t space-x-3 bg-gray-50 rounded-b-lg sticky bottom-0 z-10">
                            <button 
                                onClick={() => setIsPreviewOpen(false)} 
                                disabled={isDownloading}
                                className="px-4 py-2 bg-gray-200 text-rcDarkGray rounded hover:bg-gray-300 text-sm font-medium disabled:opacity-50" 
                            > 
                                Schließen 
                            </button>
                            <button 
                                onClick={handleDownloadPdf} 
                                disabled={isDownloading}
                                className="px-5 py-2 bg-rcBlue text-white rounded hover:bg-blue-700 text-sm font-semibold shadow disabled:bg-gray-400" 
                            > 
                                {isDownloading ? 'Wird erstellt...' : 'PDF Herunterladen'} 
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* --- Bitiş: Modal Penceresi --- */}

            <div className="mb-4">
                <Link to="/admin/ereignisse" className="text-rcBlue font-semibold hover:underline"> &larr; Zurück zur Ereignisliste </Link>
            </div>

            {message && (
                <p className={`mb-4 p-3 rounded-md border text-sm ${message.startsWith('Fehler') ? 'bg-red-100 text-rcRed border-red-300' : 'bg-green-100 text-green-800 border-green-300'}`}> {message} </p>
            )}

            {/* --- ANA FORM BAŞLANGIÇ --- */}
            <form onSubmit={handleSubmit} className="space-y-6">

                {/* --- Ana İçerik Bölümü --- */}
                <div className="bg-white p-6 shadow-lg rounded-lg border border-gray-200 space-y-4">
                    <h2 className="text-2xl font-semibold text-rcDarkGray mb-4 pb-2 border-b border-gray-200">
                        {isEditMode ? 'Ereignis bearbeiten' : 'Neues Ereignis erstellen'}
                    </h2>
                    <FormInput label="Titel*" value={title} onChange={(e) => setTitle(e.target.value)} required />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormInput label="Datum & Uhrzeit" type="datetime-local" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
                        <FormInput label="Ort" value={location} onChange={(e) => setLocation(e.target.value)} />
                    </div>
                    <FormTextarea label="Beschreibung" value={description} onChange={(e) => setDescription(e.target.value)} hint="Sie können hier Zeilenumbrüche verwenden, diese werden im PDF korrekt dargestellt." />
                    
                    {/* --- DÜZELTME: EKSİK OLAN PROGRAM DETAYLARI BÖLÜMÜ EKLENDİ --- */}
                    <div className="space-y-3 p-4 border border-gray-200 rounded-md bg-gray-50">
                        <h3 className="text-base font-medium text-rcDarkGray">Programm-Details (Optional)</h3>
                        {programDetails.map((item, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <input type="text" placeholder="Zeit (z.B. 13:30 Uhr)" value={item.time} onChange={(e) => handleProgramItemChange(index, 'time', e.target.value)} className="flex-1 w-1/3 px-2 py-1 border border-gray-300 rounded text-sm" />
                            <input type="text" placeholder="Aktivität / Programmpunkt" value={item.activity} onChange={(e) => handleProgramItemChange(index, 'activity', e.target.value)} className="flex-1 w-2/3 px-2 py-1 border border-gray-300 rounded text-sm" />
                            <button type="button" onClick={() => handleRemoveProgramItem(index)} className="px-3 py-1 bg-rcRed text-white rounded hover:bg-red-700 text-sm">X</button>
                        </div>
                        ))}
                        <button type="button" onClick={handleAddProgramItem} className="px-3 py-1 text-sm bg-gray-200 text-rcDarkGray rounded hover:bg-gray-300">
                        + Programmpunkt hinzufügen
                        </button>
                    </div>
                    {/* --- BİTİŞ: PROGRAM DETAYLARI --- */}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormSelect label="Kategorie*" value={category} onChange={(e) => setCategory(e.target.value)} required >
                            {categoryOptions.map(cat => ( <option key={cat} value={cat}>{cat}</option>))}
                        </FormSelect>
                        <FormInput label="Kontaktperson (Optional)" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormInput label="Kosten (Optional)" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="z.B. 5€ / Eintritt frei" />
                        <FormInput label="Link/Infos zur Anmeldung (Optional)" value={registrationDetails} onChange={(e) => setRegistrationDetails(e.target.value)} placeholder="z.B. E-Mail Adresse oder Link" />
                    </div>
                    <FormTextarea
                        label="Zusätzliche Notizen (Optional)"
                        rows={2}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        hint="z.B. Unterstützer, spezielle Hinweise etc. Wird im PDF angezeigt."
                    />
                    
                    {/* Ana Resim Yükleme Formu */}
                    <div className="p-4 border rounded-md space-y-2 bg-gray-50">
                         <label className="block text-sm font-medium text-rcDarkGray">Hauptbild (Optional)</label>
                         <input type="file" accept="image/png, image/jpeg" onChange={handleImageUpload} disabled={loading} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-rcLightBlue file:text-rcBlue hover:file:bg-blue-200 cursor-pointer" />
                       {imageUrl && (
                            <div className="mt-2 group relative">
                                <img src={imageUrl} alt="Vorschau" className="max-h-40 rounded border"/>
                                <input type="text" readOnly value={imageUrl} className="mt-1 block w-full text-xs text-gray-500 bg-gray-100 border border-gray-300 rounded px-2 py-1" title="Bild-URL" />
                                 <button type="button" onClick={() => setImageUrl('')} title="Bild-URL entfernen (Datei bleibt im Storage)" className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-700 text-xs"> <FaTimes size={10} /> </button>
                            </div>
                       )}
                         <p className="text-xs text-gray-500">Das Hauptbild für die Ankündigung. Wird auf der Angebotsseite (Karte) und oben im Banner der Detailseite angezeigt.</p>
                     </div>
                </div>

                {/* --- Arşiv Bölümü --- */}
                <div className="bg-white p-6 shadow-lg rounded-lg border border-gray-200 space-y-4">
                    <h2 className="text-xl font-semibold text-rcDarkGray mb-4 pb-2 border-b border-gray-200">
                        Archiv & Video (Nach der Veranstaltung)
                    </h2>
                    <FormTextarea
                        label="Archiv-Zusammenfassung (Optional)"
                        rows={4}
                        value={archiveSummary}
                        onChange={(e) => setArchiveSummary(e.target.value)}
                        hint="Wie war die Veranstaltung? Dieser Text wird im Archiv anstelle der normalen Beschreibung angezeigt."
                    />
                    
                    <FormInput 
                        label="YouTube Video-Link (Optional)" 
                        type="url"
                        value={youtubeUrl} 
                        onChange={(e) => setYoutubeUrl(e.target.value)}
                        hint="Kopieren Sie den vollen YouTube-Link hierher (z.B. https://www.youtube.com/watch?v=...)"
                        placeholder="https://www.youtube.com/watch?v=..."
                    />
                    
                    {/* Arşiv Fotoğraf Yükleme Formu */}
                    <div>
                        <label className="block text-sm font-medium text-rcDarkGray">Archiv-Fotos (Optional)</label>
                        <input 
                            type="file" 
                            accept="image/png, image/jpeg" 
                            multiple 
                            onChange={handleArchivePhotosUpload} 
                            disabled={loading} 
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-rcLightBlue file:text-rcBlue hover:file:bg-blue-200 cursor-pointer" 
                        />
                        <p className="text-xs text-gray-500 mt-1">Sie können mehrere Bilder auswählen. Diese werden auf der Detailseite als Galerie angezeigt.</p>
                        
                        {archivePhotos && archivePhotos.length > 0 && (
                            <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                                {archivePhotos.map((url, index) => (
                                    <div key={index} className="relative group aspect-square">
                                        <img src={url} alt={`Archivfoto ${index + 1}`} className="w-full h-full object-cover rounded-md border border-gray-300" />
                                        <button 
                                            type="button" 
                                            onClick={() => handleRemoveArchivePhoto(url)}
                                            title="Dieses Foto aus der Liste entfernen"
                                            className="absolute -top-2 -right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-700 transition-opacity"
                                        >
                                            <FaTimes size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* --- Yayınlama ve Kaydetme Bölümü --- */}
                <div className="bg-white p-6 shadow-lg rounded-lg border border-gray-200 space-y-4">
                    <h2 className="text-xl font-semibold text-rcDarkGray mb-4 pb-2 border-b border-gray-200">
                        Veröffentlichung & Speichern
                    </h2>
                    <FormCheckbox 
                        id="is_public" 
                        label="Auf der 'Angebote' Seite öffentlich anzeigen?" 
                        checked={isPublic} 
                        onChange={(e) => setIsPublic(e.target.checked)} 
                        hint="Wenn dies nicht aktiviert ist, wird das Ereignis gespeichert (und kann als PDF heruntergeladen werden), erscheint aber nicht auf der öffentlichen Website. Nützlich für interne Termine."
                    />
                    <FormCheckbox 
                        id="is_featured" 
                        label="Als hervorgehobenes Ereignis auf Angebotsseite anzeigen?" 
                        checked={isFeatured} 
                        onChange={(e) => setIsFeatured(e.target.checked)} 
                        // DÜZELTME: Açıklama metni eklendi
                        hint="Zeigt dieses Ereignis in einem speziellen 'Highlight'-Bereich an (z.B. auf der Startseite). Funktioniert nur, wenn es auch 'öffentlich' ist."
                        disabled={!isPublic} 
                    />

                    <div className="flex justify-end pt-4 border-t border-gray-200 mt-4">
                        <button type="submit" disabled={loading} className="w-full md:w-auto px-6 py-2 bg-rcBlue text-white font-semibold rounded-md shadow hover:bg-blue-700 disabled:bg-gray-400 transition-colors">
                            {loading ? 'Speichere...' : (isEditMode ? 'Änderungen speichern' : 'Ereignis erstellen')}
                        </button>
                    </div>
                </div>
            </form>
            {/* --- ANA FORM BİTİŞ --- */}


            {/* PDF Çıktı Bölümü */}
            {currentEventDataForPdf && (
                <div className="pt-6 border-t border-gray-200 bg-white p-6 shadow-lg rounded-lg mt-6">
                    <h3 className="text-lg font-medium text-rcDarkGray mb-3">Flyer als PDF herunterladen</h3>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <button type="button" onClick={() => openPrintPreview('a4')} disabled={loading} className="w-full sm:w-auto px-4 py-2 bg-rcDarkGray text-white rounded hover:bg-gray-700 transition-colors disabled:bg-gray-400" > A4 Vorschau & PDF-Download </button>
                        <button type="button" onClick={() => openPrintPreview('a5')} disabled={loading} className="w-full sm:w-auto px-4 py-2 bg-rcDarkGray text-white rounded hover:bg-gray-700 transition-colors disabled:bg-gray-400" > A5 Vorschau & PDF-Download </button>
                    </div>
                     <p className="text-xs text-gray-500 mt-2">Zeigt eine Vorschau der aktuellen Formulardaten an. Der Download wird im Vorschaufenster gestartet.</p>
                </div>
            )}
        </div>
    );
}