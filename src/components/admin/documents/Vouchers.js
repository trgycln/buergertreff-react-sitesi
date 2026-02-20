import React from 'react';
import { FaLock } from 'react-icons/fa';

export default function Vouchers() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-gray-800">Buchungsbelege (Muhasebe Fişleri)</h3>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
        <FaLock className="text-3xl text-blue-600 mx-auto mb-4" />
        <p className="text-gray-700 mb-2">Bu modul inşa aşamasındadır.</p>
        <p className="text-sm text-gray-600">
          Faturalar, makbuzlar ve banka dekontları yönetim sistemi yakında eklenecek.
        </p>
      </div>
    </div>
  );
}
