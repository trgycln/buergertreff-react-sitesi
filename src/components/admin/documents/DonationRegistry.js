import React from 'react';
import { FaLock } from 'react-icons/fa';

export default function DonationRegistry() {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-gray-800">Spendenverwaltungsblatt (Bağış Yönetim Çizelgesi)</h3>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
        <FaLock className="text-3xl text-blue-600 mx-auto mb-4" />
        <p className="text-gray-700 mb-2">Bağış yönetim çizelgesi yakında eklenecek.</p>
        <p className="text-sm text-gray-600">
          Tüm bağışların yönetim özeti ve istatistikleri bu modülde görüntülenecek.
        </p>
      </div>
    </div>
  );
}
