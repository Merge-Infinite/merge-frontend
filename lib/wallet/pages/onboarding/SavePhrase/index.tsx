import styles from "./index.module.scss";
import Button from "../../../components/Button";
import { Extendable } from "../../../types";
import CopyIcon from "../../../components/CopyIcon";
import message from "../../../components/message";
import SettingOneLayout from "../../../layouts/SettingOneLayout";

type PhraseDisplayProps = Extendable & {
  phrases: string[];
};

export const PhraseDisplay = (props: PhraseDisplayProps) => {
  function renderPhraseCol(start: number, end: number) {
    return props.phrases.slice(start, end).map((p, index) => (
      <div key={p} className={styles["phrase-item"]}>
        <span className={styles["phrase-order"]}>{`${index + 1 + start}`}</span>
        <span className={styles["phrase-word"]}>{`${p}`}</span>
      </div>
    ));
  }

  return (
    <div className={styles["phrase"]}>
      <div className={styles["phrase-wrap"]}>{renderPhraseCol(0, 12)}</div>
      <CopyIcon
        copyStr={props.phrases?.join(" ") || ""}
        onCopied={() => {
          message.success("Copied Phrases");
        }}
        className={styles["icon-copy"]}
      />
    </div>
  );
};

const SavePhrase = (props: { phrases: string[]; onNext: () => void }) => {
  return (
    <SettingOneLayout
      titles={["Backup", "Your", "Wallet"]}
      desc={"Copy and save your recovery phrase."}
    >
      <section className={"mt-[24px]"}>
        <PhraseDisplay phrases={props.phrases}></PhraseDisplay>
        <Button
          state={"primary"}
          className={"mt-[32px]"}
          onClick={props.onNext}
        >
          Confirm and Create
        </Button>
      </section>
    </SettingOneLayout>
  );
};

export default SavePhrase;
