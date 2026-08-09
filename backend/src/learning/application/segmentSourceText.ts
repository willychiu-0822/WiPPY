export interface SourceTextSegmentInput {
  ordinal: number;
  text: string;
}

export function segmentSourceText(body: string): SourceTextSegmentInput[] {
  if (body.length > 50_000) {
    throw new Error('source_body_too_large');
  }

  const segments = body
    .split(/\r?\n\s*\r?\n+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .map((text, ordinal) => ({ ordinal, text }));

  if (segments.length > 400) {
    throw new Error('too_many_paragraphs');
  }

  return segments;
}
