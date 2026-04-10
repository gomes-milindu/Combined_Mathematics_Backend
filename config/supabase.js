import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("SUPABASE_URL:", supabaseUrl);
console.log("SUPABASE_KEY:", serviceKey ? "EXISTS" : "MISSING");

let supabase = null;

if (supabaseUrl && serviceKey) {
  supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });
} else {
  console.warn(
    "Supabase disabled (missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)"
  );
}

export default supabase;