import classNames from "classnames";
import { safe } from "../../../core";
import { Extendable } from "../../../types";
import { Icon } from "../../icons";
import { AvailableIcon } from "../../icons/Icon";
import { TemplateIcon, TemplateIconType } from "../../tx-history";
import TemplateText, { TemplateTextType } from "../../tx-history/TemplateText";
import Typo from "../../Typo";

export type ObjectChangeItemProps = Extendable & {
  title: string;
  desc?: string;
  descType?: TemplateTextType;
  icon: TemplateIconType | string;
  iconShape?: "circle" | "square";
  iconContainerColor?: "gray" | "blue" | "purple" | "red" | string;
  iconContainerClassName?: string;
  changeTitle: string;
  changeTitleColor: "red" | "green" | "orange" | "gray" | string;
  changeDesc?: string;
  changeDescType?: TemplateTextType;
  changeDescIcon?: AvailableIcon;
  changeDescColor?: string;
};

export type ChangeDescProps = Extendable & {
  icon?: AvailableIcon;
};

function ChangeDesc(props: ChangeDescProps) {
  const { icon = "", children } = props;
  if (!children) return null;
  if (typeof children !== "string") return <>{children}</>;

  let node = (
    <Typo.Small
      className={classNames(
        "text-gray-400 text-small ellipsis max-w-[140px]",
        props.className
      )}
    >
      {children}
    </Typo.Small>
  );
  if (icon === "History") {
    node = (
      <div className={"flex items-center"}>
        <Icon icon={"History"} className={"mr-[4px]"} />
        {node}
      </div>
    );
  }
  return node;
}

function getColorClassName(color: string | null | undefined) {
  if (!color) return "text-gray-400";
  if (color.startsWith("text-")) return color;
  return `text-${color}-500`;
}

export const ObjectChangeItem = (props: ObjectChangeItemProps) => {
  const { changeTitleColor = "text-gray-400", descType = "text" } = props;

  return (
    <div
      className={classNames(
        "flex w-full",
        "items-center justify-between",
        props.className
      )}
    >
      <div className={"flex items-center gap-2"}>
        <TemplateIcon
          className={classNames("z-[1]")}
          icon={props.icon}
          containerProps={{
            className: classNames(
              "w-[36px] h-[36px] shrink-0",
              props.iconContainerClassName
            ),
          }}
        />
        <div className={"ml-4 flex flex-col gap-1"}>
          <Typo.Title
            className={
              "justify-start text-white text-sm font-normal font-['Sora'] leading-normal capitalize"
            }
          >
            {props.title.toLowerCase()}
          </Typo.Title>
          {props.desc && (
            <TemplateText
              value={props.desc}
              className={
                "self-stretch justify-start  text-xs font-normal font-['Sora'] leading-none"
              }
              style={{
                color: "#858585",
              }}
              type={descType}
            />
          )}
        </div>
      </div>
      <div className={classNames("flex flex-col items-end gap-1")}>
        <Typo.Normal
          className={classNames(
            "justify-start text-sm font-normal font-['Sora'] leading-normal"
          )}
          style={{
            color: props?.changeTitle[0] === "-" ? "#e03232" : "#00ff99",
          }}
        >
          {safe(props?.changeTitle, "")}
        </Typo.Normal>
        <ChangeDesc
          className={
            "justify-end text-xs font-normal font-['Sora'] leading-none"
          }
          style={{
            color: props?.changeTitle[0] === "-" ? "#e03232" : "#00ff99",
          }}
          icon={props.changeDescIcon}
        >
          {props.changeDesc}
        </ChangeDesc>
      </div>
    </div>
  );
};
