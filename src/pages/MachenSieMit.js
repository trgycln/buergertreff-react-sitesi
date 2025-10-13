// src/pages/MachenSieMit.js
import React from "react";
import { Link } from "react-router-dom";

// Gerekli bileşenleri ve ikonları import edelim
import PageBanner from "../components/PageBanner";
import ActionCard from "../components/ActionCard";
import { FaIdCard, FaImage,  FaPaintRoller, FaChalkboardTeacher, FaBookReader, FaCoffee, FaMoneyBillWave, FaHandsHelping , FaClipboardList } from "react-icons/fa";
// Banner resmini import edelim
import mitBannerImage from "../assets/images/machen-sie-mit-banner.jpg";

const MachenSieMit = () => {
  return (
    <div>
      <PageBanner title="Machen Sie mit" imageUrl={mitBannerImage} />

      <main className="py-12 md:py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          {/* Giriş Metni */}
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-gray-800">
              Miteinander füreinander
            </h2>
            <p className="mt-4 text-gray-600">
              Der Bürgertreff Wissen lebt von seinen Mitgliedern. Und von
              Unterstützerinnen und Förderern. Machen Sie mit!
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-1 gap-8 max-w-4xl mx-auto">
            <ActionCard title="Werden Sie Mitglied." icon={<FaIdCard />}>
              <p>
                Mit 24 Euro Jahresbeitrag sind Sie dabei. Sie haben dann Stimmrecht und können über wichtige Dinge mitentscheiden. Natürlich können Sie Ihren Jahresbeitrag auch erhöhen, z.B. 50 Euro, 60… nach oben offen.
              </p>
              <p>
                Und so geht’s: Formular anklicken, entweder ausdrucken und ausfüllen oder digital an den Bürgertreff Wissen e.V. schicken. Beitrag überweisen
              </p>
              <p>
                Natürlich sind Sie auch willkommen, wenn Sie kein Mitglied sind.
              </p>
                            {/* Link/Buton, paragraftan SONRA ve kendi div'i içinde olmalı */}
              <div className="text-center mt-6">
                {" "}
                {/* Butona üstten boşluk verdik ve ortaladık */}
                <Link
                  to="/beitrittsformular"
                  className="bg-rcBlue text-white text-lg font-bold py-3 px-8 rounded-lg hover:bg-opacity-90 transition-transform hover:scale-105 inline-block"
                >
                  Jetzt Mitglied werden
                </Link>
              </div>
            </ActionCard>
<ActionCard 
  title="Machen Sie mit." 
  icon={<FaHandsHelping />}
>
  <p className="mb-4">
    Der Bürgertreff lebt von den Ideen und der Mitarbeit seiner Mitglieder und NutzerInnen. Alle engagieren sich ehrenamtlich.
  </p>
  <p className="mb-6">
    Sie wollen nette Leute kennen lernen, sich für andere einsetzen, an einem Gemeinschaftsprojekt teilnehmen? Das können Sie z.B. tun:
  </p>
  
  {/* GÜNCELLENDİ: Standart liste yerine ikonlu ve modern bir liste yapısı */}
  <div className="space-y-4 text-left">
    
    <div className="flex items-start">
      <FaCoffee className="text-rcBlue text-xl mt-1 mr-4 flex-shrink-0" />
      <span>
        ein- oder zweimal pro Woche für drei Stunden Gastgeber oder Gastgeberin sein, d.h. Besucher empfangen, für Kaffee/Tee sorgen;
      </span>
    </div>

    <div className="flex items-start">
      <FaChalkboardTeacher className="text-rcBlue text-xl mt-1 mr-4 flex-shrink-0" />
      <span>
        einen eigenen Workshop/Veranstaltung durchführen oder dabei mithelfen;
      </span>
    </div>

    <div className="flex items-start">
      <FaBookReader className="text-rcBlue text-xl mt-1 mr-4 flex-shrink-0" />
      <span>
        bei Hausaufgaben, beim Deutsch lernen, bei Alltagsproblemen helfen;
      </span>
    </div>

    <div className="flex items-start">
      <FaPaintRoller className="text-rcBlue text-xl mt-1 mr-4 flex-shrink-0" />
      <span>
        die Räume gestalten;
      </span>
    </div>

    <div className="flex items-start">
      <FaImage className="text-rcBlue text-xl mt-1 mr-4 flex-shrink-0" />
      <span>
        eine Ausstellung organisieren;
      </span>
    </div>

  </div>
  
  <p className="mt-6">
    oder oder oder… Ihre Ideen und Ihre Mithilfe sind willkommen.
  </p>
  
  <div className="mt-4 pt-4 border-t"></div>
</ActionCard>


            <ActionCard title="Unterstützen Sie uns finanziell." icon={<FaMoneyBillWave />}>
              <p>
Wir brauchen Geld für Miete und Nebenkosten, Kaffee, Büromaterial… Helfen Sie uns mit einer einmaligen oder fortlaufenden Spende. Als gemeinnütziger Verein stellen wir Ihnen ab 50 Euro eine Spendenquittung aus. Ab 100 Euro veröffentlichen wir Ihr Logo auf unserer Internet-Seite.
              </p>
              <div className="mt-4 pt-4 border-t"></div>
            </ActionCard>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MachenSieMit;
