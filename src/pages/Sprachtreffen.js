// src/pages/Sprachtreffen.js
import React from 'react';
import ContentBlock from '../components/ContentBlock';
import PageBanner from '../components/PageBanner'; // PageBanner'ı import ediyoruz
import sprachtreffenImage from '../assets/images/sprachtreffen-image.jpg';
import sprachtreffenBanner from '../assets/images/sprachtreffen-banner.jpg'; // Yeni banner resmini import ediyoruz
import { FaCheckCircle, FaUser } from 'react-icons/fa';

const Sprachtreffen = () => {
    return (
        <div>
            
            {/* --- DEĞİŞEN BÖLÜM --- */}
            {/* Gri başlık alanı yerine PageBanner bileşenini kullanıyoruz */}
            <PageBanner 
                title="Sprachtreffen"
                imageUrl={sprachtreffenBanner}
            />
            {/* --- DEĞİŞEN BÖLÜM SONU --- */}

            {/* ContentBlock (Aynı kalıyor) */}
            <ContentBlock 
                title="Was ist das Sprachtreffen?"
                imageUrl={sprachtreffenImage}
                imageSide="right"
            >
                <p>
                    Unser Sprachtreffen ist ein offener und ungezwungener Treffpunkt für alle, die ihre Deutschkenntnisse verbessern möchten. Egal, ob Sie Anfänger sind oder bereits fortgeschrittene Kenntnisse haben, hier können Sie in entspannter Atmosphäre sprechen, neue Wörter lernen und Kontakte knüpfen.
                </p>
                <p>
                    Wir unterhalten uns über alltägliche Themen, spielen Sprachspiele und unterstützen uns gegenseitig. Die Teilnahme ist kostenlos und eine Anmeldung ist nicht erforderlich.
                </p>
            </ContentBlock>

            {/* "Für wen ist das?" Bölümü (Aynı kalıyor) */}
            <section className="bg-white py-12 md:py-16">
                <div className="container mx-auto px-6 max-w-4xl">
                    <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">Für wen ist das Sprachtreffen?</h2>
                    <ul className="space-y-4">
                        <li className="flex items-start">
                            <FaCheckCircle className="text-green-500 mr-3 mt-1 flex-shrink-0" />
                            <span className="text-gray-700">Für alle, die neu in Deutschland sind und ihre Sprachkenntnisse im Alltag anwenden möchten.</span>
                        </li>
                        <li className="flex items-start">
                            <FaCheckCircle className="text-green-500 mr-3 mt-1 flex-shrink-0" />
                            <span className="text-gray-700">Für Menschen, die bereits einen Sprachkurs besuchen und zusätzlich üben wollen.</span>
                        </li>
                        <li className="flex items-start">
                            <FaCheckCircle className="text-green-500 mr-3 mt-1 flex-shrink-0" />
                            <span className="text-gray-700">Für Einheimische, die gerne neue Kulturen kennenlernen und als Gesprächspartner helfen möchten.</span>
                        </li>
                    </ul>
                </div>
            </section>

            {/* Detaylar Bölümü (Aynı kalıyor) */}
            <div className="bg-gray-50 py-12">
                <div className="container mx-auto px-6 max-w-4xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-center">
                        <div className="bg-red-50 p-6 rounded-lg">
                            <h3 className="text-2xl font-bold text-red-700 mb-2">Wann?</h3>
                            <p className="text-gray-700 text-lg">{/* Jeden Dienstag, 17:00 - 18:30 Uhr*/}Die Sprachtreffen starten in Kürze</p>
                        </div>
                        <div className="bg-blue-50 p-6 rounded-lg">
                            <h3 className="text-2xl font-bold text-blue-700 mb-2">Wo?</h3>
                            <p className="text-gray-700 text-lg">{/* Im großen Saal des Bürgertreffs, Musterstraße 1, 12345 Wissen*/}Planung läuft! Wir arbeiten mit Hochdruck daran, die ersten Sprachtreffen zu organisieren. Schauen Sie bald wieder vorbei.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* İlgili Kişi Bölümü (Aynı kalıyor) */}
            <section className="bg-white py-12 md:py-16">
                <div className="container mx-auto px-6 max-w-2xl text-center">
                    <FaUser className="text-gray-400 text-4xl mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-gray-800">Ansprechpartnerin</h3>
                    <p className="mt-2 text-lg text-gray-600">
                        Erika Uber
                    </p>
                    <p className="mt-1 text-gray-600">
                        Haben Sie Fragen? Sie erreichen Frau Uber per E-Mail: <a href="mailto:Erika.uber@t-online.de" className="text-red-600 hover:underline">Erika.uber@t-online.de</a>
                    </p>
                </div>
            </section>
        </div>
    );
};

export default Sprachtreffen;