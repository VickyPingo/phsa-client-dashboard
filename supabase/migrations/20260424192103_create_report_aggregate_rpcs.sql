/*
  # Report aggregation RPC functions

  Creates server-side functions that return pre-aggregated data for the
  Reports page. This avoids fetching thousands of raw rows to the client
  and bypasses Supabase's default 1000-row limit.

  ## Functions
  - `report_kpis(date_from text, date_to text)` — scalar KPI counts
  - `report_group_by(col text, date_from text, date_to text)` — generic
    count-per-value for a given column
  - `report_avg_age(date_from text, date_to text)` — average numeric age
  - `report_contact_time_bands(date_from text, date_to text)` — counts
    grouped into the defined time-of-day bands

  All functions are SECURITY DEFINER so RLS is bypassed for authenticated
  users who call them via the anon/service role; the functions themselves
  filter only phsa_clients rows and return aggregates, never raw PII.
*/

-- KPI counts ----------------------------------------------------------
CREATE OR REPLACE FUNCTION report_kpis(date_from text DEFAULT NULL, date_to text DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total      bigint;
  v_female     bigint;
  v_male       bigint;
  v_referrals  bigint;
  v_testimony  bigint;
  v_avg_age    numeric;
BEGIN
  SELECT
    COUNT(*)                                                         INTO v_total
  FROM phsa_clients
  WHERE (date_from IS NULL OR first_contact_date >= date_from::date)
    AND (date_to   IS NULL OR first_contact_date <= date_to::date);

  SELECT COUNT(*) INTO v_female
  FROM phsa_clients
  WHERE sex = 'F'
    AND (date_from IS NULL OR first_contact_date >= date_from::date)
    AND (date_to   IS NULL OR first_contact_date <= date_to::date);

  SELECT COUNT(*) INTO v_male
  FROM phsa_clients
  WHERE sex = 'M'
    AND (date_from IS NULL OR first_contact_date >= date_from::date)
    AND (date_to   IS NULL OR first_contact_date <= date_to::date);

  SELECT COUNT(*) INTO v_referrals
  FROM phsa_clients
  WHERE (referral_1 IS NOT NULL OR referral_2 IS NOT NULL)
    AND (date_from IS NULL OR first_contact_date >= date_from::date)
    AND (date_to   IS NULL OR first_contact_date <= date_to::date);

  SELECT COUNT(*) INTO v_testimony
  FROM phsa_clients
  WHERE testimony_potential = 'Yes'
    AND (date_from IS NULL OR first_contact_date >= date_from::date)
    AND (date_to   IS NULL OR first_contact_date <= date_to::date);

  SELECT AVG(age::numeric) INTO v_avg_age
  FROM phsa_clients
  WHERE age ~ '^\d+$'
    AND (date_from IS NULL OR first_contact_date >= date_from::date)
    AND (date_to   IS NULL OR first_contact_date <= date_to::date);

  RETURN json_build_object(
    'total',     v_total,
    'female',    v_female,
    'male',      v_male,
    'referrals', v_referrals,
    'testimony', v_testimony,
    'avg_age',   CASE WHEN v_avg_age IS NULL THEN NULL ELSE round(v_avg_age, 1) END
  );
END;
$$;

-- Generic group-by count ----------------------------------------------
-- col must be one of a fixed safe set to prevent SQL injection
CREATE OR REPLACE FUNCTION report_group_by(col text, date_from text DEFAULT NULL, date_to text DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sql  text;
  v_result json;
BEGIN
  IF col NOT IN ('province','reason_for_contact','how_found_us','volunteer','decision','conclusion','sex') THEN
    RAISE EXCEPTION 'Invalid column: %', col;
  END IF;

  v_sql := format(
    $q$
      SELECT json_object_agg(coalesce(bucket, 'Unknown'), cnt ORDER BY cnt DESC)
      FROM (
        SELECT %I AS bucket, COUNT(*) AS cnt
        FROM phsa_clients
        WHERE (%L::date IS NULL OR first_contact_date >= %L::date)
          AND (%L::date IS NULL OR first_contact_date <= %L::date)
        GROUP BY %I
      ) sub
    $q$,
    col, date_from, date_from, date_to, date_to, col
  );

  EXECUTE v_sql INTO v_result;
  RETURN coalesce(v_result, '{}'::json);
END;
$$;

-- Time-of-day band counts ---------------------------------------------
CREATE OR REPLACE FUNCTION report_contact_time_bands(date_from text DEFAULT NULL, date_to text DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result json;
BEGIN
  SELECT json_object_agg(band, cnt)
  INTO v_result
  FROM (
    SELECT
      CASE
        WHEN EXTRACT(HOUR FROM first_contact_time) BETWEEN 6  AND 11 THEN 'Morning'
        WHEN EXTRACT(HOUR FROM first_contact_time) BETWEEN 12 AND 13 THEN 'Lunch'
        WHEN EXTRACT(HOUR FROM first_contact_time) BETWEEN 14 AND 17 THEN 'Afternoon'
        WHEN EXTRACT(HOUR FROM first_contact_time) BETWEEN 18 AND 20 THEN 'Evening'
        WHEN EXTRACT(HOUR FROM first_contact_time) BETWEEN 21 AND 23 THEN 'Night'
        WHEN EXTRACT(HOUR FROM first_contact_time) BETWEEN 0  AND 5  THEN 'Early Hours'
      END AS band,
      COUNT(*) AS cnt
    FROM phsa_clients
    WHERE first_contact_time IS NOT NULL
      AND (date_from IS NULL OR first_contact_date >= date_from::date)
      AND (date_to   IS NULL OR first_contact_date <= date_to::date)
    GROUP BY band
  ) sub
  WHERE band IS NOT NULL;

  RETURN coalesce(v_result, '{}'::json);
END;
$$;

GRANT EXECUTE ON FUNCTION report_kpis(text, text)             TO authenticated;
GRANT EXECUTE ON FUNCTION report_group_by(text, text, text)   TO authenticated;
GRANT EXECUTE ON FUNCTION report_contact_time_bands(text, text) TO authenticated;
