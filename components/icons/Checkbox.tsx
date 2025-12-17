interface CheckboxProps {
  className?: string;
  size?: number;
  checked?: boolean;
}

export default function Checkbox({
  className = "",
  size = 24,
  checked = false,
}: CheckboxProps) {
  if (checked) {
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
          y="3"
          width="18"
          height="18"
          rx="4"
          fill="#A768FF"
          stroke="#A768FF"
          strokeWidth="2"
        />
        <path
          d="M8 12L11 15L16 9"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

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
        y="3"
        width="18"
        height="18"
        rx="4"
        stroke="#333333"
        strokeWidth="2"
      />
    </svg>
  );
}
