const token = process.env.TELEGRAM_BOT_TOKEN?.trim();

if (!token) {
  console.error("Set TELEGRAM_BOT_TOKEN in .env.local before running this script.");
  process.exit(1);
}

const response = await fetch(`https://api.telegram.org/bot${token}/getUpdates`, {
  cache: "no-store",
});

if (!response.ok) {
  console.error(`Telegram could not read bot updates (HTTP ${response.status}). Check the token.`);
  process.exit(1);
}

const payload = await response.json();
if (!payload.ok || !Array.isArray(payload.result)) {
  console.error("Telegram returned an invalid response. Check the bot token and try again.");
  process.exit(1);
}

const chatIds = [...new Set(
  payload.result
    .map((update) => update.message?.chat)
    .filter((chat) => chat?.type === "private" && chat.id !== undefined)
    .map((chat) => String(chat.id)),
)];

if (chatIds.length === 0) {
  console.log("No private chat found. Open your bot in Telegram, press Start, send /start, then rerun this script.");
} else {
  console.log("Private Telegram chat ID(s):");
  for (const chatId of chatIds) console.log(chatId);
}
