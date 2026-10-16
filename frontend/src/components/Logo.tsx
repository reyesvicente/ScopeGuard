const SHIELD = "M30 4 54 11v18c0 14-10 24-24 29C16 53 6 43 6 29V11Z";

type LogoProps = {
  size?: number;
  /** Shield fill; use the off-white variant on yellow surfaces. */
  fill?: string;
  className?: string;
};

export function Logo({ size = 32, fill = "#ffde59", className }: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      <path d={SHIELD} transform="translate(4 4)" fill="#0f0f0f" />
      <path d={SHIELD} fill={fill} stroke="#0f0f0f" strokeWidth={4} strokeLinejoin="round" />
      <path
        d="m18 30 8 8 15-17"
        fill="none"
        stroke="#0f0f0f"
        strokeWidth={6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
