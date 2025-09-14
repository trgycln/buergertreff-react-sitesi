// src/pages/WirUberUns.js
import React from 'react';

import PageBanner from '../components/PageBanner';
import ContentBlock from '../components/ContentBlock';
import teamPhoto from '../assets/images/team-photo.png';

import aboutBannerImage from '../assets/images/about-banner.png'; 
import introImage from '../assets/images/intro-image.JPG';  
import wirUberUns2 from '../assets/images/wirUberUns-2.jpg'
import wirUberUns3 from '../assets/images/wirUberUns-3.jpg'


const WirUberUns = () => {
    // Bu sayfadaki ContentBlock için farklı bir blob listesi tanımlıyoruz
     const wirUeberUnsBlobs = [
        {
            // Sol üstteki blob'u daha fazla içeri çektik
            className: 'w-[700px] h-[700px] top-0 left-0 transform -translate-x-1/4 -translate-y-1/4 opacity-40',
            color: '#27ae60' // rcAccentGreen
        },
        {
            // Sağ alttaki blob'u daha fazla içeri çektik
            className: 'w-[700px] h-[700px] bottom-0 right-0 transform translate-x-1/4 translate-y-1/4 opacity-40',
            color: '#f2994a' // rcAccentOrange
        }
    ];

    return (
        <div>
            <PageBanner 
                title="Wir über uns" 
                imageUrl={aboutBannerImage} 
            />

            {/* ContentBlock'a yeni blob listemizi iletiyoruz */}
            <ContentBlock 
                title="Der Bürgertreff Wissen – ein Ort für alle" 
                imageUrl={introImage}
                imageSide="left"
                blobs={wirUeberUnsBlobs}
            >
                <p className="text-justify indent-8">
                    Wir – der Verein „Bürgertreff Wissen“ – wollen einen niedrigschwelligen Ort ohne Konsumzwang schaffen, in dem sich Menschen aller Generationen, Herkunftsländer, Einkommen, Bildungsgrade, verschiedener Weltanschauungen begegnen können: Einsamkeit überwinden, Verständnis füreinander entwickeln, beitragen zu mehr Integration und Inklusion. Angesichts der zahlreichen Probleme und Bedrohungen nah und fern ist es wichtig, gute, resiliente Gemeinschaften aufzubauen
                </p>
              
            </ContentBlock>
             <ContentBlock 
                title="Miteinander reden statt übereinander – handeln statt lamentieren" 
                imageUrl={wirUberUns2}
                imageSide="right"
                blobs={wirUeberUnsBlobs}
            >
                <p className="text-justify indent-8">
Der Bürgertreff soll ein Ort im Zentrum der Verbandsgemeinde Wissen sein, an dem man sich zwanglos bei Kaffee oder Tee zu einem Schwätzchen treffen kann; wo Ideen entwickelt und Initiativen entstehen können. Ein Ort, an dem demokratische Teilhabe und Wirksamkeit ermöglicht werden. Miteinander statt übereinander reden; handeln statt lamentieren. Platz für: Kreativität, Kunst und Kultur, Sprach- und andere Kurse; eigene Initiativen; Vorträge und Beratung.                </p>
                 <p className="text-justify indent-8">
Der Bürgertreff soll andere Hilfs- und Beratungsangebote in der VG nicht ersetzen oder gar in Konkurrenz treten; vielmehr wird eine enge Zusammenarbeit angestrebt, so dass ein umfassendes Unterstützungsnetzwerk entsteht, das soziale Isolation verringert und langfristige Perspektiven schafft. Der niedrigschwellige Zugang soll den Bürgertreff zu einem wichtigen Anlaufpunkt für die Menschen vor Ort machen.
                </p>
            
            </ContentBlock>
               <ContentBlock 
                title="Jede lange Reise beginnt mit dem ersten Schritt." 
                imageUrl={wirUberUns3}
                imageSide="left"
                blobs={wirUeberUnsBlobs}
            >
                <p className="text-justify indent-8">
Da sich alle MitstreiterInnen ehrenamtlich einsetzen und an eine bezahlte Kraft vorerst nicht zu denken ist, soll der Bürgertreff zunächst zwei- bis dreimal in der Woche geöffnet werden und nach und nach ausgebaut werden – bis hin zu täglichen Öffnungszeiten. Schon jetzt haben viele Menschen ihre Bereitschaft erklärt, z.B. für drei Stunden pro Woche Gastgeber zu sein und Kaffee auszuschenken. Eine strikte (Rollen-)Trennung zwischen Kümmerern und Betreuten soll vermieden werden; vielmehr werden BesucherInnen eingeladen und ermutigt, im Rahmen ihrer Möglichkeiten Aufgaben zu übernehmen und „ihren“ Treff räumlich und inhaltlich mitzugestalten.
 </p>
                
            
            </ContentBlock>
                  <ContentBlock 
                title="Die nächsten Schritte (August 2025): Raumsuche, Finanzierung " 
                imageUrl={introImage}
                imageSide="right"
                blobs={wirUeberUnsBlobs}
            >
                <p className="text-justify indent-8">
Angesichts knapper Kassen sehen sich Verbandsgemeinde, Caritas, Diakonie und andere soziale Einrichtungen nicht in der Lage, die Trägerschaft für den Bürgertreff zu übernehmen. Daher haben sich engagierte Bürgerinnen und Bürger in einem gemeinnützigen Verein zusammengeschlossen, um den Bürgertreff ins Leben zu rufen. Zurzeit haben wir 20 Mitglieder. Im Laufe der nächsten Monate wird die Zahl steigen.
 </p>
             <p className="text-justify indent-8">
Mehrere geeignete barrierefreie Räume in der Wissener Innenstadt sind in der Diskussion. Einer davon ist in die engere Auswahl genommen: zentral im autofreien Viertel, barrierefreier Zugang möglich; 120 qm, unten großer Raum mit Theke und Küche; oben Galerie mit Büro; ebenerdiges WC. 
 </p>           
                <p className="text-justify indent-8">
Damit wir starten können, benötigen wir eine Anschubfinanzierung, d.h. Mietübernahme für die ersten zwei Jahre. Wir warten auf die Genehmigung unseres Antrages Anfang 2026.
 </p> 
            <p className="text-justify indent-8">
Solange wir keinen festen Raum haben, treffen wir uns privat, bei schönem Wetter im Park oder bei Ausflügen in die nähere und mittlere Umgebung (s. Bürgertreff unterwegs.)
 </p>       
            </ContentBlock>

            <section className="bg-white py-12 md:py-20">
                <div className="container mx-auto px-6 text-center">
                    <h2 className="text-3xl font-bold text-gray-800 mb-8">Unser Vorstand</h2>
                    
                    <div className="max-w-4xl mx-auto">
                        <img 
                            src={teamPhoto} 
                            alt="Das Team des Bürgertreffs" 
                            className="rounded-lg shadow-xl w-full h-auto"
                        />
                    </div>

                    <div className="max-w-3xl mx-auto mt-6">
                        <p className="text-gray-600">
                            Unten: Erika Uber (1. Vorsitzende), Jürgen Klose (2. Vorsitzende), Turgay Celen (2. Reihe links, Kassierer), Mechthild Euteneuer und Thomas Löb (Beisitzer)
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default WirUberUns;