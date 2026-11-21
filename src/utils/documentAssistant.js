// Client-side Smart Document Assistant (PDF text extraction + Tesseract OCR + field parser)
// Runs completely in the browser without modifying backend schemas or existing accounting flows.

const PDFJS_CDN_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
const PDFJS_WORKER_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
const TESSERACT_CDN_URL = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';

const scriptPromises = {};

function loadExternalScript(src) {
  if (scriptPromises[src]) return scriptPromises[src];

  scriptPromises[src] = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing && existing.dataset.loaded === 'true') {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => {
      script.dataset.loaded = 'true';
      resolve();
    };
    script.onerror = () => {
      delete scriptPromises[src];
      reject(new Error(`Kütüphane yüklenemedi: ${src}`));
    };
    document.head.appendChild(script);
  });

  return scriptPromises[src];
}

async function ensurePdfJs() {
  if (!window.pdfjsLib) {
    await loadExternalScript(PDFJS_CDN_URL);
  }
  if (!window.pdfjsLib) {
    throw new Error('PDF okuyucu yüklenemedi. Lütfen internet bağlantınızı kontrol edin.');
  }
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;
  return window.pdfjsLib;
}

async function ensureTesseract() {
  if (!window.Tesseract) {
    await loadExternalScript(TESSERACT_CDN_URL);
  }
  if (!window.Tesseract) {
    throw new Error('OCR motoru yüklenemedi. Lütfen internet bağlantınızı kontrol edin.');
  }
  return window.Tesseract;
}

async function runOcrOnSource(source, onProgress, labelPrefix = 'Görsel okunuyor') {
  onProgress?.(`${labelPrefix} (OCR hazırlanıyor)...`);
  const Tesseract = await ensureTesseract();
  const result = await Tesseract.recognize(source, 'deu', {
    logger: (msg) => {
      if (msg.status === 'recognizing text' && typeof msg.progress === 'number') {
        const pct = Math.round(msg.progress * 100);
        onProgress?.(`${labelPrefix} (OCR %${pct})...`);
      }
    }
  });
  return result?.data?.text || '';
}

function groupPdfItemsIntoLines(items = []) {
  const rows = new Map();
  items.forEach((item) => {
    const str = (item.str || '').trim();
    if (!str) return;
    const x = item.transform?.[4] ?? 0;
    const y = item.transform?.[5] ?? 0;
    const rowKey = Math.round(y / 4) * 4;
    if (!rows.has(rowKey)) rows.set(rowKey, []);
    rows.get(rowKey).push({ x, str });
  });

  return Array.from(rows.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([, cells]) =>
      cells
        .sort((a, b) => a.x - b.x)
        .map((c) => c.str)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()
    )
    .filter(Boolean)
    .join('\n');
}

export async function extractTextFromFile(fileOrBlob, fileName = '', onProgress) {
  if (!fileOrBlob) return '';
  const lowerName = (fileName || fileOrBlob.name || '').toLowerCase();
  const mime = (fileOrBlob.type || '').toLowerCase();
  const isPdf = mime === 'application/pdf' || lowerName.endsWith('.pdf');

  if (isPdf) {
    onProgress?.('PDF metni okunuyor...');
    const pdfjsLib = await ensurePdfJs();
    const arrayBuffer = await fileOrBlob.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    const maxPages = Math.min(pdf.numPages || 1, 3);
    const pageTexts = [];
    for (let pageNum = 1; pageNum <= maxPages; pageNum += 1) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = groupPdfItemsIntoLines(textContent.items);
      if (pageText) pageTexts.push(pageText);
    }

    const combinedText = pageTexts.join('\n');
    if (combinedText.replace(/\s+/g, '').length >= 30) {
      return combinedText;
    }

    // Scanned PDF fallback: render page 1 onto offscreen canvas and run OCR
    onProgress?.('Taranmış PDF tespit edildi, OCR başlatılıyor...');
    const page1 = await pdf.getPage(1);
    const viewport = page1.getViewport({ scale: 2.0 });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');

    try {
      await page1.render({ canvasContext: ctx, viewport }).promise;
      const imageDataUrl = canvas.toDataURL('image/png');
      return await runOcrOnSource(imageDataUrl, onProgress, 'Taranmış PDF okunuyor');
    } finally {
      canvas.width = 0;
      canvas.height = 0;
    }
  }

  return runOcrOnSource(fileOrBlob, onProgress, 'Görsel okunuyor');
}

const normalizeSearch = (value = '') =>
  String(value)
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/ğ/g, 'g')
    .replace(/ı/g, 'i')
    .replace(/ş/g, 's')
    .replace(/ç/g, 'c')
    .trim();

const KNOWN_VENDORS = [
  'Aldi Süd',
  'Aldi Nord',
  'Aldi',
  'Lidl',
  'Rewe',
  'Edeka',
  'Kaufland',
  'Penny',
  'Netto',
  'Norma',
  'Rossmann',
  'dm-drogerie markt',
  'dm',
  'Müller',
  'Action',
  'TEDi',
  'KiK',
  'Woolworth',
  'IKEA',
  'OBI',
  'Bauhaus',
  'Hornbach',
  'Toom',
  'Hagebau',
  'MediaMarkt',
  'Saturn',
  'Amazon',
  'eBay',
  'PayPal',
  'Deutsche Telekom',
  'Telekom',
  'Vodafone',
  'O2',
  '1&1',
  'Congstar',
  'Sparkasse',
  'Volksbank',
  'Postbank',
  'Commerzbank',
  'Deutsche Bank',
  'Deutsche Post',
  'DHL',
  'Hermes',
  'DPD',
  'Stadtwerke',
  'Finanzamt',
  'Allianz',
  'Metro',
  'Selgros',
  'Aral',
  'Shell',
  'Esso',
  'Total',
  'BackWerk',
  'Kamps'
];

const GERMAN_MONTHS = {
  januar: 1,
  jan: 1,
  februar: 2,
  feb: 2,
  maerz: 3,
  mrz: 3,
  april: 4,
  apr: 4,
  mai: 5,
  juni: 6,
  jun: 6,
  juli: 7,
  jul: 7,
  august: 8,
  aug: 8,
  september: 9,
  sep: 9,
  sept: 9,
  oktober: 10,
  okt: 10,
  november: 11,
  nov: 11,
  dezember: 12,
  dez: 12
};

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildValidIsoDate(yearInput, monthInput, dayInput) {
  let year = Number(yearInput);
  const month = Number(monthInput);
  const day = Number(dayInput);

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
  if (year < 100) year += year <= 50 ? 2000 : 1900;
  if (year < 2015 || year > 2030 || month < 1 || month > 12 || day < 1 || day > 31) return null;

  const testDate = new Date(Date.UTC(year, month - 1, day));
  if (
    testDate.getUTCFullYear() !== year ||
    testDate.getUTCMonth() !== month - 1 ||
    testDate.getUTCDate() !== day
  ) {
    return null;
  }

  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function extractDate(lines, fileName) {
  const candidates = [];

  const addCandidate = (iso, score) => {
    if (!iso) return;
    candidates.push({ iso, score });
  };

  lines.forEach((line, idx) => {
    const norm = normalizeSearch(line);
    let contextScore = 0;

    if (/(rechnungsdatum|belegdatum|ausstellungsdatum|kaufdatum|buchungstag|leistungsdatum)/.test(norm)) {
      contextScore += 60;
    } else if (/(datum|date|tarih)/.test(norm)) {
      contextScore += 40;
    } else if (/\b(vom|am)\b/.test(norm)) {
      contextScore += 18;
    }

    if (/(geburtsdatum|geboren|gueltig bis|faellig|zahlungsziel|freistellungsbescheid)/.test(norm)) {
      contextScore -= 35;
    }

    // Earlier lines slightly preferred if no label
    const positionBonus = Math.max(0, 12 - Math.floor(idx / 3));

    const dmyRegex = /\b(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})\b/g;
    let match;
    while ((match = dmyRegex.exec(line)) !== null) {
      addCandidate(buildValidIsoDate(match[3], match[2], match[1]), contextScore + positionBonus);
    }

    const isoRegex = /\b(\d{4})-(\d{2})-(\d{2})\b/g;
    while ((match = isoRegex.exec(line)) !== null) {
      addCandidate(buildValidIsoDate(match[1], match[2], match[3]), contextScore + positionBonus);
    }

    const monthNamesPattern = Object.keys(GERMAN_MONTHS).join('|');
    const textDateRegex = new RegExp(`\\b(\\d{1,2})\\.?\\s*(${monthNamesPattern})\\s+(\\d{4})\\b`, 'gi');
    while ((match = textDateRegex.exec(norm)) !== null) {
      const m = GERMAN_MONTHS[match[2].toLowerCase()];
      addCandidate(buildValidIsoDate(match[3], m, match[1]), contextScore + positionBonus + 5);
    }
  });

  if (fileName) {
    const isoFile = fileName.match(/(\d{4})[-_.](\d{2})[-_.](\d{2})/);
    if (isoFile) addCandidate(buildValidIsoDate(isoFile[1], isoFile[2], isoFile[3]), 10);

    const dmyFile = fileName.match(/(\d{2})[-_.](\d{2})[-_.](\d{4})/);
    if (dmyFile) addCandidate(buildValidIsoDate(dmyFile[3], dmyFile[2], dmyFile[1]), 10);
  }

  if (candidates.length === 0) return '';
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0].iso;
}

function parseMoneyToken(token) {
  if (!token) return null;
  let cleaned = token.replace(/\s+/g, '');
  if (cleaned.includes(',') && cleaned.includes('.')) {
    // Decide decimal separator by rightmost position
    if (cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) {
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      cleaned = cleaned.replace(/,/g, '');
    }
  } else if (cleaned.includes(',')) {
    cleaned = cleaned.replace(',', '.');
  }
  const num = Number.parseFloat(cleaned);
  if (!Number.isFinite(num) || num <= 0 || num >= 1000000) return null;
  return Number(num.toFixed(2));
}

function extractAmount(lines) {
  const candidates = [];
  const moneyRegex = /(?:€|EUR)?\s*(\d{1,3}(?:[.\s]\d{3})*,\d{2}|\d+,\d{2}|\d+\.\d{2})\s*(?:€|EUR)?/gi;

  lines.forEach((line, idx) => {
    const norm = normalizeSearch(line);
    // Skip lines that look like IBANs, phone numbers, dates or tax IDs without currency/amount context
    if (/(iban|bic|steuernummer|ust-id|telefon|tel\.|fax)/.test(norm) && !/(eur|€|betrag|summe)/.test(norm)) {
      return;
    }

    let score = 0;
    if (/(gesamtbetrag|rechnungsbetrag|zahlbetrag|zu zahlen|endbetrag|bruttobetrag|gesamtsumme)/.test(norm)) {
      score += 100;
    } else if (/(\bsumme\b|\bgesamt\b|\btotal\b|\btoplam\b)/.test(norm)) {
      score += 80;
    } else if (/(barzahlung|ec-cash|ec cash|kartenzahlung|girocard|lastschrift|\bbetrag\b|\bbar\b)/.test(norm)) {
      score += 55;
    }

    if (/(€|\beur\b)/.test(norm)) {
      score += 20;
    }

    if (/(zwischensumme|mwst|ust|mehrwertsteuer|steuersatz|\bnetto\b|rabatt|ersparnis|wechselgeld|rueckgeld|gegeben|einzelpreis|pfand)/.test(norm)) {
      score -= 45;
    }

    let match;
    while ((match = moneyRegex.exec(line)) !== null) {
      const value = parseMoneyToken(match[1]);
      if (value !== null) {
        candidates.push({ value, score, idx });
      }
    }
  });

  if (candidates.length === 0) return '';

  candidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.value !== a.value) return b.value - a.value;
    return b.idx - a.idx;
  });

  return candidates[0].value.toFixed(2);
}

function extractReceiptNo(lines, rawText, fileName) {
  const labelRegex =
    /(?:rechnungs[-.\s]?(?:nr\.?|nummer)|rechnung\s+nr\.?|rg[-.\s]?nr\.?|beleg[-.\s]?(?:nr\.?|nummer)|beleg\s+nr\.?|bon[-.\s]?(?:nr\.?|nummer)|quittungs?[-.\s]?(?:nr\.?|nummer)|bestell[-.\s]?(?:nr\.?|nummer)|auftrags[-.\s]?(?:nr\.?|nummer)|invoice\s*(?:no\.?|number|#)|fatura\s*no\.?|fi[sş]\s*no\.?|transaktions[-.\s]?nr\.?)\s*[:#]?\s*([A-Z0-9][A-Z0-9\-\/_.]{1,28})/i;

  for (const line of lines) {
    const match = line.match(labelRegex);
    if (match && match[1]) {
      const token = match[1].replace(/[.,;:]+$/, '');
      if (/\d/.test(token) && !/^(eur|tel|fax|ust|iban)$/i.test(token)) {
        return token;
      }
    }
  }

  const combined = `${rawText}\n${fileName}`;
  const codePattern = combined.match(/\b((?:RE|RG|EB|BAR|BELEG|INV|SPENDE)-\d{2,4}-[A-Z0-9-]+|(?:RE|RG|EB|BAR)-\d{3,})\b/i);
  if (codePattern && codePattern[1]) {
    return codePattern[1].toUpperCase();
  }

  return '';
}

function isOwnOrgLine(normLine) {
  return (
    normLine.includes('buergertreff') ||
    normLine.includes('erika uber') ||
    normLine.includes('birken-honigsessen') ||
    normLine.includes('marktstr. 8') ||
    normLine.includes('de27 5735 1030')
  );
}

function extractVendorAndContact(lines, rawText, fileName, contacts = []) {
  const normFull = normalizeSearch(`${rawText}\n${fileName}`);

  // 1. Existing contacts match (prefer longest match, exclude own org)
  let bestContact = null;
  for (const contact of contacts) {
    const name = (contact?.name || '').trim();
    const normContact = normalizeSearch(name);
    if (normContact.length < 3 || normContact.includes('buergertreff')) continue;

    const pattern = new RegExp(`(^|[^a-z0-9])${escapeRegExp(normContact)}([^a-z0-9]|$)`);
    if (pattern.test(normFull)) {
      if (!bestContact || normContact.length > normalizeSearch(bestContact.name).length) {
        bestContact = contact;
      }
    }
  }
  if (bestContact) {
    return {
      vendorName: bestContact.name,
      matchedContactId: String(bestContact.id)
    };
  }

  // 2. Known German vendors
  for (const vendor of KNOWN_VENDORS) {
    const normVendor = normalizeSearch(vendor);
    const pattern = new RegExp(`(^|[^a-z0-9])${escapeRegExp(normVendor)}([^a-z0-9]|$)`);
    if (pattern.test(normFull)) {
      return { vendorName: vendor, matchedContactId: '' };
    }
  }

  // 3. Company suffix match in top 25 lines
  const legalRegex =
    /\b(GmbH|mbH|Co\.?\s*KG|UG|AG|OHG|GbR|e\.?\s*V\.?|e\.?\s*K\.?|Inh\.|Apotheke|Bäckerei|Metzgerei|Supermarkt|Baumarkt|Drogerie|Druckerei|Verlag|Restaurant|Café|Pizzeria|Bistro|Hotel|Tankstelle|Buchhandlung|Autohaus|Steuerberater)\b/i;

  for (const line of lines.slice(0, 25)) {
    const norm = normalizeSearch(line);
    if (isOwnOrgLine(norm)) continue;
    if (legalRegex.test(line) && line.length >= 4 && line.length <= 70) {
      const cleaned = line.replace(/\s{2,}/g, ' ').trim();
      return { vendorName: cleaned, matchedContactId: '' };
    }
  }

  // 4. Clean top header line fallback
  const ignoreHeaderRegex =
    /^(rechnung|kassenbon|kassenzettel|quittung|beleg|datum|uhrzeit|tel|fax|www|http|iban|bic|ust|steuer|kunden|pos|menge|preis|summe|eur|vielen dank|herzlich willkommen|seite\s*\d)/i;

  for (const line of lines.slice(0, 8)) {
    const norm = normalizeSearch(line);
    if (isOwnOrgLine(norm)) continue;
    if (ignoreHeaderRegex.test(line)) continue;
    if (/^\d[\d\s.,:/-]+$/.test(line)) continue;
    if (/\b\d{5}\b/.test(line)) continue; // Skip postal-code address lines
    if (/[a-zA-ZäöüÄÖÜß]{3,}/.test(line) && line.length >= 3 && line.length <= 50) {
      return { vendorName: line.trim(), matchedContactId: '' };
    }
  }

  return { vendorName: '', matchedContactId: '' };
}

function detectTransactionType(normText) {
  const strongIncome =
    /(spendenbescheinigung|zuwendungsbestaetigung|kassenzaehlprotokoll|eigenbeleg|sammelglas|spendenbox|mitgliedsbeitrag|jahresbeitrag|zuschuss|foerderbescheid|gutschrift|habenzinsen)/.test(
      normText
    );
  const expenseSignal =
    /(kassenbon|kassenzettel|mwst|zwischensumme|summe\s*eur|ec-cash|kartenzahlung|lieferschein|zahlbetrag|rechnungsbetrag)/.test(
      normText
    );

  if (strongIncome && !expenseSignal) {
    return 'income';
  }
  return 'expense';
}

function suggestCategory(normText, type, categories = []) {
  const activeCategories = categories.filter(
    (c) => c.type === type && c.is_active !== false
  );
  if (activeCategories.length === 0) return { categoryId: '', categoryName: '' };

  const rules = [
    {
      catKeywords: ['verbrauch', 'material', 'einkauf', 'lebensmittel'],
      docKeywords: [
        'lidl', 'aldi', 'rewe', 'edeka', 'kaufland', 'penny', 'netto', 'norma',
        'dm', 'rossmann', 'mueller', 'kaffee', 'tee', 'milch', 'zucker', 'kuchen',
        'wasser', 'getraenk', 'lebensmittel', 'supermarkt', 'baeckerei', 'drogerie',
        'reinigung', 'serviette', 'becher', 'pfand'
      ]
    },
    {
      catKeywords: ['einrichtung', 'inventar', 'anschaffung', 'ausstattung'],
      docKeywords: [
        'ikea', 'obi', 'bauhaus', 'hornbach', 'toom', 'hagebau', 'mediamarkt',
        'saturn', 'moebel', 'tisch', 'stuhl', 'schrank', 'regal', 'lampe',
        'kuehlschrank', 'kaffeemaschine', 'laptop', 'drucker', 'monitor', 'baumarkt',
        'werkzeug'
      ]
    },
    {
      catKeywords: ['miete', 'pacht', 'nebenkosten', 'strom', 'raumkosten', 'telefon', 'internet'],
      docKeywords: [
        'miete', 'kaltmiete', 'warmmiete', 'nebenkosten', 'strom', 'gas', 'heizung',
        'stadtwerke', 'energie', 'telekom', 'vodafone', 'o2', '1&1', 'congstar',
        'internet', 'festnetz', 'mobilfunk'
      ]
    },
    {
      catKeywords: ['buero', 'verwaltung', 'porto', 'edv'],
      docKeywords: [
        'buerobedarf', 'kopierpapier', 'toner', 'patrone', 'briefmarke', 'porto',
        'deutsche post', 'dhl', 'hermes', 'software', 'lizenz', 'hosting', 'domain'
      ]
    },
    {
      catKeywords: ['veranstaltung', 'event', 'projekt'],
      docKeywords: ['veranstaltung', 'flyer', 'plakat', 'druckerei', 'catering', 'buffet']
    },
    {
      catKeywords: ['versicherung', 'beitraege'],
      docKeywords: ['versicherung', 'allianz', 'haftpflicht', 'ergo', 'axa', 'huk']
    },
    {
      catKeywords: ['spendenbox', 'sammelglas'],
      docKeywords: ['sammelglas', 'spendenbox', 'kassenzaehlprotokoll']
    },
    {
      catKeywords: ['mitglied', 'beitrag'],
      docKeywords: ['mitgliedsbeitrag', 'jahresbeitrag', 'aufnahmegebuehr']
    },
    {
      catKeywords: ['spende', 'zuwendung'],
      docKeywords: ['spendenbescheinigung', 'zuwendungsbestaetigung', 'geldspende']
    },
    {
      catKeywords: ['darlehen'],
      docKeywords: ['darlehen', 'kredit']
    },
    {
      catKeywords: ['geldtransit'],
      docKeywords: ['geldtransit', 'bareinzahlung', 'barabhebung']
    }
  ];

  let bestMatch = { score: 0, category: null };

  for (const rule of rules) {
    const matchingCategory = activeCategories.find((cat) => {
      const catNorm = normalizeSearch(cat.name);
      return rule.catKeywords.some((kw) => catNorm.includes(kw));
    });
    if (!matchingCategory) continue;

    let hits = 0;
    for (const kw of rule.docKeywords) {
      const pattern = new RegExp(`(^|[^a-z0-9])${escapeRegExp(kw)}([^a-z0-9]|$)`);
      if (pattern.test(normText)) hits += 1;
    }

    if (hits > bestMatch.score) {
      bestMatch = { score: hits, category: matchingCategory };
    }
  }

  if (bestMatch.category) {
    return {
      categoryId: String(bestMatch.category.id),
      categoryName: bestMatch.category.name
    };
  }

  return { categoryId: '', categoryName: '' };
}

function suggestAccount(normText, accounts = []) {
  if (!accounts || accounts.length === 0) return { accountId: '', accountName: '' };

  const cashAccount = accounts.find((acc) => {
    const n = normalizeSearch(acc.name);
    return !n.includes('sparkasse') && (n.includes('kasse') || n.includes('bar') || n.includes('cash'));
  });
  const bankAccount = accounts.find((acc) => {
    const n = normalizeSearch(acc.name);
    return n.includes('bank') || n.includes('sparkasse') || n.includes('giro');
  });

  const hasBankSignal =
    /(iban|bic|ueberweisung|lastschrift|sepa|ec-karte|ec-cash|ec cash|girocard|kartenzahlung|visa|mastercard|debit|kontoauszug|dauerauftrag)/.test(
      normText
    );
  const hasCashSignal =
    /(barzahlung|bargeld|rueckgeld|wechselgeld|gegeben|\bbar\b|sammelglas|kassenzaehlprotokoll)/.test(
      normText
    );

  if (hasBankSignal && bankAccount) {
    return { accountId: String(bankAccount.id), accountName: bankAccount.name };
  }
  if (hasCashSignal && cashAccount) {
    return { accountId: String(cashAccount.id), accountName: cashAccount.name };
  }

  return { accountId: '', accountName: '' };
}

function detectDocumentLabel(normText) {
  if (normText.includes('rechnung') || normText.includes('invoice')) return 'Rechnung';
  if (normText.includes('kassenbon') || normText.includes('kassenzettel')) return 'Kassenbon';
  if (normText.includes('quittung')) return 'Quittung';
  if (normText.includes('kontoauszug')) return 'Kontoauszug';
  if (normText.includes('spendenbescheinigung')) return 'Spendenbescheinigung';
  if (normText.includes('kassenzaehlprotokoll')) return 'Eigenbeleg / Kassenzählprotokoll';
  return 'Beleg';
}

export function parseDocumentText(rawText = '', fileName = '', options = {}) {
  const { categories = [], accounts = [], contacts = [] } = options;
  const lines = String(rawText || '')
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  const normText = normalizeSearch(`${rawText}\n${fileName}`);

  const { vendorName, matchedContactId } = extractVendorAndContact(lines, rawText, fileName, contacts);
  const date = extractDate(lines, fileName);
  const receiptNo = extractReceiptNo(lines, rawText, fileName);
  const amount = extractAmount(lines);
  const type = detectTransactionType(normText);
  const { categoryId, categoryName } = suggestCategory(normText, type, categories);
  const { accountId, accountName } = suggestAccount(normText, accounts);
  const docLabel = detectDocumentLabel(normText);

  let description = '';
  if (vendorName && receiptNo) {
    description = `${vendorName} – ${docLabel} (${receiptNo})`;
  } else if (vendorName) {
    description = `${vendorName} – ${docLabel}`;
  } else if (receiptNo) {
    description = `${docLabel} ${receiptNo}`;
  }

  return {
    rawText,
    docLabel,
    vendorName,
    matchedContactId,
    date,
    receiptNo,
    amount,
    type,
    categoryId,
    categoryName,
    accountId,
    accountName,
    description
  };
}
