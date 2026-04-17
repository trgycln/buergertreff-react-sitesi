import React from 'react';
import { FaLock } from 'react-icons/fa';

export default function Payroll() {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-gray-800">Lohnkonten</h3>
      <div className="bg-lime-50 border border-lime-200 rounded-lg p-8 text-center">
        <FaLock className="text-3xl text-lime-600 mx-auto mb-4" />
        <p className="text-gray-700 mb-2">Die Lohnverwaltung wird in Kürze ergänzt.</p>
        <p className="text-sm text-gray-600">
          Löhne für Mitarbeitende und Trainer werden in diesem Modul erfasst.
        </p>
      </div>
    </div>
  );
}
