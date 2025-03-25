import React from "react";

interface MergeLoadingAnimationProps {}

const MergeLoadingAnimation: React.FC<MergeLoadingAnimationProps> = ({}) => {
  return (
    <div
      className="absolute z-50 flex items-center justify-center"
      style={{
        transform: "translate(-50%, -50%)",
        pointerEvents: "none",
        left: "50%",
        top: "50%",
      }}
    >
      <div className="relative flex">
        {/* Outer spinning circle */}
        <div className="absolute inset-0 rounded-full border-4 border-t-transparent border-white animate-spin"></div>

        {/* Inner pulsing circle */}
        <div className="h-10 w-10 rounded-full bg-white/20 animate-pulse flex items-center justify-center">
          <span className="text-lg">⚗️</span>
        </div>
      </div>
    </div>
  );
};

export default MergeLoadingAnimation;
