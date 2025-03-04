import React from "react";
import classnames from "classnames";
import styles from "./index.module.scss";
import { Extendable } from "../../types";
import { LoadingSpokes } from "../Loading";
import { Button as ButtonUI } from "../../../../components/ui/button";
export type ButtonState = "normal" | "primary" | "danger" | "solid";

export type ButtonProps = Extendable & {
  type?: "button" | "submit" | "reset";
  state?: ButtonState;
  loading?: boolean;
  disabled?: boolean;
  solidBackground?: boolean;
  onClick?: () => void;
};

const Button = (props: ButtonProps) => {
  const {
    children,
    state = "normal",
    loading = false,
    disabled = false,
    solidBackground = false,
    ...restProps
  } = props;

  const _disabled = loading || disabled;
  return (
    <ButtonUI disabled={_disabled} className={classnames(props.className)}>
      {children}
      {loading && (
        <LoadingSpokes width={"20px"} height={"20px"} color={"#fff"} />
      )}
    </ButtonUI>
  );
};

export default Button;
