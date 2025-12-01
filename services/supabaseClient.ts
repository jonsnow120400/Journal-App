import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cdtrpbnkwybvfmqnpgpo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkdHJwYm5rd3lidmZtcW5wZ3BvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MTk2NDIsImV4cCI6MjA4MDE5NTY0Mn0.0QwcrsZAoO6s3-WC7QZwwUuJZAfAjuReNretyFA6pdI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);