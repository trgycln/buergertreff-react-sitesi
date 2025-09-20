// src/pages/MachenSieMit.js
import React from "react";
import { Link } from "react-router-dom";

// Gerekli bileşenleri ve ikonları import edelim
import PageBanner from "../components/PageBanner";
import ActionCard from "../components/ActionCard";
import { FaIdCard, FaMoneyBillWave, FaClipboardList } from "react-icons/fa";

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
                Mit 24 Euro Jahresbeitrag sind Sie dabei. Sie haben dann
                Stimmrecht und können über wichtige Entscheidungen
                mitbeschließen. Natürlich können Sie Ihren Jahresbeitrag auch
                erhöhen, z.B. 50 Euro, 60… nach oben offen.
              </p>
              <p>
                Kontaktieren Sie uns für mehr Informationen zu aktuellen
                Möglichkeiten.
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

            <ActionCard title="Spenden" icon={<FaMoneyBillWave />}>
              <p>
                Mit Ihrer finanziellen Unterstützung sichern Sie den Fortbestand
                unserer Angebote. Ihre Spende hilft uns, Materialien zu
                beschaffen, Mieten zu decken und besondere Projekte für die
                Gemeinschaft zu realisieren.
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
