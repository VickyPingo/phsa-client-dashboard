import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface ReferralCentre {
  id: string;
  name: string;
  province: string | null;
}

export function useReferralCentres() {
  const [centres, setCentres] = useState<ReferralCentre[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('phsa_referral_centres')
      .select('id, name, province')
      .order('name', { ascending: true })
      .then(({ data }) => {
        setCentres((data ?? []) as ReferralCentre[]);
        setLoading(false);
      });
  }, []);

  // Quick lookup: centre name (lowercase) → province
  const provinceByName = Object.fromEntries(
    centres
      .filter(c => c.province)
      .map(c => [c.name.toLowerCase(), c.province as string])
  );

  return { centres, loading, provinceByName };
}
