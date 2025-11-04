// src/components/admin/pdf/PrintableFlyerA4.js
// DÜZELTME: Yeni profesyonel tasarım, ikonlar ve adres yedeği eklendi.

import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient'; 
import logo from '../../../assets/images/ana_logo.png'; 
// --- YENİ: İkonlar eklendi ---
import { FaRegCalendarAlt, FaMapMarkerAlt } from 'react-icons/fa';
// --- BİTİŞ: YENİ ---

// Tarih formatlama
const formatEventDate = (dateString) => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        return date.toLocaleString('de-DE', {
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit'
         }) + ' Uhr';
    } catch (e) {
        console.error("Error formatting date:", e);
        return dateString;
    }
};

// Bileşeni React.forwardRef ile sar
export const PrintableFlyerA4 = React.forwardRef(({ trip: event }, ref) => {
  const watermarkUrl = logo; 
  const [footerLine1, setFooterLine1] = useState('');
  const [footerLine2, setFooterLine2] = useState('');

  // Alt bilgiyi 'site_settings' tablosundan çek
  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', ['footer_line1', 'footer_line2']);

      if (data) {
        // DÜZELTME: Adres yedeği "Mittelstrasse" olarak güncellendi
        setFooterLine1(data.find(item => item.key === 'footer_line1')?.value || 'Bürgertreff Wissen e.V. | Mittelstraße, 57537 Wissen');
        setFooterLine2(data.find(item => item.key === 'footer_line2')?.value || 'E-Mail: buergertreff.wissen@gmail.com | www.buergertreff-wissen.de');
      } else if (error) {
        console.error("Fehler beim Laden der Footer-Einstellungen:", error);
      }
    };
    fetchSettings();
  }, []); 

  if (!event || !event.title) {
       return <div ref={ref} className="print-container a4-size">Lade Daten...</div>;
  }

  return (
    <div ref={ref} className="print-container a4-size"> 
        {/* Filigran */}
        <img src={watermarkUrl} alt="Wasserzeichen" className="print-watermark" />

        {/* İçerik Alanı */}
        <div className="print-content">
            
            {/* --- YENİ: Kategori Başlığı ve Çizgi --- */}
            {event.category && (
                <div className="print-category-header">
                    <h2 className="print-category-title">{event.category}</h2>
                    <div className="print-category-line"></div>
                </div>
            )}
            
            {/* Logo ve Başlık Alanı */}
            <div className="print-top-section flex justify-between items-start mb-[8mm]">
                <div className="print-title-area w-3/4">
                    <h1 className="print-title">{event.title}</h1>
                </div>
                <div className="print-logo-area w-1/4 flex justify-end">
                    <img src={logo} alt="Logo" className="print-header-logo w-full h-auto object-contain" />
                </div>
            </div>

            {/* --- DÜZELTME: Meta Bilgiler (İkonlu Yeni Tasarım) --- */}
            <div className="print-meta">
                {event.event_date && (
                    <div className="print-meta-item">
                        <FaRegCalendarAlt className="print-meta-icon" />
                        <span>{formatEventDate(event.event_date)}</span>
                    </div>
                )}
                {event.location && (
                    <div className="print-meta-item">
                        <FaMapMarkerAlt className="print-meta-icon" />
                        <span>{event.location}</span>
                    </div>
                )}
                {/* Kategori buradan kaldırıldı, en üste taşındı */}
            </div>
            {/* --- BİTİŞ: DÜZELTME --- */}


            {/* Ana Resim */}
            {event.image_url && <img src={event.image_url} alt={event.title || 'Ereignisbild'} className="print-main-image" />}

            {/* Açıklama */}
            {event.description && <div className="print-description">{event.description}</div>}

            {/* Program Detayları */}
            {event.program_details && event.program_details.length > 0 && (
                <div className="print-program">
                    <h3 className="print-section-title">Programm:</h3>
                    <ul className="print-program-list">
                    {event.program_details.map((item, index) => (
                        <li key={index}>
                        {item.time && <strong>{item.time}: </strong>}{item.activity}
                        </li>
                    ))}
                    </ul>
                </div>
            )}

            {/* Detaylar (Notlar dahil) */}
            <div className="print-details">
                {event.registration_details && <p><strong>Anmeldung:</strong> {event.registration_details}</p>}
                {event.cost && <p><strong>Kosten:</strong> {event.cost}</p>}
                {event.contact_person && <p><strong>Kontakt:</strong> {event.contact_person}</p>}
                {event.notes && <p><strong>Hinweise:</strong> {event.notes}</p>}
            </div>
        </div> {/* .print-content sonu */}

        {/* Alt Bilgi (Footer) */}
        <div className="print-footer">
            <p>{footerLine1}</p>
            <p>{footerLine2}</p>
        </div>
    </div> // .print-container sonu
  );
});