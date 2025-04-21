import { useAsyncEffect } from "ahooks";
import { useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import message from "../../../components/message";
import Nav from "../../../components/Nav";
import {
  Account,
  CreateWalletParams,
  RevealMnemonicParams,
  Wallet,
} from "../../../core";
import { useApiClient } from "../../../hooks/useApiClient";
import { useFeatureFlags } from "../../../hooks/useFeatureFlags";
import { PageEntry, usePageEntry } from "../../../hooks/usePageEntry";
import { AppDispatch } from "../../../store";
import {
  updateAccountId,
  updateInitialized,
  updateNetworkId,
  updateWalletId,
} from "../../../store/app-context";
import { OmitToken } from "../../../types";
import { isNonEmptyArray } from "../../../utils/check";
import styles from "./index.module.scss";
import SavePhraseView from "./views/SavePhraseView";

// enum Step {
//   DISPLAY_PHRASE = 1,
// }

const CreateNewWallet = () => {
  // const [step, setStep] = useState(Step.DISPLAY_PHRASE);
  const [phrases, setPhrases] = useState<string[]>([]);
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const pageEntry = usePageEntry();
  const apiClient = useApiClient();
  const featureFlags = useFeatureFlags();
  const isCreating = useRef(false);

  async function createWalletAndAccount() {
    const wallet = await apiClient.callFunc<
      OmitToken<CreateWalletParams>,
      Wallet
    >("wallet", "createWallet", {}, { withAuth: true });

    const rawPhrases = await apiClient.callFunc<
      OmitToken<RevealMnemonicParams>,
      string
    >(
      "wallet",
      "revealMnemonic",
      {
        walletId: wallet.id,
      },
      { withAuth: true }
    );
    setPhrases(rawPhrases.split(" "));

    const accounts = await apiClient.callFunc<string, Account[]>(
      "account",
      "getAccounts",
      wallet.id
    );
    if (!isNonEmptyArray(accounts)) {
      message.success("Cannot find any account");
      throw new Error("Cannot find any account");
    }
    const defaultAccount = accounts[0];

    await dispatch(updateWalletId(wallet.id));
    await dispatch(updateAccountId(defaultAccount.id));
    await dispatch(updateNetworkId(featureFlags?.default_network ?? "mainnet"));
    await dispatch(updateInitialized(true));
  }

  async function handleSavePhrase() {
    console.log("handleSavePhrase");
    message.success("Wallet Created!");
    if (pageEntry === PageEntry.SWITCHER) {
      navigate("/home", { state: { openSwitcher: true } });
      return;
    }
    navigate("/home");
  }

  useAsyncEffect(async () => {
    if (isCreating.current) return;

    isCreating.current = true;
    await createWalletAndAccount();
  }, []);

  return (
    <div className={styles["page"]}>
      <Nav
        title={"Save the recovery phrase"}
        onNavBack={() => {
          navigate("/onboard");
        }}
        className="w-full justify-between"
      />
      <SavePhraseView phrases={phrases} onNext={handleSavePhrase} />
    </div>
  );
};

export default CreateNewWallet;
