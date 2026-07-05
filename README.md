# CryptoWallet Bot - Cybersecurity Demo

A Telegram bot demonstrating social engineering scam techniques for cybersecurity education.

## Setup

1. Copy `.env` and add your `BOT_TOKEN` from [@BotFather](https://t.me/BotFather)
2. Deploy to Vercel
3. Set webhook:
   ```
   npm run set-webhook
   ```

## Commands

- `/start` — Show coin selection

## Files

| File | Purpose |
|------|---------|
| `lib/bot.js` | Bot logic and handlers |
| `app/api/webhook/route.js` | Vercel webhook endpoint |
| `bot.js` | Local polling (testing) |
| `scripts/set-webhook.js` | Register webhook URL |
