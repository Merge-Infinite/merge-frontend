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
      {/* Clean, modern loader */}
      <div className="relative w-12 h-12">
        {/* Animated gradient border */}
        <div
          className="absolute inset-0 rounded-full p-0.5"
          style={{
            background:
              "linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #feca57)",
            backgroundSize: "300% 300%",
            animation: "gradientMove 2s ease infinite",
          }}
        >
          <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
            {/* Two merging circles */}
            <div className="relative w-8 h-8 flex items-center justify-center">
              {/* Left circle */}
              <div
                className="absolute w-3 h-3 bg-blue-500 rounded-full"
                style={{
                  animation: "mergeLeft 1.5s ease-in-out infinite",
                }}
              ></div>

              {/* Right circle */}
              <div
                className="absolute w-3 h-3 bg-purple-500 rounded-full"
                style={{
                  animation: "mergeRight 1.5s ease-in-out infinite",
                }}
              ></div>

              {/* Result circle (appears when circles merge) */}
              <div
                className="absolute w-4 h-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                style={{
                  animation: "mergeResult 1.5s ease-in-out infinite",
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* Optional: Small sparkles */}
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
        <div className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-pink-400 rounded-full animate-ping delay-300"></div>
      </div>

      {/* Custom animations */}
      <style jsx>{`
        @keyframes gradientMove {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        @keyframes mergeLeft {
          0% {
            transform: translateX(-8px);
            opacity: 1;
          }
          50% {
            transform: translateX(-2px);
            opacity: 0.8;
          }
          70% {
            transform: translateX(0px);
            opacity: 0;
          }
          100% {
            transform: translateX(-8px);
            opacity: 1;
          }
        }

        @keyframes mergeRight {
          0% {
            transform: translateX(8px);
            opacity: 1;
          }
          50% {
            transform: translateX(2px);
            opacity: 0.8;
          }
          70% {
            transform: translateX(0px);
            opacity: 0;
          }
          100% {
            transform: translateX(8px);
            opacity: 1;
          }
        }

        @keyframes mergeResult {
          0% {
            opacity: 0;
            transform: scale(0);
          }
          70% {
            opacity: 0;
            transform: scale(0);
          }
          85% {
            opacity: 1;
            transform: scale(1.2);
          }
          100% {
            opacity: 0;
            transform: scale(0);
          }
        }
      `}</style>
    </div>
  );
};

export default MergeLoadingAnimation;
