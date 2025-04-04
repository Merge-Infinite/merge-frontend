import classNames from "classnames";
import copy from "copy-to-clipboard";
import { useState } from "react";
import { useSelector } from "react-redux";
import { RevealMnemonicParams } from "../../../core";
import { useApiClient } from "../../../hooks/useApiClient";
import { RootState } from "../../../store";
import { Extendable, OmitToken } from "../../../types";
import message from "../../message";
import PasswordConfirmModal from "../PasswordConfirmModal";
import SecretModal from "../SecretModal";
import styles from "./index.module.scss";

export type PhraseModalProps = Extendable & {
  trigger: JSX.Element;
  title?: string;
  onOpenChange?: () => void;
};

const PhraseModal = (props: PhraseModalProps) => {
  const { title = "Recovery Phrases" } = props;
  const apiClient = useApiClient();
  const { walletId } = useSelector((state: RootState) => state.appContext);
  const [phrases, setPhrases] = useState<string[]>([]);
  const [isConfirmed, setIsConfirmed] = useState(false);

  if (!isConfirmed) {
    return (
      <PasswordConfirmModal
        title={"Show Recovery Phrases"}
        trigger={props.trigger}
        actionDesc={
          "You are now confirming to show the recovery phrases of your account. Please enter password to confirm the action."
        }
        onConfirm={async () => {
          setIsConfirmed(true);

          const rawPhrases = await apiClient.callFunc<
            OmitToken<RevealMnemonicParams>,
            string
          >(
            "wallet",
            "revealMnemonic",
            {
              walletId,
            },
            { withAuth: true }
          );
          setPhrases(rawPhrases.split(" "));
        }}
      />
    );
  }
  return (
    <SecretModal
      title={title}
      defaultOpen={true}
      onOpenChange={() => {
        setIsConfirmed(false); // reset
        setPhrases([]);
      }}
      onCopy={() => {
        copy(phrases.join(" "));
        message.success("Copied");
      }}
    >
      <div className={classNames(styles["container"], "w-full bg-black")}>
        {phrases.map((text, index) => (
          <div key={text} className="flex flex-row items-center gap-2">
            <div className="inline-block text-gray-300 text-right select-none">
              {index + 1}
            </div>
            <div className="ml-2 text-white">{text}</div>
          </div>
        ))}
      </div>
    </SecretModal>
  );
};

export default PhraseModal;
