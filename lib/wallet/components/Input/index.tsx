import { Input as InputComponent } from "@/components/ui/input";
import classnames from "classnames";
import React, { CSSProperties, InputHTMLAttributes, ReactNode } from "react";
import IconInputFail from "../../assets/icons/input-fail.svg";
import IconInputSuccess from "../../assets/icons/input-success.svg";
import { Extendable } from "../../types";
import styles from "./index.module.scss";
export type InputState = "success" | "error" | "default";

export type InputProps = Extendable &
  InputHTMLAttributes<HTMLInputElement> & {
    state?: InputState;
    elClassName?: string;
    elStyle?: CSSProperties;
    suffix?: ReactNode;
  };

const stateMap = {
  success: {
    icon: IconInputSuccess,
    alt: "success",
  },
  error: {
    icon: IconInputFail,
    alt: "error",
  },
  default: {
    icon: "",
    alt: "",
  },
};

export const InputGroup = React.forwardRef<HTMLInputElement, InputProps>(
  (props, ref) => {
    const {
      state = "default",
      children,
      className,
      elClassName,
      suffix,
      ...restProps
    } = props;

    return (
      <div
        className={classnames(
          styles["input-group"],
          { [styles[`input-group-state--${state}`]]: state !== "default" },
          props.className
        )}
      >
        <Input
          {...restProps}
          ref={ref}
          state={state}
          className={"flex-1"}
          elClassName={classnames(
            styles["input--no-border"],
            props.elClassName
          )}
        />
        {suffix && (
          <div
            className={classnames(styles["input-suffix"], {
              [styles[`input-suffix-state--${state}`]]: state !== "default",
            })}
          >
            {suffix}
          </div>
        )}
      </div>
    );
  }
);

function showInputState(state: InputState, disabled = false) {
  return !disabled && state !== "default";
}

const Input = React.forwardRef<HTMLInputElement, InputProps>((props, ref) => {
  const {
    state = "default",
    className,
    style,
    elClassName,
    elStyle,
    ...inputProps
  } = props;

  const stateMetrics = stateMap[state] || stateMap["default"];

  return (
    <div
      className={classnames(styles["input-wrapper"], className)}
      style={style}
    >
      <InputComponent
        {...inputProps}
        ref={ref}
        className={classnames("bg-white h-12")}
        style={{
          borderRadius: "16px",
        }}
      ></InputComponent>
      {showInputState(state) && (
        <div className={styles["icon"]}>{stateMetrics.icon}</div>
      )}
    </div>
  );
});

export default Input;
