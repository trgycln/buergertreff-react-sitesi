import React from 'react';
import { FaLock } from 'react-icons/fa';

export default function MemberTracking() {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-gray-800">Mitglieder- und Beitragsverwaltung (Üye Takibi)</h3>
      <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-8 text-center">
        <FaLock className="text-3xl text-cyan-600 mx-auto mb-4" />
        <p className="text-gray-700 mb-2">Üye yönetimi yakında eklenecek.</p>
        <p className="text-sm text-gray-600">
          Üyelerin kayıtları ve aidat ödemeleri bu modülde takip edilecek.
        </p>
      </div>
    </div>
  );
}
