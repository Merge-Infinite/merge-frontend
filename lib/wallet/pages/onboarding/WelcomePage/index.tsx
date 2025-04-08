import { Button } from "@/components/ui/button";
import Nav from "@/lib/wallet/components/Nav";
import Image from "next/image";
import { useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useApiClient } from "../../../hooks/useApiClient";
import { useEffectAdjustInitializedStatus } from "../../../hooks/useEffectAdjustInitializedStatus";
import { PageEntry } from "../../../hooks/usePageEntry";
import BrandLayout from "../../../layouts/BrandLayout";
import { RootState } from "../../../store";
import SetPasswordView from "./views/SetPasswordView";

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
    setStep(Step.SET_PASSWORD);
  }

  function handleImportWallet() {
    console.log("handleImportWallet");
    nextRoute.current = "/onboard/import-wallet";
    setOnboardType(OnboardType.IMPORT_WALLET);
    setStep(Step.SET_PASSWORD);
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
            src="/images/m3r8_symbol.svg"
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

  async function handleSetNewPassword(password: string) {
    try {
      await apiClient.callFunc("auth", "initPassword", password);
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
    console.log("step", step);
    if (step === Step.SET_PASSWORD) {
      return (
        <div className={"flex-1 bg-white"}>
          <Nav
            title={
              onboardType === OnboardType.IMPORT_WALLET
                ? "Import Wallet"
                : "New Passcode"
            }
            onNavBack={handleNavBack}
          />
          <SetPasswordView type={"new"} onNext={handleSetNewPassword} />
        </div>
      );
    }
    return renderWelcomeView();
  }

  return renderView();
};

export default WelcomePage;
