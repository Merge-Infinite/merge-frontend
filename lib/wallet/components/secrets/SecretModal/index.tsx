import { Button } from "@/components/ui/button";
import classNames from "classnames";
import { Extendable } from "../../../types";
import { Modal } from "../../modals";
import styles from "./index.module.scss";

export type SecretModalProps = Extendable & {
  trigger?: React.ReactNode;
  title?: string;
  onOpenChange?: () => void;
  defaultOpen?: boolean;
  onCopy?: () => void;
};

const SecretModal = (props: SecretModalProps) => {
  const { title = "Title", defaultOpen = false, ...restProps } = props;
  return (
    <Modal
      title={title}
      trigger={props.trigger}
      defaultOpen={defaultOpen}
      onOpenChange={props.onOpenChange}
      {...restProps}
    >
      <div
        className={classNames(
          styles["container"],
          "flex flex-col gap-2 w-full border border-white"
        )}
        style={{ backgroundColor: "#000" }}
      >
        <div className={classNames(styles["content"], "w-full ")}>
          {props.children}
        </div>
        <Button className={"mt-[16px]"} onClick={props.onCopy}>
          Copy
        </Button>
      </div>
    </Modal>
  );
};

export default SecretModal;
