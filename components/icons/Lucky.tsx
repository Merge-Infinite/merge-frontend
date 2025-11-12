interface LuckyProps {
  className?: string;
  size?: number;
  color?: string;
}

export default function Lucky({
  className = "",
  size = 20,
  color = "white",
}: LuckyProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M10 1.5625L12.2656 7.73438L18.4375 10L12.2656 12.2656L10 18.4375L7.73438 12.2656L1.5625 10L7.73438 7.73438L10 1.5625Z"
        fill={color}
      />
      <path
        d="M15.625 3.4375L16.5625 5.9375L19.0625 6.875L16.5625 7.8125L15.625 10.3125L14.6875 7.8125L12.1875 6.875L14.6875 5.9375L15.625 3.4375Z"
        fill={color}
      />
    </svg>
  );
}
