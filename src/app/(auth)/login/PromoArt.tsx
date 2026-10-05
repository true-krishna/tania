import type { SVGProps } from "react";

/**
 * Original flat-vector stand-in for the reference's stock photo of a smiling
 * professional (yellow blazer, tablet in hand). No third-party image or licence
 * is bundled with the repo.
 */
export function PromoArt(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 240 360" role="img" aria-label="Illustration of a smiling professional" {...props}>
      {/* hair — back volume and curls */}
      <path
        d="M120 8c-40 0-66 26-66 68 0 22 5 42 14 60h104c9-18 14-38 14-60 0-42-26-68-66-68z"
        fill="#2b2233"
      />
      <circle cx="66" cy="58" r="15" fill="#2b2233" />
      <circle cx="86" cy="34" r="16" fill="#2b2233" />
      <circle cx="120" cy="24" r="18" fill="#2b2233" />
      <circle cx="154" cy="34" r="16" fill="#2b2233" />
      <circle cx="174" cy="58" r="15" fill="#2b2233" />

      {/* neck */}
      <path d="M104 108h32v42a16 16 0 0 1-32 0z" fill="#8f5d3d" />

      {/* face */}
      <path
        d="M120 28c-24 0-41 19-41 47 0 31 18 55 41 55s41-24 41-55c0-28-17-47-41-47z"
        fill="#a9744f"
      />
      <circle cx="79" cy="80" r="8" fill="#a9744f" />
      <circle cx="161" cy="80" r="8" fill="#a9744f" />

      {/* hair — front sweep */}
      <path
        d="M120 20c-32 0-48 16-49 42 0 9 2 17 5 24 3-26 16-39 44-39s41 13 44 39c3-7 5-15 5-24-1-26-17-42-49-42z"
        fill="#2b2233"
      />

      {/* face detail */}
      <path d="M99 68q9-5 18 0" stroke="#5c3626" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <path d="M123 68q9-5 18 0" stroke="#5c3626" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <circle cx="108" cy="81" r="3.6" fill="#2b2320" />
      <circle cx="132" cy="81" r="3.6" fill="#2b2320" />
      <path d="M107 98q13 12 26 0" stroke="#5c3626" strokeWidth="3" fill="none" strokeLinecap="round" />

      {/* blazer */}
      <path
        d="M120 148c-35 0-63 24-69 60v152h138V208c-6-36-34-60-69-60z"
        fill="#f0c14b"
      />
      {/* shirt */}
      <path d="M120 148l-25 27 25 62 25-62z" fill="#eef3f7" />
      {/* lapels */}
      <path d="M95 148l-24 116" stroke="#d9a62c" strokeWidth="5" strokeLinecap="round" />
      <path d="M145 148l24 116" stroke="#d9a62c" strokeWidth="5" strokeLinecap="round" />

      {/* arms */}
      <path d="M60 208c-9 42-5 80 10 108" stroke="#f0c14b" strokeWidth="30" strokeLinecap="round" fill="none" />
      <path d="M180 208c11 36 5 70-12 94" stroke="#f0c14b" strokeWidth="30" strokeLinecap="round" fill="none" />

      {/* tablet */}
      <rect x="60" y="252" width="120" height="74" rx="11" fill="#c9a15a" />
      <rect x="70" y="262" width="100" height="54" rx="6" fill="#f7e9c6" />

      {/* hands */}
      <ellipse cx="72" cy="294" rx="15" ry="12" fill="#a9744f" />
      <ellipse cx="168" cy="294" rx="15" ry="12" fill="#a9744f" />
    </svg>
  );
}