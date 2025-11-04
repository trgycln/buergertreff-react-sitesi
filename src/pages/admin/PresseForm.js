// src/pages/admin/PresseForm.js
// YENİ SAYFA: Basın makalelerini eklemek ve düzenlemek için form.

import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { FaTimes } from 'react-icons/fa';

// --- Form Yardımcı Bileşenleri (Bu dosyaya özel kopyalandı) ---
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


export default function PresseForm() {
    const { id } = useParams(); // URL'den :id'yi alır
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    // Form state'leri
    const [title, setTitle] = useState('');
    const [publication, setPublication] = useState('');
    const [articleDate, setArticleDate] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [isPublic, setIsPublic] = useState(true); // Varsayılan olarak 'true'

    const isEditMode = !!id;

    // Düzenleme modunda veriyi çek
    useEffect(() => {
        if (isEditMode) {
            setLoading(true);
            const fetchArticle = async () => {
                const { data, error } = await supabase
                    .from('presse_articles')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (data) {
                    setTitle(data.title || '');
                    setPublication(data.publication || '');
                    // Tarihi 'yyyy-MM-dd' formatına çevir (input type="date" için gerekli)
                    setArticleDate(data.article_date ? new Date(data.article_date).toISOString().slice(0, 10) : '');
                    setImageUrl(data.image_url || '');
                    setIsPublic(data.is_public);
                } else {
                    setMessage(`Fehler: Artikel mit ID ${id} nicht gefunden. ${error?.message}`);
                }
                setLoading(false);
            };
            fetchArticle();
        }
    }, [id, isEditMode]);

    // Formu gönderme (Kaydetme)
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('Speichere...');
        
        const articleData = {
            title,
            publication: publication || null,
            article_date: articleDate,
            image_url: imageUrl,
            is_public: isPublic,
        };

        // Gerekli alan kontrolü
        if (!title || !articleDate || !imageUrl) {
            setMessage("Fehler: Titel, Datum und Bild-URL sind Pflichtfelder.");
            setLoading(false);
            return;
        }

        let error;
        if (isEditMode) {
            ({ error } = await supabase.from('presse_articles').update(articleData).eq('id', id));
        } else {
            ({ error } = await supabase.from('presse_articles').insert(articleData));
        }

        if (error) {
            setMessage(`Fehler beim Speichern: ${error.message}`);
            setLoading(false);
        } else {
            setMessage('Artikel erfolgreich gespeichert!');
            setLoading(false);
            setTimeout(() => { navigate('/admin/presse'); }, 1500); // Listeye geri dön
        }
    };

    // Resim yükleme
    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setLoading(true);
        setMessage('Lade Pressebild hoch...');
        const fileName = `presse-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        
        const { error: uploadError } = await supabase.storage.from('page_assets').upload(fileName, file);
        
        if (uploadError) {
            setMessage(`Upload Fehler: ${uploadError.message}`);
        } else {
            const { data: { publicUrl } } = supabase.storage.from('page_assets').getPublicUrl(fileName);
            setImageUrl(publicUrl); // Resim URL'sini state'e ata
            setMessage('Bild erfolgreich hochgeladen. URL wurde zum Feld hinzugefügt.');
        }
        setLoading(false);
        setTimeout(() => setMessage(''), 4000);
    };

    if (loading && isEditMode && !message) {
        return <div className="p-8 text-center text-gray-500">Lade Artikeldaten...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-4">
                <Link to="/admin/presse" className="text-rcBlue font-semibold hover:underline">
                    &larr; Zurück zur Presse-Liste
                </Link>
            </div>

            {message && (
                <p className={`mb-4 p-3 rounded-md text-sm ${message.startsWith('Fehler') ? 'bg-red-100 text-rcRed' : 'bg-green-100 text-green-800'}`}>
                    {message}
                </p>
            )}

            <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 shadow-lg rounded-lg border border-gray-200">
                <h2 className="text-2xl font-semibold text-rcDarkGray mb-4 pb-2 border-b border-gray-200">
                    {isEditMode ? 'Presseartikel bearbeiten' : 'Neuen Presseartikel anlegen'}
                </h2>

                <FormInput 
                    label="Titel*" 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                    placeholder="z.B. Bald heißt es in Wissen: 'Komm ren'"
                    required 
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormInput 
                        label="Publikation (Quelle)" 
                        value={publication} 
                        onChange={(e) => setPublication(e.target.value)}
                        placeholder="z.B. Rhein-Zeitung"
                    />
                    <FormInput 
                        label="Artikel-Datum*" 
                        type="date" 
                        value={articleDate} 
                        onChange={(e) => setArticleDate(e.target.value)}
                        required 
                    />
                </div>

                {/* Resim Yükleme Formu */}
                <div className="p-4 border rounded-md space-y-2 bg-gray-50">
                    <label className="block text-sm font-medium text-rcDarkGray">Bild-Upload*</label>
                    <input 
                        type="file" 
                        accept="image/png, image/jpeg, image/jpg" 
                        onChange={handleImageUpload} 
                        disabled={loading} 
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-rcLightBlue file:text-rcBlue hover:file:bg-blue-200 cursor-pointer" 
                    />
                    {imageUrl && (
                        <div className="mt-2 group relative">
                            <img src={imageUrl} alt="Vorschau" className="max-h-60 rounded border"/>
                            <input 
                                type="text" 
                                readOnly 
                                value={imageUrl} 
                                className="mt-1 block w-full text-xs text-gray-500 bg-gray-100 border border-gray-300 rounded px-2 py-1" 
                                title="Bild-URL" 
                            />
                            <button 
                                type="button" 
                                onClick={() => setImageUrl('')} 
                                title="Bild-URL entfernen (Datei bleibt im Storage)"
                                className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-700 text-xs"
                            >
                                <FaTimes size={10} />
                            </button>
                        </div>
                    )}
                    <p className="text-xs text-gray-500">Laden Sie hier das eingescannte Bild des Artikels hoch. Die URL ist ein Pflichtfeld.</p>
                </div>

                {/* Yayınlama ve Kaydetme */}
                <div className="pt-4 border-t border-gray-200 space-y-4">
                    <FormCheckbox 
                        id="is_public" 
                        label="Auf der 'Presse' Seite öffentlich anzeigen?" 
                        checked={isPublic} 
                        onChange={(e) => setIsPublic(e.target.checked)} 
                        hint="Standardmäßig auf 'an'. Entfernen Sie das Häkchen, um den Artikel zu verbergen."
                    />
                    <div className="flex justify-end">
                        <button 
                            type="submit" 
                            disabled={loading} 
                            className="w-full md:w-auto px-6 py-2 bg-rcBlue text-white font-semibold rounded-md shadow hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                        >
                            {loading ? 'Speichere...' : (isEditMode ? 'Änderungen speichern' : 'Artikel erstellen')}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}