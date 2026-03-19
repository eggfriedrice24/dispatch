/**
 * Dispatch logo mark — The Arrow
 *
 * Copper rounded square with an upward arrow (chevron + stem).
 * Stroke weight scales non-linearly for legibility at small sizes.
 *
 * Usage:
 *   <DispatchLogo size={20} />   — navbar (20px)
 *   <DispatchLogo size={48} />   — onboarding (48px)
 *   <DispatchLogo size={64} />   — splash screen (64px)
 *   <DispatchLogo size={512} />  — app icon export (512px)
 */

interface DispatchLogoProps {
  /** Rendered size in pixels */
  size?: number;
  /** Optional className for the wrapping svg */
  className?: string;
}

export function DispatchLogo({ size = 20, className }: DispatchLogoProps) {
  // Stroke weight scales non-linearly: thicker at small sizes for legibility.
  // Tuned manually per the logo spec.
  const stroke = resolveStroke(size);

  // Arrow geometry adapts at small sizes: wider chevron, more vertical extent.
  const geo = resolveGeometry(size);

  // Corner radius: ~22% of width, capped for tiny sizes.
  const radius = size <= 16 ? 16 : size <= 24 ? 15 : 14;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Dispatch logo"
    >
      <title>Dispatch</title>
      <rect
        width="64"
        height="64"
        rx={radius}
        fill="var(--primary, #d4883a)"
      />
      <path
        d={`M${geo.chevronLeft} ${geo.chevronY} L${geo.tipX} ${geo.tipY} L${geo.chevronRight} ${geo.chevronY}`}
        stroke="var(--bg-root, #08080a)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <line
        x1={geo.tipX}
        y1={geo.tipY}
        x2={geo.tipX}
        y2={geo.stemEnd}
        stroke="var(--bg-root, #08080a)"
        strokeWidth={stroke}
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Non-linear stroke weight scaling.
 * Larger icons get proportionally thinner strokes.
 * Small icons get thicker strokes for legibility.
 */
function resolveStroke(size: number): number {
  if (size >= 512) {
    return 34;
  }
  if (size >= 128) {
    return 9;
  }
  if (size >= 64) {
    return 4.5;
  }
  if (size >= 48) {
    return 5;
  }
  if (size >= 32) {
    return 5.5;
  }
  if (size >= 24) {
    return 6.5;
  }
  if (size >= 20) {
    return 7.5;
  }
  return 9; // 16px and below
}

/**
 * Arrow geometry that adapts to size.
 * At small sizes the chevron widens and the arrow
 * extends further to remain legible.
 */
function resolveGeometry(size: number): {
  tipX: number;
  tipY: number;
  chevronLeft: number;
  chevronRight: number;
  chevronY: number;
  stemEnd: number;
} {
  if (size <= 16) {
    return { tipX: 32, tipY: 16, chevronLeft: 16, chevronRight: 48, chevronY: 37, stemEnd: 50 };
  }
  if (size <= 20) {
    return { tipX: 32, tipY: 17, chevronLeft: 17, chevronRight: 47, chevronY: 36, stemEnd: 49 };
  }
  if (size <= 24) {
    return { tipX: 32, tipY: 18, chevronLeft: 18, chevronRight: 46, chevronY: 35, stemEnd: 48 };
  }
  if (size <= 32) {
    return { tipX: 32, tipY: 18, chevronLeft: 19, chevronRight: 45, chevronY: 34, stemEnd: 47 };
  }
  // 48px and above — the "canonical" proportions
  return { tipX: 32, tipY: 18, chevronLeft: 19, chevronRight: 45, chevronY: 33, stemEnd: 47 };
}
