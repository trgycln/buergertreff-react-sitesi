// src/pages/Kontakt.js
import React from 'react';
import PageBanner from '../components/PageBanner';
// Gerekli tüm ikonları tek bir yerden import ediyoruz
import { FaMapMarkerAlt, FaPhone, FaEnvelope, FaFacebookF, FaInstagram, FaTwitter } from 'react-icons/fa';

import kontaktBannerImage from '../assets/images/kontakt-banner.png';

const Kontakt = () => {
    const mapSrc = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2522.6579855053396!2d7.732635075759554!3d50.781913363443614!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47bea2ede17de4e9%3A0x2068e3463898b2ad!2sMarktstra%C3%9Fe%207%2C%2057537%20Wissen!5e0!3m2!1sde!2sde!4v1757830557294!5m2!1sde!2sde";

    return (
        <div>
            <PageBanner title="Kontakt & Impressum" imageUrl={kontaktBannerImage} />

            <main className="py-12 md:py-20 bg-gray-50">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* --- SOL SÜTUN: İLETİŞİM BİLGİLERİ --- */}
                        <div className="space-y-10"> {/* Bölümler arasına boşluk koymak için */}
                            
                            {/* İletişim Detayları */}
                            <div>
                                <h2 className="text-3xl font-bold text-gray-800 mb-6">Nehmen Sie Kontakt auf</h2>
                                <div className="space-y-4">
                                    <div className="flex items-start">
                                        <FaMapMarkerAlt className="text-red-600 text-xl mr-4 mt-1" />
                                        <div>
                                            <h3 className="font-semibold text-gray-700">Anschrift</h3>
                                            <p className="text-gray-600">
                                                Bürgertreff Wissen<br />
                                                Marktstraße 7<br />
                                                57537 Wissen
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start">
                                        <FaPhone className="text-red-600 text-xl mr-4 mt-1" />
                                        <div>
                                            <h3 className="font-semibold text-gray-700">Telefon</h3>
                                            <p className="text-gray-600">01516 5179082</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start">
                                        <FaEnvelope className="text-red-600 text-xl mr-4 mt-1" />
                                        <div>
                                            <h3 className="font-semibold text-gray-700">E-Mail</h3>
                                            <a href="mailto:buergertreff.wissen@gmail.com" className="text-red-600 hover:underline">
                                                buergertreff.wissen@gmail.com
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Sosyal Medya Bölümü */}
                            <div className="pt-6 border-t border-gray-200">
                                <h3 className="font-semibold text-gray-700 mb-3">Folgen Sie uns Online</h3>
                                <div className="flex items-center gap-5">
                                    <a href="#" target="_blank" rel="noopener noreferrer" className="text-rcBlue hover:text-rcRed transition-colors">
                                        <FaFacebookF size={28} />
                                    </a>
                                    <a href="#" target="_blank" rel="noopener noreferrer" className="text-rcBlue hover:text-rcRed transition-colors">
                                        <FaInstagram size={28} />
                                    </a>
                                    <a href="#" target="_blank" rel="noopener noreferrer" className="text-rcBlue hover:text-rcRed transition-colors">
                                        <FaTwitter size={28} />
                                    </a>
                                </div>
                            </div>

                            {/* Harita Bölümü */}
                            <div>
                                <div className="flex items-center mb-4">
                                    <FaMapMarkerAlt className="text-red-600 text-xl mr-3" />
                                    <h3 className="font-semibold text-gray-700">Standort</h3>
                                </div>
                                <div className="bg-white p-2 rounded-lg shadow-md">
                                    <iframe
                                        src={mapSrc}
                                        title="Bürgertreff Wissen Standort"
                                        className="w-full h-80"
                                        style={{ border: 0 }}
                                        allowFullScreen=""
                                        loading="lazy"
                                        referrerPolicy="no-referrer-when-downgrade"
                                    ></iframe>
                                </div>
                            </div>

                        </div>

                        {/* --- SAĞ SÜTUN: KÜNYE (IMPRESSUM) --- */}
                        <div className="bg-white p-8 rounded-lg shadow-md">
                            <h2 className="text-3xl font-bold text-gray-800 mb-6">Impressum</h2>
                            <div className="text-gray-600 space-y-4">
                                <h3 className="font-semibold text-gray-700">1.Vorsitzende</h3>
                                <p>Erika Uber</p>
                                <h3 className="font-semibold text-gray-700">Webmaster</h3>
                                <p>Turgay Celen</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Kontakt;