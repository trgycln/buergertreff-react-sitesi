import React from 'react';
import { FaLock } from 'react-icons/fa';

export default function TaxExemptions() {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-gray-800">Freistellungsbescheid</h3>
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-8 text-center">
        <FaLock className="text-3xl text-indigo-600 mx-auto mb-4" />
        <p className="text-gray-700 mb-2">Die Verwaltung von Freistellungsunterlagen wird in Kürze ergänzt.</p>
        <p className="text-sm text-gray-600">
          Freistellungsbescheide und zugehörige Unterlagen werden in diesem Modul gespeichert.
        </p>
      </div>
    </div>
  );
}
