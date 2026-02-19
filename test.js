import https from "https";

https.get("https://srhzusqaoxbxsylitdkq.supabase.co", (res) => {
  console.log("Status:", res.statusCode);
}).on("error", (err) => {
  console.error("Error:", err.message);
});