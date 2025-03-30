import { Button } from "@/components/ui/button";
import classNames from "classnames";
import Skeleton from "react-loading-skeleton";
import CopyIcon from "../../../../../components/CopyIcon";
import message from "../../../../../components/message";
import { isNonEmptyArray } from "../../../../../core";
import SettingOneLayout from "../../../../../layouts/SettingOneLayout";
import { Extendable } from "../../../../../types";
import styles from "./index.module.scss";

type PhraseDisplayProps = Extendable & {
  phrases: string[] | undefined;
};

type SavePhraseView = Extendable & {
  phrases: string[] | undefined;
  onNext: () => void;
};

export const PhraseDisplay = (props: PhraseDisplayProps) => {
  function renderPhraseCol(start: number, end: number) {
    if (isNonEmptyArray(props.phrases)) {
      return props.phrases.slice(start, end).map((p, index) => (
        <div key={p} className={styles["phrase-item"]}>
          <span className={styles["phrase-order"]}>{`${
            index + 1 + start
          }`}</span>
          <span
            className={classNames(styles["phrase-word"], "!text-white")}
          >{`${p}`}</span>
        </div>
      ));
    }
    return new Array(12).fill(0).map((_, index) => (
      <div key={index} className={styles["phrase-item"]}>
        <span className={styles["phrase-order"]}>{`${index + 1 + start}`}</span>
        <Skeleton className={"w-[54px] h-[20px] ml-[8px]"} />
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

const SavePhraseView = (props: SavePhraseView) => {
  return (
    <SettingOneLayout titles={[]} desc={"Copy and save your recovery phrase."}>
      <section className={"mt-[24px]"}>
        <PhraseDisplay phrases={props.phrases} />
        <Button
          className={"mt-[32px]"}
          disabled={!isNonEmptyArray(props.phrases)}
          onClick={props.onNext}
        >
          Confirm and Create
        </Button>
      </section>
    </SettingOneLayout>
  );
};

export default SavePhraseView;
