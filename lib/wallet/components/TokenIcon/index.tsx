import classnames from "classnames";
import Image from "next/image";
import React, { CSSProperties } from "react";
import IconWaterDrop from "../../assets/icons/waterdrop.svg";
import { Extendable } from "../../types";
import styles from "./index.module.scss";

type Size = "normal" | "small" | "large" | "xlarge";

export type TokenIconProps = Extendable & {
  icon: React.ReactNode;
  size?: Size;
  alt?: string;
  elClassName?: string;
  elStyle?: CSSProperties;
};

const TokenIcon = (props: TokenIconProps) => {
  const { size = "normal", icon } = props;
  return (
    <div
      className={classnames(
        styles["icon-wrap"],
        { [styles[`icon-wrap--${size}`]]: size !== "normal" },
        props.className
      )}
      style={props.style}
    >
      {typeof icon === "string" ? (
        <Image
          src={icon}
          alt={props.alt ?? "icon"}
          className={classnames(
            styles["icon"],
            { [styles[`icon--${size}`]]: size !== "normal" },
            props.elClassName
          )}
          style={props.elStyle}
        />
      ) : (
        <IconWaterDrop />
      )}
    </div>
  );
};

export default TokenIcon;
