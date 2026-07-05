import "dotenv/config";

const TOKEN = process.env.BOT_TOKEN;
const URL = process.env.WEBHOOK_URL;

if (!TOKEN || !URL) {
  console.error("Set BOT_TOKEN and WEBHOOK_URL in .env");
  console.error("WEBHOOK_URL should be like https://your-app.vercel.app/api/webhook");
  process.exit(1);
}

const res = await fetch(
  `https://api.telegram.org/bot${TOKEN}/setWebhook?url=${encodeURIComponent(URL)}`
);
const data = await res.json();
console.log(data);
