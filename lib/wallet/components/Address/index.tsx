import classnames from "classnames";
import copy from "copy-to-clipboard";
import { CSSProperties } from "react";
import { useSelector } from "react-redux";
import { addressEllipsis } from "../../core";
import { useSuinsName } from "../../hooks/useSuinsName";
import { RootState } from "../../store";
import { Extendable } from "../../types";
import CopyIcon from "../CopyIcon";
import message from "../message";

export type AddressProps = Extendable & {
  value: string;
  suins?: boolean;
  ellipsis?: boolean;
  hideCopy?: boolean;
  disableCopy?: boolean;
  textClassName?: string;
  textStyle?: CSSProperties;
  copyClassName?: string;
  copyStyle?: CSSProperties;
};

const Address = (props: AddressProps) => {
  const {
    ellipsis = true,
    hideCopy = false,
    disableCopy = false,
    suins = true,
  } = props;

  function addr(value: string, ellipsis: boolean) {
    return ellipsis ? addressEllipsis(value) : value;
  }

  return (
    <div
      className={classnames(
        "flex items-center",
        { "cursor-pointer": !disableCopy },
        "flex gap-2",
        "text-white",
        props.className
      )}
      style={props.style}
      onClick={() => {
        if (!disableCopy) {
          copy(props.value);
          message.success("Copied Address");
        }
      }}
    >
      <p
        className={"text-xs font-normal font-['Sora'] uppercase leading-normal"}
      >
        {suins ? (
          <SuinsName address={props.value} ellipsis={ellipsis} />
        ) : (
          addr(props.value, ellipsis)
        )}
      </p>
      {!hideCopy && (
        <CopyIcon
          className={classnames("ml-[5px]", props.copyClassName)}
          style={props.copyStyle}
        />
      )}
    </div>
  );
};

export type SuinsNameProps = Extendable & {
  address: string;
  ellipsis?: boolean; // for possible fallback display case
};

export const SuinsName = (props: SuinsNameProps) => {
  const { networkId } = useSelector((state: RootState) => state.appContext);
  const { data } = useSuinsName(props.address, {
    networkId,
  });
  return <>{props.ellipsis ? addressEllipsis(data) : data}</>;
};

export default Address;
