require("dotenv").config();

const TOKEN = process.env.BOT_TOKEN;
const URL = process.env.WEBHOOK_URL;

if (!TOKEN || !URL) {
  console.error("Set BOT_TOKEN and WEBHOOK_URL in .env");
  console.error("WEBHOOK_URL example: https://your-app.vercel.app/api/webhook");
  process.exit(1);
}

fetch(`https://api.telegram.org/bot${TOKEN}/setWebhook?url=${encodeURIComponent(URL)}`)
  .then((r) => r.json())
  .then((data) => console.log(data))
  .catch((err) => console.error(err));
