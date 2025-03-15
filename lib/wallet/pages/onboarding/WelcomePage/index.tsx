import RectButton from "./RectButton";
import { useNavigate } from "react-router-dom";
import BrandLayout from "../../../layouts/BrandLayout";
import { useEffectAdjustInitializedStatus } from "../../../hooks/useEffectAdjustInitializedStatus";
import { useSelector } from "react-redux";
import { RootState } from "../../../store";
import { useRef, useState } from "react";
import { useApiClient } from "../../../hooks/useApiClient";
import { PageEntry } from "../../../hooks/usePageEntry";
import Image from "next/image";
import { Button } from "@/components/ui/button";

enum Step {
  WELCOME,
  SET_PASSWORD,
}

enum OnboardType {
  NOT_SET,
  CREATE_NEW_WALLET,
  IMPORT_WALLET,
}

const WelcomePage = () => {
  const navigate = useNavigate();
  const appContext = useSelector((state: RootState) => state.appContext);
  const [step, setStep] = useState<Step>(Step.WELCOME);
  const [onboardType, setOnboardType] = useState<OnboardType>(
    OnboardType.NOT_SET
  );
  const nextRoute = useRef<string>("");
  const apiClient = useApiClient();

  async function handleCreateNewWallet() {
    nextRoute.current = "/onboard/create-new-wallet";
    setOnboardType(OnboardType.CREATE_NEW_WALLET);
    await handleSetNewPassword();
  }

  function handleImportWallet() {
    nextRoute.current = "/onboard/import-wallet";
    setOnboardType(OnboardType.IMPORT_WALLET);
  }

  function handleNavBack() {
    nextRoute.current = "";
    setOnboardType(OnboardType.NOT_SET);
    setStep(Step.WELCOME);
  }

  useEffectAdjustInitializedStatus(appContext);

  function renderWelcomeView() {
    return (
      <BrandLayout grayTitle={"Welcome to"} blackTitle={"Merg3 Wallet"}>
        <div
          className={"flex flex-col items-center"}
          style={{
            gap: 32,
          }}
        >
          <Image
            src="/images/m3r8 symbol.svg"
            alt="logo"
            width={52}
            height={48}
          />
          <div className="text-center text-white text-2xl font-normal  uppercase leading-7">
            Welcome to
            <br />
            Merge Infinite <br />
            Wallet
          </div>

          <div className="flex w-full justify-between gap-4">
            <Button onClick={handleCreateNewWallet}>Create New</Button>
            <Button variant={"outline"} onClick={handleImportWallet}>
              Import Wallet
            </Button>
          </div>
        </div>
      </BrandLayout>
    );
  }

  async function handleSetNewPassword() {
    try {
      await apiClient.callFunc("auth", "initPassword", null);
      if (!nextRoute.current) {
        throw new Error("nextRoute is not set");
      }
      navigate(nextRoute.current, {
        state: {
          pageEntry: PageEntry.ONBOARD,
        },
      });
    } catch (error) {
      console.error("handleSetNewPassword", error);
    }
  }

  function renderView() {
    if (appContext.initialized) {
      setTimeout(() => {
        navigate("/");
      }, 0);
      return null;
    }

    return renderWelcomeView();
  }

  return renderView();
};

export default WelcomePage;
