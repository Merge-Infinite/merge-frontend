import classNames from "classnames";
import { Extendable } from "../../../types";
import { ObjectChangeItem } from "../../AssetChange";
import { ObjectChangeItemProps } from "../../AssetChange/ObjectChangeItem";

export type TxSummaryItemProps = ObjectChangeItemProps & {};

const TxSummaryItem = (props: TxSummaryItemProps & Extendable) => {
  return (
    <div
      className={classNames("p-4 border ", props.className)}
      style={{
        borderRadius: "16px",
        border: "1px solid #1f1f1f",
      }}
    >
      <ObjectChangeItem
        title={props.title}
        desc={props.desc}
        descType={props.descType}
        changeTitle={props.changeTitle}
        changeTitleColor={props.changeTitleColor}
        changeDesc={props.changeDesc}
        changeDescType={props.changeDescType}
        changeDescIcon={props.changeDescIcon}
        changeDescColor={props.changeDescColor}
        icon={props.icon}
        iconShape={props.iconShape}
        iconContainerColor={props.iconContainerColor}
        iconContainerClassName={"z-[1]"}
      />
    </div>
  );
};

export default TxSummaryItem;
