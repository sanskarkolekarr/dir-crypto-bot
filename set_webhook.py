import os
import telebot
from dotenv import load_dotenv

load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN")
if not BOT_TOKEN:
    raise ValueError("No BOT_TOKEN provided. Please set it in your .env file.")

bot = telebot.TeleBot(BOT_TOKEN)

# Replace this with your actual Vercel URL
VERCEL_URL = "https://your-vercel-project.vercel.app/api"

# Remove any previous webhook
bot.remove_webhook()

# Set the new webhook
bot.set_webhook(url=VERCEL_URL)

print(f"Webhook set successfully to {VERCEL_URL}")
