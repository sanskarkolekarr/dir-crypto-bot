require("dotenv").config();
const { createBot } = require("./lib/bot");

const token = process.env.BOT_TOKEN;
if (!token) {
  console.error("❌ BOT_TOKEN not set in .env");
  process.exit(1);
}

const bot = createBot(token);
bot.launch();
console.log("🤖 Bot is running (polling)...");

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
