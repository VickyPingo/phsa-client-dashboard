/*
  # Create phsa_clients table

  Creates the core client management table used throughout the application.

  ## New Tables
  - `phsa_clients`: Stores all client records with counselling details
    - `id`: UUID primary key
    - `first_contact_date`: Date of first contact
    - `first_contact_time`: Time of first contact (HH:MM), used for reporting time-of-day patterns
    - `client_name`: Full name
    - `volunteer`: PHSA volunteer handling the case
    - `age`: Age as text (number or "Unknown")
    - `sex`: F / M / Unknown
    - `reason_for_contact`: Category of contact reason
    - `how_found_us`: How client discovered PHSA
    - `phone_number`: Contact number
    - `province`: South African province
    - `referral_1`, `referral_2`: Referral centre names
    - `follow_up_date`: Scheduled follow-up
    - `made_contact_with_pc`: Contact status
    - `decision`: Outcome decision code
    - `closed_date`: Case closed date
    - `conclusion`: Final outcome
    - `testimony_potential`: Yes/No
    - `testimony_text`: Testimony text if provided
    - `notes`: Freeform case notes
    - `created_at`, `updated_at`: Audit timestamps

  ## Security
  - RLS enabled; authenticated users have full access
*/

CREATE TABLE IF NOT EXISTS phsa_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_contact_date date,
  first_contact_time time DEFAULT NULL,
  client_name text NOT NULL DEFAULT '',
  volunteer text,
  age text,
  sex text,
  reason_for_contact text,
  how_found_us text,
  phone_number text,
  province text,
  referral_1 text,
  referral_2 text,
  follow_up_date date,
  made_contact_with_pc text,
  decision text,
  closed_date date,
  conclusion text,
  testimony_potential text DEFAULT 'No',
  testimony_text text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE phsa_clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can select phsa_clients"
  ON phsa_clients FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert phsa_clients"
  ON phsa_clients FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update phsa_clients"
  ON phsa_clients FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete phsa_clients"
  ON phsa_clients FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_phsa_clients_first_contact ON phsa_clients(first_contact_date);
CREATE INDEX IF NOT EXISTS idx_phsa_clients_volunteer ON phsa_clients(volunteer);
CREATE INDEX IF NOT EXISTS idx_phsa_clients_province ON phsa_clients(province);
CREATE INDEX IF NOT EXISTS idx_phsa_clients_testimony ON phsa_clients(testimony_potential);
CREATE INDEX IF NOT EXISTS idx_phsa_clients_contact_time ON phsa_clients(first_contact_time);
