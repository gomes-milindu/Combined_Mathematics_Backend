import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error("Missing SUPABASE_URL in environment");
}

if (!supabaseKey) {
  throw new Error(
    "Missing Supabase key. Set SUPABASE_SERVICE_ROLE_KEY (preferred) or SUPABASE_SECRET_KEY/SUPABASE_ANON_KEY."
  );
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
