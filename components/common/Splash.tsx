"use client";
import { useUniversalApp } from "@/app/context/UniversalAppContext";
import { ConnectButton, useCurrentWallet } from "@mysten/dapp-kit";
import Image from "next/image";
import React from "react";

const SplashScreen: React.FC = () => {
  const { isTelegram, isReady } = useUniversalApp();
  const { currentWallet } = useCurrentWallet();

  if (!isReady) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-black">
        <div className="animate-fade-in">
          <Image
            src="/images/logo.svg"
            alt="logo"
            width={164}
            height={164}
            className="transition-all duration-500 ease-in-out"
          />
        </div>
        <div className="mt-6 w-48">
          <div className="w-full bg-gray-800 rounded-full h-1 overflow-hidden">
            <div className="bg-white h-1 rounded-full animate-loading-progress" />
          </div>
        </div>
      </div>
    );
  }

  const shouldShowConnectButton = !isTelegram && !currentWallet;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-black">
      <div className="animate-fade-in">
        <Image
          src="/images/logo.svg"
          alt="logo"
          width={164}
          height={164}
          className="transition-all duration-500 ease-in-out"
        />
      </div>

      {shouldShowConnectButton && (
        <div className="mt-8">
          <ConnectButton />
        </div>
      )}

      {!shouldShowConnectButton && (
        <div className="mt-6 w-48">
          <div className="w-full bg-gray-800 rounded-full h-1 overflow-hidden">
            <div className="bg-white h-1 rounded-full animate-loading-progress" />
          </div>
        </div>
      )}
    </div>
  );
};

export default SplashScreen;
