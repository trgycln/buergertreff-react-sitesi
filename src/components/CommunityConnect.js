// src/components/CommunityConnect.js
import React from 'react';
import { FaWhatsapp, FaInstagram, FaArrowRight, FaUsers, FaCamera } from 'react-icons/fa';

const WHATSAPP_GROUP_URL = 'https://chat.whatsapp.com/FqBNBrOmcnL7CTXPL9yRnm';
const INSTAGRAM_URL = 'https://www.instagram.com/buergertreff.wissen/';

const CommunityConnect = () => {
    return (
        <section className="py-12 bg-white">
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Kart 1: WhatsApp Grubu */}
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 text-white p-8 md:p-10 shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col justify-between group">
                        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/10 blur-xl pointer-events-none"></div>

                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-6">
                                <div className="w-14 h-14 rounded-2xl bg-white text-[#25D366] flex items-center justify-center text-3xl shadow-md group-hover:scale-110 transition-transform">
                                    <FaWhatsapp />
                                </div>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-bold uppercase tracking-wider">
                                    <FaUsers className="text-xs" />
                                    <span>Community</span>
                                </span>
                            </div>

                            <h3 className="text-2xl font-bold tracking-tight mb-2">
                                WhatsApp-Gruppe
                            </h3>
                            <p className="text-green-50 text-sm md:text-base leading-relaxed mb-6">
                                Erhalten Sie Neuigkeiten, Terminerinnerungen und spontane Einladungen direkt auf Ihr Smartphone.
                            </p>
                        </div>

                        <div className="relative z-10 pt-4 border-t border-white/20">
                            <a
                                href={WHATSAPP_GROUP_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-2.5 w-full sm:w-auto bg-white text-emerald-800 hover:bg-emerald-50 font-bold py-3.5 px-6 rounded-full shadow hover:shadow-md transition-all duration-300 hover:scale-105 active:scale-95 text-sm md:text-base"
                            >
                                <FaWhatsapp className="text-xl text-[#25D366]" />
                                <span>Gruppe beitreten</span>
                                <FaArrowRight className="text-xs transition-transform duration-300 group-hover:translate-x-1" />
                            </a>
                        </div>
                    </div>

                    {/* Kart 2: Instagram */}
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#4f5bd5] via-[#962fbf] via-[#d62976] to-[#fa7e1e] text-white p-8 md:p-10 shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col justify-between group">
                        <div className="absolute -bottom-12 -right-12 w-48 h-48 rounded-full bg-white/10 blur-xl pointer-events-none"></div>

                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-6">
                                <div className="w-14 h-14 rounded-2xl bg-white text-[#d62976] flex items-center justify-center text-3xl shadow-md group-hover:scale-110 transition-transform">
                                    <FaInstagram />
                                </div>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-bold uppercase tracking-wider">
                                    <FaCamera className="text-xs" />
                                    <span>@buergertreff.wissen</span>
                                </span>
                            </div>

                            <h3 className="text-2xl font-bold tracking-tight mb-2">
                                Folgen Sie uns auf Instagram
                            </h3>
                            <p className="text-pink-50 text-sm md:text-base leading-relaxed mb-6">
                                Entdecken Sie aktuelle Fotos, Videos, Stories und lebendige Eindrücke aus unseren Veranstaltungen.
                            </p>
                        </div>

                        <div className="relative z-10 pt-4 border-t border-white/20">
                            <a
                                href={INSTAGRAM_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-2.5 w-full sm:w-auto bg-white text-[#962fbf] hover:bg-pink-50 font-bold py-3.5 px-6 rounded-full shadow hover:shadow-md transition-all duration-300 hover:scale-105 active:scale-95 text-sm md:text-base"
                            >
                                <FaInstagram className="text-xl text-[#d62976]" />
                                <span>Auf Instagram folgen</span>
                                <FaArrowRight className="text-xs transition-transform duration-300 group-hover:translate-x-1" />
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default CommunityConnect;
