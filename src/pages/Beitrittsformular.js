// src/pages/Beitrittsformular.js
import React from 'react';
import { FaUser, FaEnvelope, FaPhone, FaHeart, FaEuroSign, FaFilePdf } from 'react-icons/fa';

const Beitrittsformular = () => {
    const emailSubject = "Neue Beitrittserklärung (von der Webseite)";

    return (
        <div className="bg-rcGray py-12 md:py-20">
            <div className="container mx-auto px-6 max-w-3xl">
                <div className="bg-white p-8 rounded-2xl shadow-2xl">
                    
                    <div className="text-center mb-10">
                        <FaHeart className="text-rcRed text-5xl mx-auto mb-4" />
                        <h1 className="text-4xl font-extrabold text-rcBlue">Werden Sie Teil unserer Gemeinschaft!</h1>
                        <p className="text-gray-600 mt-2">Wir freuen uns, Sie bald als Mitglied im Bürgertreff Wissen e.V. begrüßen zu dürfen.</p>
                    </div>

                    <form action="https://formspree.io/f/xovnbbkj" method="POST" className="space-y-8">
                        <input type="hidden" name="_subject" value={emailSubject} />

                        {/* Adım 1: Kişisel Bilgiler */}
                        <div>
                            <h2 className="text-2xl font-bold text-gray-700 border-b-2 border-rcLightBlue pb-2 mb-4">Schritt 1: Ihre Kontaktdaten</h2>
                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <label htmlFor="name" className="flex items-center text-gray-700 font-semibold"><FaUser className="mr-2 text-rcRed" /> Vorname & Name</label>
                                    <input type="text" name="Name" id="name" required className="mt-1 block w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-rcRed focus:border-rcRed" />
                                </div>
                                <div>
                                    <label htmlFor="anschrift" className="text-gray-700 font-semibold">Anschrift (Straße, Hausnr., Ort)</label>
                                    <input type="text" name="Anschrift" id="anschrift" required className="mt-1 block w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-rcRed focus:border-rcRed" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="email" className="flex items-center text-gray-700 font-semibold"><FaEnvelope className="mr-2 text-rcRed" /> E-Mail</label>
                                        <input type="email" name="Email" id="email" className="mt-1 block w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-rcRed focus:border-rcRed" />
                                    </div>
                                    <div>
                                        <label htmlFor="handy" className="flex items-center text-gray-700 font-semibold"><FaPhone className="mr-2 text-rcRed" /> Handy</label>
                                        <input type="tel" name="Handy" id="handy" className="mt-1 block w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-rcRed focus:border-rcRed" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Adım 2: Üyelik Ücreti */}
                        <div>
                            <h2 className="text-2xl font-bold text-gray-700 border-b-2 border-rcLightBlue pb-2 mb-4">Schritt 2: Ihr Beitrag</h2>
                            <p className="text-sm text-gray-500 mb-4">Ihr Jahresbeitrag sichert unsere Arbeit und ermöglicht neue Projekte. Vielen Dank für Ihre Unterstützung!</p>
                            <div className="space-y-4">
                                <label className="flex items-center p-4 border rounded-lg hover:bg-rcLightBlue cursor-pointer">
                                    <input type="radio" name="Beitrag" value="24 Euro (Mindestbeitrag)" className="h-5 w-5 text-rcRed focus:ring-rcRed" defaultChecked />
                                    <span className="ml-4 text-gray-700">Ich bezahle den Mindest-Jahresbeitrag in Höhe von <strong>24,00 Euro</strong></span>
                                </label>
                                <label className="flex items-center p-4 border rounded-lg hover:bg-rcLightBlue cursor-pointer">
                                    <input type="radio" name="Beitrag" value="50 Euro (Erhöhter Beitrag)" className="h-5 w-5 text-rcRed focus:ring-rcRed" />
                                    <span className="ml-4 text-gray-700">Ich unterstütze den Verein mit einem erhöhten Jahresbeitrag in Höhe von <strong>50,00 Euro</strong></span>
                                </label>
                                <label className="flex items-center p-4 border rounded-lg hover:bg-rcLightBlue cursor-pointer">
                                    <input type="radio" name="Beitrag" value="Individueller Beitrag" className="h-5 w-5 text-rcRed focus:ring-rcRed" />
                                    <span className="ml-4 flex items-center text-gray-700">
                                        Ich wähle einen individuellen Betrag: 
                                        <input type="number" name="Individueller Betrag" placeholder="z.B. 100" className="ml-2 w-24 px-2 py-1 border-gray-300 rounded-md focus:ring-rcRed focus:border-rcRed" /> 
                                        <FaEuroSign className="ml-1 text-gray-500"/>
                                    </span>
                                </label>
                            </div>
                            <p className="text-xs text-gray-500 mt-4">Der Beitrag kann bar bezahlt oder überwiesen werden: Sparkasse Westerwald-Sieg, DE27 5735 1030 0055 0844 38</p>
                        </div>
                        
                        <button type="submit" className="w-full bg-rcRed text-white font-bold text-xl py-4 px-6 rounded-lg hover:bg-opacity-80 transition-transform hover:scale-105">
                            Mitglied werden!
                        </button>
                    </form>

                    {/* PDF İNDİRME BÖLÜMÜ */}
                    <div className="mt-10 pt-8 border-t-2 border-dashed border-gray-200 text-center">
                        <FaFilePdf className="text-rcBlue text-4xl mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-700">Oder Formular herunterladen</h3>
                        <p className="text-gray-600 mt-2 max-w-lg mx-auto">
                            Sie können die Beitrittserklärung auch als PDF-Datei herunterladen, ausdrucken und uns zukommen lassen.
                        </p>
                        <a 
                            href="/beitrittsformular.pdf"
                            download
                            className="mt-4 bg-gray-600 text-white font-bold py-2 px-6 rounded-md hover:bg-gray-700 transition-colors inline-block"
                        >
                            PDF-Formular herunterladen
                        </a>
                    </div>
                    
                </div>
            </div>
        </div>
    );
};

export default Beitrittsformular;