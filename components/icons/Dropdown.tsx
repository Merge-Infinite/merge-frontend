interface DropdownProps {
  className?: string;
  size?: number;
  color?: string;
}

export default function Dropdown({
  className = "",
  size = 24,
  color = "white",
}: DropdownProps) {
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
        d="M6 9L12 15L18 9"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
