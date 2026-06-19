export const KNOWLEDGE_MARKER = 'EXTRACTED_KNOWLEDGE:';

/**
 * Strip the EXTRACTED_KNOWLEDGE block from a reply so the user sees only prose.
 * No-op when the marker is absent.
 */
export function stripKnowledgeBlock(rawReply: string): string {
  const idx = rawReply.indexOf(KNOWLEDGE_MARKER);
  return idx === -1 ? rawReply : rawReply.slice(0, idx).trim();
}
