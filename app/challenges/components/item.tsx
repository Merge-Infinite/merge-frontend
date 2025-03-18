"use client";

import { useRouter } from "next/navigation";
import React, { useMemo } from "react";
interface ChallengeItemProps {
  name?: string;
  icon?: React.ReactNode;
  className?: string;
  itemChallengeId?: string;
  onClick?: () => void;
}

export const ChallengeItem = ({
  name = "Sui",
  icon,
  className = "",
  onClick,
}: ChallengeItemProps) => {
  const router = useRouter();
  const defaultIcon = useMemo(
    () => (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M16.5202 10.3413L16.5198 10.3421C17.3357 11.3652 17.8234 12.661 17.8234 14.0704C17.8234 15.5008 17.3212 16.8142 16.4832 17.8442L16.4111 17.9329L16.3919 17.8202C16.3756 17.7243 16.3566 17.6275 16.3343 17.53C15.915 15.6874 14.5486 14.1075 12.2998 12.8282C10.7813 11.9666 9.91204 10.9292 9.68382 9.75061C9.53643 8.98843 9.64601 8.22288 9.85777 7.56718C10.0695 6.91168 10.3844 6.36247 10.6519 6.03183L11.5269 4.96194C11.6803 4.77435 11.9674 4.77435 12.1208 4.96194L16.5202 10.3413ZM17.9038 9.27252L12.0405 2.10267C11.9286 1.96578 11.719 1.96578 11.6071 2.10267L5.7436 9.2722L5.72469 9.29628C4.6457 10.6352 4 12.3367 4 14.189C4 18.5028 7.50277 22 11.8238 22C16.1449 22 19.6476 18.5028 19.6476 14.189C19.6476 12.3367 19.0019 10.6352 17.923 9.29628L17.9038 9.27252ZM7.14656 10.3182L7.67125 9.67657L7.68709 9.79492C7.69965 9.88874 7.71487 9.98301 7.73293 10.0777C8.07227 11.8581 9.28449 13.3427 11.3112 14.4924C13.0729 15.4951 14.0986 16.648 14.3941 17.9126C14.5174 18.4403 14.5394 18.9595 14.486 19.4134L14.4827 19.4416L14.4573 19.454C13.6622 19.8424 12.7684 20.0604 11.8236 20.0604C8.51018 20.0604 5.82393 17.3787 5.82393 14.0704C5.82393 12.65 6.31913 11.3449 7.14656 10.3182Z"
          fill="#4CA3FF"
        />
      </svg>
    ),
    []
  );

  return (
    <div
      className={`px-3 py-1 rounded-3xl border border-white justify-center items-center gap-2 inline-flex ${className}`}
      onClick={onClick}
    >
      <div className="relative">{icon || defaultIcon}</div>
      <div className="text-xs font-normal font-['Sora'] leading-normal">
        {name}
      </div>
    </div>
  );
};

export default React.memo(ChallengeItem);
