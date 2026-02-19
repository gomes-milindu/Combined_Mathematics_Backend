import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_ANON_KEY;

console.log("URL:", supabaseUrl);
console.log("Key:", supabaseKey ? "Found (hidden)" : "Missing");

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    const { data, error } = await supabase.storage.listBuckets();
    if (error) {
      console.error("Error listing buckets:", error);
    } else {
      console.log("Buckets:", data);
    }
  } catch (err) {
    console.error("Exception:", err);
  }
}

testConnection();
