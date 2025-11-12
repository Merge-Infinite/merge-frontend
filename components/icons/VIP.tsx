interface VIPProps {
  className?: string;
  size?: number;
  color?: string;
}

export default function VIP({
  className = "",
  size = 32,
  color = "#A768FF",
}: VIPProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M16 2L19.5 12H30L21.5 19L25 29L16 22L7 29L10.5 19L2 12H12.5L16 2Z"
        fill={color}
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <text
        x="16"
        y="18"
        fontSize="10"
        fontWeight="bold"
        textAnchor="middle"
        fill="white"
        fontFamily="Sora"
      >
        VIP
      </text>
    </svg>
  );
}
