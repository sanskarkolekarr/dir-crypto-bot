import { createBot } from "../../../lib/bot.js";

export const runtime = "nodejs";

let bot = null;

function getBot() {
  if (!bot) {
    const token = process.env.BOT_TOKEN;
    if (!token) throw new Error("BOT_TOKEN not set");
    bot = createBot(token);
  }
  return bot;
}

export async function POST(request) {
  try {
    const update = await request.json();
    await getBot().handleUpdate(update);
    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response("Error", { status: 200 });
  }
}

export async function GET() {
  return new Response(JSON.stringify({ status: "ok", message: "Bot webhook active" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
