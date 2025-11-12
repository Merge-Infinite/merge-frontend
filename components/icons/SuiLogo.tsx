interface SuiLogoProps {
  className?: string;
  size?: number;
  color?: string;
}

export default function SuiLogo({
  className = "",
  size = 22,
  color = "#4CA3FF",
}: SuiLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 22 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M11 20.1667C16.0626 20.1667 20.1667 16.0626 20.1667 11C20.1667 5.93743 16.0626 1.83334 11 1.83334C5.93743 1.83334 1.83334 5.93743 1.83334 11C1.83334 16.0626 5.93743 20.1667 11 20.1667Z"
        fill={color}
      />
      <path
        d="M11 6.41667V15.5833M7.33334 9.16667L11 6.41667L14.6667 9.16667M7.33334 12.8333L11 15.5833L14.6667 12.8333"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
