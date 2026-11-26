/**
 * The app's icons: drawn in one style (24-unit grid, 2px rounded strokes, current text colour).
 * They are decoration beside a text label or an aria-label, so screen readers skip them.
 */
export type IconName = 'arrow-left' | 'arrow-right' | 'close' | 'chevron-up' | 'chevron-down' | 'check' | 'cross' | 'play' | 'speaker-on' | 'speaker-off'

const PATHS: Record<IconName, React.ReactNode> = {
  'arrow-left': <path d="M19 12H5m6-6-6 6 6 6" />,
  'arrow-right': <path d="M5 12h14m-6-6 6 6-6 6" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  'chevron-up': <path d="m6 15 6-6 6 6" />,
  'chevron-down': <path d="m6 9 6 6 6-6" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  cross: <path d="M7 7l10 10M17 7 7 17" />,
  play: <path d="M7 4.5v15l12.5-7.5z" fill="currentColor" />,
  'speaker-on': (
    <>
      <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" />
      <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />
    </>
  ),
  'speaker-off': (
    <>
      <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" />
      <path d="M16 9.5l5 5m0-5-5 5" />
    </>
  ),
}

export function Icon({ name, size = 20, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg
      className={`icon${className ? ` ${className}` : ''}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  )
}
