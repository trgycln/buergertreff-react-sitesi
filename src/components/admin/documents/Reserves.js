import React from 'react';
import { FaLock } from 'react-icons/fa';

export default function Reserves() {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-gray-800">Rücklagen (Yedek Akçe ve Rezervler)</h3>
      <div className="bg-teal-50 border border-teal-200 rounded-lg p-8 text-center">
        <FaLock className="text-3xl text-teal-600 mx-auto mb-4" />
        <p className="text-gray-700 mb-2">Yedek akçe yönetimi yakında eklenecek.</p>
        <p className="text-sm text-gray-600">
          Rezerv ve yedek akçe kayıtları bu modülde takip edilecek.
        </p>
      </div>
    </div>
  );
}
