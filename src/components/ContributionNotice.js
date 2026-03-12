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
        Der reguläre Jahresbeitrag beträgt <strong>24 Euro</strong>. Jeder Betrag, der darüber hinaus überwiesen wird, gilt als Spende.
      </p>
    </div>
  );
};

export default ContributionNotice;