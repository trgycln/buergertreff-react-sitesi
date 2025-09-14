// src/pages/Ideenbörse.js
import React, { useEffect, useRef } from 'react'; // React, useEffect ve useRef tek satırda import edildi
import PageBanner from '../components/PageBanner';
import ContentBlock from '../components/ContentBlock';
import IdeaForm from '../components/IdeaForm';

// --- TÜM RESİMLER ---
import ideenboerseBanner from '../assets/images/ideenboerse-banner.png';
import offeneStubeImage from '../assets/images/idea-offene-stube.jpg';
import fruhstuckImage from '../assets/images/idea-fruhstuck.jpg';
import sprachtreffImage from '../assets/images/idea-sprachtreff.jpg';
import ausstellungenImage from '../assets/images/idea-ausstellungen.jpg';
import spielenImage from '../assets/images/idea-spielen.jpg';
import singenImage from '../assets/images/idea-singen.jpg';
// YENİ EKLENEN RESİM İMPORTLARI
import handarbeitenImage from '../assets/images/idea-handarbeiten.jpg';
import schreibenImage from '../assets/images/idea-schreiben.jpg';
import nachbarschaftImage from '../assets/images/idea-nachbarschaft.jpg';
import gespraechImage from '../assets/images/idea-gespraech.jpg';
import beratungImage from '../assets/images/idea-beratung.jpg';
import nachhilfeImage from '../assets/images/idea-nachhilfe.jpg';
import unterwegsImage from '../assets/images/idea-unterwegs.jpg';

const Ideenboerse = () => {
    const formRef = useRef(null); 
    // PDF'teki tüm fikirleri içeren tam liste
    const ideas = [
        {
            title: "Offene Stube",
            text: "2-3 Stunden vormittags oder nachmittags, ohne Programm, zum Klönen, Nichtstun, Kaffeetrinken. 2 Gastgeberinnen sorgen für Kaffee und Tee.",
            image: offeneStubeImage,
            imageSide: "right"
        },
        {
            title: "Frühstück",
            text: "Einmal im Monat gemeinsam frühstöcken, international.",
            image: fruhstuckImage,
            imageSide: "left"
        },
        {
            title: "Sprachtreff",
            text: "Treffen von Deutschen und Migranten, möglichst 1:1, Ziel: Kennenlernen anderer Menschen und Kulturen; Anwenden und Verbessern der deutschen Alltagssprache, 1-2mal im Monat.",
            image: sprachtreffImage,
            imageSide: "right"
        },
        {
            title: "Ausstellungen",
            text: "z.B. Bilder/Fotos aus verschiedenen Ländern; wechselnde Bilderausstellungen ansässiger Künstlerinnen.",
            image: ausstellungenImage,
            imageSide: "left"
        },
        {
            title: "Spielen",
            text: "Brett- und Kartenspiele; Schach mit Anleitung.",
            image: spielenImage,
            imageSide: "right"
        },
        {
            title: "Singen",
            text: "Internationale Lieder singen, ohne groß zu üben, einfach so.",
            image: singenImage,
            imageSide: "left"
        },
        {
            title: "Handarbeiten",
            text: "Schmuck herstellen, stricken.",
            image: handarbeitenImage,
            imageSide: "right"
        },
        {
            title: "Schreibwerkstatt",
            text: "Kreatives Schreiben über Themen, die uns beschäftigen.",
            image: schreibenImage,
            imageSide: "left"
        },
        {
            title: "Nachbarschaftsbörse",
            text: "Einrichten einer (WhatsApp-/Email-) Gruppe für alle, die Hilfe suchen oder anbieten, die Begleitung für Konzerte, Theater, Wanderungen etc. suchen, die etwas brauchen, die etwas zu verschenken haben...",
            image: nachbarschaftImage,
            imageSide: "right"
        },
        {
            title: "Sonntagsgespräch",
            text: "1 x monatlich in ruhiger Atmosphäre über ein Thema sprechen, das uns bewegt (mit Moderation).",
            image: gespraechImage,
            imageSide: "left"
        },
        {
            title: "Beratung",
            text: "Handy/PC-Beratung; bei Bürokratie u.a.; in verschiedenen Lebenslagen.",
            image: beratungImage,
            imageSide: "right"
        },
        {
            title: "Nachhilfe",
            text: "in verschiedenen Schulfächern; Deutsch als Fremdsprache; lesen und schreiben lernen (Alphabetisierung).",
            image: nachhilfeImage,
            imageSide: "left"
        },
        {
            title: "Bürgertreff unterwegs",
            text: "Wir erkunden den Westerwald und Umgebung: z.B. 2-Strom-Land in Heimborn; Kloster Marienstatt; Landschaftsmuseum Hachenburg; Raiffeisenmuseum Hamm; Westerwälder Seenplatte; Wildpark/Kletterpark/Basaltpark.",
            image: unterwegsImage,
            imageSide: "right"
        }
    ];

    const blobConfig1 = [ { className: 'w-[800px] h-[800px] top-0 left-0 transform -translate-x-1/2 -translate-y-1/3 opacity-50', color: '#eef4ff' }];
    const blobConfig2 = [ { className: 'w-[800px] h-[800px] bottom-0 right-0 transform translate-x-1/2 translate-y-1/3 opacity-50', color: '#f2c94c' }];

    useEffect(() => {
        if (window.location.hash === '#ideen-form' && formRef.current) {
            formRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, []);

    return (
        <div>
            <PageBanner 
                title="Ideenbörse"
                imageUrl={ideenboerseBanner}
            />
            <div className="text-center py-12 bg-white">
                <div className="container mx-auto px-6">
                    <h2 className="text-3xl font-bold text-gray-800">Ideen für den Bürgertreff Wissen</h2>
                    <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
                        Hier ist eine Sammlung von Ideen und Vorschlägen, die als Inspiration für neue Aktivitäten und Gruppen in unserem Bürgertreff dienen können.
                    </p>
                </div>
            </div>
            {ideas.map((idea, index) => (
                <ContentBlock 
                    key={index}
                    title={idea.title}
                    imageUrl={idea.image}
                    imageSide={idea.imageSide}
                    bgColor={index % 2 === 0 ? 'bg-white' : 'bg-rcGray'}
                    blobs={index % 2 === 0 ? blobConfig1 : blobConfig2}
                    imageClassName="w-1/2"
                >
                    <p className="text-justify">{idea.text}</p>
                </ContentBlock>
            ))}
            <section id="ideen-form" ref={formRef} className="py-12 md:py-20 bg-rcGray">
                <div className="container mx-auto px-6">
                    <h2 className="text-3xl font-bold text-center text-rcBlue mb-8">
                        Und deine/Ihre Ideen?
                    </h2>
                    <IdeaForm formspreeUrl="https://formspree.io/f/xovnbbkj" />
                </div>
            </section>
        </div>
    );
};

export default Ideenboerse;