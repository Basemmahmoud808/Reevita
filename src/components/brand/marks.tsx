export function CrownIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M2.5 7.2 8 11.4 16 2l8 9.4 5.5-4.2-2.2 12.1H4.7L2.5 7.2Z"
        fill="currentColor"
      />
      <circle cx="2.6" cy="5.4" r="1.7" fill="currentColor" />
      <circle cx="16" cy="1.7" r="1.7" fill="currentColor" />
      <circle cx="29.4" cy="5.4" r="1.7" fill="currentColor" />
      <rect x="4.7" y="21" width="22.6" height="1.9" rx="0.95" fill="currentColor" />
    </svg>
  );
}

export function LeafMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M38 10c0 14-9 24-22 24H10c0-14 9-24 22-24h6Z"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <path d="M10 38c6-10 13-16 24-22" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.6" cy="6.4" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M15.5 21v-7h2.4l.6-3h-3V9.2c0-.9.3-1.5 1.6-1.5h1.5V5.1c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8V11H10v3h2.7v7" />
    </svg>
  );
}

