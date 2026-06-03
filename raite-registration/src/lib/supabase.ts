import { createClient } from "@supabase/supabase-js";
import { env } from "@/env";

const supabaseKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  throw new Error("Supabase API key is missing (neither publishable nor anon key found)");
}

export const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseKey
);
