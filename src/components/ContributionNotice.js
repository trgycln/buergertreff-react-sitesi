import React from 'react';

const ContributionNotice = ({ compact = false, className = '' }) => {
  const containerClasses = compact
    ? `mt-2 ${className}`.trim()
    : `mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 ${className}`.trim();

  const textClasses = compact
    ? 'text-xs leading-5 text-gray-600'
    : 'text-sm leading-6 text-amber-950';

  return (
    <div className={containerClasses}>
      <p className={textClasses}>
        Der reguläre Jahresbeitrag beträgt <strong>24 Euro</strong>. Jeder darüber hinaus überwiesene Betrag wird als Spende verbucht. Bitte geben Sie im Verwendungszweck Ihrer Überweisung an: <strong>"24 Euro Mitgliedsbeitrag, Rest Spende"</strong>.
      </p>
    </div>
  );
};

export default ContributionNotice;