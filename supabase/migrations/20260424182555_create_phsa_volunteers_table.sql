/*
  # Create phsa_volunteers table

  Stores the list of PHSA volunteers that appear throughout the app
  (client form, filter sidebar, reports, chat extraction).

  ## New Tables
  - `phsa_volunteers`
    - `id`: UUID primary key
    - `name`: Volunteer display name (unique, used as the stored value in phsa_clients.volunteer)
    - `email`: Optional contact email
    - `is_active`: Whether the volunteer appears in dropdowns (default true)
    - `created_at`, `updated_at`: Audit timestamps

  ## Security
  - RLS enabled; authenticated users have full CRUD access
*/

CREATE TABLE IF NOT EXISTS phsa_volunteers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text DEFAULT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT phsa_volunteers_name_unique UNIQUE (name)
);

ALTER TABLE phsa_volunteers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can select phsa_volunteers"
  ON phsa_volunteers FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert phsa_volunteers"
  ON phsa_volunteers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update phsa_volunteers"
  ON phsa_volunteers FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete phsa_volunteers"
  ON phsa_volunteers FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_phsa_volunteers_active ON phsa_volunteers(is_active);
CREATE INDEX IF NOT EXISTS idx_phsa_volunteers_name ON phsa_volunteers(name);

-- Seed with existing volunteers from the hardcoded list
INSERT INTO phsa_volunteers (name) VALUES
  ('Anri'), ('Steph'), ('Jane'), ('Lynn H'), ('Lyn VB'),
  ('Rebecca'), ('Renette'), ('Mandisa'), ('Mari'), ('Marietjie'),
  ('Melanie'), ('Anne'), ('Joan')
ON CONFLICT (name) DO NOTHING;
