import classNames from "classnames";
import Image from "next/image";
import { isNonEmptyArray } from "../../../core";
import { Extendable } from "../../../types";
import { formatDatetime } from "../../../utils/formatDatetime";
import Typo from "../../Typo";
import TemplateText from "../TemplateText";
import styles from "./index.module.scss";
export type TxSummaryContainerProps = {
  timestamp: number;
  category?: string;
  categoryIcon?: string;
  categoryColor?: string;
  onClick?: () => void;
};

const TxSummaryContainer = (props: Extendable & TxSummaryContainerProps) => {
  const {
    category = "Category",
    categoryIcon = "Down",
    categoryColor = "text-gray-400",
  } = props;
  return (
    <section
      className={classNames(styles["tx-summary-container"], props.className)}
      onClick={props.onClick}
    >
      <header
        className={classNames("flex items-center px-[16px] justify-between")}
      >
        <div className={"flex items-center gap-2"}>
          <Image
            src={`/images/${categoryIcon}.svg`}
            alt={category}
            width={16}
            height={16}
            className={classNames("mr-[3px]")}
          />
          <TemplateText
            type={"text"}
            value={category}
            className={classNames(
              "justify-start text-white text-sm font-normal font-['Sora'] leading-normal tracking-wide"
            )}
          />
        </div>
        <div className={"ml-auto"}>
          <Typo.Small
            className={
              "justify-start  text-xs font-normal font-['Sora'] leading-none"
            }
            style={{
              color: "#858585",
            }}
          >
            {formatDatetime(props.timestamp)}
          </Typo.Small>
        </div>
      </header>
      <main
        className={"mt-1 hover:bg-gray-50 hover:cursor-pointer transition-all"}
      >
        {isNonEmptyArray(props.children) ? (
          <div>{props.children}</div>
        ) : (
          props.children
        )}
      </main>
    </section>
  );
};

export default TxSummaryContainer;
