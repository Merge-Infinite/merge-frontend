interface ArrowLeftProps {
  className?: string;
  size?: number;
  color?: string;
}

export default function ArrowLeft({
  className = "",
  size = 24,
  color = "white",
}: ArrowLeftProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M15 18L9 12L15 6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
