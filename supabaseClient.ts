import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://krdzfbceuoccmwmjszdo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyZHpmYmNldW9jY213bWpzemRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0MTAyMDMsImV4cCI6MjA5Mjk4NjIwM30.bKh0oQaZAIl101CdNTRAJ7QmBsq8HvQrxkCYPEhV3lA';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
