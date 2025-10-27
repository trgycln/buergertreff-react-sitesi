import React from 'react';
import PageBanner from '../components/PageBanner';
import { 
    FaWhatsapp, FaHandsHelping, FaUsers, FaGift, FaCar, FaComments, 
    FaBook, FaExclamationTriangle, FaLightbulb, FaCheckCircle, FaTimesCircle 
} from 'react-icons/fa';
import { MdGroups } from 'react-icons/md';

import nachbarschaftBanner from '../assets/images/nachbarschaft-banner.jpg';
import whatsappQrCode from '../assets/images/whatsapp-qr-code.png';

const Nachbarschaftsboerse = () => {
    // Google Groups katılım e-posta adresi
    const googleGroupsJoinLink = "mailto:nachbarschaftsborse+subscribe@googlegroups.com?subject=Beitrittsanfrage";

    return (
        <div>
            <PageBanner 
                title="Nachbarschaftsbörse"
                imageUrl={nachbarschaftBanner}
            />
            
            <main className="py-12 md:py-20 bg-rcGray">
                <div className="container mx-auto px-6">

                    {/* 3. BÖLÜM: KURALLAR */}
                    <div className="pt-12 border-t border-gray-300">
                        <h2 className="text-3xl font-bold text-gray-800 text-center">
                            WhatsApp-Gruppe Nachbarschaftsbörse Wissen – Bürgertreff Wissen e.V.
                        </h2>
                        
                        <div className="max-w-5xl mx-auto mt-8 bg-white p-8 md:p-12 rounded-2xl shadow-xl text-gray-700 space-y-8">
                            <div className="prose max-w-none text-justify">
                                <p className="indent-4">
                                    Diese WhatsApp-Gruppe ist ein Projekt des Bürgertreff Wissen e.V. und fördert den Austausch und die gegenseitige Unterstützung der Teilnehmenden.
                                </p>
                                <p className="indent-4">
                                    Nach unserem Motto: „miteinander füreinander“ wollen wir uns gegenseitig unterstützen.
                                </p>
                                <p className="indent-4">
                                    In der Anfangsphase kann jeder und jede aus dem Großraum Wissen/Sieg teilnehmen. Danach werden wir Sie/euch bitten, den Verein durch Mitgliedschaft zu stärken.
                                </p>
                            </div>

                            <div className="grid md:grid-cols-2 gap-8 pt-8 border-t">
                                <div>
                                    <h3 className="font-bold text-lg text-green-700 mb-4">
                                        Was kann angeboten oder angefragt werden?
                                    </h3>
                                    <ul className="space-y-3">
                                        <li className="flex items-start"><FaCheckCircle className="text-green-500 mr-3 mt-1" /><span>Hilfe bei alltäglichen Aufgaben (z.B. Haus, Garten, Einkauf, Kinderbetreuung, Begleitung)</span></li>
                                        <li className="flex items-start"><FaCheckCircle className="text-green-500 mr-3 mt-1" /><span>Gemeinsame Freizeitgestaltung (z.B. Hobbys, Spaziergänge, Spiele, Kochen, Konzertbesuche)</span></li>
                                        <li className="flex items-start"><FaCheckCircle className="text-green-500 mr-3 mt-1" /><span>Weitergabe von gebrauchten Gegenständen oder Ernte aus dem Garten</span></li>
                                        <li className="flex items-start"><FaCheckCircle className="text-green-500 mr-3 mt-1" /><span>Mitfahrgelegenheiten</span></li>
                                        <li className="flex items-start"><FaCheckCircle className="text-green-500 mr-3 mt-1" /><span>Hinweise auf interessante Veranstaltungen</span></li>
                                        <li className="flex items-start"><FaCheckCircle className="text-green-500 mr-3 mt-1" /><span>Einladungen zu Gesprächsrunden oder Kaffeetrinken</span></li>
                                        <li className="flex items-start"><FaCheckCircle className="text-green-500 mr-3 mt-1" /><span>Unterstützung beim Deutschlernen, Nachhilfe, Hausaufgabenbetreuung</span></li>
                                    </ul>
                                </div>

                                <div>
                                    <h3 className="font-bold text-lg text-red-700 mb-4">
                                        Wir behalten uns vor, Beiträge zu entfernen. Unter anderem:
                                    </h3>
                                    <ul className="space-y-3">
                                        <li className="flex items-start"><FaTimesCircle className="text-red-500 mr-3 mt-1" /><span>Kommerzielle Werbung und private Verkaufsangebote</span></li>
                                        <li className="flex items-start"><FaTimesCircle className="text-red-500 mr-3 mt-1" /><span>Respektlose oder diskriminierende Inhalte</span></li>
                                        <li className="flex items-start"><FaTimesCircle className="text-red-500 mr-3 mt-1" /><span>Kettenbriefe oder unbestätigte Nachrichten</span></li>
                                        <li className="flex items-start"><FaTimesCircle className="text-red-500 mr-3 mt-1" /><span>Politische oder religiöse Aufrufe</span></li>
                                        <li className="flex items-start"><FaTimesCircle className="text-red-500 mr-3 mt-1" /><span>Verstoß gegen Datenschutz und Persönlichkeitsrechte</span></li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <br/><br/><br/><br/><br/>

                        {/* 4. BÖLÜM: KATILIM KARTLARI */}
                        <div className="text-center max-w-3xl mx-auto mb-12">
                            <h2 className="text-3xl font-bold text-gray-800">Treten Sie unserer Gemeinschaft bei!</h2>
                            <p className="mt-4 text-lg text-gray-600">Wählen Sie Ihre bevorzugte Plattform, um sich mit Ihren Nachbarn zu vernetzen.</p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-20">
                            {/* WhatsApp Kartı */}
                            <div className="bg-white p-8 rounded-2xl shadow-xl text-center flex flex-col items-center border-t-4 border-green-500">
                                <FaWhatsapp className="text-6xl text-green-500 mb-4" />
                                <h3 className="text-2xl font-bold text-gray-800">Per WhatsApp beitreten</h3>
                                <img src={whatsappQrCode} alt="WhatsApp QR Code" className="w-64 h-64 rounded-lg shadow-md my-4" />
                                <p className="text-sm text-gray-500">Scanne diesen QR-Code mit der Kamera in WhatsApp.</p>
                                <a href="https://chat.whatsapp.com/FqBNBrOmcnL7CTXPL9yRnm" target="_blank" rel="noopener noreferrer" className="mt-4 bg-green-500 text-white font-bold py-3 px-8 rounded-full hover:bg-green-600 transition-colors">
                                    Oder per Link beitreten
                                </a>
                            </div>

                            {/* Google Groups Kartı (YENİ TASARIM) */}
{/* Google Groups Kartı (DÜZELTİLMİŞ VE ALTERNATİFLİ VERSİYON) */}
{/* Google Groups Kartı (GÜNCELLENMİŞ VE ALTERNATİFLİ VERSİYON) */}
<div className="bg-white p-8 rounded-2xl shadow-xl text-center flex flex-col items-center border-t-4 border-rcBlue">
    <MdGroups className="text-6xl text-rcBlue mb-4" />
    <h3 className="text-2xl font-bold text-gray-800">Über Google Groups teilnehmen</h3>

    <div className="flex-grow flex flex-col justify-center items-center p-6 bg-rcLightBlue rounded-lg w-full mt-4">
        
        {/* YÖNTEM 1: WEB SİTESİ ÜZERİNDEN KATILIM (ÖNERİLEN - En Kolay Yol) */}
        <h4 className="text-xl font-bold text-gray-800 mb-3 border-b-2 border-rcBlue pb-2 w-full">
            1. Direkt über die Google Groups Webseite (Empfohlen)
        </h4>
        <p className="text-gray-700 mb-4">
            Dies ist der einfachste Weg: Klicken Sie auf den Button und auf der Google-Seite auf **"Grube Beitreten"**.
        </p>
        
        {/* WEB LİNKİ (En kolay ve güvenilir yöntem) */}
        <a 
            href="https://groups.google.com/g/nachbarschaftsborse" // Gruba özel linkinizi teyit ettik!
            target="_blank" 
            rel="noopener noreferrer" 
            className="mt-2 mb-6 bg-rcBlue text-white font-bold py-3 px-8 rounded-full hover:bg-opacity-80 transition-colors shadow-lg text-lg"
        >
            Zur Google Groups Seite
        </a>

        
        {/* YÖNTEM 2: E-POSTA İLE KATILIM (Alternatif) */}
        <h4 className="text-xl font-bold text-gray-800 mb-3 border-b-2 border-gray-400 pt-4 w-full">
            2. Alternativ: Per E-Mail beitreten
        </h4>
        <p className="text-gray-700 mb-4">
            Sie können mit jeder E-Mail-Adresse beitreten (auch ohne Google-Konto).
        </p>
        <ol className="text-left text-gray-600 list-decimal list-inside space-y-1 mb-4">
            <li>Klicken Sie auf den Button unten, um Ihre E-Mail-Anwendung zu öffnen.</li>
            <li>Senden Sie die **leere** E-Mail ab.</li>
            <li>**WICHTIG:** Bestätigen Sie die Mitgliedschaft in der **Bestätigungs-E-Mail**, die Sie von Google erhalten.</li>
        </ol>
        
        {/* MEVCUT E-POSTA LİNKİ */}
        <a 
            href={googleGroupsJoinLink} // Yukarıda tanımlanan mailto linki
            className="mt-2 bg-gray-500 text-white font-bold py-3 px-8 rounded-full hover:bg-gray-600 transition-colors"
        >
            E-Mail senden und beitreten
        </a>
    </div>

    {/* E-POSTA BUTONUNUN ÇALIŞMAMA DURUMU İÇİN AÇIKLAMA (Çok Önemli!) */}
    <p className="mt-6 text-sm text-red-600 italic">
        <FaExclamationTriangle className="inline mr-2" />
        **HINWEIS:** Falls der 'E-Mail senden'-Button auf Ihrem Gerät (z.B. im Browser) nicht funktioniert, 
        senden Sie bitte eine **leere** E-Mail **manuell** an die Adresse: 
        <span className="font-mono text-rcBlue font-semibold block mt-1">nachbarschaftsborse+subscribe@googlegroups.com</span>
    </p>
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
