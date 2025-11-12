interface QuestionProps {
  className?: string;
  size?: number;
  color?: string;
}

export default function Question({
  className = "",
  size = 20,
  color = "white",
}: QuestionProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="10" cy="10" r="8.5" stroke={color} strokeWidth="1.5" />
      <path
        d="M7.5 7.5C7.5 5.84315 8.84315 4.5 10.5 4.5C12.1569 4.5 13.5 5.84315 13.5 7.5C13.5 8.74264 12.6642 9.79252 11.5 10.1708V11.25"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="10.5" cy="14" r="0.75" fill={color} />
    </svg>
  );
}
