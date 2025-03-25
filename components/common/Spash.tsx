"use client";
import Image from "next/image";
import React, { useEffect, useState } from "react";

interface SplashProps {
  onFinished?: () => void;
}

const SplashScreen: React.FC<SplashProps> = ({ onFinished }) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading process
    const timer = setTimeout(() => {
      setLoading(false);
      onFinished?.();
    }, 2000);

    return () => clearTimeout(timer);
  }, [onFinished]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-black">
      <div className="relative">
        <div className="animate-fade-in">
          <Image
            src="/images/logo.svg"
            alt="logo"
            width={164}
            height={164}
            className="transition-all duration-500 ease-in-out"
          />
        </div>
      </div>

      <div className="mt-6 w-48">
        <div className="w-full bg-gray-800 rounded-full h-1 overflow-hidden">
          <div className="bg-white h-1 rounded-full animate-loading-progress" />
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
