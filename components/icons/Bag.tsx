interface BagProps {
  size?: number;
  color?: string;
  className?: string;
}

export default function Bag({
  size = 24,
  color = "currentColor",
  className,
}: BagProps) {
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
        d="M8.4 6.5H15.6C18.1 6.5 19.4 6.5 20.3 7.1C20.8 7.5 21.2 7.9 21.5 8.5C22 9.5 21.9 10.8 21.6 13.5L21.3 15.5C20.9 18.3 20.7 19.7 19.7 20.6C18.7 21.5 17.3 21.5 14.5 21.5H9.5C6.7 21.5 5.3 21.5 4.3 20.6C3.3 19.7 3.1 18.3 2.7 15.5L2.4 13.5C2.1 10.8 2 9.5 2.5 8.5C2.8 7.9 3.2 7.5 3.7 7.1C4.6 6.5 5.9 6.5 8.4 6.5Z"
        stroke={color}
        strokeWidth="1.5"
      />
      <path
        d="M8 6.5V5.5C8 3.3 9.8 1.5 12 1.5C14.2 1.5 16 3.3 16 5.5V6.5"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M11 14L12 15L15 12"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
