// src/components/WhatsAppBanner.js
import React from 'react';
import { FaWhatsapp, FaArrowRight, FaUsers, FaBell } from 'react-icons/fa';

const WHATSAPP_GROUP_URL = 'https://chat.whatsapp.com/FqBNBrOmcnL7CTXPL9yRnm';

const WhatsAppBanner = () => {
    return (
        <section className="py-10 bg-white">
            <div className="container mx-auto px-6">
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 via-green-600 to-teal-700 text-white shadow-xl p-8 md:p-12">
                    {/* Arka plan dekoratif daireler */}
                    <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none"></div>
                    <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-black/10 blur-2xl pointer-events-none"></div>

                    <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
                        {/* Sol Taraf: İkon ve Metinler */}
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
                            <div className="w-20 h-20 rounded-2xl bg-white text-[#25D366] flex items-center justify-center text-5xl shadow-lg flex-shrink-0 animate-float-slow">
                                <FaWhatsapp />
                            </div>

                            <div className="max-w-xl">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-bold uppercase tracking-wider mb-3">
                                    <FaUsers className="text-xs" />
                                    <span>Community & Aktuelles</span>
                                </div>
                                <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                                    Bürgertreff WhatsApp-Gruppe
                                </h3>
                                <p className="mt-2 text-green-50 text-sm md:text-base leading-relaxed">
                                    Treten Sie unserer WhatsApp-Gruppe bei und erhalten Sie aktuelle Neuigkeiten, Terminerinnerungen und spontane Einladungen direkt auf Ihr Smartphone.
                                </p>
                            </div>
                        </div>

                        {/* Sağ Taraf: Aksiyon Butonu */}
                        <div className="flex flex-col sm:flex-row items-center gap-4 flex-shrink-0 w-full sm:w-auto">
                            <a
                                href={WHATSAPP_GROUP_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-white text-emerald-800 hover:bg-emerald-50 font-bold py-4 px-8 rounded-full shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 group text-base md:text-lg"
                            >
                                <FaWhatsapp className="text-2xl text-[#25D366] group-hover:rotate-12 transition-transform" />
                                <span>Jetzt beitreten</span>
                                <FaArrowRight className="text-xs transition-transform duration-300 group-hover:translate-x-1" />
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default WhatsAppBanner;
