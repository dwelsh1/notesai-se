export const tabsSelectors = {
  bar: '[data-testid="tabs-bar"]',
  empty: '[data-testid="tabs-empty"]',
  /** Tab item (class-based; use for counting tabs). Per-tab testids are `tab-${id}`, `tab-pin-${id}`, `tab-close-${id}`. */
  item: '.tabs-bar__tab',
}
