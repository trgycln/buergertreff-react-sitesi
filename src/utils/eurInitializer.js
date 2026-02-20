import { supabase } from '../supabaseClient';

/**
 * EÜR Initialisierungsfunktion
 * Migriert vorhandene accounting_transactions-Daten automatisch in die
 * accounting_eur_records-Tabelle.
 */
export async function initializeEURRecords() {
  try {
    console.log('🔄 EÜR-Einträge werden initialisiert...');

    // Schritt 1: Prüfe, ob die Zieltabelle leer ist
    const { data: existingRecords, error: checkError } = await supabase
      .from('accounting_eur_records')
      .select('id, vorgang', { count: 'exact' })
      .limit(1);

    // Prüfe auf alte türkische Daten (inkompatibles Format)
    const hasOldTurkishData = existingRecords && existingRecords.some(r => 
      r.vorgang && (r.vorgang.includes('Gelir') || r.vorgang.includes('Gider'))
    );

    if (hasOldTurkishData) {
      console.log('⚠️ Alte türkische Daten erkannt. Werden gelöscht und neu importiert...');
      const { error: deleteError } = await supabase
        .from('accounting_eur_records')
        .delete()
        .neq('id', 0); // Alle löschen
      
      if (deleteError) throw deleteError;
    } else if (existingRecords && existingRecords.length > 0) {
      console.log(`✅ EÜR-Tabelle hat bereits ${existingRecords.length} Einträge. Migration übersprungen.`);
      return { success: true, message: 'Tabelle bereits gefüllt', count: existingRecords.length };
    }

    // Schritt 2: Rufe vorhandene Transaktionen auf
    const { data: transactions, error: txError } = await supabase
      .from('accounting_transactions')
      .select('*, accounting_categories(id, name, type)')
      .order('date', { ascending: true });

    if (txError) throw txError;

    if (!transactions || transactions.length === 0) {
      console.log('ℹ️ Keine Transaktionsdaten vorhanden. Migration nicht erforderlich.');
      return { success: true, message: 'Keine Daten zum Migrieren', count: 0 };
    }

    console.log(`📊 Konvertiere ${transactions.length} Transaktionen zum EÜR-Format...`);

    // Schritt 3: Konvertiere Transaktionen zu EÜR-Format
    const yearCounters = {};
    const eurRecords = transactions.map((tx) => {
      const year = new Date(tx.date).getFullYear();
      
      if (!yearCounters[year]) {
        yearCounters[year] = 0;
      }
      yearCounters[year]++;

      // Bestimme Sphäre anhand des Kategorienamens
      let sphaere = 'ideeller'; // Standardwert
      const catName = tx.accounting_categories?.name || '';
      
      const catLower = catName.toLowerCase();
      if (catLower.match(/zins|konto|kredit|bank|faiz/)) {
        sphaere = 'vermögensv';
      } else if (catLower.match(/kurs|event|aktivität|veranstaltung|seminar|etkinlik|spor|aktivite/)) {
        sphaere = 'zweckbetrieb';
      } else if (catLower.match(/verkauf|reklam|kaffee|bar|shop|satış|ürün/)) {
        sphaere = 'wirtschaftlich';
      }

      return {
        fiscal_year: year,
        entry_date: tx.date,
        buchungsnummer: `EÜR-${year}-${String(yearCounters[year]).padStart(5, '0')}`,
        vorgang: `${tx.type === 'income' ? 'Einnahme' : 'Ausgabe'}: ${catName}${tx.description ? ' - ' + tx.description : ''}`,
        belegnummer: tx.receipt_no || '',
        amount_gross: parseFloat(tx.amount) || 0,
        amount_net: parseFloat(tx.amount) || 0,
        amount_vat: 0,
        vat_rate: 0,
        sphaere: sphaere,
        transaction_type: tx.type,
        sub_category: catName || 'Nicht kategorisiert',
        document_url: tx.document_url || '',
        stored_location: tx.file_no ? `Datei-Nr: ${tx.file_no}` : '',
        notes: 'Automatische Migration - Aus Transaktionen',
        created_by: 'system'
      };
    });

    console.log(`📝 ${eurRecords.length} EÜR-Einträge vorbereitet. Wird in Datenbank geschrieben...`);

    // Schritt 4: Batch-Einfügung (Supabase batch-Limit: ~1000 Datensätze)
    const batchSize = 1000;
    let successCount = 0;

    for (let i = 0; i < eurRecords.length; i += batchSize) {
      const batch = eurRecords.slice(i, i + batchSize);
      console.log(`  Batch ${i / batchSize + 1}/${Math.ceil(eurRecords.length / batchSize)} wird geschrieben...`);
      
      const { error: insertError } = await supabase
        .from('accounting_eur_records')
        .insert(batch);

      if (insertError) {
        console.error(`✗ Batch-Einfügungsfehler:`, insertError);
        throw insertError;
      }
      
      successCount += batch.length;
    }

    console.log(`✅ Insgesamt ${successCount} EÜR-Einträge erfolgreich in die Datenbank importiert!`);
    
    // Schritt 5: Zusammenfassung nach Jahren anzeigen
    console.log('\n📈 Zusammenfassung nach Jahren:');
    Object.entries(yearCounters).forEach(([year, count]) => {
      console.log(`  ${year}: ${count} Einträge`);
    });

    return {
      success: true,
      message: `${successCount} Einträge erfolgreich migriert`,
      count: successCount,
      yearBreakdown: yearCounters
    };

  } catch (error) {
    console.error('❌ EÜR-Migrationsfehler:', error);
    return {
      success: false,
      message: error.message,
      error: error
    };
  }
}

/**
 * EÜR-Daten löschen (zu Testzwecken)
 */
export async function clearEURRecords() {
  try {
    const { data, error } = await supabase
      .from('accounting_eur_records')
      .delete()
      .eq('created_by', 'system');

    if (error) throw error;
    console.log('✅ EÜR-Testdaten gelöscht');
    return { success: true };
  } catch (error) {
    console.error('Fehler beim Löschen:', error);
    return { success: false, error };
  }
}

/**
 * EÜR-Statistiken abrufen
 */
export async function getEURStatistics(fiscalYear) {
  try {
    const { data, error } = await supabase
      .from('accounting_eur_records')
      .select('sphaere, transaction_type, amount_gross')
      .eq('fiscal_year', fiscalYear);

    if (error) throw error;

    const summary = {
      ideeller: { income: 0, expense: 0 },
      vermögensv: { income: 0, expense: 0 },
      zweckbetrieb: { income: 0, expense: 0 },
      wirtschaftlich: { income: 0, expense: 0 }
    };

    data.forEach(record => {
      if (summary[record.sphaere]) {
        if (record.transaction_type === 'income') {
          summary[record.sphaere].income += parseFloat(record.amount_gross);
        } else {
          summary[record.sphaere].expense += parseFloat(record.amount_gross);
        }
      }
    });

    return { success: true, data: summary };
  } catch (error) {
    console.error('Fehler beim Abrufen von Statistiken:', error);
    return { success: false, error };
  }
}
