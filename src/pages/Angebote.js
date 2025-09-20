// src/pages/Angebote.js
import React from "react";
import { Link } from "react-router-dom";
import PageBanner from "../components/PageBanner";
import ImageCarousel from "../components/ImageCarousel";
import VideoPlayer from "../components/VideoPlayer";

// Resim importları
import angeboteBannerImage from "../assets/images/angebote-banner.jpg";
import dreifelderSee1 from "../assets/images/unterwegs-dreifelder-see-1.jpg";
import dreifelderSee2 from "../assets/images/unterwegs-dreifelder-see-2.jpg";
import dreifelderSee3 from "../assets/images/unterwegs-dreifelder-see-3.JPG";
import hachenburg1 from "../assets/images/unterwegs-hachenburg-1.jpg";
import hachenburg2 from "../assets/images/unterwegs-hachenburg-2.jpg";
import hachenburg3 from "../assets/images/unterwegs-hachenburg-3.jpg";
import hachenburg4 from "../assets/images/unterwegs-hachenburg-4.jpg";
import koeln1 from "../assets/images/unterwegs-koeln-1.jpg";
import koeln2 from "../assets/images/unterwegs-koeln-2.jpg";
import koeln3 from "../assets/images/unterwegs-koeln-3.jpg";
import koeln4 from "../assets/images/unterwegs-koeln-4.jpg";
import koeln5 from "../assets/images/unterwegs-koeln-5.jpg";
import wuppertal1 from "../assets/images/wuppertal1.jpeg";
import wuppertal2 from "../assets/images/wuppertal2.jpeg";
import wuppertal3 from "../assets/images/wuppertal3.jpeg";
import wuppertalVideoThumb from '../assets/images/wuppertal-video-thumb.png';

const Angebote = () => {
  const dreifelderSeePhotos = [dreifelderSee1, dreifelderSee2, dreifelderSee3];
  const hachenburgPhotos = [hachenburg1, hachenburg2, hachenburg3, hachenburg4];
  const koelnPhotos = [koeln1, koeln2, koeln3, koeln4, koeln5];
  const wuppertalPhotos = [wuppertal1, wuppertal2, wuppertal3];

  return (
    <div>
      <PageBanner
        title="Angebote & Veranstaltungen"
        imageUrl={angeboteBannerImage}
      />

      <main className="py-12 md:py-20 bg-white">
        {/* GÜNCELLENDİ: İçerik, okunabilirliği artırmak için bir 'prose' konteynerine sarıldı */}
        <div className="container mx-auto px-6 max-w-4xl prose lg:prose-lg">
          
          <p>
            Noch ist der Bürgertreff Wissen im Aufbau. Sobald wir geeignete
            Räume bezogen haben und die Miete gesichert ist, starten wir mit
            Angeboten und Veranstaltungen.
          </p>
          <p>Bis dahin gibt es:</p>

          {/* 2. BÖLÜM: BÜRGERTREFF UNTERWEGS */}
          <div>
            <h2>Bürgertreff Wissen unterwegs:</h2>
            <p>
              In diesem Sommer haben wir einige Ausflüge unternommen und den
              Westerwald und u.a. Köln erkundet:
            </p>
            {/* Carousel ve Video bölümleri için 'not-prose' kullanarak stil sıfırlaması yapıldı */}
            <div className="not-prose space-y-12 my-10">
              <div>
                <h3 className="text-2xl font-semibold text-gray-700 mb-4 text-center">
                  Z.B. Dreifelder See
                </h3>
                <ImageCarousel images={dreifelderSeePhotos} />
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-gray-700 mb-4 text-center">
                  Z.B. Landschaftsmuseum Hachenburg
                </h3>
                <ImageCarousel images={hachenburgPhotos} />
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-gray-700 mb-4 text-center">
                  Z.B. Exkursion nach Köln zu den romanischen Kirchen
                </h3>
                <ImageCarousel images={koelnPhotos} />
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-gray-700 mb-4 text-center">
                  Ein Tag in Wuppertal: Schwebebahn & Zoo
                </h3>
                <ImageCarousel images={wuppertalPhotos} />
                <div className="mt-8">
                  <VideoPlayer
                    videoId="jby_soho76c"
                    thumbnailSrc={wuppertalVideoThumb}
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* 3. BÖLÜM: IN PLANUNG SIND */}
          <div>
            <h2>In Planung sind:</h2>
            <h3>Sprachtreff Wissen:</h3>
            <p>
              Wir möchten Migranten und deutsche Muttersprachler ins
              Gespräch bringen. Zweimal im Monat werden wir einen
              Sprachtreff veranstalten, damit sich Einheimische und
              Zugereiste besser kennen lernen und die Migranten ihre
              Deutschkenntnisse anwenden können.
            </p>
            <h3>Nachbarschaftsbörse:</h3>
            <p>
              Brauchen Sie Hilfe in Haus und Garten? Begleitung zum Arzt?
              Haben Sie etwas Gutes zu verschenken, z.B. Obst aus Ihrem
              Garten oder attraktive Haushaltsgeräte? Möchten Sie etwas
              anbieten, z.B. Hilfe in Haus und Garten? Oder beim
              Deutschlernen oder Nachhilfe? Suchen Sie Begleitung für eine
              interessante Veranstaltung? Wir bringen Sie mit unserer
              Nachbarschaftsbörse Wissen zusammen. Demnächst mehr.
            </p>
          </div>

          {/* 4. BÖLÜM: IDEENBÖRSE LİNKİ */}
          <div className="text-center text-lg space-y-2 !mt-16">
            <p>
              <Link to="/ideenboerse" className="text-rcRed font-semibold hover:underline">
                Hier unsere ersten Ideen?
              </Link>
            </p>
            <p>
              Vielleicht haben Sie auch Vorschläge?
              <Link to="/ideenboerse#ideen-form" className="text-rcRed font-semibold hover:underline ml-1">
                Her damit!
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Angebote;