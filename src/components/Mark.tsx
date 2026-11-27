export function Mark({ className = 'h-9 w-9' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" fill="#FFE600" />
      <polygon points="16,4 26,10 26,22 16,28 6,22 6,10" fill="#141414" />
      <polygon points="16,9 22,12.5 22,19.5 16,23 10,19.5 10,12.5" fill="#FFE600" />
    </svg>
  )
}
