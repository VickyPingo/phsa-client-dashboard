export interface Client {
  id: string;
  first_contact_date: string | null;
  client_name: string;
  volunteer: string | null;
  age: string | null;
  sex: string | null;
  reason_for_contact: string | null;
  how_found_us: string | null;
  phone_number: string | null;
  province: string | null;
  referral_1: string | null;
  referral_2: string | null;
  follow_up_date: string | null;
  made_contact_with_pc: string | null;
  decision: string | null;
  closed_date: string | null;
  conclusion: string | null;
  testimony_potential: string | null;
  testimony_text: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type ClientInsert = Omit<Client, 'id' | 'created_at' | 'updated_at'>;

export const VOLUNTEERS = [
  'Anri', 'Steph', 'Jane', 'Lynn H', 'Lyn VB',
  'Rebecca', 'Renette', 'Mandisa', 'Mari', 'Marietjie',
  'Melanie', 'Anne', 'Joan',
];

export const PROVINCES = [
  'Gauteng', 'KZN', 'Free State', 'Limpopo', 'Mpumalanga',
  'Western Cape', 'Eastern Cape', 'North West', 'Northern Cape',
];

export const REASONS_FOR_CONTACT = [
  'Unwanted pregnancy (abortion services)',
  'Unwanted pregnancy (adoption services)',
  'Pregnancy support',
  'Pregnancy test',
  'Wanting to fall pregnant',
  'Post abortion counselling',
  'Failed abortion',
  'Enquiring about services',
  'Other',
];

export const HOW_FOUND_OPTIONS = [
  'Facebook',
  'Instagram',
  'Word of mouth',
  'Internet search',
  'Other social media',
  'Referral',
  'Other',
];

export const CONCLUSIONS = [
  'No further response',
  'Doesnt want further assistance',
  'In contact with centre',
  'Will contact centre if needing further assistance',
  'Not pregnant',
  'Miscarriage',
];

export const DECISIONS = ['P', 'AB-P', 'AD-P', 'MIS', 'AB-AB', 'Other'];

export const MADE_CONTACT_OPTIONS = [
  'Yes', 'No', 'Partially', 'Planning to', 'Not sure',
];

export interface Testimony {
  id: string;
  client_name: string;
  first_contact_date: string | null;
  testimony_text: string | null;
  testimony_edited: string | null;
  province: string | null;
  reason_for_contact: string | null;
  created_at: string;
  updated_at: string;
}

export type Page = 'dashboard' | 'clients' | 'add-client' | 'testimonies' | 'reports';
