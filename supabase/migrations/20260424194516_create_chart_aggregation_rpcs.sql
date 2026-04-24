/*
  # Chart Aggregation RPCs

  Creates server-side functions to return grouped counts for chart data,
  bypassing the PostgREST row limit entirely. Each function accepts optional
  date range filters and returns {name, value} rows sorted by value descending.

  1. New Functions
    - get_reason_counts      — counts by reason_for_contact
    - get_how_found_counts   — counts by how_found_us
    - get_volunteer_counts   — counts by volunteer
    - get_province_counts    — counts by province
    - get_decision_counts    — counts by decision
    - get_conclusion_counts  — counts by conclusion
    - get_time_band_counts   — counts bucketed by hour of first_contact_time
    - get_avg_age            — average age as numeric

  2. Security
    - SECURITY DEFINER so aggregation bypasses RLS (no individual rows exposed)
    - Granted to authenticated role only
*/

-- Reason for contact
CREATE OR REPLACE FUNCTION get_reason_counts(
  date_from date DEFAULT NULL,
  date_to   date DEFAULT NULL
)
RETURNS TABLE(name text, value bigint)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    COALESCE(reason_for_contact, 'Unknown') AS name,
    COUNT(*) AS value
  FROM phsa_clients
  WHERE (date_from IS NULL OR first_contact_date >= date_from)
    AND (date_to   IS NULL OR first_contact_date <= date_to)
  GROUP BY name
  ORDER BY value DESC;
$$;

GRANT EXECUTE ON FUNCTION get_reason_counts(date, date) TO authenticated;

-- How found us
CREATE OR REPLACE FUNCTION get_how_found_counts(
  date_from date DEFAULT NULL,
  date_to   date DEFAULT NULL
)
RETURNS TABLE(name text, value bigint)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    COALESCE(how_found_us, 'Unknown') AS name,
    COUNT(*) AS value
  FROM phsa_clients
  WHERE (date_from IS NULL OR first_contact_date >= date_from)
    AND (date_to   IS NULL OR first_contact_date <= date_to)
  GROUP BY name
  ORDER BY value DESC;
$$;

GRANT EXECUTE ON FUNCTION get_how_found_counts(date, date) TO authenticated;

-- Volunteer
CREATE OR REPLACE FUNCTION get_volunteer_counts(
  date_from date DEFAULT NULL,
  date_to   date DEFAULT NULL
)
RETURNS TABLE(name text, value bigint)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    COALESCE(volunteer, 'Unknown') AS name,
    COUNT(*) AS value
  FROM phsa_clients
  WHERE volunteer IS NOT NULL AND volunteer <> ''
    AND (date_from IS NULL OR first_contact_date >= date_from)
    AND (date_to   IS NULL OR first_contact_date <= date_to)
  GROUP BY name
  ORDER BY value DESC;
$$;

GRANT EXECUTE ON FUNCTION get_volunteer_counts(date, date) TO authenticated;

-- Province
CREATE OR REPLACE FUNCTION get_province_counts(
  date_from date DEFAULT NULL,
  date_to   date DEFAULT NULL
)
RETURNS TABLE(name text, value bigint)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    COALESCE(province, 'Unknown') AS name,
    COUNT(*) AS value
  FROM phsa_clients
  WHERE (date_from IS NULL OR first_contact_date >= date_from)
    AND (date_to   IS NULL OR first_contact_date <= date_to)
  GROUP BY name
  ORDER BY value DESC;
$$;

GRANT EXECUTE ON FUNCTION get_province_counts(date, date) TO authenticated;

-- Decision
CREATE OR REPLACE FUNCTION get_decision_counts(
  date_from date DEFAULT NULL,
  date_to   date DEFAULT NULL
)
RETURNS TABLE(name text, value bigint)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    decision AS name,
    COUNT(*) AS value
  FROM phsa_clients
  WHERE decision IS NOT NULL AND decision <> ''
    AND (date_from IS NULL OR first_contact_date >= date_from)
    AND (date_to   IS NULL OR first_contact_date <= date_to)
  GROUP BY name
  ORDER BY value DESC;
$$;

GRANT EXECUTE ON FUNCTION get_decision_counts(date, date) TO authenticated;

-- Conclusion
CREATE OR REPLACE FUNCTION get_conclusion_counts(
  date_from date DEFAULT NULL,
  date_to   date DEFAULT NULL
)
RETURNS TABLE(name text, value bigint)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    conclusion AS name,
    COUNT(*) AS value
  FROM phsa_clients
  WHERE conclusion IS NOT NULL AND conclusion <> ''
    AND (date_from IS NULL OR first_contact_date >= date_from)
    AND (date_to   IS NULL OR first_contact_date <= date_to)
  GROUP BY name
  ORDER BY value DESC;
$$;

GRANT EXECUTE ON FUNCTION get_conclusion_counts(date, date) TO authenticated;

-- Time bands — first_contact_time is a time column, filter only IS NOT NULL
CREATE OR REPLACE FUNCTION get_time_band_counts(
  date_from date DEFAULT NULL,
  date_to   date DEFAULT NULL
)
RETURNS TABLE(name text, value bigint)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    CASE
      WHEN EXTRACT(HOUR FROM first_contact_time) >=  6 AND EXTRACT(HOUR FROM first_contact_time) < 12 THEN 'Morning'
      WHEN EXTRACT(HOUR FROM first_contact_time) >= 12 AND EXTRACT(HOUR FROM first_contact_time) < 14 THEN 'Lunch'
      WHEN EXTRACT(HOUR FROM first_contact_time) >= 14 AND EXTRACT(HOUR FROM first_contact_time) < 18 THEN 'Afternoon'
      WHEN EXTRACT(HOUR FROM first_contact_time) >= 18 AND EXTRACT(HOUR FROM first_contact_time) < 21 THEN 'Evening'
      WHEN EXTRACT(HOUR FROM first_contact_time) >= 21                                                 THEN 'Night'
      ELSE 'Early Hours'
    END AS name,
    COUNT(*) AS value
  FROM phsa_clients
  WHERE first_contact_time IS NOT NULL
    AND (date_from IS NULL OR first_contact_date >= date_from)
    AND (date_to   IS NULL OR first_contact_date <= date_to)
  GROUP BY name
  ORDER BY value DESC;
$$;

GRANT EXECUTE ON FUNCTION get_time_band_counts(date, date) TO authenticated;

-- Average age (age stored as text, filter to numeric-looking values)
CREATE OR REPLACE FUNCTION get_avg_age(
  date_from date DEFAULT NULL,
  date_to   date DEFAULT NULL
)
RETURNS numeric
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT ROUND(AVG(age::numeric), 1)
  FROM phsa_clients
  WHERE age ~ '^\d+$'
    AND (date_from IS NULL OR first_contact_date >= date_from)
    AND (date_to   IS NULL OR first_contact_date <= date_to);
$$;

GRANT EXECUTE ON FUNCTION get_avg_age(date, date) TO authenticated;
