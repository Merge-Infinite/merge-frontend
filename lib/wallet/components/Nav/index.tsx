import React, { CSSProperties } from "react";
import IconNavArrow from "../../assets/icons/nav-arrow.svg";
import { Icon } from "../icons";
import { Extendable } from "../../types";
import Typo from "../Typo";
import classnames from "classnames";
import styles from "./index.module.scss";

export type NavProps = Extendable & {
  navDisabled?: boolean;
  title?: string | React.ReactNode;
  titleClassName?: string;
  titleStyle?: CSSProperties;
  position?: "relative" | "absolute" | "fixed" | "sticky";
  onNavBack?: () => void;
};

const Nav = (props: NavProps) => {
  const { navDisabled = false, position = "relative" } = props;
  function renderTitle() {
    if (typeof props.title === "string") {
      return (
        <Typo.Title
          className={classnames(
            styles["nav-title"],
            props.titleClassName,
            "text-white"
          )}
          style={props.titleStyle}
        >
          {props.title}
        </Typo.Title>
      );
    }
    // custom title ReactNode
    return props.title;
  }
  return (
    <nav
      className={classnames(
        styles["nav"],
        styles[`nav--${position}`],
        props.className,
        "justify-between"
      )}
      style={props.style}
    >
      <div
        className="p-2 flex items-center justify-center bg-white"
        style={{
          borderRadius: "50%",
        }}
      >
        <IconNavArrow onClick={navDisabled ? undefined : props.onNavBack} />
      </div>
      {renderTitle()}
      <div />
    </nav>
  );
};

export default Nav;
