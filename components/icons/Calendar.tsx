interface CalendarProps {
  className?: string;
  size?: number;
  color?: string;
}

export default function Calendar({
  className = "",
  size = 24,
  color = "white",
}: CalendarProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect
        x="3"
        y="6"
        width="18"
        height="15"
        rx="2"
        stroke={color}
        strokeWidth="2"
      />
      <path d="M3 10H21" stroke={color} strokeWidth="2" />
      <path
        d="M7 3V6M17 3V6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
