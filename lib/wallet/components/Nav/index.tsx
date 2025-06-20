import classnames from "classnames";
import React, { CSSProperties } from "react";
import IconNavArrow from "../../assets/icons/nav-arrow.svg";
import { Extendable } from "../../types";
import Typo from "../Typo";
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
        props.className,
        "!justify-between",
        "bg-black"
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
