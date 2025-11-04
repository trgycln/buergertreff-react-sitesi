// src/components/EventCard.js
import React from 'react';
import { Link } from 'react-router-dom';
import { FaRegCalendarAlt, FaMapMarkerAlt } from 'react-icons/fa'; // PDF'teki gibi ikonları kullanalım

// Resim bulunamazsa gösterilecek varsayılan resim
import fallbackImage from '../assets/images/ana_logo.jpg'; 

// Tarih formatlama (kısa ve net)
const formatCardDate = (dateString) => {
    if (!dateString) return "Datum wird bekannt gegeben"; // Tarih yoksa
    try {
        const date = new Date(dateString);
        return date.toLocaleString('de-DE', {
            weekday: 'short', // "Sa."
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
         }) + ' Uhr';
    } catch (e) {
        return dateString;
    }
};

const EventCard = ({ event }) => {
    // Resim yoksa varsayılan resmi kullan
    const imageUrl = event.image_url || fallbackImage;

    return (
        <Link 
            to={`/angebote/${event.id}`} 
            className="group block bg-white rounded-lg shadow-md overflow-hidden transform transition-transform duration-300 hover:shadow-xl hover:-translate-y-1 border border-gray-200"
        >
            <div className="relative bg-gray-100">
                {/* Etkinlik Resmi */}
                <img 
                    src={imageUrl} 
                    alt={event.title || 'Veranstaltung'} 
                    className="w-full h-48 object-contain" 
                />
                {/* Kategori Etiketi */}
                {event.category && (
                    <span className="absolute top-2 right-2 bg-rcRed text-white px-3 py-1 rounded-full text-xs font-semibold shadow">
                        {event.category}
                    </span>
                )}
            </div>

            {/* Kart İçeriği */}
            <div className="p-5">
                {/* Başlık */}
                <h3 className="text-xl font-semibold text-rcBlue group-hover:text-blue-700 mb-3 truncate">
                    {event.title}
                </h3>
                
                {/* Tarih */}
                <div className="flex items-center text-rcDarkGray mb-2">
                    <FaRegCalendarAlt className="text-rcRed mr-3 flex-shrink-0" />
                    <span className="text-sm font-medium">{formatCardDate(event.event_date)}</span>
                </div>

                {/* Konum */}
                {event.location && (
                    <div className="flex items-center text-rcDarkGray">
                        <FaMapMarkerAlt className="text-rcRed mr-3 flex-shrink-0" />
                        <span className="text-sm font-medium truncate">{event.location}</span>
                    </div>
                )}
                
                {/* Detay Linki */}
                <div className="text-right mt-4">
                    <span className="text-sm font-semibold text-rcBlue group-hover:underline">
                        Mehr erfahren &rarr;
                    </span>
                </div>
            </div>
        </Link>
    );
};

export default EventCard;