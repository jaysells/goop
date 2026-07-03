const UNIT_MS = {
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
  w: 7 * 24 * 60 * 60 * 1000,
};

// Parses strings like "1h", "30m", "2d", "1d12h", "45s"
function parseDuration(input) {
  if (!input) return null;
  const regex = /(\d+)\s*(s|m|h|d|w)/gi;
  let match;
  let total = 0;
  let found = false;
  while ((match = regex.exec(input)) !== null) {
    found = true;
    const value = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();
    total += value * UNIT_MS[unit];
  }
  return found ? total : null;
}

module.exports = { parseDuration };
