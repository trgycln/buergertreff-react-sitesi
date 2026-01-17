import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import BuchhaltungSettings from './BuchhaltungSettings';
import BuchhaltungContacts from './BuchhaltungContacts';
import BuchhaltungTransactions from './BuchhaltungTransactions';
import BuchhaltungDashboard from './BuchhaltungDashboard';
// YENİ: Rapor bileşenini import ediyoruz
import BuchhaltungReports from './BuchhaltungReports'; 

export default function Buchhaltung() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabs = [
    { id: 'dashboard', label: 'Übersicht' },
    { id: 'transactions', label: 'Transaktionen' },
    { id: 'reports', label: 'Berichte' },
    { id: 'contacts', label: 'Kontakte' },
    { id: 'settings', label: 'Einstellungen' },
  ];

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Buchhaltung</h1>
        <div className="text-sm text-gray-500">
          Verwaltung für den Schatzmeister
        </div>
      </div>

      {/* Sekmeler (Tabs) */}
      <div className="flex space-x-1 bg-gray-200 p-1 rounded-lg mb-6 w-fit overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-white text-blue-600 shadow'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* İçerik Alanı */}
      <div className="mt-4">
        {activeTab === 'dashboard' && <BuchhaltungDashboard />}
        {activeTab === 'transactions' && <BuchhaltungTransactions />}
        {activeTab === 'reports' && <BuchhaltungReports />}
        {activeTab === 'contacts' && <BuchhaltungContacts />}
        {activeTab === 'settings' && <BuchhaltungSettings />}
      </div>
    </div>
  );
}