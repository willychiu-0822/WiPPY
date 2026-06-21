export interface FocusScrollMetrics {
  rowTop: number;          // row's top in viewport coords (getBoundingClientRect)
  scrollerTop: number;     // scroller's top in viewport coords
  scrollerScrollTop: number;
  scrollerClientHeight: number;
  scrollerScrollHeight: number;
  rowHeight: number;
}

// Centers the focused row within the scroller, clamped to the scrollable range.
// Uses viewport-relative rects (not offsetTop) so it stays correct regardless of
// which ancestor is the offsetParent — the previous offsetTop-based math could
// push the top-ranked row out of view.
export function computeFocusScrollTop(m: FocusScrollMetrics): number {
  const rowOffsetWithinScroller = m.rowTop - m.scrollerTop + m.scrollerScrollTop;
  const maxTop = Math.max(0, m.scrollerScrollHeight - m.scrollerClientHeight);
  const desiredTop = rowOffsetWithinScroller - m.scrollerClientHeight / 2 + m.rowHeight / 2;
  return Math.min(maxTop, Math.max(0, desiredTop));
}
