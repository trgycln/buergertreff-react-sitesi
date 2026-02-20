import React from 'react';
import { FaLock } from 'react-icons/fa';

export default function TaxExemptions() {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-gray-800">Freistellungsbescheid (Vergi Muafiyet Belgeleri)</h3>
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-8 text-center">
        <FaLock className="text-3xl text-indigo-600 mx-auto mb-4" />
        <p className="text-gray-700 mb-2">Vergi muafiyet belgeleri yönetimi yakında eklenecek.</p>
        <p className="text-sm text-gray-600">
          Vergi muafiyeti sertifikaları ve belgeler bu modülde saklanacak.
        </p>
      </div>
    </div>
  );
}
