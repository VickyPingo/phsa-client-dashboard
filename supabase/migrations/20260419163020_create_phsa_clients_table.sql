
/*
  # PHSA Client Management Schema

  ## Summary
  Creates the core data model for Pregnancy Help South Africa's client management system.

  ## New Tables

  ### clients
  Stores all client records with counselling details:
  - id: UUID primary key
  - first_contact_date: When the client first reached out
  - client_name: Full name of the client
  - volunteer_name: Name of the PHSA volunteer handling the case
  - age: Client age as text (number or "Unknown")
  - sex: F / M / Unknown
  - reason_for_contact: Category of why they contacted PHSA
  - how_found_phsa: How the client discovered PHSA
  - phone_number: Contact number
  - province: South African province
  - referral_1: First referral centre name
  - referral_2: Second referral centre name
  - follow_up_date: Scheduled follow-up date
  - made_contact_with_pc: Contact status (Yes/No/Partially/Planning to/Not sure)
  - decision: Outcome decision code (P, AB-P, AD-P, MIS, AB-AB, etc.)
  - closed_date: Date the case was closed
  - conclusion: Final outcome category
  - testimony_potential: Whether client may provide testimony (Yes/No)
  - testimony_text: Actual testimony text if provided
  - notes: Freeform case notes
  - created_at / updated_at: Audit timestamps

  ## Security
  - RLS enabled on clients table
  - Anonymous users have read/write access (org uses shared anon key internally)
    Note: For production, this should be restricted to authenticated staff users
*/

CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_contact_date date,
  client_name text NOT NULL,
  volunteer_name text,
  age text DEFAULT 'Unknown',
  sex text DEFAULT 'Unknown',
  reason_for_contact text,
  how_found_phsa text,
  phone_number text,
  province text,
  referral_1 text,
  referral_2 text,
  follow_up_date date,
  made_contact_with_pc text DEFAULT 'No',
  decision text,
  closed_date date,
  conclusion text,
  testimony_potential text DEFAULT 'No',
  testimony_text text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read"
  ON clients FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon insert"
  ON clients FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon update"
  ON clients FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon delete"
  ON clients FOR DELETE
  TO anon
  USING (true);

CREATE INDEX IF NOT EXISTS idx_clients_volunteer ON clients(volunteer_name);
CREATE INDEX IF NOT EXISTS idx_clients_province ON clients(province);
CREATE INDEX IF NOT EXISTS idx_clients_first_contact ON clients(first_contact_date);
CREATE INDEX IF NOT EXISTS idx_clients_testimony ON clients(testimony_potential);
