interface DotProps {
  className?: string;
  size?: number;
  color?: string;
}

export default function Dot({
  className = "",
  size = 9,
  color = "#00DBB6",
}: DotProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 9 9"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="4.5" cy="4.5" r="4.5" fill={color} />
    </svg>
  );
}
