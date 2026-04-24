/*
  # Create phsa_testimonies table

  ## New Tables
  - `phsa_testimonies`
    - `id` (uuid, primary key)
    - `client_name` (text, not null) — name of the client
    - `first_contact_date` (date, nullable) — date of first contact, used for year filtering
    - `testimony_text` (text, nullable) — original testimony
    - `testimony_edited` (text, nullable) — edited/cleaned version; displayed in preference to testimony_text
    - `province` (text, nullable)
    - `reason_for_contact` (text, nullable)
    - `created_at` (timestamptz, default now())
    - `updated_at` (timestamptz, default now())

  ## Security
  - RLS enabled; only authenticated users can read/insert/update
*/

CREATE TABLE IF NOT EXISTS phsa_testimonies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name text NOT NULL DEFAULT '',
  first_contact_date date,
  testimony_text text,
  testimony_edited text,
  province text,
  reason_for_contact text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE phsa_testimonies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read testimonies"
  ON phsa_testimonies FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert testimonies"
  ON phsa_testimonies FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update testimonies"
  ON phsa_testimonies FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
