import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://magmhrdbwpcfkibudtqj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hZ21ocmRid3BjZmtpYnVkdHFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NTI1NjAsImV4cCI6MjA4NzQyODU2MH0.ksv-5y1AErj7SJja0v2BkspOajqOk0MqWRNUIDRBA5w',
  { db: { schema: 'phsa' } }
);
