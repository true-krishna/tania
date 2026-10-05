import type { SVGProps } from "react";

export function GoogleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 48" width="18" height="18" aria-hidden="true" {...props}>
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );
}

export function FacebookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="11" fill="#1877F2" />
      <path
        fill="#fff"
        d="M15.6 12.6h-2.3V21h-3.2v-8.4H8.4v-2.9h1.7V8.1c0-2.1 1-3.6 3.5-3.6h2.2v2.9h-1.3c-1 0-1.1.4-1.1 1.1v1.2h2.4l-.2 2.9z"
      />
    </svg>
  );
}

/**
 * Gold victory-hand mark. Drawn as SVG (not the ✌ emoji) so it renders
 * identically on every platform, including hosts without a colour-emoji font.
 */
export function VictoryHandIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true" {...props}>
      <g fill="#f6c445" stroke="#e2ab26" strokeWidth="0.9" strokeLinejoin="round">
        <rect x="7" y="1.8" width="3.6" height="12" rx="1.8" transform="rotate(-14 8.8 7.8)" />
        <rect x="13.4" y="1.8" width="3.6" height="12" rx="1.8" transform="rotate(14 15.2 7.8)" />
        <path d="M6.6 10.6h10.8v6.9a5.4 5.4 0 0 1-5.4 5.4h0a5.4 5.4 0 0 1-5.4-5.4z" />
        <rect x="9" y="20.6" width="6" height="3" rx="1.5" />
      </g>
    </svg>
  );
}

/** Decorative handshake mark for the promo badge. */
export function HandshakeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true" {...props}>
      <g
        fill="#f6c445"
        stroke="#e2ab26"
        strokeWidth="0.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M2.4 8.2l3.4-2.3 3.9 2.6-3.2 2.6z" />
        <path d="M21.6 8.2l-3.4-2.3-3.9 2.6 3.2 2.6z" />
        <path d="M8.6 10.4l2.6-1.6 2.6 1.6-2.6 1.7z" />
        <path d="M11.2 12.1l-2.4 1.6 3.2 2.4 3.2-2.4-2.4-1.6" />
      </g>
    </svg>
  );
}