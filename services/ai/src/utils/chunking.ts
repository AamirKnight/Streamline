export function chunkText(text: string, wordsPerChunk: number = 400): string[] {
  if (!text || text.trim().length === 0) {
    return [];
  }

  const words = text.split(/\s+/);
  const chunks: string[] = [];

  for (let i = 0; i < words.length; i += wordsPerChunk) {
    const chunk = words.slice(i, i + wordsPerChunk).join(' ');
    if (chunk.trim().length > 50) {
      chunks.push(chunk);
    }
  }

  return chunks;
}