import React from 'react';
import { FaLock } from 'react-icons/fa';

export default function Reserves() {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-gray-800">Rücklagen und Reserven</h3>
      <div className="bg-teal-50 border border-teal-200 rounded-lg p-8 text-center">
        <FaLock className="text-3xl text-teal-600 mx-auto mb-4" />
        <p className="text-gray-700 mb-2">Die Verwaltung von Rücklagen wird in Kürze ergänzt.</p>
        <p className="text-sm text-gray-600">
          Rücklagen- und Reservenbuchungen werden in diesem Modul nachverfolgt.
        </p>
      </div>
    </div>
  );
}
