import React from 'react';
import { FaLock } from 'react-icons/fa';

export default function DonationConfirmations() {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-gray-800">Zuwendungsbestätigungen (Bağış Makbuzları)</h3>
      <div className="bg-pink-50 border border-pink-200 rounded-lg p-8 text-center">
        <FaLock className="text-3xl text-pink-600 mx-auto mb-4" />
        <p className="text-gray-700 mb-2">Bağış teyit belgeleri yönetimi yakında eklenecek.</p>
        <p className="text-sm text-gray-600">
          Bağışçılardan alınan makbuzlar ve teyit belgeleri bu modülde kaydedilecek.
        </p>
      </div>
    </div>
  );
}
