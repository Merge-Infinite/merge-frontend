import classnames from "classnames";
import IconStepArrow from "../../../assets/icons/step-arrow.svg";
import { Icon } from "../../icons";
import Button, { ButtonProps } from "../index";
import styles from "./index.module.scss";

const StepButton = (props: ButtonProps) => {
  const { children, className, ...restProps } = props;
  return (
    <Button
      {...restProps}
      className={classnames(styles["step-button"], className)}
    >
      {children}
      <Icon icon={IconStepArrow} />
    </Button>
  );
};

export default StepButton;
