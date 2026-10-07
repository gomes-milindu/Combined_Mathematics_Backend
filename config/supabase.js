
import 'dotenv/config';
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("CWD:", process.cwd());
console.log("URL:", supabaseUrl);
console.log("KEY exists:", !!serviceKey);
console.log("Supabase related env names:", Object.keys(process.env).filter(k => k.toUpperCase().includes("SUPABASE")));

// ---- තාවකාලික debug (check කරලා ඉවර වුණාම මේක මකන්න) ----
try {
  const payload = JSON.parse(
    Buffer.from(serviceKey.split(".")[1], "base64url").toString()
  );
  console.log("KEY ROLE:", payload.role);
} catch (e) {
  console.log("KEY ROLE: decode කරන්න බැරි වුණා (JWT format එකක් නෙවෙයි)");
}
// --
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