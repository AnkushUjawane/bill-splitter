// Every housemate gets one color, and it follows them everywhere:
// their tile, their dot on each bill, their piece of the split bar.
// The colors themselves (--member-0 ... --member-5) are defined in Page.module.css.
const COLOR_COUNT = 6

export function memberColor(index: number): string {
  return `var(--member-${index % COLOR_COUNT})`
}

// Used for a moment while the member list is still loading.
export const NEUTRAL_COLOR = 'var(--line)'
