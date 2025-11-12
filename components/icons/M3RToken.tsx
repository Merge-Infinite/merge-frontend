interface M3RTokenProps {
  className?: string;
  size?: number;
}

export default function M3RToken({
  className = "",
  size = 32,
}: M3RTokenProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="16" cy="16" r="14" fill="#4CA3FF" />
      <text
        x="16"
        y="20"
        fontSize="11"
        fontWeight="bold"
        textAnchor="middle"
        fill="white"
        fontFamily="Sora"
      >
        M3R
      </text>
    </svg>
  );
}
