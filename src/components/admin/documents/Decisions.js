import React from 'react';
import { FaLock } from 'react-icons/fa';

export default function Decisions() {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-gray-800">Entscheidungsprotokolle (Karar Defteri)</h3>
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 text-center">
        <FaLock className="text-3xl text-slate-600 mx-auto mb-4" />
        <p className="text-gray-700 mb-2">Karar defteri yönetimi yakında eklenecek.</p>
        <p className="text-sm text-gray-600">
          Mali kararlar ve toplantı protokolleri bu modülde saklanacak.
        </p>
      </div>
    </div>
  );
}
