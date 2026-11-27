import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import { resolveSignatoryForDate, escapeAttr } from '../../utils/signatories';
import {
  extractTextFromFile,
  parseDocumentText,
  parseDocumentUrls,
  serializeDocumentUrls,
  combineParsedDocuments
} from '../../utils/documentAssistant';
import { 
  FaPlus, FaEdit, FaTrash, FaPrint, FaHandHoldingHeart, 
  FaArrowDown, FaArrowUp, FaPaperclip, FaExclamationTriangle, FaSpinner,
  FaCheckCircle, FaUpload, FaEye, FaTimes, FaExternalLinkAlt, FaFilter,
  FaMagic, FaUserPlus
} from 'react-icons/fa';

// --- YARDIMCI FONKSİYON: Sayıyı Almanca Yazıya Çevirme ---
const numberToGermanWords = (n) => {
  if (n === 0) return "null";
  
  const units = ["", "ein", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun"];
  const unitsEins = ["", "eins", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun"]; 
  const teens = ["zehn", "elf", "zwölf", "dreizehn", "vierzehn", "fünfzehn", "sechzehn", "siebzehn", "achtzehn", "neunzehn"];
  const tens = ["", "", "zwanzig", "dreißig", "vierzig", "fünfzig", "sechzig", "siebzig", "achtzig", "neunzig"];

  const convertGroup = (num) => {
    if (num === 0) return "";
    if (num < 10) return unitsEins[num]; 
    if (num < 20) return teens[num - 10];
    if (num < 100) {
      const unit = num % 10;
      const ten = Math.floor(num / 10);
      if (unit === 0) return tens[ten];
      return units[unit] + "und" + tens[ten];
    }
    const hundred = Math.floor(num / 100);
    const rest = num % 100;
    let str = units[hundred] + "hundert";
    if (rest > 0) {
      if (rest === 1) str += "eins";
      else {
        if (rest < 10) str += unitsEins[rest];
        else if (rest < 20) str += teens[rest - 10];
        else {
          const u = rest % 10;
          const t = Math.floor(rest / 10);
          if (u === 0) str += tens[t];
          else str += units[u] + "und" + tens[t];
        }
      }
    }
    return str;
  };

  if (n < 1000) return convertGroup(n);
  
  const thousands = Math.floor(n / 1000);
  const remainder = n % 1000;
  
  let str = "";
  if (thousands === 1) str += "eintausend";
  else str += convertGroup(thousands).replace("eins", "ein") + "tausend"; 
  
  if (remainder > 0) str += convertGroup(remainder);
  
  return str;
};

// --- YARDIMCI FONKSİYON: Tarih Formatı (DD.MM.YYYY) ---
const formatDateDE = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export default function BuchhaltungTransactions({ readOnly }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filtreleme State'leri
  const [filterType, setFilterType] = useState('all'); 
  const [dateFilter, setDateFilter] = useState({
    preset: 'this_year', 
    start: new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10), 
    end: new Date(new Date().getFullYear(), 11, 31).toISOString().slice(0, 10) 
  });
  
  // Dropdown Verileri
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [orgSettings, setOrgSettings] = useState({});

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [docFilter, setDocFilter] = useState('all'); // 'all' | 'with_doc' | 'missing_doc'
  const [uploadingRowId, setUploadingRowId] = useState(null);
  const [dragOverRowId, setDragOverRowId] = useState(null);
  const [previewModal, setPreviewModal] = useState({
    isOpen: false,
    trx: null,
    urls: [],
    activeIndex: 0,
    signedUrls: {},
    loading: false
  });
  const [assistantState, setAssistantState] = useState({
    docs: [],
    activeDocIndex: 0,
    analyzing: false,
    progressText: '',
    error: '',
    result: null,
    appliedFields: {}
  });
  const [addingContactFromAssistant, setAddingContactFromAssistant] = useState(false);
  const [modalDragOver, setModalDragOver] = useState(false);
  const assistantFileInputRef = useRef(null);
  const modalSessionRef = useRef(0);
  const blobUrlsRef = useRef([]);
  const assistantDocsRef = useRef([]);
  
  const currentYear = new Date().getFullYear();
  const availableYears = [currentYear - 1, currentYear, currentYear + 1, currentYear + 2];
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null, type: '', message: '' });

  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    type: 'expense',
    amount: '',
    category_id: '',
    account_id: '',
    contact_id: '',
    target_year: '',
    receipt_no: '',
    file_no: '',
    description: '',
    document_url: '',
    subcategory: ''
  });

  const normalizeCategoryName = (name = '') =>
    name
      .toLowerCase()
      .replace(/ä/g, 'ae')
      .replace(/ö/g, 'oe')
      .replace(/ü/g, 'ue')
      .replace(/ß/g, 'ss')
      .replace(/[\s\-_]/g, '');

  useEffect(() => {
    fetchDropdownData();
    fetchTransactions();
    fetchOrgSettings();
  }, [dateFilter, filterType]);

  const handlePresetChange = (e) => {
    const val = e.target.value;
    const now = new Date();
    let start = '';
    let end = '';

    switch(val) {
      case 'this_month':
        start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
        break;
      case 'last_month':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10);
        end = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10);
        break;
      case 'this_year':
        start = new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10);
        end = new Date(now.getFullYear(), 11, 31).toISOString().slice(0, 10);
        break;
      case 'last_year':
        start = new Date(now.getFullYear() - 1, 0, 1).toISOString().slice(0, 10);
        end = new Date(now.getFullYear() - 1, 11, 31).toISOString().slice(0, 10);
        break;
      case 'custom':
        start = dateFilter.start;
        end = dateFilter.end;
        break;
      default:
        break;
    }
    setDateFilter({ preset: val, start, end });
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateFilter(prev => ({ ...prev, preset: 'custom', [name]: value }));
  };

  const fetchOrgSettings = async () => {
    const { data } = await supabase
      .from('site_settings')
      .select('key, value')
      .in('key', ['org_name', 'org_address', 'org_tax_id', 'exemption_date', 'exemption_office', 'treasurer_name']);
    
    const settings = {};
    if (data) {
      data.forEach(item => { settings[item.key] = item.value; });
    }
    setOrgSettings(settings);
  };

  const fetchDropdownData = async () => {
    const reconcileCategoryCatalog = async () => {
      const { data: rawCategories, error: categoryFetchError } = await supabase
        .from('accounting_categories')
        .select('*')
        .eq('is_active', true)
        .eq('type', 'expense');

      if (categoryFetchError || !rawCategories) {
        if (categoryFetchError) console.error('Fehler beim Laden der Ausgaben-Kategorien:', categoryFetchError);
        return;
      }

      const sortByCreation = (a, b) => {
        const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
        return aTime - bTime;
      };

      const mergeCategories = async (categoryGroup, targetName) => {
        if (!categoryGroup || categoryGroup.length === 0) return;

        const sorted = [...categoryGroup].sort(sortByCreation);
        let primary = sorted[0];
        const duplicateIds = sorted.slice(1).map((category) => category.id);

        if (normalizeCategoryName(primary.name) !== normalizeCategoryName(targetName)) {
          const { data: renamedCategory, error: renameError } = await supabase
            .from('accounting_categories')
            .update({ name: targetName })
            .eq('id', primary.id)
            .select('*')
            .single();

          if (renameError) {
            console.error(`Fehler beim Umbenennen der Kategorie ${primary.name} -> ${targetName}:`, renameError);
          } else if (renamedCategory) {
            primary = renamedCategory;
          }
        }

        if (duplicateIds.length > 0) {
          const { error: transactionUpdateError } = await supabase
            .from('accounting_transactions')
            .update({ category_id: primary.id })
            .in('category_id', duplicateIds);

          if (transactionUpdateError) {
            console.error('Fehler beim Zusammenführen von Transaktionen auf die Hauptkategorie:', transactionUpdateError);
            return;
          }

          const { error: deactivateError } = await supabase
            .from('accounting_categories')
            .update({ is_active: false })
            .in('id', duplicateIds);

          if (deactivateError) {
            console.error('Fehler beim Deaktivieren doppelter Kategorien:', deactivateError);
          }
        }
      };

      const inventarAndEinrichtung = rawCategories.filter((category) => {
        const normalizedName = normalizeCategoryName(category.name);
        return normalizedName === 'inventar' || normalizedName === 'einrichtung';
      });
      await mergeCategories(inventarAndEinrichtung, 'Einrichtung');

      const darlehenRueckzahlung = rawCategories.filter(
        (category) => normalizeCategoryName(category.name) === 'darlehensrueckzahlung'
      );
      await mergeCategories(darlehenRueckzahlung, 'Darlehensrückzahlung');

      const hasVerbrauch = rawCategories.some(
        (category) => normalizeCategoryName(category.name) === 'verbrauch'
      );
      if (!hasVerbrauch) {
        const { error: insertVerbrauchError } = await supabase
          .from('accounting_categories')
          .insert([{ name: 'Verbrauch', type: 'expense' }]);

        if (insertVerbrauchError) {
          console.error('Fehler beim Erstellen der Kategorie Verbrauch:', insertVerbrauchError);
        }
      }
    };

    await reconcileCategoryCatalog();

    const { data: catData } = await supabase.from('accounting_categories').select('*').eq('is_active', true);
    const { data: accData } = await supabase.from('accounting_accounts').select('*').eq('is_active', true);
    const { data: conData } = await supabase.from('accounting_contacts').select('id, name, address').order('name');

    if (catData) {
      const incomeNames = new Set(
        catData
          .filter(category => category.type === 'income')
          .map(category => normalizeCategoryName(category.name))
      );
      const expenseNames = new Set(
        catData
          .filter(category => category.type === 'expense')
          .map(category => normalizeCategoryName(category.name))
      );

      const requiredIncomeCategories = ['Darlehen', 'Sonstiges', 'Spendenbox / Sammelglas', 'Geldtransit'];
      const requiredExpenseCategories = ['Einrichtung', 'Darlehensrückzahlung', 'Verbrauch', 'Geldtransit'];

      const incomeCategoriesToCreate = requiredIncomeCategories
        .filter(name => !incomeNames.has(normalizeCategoryName(name)))
        .map(name => ({ name, type: 'income' }));

      const expenseCategoriesToCreate = requiredExpenseCategories
        .filter(name => !expenseNames.has(normalizeCategoryName(name)))
        .map(name => ({ name, type: 'expense' }));

      const categoriesToCreate = [...incomeCategoriesToCreate, ...expenseCategoriesToCreate];

      if (categoriesToCreate.length > 0) {
        const { data: insertedCategories } = await supabase
          .from('accounting_categories')
          .insert(categoriesToCreate)
          .select('*');

        setCategories([...(catData || []), ...(insertedCategories || [])]);
      } else {
        setCategories(catData);
      }
    }
    if (accData) setAccounts(accData);
    if (conData) setContacts(conData);
  };

  const fetchTransactions = async () => {
    setLoading(true);
    let query = supabase
      .from('accounting_transactions')
      .select(`*, accounting_categories (name, type), accounting_accounts (name), accounting_contacts (name)`)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (filterType !== 'all') query = query.eq('type', filterType);
    if (dateFilter.start) query = query.gte('date', dateFilter.start);
    if (dateFilter.end) query = query.lte('date', dateFilter.end);

    const { data, error } = await query;
    if (error) console.error(error);
    else setTransactions(data || []);
    setLoading(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const updateAssistantDocs = (updater) => {
    const nextDocs = typeof updater === 'function' ? updater(assistantDocsRef.current) : updater;
    assistantDocsRef.current = nextDocs;
    return nextDocs;
  };

  const clearAssistantState = () => {
    modalSessionRef.current += 1;
    if (blobUrlsRef.current.length > 0) {
      blobUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      blobUrlsRef.current = [];
    }
    assistantDocsRef.current = [];
    setModalDragOver(false);
    setAssistantState({
      docs: [],
      activeDocIndex: 0,
      analyzing: false,
      progressText: '',
      error: '',
      result: null,
      appliedFields: {}
    });
  };

  const mergeAssistantIntoForm = (prev, parsed, onlyEmpty) => {
    const next = { ...prev };
    const applied = {};

    const applyField = (field, value) => {
      if (!value) return;
      if (onlyEmpty && prev[field]) return;
      next[field] = value;
      applied[field] = true;
    };

    if (!onlyEmpty && parsed.type && (parsed.type === 'income' || parsed.type === 'expense')) {
      if (prev.type !== parsed.type) {
        next.type = parsed.type;
        applied.type = true;
        if (!parsed.categoryId) {
          next.category_id = '';
        }
      }
    }

    applyField('date', parsed.date);
    applyField('amount', parsed.amount);
    applyField('receipt_no', parsed.receiptNo);
    if ((!onlyEmpty || !prev.category_id) && parsed.categoryId && next.type === parsed.type) {
      next.category_id = parsed.categoryId;
      applied.category_id = true;
    }
    applyField('account_id', parsed.accountId);
    applyField('contact_id', parsed.matchedContactId);
    applyField('description', parsed.description);

    return { next, applied };
  };

  const applyAssistantResultToForm = (parsed, { onlyEmpty = false } = {}) => {
    if (!parsed) return;
    let appliedMap = {};
    setFormData(prev => {
      const { next, applied } = mergeAssistantIntoForm(prev, parsed, onlyEmpty);
      appliedMap = applied;
      return next;
    });
    setAssistantState(prev => ({
      ...prev,
      appliedFields: { ...prev.appliedFields, ...appliedMap }
    }));
  };

  const applySingleAssistantField = (field, value) => {
    if (!value) return;
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'type' && prev.type !== value) {
        next.category_id = '';
      }
      return next;
    });
    setAssistantState(prev => ({
      ...prev,
      appliedFields: { ...prev.appliedFields, [field]: true }
    }));
  };

  const processModalFiles = async (filesInput, { isNewRecordOverride = null } = {}) => {
    const files = Array.from(filesInput || []).filter(Boolean);
    if (files.length === 0) return;

    const sessionId = modalSessionRef.current;
    const shouldAutoFill = isNewRecordOverride !== null ? isNewRecordOverride : !editingId;

    const newEntries = files.map((file, idx) => {
      const previewUrl = URL.createObjectURL(file);
      blobUrlsRef.current.push(previewUrl);
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      return {
        id: `${Date.now()}_${idx}_${Math.random().toString(36).slice(2)}`,
        file,
        path: '',
        previewUrl,
        isPdf,
        fileName: file.name,
        parsed: null,
        analyzing: true,
        error: ''
      };
    });

    const startIndex = assistantDocsRef.current.length;
    const updatedList = updateAssistantDocs([...assistantDocsRef.current, ...newEntries]);

    setAssistantState(prev => ({
      ...prev,
      docs: updatedList,
      activeDocIndex: startIndex,
      analyzing: true,
      progressText: files.length > 1 ? `${files.length} Belege werden hochgeladen und ausgelesen...` : 'Beleg wird hochgeladen und ausgelesen...',
      error: ''
    }));

    const uploadTask = (async () => {
      try {
        setUploading(true);
        for (const entry of newEntries) {
          const fileExt = entry.file.name.includes('.') ? entry.file.name.split('.').pop() : '';
          const randomName = `${Date.now()}_${Math.random().toString(36).substring(2)}`;
          const filePath = fileExt ? `${randomName}.${fileExt}` : randomName;

          const { error } = await supabase.storage.from('receipts').upload(filePath, entry.file);
          if (error) throw error;
          if (modalSessionRef.current !== sessionId) return;

          const afterPath = updateAssistantDocs(docs =>
            docs.map(d => (d.id === entry.id ? { ...d, path: filePath } : d))
          );
          const allPaths = afterPath.map(d => d.path).filter(Boolean);
          setFormData(prev => ({ ...prev, document_url: serializeDocumentUrls(allPaths) }));
          setAssistantState(prev => ({ ...prev, docs: afterPath }));
        }
      } catch (error) {
        alert('Fehler: ' + error.message);
      } finally {
        setUploading(false);
      }
    })();

    const analyzeTask = (async () => {
      for (let i = 0; i < newEntries.length; i += 1) {
        const entry = newEntries[i];
        if (modalSessionRef.current !== sessionId) return;
        try {
          const rawText = await extractTextFromFile(entry.file, entry.fileName, (progressText) => {
            if (modalSessionRef.current === sessionId) {
              const prefix = newEntries.length > 1 ? `[${i + 1}/${newEntries.length}] ` : '';
              setAssistantState(prev => ({ ...prev, progressText: `${prefix}${progressText}` }));
            }
          });
          if (modalSessionRef.current !== sessionId) return;

          const parsed = parseDocumentText(rawText, entry.fileName, {
            categories,
            accounts,
            contacts
          });

          const nextDocs = updateAssistantDocs(docs =>
            docs.map(d => (d.id === entry.id ? { ...d, parsed, analyzing: false } : d))
          );
          setAssistantState(prev => ({ ...prev, docs: nextDocs }));
        } catch (err) {
          if (modalSessionRef.current !== sessionId) return;
          const nextDocs = updateAssistantDocs(docs =>
            docs.map(d =>
              d.id === entry.id ? { ...d, analyzing: false, error: err.message || 'Nicht lesbar' } : d
            )
          );
          setAssistantState(prev => ({ ...prev, docs: nextDocs }));
        }
      }

      if (modalSessionRef.current !== sessionId) return;

      const finalDocs = assistantDocsRef.current;
      const combined = combineParsedDocuments(finalDocs);
      const hasAnyField = Boolean(
        combined &&
          (combined.vendorName ||
            combined.date ||
            combined.receiptNo ||
            combined.amount ||
            combined.categoryId ||
            combined.accountId)
      );

      let autoApplied = {};
      if (shouldAutoFill && combined && hasAnyField) {
        setFormData(prev => {
          const { next, applied } = mergeAssistantIntoForm(prev, combined, false);
          autoApplied = applied;
          return next;
        });
      }

      setAssistantState(prev => ({
        ...prev,
        docs: finalDocs,
        analyzing: false,
        progressText: '',
        result: combined,
        error: hasAnyField
          ? ''
          : 'Keine Daten automatisch erkannt. Bitte ergänzen Sie die Felder anhand der Vorschau.',
        appliedFields: shouldAutoFill ? { ...prev.appliedFields, ...autoApplied } : prev.appliedFields
      }));
    })();

    await Promise.all([uploadTask, analyzeTask]);
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;
    await processModalFiles(files);
  };

  const removeModalDocAtIndex = (indexToRemove) => {
    const currentDocs = assistantDocsRef.current;
    if (indexToRemove < 0 || indexToRemove >= currentDocs.length) return;

    const nextDocs = updateAssistantDocs(currentDocs.filter((_, idx) => idx !== indexToRemove));
    const allPaths = nextDocs.map(d => d.path).filter(Boolean);
    setFormData(prev => ({ ...prev, document_url: serializeDocumentUrls(allPaths) }));

    const combined = combineParsedDocuments(nextDocs);
    setAssistantState(prev => ({
      ...prev,
      docs: nextDocs,
      activeDocIndex: Math.max(0, Math.min(prev.activeDocIndex, nextDocs.length - 1)),
      result: combined,
      error: nextDocs.length === 0 ? '' : prev.error
    }));
  };

  const analyzeAllExistingModalDocs = async () => {
    const docsToAnalyze = assistantDocsRef.current;
    if (docsToAnalyze.length === 0) return;
    const sessionId = modalSessionRef.current;

    setAssistantState(prev => ({
      ...prev,
      analyzing: true,
      progressText: 'Gespeicherte Belege werden geladen und ausgelesen...',
      error: ''
    }));

    try {
      for (let i = 0; i < docsToAnalyze.length; i += 1) {
        const docItem = docsToAnalyze[i];
        if (docItem.parsed || !docItem.path) continue;
        if (modalSessionRef.current !== sessionId) return;

        const prefix = docsToAnalyze.length > 1 ? `[${i + 1}/${docsToAnalyze.length}] ` : '';
        setAssistantState(prev => ({ ...prev, progressText: `${prefix}Beleg wird geladen...` }));

        const { data, error } = await supabase.storage.from('receipts').download(docItem.path);
        if (error) throw error;
        if (modalSessionRef.current !== sessionId) return;

        const rawText = await extractTextFromFile(data, docItem.fileName, (progressText) => {
          if (modalSessionRef.current === sessionId) {
            setAssistantState(prev => ({ ...prev, progressText: `${prefix}${progressText}` }));
          }
        });
        if (modalSessionRef.current !== sessionId) return;

        const parsed = parseDocumentText(rawText, docItem.fileName, {
          categories,
          accounts,
          contacts
        });

        const nextDocs = updateAssistantDocs(docs =>
          docs.map(d => (d.id === docItem.id ? { ...d, parsed, analyzing: false } : d))
        );
        setAssistantState(prev => ({ ...prev, docs: nextDocs }));
      }

      if (modalSessionRef.current !== sessionId) return;
      const finalDocs = assistantDocsRef.current;
      const combined = combineParsedDocuments(finalDocs);
      const hasAnyField = Boolean(
        combined &&
          (combined.vendorName ||
            combined.date ||
            combined.receiptNo ||
            combined.amount ||
            combined.categoryId ||
            combined.accountId)
      );

      setAssistantState(prev => ({
        ...prev,
        docs: finalDocs,
        analyzing: false,
        progressText: '',
        result: combined,
        error: hasAnyField
          ? ''
          : 'Keine Daten automatisch erkannt. Bitte ergänzen Sie die Felder anhand der Vorschau.'
      }));
    } catch (err) {
      if (modalSessionRef.current !== sessionId) return;
      setAssistantState(prev => ({
        ...prev,
        analyzing: false,
        progressText: '',
        error: 'Beleg konnte nicht gelesen werden: ' + err.message
      }));
    }
  };

  const handleQuickAddContactFromAssistant = async (vendorName) => {
    const cleanName = (vendorName || '').trim();
    if (readOnly || !cleanName) return;

    setAddingContactFromAssistant(true);
    try {
      let result = await supabase
        .from('accounting_contacts')
        .insert([{ name: cleanName, category: 'institution', type: 'supplier' }])
        .select('id, name, address')
        .single();

      if (result.error && result.error.message?.includes('category')) {
        result = await supabase
          .from('accounting_contacts')
          .insert([{ name: cleanName, type: 'supplier' }])
          .select('id, name, address')
          .single();
      }

      if (result.error) {
        result = await supabase
          .from('accounting_contacts')
          .insert([{ name: cleanName }])
          .select('id, name, address')
          .single();
      }

      if (result.error) throw result.error;

      const created = result.data;
      setContacts(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setFormData(prev => ({ ...prev, contact_id: String(created.id) }));
      setAssistantState(prev => ({
        ...prev,
        result: prev.result ? { ...prev.result, matchedContactId: String(created.id) } : prev.result,
        appliedFields: { ...prev.appliedFields, contact_id: true }
      }));
    } catch (error) {
      alert('Kontakt konnte nicht hinzugefügt werden: ' + error.message);
    } finally {
      setAddingContactFromAssistant(false);
    }
  };

  const openNewWithAssistant = () => {
    resetForm();
    setIsFormOpen(true);
    assistantFileInputRef.current?.click();
  };

  const handleAssistantQuickUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;
    await processModalFiles(files, { isNewRecordOverride: true });
  };

  const openDocument = async (rawPath, index = 0) => {
    const paths = parseDocumentUrls(rawPath);
    const targetPath = paths[index] || paths[0];
    if (!targetPath) return;
    const { data, error } = await supabase.storage.from('receipts').createSignedUrl(targetPath, 60);
    if (error) { alert(error.message); return; }
    window.open(data.signedUrl, '_blank');
  };

  const loadSignedUrlsForPreview = async (trx, urls, activeIndex = 0) => {
    setPreviewModal({ isOpen: true, trx, urls, activeIndex, signedUrls: {}, loading: true });

    const results = await Promise.all(
      urls.map(path => supabase.storage.from('receipts').createSignedUrl(path, 300))
    );
    const firstError = results.find(r => r.error)?.error;
    if (firstError) {
      alert('Fehler beim Laden des Belegs: ' + firstError.message);
      setPreviewModal({ isOpen: false, trx: null, urls: [], activeIndex: 0, signedUrls: {}, loading: false });
      return;
    }

    const signedMap = {};
    results.forEach((res, idx) => {
      if (res.data?.signedUrl) signedMap[idx] = res.data.signedUrl;
    });

    setPreviewModal(prev =>
      prev.isOpen && prev.trx?.id === trx.id
        ? { ...prev, signedUrls: signedMap, loading: false }
        : prev
    );
  };

  const openPreviewModal = async (trx, initialIndex = 0) => {
    const urls = parseDocumentUrls(trx?.document_url);
    if (urls.length === 0) return;
    const safeIndex = Math.max(0, Math.min(initialIndex, urls.length - 1));
    await loadSignedUrlsForPreview(trx, urls, safeIndex);
  };

  const closePreviewModal = () => {
    setPreviewModal({ isOpen: false, trx: null, urls: [], activeIndex: 0, signedUrls: {}, loading: false });
  };

  const uploadDocumentsForTransaction = async (
    trxId,
    filesInput,
    { mode = 'append', replaceIndex = null } = {}
  ) => {
    const files = Array.from(filesInput || []).filter(Boolean);
    if (readOnly || !trxId || files.length === 0) return;

    try {
      setUploadingRowId(trxId);
      const uploadedPaths = [];
      for (const file of files) {
        const fileExt = file.name.includes('.') ? file.name.split('.').pop() : '';
        const randomName = `${Date.now()}_${Math.random().toString(36).substring(2)}`;
        const filePath = fileExt ? `${randomName}.${fileExt}` : randomName;

        const { error: uploadError } = await supabase.storage.from('receipts').upload(filePath, file);
        if (uploadError) throw uploadError;
        uploadedPaths.push(filePath);
      }

      const currentTrx = transactions.find(t => t.id === trxId);
      const existingUrls = parseDocumentUrls(currentTrx?.document_url);

      let nextUrls;
      let targetActiveIndex = 0;
      if (mode === 'replace' && replaceIndex !== null && existingUrls.length > 0) {
        nextUrls = [...existingUrls];
        nextUrls[replaceIndex] = uploadedPaths[0];
        if (uploadedPaths.length > 1) {
          nextUrls.splice(replaceIndex + 1, 0, ...uploadedPaths.slice(1));
        }
        targetActiveIndex = replaceIndex;
      } else if (mode === 'replace_all') {
        nextUrls = uploadedPaths;
        targetActiveIndex = 0;
      } else {
        nextUrls = [...existingUrls, ...uploadedPaths];
        targetActiveIndex = Math.max(0, existingUrls.length);
      }

      const serialized = serializeDocumentUrls(nextUrls);
      const { error: dbError } = await supabase
        .from('accounting_transactions')
        .update({ document_url: serialized || null })
        .eq('id', trxId);
      if (dbError) throw dbError;

      const updatedTrx = currentTrx ? { ...currentTrx, document_url: serialized } : null;
      setTransactions(prev =>
        prev.map(t => (t.id === trxId ? { ...t, document_url: serialized } : t))
      );

      if (previewModal.isOpen && previewModal.trx?.id === trxId) {
        await loadSignedUrlsForPreview(updatedTrx || { ...previewModal.trx, document_url: serialized }, nextUrls, targetActiveIndex);
      }
    } catch (error) {
      alert('Fehler: ' + error.message);
    } finally {
      setUploadingRowId(null);
    }
  };

  const removeDocumentFromTransaction = async (trx, indexToRemove) => {
    if (readOnly || !trx) return;
    const urls = parseDocumentUrls(trx.document_url);
    if (urls.length <= 1) return;
    if (!window.confirm(`Möchten Sie Beleg ${indexToRemove + 1} wirklich aus dieser Buchung entfernen?`)) return;

    const nextUrls = urls.filter((_, idx) => idx !== indexToRemove);
    const serialized = serializeDocumentUrls(nextUrls);

    try {
      setUploadingRowId(trx.id);
      const { error } = await supabase
        .from('accounting_transactions')
        .update({ document_url: serialized || null })
        .eq('id', trx.id);
      if (error) throw error;

      const updatedTrx = { ...trx, document_url: serialized };
      setTransactions(prev =>
        prev.map(t => (t.id === trx.id ? updatedTrx : t))
      );

      if (previewModal.isOpen && previewModal.trx?.id === trx.id) {
        const nextIndex = Math.min(indexToRemove, nextUrls.length - 1);
        await loadSignedUrlsForPreview(updatedTrx, nextUrls, nextIndex);
      }
    } catch (error) {
      alert('Fehler: ' + error.message);
    } finally {
      setUploadingRowId(null);
    }
  };

  const handleRowFileSelect = async (trxId, e, options = { mode: 'append' }) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;
    await uploadDocumentsForTransaction(trxId, files, options);
  };

  const handleRowDragOver = (trxId, e) => {
    if (readOnly) return;
    e.preventDefault();
    e.stopPropagation();
    if (dragOverRowId !== trxId) setDragOverRowId(trxId);
  };

  const handleRowDragLeave = (trxId, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragOverRowId === trxId) setDragOverRowId(null);
  };

  const handleRowDrop = async (trxId, e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverRowId(null);
    if (readOnly) return;
    const files = Array.from(e.dataTransfer?.files || []);
    if (files.length > 0) {
      await uploadDocumentsForTransaction(trxId, files, { mode: 'append' });
    }
  };

  // --- YAZDIRMA FONKSİYONLARI ---

  // 1. LİSTE YAZDIRMA (YENIDEN TASARLANDI)
  const printList = () => {
    const printWindow = window.open('', '_blank', 'width=1100,height=800');
    if (!printWindow) return;

    let showIncome = filterType === 'income' || filterType === 'all';
    let showExpense = filterType === 'expense' || filterType === 'all';

    // Toplamları hesapla (0 olan değerleri hariç tut)
    let totalIncome = 0;
    let totalExpense = 0;
    transactions.forEach(t => {
      const val = parseFloat(t.amount);
      // 0 olan transaksiyonları hariç tut
      if (val === 0) return;
      
      if (t.type === 'income') totalIncome += val;
      else totalExpense += val;
    });

    const netBalance = totalIncome - totalExpense;
    const dateStr = formatDateDE(new Date());
    const periodStr = (dateFilter.start && dateFilter.end) 
      ? `${formatDateDE(dateFilter.start)} - ${formatDateDE(dateFilter.end)}`
      : 'Gesamtübersicht';

    // Kategorilere göre grupla ve 0 olan değerleri filtrele
    const grouped = {};
    transactions.forEach(t => {
      const amount = parseFloat(t.amount);
      // 0 olan transaksiyonları hariç tut
      if (amount === 0) return;
      
      const cat = t.accounting_categories?.name || 'Unbekannt';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(t);
    });

    let tableRows = '';
    let rowNumber = 1; // Sıra numarası için sayaç
    Object.keys(grouped).forEach(cat => {
      const catRows = grouped[cat]
        .map(trx => {
          const isIncome = trx.type === 'income';
          const amount = parseFloat(trx.amount).toFixed(2).replace('.', ',');
          const row = `
            <tr>
              <td>${rowNumber}</td>
              <td>${formatDateDE(trx.date)}</td>
              <td>${trx.receipt_no || trx.file_no || '-'}</td>
              <td><span style="color:#555; font-size:8pt;">${trx.description || ''}</span></td>
              <td>${trx.accounting_accounts?.name || ''}${trx.accounting_contacts ? '<br><span style="font-size:8pt; color:#444;">' + trx.accounting_contacts.name + '</span>' : ''}</td>
              ${showIncome ? `<td class="amount income">${isIncome ? amount + ' €' : ''}</td>` : ''}
              ${showExpense ? `<td class="amount expense">${!isIncome ? amount + ' €' : ''}</td>` : ''}
            </tr>`;
          rowNumber++; // Her satırdan sonra numarayı arttır
          return row;
        })
        .join('');
      const catTotalIncome = grouped[cat].filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount), 0);
      const catTotalExpense = grouped[cat].filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount), 0);
      tableRows += `
        <tr style="background:#e6e6e6;font-weight:bold;"><td colspan="${showIncome && showExpense ? 7 : 6}">${cat}</td></tr>
        ${catRows}
        <tr class="cat-total"><td colspan="5" style="text-align:right;">${cat} Summe:</td>
          ${showIncome ? `<td class="amount income">${catTotalIncome ? catTotalIncome.toFixed(2).replace('.', ',') + ' €' : ''}</td>` : ''}
          ${showExpense ? `<td class="amount expense">${catTotalExpense ? catTotalExpense.toFixed(2).replace('.', ',') + ' €' : ''}</td>` : ''}
        </tr>
      `;
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Buchungsliste</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            @page {
              size: A4;
              margin: 20mm 20mm 20mm 20mm;
            }
            
            @media print {
              body {
                margin: 0;
                padding: 0;
              }
            }
            
            body {
              font-family: Arial, Helvetica, sans-serif;
              font-size: 9pt;
              line-height: 1.4;
              color: #000;
              margin: 20mm;
              padding: 0;
            }
            
            .document-header {
              text-align: center;
              margin-bottom: 8px;
              padding-bottom: 4px;
              border-bottom: 2px solid #333;
              page-break-after: avoid;
            }
            
            .document-header img {
              max-height: 50px;
              margin-bottom: 2px;
            }
            
            .document-header h1 {
              font-size: 14pt;
              font-weight: bold;
              margin: 0;
              text-transform: uppercase;
            }
            
            .document-header p {
              font-size: 9pt;
              color: #555;
              margin: 2px 0;
            }
            
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 8px;
            }
            
            thead {
              display: table-header-group;
            }
            
            tbody {
              display: table-row-group;
            }
            
            tfoot {
              display: table-footer-group;
            }
            
            tr {
              page-break-inside: avoid;
            }
            
            th {
              background-color: #f0f0f0;
              border: 1px solid #999;
              padding: 6px 4px;
              text-align: left;
              font-weight: bold;
              font-size: 8.5pt;
            }
            
            td {
              border: 1px solid #ccc;
              padding: 4px;
              text-align: left;
              font-size: 8.5pt;
            }
            
            .amount-col {
              text-align: right;
              white-space: nowrap;
              width: 70px;
            }
            
            .income {
              color: green;
              font-weight: bold;
            }
            
            .expense {
              color: red;
              font-weight: bold;
            }
            
            tr[style*="background:#e6e6e6"] {
              page-break-after: avoid;
            }
            
            .cat-total td {
              border-top: 2px solid #000;
              background-color: #f9f9f9;
              font-weight: bold;
              page-break-after: avoid;
            }
            
            .final-totals td {
              border-top: 2px solid #000;
              background-color: #f0f0f0;
              font-weight: bold;
              padding: 6px 4px;
            }
          </style>
        </head>
        <body>
          <div class="document-header">
            <img src="/logo.png" alt="Logo" onerror="this.style.display='none'" />
            <h1>Buchungsliste / Journal</h1>
            <p>${orgSettings.org_name || 'Bürgertreff Wissen e.V.'}</p>
            <p>Zeitraum: ${periodStr}</p>
          </div>
          
          <table>
            <thead>
              <tr>
                <th style="width: 40px;">Nr.</th>
                <th style="width: 60px;">Datum</th>
                <th style="width: 45px;">Beleg</th>
                <th style="flex: 1;">Beschreibung</th>
                <th style="width: 120px;">Konto / Kontakt</th>
                ${showIncome ? '<th class="amount-col">Einnahme</th>' : ''}
                ${showExpense ? '<th class="amount-col">Ausgabe</th>' : ''}
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
            <tfoot>
              <tr class="final-totals">
                <td colspan="5" style="text-align: right; padding-right: 10px;">GESAMTSUMME:</td>
                ${showIncome ? `<td class="amount-col">${totalIncome.toFixed(2).replace('.', ',')} €</td>` : ''}
                ${showExpense ? `<td class="amount-col">${totalExpense.toFixed(2).replace('.', ',')} €</td>` : ''}
              </tr>
              <tr class="final-totals">
                <td colspan="5" style="text-align: right; padding-right: 10px;">SALDO (Einnahmen - Ausgaben):</td>
                <td colspan="2" class="amount-col" style="color: ${netBalance >= 0 ? '#000' : '#f00'};">
                  ${netBalance.toFixed(2).replace('.', ',')} €
                </td>
              </tr>
            </tfoot>
          </table>
          
          <script>
            window.addEventListener('load', function() {
              setTimeout(function() { window.print(); }, 250);
            });
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // 1b. EVRAK FİHRİSTESİ YAZDIRMA (Denetleme ve Kontrol İçin)
  const printIndex = () => {
    const printWindow = window.open('', '_blank', 'width=1100,height=800');
    if (!printWindow) return;

    let showIncome = filterType === 'income' || filterType === 'all';
    let showExpense = filterType === 'expense' || filterType === 'all';

    // 0 olan transaksiyonları filtrele ve tarihe göre sırala
    const filteredTrx = transactions
      .filter(t => parseFloat(t.amount) !== 0)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    // Başlık belirle
    let headerTitle = 'Belegverzeichnis';
    if (filterType === 'income') headerTitle = 'Einnahmen-Verzeichnis';
    else if (filterType === 'expense') headerTitle = 'Ausgaben-Verzeichnis';

    // Tablo satırlarını oluştur
    let tableRows = '';
    filteredTrx.forEach((trx, index) => {
      const isIncome = trx.type === 'income';
      const amount = parseFloat(trx.amount).toFixed(2).replace('.', ',');
      const shouldShow = (isIncome && showIncome) || (!isIncome && showExpense);
      
      if (!shouldShow) return;

      tableRows += `
        <tr>
          <td style="text-align: center; vertical-align: middle; width: 35px;">${index + 1}</td>
          <td style="text-align: center; vertical-align: middle; width: 75px;">${formatDateDE(trx.date)}</td>
          <td style="text-align: center; vertical-align: middle; width: 90px;">${trx.receipt_no || trx.file_no || '-'}</td>
          <td style="text-align: left; vertical-align: middle; flex: 1;"><span style="color:#555; font-size:9pt;">${trx.description || ''}</span></td>
          <td style="text-align: center; vertical-align: middle; width: 110px;">${trx.accounting_accounts?.name || ''}${trx.accounting_contacts ? '<br><span style="font-size:8pt; color:#444;">' + trx.accounting_contacts.name + '</span>' : ''}</td>
          <td style="text-align: right; vertical-align: middle; width: 75px;">${amount} €</td>
        </tr>`;
    });

    const dateStr = formatDateDE(new Date());
    const periodStr = (dateFilter.start && dateFilter.end) 
      ? `${formatDateDE(dateFilter.start)} - ${formatDateDE(dateFilter.end)}`
      : 'Gesamtübersicht';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>${headerTitle}</title>
          <style>
            @page {
              size: A4;
              margin: 0;
            }
            
            @media print {
              * {
                margin: 0 !important;
                padding: 0 !important;
              }
              body {
                margin: 0 !important;
                padding: 25mm 15mm 25mm 20mm !important;
              }
              .document-header {
                margin-top: 0 !important;
                margin-bottom: 15px !important;
                padding-bottom: 10px !important;
              }
              table {
                margin-top: 12px !important;
                margin-left: 0 !important;
                margin-right: 0 !important;
              }
              tr {
                page-break-inside: avoid !important;
              }
            }
            
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: Arial, Helvetica, sans-serif;
              font-size: 10pt;
              line-height: 1.5;
              color: #000;
              margin: 0;
              padding: 0;
            }
            
            .document-header {
              text-align: center;
              margin-bottom: 15px;
              margin-top: 0;
              padding-bottom: 10px;
              border-bottom: 2px solid #333;
            }
            
            .document-header h1 {
              font-size: 16pt;
              font-weight: bold;
              margin: 4px 0;
              text-transform: uppercase;
            }
            
            .document-header p {
              font-size: 10pt;
              color: #555;
              margin: 2px 0;
            }
            
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 12px;
            }
            
            thead {
              display: table-header-group;
              page-break-after: auto;
            }
            
            tbody {
              display: table-row-group;
            }
            
            tr {
              page-break-inside: avoid;
            }
            
            th {
              background-color: #333;
              color: white;
              border: 1px solid #999;
              padding: 10px 6px;
              text-align: left;
              font-weight: bold;
              font-size: 9.5pt;
              vertical-align: middle;
              word-wrap: break-word;
              word-break: break-word;
            }
            
            td {
              border: 1px solid #ccc;
              padding: 8px 6px;
              text-align: left;
              font-size: 9.5pt;
              vertical-align: top;
              word-wrap: break-word;
              word-break: break-word;
              line-height: 1.3;
            }
          </style>
        </head>
        <body>
          <div class="document-header">
            <h1>${headerTitle}</h1>
            <p>${orgSettings.org_name || 'Bürgertreff Wissen e.V.'}</p>
            <p>Zeitraum: ${periodStr}</p>
          </div>
          
          <table>
            <thead>
              <tr>
                <th style="width: 35px; text-align: center;">Nr.</th>
                <th style="width: 75px;">Datum</th>
                <th style="width: 90px;">Beleg</th>
                <th style="flex: 1;">Beschreibung</th>
                <th style="width: 110px;">Konto / Kontakt</th>
                <th style="width: 75px; text-align: right;">Betrag</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
          
          <script>
            window.addEventListener('load', function() {
              setTimeout(function() { window.print(); }, 250);
            });
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // 2. BELEG DRUCKEN
  const printVoucher = async (trx, docIndex = null) => {
    const docUrls = parseDocumentUrls(trx.document_url);
    const targetPaths =
      docIndex !== null && docUrls[docIndex] ? [docUrls[docIndex]] : docUrls;

    const imageSignedUrls = [];
    for (const path of targetPaths) {
      const { data } = await supabase.storage.from('receipts').createSignedUrl(path, 60);
      if (!data?.signedUrl) continue;
      if (path.toLowerCase().split('?')[0].endsWith('.pdf')) {
        window.open(data.signedUrl, '_blank');
      } else {
        imageSignedUrls.push(data.signedUrl);
      }
    }

    if (targetPaths.length > 0 && imageSignedUrls.length === 0) {
      return;
    }

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) return;

    const dateStr = formatDateDE(trx.date);
    const amountStr = parseFloat(trx.amount).toFixed(2) + ' €';
    const typeStr = trx.type === 'income' ? 'Einnahme' : 'Ausgabe';
    const imagesHtml = imageSignedUrls
      .map((url) => `<div style="margin-top:12px;"><img src="${url}" style="max-width:100%;" /></div>`)
      .join('');

    const htmlContent = `
      <html><head><title>Beleg</title><style>body{font-family:Arial;padding:20px;}</style></head>
        <body>
          <h3>Buchungsbeleg</h3><p>Datum: ${dateStr} | Typ: ${typeStr}</p><p>Betrag: <strong>${amountStr}</strong></p><p>${trx.description || ''}</p>
          ${imagesHtml}
          <script>window.addEventListener('load', function() { window.print(); });</script>
        </body></html>`;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // 3. Spendenquittung
  const printDonationReceipt = async (trx) => {
    if (trx.type !== 'income') return;
    const contact = contacts.find(c => c.id === trx.contact_id);
    if (!contact) { alert('Kontakt fehlt!'); return; }

    // Popup sofort öffnen (sonst blockiert der Browser nach dem await)
    const printWindow = window.open('', '_blank', 'width=900,height=1000');
    if (!printWindow) return;

    // Kassierer/in, der/die am Tag der Zuwendung im Amt war -> alte Bescheinigungen bleiben unverändert
    const signatory = await resolveSignatoryForDate('kassierer', trx.date);
    const treasurerName = signatory.name || orgSettings.treasurer_name || 'Kassierer/in';
    const signatureImg = signatory.signatureUrl
      ? `<img src="${escapeAttr(signatory.signatureUrl)}" alt="Unterschrift" style="height: 45px; max-width: 200px; object-fit: contain;" onerror="this.style.display='none'" />`
      : '';

    const dateStr = formatDateDE(trx.date); 
    const amountVal = parseFloat(trx.amount);
    const amountStr = amountVal.toFixed(2).replace('.', ',');
    const intPart = Math.floor(amountVal);
    const decimalPart = Math.round((amountVal - intPart) * 100);
    let euroText = numberToGermanWords(intPart);
    euroText = euroText.charAt(0).toUpperCase() + euroText.slice(1);
    let centText = numberToGermanWords(decimalPart);
    let amountInWords = '';
    if (decimalPart === 0) {
      amountInWords = `${euroText} Euro`;
    } else {
      amountInWords = `${euroText} Euro ${centText} Cent`;
    }

    // Behandlung mit oder ohne Adresse
    const donorInfo = contact.address 
      ? `${contact.name}<br>${contact.address}`
      : contact.name;

    const orgName = "Bürgertreff Wissen e.V.";
    const stNr = orgSettings.org_tax_id || "02/650/36212";
    const exemptionDate = orgSettings.exemption_date ? formatDateDE(orgSettings.exemption_date) : "03.06.2025";
    const faName = orgSettings.exemption_office || "Finanzamt Altenkirchen";

    const htmlContent = `
      <html>
        <head>
          <title>Spendenbescheinigung</title>
          <style>
            @page { size: A4; margin: 0; }
            body { 
              font-family: Arial, Helvetica, sans-serif; 
              font-size: 10pt; 
              line-height: 1.2; 
              color: #000; 
              padding: 18mm 25mm 15mm 25mm; 
              margin: 0; 
            }
            .container { width: 100%; margin: 0 auto; }
            .header-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
            .logo-img { max-width: 180px; height: auto; }
            h1 { font-size: 16pt; font-weight: bold; text-align: left; margin: 8px 0 12px 0; }
            .issuer { font-weight: bold; margin-bottom: 10px; font-size: 10pt; }
            .legal-text { font-size: 9pt; text-align: justify; margin-bottom: 10px; line-height: 1.25; hyphens: auto; word-spacing: -0.04em; }
            .box-section { border: 1px solid #000; padding: 8px; margin-bottom: 10px; background-color: #fcfcfc; }
            .data-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; margin-bottom: 10px; border: 1px solid #000; padding: 5px; align-items: start; }
            .grid-item strong { display: block; font-size: 7pt; margin-bottom: 2px; line-height: 1.0; }
            .checkbox-row { display: flex; justify-content: space-between; align-items: center; border: 1px solid #000; padding: 8px; margin-bottom: 10px; font-size: 9pt; }
            .tax-info { font-size: 8.5pt; margin-bottom: 10px; line-height: 1.3; text-align: justify; }
            .tax-info ul { list-style: none; padding-left: 0; margin: 5px 0; }
            .tax-info li { margin-bottom: 3px; padding-left: 15px; position: relative; }
            .tax-info li::before { content: "•"; position: absolute; left: 0; }
            .signature-box { margin-top: 25px; margin-bottom: 20px; }
            .page-footer {
              position: fixed; bottom: 12mm; left: 25mm; right: 25mm;
              text-align: center; font-size: 7.5pt; color: #444;
              border-top: 1px solid #ccc; padding-top: 4px; background-color: #fff; line-height: 1.25;
            }
            @media print { body { -webkit-print-color-adjust: exact; } .box-section, .data-grid, .checkbox-row { border: 1px solid #000 !important; } }
          </style>
        </head>
        <body>
          <div class="container">
            <table class="header-table">
              <tr>
                <td style="width: 70%;"></td>
                <td style="width: 30%; text-align: right;">
                  <img src="/logo.png" alt="Logo" class="logo-img" onerror="this.style.display='none'; this.parentElement.innerHTML='[LOGO]';" />
                </td>
              </tr>
            </table>
            <h1>Spendenbescheinigung</h1>
            <div class="issuer">Aussteller: ${orgName}</div>
            <div class="legal-text">Bestätigung über Geldzuwendungen im Sinne des § 10b des Einkommen&shy;steuergesetzes an eine der in § 5 Abs. 1 Nr. 9 des Körperschaftsteuer&shy;gesetzes bezeichneten Körper&shy;schaften, Personen&shy;vereinigungen oder Vermögens&shy;massen.</div>
            <div class="box-section">
              <div><strong>Name und Anschrift des Zuwendenden:</strong></div>
              <div style="margin-top: 8px; font-size: 10.5pt;">${donorInfo}</div>
            </div>
            <div class="data-grid">
              <div class="grid-item"><strong>Betrag der Zuwendung in Ziffern:</strong><span style="font-size: 10.5pt;">${amountStr} €</span></div>
              <div class="grid-item"><strong>Betrag der Zuwendung in Buchstaben:</strong><span style="font-size: 9.5pt; font-style: italic;">${amountInWords}</span></div>
              <div class="grid-item"><strong>Tag der Zuwendung:</strong><span style="font-size: 10.5pt;">${dateStr}</span></div>
            </div>
            <div class="tax-info">
              <div><strong>Wir sind wegen Förderung</strong></div>
              <ul><li>der Jugend- und Altenhilfe</li><li>internationaler Gesinnung, der Toleranz auf allen Gebieten der Kultur und des Völker&shy;ver&shy;ständi&shy;gungs&shy;gedankens</li><li>des bürgerschaftlichen Engagements zugunsten gemeinnütziger, mildtätiger und kirchlicher Zwecke</li></ul>
              <div style="margin-top: 8px;">nach dem Freistellungsbescheid des <strong>${faName}</strong>, Steuernummer <strong>${stNr}</strong>, vom <strong>${exemptionDate}</strong> für den letzten Veranlagungszeitraum nach § 5 Abs. 1 Nr. 9 des Körperschaftsteuergesetzes von der Körperschaftsteuer und nach § 3 Nr. 6 des Gewerbesteuergesetzes von der Gewerbesteuer befreit.</div>
            </div>
            <div style="margin: 12px 0; font-weight: bold; font-size: 9.5pt;">Die Zuwendung wird von uns unmittelbar für den angegebenen Zweck verwendet.</div>
            <div class="signature-box">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; font-size: 10pt;">
                <span>Wissen, ${formatDateDE(new Date())}</span>
                <span style="margin-right: 80px;">${treasurerName}</span>
              </div>
              <div style="height: 50px; display: flex; justify-content: flex-end; align-items: flex-end; padding-right: 60px;">${signatureImg}</div>
              <div style="border-top: 1px solid #000; padding-top: 5px; display: flex; justify-content: space-between;">
                <span style="font-size: 8pt; color: #666;">Ort, Datum</span>
                <span style="font-size: 8pt; color: #666; margin-right: 80px;">Unterschrift</span>
              </div>
            </div>
          </div>
          <div class="page-footer">
            Bürgertreff Wissen e.V., c/o Erika Uber (1. Vorsitzende), Hauptstr. 79, 57587 Birken-Honigsessen<br>
            Tel. 01516 5179082 - buergertreff.wissen@gmail.com – www.buergertreff-wissen.de<br>
            Sparkasse Westerwald-Sieg IBAN: DE27 5735 1030 0055 0844 38 BIC: MALADE51AKI<br>
            StNr. 02/650/36212 – Die Gemeinnützigkeit ist anerkannt
          </div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const parsedAmount = parseFloat(formData.amount);
    if (!formData.amount || isNaN(parsedAmount) || parsedAmount <= 0 || !formData.category_id || !formData.account_id) {
      alert('Pflichtfelder fehlen! Betrag muss größer als 0 sein.'); return;
    }
    
    let finalDescription = formData.description;
    if (formData.target_year && !finalDescription.includes(formData.target_year)) {
      finalDescription = `${finalDescription} (Beitrag ${formData.target_year})`.trim();
    }

    const payload = { 
      ...formData, 
      receipt_no: formData.receipt_no ? formData.receipt_no.trim() : null,
      file_no: formData.file_no ? formData.file_no.trim() : null,
      description: finalDescription, 
      contact_id: formData.contact_id || null 
    };
    
    delete payload.target_year;

    if (editingId) {
      const { error } = await supabase.from('accounting_transactions').update(payload).eq('id', editingId);
      if (!error) { fetchTransactions(); resetForm(); } else alert(error.message);
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('accounting_transactions').insert([{ ...payload, created_by: user.id }]);
      if (!error) { fetchTransactions(); resetForm(); } else alert(error.message);
    }
  };

  const handleEdit = (trx) => {
    clearAssistantState();
    const sessionId = modalSessionRef.current;
    const docUrls = parseDocumentUrls(trx.document_url);

    setFormData({
      date: trx.date, type: trx.type, amount: trx.amount, category_id: trx.category_id,
      account_id: trx.account_id, contact_id: trx.contact_id || '', receipt_no: trx.receipt_no || '',
      file_no: trx.file_no || '', description: trx.description || '', document_url: trx.document_url || '',
      target_year: '', subcategory: trx.subcategory || ''
    });
    setEditingId(trx.id);
    setIsFormOpen(true);

    if (docUrls.length > 0) {
      const initialDocs = docUrls.map((url, idx) => ({
        id: `existing_${trx.id}_${idx}`,
        file: null,
        path: url,
        previewUrl: '',
        isPdf: url.toLowerCase().split('?')[0].endsWith('.pdf'),
        fileName: url,
        parsed: null,
        analyzing: false,
        error: ''
      }));
      updateAssistantDocs(initialDocs);
      setAssistantState(prev => ({
        ...prev,
        docs: initialDocs,
        activeDocIndex: 0
      }));

      Promise.all(
        docUrls.map((url) => supabase.storage.from('receipts').createSignedUrl(url, 300))
      ).then((results) => {
        if (modalSessionRef.current !== sessionId) return;
        const withUrls = updateAssistantDocs((docs) =>
          docs.map((doc, idx) => ({
            ...doc,
            previewUrl: results[idx]?.data?.signedUrl || doc.previewUrl
          }))
        );
        setAssistantState(prev => ({ ...prev, docs: withUrls }));
      });
    }
  };

  const handleDelete = (id) => {
    setDeleteConfirm({ 
      isOpen: true, 
      id: id, 
      type: 'single', 
      message: 'Möchten Sie diese Buchung wirklich löschen? Dieser Vorgang kann nicht rückgängig gemacht werden.' 
    });
  };

  const executeDelete = async () => {
    if (deleteConfirm.type === 'single' && deleteConfirm.id) {
      const { error } = await supabase.from('accounting_transactions').delete().eq('id', deleteConfirm.id);
      if (!error) setTransactions(transactions.filter(t => t.id !== deleteConfirm.id));
    } else if (deleteConfirm.type === 'bulk') {
      const ids = zeroAmountTrx.map(t => t.id);
      const { error } = await supabase.from('accounting_transactions').delete().in('id', ids);
      if (!error) {
        fetchTransactions();
      } else {
        alert('Fehler beim Löschen: ' + error.message);
      }
    }
    setDeleteConfirm({ isOpen: false, id: null, type: '', message: '' });
  };

  const resetForm = () => {
    clearAssistantState();
    setFormData({
      date: new Date().toISOString().slice(0, 10), type: 'expense', amount: '', category_id: '',
      account_id: '', contact_id: '', receipt_no: '', file_no: '', description: '', document_url: '', target_year: '', subcategory: ''
    });
    setEditingId(null);
    setIsFormOpen(false);
  };

  // Seçilen tipe (Einnahme / Ausgabe) göre tüm aktif kategorileri göster
  const displayedCategories = categories.filter(c => c.type === formData.type && c.is_active !== false);
  const uniqueDisplayedCategories = displayedCategories.filter(
    (category, index, array) =>
      index === array.findIndex((item) => normalizeCategoryName(item.name) === normalizeCategoryName(category.name))
  );

  // 0 tutarlı kayıtları bul
  const zeroAmountTrx = transactions.filter(t => parseFloat(t.amount) === 0);

  // Evrak (Beleg) Takip İstatistikleri ve Filtreleme
  const totalCount = transactions.length;
  const withDocCount = transactions.filter(t => parseDocumentUrls(t.document_url).length > 0).length;
  const missingDocCount = totalCount - withDocCount;
  const completionRate = totalCount > 0 ? Math.round((withDocCount / totalCount) * 100) : 100;

  const displayedTransactions = transactions.filter(t => {
    const hasDocs = parseDocumentUrls(t.document_url).length > 0;
    if (docFilter === 'with_doc') return hasDocs;
    if (docFilter === 'missing_doc') return !hasDocs;
    return true;
  });

  const deleteZeroAmountTransactions = () => {
    if (zeroAmountTrx.length === 0) return;
    setDeleteConfirm({ 
      isOpen: true, 
      id: null, 
      type: 'bulk', 
      message: `Es werden ${zeroAmountTrx.length} Buchung(en) mit dem Betrag 0,00 € gelöscht. Sind Sie sicher?` 
    });
  };

  const showAssistantColumn = Boolean(
    assistantState.docs.length > 0 ||
      parseDocumentUrls(formData.document_url).length > 0 ||
      assistantState.analyzing ||
      assistantState.result ||
      assistantState.error
  );

  const renderAssistantBadge = (field) =>
    assistantState.appliedFields?.[field] ? (
      <span className="ml-1.5 inline-flex items-center gap-1 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
        <FaMagic className="text-[9px]" /> Assistent
      </span>
    ) : null;

  const activeAssistantDoc = assistantState.docs[assistantState.activeDocIndex] || assistantState.docs[0] || null;
  const hasUnparsedModalDocs = assistantState.docs.some(d => !d.parsed && d.path);
  const invoiceSum = (assistantState.result?.items || []).reduce((sum, item) => sum + (item.numericAmount || 0), 0);
  const parsedFormAmount = Number.parseFloat(String(formData.amount || '').replace(',', '.')) || 0;
  const amountDiff = Number((parsedFormAmount - invoiceSum).toFixed(2));
  const activePreviewPath = previewModal.urls[previewModal.activeIndex] || '';
  const activePreviewSignedUrl = previewModal.signedUrls[previewModal.activeIndex] || '';
  const activePreviewIsPdf = activePreviewPath.toLowerCase().split('?')[0].endsWith('.pdf');

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Üst Bar */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex gap-2 items-center">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button onClick={() => setFilterType('all')} className={`px-3 py-1 rounded-md text-sm ${filterType === 'all' ? 'bg-white shadow text-blue-600' : 'text-gray-600'}`}>Alle</button>
            <button onClick={() => setFilterType('income')} className={`px-3 py-1 rounded-md text-sm ${filterType === 'income' ? 'bg-white shadow text-green-600' : 'text-gray-600'}`}>Einnahmen</button>
            <button onClick={() => setFilterType('expense')} className={`px-3 py-1 rounded-md text-sm ${filterType === 'expense' ? 'bg-white shadow text-red-600' : 'text-gray-600'}`}>Ausgaben</button>
          </div>
          <select value={dateFilter.preset} onChange={handlePresetChange} className="bg-gray-50 border p-1 rounded text-sm cursor-pointer">
            <option value="this_month">Dieser Monat</option>
            <option value="last_month">Letzter Monat</option>
            <option value="this_year">Dieses Jahr</option>
            <option value="last_year">Letztes Jahr</option>
            <option value="custom">Benutzerdefiniert</option>
          </select>
          {dateFilter.preset === 'custom' && (
            <div className="flex gap-2 items-center">
              <input 
                type="date" 
                name="start" 
                value={dateFilter.start} 
                onChange={handleDateChange}
                className="bg-white border border-gray-300 p-1 rounded text-sm"
                placeholder="Von"
              />
              <span className="text-gray-500">-</span>
              <input 
                type="date" 
                name="end" 
                value={dateFilter.end} 
                onChange={handleDateChange}
                className="bg-white border border-gray-300 p-1 rounded text-sm"
                placeholder="Bis"
              />
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={printList} className="bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"><FaPrint /> Liste</button>
          <button onClick={printIndex} className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"><FaPrint /> Verzeichnis</button>
          {!readOnly && (
            <>
              <input
                ref={assistantFileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf"
                className="hidden"
                onChange={handleAssistantQuickUpload}
              />
              <button
                type="button"
                onClick={openNewWithAssistant}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
                title="Einen oder mehrere Belege hochladen und automatisch ausfüllen lassen"
              >
                <FaMagic /> Beleg erfassen (Assistent)
              </button>
              <button onClick={() => { resetForm(); setIsFormOpen(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"><FaPlus /> Neu</button>
            </>
          )}
        </div>
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`bg-white rounded-xl shadow-2xl w-full ${showAssistantColumn ? 'max-w-6xl' : 'max-w-2xl'} max-h-[92vh] overflow-y-auto p-6`}>
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                {editingId ? 'Bearbeiten' : 'Neue Transaktion'}
                {assistantState.analyzing && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                    <FaSpinner className="animate-spin" /> {assistantState.progressText}
                  </span>
                )}
              </h3>
              <button
                type="button"
                onClick={resetForm}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg transition"
                aria-label="Schließen"
              >
                <FaTimes className="text-lg" />
              </button>
            </div>

            <div className={showAssistantColumn ? 'grid grid-cols-1 lg:grid-cols-12 gap-6 items-start' : ''}>
              {showAssistantColumn && (
                <div className="lg:col-span-5 space-y-4">
                  {/* Intelligenter Beleg-Assistent */}
                  <div className="bg-gradient-to-br from-emerald-50 to-blue-50 border border-emerald-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-emerald-600 text-white text-xs">
                          <FaMagic />
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-gray-900">
                            Intelligenter Beleg-Assistent {assistantState.docs.length > 1 ? `(${assistantState.docs.length} Belege)` : ''}
                          </h4>
                          <p className="text-[11px] text-gray-600">Erkannte Entwurfsdaten und Betragsabgleich</p>
                        </div>
                      </div>
                      {assistantState.result && (
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            onClick={() => applyAssistantResultToForm(assistantState.result, { onlyEmpty: true })}
                            className="px-2 py-1 rounded bg-white hover:bg-emerald-100 text-emerald-700 border border-emerald-300 text-[11px] font-semibold transition"
                          >
                            Fehlende ergänzen
                          </button>
                          <button
                            type="button"
                            onClick={() => applyAssistantResultToForm(assistantState.result, { onlyEmpty: false })}
                            className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold transition"
                          >
                            Alles übernehmen
                          </button>
                        </div>
                      )}
                    </div>

                    {assistantState.analyzing ? (
                      <div className="flex items-center gap-2 text-xs text-blue-800 bg-white/80 rounded-lg p-3 border border-blue-200">
                        <FaSpinner className="animate-spin text-blue-600 shrink-0" />
                        <span>{assistantState.progressText || 'Belege werden analysiert...'}</span>
                      </div>
                    ) : assistantState.result ? (
                      <div className="space-y-2 text-xs">
                        {assistantState.error && (
                          <div className="p-2 rounded bg-amber-50 border border-amber-200 text-amber-800">
                            {assistantState.error}
                          </div>
                        )}

                        {assistantState.result.items && assistantState.result.items.length > 1 && (
                          <div className="bg-white rounded-lg border border-indigo-200 p-2.5 space-y-1">
                            <div className="text-[11px] font-bold text-indigo-800">
                              Sammelbeleg-Übersicht ({assistantState.result.items.length} Belege)
                            </div>
                            {assistantState.result.items.map((item) => (
                              <div key={item.index} className="flex justify-between text-[11px] text-gray-700">
                                <span className="truncate pr-2">
                                  Beleg {item.index + 1} {item.receiptNo ? `(${item.receiptNo})` : ''}
                                </span>
                                <span className="font-semibold shrink-0">
                                  {item.amount ? `${item.amount} €` : '—'}
                                </span>
                              </div>
                            ))}
                            <div className="flex justify-between pt-1 mt-1 border-t border-indigo-100 text-xs font-bold text-indigo-900">
                              <span>Summe der Belege:</span>
                              <span>{invoiceSum > 0 ? `${invoiceSum.toFixed(2)} €` : '—'}</span>
                            </div>
                          </div>
                        )}

                        {invoiceSum > 0 && parsedFormAmount > 0 && (
                          <div
                            className={`p-2.5 rounded-lg border text-[11px] font-medium ${
                              Math.abs(amountDiff) < 0.02
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                : 'bg-amber-50 border-amber-300 text-amber-900'
                            }`}
                          >
                            {Math.abs(amountDiff) < 0.02 ? (
                              <span>
                                ✓ Buchungsbetrag ({parsedFormAmount.toFixed(2)} €) stimmt exakt mit der Summe der hochgeladenen Belege ({invoiceSum.toFixed(2)} €) überein.
                              </span>
                            ) : (
                              <div className="space-y-1">
                                <div>
                                  ⚠ Buchungsbetrag <strong>{parsedFormAmount.toFixed(2)} €</strong>, erkannte Belegsumme{' '}
                                  <strong>{invoiceSum.toFixed(2)} €</strong> (Differenz: <strong>{Math.abs(amountDiff).toFixed(2)} €</strong>).
                                  Falls noch eine Rechnung fehlt, können Sie diese über &quot;+ Weiterer Beleg&quot; hinzufügen.
                                </div>
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                  <button
                                    type="button"
                                    onClick={() => applySingleAssistantField('amount', invoiceSum.toFixed(2))}
                                    className="px-2 py-0.5 rounded bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                                  >
                                    Betrag auf {invoiceSum.toFixed(2)} € setzen
                                  </button>
                                  {assistantState.result.receiptNo && (
                                    <button
                                      type="button"
                                      onClick={() => applySingleAssistantField('receipt_no', assistantState.result.receiptNo)}
                                      className="px-2 py-0.5 rounded bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 font-semibold"
                                    >
                                      Beleg-Nr.: {assistantState.result.receiptNo} übernehmen
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
                          {[
                            {
                              label: 'Geschäft / Kontakt',
                              value: assistantState.result.vendorName,
                              field: 'contact_id',
                              applyValue: assistantState.result.matchedContactId
                            },
                            {
                              label: 'Datum',
                              value: assistantState.result.date ? formatDateDE(assistantState.result.date) : '',
                              field: 'date',
                              applyValue: assistantState.result.date
                            },
                            {
                              label: 'Beleg-Nr.',
                              value: assistantState.result.receiptNo,
                              field: 'receipt_no',
                              applyValue: assistantState.result.receiptNo
                            },
                            {
                              label: assistantState.result.docCount > 1 ? 'Belegsumme' : 'Betrag',
                              value: assistantState.result.amount ? `${assistantState.result.amount} €` : '',
                              field: 'amount',
                              applyValue: assistantState.result.amount
                            },
                            {
                              label: 'Typ',
                              value: assistantState.result.type === 'income' ? 'Einnahme (+)' : 'Ausgabe (-)',
                              field: 'type',
                              applyValue: assistantState.result.type
                            },
                            {
                              label: 'Vorgeschlagene Kategorie',
                              value: assistantState.result.categoryName,
                              field: 'category_id',
                              applyValue: assistantState.result.categoryId
                            },
                            {
                              label: 'Vorgeschlagenes Konto',
                              value: assistantState.result.accountName,
                              field: 'account_id',
                              applyValue: assistantState.result.accountId
                            },
                            {
                              label: 'Beschreibung',
                              value: assistantState.result.description,
                              field: 'description',
                              applyValue: assistantState.result.description
                            }
                          ].map((row) => (
                            <div key={row.label} className="flex items-center justify-between gap-2 px-2.5 py-1.5">
                              <div className="min-w-0">
                                <span className="text-gray-500">{row.label}: </span>
                                <span className={`font-semibold ${row.value ? 'text-gray-900' : 'text-gray-400 italic'}`}>
                                  {row.value || 'Nicht erkannt'}
                                </span>
                              </div>
                              {row.applyValue && (
                                <button
                                  type="button"
                                  onClick={() => applySingleAssistantField(row.field, row.applyValue)}
                                  className={`shrink-0 px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                                    assistantState.appliedFields?.[row.field] || formData[row.field] === row.applyValue
                                      ? 'bg-emerald-100 text-emerald-700'
                                      : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'
                                  }`}
                                >
                                  {formData[row.field] === row.applyValue ? '✓ Übernommen' : 'Übernehmen'}
                                </button>
                              )}
                            </div>
                          ))}
                        </div>

                        {hasUnparsedModalDocs && (
                          <button
                            type="button"
                            onClick={analyzeAllExistingModalDocs}
                            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition"
                          >
                            <FaMagic /> Ungelesene Belege auslesen
                          </button>
                        )}

                        {assistantState.result.vendorName && !assistantState.result.matchedContactId && !readOnly && (
                          <button
                            type="button"
                            disabled={addingContactFromAssistant}
                            onClick={() => handleQuickAddContactFromAssistant(assistantState.result.vendorName)}
                            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-xs font-semibold transition"
                          >
                            {addingContactFromAssistant ? <FaSpinner className="animate-spin" /> : <FaUserPlus />}
                            <span>&bdquo;{assistantState.result.vendorName}&ldquo; zu Kontakten hinzufügen &amp; auswählen</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2 text-xs">
                        {assistantState.error && (
                          <div className="p-2 rounded bg-amber-50 border border-amber-200 text-amber-800">
                            {assistantState.error}
                          </div>
                        )}
                        {assistantState.docs.length > 0 && (
                          <button
                            type="button"
                            onClick={analyzeAllExistingModalDocs}
                            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition"
                          >
                            <FaMagic /> Belege mit Assistent auslesen
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Mehrfach-Beleg Tabs & Vorschau */}
                  <div className="bg-gray-100 border border-gray-200 rounded-xl p-2 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                      <div className="flex flex-wrap items-center gap-1">
                        {assistantState.docs.map((docItem, idx) => (
                          <div
                            key={docItem.id}
                            className={`inline-flex items-center rounded-md border text-xs font-semibold transition ${
                              idx === assistantState.activeDocIndex
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => setAssistantState(prev => ({ ...prev, activeDocIndex: idx }))}
                              className="px-2.5 py-1"
                            >
                              Beleg {idx + 1}
                              {docItem.parsed?.amount ? ` (${docItem.parsed.amount} €)` : ''}
                            </button>
                            {!readOnly && (
                              <button
                                type="button"
                                onClick={() => removeModalDocAtIndex(idx)}
                                className={`pr-2 pl-0.5 py-1 hover:opacity-75 ${
                                  idx === assistantState.activeDocIndex ? 'text-blue-100' : 'text-gray-400 hover:text-red-600'
                                }`}
                                title="Beleg entfernen"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      {!readOnly && (
                        <label className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer transition">
                          <FaPlus className="text-[10px]" /> Weiterer Beleg
                          <input
                            type="file"
                            multiple
                            accept="image/*,.pdf"
                            className="hidden"
                            onChange={handleFileUpload}
                          />
                        </label>
                      )}
                    </div>

                    <div className="flex items-center justify-between px-1 text-xs text-gray-600">
                      <span className="font-semibold truncate">
                        {activeAssistantDoc?.fileName || 'Belegvorschau'}
                      </span>
                      {activeAssistantDoc?.path && (
                        <button
                          type="button"
                          onClick={() => openDocument(activeAssistantDoc.path, 0)}
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold shrink-0"
                        >
                          <FaExternalLinkAlt className="text-[10px]" /> Im neuen Tab öffnen
                        </button>
                      )}
                    </div>

                    {activeAssistantDoc?.previewUrl ? (
                      activeAssistantDoc.isPdf ? (
                        <iframe
                          src={activeAssistantDoc.previewUrl}
                          title="Belegvorschau"
                          className="w-full h-[360px] rounded border bg-white"
                        />
                      ) : (
                        <img
                          src={activeAssistantDoc.previewUrl}
                          alt="Belegvorschau"
                          className="w-full max-h-[360px] object-contain rounded border bg-white"
                        />
                      )
                    ) : (
                      <div className="h-[200px] flex items-center justify-center text-xs text-gray-500">
                        <FaSpinner className="animate-spin mr-2" /> Belegvorschau wird geladen...
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className={showAssistantColumn ? 'lg:col-span-7' : ''}>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="flex gap-4">
                    <label className="flex-1 border p-2 text-center rounded cursor-pointer hover:bg-gray-50">
                      <input type="radio" name="type" value="income" checked={formData.type === 'income'} onChange={handleInputChange} className="mr-2"/>
                      Einnahme (+)
                      {assistantState.appliedFields?.type && formData.type === 'income' && renderAssistantBadge('type')}
                    </label>
                    <label className="flex-1 border p-2 text-center rounded cursor-pointer hover:bg-gray-50">
                      <input type="radio" name="type" value="expense" checked={formData.type === 'expense'} onChange={handleInputChange} className="mr-2"/>
                      Ausgabe (-)
                      {assistantState.appliedFields?.type && formData.type === 'expense' && renderAssistantBadge('type')}
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Datum {renderAssistantBadge('date')}
                      </label>
                      <input type="date" name="date" value={formData.date} onChange={handleInputChange} className="border p-2 rounded w-full" required />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Betrag (€) {renderAssistantBadge('amount')}
                      </label>
                      <input type="number" name="amount" value={formData.amount} onChange={handleInputChange} placeholder="Betrag €" className="border p-2 rounded w-full" step="0.01" required />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Kategorie {renderAssistantBadge('category_id')}
                      </label>
                      <select name="category_id" value={formData.category_id} onChange={handleInputChange} className="border p-2 rounded w-full" required>
                        <option value="">Kategorie wählen...</option>
                        {uniqueDisplayedCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Konto {renderAssistantBadge('account_id')}
                      </label>
                      <select name="account_id" value={formData.account_id} onChange={handleInputChange} className="border p-2 rounded w-full" required>
                        <option value="">Konto wählen...</option>
                        {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Beleg-Nr. ve Ordner-Nr. Alanları */}
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Beleg-Nr. (Quittungs- / Rechnungs-Nr.) {renderAssistantBadge('receipt_no')}
                      </label>
                      <input
                        type="text"
                        name="receipt_no"
                        value={formData.receipt_no || ''}
                        onChange={handleInputChange}
                        placeholder="z.B. BAR-001, RE-2026-05"
                        className="border p-2 rounded w-full text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                      <span className="text-[11px] text-gray-500">Erscheint in der Spalte „Beleg-Nr.“ im Kassenbuch</span>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Aktenzeichen / Ordner-Nr.
                      </label>
                      <input
                        type="text"
                        name="file_no"
                        value={formData.file_no || ''}
                        onChange={handleInputChange}
                        placeholder="z.B. Ordner 2026 / Kasse"
                        className="border p-2 rounded w-full text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                      <span className="text-[11px] text-gray-500">Physischer Ablageort (Optional)</span>
                    </div>
                  </div>

                  {formData.category_id && categories.find(c => c.id == formData.category_id)?.subcategories && (
                    <div className="bg-gray-50 p-3 border border-gray-200 rounded-lg">
                      <label className="block text-xs font-bold text-gray-700 mb-1">Unterkategorie (Optional)</label>
                      <select name="subcategory" value={formData.subcategory || ''} onChange={handleInputChange} className="border p-2 rounded w-full text-sm">
                        <option value="">Keine Auswahl (Allgemein)</option>
                        {categories.find(c => c.id == formData.category_id).subcategories.split(',').map((sub, i) => (
                          <option key={i} value={sub.trim()}>{sub.trim()}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {formData.type === 'income' && (
                    <div className="bg-blue-50 p-2 rounded border border-blue-200">
                      <label className="block text-xs font-bold text-blue-800 mb-1">Beitragsjahr (Optional)</label>
                      <select name="target_year" value={formData.target_year} onChange={handleInputChange} className="border p-2 rounded w-full text-sm">
                        <option value="">Automatisch (aktuelles Datum)</option>
                        {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Kontakt / Geschäft {renderAssistantBadge('contact_id')}
                    </label>
                    <select name="contact_id" value={formData.contact_id} onChange={handleInputChange} className="border p-2 rounded w-full">
                      <option value="">Kontakt (Optional)...</option>
                      {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Beschreibung {renderAssistantBadge('description')}
                    </label>
                    <input type="text" name="description" value={formData.description} onChange={handleInputChange} placeholder="Beschreibung" className="border p-2 rounded w-full" />
                  </div>
                  
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!modalDragOver) setModalDragOver(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setModalDragOver(false);
                    }}
                    onDrop={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setModalDragOver(false);
                      const files = Array.from(e.dataTransfer?.files || []);
                      if (files.length > 0) await processModalFiles(files);
                    }}
                    className={`border-2 border-dashed rounded-lg p-3 transition ${
                      modalDragOver ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300 bg-gray-50'
                    }`}
                  >
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Beleg (Eine oder mehrere PDF-/Bilddateien auswählen oder hierher ziehen – Assistent berechnet Summe)
                    </label>
                    <input
                      type="file"
                      multiple
                      accept="image/*,.pdf"
                      onChange={handleFileUpload}
                      disabled={uploading}
                      className="block w-full text-sm text-gray-500"
                    />
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {uploading && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700">
                          <FaSpinner className="animate-spin" /> Datei wird hochgeladen...
                        </span>
                      )}
                      {parseDocumentUrls(formData.document_url).length > 0 && (
                        <>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
                            <FaCheckCircle />
                            {parseDocumentUrls(formData.document_url).length > 1
                              ? `${parseDocumentUrls(formData.document_url).length} Belege vorhanden`
                              : 'Beleg vorhanden'}
                          </span>
                          <button
                            type="button"
                            onClick={() => openDocument(formData.document_url, 0)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200 transition"
                          >
                            <FaEye /> Ansehen
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 mt-4">
                    <button type="button" onClick={resetForm} className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300">Abbrechen</button>
                    <button type="submit" disabled={uploading} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-blue-300">
                      {uploading ? 'Wird hochgeladen...' : 'Speichern'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hinweis zu 0,00-€-Buchungen */}
      {zeroAmountTrx.length > 0 && (
        <div className="mb-4 bg-orange-50 border border-orange-300 rounded-lg p-4 flex items-start gap-3">
          <FaExclamationTriangle className="text-orange-500 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="font-bold text-orange-800 text-sm">Hinweis: Es gibt {zeroAmountTrx.length} Buchung(en) mit einem Betrag von 0,00 €!</p>
            <p className="text-orange-700 text-xs mt-1">
              Diese Einträge stammen möglicherweise aus früheren Eingaben ohne Betragsprüfung. Sie können diese vor dem Löschen prüfen. Neue Buchungen mit 0,00 € sind nicht mehr möglich.
            </p>
            {!readOnly && (
              <button
                onClick={deleteZeroAmountTransactions}
                className="mt-2 bg-orange-600 text-white text-xs px-3 py-1 rounded hover:bg-orange-700"
              >
                Alle 0,00-€-Buchungen löschen ({zeroAmountTrx.length})
              </button>
            )}
          </div>
        </div>
      )}

      {/* Beleg-Kontrolle Übersicht */}
      <div className="mb-5 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setDocFilter('all')}
            className={`text-left p-3 rounded-lg border transition ${
              docFilter === 'all'
                ? 'bg-white border-blue-500 ring-2 ring-blue-100 shadow-sm'
                : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-xs font-semibold uppercase text-gray-500">Gesamt (Zeitraum)</div>
            <div className="text-2xl font-bold text-gray-800 mt-1">{totalCount}</div>
            <div className="text-xs text-gray-500 mt-0.5">Alle Buchungen</div>
          </button>

          <button
            type="button"
            onClick={() => setDocFilter('with_doc')}
            className={`text-left p-3 rounded-lg border transition ${
              docFilter === 'with_doc'
                ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-100 shadow-sm'
                : 'bg-white border-emerald-200 hover:bg-emerald-50/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-emerald-700">Beleg vorhanden</span>
              <FaCheckCircle className="text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-emerald-700 mt-1">{withDocCount}</div>
            <div className="text-xs text-emerald-600 mt-0.5">Buchungen mit Beleg</div>
          </button>

          <button
            type="button"
            onClick={() => setDocFilter('missing_doc')}
            className={`text-left p-3 rounded-lg border transition ${
              docFilter === 'missing_doc'
                ? 'bg-rose-50 border-rose-500 ring-2 ring-rose-100 shadow-sm'
                : 'bg-white border-rose-200 hover:bg-rose-50/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-rose-700">Beleg fehlt</span>
              <FaExclamationTriangle className="text-rose-600" />
            </div>
            <div className="text-2xl font-bold text-rose-700 mt-1">{missingDocCount}</div>
            <div className="text-xs text-rose-600 mt-0.5">Buchungen ohne Beleg</div>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="flex-1">
            <div className="flex justify-between text-xs font-medium text-gray-600 mb-1">
              <span>Beleg-Vollständigkeit</span>
              <span>{completionRate} % vollständig ({withDocCount}/{totalCount})</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  completionRate === 100 ? 'bg-emerald-500' : completionRate >= 50 ? 'bg-blue-500' : 'bg-amber-500'
                }`}
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-gray-500 flex items-center gap-1 mr-1"><FaFilter /> Filter:</span>
            <button
              type="button"
              onClick={() => setDocFilter('all')}
              className={`px-3 py-1 rounded-md text-xs font-semibold border transition ${
                docFilter === 'all' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
              }`}
            >
              Alle ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => setDocFilter('with_doc')}
              className={`px-3 py-1 rounded-md text-xs font-semibold border transition ${
                docFilter === 'with_doc' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50'
              }`}
            >
              Mit Beleg ({withDocCount})
            </button>
            <button
              type="button"
              onClick={() => setDocFilter('missing_doc')}
              className={`px-3 py-1 rounded-md text-xs font-semibold border transition ${
                docFilter === 'missing_doc' ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-rose-700 border-rose-300 hover:bg-rose-50'
              }`}
            >
              Ohne Beleg ({missingDocCount})
            </button>
          </div>
        </div>
      </div>

      {/* Tablo */}
      <style>{`
        @media (max-width: 768px) {
          .responsive-table { display: block; width: 100%; overflow-x: auto; border-spacing: 0; }
          .responsive-table thead { display: table-header-group; }
          .responsive-table tr { display: table-row; }
          .responsive-table td, .responsive-table th { min-width: 120px; white-space: nowrap; }
        }
        .amount-cell { white-space: nowrap; }
      `}</style>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 responsive-table">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Datum</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kategorie</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Konto / Kontakt</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Beleg</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Betrag</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aktionen</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displayedTransactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500">
                  {transactions.length === 0
                    ? 'Keine Buchungen im ausgewählten Zeitraum gefunden.'
                    : 'Keine Einträge für den ausgewählten Belegfilter gefunden.'}
                </td>
              </tr>
            ) : (
              displayedTransactions.map((trx) => {
                const isZero = parseFloat(trx.amount) === 0;
                const docUrls = parseDocumentUrls(trx.document_url);
                const hasDoc = docUrls.length > 0;
                const isUploadingRow = uploadingRowId === trx.id;
                const isDragOver = dragOverRowId === trx.id;

                return (
                <tr key={trx.id} className={`hover:bg-gray-50 ${isZero ? 'bg-orange-50' : ''}`}>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div className="font-medium text-gray-800">{formatDateDE(trx.date)}</div>
                    {trx.receipt_no && (
                      <div className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded w-fit mt-1">
                        Beleg: {trx.receipt_no}
                      </div>
                    )}
                    {trx.file_no && <div className="text-xs text-blue-600 mt-0.5">Ordner: {trx.file_no}</div>}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {trx.accounting_categories?.name}
                    {trx.subcategory && <div className="text-xs text-gray-500">↳ {trx.subcategory}</div>}
                    <div className="text-xs text-gray-500">{trx.description}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {trx.accounting_accounts?.name}
                    {trx.accounting_contacts && <div className="text-xs text-blue-600">{trx.accounting_contacts.name}</div>}
                  </td>
                  <td
                    onDragOver={(e) => handleRowDragOver(trx.id, e)}
                    onDragLeave={(e) => handleRowDragLeave(trx.id, e)}
                    onDrop={(e) => handleRowDrop(trx.id, e)}
                    className={`px-4 py-3 text-center align-middle transition ${
                      isDragOver ? 'bg-blue-50 ring-2 ring-inset ring-blue-400 rounded' : ''
                    }`}
                  >
                    {isUploadingRow ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
                        <FaSpinner className="animate-spin" /> Wird hochgeladen...
                      </span>
                    ) : hasDoc ? (
                      <div className="flex flex-col items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold whitespace-nowrap">
                          <FaCheckCircle /> {docUrls.length > 1 ? `${docUrls.length} Belege vorhanden` : 'Beleg vorhanden'}
                        </span>
                        <div className="flex flex-wrap items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => openPreviewModal(trx, 0)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition"
                            title="Beleg ansehen"
                          >
                            <FaEye /> Ansehen
                          </button>
                          <button
                            type="button"
                            onClick={() => openDocument(trx.document_url, 0)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium transition"
                            title="Im neuen Tab öffnen"
                          >
                            <FaExternalLinkAlt />
                          </button>
                          {!readOnly && (
                            <>
                              <label
                                className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium cursor-pointer transition whitespace-nowrap"
                                title="Weiteren Beleg oder Rechnung zu dieser Buchung hinzufügen"
                              >
                                <FaPlus className="text-[10px]" /> Weiterer Beleg
                                <input
                                  type="file"
                                  multiple
                                  accept="image/*,.pdf"
                                  className="hidden"
                                  onChange={(e) => handleRowFileSelect(trx.id, e, { mode: 'append' })}
                                />
                              </label>
                              {docUrls.length === 1 && (
                                <label
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 text-xs font-medium cursor-pointer transition"
                                  title="Beleg ersetzen"
                                >
                                  <FaUpload />
                                  <input
                                    type="file"
                                    accept="image/*,.pdf"
                                    className="hidden"
                                    onChange={(e) => handleRowFileSelect(trx.id, e, { mode: 'replace', replaceIndex: 0 })}
                                  />
                                </label>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-xs font-semibold whitespace-nowrap">
                          <FaExclamationTriangle /> Beleg fehlt
                        </span>
                        {!readOnly && (
                          <>
                            <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold cursor-pointer shadow-xs transition whitespace-nowrap">
                              <FaUpload /> Beleg hochladen
                              <input
                                type="file"
                                multiple
                                accept="image/*,.pdf"
                                className="hidden"
                                onChange={(e) => handleRowFileSelect(trx.id, e, { mode: 'append' })}
                              />
                            </label>
                            <span className="text-[10px] text-gray-400">oder Dateien hierher ziehen</span>
                          </>
                        )}
                      </div>
                    )}
                  </td>
                  <td className={`px-6 py-4 text-right text-sm font-bold amount-cell ${trx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {trx.type === 'income' ? '+' : '-'} {parseFloat(trx.amount).toFixed(2)} €
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium flex justify-end gap-2">
                    <button onClick={() => printVoucher(trx)} className="text-gray-600 hover:text-gray-900" title="Beleg"><FaPrint /></button>
                    {trx.type === 'income' && parseFloat(trx.amount) >= 50 && (
                      <button onClick={() => printDonationReceipt(trx)} className="text-pink-600 hover:text-pink-900" title="Spendenbescheinigung"><FaHandHoldingHeart /></button>
                    )}
                    {!readOnly && (
                      <>
                        <button onClick={() => handleEdit(trx)} className="text-blue-600 hover:text-blue-900"><FaEdit /></button>
                        <button onClick={() => handleDelete(trx.id)} className="text-red-600 hover:text-red-900"><FaTrash /></button>
                      </>
                    )}
                  </td>
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* In-App Document Preview Modal */}
      {previewModal.isOpen && previewModal.trx && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
            <div className="flex justify-between items-start gap-4 px-6 py-4 border-b bg-gray-50">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Belegvorschau {previewModal.urls.length > 1 ? `(${previewModal.urls.length} Belege)` : ''}
                </h3>
                <p className="text-xs text-gray-600 mt-1">
                  {formatDateDE(previewModal.trx.date)}
                  {previewModal.trx.receipt_no ? ` • Beleg-Nr: ${previewModal.trx.receipt_no}` : ''}
                  {previewModal.trx.accounting_categories?.name ? ` • ${previewModal.trx.accounting_categories.name}` : ''}
                  {' • '}
                  <span className={previewModal.trx.type === 'income' ? 'text-green-700 font-semibold' : 'text-red-700 font-semibold'}>
                    {previewModal.trx.type === 'income' ? '+' : '-'}{parseFloat(previewModal.trx.amount).toFixed(2)} €
                  </span>
                  {previewModal.trx.description ? ` • ${previewModal.trx.description}` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={closePreviewModal}
                className="p-2 text-gray-400 hover:text-gray-700 rounded-lg transition"
                aria-label="Schließen"
              >
                <FaTimes className="text-lg" />
              </button>
            </div>

            {previewModal.urls.length > 1 && (
              <div className="flex flex-wrap items-center gap-2 px-6 py-2.5 border-b bg-slate-50">
                {previewModal.urls.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPreviewModal(prev => ({ ...prev, activeIndex: idx }))}
                    className={`px-3 py-1 rounded-md text-xs font-semibold border transition ${
                      previewModal.activeIndex === idx
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    Beleg {idx + 1}
                  </button>
                ))}
              </div>
            )}

            <div className="p-4 flex-1 overflow-auto bg-gray-100 flex items-center justify-center min-h-[300px]">
              {previewModal.loading ? (
                <div className="flex flex-col items-center gap-2 text-gray-600">
                  <FaSpinner className="animate-spin text-3xl text-blue-600" />
                  <span className="text-sm">Beleg wird geladen...</span>
                </div>
              ) : activePreviewIsPdf && activePreviewSignedUrl ? (
                <iframe
                  src={activePreviewSignedUrl}
                  title="Beleg PDF"
                  className="w-full h-[62vh] rounded border bg-white"
                />
              ) : activePreviewSignedUrl ? (
                <img
                  src={activePreviewSignedUrl}
                  alt="Beleg"
                  className="max-w-full max-h-[62vh] mx-auto rounded shadow object-contain bg-white"
                />
              ) : null}
            </div>

            <div className="flex flex-wrap justify-between items-center gap-2 px-6 py-3 border-t bg-white">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => openDocument(previewModal.trx.document_url, previewModal.activeIndex)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold transition"
                >
                  <FaExternalLinkAlt /> Im neuen Tab öffnen
                </button>
                <button
                  type="button"
                  onClick={() => printVoucher(previewModal.trx, previewModal.activeIndex)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-800 text-white text-xs font-semibold transition"
                >
                  <FaPrint /> Drucken
                </button>
                {!readOnly && (
                  <>
                    <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer transition">
                      <FaPlus /> Weiterer Beleg
                      <input
                        type="file"
                        multiple
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => handleRowFileSelect(previewModal.trx.id, e, { mode: 'append' })}
                      />
                    </label>
                    <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold cursor-pointer transition">
                      <FaUpload /> Aktuellen Beleg ersetzen
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) =>
                          handleRowFileSelect(previewModal.trx.id, e, {
                            mode: 'replace',
                            replaceIndex: previewModal.activeIndex
                          })
                        }
                      />
                    </label>
                    {previewModal.urls.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeDocumentFromTransaction(previewModal.trx, previewModal.activeIndex)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition"
                      >
                        <FaTrash /> Aktuellen Beleg entfernen
                      </button>
                    )}
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={closePreviewModal}
                className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-900 text-white text-xs font-semibold transition"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-red-600 mb-4 flex items-center gap-2">
              <FaTrash /> Löschbestätigung
            </h3>
            <p className="text-gray-700 mb-6">{deleteConfirm.message}</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setDeleteConfirm({ isOpen: false, id: null, type: '', message: '' })} 
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
              >
                Abbrechen
              </button>
              <button 
                onClick={executeDelete} 
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium flex items-center gap-2"
              >
                <FaTrash /> Ja, löschen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}