function chunkText(text, options = {}) {
  const chunkSize = options.chunkSize || 1200;
  const overlap = options.overlap || 200;

  if (!text || typeof text !== "string") {
    return [];
  }

  const normalizedText = text
    .replace(/\r\n/g, "\n")
    .replace(/\t/g, " ")
    .trim();

  const chunks = [];
  let start = 0;

  while (start < normalizedText.length) {
    const end = Math.min(start + chunkSize, normalizedText.length);
    const chunk = normalizedText.slice(start, end).trim();

    if (chunk.length > 0) {
      chunks.push(chunk);
    }

    if (end === normalizedText.length) {
      break;
    }

    start = end - overlap;
  }

  return chunks;
}

module.exports = {
  chunkText,
};