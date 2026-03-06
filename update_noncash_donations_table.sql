-- Update accounting_noncash_donations table to match the NonCashDonations component requirements
-- Run this SQL in your Supabase SQL editor

-- First, drop the trigger if it exists (must do this before altering column type)
DROP TRIGGER IF EXISTS trg_generate_donation_number ON accounting_noncash_donations;

-- Drop the function if it exists
DROP FUNCTION IF EXISTS generate_donation_number();

-- Make donation_number nullable and drop UNIQUE constraint
ALTER TABLE accounting_noncash_donations 
ALTER COLUMN donation_number DROP NOT NULL;

-- Increase the size of donation_number to accommodate longer strings
ALTER TABLE accounting_noncash_donations 
ALTER COLUMN donation_number TYPE VARCHAR(30);

-- Drop the UNIQUE constraint on donation_number temporarily
ALTER TABLE accounting_noncash_donations 
DROP CONSTRAINT IF EXISTS accounting_noncash_donations_donation_number_key;

-- Add missing columns if they don't exist
ALTER TABLE accounting_noncash_donations 
ADD COLUMN IF NOT EXISTS acquisition_details TEXT,
ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'privatvermogen',
ADD COLUMN IF NOT EXISTS valuation_proof BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS purpose TEXT,
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'accepted',
ADD COLUMN IF NOT EXISTS document_url TEXT;

-- Create a function to automatically generate donation_number
CREATE OR REPLACE FUNCTION generate_donation_number()
RETURNS TRIGGER AS $$
DECLARE
  year_val INT;
  next_num INT;
  new_number VARCHAR(30);
BEGIN
  -- Get the year from the donation_date field
  year_val := EXTRACT(YEAR FROM NEW.donation_date);
  
  -- Get the next sequence number for this year
  SELECT COALESCE(MAX(CAST(SUBSTRING(donation_number FROM '\d+$') AS INT)), 0) + 1
  INTO next_num
  FROM accounting_noncash_donations
  WHERE donation_number LIKE 'SACHSPENDE-' || year_val || '/%';
  
  -- Generate the new donation number
  new_number := 'SACHSPENDE-' || year_val || '/' || LPAD(next_num::TEXT, 5, '0');
  
  NEW.donation_number := new_number;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate donation_number before insert
DROP TRIGGER IF EXISTS trg_generate_donation_number ON accounting_noncash_donations;
CREATE TRIGGER trg_generate_donation_number
  BEFORE INSERT ON accounting_noncash_donations
  FOR EACH ROW
  WHEN (NEW.donation_number IS NULL)
  EXECUTE FUNCTION generate_donation_number();

-- Re-add UNIQUE constraint after fixing the trigger
ALTER TABLE accounting_noncash_donations 
ADD CONSTRAINT accounting_noncash_donations_donation_number_key UNIQUE (donation_number);

-- Create an index for the donation_date column for better query performance
CREATE INDEX IF NOT EXISTS idx_noncash_donations_date ON accounting_noncash_donations(donation_date);
CREATE INDEX IF NOT EXISTS idx_noncash_donations_donor ON accounting_noncash_donations(donor_contact_id);
CREATE INDEX IF NOT EXISTS idx_noncash_donations_status ON accounting_noncash_donations(status);

-- Add a comment to the table
COMMENT ON TABLE accounting_noncash_donations IS 'Sachspenden (In-Kind Donations) - Manages non-monetary donations with Anlage 4 compliance';
COMMENT ON COLUMN accounting_noncash_donations.donation_date IS 'Date of donation receipt';
COMMENT ON COLUMN accounting_noncash_donations.donor_contact_id IS 'Reference to donor in accounting_contacts';
COMMENT ON COLUMN accounting_noncash_donations.item_description IS 'Brief description of donated items';
COMMENT ON COLUMN accounting_noncash_donations.acquisition_details IS 'Detailed description including age, condition, original purchase price';
COMMENT ON COLUMN accounting_noncash_donations.estimated_value IS 'Fair market value (gemeiner Wert) of the donation';
COMMENT ON COLUMN accounting_noncash_donations.source IS 'Source of donation: privatvermogen or betriebsvermogen';
COMMENT ON COLUMN accounting_noncash_donations.valuation_proof IS 'Whether proof of valuation exists (receipt, appraisal, etc.)';
COMMENT ON COLUMN accounting_noncash_donations.purpose IS 'Purpose of donation per organization charter (Satzungszweck)';
COMMENT ON COLUMN accounting_noncash_donations.status IS 'Status: accepted, pending, or rejected';
COMMENT ON COLUMN accounting_noncash_donations.document_url IS 'URL to uploaded photo or document in Supabase storage';
