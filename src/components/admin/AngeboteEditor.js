// src/components/admin/AngeboteEditor.js
// Bu, BuergertreffUnterwegsEditor'ün "Details" sekmesinin
// 'Angebote' sayfasına özel olarak taşınmış halidir.

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient'; // Yolun doğru olduğundan emin olun
import { useReactToPrint } from 'react-to-print';
import { PrintableFlyerA4 } from './pdf/PrintableFlyerA4'; // PDF bileşenlerinin yolu
import { PrintableFlyerA5 } from './pdf/PrintableFlyerA5'; // PDF bileşenlerinin yolu

// Form bileşenleri
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
      rows="4"
      {...props}
    ></textarea>
  </div>
);

export default function AngeboteEditor({ pageInfo }) {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const [trip, setTrip] = useState(null);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [eventDateText, setEventDateText] = useState('');
  const [description, setDescription] = useState('');
  const [registrationInfo, setRegistrationInfo] = useState('');
  const [supporterInfo, setSupporterInfo] = useState('');
  const [mainImageUrl, setMainImageUrl] = useState('');
  const [programDetails, setProgramDetails] = useState([]);
  const [isActive, setIsActive] = useState(false);

  const a4Ref = useRef();
  const a5Ref = useRef();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // 'trips' tablosundan aktif olanı çek (Bu tablo artık genel 'ereignisse' oldu, burayı düzeltmemiz GEREKEBİLİR!)
      // ŞİMDİLİK eski 'trips' tablosunu varsayıyoruz, AMA bu mantık değişmeli!
      // Geçici olarak, ilk bulunan geziyi aktif varsayalım veya hiç göstermeyelim.
      // DOĞRUSU: 'ereignisse' tablosundan 'is_featured=true' olanı çekmek olacak.
      const { data: featuredEvent, error: tripError } = await supabase
        .from('ereignisse') // DÜZELTİLDİ: Yeni tablo adı
        .select('*')
        .eq('is_featured', true) // Öne çıkanı al
        .order('event_date', { ascending: true }) // Yaklaşan ilk öne çıkanı al
        .limit(1)
        .maybeSingle();

      if (featuredEvent) {
        setTrip(featuredEvent); // 'trip' state'ini kullanmaya devam ediyoruz
        setTitle(featuredEvent.title || '');
        setSubtitle(featuredEvent.location || ''); // subtitle yerine location kullanabiliriz
        setEventDateText(featuredEvent.event_date ? new Date(featuredEvent.event_date).toLocaleString('de-DE') : ''); // Tarih formatı
        setDescription(featuredEvent.description || '');
        setRegistrationInfo(featuredEvent.registration_details || '');
        setSupporterInfo(''); // supporter_info kaldırıldı
        setMainImageUrl(featuredEvent.image_url || '');
        setProgramDetails([]); // program_details kaldırıldı
        setIsActive(featuredEvent.is_featured); // is_active yerine is_featured
      } else {
        // Eğer öne çıkan yoksa, formu boş göster
         setTrip(null);
         setTitle('');
         setSubtitle('');
         setEventDateText('');
         setDescription('');
         setRegistrationInfo('');
         setSupporterInfo('');
         setMainImageUrl('');
         setProgramDetails([]);
         setIsActive(false);
      }

      setLoading(false);
    };
    fetchData();
  }, []);

  const handleTripSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('Speichere...');

    // Yeni 'ereignisse' tablosuna uygun veri objesi
    const eventData = {
      title,
      location: subtitle, // subtitle -> location
      event_date: eventDateText ? new Date(eventDateText) : null, // String'i timestamp'e çevir (veya input type=datetime-local kullan)
      description,
      registration_details: registrationInfo,
      // supporter_info kaldırıldı
      image_url: mainImageUrl,
      is_featured: isActive, // isActive -> is_featured
      // category: 'Ankündigung' // Belki sabit bir kategori?
    };

    let error;
    if (trip) {
      // Güncelleme
      ({ error } = await supabase.from('ereignisse').update(eventData).eq('id', trip.id));
    } else {
      // Yeni Kayıt (Bu form normalde sadece güncelleme yapmalı, çünkü tek bir aktif duyuru var)
      // Yeni kayıt mantığı merkezi EreignisForm'da olacak.
       setMessage('Fehler: Kann keine neue Ankündigung von hier erstellen. Bitte verwenden Sie den Bereich "Alle Ereignisse".');
       setLoading(false);
       return;
      // ({ error } = await supabase.from('ereignisse').insert(eventData));
    }

    if (error) {
      setMessage(`Fehler: ${error.message}`);
    } else {
      setMessage('Erfolgreich gespeichert!');
    }
    setLoading(false);
    setTimeout(() => setMessage(''), 3000);
  };

  // Program detayları kaldırıldığı için bu fonksiyonlar da kaldırıldı.

  const handlePrintA4 = useReactToPrint({ content: () => a4Ref.current });
  const handlePrintA5 = useReactToPrint({ content: () => a5Ref.current });

  if (loading && !message) return <div className="p-8">Lade Editor...</div>;

  return (
    <div className="space-y-6">
      {/* Gizli PDF bileşenleri */}
      <div className="hidden">
         {/* PDF bileşenlerine güncel veriyi (eventData benzeri) vermek gerekebilir */}
        <PrintableFlyerA4 ref={a4Ref} trip={trip} />
        <PrintableFlyerA5 ref={a5Ref} trip={trip} />
      </div>

      {message && (
        <p className={`mb-4 p-3 rounded-md border ${message.startsWith('Fehler') ? 'bg-red-100 text-rcRed border-red-300' : 'bg-green-100 text-green-800 border-green-300'}`}>
          {message}
        </p>
      )}

      {/* Formun kendisi */}
      <form onSubmit={handleTripSubmit} className="space-y-6 bg-white p-6 shadow-lg rounded-lg">
        <h2 className="text-2xl font-semibold text-rcDarkGray mb-4">
          Aktuelle Ankündigung (für Angebotsseite)
        </h2>

        <FormInput label="Titel (Başlık)" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <FormInput label="Ort (Yer)" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
        {/* Tarih/Saat için daha iyi bir input kullanılabilir (örn: type="datetime-local") */}
        <FormInput label="Datum & Uhrzeit (Format: JJJJ-MM-TT HH:MM)" value={eventDateText} onChange={(e) => setEventDateText(e.target.value)} placeholder="z.B. 2025-11-15 13:30" />
        <FormTextarea label="Beschreibung (Açıklama)" value={description} onChange={(e) => setDescription(e.target.value)} />
        <FormInput label="Haupt-Bild URL (Ana Resim URL'i)" value={mainImageUrl} onChange={(e) => setMainImageUrl(e.target.value)} placeholder="httpsNote: Upload via 'Alle Ereignisse' form, then copy the URL here." />

        {/* Program Detayları kaldırıldı */}

        <FormTextarea label="Anmeldung Infos (Kayıt Bilgisi)" value={registrationInfo} onChange={(e) => setRegistrationInfo(e.target.value)} />
        {/* Destekçi Bilgisi kaldırıldı */}

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input id="is_active" type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-5 w-5 text-rcBlue border-gray-300 rounded focus:ring-rcBlue" />
            <label htmlFor="is_active" className="ml-2 block text-sm font-medium text-rcDarkGray">Als hervorgehobene Ankündigung auf der Angebotsseite anzeigen?</label>
          </div>
          <button type="submit" disabled={loading || !trip} className="px-6 py-2 bg-rcBlue text-white font-semibold rounded-md shadow hover:bg-blue-700 disabled:bg-gray-400">
            {loading ? 'Speichere...' : 'Ankündigung speichern'}
          </button>
        </div>
         {!trip && <p className="text-sm text-rcRed mt-2">Hinweis: Es wurde keine aktuelle Ankündigung zum Bearbeiten gefunden. Neue Ankündigungen müssen über den Bereich "Alle Ereignisse" erstellt werden.</p>}

        {/* PDF Çıktı Butonları */}
        {trip && (
          <div className="pt-6 border-t border-gray-200">
            <h3 className="text-lg font-medium text-rcDarkGray mb-3">Druckbare Flyer (PDF)</h3>
            <div className="flex gap-4">
              <button type="button" onClick={handlePrintA4} className="px-4 py-2 bg-rcDarkGray text-white rounded hover:bg-gray-700">A4 Flyer Drucken</button>
              <button type="button" onClick={handlePrintA5} className="px-4 py-2 bg-rcDarkGray text-white rounded hover:bg-gray-700">A5 Flyer Drucken</button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}