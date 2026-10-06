const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env.local' });
require('dotenv').config({ path: './.env' });

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Supabase URL or Key is missing.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function alterTable() {
  console.log("Checking if receipt_number column exists or trying to query it...");
  
  // Try querying it
  const { data, error } = await supabase.from('accounting_transactions').select('receipt_number').limit(1);
  
  if (error) {
    console.log("Column probably doesn't exist. Error:", error.message);
    console.log("Since we can't easily alter tables using supabase-js anon key, we will have to use the supabase SQL endpoint or ask the user if they can add it from the Supabase dashboard.");
  } else {
    console.log("Column receipt_number already exists.");
  }
}

alterTable();
