import React, { useState } from 'react';
import { 
  FaFileAlt, FaBook, FaReceipt, FaHeart, FaUsers, 
  FaGift, FaBuilding, FaPiggyBank, FaMoneyBillWave,
  FaGavel, FaChevronRight 
} from 'react-icons/fa';

// Import alt komponenty (bunları sonra oluşturacağız)
import EURRecords from '../../components/admin/documents/EURRecords';
import CashJournal from '../../components/admin/documents/CashJournal';
import Vouchers from '../../components/admin/documents/Vouchers';
import DonationConfirmations from '../../components/admin/documents/DonationConfirmations';
import DonationRegistry from '../../components/admin/documents/DonationRegistry';
import NonCashDonations from '../../components/admin/documents/NonCashDonations';
import MemberTracking from '../../components/admin/documents/MemberTracking';
import TaxExemptions from '../../components/admin/documents/TaxExemptions';
import Reserves from '../../components/admin/documents/Reserves';
import Payroll from '../../components/admin/documents/Payroll';
import Decisions from '../../components/admin/documents/Decisions';

export default function BuchhaltungDocuments() {
  const [activeDocument, setActiveDocument] = useState(null);

  // Automatisch aus Transaktionen erstellte Belege (Oberer Bereich)
  const transactionBasedDocuments = [
    {
      id: 'eur',
      label: 'EÜR',
      title: 'Einnahmen-Überschuss-Rechnung',
      subtitle: 'Jahresübersicht',
      icon: FaFileAlt,
      color: 'blue',
      description: 'Jährliche Übersichten von Einnahmen und Ausgaben (automatisch)'
    },
    {
      id: 'cash_journal',
      label: 'Kassenbuch',
      title: 'Kassenführung',
      subtitle: 'Tägliche Kassenführung',
      icon: FaBook,
      color: 'green',
      description: 'Tägliche Bargeldvorgänge (automatisch)'
    },
    {
      id: 'vouchers',
      label: 'Belege',
      title: 'Buchungsbelege',
      subtitle: 'Originalrechnungen und Belege',
      icon: FaReceipt,
      color: 'purple',
      description: 'Rechnungen, Quittungen, Bankauszüge (automatische Liste + hochgeladene Belege)'
    },
    {
      id: 'donations',
      label: 'Spendenbescheinigung',
      title: 'Zuwendungsbescheinigungen',
      subtitle: 'Spendenquittungen',
      icon: FaHeart,
      color: 'red',
      description: 'Spendenquittungen (automatische Liste + Belege + Druck)'
    },
    {
      id: 'donation_registry',
      label: 'Spendenübersicht',
      title: 'Spendenverwaltungsblatt',
      subtitle: 'Spendenstatistik',
      icon: FaBook,
      color: 'pink',
      description: 'Übersicht aller Spenden (jährliche Summe, automatisch)'
    },
    {
      id: 'members',
      label: 'Mitglieder',
      title: 'Mitgliederliste',
      subtitle: 'Mitglieder und Beitragszahlungen',
      icon: FaUsers,
      color: 'cyan',
      description: 'Mitgliederliste (automatisch aus Kontakte)'
    }
  ];

  // Weitere Geschäftsunterlagen (Unterer Bereich)
  const otherDocuments = [
    {
      id: 'noncash_donations',
      label: 'Sachspenden',
      title: 'Sachspende-Belege',
      subtitle: 'Sachspendenbewertung',
      icon: FaGift,
      color: 'amber',
      description: 'Bewertung von Sachspenden'
    },
    {
      id: 'tax_exemptions',
      label: 'Freistellung',
      title: 'Freistellungsbescheid',
      subtitle: 'Steuervergünstigungsbescheid',
      icon: FaBuilding,
      color: 'indigo',
      description: 'Steuervergünstigungsbescheide'
    },
    {
      id: 'reserves',
      label: 'Rücklagen',
      title: 'Rücklagen und Reserven',
      subtitle: 'Reservenfonds',
      icon: FaPiggyBank,
      color: 'teal',
      description: 'Rücklagen und Reserven'
    },
    {
      id: 'payroll',
      label: 'Lohnkonten',
      title: 'Lohnkonten',
      subtitle: 'Gehälter und Honorare',
      icon: FaMoneyBillWave,
      color: 'grass',
      description: 'Löhne für Mitarbeiter und Trainer'
    },
    {
      id: 'decisions',
      label: 'Beschlüsse',
      title: 'Entscheidungsprotokolle',
      subtitle: 'Geschäftsbeschlüsse',
      icon: FaGavel,
      color: 'slate',
      description: 'Finanzielle Beschlüsse und Sitzungsprotokolle'
    }
  ];

  const allDocuments = [...transactionBasedDocuments, ...otherDocuments];

  const getColorClasses = (color) => {
    const colorMap = {
      blue: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-600', label: 'bg-blue-100 text-blue-800' },
      green: { bg: 'bg-green-50', border: 'border-green-200', icon: 'text-green-600', label: 'bg-green-100 text-green-800' },
      purple: { bg: 'bg-purple-50', border: 'border-purple-200', icon: 'text-purple-600', label: 'bg-purple-100 text-purple-800' },
      red: { bg: 'bg-red-50', border: 'border-red-200', icon: 'text-red-600', label: 'bg-red-100 text-red-800' },
      pink: { bg: 'bg-pink-50', border: 'border-pink-200', icon: 'text-pink-600', label: 'bg-pink-100 text-pink-800' },
      amber: { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'text-amber-600', label: 'bg-amber-100 text-amber-800' },
      cyan: { bg: 'bg-cyan-50', border: 'border-cyan-200', icon: 'text-cyan-600', label: 'bg-cyan-100 text-cyan-800' },
      indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', icon: 'text-indigo-600', label: 'bg-indigo-100 text-indigo-800' },
      teal: { bg: 'bg-teal-50', border: 'border-teal-200', icon: 'text-teal-600', label: 'bg-teal-100 text-teal-800' },
      grass: { bg: 'bg-lime-50', border: 'border-lime-200', icon: 'text-lime-600', label: 'bg-lime-100 text-lime-800' },
      slate: { bg: 'bg-slate-50', border: 'border-slate-200', icon: 'text-slate-600', label: 'bg-slate-100 text-slate-800' }
    };
    return colorMap[color] || colorMap.blue;
  };

  if (activeDocument) {
    const docConfig = allDocuments.find(d => d.id === activeDocument);
    
    return (
      <div>
        <button
          onClick={() => setActiveDocument(null)}
          className="mb-4 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors flex items-center gap-2"
        >
          ← Zurück zu den Dokumenten
        </button>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6 border-l-4 border-gray-400">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-lg text-3xl ${getColorClasses(docConfig.color).label}`}>
              <docConfig.icon />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{docConfig.title}</h2>
              <p className="text-gray-600">{docConfig.subtitle}</p>
            </div>
          </div>
        </div>

        {/* Dinamik olarak doğru bileşeni render et */}
        <div className="bg-white rounded-lg shadow p-6">
          {activeDocument === 'eur' && <EURRecords />}
          {activeDocument === 'cash_journal' && <CashJournal />}
          {activeDocument === 'vouchers' && <Vouchers />}
          {activeDocument === 'donations' && <DonationConfirmations />}
          {activeDocument === 'donation_registry' && <DonationRegistry />}
          {activeDocument === 'noncash_donations' && <NonCashDonations />}
          {activeDocument === 'members' && <MemberTracking />}
          {activeDocument === 'tax_exemptions' && <TaxExemptions />}
          {activeDocument === 'reserves' && <Reserves />}
          {activeDocument === 'payroll' && <Payroll />}
          {activeDocument === 'decisions' && <Decisions />}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-2">Offizielle Buchhaltungsunterlagen</h2>
        <p className="text-blue-100">
          Zentrales Erfassungs- und Verwaltungssystem für alle erforderlichen Buchhaltungsunterlagen des Vereins.
        </p>
      </div>

      {/* Geschäftsunterlagen aus Transaktionen */}
      <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-green-300">
        <div className="flex items-center gap-3 mb-4 pb-3 border-b-2 border-green-200">
          <FaFileAlt className="text-2xl text-green-600" />
          <div>
            <h3 className="text-xl font-bold text-gray-800">Geschäftsunterlagen aus Transaktionen</h3>
            <p className="text-sm text-gray-600">Automatisch aus Transaktionsdaten erstellte Belege</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {transactionBasedDocuments.map((doc) => {
            const colors = getColorClasses(doc.color);
            const IconComponent = doc.icon;
            
            return (
              <button
                key={doc.id}
                onClick={() => setActiveDocument(doc.id)}
                className={`${colors.bg} border-2 ${colors.border} rounded-lg p-5 transition-all hover:shadow-lg hover:scale-105 text-left`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-3 rounded-lg text-2xl ${colors.label}`}>
                    <IconComponent />
                  </div>
                  <FaChevronRight className={`text-xl ${colors.icon}`} />
                </div>
                
                <h3 className="font-bold text-gray-800 mb-1">{doc.label}</h3>
                <p className="text-sm text-gray-600 mb-2">{doc.title}</p>
                <p className="text-xs text-gray-500">{doc.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Weitere Geschäftsunterlagen */}
      <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-indigo-300">
        <div className="flex items-center gap-3 mb-4 pb-3 border-b-2 border-indigo-200">
          <FaBook className="text-2xl text-indigo-600" />
          <div>
            <h3 className="text-xl font-bold text-gray-800">Weitere Geschäftsunterlagen</h3>
            <p className="text-sm text-gray-600">Manuelle Einträge und spezielle Belege</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {otherDocuments.map((doc) => {
            const colors = getColorClasses(doc.color);
            const IconComponent = doc.icon;
            
            return (
              <button
                key={doc.id}
                onClick={() => setActiveDocument(doc.id)}
                className={`${colors.bg} border-2 ${colors.border} rounded-lg p-5 transition-all hover:shadow-lg hover:scale-105 text-left`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-3 rounded-lg text-2xl ${colors.label}`}>
                    <IconComponent />
                  </div>
                  <FaChevronRight className={`text-xl ${colors.icon}`} />
                </div>
                
                <h3 className="font-bold text-gray-800 mb-1">{doc.label}</h3>
                <p className="text-sm text-gray-600 mb-2">{doc.title}</p>
                <p className="text-xs text-gray-500">{doc.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="text-sm text-amber-800">
          <strong>Hinweis:</strong> Alle Belege werden gemäß deutschen Buchhaltungsstandards für e.V. Vereine organisiert. 
          Verwaltungsratsbeschlüsse und finanzielle Entscheidungen werden in diesem System verfolgbar dokumentiert.
        </p>
      </div>
    </div>
  );
}
