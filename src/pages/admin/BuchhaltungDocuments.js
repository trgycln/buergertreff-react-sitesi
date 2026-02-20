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

  const documents = [
    {
      id: 'eur',
      label: 'EÜR',
      title: 'Einnahmen-Überschuss-Rechnung',
      subtitle: 'Gelir-Gider Hesaplaması Kayıtları',
      icon: FaFileAlt,
      color: 'blue',
      description: 'Yıllık gelir ve gider özetleri'
    },
    {
      id: 'cash_journal',
      label: 'Kassenbuch',
      title: 'Kasa Defteri',
      subtitle: 'Tägliche Kassenführung',
      icon: FaBook,
      color: 'green',
      description: 'Günlük nakit giriş ve çıkışlar'
    },
    {
      id: 'vouchers',
      label: 'Belege',
      title: 'Buchungsbelege',
      subtitle: 'Muhasebe Fişleri ve Dayanak Belgeler',
      icon: FaReceipt,
      color: 'purple',
      description: 'Faturalar, makbuzlar, banka dekontları'
    },
    {
      id: 'donations',
      label: 'Spenden',
      title: 'Zuwendungsbestätigungen',
      subtitle: 'Bağış Teyit Belgeleri',
      icon: FaHeart,
      color: 'red',
      description: 'Bağış makbuzları ve teyitler'
    },
    {
      id: 'donation_registry',
      label: 'Spendenverwaltung',
      title: 'Spendenverwaltungsblatt',
      subtitle: 'Bağış Yönetim Çizelgesi',
      icon: FaBook,
      color: 'pink',
      description: 'Tüm bağışların yönetim özeti'
    },
    {
      id: 'noncash_donations',
      label: 'Sachspenden',
      title: 'Sachspende-Belege',
      subtitle: 'Ayni Bağış Değerleme Belgeleri',
      icon: FaGift,
      color: 'amber',
      description: 'Eşya bağışlarının değer tespiti'
    },
    {
      id: 'members',
      label: 'Mitglieder',
      title: 'Mitglieder- und Beitragsverwaltung',
      subtitle: 'Üye ve Aidat Takip Listesi',
      icon: FaUsers,
      color: 'cyan',
      description: 'Üyeler ve aidat ödemeleri'
    },
    {
      id: 'tax_exemptions',
      label: 'Freistellung',
      title: 'Freistellungsbescheid',
      subtitle: 'Vergi Muafiyet Belgeleri',
      icon: FaBuilding,
      color: 'indigo',
      description: 'Vergi muafiyeti belgeleri'
    },
    {
      id: 'reserves',
      label: 'Rücklagen',
      title: 'Rücklagen und Reserven',
      subtitle: 'Yedek Akçe ve Rezerv Kayıtları',
      icon: FaPiggyBank,
      color: 'teal',
      description: 'Rezerv ve yedek akçe'
    },
    {
      id: 'payroll',
      label: 'Lohnkonten',
      title: 'Lohnkonten',
      subtitle: 'Ücret Kayıtları',
      icon: FaMoneyBillWave,
      color: 'grass',
      description: 'Çalışan ve eğitmen ücretleri'
    },
    {
      id: 'decisions',
      label: 'Beschlüsse',
      title: 'Entscheidungsprotokolle',
      subtitle: 'Karar Defteri ve Protokoller',
      icon: FaGavel,
      color: 'slate',
      description: 'Mali kararlar ve toplantı protokolleri'
    }
  ];

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
    const docConfig = documents.find(d => d.id === activeDocument);
    
    return (
      <div>
        <button
          onClick={() => setActiveDocument(null)}
          className="mb-4 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors flex items-center gap-2"
        >
          ← Belgelere Dön
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
        <h2 className="text-2xl font-bold mb-2">Resmi Muhasebe Belgeleri</h2>
        <p className="text-blue-100">
          Almanya e.V. muhasebesi için gerekli tüm resmi belgelerin kayıt ve yönetim sistemi
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.map((doc) => {
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

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="text-sm text-amber-800">
          <strong>Not:</strong> Tüm belgeler Alman e.V. muhasebe standartlarına göre organize edilmiştir.
          Yönetim kurulu kararları ile mali kararlar bu sistemde izlenir.
        </p>
      </div>
    </div>
  );
}
