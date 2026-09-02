import { supabase } from '../supabaseClient';

export const fetchMergedSponsors = async () => {
  try {
    // 1. Manual Sponsors (sponsors table)
    const { data: sponsorsRes } = await supabase
      .from('sponsors')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    
    const manualSponsors = sponsorsRes || [];

    // 2. Accounting Transactions (for dynamic monetary sponsors)
    const { data: txData } = await supabase
      .from('accounting_transactions')
      .select('contact_id, amount, description, category:accounting_categories(name)')
      .eq('type', 'income');

    const transactions = txData || [];
    const donationKeywords = ['spende', 'zuwendung', 'donation', 'bagis', 'bağış', 'sponsor'];
    const excludeKeywords = ['mitglied', 'beitrag', 'aidat', 'darlehen', 'kredit'];

    const donationSums = new Map();

    transactions.forEach(tx => {
      const desc = (tx.description || '').toLowerCase();
      const catName = (tx.category?.name || '').toLowerCase();
      const textToSearch = desc + ' ' + catName;

      const isDonation = donationKeywords.some(kw => textToSearch.includes(kw));
      const isExcluded = excludeKeywords.some(kw => textToSearch.includes(kw));

      if (isDonation && !isExcluded && tx.contact_id) {
        const amt = parseFloat(tx.amount) || 0;
        donationSums.set(tx.contact_id, (donationSums.get(tx.contact_id) || 0) + amt);
      }
    });

    // 3. Accounting Contacts
    const { data: contactsData } = await supabase
      .from('accounting_contacts')
      .select('id, name, logo_url, website_url, category');
    
    const contacts = contactsData || [];

    // 4. Merge Logic
    // Create map of accounting donors >= 100
    const mergedMap = new Map(); // key: lowercase name, value: sponsor object

    // Add Accounting Donors First
    contacts.forEach(c => {
      const total = donationSums.get(c.id) || 0;
      if (total >= 100) {
        const nameKey = c.name.trim().toLowerCase();
        
        // Find if this contact is also manually in sponsors to grab logo/website
        const matchedSponsor = manualSponsors.find(s => 
          s.name && (
            s.name.toLowerCase().includes(nameKey) || 
            nameKey.includes(s.name.toLowerCase()) ||
            (s.name.toLowerCase().includes('stiftung') && nameKey.includes('stiftung'))
          )
        );

        const logo = c.logo_url || (matchedSponsor && matchedSponsor.logo_url) || '';
        const website = c.website_url || (matchedSponsor && matchedSponsor.website_url) || '';

        let isCompany = false;
        if (c.category === 'person') isCompany = false;
        else if (c.category === 'institution') isCompany = true;
        else isCompany = !!logo || /(GmbH|e\.V\.|eG|Sparkasse|Bank\b|Stiftung|Verbandsgemeinde)/i.test(c.name);

        mergedMap.set(nameKey, {
          id: `contact-${c.id}`,
          name: c.name,
          category: isCompany ? 'institution' : 'person',
          logo_url: logo,
          website_url: website,
          totalAmount: total,
          isManual: false
        });
      }
    });

    // Add remaining Manual Sponsors (Service providers who aren't in accounting >=100)
    manualSponsors.forEach(s => {
      if (!s.name) return;
      const nameKey = s.name.trim().toLowerCase();
      
      // If not already added by accounting
      if (!mergedMap.has(nameKey)) {
        // Eğer tier_amount diye bir alan gelirse onu al, yoksa description içinde tutarı aramaya çalış (örnek: "500" => Gold)
        let manualAmount = parseFloat(s.tier_amount) || 0;
        
        if (!manualAmount && s.description) {
            if (s.description.toLowerCase().includes('platin')) manualAmount = 1000;
            else if (s.description.toLowerCase().includes('gold')) manualAmount = 500;
            else if (s.description.toLowerCase().includes('silber')) manualAmount = 200;
            else if (s.description.toLowerCase().includes('bronze')) manualAmount = 100;
        }

        mergedMap.set(nameKey, {
          id: `manual-${s.id}`,
          name: s.name,
          category: s.category || 'institution',
          logo_url: s.logo_url || '',
          website_url: s.website_url || '',
          totalAmount: manualAmount || 100, // Varsayılan Bronze
          sort_order: s.sort_order || 0,
          isManual: true
        });
      }
    });

    const allMerged = Array.from(mergedMap.values());

    // 5. Separate into Institutions and Persons
    const institutions = allMerged
      .filter(d => d.category === 'institution')
      .sort((a, b) => b.totalAmount - a.totalAmount || (a.sort_order || 0) - (b.sort_order || 0) || a.name.localeCompare(b.name, 'de-DE'));

    const persons = allMerged
      .filter(d => d.category === 'person')
      .sort((a, b) => b.totalAmount - a.totalAmount || (a.sort_order || 0) - (b.sort_order || 0) || a.name.localeCompare(b.name, 'de-DE'));

    return { institutions, persons, allMerged };

  } catch (error) {
    console.error("Error fetching merged sponsors:", error);
    return { institutions: [], persons: [], allMerged: [] };
  }
};
