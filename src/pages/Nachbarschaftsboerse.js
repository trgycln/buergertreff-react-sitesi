// src/pages/Nachbarschaftsboerse.js
import React from 'react';
import PageBanner from '../components/PageBanner';
import { FaWhatsapp, FaHandsHelping, FaUsers, FaGift, FaCar, FaComments, FaBook, FaBan, FaExclamationTriangle, FaLightbulb, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { MdGroups } from 'react-icons/md';

import nachbarschaftBanner from '../assets/images/nachbarschaft-banner.jpg';
import whatsappQrCode from '../assets/images/whatsapp-qr-code.jpeg';

const Nachbarschaftsboerse = () => {
    const googleGroupsJoinLink = "mailto:nachbarschaftsborse+subscribe@googlegroups.com?subject=Beitrittsanfrage";

    return (
        <div>
            <PageBanner 
                title="Nachbarschaftsbörse"
                imageUrl={nachbarschaftBanner}
            />
            
            <main className="py-12 md:py-20 bg-rcGray">
                <div className="container mx-auto px-6">

                    {/* 1. BÖLÜM: GİRİŞ METNİ */}
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl font-bold text-gray-800">Unsere Nachbarschaftsbörse</h2>
                        <p className="mt-4 text-lg text-gray-600">
                            Diese WhatsApp-Gruppe ist ein Projekt des Bürgertreff Wissen e.V. und fördert den Austausch und die gegenseitige Unterstützung der Teilnehmenden. Mitmachen kann jeder und jede, die Mitglied im Verein „Bürgertreff Wissen“ sind.
                        </p>
                    </div>

                    {/* 2. BÖLÜM: İLHAM BÖLÜMÜ (GENİŞLETİLMİŞ) */}
                    <div className="bg-white p-8 md:p-12 rounded-2xl shadow-xl mb-20">
                        <div className="text-center">
                            <FaLightbulb className="text-rcAccentYellow text-5xl mx-auto mb-4" />
                            <h3 className="text-3xl font-bold text-gray-800">Was kann angeboten oder angefragt werden?</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8 mt-10 max-w-5xl mx-auto">
                            <div className="flex items-start"><FaHandsHelping className="text-rcRed text-2xl mr-4 mt-1 flex-shrink-0" /><div><h4 className="font-bold">Hilfe bei alltäglichen Aufgaben</h4><p className="text-sm text-gray-600">z.B. in Haus und Garten, einfache Reparaturen, Einkauf, Kinderbetreuung, Begleitung bei Arztbesuchen</p></div></div>
                            <div className="flex items-start"><FaUsers className="text-rcRed text-2xl mr-4 mt-1 flex-shrink-0" /><div><h4 className="font-bold">Gemeinsame Freizeitgestaltung</h4><p className="text-sm text-gray-600">z.B. Hobbys, Spaziergänge, Spiele, Kochen, Konzertbesuche</p></div></div>
                            <div className="flex items-start"><FaGift className="text-rcRed text-2xl mr-4 mt-1 flex-shrink-0" /><div><h4 className="font-bold">Weitergabe von Gegenständen</h4><p className="text-sm text-gray-600">z.B. Kleidung, Hausrat oder Ernte aus dem Garten</p></div></div>
                            <div className="flex items-start"><FaCar className="text-rcRed text-2xl mr-4 mt-1 flex-shrink-0" /><div><h4 className="font-bold">Mitfahrgelegenheiten</h4><p className="text-sm text-gray-600">Für Termine oder Veranstaltungen</p></div></div>
                            <div className="flex items-start"><FaComments className="text-rcRed text-2xl mr-4 mt-1 flex-shrink-0" /><div><h4 className="font-bold">(Interkultureller) Austausch</h4><p className="text-sm text-gray-600">Einladungen zu Gesprächsrunden oder Kaffeetrinken</p></div></div>
                            <div className="flex items-start"><FaBook className="text-rcRed text-2xl mr-4 mt-1 flex-shrink-0" /><div><h4 className="font-bold">Lernunterstützung</h4><p className="text-sm text-gray-600">Hilfe beim Deutschlernen, Nachhilfe, Betreuung von Hausaufgaben</p></div></div>
                        </div>
                    </div>

                    {/* 3. BÖLÜM: KATILIM KARTLARI */}
                    <div className="text-center max-w-3xl mx-auto mb-12">
                        <h2 className="text-3xl font-bold text-gray-800">Treten Sie unserer Gemeinschaft bei!</h2>
                        <p className="mt-4 text-lg text-gray-600">Wählen Sie Ihre bevorzugte Plattform, um sich mit Ihren Nachbarn zu vernetzen.</p>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-20">
                        <div className="bg-white p-8 rounded-2xl shadow-xl text-center flex flex-col items-center border-t-4 border-green-500">
                            <FaWhatsapp className="text-6xl text-green-500 mb-4" />
                            <h3 className="text-2xl font-bold text-gray-800">Per WhatsApp beitreten</h3>
                            <img src={whatsappQrCode} alt="WhatsApp QR Code" className="w-64 h-64 rounded-lg shadow-md my-4" />
                            <p className="text-sm text-gray-500">Scanne diesen QR-Code mit der Kamera in WhatsApp.</p>
                            <a href="https://chat.whatsapp.com/FqBNBrOmcnL7CTXPL9yRnm" target="_blank" rel="noopener noreferrer" className="mt-4 bg-green-500 text-white font-bold py-3 px-8 rounded-full hover:bg-green-600 transition-colors">Oder per Link beitreten</a>
                        </div>
                        <div className="bg-white p-8 rounded-2xl shadow-xl text-center flex flex-col items-center border-t-4 border-rcBlue">
                            <MdGroups className="text-6xl text-rcBlue mb-4" />
                            <h3 className="text-2xl font-bold text-gray-800">Per Google Groups beitreten</h3>
                            <div className="flex-grow flex flex-col justify-center items-center p-6 bg-rcLightBlue rounded-lg w-full mt-4">
                                <p className="text-gray-700">Senden Sie einfach eine leere E-Mail, um der Gruppe beizutreten.</p>
                                <a href={googleGroupsJoinLink} className="mt-6 bg-rcBlue text-white font-bold py-3 px-8 rounded-full hover:bg-opacity-80 transition-colors">E-Mail-Anfrage senden</a>
                            </div>
                        </div>
                    </div>

                    {/* 4. BÖLÜM: KURALLARIN TAMAMI */}
                   {/* --- 4. BÖLÜM: GRUP KURALLARI (YENİ TASARIM) --- */}
                    <div className="pt-12 border-t border-gray-300">
                        <h2 className="text-3xl font-bold text-gray-800 text-center">Gruppenregeln & Grundsätze</h2>
                        
                        <div className="max-w-5xl mx-auto mt-8 bg-white p-8 md:p-12 rounded-2xl shadow-xl text-gray-700 space-y-8">
                            
                            {/* Giriş ve Prensipler */}
                            <div className="prose max-w-none text-justify">
                                <p className="indent-4">Diese WhatsApp-Gruppe ist ein Projekt des Bürgertreff Wissen e.V. und fördert den Austausch und die gegenseitige Unterstützung der Teilnehmenden.</p>
                                <br/>
                                <p className="indent-4">Mitmachen kann jeder und jede, die Mitglied im Verein „Bürgertreff Wissen“ sind.</p>
                               <br/>
                                <p className="indent-4"><strong>Die Beiträge sollen den Zielen des Bürgertreff Wissen e.V. entsprechen:</strong> Überwindung von Einsamkeit, Förderung von Toleranz und Solidarität, Völkerverständigung, gegenseitiger Respekt, Vermittlung demokratischer Werte und Teilhabe am öffentlichen Leben.</p>
                               <br/>
                                <p className="indent-4">Insbesondere unterstützen wir Jugendliche, Senioren und Migranten sowie Menschen, die sich bürgerschaftlich engagieren.</p>
                            </div>

                            {/* İki Sütunlu "Yapılacaklar" ve "Yapılmayacaklar" Listesi */}
                            <div className="grid md:grid-cols-2 gap-8 pt-8 border-t">
                                
                                {/* "Yapılacaklar" Sütunu */}
                                <div>
                                    <h3 className="font-bold text-lg text-green-700 mb-4">Was kann angeboten oder angefragt werden?</h3>
                                    <ul className="space-y-3">
                                        <li className="flex items-start"><FaCheckCircle className="text-green-500 mr-3 mt-1 flex-shrink-0" /><span>Hilfe bei alltäglichen Aufgaben (z.B. Einkauf, Kinderbetreuung)</span></li>
                                        <li className="flex items-start"><FaCheckCircle className="text-green-500 mr-3 mt-1 flex-shrink-0" /><span>Gemeinsame Freizeitgestaltung (z.B. Hobbys, Spaziergänge, Spiele)</span></li>
                                        <li className="flex items-start"><FaCheckCircle className="text-green-500 mr-3 mt-1 flex-shrink-0" /><span>Weitergabe von gebrauchten Gegenständen oder Ernte aus dem Garten</span></li>
                                        <li className="flex items-start"><FaCheckCircle className="text-green-500 mr-3 mt-1 flex-shrink-0" /><span>Mitfahrgelegenheiten</span></li>
                                        <li className="flex items-start"><FaCheckCircle className="text-green-500 mr-3 mt-1 flex-shrink-0" /><span>Hinweise auf interessante Veranstaltungen oder soziale Angebote</span></li>
                                        <li className="flex items-start"><FaCheckCircle className="text-green-500 mr-3 mt-1 flex-shrink-0" /><span>Einladungen zu (interkulturellem) Austausch</span></li>
                                        <li className="flex items-start"><FaCheckCircle className="text-green-500 mr-3 mt-1 flex-shrink-0" /><span>Unterstützung beim Deutschlernen, Nachhilfe, Hausaufgaben.</span></li>
                                    </ul>
                                </div>

                                {/* "Yapılmayacaklar" Sütunu */}
                                <div>
                                    <h3 className="font-bold text-lg text-red-700 mb-4">Wir behalten uns vor, Beiträge zu entfernen:</h3>
                                    <ul className="space-y-3">
                                        <li className="flex items-start"><FaTimesCircle className="text-red-500 mr-3 mt-1 flex-shrink-0" /><span>Kommerzielle Werbung und private Verkaufsangebote</span></li>
                                        <li className="flex items-start"><FaTimesCircle className="text-red-500 mr-3 mt-1 flex-shrink-0" /><span>Beiträge mit respektlosem und diskriminierendem Ton</span></li>
                                        <li className="flex items-start"><FaTimesCircle className="text-red-500 mr-3 mt-1 flex-shrink-0" /><span>Kettenbriefe; unbestätigte Nachrichten und Meinungsäußerungen</span></li>
                                        <li className="flex items-start"><FaTimesCircle className="text-red-500 mr-3 mt-1 flex-shrink-0" /><span>Politische oder religiöse Diskussionen oder Aufrufe</span></li>
                                        <li className="flex items-start"><FaTimesCircle className="text-red-500 mr-3 mt-1 flex-shrink-0" /><span>Bei Verstoß gegen Datenschutz und Persönlichkeitsrechte</span></li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Sorumluluk Reddi */}
                        <div className="text-center mt-12">
                            <p className="text-sm text-gray-600 italic flex items-center justify-center">
                                <FaExclamationTriangle className="mr-2" />
                                Hinweis: Die Teilnahme und alle hieraus sich ergebenden Aktionen geschehen auf eigene Verantwortung.
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Nachbarschaftsboerse;