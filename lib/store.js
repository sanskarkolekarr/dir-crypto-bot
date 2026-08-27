const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(__dirname, "..", "data", "settings.json");

function loadSettings() {
  try {
    if (!fs.existsSync(DATA_FILE)) return { adjustment: null };
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch {
    return { adjustment: null };
  }
}

function saveSettings(settings) {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(settings, null, 2));
}

/**
 * Returns the stored adjustment string, e.g. "+1000" or "2x".
 * Returns null if not set.
 */
function getAdjustment() {
  return loadSettings().adjustment;
}

/**
 * Saves the adjustment string (replaces old one).
 * @param {string} value  e.g. "+400" | "2x" | "3x"
 */
function setAdjustment(value) {
  const settings = loadSettings();
  settings.adjustment = value;
  saveSettings(settings);
}

/**
 * Applies the stored adjustment to a base amount.
 * Falls back to +4200 if no adjustment is saved.
 * @param {number} amount
 * @returns {number}
 */
function applyAdjustment(amount) {
  const adj = getAdjustment();
  if (!adj) return amount + 4200; // default fallback
  if (/^\d+(\.\d+)?x$/i.test(adj)) {
    // Multiply mode: "2x", "3x", "2.5x" …
    const mult = parseFloat(adj);
    return amount * mult;
  }
  // Add mode: "+400" or just "400"
  const add = parseFloat(adj.replace(/^\+/, ""));
  return amount + add;
}

module.exports = { getAdjustment, setAdjustment, applyAdjustment };
