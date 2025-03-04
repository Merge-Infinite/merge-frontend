import classnames from "classnames";
import styles from "./index.module.scss";
import { Extendable } from "../../../../types";
import PlusPrimary from "../../../../assets/icons/plus-primary.svg";
import PlusSecondary from "../../../../assets/icons/plus-secondary.svg";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export type RectButtonProps = Extendable & {
  theme?: "primary" | "default";
  to?: string;
  onClick?: () => void;
  className?: string;
};

const RectButton = (props: RectButtonProps) => {
  const { theme = "default" } = props;
  return (
    <Button
      onClick={props.onClick}
      className={classnames(
        styles["rect-btn"],
        styles[`rect-btn--${theme}`],
        props.className
      )}
    >
      {theme === "primary" ? (
        <Image src={PlusPrimary} alt="plus-primary" width={32} height={32} />
      ) : (
        <Image
          src={PlusSecondary}
          alt="plus-secondary"
          width={32}
          height={32}
        />
      )}
      {props.children}
    </Button>
  );
};

export default RectButton;
