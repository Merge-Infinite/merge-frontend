import classNames from "classnames";
import copy from "copy-to-clipboard";
import { useState } from "react";
import { useSelector } from "react-redux";
import { RevealPrivateKeyParams } from "../../../core";
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
  const { title = "Private Key" } = props;
  const apiClient = useApiClient();
  const { walletId } = useSelector((state: RootState) => state.appContext);
  const [privateKey, setPrivateKey] = useState("");
  const [isConfirmed, setIsConfirmed] = useState(false);

  if (!isConfirmed) {
    return (
      <PasswordConfirmModal
        trigger={props.trigger}
        actionDesc={
          "You are now confirming to show the private key of your account . Please enter password to confirm the action."
        }
        onConfirm={async () => {
          setIsConfirmed(true);

          const privateKey = await apiClient.callFunc<
            OmitToken<RevealPrivateKeyParams>,
            string
          >(
            "wallet",
            "revealPrivateKey",
            {
              walletId,
            },
            { withAuth: true }
          );
          setPrivateKey(privateKey);
        }}
      />
    );
  }
  return (
    <SecretModal
      title={title}
      defaultOpen={true}
      onOpenChange={() => {
        setPrivateKey("");
        setIsConfirmed(false); // reset
      }}
      onCopy={() => {
        copy(privateKey);
        message.success("Copied");
      }}
    >
      <div className={classNames(styles["container"], "text-white")}>
        {privateKey}
      </div>
    </SecretModal>
  );
};

export default PhraseModal;
