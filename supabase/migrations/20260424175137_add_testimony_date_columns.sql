/*
  # Add missing date columns to phsa_testimonies

  ## Changes
  - `phsa_testimonies`
    - Add `testimony_received_date` (date, nullable) — when the testimony was received
    - Add `published_date` (date, nullable) — when the testimony was published
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'phsa_testimonies' AND column_name = 'testimony_received_date'
  ) THEN
    ALTER TABLE phsa_testimonies ADD COLUMN testimony_received_date date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'phsa_testimonies' AND column_name = 'published_date'
  ) THEN
    ALTER TABLE phsa_testimonies ADD COLUMN published_date date;
  END IF;
END $$;
