import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';

/**
 * PDF Çıktısı Oluştur
 * Resmi vergi denetlemesi için EÜR Raporu
 */
export const exportEURToPDF = async (records, summaryData, fiscalYear) => {
  try {
    const doc = new jsPDF('p', 'mm', 'a4');
    
    // Header
    doc.setFontSize(16);
    doc.text('EINNAHMEN-ÜBERSCHUSS-RECHNUNG (EÜR)', 105, 15, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Geschäftsjahr: ${fiscalYear}`, 105, 22, { align: 'center' });
    doc.text(`Erstelltes Datum: ${new Date().toLocaleDateString('de-DE')}`, 105, 28, { align: 'center' });
    
    // Özet Tablosu
    doc.setFontSize(12);
    doc.text('ZUSAMMENFASSUNG DER STEUERSPHÄREN', 14, 40);
    
    let yPos = 48;
    let totalIncome = 0;
    let totalExpense = 0;
    
    // Tablo başlığı
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.setFillColor(220, 220, 220);
    doc.rect(14, yPos, 176, 6, 'F');
    doc.text('Sphäre / Bereich', 16, yPos + 4);
    doc.text('Einnahmen (€)', 90, yPos + 4);
    doc.text('Ausgaben (€)', 130, yPos + 4);
    doc.text('Netto (€)', 165, yPos + 4);
    
    yPos += 8;
    doc.setFont(undefined, 'normal');
    
    // Dört sphäre için summary
    const sphaeres = [
      { key: 'ideeller', name: 'Ideeller Bereich', desc: '(Gemeinnützige Aktivitäten)' },
      { key: 'vermögensv', name: 'Vermögensverwaltung', desc: '(Kapitalanlage)' },
      { key: 'zweckbetrieb', name: 'Zweckbetrieb', desc: '(Erfüllung des Vereinszwecks)' },
      { key: 'wirtschaftlich', name: 'Wirtsch. Geschäftsbetrieb', desc: '(Kommerzielle Aktivitäten)' }
    ];
    
    sphaeres.forEach((sphaere, index) => {
      const sphaereData = summaryData[sphaere.key] || { income: 0, expense: 0 };
      const netResult = sphaereData.income - sphaereData.expense;
      
      // Altlı üstlü çizgi
      doc.setDrawColor(200, 200, 200);
      doc.line(14, yPos - 1, 190, yPos - 1);
      
      // Sphäre adı ve açıklama
      doc.setFont(undefined, 'bold');
      doc.setFontSize(9);
      doc.text(`${index + 1}. ${sphaere.name}`, 16, yPos + 3);
      
      doc.setFont(undefined, 'normal');
      doc.setFontSize(8);
      doc.text(sphaere.desc, 16, yPos + 7);
      
      // Değerler
      doc.setFontSize(9);
      doc.text(`€${sphaereData.income.toFixed(2)}`, 92, yPos + 5);
      doc.text(`€${sphaereData.expense.toFixed(2)}`, 132, yPos + 5);
      doc.text(`€${netResult.toFixed(2)}`, 167, yPos + 5);
      
      totalIncome += sphaereData.income;
      totalExpense += sphaereData.expense;
      yPos += 12;
    });
    
    // Toplam satırı
    doc.setDrawColor(0);
    doc.line(14, yPos - 1, 190, yPos - 1);
    doc.setFont(undefined, 'bold');
    doc.setFontSize(10);
    doc.text('GESAMTERGEBNIS', 16, yPos + 3);
    doc.text(`€${totalIncome.toFixed(2)}`, 92, yPos + 3);
    doc.text(`€${totalExpense.toFixed(2)}`, 132, yPos + 3);
    doc.text(`€${(totalIncome - totalExpense).toFixed(2)}`, 167, yPos + 3);
    yPos += 8;
    doc.line(14, yPos - 1, 190, yPos - 1);
    
    // İşlem Detayları
    yPos += 10;
    doc.setFontSize(12);
    doc.text('BUCHUNGSLISTE (DETAILLIERTE EINTRÄGE)', 14, yPos);
    
    yPos += 8;
    
    // Tablo başlığı
    const startX = 14;
    const pageWidth = doc.internal.pageSize.getWidth();
    const maxWidth = pageWidth - 28; // 14mm marjin her iki tarafta
    
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.setFillColor(220, 220, 220);
    doc.rect(14, yPos, maxWidth, 6, 'F');
    
    doc.text('Buchungsnr.', 16, yPos + 4);
    doc.text('Datum', 45, yPos + 4);
    doc.text('Sphäre', 70, yPos + 4);
    doc.text('Betrag', 105, yPos + 4);
    doc.text('Typ', 145, yPos + 4);
    doc.text('Kategorie', 165, yPos + 4);
    
    yPos += 8;
    doc.setFont(undefined, 'normal');
    
    // Veriler
    doc.setFontSize(8);
    const maxRecords = 100; // PDF'de maksimum 100 işlem göster
    
    records.slice(0, maxRecords).forEach((record, idx) => {
      // Sayfa kontrol et
      if (yPos > 260) {
        doc.addPage();
        yPos = 15;
      }
      
      const buchungsnummer = record.buchungsnummer || '-';
      const datum = new Date(record.entry_date).toLocaleDateString('de-DE');
      const sphaere = getSphaereAbbrev(record.sphaere);
      const betrag = `€${record.amount_gross.toFixed(2)}`;
      const typ = record.transaction_type === 'income' ? 'Einnahme' : 'Ausgabe';
      const kategorie = record.sub_category || '-';
      const vorgang = (record.vorgang || '-');
      
      // Birinci satır: temel bilgiler
      doc.setFillColor(245, 245, 245);
      doc.rect(14, yPos - 1, maxWidth, 6, 'F');
      
      doc.text(buchungsnummer, 16, yPos + 2);
      doc.text(datum, 45, yPos + 2);
      doc.text(sphaere, 70, yPos + 2);
      doc.text(betrag, 105, yPos + 2);
      doc.text(typ, 145, yPos + 2);
      doc.text(kategorie, 165, yPos + 2);
      
      yPos += 5;
      
      // İkinci satır: Beschreibung (tam genişlik, wrap yapılı)
      doc.setFont(undefined, 'italic');
      doc.setTextColor(100, 100, 100);
      
      // Metni sarma (wordwrap)
      const maxDescWidth = maxWidth - 4; // 2mm padding her iki tarafta
      const lines = doc.splitTextToSize(vorgang, maxDescWidth - 15);
      lines.slice(0, 2).forEach((line, lineIdx) => {
        if (yPos > 260) {
          doc.addPage();
          yPos = 15;
        }
        doc.text('  → ' + line, 16, yPos);
        yPos += 4;
      });
      
      if (lines.length > 2) {
        doc.text('  → ... (siehe Excel-Datei)', 16, yPos);
        yPos += 4;
      }
      
      doc.setFont(undefined, 'normal');
      doc.setTextColor(0, 0, 0);
      
      yPos += 2;
      
      // Satırlar arası ince çizgi
      doc.setDrawColor(220, 220, 220);
      doc.line(14, yPos - 1, 190, yPos - 1);
      yPos += 2;
    });
    
    if (records.length > maxRecords) {
      yPos += 4;
      doc.setFontSize(8);
      doc.text(`... und ${records.length - maxRecords} weitere Einträge (siehe Excel-Datei für vollständige Liste)`, 16, yPos);
    }
    
    // Footer
    yPos = doc.internal.pageSize.getHeight() - 10;
    doc.setFontSize(8);
    doc.text(`Seite 1 / 1 | Gesamtzahl Einträge: ${records.length}`, 105, yPos, { align: 'center' });
    
    // Dosyayı indir
    doc.save(`EÜR_Bericht_${fiscalYear}.pdf`);
    console.log('✅ PDF-Bericht erstellt:', `EÜR_Bericht_${fiscalYear}.pdf`);
    
  } catch (error) {
    console.error('❌ PDF oluşturma hatası:', error);
    throw error;
  }
};

/**
 * Excel Çıktısı Oluştur
 * Analiz ve filtreleme için Excel dosyası
 */
export const exportEURToExcel = (records, summaryData, fiscalYear) => {
  try {
    const workbook = XLSX.utils.book_new();
    
    // Sheet 1: EÜR ÖZETİ
    const summarySheetData = [
      ['EINNAHMEN-ÜBERSCHUSS-RECHNUNG (EÜR)', '', ''],
      ['Geschäftsjahr', fiscalYear, ''],
      ['', '', ''],
      ['ZUSAMMENFASSUNG DER STEUERSPHÄREN', '', ''],
      ['Sphäre / Bereich', 'Einnahmen (€)', 'Ausgaben (€)', 'Netto-Ergebnis (€)'],
      ...Object.entries(summaryData).map(([key, data]) => [
        getSphaereNameDE(key),
        data.income || 0,
        data.expense || 0,
        (data.income || 0) - (data.expense || 0)
      ]),
      ['', '', '', ''],
      ['GESAMTERGEBNIS', 
        Object.values(summaryData).reduce((sum, d) => sum + (d.income || 0), 0),
        Object.values(summaryData).reduce((sum, d) => sum + (d.expense || 0), 0),
        Object.values(summaryData).reduce((sum, d) => sum + ((d.income || 0) - (d.expense || 0)), 0)
      ]
    ];
    
    const summarySheet = XLSX.utils.aoa_to_sheet(summarySheetData);
    summarySheet['!cols'] = [{ wch: 40 }, { wch: 15 }, { wch: 15 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'EÜR-Übersicht');
    
    // Sheet 2: DETAYLI İŞLEMLER
    const detailedData = [
      ['Buchungsnummer', 'Datum', 'Sphäre / Bereich', 'Transaktionstyp', 'Unterkategorie', 'Beschreibung (Vorgang)', 'Bruttobetrag (€)', 'MwSt.-Satz (%)', 'MwSt.-Betrag (€)', 'Nettobetrag (€)', 'Beleg-Nr.', 'Lagerstätte', 'Bemerkungen'],
      ...records.map(r => [
        r.buchungsnummer || '-',
        r.entry_date || '-',
        getSphaereNameDE(r.sphaere) || '-',
        r.transaction_type === 'income' ? 'Einnahme' : 'Ausgabe',
        r.sub_category || '-',
        r.vorgang || '-',
        r.amount_gross || 0,
        r.vat_rate || 0,
        r.amount_vat || 0,
        r.amount_net || 0,
        r.belegnummer || '-',
        r.stored_location || '-',
        r.notes || '-'
      ])
    ];
    
    const detailedSheet = XLSX.utils.aoa_to_sheet(detailedData);
    detailedSheet['!cols'] = [
      { wch: 18 }, { wch: 12 }, { wch: 25 }, { wch: 15 },
      { wch: 18 }, { wch: 35 }, { wch: 14 }, { wch: 12 },
      { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 18 }, { wch: 25 }
    ];
    XLSX.utils.book_append_sheet(workbook, detailedSheet, 'Detaillierte Einträge');
    
    // Sheet 3: SPHÄRE ANALİZİ
    const sphaereAnalysis = [
      ['ANALYSE NACH STEUERSPHÄREN', '', ''],
      ['', '', '']
    ];
    
    Object.entries(summaryData).forEach(([key, data]) => {
      sphaereAnalysis.push([getSphaereNameDE(key), '', '']);
      sphaereAnalysis.push(['Einnahmen:', data.income || 0, '€']);
      sphaereAnalysis.push(['Ausgaben:', data.expense || 0, '€']);
      sphaereAnalysis.push(['Netto-Ergebnis:', (data.income || 0) - (data.expense || 0), '€']);
      sphaereAnalysis.push(['Anzahl Einträge:', data.count || 0, '']);
      sphaereAnalysis.push(['', '', '']);
    });
    
    const sphaereSheet = XLSX.utils.aoa_to_sheet(sphaereAnalysis);
    sphaereSheet['!cols'] = [{ wch: 40 }, { wch: 15 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(workbook, sphaereSheet, 'Sphären-Analyse');
    
    // Dosyayı indir
    XLSX.writeFile(workbook, `EÜR_Detailbericht_${fiscalYear}.xlsx`);
    console.log('✅ Excel-Datei erstellt:', `EÜR_Detailbericht_${fiscalYear}.xlsx`);
    
  } catch (error) {
    console.error('❌ Excel oluşturma hatası:', error);
    throw error;
  }
};

/**
 * CSV Çıktısı Oluştur
 * Basit, universal format
 */
export const exportEURToCSV = (records, fiscalYear) => {
  try {
    const headers = [
      'Buchungsnummer',
      'Datum',
      'Sphäre / Bereich',
      'Transaktionstyp',
      'Beschreibung',
      'Bruttobetrag',
      'MwSt.-Betrag',
      'Nettobetrag',
      'Beleg-Nummer',
      'Bemerkungen'
    ];
    
    const csvContent = [
      headers.join(','),
      ...records.map(r => [
        r.buchungsnummer || '-',
        r.entry_date || '-',
        getSphaereNameDE(r.sphaere) || '-',
        r.transaction_type === 'income' ? 'Einnahme' : 'Ausgabe',
        `"${(r.vorgang || '').replace(/"/g, '""')}"`, // CSV'de tırnak işaretiyle koru
        r.amount_gross || 0,
        r.amount_vat || 0,
        r.amount_net || 0,
        r.belegnummer || '-',
        `"${(r.notes || '').replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');
    
    // Dosyayı indir
    downloadCSVFile(csvContent, `EÜR_Einträge_${fiscalYear}.csv`);
    console.log('✅ CSV-Datei erstellt:', `EÜR_Einträge_${fiscalYear}.csv`);
    
  } catch (error) {
    console.error('❌ CSV-Erstellungsfehler:', error);
    throw error;
  }
};

/**
 * Helper: Sphäre Adını Almanca'ya Çevir (Kısa Form - PDF'de)
 */
const getSphaereAbbrev = (sphaereKey) => {
  const sphaereMap = {
    'ideeller': 'Ideell',
    'vermögensv': 'Vermög.',
    'zweckbetrieb': 'Zweck',
    'wirtschaftlich': 'Wirtsch.'
  };
  return sphaereMap[sphaereKey] || sphaereKey;
};

/**
 * Helper: Sphäre Adını Almanca'ya Çevir (Uzun Form)
 */
const getSphaereNameDE = (sphaereKey) => {
  const sphaereMap = {
    'ideeller': 'Ideeller Bereich (Gemeinnützige Mitglieder-Aktivitäten)',
    'vermögensv': 'Vermögensverwaltung (Kapitalanlage und Zinserträge)',
    'zweckbetrieb': 'Zweckbetrieb (Betriebe zur Erfüllung des satzungsmäßigen Vereinszwecks)',
    'wirtschaftlich': 'Wirtschaftlicher Geschäftsbetrieb (Kommerzielle und nebengewerbe Aktivitäten)'
  };
  return sphaereMap[sphaereKey] || sphaereKey;
};

/**
 * Helper: CSV Dosyasını İndir
 */
const downloadCSVFile = (csvContent, fileName) => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Helper: Genel İndir Fonksiyonu (tüm formatlar)
 */
export const exportAllFormats = async (records, summaryData, fiscalYear) => {
  try {
    console.log('📤 Alle Dateiformate werden erstellt...');
    
    // Hepsini sırasıyla çalıştır
    await exportEURToPDF(records, summaryData, fiscalYear);
    await new Promise(resolve => setTimeout(resolve, 500)); // 500ms bekle
    
    exportEURToExcel(records, summaryData, fiscalYear);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    exportEURToCSV(records, fiscalYear);
    
    console.log('✅ Alle Dateien wurden erfolgreich erstellt!');
    
  } catch (error) {
    console.error('❌ Fehler beim Erstellen der Ausgaben:', error);
    throw error;
  }
};
