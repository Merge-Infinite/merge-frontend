interface ArrowDirectProps {
  className?: string;
  size?: number;
  color?: string;
}

export default function ArrowDirect({
  className = "",
  size = 18,
  color = "white",
}: ArrowDirectProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M13.5 4.5L4.5 13.5M13.5 4.5H6M13.5 4.5V12"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
