import React from 'react';
import { FaLock } from 'react-icons/fa';

export default function NonCashDonations() {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-gray-800">Sachspende-Belege (Ayni Bağış Değerleme)</h3>
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-8 text-center">
        <FaLock className="text-3xl text-amber-600 mx-auto mb-4" />
        <p className="text-gray-700 mb-2">Ayni bağış yönetimi yakında eklenecek.</p>
        <p className="text-sm text-gray-600">
          Eşya bağışlarının değer tespiti ve belgeleri bu modülde kaydedilecek.
        </p>
      </div>
    </div>
  );
}
