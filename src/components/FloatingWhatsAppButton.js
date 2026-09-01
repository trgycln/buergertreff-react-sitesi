// src/components/FloatingWhatsAppButton.js
import React from 'react';
import { FaWhatsapp, FaUsers } from 'react-icons/fa';

const WHATSAPP_GROUP_URL = 'https://chat.whatsapp.com/FqBNBrOmcnL7CTXPL9yRnm';

const FloatingWhatsAppButton = () => {
    return (
        <aside aria-label="WhatsApp Gruppe" className="fixed bottom-6 right-6 z-40">
            {/* Yüzen Grup Butonu */}
            <a
                href={WHATSAPP_GROUP_URL}
                target="_blank"
                rel="noopener noreferrer"
                title="Bürgertreff WhatsApp-Gruppe beitreten"
                aria-label="Bürgertreff WhatsApp-Gruppe beitreten"
                className="relative flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 group focus:outline-none focus:ring-4 focus:ring-green-300"
            >
                {/* Ana WhatsApp İkonu */}
                <FaWhatsapp className="text-3xl text-white transform transition-transform group-hover:scale-105" />

                {/* Grup / Topluluk Mikro Rozeti (Sağ Üst Köşede) */}
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-slate-900 text-white border-2 border-white flex items-center justify-center text-[10px] shadow-sm">
                    <FaUsers />
                </span>

                {/* Sadece mouse ile butonun tam üzerine gelince (hover) görünen sessiz ipucu */}
                <span className="pointer-events-none absolute right-16 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap bg-slate-900/90 backdrop-blur-md text-white text-xs font-semibold py-1.5 px-3 rounded-lg shadow-lg border border-white/10 hidden md:inline-block">
                    WhatsApp-Gruppe
                </span>
            </a>
        </aside>
    );
};

export default FloatingWhatsAppButton;
