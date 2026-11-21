import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../supabaseClient';
import { isGeldtransitCategory } from '../../utils/accountingUtils';
import { parseDocumentUrls } from '../../utils/documentAssistant';
import * as XLSX from 'xlsx';
import {
  FaPrint,
  FaFileExcel,
  FaFileCsv,
  FaChartPie,
  FaChartBar,
  FaCalendarAlt,
  FaLandmark,
  FaMoneyBillWave,
  FaWallet,
  FaArrowUp,
  FaArrowDown,
  FaExchangeAlt,
  FaChevronDown,
  FaChevronRight,
  FaCheckCircle,
  FaExclamationTriangle,
  FaSearch,
  FaListUl,
  FaBalanceScale,
  FaSpinner,
  FaInfoCircle
} from 'react-icons/fa';

const MONTH_NAMES = [
  'Januar',
  'Februar',
  'März',
  'April',
  'Mai',
  'Juni',
  'Juli',
  'August',
  'September',
  'Oktober',
  'November',
  'Dezember'
];

const PERIOD_OPTIONS = [
  { value: 'all', label: 'Ganzes Jahr' },
  { value: 'Q1', label: '1. Quartal (Jan–Mär)' },
  { value: 'Q2', label: '2. Quartal (Apr–Jun)' },
  { value: 'Q3', label: '3. Quartal (Jul–Sep)' },
  { value: 'Q4', label: '4. Quartal (Okt–Dez)' },
  ...MONTH_NAMES.map((name, idx) => ({
    value: `M${String(idx + 1).padStart(2, '0')}`,
    label: name
  }))
];

const SECTION_TABS = [
  { id: 'all', label: 'Komplettansicht' },
  { id: 'categories', label: 'Kategorien & Drill-Down' },
  { id: 'accounts', label: 'Kontenabstimmung (Bank & Kasse)' },
  { id: 'monthly', label: 'Monats- & Quartalsverlauf' },
  { id: 'audit', label: 'Kassenprüfer-Check & Journal' }
];

const toNumber = (value) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const normalized = String(value ?? '').replace(',', '.').trim();
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const cleanZero = (value) => (Math.abs(value) < 0.005 ? 0 : value);

const formatAmount = (value = 0) =>
  cleanZero(toNumber(value)).toLocaleString('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

const formatEuro = (value = 0) => `${formatAmount(value)} €`;

const formatSignedEuro = (value = 0) => {
  const num = cleanZero(toNumber(value));
  return `${num > 0 ? '+' : ''}${formatAmount(num)} €`;
};

const formatDateDE = (dateStr) => {
  if (!dateStr) return '-';
  const raw = String(dateStr).slice(0, 10);
  const parts = raw.split('-');
  if (parts.length === 3) {
    return `${parts[2]}.${parts[1]}.${parts[0]}`;
  }
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? String(dateStr) : d.toLocaleDateString('de-DE');
};

const escapeHtml = (value = '') =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const normalizeText = (value = '') =>
  String(value ?? '')
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .trim();

const isLoanCategory = (categoryName = '') => {
  const norm = normalizeText(categoryName).replace(/[\s\-_]/g, '');
  return norm.includes('darlehen') || norm.includes('kredit') || norm.includes('loan');
};

const isBankAccountName = (accountName = '') => {
  const norm = normalizeText(accountName);
  return norm.includes('bank') || norm.includes('sparkasse') || norm.includes('giro') || norm.includes('volksbank');
};

const getPeriodBounds = (targetYear, periodKey) => {
  if (periodKey === 'Q1') {
    return {
      startDate: `${targetYear}-01-01`,
      endDate: `${targetYear}-03-31`,
      label: `1. Quartal ${targetYear} (Jan–Mär)`,
      shortLabel: `Q1/${targetYear}`
    };
  }
  if (periodKey === 'Q2') {
    return {
      startDate: `${targetYear}-04-01`,
      endDate: `${targetYear}-06-30`,
      label: `2. Quartal ${targetYear} (Apr–Jun)`,
      shortLabel: `Q2/${targetYear}`
    };
  }
  if (periodKey === 'Q3') {
    return {
      startDate: `${targetYear}-07-01`,
      endDate: `${targetYear}-09-30`,
      label: `3. Quartal ${targetYear} (Jul–Sep)`,
      shortLabel: `Q3/${targetYear}`
    };
  }
  if (periodKey === 'Q4') {
    return {
      startDate: `${targetYear}-10-01`,
      endDate: `${targetYear}-12-31`,
      label: `4. Quartal ${targetYear} (Okt–Dez)`,
      shortLabel: `Q4/${targetYear}`
    };
  }
  if (periodKey && periodKey.startsWith('M')) {
    const monthNum = parseInt(periodKey.slice(1), 10);
    if (monthNum >= 1 && monthNum <= 12) {
      const mm = String(monthNum).padStart(2, '0');
      const lastDay = String(new Date(targetYear, monthNum, 0).getDate()).padStart(2, '0');
      const monthName = MONTH_NAMES[monthNum - 1];
      return {
        startDate: `${targetYear}-${mm}-01`,
        endDate: `${targetYear}-${mm}-${lastDay}`,
        label: `${monthName} ${targetYear}`,
        shortLabel: `${monthName.slice(0, 3)} ${targetYear}`
      };
    }
  }
  return {
    startDate: `${targetYear}-01-01`,
    endDate: `${targetYear}-12-31`,
    label: `Geschäftsjahr ${targetYear}`,
    shortLabel: `${targetYear}`
  };
};

export default function BuchhaltungReports() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [period, setPeriod] = useState('all');
  const [accountFilter, setAccountFilter] = useState('all');
  const [activeSection, setActiveSection] = useState('all');
  const [expandedCategories, setExpandedCategories] = useState({});
  const [journalSearch, setJournalSearch] = useState('');
  const [journalFilter, setJournalFilter] = useState('all');

  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [allTransactions, setAllTransactions] = useState([]);
  const [orgSettings, setOrgSettings] = useState({});

  useEffect(() => {
    fetchReportData();
    fetchOrgSettings();
  }, []);

  const fetchOrgSettings = async () => {
    try {
      const { data } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', [
          'org_name',
          'org_address',
          'org_postal_code',
          'org_city',
          'org_phone',
          'org_email',
          'org_website',
          'org_tax_id',
          'exemption_date',
          'exemption_office',
          'vereinsregister',
          'bank_name',
          'bank_iban',
          'bank_bic',
          'vorsitzende_name',
          'treasurer_name'
        ]);

      const settings = {};
      if (data) {
        data.forEach((item) => {
          settings[item.key] = item.value;
        });
      }
      setOrgSettings(settings);
    } catch (err) {
      console.error('Fehler beim Laden der Organisationseinstellungen:', err);
    }
  };

  const fetchReportData = async () => {
    setLoading(true);
    setFetchError('');
    try {
      const { data, error } = await supabase
        .from('accounting_transactions')
        .select(`
          id,
          date,
          amount,
          type,
          description,
          subcategory,
          receipt_no,
          file_no,
          document_url,
          account_id,
          category_id,
          contact_id,
          accounting_categories (id, name, type),
          accounting_accounts (id, name),
          accounting_contacts (id, name)
        `)
        .order('date', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) throw error;
      setAllTransactions(data || []);
    } catch (err) {
      console.error('Fehler beim Laden der Berichtsdaten:', err);
      setFetchError('Buchungsdaten konnten nicht geladen werden. Bitte versuchen Sie es erneut.');
    } finally {
      setLoading(false);
    }
  };

  const availableYears = useMemo(() => {
    const yearSet = new Set([2023, 2024, 2025, 2026, currentYear]);
    allTransactions.forEach((trx) => {
      const y = parseInt(String(trx.date || '').slice(0, 4), 10);
      if (Number.isFinite(y) && y >= 2000 && y <= 2100) {
        yearSet.add(y);
      }
    });
    return Array.from(yearSet).sort((a, b) => b - a);
  }, [allTransactions, currentYear]);

  const availableAccounts = useMemo(() => {
    const accSet = new Set();
    allTransactions.forEach((trx) => {
      const accName = trx.accounting_accounts?.name || 'Ohne Konto';
      accSet.add(accName);
    });
    return Array.from(accSet).sort((a, b) => a.localeCompare(b, 'de'));
  }, [allTransactions]);

  const report = useMemo(() => {
    const bounds = getPeriodBounds(year, period);
    const prevBounds = getPeriodBounds(year - 1, period);
    const { startDate, endDate } = bounds;
    const { startDate: prevStartDate, endDate: prevEndDate } = prevBounds;

    const matchesAccount = (accName) => accountFilter === 'all' || accName === accountFilter;

    let openingBalance = 0;
    let totalIncome = 0;
    let totalExpense = 0;
    let transitIn = 0;
    let transitOut = 0;
    let globalTransitIn = 0;
    let globalTransitOut = 0;
    let regularCount = 0;
    let transitCount = 0;

    let prevTotalIncome = 0;
    let prevTotalExpense = 0;

    let missingReceiptCount = 0;
    let missingDocCount = 0;
    let largestIncome = null;
    let largestExpense = null;

    let loanTotalTaken = 0;
    let loanTotalRepaid = 0;
    let loanPeriodTaken = 0;
    let loanPeriodRepaid = 0;

    const accMap = {};
    const catMap = {};
    const prevCatMap = {};
    const periodTransactions = [];

    const ensureAccount = (accName) => {
      if (!accMap[accName]) {
        accMap[accName] = {
          name: accName,
          openingBalance: 0,
          regularIncome: 0,
          regularExpense: 0,
          transitIn: 0,
          transitOut: 0,
          txCount: 0
        };
      }
      return accMap[accName];
    };

    allTransactions.forEach((trx) => {
      const trxDate = String(trx.date || '').slice(0, 10);
      if (!trxDate) return;

      const amount = toNumber(trx.amount);
      const isIncome = trx.type === 'income';
      const signedAmount = isIncome ? amount : -amount;
      const accName = trx.accounting_accounts?.name || 'Ohne Konto';
      const catName = trx.accounting_categories?.name || 'Sonstige';
      const subName = (trx.subcategory || '').trim() || 'Allgemein';
      const contactName = trx.accounting_contacts?.name || '';
      const isTransit = isGeldtransitCategory(catName);
      const isLoan = isLoanCategory(catName);
      const accountMatches = matchesAccount(accName);

      // Darlehen kumulativ bis Periodenende
      if (isLoan && trxDate <= endDate) {
        if (isIncome) loanTotalTaken += amount;
        else loanTotalRepaid += amount;
      }

      // Anfangsbestand vor Startdatum
      if (trxDate < startDate) {
        const acc = ensureAccount(accName);
        acc.openingBalance += signedAmount;
        if (accountMatches) {
          openingBalance += signedAmount;
        }
        return;
      }

      // Vorjahresvergleich (gleicher Zeitraum im Vorjahr)
      if (trxDate >= prevStartDate && trxDate <= prevEndDate && accountMatches && !isTransit) {
        if (!prevCatMap[catName]) prevCatMap[catName] = { income: 0, expense: 0 };
        if (isIncome) {
          prevTotalIncome += amount;
          prevCatMap[catName].income += amount;
        } else {
          prevTotalExpense += amount;
          prevCatMap[catName].expense += amount;
        }
      }

      // Aktueller Zeitraum
      if (trxDate >= startDate && trxDate <= endDate) {
        const acc = ensureAccount(accName);
        acc.txCount += 1;

        if (isTransit) {
          if (isIncome) {
            acc.transitIn += amount;
            globalTransitIn += amount;
          } else {
            acc.transitOut += amount;
            globalTransitOut += amount;
          }
        } else {
          if (isIncome) acc.regularIncome += amount;
          else acc.regularExpense += amount;
        }

        if (!accountMatches) return;

        const hasReceiptNo = Boolean(trx.receipt_no && String(trx.receipt_no).trim());
        const docUrls = parseDocumentUrls(trx.document_url);
        const hasDoc = docUrls.length > 0;

        if (!hasReceiptNo) missingReceiptCount += 1;
        if (!hasDoc) missingDocCount += 1;

        periodTransactions.push({
          ...trx,
          trxDate,
          parsedAmount: amount,
          accName,
          catName,
          subName,
          contactName,
          isTransit,
          hasReceiptNo,
          hasDoc,
          docCount: docUrls.length
        });

        if (isTransit) {
          transitCount += 1;
          if (isIncome) transitIn += amount;
          else transitOut += amount;
          return;
        }

        regularCount += 1;
        if (isLoan) {
          if (isIncome) loanPeriodTaken += amount;
          else loanPeriodRepaid += amount;
        }

        if (isIncome) {
          totalIncome += amount;
          if (!largestIncome || amount > largestIncome.amount) {
            largestIncome = {
              amount,
              date: trxDate,
              category: catName,
              description: trx.description || contactName || catName
            };
          }
        } else {
          totalExpense += amount;
          if (!largestExpense || amount > largestExpense.amount) {
            largestExpense = {
              amount,
              date: trxDate,
              category: catName,
              description: trx.description || contactName || catName
            };
          }
        }

        if (!catMap[catName]) {
          catMap[catName] = {
            name: catName,
            income: 0,
            expense: 0,
            count: 0,
            incomeCount: 0,
            expenseCount: 0,
            subcategories: {},
            transactions: []
          };
        }

        const catEntry = catMap[catName];
        catEntry.count += 1;
        if (isIncome) {
          catEntry.income += amount;
          catEntry.incomeCount += 1;
        } else {
          catEntry.expense += amount;
          catEntry.expenseCount += 1;
        }

        if (!catEntry.subcategories[subName]) {
          catEntry.subcategories[subName] = { name: subName, income: 0, expense: 0, count: 0 };
        }
        catEntry.subcategories[subName].count += 1;
        if (isIncome) catEntry.subcategories[subName].income += amount;
        else catEntry.subcategories[subName].expense += amount;

        catEntry.transactions.push({
          id: trx.id,
          date: trxDate,
          type: trx.type,
          amount,
          receipt_no: trx.receipt_no || '',
          file_no: trx.file_no || '',
          contactName,
          description: trx.description || '',
          subName,
          accName,
          hasDoc
        });
      }
    });

    const categories = Object.values(catMap)
      .map((cat) => {
        const prev = prevCatMap[cat.name] || { income: 0, expense: 0 };
        const net = cat.income - cat.expense;
        const prevNet = prev.income - prev.expense;
        const subcategoriesList = Object.values(cat.subcategories).sort(
          (a, b) => (b.income + b.expense) - (a.income + a.expense)
        );
        return {
          ...cat,
          net,
          prevIncome: prev.income,
          prevExpense: prev.expense,
          prevNet,
          subcategoriesList
        };
      })
      .sort((a, b) => (b.income + b.expense) - (a.income + a.expense));

    const incomeCategories = categories
      .filter((c) => c.income > 0)
      .sort((a, b) => b.income - a.income);

    const expenseCategories = categories
      .filter((c) => c.expense > 0)
      .sort((a, b) => b.expense - a.expense);

    const allAccounts = Object.values(accMap)
      .map((acc) => {
        const netTransit = acc.transitIn - acc.transitOut;
        const netChange = acc.regularIncome - acc.regularExpense + netTransit;
        const closingBalance = acc.openingBalance + netChange;
        return {
          ...acc,
          netTransit,
          netChange,
          closingBalance
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'de'));

    const accounts =
      accountFilter === 'all'
        ? allAccounts
        : allAccounts.filter((acc) => acc.name === accountFilter);

    // Monats- & Quartalsverlauf für das ausgewählte Geschäftsjahr
    const yearStart = `${year}-01-01`;
    const yearEnd = `${year}-12-31`;
    let yearOpeningBalance = 0;

    const months = MONTH_NAMES.map((name, idx) => ({
      index: idx,
      key: `M${String(idx + 1).padStart(2, '0')}`,
      name,
      shortName: name.slice(0, 3),
      income: 0,
      expense: 0,
      net: 0,
      transitNet: 0,
      count: 0,
      closingBalance: 0
    }));

    allTransactions.forEach((trx) => {
      const trxDate = String(trx.date || '').slice(0, 10);
      if (!trxDate) return;
      const accName = trx.accounting_accounts?.name || 'Ohne Konto';
      if (!matchesAccount(accName)) return;

      const amount = toNumber(trx.amount);
      const isIncome = trx.type === 'income';
      const signed = isIncome ? amount : -amount;

      if (trxDate < yearStart) {
        yearOpeningBalance += signed;
        return;
      }

      if (trxDate >= yearStart && trxDate <= yearEnd) {
        const mIdx = parseInt(trxDate.slice(5, 7), 10) - 1;
        if (mIdx >= 0 && mIdx < 12) {
          const catName = trx.accounting_categories?.name || 'Sonstige';
          months[mIdx].count += 1;
          if (isGeldtransitCategory(catName)) {
            months[mIdx].transitNet += signed;
          } else if (isIncome) {
            months[mIdx].income += amount;
          } else {
            months[mIdx].expense += amount;
          }
        }
      }
    });

    let runningMonthBalance = yearOpeningBalance;
    months.forEach((m) => {
      m.net = m.income - m.expense;
      runningMonthBalance += m.net + m.transitNet;
      m.closingBalance = runningMonthBalance;
    });

    const quarters = [0, 1, 2, 3].map((qIdx) => {
      const slice = months.slice(qIdx * 3, qIdx * 3 + 3);
      const qOpening = qIdx === 0 ? yearOpeningBalance : months[qIdx * 3 - 1].closingBalance;
      const qIncome = slice.reduce((sum, m) => sum + m.income, 0);
      const qExpense = slice.reduce((sum, m) => sum + m.expense, 0);
      const qTransitNet = slice.reduce((sum, m) => sum + m.transitNet, 0);
      const qCount = slice.reduce((sum, m) => sum + m.count, 0);
      return {
        key: `Q${qIdx + 1}`,
        label: `${qIdx + 1}. Quartal`,
        rangeLabel: `${slice[0].shortName}–${slice[2].shortName}`,
        openingBalance: qOpening,
        income: qIncome,
        expense: qExpense,
        net: qIncome - qExpense,
        transitNet: qTransitNet,
        closingBalance: slice[2].closingBalance,
        count: qCount
      };
    });

    const maxMonthBar = Math.max(
      1,
      ...months.map((m) => Math.max(m.income, m.expense))
    );

    const balance = totalIncome - totalExpense;
    const transitNet = transitIn - transitOut;
    const closingBalance = openingBalance + balance + transitNet;
    const prevBalance = prevTotalIncome - prevTotalExpense;
    const expenseRatio = totalIncome > 0 ? (totalExpense / totalIncome) * 100 : null;
    const globalTransitDiff = cleanZero(globalTransitIn - globalTransitOut);

    return {
      bounds,
      prevBounds,
      openingBalance,
      income: totalIncome,
      expense: totalExpense,
      balance,
      transitIn,
      transitOut,
      transitNet,
      closingBalance,
      prevIncome: prevTotalIncome,
      prevExpense: prevTotalExpense,
      prevBalance,
      expenseRatio,
      regularCount,
      transitCount,
      totalCount: periodTransactions.length,
      categories,
      incomeCategories,
      expenseCategories,
      accounts,
      allAccounts,
      yearOpeningBalance,
      months,
      quarters,
      maxMonthBar,
      periodTransactions,
      audit: {
        missingReceiptCount,
        missingDocCount,
        receiptCoverage:
          periodTransactions.length > 0
            ? Math.round(((periodTransactions.length - missingReceiptCount) / periodTransactions.length) * 100)
            : 100,
        docCoverage:
          periodTransactions.length > 0
            ? Math.round(((periodTransactions.length - missingDocCount) / periodTransactions.length) * 100)
            : 100,
        globalTransitIn,
        globalTransitOut,
        globalTransitDiff,
        isTransitBalanced: Math.abs(globalTransitDiff) < 0.01,
        largestIncome,
        largestExpense
      },
      loan: {
        totalTaken: loanTotalTaken,
        totalRepaid: loanTotalRepaid,
        openBalance: loanTotalTaken - loanTotalRepaid,
        periodTaken: loanPeriodTaken,
        periodRepaid: loanPeriodRepaid
      }
    };
  }, [allTransactions, year, period, accountFilter]);

  const filteredJournalTransactions = useMemo(() => {
    const query = normalizeText(journalSearch);
    return report.periodTransactions.filter((trx) => {
      if (journalFilter === 'missing_receipt' && trx.hasReceiptNo) return false;
      if (journalFilter === 'missing_doc' && trx.hasDoc) return false;
      if (journalFilter === 'geldtransit' && !trx.isTransit) return false;

      if (!query) return true;
      const haystack = normalizeText(
        [
          trx.trxDate,
          formatDateDE(trx.trxDate),
          trx.receipt_no,
          trx.file_no,
          trx.catName,
          trx.subName,
          trx.accName,
          trx.contactName,
          trx.description
        ].join(' ')
      );
      return haystack.includes(query);
    });
  }, [report.periodTransactions, journalSearch, journalFilter]);

  const toggleCategory = (catName) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [catName]: !prev[catName]
    }));
  };

  const expandAllCategories = () => {
    const next = {};
    report.categories.forEach((cat) => {
      next[cat.name] = true;
    });
    setExpandedCategories(next);
  };

  const collapseAllCategories = () => {
    setExpandedCategories({});
  };

  const handleAuditShortcut = (filterKey) => {
    setJournalFilter(filterKey);
    setActiveSection('audit');
  };

  // --- DRUCKANSICHT (A4 KASSENBERICHT / PRÜFBERICHT) ---
  const printAnnualReport = (includeJournal = false) => {
    const printWindow = window.open('', '_blank', 'width=1050,height=850');
    if (!printWindow) {
      alert('Bitte erlauben Sie Pop-ups in Ihrem Browser, um den Bericht zu drucken.');
      return;
    }

    const orgName = orgSettings.org_name || 'Bürgertreff Wissen e.V.';
    const orgAddressLine = [
      orgSettings.org_address || 'Hauptstr. 79',
      [orgSettings.org_postal_code || '57587', orgSettings.org_city || 'Birken-Honigsessen'].filter(Boolean).join(' ')
    ]
      .filter(Boolean)
      .join(', ');
    const chairPerson = orgSettings.vorsitzende_name ? `c/o ${orgSettings.vorsitzende_name} · ` : '';
    const bankLine = [
      orgSettings.bank_name || 'Sparkasse Westerwald-Sieg',
      orgSettings.bank_iban || 'DE27 5735 1030 0055 0844 38',
      orgSettings.bank_bic ? `BIC ${orgSettings.bank_bic}` : 'BIC MALADE51AKI'
    ]
      .filter(Boolean)
      .join(' · ');
    const taxLine = `StNr. ${orgSettings.org_tax_id || '02/650/36212'} · ${
      orgSettings.exemption_office
        ? `Freistellung ${orgSettings.exemption_office}${orgSettings.exemption_date ? ` (${orgSettings.exemption_date})` : ''}`
        : 'Die Gemeinnützigkeit ist anerkannt'
    }`;

    const dateStr = new Date().toLocaleDateString('de-DE');
    const accountScopeLabel = accountFilter === 'all' ? 'Alle Konten (Kasse & Bank)' : `Konto: ${accountFilter}`;

    const renderCategoryRows = (list, typeKey, totalVal) => {
      if (list.length === 0) {
        return `<tr><td colspan="5" style="text-align:center;color:#777;font-style:italic;">Keine Buchungen im gewählten Zeitraum</td></tr>`;
      }
      return list
        .map((cat) => {
          const val = typeKey === 'income' ? cat.income : cat.expense;
          const prevVal = typeKey === 'income' ? cat.prevIncome : cat.prevExpense;
          const countVal = typeKey === 'income' ? cat.incomeCount : cat.expenseCount;
          const pct = totalVal > 0 ? ((val / totalVal) * 100).toFixed(1).replace('.', ',') : '0,0';
          const subs = cat.subcategoriesList.filter(
            (s) => (typeKey === 'income' ? s.income : s.expense) > 0 && s.name !== 'Allgemein'
          );

          const mainRow = `
            <tr>
              <td><strong>${escapeHtml(cat.name)}</strong></td>
              <td class="center">${countVal}</td>
              <td class="amount">${pct} %</td>
              <td class="amount muted">${prevVal > 0 ? formatEuro(prevVal) : '–'}</td>
              <td class="amount"><strong>${formatEuro(val)}</strong></td>
            </tr>
          `;
          const subRows = subs
            .map((sub) => {
              const subVal = typeKey === 'income' ? sub.income : sub.expense;
              return `
                <tr class="sub-row">
                  <td style="padding-left:18px;color:#555;">↳ ${escapeHtml(sub.name)}</td>
                  <td class="center muted">${sub.count}</td>
                  <td></td>
                  <td></td>
                  <td class="amount muted">${formatEuro(subVal)}</td>
                </tr>
              `;
            })
            .join('');
          return mainRow + subRows;
        })
        .join('');
    };

    const accountRowsHtml = report.accounts
      .map(
        (acc) => `
        <tr>
          <td><strong>${escapeHtml(acc.name)}</strong></td>
          <td class="amount">${formatEuro(acc.openingBalance)}</td>
          <td class="amount pos">+ ${formatEuro(acc.regularIncome)}</td>
          <td class="amount neg">- ${formatEuro(acc.regularExpense)}</td>
          <td class="amount">${formatSignedEuro(acc.netTransit)}</td>
          <td class="amount"><strong>${formatEuro(acc.closingBalance)}</strong></td>
        </tr>
      `
      )
      .join('');

    const monthRowsHtml = report.months
      .map(
        (m) => `
        <tr>
          <td>${escapeHtml(m.name)}</td>
          <td class="center">${m.count}</td>
          <td class="amount pos">${m.income > 0 ? formatEuro(m.income) : '–'}</td>
          <td class="amount neg">${m.expense > 0 ? formatEuro(m.expense) : '–'}</td>
          <td class="amount ${m.net >= 0 ? 'pos' : 'neg'}"><strong>${formatSignedEuro(m.net)}</strong></td>
          <td class="amount">${formatEuro(m.closingBalance)}</td>
        </tr>
      `
      )
      .join('');

    const journalRowsHtml = includeJournal
      ? report.periodTransactions
          .map(
            (trx) => `
            <tr>
              <td>${escapeHtml(formatDateDE(trx.trxDate))}</td>
              <td>${escapeHtml(trx.receipt_no || '–')}</td>
              <td>${escapeHtml(trx.accName)}</td>
              <td>${escapeHtml(trx.catName)}${trx.subName !== 'Allgemein' ? ` / ${escapeHtml(trx.subName)}` : ''}</td>
              <td>${escapeHtml(trx.description || trx.contactName || '–')}${
              trx.contactName && trx.description ? ` <span class="muted">(${escapeHtml(trx.contactName)})</span>` : ''
            }</td>
              <td class="amount ${trx.isTransit ? '' : trx.type === 'income' ? 'pos' : 'neg'}">
                ${trx.type === 'income' ? '+' : '-'} ${formatEuro(trx.parsedAmount)}
              </td>
            </tr>
          `
          )
          .join('')
      : '';

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="de">
      <head>
        <meta charset="utf-8" />
        <title>${includeJournal ? 'Kassenprüfungsbericht' : 'Finanzbericht'} ${escapeHtml(report.bounds.shortLabel)} - ${escapeHtml(orgName)}</title>
        <style>
          @page { size: A4 portrait; margin: 14mm 14mm 16mm 14mm; }
          * { box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 9pt; color: #1e293b; line-height: 1.35; margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .doc-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #1e3a8a; padding-bottom: 10px; margin-bottom: 12px; }
          .doc-header-left { display: flex; align-items: center; gap: 12px; }
          .doc-header-left img { height: 52px; }
          .doc-org { font-size: 8pt; text-transform: uppercase; letter-spacing: 0.06em; color: #64748b; font-weight: 700; }
          .doc-title { font-size: 14pt; font-weight: 800; color: #0f172a; margin: 2px 0 0 0; }
          .doc-meta { text-align: right; font-size: 8pt; color: #475569; line-height: 1.5; }
          .kpi-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin: 10px 0 14px 0; }
          .kpi-box { border: 1px solid #cbd5e1; border-radius: 5px; padding: 7px 8px; background: #f8fafc; text-align: center; }
          .kpi-label { font-size: 7pt; text-transform: uppercase; color: #64748b; font-weight: 700; display: block; }
          .kpi-val { font-size: 10.5pt; font-weight: 800; display: block; margin-top: 3px; color: #0f172a; }
          h3 { font-size: 10pt; color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 3px; margin: 14px 0 6px 0; }
          table { width: 100%; border-collapse: collapse; font-size: 8pt; margin-bottom: 10px; }
          th, td { border: 1px solid #cbd5e1; padding: 4px 6px; text-align: left; vertical-align: top; }
          th { background: #f1f5f9; font-weight: 700; color: #334155; }
          tr.sub-row td { background: #fafafa; font-size: 7.5pt; }
          tfoot td { background: #e2e8f0; font-weight: 700; }
          .amount { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
          .center { text-align: center; }
          .pos { color: #047857; }
          .neg { color: #be123c; }
          .muted { color: #64748b; }
          .audit-note { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 5px; padding: 8px 10px; font-size: 8pt; margin-top: 10px; page-break-inside: avoid; }
          .signatures { margin-top: 26px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 28px; page-break-inside: avoid; }
          .sig-box { text-align: center; }
          .sig-line { height: 28px; border-bottom: 1px solid #334155; margin-bottom: 5px; }
          .sig-label { font-size: 8pt; color: #334155; }
          .doc-footer { margin-top: 18px; border-top: 1px solid #cbd5e1; padding-top: 6px; text-align: center; font-size: 7.2pt; color: #64748b; line-height: 1.4; page-break-inside: avoid; }
          .page-break { page-break-before: always; }
          h3, .kpi-grid { page-break-inside: avoid; }
        </style>
      </head>
      <body>
        <div class="doc-header">
          <div class="doc-header-left">
            <img src="/logo.png" alt="Logo" onerror="this.style.display='none'" />
            <div>
              <div class="doc-org">${escapeHtml(orgName)}</div>
              <div class="doc-title">${includeJournal ? 'Kassenprüfungsbericht & Buchungsjournal' : 'Jahresabschluss / Kassenbericht'}</div>
            </div>
          </div>
          <div class="doc-meta">
            <strong>Zeitraum:</strong> ${escapeHtml(report.bounds.label)}<br />
            <strong>Umfang:</strong> ${escapeHtml(accountScopeLabel)}<br />
            <strong>Erstellt am:</strong> ${escapeHtml(dateStr)}
          </div>
        </div>

        <div class="kpi-grid">
          <div class="kpi-box">
            <span class="kpi-label">Anfangsbestand</span>
            <span class="kpi-val">${formatEuro(report.openingBalance)}</span>
          </div>
          <div class="kpi-box">
            <span class="kpi-label">Einnahmen</span>
            <span class="kpi-val pos">+ ${formatEuro(report.income)}</span>
          </div>
          <div class="kpi-box">
            <span class="kpi-label">Ausgaben</span>
            <span class="kpi-val neg">- ${formatEuro(report.expense)}</span>
          </div>
          <div class="kpi-box">
            <span class="kpi-label">Periodenergebnis</span>
            <span class="kpi-val ${report.balance >= 0 ? 'pos' : 'neg'}">${formatSignedEuro(report.balance)}</span>
          </div>
          <div class="kpi-box" style="background:#eff6ff;border-color:#93c5fd;">
            <span class="kpi-label">Endbestand</span>
            <span class="kpi-val" style="color:#1d4ed8;">${formatEuro(report.closingBalance)}</span>
          </div>
        </div>

        <h3>1. Kontenabstimmung (Nachweis der Kassen- und Bankbestände)</h3>
        <table>
          <thead>
            <tr>
              <th>Konto</th>
              <th class="amount">Anfangsbestand</th>
              <th class="amount">Einnahmen (+)</th>
              <th class="amount">Ausgaben (-)</th>
              <th class="amount">Geldtransit</th>
              <th class="amount">Endbestand</th>
            </tr>
          </thead>
          <tbody>
            ${accountRowsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td>Summe Konten</td>
              <td class="amount">${formatEuro(report.openingBalance)}</td>
              <td class="amount pos">+ ${formatEuro(report.income)}</td>
              <td class="amount neg">- ${formatEuro(report.expense)}</td>
              <td class="amount">${formatSignedEuro(report.transitNet)}</td>
              <td class="amount">${formatEuro(report.closingBalance)}</td>
            </tr>
          </tfoot>
        </table>

        <h3>2. Einnahmen nach Kategorien &amp; Unterkategorien</h3>
        <table>
          <thead>
            <tr>
              <th>Kategorie / Unterkategorie</th>
              <th class="center">Buchungen</th>
              <th class="amount">Anteil</th>
              <th class="amount">Vorjahr (${escapeHtml(report.prevBounds.shortLabel)})</th>
              <th class="amount">Betrag</th>
            </tr>
          </thead>
          <tbody>
            ${renderCategoryRows(report.incomeCategories, 'income', report.income)}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3" style="text-align:right;">Summe Einnahmen:</td>
              <td class="amount">${formatEuro(report.prevIncome)}</td>
              <td class="amount pos">${formatEuro(report.income)}</td>
            </tr>
          </tfoot>
        </table>

        <h3>3. Ausgaben nach Kategorien &amp; Unterkategorien</h3>
        <table>
          <thead>
            <tr>
              <th>Kategorie / Unterkategorie</th>
              <th class="center">Buchungen</th>
              <th class="amount">Anteil</th>
              <th class="amount">Vorjahr (${escapeHtml(report.prevBounds.shortLabel)})</th>
              <th class="amount">Betrag</th>
            </tr>
          </thead>
          <tbody>
            ${renderCategoryRows(report.expenseCategories, 'expense', report.expense)}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3" style="text-align:right;">Summe Ausgaben:</td>
              <td class="amount">${formatEuro(report.prevExpense)}</td>
              <td class="amount neg">${formatEuro(report.expense)}</td>
            </tr>
          </tfoot>
        </table>

        <h3>4. Monatsübersicht Geschäftsjahr ${year}</h3>
        <table>
          <thead>
            <tr>
              <th>Monat</th>
              <th class="center">Buchungen</th>
              <th class="amount">Einnahmen</th>
              <th class="amount">Ausgaben</th>
              <th class="amount">Monatssaldo</th>
              <th class="amount">Kum. Bestand</th>
            </tr>
          </thead>
          <tbody>
            ${monthRowsHtml}
          </tbody>
        </table>

        ${
          includeJournal
            ? `
          <div class="page-break"></div>
          <h3>5. Einzelbuchungsnachweis / Buchungsjournal (${escapeHtml(report.bounds.label)})</h3>
          <table>
            <thead>
              <tr>
                <th>Datum</th>
                <th>Beleg-Nr.</th>
                <th>Konto</th>
                <th>Kategorie</th>
                <th>Beschreibung / Kontakt</th>
                <th class="amount">Betrag</th>
              </tr>
            </thead>
            <tbody>
              ${
                journalRowsHtml ||
                '<tr><td colspan="6" style="text-align:center;color:#777;">Keine Buchungen vorhanden</td></tr>'
              }
            </tbody>
          </table>
        `
            : ''
        }

        <div class="audit-note">
          <strong>Prüfvermerk für die Kassenprüfung:</strong>
          Im Zeitraum <strong>${escapeHtml(report.bounds.label)}</strong> wurden insgesamt <strong>${report.totalCount}</strong> Buchungen
          (${report.regularCount} reguläre Buchungen, ${report.transitCount} Geldtransit-Buchungen) erfasst.
          Belegnummern-Quote: <strong>${report.audit.receiptCoverage}%</strong> · Digitale Belege: <strong>${report.audit.docCoverage}%</strong> ·
          Geldtransit-Saldo (alle Konten): <strong>${formatSignedEuro(report.audit.globalTransitDiff)}</strong>.
          ${
            report.loan.openBalance !== 0
              ? `<br />Offener Darlehensbestand zum Stichtag: <strong>${formatEuro(report.loan.openBalance)}</strong>.`
              : ''
          }
          <br />Die rechnerische Richtigkeit der Buchführung sowie die Übereinstimmung mit den vorliegenden Belegen und Kontoauszügen wird bestätigt.
        </div>

        <p style="margin-top:14px;font-size:8.5pt;">Ort, Datum: Wissen, den ${escapeHtml(dateStr)}</p>
        <div class="signatures">
          <div class="sig-box">
            <div class="sig-line"></div>
            <div class="sig-label">Unterschrift Kassierer/in${orgSettings.treasurer_name ? ` (${escapeHtml(orgSettings.treasurer_name)})` : ''}</div>
          </div>
          <div class="sig-box">
            <div class="sig-line"></div>
            <div class="sig-label">Unterschrift 1. Kassenprüfer/in</div>
          </div>
          <div class="sig-box">
            <div class="sig-line"></div>
            <div class="sig-label">Unterschrift 2. Kassenprüfer/in</div>
          </div>
        </div>

        <div class="doc-footer">
          ${escapeHtml(orgName)} · ${escapeHtml(chairPerson)}${escapeHtml(orgAddressLine)}<br />
          ${[orgSettings.org_phone ? `Tel. ${orgSettings.org_phone}` : 'Tel. 01516 5179082', orgSettings.org_email || 'buergertreff.wissen@gmail.com', orgSettings.org_website || 'www.buergertreff-wissen.de'].map(escapeHtml).join(' · ')}<br />
          ${escapeHtml(bankLine)} · ${escapeHtml(taxLine)}
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); }, 300);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // --- EXCEL EXPORT (.XLSX) ---
  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();
    const scopeLabel = accountFilter === 'all' ? 'Alle Konten' : accountFilter;

    // Sheet 1: Übersicht & Konten
    const overviewRows = [
      ['FINANZBERICHT & JAHRESABSCHLUSS', orgSettings.org_name || 'Bürgertreff Wissen e.V.'],
      ['Zeitraum', report.bounds.label],
      ['Konto-Filter', scopeLabel],
      ['Erstellt am', new Date().toLocaleDateString('de-DE')],
      [],
      ['KENNZAHLEN', 'Betrag (€)', 'Hinweis'],
      ['Anfangsbestand (Übertrag)', Number(report.openingBalance.toFixed(2)), 'Vorperioden-Saldo'],
      ['Gesamteinnahmen', Number(report.income.toFixed(2)), `${report.regularCount} Buchungen (ohne Geldtransit)`],
      ['Gesamtausgaben', Number(report.expense.toFixed(2)), 'ohne Geldtransit'],
      ['Periodenergebnis', Number(report.balance.toFixed(2)), report.balance >= 0 ? 'Überschuss' : 'Fehlbetrag'],
      ['Geldtransit (Netto)', Number(report.transitNet.toFixed(2)), 'Kasse ↔ Bank Umbuchungen'],
      ['Endbestand', Number(report.closingBalance.toFixed(2)), 'Anfangsbestand + Ergebnis + Geldtransit'],
      [],
      ['KONTENABSTIMMUNG', 'Anfangsbestand (€)', 'Einnahmen (€)', 'Ausgaben (€)', 'Geldtransit (€)', 'Veränderung (€)', 'Endbestand (€)'],
      ...report.accounts.map((acc) => [
        acc.name,
        Number(acc.openingBalance.toFixed(2)),
        Number(acc.regularIncome.toFixed(2)),
        Number(acc.regularExpense.toFixed(2)),
        Number(acc.netTransit.toFixed(2)),
        Number(acc.netChange.toFixed(2)),
        Number(acc.closingBalance.toFixed(2))
      ]),
      [
        'Summe',
        Number(report.openingBalance.toFixed(2)),
        Number(report.income.toFixed(2)),
        Number(report.expense.toFixed(2)),
        Number(report.transitNet.toFixed(2)),
        Number((report.balance + report.transitNet).toFixed(2)),
        Number(report.closingBalance.toFixed(2))
      ]
    ];
    const wsOverview = XLSX.utils.aoa_to_sheet(overviewRows);
    wsOverview['!cols'] = [
      { wch: 30 },
      { wch: 18 },
      { wch: 16 },
      { wch: 16 },
      { wch: 16 },
      { wch: 16 },
      { wch: 18 }
    ];
    XLSX.utils.book_append_sheet(workbook, wsOverview, 'Übersicht & Konten');

    // Sheet 2: Kategorien & Unterkategorien
    const categoryRows = [
      [
        'Kategorie',
        'Unterkategorie',
        'Buchungen',
        'Einnahmen (€)',
        'Ausgaben (€)',
        'Saldo (€)',
        `Vorjahr Einnahmen (${report.prevBounds.shortLabel})`,
        `Vorjahr Ausgaben (${report.prevBounds.shortLabel})`,
        `Vorjahr Saldo (${report.prevBounds.shortLabel})`
      ]
    ];
    report.categories.forEach((cat) => {
      categoryRows.push([
        cat.name,
        '(Gesamt)',
        cat.count,
        Number(cat.income.toFixed(2)),
        Number(cat.expense.toFixed(2)),
        Number(cat.net.toFixed(2)),
        Number(cat.prevIncome.toFixed(2)),
        Number(cat.prevExpense.toFixed(2)),
        Number(cat.prevNet.toFixed(2))
      ]);
      cat.subcategoriesList.forEach((sub) => {
        if (cat.subcategoriesList.length > 1 || sub.name !== 'Allgemein') {
          categoryRows.push([
            cat.name,
            `↳ ${sub.name}`,
            sub.count,
            Number(sub.income.toFixed(2)),
            Number(sub.expense.toFixed(2)),
            Number((sub.income - sub.expense).toFixed(2)),
            '',
            '',
            ''
          ]);
        }
      });
    });
    categoryRows.push([
      'GESAMTSUMME',
      '',
      report.regularCount,
      Number(report.income.toFixed(2)),
      Number(report.expense.toFixed(2)),
      Number(report.balance.toFixed(2)),
      Number(report.prevIncome.toFixed(2)),
      Number(report.prevExpense.toFixed(2)),
      Number(report.prevBalance.toFixed(2))
    ]);
    const wsCats = XLSX.utils.aoa_to_sheet(categoryRows);
    wsCats['!cols'] = [
      { wch: 28 },
      { wch: 24 },
      { wch: 12 },
      { wch: 16 },
      { wch: 16 },
      { wch: 16 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 }
    ];
    XLSX.utils.book_append_sheet(workbook, wsCats, 'Kategorien');

    // Sheet 3: Monatsverlauf & Quartale
    const monthlyRows = [
      [`QUARTALSÜBERSICHT ${year}`, 'Buchungen', 'Einnahmen (€)', 'Ausgaben (€)', 'Ergebnis (€)', 'Endbestand (€)'],
      ...report.quarters.map((q) => [
        `${q.label} (${q.rangeLabel})`,
        q.count,
        Number(q.income.toFixed(2)),
        Number(q.expense.toFixed(2)),
        Number(q.net.toFixed(2)),
        Number(q.closingBalance.toFixed(2))
      ]),
      [],
      [`MONATSVERLAUF ${year}`, 'Buchungen', 'Einnahmen (€)', 'Ausgaben (€)', 'Monatssaldo (€)', 'Kum. Bestand (€)'],
      ...report.months.map((m) => [
        m.name,
        m.count,
        Number(m.income.toFixed(2)),
        Number(m.expense.toFixed(2)),
        Number(m.net.toFixed(2)),
        Number(m.closingBalance.toFixed(2))
      ])
    ];
    const wsMonthly = XLSX.utils.aoa_to_sheet(monthlyRows);
    wsMonthly['!cols'] = [{ wch: 28 }, { wch: 12 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(workbook, wsMonthly, 'Monatsverlauf');

    // Sheet 4: Buchungsjournal
    const journalRows = [
      [
        'Datum',
        'Beleg-Nr.',
        'Akten-Nr.',
        'Typ',
        'Kategorie',
        'Unterkategorie',
        'Konto',
        'Kontakt',
        'Beschreibung',
        'Digitaler Beleg',
        'Betrag (€)'
      ],
      ...report.periodTransactions.map((trx) => [
        formatDateDE(trx.trxDate),
        trx.receipt_no || '',
        trx.file_no || '',
        trx.isTransit ? 'Geldtransit' : trx.type === 'income' ? 'Einnahme' : 'Ausgabe',
        trx.catName,
        trx.subName === 'Allgemein' ? '' : trx.subName,
        trx.accName,
        trx.contactName || '',
        trx.description || '',
        trx.hasDoc ? 'Ja' : 'Nein',
        Number((trx.type === 'income' ? trx.parsedAmount : -trx.parsedAmount).toFixed(2))
      ])
    ];
    const wsJournal = XLSX.utils.aoa_to_sheet(journalRows);
    wsJournal['!cols'] = [
      { wch: 12 },
      { wch: 14 },
      { wch: 12 },
      { wch: 12 },
      { wch: 22 },
      { wch: 18 },
      { wch: 18 },
      { wch: 22 },
      { wch: 36 },
      { wch: 14 },
      { wch: 14 }
    ];
    XLSX.utils.book_append_sheet(workbook, wsJournal, 'Buchungsjournal');

    const safeAcc = accountFilter !== 'all' ? `_${accountFilter.replace(/[^a-zA-Z0-9_-]/g, '_')}` : '';
    XLSX.writeFile(workbook, `Finanzbericht_${year}_${period}${safeAcc}.xlsx`);
  };

  // --- CSV EXPORT ---
  const exportToCSV = () => {
    const escapeCsv = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;
    const headers = [
      'Datum',
      'Beleg-Nr.',
      'Akten-Nr.',
      'Typ',
      'Kategorie',
      'Unterkategorie',
      'Konto',
      'Kontakt',
      'Beschreibung',
      'Digitaler Beleg',
      'Betrag (€)'
    ];
    const rows = report.periodTransactions.map((trx) => {
      const signed = trx.type === 'income' ? trx.parsedAmount : -trx.parsedAmount;
      return [
        formatDateDE(trx.trxDate),
        trx.receipt_no || '',
        trx.file_no || '',
        trx.isTransit ? 'Geldtransit' : trx.type === 'income' ? 'Einnahme' : 'Ausgabe',
        trx.catName,
        trx.subName === 'Allgemein' ? '' : trx.subName,
        trx.accName,
        trx.contactName || '',
        trx.description || '',
        trx.hasDoc ? 'Ja' : 'Nein',
        signed.toFixed(2).replace('.', ',')
      ]
        .map(escapeCsv)
        .join(';');
    });

    const csvContent = '\uFEFF' + [headers.map(escapeCsv).join(';'), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Buchungsjournal_${year}_${period}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const renderYoYBadge = (currentVal, prevVal, inverseColors = false) => {
    if (prevVal === 0 && currentVal === 0) {
      return <span className="text-[11px] text-slate-400">Vorjahr: 0,00 €</span>;
    }
    const diff = currentVal - prevVal;
    const isGood = inverseColors ? diff <= 0 : diff >= 0;
    const pctStr =
      prevVal !== 0 ? ` (${diff >= 0 ? '+' : ''}${((diff / Math.abs(prevVal)) * 100).toFixed(0)}%)` : '';
    return (
      <span className={`text-[11px] font-medium ${isGood ? 'text-emerald-700' : 'text-rose-700'}`}>
        vs. {report.prevBounds.shortLabel}: {formatSignedEuro(diff)}
        {pctStr}
      </span>
    );
  };

  const showSection = (sectionId) => activeSection === 'all' || activeSection === sectionId;

  return (
    <div className="space-y-6">
      {/* HEADER & FILTER BAR */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <FaChartPie className="text-blue-600" />
              Finanzbericht &amp; Jahresabschluss
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {report.bounds.label} · {accountFilter === 'all' ? 'Alle Konten (Kasse & Bank)' : `Konto: ${accountFilter}`} ·{' '}
              <span className="font-medium text-slate-700">{report.totalCount} Buchungen</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => printAnnualReport(false)}
              className="bg-slate-800 text-white px-3.5 py-2 rounded-lg text-sm font-semibold hover:bg-slate-900 transition flex items-center gap-2 shadow-sm"
            >
              <FaPrint /> Kassenbericht (A4)
            </button>
            <button
              type="button"
              onClick={() => printAnnualReport(true)}
              className="bg-indigo-600 text-white px-3.5 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition flex items-center gap-2 shadow-sm"
            >
              <FaPrint /> Prüfbericht + Journal
            </button>
            <button
              type="button"
              onClick={exportToExcel}
              className="bg-emerald-600 text-white px-3.5 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-700 transition flex items-center gap-2 shadow-sm"
            >
              <FaFileExcel /> Excel (.xlsx)
            </button>
            <button
              type="button"
              onClick={exportToCSV}
              className="bg-slate-100 text-slate-700 border border-slate-300 px-3.5 py-2 rounded-lg text-sm font-semibold hover:bg-slate-200 transition flex items-center gap-2"
            >
              <FaFileCsv /> CSV
            </button>
          </div>
        </div>

        {/* FILTER CONTROLS */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Geschäftsjahr
            </label>
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value, 10))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 font-semibold text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  Geschäftsjahr {y}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Zeitraum (Jahr / Quartal / Monat)
            </label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 font-semibold text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {PERIOD_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Konto-Filter
            </label>
            <select
              value={accountFilter}
              onChange={(e) => setAccountFilter(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 font-semibold text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Alle Konten (Gesamtübersicht)</option>
              {availableAccounts.map((acc) => (
                <option key={acc} value={acc}>
                  {acc}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* SECTION TABS */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-2">
          {SECTION_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSection(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                activeSection === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {fetchError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-4 flex items-center gap-3">
          <FaExclamationTriangle className="shrink-0" />
          <span className="text-sm font-medium">{fetchError}</span>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <FaSpinner className="animate-spin text-4xl mx-auto text-blue-600 mb-3" />
          <p className="text-sm text-slate-500 font-medium">Finanzdaten werden ausgewertet...</p>
        </div>
      ) : (
        <>
          {/* 5 KPI CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 tabular-nums">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
                <span>Anfangsbestand</span>
                <FaWallet className="text-slate-400" />
              </div>
              <div className="text-2xl font-extrabold text-slate-800 mt-2">
                {formatEuro(report.openingBalance)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Übertrag vor {formatDateDE(report.bounds.startDate)}
              </div>
            </div>

            <div className="bg-emerald-50/70 p-5 rounded-xl border border-emerald-200 shadow-sm">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-emerald-800">
                <span>Einnahmen</span>
                <FaArrowUp className="text-emerald-600" />
              </div>
              <div className="text-2xl font-extrabold text-emerald-700 mt-2">
                + {formatEuro(report.income)}
              </div>
              <div className="mt-1 flex flex-col gap-0.5">
                {renderYoYBadge(report.income, report.prevIncome, false)}
              </div>
            </div>

            <div className="bg-rose-50/70 p-5 rounded-xl border border-rose-200 shadow-sm">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-rose-800">
                <span>Ausgaben</span>
                <FaArrowDown className="text-rose-600" />
              </div>
              <div className="text-2xl font-extrabold text-rose-700 mt-2">
                - {formatEuro(report.expense)}
              </div>
              <div className="mt-1 flex flex-col gap-0.5">
                {renderYoYBadge(report.expense, report.prevExpense, true)}
              </div>
            </div>

            <div
              className={`p-5 rounded-xl border shadow-sm ${
                report.balance >= 0 ? 'bg-blue-50/70 border-blue-200' : 'bg-amber-50/70 border-amber-200'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-700">
                <span>Periodenergebnis</span>
                <FaBalanceScale className={report.balance >= 0 ? 'text-blue-600' : 'text-amber-600'} />
              </div>
              <div
                className={`text-2xl font-extrabold mt-2 ${
                  report.balance >= 0 ? 'text-blue-700' : 'text-amber-700'
                }`}
              >
                {formatSignedEuro(report.balance)}
              </div>
              <div className="text-[11px] text-slate-600 mt-1">
                {report.balance >= 0 ? 'Überschuss' : 'Fehlbetrag'}
                {report.expenseRatio !== null && ` · Ausgabenquote ${report.expenseRatio.toFixed(0)}%`}
              </div>
            </div>

            <div
              className={`p-5 rounded-xl border shadow-sm ${
                report.closingBalance >= 0
                  ? 'bg-indigo-50/70 border-indigo-200'
                  : 'bg-rose-50/70 border-rose-200'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-indigo-900">
                <span>Endbestand</span>
                <FaWallet className="text-indigo-600" />
              </div>
              <div
                className={`text-2xl font-extrabold mt-2 ${
                  report.closingBalance >= 0 ? 'text-indigo-700' : 'text-rose-700'
                }`}
              >
                {formatEuro(report.closingBalance)}
              </div>
              <div className="text-[11px] text-indigo-700/80 mt-1">
                Stichtag {formatDateDE(report.bounds.endDate)}
              </div>
            </div>
          </div>

          {/* RECONCILIATION FORMULA STRIP */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 tabular-nums">
            <div className="flex flex-wrap items-center gap-2">
              <FaInfoCircle className="text-blue-500 shrink-0" />
              <span>
                <strong>Bestandsrechnung:</strong> {formatEuro(report.openingBalance)} (Anfangsbestand){' '}
                {report.balance >= 0 ? '+' : ''} {formatEuro(report.balance)} (Ergebnis)
                {Math.abs(report.transitNet) >= 0.01 && (
                  <> {report.transitNet >= 0 ? '+' : ''} {formatEuro(report.transitNet)} (Geldtransit)</>
                )}{' '}
                = <strong className="text-slate-900">{formatEuro(report.closingBalance)}</strong>
              </span>
            </div>
            {accountFilter !== 'all' && (
              <button
                type="button"
                onClick={() => setAccountFilter('all')}
                className="text-blue-600 font-semibold hover:underline"
              >
                Konto-Filter zurücksetzen ({accountFilter})
              </button>
            )}
          </div>

          {/* SECTION A: KONTENABSTIMMUNG & DARLEHEN */}
          {showSection('accounts') && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <FaWallet className="text-blue-600" />
                    Kontenabstimmung (Bank &amp; Barkasse)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Anfangs- und Endbestände je Konto inklusive erfolgsneutraler Umbuchungen (Geldtransit Kasse ↔ Bank).
                  </p>
                </div>
                {report.loan.openBalance !== 0 && (
                  <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 text-xs text-amber-900">
                    <FaLandmark className="text-amber-600" />
                    <span>
                      Offenes Darlehen (Stand {formatDateDE(report.bounds.endDate)}):{' '}
                      <strong>{formatEuro(report.loan.openBalance)}</strong>
                    </span>
                  </div>
                )}
              </div>

              {report.accounts.length === 0 ? (
                <p className="text-sm text-slate-500 italic">Keine Kontobewegungen im gewählten Zeitraum.</p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="min-w-full divide-y divide-slate-200 text-sm tabular-nums">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-600">Konto</th>
                        <th className="px-4 py-3 text-right text-xs font-bold uppercase text-slate-600">Anfangsbestand</th>
                        <th className="px-4 py-3 text-right text-xs font-bold uppercase text-emerald-700">Einnahmen (+)</th>
                        <th className="px-4 py-3 text-right text-xs font-bold uppercase text-rose-700">Ausgaben (−)</th>
                        <th className="px-4 py-3 text-right text-xs font-bold uppercase text-slate-600">Geldtransit</th>
                        <th className="px-4 py-3 text-right text-xs font-bold uppercase text-slate-600">Veränderung</th>
                        <th className="px-4 py-3 text-right text-xs font-bold uppercase text-blue-700">Endbestand</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {report.accounts.map((acc) => {
                        const isBank = isBankAccountName(acc.name);
                        return (
                          <tr key={acc.name} className="hover:bg-slate-50">
                            <td className="px-4 py-3 font-semibold text-slate-800 flex items-center gap-2">
                              {isBank ? (
                                <FaLandmark className="text-indigo-600 shrink-0" />
                              ) : (
                                <FaMoneyBillWave className="text-emerald-600 shrink-0" />
                              )}
                              <span>{acc.name}</span>
                            </td>
                            <td className="px-4 py-3 text-right text-slate-600">{formatEuro(acc.openingBalance)}</td>
                            <td className="px-4 py-3 text-right text-emerald-600 font-medium">
                              + {formatEuro(acc.regularIncome)}
                            </td>
                            <td className="px-4 py-3 text-right text-rose-600 font-medium">
                              - {formatEuro(acc.regularExpense)}
                            </td>
                            <td className="px-4 py-3 text-right text-slate-600">
                              {Math.abs(acc.netTransit) < 0.01 ? '0,00 €' : formatSignedEuro(acc.netTransit)}
                            </td>
                            <td
                              className={`px-4 py-3 text-right font-semibold ${
                                acc.netChange >= 0 ? 'text-emerald-700' : 'text-rose-700'
                              }`}
                            >
                              {formatSignedEuro(acc.netChange)}
                            </td>
                            <td
                              className={`px-4 py-3 text-right font-extrabold ${
                                acc.closingBalance >= 0 ? 'text-blue-700' : 'text-rose-700'
                              }`}
                            >
                              {formatEuro(acc.closingBalance)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-bold">
                      <tr>
                        <td className="px-4 py-3 text-slate-900">Summe Konten</td>
                        <td className="px-4 py-3 text-right text-slate-800">{formatEuro(report.openingBalance)}</td>
                        <td className="px-4 py-3 text-right text-emerald-700">+ {formatEuro(report.income)}</td>
                        <td className="px-4 py-3 text-right text-rose-700">- {formatEuro(report.expense)}</td>
                        <td className="px-4 py-3 text-right text-slate-700">{formatSignedEuro(report.transitNet)}</td>
                        <td
                          className={`px-4 py-3 text-right ${
                            report.balance + report.transitNet >= 0 ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {formatSignedEuro(report.balance + report.transitNet)}
                        </td>
                        <td className="px-4 py-3 text-right text-blue-800">{formatEuro(report.closingBalance)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <FaExchangeAlt className="text-slate-400" />
                  Geldtransit-Umbuchungen verändern den Bestand einzelner Konten, bleiben aber im Vereinsergebnis erfolgsneutral.
                </span>
                {(report.loan.periodTaken > 0 || report.loan.periodRepaid > 0) && (
                  <span>
                    Darlehen im Zeitraum: Aufnahme {formatEuro(report.loan.periodTaken)} · Tilgung{' '}
                    {formatEuro(report.loan.periodRepaid)}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* SECTION B: KATEGORIEN & DRILL-DOWN */}
          {showSection('categories') && (
            <div className="space-y-6">
              {/* Visual Split Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Einnahmen-Struktur */}
                <div className="bg-white rounded-xl shadow-sm border border-emerald-200 p-6">
                  <div className="flex items-center justify-between border-b border-emerald-100 pb-3 mb-4">
                    <div>
                      <h3 className="text-base font-bold text-emerald-800">Einnahmen-Struktur</h3>
                      <p className="text-xs text-slate-500">
                        {report.incomeCategories.length} Kategorien · Anteil an Gesamteinnahmen
                      </p>
                    </div>
                    <span className="text-lg font-extrabold text-emerald-700 tabular-nums">
                      + {formatEuro(report.income)}
                    </span>
                  </div>

                  {report.incomeCategories.length === 0 ? (
                    <p className="text-sm text-slate-400 italic py-4 text-center">Keine Einnahmen im Zeitraum</p>
                  ) : (
                    <div className="space-y-3.5">
                      {report.incomeCategories.map((cat) => {
                        const pct = report.income > 0 ? (cat.income / report.income) * 100 : 0;
                        const subs = cat.subcategoriesList.filter(
                          (s) => s.income > 0 && s.name !== 'Allgemein'
                        );
                        return (
                          <div key={`inc-${cat.name}`} className="group">
                            <div className="flex items-baseline justify-between text-sm gap-2">
                              <button
                                type="button"
                                onClick={() => toggleCategory(cat.name)}
                                className="font-semibold text-slate-800 hover:text-blue-600 text-left truncate"
                              >
                                {cat.name}{' '}
                                <span className="text-xs font-normal text-slate-400">({cat.incomeCount})</span>
                              </button>
                              <div className="flex items-baseline gap-2 shrink-0 tabular-nums">
                                <span className="text-xs text-slate-400">{pct.toFixed(1)}%</span>
                                <span className="font-bold text-emerald-700">{formatEuro(cat.income)}</span>
                              </div>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mt-1">
                              <div
                                className="h-full bg-emerald-500 rounded-full transition-all"
                                style={{ width: `${Math.max(pct, 1.5)}%` }}
                              />
                            </div>
                            <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                              <div className="flex flex-wrap gap-1.5">
                                {subs.map((s) => (
                                  <span
                                    key={s.name}
                                    className="text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-100 px-2 py-0.5 rounded-full"
                                  >
                                    ↳ {s.name}: {formatEuro(s.income)}
                                  </span>
                                ))}
                              </div>
                              {cat.prevIncome > 0 && (
                                <span className="text-[11px] text-slate-400 tabular-nums">
                                  Vorjahr: {formatEuro(cat.prevIncome)}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Ausgaben-Struktur */}
                <div className="bg-white rounded-xl shadow-sm border border-rose-200 p-6">
                  <div className="flex items-center justify-between border-b border-rose-100 pb-3 mb-4">
                    <div>
                      <h3 className="text-base font-bold text-rose-800">Ausgaben-Struktur</h3>
                      <p className="text-xs text-slate-500">
                        {report.expenseCategories.length} Kategorien · Anteil an Gesamtausgaben
                      </p>
                    </div>
                    <span className="text-lg font-extrabold text-rose-700 tabular-nums">
                      - {formatEuro(report.expense)}
                    </span>
                  </div>

                  {report.expenseCategories.length === 0 ? (
                    <p className="text-sm text-slate-400 italic py-4 text-center">Keine Ausgaben im Zeitraum</p>
                  ) : (
                    <div className="space-y-3.5">
                      {report.expenseCategories.map((cat) => {
                        const pct = report.expense > 0 ? (cat.expense / report.expense) * 100 : 0;
                        const subs = cat.subcategoriesList.filter(
                          (s) => s.expense > 0 && s.name !== 'Allgemein'
                        );
                        return (
                          <div key={`exp-${cat.name}`} className="group">
                            <div className="flex items-baseline justify-between text-sm gap-2">
                              <button
                                type="button"
                                onClick={() => toggleCategory(cat.name)}
                                className="font-semibold text-slate-800 hover:text-blue-600 text-left truncate"
                              >
                                {cat.name}{' '}
                                <span className="text-xs font-normal text-slate-400">({cat.expenseCount})</span>
                              </button>
                              <div className="flex items-baseline gap-2 shrink-0 tabular-nums">
                                <span className="text-xs text-slate-400">{pct.toFixed(1)}%</span>
                                <span className="font-bold text-rose-700">{formatEuro(cat.expense)}</span>
                              </div>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mt-1">
                              <div
                                className="h-full bg-rose-500 rounded-full transition-all"
                                style={{ width: `${Math.max(pct, 1.5)}%` }}
                              />
                            </div>
                            <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                              <div className="flex flex-wrap gap-1.5">
                                {subs.map((s) => (
                                  <span
                                    key={s.name}
                                    className="text-[11px] bg-rose-50 text-rose-800 border border-rose-100 px-2 py-0.5 rounded-full"
                                  >
                                    ↳ {s.name}: {formatEuro(s.expense)}
                                  </span>
                                ))}
                              </div>
                              {cat.prevExpense > 0 && (
                                <span className="text-[11px] text-slate-400 tabular-nums">
                                  Vorjahr: {formatEuro(cat.prevExpense)}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Combined Interactive Drill-Down Table */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Aufschlüsselung nach Kategorien &amp; Einzelbuchungen
                    </h3>
                    <p className="text-xs text-slate-500">
                      Klicken Sie auf eine Kategoriezeile, um Unterkategorien und alle zugehörigen Einzelbuchungen einzublenden.
                    </p>
                  </div>
                  {report.categories.length > 0 && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={expandAllCategories}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                      >
                        Alle aufklappen
                      </button>
                      <button
                        type="button"
                        onClick={collapseAllCategories}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                      >
                        Alle zuklappen
                      </button>
                    </div>
                  )}
                </div>

                {report.categories.length === 0 ? (
                  <p className="text-sm text-slate-500 italic py-4 text-center">
                    Keine Buchungen in den Kategorien für den gewählten Zeitraum gefunden.
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="min-w-full divide-y divide-slate-200 text-sm tabular-nums">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-600">
                            Kategorie / Unterkategorie
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-bold uppercase text-slate-600">
                            Buchungen
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-bold uppercase text-emerald-700">
                            Einnahmen
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-bold uppercase text-rose-700">
                            Ausgaben
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-bold uppercase text-slate-700">
                            Saldo
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-bold uppercase text-slate-500">
                            Vorjahr ({report.prevBounds.shortLabel})
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {report.categories.map((cat) => {
                          const isExpanded = Boolean(expandedCategories[cat.name]);
                          const showSubSummary =
                            cat.subcategoriesList.length > 1 ||
                            (cat.subcategoriesList.length === 1 && cat.subcategoriesList[0].name !== 'Allgemein');

                          return (
                            <React.Fragment key={cat.name}>
                              <tr
                                onClick={() => toggleCategory(cat.name)}
                                className="hover:bg-blue-50/40 cursor-pointer transition-colors"
                              >
                                <td className="px-4 py-3 font-semibold text-slate-900 flex items-center gap-2">
                                  {isExpanded ? (
                                    <FaChevronDown className="text-blue-600 text-xs shrink-0" />
                                  ) : (
                                    <FaChevronRight className="text-slate-400 text-xs shrink-0" />
                                  )}
                                  <span>{cat.name}</span>
                                </td>
                                <td className="px-4 py-3 text-center text-slate-500">{cat.count}</td>
                                <td className="px-4 py-3 text-right text-emerald-600 font-medium">
                                  {cat.income > 0 ? `+ ${formatEuro(cat.income)}` : '–'}
                                </td>
                                <td className="px-4 py-3 text-right text-rose-600 font-medium">
                                  {cat.expense > 0 ? `- ${formatEuro(cat.expense)}` : '–'}
                                </td>
                                <td
                                  className={`px-4 py-3 text-right font-bold ${
                                    cat.net >= 0 ? 'text-slate-900' : 'text-rose-700'
                                  }`}
                                >
                                  {formatSignedEuro(cat.net)}
                                </td>
                                <td className="px-4 py-3 text-right text-xs text-slate-500">
                                  {cat.prevIncome > 0 || cat.prevExpense > 0
                                    ? formatSignedEuro(cat.prevNet)
                                    : '–'}
                                </td>
                              </tr>

                              {isExpanded && (
                                <tr className="bg-slate-50/90">
                                  <td colSpan={6} className="px-6 py-4">
                                    {showSubSummary && (
                                      <div className="mb-3 flex flex-wrap gap-2">
                                        {cat.subcategoriesList.map((sub) => (
                                          <span
                                            key={sub.name}
                                            className="inline-flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700"
                                          >
                                            <span className="font-semibold">{sub.name}</span>
                                            <span className="text-slate-400">({sub.count}):</span>
                                            <span
                                              className={`font-bold ${
                                                sub.income - sub.expense >= 0 ? 'text-emerald-700' : 'text-rose-700'
                                              }`}
                                            >
                                              {formatSignedEuro(sub.income - sub.expense)}
                                            </span>
                                          </span>
                                        ))}
                                      </div>
                                    )}

                                    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                                      <table className="min-w-full divide-y divide-slate-100 text-xs tabular-nums">
                                        <thead className="bg-slate-100 text-slate-600">
                                          <tr>
                                            <th className="px-3 py-2 text-left font-bold">Datum</th>
                                            <th className="px-3 py-2 text-left font-bold">Beleg-Nr.</th>
                                            <th className="px-3 py-2 text-left font-bold">Unterkategorie</th>
                                            <th className="px-3 py-2 text-left font-bold">Kontakt</th>
                                            <th className="px-3 py-2 text-left font-bold">Beschreibung</th>
                                            <th className="px-3 py-2 text-left font-bold">Konto</th>
                                            <th className="px-3 py-2 text-right font-bold">Betrag</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                          {cat.transactions.map((tx) => (
                                            <tr key={tx.id} className="hover:bg-slate-50">
                                              <td className="px-3 py-2 whitespace-nowrap text-slate-600">
                                                {formatDateDE(tx.date)}
                                              </td>
                                              <td className="px-3 py-2 whitespace-nowrap text-slate-500">
                                                {tx.receipt_no || <span className="text-amber-600">fehlt</span>}
                                              </td>
                                              <td className="px-3 py-2 text-slate-600">
                                                {tx.subName === 'Allgemein' ? '–' : tx.subName}
                                              </td>
                                              <td className="px-3 py-2 text-slate-700">{tx.contactName || '–'}</td>
                                              <td className="px-3 py-2 text-slate-700">{tx.description || '–'}</td>
                                              <td className="px-3 py-2 whitespace-nowrap text-slate-500">{tx.accName}</td>
                                              <td
                                                className={`px-3 py-2 text-right font-bold whitespace-nowrap ${
                                                  tx.type === 'income' ? 'text-emerald-700' : 'text-rose-700'
                                                }`}
                                              >
                                                {tx.type === 'income' ? '+' : '-'} {formatEuro(tx.amount)}
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                      <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-bold">
                        <tr>
                          <td className="px-4 py-3 text-slate-900">Gesamtsumme (ohne Geldtransit)</td>
                          <td className="px-4 py-3 text-center text-slate-700">{report.regularCount}</td>
                          <td className="px-4 py-3 text-right text-emerald-700">+ {formatEuro(report.income)}</td>
                          <td className="px-4 py-3 text-right text-rose-700">- {formatEuro(report.expense)}</td>
                          <td
                            className={`px-4 py-3 text-right ${
                              report.balance >= 0 ? 'text-blue-700' : 'text-rose-700'
                            }`}
                          >
                            {formatSignedEuro(report.balance)}
                          </td>
                          <td className="px-4 py-3 text-right text-xs text-slate-600">
                            {formatSignedEuro(report.prevBalance)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECTION C: MONATS- & QUARTALSVERLAUF */}
          {showSection('monthly') && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <FaChartBar className="text-blue-600" />
                  Monats- &amp; Quartalsverlauf {year}
                </h3>
                <p className="text-xs text-slate-500">
                  Zeitliche Entwicklung der Einnahmen, Ausgaben und des kumulierten Bestands im Geschäftsjahr {year}{' '}
                  (Anfangsbestand am 01.01.{year}: {formatEuro(report.yearOpeningBalance)}).
                </p>
              </div>

              {/* 4 Quarter Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 tabular-nums">
                {report.quarters.map((q) => {
                  const isActiveQuarter = period === q.key;
                  return (
                    <button
                      key={q.key}
                      type="button"
                      onClick={() => setPeriod(isActiveQuarter ? 'all' : q.key)}
                      className={`text-left p-4 rounded-xl border transition ${
                        isActiveQuarter
                          ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-200'
                          : 'bg-slate-50/70 border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                          <FaCalendarAlt className="text-blue-500" />
                          {q.label}
                        </span>
                        <span className="text-[11px] text-slate-400">{q.rangeLabel}</span>
                      </div>
                      <div
                        className={`text-lg font-extrabold mt-2 ${
                          q.net >= 0 ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {formatSignedEuro(q.net)}
                      </div>
                      <div className="mt-2 pt-2 border-t border-slate-200/80 text-xs space-y-0.5 text-slate-600">
                        <div className="flex justify-between">
                          <span>Einnahmen:</span>
                          <span className="text-emerald-700 font-semibold">+ {formatEuro(q.income)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Ausgaben:</span>
                          <span className="text-rose-700 font-semibold">- {formatEuro(q.expense)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Endbestand:</span>
                          <span className="text-blue-700 font-bold">{formatEuro(q.closingBalance)}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* 12-Month Table + Visual Bars */}
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-sm tabular-nums">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-600">Monat</th>
                      <th className="px-4 py-3 text-center text-xs font-bold uppercase text-slate-600">Buchungen</th>
                      <th className="px-4 py-3 text-right text-xs font-bold uppercase text-emerald-700">Einnahmen</th>
                      <th className="px-4 py-3 text-right text-xs font-bold uppercase text-rose-700">Ausgaben</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500 min-w-[180px]">
                        Verhältnis (Einn. / Ausg.)
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-bold uppercase text-slate-700">Monatssaldo</th>
                      <th className="px-4 py-3 text-right text-xs font-bold uppercase text-blue-700">Kum. Bestand</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {report.months.map((m) => {
                      const incWidth = m.income > 0 ? Math.max((m.income / report.maxMonthBar) * 100, 3) : 0;
                      const expWidth = m.expense > 0 ? Math.max((m.expense / report.maxMonthBar) * 100, 3) : 0;
                      const isSelectedMonth = period === m.key;

                      return (
                        <tr
                          key={m.key}
                          onClick={() => setPeriod(isSelectedMonth ? 'all' : m.key)}
                          className={`cursor-pointer transition-colors ${
                            isSelectedMonth ? 'bg-blue-50/70' : 'hover:bg-slate-50'
                          }`}
                        >
                          <td className="px-4 py-2.5 font-semibold text-slate-800">{m.name}</td>
                          <td className="px-4 py-2.5 text-center text-slate-500">{m.count}</td>
                          <td className="px-4 py-2.5 text-right text-emerald-600 font-medium">
                            {m.income > 0 ? `+ ${formatEuro(m.income)}` : '–'}
                          </td>
                          <td className="px-4 py-2.5 text-right text-rose-600 font-medium">
                            {m.expense > 0 ? `- ${formatEuro(m.expense)}` : '–'}
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="space-y-1">
                              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-emerald-500 rounded-full"
                                  style={{ width: `${incWidth}%` }}
                                />
                              </div>
                              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-rose-500 rounded-full"
                                  style={{ width: `${expWidth}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td
                            className={`px-4 py-2.5 text-right font-bold ${
                              m.net > 0 ? 'text-emerald-700' : m.net < 0 ? 'text-rose-700' : 'text-slate-400'
                            }`}
                          >
                            {m.income === 0 && m.expense === 0 ? '–' : formatSignedEuro(m.net)}
                          </td>
                          <td className="px-4 py-2.5 text-right font-bold text-blue-700">
                            {formatEuro(m.closingBalance)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SECTION D: KASSENPRÜFER-CHECK & BUCHUNGSJOURNAL */}
          {showSection('audit') && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <FaListUl className="text-blue-600" />
                  Kassenprüfer-Check &amp; Buchungsjournal
                </h3>
                <p className="text-xs text-slate-500">
                  Belegvollständigkeit, Geldtransit-Kontrolle und durchsuchbares Buchungsjournal für die Kassenprüfung.
                </p>
              </div>

              {/* 4 Audit Readiness Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 tabular-nums">
                <button
                  type="button"
                  onClick={() => handleAuditShortcut('missing_receipt')}
                  className="text-left p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:border-blue-300 transition"
                >
                  <div className="flex items-center justify-between text-xs font-bold uppercase text-slate-600">
                    <span>Belegnummern-Quote</span>
                    {report.audit.missingReceiptCount === 0 ? (
                      <FaCheckCircle className="text-emerald-600" />
                    ) : (
                      <FaExclamationTriangle className="text-amber-500" />
                    )}
                  </div>
                  <div className="text-2xl font-extrabold text-slate-900 mt-2">
                    {report.audit.receiptCoverage}%
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full mt-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        report.audit.missingReceiptCount === 0 ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${report.audit.receiptCoverage}%` }}
                    />
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1.5">
                    {report.audit.missingReceiptCount === 0
                      ? 'Alle Buchungen haben eine Beleg-Nr.'
                      : `${report.audit.missingReceiptCount} Buchung(en) ohne Beleg-Nr.`}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleAuditShortcut('missing_doc')}
                  className="text-left p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:border-blue-300 transition"
                >
                  <div className="flex items-center justify-between text-xs font-bold uppercase text-slate-600">
                    <span>Digitale Belege</span>
                    {report.audit.missingDocCount === 0 ? (
                      <FaCheckCircle className="text-emerald-600" />
                    ) : (
                      <FaExclamationTriangle className="text-amber-500" />
                    )}
                  </div>
                  <div className="text-2xl font-extrabold text-slate-900 mt-2">
                    {report.audit.docCoverage}%
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full mt-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        report.audit.missingDocCount === 0 ? 'bg-emerald-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${report.audit.docCoverage}%` }}
                    />
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1.5">
                    {report.audit.missingDocCount === 0
                      ? 'Alle Buchungen digital belegt'
                      : `${report.audit.missingDocCount} Buchung(en) ohne Upload`}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleAuditShortcut('geldtransit')}
                  className={`text-left p-4 rounded-xl border transition ${
                    report.audit.isTransitBalanced
                      ? 'border-emerald-200 bg-emerald-50/50 hover:border-emerald-300'
                      : 'border-amber-200 bg-amber-50/70 hover:border-amber-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold uppercase text-slate-700">
                    <span>Geldtransit-Prüfung</span>
                    {report.audit.isTransitBalanced ? (
                      <FaCheckCircle className="text-emerald-600" />
                    ) : (
                      <FaExclamationTriangle className="text-amber-600" />
                    )}
                  </div>
                  <div
                    className={`text-xl font-extrabold mt-2 ${
                      report.audit.isTransitBalanced ? 'text-emerald-700' : 'text-amber-800'
                    }`}
                  >
                    {report.audit.isTransitBalanced ? 'Ausgeglichen' : formatSignedEuro(report.audit.globalTransitDiff)}
                  </div>
                  <div className="text-[11px] text-slate-600 mt-1.5 space-y-0.5">
                    <div>Zugang: {formatEuro(report.audit.globalTransitIn)}</div>
                    <div>Abgang: {formatEuro(report.audit.globalTransitOut)}</div>
                  </div>
                </button>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70">
                  <div className="text-xs font-bold uppercase text-slate-600">Spitzenwerte im Zeitraum</div>
                  <div className="mt-2 space-y-2 text-xs">
                    <div>
                      <span className="text-slate-500">Größte Einnahme:</span>{' '}
                      {report.audit.largestIncome ? (
                        <div className="font-bold text-emerald-700">
                          + {formatEuro(report.audit.largestIncome.amount)}{' '}
                          <span className="font-normal text-slate-500">
                            ({report.audit.largestIncome.category}, {formatDateDE(report.audit.largestIncome.date)})
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400">–</span>
                      )}
                    </div>
                    <div>
                      <span className="text-slate-500">Größte Ausgabe:</span>{' '}
                      {report.audit.largestExpense ? (
                        <div className="font-bold text-rose-700">
                          - {formatEuro(report.audit.largestExpense.amount)}{' '}
                          <span className="font-normal text-slate-500">
                            ({report.audit.largestExpense.category}, {formatDateDE(report.audit.largestExpense.date)})
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400">–</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Search & Filter Bar for Journal */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-2 border-t border-slate-100">
                <div className="relative flex-1 max-w-md">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                  <input
                    type="text"
                    value={journalSearch}
                    onChange={(e) => setJournalSearch(e.target.value)}
                    placeholder="Suche nach Beschreibung, Beleg-Nr., Kontakt, Kategorie..."
                    className="w-full pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'all', label: `Alle (${report.totalCount})` },
                    { key: 'missing_receipt', label: `Ohne Beleg-Nr. (${report.audit.missingReceiptCount})` },
                    { key: 'missing_doc', label: `Ohne Beleg-Datei (${report.audit.missingDocCount})` },
                    { key: 'geldtransit', label: `Geldtransit (${report.transitCount})` }
                  ].map((f) => (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => setJournalFilter(f.key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        journalFilter === f.key
                          ? 'bg-slate-800 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Journal Table */}
              <div className="overflow-x-auto rounded-lg border border-slate-200 max-h-[520px] overflow-y-auto">
                <table className="min-w-full divide-y divide-slate-200 text-xs sm:text-sm tabular-nums">
                  <thead className="bg-slate-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-3 py-2.5 text-left text-xs font-bold uppercase text-slate-600">Datum</th>
                      <th className="px-3 py-2.5 text-left text-xs font-bold uppercase text-slate-600">Beleg-Nr.</th>
                      <th className="px-3 py-2.5 text-left text-xs font-bold uppercase text-slate-600">Kategorie</th>
                      <th className="px-3 py-2.5 text-left text-xs font-bold uppercase text-slate-600">
                        Beschreibung &amp; Kontakt
                      </th>
                      <th className="px-3 py-2.5 text-left text-xs font-bold uppercase text-slate-600">Konto</th>
                      <th className="px-3 py-2.5 text-center text-xs font-bold uppercase text-slate-600">Beleg</th>
                      <th className="px-3 py-2.5 text-right text-xs font-bold uppercase text-slate-600">Betrag</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredJournalTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-slate-400 italic">
                          Keine passenden Buchungen gefunden.
                        </td>
                      </tr>
                    ) : (
                      filteredJournalTransactions.map((trx) => (
                        <tr key={trx.id} className="hover:bg-slate-50">
                          <td className="px-3 py-2.5 whitespace-nowrap text-slate-600">
                            {formatDateDE(trx.trxDate)}
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            {trx.hasReceiptNo ? (
                              <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                                {trx.receipt_no}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                                Fehlt
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="font-semibold text-slate-800">{trx.catName}</div>
                            {trx.subName !== 'Allgemein' && (
                              <div className="text-[11px] text-slate-500">↳ {trx.subName}</div>
                            )}
                          </td>
                          <td className="px-3 py-2.5 max-w-xs">
                            <div className="text-slate-800">{trx.description || '–'}</div>
                            {trx.contactName && (
                              <div className="text-[11px] text-slate-500">{trx.contactName}</div>
                            )}
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap text-slate-600">{trx.accName}</td>
                          <td className="px-3 py-2.5 text-center whitespace-nowrap">
                            {trx.hasDoc ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                                <FaCheckCircle /> {trx.docCount > 1 ? `${trx.docCount} Dateien` : 'Vorhanden'}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                Fehlt
                              </span>
                            )}
                          </td>
                          <td
                            className={`px-3 py-2.5 text-right font-bold whitespace-nowrap ${
                              trx.isTransit
                                ? 'text-slate-600'
                                : trx.type === 'income'
                                ? 'text-emerald-700'
                                : 'text-rose-700'
                            }`}
                          >
                            {trx.type === 'income' ? '+' : '-'} {formatEuro(trx.parsedAmount)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
