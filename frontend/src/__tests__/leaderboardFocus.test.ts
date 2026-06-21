import { describe, it, expect } from 'vitest';
import { computeFocusScrollTop } from '../lib/leaderboardFocus';

// Scroller showing ~6 rows of 50px in a 300px viewport over 600px of content.
const SCROLLER = {
  scrollerTop: 0,
  scrollerScrollTop: 0,
  scrollerClientHeight: 300,
  scrollerScrollHeight: 600,
  rowHeight: 50,
};

describe('computeFocusScrollTop', () => {
  it('keeps the rank-1 row fully visible at the top (regression: was scrolled out of view)', () => {
    // Rank 1 sits at the very top of the content.
    const top = computeFocusScrollTop({ ...SCROLLER, rowTop: 0 });
    expect(top).toBe(0);
  });

  it('centers a mid-list row within the scroller', () => {
    // A row 250px down should center: 250 - 150 + 25 = 125.
    const top = computeFocusScrollTop({ ...SCROLLER, rowTop: 250 });
    expect(top).toBe(125);
  });

  it('never scrolls past the bottom of the content', () => {
    // The last row near the bottom must clamp to maxTop (600 - 300 = 300).
    const top = computeFocusScrollTop({ ...SCROLLER, rowTop: 575 });
    expect(top).toBe(300);
  });

  it('accounts for an existing scroll offset via viewport-relative rects', () => {
    // Already scrolled 100px; the focused row appears 50px below the scroller top,
    // so its true content offset is 150 → 150 - 150 + 25 = 25.
    const top = computeFocusScrollTop({
      ...SCROLLER,
      scrollerScrollTop: 100,
      rowTop: 50,
    });
    expect(top).toBe(25);
  });
});
