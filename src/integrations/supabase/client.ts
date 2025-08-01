// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://tnzkzwtkeefessnnwsiv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRuemt6d3RrZWVmZXNzbm53c2l2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3NjYxNjgsImV4cCI6MjA2ODM0MjE2OH0.qXCpW20mxqUSko63hISPMhd91hmJIifVtzw54mDPee8";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});