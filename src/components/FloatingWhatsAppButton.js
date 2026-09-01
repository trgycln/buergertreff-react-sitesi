// src/components/FloatingWhatsAppButton.js
import React, { useState } from 'react';
import { FaWhatsapp, FaTimes } from 'react-icons/fa';

const WHATSAPP_GROUP_URL = 'https://chat.whatsapp.com/FqBNBrOmcnL7CTXPL9yRnm';

const FloatingWhatsAppButton = () => {
    const [isTooltipDismissed, setIsTooltipDismissed] = useState(false);

    return (
        <aside aria-label="WhatsApp Gruppe" className="fixed bottom-6 right-6 z-40 flex items-center gap-3">
            {/* Masaüstü için hafif ipucu balonu */}
            {!isTooltipDismissed && (
                <div className="hidden md:flex items-center gap-2 bg-white/95 backdrop-blur-md text-gray-800 text-xs font-semibold py-2 px-3.5 rounded-full shadow-lg border border-gray-200/80 animate-fade-in-out">
                    <span className="w-2 h-2 rounded-full bg-[#25D366] animate-ping"></span>
                    <span>WhatsApp-Gruppe beitreten</span>
                    <button 
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsTooltipDismissed(true);
                        }}
                        className="text-gray-400 hover:text-gray-600 ml-1"
                        aria-label="Schließen"
                    >
                        <FaTimes className="text-[10px]" />
                    </button>
                </div>
            )}

            {/* Yüzen Buton */}
            <a
                href={WHATSAPP_GROUP_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Bürgertreff WhatsApp Gruppe beitreten"
                className="relative flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 group focus:outline-none focus:ring-4 focus:ring-green-300"
            >
                {/* Hafif nabız dalgası (pulse ring) */}
                <span className="absolute inset-0 rounded-full bg-[#25D366] opacity-30 animate-ping pointer-events-none group-hover:opacity-0"></span>

                <FaWhatsapp className="text-3xl text-white transform transition-transform group-hover:rotate-12" />
            </a>
        </aside>
    );
};

export default FloatingWhatsAppButton;
